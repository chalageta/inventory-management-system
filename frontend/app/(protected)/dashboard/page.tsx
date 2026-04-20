'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import {
  ExclamationCircleOutlined,
  AppstoreOutlined,
  ShoppingCartOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { Card, Row, Col, Table, Spin, Statistic, Tag } from 'antd';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/lib/auth-context';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
 const [trends, setTrends] = useState<any[]>([]);
const [trendRaw, setTrendRaw] = useState<any>(null);
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

      // Use allSettled to prevent a single 500 error from breaking the whole UI
      const [dashboardRes, recentRes, trendRes, topRes] = await Promise.allSettled([
        api.get('/reports/dashboard'),
        api.get('/reports/recent-activity'),
        api.get('/reports/sales-trends?type=day'),
        api.get('/reports/top-products'),
      ]);

      // Handle Dashboard Stats
      if (dashboardRes.status === 'fulfilled') {
        setStats(dashboardRes.value.data?.data || dashboardRes.value.data);
      } else {
        setError('Stats partially unavailable');
      }

      // Handle Recent Activity
      if (recentRes.status === 'fulfilled') {
        const data = recentRes.value.data?.data || recentRes.value.data || [];
        setRecent(data.map((item: any) => ({ ...item, unique_id: uuidv4() })));
      }
      

      // Handle Trends
   if (trendRes.status === 'fulfilled') {
  const res = trendRes.value.data?.data || trendRes.value.data;

  setTrendRaw(res);

  const sorted = [...(res?.current || [])].sort(
    (a, b) => new Date(a.period).getTime() - new Date(b.period).getTime()
  );

  setTrends(sorted);
}

      // Handle Top Products
      if (topRes.status === 'fulfilled') {
        setTopProducts(topRes.value.data?.data || topRes.value.data || []);
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
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50">
        <Spin size="large" />
        <p className="mt-4 text-gray-500 animate-pulse">Synchronizing inventory data...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-gray-50 min-h-screen space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome back, {user?.name || 'Administrator'}</p>
        </div>
      </header>

      {/* KPI SECTION */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card variant="outlined" className="shadow-sm">
            <Statistic
              title="Products"
              value={stats?.products || 0}
              prefix={<AppstoreOutlined className="text-primary" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card variant="outlined" className="shadow-sm">
            <Statistic
              title="Categories"
              value={stats?.categories || 0}
              prefix={<UnorderedListOutlined className="text-purple-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card variant="outlined" className="shadow-sm">
            <Statistic
              title="Sales"
              value={stats?.sales || 0}
              prefix={<ShoppingCartOutlined className="text-green-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card variant="outlined" className="shadow-sm border-t-4 border-red-500">
            <Statistic
              title="Low Stock"
              value={stats?.low_stock || 0}
              valueStyle={{ color: '#cf1322' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

  

      <Row gutter={[16, 16]}>
        {/* TRENDS */}
        <Col xs={24} lg={16}>
          <Card title="Sales Trends" variant="outlined" className="shadow-sm">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis
  dataKey="period"
  tickFormatter={formatDate}
  tick={{ fontSize: 12 }}
  axisLine={false}
/>
                  <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="total_sales"
                    stroke="#1890ff"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#1890ff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        {/* TOP PRODUCTS */}
        <Col xs={24} lg={8}>
          <Card title="Top Selling Items" variant="outlined" className="shadow-sm">
            <Table
              dataSource={topProducts}
              rowKey={(r) => r.barcode || r.name}
              pagination={false}
              size="small"
              columns={[
                { title: 'Product', dataIndex: 'name', key: 'name' },
                { 
                  title: 'Qty', 
                  dataIndex: 'total_quantity', 
                  key: 'qty',
                  align: 'right', 
                  render: (val) => <span className="font-bold">{Number(val)}</span> 
                },
              ]}
            />
          </Card>
        </Col>
      </Row>

    {/* RECENT ACTIVITY */}
<Card title="Recent Activity" variant="outlined" className="shadow-sm">
  <Table
    dataSource={recent}
    rowKey={(record, index) => record.created_at + index}
    pagination={{ pageSize: 5 }}
    size="small"
    columns={[
      {
        title: 'Activity',
        dataIndex: 'label',
        key: 'label',
        render: (text) => (
          <span className="font-medium text-gray-800">
            {text}
          </span>
        ),
      },

      {
        title: 'Type',
        dataIndex: 'type',
        key: 'type',
        render: (t) => (
          <Tag color={t === 'sale' ? 'green' : 'blue'}>
            {t?.toUpperCase()}
          </Tag>
        ),
      },

      {
        title: 'By',
        dataIndex: 'created_by_name',
        key: 'created_by',
        render: (val) => (
          <span className="text-gray-600">
            {val || 'System'}
          </span>
        ),
      },

      {
        title: 'Time',
        dataIndex: 'created_at',
        key: 'time',
        render: (val) => formatDate(val),
      },
    ]}
  />
</Card>
    </div>
  );
}