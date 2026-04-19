'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Table, Card, Input, Button, Space, Modal,
  message, Popconfirm, Typography,
  Row, Col, Form, Divider, Badge, Spin, Tooltip,
  Select
} from 'antd';
import {
  SearchOutlined, EyeOutlined, PrinterOutlined,
  DeleteOutlined, ReloadOutlined, PlusOutlined,
  ShoppingCartOutlined, CloseOutlined, CheckCircleOutlined,
  CloseCircleOutlined, BoxPlotOutlined
} from '@ant-design/icons';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

const { Title, Text } = Typography;

export default function SalesPage() {
  const { can } = useAuth();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  // Modals
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  // Form
  const [form] = Form.useForm();
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);

  // =========================
  // DATA FETCHING
  // =========================
  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/sales', {
        params: { page, search, limit: 10 },
      });
      setSales(res.data.data || []);
      setPagination(res.data.pagination);
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Failed to load sales');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

const fetchInventory = async () => {
  try {
    const res = await api.get('/inventory', {
      params: { status: 'available', all: 'true' }  
    });

    setAvailableItems(res.data.data || []);

  } catch (err) {
    toast.error("Could not load available inventory");
  }
};  

  // =========================
  // WORKFLOW ACTIONS
  // =========================
  const handleApprove = async (id: number) => {
    try {
      await api.put(`/sales/${id}/approve`);
      toast.success('Sale approved by finance');
      fetchSales();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Approval failed');
    }
  };

  const handleReject = async (id: number) => {
    try {
      await api.put(`/sales/${id}/reject`);
      toast.warning('Sale rejected');
      fetchSales();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Rejection failed');
    }
  };

  const handleComplete = async (id: number) => {
    try {
      await api.put(`/sales/${id}/complete`);
      toast.success('Sale completed and dispatched');
      fetchSales();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Completion failed');
    }
  };

  const viewReceipt = async (id: number) => {
    setSelectedSale(null);
    setReceiptOpen(true);
    setReceiptLoading(true);
    try {
      const res = await api.get(`/sales/${id}/receipt`);
      setSelectedSale(res.data);
    } catch (err: any) {
      toast.error('Failed to load receipt');
      setReceiptOpen(false);
    } finally {
      setReceiptLoading(false);
    }
  };

  const handleCreateSale = async (values: any) => {
    try {
      setSubmitLoading(true);
      await api.post('/sales', {
        customer_name: values.customer_name,
        items: values.items.map((it: any) => ({
          product_id: it.product_id,
          inventory_item_id: it.inventory_item_id,
          sale_price: Number(it.sale_price)
        }))
      });
      toast.success('Sale created successfully');
      setCreateOpen(false);
      form.resetFields();
      fetchSales();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Creation failed');
    } finally {
      setSubmitLoading(false);
    }
  };

  const archiveSale = async (id: number) => {
    try {
      await api.delete(`/sales/${id}`);
      message.success('Sale archived');
      fetchSales();
    } catch (err) {
      message.error('Archive failed');
    }
  };

  // =========================
  // TABLE CONFIG (WITH PERMISSIONS)
  // =========================
  const columns = [
    {
      title: 'Reference',
      dataIndex: 'reference',
      render: (ref: string) => <Text strong className="text-blue-600">{ref}</Text>
    },
    {
      title: 'Customer',
      dataIndex: 'customer_name',
    },
    {
      title: 'Amount',
      dataIndex: 'total_amount',
      render: (amt: any) => <Text strong>{Number(amt || 0).toLocaleString()} ETB</Text>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status: string) => {
        const colors: any = { 'Completed': 'success', 'Rejected': 'error', 'Approved': 'processing', 'Pending': 'warning' };
        return <Badge status={colors[status] || 'default'} text={status} />;
      }
    },
    {
      title: 'Actions',
      align: 'right' as any,
      render: (_: any, record: any) => {
        // PERMISSION CHECKS BASED ON YOUR BACKEND ROUTER
        const canApprove = can('approve_sale');
        const canReject = can('reject_sale');
        const canComplete = can('complete_sale');
        const canDelete = can('delete_sale');
        const canView = can('view_sales');

        return (
          <Space>
            {canView && (
              <Tooltip title="View Receipt">
                <Button size="small" icon={<EyeOutlined />} onClick={() => viewReceipt(record.id)} />
              </Tooltip>
            )}

            {/* FINANCE PERMISSIONS */}
            {record.status === 'Pending' && (
              <Space>
                {canApprove && (
                  <Button 
                    size="small" 
                    type="primary" 
                    icon={<CheckCircleOutlined />} 
                    onClick={() => handleApprove(record.id)}
                  >
                    Approve
                  </Button>
                )}
                {canReject && (
                  <Popconfirm title="Reject this sale?" onConfirm={() => handleReject(record.id)}>
                    <Button size="small" danger icon={<CloseCircleOutlined />}>Reject</Button>
                  </Popconfirm>
                )}
              </Space>
            )}

            {/* STORE PERMISSIONS */}
            {record.status === 'Approved' && canComplete && (
              <Button 
                size="small" 
                style={{ background: '#52c41a', color: '#fff' }} 
                icon={<BoxPlotOutlined />} 
                onClick={() => handleComplete(record.id)}
              >
                Complete
              </Button>
            )}

            {/* DELETE PERMISSION */}
            {canDelete && (
              <Popconfirm title="Archive record?" onConfirm={() => archiveSale(record.id)}>
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            )}
          </Space>
        );
      }
    }
  ];

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <Row justify="space-between" align="middle" className="mb-6">
          <Col>
            <Title level={2} style={{ margin: 0 }}>Sales Management</Title>
            <Text type="secondary">Revenue and Inventory Workflow</Text>
          </Col>
          <Col>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={fetchSales}>Refresh</Button>
              {can('create_sale') && (
                <Button 
                  type="primary" 
                  size="large" 
                  icon={<PlusOutlined />} 
                  onClick={() => { setCreateOpen(true); fetchInventory(); }}
                >
                  New Sale
                </Button>
              )}
            </Space>
          </Col>
        </Row>

        <Card className="shadow-sm border-0">
          <Table
            loading={loading}
            columns={columns}
            dataSource={sales}
            rowKey="id"
            scroll={{ x: 900 }}
            pagination={{
              current: page,
              total: pagination?.totalItems,
              pageSize: 10,
              onChange: (p) => setPage(p),
            }}
          />
        </Card>
      </div>

      {/* RECEIPT MODAL */}
      <Modal
        title={null}
        open={receiptOpen}
        onCancel={() => setReceiptOpen(false)}
        destroyOnClose
        footer={[
          <Button key="close" onClick={() => setReceiptOpen(false)}>Close</Button>,
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={() => window.print()}>Print</Button>
        ]}
        width={500}
      >
        <div className="py-4">
          {receiptLoading ? <div className="text-center py-20"><Spin tip="Loading..." /></div> : selectedSale && (
            <div id="receipt-content" className="receipt-paper">
              <div className="text-center mb-6">
                <Title level={4}>{selectedSale.header?.company}</Title>
                <Text type="secondary">{selectedSale.header?.address}</Text>
                <Divider dashed />
                <Text strong>SALES RECEIPT</Text>
              </div>
              <Row gutter={[0, 8]} className="mb-6 text-xs">
                <Col span={12}><Text type="secondary">Ref:</Text> {selectedSale.header?.reference}</Col>
                <Col span={12} className="text-right">{new Date(selectedSale.header?.date).toLocaleDateString()}</Col>
                <Col span={24}><Text type="secondary">Customer:</Text> {selectedSale.header?.customer}</Col>
              </Row>
              <table className="w-full text-xs mb-6">
                <thead><tr className="border-b-2 border-black"><th className="text-left py-2">Item</th><th className="text-center py-2">Qty</th><th className="text-right py-2">Price</th></tr></thead>
                <tbody>
                  {selectedSale.items?.map((item: any, i: number) => (
                    <tr key={i} className="border-b border-dashed">
                      <td className="py-2"><b>{item.name}</b><br/><span className="text-gray-400">SN: {item.serials}</span></td>
                      <td className="text-center">{item.qty}</td>
                      <td className="text-right">{Number(item.sale_price).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="bg-gray-50 p-3 flex justify-between">
                <Text strong>TOTAL</Text>
                <Text strong>{Number(selectedSale.summary?.total).toLocaleString()} ETB</Text>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* CREATE SALE MODAL */}
      <Modal
        title="New Sale"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        footer={null}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateSale}>
          <Form.Item name="customer_name" label="Customer Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.List name="items" initialValue={[{}]}>
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row key={key} gutter={12} className="bg-slate-50 p-3 rounded mb-2">
                    <Col span={14}>
                      <Form.Item {...restField} name={[name, 'inventory_item_id']} label="Item" rules={[{ required: true }]}>
                        <Select showSearch onChange={(val) => form.setFieldValue(['items', name, 'product_id'], availableItems.find(i => i.id === val)?.product_id)}>
                          {availableItems.map(item => <Select.Option key={item.id} value={item.id}>{item.product_name} ({item.serial_number})</Select.Option>)}
                        </Select>
                      </Form.Item>
                      <Form.Item name={[name, 'product_id']} hidden><Input /></Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item {...restField} name={[name, 'sale_price']} label="Price" rules={[{ required: true }]}>
                        <Input type="number" />
                      </Form.Item>
                    </Col>
                    <Col span={2} className="pt-8"><Button type="text" danger icon={<CloseOutlined />} onClick={() => remove(name)} /></Col>
                  </Row>
                ))}
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Add Item</Button>
              </>
            )}
          </Form.List>
          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={submitLoading}>Submit</Button>
          </div>
        </Form>
      </Modal>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #receipt-content, #receipt-content * { visibility: visible; }
          #receipt-content { position: absolute; left: 0; top: 0; width: 100%; }
        }
        .receipt-paper { font-family: monospace; color: #000; }
      `}</style>
    </div>
  );
}