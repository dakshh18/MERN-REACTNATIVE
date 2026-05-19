import { verifyLocalJwt } from '../utils/jwt.js';
import { User } from '../models/user.model.js';

// Extracts a Bearer token from Authorization. Mobile clients (axios) and the
// admin SPA both send it that way.
function getBearer(req) {
    const h = req.headers?.authorization || '';
    if (!h.startsWith('Bearer ')) return null;
    return h.slice('Bearer '.length).trim() || null;
}

// Hard-requires a valid local JWT. Used for endpoints that only locally-
// registered users should hit (e.g. /api/auth/me).
export const requireLocalAuth = async (req, res, next) => {
    try {
        const token = getBearer(req);
        if (!token) return res.status(401).json({ message: 'Unauthorized' });
        const payload = verifyLocalJwt(token);
        if (!payload) return res.status(401).json({ message: 'Unauthorized' });
        const user = await User.findById(payload.sub);
        if (!user) return res.status(401).json({ message: 'Unauthorized' });
        req.user = user;
        req.authKind = 'local';
        return next();
    } catch (err) {
        console.error('Error in requireLocalAuth:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Soft variant: if a local JWT is present and valid, attach `req.user` and
// move on; otherwise pass through (the next middleware — typically Clerk's
// protectRoute — will get a chance to authenticate). Lets endpoints accept
// EITHER auth method without changing their handler code.
export const tryLocalAuth = async (req, _res, next) => {
    const token = getBearer(req);
    if (!token) return next();
    const payload = verifyLocalJwt(token);
    if (!payload) return next();
    const user = await User.findById(payload.sub);
    if (!user) return next();
    req.user = user;
    req.authKind = 'local';
    return next();
};
