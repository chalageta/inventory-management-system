'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Table, Button, Tag, Space, Typography,
  Popconfirm, Modal, Input, message, Select,
  Row, Col, Card, Grid
} from 'antd';
import {
  PlusOutlined,
  CheckOutlined,
  InboxOutlined,
  CloseOutlined,
  DeleteOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';

import {
  getPurchases,
  approvePurchase,
  receivePurchase,
  rejectPurchase,
  deletePurchase
} from '@/lib/purchase';

import PurchaseDialog from './purchase-dialog';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

const { Title, Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;


export default function PurchasePage() {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const [rejectModal, setRejectModal] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [reason, setReason] = useState('');

  const { can = () => false } = useAuth();

const canCreate = useCallback(() => can('create_purchase'), [can]);
  // =========================
  // FETCH
  // =========================
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPurchases({ page, limit, search, status });

      if (res?.data?.error === 'Permission denied') {
        router.push('/no-access');
        return;
      }

      const result = res.data;
      setData(result?.data || []);
      setTotal(result?.pagination?.total || 0);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message;
      toast.error(msg || 'Failed');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, status, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // =========================
  // ACTIONS
  // =========================
  const handleApprove = async (id: number) => {
    await approvePurchase(id);
    toast.success('Approved');
    fetchData();
  };

const handleReceive = async (id: number) => {
  try {
    await receivePurchase(id);

    toast.success('Received');
    fetchData();
  } catch (err: any) {
    const msg =
      err?.response?.data?.error ||
      err?.message ||
      'Failed to receive purchase';

    toast.error(msg);
  }
};

  const handleReject = async () => {
    if (!selectedId) return;
    await rejectPurchase(selectedId, reason);
    toast.success('Rejected');
    setRejectModal(false);
    setReason('');
    fetchData();
  };

  const handleDelete = async (id: number) => {
    await deletePurchase(id);
    toast.success('Deleted');
    fetchData();
  };

  // =========================
  // TABLE COLUMNS (RESPONSIVE)
  // =========================
  const columns: any[] = [
    {
      title: 'Product',
      dataIndex: 'product_name',
      responsive: ['xs', 'sm', 'md', 'lg'],
      render: (name: string) => <Text strong>{name}</Text>
    },
    {
      title: 'Supplier',
      responsive: ['md', 'lg', 'xl'],
      render: (r: any) => (
        <Space direction="vertical" size={0}>
          <Text>{r.supplier_name}</Text>
          <Text type="secondary">{r.supplier_phone}</Text>
        </Space>
      )
    },
    {
      title: 'Invoice',
      responsive: ['lg', 'xl'],
      render: (r: any) => (
        <Space direction="vertical" size={0}>
          <Tag color="cyan">{r.invoice_no}</Tag>
          <Text type="secondary">{r.reference || '-'}</Text>
        </Space>
      )
    },
    {
      title: 'Total',
      responsive: ['sm', 'md', 'lg', 'xl'],
      render: (r: any) => (
        <Space direction="vertical" size={0}>
          <Text>{r.total_items}</Text>
        </Space>
      )
    },
 {
  title: 'Status',
  dataIndex: 'status',
  render: (s: any) => {
    const status = typeof s === 'string' ? s : String(s || 'unknown');

    const colors: any = {
      pending: 'gold',
      approved: 'blue',
      received: 'green',
      cancelled: 'red',
      unknown: 'default'
    };

    return (
      <Tag color={colors[status] || 'default'}>
        {status.toUpperCase()}
      </Tag>
    );
  }
},
 {
  title: 'Actions',
  fixed: isMobile ? undefined : 'right',
  render: (_: any, record: any) => {
    const canApprove = can('approve_purchase');
    const canReject = can('reject_purchase');
    const canReceive = can('receive_purchase');
    const canDelete = can('delete_purchase');
    const canUpdate = can('update_purchase');

    return (
      <Space wrap>
        <Button
          size="small"
          onClick={() => router.push(`/purchases/${record.id}`)}
        >
          View
        </Button>

        {/* ===================== PENDING ONLY ===================== */}
        {record.status === 'pending' && (
          <>
            {canUpdate && (
              <Button
                size="small"
                type="default"
                onClick={() => router.push(`/purchases/edit/${record.id}`)}
              >
                Edit
              </Button>
            )}

            {canApprove && (
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleApprove(record.id)}
              />
            )}

            {canReject && (
              <Button
                danger
                size="small"
                icon={<CloseOutlined />}
                onClick={() => {
                  setSelectedId(record.id);
                  setRejectModal(true);
                }}
              />
            )}

            {canDelete && (
              <Popconfirm
                title="Delete purchase?"
                onConfirm={() => handleDelete(record.id)}
              >
                <Button danger type="text" icon={<DeleteOutlined />} />
              </Popconfirm>
            )}
          </>
        )}
        
        {record.status === 'pending' && canReceive && (
  <Button
    type="primary"
    ghost
    size="small"
    icon={<InboxOutlined />}
    onClick={() => handleReceive(record.id)}
  >
    Receive
  </Button>
)}

      </Space>
    );
  }
}
  ];

  return (
    <div style={{ padding: isMobile ? 12 : 24 }}>
      {/* HEADER */}
      <Row justify="space-between" align="middle" gutter={[12, 12]}>
        <Col xs={24} md={12}>
          <Title level={isMobile ? 4 : 3}>Purchase Management</Title>
        </Col>
   {canCreate() && (
        <Col xs={24} md={12} style={{ textAlign: isMobile ? 'left' : 'right' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            block={isMobile}
            onClick={() => setCreateModal(true)}
          >
            Create Purchase
          </Button>
        </Col>
   ) }
      </Row>

      {/* FILTERS */}
      <Card style={{ marginTop: 16, marginBottom: 16 }}>
        <Row gutter={[12, 12]}>
          <Col xs={24} md={12}>
            <Input
              placeholder="Search..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
            />
          </Col>

          <Col xs={24} md={6}>
            <Select
              placeholder="Status"
              allowClear
              style={{ width: '100%' }}
              onChange={(v) => {
                setPage(1);
                setStatus(v);
              }}
            >
              <Option value="pending">Pending</Option>
              <Option value="approved">Approved</Option>
              <Option value="received">Received</Option>
              <Option value="cancelled">Cancelled</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* TABLE */}
      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          scroll={{ x: 'max-content' }}
          pagination={{
            current: page,
            pageSize: limit,
            total,
            responsive: true,
            onChange: (p, l) => {
              setPage(p);
              setLimit(l);
            }
          }}
        />
      </Card>

      {/* CREATE */}
      <PurchaseDialog
        open={createModal}
        onClose={() => setCreateModal(false)}
        onSuccess={fetchData}
      />

      {/* REJECT */}
      <Modal
        title="Reject Purchase"
        open={rejectModal}
        onCancel={() => setRejectModal(false)}
        onOk={handleReject}
      >
        <Input.TextArea
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </Modal>
    </div>
  );
}