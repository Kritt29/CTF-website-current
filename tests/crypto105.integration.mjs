import '../scripts/sites-env.mjs';
import assert from 'node:assert/strict';
import { randomUUID, randomBytes, createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdtempSync, rmSync, rmdirSync, readdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import bcrypt from 'bcryptjs';
import { verifyCrypto105, crypto105Commitment } from '../lib/server/crypto105-check.ts';
// Platform test for CRYPTO-105: catalogue record, access control, availability, download, submission and progression.
// It never solves the puzzle; the generator, reference solver and artifact tests live with the private organizer material.
// CRYPTO105_EXPECT_UNAVAILABLE=1 checks fail-closed behaviour against a deliberately misconfigured server.
const base = process.env.TEST_BASE_URL || 'http://localhost:5173';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname), 'Run against local development only');
const unavailable = process.env.CRYPTO105_EXPECT_UNAVAILABLE === '1';
const flag = readFileSync('.dev.vars','utf8').match(/^CRYPTO105_FLAG="([^"]+)"/m)?.[1];
const stagedDir = process.env.CRYPTO105_EVIDENCE_DIR || (existsSync('.evidence.local.json') ? JSON.parse(readFileSync('.evidence.local.json','utf8')).CRYPTO105_EVIDENCE_DIR : null);
let checks = 0;
const check = (condition,label) => {assert.ok(condition,label);checks++;};
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const rotate = (text,k) => text.replace(/[A-Za-z]/g,c => {const b=c<='Z'?65:97;return String.fromCharCode((c.charCodeAt(0)-b+k)%26+b);});

// Fail-closed staging rules, independent of any running server (synthetic values only).
{
  const fake = 'DDC{' + 'synthetic_check_' + randomBytes(8).toString('hex') + '}', archive = randomBytes(64);
  const staged = {artifactVersion:'SC-ARTIFACT/1',archiveSha256:sha(archive),flagCommitment:crypto105Commitment(fake),archiveBase64:archive.toString('base64')};
  check(crypto105Commitment(fake)===sha('DDC|CRYPTO-105|flag|'+fake),'Commitment domain');
  check(verifyCrypto105(staged,fake)?.sha256===staged.archiveSha256,'Matching staged evidence is served');
  check(verifyCrypto105(null,fake)===null,'Missing evidence fails closed');
  check(verifyCrypto105(staged,undefined)===null&&verifyCrypto105(staged,'')===null,'Missing flag fails closed');
  check(['DDC{short}','DDC{has space in the flag here}','ddc{lowercase_prefix_abcdefgh}','DDC{'+'a'.repeat(92)+'}','DDC{REPLACE_WITH_PRIVATE_FLAG}'].every(f=>verifyCrypto105({...staged,flagCommitment:crypto105Commitment(f)},f)===null),'Invalid or placeholder flags fail closed');
  check(verifyCrypto105(staged,fake.replace('}','x}'))===null,'Artifact/flag mismatch fails closed');
  check(verifyCrypto105({...staged,archiveBase64:randomBytes(64).toString('base64')},fake)===null&&verifyCrypto105({...staged,archiveSha256:'00'},fake)===null,'Archive digest mismatch fails closed');
}

