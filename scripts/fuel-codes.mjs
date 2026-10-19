// Operator tool for Otterly Space Academy supporter codes.
//   node scripts/fuel-codes.mjs keygen          one time: makes the private key outside the repo and prints the public key
//   node scripts/fuel-codes.mjs issue <name>    prints a code to send to a supporter who gave at least Rs 150
// The private key stays in %USERPROFILE%\.otterly. Never commit it.
import { webcrypto as crypto } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const dir = join(homedir(), '.otterly');
const keyFile = join(dir, 'fuel-private.jwk.json');
const b64u = bytes => Buffer.from(bytes).toString('base64url');
const algorithm = { name: 'ECDSA', namedCurve: 'P-256' };
const [command, name] = process.argv.slice(2);

if (command === 'keygen') {
  if (existsSync(keyFile)) throw new Error(`A key already exists at ${keyFile}. Delete it only if you accept that old codes stop working.`);
  const pair = await crypto.subtle.generateKey(algorithm, true, ['sign', 'verify']);
  mkdirSync(dir, { recursive: true });
  writeFileSync(keyFile, JSON.stringify(await crypto.subtle.exportKey('jwk', pair.privateKey)));
  const { kty, crv, x, y } = await crypto.subtle.exportKey('jwk', pair.publicKey);
  console.log(JSON.stringify({ kty, crv, x, y }));
} else if (command === 'issue') {
  if (!name || !/^[A-Za-z0-9 ._-]{1,40}$/.test(name)) throw new Error('Give a short supporter name or order number (letters, digits, space . _ -).');
  const key = await crypto.subtle.importKey('jwk', JSON.parse(readFileSync(keyFile, 'utf8')), algorithm, false, ['sign']);
  const payload = `OTT1|unlimited|${name}`;
  const signature = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(payload));
  console.log(`${b64u(new TextEncoder().encode(payload))}.${b64u(signature)}`);
} else {
  console.log('Usage: node scripts/fuel-codes.mjs keygen | issue <supporter name>');
  process.exitCode = 1;
}
