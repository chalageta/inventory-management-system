'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import {
  DollarCircleOutlined,
  ExclamationCircleOutlined,
  ContainerOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { Card, Row, Col, Table, Spin, Statistic } from 'antd';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/lib/auth-context';

export default function Dashboard() {
  const { user, loading: authLoading, can } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    if (authLoading) return;

    const fetchData = async () => {
      try {
        const requests = [];
        
        // Only fetch summary/recent if user can see inventory or sales
        if (can(['view_inventory', 'view_sales'])) {
          requests.push(api.get('/reports/summary'));
          requests.push(api.get('/reports/recent'));
        }

        // Only fetch financial data if user has view_finance
        if (can('view_finance')) {
          requests.push(api.get('/reports/trends?type=day'));
          requests.push(api.get('/reports/top-products'));
        }

        const responses = await Promise.all(requests);
        
        let index = 0;
        if (can(['view_inventory', 'view_sales'])) {
          setStats(responses[index++].data);
          setRecent(responses[index++].data.map((item: any) => ({ ...item, unique_id: uuidv4() })));
        }

        if (can('view_finance')) {
          setTrends(responses[index++].data);
          setTopProducts(responses[index++].data);
        }
      } catch (err) {
        console.error("Dashboard Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authLoading]);

  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" tip="Loading Dashboard..." />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-gray-50 min-h-screen space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Welcome, {user?.name}</h1>

      {/* KPI SECTION */}
      <Row gutter={[16, 16]}>
        {/* HIDE REVENUE COMPLETELY IF NO PERMISSION */}
        {can('view_finance') && (
          <Col xs={24} sm={12} md={6}>
            <Card className="shadow-sm border-t-4 border-t-green-500">
              <Statistic title="Today's Revenue" value={stats?.today_revenue} prefix={<DollarCircleOutlined />} suffix="ETB" />
            </Card>
          </Col>
        )}
        
        <Col xs={24} sm={12} md={6}>
          <Card className="shadow-sm">
            <Statistic title="Total Products" value={stats?.total_products} prefix={<AppstoreOutlined />} />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card className="shadow-sm border-t-4 border-t-blue-500">
            <Statistic title="Available Items" value={stats?.total_available} prefix={<ContainerOutlined />} />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card className="shadow-sm">
            <Statistic title="Low Stock Alert" value={stats?.low_stock_count} valueStyle={{ color: '#cf1322' }} prefix={<ExclamationCircleOutlined />} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* HIDE CHART COMPLETELY IF NO PERMISSION */}
        {can('view_finance') && (
          <Col xs={24} lg={16}>
            <Card title="Sales Performance" className="shadow-sm">
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="total" stroke="#1677ff" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>
        )}

        {/* HIDE TOP PRODUCTS COMPLETELY IF NO PERMISSION */}
        {can('view_finance') && (
          <Col xs={24} lg={8}>
            <Card title="Top Selling" className="shadow-sm">
              <Table
                dataSource={topProducts}
                rowKey="name"
                pagination={false}
                size="small"
                columns={[
                  { title: 'Product', dataIndex: 'name' },
                  { title: 'Qty', dataIndex: 'total_quantity', align: 'right' }
                ]}
              />
            </Card>
          </Col>
        )}
      </Row>

      {/* RECENT ACTIVITY (Shared Access) */}
      <Card title="Recent Activity" className="shadow-sm">
        <Table
          dataSource={recent}
          rowKey="unique_id"
          pagination={{ pageSize: 5 }}
          columns={[
            { title: 'Activity', dataIndex: 'label' },
            { 
              title: 'Value', 
              dataIndex: 'value',
              // Hide currency value in the list if they aren't finance-authorized
              render: (val, record) => record.type === 'sale' ? (can('view_finance') ? `${val} ETB` : '***') : val
            },
            { title: 'Time', dataIndex: 'created_at', render: (val) => new Date(val).toLocaleTimeString() }
          ]}
        />
      </Card>
    </div>
  );
}