const key = 'shift-change-' + randomUUID(), password = randomBytes(24).toString('hex'), ids = [key, key + '-other', key + '-peer'];
const dir = mkdtempSync(join(tmpdir(),'ddc-c105-')), file = join(dir,'fixture.sql');
const q = v => "'" + String(v).replaceAll("'","''") + "'";
const wrangler = args => spawnSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--config','wrangler.local.json','--local',...args],{encoding:'utf8'});
function sql(value){writeFileSync(file,value,{mode:0o600});const r=wrangler(['--file',file]);assert.equal(r.status,0,'Fixture query failed');}
function query(command){const r=wrangler(['--json','--command',command]);assert.equal(r.status,0,'Query failed');return JSON.parse(r.stdout)[0].results;}
async function request(path,cookie='',method='GET',body){return fetch(base+path,{method,redirect:'manual',headers:{Origin:base,Cookie:cookie,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});}
async function data(path,cookie,method='GET',body){const r=await request(path,cookie,method,body);assert.equal(r.status,200,path);return r.json();}
const delay = () => new Promise(r => setTimeout(r, 2100));
const evidence = '/api/challenge-env/crypto-105/evidence';
const earlier = ['WEB-101','WEB-102','FORENSICS-103','CRYPTO-104'];
let browser;
try {
  // Catalogue record from migration 0009: active, reached through NEXT rather than as a starting challenge.
  const [record] = query("SELECT id,challenge_code AS code,category,active,starting FROM challenges WHERE id='CRYPTO-105'");
  check(record?.code==='CRYPTO-105'&&record.category==='CRYPTO','CRYPTO-105 catalogue record exists');
  check(record.active===1,'CRYPTO-105 is active');
  check(record.starting===0,'CRYPTO-105 is not a starting challenge');
  check(query("SELECT COUNT(*) AS n FROM challenges WHERE challenge_code='CRYPTO-105'")[0].n===1,'Challenge code is unique');

  const hash = await bcrypt.hash(password,12);
  // The main user has solved the four earlier challenges, so NEXT must reach CRYPTO-105 through normal progression.
  sql(ids.map(id=>`INSERT INTO users(id,username,email,password_hash,display_name,participant_id,role,created_at) VALUES(${[id,id,id+'@example.test',hash,'Shift Change QA',id,'participant'].map(q).join(',')},${Date.now()});`).join('')
    + `INSERT INTO participant_challenges(user_id,challenge_id,assigned_at,started_at,solved_at) VALUES${earlier.map((c,i)=>`(${q(key)},${q(c)},${10+20*i},${10+20*i},${20+20*i})`).join(',')};`
    + `INSERT INTO participant_challenges(user_id,challenge_id,assigned_at,started_at) VALUES(${q(key+'-peer')},'CRYPTO-105',90,90);`);
  check((await request(evidence)).status===401,'Anonymous evidence download blocked');
  check((await request('/challenges/CRYPTO-105')).headers.get('location')?.includes('/login'),'Anonymous challenge page redirected');
  async function login(id){const r=await request('/api/auth/login','','POST',{identifier:id,password});check(r.status===200,'Login succeeds');return r.headers.get('set-cookie').split(';')[0];}
  const cookie = await login(key), other = await login(key + '-other'), peer = await login(key + '-peer');
  check((await request(evidence,cookie)).status===403,'Evidence locked before assignment');
  const catalogue = await data('/api/challenges',cookie);
  const c105 = catalogue.challenges.find(c=>c.challengeCode==='CRYPTO-105');
  check(c105&&c105.category==='CRYPTO'&&c105.difficulty==='MEDIUM'&&c105.title==='Shift Change','Catalogue metadata');
  check(!flag||!JSON.stringify(catalogue).includes(flag),'Public metadata has no flag');
  const eligible = catalogue.challenges.filter(c=>!earlier.includes(c.challengeCode));
  const next = await data('/api/challenges/next',cookie,'POST');
  if (eligible.length === 1) check(next.assignedChallenge.id==='CRYPTO-105','NEXT assigns CRYPTO-105 as the remaining eligible challenge');
  else sql(`UPDATE participant_challenges SET challenge_id='CRYPTO-105' WHERE user_id=${q(key)} AND solved_at IS NULL;`);
  const repeat = await Promise.all(Array.from({length:5},()=>data('/api/challenges/next',cookie,'POST')));
  check(repeat.every(r=>r.assignedChallenge.id==='CRYPTO-105'),'Repeated NEXT keeps CRYPTO-105 current');
  check((await data('/api/dashboard',cookie)).assignedChallenge.challengeCode==='CRYPTO-105','Refresh preserves assignment');
  check((await request(evidence,other)).status===403,'Unassigned participant cannot download');
  check((await request('/challenges/CRYPTO-105',other)).status===404,'Unassigned participant cannot open challenge');

  if (unavailable) {
    const r = await request(evidence,cookie), body = await r.text();
    check(r.status===503&&body.includes('awaiting configuration'),'Misconfigured evidence returns generic 503');
    check(!/sha256|commitment|[A-Z]:[\\/]|evidence_dir|DDC\{/i.test(body),'503 body exposes no diagnostics');
    const sub = await request('/api/submissions',cookie,'POST',{challengeId:'CRYPTO-105',flag:flag??'DDC{synthetic_probe_abcdefghij}'});
    check(sub.status===503,'Submission is unavailable, not judged incorrect');
    check((await data('/api/dashboard',cookie)).solves===4,'Unavailable configuration never solves');
    console.log(JSON.stringify({mode:'unavailable',passed:checks}));
  } else {
  assert.ok(flag, 'Configure CRYPTO105_FLAG in the ignored .dev.vars first');
  assert.ok(stagedDir, 'Stage the private package (CRYPTO105_EVIDENCE_DIR or .evidence.local.json) first');
  const staged = readFileSync(join(stagedDir,'shift-change.zip'));
  const download = await request(evidence,cookie), h = download.headers;
  check(download.status===200,'Evidence download succeeds (status '+download.status+')');
  check(h.get('content-type')==='application/zip'&&h.get('content-disposition')==='attachment; filename="shift-change.zip"'&&h.get('cache-control')==='no-store, private'&&h.get('vary')?.includes('Cookie')&&h.get('x-content-type-options')==='nosniff','Download headers');
  const bytes = Buffer.from(await download.arrayBuffer());
  check(sha(bytes)===h.get('x-evidence-sha256')&&Buffer.compare(bytes,staged)===0,'Served bytes are the prebuilt immutable ZIP with matching SHA-256');
  const again = Buffer.from(await (await request(evidence,cookie)).arrayBuffer()), peerCopy = Buffer.from(await (await request(evidence,peer)).arrayBuffer());
  check(Buffer.compare(bytes,again)===0&&Buffer.compare(bytes,peerCopy)===0,'Identical archive across refreshes and users');
  // Simple inspection (strings, ROT13, any single letter rotation) never shows the flag or its body.
  const text = bytes.toString('latin1'), body = flag.slice(4,-1);
  check(Array.from({length:26},(_,k)=>k).every(k=>!text.includes(rotate(flag,k))&&!text.includes(rotate(body,k))),'Flag absent under every letter rotation');
  check(!text.includes(body.slice(0,12))&&!text.includes(body.slice(-12)),'No long plaintext flag fragment');

  const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'file:///C:/Users/rithv/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
  browser = await chromium.launch({channel:'msedge',headless:true});
  const page = await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true}), errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.context().addCookies([{name:'ddc_session',value:cookie.split('=')[1],url:base,httpOnly:true,sameSite:'Lax'}]);
  await page.goto(base+'/dashboard');await page.getByRole('button',{name:'CONTINUE CHALLENGE'}).click();
  await page.waitForURL('**/challenges/CRYPTO-105');
  await page.getByRole('heading',{name:'Shift Change'}).waitFor();
  const main = await page.locator('main').innerText();
  check(['CRYPTO-105','CRYPTO','MEDIUM','New crew, new offset.','shift-change.zip',bytes.length.toLocaleString('en-US')+' bytes',sha(bytes)].every(t=>main.includes(t)),'Challenge page content and evidence metadata');
  check(await page.locator('[data-participant-topbar]').isVisible(),'Persistent topbar');
  const [saved] = await Promise.all([page.waitForEvent('download'),page.getByRole('link',{name:'DOWNLOAD EVIDENCE →'}).click()]);
  check(saved.suggestedFilename()==='shift-change.zip'&&sha(readFileSync(await saved.path()))===sha(bytes),'Browser download filename and bytes');
  await page.getByRole('link',{name:'SUBMIT FLAG →'}).click();await page.waitForURL('**/submissions?challenge=CRYPTO-105');
  check(await page.getByLabel('Challenge ID',{exact:true}).inputValue()==='CRYPTO-105','Submit prefills CRYPTO-105');
  // Wrong answers: a synthetic flag, and the right flag under a wrong rotation.
  await page.getByLabel('Flag',{exact:true}).fill('DDC{' + 'synthetic_wrong_' + randomBytes(8).toString('hex') + '}');await page.getByRole('button',{name:'SUBMIT FLAG →'}).click();
  await page.getByText('Incorrect flag.',{exact:true}).waitFor();
  check((await data('/api/dashboard',cookie)).assignedChallenge.challengeCode==='CRYPTO-105','Wrong flag does not solve or advance');
  await delay();
  check(!(await data('/api/submissions',cookie,'POST',{challengeId:'CRYPTO-105',flag:rotate(flag,3)})).correct,'Mis-rotated flag rejected');
  await delay();
  await page.getByLabel('Flag',{exact:true}).fill('  '+flag+'  ');await page.getByRole('button',{name:'SUBMIT FLAG →'}).click();
  await page.getByText('Flag accepted.',{exact:true}).waitFor();
  let dashboard = await data('/api/dashboard',cookie);
  const done = dashboard.completedChallenges.find(c=>c.challengeCode==='CRYPTO-105');
  check(done&&typeof done.solvedAt==='number'&&dashboard.assignedChallenge===null&&dashboard.solves===5,'solvedAt recorded and solve count updated');
  check(dashboard.recentActivity.some(a=>a.type==='Challenge solved'&&a.challengeCode==='CRYPTO-105'),'Recent activity updated');
  await delay();
  const duplicate = await data('/api/submissions',cookie,'POST',{challengeId:'CRYPTO-105',flag});
  dashboard = await data('/api/dashboard',cookie);
  check(duplicate.alreadySolved&&dashboard.solves===5&&dashboard.completedChallenges.find(c=>c.challengeCode==='CRYPTO-105').solvedAt===done.solvedAt,'Duplicate correct submission is a no-op');
  const history = await data('/api/submissions',cookie);
  check(history.submissions.filter(s=>s.challengeId==='CRYPTO-105').map(s=>s.result).join()==='CORRECT,INCORRECT,INCORRECT','Attempts recorded once each');
  check(!JSON.stringify(history).includes(body),'History contains no flag');
  await page.goto(base+'/challenges/CRYPTO-105');await page.getByRole('heading',{name:'CHALLENGE COMPLETED ✓',exact:true}).waitFor();
  check(await page.getByRole('button',{name:'CONTINUE CHALLENGE'}).count()===0,'Completed page drops CONTINUE');
  const finals = await Promise.all(Array.from({length:4},()=>data('/api/challenges/next',cookie,'POST')));
  check(finals.every(f=>f.assignedChallenge?.challengeCode!=='CRYPTO-105'),'Solved CRYPTO-105 never reassigned');
  if (eligible.length === 1) {
    check(finals.every(f=>f.allChallengesCompleted&&f.assignedChallenge===null),'NEXT reports all challenges completed');
    await page.goto(base+'/dashboard');await page.getByText('ALL CHALLENGES COMPLETED',{exact:true}).waitFor();
    check(true,'Dashboard shows ALL CHALLENGES COMPLETED');
  }
  check((await request(evidence,cookie)).status===200,'Evidence stays downloadable after solve');
  function scan(path){for(const item of readdirSync(path,{withFileTypes:true})){const p=join(path,item.name);if(item.isDirectory())scan(p);else if(/\.(js|html|json|map|css)$/.test(p)){const t=readFileSync(p,'utf8');assert.ok(!t.includes(body),'Flag leaked in client build');assert.ok(!t.includes('crypto105Staged')&&!t.includes(staged.toString('base64').slice(0,64)),'Evidence module leaked into client build');}}}
  if (existsSync('dist/client')) {scan('dist/client');check(true,'Client build excludes flag and evidence module');}
  check(errors.length===0,'No browser runtime errors: '+errors.join(';'));
  console.log(JSON.stringify({passed:checks}));
  }
} finally {
  await browser?.close();
  sql(ids.map(id=>`DELETE FROM submissions WHERE user_id=${q(id)};DELETE FROM submission_limits WHERE user_id=${q(id)};DELETE FROM sessions WHERE user_id=${q(id)};DELETE FROM participant_challenges WHERE user_id=${q(id)};DELETE FROM users WHERE id=${q(id)};DELETE FROM auth_limits WHERE key=${q('account:'+createHash('sha256').update(id).digest('hex'))};`).join(''));
  rmSync(file,{force:true});rmdirSync(dir);
}
