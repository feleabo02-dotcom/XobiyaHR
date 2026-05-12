import db from '../db.js';
import { postStockMove } from './inventory.js';

export async function recalcPurchaseOrderTotal(purchaseOrderId) {
  const lines = await db('purchase_order_lines')
    .where({ purchase_order_id: purchaseOrderId })
    .select('quantity', 'unit_price');

  const total = lines.reduce((sum, line) => sum + Number(line.quantity) * Number(line.unit_price), 0);
  await db('purchase_orders').where({ id: purchaseOrderId }).update({ total, updated_at: db.fn.now() });
  return total;
}

export async function createGoodsReceipt({
  companyId,
  purchaseOrderId,
  receivedBy,
  receivedAt,
  warehouseId,
  lines,
}) {
  if (!warehouseId) throw new Error('warehouseId is required to receive goods');

  return db.transaction(async (trx) => {
    const [receiptId] = await trx('goods_receipts').insert({
      company_id: companyId,
      purchase_order_id: purchaseOrderId,
      status: 'received',
      received_by: receivedBy || null,
      received_at: receivedAt || new Date(),
    });

    for (const line of lines) {
      // eslint-disable-next-line no-await-in-loop
      await trx('goods_receipt_lines').insert({
        goods_receipt_id: receiptId,
        product_id: line.productId,
        quantity: line.quantity,
      });

      // eslint-disable-next-line no-await-in-loop
      await trx('purchase_order_lines')
        .where({ purchase_order_id: purchaseOrderId, product_id: line.productId })
        .update({
          received_qty: trx.raw('received_qty + ?', [line.quantity]),
        });

      // eslint-disable-next-line no-await-in-loop
      await postStockMove({
        companyId,
        productId: line.productId,
        toWarehouseId: warehouseId,
        quantity: line.quantity,
        moveType: 'in',
        refType: 'goods_receipt',
        refId: receiptId,
        createdBy: receivedBy,
      });
    }

    const remaining = await trx('purchase_order_lines')
      .where({ purchase_order_id: purchaseOrderId })
      .sum({ pending: trx.raw('quantity - received_qty') })
      .first();

    if (Number(remaining.pending) <= 0) {
      await trx('purchase_orders').where({ id: purchaseOrderId }).update({ status: 'received' });
    }

    return trx('goods_receipts').where({ id: receiptId }).first();
  });
}
