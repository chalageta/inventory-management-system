'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Table,
  Input,
  Button,
  Tag,
  Space,
  Typography,
  Dropdown,
  Popconfirm
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  FilterOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';

import ProductsDialog from './products-dialog';
import { getProducts, archiveProduct } from '@/lib/products';
import { toast } from 'sonner';

const { Title, Text } = Typography;

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const limit = 10;

  // =========================
  // FETCH PRODUCTS
  // =========================
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getProducts({
        search: search || undefined,
        status: status || undefined,
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
  }, [search, status, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // =========================
  // ARCHIVE
  // =========================
const handleDelete = async (id: number) => {
  try {
    await archiveProduct(id);
    toast.success('Product archived');
    fetchProducts();
  } catch (err: any) {
    const message =
      err?.response?.data?.error ||
      err?.message ||
      'Archive failed';

    toast.error(message);
  }
};

  // =========================
  // FILTER MENU (FIXED)
  // =========================
  const filterMenu = {
    items: [
      {
        key: 'all',
        label: 'All',
        onClick: () => setStatus(null)
      },
      {
        key: 'low_stock',
        label: 'Low Stock',
        onClick: () => setStatus('low_stock')
      }
    ]
  };

  // =========================
  // TABLE COLUMNS (FIXED)
  // =========================
  const columns = [
    {
      title: 'No',
      render: (_: any, __: any, index: number) =>
        (page - 1) * limit + index + 1,
      width: 70
    },

    {
      title: 'Product',
      render: (p: any) => (
        <div>
          <Text strong>{p.name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            ID: #{p.id}
          </Text>
        </div>
      )
    },

    {
      title: 'Barcode',
      render: (p: any) => (
        <Text type="secondary">{p.barcode || '-'}</Text>
      )
    },

    {
      title: 'Category',
      dataIndex: 'category_name',
      render: (t: string) => t || 'Uncategorized'
    },

    // =========================
    // STOCK (FIXED FIELD)
    // =========================
    {
      title: 'Stock',
      render: (p: any) => {
        const qty = p.quantity_available || 0;
        const low = qty <= (p.min_stock || 0);

        return (
          <Tag
            color={low ? 'red' : 'green'}
            icon={low ? <ExclamationCircleOutlined /> : null}
          >
            {qty} {p.uom}
          </Tag>
        );
      }
    },

    {
      title: 'Created By',
      dataIndex: 'creator_name',
      render: (name: string) => name || 'System'
    },

    {
      title: 'Actions',
      align: 'right' as const,
      render: (p: any) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => {
              setEditingId(p.id);
              setDialogOpen(true);
            }}
          />

          <Popconfirm
            title="Archive this product?"
            onConfirm={() => handleDelete(p.id)}
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  // =========================
  // UI
  // =========================
  return (
    <div style={{ padding: 24 }}>

      {/* HEADER */}
      <Space
        style={{
          width: '100%',
          justifyContent: 'space-between',
          marginBottom: 20
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0 }}>
            Products Inventory
          </Title>
          <Text type="secondary">
            Manage stock and categories
          </Text>
        </div>

        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingId(null);
              setDialogOpen(true);
            }}
          >
            Create
          </Button>

          <Dropdown menu={filterMenu} trigger={['click']}>
            <Button icon={<FilterOutlined />}>
              Filter
            </Button>
          </Dropdown>
        </Space>
      </Space>

      {/* SEARCH */}
      <div style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search by name or barcode..."
          prefix={<SearchOutlined />}
          value={search}
          allowClear
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{ width: 320 }}
        />
      </div>

      {/* TABLE */}
      <Table
        columns={columns}
        dataSource={products}
        rowKey="id"
        loading={loading}
        bordered
          scroll={{
    x: 900, 
  }}

        pagination={{
          current: page,
          total,
          pageSize: limit,
           responsive: true,
          onChange: (p) => setPage(p)
        }}
      />

      {/* DIALOG */}
      <ProductsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingId={editingId}
        onSuccess={() => {
          setDialogOpen(false);
          fetchProducts();
        }}
      />
    </div>
  );
}