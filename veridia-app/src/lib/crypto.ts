const VERSION = 0x01;
const ITERATIONS = 100000;
const KEY_LENGTH = 256;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function fromBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

export function generateSalt(): Uint8Array {
  const salt = new Uint8Array(SALT_LENGTH);
  crypto.getRandomValues(salt);
  return salt;
}

export function generateIV(): Uint8Array {
  const iv = new Uint8Array(IV_LENGTH);
  crypto.getRandomValues(iv);
  return iv;
}

export async function encrypt(data: string, password: string): Promise<string> {
  const salt = generateSalt();
  const iv = generateIV();
  const key = await deriveKey(password, salt);

  const encoder = new TextEncoder();
  const plaintext = encoder.encode(data);

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    plaintext
  );

  const ciphertextBytes = new Uint8Array(ciphertext);
  const authTag = ciphertextBytes.slice(-TAG_LENGTH);
  const encryptedData = ciphertextBytes.slice(0, -TAG_LENGTH);

  const result = new Uint8Array(
    1 + SALT_LENGTH + IV_LENGTH + encryptedData.length + TAG_LENGTH
  );

  let offset = 0;
  result[offset++] = VERSION;
  result.set(salt, offset);
  offset += SALT_LENGTH;
  result.set(iv, offset);
  offset += IV_LENGTH;
  result.set(encryptedData, offset);
  offset += encryptedData.length;
  result.set(authTag, offset);

  return toBase64(result);
}

export async function decrypt(encrypted: string, password: string): Promise<string> {
  const data = fromBase64(encrypted);

  if (data.length < 1 + SALT_LENGTH + IV_LENGTH + TAG_LENGTH) {
    throw new Error('Invalid encrypted data: too short');
  }

  let offset = 0;
  const version = data[offset++];
  if (version !== VERSION) {
    throw new Error(`Unsupported version: ${version}`);
  }

  const salt = data.slice(offset, offset + SALT_LENGTH);
  offset += SALT_LENGTH;

  const iv = data.slice(offset, offset + IV_LENGTH);
  offset += IV_LENGTH;

  const ciphertextLength = data.length - offset - TAG_LENGTH;
  const ciphertext = data.slice(offset, offset + ciphertextLength);
  offset += ciphertextLength;

  const authTag = data.slice(offset, offset + TAG_LENGTH);

  const key = await deriveKey(password, salt);

  const combined = new Uint8Array(ciphertext.length + TAG_LENGTH);
  combined.set(ciphertext, 0);
  combined.set(authTag, ciphertext.length);

  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
      key,
      combined
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch {
    throw new Error('Decryption failed: invalid password or corrupted data');
  }
}
