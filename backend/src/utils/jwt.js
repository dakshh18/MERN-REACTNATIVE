import crypto from 'crypto';
import { ENV } from '../config/env.js';

// Tiny self-contained HS256 JWT implementation. We avoid the `jsonwebtoken`
// dep — the only operations we need are sign + verify with a shared secret,
// and that's ~30 lines of Node crypto.
//
// Token payload: { sub: userId, iat, exp, kind: 'local' }
// Header is fixed to { alg: 'HS256', typ: 'JWT' }.

function base64url(input) {
    return Buffer.from(input)
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

function base64urlJSON(obj) {
    return base64url(JSON.stringify(obj));
}

function fromBase64url(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    return Buffer.from(str, 'base64');
}

function getSecret() {
    const secret = ENV.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not configured. Set it in backend/.env');
    }
    return secret;
}

export function signLocalJwt(userId, { ttlSeconds = 60 * 60 * 24 * 7 } = {}) {
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
        sub: String(userId),
        kind: 'local',
        iat: now,
        exp: now + ttlSeconds,
    };
    const headerB64 = base64urlJSON(header);
    const payloadB64 = base64urlJSON(payload);
    const data = `${headerB64}.${payloadB64}`;
    const sig = crypto
        .createHmac('sha256', getSecret())
        .update(data)
        .digest();
    return `${data}.${base64url(sig)}`;
}

export function verifyLocalJwt(token) {
    if (typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, sigB64] = parts;
    const data = `${headerB64}.${payloadB64}`;
    const expected = crypto
        .createHmac('sha256', getSecret())
        .update(data)
        .digest();
    const provided = fromBase64url(sigB64);
    if (
        expected.length !== provided.length ||
        !crypto.timingSafeEqual(expected, provided)
    ) {
        return null;
    }
    let payload;
    try {
        payload = JSON.parse(fromBase64url(payloadB64).toString('utf8'));
    } catch {
        return null;
    }
    if (payload.kind !== 'local') return null;
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== 'number' || payload.exp < now) return null;
    return payload;
}
