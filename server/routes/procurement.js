import { Router } from 'express';
import db from '../db.js';
import { verifyToken, requirePermission } from '../middleware/auth.js';
import { recalcPurchaseOrderTotal, createGoodsReceipt } from '../services/procurement.js';
import { logAudit, logStatusChange } from '../services/audit.js';
import { assertWorkflowTransition } from '../services/workflow.js';

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
      status: 'draft',
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
    await logStatusChange({ companyId: req.companyId, refType: 'purchase_request', refId: id, fromStatus: null, toStatus: 'draft', userId: req.user.id });
    res.status(201).json(row);
  } catch (err) {
    console.error('POST /procurement/purchase-requests error:', err);
    res.status(500).json({ error: 'Failed to create purchase request' });
  }
});

router.put('/purchase-requests/:id/submit', verifyToken, requirePermission('procurement', 'create'), async (req, res) => {
  try {
    const existing = await db('purchase_requests').where({ id: req.params.id, company_id: req.companyId }).first();
    if (!existing) return res.status(404).json({ error: 'Purchase request not found' });

    await assertWorkflowTransition({
      module: 'purchase_request',
      fromStatus: existing.status,
      toStatus: 'submitted',
      action: 'submit',
      user: req.user,
    });

    await db('purchase_requests').where({ id: req.params.id }).update({ status: 'submitted', updated_at: db.fn.now() });
    await logStatusChange({ companyId: req.companyId, refType: 'purchase_request', refId: req.params.id, fromStatus: existing.status, toStatus: 'submitted', userId: req.user.id });
    res.json({ message: 'Purchase request submitted' });
  } catch (err) {
    console.error('PUT /procurement/purchase-requests/:id/submit error:', err);
    res.status(500).json({ error: err.message || 'Failed to submit purchase request' });
  }
});

router.put('/purchase-requests/:id/approve', verifyToken, requirePermission('procurement', 'approve'), async (req, res) => {
  try {
    const existing = await db('purchase_requests').where({ id: req.params.id, company_id: req.companyId }).first();
    if (!existing) return res.status(404).json({ error: 'Purchase request not found' });

    await assertWorkflowTransition({
      module: 'purchase_request',
      fromStatus: existing.status,
      toStatus: 'approved',
      action: 'approve',
      user: req.user,
    });

    await db('purchase_requests').where({ id: req.params.id }).update({ status: 'approved', updated_at: db.fn.now() });
    await logStatusChange({ companyId: req.companyId, refType: 'purchase_request', refId: req.params.id, fromStatus: existing.status, toStatus: 'approved', userId: req.user.id });
    res.json({ message: 'Purchase request approved' });
  } catch (err) {
    console.error('PUT /procurement/purchase-requests/:id/approve error:', err);
    res.status(500).json({ error: 'Failed to approve purchase request' });
  }
});

