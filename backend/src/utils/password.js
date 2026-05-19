import crypto from 'crypto';
import { promisify } from 'util';

// Password hashing using Node's built-in scrypt. We avoid bcrypt/argon2 deps
// to keep the install footprint small; scrypt is a memory-hard KDF and is the
// recommendation for password storage in the Node docs.
//
// Storage format: `scrypt$<N>$<r>$<p>$<saltHex>$<hashHex>` — version-tagged so
// we can rotate parameters in future without breaking old hashes.

const scrypt = promisify(crypto.scrypt);

// scrypt parameters. These match Node's default cost; tune up if you have
// CPU budget and want stronger hashes. Keep `keylen` >= 32.
const N = 16384;
const r = 8;
const p = 1;
const KEYLEN = 64;

export async function hashPassword(plain) {
    if (typeof plain !== 'string' || plain.length === 0) {
        throw new Error('hashPassword: password must be a non-empty string');
    }
    const salt = crypto.randomBytes(16);
    const hash = await scrypt(plain, salt, KEYLEN, { N, r, p });
    return `scrypt$${N}$${r}$${p}$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export async function verifyPassword(plain, stored) {
    if (typeof stored !== 'string' || !stored.startsWith('scrypt$')) {
        return false;
    }
    const parts = stored.split('$');
    if (parts.length !== 6) return false;
    const [, nStr, rStr, pStr, saltHex, hashHex] = parts;
    const params = { N: Number(nStr), r: Number(rStr), p: Number(pStr) };
    const salt = Buffer.from(saltHex, 'hex');
    const expected = Buffer.from(hashHex, 'hex');
    const actual = await scrypt(plain, salt, expected.length, params);
    // Constant-time compare to avoid timing attacks.
    return (
        expected.length === actual.length &&
        crypto.timingSafeEqual(expected, actual)
    );
}
