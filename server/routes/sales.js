import { Router } from 'express';
import db from '../db.js';
import { verifyToken, requirePermission } from '../middleware/auth.js';
import { confirmSalesOrder, recalcQuotationTotal, recalcSalesOrderTotal, createInvoiceFromSalesOrder } from '../services/sales.js';
import { logAudit, logStatusChange } from '../services/audit.js';

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
    const { customerId, currency, lines } = req.body;
    if (!customerId) return res.status(400).json({ error: 'customerId is required' });

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
      fromStatus: 'draft',
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
    const invoice = await createInvoiceFromSalesOrder({
      companyId: req.companyId,
      salesOrderId: req.params.id,
      dueDate: req.body.dueDate,
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

    await db('payments').insert({
      company_id: req.companyId,
      invoice_id: invoice.id,
      amount: invoice.total,
      method: req.body.method || 'bank',
      status: 'paid',
      paid_at: new Date(),
    });

    await db('invoices').where({ id: invoice.id }).update({ status: 'paid' });
    res.json({ message: 'Invoice marked as paid' });
  } catch (err) {
    console.error('POST /sales/invoices/:id/pay error:', err);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

export default router;
