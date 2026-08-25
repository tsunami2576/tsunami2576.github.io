import { createCipheriv, pbkdf2Sync, randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const passwordPath = resolve(root, '.private-passphrase');
const contentPath = resolve(root, '.private-content.json');
const outputPath = resolve(root, 'public/private/ad-astra.pack');
const iterations = 600_000;

const [password, source] = await Promise.all([
  readFile(passwordPath, 'utf8').then((value) => value.trim()),
  readFile(contentPath, 'utf8').then(JSON.parse),
]);

if (password.length < 16) throw new Error('Private passphrase must contain at least 16 characters.');

const payload = Buffer.from(JSON.stringify(source), 'utf8');
const salt = randomBytes(16);
const iv = randomBytes(12);
const key = pbkdf2Sync(password, salt, iterations, 32, 'sha256');
const cipher = createCipheriv('aes-256-gcm', key, iv);
const encrypted = Buffer.concat([cipher.update(payload), cipher.final(), cipher.getAuthTag()]);

const pack = {
  version: 1,
  kdf: { iterations, salt: salt.toString('base64') },
  cipher: { iv: iv.toString('base64'), data: encrypted.toString('base64') },
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(pack)}\n`);
console.log(`Encrypted text-only private content into ${outputPath}.`);
