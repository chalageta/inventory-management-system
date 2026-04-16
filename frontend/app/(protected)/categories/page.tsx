'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Table,
  Input,
  Button,
  Tag,
  Space,
  Typography,
  Popconfirm,
  message,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import api from '@/lib/api';
import CategoriesDialog from './categories-dialog';
import { toast } from 'sonner';

const { Title, Text } = Typography;

interface Category {
  id: number;
  name: string;
  description: string | null;
  is_active: number | boolean;
  created_at: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const limit = 10;

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/categories', {
        params: {
          page,
          limit,
          search: search || undefined,
        },
      });

      setCategories(data.data || []);
      setTotal(data.pagination?.total || 0);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  // debounce search
  useEffect(() => {
    const delay = setTimeout(() => {
      setPage(1);
      fetchCategories();
    }, 400);

    return () => clearTimeout(delay);
  }, [search]);

  useEffect(() => {
    fetchCategories();
  }, [page]);

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/categories/${id}`);
      toast.success('Category deleted');
      fetchCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Delete failed');
    }
  };

  const columns = [
    {
      title: 'No',
      render: (_: any, __: any, index: number) =>
        (page - 1) * limit + index + 1,
      width: 70,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      ellipsis: true,
      render: (desc: string) =>
        desc ? (
          <Text type="secondary">{desc}</Text>
        ) : (
          <Text type="secondary" italic>
            No description
          </Text>
        ),
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      render: (active: boolean) => (
        <Tag color={active ? 'blue' : 'default'}>
          {active ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      align: 'right' as const,
      render: (record: Category) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => {
              setEditingId(record.id);
              setDialogOpen(true);
            }}
          />
          <Popconfirm
            title="Delete this category?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <Space
        style={{
          width: '100%',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0 }}>
            Categories
          </Title>
          <Text type="secondary">
            Manage and organize inventory groups
          </Text>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingId(null);
            setDialogOpen(true);
          }}
        >
          Add Category
        </Button>
      </Space>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search categories..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ width: 300 }}
        />
      </div>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={categories}
        rowKey="id"
        loading={loading}
        bordered
        pagination={{
          current: page,
          total: total,
          pageSize: limit,
          onChange: (p) => setPage(p),
          showSizeChanger: false,
        }}
      />

      {/* Dialog */}
      <CategoriesDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingId={editingId}
        onSuccess={() => {
          setDialogOpen(false);
          fetchCategories();
        }}
      />
    </div>
  );
}