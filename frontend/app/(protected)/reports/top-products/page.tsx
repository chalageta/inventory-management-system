'use client';

import { useState, useEffect } from 'react';
import { Card, Table, DatePicker, Row, Col, Typography, Tag, Progress, Statistic } from 'antd';
import { CrownOutlined, ShoppingOutlined } from '@ant-design/icons';
import api from '@/lib/api';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;

export default function TopProductsReport() {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [dates, setDates] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(1, 'month'),
    dayjs(),
  ]);

  const fetchTopProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports/top-products', {
        params: {
          startDate: dates[0].format('YYYY-MM-DD'),
          endDate: dates[1].format('YYYY-MM-DD'),
        },
      });
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopProducts();
  }, [dates]);

  const maxQty = products.length > 0 ? Math.max(...products.map(p => p.total_quantity)) : 0;

  const columns = [
    {
      title: 'Rank',
      key: 'rank',
      width: 80,
      render: (_: any, __: any, index: number) => (
        <Tag color={index < 3 ? 'gold' : 'blue'}>#{index + 1}</Tag>
      ),
    },
    {
      title: 'Product Information',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <div>
          <div className="font-bold text-blue-600">{text}</div>
          <small className="text-gray-400">Barcode: {record.barcode}</small>
        </div>
      ),
    },
    {
      title: 'Sales Volume',
      dataIndex: 'total_quantity',
      key: 'total_quantity',
      sorter: (a: any, b: any) => a.total_quantity - b.total_quantity,
      render: (qty: number) => (
        <div className="w-full">
          <div className="flex justify-between mb-1">
            <span>{qty} Units</span>
            <span className="text-gray-400">{Math.round((qty / maxQty) * 100)}% of Top</span>
          </div>
          <Progress percent={Math.round((qty / maxQty) * 100)} showInfo={false} strokeColor="#52c41a" />
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <Row justify="space-between" align="middle">
        <Col>
          <Title level={2}><CrownOutlined className="mr-2 text-yellow-500" /> Best Sellers</Title>
        </Col>
        <Col>
          <RangePicker 
            value={dates} 
            onChange={(d) => d && setDates(d as [dayjs.Dayjs, dayjs.Dayjs])} 
          />
        </Col>
      </Row>

      <Row gutter={16}>
        {products.slice(0, 3).map((product, index) => (
          <Col span={8} key={product.id}>
            <Card variant="outlined" className="text-center shadow-sm">
              <div className="text-3xl mb-2">
                {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
              </div>
              <Statistic 
                title={product.name} 
                value={product.total_quantity} 
                suffix="Units Sold" 
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Card variant="outlined" title="Ranking Details">
        <Table
          dataSource={products}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}