import '../scripts/sites-env.mjs';
import assert from 'node:assert/strict';
import { randomUUID, randomBytes, createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdtempSync, rmSync, rmdirSync, readdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import bcrypt from 'bcryptjs';
import { verifyCrypto104, crypto104Commitment } from '../lib/server/crypto104-check.ts';
// Platform test for CRYPTO-104: access control, availability, download, submission and progression.
// It never inspects the evidence contents or solves the puzzle; that lives with the private generator.
// CRYPTO104_EXPECT_UNAVAILABLE=1 checks fail-closed behaviour against a deliberately misconfigured server.
const base = process.env.TEST_BASE_URL || 'http://localhost:5173';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname), 'Run against local development only');
const unavailable = process.env.CRYPTO104_EXPECT_UNAVAILABLE === '1';
const flag = readFileSync('.dev.vars','utf8').match(/^CRYPTO104_FLAG="([^"]+)"/m)?.[1];
const stagedDir = process.env.CRYPTO104_EVIDENCE_DIR || (existsSync('.evidence.local.json') ? JSON.parse(readFileSync('.evidence.local.json','utf8')).CRYPTO104_EVIDENCE_DIR : null) || (existsSync('evidence/crypto-104') ? 'evidence/crypto-104' : null);
let checks = 0;
const check = (condition,label) => {assert.ok(condition,label);checks++;};
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

// Fail-closed staging rules, independent of any running server (synthetic values only).
{
  const fake = 'DDC{' + 'synthetic_check_' + randomBytes(8).toString('hex') + '}', archive = randomBytes(64);
  const staged = {artifactVersion:'DD64-ARTIFACT/1',archiveSha256:sha(archive),flagCommitment:crypto104Commitment(fake),archiveBase64:archive.toString('base64')};
  check(crypto104Commitment(fake)===sha('DDC|CRYPTO-104|flag|'+fake),'Commitment domain');
  check(verifyCrypto104(staged,fake)?.sha256===staged.archiveSha256,'Matching staged evidence is served');
  check(verifyCrypto104(null,fake)===null,'Missing evidence fails closed');
  check(verifyCrypto104(staged,undefined)===null&&verifyCrypto104(staged,'')===null,'Missing flag fails closed');
  check(['DDC{short}','DDC{has space in the flag here}','ddc{lowercase_prefix_abcdefgh}','DDC{'+'a'.repeat(92)+'}','DDC{REPLACE_WITH_PRIVATE_FLAG}'].every(f=>verifyCrypto104({...staged,flagCommitment:crypto104Commitment(f)},f)===null),'Invalid or placeholder flags fail closed');
  check(verifyCrypto104(staged,fake.replace('}','x}'))===null,'Artifact/flag mismatch fails closed');
  check(verifyCrypto104({...staged,archiveBase64:randomBytes(64).toString('base64')},fake)===null&&verifyCrypto104({...staged,archiveSha256:'00'},fake)===null,'Archive digest mismatch fails closed');
}

