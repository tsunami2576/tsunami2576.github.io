import type { PrivateContent, PrivateContentSession } from './content';

type EncryptedPack = {
  version: 1;
  kdf: { iterations: number; salt: string };
  cipher: { iv: string; data: string };
};

export class PrivateContentError extends Error {
  constructor(public readonly reason: 'invalid-password' | 'unavailable' | 'unsupported') {
    super(reason);
  }
}

function decodeBase64(value: string) {
  const decoded = atob(value);
  const bytes = new Uint8Array(new ArrayBuffer(decoded.length));
  for (let index = 0; index < decoded.length; index += 1) bytes[index] = decoded.charCodeAt(index);
  return bytes.buffer;
}

async function deriveKey(password: string, salt: ArrayBuffer, iterations: number) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  );
}

export async function unlockPrivateContent(password: string): Promise<PrivateContentSession> {
  if (!crypto.subtle) throw new PrivateContentError('unsupported');

  let pack: EncryptedPack;
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}private/ad-astra.pack`, {
      cache: 'no-store',
      credentials: 'same-origin',
    });
    if (!response.ok) throw new Error('pack unavailable');
    pack = await response.json() as EncryptedPack;
  } catch {
    throw new PrivateContentError('unavailable');
  }

  let content: PrivateContent;
  try {
    const salt = decodeBase64(pack.kdf.salt);
    const iv = decodeBase64(pack.cipher.iv);
    const ciphertext = decodeBase64(pack.cipher.data);
    const key = await deriveKey(password, salt, pack.kdf.iterations);
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
    content = JSON.parse(new TextDecoder().decode(plaintext)) as PrivateContent;
  } catch {
    throw new PrivateContentError('invalid-password');
  }

  return {
    content,
    dispose: () => undefined,
  };
}
