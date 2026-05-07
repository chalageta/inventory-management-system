"use client";

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import {
  ExclamationCircleOutlined,
  AppstoreOutlined,
  ShoppingCartOutlined,
  UnorderedListOutlined,
  DollarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  BankOutlined,
  LineChartOutlined,
  PercentageOutlined,
} from '@ant-design/icons';
import { Card, Row, Col, Table, Spin, Statistic, Tag, Progress } from 'antd';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/lib/auth-context';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [dashboardRes, recentRes, trendRes, topRes] = await Promise.allSettled([
        api.get('/reports/dashboard'),
        api.get('/reports/recent-activity'),
        api.get('/reports/sales-trends?type=day'),
        api.get('/reports/top-products'),
      ]);

      // Handle Dashboard Stats - adapt to your API structure
      if (dashboardRes.status === 'fulfilled') {
        const data = dashboardRes.value.data?.data || dashboardRes.value.data;
        setStats({
          products: data?.products || 0,
          categories: data?.categories || 0,
          purchases: data?.purchases || 0,
          sales: data?.sales || 0,
          low_stock: data?.low_stock || 0,
          inventory: data?.inventory || { total_items: 0, available: 0, sold: 0 },
        });
      }

      // Handle Recent Activity
      if (recentRes.status === 'fulfilled') {
        const data = recentRes.value.data?.data || recentRes.value.data || [];
        setRecent(Array.isArray(data) ? data.map((item: any) => ({ ...item, unique_id: uuidv4() })) : []);
      }

      // Handle Trends - adapt to { current: [] } structure
      if (trendRes.status === 'fulfilled') {
        const res = trendRes.value.data?.data || trendRes.value.data;
        const trendData = res?.current || res || [];
        const sorted = [...trendData].sort(
          (a: any, b: any) => new Date(a.period).getTime() - new Date(b.period).getTime()
        );
        setTrends(sorted);
      }

      // Handle Top Products
      if (topRes.status === 'fulfilled') {
        const data = topRes.value.data?.data || topRes.value.data || [];
        setTopProducts(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Fatal Dashboard Error:', err);
      setError('Connection error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      fetchData();
    }
  }, [authLoading, fetchData]);

  if (loading || authLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-slate-50">
        <Spin size="large" />
        <p className="mt-4 text-slate-500 animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  // Calculate derived metrics
  const totalInventory = stats?.inventory?.total_items || 0;
  const availableStock = stats?.inventory?.available || 0;
  const soldItems = stats?.inventory?.sold || 0;
  const availabilityRate = totalInventory > 0 ? Math.round((availableStock / totalInventory) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-slate-50 min-h-screen space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500">Welcome back, {user?.name || 'Administrator'}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="px-3 py-1 bg-white rounded-full border border-slate-200 shadow-sm">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </header>

      {/* QUICK ACTIONS */}
      <div className="flex flex-wrap gap-3">
        <a href="/sales" className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition font-medium text-sm">
          + New Sale
        </a>
        <a href="/purchases" className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 hover:text-slate-900 transition font-medium text-sm">
          📥 Receive Stock
        </a>
        <a href="/products" className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 hover:text-slate-900 transition font-medium text-sm">
          📦 Add Product
        </a>
        {stats?.low_stock > 0 && (
          <a href="/products" className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg shadow-sm hover:bg-red-100 transition font-medium text-sm">
            ⚠️ View Low Stock
          </a>
        )}
      </div>

      {/* KPI CARDS */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm border border-slate-200 hover:shadow-md transition-all">
            <Statistic
              title={
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Total Products
                </span>
              }
              value={stats?.products || 0}
              prefix={<AppstoreOutlined className="text-blue-600" />}
              valueStyle={{ color: '#1e293b', fontSize: '1.5rem', fontWeight: 600 }}
            />
            <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
              <ArrowUpOutlined className="text-green-500" />
              <span>Across {stats?.categories || 0} categories</span>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm border border-slate-200 hover:shadow-md transition-all">
            <Statistic
              title={
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Inventory Available
                </span>
              }
              value={availableStock}
              prefix={<DollarOutlined className="text-emerald-600" />}
              valueStyle={{ color: '#1e293b', fontSize: '1.5rem', fontWeight: 600 }}
            />
            <div className="mt-2">
              <Progress 
                percent={availabilityRate} 
                size="small" 
                strokeColor="#10b981"
                showInfo={false}
              />
              <p className="text-xs text-slate-500 mt-1">{availabilityRate}% of {totalInventory} total items</p>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm border border-slate-200 hover:shadow-md transition-all">
            <Statistic
              title={
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Total Sales
                </span>
              }
              value={stats?.sales || 0}
              prefix={<ShoppingCartOutlined className="text-purple-600" />}
              valueStyle={{ color: '#1e293b', fontSize: '1.5rem', fontWeight: 600 }}
            />
            <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
              <span>From {stats?.purchases || 0} purchase orders</span>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className={`shadow-sm border transition-all ${
            (stats?.low_stock || 0) > 0 
              ? 'border-red-300 bg-red-50/50' 
              : 'border-slate-200 hover:shadow-md'
          }`}>
            <Statistic
              title={
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Low Stock Alerts
                </span>
              }
              value={stats?.low_stock || 0}
              prefix={<ExclamationCircleOutlined className={(stats?.low_stock || 0) > 0 ? 'text-red-500' : 'text-slate-400'} />}
              valueStyle={{ 
                color: (stats?.low_stock || 0) > 0 ? '#dc2626' : '#64748b', 
                fontSize: '1.5rem', 
                fontWeight: 600 
              }}
            />
            <div className="mt-2 text-xs text-slate-500">
              {(stats?.low_stock || 0) > 0 
                ? 'Items need restocking' 
                : 'All items well stocked ✓'}
            </div>
          </Card>
        </Col>
      </Row>

      {/* CHARTS ROW */}
      <Row gutter={[16, 16]}>
        {/* SALES TRENDS */}
        <Col xs={24} lg={16}>
          <Card 
            title={
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">Daily Sales Trends</span>
                <Tag color="blue" className="text-xs">Last 7 Days</Tag>
              </div>
            }
            className="shadow-sm border border-slate-200"
          >
            <div className="h-[300px]">
              {trends.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="period"
                      tickFormatter={formatDate}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={20}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        fontSize: '12px'
                      }}
                      labelFormatter={(label) => formatDate(label)}
                    />
                    <Line
                      type="monotone"
                      dataKey="total_sales"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  No sales data available
                </div>
              )}
            </div>
          </Card>
        </Col>

        {/* INVENTORY BREAKDOWN */}
        <Col xs={24} lg={8}>
          <Card 
            title={<span className="font-semibold text-slate-900">Inventory Breakdown</span>}
            className="shadow-sm border border-slate-200"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Available</span>
                <span className="font-semibold text-emerald-600">{availableStock}</span>
              </div>
              <Progress 
                percent={availabilityRate} 
                strokeColor="#10b981"
                trailColor="#e2e8f0"
                format={() => `${availabilityRate}%`}
              />
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Sold</span>
                <span className="font-semibold text-blue-600">{soldItems}</span>
              </div>
              <Progress 
                percent={totalInventory > 0 ? Math.round((soldItems / totalInventory) * 100) : 0} 
                strokeColor="#3b82f6"
                trailColor="#e2e8f0"
                format={() => `${totalInventory > 0 ? Math.round((soldItems / totalInventory) * 100) : 0}%`}
              />

              <div className="pt-4 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-2xl font-bold text-slate-900">{totalInventory}</p>
                    <p className="text-xs text-slate-500">Total Items</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-2xl font-bold text-slate-900">{stats?.categories || 0}</p>
                    <p className="text-xs text-slate-500">Categories</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* BOTTOM SECTION */}
      <Row gutter={[16, 16]}>
        {/* TOP SELLING PRODUCTS */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">Top Selling Items</span>
                <span className="text-xs text-slate-400">By quantity</span>
              </div>
            }
            className="shadow-sm border border-slate-200"
          >
            <Table
              dataSource={topProducts.slice(0, 5)}
              rowKey={(r) => r.barcode || r.name || uuidv4()}
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'Product',
                  dataIndex: 'name',
                  key: 'name',
                  render: (text) => (
                    <span className="font-medium text-slate-900 truncate block max-w-[150px]">
                      {text || 'N/A'}
                    </span>
                  ),
                },
                {
                  title: 'Qty Sold',
                  dataIndex: 'total_quantity',
                  key: 'qty',
                  align: 'right',
                  render: (val) => (
                    <span className="font-bold text-slate-900">{Number(val) || 0}</span>
                  ),
                },
              ]}
              locale={{ emptyText: 'No products data' }}
            />
          </Card>
        </Col>

        {/* RECENT ACTIVITY */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">Recent Activity</span>
                <Tag color="processing" className="text-xs">Live</Tag>
              </div>
            }
            className="shadow-sm border border-slate-200"
          >
            <Table
              dataSource={recent.slice(0, 5)}
              rowKey={(record, index) => record.created_at + index}
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'Activity',
                  dataIndex: 'label',
                  key: 'label',
                  render: (text) => (
                    <span className="font-medium text-slate-800 text-sm">
                      {text || 'System update'}
                    </span>
                  ),
                },
                {
                  title: 'Type',
                  dataIndex: 'type',
                  key: 'type',
                  width: 100,
                  render: (t) => (
                    <Tag 
                      color={
                        t === 'sale' ? 'green' : 
                        t === 'purchase' ? 'blue' : 
                        t === 'adjustment' ? 'purple' : 'default'
                      }
                      className="text-xs font-medium"
                    >
                      {t?.toUpperCase() || 'INFO'}
                    </Tag>
                  ),
                },
                {
                  title: 'Time',
                  dataIndex: 'created_at',
                  key: 'time',
                  width: 120,
                  render: (val) => (
                    <span className="text-xs text-slate-500">
                      {formatDate(val)}
                    </span>
                  ),
                },
              ]}
              locale={{ emptyText: 'No recent activity' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Error Banner */}
      {error && (
        <div className="fixed bottom-4 right-4 z-50">
          <Card className="shadow-lg border border-red-200 bg-red-50">
            <div className="flex items-center gap-2 text-red-700 text-sm">
              <ExclamationCircleOutlined />
              <span>{error}</span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}