'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Table, Input, Button, Tag, Space, Typography,
  Dropdown, Card, Row, Col, Statistic,
  message, Popconfirm, Divider, Badge, Tooltip as AntTooltip
} from 'antd';
import {
  PlusOutlined, SearchOutlined, FilterOutlined,
  EditOutlined, DeleteOutlined,
  DownOutlined, UpOutlined,
  FileExcelOutlined,
  InboxOutlined, ShoppingCartOutlined
} from '@ant-design/icons';
import {
  BarChart, Bar, Tooltip, ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend
} from 'recharts';

import { getInventoryItems, archiveInventoryItem } from '@/lib/inventory';
import InventoryDialog from './inventory-dialog';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;

interface InventoryItem {
  id: number;
  serial_number: string;
  status: 'available' | 'sold';
  sale_reference: string | null;
  customer_name: string | null;
}

interface InventoryProduct {
  product_id: number;
  product_name: string;
  total: number;
  available: string | number;
  sold: string | number;
  items: InventoryItem[];
}

export default function InventoryPage() {
  const [data, setData] = useState<InventoryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

const router = useRouter();

const fetchInventory = useCallback(async () => {
  setLoading(true);

  try {
    const res = await getInventoryItems({
      grouped: true,
      search,
      status: statusFilter,
    });

    // 🔥 permission check from response body
    if (res?.error === 'Permission denied') {
      router.push('/no-access');
      return;
    }

    setData(res?.data || []);
  } catch (err: any) {
    const msg =
      err?.response?.data?.error ||
      err?.message ||
      'Something went wrong';

    // 🔥 permission check from HTTP error
    if (
      err?.response?.status === 403 ||
      msg === 'Permission denied'
    ) {
      router.push('/no-access');
      return;
    }

    toast.error(msg);
  } finally {
    setLoading(false);
  }
}, [search, statusFilter, router]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const totals = useMemo(() => {
    return data.reduce((acc, curr) => ({
      available: acc.available + Number(curr.available),
      sold: acc.sold + Number(curr.sold)
    }), { available: 0, sold: 0 });
  }, [data]);

  const chartData = useMemo(() => data.map(d => ({
    name: d.product_name,
    Available: Number(d.available),
    Sold: Number(d.sold),
  })), [data]);

  const handleArchive = async (id: number) => {
    try {
      await archiveInventoryItem(id);
      toast.success('Item archived successfully');
      fetchInventory();
    } catch {
      toast.error('Operation failed');
    }
  };

  const exportExcel = async () => {
    const XLSX = await import('xlsx');
    const { saveAs } = await import('file-saver');
    const rows = data.flatMap(p => p.items.map(i => ({
      Product: p.product_name,
      Serial: i.serial_number,
      Status: i.status.toUpperCase(),
      Customer: i.customer_name || 'N/A',
      Reference: i.sale_reference || '-'
    })));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([excelBuffer]), `inventory_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const columns = [
    {
      title: 'Product Name',
      dataIndex: 'product_name',
      key: 'product_name',
      render: (text: string) => <Text strong style={{ color: '#1890ff' }}>{text}</Text>,
    },
    {
      title: 'Stock Summary',
      key: 'summary',
      render: (_: any, record: InventoryProduct) => (
        <Space size="middle">
          <Badge count={record.total} showZero color="#999" title="Total Units" />
          <Divider type="vertical" />
          <Text type="success">{record.available} Avail</Text>
          <Text type="secondary">{record.sold} Sold</Text>
        </Space>
      )
    },
    {
      title: 'Availability Rate',
      key: 'rate',
      render: (_: any, record: InventoryProduct) => {
        const rate = (Number(record.available) / record.total) * 100;
        return <Tag color={rate > 20 ? 'cyan' : 'volcano'}>{rate.toFixed(0)}% In Stock</Tag>;
      }
    }
  ];

  const expandedRowRender = (record: InventoryProduct) => (
    <Table
      dataSource={record.items}
      rowKey="id"
      pagination={false}
      size="small"
      columns={[
        { 
          title: 'Serial Number', 
          dataIndex: 'serial_number', 
          render: (s) => <code style={{ fontWeight: 'bold' }}>{s}</code> 
        },
        { 
          title: 'Status', 
          dataIndex: 'status',
          render: (s: string) => (
            <Badge status={s === 'available' ? 'success' : 'default'} text={s.toUpperCase()} />
          )
        },
        { title: 'Client / Hospital', dataIndex: 'customer_name', render: (c) => c || <Text type="disabled">Unassigned</Text> },
        { title: 'Ref #', dataIndex: 'sale_reference', render: (r) => <Text copyable={!!r}>{r || '-'}</Text> },
        {
          title: 'Actions',
          width: 100,
          render: (item: InventoryItem) => (
            <Space>
              <AntTooltip title="Edit Item">
                <Button size="small" type="text" icon={<EditOutlined />} onClick={() => { setEditingId(item.id); setDialogOpen(true); }} />
              </AntTooltip>
              <Popconfirm title="Archive this unit?" onConfirm={() => handleArchive(item.id)} okText="Yes" cancelText="No">
                <Button size="small" type="text" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Space>
          )
        }
      ]}
    />
  );

  return (
    <div style={{ padding: 24, background: '#f5f7f9', minHeight: '100vh' }}>
      {/* PAGE HEADER */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>Inventory Management</Title>
          <Text type="secondary">Track medical equipment by serial number and distribution status.</Text>
        </Col>
        <Col>
          <Space>
            <Button icon={<FileExcelOutlined />} onClick={exportExcel}>Export</Button>
            <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => { setEditingId(null); setDialogOpen(true); }}>
              Add New Stock
            </Button>
          </Space>
        </Col>
      </Row>
{/* STATS CARDS */}
<Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
  <Col xs={24} sm={12} md={6}>
    <Card variant="borderless" styles={{ body: { padding: 24 } }}>
      <Statistic title="Ready for Sale" value={totals.available} prefix={<InboxOutlined />} />
    </Card>
  </Col>

  <Col xs={24} sm={12} md={6}>
    <Card variant="borderless" styles={{ body: { padding: 24 } }}>
      <Statistic title="Total Units Sold" value={totals.sold} prefix={<ShoppingCartOutlined />} valueStyle={{ color: '#1890ff' }} />
    </Card>
  </Col>
  <Col xs={24} md={12}>
    <Card variant="borderless" styles={{ body: { padding: '16px 24px' } }}>
      {/* Give enough height for Recharts */}
      <div style={{ height: 250 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={120} />
            <Tooltip cursor={{ fill: 'transparent' }} />
            <Legend />
            <Bar dataKey="Available" stackId="a" fill="#52c41a" radius={[0, 4, 4, 0]} />
            <Bar dataKey="Sold" stackId="a" fill="#1890ff" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <Text type="secondary" style={{ fontSize: 12 }}>Stock Distribution Overview</Text>
    </Card>
  </Col>
</Row>

      {/* FILTERS & TABLE */}
      <Card variant="borderless" styles={{ body: { padding: 24 } }}>
       <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
  <Space wrap>
    <Input
      placeholder="Search Serial or Product..."
      prefix={<SearchOutlined />}
      allowClear
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      style={{ width: 300 }}
    />
    <Dropdown menu={{
      items: [
        { key: 'all', label: 'All Statuses', onClick: () => setStatusFilter(null) },
        { key: 'available', label: 'Available Only', onClick: () => setStatusFilter('available') },
        { key: 'sold', label: 'Sold Only', onClick: () => setStatusFilter('sold') },
      ]
    }}>
      <Button icon={<FilterOutlined />}>
        {statusFilter ? `Status: ${statusFilter}` : 'Filter Status'}
      </Button>
    </Dropdown>
  </Space>

  <Space>
    <Space.Compact>
      <Button icon={<DownOutlined />} onClick={() => setExpandedKeys(data.map(d => d.product_id))}>
        Expand
      </Button>
      <Button icon={<UpOutlined />} onClick={() => setExpandedKeys([])}>
        Collapse
      </Button>
    </Space.Compact>
  </Space>
</div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="product_id"
          loading={loading}
          expandable={{
            expandedRowRender,
            expandedRowKeys: expandedKeys,
            onExpandedRowsChange: (keys) => setExpandedKeys(keys as React.Key[])
          }}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>

      <InventoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingId={editingId}
        onSuccess={() => {
          setDialogOpen(false);
          fetchInventory();
        }}
      />
    </div>
  );
}