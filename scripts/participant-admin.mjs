import './sites-env.mjs';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
const command=process.argv[2];
const run=(args)=>{const r=spawnSync(process.execPath,['node_modules/wrangler/bin/wrangler.js',...args,'--config','wrangler.local.json','--local'],{stdio:'inherit'});if(r.status!==0)throw new Error('Local database command failed');};
if(command==='migrate') {run(['d1','migrations','apply','DB']);}
else {
 if(!['create-user','add-challenge'].includes(command))throw new Error('Use migrate, create-user, or add-challenge. JSON input is read from stdin; only the local database is modified.');
 const data=JSON.parse(readFileSync(0,'utf8'));
 const quote=v=>"'"+String(v).replaceAll("'","''")+"'";
 let sql;
 if(command==='create-user') {
  for(const key of ['username','email','password','displayName','participantId'])if(typeof data[key]!=='string'||!data[key].trim())throw new Error('Missing '+key);
  if(!/^[a-zA-Z0-9_.-]{3,64}$/.test(data.username)||data.email.length>254||!data.email.includes('@'))throw new Error('Invalid username or email');
  if(data.password.length<12||bcrypt.truncates(data.password))throw new Error('Password must contain at least 12 characters and at most 72 UTF-8 bytes');
  const hash=await bcrypt.hash(data.password,12);
  sql=`INSERT INTO users(id,username,email,password_hash,display_name,participant_id,role,created_at) VALUES(${[randomUUID(),data.username.toLowerCase(),data.email.toLowerCase(),hash,data.displayName,data.participantId,'participant'].map(quote).join(',')},${Date.now()});`;
 } else {
  for(const key of ['id','challengeCode','title','category','difficulty','description'])if(typeof data[key]!=='string'||!data[key].trim())throw new Error('Missing '+key);
  if(!/^[a-z0-9-]+$/.test(data.id)||!['WEB','CRYPTO','PWN','REVERSE','FORENSICS','OSINT'].includes(data.category))throw new Error('Invalid challenge id/category');
  sql=`INSERT INTO challenges(id,challenge_code,title,category,difficulty,description,active,starting) VALUES(${['id','challengeCode','title','category','difficulty','description'].map(k=>quote(data[k])).join(',')},${data.active===true?1:0},${data.starting===true?1:0});`;
 }
 const dir=mkdtempSync(join(tmpdir(),'ddc-provision-'));const file=join(dir,'record.sql');
 try {writeFileSync(file,sql,{mode:0o600});run(['d1','execute','DB','--file',file]);}finally{rmSync(file);rmdirSync(dir);}
}

