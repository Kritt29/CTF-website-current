// npm run setup: migrate the local D1 database and interactively create one local participant.
// Local development only. The password is read from the terminal (never argv), hidden while
// typed, and only its bcrypt hash is stored, via the same path as participant:create:local.
import { createInterface } from 'node:readline';
import { randomBytes } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { USERNAME_PATTERN, quote, queryLocal, validatePassword, migrateLocalDatabase, createLocalParticipant } from './local-participants.mjs';

class Cancelled extends Error {}
const interactive=Boolean(process.stdin.isTTY);

// Piped (non-TTY) input is read line by line; nothing is echoed back.
let pipedLines;
async function readPipedLine(prompt){
 process.stdout.write(prompt+'\n');
 pipedLines??=createInterface({input:process.stdin,terminal:false})[Symbol.asyncIterator]();
 const {value,done}=await pipedLines.next();
 if(done)throw new Cancelled();
 return value;
}

function askVisible(prompt){
 if(!interactive)return readPipedLine(prompt);
 return new Promise((resolve,reject)=>{
  const rl=createInterface({input:process.stdin,output:process.stdout});
  let answered=false;
  rl.on('SIGINT',()=>rl.close());
  rl.on('close',()=>{if(!answered){process.stdout.write('\n');reject(new Cancelled());}});
  rl.question(prompt,answer=>{answered=true;rl.close();resolve(answer);});
 });
}

export function askHidden(prompt,input=process.stdin,output=process.stdout){
 if(input===process.stdin&&!interactive)return readPipedLine(prompt);
 return new Promise((resolve,reject)=>{
  let value='';
  const finish=error=>{input.off('data',onData);input.setRawMode(false);input.pause();output.write('\n');if(error)reject(error);else resolve(value);};
  const onData=chunk=>{
   for(const ch of String(chunk)){
    if(ch==='\r'||ch==='\n')return finish();
    if(ch==='\u0003')return finish(new Cancelled());
    if(ch==='\u0004'){if(!value)return finish(new Cancelled());continue;}
    if(ch==='\u001b')return; // ignore the rest of an escape sequence (arrow keys etc.)
    if(ch==='\u007f'||ch==='\b'){value=Array.from(value).slice(0,-1).join('');continue;}
    if(ch>=' ')value+=ch;
   }
  };
  output.write(prompt);
  input.setRawMode(true);input.setEncoding('utf8');input.on('data',onData);input.resume();
 });
}

// Interactive prompts re-ask on invalid input; piped input fails fast.
async function ask(read,validate){
 for(;;){
  const value=await read();
  const problem=validate(value);
  if(!problem)return value;
  if(!interactive)throw new Error(problem);
  console.log(problem);
 }
}

function reportDuplicate(username){
 console.log(`\nA participant with username "${username}" already exists.\n\nChoose another username or reset the local database.`);
 process.exitCode=1;
}

async function main(){
 console.log('CryptX local setup (local development database only)\n');
 console.log('Applying local database migrations...');
 migrateLocalDatabase({quiet:true});

 console.log('\nCreate a local participant.');
 const username=(await ask(async()=>(await askVisible('Username: ')).trim(),
  v=>USERNAME_PATTERN.test(v)?null:'Username must be 3-64 characters: letters, numbers, ".", "_" or "-".')).toLowerCase();
 const email=`${username}@local.ddc.invalid`;
 if(queryLocal(`SELECT username FROM users WHERE username = ${quote(username)} OR email = ${quote(email)} LIMIT 1;`).length)return reportDuplicate(username);
 const displayName=(await askVisible(`Display name (optional, default "${username}"): `)).trim()||username;

 let password;
 for(;;){
  password=await ask(()=>askHidden('Password: '),v=>{try{validatePassword(v);return null;}catch(error){return error.message+'.';}});
  if(await askHidden('Confirm password: ')===password)break;
  if(!interactive)throw new Error('Passwords do not match.');
  console.log('Passwords do not match. Try again.');
 }

 try {
  await createLocalParticipant({username,email,password,displayName,participantId:`LOCAL-${randomBytes(5).toString('hex').toUpperCase()}`},{quiet:true});
 } catch(error) {
  if(/UNIQUE constraint failed/.test(error.output??''))return reportDuplicate(username);
  throw error;
 }

 console.log(`\n✓ Local database ready\n✓ Participant created\n\nUsername: ${username}\n\nRun:\nnpm run dev\n\nThen login at:\nhttp://localhost:5173/login`);
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try {await main();}
 catch(error){
  if(error instanceof Cancelled){console.log('\nSetup cancelled. No participant was created.');process.exitCode=130;}
  else{console.error('\nSetup failed: '+error.message);if(error.output)console.error(error.output.trim());process.exitCode=1;}
 } finally {pipedLines?.return?.();}
}
