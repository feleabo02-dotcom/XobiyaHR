import { Router } from 'express';
import db from '../db.js';
import { verifyToken, requirePermission } from '../middleware/auth.js';
import { recalcPurchaseOrderTotal, createGoodsReceipt } from '../services/procurement.js';
import { logAudit, logStatusChange } from '../services/audit.js';

const router = Router();

router.get('/suppliers', verifyToken, requirePermission('procurement', 'read'), async (req, res) => {
  try {
    const rows = await db('suppliers').where({ company_id: req.companyId }).orderBy('name');
    res.json(rows);
  } catch (err) {
    console.error('GET /procurement/suppliers error:', err);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

router.post('/suppliers', verifyToken, requirePermission('procurement', 'create'), async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const [id] = await db('suppliers').insert({
      company_id: req.companyId,
      name,
      email: email || null,
      phone: phone || null,
    });
    const row = await db('suppliers').where({ id }).first();
    res.status(201).json(row);
  } catch (err) {
    console.error('POST /procurement/suppliers error:', err);
    res.status(500).json({ error: 'Failed to create supplier' });
  }
});

router.get('/purchase-requests', verifyToken, requirePermission('procurement', 'read'), async (req, res) => {
  try {
    const rows = await db('purchase_requests').where({ company_id: req.companyId }).orderBy('created_at', 'desc');
    res.json(rows);
  } catch (err) {
    console.error('GET /procurement/purchase-requests error:', err);
    res.status(500).json({ error: 'Failed to fetch purchase requests' });
  }
});

router.post('/purchase-requests', verifyToken, requirePermission('procurement', 'create'), async (req, res) => {
  try {
    const { reason, lines } = req.body;
    const [id] = await db('purchase_requests').insert({
      company_id: req.companyId,
      requester_id: req.user.id,
      reason: reason || null,
      status: 'submitted',
    });

    for (const line of lines || []) {
      // eslint-disable-next-line no-await-in-loop
      await db('purchase_request_lines').insert({
        purchase_request_id: id,
        product_id: line.productId,
        quantity: line.quantity,
        required_date: line.requiredDate || null,
      });
    }

    const row = await db('purchase_requests').where({ id }).first();
    await logAudit({ companyId: req.companyId, userId: req.user.id, action: 'create', tableName: 'purchase_requests', recordId: id, newData: row });
    res.status(201).json(row);
  } catch (err) {
    console.error('POST /procurement/purchase-requests error:', err);
    res.status(500).json({ error: 'Failed to create purchase request' });
  }
});

router.put('/purchase-requests/:id/approve', verifyToken, requirePermission('procurement', 'approve'), async (req, res) => {
  try {
    const existing = await db('purchase_requests').where({ id: req.params.id, company_id: req.companyId }).first();
    if (!existing) return res.status(404).json({ error: 'Purchase request not found' });

    await db('purchase_requests').where({ id: req.params.id }).update({ status: 'approved', updated_at: db.fn.now() });
    await logStatusChange({ companyId: req.companyId, refType: 'purchase_request', refId: req.params.id, fromStatus: existing.status, toStatus: 'approved', userId: req.user.id });
    res.json({ message: 'Purchase request approved' });
  } catch (err) {
    console.error('PUT /procurement/purchase-requests/:id/approve error:', err);
    res.status(500).json({ error: 'Failed to approve purchase request' });
  }
});

router.get('/purchase-orders', verifyToken, requirePermission('procurement', 'read'), async (req, res) => {
  try {
    const rows = await db('purchase_orders').where({ company_id: req.companyId }).orderBy('created_at', 'desc');
    res.json(rows);
  } catch (err) {
    console.error('GET /procurement/purchase-orders error:', err);
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
});

router.post('/purchase-orders', verifyToken, requirePermission('procurement', 'create'), async (req, res) => {
  try {
    const { supplierId, currency, lines } = req.body;
    if (!supplierId) return res.status(400).json({ error: 'supplierId is required' });

    const [id] = await db('purchase_orders').insert({
      company_id: req.companyId,
      supplier_id: supplierId,
      status: 'approved',
      currency: currency || 'USD',
      requested_by: req.user.id,
      approved_by: req.user.id,
    });

    for (const line of lines || []) {
      // eslint-disable-next-line no-await-in-loop
      await db('purchase_order_lines').insert({
        purchase_order_id: id,
        product_id: line.productId,
        quantity: line.quantity,
        unit_price: line.unitPrice,
      });
    }

    await recalcPurchaseOrderTotal(id);
    const row = await db('purchase_orders').where({ id }).first();
    res.status(201).json(row);
  } catch (err) {
    console.error('POST /procurement/purchase-orders error:', err);
    res.status(500).json({ error: 'Failed to create purchase order' });
  }
});

router.post('/goods-receipts', verifyToken, requirePermission('procurement', 'receive'), async (req, res) => {
  try {
    const { purchaseOrderId, warehouseId, lines } = req.body;
    if (!purchaseOrderId || !warehouseId) {
      return res.status(400).json({ error: 'purchaseOrderId and warehouseId are required' });
    }

    const receipt = await createGoodsReceipt({
      companyId: req.companyId,
      purchaseOrderId,
      receivedBy: req.user.id,
      warehouseId,
      lines: lines || [],
    });

    res.status(201).json(receipt);
  } catch (err) {
    console.error('POST /procurement/goods-receipts error:', err);
    res.status(500).json({ error: err.message || 'Failed to receive goods' });
  }
});

export default router;
