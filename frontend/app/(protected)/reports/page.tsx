'use client';

import { useEffect, useState } from 'react';
import {
  getDashboard,
  getSalesReport,
  getPurchaseReport,
  getInventoryReport,
  getStockReport
} from '@/lib/reports';  
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { fromTheme } from 'tailwind-merge';

const tabs = [
  'dashboard',
  'sales',
  'purchases',
  'inventory',
  'stock'
];

export default function ReportsPage() {
  const [tab, setTab] = useState('dashboard');

  const [dashboard, setDashboard] = useState<any>(null);
  const [sales, setSales] = useState<any>(null);
  const [purchases, setPurchases] = useState<any>(null);
  const [inventory, setInventory] = useState<any>(null);
  const [stock, setStock] = useState<any>(null);

  useEffect(() => {
    load(tab);
  }, [tab]);

  const load = async (type: string) => {
    if (type === 'dashboard') {
      const res = await getDashboard();
      setDashboard(res);
    }

    if (type === 'sales') {
      const res = await getSalesReport({});
      setSales(res);
    }

    if (type === 'purchases') {
      const res = await getPurchaseReport({});
      setPurchases(res);
    }

    if (type === 'inventory') {
      const res = await getInventoryReport({});
      setInventory(res);
    }

    if (type === 'stock') {
      const res = await getStockReport({});
      setStock(res);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">

      {/* SIDEBAR TABS */}
      <div className="w-64 border-r bg-white dark:bg-gray-800 p-4 space-y-2">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`w-full text-left px-4 py-2 rounded-lg capitalize ${
              tab === t ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div className="flex-1 p-6 overflow-auto">

        {/* ================= DASHBOARD ================= */}
        {tab === 'dashboard' && dashboard && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

            <Card title="Products" value={dashboard.products} />
            <Card title="Categories" value={dashboard.categories} />
            <Card title="Purchases" value={dashboard.purchases} />
            <Card title="Sales" value={dashboard.sales} />

            <Card title="Total Items" value={dashboard.inventory.total_items} />
            <Card title="Available" value={dashboard.inventory.available} />
            <Card title="Sold" value={dashboard.inventory.sold} />
            <Card title="Low Stock" value={dashboard.lowStock} />

            {/* PIE CHART */}
            <div className="col-span-2 md:col-span-4 h-80 bg-white dark:bg-gray-800 p-4 rounded-xl">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Available', value: dashboard.inventory.available },
                      { name: 'Sold', value: dashboard.inventory.sold },
                      { name: 'Reserved', value: dashboard.inventory.reserved }
                    ]}
                    dataKey="value"
                    outerRadius={120}
                  >
                    <Cell fill="#22c55e" />
                    <Cell fill="#ef4444" />
                    <Cell fill="#f59e0b" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

          </div>
        )}

        {/* ================= SALES ================= */}
        {tab === 'sales' && sales && (
          <div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <Card title="Total Sales" value={sales.summary.total_sales} />
              <Card title="Revenue" value={sales.summary.total_revenue} />
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sales.data}>
                  <XAxis dataKey="reference" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total_amount" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>
        )}

        {/* ================= PURCHASES ================= */}
        {tab === 'purchases' && purchases && (
          <div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <Card title="Total Purchases" value={purchases.summary.total_purchases} />
              <Card title="Total Spent" value={purchases.summary.total_spent} />
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={purchases.data}>
                  <XAxis dataKey="invoice_no" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total_amount" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>
        )}

        {/* ================= INVENTORY ================= */}
        {tab === 'inventory' && inventory && (
          <div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card title="Total" value={inventory.summary.total_items} />
              <Card title="Available" value={inventory.summary.available} />
              <Card title="Sold" value={inventory.summary.sold} />
              <Card title="Reserved" value={inventory.summary.reserved} />
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={inventory.data}>
                  <XAxis dataKey="product_name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="cost_price" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>
        )}

        {/* ================= STOCK ================= */}
        {tab === 'stock' && stock && (
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl">

            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={stock.data}>
                <XAxis dataKey="product_name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="action_type" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>

            <table className="w-full mt-6 text-sm">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Action</th>
                  <th>From</th>
                  <th>To</th>
                  <th>User</th>
                </tr>
              </thead>
              <tbody>
                {stock.data.map((s: any) => (
                  <tr key={s.id} className="border-t">
                    <td>{s.product_name}</td>
                    <td>{s.action_type}</td>
                    <td>{s.from_status}</td>
                    <td>{s.to_status}</td>
                    <td>{s.user_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>

          </div>
        )}

      </div>
    </div>
  );
}

/* ================= CARD ================= */
function Card({ title, value }: any) {
  return (
    <div className="p-4 rounded-xl bg-white dark:bg-gray-800 shadow">
      <p className="text-gray-500 text-sm">{title}</p>
      <h2 className="text-xl font-bold">{value}</h2>
    </div>
  );
}