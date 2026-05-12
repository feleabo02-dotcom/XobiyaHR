import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { api } from '../lib/api';
import { cn, formatCurrency, formatDate } from '../lib/utils';
import { CheckCircle, CreditCard, FilePlus2, Plus, XCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface Customer {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  price?: number;
}

interface SalesOrder {
  id: number;
  customer_id?: number;
  status: string;
  total?: number;
  currency?: string;
  created_at?: string;
}

interface Invoice {
  id: number;
  customer_id?: number;
  status: string;
  total?: number;
  currency?: string;
  created_at?: string;
  due_date?: string;
}

function statusBadge(status: string) {
  return cn(
    'badge-xobiya',
    status === 'draft' && 'text-slate-600 bg-slate-100',
    status === 'confirmed' && 'text-blue-700 bg-blue-100',
    status === 'fulfilled' && 'text-emerald-700 bg-emerald-100',
    status === 'issued' && 'text-indigo-700 bg-indigo-100',
    status === 'paid' && 'text-emerald-700 bg-emerald-100',
    status === 'cancelled' && 'text-rose-700 bg-rose-100'
  );
}

export default function Sales() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOrderModal, setShowOrderModal] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    try {
      const [orderData, invoiceData, customerData, productData] = await Promise.all([
        api.getSalesOrders(),
        api.getInvoices(),
        api.getCustomers(),
        api.getProducts(),
      ]);
      setOrders(orderData);
      setInvoices(invoiceData);
      setCustomers(customerData);
      setProducts(productData);
    } catch (err) {
      console.error('Failed to load sales data:', err);
    } finally {
      setLoading(false);
    }
  }

  const customerMap = useMemo(() => {
    return customers.reduce((acc, customer) => {
      acc[customer.id] = customer.name;
      return acc;
    }, {} as Record<number, string>);
  }, [customers]);

  async function createOrder(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const productId = fd.get('productId') as string;
    const quantity = Number(fd.get('quantity') || 0);
    const unitPrice = Number(fd.get('unitPrice') || 0);

    try {
      await api.createSalesOrder({
        customerId: fd.get('customerId') as string,
        currency: (fd.get('currency') as string) || 'USD',
        lines: productId && quantity > 0 ? [{ productId, quantity, unitPrice }] : [],
      });
      setShowOrderModal(false);
      fetchAll();
    } catch (err) {
      console.error('Failed to create sales order:', err);
    }
  }

  async function runAction(action: () => Promise<unknown>) {
    try {
      await action();
      fetchAll();
    } catch (err) {
      console.error('Failed to run sales action:', err);
    }
  }

  const confirmedOrders = orders.filter((order) => order.status === 'confirmed').length;
  const issuedInvoices = invoices.filter((invoice) => invoice.status === 'issued').length;
  const revenueBooked = invoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Sales</h1>
          <p className="text-neutral-500 mt-1">Confirm orders, issue invoices, and track collections.</p>
        </div>
        <button onClick={() => setShowOrderModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          New Sales Order
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-swiss">
          <p className="label-swiss">Confirmed orders</p>
          <p className="text-3xl font-bold text-slate-900">{confirmedOrders}</p>
        </div>
        <div className="card-swiss">
          <p className="label-swiss">Open invoices</p>
          <p className="text-3xl font-bold text-slate-900">{issuedInvoices}</p>
        </div>
        <div className="card-swiss">
          <p className="label-swiss">Revenue booked</p>
          <p className="text-3xl font-bold text-slate-900">{revenueBooked ? formatCurrency(revenueBooked) : '$0'}</p>
        </div>
      </div>

      <div className="card-swiss">
        <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Sales Orders</p>
            <p className="text-xs text-slate-500">Confirm, fulfill, or cancel customer demand.</p>
          </div>
        </div>
        <table className="table-swiss">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
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
                  <td className="text-xs font-mono text-slate-500">SO-{order.id}</td>
                  <td className="text-sm text-slate-800">{order.customer_id ? customerMap[order.customer_id] || `Customer ${order.customer_id}` : '—'}</td>
                  <td className="text-xs font-mono text-slate-700">{formatCurrency(Number(order.total || 0), order.currency || 'USD')}</td>
                  <td>
                    <span className={statusBadge(order.status)}>{order.status}</span>
                  </td>
                  <td className="text-right">
                    {order.status === 'draft' && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => runAction(() => api.confirmSalesOrder(order.id))}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                        >
                          <CheckCircle size={14} />
                          Confirm
                        </button>
                        <button
                          onClick={() => runAction(() => api.cancelSalesOrder(order.id))}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800"
                        >
                          <XCircle size={14} />
                          Cancel
                        </button>
                      </div>
                    )}
                    {order.status === 'confirmed' && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => runAction(() => api.fulfillSalesOrder(order.id))}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-800"
                        >
                          <CheckCircle size={14} />
                          Fulfill
                        </button>
                        <button
                          onClick={() => runAction(() => api.createInvoiceFromOrder(order.id))}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                        >
                          <FilePlus2 size={14} />
                          Invoice
                        </button>
                        <button
                          onClick={() => runAction(() => api.cancelSalesOrder(order.id))}
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

      <div className="card-swiss">
        <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Invoices</p>
            <p className="text-xs text-slate-500">Collect payments and manage invoice lifecycle.</p>
          </div>
        </div>
        <table className="table-swiss">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Customer</th>
              <th>Due</th>
              <th>Total</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[10px] font-mono text-slate-400 uppercase">Loading...</td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[10px] font-mono text-slate-400 uppercase">No invoices found</td>
              </tr>
            ) : (
              invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="text-xs font-mono text-slate-500">INV-{invoice.id}</td>
                  <td className="text-sm text-slate-800">{invoice.customer_id ? customerMap[invoice.customer_id] || `Customer ${invoice.customer_id}` : '—'}</td>
                  <td className="text-[10px] text-slate-500 font-mono">{invoice.due_date ? formatDate(invoice.due_date) : '—'}</td>
                  <td className="text-xs font-mono text-slate-700">{formatCurrency(Number(invoice.total || 0), invoice.currency || 'USD')}</td>
                  <td>
                    <span className={statusBadge(invoice.status)}>{invoice.status}</span>
                  </td>
                  <td className="text-right">
                    {invoice.status === 'issued' && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => runAction(() => api.payInvoice(invoice.id, 'bank'))}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-800"
                        >
                          <CreditCard size={14} />
                          Pay
                        </button>
                        <button
                          onClick={() => runAction(() => api.cancelInvoice(invoice.id))}
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

      {showOrderModal && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-lg border border-neutral-200">
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
              <h3 className="text-lg font-bold">New Sales Order</h3>
              <button onClick={() => setShowOrderModal(false)} className="text-neutral-400 hover:text-neutral-900">
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            <form onSubmit={createOrder} className="p-6 space-y-4">
              <div>
                <label className="label-swiss">Customer</label>
                <select name="customerId" className="input-swiss" required>
                  <option value="">Select customer...</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>{customer.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-swiss">Currency</label>
                <input name="currency" className="input-swiss" placeholder="USD" />
              </div>
              <div>
                <label className="label-swiss">Product</label>
                <select name="productId" className="input-swiss" required>
                  <option value="">Select product...</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-swiss">Quantity</label>
                  <input name="quantity" type="number" min="1" step="1" className="input-swiss" placeholder="1" required />
                </div>
                <div>
                  <label className="label-swiss">Unit Price</label>
                  <input name="unitPrice" type="number" min="0" step="0.01" className="input-swiss" placeholder="0.00" required />
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
