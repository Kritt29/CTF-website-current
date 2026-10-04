import { readFileSync } from 'node:fs';
import { quote, migrateLocalDatabase, executeLocalSql, createLocalParticipant } from './local-participants.mjs';
const command=process.argv[2];
if(command==='migrate') {migrateLocalDatabase();}
else {
 if(!['create-user','add-challenge'].includes(command))throw new Error('Use migrate, create-user, or add-challenge. JSON input is read from stdin; only the local database is modified.');
 const data=JSON.parse(readFileSync(0,'utf8'));
 if(command==='create-user') {
  await createLocalParticipant(data);
 } else {
  for(const key of ['id','challengeCode','title','category','difficulty','description'])if(typeof data[key]!=='string'||!data[key].trim())throw new Error('Missing '+key);
  if(!/^[a-z0-9-]+$/.test(data.id)||!['WEB','CRYPTO','PWN','REVERSE','FORENSICS','OSINT'].includes(data.category))throw new Error('Invalid challenge id/category');
  executeLocalSql(`INSERT INTO challenges(id,challenge_code,title,category,difficulty,description,active,starting) VALUES(${['id','challengeCode','title','category','difficulty','description'].map(k=>quote(data[k])).join(',')},${data.active===true?1:0},${data.starting===true?1:0});`);
 }
}
