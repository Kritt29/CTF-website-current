import '../scripts/sites-env.mjs';
import assert from 'node:assert/strict';
import {randomUUID,randomBytes,createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdtempSync,rmSync,rmdirSync,mkdirSync,readdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import bcrypt from 'bcryptjs';
const base=process.env.TEST_BASE_URL||'http://localhost:5173';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname),'Local test only');
const flag=readFileSync('.dev.vars','utf8').match(/^WEB101_FLAG="([^"]+)"/m)?.[1];assert.ok(flag,'Local flag required');
const key='submit-qa-'+randomUUID(),password=randomBytes(24).toString('hex');
const directory=mkdtempSync(join(tmpdir(),'ddc-submit-')),file=join(directory,'fixture.sql');
const q=v=>"'"+String(v).replaceAll("'","''")+"'";
function sql(value){writeFileSync(file,value,{mode:0o600});const result=spawnSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','wrangler.local.json','--file',file],{encoding:'utf8'});assert.equal(result.status,0,'Fixture query failed');}
async function request(path,cookie='',method='GET',body){return fetch(base+path,{method,redirect:'manual',headers:{Origin:base,Cookie:cookie,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});}
const wait=()=>new Promise(resolve=>setTimeout(resolve,2100));
let browser,checks=0;const check=(value,label)=>{assert.ok(value,label);checks++;};
async function submit(cookie,submittedFlag,challengeId='WEB-101'){const response=await request('/api/submissions',cookie,'POST',{challengeId,flag:submittedFlag});const body=await response.json();check(!JSON.stringify(body).includes(flag),'Response does not leak flag');return {response,body};}
try{
 const hash=await bcrypt.hash(password,12);
 sql([key,key+'-other'].map(id=>`INSERT INTO users(id,username,email,password_hash,display_name,participant_id,role,created_at) VALUES(${[id,id,id+'@example.test',hash,'Submission QA',id,'participant'].map(q).join(',')},${Date.now()});`).join('')+`INSERT INTO participant_challenges(user_id,challenge_id,assigned_at,started_at) SELECT ${q(key)},id,${Date.now()},${Date.now()} FROM challenges WHERE challenge_code='WEB-101';`);
 check((await request('/api/submissions','','POST',{challengeId:'WEB-101',flag:'DDC{wrong}'})).status===401,'Anonymous submission rejected');
 check((await request('/api/submissions')).status===401,'Anonymous history rejected');
 async function login(identifier){const response=await request('/api/auth/login','','POST',{identifier,password});assert.equal(response.status,200);return response.headers.get('set-cookie').split(';')[0];}
 const cookie=await login(key),other=await login(key+'-other');
 check((await submit(other,flag)).response.status===403,'Unassigned user rejected');
 const invalid=await submit(cookie,'DDC{wrong}','NONEXISTENT');check(invalid.response.status===400&&invalid.body.message==='Invalid challenge ID.','Invalid challenge response');
 await wait();
 const wrong=await submit(cookie,'DDC{wrong}');check(wrong.response.status===200&&wrong.body.correct===false,'Wrong flag rejected');
 const limited=await submit(cookie,flag);check(limited.response.status===429&&limited.response.headers.get('retry-after')==='2','Rate limit enforced');
 let dashboard=await (await request('/api/dashboard',cookie)).json();check(dashboard.solves===0&&dashboard.assignedChallenge.solvedAt===null,'Wrong attempt leaves solve unset');
 await wait();
 const results=await Promise.all(Array.from({length:5},()=>submit(cookie,flag)));
 check(results.filter(r=>r.response.status===200&&r.body.correct).length===1&&results.filter(r=>r.response.status===429).length===4,'Concurrent requests admit one correct submission');
 dashboard=await (await request('/api/dashboard',cookie)).json();const solvedAt=dashboard.completedChallenges[0].solvedAt;
 check(typeof solvedAt==='number'&&dashboard.solves===1,'Solve persists in dashboard');
 check(dashboard.recentActivity.some(a=>a.type==='Challenge solved'&&a.challengeCode==='WEB-101'),'Dashboard solved activity');
 check(dashboard.score===0&&dashboard.rank===null,'Scoring remains unchanged');
 await wait();
 const repeat=await submit(cookie,flag);check(repeat.body.correct&&repeat.body.alreadySolved&&repeat.body.message==='Challenge already solved.','Duplicate is idempotent');
 const again=await (await request('/api/dashboard',cookie)).json();check(again.assignedChallenge===null&&again.completedChallenges[0].solvedAt===solvedAt&&again.solves===1,'Duplicate preserves original solve');
 const history=await (await request('/api/submissions',cookie)).json();check(history.submissions.length===2&&history.submissions[0].result==='CORRECT'&&history.submissions[1].result==='INCORRECT','Accepted attempts recorded; repeat solve no-op');
 check(!JSON.stringify(history).includes(flag),'History contains no flag');
 const privateHistory=await (await request('/api/submissions',other)).json();check(privateHistory.submissions.length===0,'Other user cannot see attempts');
 const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'file:///C:/Users/rithv/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
 browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.context().addCookies([{name:'ddc_session',value:cookie.split('=')[1],url:base,httpOnly:true,sameSite:'Lax'}]);
 await page.goto(base+'/challenges/WEB-101');await page.getByRole('heading',{name:'CHALLENGE COMPLETED ✓',exact:true}).waitFor();
 await page.evaluate(()=>window.__header=document.querySelector('[data-participant-topbar]'));
 await page.getByRole('navigation',{name:'Participant navigation'}).getByRole('link',{name:'Submissions',exact:true}).click();await page.waitForURL('**/submissions');
 await page.getByLabel('Challenge ID',{exact:true}).fill('WEB-101');
 check(await page.getByLabel('Challenge ID',{exact:true}).inputValue()==='WEB-101','Query parameter prefill');
 check(await page.getByLabel('Flag',{exact:true}).inputValue()==='','No automatic flag submission');
 check(await page.evaluate(()=>window.__header===document.querySelector('[data-participant-topbar]')),'Topbar preserved from challenge');
 await page.getByText('INCORRECT',{exact:true}).waitFor();
 await wait();await page.getByLabel('Flag',{exact:true}).fill(flag);await page.getByRole('button',{name:'SUBMIT FLAG →',exact:true}).click();await page.getByText('Challenge already solved.',{exact:true}).waitFor();
 check(await page.getByLabel('Flag',{exact:true}).inputValue()==='','Flag cleared after response');
 mkdirSync('outputs',{recursive:true});await page.screenshot({path:'outputs/submissions-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile no overflow');await page.screenshot({path:'outputs/submissions-mobile.png',fullPage:true});
 await page.getByRole('navigation',{name:'Participant navigation'}).getByRole('link',{name:'Dashboard',exact:true}).click();await page.waitForURL('**/dashboard');await page.locator('.arena-activity li').filter({hasText:'Challenge solved'}).waitFor();
 check(await page.evaluate(()=>window.__header===document.querySelector('[data-participant-topbar]')),'Topbar persists back to updated dashboard');
 function scan(directory){for(const entry of readdirSync(directory,{withFileTypes:true})){const path=join(directory,entry.name);if(entry.isDirectory())scan(path);else if(/\.(js|json|html|map)$/.test(path))assert.ok(!readFileSync(path,'utf8').includes(flag),'Flag in client build');}}
 scan('dist/client');check(true,'Client bundle excludes real flag');check(errors.length===0,'No browser runtime errors');console.log(JSON.stringify({passed:checks}));
}finally{
 await browser?.close();sql([key,key+'-other'].map(id=>`DELETE FROM submissions WHERE user_id=${q(id)};DELETE FROM submission_limits WHERE user_id=${q(id)};DELETE FROM web101_progress WHERE user_id=${q(id)};DELETE FROM sessions WHERE user_id=${q(id)};DELETE FROM participant_challenges WHERE user_id=${q(id)};DELETE FROM users WHERE id=${q(id)};DELETE FROM auth_limits WHERE key=${q('account:'+createHash('sha256').update(id).digest('hex'))};`).join(''));rmSync(file,{force:true});rmdirSync(directory);
}
