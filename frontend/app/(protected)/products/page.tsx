'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Table, Input, Button, Tag, Space, Typography,
  Dropdown, Popconfirm, Card, Row, Col, Statistic,
  Badge, Modal, Upload, Select
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  SearchOutlined, ExclamationCircleOutlined,
  FileExcelOutlined, InboxOutlined,
  LineChartOutlined
} from '@ant-design/icons';
import {
  BarChart, Bar, Tooltip, ResponsiveContainer,
  CartesianGrid, XAxis, YAxis
} from 'recharts';

import ProductsDialog from './products-dialog';
import { getProducts, archiveProduct, uploadProductsExcel } from '@/lib/products';
import { toast } from 'sonner';
import api from '@/lib/api';

const { Title, Text } = Typography;

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const limit = 10;

  // =========================
  // LOAD CATEGORIES
  // =========================
useEffect(() => {
  const loadCategories = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/categories', {
        params: {
          page: 1,
          limit: 100,
          search: search || undefined,
        },
      });

      setCategories(data?.data || []);
    } catch (err) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  loadCategories();
}, [search]);

  // =========================
  // FETCH PRODUCTS
  // =========================
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getProducts({
        search: search || undefined,
        status: status || undefined,
        category_id:
          selectedCategories.length > 0
            ? selectedCategories.join(',')
            : undefined,
        page,
        limit
      });

      setProducts(res.data || []);
      setTotal(res.pagination?.total || 0);
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [search, status, page, selectedCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // =========================
  // STATS
  // =========================
  const stats = useMemo(() => {
    const lowStockCount = products.filter(
      p => (p.quantity_available || 0) <= (p.min_stock || 3)
    ).length;

    const chartData = products.slice(0, 6).map(p => ({
      name: p.name.length > 12 ? p.name.substring(0, 12) + '...' : p.name,
      Stock: p.quantity_available || 0,
    }));

    return { lowStockCount, chartData };
  }, [products]);

  // =========================
  // DELETE
  // =========================
  const handleDelete = async (id: number) => {
    try {
      await archiveProduct(id);
      toast.success('Product archived');
      fetchProducts();
    } catch (err) {
      toast.error('Archive failed');
    }
  };

  // =========================
  // TABLE COLUMNS
  // =========================
  const columns = [
    {
      title: 'Product Info',
      key: 'info',
      render: (p: any) => (
        <Space direction="vertical" size={0}>
          <Text strong>{p.name}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {p.manufacturer} | {p.model}
          </Text>
          <Tag color="blue">{p.category_name}</Tag>
        </Space>
      )
    },
    {
      title: 'Stock Level',
      key: 'stock',
      render: (p: any) => {
        const qty = p.quantity_available || 0;
        const low = qty <= (p.min_stock || 3);

        return (
          <Space>
            <Badge status={low ? 'error' : 'success'} />
            <Text strong style={{ color: low ? '#f5222d' : '#52c41a' }}>
              {qty}
            </Text>
          </Space>
        );
      }
    },
    {
      title: 'Actions',
      align: 'right',
      render: (p: any) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingId(p.id);
              setDialogOpen(true);
            }}
          />
          <Popconfirm
            title="Archive product?"
            onConfirm={() => handleDelete(p.id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  // =========================
  // RESET FILTERS
  // =========================
  const resetFilters = () => {
    setSearch('');
    setStatus(null);
    setSelectedCategories([]);
    setPage(1);
  };

  return (
    <div style={{ padding: 24, background: '#f5f7f9', minHeight: '100vh' }}>

      {/* HEADER */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>Products Management</Title>
          <Text type="secondary">
            Monitor stock levels and manage equipment
          </Text>
        </Col>
        <Col>
          <Space>
            <Button onClick={resetFilters}>Reset Filters</Button>

            <Button icon={<InboxOutlined />} onClick={() => setUploadOpen(true)}>
              Import Excel
            </Button>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingId(null);
                setDialogOpen(true);
              }}
            >
              Add Product
            </Button>
          </Space>
        </Col>
      </Row>

      {/* STATS */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={6}>
          <Card>
            <Statistic
              title="Low Stock"
              value={stats.lowStockCount}
              valueStyle={{ color: '#cf1322' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} md={18}>
          <Card title={<span><LineChartOutlined /> Top Stock</span>}>
            <div style={{ height: 120 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chartData}>
                  <CartesianGrid />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="Stock" fill="#1890ff" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      {/* FILTERS */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>

          <Input
            placeholder="Search products..."
            prefix={<SearchOutlined />}
            style={{ width: 250 }}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />

          {/* CATEGORY FILTER */}
          <Select
            mode="multiple"
            placeholder="Filter categories"
            style={{ width: 250 }}
            options={categories.map(c => ({
              label: c.name,
              value: c.id
            }))}
            onChange={(vals) => {
              setSelectedCategories(vals);
              setPage(1);
            }}
          />

          <Select
            placeholder="Stock status"
            style={{ width: 180 }}
            allowClear
            onChange={(val) => {
              setStatus(val);
              setPage(1);
            }}
            options={[
              { value: 'low_stock', label: 'Low Stock' }
            ]}
          />

        </Space>
      </Card>

      {/* TABLE */}
      <Card>
        <Table
          rowKey="id"
          dataSource={products}
          columns={columns}
          loading={loading}
          pagination={{
            current: page,
            total,
            pageSize: limit,
            onChange: (p) => setPage(p)
          }}
        />
      </Card>

      {/* DIALOG */}
      <ProductsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingId={editingId}
        onSuccess={fetchProducts}
      />

      {/* IMPORT MODAL */}
      <Modal
        title="Import Excel"
        open={uploadOpen}
        onCancel={() => !uploading && setUploadOpen(false)}
        footer={null}
      >
        <Upload.Dragger
          accept=".xlsx,.xls"
          showUploadList={false}
          customRequest={async ({ file, onSuccess, onError }) => {
            try {
              setUploading(true);
              const res = await uploadProductsExcel(file as File);

              toast.success(
                `Imported ${res.insertedProducts} products`
              );

              onSuccess?.(res);
              setUploadOpen(false);
              fetchProducts();
            } catch (err: any) {
              toast.error(err.response?.data?.error || 'Import failed');
              onError?.(err);
            } finally {
              setUploading(false);
            }
          }}
        >
          <p className="ant-upload-drag-icon">
            <FileExcelOutlined />
          </p>
          <p>Click or drag Excel file here</p>
        </Upload.Dragger>
      </Modal>

    </div>
  );
}