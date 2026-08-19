export function generateNonce(): string {
  return crypto.randomUUID().replace(/-/g, '').substring(0, 32);
}

export function validateOrigin(origin: string, allowed: string[]): boolean {
  return allowed.includes(origin);
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password) as BufferSource,
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptLocalStorage(key: string, data: unknown, password: string): Promise<void> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const derivedKey = await deriveKey(password, salt);

  const plaintext = encoder.encode(JSON.stringify(data));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    derivedKey,
    plaintext as BufferSource
  );

  const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length);

  localStorage.setItem(key, btoa(String.fromCharCode(...combined)));
}

export async function decryptLocalStorage(key: string, password: string): Promise<unknown> {
  const stored = localStorage.getItem(key);
  if (!stored) return null;

  const combined = Uint8Array.from(atob(stored), (c) => c.charCodeAt(0));
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const ciphertext = combined.slice(28);

  const derivedKey = await deriveKey(password, salt);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    derivedKey,
    ciphertext as BufferSource
  );

  const decoder = new TextDecoder();
  return JSON.parse(decoder.decode(plaintext));
}

export function isSecureContext(): boolean {
  if (typeof window === 'undefined') return false;
  return window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost';
}

const SENSITIVE_FIELDS = ['password', 'token', 'dni', 'email', 'refreshToken', 'accessToken', 'authorization', 'secret', 'apiKey'];

export function sanitizeForLog(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitizeForLog);
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = SENSITIVE_FIELDS.some((field) => lowerKey.includes(field));
    sanitized[key] = isSensitive ? '[REDACTED]' : sanitizeForLog(value);
  }
  return sanitized;
}
