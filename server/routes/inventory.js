import { Router } from 'express';
import db from '../db.js';
import { verifyToken, requirePermission } from '../middleware/auth.js';
import { postStockMove } from '../services/inventory.js';
import { logAudit } from '../services/audit.js';

const router = Router();

router.get('/products', verifyToken, requirePermission('inventory', 'read'), async (req, res) => {
  try {
    const rows = await db('products').where({ company_id: req.companyId }).orderBy('name');
    res.json(rows);
  } catch (err) {
    console.error('GET /inventory/products error:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.post('/products', verifyToken, requirePermission('inventory', 'create'), async (req, res) => {
  try {
    const { sku, name, description, uom, cost, price } = req.body;
    if (!sku || !name) return res.status(400).json({ error: 'sku and name are required' });

    const [id] = await db('products').insert({
      company_id: req.companyId,
      sku,
      name,
      description: description || null,
      uom: uom || 'unit',
      cost: cost || 0,
      price: price || 0,
    });

    const row = await db('products').where({ id }).first();
    await logAudit({ companyId: req.companyId, userId: req.user.id, action: 'create', tableName: 'products', recordId: id, newData: row });
    res.status(201).json(row);
  } catch (err) {
    console.error('POST /inventory/products error:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

router.put('/products/:id', verifyToken, requirePermission('inventory', 'update'), async (req, res) => {
  try {
    const existing = await db('products').where({ id: req.params.id, company_id: req.companyId }).first();
    if (!existing) return res.status(404).json({ error: 'Product not found' });

    const { name, description, uom, cost, price, status } = req.body;
    await db('products').where({ id: req.params.id }).update({
      name: name || existing.name,
      description: description || existing.description,
      uom: uom || existing.uom,
      cost: cost ?? existing.cost,
      price: price ?? existing.price,
      status: status || existing.status,
      updated_at: db.fn.now(),
    });

    const row = await db('products').where({ id: req.params.id }).first();
    await logAudit({ companyId: req.companyId, userId: req.user.id, action: 'update', tableName: 'products', recordId: req.params.id, oldData: existing, newData: row });
    res.json(row);
  } catch (err) {
    console.error('PUT /inventory/products error:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

router.get('/warehouses', verifyToken, requirePermission('inventory', 'read'), async (req, res) => {
  try {
    const rows = await db('warehouses').where({ company_id: req.companyId }).orderBy('name');
    res.json(rows);
  } catch (err) {
    console.error('GET /inventory/warehouses error:', err);
    res.status(500).json({ error: 'Failed to fetch warehouses' });
  }
});

router.post('/warehouses', verifyToken, requirePermission('inventory', 'create'), async (req, res) => {
  try {
    const { name, location, isDefault } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    if (isDefault) {
      await db('warehouses').where({ company_id: req.companyId }).update({ is_default: false });
    }

    const [id] = await db('warehouses').insert({
      company_id: req.companyId,
      name,
      location: location || null,
      is_default: Boolean(isDefault),
    });

    const row = await db('warehouses').where({ id }).first();
    res.status(201).json(row);
  } catch (err) {
    console.error('POST /inventory/warehouses error:', err);
    res.status(500).json({ error: 'Failed to create warehouse' });
  }
});

router.get('/levels', verifyToken, requirePermission('inventory', 'read'), async (req, res) => {
  try {
    const rows = await db('inventory_levels')
      .where({ 'inventory_levels.company_id': req.companyId })
      .leftJoin('products', 'inventory_levels.product_id', 'products.id')
      .leftJoin('warehouses', 'inventory_levels.warehouse_id', 'warehouses.id')
      .select('inventory_levels.*', 'products.sku', 'products.name as product_name', 'warehouses.name as warehouse_name');
    res.json(rows);
  } catch (err) {
    console.error('GET /inventory/levels error:', err);
    res.status(500).json({ error: 'Failed to fetch inventory levels' });
  }
});

router.post('/stock-moves', verifyToken, requirePermission('inventory', 'create'), async (req, res) => {
  try {
    const { productId, fromWarehouseId, toWarehouseId, quantity, moveType, refType, refId } = req.body;
    if (!productId || !quantity || !moveType) {
      return res.status(400).json({ error: 'productId, quantity, and moveType are required' });
    }

    const move = await postStockMove({
      companyId: req.companyId,
      productId,
      fromWarehouseId,
      toWarehouseId,
      quantity,
      moveType,
      refType,
      refId,
      createdBy: req.user.id,
    });

    res.status(201).json(move);
  } catch (err) {
    console.error('POST /inventory/stock-moves error:', err);
    res.status(500).json({ error: err.message || 'Failed to post stock move' });
  }
});

export default router;
