import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { generateToken, verifyToken } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, displayName, role, companyCode } = req.body;
    if (!email || !password || !displayName) {
      return res.status(400).json({ error: 'Email, password, and display name are required' });
    }

    const [existing] = await db('users').where({ email });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    let company = companyCode
      ? await db('companies').where({ code: companyCode }).first()
      : await db('companies').first();

    if (!company) {
      const [companyId] = await db('companies').insert({
        name: 'Default Company',
        code: 'DEFAULT',
        currency: 'USD',
        timezone: 'UTC',
        is_active: true,
      });
      company = await db('companies').where({ id: companyId }).first();
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [id] = await db('users').insert({
      email,
      password_hash: passwordHash,
      display_name: displayName,
      role: role || 'employee',
      default_company_id: company.id,
    });

    await db('user_companies').insert({
      user_id: id,
      company_id: company.id,
      is_default: true,
    });

    if (role) {
      const roleRow = await db('roles').where({ company_id: company.id, name: role }).first();
      if (roleRow) {
        await db('user_roles').insert({ user_id: id, role_id: roleRow.id, company_id: company.id });
      }
    }

    const token = generateToken({
      id,
      email,
      role: role || 'employee',
      roles: role ? [role] : [],
      companyId: company.id,
      isSuperAdmin: false,
    });
    res.status(201).json({
      token,
      user: { id, email, displayName, role: role || 'employee', companyId: company.id },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const user = await db('users').where({ email, is_active: true }).first();
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const roles = await db('user_roles')
      .join('roles', 'user_roles.role_id', 'roles.id')
      .where('user_roles.user_id', user.id)
      .andWhere('user_roles.company_id', user.default_company_id || 1)
      .select('roles.name');

    const token = generateToken({
      ...user,
      roles: roles.map((r) => r.name),
      companyId: user.default_company_id || 1,
      isSuperAdmin: user.is_super_admin,
    });
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        photoURL: user.photo_url,
        role: user.role,
        companyId: user.default_company_id || 1,
        roles: roles.map((r) => r.name),
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await db('users').where({ id: req.user.id }).first();
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      photoURL: user.photo_url,
      role: user.role,
      createdAt: user.created_at,
    });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
