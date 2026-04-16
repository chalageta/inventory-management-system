'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Typography,
  Row,
  Col,
  Spin,
  Button,
  Space,
  message,
  Popconfirm,
  Divider,
  Grid
} from 'antd';

import { useParams } from 'next/navigation';
import api from '@/lib/api';

import {
  CheckOutlined,
  InboxOutlined,
  CloseOutlined
} from '@ant-design/icons';

import {
  approvePurchase,
  receivePurchase,
  rejectPurchase
} from '@/lib/purchase';

import { useAuth } from '@/lib/auth-context';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

export default function PurchaseDetailPage() {
  const { id } = useParams();
  const { can } = useAuth();
  const screens = useBreakpoint();

  const isMobile = !screens.md;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // =========================
  // FETCH
  // =========================
  const fetchDetail = async () => {
    try {
      const res = await api.get(`/purchases/${id}`);
      setData(res.data);
    } catch (err: any) {
      message.error(err?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  // =========================
  // ACTIONS
  // =========================
  const handleApprove = async () => {
    await approvePurchase(Number(id));
    message.success('Approved successfully');
    fetchDetail();
  };

  const handleReceive = async () => {
    await receivePurchase(Number(id));
    message.success('Stock received successfully');
    fetchDetail();
  };

  const handleReject = async () => {
    await rejectPurchase(Number(id), 'Rejected from detail page');
    message.success('Rejected successfully');
    fetchDetail();
  };

  if (loading) return <Spin size="large" />;

  const purchase = data?.purchase || {};
  const approver = data?.approver;
  const receiver = data?.receiver;
  const items = data?.items || [];

  // =========================
  // HELPERS
  // =========================
  const formatDate = (date: string) =>
    new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(new Date(date));

  const safeStatus = (s: any) =>
    typeof s === 'string' ? s.toLowerCase() : 'unknown';

  const statusColor: any = {
    pending: 'gold',
    approved: 'blue',
    received: 'green',
    cancelled: 'red'
  };

  // =========================
  // TABLE (ADDED UNIT PRICE)
  // =========================
  const columns = [
    {
      title: 'Serial Number',
      dataIndex: 'serial_number',
      responsive: ['md', 'lg', 'xl']
    },
    {
      title: 'Batch No',
      dataIndex: 'batch_no',
      responsive: ['sm', 'md', 'lg', 'xl']
    },
    {
      title: 'Cost Price',
      dataIndex: 'cost_price',
      responsive: ['sm', 'md', 'lg', 'xl'],
      render: (v: any) => <Text strong>${Number(v || 0).toFixed(2)}</Text>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (s: any) => {
        const status = safeStatus(s);
        return (
          <Tag color={status === 'available' ? 'green' : 'blue'}>
            {status.toUpperCase()}
          </Tag>
        );
      }
    }
  ];

  const canApprove = can('approve_purchase');
  const canReject = can('reject_purchase');
  const canReceive = can('receive_purchase');

  return (
    <div style={{ padding: isMobile ? 12 : 24 }}>

      {/* ================= HEADER ================= */}
      <Row
        justify="space-between"
        align={isMobile ? 'start' : 'middle'}
        gutter={[12, 12]}
      >
        <Col xs={24} md={12}>
          <Title level={isMobile ? 4 : 3}>Purchase Detail</Title>
        </Col>

        <Col xs={24} md={12}>
          <Space wrap style={{ justifyContent: isMobile ? 'flex-start' : 'flex-end', width: '100%' }}>

            {purchase.status === 'pending' && (
              <>
                {canApprove && (
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    onClick={handleApprove}
                  >
                    Approve
                  </Button>
                )}

                {canReject && (
                  <Popconfirm
                    title="Reject this purchase?"
                    onConfirm={handleReject}
                  >
                    <Button danger icon={<CloseOutlined />}>
                      Reject
                    </Button>
                  </Popconfirm>
                )}
              </>
            )}

            {purchase.status === 'approved' && canReceive && (
              <Button
                type="primary"
                icon={<InboxOutlined />}
                onClick={handleReceive}
              >
                Receive
              </Button>
            )}

          </Space>
        </Col>
      </Row>

      {/* ================= PURCHASE INFO ================= */}
      <Card style={{ marginTop: 16 }}>
        <Row gutter={[12, 12]}>

          <Col xs={24} sm={12} md={8}>
            <Text strong>Product:</Text> {purchase.product_name || '-'}
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Text strong>Supplier:</Text> {purchase.supplier_name || '-'}
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Text strong>Phone:</Text> {purchase.supplier_phone || '-'}
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Text strong>Invoice:</Text> {purchase.invoice_no || '-'}
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Text strong>Status:</Text>{' '}
            <Tag color={statusColor[purchase.status]}>
              {safeStatus(purchase.status).toUpperCase()}
            </Tag>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Text strong>Total Items:</Text> {purchase.total_items}
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Text strong>Total Amount:</Text> ${purchase.total_amount}
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Text strong>Created By:</Text> {purchase.created_by}
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Text strong>Created At:</Text>{' '}
            {purchase.created_at && formatDate(purchase.created_at)}
          </Col>

        </Row>
      </Card>

      {/* ================= APPROVER / RECEIVER ================= */}
      <Card style={{ marginTop: 16 }}>
        <Row gutter={[16, 16]}>

          <Col xs={24} md={12}>
            <Title level={5}>Approved By</Title>
            {approver ? (
              <Card size="small">
                <Text strong>{approver.name}</Text>
                <Divider />
                <Text type="secondary">
                  {formatDate(approver.created_at)}
                </Text>
              </Card>
            ) : (
              <Text type="secondary">Not approved yet</Text>
            )}
          </Col>

          <Col xs={24} md={12}>
            <Title level={5}>Received By</Title>
            {receiver ? (
              <Card size="small">
                <Text strong>{receiver.name}</Text>
                <Divider />
                <Text type="secondary">
                  {formatDate(receiver.created_at)}
                </Text>
              </Card>
            ) : (
              <Text type="secondary">Not received yet</Text>
            )}
          </Col>

        </Row>
      </Card>

      {/* ================= ITEMS ================= */}
      <Card title="Inventory Items" style={{ marginTop: 16 }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={items}
          pagination={false}
          scroll={{ x: 'max-content' }}
        />
      </Card>

    </div>
  );
}