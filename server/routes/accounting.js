import { Router } from 'express';
import db from '../db.js';
import { verifyToken, requirePermission } from '../middleware/auth.js';

const router = Router();

router.get('/accounts', verifyToken, requirePermission('accounting', 'read'), async (req, res) => {
  try {
    const rows = await db('gl_accounts').where({ company_id: req.companyId }).orderBy('code');
    res.json(rows);
  } catch (err) {
    console.error('GET /accounting/accounts error:', err);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

router.post('/accounts', verifyToken, requirePermission('accounting', 'create'), async (req, res) => {
  try {
    const { code, name, type } = req.body;
    if (!code || !name || !type) {
      return res.status(400).json({ error: 'code, name, and type are required' });
    }

    const [id] = await db('gl_accounts').insert({
      company_id: req.companyId,
      code,
      name,
      type,
      is_active: true,
    });
    const row = await db('gl_accounts').where({ id }).first();
    res.status(201).json(row);
  } catch (err) {
    console.error('POST /accounting/accounts error:', err);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

router.get('/journals', verifyToken, requirePermission('accounting', 'read'), async (req, res) => {
  try {
    const rows = await db('journal_entries').where({ company_id: req.companyId }).orderBy('entry_date', 'desc');
    res.json(rows);
  } catch (err) {
    console.error('GET /accounting/journals error:', err);
    res.status(500).json({ error: 'Failed to fetch journal entries' });
  }
});

router.post('/journals', verifyToken, requirePermission('accounting', 'create'), async (req, res) => {
  try {
    const { entryDate, refType, refId, lines } = req.body;
    if (!entryDate || !Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ error: 'entryDate and lines are required' });
    }

    const totals = lines.reduce(
      (acc, line) => {
        acc.debit += Number(line.debit || 0);
        acc.credit += Number(line.credit || 0);
        return acc;
      },
      { debit: 0, credit: 0 }
    );

    if (Number(totals.debit.toFixed(2)) !== Number(totals.credit.toFixed(2))) {
      return res.status(400).json({ error: 'Journal entry must balance (debit = credit)' });
    }

    const [entryId] = await db('journal_entries').insert({
      company_id: req.companyId,
      entry_date: entryDate,
      ref_type: refType || null,
      ref_id: refId || null,
      status: 'posted',
    });

    for (const line of lines) {
      // eslint-disable-next-line no-await-in-loop
      await db('journal_lines').insert({
        journal_entry_id: entryId,
        account_id: line.accountId,
        debit: line.debit || 0,
        credit: line.credit || 0,
      });
    }

    const entry = await db('journal_entries').where({ id: entryId }).first();
    res.status(201).json(entry);
  } catch (err) {
    console.error('POST /accounting/journals error:', err);
    res.status(500).json({ error: 'Failed to create journal entry' });
  }
});

export default router;