const key = 'dead-drop-' + randomUUID(), password = randomBytes(24).toString('hex'), ids = [key, key + '-other', key + '-peer'];
const dir = mkdtempSync(join(tmpdir(),'ddc-c104-')), file = join(dir,'fixture.sql');
const q = v => "'" + String(v).replaceAll("'","''") + "'";
function sql(value){writeFileSync(file,value,{mode:0o600});const r=spawnSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--config','wrangler.local.json','--local','--file',file],{encoding:'utf8'});assert.equal(r.status,0,'Fixture query failed');}
async function request(path,cookie='',method='GET',body){return fetch(base+path,{method,redirect:'manual',headers:{Origin:base,Cookie:cookie,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});}
async function data(path,cookie,method='GET',body){const r=await request(path,cookie,method,body);assert.equal(r.status,200,path);return r.json();}
const delay = () => new Promise(r => setTimeout(r, 2100));
const evidence = '/api/challenge-env/crypto-104/evidence';
let browser;
try {
  const hash = await bcrypt.hash(password,12);
  // The main user has solved the other three challenges, so NEXT must reach CRYPTO-104 through normal progression.
  sql(ids.map(id=>`INSERT INTO users(id,username,email,password_hash,display_name,participant_id,role,created_at) VALUES(${[id,id,id+'@example.test',hash,'Dead Drop QA',id,'participant'].map(q).join(',')},${Date.now()});`).join('')
    + `INSERT INTO participant_challenges(user_id,challenge_id,assigned_at,started_at,solved_at) VALUES(${q(key)},'WEB-101',10,10,20),(${q(key)},'WEB-102',30,30,40),(${q(key)},'FORENSICS-103',50,50,60);`
    + `INSERT INTO participant_challenges(user_id,challenge_id,assigned_at,started_at) VALUES(${q(key+'-peer')},'CRYPTO-104',70,70);`);
  check((await request('/api/challenges')).status===401,'Catalogue requires authentication');
  check((await request(evidence)).status===401,'Anonymous evidence download blocked');
  check((await request('/challenges/CRYPTO-104')).headers.get('location')?.includes('/login'),'Anonymous challenge page redirected');
  async function login(id){const r=await request('/api/auth/login','','POST',{identifier:id,password});check(r.status===200,'Login succeeds');return r.headers.get('set-cookie').split(';')[0];}
  const cookie = await login(key), other = await login(key + '-other'), peer = await login(key + '-peer');
  check((await request(evidence,cookie)).status===403,'Evidence locked before assignment');
  const catalogue = await data('/api/challenges',cookie);
  const c104 = catalogue.challenges.find(c=>c.challengeCode==='CRYPTO-104');
  check(c104&&c104.category==='CRYPTO'&&c104.difficulty==='HARD'&&c104.title==='Dead Drop 64: Receiver’s Copy','Catalogue metadata');
  check(!flag||!JSON.stringify(catalogue).includes(flag),'Public metadata has no flag');
  check(!/sha256|commitment|evidence_dir/i.test(JSON.stringify(catalogue)),'Catalogue exposes no evidence internals');
  const eligible = catalogue.challenges.filter(c=>!['WEB-101','WEB-102','FORENSICS-103'].includes(c.challengeCode));
  const next = await data('/api/challenges/next',cookie,'POST');
  if (eligible.length === 1) check(next.assignedChallenge.id==='CRYPTO-104','NEXT assigns CRYPTO-104 as the remaining eligible challenge');
  else sql(`UPDATE participant_challenges SET challenge_id='CRYPTO-104' WHERE user_id=${q(key)} AND solved_at IS NULL;`);
  const repeat = await Promise.all(Array.from({length:5},()=>data('/api/challenges/next',cookie,'POST')));
  check(repeat.every(r=>r.assignedChallenge.id==='CRYPTO-104'),'Repeated NEXT keeps CRYPTO-104 current');
  check((await data('/api/dashboard',cookie)).assignedChallenge.challengeCode==='CRYPTO-104','Refresh preserves assignment');
  check((await request(evidence,other)).status===403,'Unassigned participant cannot download');
  check((await request('/challenges/CRYPTO-104',other)).status===404,'Unassigned participant cannot open challenge');

  if (unavailable) {
    const r = await request(evidence,cookie), body = await r.text();
    check(r.status===503&&body.includes('awaiting configuration'),'Misconfigured evidence returns generic 503');
    check(!/sha256|commitment|[A-Z]:[\\/]|evidence_dir|DDC\{/i.test(body),'503 body exposes no diagnostics');
    const page = await (await request('/challenges/CRYPTO-104',cookie)).text();
    check(page.includes('Evidence is awaiting configuration')&&!page.includes('DOWNLOAD EVIDENCE'),'Page reports unavailable without a download');
    const sub = await request('/api/submissions',cookie,'POST',{challengeId:'CRYPTO-104',flag:flag??'DDC{synthetic_probe_abcdefghij}'});
    check(sub.status===503,'Submission is unavailable, not judged incorrect');
    const dash = await data('/api/dashboard',cookie);
    check(dash.assignedChallenge.challengeCode==='CRYPTO-104'&&dash.solves===3,'Unavailable configuration never solves');
    check((await data('/api/submissions',cookie)).submissions.every(s=>s.challengeId!=='CRYPTO-104'),'No attempt recorded while unavailable');
    console.log(JSON.stringify({mode:'unavailable',passed:checks}));
  } else {
  assert.ok(flag, 'Configure CRYPTO104_FLAG in the ignored .dev.vars first');
  assert.ok(stagedDir, 'Stage the private package (CRYPTO104_EVIDENCE_DIR or .evidence.local.json) first');
  const staged = readFileSync(join(stagedDir,'dead-drop-64.zip'));
  const download = await request(evidence,cookie);
  check(download.status===200,'Evidence download succeeds (status '+download.status+')');
  const h = download.headers;
  check(h.get('content-type')==='application/zip'&&h.get('content-disposition')==='attachment; filename="dead-drop-64.zip"'&&h.get('cache-control')==='no-store, private'&&h.get('vary')?.includes('Cookie')&&h.get('x-content-type-options')==='nosniff','Download headers');
  const bytes = Buffer.from(await download.arrayBuffer());
  // The route sets Content-Length, but vinext's response pipeline re-chunks every dynamic response
  // (dev and local built Worker alike); when the header does arrive it must match.
  const length = h.get('content-length');
  check((length===null&&h.get('transfer-encoding')==='chunked'&&!process.env.REQUIRE_CONTENT_LENGTH)||length===String(bytes.length),'Content-Length matches archive ('+length+')');
  check(bytes.length===staged.length,'Archive size matches staged package');
  check(sha(bytes)===h.get('x-evidence-sha256'),'Published SHA-256 matches bytes');
  check(Buffer.compare(bytes,staged)===0,'Served bytes are the prebuilt immutable ZIP');
  const again = Buffer.from(await (await request(evidence,cookie)).arrayBuffer()), peerCopy = Buffer.from(await (await request(evidence,peer)).arrayBuffer());
  check(Buffer.compare(bytes,again)===0&&Buffer.compare(bytes,peerCopy)===0,'Identical archive across refreshes and users');
  check(!bytes.includes(Buffer.from(flag))&&!bytes.includes(Buffer.from(flag.slice(4,-1))),'Flag not present in evidence');

  const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'file:///C:/Users/rithv/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
  browser = await chromium.launch({channel:'msedge',headless:true});
  const page = await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true}), errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.context().addCookies([{name:'ddc_session',value:cookie.split('=')[1],url:base,httpOnly:true,sameSite:'Lax'}]);
  await page.goto(base+'/dashboard');await page.getByRole('button',{name:'CONTINUE CHALLENGE'}).click();
  await page.waitForURL('**/challenges/CRYPTO-104');
  await page.getByRole('heading',{name:'Dead Drop 64: Receiver’s Copy'}).waitFor();
  const body = await page.locator('main').innerText();
  check(['CRYPTO-104','CRYPTO','HARD','A relay can forward traffic the receiver never accepted.','Recover the message the receiver actually accepted.','dead-drop-64.zip',bytes.length.toLocaleString('en-US')+' bytes',sha(bytes)].every(t=>body.includes(t)),'Challenge page content and evidence metadata');
  check(!/base64|receipt_order|wire_sha256|offset|padding|checksum/i.test(body),'Page does not reveal solution steps');
  check(await page.locator('[data-participant-topbar]').isVisible(),'Persistent topbar');
  const [file] = await Promise.all([page.waitForEvent('download'),page.getByRole('link',{name:'DOWNLOAD EVIDENCE →'}).click()]);
  check(file.suggestedFilename()==='dead-drop-64.zip','Browser download filename');
  check(sha(readFileSync(await file.path()))===sha(bytes),'Browser download bytes match');
  await page.getByRole('link',{name:'SUBMIT FLAG →'}).click();await page.waitForURL('**/submissions?challenge=CRYPTO-104');
  check(await page.getByLabel('Challenge ID',{exact:true}).inputValue()==='CRYPTO-104','Submit prefills CRYPTO-104');
  const wrong = 'DDC{' + 'synthetic_wrong_' + randomBytes(8).toString('hex') + '}';
  await page.getByLabel('Flag',{exact:true}).fill(wrong);await page.getByRole('button',{name:'SUBMIT FLAG →'}).click();
  await page.getByText('Incorrect flag.',{exact:true}).waitFor();
  let dashboard = await data('/api/dashboard',cookie);
  check(dashboard.assignedChallenge.challengeCode==='CRYPTO-104'&&dashboard.solves===3,'Wrong flag does not solve or advance');
  await delay();
  const lowered = await data('/api/submissions',cookie,'POST',{challengeId:'CRYPTO-104',flag:flag.toLowerCase()});
  check(!lowered.correct&&(await data('/api/dashboard',cookie)).solves===3,'Comparison stays case-sensitive');
  await delay();
  await page.getByLabel('Flag',{exact:true}).fill('  '+flag+'  ');await page.getByRole('button',{name:'SUBMIT FLAG →'}).click();
  await page.getByText('Flag accepted.',{exact:true}).waitFor();
  dashboard = await data('/api/dashboard',cookie);
  const done = dashboard.completedChallenges.find(c=>c.challengeCode==='CRYPTO-104');
  check(done&&typeof done.solvedAt==='number'&&dashboard.assignedChallenge===null&&dashboard.solves===4,'solvedAt recorded and solve count updated');
  check(dashboard.recentActivity.some(a=>a.type==='Challenge solved'&&a.challengeCode==='CRYPTO-104'),'Recent activity updated');
  check(dashboard.assignedChallenge===null,'Solve does not auto-assign; NEXT stays explicit');
  await delay();
  const duplicate = await data('/api/submissions',cookie,'POST',{challengeId:'CRYPTO-104',flag});
  const after = await data('/api/dashboard',cookie);
  check(duplicate.alreadySolved&&after.solves===4&&after.completedChallenges.find(c=>c.challengeCode==='CRYPTO-104').solvedAt===done.solvedAt,'Duplicate correct submission is a no-op');
  const history = await data('/api/submissions',cookie);
  check(history.submissions.filter(s=>s.challengeId==='CRYPTO-104').map(s=>s.result).join()==='CORRECT,INCORRECT,INCORRECT','Attempts recorded once each');
  check(!JSON.stringify(history).includes(flag)&&!JSON.stringify(history).includes(wrong)&&!JSON.stringify(history).toLowerCase().includes(flag.toLowerCase()),'History contains no submitted or expected flag');
  await page.goto(base+'/challenges/CRYPTO-104');await page.getByRole('heading',{name:'CHALLENGE COMPLETED ✓',exact:true}).waitFor();
  check(await page.getByRole('button',{name:'CONTINUE CHALLENGE'}).count()===0,'Completed page drops CONTINUE');
  await page.reload();await page.getByRole('heading',{name:'CHALLENGE COMPLETED ✓',exact:true}).waitFor();
  check(true,'Refresh preserves completion');
  await page.goto(base+'/challenges');
  await page.locator('article').filter({hasText:'CRYPTO-104'}).getByText('COMPLETED ✓',{exact:true}).waitFor();
  check(true,'Catalogue marks CRYPTO-104 completed');
  const finals = await Promise.all(Array.from({length:4},()=>data('/api/challenges/next',cookie,'POST')));
  check(finals.every(f=>f.assignedChallenge?.challengeCode!=='CRYPTO-104'),'Solved CRYPTO-104 never reassigned');
  if (eligible.length === 1) {
    check(finals.every(f=>f.allChallengesCompleted&&f.assignedChallenge===null),'NEXT reports all four challenges completed');
    await page.goto(base+'/dashboard');await page.getByText('ALL CHALLENGES COMPLETED',{exact:true}).waitFor();
    check(true,'Dashboard shows ALL CHALLENGES COMPLETED');
  }
  check((await request(evidence,cookie)).status===200,'Evidence stays downloadable after solve');
  check((await request('/api/auth/me',cookie)).status===200,'Authentication unaffected');
  function scan(path){for(const item of readdirSync(path,{withFileTypes:true})){const p=join(path,item.name);if(item.isDirectory())scan(p);else if(/\.(js|html|json|map|css)$/.test(p)){const text=readFileSync(p,'utf8');assert.ok(!text.includes(flag),'Flag leaked in client build');assert.ok(!text.includes('crypto104Staged')&&!text.includes(staged.toString('base64').slice(0,64)),'Evidence module leaked into client build');}}}
  if (existsSync('dist/client')) {scan('dist/client');check(true,'Client build excludes flag and evidence module');}
  check(errors.length===0,'No browser runtime errors: '+errors.join(';'));
  console.log(JSON.stringify({passed:checks}));
  }
} finally {
  await browser?.close();
  sql(ids.map(id=>`DELETE FROM submissions WHERE user_id=${q(id)};DELETE FROM submission_limits WHERE user_id=${q(id)};DELETE FROM sessions WHERE user_id=${q(id)};DELETE FROM participant_challenges WHERE user_id=${q(id)};DELETE FROM users WHERE id=${q(id)};DELETE FROM auth_limits WHERE key=${q('account:'+createHash('sha256').update(id).digest('hex'))};`).join(''));
  rmSync(file,{force:true});rmdirSync(dir);
}
