import {
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

export async function verifyPassword(password, storedHash) {
  const [salt, storedKey] = storedHash.split(':');
  if (!salt || !storedKey) return false;
  const expected = Buffer.from(storedKey, 'hex');
  const actual = await scrypt(password, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function createToken(user, secret) {
  const now = Math.floor(Date.now() / 1000);
  const header = encode({ alg: 'HS256', typ: 'JWT' });
  const payload = encode({ sub: user.id, role: user.role, iat: now, exp: now + 60 * 60 * 24 * 7 });
  const signature = createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

export function verifyToken(token, secret) {
  const [header, payload, signature] = token.split('.');
  if (!header || !payload || !signature) throw new Error('Invalid token');
  const expected = createHmac('sha256', secret).update(`${header}.${payload}`).digest();
  const actual = Buffer.from(signature, 'base64url');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new Error('Invalid token');
  }
  const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  if (claims.exp <= Math.floor(Date.now() / 1000)) throw new Error('Expired token');
  return claims;
}

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}
