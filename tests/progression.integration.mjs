import '../scripts/sites-env.mjs';
import assert from 'node:assert/strict';
import {randomUUID,randomBytes,createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdtempSync,rmSync,rmdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import bcrypt from 'bcryptjs';
const base=process.env.TEST_BASE_URL||'http://localhost:5173';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const key='progress-'+randomUUID(),password=randomBytes(24).toString('hex');
const dir=mkdtempSync(join(tmpdir(),'ddc-progress-')),file=join(dir,'fixture.sql');
const q=v=>"'"+String(v).replaceAll("'","''")+"'";
function sql(value,ok=true){writeFileSync(file,value);const r=spawnSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','wrangler.local.json','--file',file],{encoding:'utf8'});assert.equal(r.status===0,ok,'Database invariant');}
const vars=readFileSync('.dev.vars','utf8');
const flags=Object.fromEntries([['WEB-101','WEB101'],['WEB-102','WEB102'],['FORENSICS-103','FORENSICS103'],['CRYPTO-104','CRYPTO104']].map(([id,env])=>[id,vars.match(new RegExp('^'+env+'_FLAG="([^"]+)"','m'))?.[1]]));
let checks=0,browser;
const check=(x,m)=>{assert.ok(x,m);checks++;};
async function req(path,cookie='',method='GET',body,origin=base){return fetch(base+path,{method,redirect:'manual',headers:{Origin:origin,Cookie:cookie,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});}
async function data(path,cookie,method='GET',body){const r=await req(path,cookie,method,body);assert.equal(r.status,200);return r.json();}
const delay=()=>new Promise(r=>setTimeout(r,2100));
try{
 const hash=await bcrypt.hash(password,12);
 sql([key,key+'-random'].map(id=>`INSERT INTO users(id,username,email,password_hash,display_name,participant_id,role,created_at) VALUES(${[id,id,id+'@example.test',hash,'Progress QA',id,'participant'].map(q).join(',')},${Date.now()});`).join(''));
 async function login(id){const r=await req('/api/auth/login','','POST',{identifier:id,password});assert.equal(r.status,200);return r.headers.get('set-cookie').split(';')[0];}
 check((await req('/api/challenges/next','','POST')).status===401,'Next requires authentication');
 const cookie=await login(key),randomCookie=await login(key+'-random');
 check((await req('/api/challenges/next',cookie,'POST',undefined,'https://other.test')).status===403,'Next rejects cross-origin');
 const starts=await Promise.all(Array.from({length:8},()=>data('/api/challenges/start',randomCookie,'POST')));
 check(new Set(starts.map(s=>s.assignedChallenge.id)).size===1,'Random starting assignment is concurrency safe');
 const first=starts[0].assignedChallenge;
 check((await data('/api/dashboard',randomCookie)).assignedChallenge.id===first.id,'Refresh preserves starting assignment');
 // Deterministic fixture exercises the specifically requested WEB-101 -> WEB-102 path.
 sql(`INSERT INTO participant_challenges(user_id,challenge_id,assigned_at,started_at) VALUES(${q(key)},'WEB-101',100,100);`);
 let state=await data('/api/dashboard',cookie);
 check(state.assignedChallenge.challengeCode==='WEB-101','WEB-101 current');
 let wrong=await data('/api/submissions',cookie,'POST',{challengeId:'WEB-101',flag:'DDC{wrong}'});
 check(!wrong.correct&&(await data('/api/dashboard',cookie)).assignedChallenge.id==='WEB-101','Wrong submission never advances');
 const active=await Promise.all(Array.from({length:6},()=>data('/api/challenges/next',cookie,'POST')));
 check(active.every(a=>a.assignedChallenge.id==='WEB-101'),'Next returns existing unsolved challenge');
 await delay();
 check((await data('/api/submissions',cookie,'POST',{challengeId:'WEB-101',flag:flags['WEB-101']})).correct,'WEB-101 solve');
 state=await data('/api/dashboard',cookie);
 check(state.assignedChallenge===null&&state.solves===1&&state.completedChallenges[0].id==='WEB-101','Completed challenge no longer current');
 const solvedAt=state.completedChallenges[0].solvedAt;
 await delay();
 check((await data('/api/submissions',cookie,'POST',{challengeId:'WEB-101',flag:flags['WEB-101']})).alreadySolved,'Duplicate solve is no-op');
 check((await data('/api/dashboard',cookie)).assignedChallenge===null,'No automatic next assignment');
 const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'file:///C:/Users/rithv/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
 browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.context().addCookies([{name:'ddc_session',value:cookie.split('=')[1],url:base,httpOnly:true,sameSite:'Lax'}]);
 await page.goto(base+'/dashboard');
 await page.getByRole('button',{name:'NEXT CHALLENGE',exact:true}).waitFor();
 check(await page.getByRole('button',{name:'CONTINUE CHALLENGE'}).count()===0,'Dashboard removes Continue after solve');
 await page.goto(base+'/challenges');
 await page.locator('article').filter({hasText:'WEB-101'}).getByText('COMPLETED ✓',{exact:true}).waitFor();
 await page.locator('article').filter({hasText:'WEB-102'}).getByText('AVAILABLE · NOT ASSIGNED',{exact:true}).waitFor();
 check(true,'Catalogue shows completed and available');
 await page.getByRole('button',{name:'NEXT CHALLENGE',exact:true}).click();
 // NEXT picks randomly among eligible challenges (WEB-102, FORENSICS-103, CRYPTO-104, ...); every real one must be playable.
 await page.waitForURL(url=>/\/challenges\/(WEB-102|FORENSICS-103|CRYPTO-104)$/.test(url.pathname));
 const second=decodeURIComponent(new URL(page.url()).pathname.split('/').pop());if(process.env.PROGRESSION_TRACE)console.log('second:',second);
 if(second==='WEB-102'){check(await page.locator('iframe').count()===1,'Next button opens playable WEB-102');check((await req('/api/challenge-env/web-102/index',cookie)).status===200,'WEB-102 environment authorized');}
 else{await page.getByRole('link',{name:'DOWNLOAD EVIDENCE →'}).waitFor();check((await req('/api/challenge-env/'+second.toLowerCase()+'/evidence',cookie)).status===200,'Next button opens playable '+second);}
 const nexts=await Promise.all(Array.from({length:10},()=>data('/api/challenges/next',cookie,'POST')));
 check(nexts.every(n=>n.assignedChallenge.id===second),'Repeated next requests preserve one current assignment');
 state=await data('/api/dashboard',cookie);
 check(state.assignedChallenge.id===second&&state.solves===1&&state.completedChallenges[0].solvedAt===solvedAt,'Dashboard reflects next and preserves solve');
 await page.goto(base+'/challenges');
 await page.locator('article').filter({hasText:second}).getByText('CURRENT',{exact:true}).waitFor();
 check(!(await page.locator('body').innerText()).includes('additional challenge access is not enabled'),'Temporary limitation removed');
 await page.goto(base+'/challenges/WEB-101');await page.getByRole('heading',{name:'CHALLENGE COMPLETED ✓',exact:true}).waitFor();
 check(await page.getByRole('button',{name:'CONTINUE CHALLENGE',exact:true}).count()===1&&await page.getByRole('button',{name:'NEXT CHALLENGE',exact:true}).count()===0,'Completed page offers the current challenge, not Next');
 sql(`INSERT INTO participant_challenges(user_id,challenge_id,assigned_at,started_at) VALUES(${q(key)},'WEB-101',1,1);`,false);
 check(true,'Duplicate participant/challenge rejected by database');
 sql(`INSERT INTO challenges(id,challenge_code,title,category,difficulty,description,active,starting) VALUES(${q(key)},${q(key)},'Future fixture','FORENSICS','EASY','Fixture',1,0);`);
 sql(`INSERT INTO participant_challenges(user_id,challenge_id,assigned_at,started_at) VALUES(${q(key)},${q(key)},1,1);`,false);
 check(true,'Second simultaneous unfinished assignment rejected');
 await delay();
 check((await data('/api/submissions',cookie,'POST',{challengeId:second,flag:flags[second]})).correct,second+' solve');
 // Drain the remaining catalogue generically: real challenges are solved with their configured flag,
 // the isolated non-starting fixture (no validator) is completed directly.
 const seen=[];let correctSolves=2;
 for(let next=await data('/api/challenges/next',cookie,'POST');next.assignedChallenge;next=await data('/api/challenges/next',cookie,'POST')){
  const id=next.assignedChallenge.id;check(!seen.includes(id)&&!['WEB-101',second].includes(id),'Next assigns only unsolved challenges ('+id+')');seen.push(id);
  if(id===key)sql(`UPDATE participant_challenges SET solved_at=123 WHERE user_id=${q(key)} AND challenge_id=${q(key)};`);
  else{assert.ok(flags[id],'Configure the '+id+' flag in .dev.vars');await delay();check((await data('/api/submissions',cookie,'POST',{challengeId:id,flag:flags[id]})).correct,id+' solve');correctSolves++;}
 }
 check(seen.includes(key),'Generic next selection supports non-starting future category');
 const finals=await Promise.all(Array.from({length:5},()=>data('/api/challenges/next',cookie,'POST')));
 check(finals.every(x=>x.allChallengesCompleted&&x.assignedChallenge===null),'All completed is a clean idempotent result');
 state=await data('/api/dashboard',cookie);
 check(state.solves===2+seen.length&&state.allChallengesCompleted,'All solves counted across assignment history');
 check(new Set(state.completedChallenges.map(c=>c.id)).size===state.completedChallenges.length&&state.completedChallenges.filter(c=>c.id==='WEB-101').length===1,'Solved challenges never reassigned');
 const history=await data('/api/submissions',cookie);
 check(history.submissions.length===correctSolves+1&&history.submissions.filter(x=>x.result==='CORRECT').length===correctSolves,'Submission history preserved without duplicate solve');
 await page.goto(base+'/dashboard');await page.getByText('ALL CHALLENGES COMPLETED',{exact:true}).waitFor();
 await page.reload();await page.getByText('ALL CHALLENGES COMPLETED',{exact:true}).waitFor();
 check(true,'Final UI and authentication survive refresh');
 check(errors.length===0,'No browser runtime errors: '+errors.join(';'));
 console.log(JSON.stringify({passed:checks}));
}finally{
 await browser?.close();
 sql([key,key+'-random'].map(id=>`DELETE FROM submissions WHERE user_id=${q(id)};DELETE FROM submission_limits WHERE user_id=${q(id)};DELETE FROM web101_progress WHERE user_id=${q(id)};DELETE FROM web102_progress WHERE user_id=${q(id)};DELETE FROM sessions WHERE user_id=${q(id)};DELETE FROM participant_challenges WHERE user_id=${q(id)};DELETE FROM users WHERE id=${q(id)};DELETE FROM auth_limits WHERE key=${q('account:'+createHash('sha256').update(id).digest('hex'))};`).join('')+`DELETE FROM challenges WHERE id=${q(key)};`);
 rmSync(file,{force:true});rmdirSync(dir);
}

