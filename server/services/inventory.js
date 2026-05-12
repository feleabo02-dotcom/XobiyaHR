import db from '../db.js';

async function ensureLevel(trx, { companyId, productId, warehouseId }) {
  const existing = await trx('inventory_levels')
    .where({ company_id: companyId, product_id: productId, warehouse_id: warehouseId })
    .first();

  if (existing) return existing;

  const [id] = await trx('inventory_levels').insert({
    company_id: companyId,
    product_id: productId,
    warehouse_id: warehouseId,
    quantity: 0,
    reserved: 0,
    reorder_point: 0,
  });

  return trx('inventory_levels').where({ id }).first();
}

async function updateQuantity(trx, { levelId, delta }) {
  await trx('inventory_levels')
    .where({ id: levelId })
    .update({
      quantity: trx.raw('quantity + ?', [delta]),
      updated_at: trx.fn.now(),
    });
}

export async function postStockMove({
  companyId,
  productId,
  fromWarehouseId,
  toWarehouseId,
  quantity,
  moveType,
  refType,
  refId,
  createdBy,
}) {
  return db.transaction(async (trx) => {
    const [moveId] = await trx('stock_moves').insert({
      company_id: companyId,
      product_id: productId,
      warehouse_id_from: fromWarehouseId || null,
      warehouse_id_to: toWarehouseId || null,
      quantity,
      move_type: moveType,
      status: 'posted',
      ref_type: refType || null,
      ref_id: refId ? String(refId) : null,
      created_by: createdBy || null,
    });

    if (moveType === 'in') {
      if (!toWarehouseId) throw new Error('warehouse_id_to is required for stock-in moves');
      const level = await ensureLevel(trx, { companyId, productId, warehouseId: toWarehouseId });
      await updateQuantity(trx, { levelId: level.id, delta: Number(quantity) });
    }

    if (moveType === 'out') {
      if (!fromWarehouseId) throw new Error('warehouse_id_from is required for stock-out moves');
      const level = await ensureLevel(trx, { companyId, productId, warehouseId: fromWarehouseId });
      if (Number(level.quantity) < Number(quantity)) {
        throw new Error('Insufficient stock for outbound move');
      }
      await updateQuantity(trx, { levelId: level.id, delta: -Number(quantity) });
    }

    if (moveType === 'transfer') {
      if (!fromWarehouseId || !toWarehouseId) {
        throw new Error('warehouse_id_from and warehouse_id_to are required for transfer moves');
      }
      const fromLevel = await ensureLevel(trx, { companyId, productId, warehouseId: fromWarehouseId });
      if (Number(fromLevel.quantity) < Number(quantity)) {
        throw new Error('Insufficient stock for transfer');
      }
      const toLevel = await ensureLevel(trx, { companyId, productId, warehouseId: toWarehouseId });
      await updateQuantity(trx, { levelId: fromLevel.id, delta: -Number(quantity) });
      await updateQuantity(trx, { levelId: toLevel.id, delta: Number(quantity) });
    }

    if (moveType === 'adjustment') {
      if (!toWarehouseId && !fromWarehouseId) {
        throw new Error('warehouse_id_from or warehouse_id_to is required for adjustment moves');
      }
      const targetWarehouseId = toWarehouseId || fromWarehouseId;
      const level = await ensureLevel(trx, { companyId, productId, warehouseId: targetWarehouseId });
      await updateQuantity(trx, { levelId: level.id, delta: Number(quantity) });
    }

    return trx('stock_moves').where({ id: moveId }).first();
  });
}
