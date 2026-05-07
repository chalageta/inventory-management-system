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
  Grid,
  Descriptions,
  Statistic,
  Breadcrumb
} from 'antd';

import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';

import {
  CheckOutlined,
  CloseOutlined,
  ArrowLeftOutlined,
  ShoppingOutlined,
  UserOutlined,
  FileTextOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  DollarCircleOutlined,
  SafetyCertificateOutlined,
  InboxOutlined
} from '@ant-design/icons';

import {
  approvePurchase,
  rejectPurchase
} from '@/lib/purchase';

import { useAuth } from '@/lib/auth-context';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

export default function PurchaseDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { can } = useAuth();
  const screens = useBreakpoint();

  const isMobile = !screens.md;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // =========================
  // FETCH
  // =========================
  const fetchDetail = async () => {
    try {
      const res = await api.get(`/purchases/${id}`);
      setData(res.data);
    } catch (err: any) {
      message.error(err?.message || 'Failed to load purchase details');
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
    try {
      setActionLoading(true);
      await approvePurchase(Number(id));
      message.success('Purchase approved successfully');
      fetchDetail();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Approval failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setActionLoading(true);
      await rejectPurchase(Number(id), 'Rejected from detail page');
      message.success('Purchase rejected');
      fetchDetail();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Rejection failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spin size="large" tip="Loading Purchase Records..." />
    </div>
  );

  const purchase = data?.purchase || {};
  const items = data?.items || [];

  // =========================
  // HELPERS
  // =========================
  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(new Date(date));
  };

  const statusColor: any = {
    pending: 'orange',
    approved: 'blue',
    received: 'green',
    cancelled: 'red'
  };

  // =========================
  // TABLE COLUMNS (DYNAMIC)
  // =========================
  const columns = [
    {
      title: 'Item ID',
      dataIndex: 'id',
      render: (val: any) => <Text code>#{val}</Text>
    },
    // Show Product Name and Model if Serial Number is null
    ...(!purchase.serial_number ? [
      {
        title: 'Product',
        dataIndex: 'product_name',
        render: (val: any) => <Text strong>{val}</Text>
      },
      {
        title: 'Model',
        dataIndex: 'model',
        render: (val: any) => val || '-'
      }
    ] : [
      {
        title: 'Serial Number',
        dataIndex: 'serial_number',
        render: (val: any) => val || <Tag>N/A</Tag>
      }
    ]),
    // Only show Lot Number column if it exists in the purchase
    ...(purchase.lot_number ? [
      {
        title: 'Lot Number',
        key: 'lot',
        render: () => purchase.lot_number
      }
    ] : []),
    // Only show Expiry Date column if it exists in the purchase
    ...(purchase.expiry_date ? [
      {
        title: 'Expiry Date',
        key: 'expiry',
        render: () => (
          <Tag color={new Date(purchase.expiry_date) < new Date() ? 'red' : 'default'}>
            {new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date(purchase.expiry_date))}
          </Tag>
        )
      }
    ] : []),
    {
      title: 'Unit Cost',
      key: 'cost',
      render: () => `$${Number(purchase.unit_cost || 0).toLocaleString()}`
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (s: any) => (
        <Tag color={s === 'available' ? 'green' : 'blue'}>
          {(s || 'unknown').toUpperCase()}
        </Tag>
      )
    }
  ];

  return (
    <div style={{ padding: isMobile ? 12 : 24, background: '#f5f7f9', minHeight: '100vh' }}>
      
      {/* ================= BREADCRUMB & HEADER ================= */}
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item onClick={() => router.push('/purchases')} style={{ cursor: 'pointer' }}>Purchases</Breadcrumb.Item>
        <Breadcrumb.Item>Purchase #{id}</Breadcrumb.Item>
      </Breadcrumb>

      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Space size="middle">
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => router.back()} 
              shape="circle" 
            />
            <div>
              <Title level={3} style={{ margin: 0 }}>Purchase Details</Title>
              <Text type="secondary">Invoice: {purchase.invoice_no || 'N/A'}</Text>
            </div>
            <Tag color={statusColor[purchase.status]} style={{ marginLeft: 8, borderRadius: 12 }}>
              {String(purchase.status).toUpperCase()}
            </Tag>
          </Space>
        </Col>

        <Col>
          <Space wrap>
            {purchase.status === 'pending' && (
              <>
                {can('approve_purchase') && (
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    onClick={handleApprove}
                    loading={actionLoading}
                  >
                    Approve
                  </Button>
                )}
                {can('reject_purchase') && (
                  <Popconfirm title="Reject this purchase?" onConfirm={handleReject}>
                    <Button danger icon={<CloseOutlined />} loading={actionLoading}>
                      Reject
                    </Button>
                  </Popconfirm>
                )}
              </>
            )}
          </Space>
        </Col>
      </Row>

      {/* ================= SUMMARY STATISTICS ================= */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card bordered={false}>
            <Statistic
              title="Total Quantity"
              value={purchase.total_items}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        {purchase.unit_cost !== null && (
          <Col xs={24} sm={8}>
            <Card bordered={false}>
              <Statistic
                title="Unit Price"
                value={purchase.unit_cost || 0}
                precision={2}
                prefix={<DollarCircleOutlined />}
              />
            </Card>
          </Col>
        )}
        {purchase.total_cost !== null && (
          <Col xs={24} sm={8}>
            <Card bordered={false}>
              <Statistic
                title="Total Cost"
                value={purchase.total_cost || 0}
                precision={2}
                prefix="$"
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
        )}
      </Row>

      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card title={<span><FileTextOutlined style={{ marginRight: 8 }} />Order Information</span>} bordered={false}>
            <Descriptions bordered column={{ xxl: 3, xl: 3, lg: 2, md: 1, sm: 1, xs: 1 }}>
              <Descriptions.Item label="Product Name" span={isMobile ? 1 : 2}>
                <Title level={5} style={{ margin: 0 }}>{purchase.product_name || '-'}</Title>
                {(purchase.manufacturer || purchase.model) && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {purchase.manufacturer || 'N/A'} • {purchase.model || 'N/A'}
                  </Text>
                )}
              </Descriptions.Item>
              {purchase.invoice_no && <Descriptions.Item label="Invoice No.">{purchase.invoice_no}</Descriptions.Item>}
              {purchase.location && (
                <Descriptions.Item label="Location">
                  <EnvironmentOutlined style={{ marginRight: 4, color: '#1890ff' }} />
                  {purchase.location}
                </Descriptions.Item>
              )}
              {purchase.lot_number && (
                <Descriptions.Item label="Lot Number">
                  <SafetyCertificateOutlined style={{ marginRight: 4 }} />
                  {purchase.lot_number}
                </Descriptions.Item>
              )}
              {purchase.expiry_date && (
                <Descriptions.Item label="Expiry Date">
                  {formatDate(purchase.expiry_date).split(',')[0]}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Created On">{formatDate(purchase.created_at)}</Descriptions.Item>
              <Descriptions.Item label="Created By">
                <UserOutlined style={{ marginRight: 4 }} />
                {purchase.created_by || '-'}
              </Descriptions.Item>
              {purchase.note && <Descriptions.Item label="Notes" span={isMobile ? 1 : 3}>{purchase.note}</Descriptions.Item>}
            </Descriptions>
          </Card>

          {(purchase.supplier_name || purchase.supplier_phone) && (
            <Card title={<span><ShoppingOutlined style={{ marginRight: 8 }} />Supplier Information</span>} bordered={false} style={{ marginTop: 24 }}>
              <Descriptions bordered column={isMobile ? 1 : 2}>
                {purchase.supplier_name && <Descriptions.Item label="Supplier Name">{purchase.supplier_name}</Descriptions.Item>}
                {purchase.supplier_phone && (
                  <Descriptions.Item label="Contact Phone">
                    <PhoneOutlined style={{ marginRight: 4 }} />
                    {purchase.supplier_phone}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>
          )}

          {/* ================= ITEMS TABLE ================= */}
          <Card title={<span><InboxOutlined style={{ marginRight: 8 }} />Inventory Items Tracking</span>} bordered={false} style={{ marginTop: 24 }}>
            <Table
              rowKey="id"
              columns={columns}
              dataSource={items}
              pagination={false}
              scroll={{ x: 'max-content' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

