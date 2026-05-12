import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { api } from '../lib/api';
import { cn, formatCurrency, formatDate } from '../lib/utils';
import { CheckCircle, Plus, Send, XCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface Supplier {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  price?: number;
}

interface PurchaseRequest {
  id: number;
  reason?: string;
  status: string;
  created_at?: string;
}

interface PurchaseOrder {
  id: number;
  supplier_id?: number;
  status: string;
  total?: number;
  currency?: string;
  created_at?: string;
  ordered_at?: string;
}

interface PurchaseOrderLine {
  id: number;
  product_id: number;
  product_name?: string;
  sku?: string;
  quantity: number;
  received_qty: number;
  unit_price: number;
  pending_qty?: number;
}

interface Warehouse {
  id: number;
  name: string;
  is_default?: boolean;
}

function statusBadge(status: string) {
  return cn(
    'badge-xobiya',
    status === 'draft' && 'text-slate-600 bg-slate-100',
    status === 'submitted' && 'text-blue-700 bg-blue-100',
    status === 'approved' && 'text-emerald-700 bg-emerald-100',
    status === 'ordered' && 'text-indigo-700 bg-indigo-100',
    status === 'received' && 'text-emerald-700 bg-emerald-100',
    status === 'rejected' && 'text-rose-700 bg-rose-100',
    status === 'cancelled' && 'text-rose-700 bg-rose-100'
  );
}

export default function Procurement() {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [orderLines, setOrderLines] = useState<PurchaseOrderLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [receivingOrder, setReceivingOrder] = useState<PurchaseOrder | null>(null);
  const [receiveQuantities, setReceiveQuantities] = useState<Record<number, number>>({});
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [receiving, setReceiving] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    try {
      const [reqData, orderData, supplierData, productData] = await Promise.all([
        api.getPurchaseRequests(),
        api.getPurchaseOrders(),
        api.getSuppliers(),
        api.getProducts(),
      ]);
      setRequests(reqData);
      setOrders(orderData);
      setSuppliers(supplierData);
      setProducts(productData);
    } catch (err) {
      console.error('Failed to load procurement data:', err);
    } finally {
      setLoading(false);
    }
  }

  const supplierMap = useMemo(() => {
    return suppliers.reduce((acc, supplier) => {
      acc[supplier.id] = supplier.name;
      return acc;
    }, {} as Record<number, string>);
  }, [suppliers]);

  async function createRequest(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const productId = fd.get('productId') as string;
    const quantity = Number(fd.get('quantity') || 0);

    try {
      await api.createPurchaseRequest({
        reason: fd.get('reason') as string,
        lines: productId && quantity > 0 ? [{ productId, quantity }] : [],
      });
      setShowRequestModal(false);
      fetchAll();
    } catch (err) {
      console.error('Failed to create purchase request:', err);
    }
  }

  async function createOrder(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const productId = fd.get('productId') as string;
    const quantity = Number(fd.get('quantity') || 0);
    const unitPrice = Number(fd.get('unitPrice') || 0);

    try {
      await api.createPurchaseOrder({
        supplierId: fd.get('supplierId') as string,
        currency: (fd.get('currency') as string) || 'USD',
        lines: productId && quantity > 0 ? [{ productId, quantity, unitPrice }] : [],
      });
      setShowOrderModal(false);
      fetchAll();
    } catch (err) {
      console.error('Failed to create purchase order:', err);
    }
  }

  function getPendingQty(line: PurchaseOrderLine) {
    const pending = Number(line.pending_qty ?? (Number(line.quantity) - Number(line.received_qty)));
    return Math.max(0, pending);
  }

  async function openReceive(order: PurchaseOrder) {
    setReceivingOrder(order);
    setShowReceiveModal(true);
    setReceiving(true);

    try {
      const [linesData, warehouseData] = await Promise.all([
        api.getPurchaseOrderLines(order.id),
        api.getWarehouses(),
      ]);
      setOrderLines(linesData);
      setWarehouses(warehouseData);

      const defaults = linesData.reduce((acc, line) => {
        acc[line.id] = getPendingQty(line);
        return acc;
      }, {} as Record<number, number>);
      setReceiveQuantities(defaults);

      const defaultWarehouse = warehouseData.find((warehouse) => warehouse.is_default) || warehouseData[0];
      setSelectedWarehouse(defaultWarehouse ? String(defaultWarehouse.id) : '');
    } catch (err) {
      console.error('Failed to load receipt details:', err);
    } finally {
      setReceiving(false);
    }
  }

  function closeReceiveModal() {
    setShowReceiveModal(false);
    setReceivingOrder(null);
    setOrderLines([]);
    setReceiveQuantities({});
  }

  async function submitReceipt(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!receivingOrder || !selectedWarehouse) return;

    const lines = orderLines
      .map((line) => ({
        productId: line.product_id,
        quantity: Number(receiveQuantities[line.id] || 0),
      }))
      .filter((line) => line.quantity > 0);

    if (lines.length === 0) return;

    try {
      await api.createGoodsReceipt({
        purchaseOrderId: receivingOrder.id,
        warehouseId: selectedWarehouse,
        lines,
      });
      closeReceiveModal();
      fetchAll();
    } catch (err) {
      console.error('Failed to receive goods:', err);
    }
  }

  async function runAction(action: () => Promise<unknown>) {
    try {
      await action();
      fetchAll();
    } catch (err) {
      console.error('Failed to run procurement action:', err);
    }
  }

  const submittedCount = requests.filter((r) => r.status === 'submitted').length;
  const approvedOrders = orders.filter((o) => o.status === 'approved' || o.status === 'ordered').length;
  const totalCommitments = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Procurement</h1>
          <p className="text-neutral-500 mt-1">Route purchasing requests, approvals, and order execution.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowRequestModal(true)} className="btn-secondary">New Request</button>
          <button onClick={() => setShowOrderModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={18} />
            New Order
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-swiss">
          <p className="label-swiss">Requests awaiting review</p>
          <p className="text-3xl font-bold text-slate-900">{submittedCount}</p>
        </div>
        <div className="card-swiss">
          <p className="label-swiss">Approved or ordered</p>
          <p className="text-3xl font-bold text-slate-900">{approvedOrders}</p>
        </div>
        <div className="card-swiss">
          <p className="label-swiss">Total commitments</p>
          <p className="text-3xl font-bold text-slate-900">{totalCommitments ? formatCurrency(totalCommitments) : '$0'}</p>
        </div>
      </div>

      <div className="card-swiss">
        <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Purchase Requests</p>
            <p className="text-xs text-slate-500">Draft, submit, and approve demand.</p>
          </div>
        </div>
        <table className="table-swiss">
          <thead>
            <tr>
              <th>ID</th>
              <th>Reason</th>
              <th>Created</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-[10px] font-mono text-slate-400 uppercase">Loading...</td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-[10px] font-mono text-slate-400 uppercase">No requests found</td>
              </tr>
            ) : (
              requests.map((req) => (
                <tr key={req.id}>
                  <td className="text-xs font-mono text-slate-500">PR-{req.id}</td>
                  <td className="text-sm text-slate-800">{req.reason || 'General procurement'}</td>
                  <td className="text-[10px] text-slate-500 font-mono">{req.created_at ? formatDate(req.created_at) : '—'}</td>
                  <td>
                    <span className={statusBadge(req.status)}>{req.status}</span>
                  </td>
                  <td className="text-right">
                    {req.status === 'draft' && (
                      <button
                        onClick={() => runAction(() => api.submitPurchaseRequest(req.id))}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                      >
                        <Send size={14} />
                        Submit
                      </button>
                    )}
                    {req.status === 'submitted' && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => runAction(() => api.approvePurchaseRequest(req.id))}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                          title="Approve"
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button
                          onClick={() => runAction(() => api.rejectPurchaseRequest(req.id))}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                          title="Reject"
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="card-swiss">
        <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Purchase Orders</p>
            <p className="text-xs text-slate-500">Approve, order, or cancel supplier commitments.</p>
          </div>
        </div>
        <table className="table-swiss">
          <thead>
            <tr>
              <th>Order</th>
              <th>Supplier</th>
              <th>Total</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-[10px] font-mono text-slate-400 uppercase">Loading...</td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-[10px] font-mono text-slate-400 uppercase">No orders found</td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td className="text-xs font-mono text-slate-500">PO-{order.id}</td>
                  <td className="text-sm text-slate-800">{order.supplier_id ? supplierMap[order.supplier_id] || `Supplier ${order.supplier_id}` : '—'}</td>
                  <td className="text-xs font-mono text-slate-700">{formatCurrency(Number(order.total || 0), order.currency || 'USD')}</td>
                  <td>
                    <span className={statusBadge(order.status)}>{order.status}</span>
                  </td>
                  <td className="text-right">
                    {order.status === 'draft' && (
                      <button
                        onClick={() => runAction(() => api.approvePurchaseOrder(order.id))}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-800"
                      >
                        <CheckCircle size={14} />
                        Approve
                      </button>
                    )}
                    {order.status === 'approved' && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => runAction(() => api.orderPurchaseOrder(order.id))}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                        >
                          <Send size={14} />
                          Order
                        </button>
                        <button
                          onClick={() => runAction(() => api.cancelPurchaseOrder(order.id))}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800"
                        >
                          <XCircle size={14} />
                          Cancel
                        </button>
                      </div>
                    )}
                    {order.status === 'ordered' && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openReceive(order)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-800"
                        >
                          <CheckCircle size={14} />
                          Receive
                        </button>
                        <button
                          onClick={() => runAction(() => api.cancelPurchaseOrder(order.id))}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800"
                        >
                          <XCircle size={14} />
                          Cancel
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showReceiveModal && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-2xl border border-neutral-200">
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Receive Purchase Order</h3>
                <p className="text-xs text-slate-500">Capture delivered quantities before closing the order.</p>
              </div>
              <button onClick={closeReceiveModal} className="text-neutral-400 hover:text-neutral-900">
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            <form onSubmit={submitReceipt} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label-swiss">Warehouse</label>
                  <select
                    name="warehouseId"
                    className="input-swiss"
                    value={selectedWarehouse}
                    onChange={(event) => setSelectedWarehouse(event.target.value)}
                    required
                  >
                    <option value="">Select warehouse...</option>
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                    ))}
                  </select>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Order</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{receivingOrder ? `PO-${receivingOrder.id}` : '—'}</p>
                  <p className="text-[10px] text-slate-500">Status: {receivingOrder?.status ?? '—'}</p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-[10px] uppercase tracking-widest text-slate-400">
                    <tr>
                      <th className="px-4 py-2">Item</th>
                      <th className="px-4 py-2">Ordered</th>
                      <th className="px-4 py-2">Received</th>
                      <th className="px-4 py-2">Pending</th>
                      <th className="px-4 py-2 text-right">Receive now</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receiving && (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-[10px] font-mono text-slate-400 uppercase">Loading...</td>
                      </tr>
                    )}
                    {!receiving && orderLines.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-[10px] font-mono text-slate-400 uppercase">No order lines found</td>
                      </tr>
                    )}
                    {!receiving && orderLines.map((line) => {
                      const pending = getPendingQty(line);
                      return (
                        <tr key={line.id} className="border-t border-slate-100">
                          <td className="px-4 py-2">
                            <p className="text-sm font-semibold text-slate-900">{line.product_name || 'Item'}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{line.sku || `#${line.product_id}`}</p>
                          </td>
                          <td className="px-4 py-2 text-xs text-slate-600 font-mono">{Number(line.quantity)}</td>
                          <td className="px-4 py-2 text-xs text-slate-600 font-mono">{Number(line.received_qty)}</td>
                          <td className="px-4 py-2 text-xs text-slate-600 font-mono">{pending}</td>
                          <td className="px-4 py-2 text-right">
                            <input
                              type="number"
                              min={0}
                              max={pending}
                              step="0.01"
                              className="input-swiss w-24 text-right"
                              value={receiveQuantities[line.id] ?? pending}
                              onChange={(event) => {
                                const value = Number(event.target.value || 0);
                                setReceiveQuantities((prev) => ({ ...prev, [line.id]: value }));
                              }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                <button type="button" onClick={closeReceiveModal} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" disabled={!selectedWarehouse || receiving}>Receive</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {showRequestModal && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-lg border border-neutral-200">
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
              <h3 className="text-lg font-bold">New Purchase Request</h3>
              <button onClick={() => setShowRequestModal(false)} className="text-neutral-400 hover:text-neutral-900">
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            <form onSubmit={createRequest} className="p-6 space-y-4">
              <div>
                <label className="label-swiss">Reason</label>
                <input name="reason" className="input-swiss" placeholder="Office equipment refresh" />
              </div>
              <div>
                <label className="label-swiss">Product</label>
                <select name="productId" className="input-swiss">
                  <option value="">Select product...</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-swiss">Quantity</label>
                <input name="quantity" type="number" min="0" step="1" className="input-swiss" placeholder="1" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                <button type="button" onClick={() => setShowRequestModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Create</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {showOrderModal && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-lg border border-neutral-200">
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
              <h3 className="text-lg font-bold">New Purchase Order</h3>
              <button onClick={() => setShowOrderModal(false)} className="text-neutral-400 hover:text-neutral-900">
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            <form onSubmit={createOrder} className="p-6 space-y-4">
              <div>
                <label className="label-swiss">Supplier</label>
                <select name="supplierId" className="input-swiss" required>
                  <option value="">Select supplier...</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-swiss">Currency</label>
                <input name="currency" className="input-swiss" placeholder="USD" />
              </div>
              <div>
                <label className="label-swiss">Product</label>
                <select name="productId" className="input-swiss">
                  <option value="">Select product...</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-swiss">Quantity</label>
                  <input name="quantity" type="number" min="0" step="1" className="input-swiss" placeholder="1" />
                </div>
                <div>
                  <label className="label-swiss">Unit Price</label>
                  <input name="unitPrice" type="number" min="0" step="0.01" className="input-swiss" placeholder="0.00" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                <button type="button" onClick={() => setShowOrderModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Create</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
