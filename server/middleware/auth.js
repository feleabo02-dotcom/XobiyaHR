import jwt from 'jsonwebtoken';
import db from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'xobiya-hr-secret-change-in-production';

export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      roles: user.roles || [],
      companyId: user.companyId || null,
      isSuperAdmin: user.isSuperAdmin || false,
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export function verifyToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    req.companyId = decoded.companyId || null;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    const roleList = new Set([req.user.role, ...(req.user.roles || [])].filter(Boolean));
    if (!roles.some((role) => roleList.has(role))) {
      return res.status(403).json({ error: 'Insufficient permissions. Required: ' + roles.join(', ') });
    }
    next();
  };
}

export function requirePermission(moduleName, action) {
  return async (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (req.user.isSuperAdmin) return next();

    const permission = await db('permissions')
      .where({ module: moduleName, action, scope: 'company' })
      .first();

    if (!permission) {
      return res.status(403).json({ error: 'Permission not configured' });
    }

    const hasPermission = await db('user_roles')
      .join('role_permissions', 'user_roles.role_id', 'role_permissions.role_id')
      .where('user_roles.user_id', req.user.id)
      .andWhere('user_roles.company_id', req.companyId)
      .andWhere('role_permissions.permission_id', permission.id)
      .first();

    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}
