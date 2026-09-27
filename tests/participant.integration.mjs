import '../scripts/sites-env.mjs';
import assert from 'node:assert/strict';
import {randomUUID,randomBytes,createHash} from 'node:crypto';
import {writeFileSync,mkdtempSync,rmSync,rmdirSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import bcrypt from 'bcryptjs';
const base=process.env.TEST_BASE_URL||'http://localhost:5173';
const key='qa-'+randomUUID(), password=randomBytes(24).toString('hex'), userId=key;
const dir=mkdtempSync(join(tmpdir(),'ddc-qa-')),sqlFile=join(dir,'fixture.sql');
const q=s=>"'"+s.replaceAll("'","''")+"'";
function sql(text){writeFileSync(sqlFile,text);const r=spawnSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--config','wrangler.local.json','--local','--file',sqlFile],{encoding:'utf8'});if(r.status)throw new Error('Fixture database operation failed: '+r.stderr);}
async function request(path,{cookie='',method='GET',body,origin=base}={}){return fetch(base+path,{method,redirect:'manual',headers:{Origin:origin,...(cookie?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});}
let browser;let tested=0;const check=(value,message)=>{assert.ok(value,message);tested++;};
try{
 const hash=await bcrypt.hash(password,12);
 sql(`INSERT INTO users(id,username,email,password_hash,display_name,participant_id,role,created_at) VALUES(${[key,key,key+'@example.test',hash,'TEST PARTICIPANT','QA-'+key.slice(-6),'participant'].map(q).join(',')},${Date.now()});`+[0,1].map(i=>`INSERT INTO challenges(id,challenge_code,title,category,difficulty,description,active,starting) VALUES(${q(key+'-'+i)},${q('QA-'+i+'-'+key)},'Verification challenge','${i?'CRYPTO':'WEB'}','EASY','Temporary verification fixture. Removed after testing.',1,1);`).join(''));
 check((await request('/api/dashboard')).status===401,'Dashboard API protected');
 for(const path of ['/dashboard','/challenges','/challenges/'+key+'-0','/submissions','/leaderboard','/rules']){const r=await request(path);check(r.status>=300&&r.status<400&&r.headers.get('location')?.includes('/login'),path+' protected');}
 const invalid=await request('/api/auth/login',{method:'POST',body:{identifier:key,password:'wrong-password'}});check(invalid.status===401,'Invalid login fails');
 const unknown=await request('/api/auth/login',{method:'POST',body:{identifier:key+'unknown',password}});check(unknown.status===401&&JSON.stringify(await unknown.json())===JSON.stringify(await invalid.json()),'Generic credential errors');
 check((await request('/api/auth/login',{method:'POST',origin:'https://invalid.example',body:{identifier:key,password}})).status===403,'Cross-origin mutation rejected');
 const login=await request('/api/auth/login',{method:'POST',body:{identifier:key,password}});check(login.status===200,'Valid login works');const setCookie=login.headers.get('set-cookie');check(setCookie?.includes('HttpOnly')&&setCookie.includes('SameSite=Lax'),'Cookie flags');const cookie=setCookie.split(';')[0];const account=await login.json();check(!JSON.stringify(account).includes('passwordHash')&&!JSON.stringify(account).includes(hash),'No password hash leak');
 check((await request('/api/auth/me',{cookie})).status===200,'Session restores');
 const dash=await (await request('/api/dashboard',{cookie})).json();check(dash.participant.id===key&&dash.score===0&&dash.rank===null&&dash.assignedChallenge===null&&dash.recentActivity.length===0,'Real initial dashboard data');
 const starts=await Promise.all(Array.from({length:6},()=>request('/api/challenges/start',{method:'POST',cookie}).then(async r=>{assert.equal(r.status,200);return r.json();})));check(new Set(starts.map(s=>s.assignedChallenge.id)).size===1,'Concurrent start returns one assignment');const assigned=starts[0].assignedChallenge;
 const after=await (await request('/api/dashboard',{cookie})).json();check(after.assignedChallenge.id===assigned.id&&after.assignedChallenge.startedAt===assigned.startedAt&&after.participant.startedAt===assigned.startedAt,'Assignment and start time persist');
 check((await request('/login',{cookie})).headers.get('location')?.includes('/dashboard'),'Authenticated login redirects');
 check((await request('/api/auth/logout',{cookie,method:'POST'})).status===200,'Logout succeeds');check((await request('/api/auth/me',{cookie})).status===401,'Old session invalidated');
 const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'file:///C:/Users/rithv/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
 browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1672,height:941}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/login');await page.locator('input[name="username"]').fill(key);await page.locator('input[name="password"]').fill(password);await page.locator('button[type="submit"]').click();await page.waitForURL('**/dashboard');await page.getByRole('heading',{name:'TEST PARTICIPANT',exact:true}).waitFor();await page.getByText('ASSIGNMENT SAVED').waitFor({state:'attached'});
 await page.reload();await page.getByRole('heading',{name:'TEST PARTICIPANT',exact:true}).waitFor();check(page.url().endsWith('/dashboard'),'Refresh retains authentication');
 mkdirSync('outputs',{recursive:true});await page.screenshot({path:'outputs/participant-desktop.png',fullPage:true});
 await page.evaluate(()=>{window.__topbar=document.querySelector('[data-participant-topbar]');});
 for(const label of ['Challenges','Submissions','Leaderboard','Rules','Dashboard']){await page.getByRole('navigation',{name:'Participant navigation'}).getByRole('link',{name:label,exact:true}).click();await page.waitForURL('**/'+label.toLowerCase());check(await page.evaluate(()=>window.__topbar===document.querySelector('[data-participant-topbar]')),'Topbar persists on '+label);}
 await page.getByRole('button',{name:'CONTINUE CHALLENGE'}).click();await page.waitForURL('**/challenges/'+assigned.id);check(await page.evaluate(()=>window.__topbar===document.querySelector('[data-participant-topbar]')),'Topbar persists inside challenge');
 await page.getByRole('navigation',{name:'Participant navigation'}).getByRole('link',{name:'Dashboard',exact:true}).click();await page.waitForURL('**/dashboard');await page.getByRole('link',{name:'CRYPTO',exact:true}).click();await page.waitForURL('**/challenges?category=CRYPTO');check(await page.getByRole('link',{name:'CRYPTO',exact:true}).getAttribute('aria-current')==='page','Category filter navigation');
 await page.goto(base+'/dashboard');await page.setViewportSize({width:390,height:844});await page.getByText('ASSIGNMENT SAVED').waitFor({state:'attached'});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile has no horizontal overflow');await page.screenshot({path:'outputs/participant-mobile.png',fullPage:true});
 await page.locator('.arena-profile summary').click();await page.getByRole('button',{name:'Log out',exact:true}).click();await page.waitForURL('**/login');await page.goto(base+'/dashboard');await page.waitForURL('**/login');check(true,'Browser logout and route guard');
 await page.setViewportSize({width:1672,height:941});await page.goto(base+'/');await page.locator('#challenge-vectors').waitFor({state:'attached'});check(await page.locator('#event-highlights').count()===1,'Public Pages 01–03 still render');check(await page.locator('a[href="https://unstop.com/hackathons/cryptx-chaitanya-bharathi-institute-of-technology-cbit-hyderabad-1761452"]').count()>0,'Registration unchanged');
 check(errors.length===0,'No browser runtime errors: '+errors.join('; '));console.log(JSON.stringify({passed:tested,desktop:'outputs/participant-desktop.png',mobile:'outputs/participant-mobile.png'}));
}finally{await browser?.close();sql(`DELETE FROM auth_limits WHERE key IN (${q('account:'+createHash('sha256').update(key).digest('hex'))},${q('account:'+createHash('sha256').update(key+'unknown').digest('hex'))});DELETE FROM sessions WHERE user_id=${q(userId)};DELETE FROM participant_challenges WHERE user_id=${q(userId)};DELETE FROM users WHERE id=${q(userId)};DELETE FROM challenges WHERE id IN (${q(key+'-0')},${q(key+'-1')});`);rmSync(sqlFile,{force:true});rmdirSync(dir);}