router.put('/purchase-requests/:id/reject', verifyToken, requirePermission('procurement', 'approve'), async (req, res) => {
  try {
    const existing = await db('purchase_requests').where({ id: req.params.id, company_id: req.companyId }).first();
    if (!existing) return res.status(404).json({ error: 'Purchase request not found' });

    await assertWorkflowTransition({
      module: 'purchase_request',
      fromStatus: existing.status,
      toStatus: 'rejected',
      action: 'reject',
      user: req.user,
    });

    await db('purchase_requests').where({ id: req.params.id }).update({ status: 'rejected', updated_at: db.fn.now() });
    await logStatusChange({ companyId: req.companyId, refType: 'purchase_request', refId: req.params.id, fromStatus: existing.status, toStatus: 'rejected', userId: req.user.id });
    res.json({ message: 'Purchase request rejected' });
  } catch (err) {
    console.error('PUT /procurement/purchase-requests/:id/reject error:', err);
    res.status(500).json({ error: err.message || 'Failed to reject purchase request' });
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

router.get('/purchase-orders/:id/lines', verifyToken, requirePermission('procurement', 'read'), async (req, res) => {
  try {
    const order = await db('purchase_orders').where({ id: req.params.id, company_id: req.companyId }).first();
    if (!order) return res.status(404).json({ error: 'Purchase order not found' });

    const lines = await db('purchase_order_lines')
      .where({ purchase_order_id: order.id })
      .leftJoin('products', 'purchase_order_lines.product_id', 'products.id')
      .select(
        'purchase_order_lines.id',
        'purchase_order_lines.product_id',
        'purchase_order_lines.quantity',
        'purchase_order_lines.received_qty',
        'purchase_order_lines.unit_price',
        'products.name as product_name',
        'products.sku'
      )
      .select(db.raw('purchase_order_lines.quantity - purchase_order_lines.received_qty as pending_qty'));

    res.json(lines);
  } catch (err) {
    console.error('GET /procurement/purchase-orders/:id/lines error:', err);
    res.status(500).json({ error: 'Failed to fetch purchase order lines' });
  }
});

router.post('/purchase-orders', verifyToken, requirePermission('procurement', 'create'), async (req, res) => {
  try {
    const { supplierId, currency, lines } = req.body;
    if (!supplierId) return res.status(400).json({ error: 'supplierId is required' });

    const [id] = await db('purchase_orders').insert({
      company_id: req.companyId,
      supplier_id: supplierId,
      status: 'draft',
      currency: currency || 'USD',
      requested_by: req.user.id,
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
    await logStatusChange({ companyId: req.companyId, refType: 'purchase_order', refId: id, fromStatus: null, toStatus: 'draft', userId: req.user.id });
    res.status(201).json(row);
  } catch (err) {
    console.error('POST /procurement/purchase-orders error:', err);
    res.status(500).json({ error: 'Failed to create purchase order' });
  }
});

router.put('/purchase-orders/:id/approve', verifyToken, requirePermission('procurement', 'approve'), async (req, res) => {
  try {
    const existing = await db('purchase_orders').where({ id: req.params.id, company_id: req.companyId }).first();
    if (!existing) return res.status(404).json({ error: 'Purchase order not found' });

    await assertWorkflowTransition({
      module: 'purchase_order',
      fromStatus: existing.status,
      toStatus: 'approved',
      action: 'approve',
      user: req.user,
    });

    await db('purchase_orders').where({ id: req.params.id }).update({
      status: 'approved',
      approved_by: req.user.id,
      updated_at: db.fn.now(),
    });

    await logStatusChange({ companyId: req.companyId, refType: 'purchase_order', refId: req.params.id, fromStatus: existing.status, toStatus: 'approved', userId: req.user.id });
    res.json({ message: 'Purchase order approved' });
  } catch (err) {
    console.error('PUT /procurement/purchase-orders/:id/approve error:', err);
    res.status(500).json({ error: err.message || 'Failed to approve purchase order' });
  }
});

router.put('/purchase-orders/:id/order', verifyToken, requirePermission('procurement', 'approve'), async (req, res) => {
  try {
    const existing = await db('purchase_orders').where({ id: req.params.id, company_id: req.companyId }).first();
    if (!existing) return res.status(404).json({ error: 'Purchase order not found' });

    await assertWorkflowTransition({
      module: 'purchase_order',
      fromStatus: existing.status,
      toStatus: 'ordered',
      action: 'order',
      user: req.user,
    });

    await db('purchase_orders').where({ id: req.params.id }).update({
      status: 'ordered',
      ordered_at: db.fn.now(),
      updated_at: db.fn.now(),
    });

    await logStatusChange({ companyId: req.companyId, refType: 'purchase_order', refId: req.params.id, fromStatus: existing.status, toStatus: 'ordered', userId: req.user.id });
    res.json({ message: 'Purchase order marked as ordered' });
  } catch (err) {
    console.error('PUT /procurement/purchase-orders/:id/order error:', err);
    res.status(500).json({ error: err.message || 'Failed to mark purchase order as ordered' });
  }
});

router.put('/purchase-orders/:id/cancel', verifyToken, requirePermission('procurement', 'approve'), async (req, res) => {
  try {
    const existing = await db('purchase_orders').where({ id: req.params.id, company_id: req.companyId }).first();
    if (!existing) return res.status(404).json({ error: 'Purchase order not found' });

    await assertWorkflowTransition({
      module: 'purchase_order',
      fromStatus: existing.status,
      toStatus: 'cancelled',
      action: 'cancel',
      user: req.user,
    });

    await db('purchase_orders').where({ id: req.params.id }).update({
      status: 'cancelled',
      updated_at: db.fn.now(),
    });

    await logStatusChange({ companyId: req.companyId, refType: 'purchase_order', refId: req.params.id, fromStatus: existing.status, toStatus: 'cancelled', userId: req.user.id });
    res.json({ message: 'Purchase order cancelled' });
  } catch (err) {
    console.error('PUT /procurement/purchase-orders/:id/cancel error:', err);
    res.status(500).json({ error: err.message || 'Failed to cancel purchase order' });
  }
});

router.post('/goods-receipts', verifyToken, requirePermission('procurement', 'receive'), async (req, res) => {
  try {
    const { purchaseOrderId, warehouseId, lines } = req.body;
    if (!purchaseOrderId || !warehouseId) {
      return res.status(400).json({ error: 'purchaseOrderId and warehouseId are required' });
    }

    const purchaseOrder = await db('purchase_orders').where({ id: purchaseOrderId, company_id: req.companyId }).first();
    if (!purchaseOrder) return res.status(404).json({ error: 'Purchase order not found' });

    await assertWorkflowTransition({
      module: 'purchase_order',
      fromStatus: purchaseOrder.status,
      toStatus: 'received',
      action: 'receive',
      user: req.user,
    });

    const receipt = await createGoodsReceipt({
      companyId: req.companyId,
      purchaseOrderId,
      receivedBy: req.user.id,
      warehouseId,
      lines: lines || [],
    });

    const updatedOrder = await db('purchase_orders').where({ id: purchaseOrderId }).first();
    if (updatedOrder && updatedOrder.status !== purchaseOrder.status && updatedOrder.status === 'received') {
      await logStatusChange({
        companyId: req.companyId,
        refType: 'purchase_order',
        refId: purchaseOrderId,
        fromStatus: purchaseOrder.status,
        toStatus: 'received',
        userId: req.user.id,
      });
    }

    res.status(201).json(receipt);
  } catch (err) {
    console.error('POST /procurement/goods-receipts error:', err);
    res.status(500).json({ error: err.message || 'Failed to receive goods' });
  }
});

export default router;
