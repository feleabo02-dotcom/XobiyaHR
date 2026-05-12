import { Router } from 'express';
import db from '../db.js';
import { verifyToken, requirePermission } from '../middleware/auth.js';
import { confirmSalesOrder, recalcQuotationTotal, recalcSalesOrderTotal, createInvoiceFromSalesOrder } from '../services/sales.js';
import { logAudit, logStatusChange } from '../services/audit.js';
import { assertWorkflowTransition } from '../services/workflow.js';

const router = Router();

router.get('/customers', verifyToken, requirePermission('sales', 'read'), async (req, res) => {
  try {
    const rows = await db('customers').where({ company_id: req.companyId }).orderBy('name');
    res.json(rows);
  } catch (err) {
    console.error('GET /sales/customers error:', err);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

router.post('/customers', verifyToken, requirePermission('sales', 'create'), async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const [id] = await db('customers').insert({
      company_id: req.companyId,
      name,
      email: email || null,
      phone: phone || null,
    });
    const row = await db('customers').where({ id }).first();
    res.status(201).json(row);
  } catch (err) {
    console.error('POST /sales/customers error:', err);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

router.get('/leads', verifyToken, requirePermission('crm', 'read'), async (req, res) => {
  try {
    const rows = await db('leads').where({ company_id: req.companyId }).orderBy('created_at', 'desc');
    res.json(rows);
  } catch (err) {
    console.error('GET /sales/leads error:', err);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

router.post('/leads', verifyToken, requirePermission('crm', 'create'), async (req, res) => {
  try {
    const { source, expectedValue } = req.body;
    const [id] = await db('leads').insert({
      company_id: req.companyId,
      source: source || null,
      expected_value: expectedValue || 0,
      status: 'new',
      owner_id: req.user.id,
    });
    const row = await db('leads').where({ id }).first();
    res.status(201).json(row);
  } catch (err) {
    console.error('POST /sales/leads error:', err);
    res.status(500).json({ error: 'Failed to create lead' });
  }
});

router.get('/quotations', verifyToken, requirePermission('sales', 'read'), async (req, res) => {
  try {
    const rows = await db('quotations').where({ company_id: req.companyId }).orderBy('created_at', 'desc');
    res.json(rows);
  } catch (err) {
    console.error('GET /sales/quotations error:', err);
    res.status(500).json({ error: 'Failed to fetch quotations' });
  }
});

router.post('/quotations', verifyToken, requirePermission('sales', 'create'), async (req, res) => {
  try {
    const { customerId, currency, lines } = req.body;
    if (!customerId) return res.status(400).json({ error: 'customerId is required' });

    const [id] = await db('quotations').insert({
      company_id: req.companyId,
      customer_id: customerId,
      currency: currency || 'USD',
      status: 'draft',
    });

    for (const line of lines || []) {
      // eslint-disable-next-line no-await-in-loop
      await db('quotation_lines').insert({
        quotation_id: id,
        product_id: line.productId,
        quantity: line.quantity,
        unit_price: line.unitPrice,
      });
    }

    await recalcQuotationTotal(id);
    const row = await db('quotations').where({ id }).first();
    res.status(201).json(row);
  } catch (err) {
    console.error('POST /sales/quotations error:', err);
    res.status(500).json({ error: 'Failed to create quotation' });
  }
});

router.get('/orders', verifyToken, requirePermission('sales', 'read'), async (req, res) => {
  try {
    const rows = await db('sales_orders').where({ company_id: req.companyId }).orderBy('created_at', 'desc');
    res.json(rows);
  } catch (err) {
    console.error('GET /sales/orders error:', err);
    res.status(500).json({ error: 'Failed to fetch sales orders' });
  }
});

router.post('/orders', verifyToken, requirePermission('sales', 'create'), async (req, res) => {
  try {
    const { customerId, currency, lines, status } = req.body;
    if (!customerId) return res.status(400).json({ error: 'customerId is required' });
    if (status && status !== 'draft') {
      return res.status(400).json({ error: 'Sales order status must start as draft' });
    }

    const [id] = await db('sales_orders').insert({
      company_id: req.companyId,
      customer_id: customerId,
      currency: currency || 'USD',
      status: 'draft',
    });

    for (const line of lines || []) {
      // eslint-disable-next-line no-await-in-loop
      await db('sales_order_lines').insert({
        sales_order_id: id,
        product_id: line.productId,
        quantity: line.quantity,
        unit_price: line.unitPrice,
      });
    }

    await recalcSalesOrderTotal(id);
    const row = await db('sales_orders').where({ id }).first();
    res.status(201).json(row);
  } catch (err) {
    console.error('POST /sales/orders error:', err);
    res.status(500).json({ error: 'Failed to create sales order' });
  }
});

router.post('/orders/:id/confirm', verifyToken, requirePermission('sales', 'approve'), async (req, res) => {
  try {
    const existing = await db('sales_orders').where({ id: req.params.id, company_id: req.companyId }).first();
    if (!existing) return res.status(404).json({ error: 'Sales order not found' });

    await assertWorkflowTransition({
      module: 'sales_order',
      fromStatus: existing.status,
      toStatus: 'confirmed',
      action: 'confirm',
      user: req.user,
    });

    const order = await confirmSalesOrder({
      companyId: req.companyId,
      salesOrderId: req.params.id,
      warehouseId: req.body.warehouseId,
      approvedBy: req.user.id,
    });

    await logStatusChange({
      companyId: req.companyId,
      refType: 'sales_order',
      refId: req.params.id,
      fromStatus: existing.status,
      toStatus: 'confirmed',
      userId: req.user.id,
    });

    res.json(order);
  } catch (err) {
    console.error('POST /sales/orders/:id/confirm error:', err);
    res.status(500).json({ error: err.message || 'Failed to confirm sales order' });
  }
});

router.post('/orders/:id/invoice', verifyToken, requirePermission('accounting', 'create'), async (req, res) => {
  try {
    const order = await db('sales_orders').where({ id: req.params.id, company_id: req.companyId }).first();
    if (!order) return res.status(404).json({ error: 'Sales order not found' });
    if (order.status !== 'confirmed') return res.status(400).json({ error: 'Sales order must be confirmed before invoicing' });

    await assertWorkflowTransition({
      module: 'invoice',
      fromStatus: 'draft',
      toStatus: 'issued',
      action: 'issue',
      user: req.user,
    });

    const invoice = await createInvoiceFromSalesOrder({
      companyId: req.companyId,
      salesOrderId: req.params.id,
      dueDate: req.body.dueDate,
    });

    await logStatusChange({
      companyId: req.companyId,
      refType: 'invoice',
      refId: invoice.id,
      fromStatus: 'draft',
      toStatus: 'issued',
      userId: req.user.id,
    });

    res.status(201).json(invoice);
  } catch (err) {
    console.error('POST /sales/orders/:id/invoice error:', err);
    res.status(500).json({ error: err.message || 'Failed to create invoice' });
  }
});

router.get('/invoices', verifyToken, requirePermission('accounting', 'read'), async (req, res) => {
  try {
    const rows = await db('invoices').where({ company_id: req.companyId }).orderBy('created_at', 'desc');
    res.json(rows);
  } catch (err) {
    console.error('GET /sales/invoices error:', err);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

router.post('/invoices/:id/pay', verifyToken, requirePermission('accounting', 'update'), async (req, res) => {
  try {
    const invoice = await db('invoices').where({ id: req.params.id, company_id: req.companyId }).first();
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    if (invoice.status !== 'issued') return res.status(400).json({ error: 'Only issued invoices can be paid' });

    await assertWorkflowTransition({
      module: 'invoice',
      fromStatus: invoice.status,
      toStatus: 'paid',
      action: 'pay',
      user: req.user,
    });

    await db('payments').insert({
      company_id: req.companyId,
      invoice_id: invoice.id,
      amount: invoice.total,
      method: req.body.method || 'bank',
      status: 'paid',
      paid_at: new Date(),
    });

    await db('invoices').where({ id: invoice.id }).update({ status: 'paid' });
    await logStatusChange({ companyId: req.companyId, refType: 'invoice', refId: invoice.id, fromStatus: 'issued', toStatus: 'paid', userId: req.user.id });
    res.json({ message: 'Invoice marked as paid' });
  } catch (err) {
    console.error('POST /sales/invoices/:id/pay error:', err);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

router.post('/invoices/:id/cancel', verifyToken, requirePermission('accounting', 'update'), async (req, res) => {
  try {
    const invoice = await db('invoices').where({ id: req.params.id, company_id: req.companyId }).first();
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    await assertWorkflowTransition({
      module: 'invoice',
      fromStatus: invoice.status,
      toStatus: 'cancelled',
      action: 'cancel',
      user: req.user,
    });

    await db('invoices').where({ id: invoice.id }).update({ status: 'cancelled', updated_at: db.fn.now() });
    await logStatusChange({ companyId: req.companyId, refType: 'invoice', refId: invoice.id, fromStatus: invoice.status, toStatus: 'cancelled', userId: req.user.id });
    res.json({ message: 'Invoice cancelled' });
  } catch (err) {
    console.error('POST /sales/invoices/:id/cancel error:', err);
    res.status(500).json({ error: err.message || 'Failed to cancel invoice' });
  }
});

router.post('/orders/:id/fulfill', verifyToken, requirePermission('sales', 'update'), async (req, res) => {
  try {
    const order = await db('sales_orders').where({ id: req.params.id, company_id: req.companyId }).first();
    if (!order) return res.status(404).json({ error: 'Sales order not found' });

    await assertWorkflowTransition({
      module: 'sales_order',
      fromStatus: order.status,
      toStatus: 'fulfilled',
      action: 'fulfill',
      user: req.user,
    });

    await db('sales_orders').where({ id: order.id }).update({ status: 'fulfilled', updated_at: db.fn.now() });
    await logStatusChange({ companyId: req.companyId, refType: 'sales_order', refId: order.id, fromStatus: order.status, toStatus: 'fulfilled', userId: req.user.id });
    res.json({ message: 'Sales order fulfilled' });
  } catch (err) {
    console.error('POST /sales/orders/:id/fulfill error:', err);
    res.status(500).json({ error: err.message || 'Failed to fulfill sales order' });
  }
});

router.post('/orders/:id/cancel', verifyToken, requirePermission('sales', 'update'), async (req, res) => {
  try {
    const order = await db('sales_orders').where({ id: req.params.id, company_id: req.companyId }).first();
    if (!order) return res.status(404).json({ error: 'Sales order not found' });

    await assertWorkflowTransition({
      module: 'sales_order',
      fromStatus: order.status,
      toStatus: 'cancelled',
      action: 'cancel',
      user: req.user,
    });

    await db('sales_orders').where({ id: order.id }).update({ status: 'cancelled', updated_at: db.fn.now() });
    await logStatusChange({ companyId: req.companyId, refType: 'sales_order', refId: order.id, fromStatus: order.status, toStatus: 'cancelled', userId: req.user.id });
    res.json({ message: 'Sales order cancelled' });
  } catch (err) {
    console.error('POST /sales/orders/:id/cancel error:', err);
    res.status(500).json({ error: err.message || 'Failed to cancel sales order' });
  }
});

export default router;
