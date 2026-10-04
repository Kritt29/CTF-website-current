// Shared local-only D1 helpers for participant-admin.mjs and setup-local.mjs.
// Every command targets wrangler.local.json with --local; nothing here can reach remote D1.
import './sites-env.mjs';
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdtempSync, rmSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';

export const USERNAME_PATTERN=/^[a-zA-Z0-9_.-]{3,64}$/;
export const PASSWORD_RULE='Password must contain at least 12 characters and at most 72 UTF-8 bytes';
export const quote=v=>"'"+String(v).replaceAll("'","''")+"'";

// quiet captures Wrangler's output (shown only on failure) instead of streaming it.
export function runLocalWrangler(args,{quiet=false}={}){
 const r=spawnSync(process.execPath,['node_modules/wrangler/bin/wrangler.js',...args,'--config','wrangler.local.json','--local'],quiet?{encoding:'utf8',stdio:['ignore','pipe','pipe']}:{stdio:'inherit'});
 if(r.status!==0){const error=new Error('Local database command failed');error.output=quiet?`${r.stdout??''}${r.stderr??''}`:'';throw error;}
 return r.stdout;
}
export const migrateLocalDatabase=(options)=>runLocalWrangler(['d1','migrations','apply','DB'],options);

export function executeLocalSql(sql,options){
 const dir=mkdtempSync(join(tmpdir(),'ddc-provision-'));const file=join(dir,'record.sql');
 try {writeFileSync(file,sql,{mode:0o600});return runLocalWrangler(['d1','execute','DB','--file',file],options);}finally{rmSync(file);rmdirSync(dir);}
}

export function queryLocal(sql){
 const [result]=JSON.parse(runLocalWrangler(['d1','execute','DB','--json','--command',sql],{quiet:true}));
 return result?.results??[];
}

export function validatePassword(password){
 if(password.length<12||bcrypt.truncates(password))throw new Error(PASSWORD_RULE);
}

export function validateParticipant(data){
 for(const key of ['username','email','password','displayName','participantId'])if(typeof data[key]!=='string'||!data[key].trim())throw new Error('Missing '+key);
 if(!USERNAME_PATTERN.test(data.username)||data.email.length>254||!data.email.includes('@'))throw new Error('Invalid username or email');
 validatePassword(data.password);
}

export async function createLocalParticipant(data,options){
 validateParticipant(data);
 const hash=await bcrypt.hash(data.password,12);
 executeLocalSql(`INSERT INTO users(id,username,email,password_hash,display_name,participant_id,role,created_at) VALUES(${[randomUUID(),data.username.toLowerCase(),data.email.toLowerCase(),hash,data.displayName,data.participantId,'participant'].map(quote).join(',')},${Date.now()});`,options);
}
