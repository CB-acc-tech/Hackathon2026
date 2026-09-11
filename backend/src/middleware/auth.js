const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'rigmind_super_secret_jwt_key_2026_sih';

function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ error: 'Access token required' });
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
}

function requireRole(allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthenticated user' });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                error: `Forbidden: Requires one of [${allowedRoles.join(', ')}] role` 
            });
        }
        next();
    };
}

module.exports = {
    verifyToken,
    requireRole,
    JWT_SECRET
};
