import db from '../db.js';
import { postStockMove } from './inventory.js';

export async function recalcSalesOrderTotal(salesOrderId) {
  const lines = await db('sales_order_lines')
    .where({ sales_order_id: salesOrderId })
    .select('quantity', 'unit_price');

  const total = lines.reduce((sum, line) => sum + Number(line.quantity) * Number(line.unit_price), 0);
  await db('sales_orders').where({ id: salesOrderId }).update({ total, updated_at: db.fn.now() });
  return total;
}

export async function recalcQuotationTotal(quotationId) {
  const lines = await db('quotation_lines')
    .where({ quotation_id: quotationId })
    .select('quantity', 'unit_price');

  const total = lines.reduce((sum, line) => sum + Number(line.quantity) * Number(line.unit_price), 0);
  await db('quotations').where({ id: quotationId }).update({ total, updated_at: db.fn.now() });
  return total;
}

export async function createInvoiceFromSalesOrder({ companyId, salesOrderId, dueDate }) {
  const order = await db('sales_orders').where({ id: salesOrderId, company_id: companyId }).first();
  if (!order) throw new Error('Sales order not found');

  const lines = await db('sales_order_lines').where({ sales_order_id: salesOrderId });
  const [invoiceId] = await db('invoices').insert({
    company_id: companyId,
    customer_id: order.customer_id,
    sales_order_id: salesOrderId,
    status: 'issued',
    total: order.total,
    currency: order.currency,
    due_date: dueDate || null,
  });

  for (const line of lines) {
    // eslint-disable-next-line no-await-in-loop
    await db('invoice_lines').insert({
      invoice_id: invoiceId,
      product_id: line.product_id,
      quantity: line.quantity,
      unit_price: line.unit_price,
    });
  }

  return db('invoices').where({ id: invoiceId }).first();
}

export async function confirmSalesOrder({ companyId, salesOrderId, warehouseId, approvedBy }) {
  const order = await db('sales_orders').where({ id: salesOrderId, company_id: companyId }).first();
  if (!order) throw new Error('Sales order not found');
  if (order.status !== 'draft') throw new Error('Sales order is not in draft status');

  const lines = await db('sales_order_lines').where({ sales_order_id: salesOrderId });
  if (lines.length === 0) throw new Error('Sales order has no lines');

  if (!warehouseId) {
    const defaultWarehouse = await db('warehouses').where({ company_id: companyId }).orderBy('is_default', 'desc').first();
    if (!defaultWarehouse) throw new Error('No warehouse configured');
    warehouseId = defaultWarehouse.id;
  }

  for (const line of lines) {
    // eslint-disable-next-line no-await-in-loop
    await postStockMove({
      companyId,
      productId: line.product_id,
      fromWarehouseId: warehouseId,
      quantity: line.quantity,
      moveType: 'out',
      refType: 'sales_order',
      refId: salesOrderId,
      createdBy: approvedBy,
    });
  }

  await db('sales_orders')
    .where({ id: salesOrderId })
    .update({ status: 'confirmed', approved_by: approvedBy || null, updated_at: db.fn.now() });

  return db('sales_orders').where({ id: salesOrderId }).first();
}
