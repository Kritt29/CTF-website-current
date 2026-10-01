// Regenerates the FORENSICS-103 evidence image from FORENSICS103_FLAG (env, or ignored .dev.vars).
// Usage: node scripts/generate-forensics103.mjs [--out outputs/forensics103/ddc-node17.mem] [--manifest]
// Output is deterministic and ignored by Git. The platform serves the same bytes on demand.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { buildForensics103, FORENSICS103_ARTIFACT } from '../lib/forensics103/artifact.ts';

const args = process.argv.slice(2);
const out = args.includes('--out') ? args[args.indexOf('--out') + 1] : `outputs/forensics103/${FORENSICS103_ARTIFACT}`;
const flag = process.env.FORENSICS103_FLAG
  || (existsSync('.dev.vars') ? readFileSync('.dev.vars', 'utf8').match(/^FORENSICS103_FLAG="?([^"\r\n]+)"?/m)?.[1] : undefined);
if (!flag) throw new Error('Set FORENSICS103_FLAG (environment or .dev.vars).');

const { bytes, manifest } = buildForensics103(flag);
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, bytes);
console.log(`${out}  ${bytes.length} bytes  sha256=${createHash('sha256').update(bytes).digest('hex')}`);
if (args.includes('--manifest')) {
  // Maintainer view of offsets and fragments; never publish it with the evidence.
  const { payload: _payload, ...visible } = manifest; void _payload;
  console.log(JSON.stringify(visible, (key, value) => typeof value === 'number' && key !== 'size' && !key.endsWith('Length') ? '0x' + value.toString(16).toUpperCase().padStart(8, '0') : value, 2));
}
