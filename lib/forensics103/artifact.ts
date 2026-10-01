// FORENSICS-103 "Cold Boot: Shattered Cache" evidence generator.
// Maintainer-only: see docs/FORENSICS103.md. Deterministic for a given flag and VERSION.
// Uses erasable TypeScript only, so Node runs it directly (scripts/generate-forensics103.mjs)
// and the Worker serves byte-identical output. Never commit a generated image or the flag.

export const FORENSICS103_ARTIFACT = 'ddc-node17.mem';
const VERSION = 'v1';
const PAGE = 4096, PAGES = 1024;
const PID = 4187, PROCESS = 'vault_worker.exe';
const DECOY = {pid: 2210, process: 'backup_agent.exe'};
const DOS_TIME = (2 << 11) | (14 << 5) | 3, DOS_DATE = ((2026 - 1980) << 9) | (8 << 5) | 14;
const GZIP_MTIME = Date.UTC(2026, 7, 14, 2, 14, 6) / 1000;
const FAKE_FLAGS = ['DDC{maintenance_test}', 'DDC{training_only}', 'DDC{debug_build}', 'DDC{old_recovery_flag}'];

type Rand = () => number;
type Item = {text: string; wide: boolean; required?: boolean};
export type Forensics103Manifest = {
  version: string; size: number; session: string;
  cacheA: number; cacheALength: number; cacheB: number; cacheBLength: number; scratch: number; scratchLength: number;
  decoyCacheA: number; blocks: {'01': string; '02': string; '03': string}; decoyBlocks: {'07': string; '99': string};
  checksum: string; payload: string;
};

const encoder = new TextEncoder();
const ascii = (text: string) => encoder.encode(text);
function wide(text: string) {
  const out = new Uint8Array(text.length * 2);
  for (let i = 0; i < text.length; i++) { out[i * 2] = text.charCodeAt(i) & 0xff; out[i * 2 + 1] = text.charCodeAt(i) >> 8; }
  return out;
}
function concat(parts: Uint8Array[]) {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0; for (const p of parts) { out.set(p, at); at += p.length; }
  return out;
}
const le = (value: number, size: number) => Uint8Array.from({length: size}, (_, i) => (value >>> (8 * i)) & 0xff);
const hex8 = (n: number) => '0x' + n.toString(16).toUpperCase().padStart(8, '0');

function seeded(text: string): Rand {
  let s = 0x811c9dc5;
  for (const b of ascii(text)) s = Math.imul(s ^ b, 0x01000193) >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0; let n = Math.imul(s ^ (s >>> 15), 1 | s);
    n ^= n + Math.imul(n ^ (n >>> 7), 61 | n); return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}
const int = (r: Rand, min: number, max: number) => min + Math.floor(r() * (max - min + 1));
const pick = <T,>(r: Rand, values: T[]) => values[Math.floor(r() * values.length)];
const randomBytes = (r: Rand, n: number) => Uint8Array.from({length: n}, () => Math.floor(r() * 256));

