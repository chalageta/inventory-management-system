'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table, Button, Card, Input, Select, Row, Col,
  Typography, Space, message,
  Empty
} from 'antd';
import {
  ShoppingCartOutlined, UserOutlined, DeleteOutlined
} from '@ant-design/icons';
import api from '@/lib/api';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

const { Title, Text } = Typography;

interface Product {
  id: number;
  name: string;
  sales_price: number;
}

interface InventoryItem {
  id: number;
  serial_number: string;
}

interface SaleItem {
  key: string;
  product_id: number;
  inventory_item_id: number;
  product_name: string;
  serial_number: string;
  unit_price: number;
}

export default function NewSalePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [availableSerials, setAvailableSerials] = useState<InventoryItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedSerialId, setSelectedSerialId] = useState<number | null>(null);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch Products
  useEffect(() => {
    api.get('/products?limit=1000')
      .then(res => setProducts(res.data.data || []))
      .catch(err => console.error(err));
  }, []);

  // Fetch Serials when product changes
  useEffect(() => {
    if (selectedProductId) {
      setSelectedSerialId(null);
      api.get(`/inventory?product_id=${selectedProductId}&status=available`)
        .then(res => setAvailableSerials(res.data.data || []))
        .catch(err => console.error(err));
    }
  }, [selectedProductId]);

  // Calculate total price
  const totalPrice = useMemo(() => {
    return items.reduce((sum, item) => sum + Number(item.unit_price || 0), 0);
  }, [items]);

  const handleAddItem = () => {
    if (!selectedProductId || !selectedSerialId) {
      return message.warning('Select both Product and Serial Number');
    }
    if (items.some(i => i.inventory_item_id === selectedSerialId)) {
      return message.error('This serial number is already in your cart');
    }

    const product = products.find(p => p.id === selectedProductId);
    const serial = availableSerials.find(s => s.id === selectedSerialId);

    if (product && serial) {
      setItems([...items, {
        key: uuidv4(),
        product_id: product.id,
        inventory_item_id: serial.id,
        product_name: product.name,
        serial_number: serial.serial_number,
        unit_price: Number(product.sales_price)
      }]);
      setSelectedSerialId(null);
    }
  };

  const handleCreateSale = async () => {
    if (!customerName.trim() || items.length === 0) {
      return message.error('Customer name and items are required');
    }

    setLoading(true);
    try {
      const payload = {
        customer_name: customerName,
        items: items.map(i => ({
          product_id: i.product_id,
          inventory_item_id: i.inventory_item_id,
          unit_price: i.unit_price
        })),
        total_amount: totalPrice
      };
      const res = await api.post('/sales', payload);
      toast.success('Sale Processed!');
      router.push(`/sales/${res.data.saleId}`);
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Sale failed');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'PRODUCT / SERIAL',
      render: (_: any, r: SaleItem) => (
        <div>
          <div className="font-bold">{r.product_name}</div>
          <div className="text-xs font-mono text-primary uppercase">SN: {r.serial_number}</div>
        </div>
      )
    },
    {
      title: 'PRICE',
      dataIndex: 'unit_price',
      align: 'right' as const,
      render: (v: number) => `$${Number(v).toFixed(2)}`
    },
    {
      title: 'ACTION',
      align: 'center' as const,
      render: (_: any, r: SaleItem) => (
        <Button
          danger
          type="text"
          icon={<DeleteOutlined />}
          onClick={() => setItems(items.filter(i => i.key !== r.key))}
        />
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-10">
      <div className="max-w-6xl mx-auto">
        <Title level={2} className="italic font-black text-slate-800 mb-8 flex items-center">
          <ShoppingCartOutlined className="mr-2 text-primary" /> NEW MEDICAL SALE
        </Title>

        <Row gutter={[24, 24]}>
          {/* LEFT: Customer & Cart */}
          <Col xs={24} lg={16}>
            <Space direction="vertical" size={20} className="w-full">

              {/* Customer */}
              <Card className="rounded-2xl shadow-md border-none p-4">
                <Text className="text-xs font-black uppercase text-gray-400 tracking-widest mb-2 block">
                  Customer / Hospital Name
                </Text>
                <Input
                  size="large"
                  prefix={<UserOutlined />}
                  placeholder="e.g. Tikur Anbessa Hospital"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="rounded-lg h-12 font-semibold"
                />
              </Card>

              {/* Product & Serial Selection */}
              <Card className="rounded-2xl shadow-md border-none p-4">
                <Row gutter={16}>
                  <Col xs={24} sm={10}>
                    <Select
                      showSearch
                      placeholder="Select Equipment"
                      className="w-full h-12"
                      onChange={setSelectedProductId}
                      options={products.map(p => ({ label: p.name, value: p.id }))}
                    />
                  </Col>
                  <Col xs={24} sm={10}>
                    <Select
                      showSearch
                      placeholder="Select Serial"
                      className="w-full h-12"
                      value={selectedSerialId}
                      onChange={setSelectedSerialId}
                      disabled={!selectedProductId}
                      options={availableSerials.map(s => ({ label: s.serial_number, value: s.id }))}
                    />
                  </Col>
                  <Col xs={24} sm={4}>
                    <Button
                      type="primary"
                      className="h-12 w-full rounded-lg font-bold bg-primary hover:bg-primary"
                      onClick={handleAddItem}
                    >
                      ADD
                    </Button>
                  </Col>
                </Row>
              </Card>

              {/* Cart Table */}
              <Card className="rounded-2xl shadow-md border-none overflow-hidden">
                <Table
                  columns={columns}
                  dataSource={items}
                  pagination={false}
                  locale={{ emptyText: <Empty description="No items in cart" /> }}
                  className="ant-table-thead-bg-gray-50"
                />
              </Card>
            </Space>
          </Col>

          {/* RIGHT: Checkout Summary */}
          <Col xs={24} lg={8}>
            <Card className="rounded-3xl bg-slate-900 text-white p-6 sticky top-6 shadow-2xl border-none">
              <Title level={5} className="uppercase text-gray-400 tracking-widest mb-6 text-xs">
                Checkout Summary
              </Title>
              <div className="bg-slate-800/50 p-4 rounded-2xl mb-6">
                <Text className="text-blue-400 font-black text-xs uppercase block mb-1">
                  Total Due
                </Text>
                <Title level={2} className="!text-white !m-0 font-mono tracking-tight">
                  ${totalPrice.toFixed(2)}
                </Title>
              </div>
              <Button
                block
                type="primary"
                size="large"
                className="h-14 rounded-2xl bg-primary font-bold text-lg border-none shadow-lg hover:scale-[1.02] transition-transform"
                onClick={handleCreateSale}
                loading={loading}
              >
                COMPLETE TRANSACTION
              </Button>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}