const CRC = Array.from({length: 256}, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
export function crc32(data: Uint8Array) { let c = 0xffffffff; for (const b of data) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }

// Single fixed-Huffman DEFLATE block of literals: runtime-independent and fully standard.
function deflate(data: Uint8Array) {
  const out: number[] = []; let acc = 0, bit = 0;
  const put = (v: number) => { acc |= v << bit; if (++bit === 8) { out.push(acc); acc = 0; bit = 0; } };
  const code = (c: number, len: number) => { for (let i = len - 1; i >= 0; i--) put((c >> i) & 1); };
  put(1); put(1); put(0);
  for (const b of data) { if (b < 144) code(0x30 + b, 8); else code(0x190 + b - 144, 9); }
  code(0, 7);
  if (bit) out.push(acc);
  return Uint8Array.from(out);
}
function gzip(name: string, data: Uint8Array) {
  return concat([Uint8Array.of(0x1f, 0x8b, 8, 8), le(GZIP_MTIME, 4), Uint8Array.of(0, 3), ascii(name + '\0'), deflate(data), le(crc32(data), 4), le(data.length, 4)]);
}
function zip(entries: {name: string; data: Uint8Array}[]) {
  const locals: Uint8Array[] = [], central: Uint8Array[] = []; let offset = 0;
  for (const {name, data} of entries) {
    const packed = deflate(data), n = ascii(name), crc = crc32(data);
    const common = concat([le(20, 2), le(0, 2), le(8, 2), le(DOS_TIME, 2), le(DOS_DATE, 2), le(crc, 4), le(packed.length, 4), le(data.length, 4), le(n.length, 2), le(0, 2)]);
    const local = concat([le(0x04034b50, 4), common, n, packed]);
    central.push(concat([le(0x02014b50, 4), le(0x0314, 2), common, le(0, 2), le(0, 2), le(0, 2), le(0o100644 * 65536, 4), le(offset, 4), n]));
    locals.push(local); offset += local.length;
  }
  const directory = concat(central);
  return concat([...locals, directory, le(0x06054b50, 4), le(0, 4), le(entries.length, 2), le(entries.length, 2), le(directory.length, 4), le(offset, 4), le(0, 2)]);
}
const b64 = (data: Uint8Array) => btoa(String.fromCharCode(...data));

// ---- believable noise ----
const USERS = ['jmorales', 'a.kapoor', 'svc_backup', 'r.iyer', 'Administrator', 't.chen', 'svc_vault', 'n.fernandes'];
const HOSTS = ['update.ddc-internal.local', 'telemetry.ddc-internal.local', 'login.microsoftonline.com', 'ocsp.digicert.com', 'files.node17.corp', 'intranet.cbit.local', 'wpad.corp', 'settings-win.data.microsoft.com'];
const DLLS = ['ntdll.dll', 'kernel32.dll', 'KERNELBASE.dll', 'advapi32.dll', 'crypt32.dll', 'bcrypt.dll', 'ws2_32.dll', 'winhttp.dll', 'ucrtbase.dll', 'msvcp140.dll', 'vcruntime140.dll', 'rpcrt4.dll', 'sechost.dll', 'combase.dll'];
const PROCS = ['svchost.exe', 'explorer.exe', 'lsass.exe', 'services.exe', 'winlogon.exe', 'backup_agent.exe', 'OneDrive.exe', 'msedge.exe', 'SearchIndexer.exe', 'spoolsv.exe', 'MsMpEng.exe', 'conhost.exe', 'taskhostw.exe', 'vault_ui.exe'];
const SERVICES = ['BackupAgent', 'VaultSvc', 'Spooler', 'WinDefend', 'wuauserv', 'EventLog', 'Dnscache', 'LanmanWorkstation', 'Schedule'];
const DOCS = ['Q3-budget-draft.xlsx', 'node17-runbook.docx', 'incident-notes.txt', 'vpn-setup.pdf', 'rack-inventory.csv', 'handover.md'];
const PASSWORDS = ['password=Winter2026!', 'pwd=Summer@123', 'db_pass=ch4ngeme', 'PASS: Welcome1', 'svc_backup:Backup#2024', 'smtp_password=Relay!2025'];

function timestamp(r: Rand) { return `2026-08-14 0${int(r, 1, 2)}:${String(int(r, 0, 59)).padStart(2, '0')}:${String(int(r, 0, 59)).padStart(2, '0')}.${String(int(r, 0, 999)).padStart(3, '0')}`; }
function message(r: Rand) {
  return pick(r, [
    () => `cache miss key=${randomHex(r, 8)}`, () => `cache: evicted ${int(r, 3, 900)} entries (lru)`,
    () => `heap arena 0x${randomHex(r, 12)} committed`, () => `worker ${int(r, 1, 16)} idle`,
    () => `retrying connection (attempt ${int(r, 1, 5)}/5)`, () => 'TLS handshake completed',
    () => `config reloaded from C:\\ProgramData\\DDC\\${pick(r, SERVICES)}\\service.ini`, () => 'token refresh scheduled',
    () => `queue depth ${int(r, 0, 64)}`, () => `snapshot ${randomHex(r, 6)} skipped: volume busy`, () => 'watchdog ping ok',
    () => 'index rebuild deferred', () => `session ${randomHex(r, 4).toUpperCase()} closed by peer`,
  ])();
}
function randomHex(r: Rand, n: number) { let s = ''; while (s.length < n) s += Math.floor(r() * 16).toString(16); return s; }
function noiseText(r: Rand): string {
  return pick(r, [
    () => `C:\\Windows\\System32\\${pick(r, DLLS)}`,
    () => `C:\\Users\\${pick(r, USERS)}\\AppData\\Local\\Temp\\~DF${randomHex(r, 4).toUpperCase()}.tmp`,
    () => `C:\\ProgramData\\DDC\\${pick(r, SERVICES)}\\logs\\${pick(r, SERVICES).toLowerCase()}-20260814.log`,
    () => `https://${pick(r, HOSTS)}/${pick(r, ['api/v2/telemetry', 'config/client.json', 'ocsp', 'updates/manifest.xml', 'auth/token'])}?v=${int(r, 100, 999)}`,
    () => `${timestamp(r)} [${pick(r, SERVICES)}] ${message(r)}`,
    () => `${timestamp(r)} ${pick(r, PROCS)}[${int(r, 400, 9800)}] ${message(r)}`,
    () => `user=${pick(r, USERS)} ${pick(r, PASSWORDS)}`,
    () => `GET /${pick(r, ['api/v2/telemetry', 'health', 'sync/delta'])} HTTP/1.1`,
    () => 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
    () => `${pick(r, PROCS)}  PID ${int(r, 400, 9800)}  Session ${int(r, 0, 2)}`,
    () => `HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\${pick(r, ['Run', 'Uninstall', 'Explorer\\Shell Folders'])}`,
    () => `DBG ${pick(r, ['cache.c', 'ioq.c', 'netio.c', 'recover.c', 'store.c'])}:${int(r, 20, 900)} ${pick(r, ['assertion ok', 'lock acquired', 'buffer grown', 'fd closed'])}`,
    () => `temp file ${pick(r, ['vault', 'bkp', 'upd', 'idx'])}_${randomHex(r, 6)}.tmp ${pick(r, ['created', 'deleted', 'locked'])}`,
    () => `Service Control Manager: The ${pick(r, SERVICES)} service entered the ${pick(r, ['running', 'stopped'])} state.`,
    () => `\\\\files.node17.corp\\share\\${pick(r, DOCS)}`,
  ])();
}
function noiseWide(r: Rand): string {
  const user = pick(r, USERS);
  return pick(r, [
    () => `C:\\Users\\${user}\\AppData\\Roaming\\Microsoft\\Windows\\Recent\\${pick(r, DOCS)}.lnk`,
    () => `\\Device\\HarddiskVolume3\\Windows\\System32\\${pick(r, DLLS)}`,
    () => `HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Services\\${pick(r, SERVICES)}`,
    () => `USERNAME=${user}`, () => 'COMPUTERNAME=DDC-NODE17', () => 'PROCESSOR_ARCHITECTURE=AMD64',
    () => `TEMP=C:\\Users\\${user}\\AppData\\Local\\Temp`, () => `${pick(r, DOCS)} - ${pick(r, ['Notepad', 'Word', 'Excel'])}`,
    () => 'Microsoft Edge', () => pick(r, ['C:\\Program Files\\DDC\\Vault\\vault_ui.exe', 'C:\\Program Files\\DDC\\Backup\\backup_agent.exe', 'C:\\Program Files\\DDC\\Agent\\ddc_agent.exe', `C:\\Windows\\System32\\${pick(r, ['svchost.exe', 'conhost.exe', 'taskhostw.exe', 'spoolsv.exe'])}`]),
  ])();
}

// Strings separated by NULs and zero-heavy "struct" slack, like a heap or loader page.
// Required items always fit; noise that would crowd them out is skipped.
function writeItems(mem: Uint8Array, start: number, end: number, r: Rand, items: Item[], fill: boolean) {
  const cost = (item: Item) => (item.wide ? 2 : 1) * (item.text.length + 2) + 36;
  let at = start + int(r, 1, 4) * 16, index = 0;
  let pending = items.filter(i => i.required).reduce((n, i) => n + cost(i), 0);
  if (at + pending > end) throw new Error('FORENSICS-103 layout overflow');
  while (fill || index < items.length) {
    const item: Item = index < items.length ? items[index] : r() < 0.7 ? {text: noiseText(r), wide: false} : {text: noiseWide(r), wide: true};
    index++;
    if (item.required) pending -= cost(item);
    else if (at + cost(item) + pending > end) { if (fill && index > items.length) break; continue; }
    const bytes = item.wide ? wide(item.text) : ascii(item.text), gap = int(r, 4, 36), term = item.wide ? 2 : 1;
    for (let i = 0; i < gap; i++) mem[at++] = r() < 0.6 ? 0 : Math.floor(r() * 256);
    at += term; mem.set(bytes, at); at += bytes.length; mem[at] = 0; if (term === 2) mem[at + 1] = 0; at += term;
  }
}
// Mixes required items into noise at random positions.
function scatter(r: Rand, required: Item[], noise: number, wideShare: number): Item[] {
  const out: Item[] = Array.from({length: noise}, () => r() < wideShare ? {text: noiseWide(r), wide: true} : {text: noiseText(r), wide: false});
  for (const item of required) out.splice(int(r, 0, out.length), 0, {...item, required: true});
  return out;
}

export function buildForensics103(flag: string): {bytes: Uint8Array; manifest: Forensics103Manifest} {
  if (!/^DDC\{[^\r\n{}]{1,100}\}$/.test(flag)) throw new Error('FORENSICS103_FLAG must look like DDC{...}');
  const r = seeded(`ddc-node17|${VERSION}|${flag}`);
  const session = 'FROST-' + randomHex(r, 4).toUpperCase(), decoySession = 'THAW-' + randomHex(r, 4).toUpperCase();
  const mem = new Uint8Array(PAGE * PAGES), used = new Set<number>();
  const reserve = (from: number, to: number, count: number) => {
    for (;;) {
      const p = int(r, Math.floor(from * PAGES), Math.floor(to * PAGES) - count);
      if (Array.from({length: count}, (_, i) => p + i).every(i => !used.has(i))) { for (let i = 0; i < count; i++) used.add(p + i); return p; }
    }
  };
  const pages = {
    decoyEnv: reserve(0.06, 0.12, 1), env: reserve(0.18, 0.26, 1), crash: reserve(0.30, 0.36, 1), scratch: reserve(0.40, 0.46, 1),
    ghost: reserve(0.48, 0.52, 1), cacheA: reserve(0.56, 0.62, 2), cacheB: reserve(0.70, 0.76, 2), zip: reserve(0.86, 0.92, 3),
  };
  const inner = () => int(r, 4, 40) * 16;
  const cacheA = pages.cacheA * PAGE + inner(), cacheB = pages.cacheB * PAGE + inner(), scratch = pages.zip * PAGE + inner();
  let decoyCacheA = 0; do decoyCacheA = int(r, 64, PAGES - 64) * PAGE + inner(); while (used.has(Math.floor(decoyCacheA / PAGE)));

  // Payload: Base64("MODE=XOR / KEY=SESSION / DATA=hex(flag ^ session)"), stored as blocks 03,01,02.
  const cipher = ascii(flag).map((b, i) => b ^ session.charCodeAt(i % session.length));
  const header = 'MODE=XOR\nKEY=SESSION\nDATA=';
  const hex = Array.from(cipher, b => b.toString(16).padStart(2, '0')).join('');
  const payload = b64(ascii(header + hex + '\n'));
  // Block 03 always carries a large share of DATA, so the scratch archive cannot be skipped.
  let cut1 = Math.ceil((header.length + Math.floor(hex.length * 0.45)) * 4 / 3); if (cut1 % 4 === 0) cut1++;
  let cut2 = cut1 + Math.floor((payload.length - cut1) / 2); if (cut2 % 4 === 0) cut2++;
  const blocks = {'03': payload.slice(0, cut1), '01': payload.slice(cut1, cut2), '02': payload.slice(cut2)};
  const decoyBlocks = {'07': b64(randomBytes(r, Math.floor(blocks['01'].length * 3 / 4) + 1)).replace(/=+$/, ''), '99': b64(randomBytes(r, Math.floor(blocks['02'].length * 3 / 4) + 2))};
  const checksum = crc32(ascii(payload)).toString(16).padStart(8, '0');

  // Background: zero, high-entropy, code-like, ASCII heap and UTF-16 heap pages.
  const fakeFlagPages = new Set<number>();
  while (fakeFlagPages.size < 7) { const p = int(r, 8, PAGES - 8); if (!used.has(p)) fakeFlagPages.add(p); }
  const fakeContexts = [(f: string) => `training.flag=${f}`, (f: string) => `# ${f} -- remove before release`, (f: string) => `debug_flag: ${f}`, (f: string) => `recovery.bak: ${f}`, (f: string) => `ctf_sample=${f}`];
  let fakeIndex = 0;
  for (let p = 0; p < PAGES; p++) {
    if (used.has(p)) continue;
    const base = p * PAGE;
    if (fakeFlagPages.has(p)) {
      const flagText = FAKE_FLAGS[fakeIndex % FAKE_FLAGS.length], isWide = fakeIndex === 5;
      writeItems(mem, base, base + PAGE, r, scatter(r, [{text: isWide ? flagText : pick(r, fakeContexts)(flagText), wide: isWide}], 30, 0.2), false);
      fakeIndex++; continue;
    }
    const kind = r();
    if (kind < 0.22) continue;
    if (kind < 0.50) mem.set(randomBytes(r, PAGE), base);
    else if (kind < 0.62) { const ops = [0x48, 0x89, 0x8b, 0xe8, 0x00, 0xff, 0x83, 0xc4, 0x5d, 0xc3, 0x55, 0x0f, 0x85, 0x84, 0x74, 0x75, 0xeb, 0x90, 0x4c, 0x8d, 0x24, 0x44]; for (let i = 0; i < PAGE; i++) mem[base + i] = r() < 0.85 ? pick(r, ops) : Math.floor(r() * 256); }
    else if (kind < 0.87) writeItems(mem, base, base + PAGE, r, [], true);
    else writeItems(mem, base, base + PAGE, r, scatter(r, [], 45, 1), false);
  }
  // Random pages must not create competing archive signatures.
  for (let i = 0; i < mem.length - 3; i++) {
    if ((mem[i] === 0x1f && mem[i + 1] === 0x8b) || (mem[i] === 0x50 && mem[i + 1] === 0x4b && mem[i + 2] === 3 && mem[i + 3] === 4)) mem[i + 1] ^= 0x40;
  }

  const ts = (t: string) => `2026-08-14 ${t}`;
  // Process parameters/environment block for the recovery worker and an unrelated backup agent (UTF-16LE).
  const envBlock = (process: string, pid: number, s: string, a: number, count: number) =>
    `ALLUSERSPROFILE=C:\\ProgramData\0COMPUTERNAME=DDC-NODE17\0PROCESS=${process}\0PID=${pid}\0SESSION=${s}\0CACHE_A=${hex8(a)}\0CACHE_B=${hex8(count === 3 ? cacheB : decoyCacheA + 0x2000)}\0BLOCK_COUNT=${count}\0USERNAME=svc_vault\0windir=C:\\Windows`;
  writeItems(mem, pages.env * PAGE, (pages.env + 1) * PAGE, r, scatter(r, [
    {text: `"C:\\Program Files\\DDC\\Vault\\${PROCESS}" --recover --quiet`, wide: true},
    {text: envBlock(PROCESS, PID, session, cacheA, 3), wide: true},
  ], 22, 1), false);
  writeItems(mem, pages.decoyEnv * PAGE, (pages.decoyEnv + 1) * PAGE, r, scatter(r, [
    {text: `"C:\\Program Files\\DDC\\Backup\\${DECOY.process}" --service`, wide: true},
    {text: envBlock(DECOY.process, DECOY.pid, decoySession, decoyCacheA, 2), wide: true},
  ], 22, 1), false);
  writeItems(mem, pages.crash * PAGE, (pages.crash + 1) * PAGE, r, scatter(r, [
    {text: `${ts('02:14:07.498')} ${PROCESS}[${PID}] recovery: reassembling cached payload`, wide: false},
    {text: `${ts('02:14:07.511')} ${PROCESS}[${PID}] RECOVERY FAILED: block table inconsistent`, wide: false},
    {text: `${ts('02:14:07.519')} PID ${PID} worker terminated (status 0xC0000005)`, wide: false},
    {text: `${ts('02:13:41.020')} ${DECOY.process}[${DECOY.pid}] RECOVERY OK: nothing to replay`, wide: false},
  ], 20, 0.2), false);
  writeItems(mem, pages.ghost * PAGE, (pages.ghost + 1) * PAGE, r, scatter(r, [
    {text: `WER: queued crash report for ${PROCESS} (PID ${PID})`, wide: false},
    {text: `[vault] narrow string table lost at shutdown; 16-bit ghosts survived`, wide: false},
  ], 24, 0.25), false);
  const scratchLine = (pid: number, s: string, state: string, magic: string, off: number, len: number, block = '') =>
    `${ts('02:14:0' + int(r, 0, 7) + '.' + String(int(r, 100, 999)))} [scratch] pid=${pid} session=${s}${block} recovery scratch ${state} magic=${magic} offset=${hex8(off)} len=${len}`;

  // CACHE_A: gzip member carrying trace.log.
  const traceLines = [
    `2026-08-14T02:13:58.004Z [${PID}] ${PROCESS} attach session=${session} blocks=3`,
    `2026-08-14T02:13:58.110Z [${DECOY.pid}] ${DECOY.process} heartbeat ok`,
    `2026-08-14T02:13:59.771Z [${PID}] payload staged: base64 text, 3 blocks`,
    `2026-08-14T02:14:00.012Z [912] svchost.exe token refresh scheduled`,
    `2026-08-14T02:14:01.305Z [${PID}] payload sealed with session key`,
    `2026-08-14T02:14:02.640Z [${PID}] block 03 flushed -> recovery scratch`,
    `2026-08-14T02:14:02.998Z [${DECOY.pid}] ${DECOY.process} snapshot skipped: volume busy`,
    `2026-08-14T02:14:03.417Z [${PID}] block 01 stale -> cache_b (wide)`,
    `2026-08-14T02:14:04.052Z [${PID}] block 02 moved -> cache_b`,
    `2026-08-14T02:14:04.113Z [${PID}] cache_b checksum = crc32(reassembled payload)`,
    `2026-08-14T02:14:05.880Z [4817] SearchIndexer.exe index rebuild deferred`,
    `2026-08-14T02:14:06.201Z [${PID}] recovery order != storage order`,
    `2026-08-14T02:14:07.511Z [${PID}] RECOVERY FAILED`,
  ];
  const trace = ascii(traceLines.join('\n') + '\n');
  const gz = gzip('trace.log', trace);
  mem.set(randomBytes(r, cacheA - pages.cacheA * PAGE), pages.cacheA * PAGE);
  mem.fill(0, cacheA, (pages.cacheA + 2) * PAGE); mem.set(gz, cacheA);

  // CACHE_B: binary cache region; real blocks split across narrow and wide encodings.
  const cacheBBytes = concat([ascii('CBv2'), Uint8Array.of(2, 0, 3, 0), randomBytes(r, 72),
    Uint8Array.of(0), ascii(`BLOCK_99=${decoyBlocks['99']}`), Uint8Array.of(0), randomBytes(r, 40),
    Uint8Array.of(0, 0), wide(`BLOCK_07=${decoyBlocks['07']}`), Uint8Array.of(0, 0), randomBytes(r, 56),
    Uint8Array.of(0), ascii(`BLOCK_02=${blocks['02']}`), Uint8Array.of(0), randomBytes(r, 24),
    Uint8Array.of(0, 0), wide(`BLOCK_01=${blocks['01']}`), Uint8Array.of(0, 0), randomBytes(r, 32),
    Uint8Array.of(0), ascii(`CHECKSUM=crc32:${checksum}`), Uint8Array.of(0), randomBytes(r, 64)]);
  mem.set(randomBytes(r, 2 * PAGE), pages.cacheB * PAGE); mem.fill(0, cacheB - 16, cacheB); mem.set(cacheBBytes, cacheB);
  mem.fill(0, cacheB + cacheBBytes.length, cacheB + cacheBBytes.length + 16);

  // Recovery scratch: ZIP with session.idx, notes.tmp, fragment.bin.
  const fragment = randomBytes(r, 1400);
  fragment.set(ascii('FRAG'), 0);
  const blockAt = int(r, 300, 900), wideBlock = concat([Uint8Array.of(0, 0), wide(`BLOCK_03=${blocks['03']}`), Uint8Array.of(0, 0)]);
  fragment.set(wideBlock, blockAt);
  fragment.set(concat([Uint8Array.of(0, 0), wide('frag.cache v2'), Uint8Array.of(0, 0)]), 64);
  const notes = [
    'todo: rotate svc_backup creds (still Backup#2024, do NOT paste in chat again)',
    'INC-20417 node17 fans loud again, facilities says next week',
    'scratch area is temp only -- purged on reboot, never backed up',
    'vault_worker keeps timing out on reassembly under load?',
    `checked cache_b by hand, the blocks are all there but it still fails`,
    '',
    'blocks were written:',
    '03 → 01 → 02',
    '',
    'do not trust lexical order',
    '',
    'lunch: 2x masala dosa, 1x filter coffee',
    `remind ${pick(r, USERS)} about the rack-06 cable`,
  ].join('\n') + '\n';
  const archive = zip([
    {name: 'session.idx', data: ascii(`[session]\nid=${session}\nowner=${PROCESS}\npid=${PID}\nstate=detached\nblocks=3\nfragment=fragment.bin\nfragment_encoding=utf-16le\n`)},
    {name: 'notes.tmp', data: encoder.encode(notes)},
    {name: 'fragment.bin', data: fragment},
  ]);
  mem.set(randomBytes(r, scratch - pages.zip * PAGE), pages.zip * PAGE);
  mem.fill(0, scratch, (pages.zip + 3) * PAGE); mem.set(archive, scratch);

  writeItems(mem, pages.scratch * PAGE, (pages.scratch + 1) * PAGE, r, scatter(r, [
    {text: scratchLine(DECOY.pid, decoySession, 'attached', '1F8B0808', decoyCacheA, 2380), wide: false},
    {text: scratchLine(912, 'SYSTEM', 'released', '4D5A9000', int(r, 64, 900) * PAGE, 4096), wide: false},
    {text: scratchLine(PID, session, 'detached', '504B0304', scratch, archive.length, ' block=03'), wide: false},
    {text: scratchLine(6640, 'USER-' + randomHex(r, 4).toUpperCase(), 'released', '89504E47', int(r, 64, 900) * PAGE, 12844), wide: false},
  ], 18, 0.2), false);

  return {bytes: mem, manifest: {version: VERSION, size: mem.length, session, cacheA, cacheALength: gz.length, cacheB, cacheBLength: cacheBBytes.length,
    scratch, scratchLength: archive.length, decoyCacheA, blocks, decoyBlocks, checksum, payload}};
}
