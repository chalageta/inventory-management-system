'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Button,
  Input,
  Form,
  message,
  Spin,
  Row,
  Col,
  Divider,
  InputNumber,
  Typography,
  Card,
  Space
} from 'antd';
import { getPurchaseDetail, updatePurchase } from '@/lib/purchase';
import { ArrowLeftOutlined, ShoppingCartOutlined } from '@ant-design/icons';

const { Title } = Typography;

export default function EditPurchasePage() {
  const { id } = useParams();
  const router = useRouter();

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setFetching(true);
        const res = await getPurchaseDetail(Number(id));
        const purchase = res.purchase;

        if (!purchase) {
          message.error('Purchase not found');
          router.push('/purchases');
          return;
        }

        if (purchase.status !== 'pending') {
          message.error('Only pending purchases can be edited');
          router.push('/purchases');
          return;
        }

        form.setFieldsValue({
          supplier_name: purchase.supplier_name,
          supplier_phone: purchase.supplier_phone,
          invoice_no: purchase.invoice_no,
          serial_number: purchase.serial_number,
          lot_number: purchase.lot_number,
          expiry_date: purchase.expiry_date ? purchase.expiry_date.split('T')[0] : null,
          location: purchase.location,
          total_items: purchase.total_items,
          unit_price: purchase.unit_cost,
          total_amount: purchase.total_cost,
          note: purchase.note
        });

      } catch (err: any) {
        message.error(err?.message || 'Failed to load purchase details');
      } finally {
        setFetching(false);
      }
    };

    if (id) load();
  }, [id, form, router]);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      await updatePurchase(Number(id), values);
      message.success('Purchase updated successfully');
      router.push('/purchases');
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Error updating purchase');
    } finally {
      setLoading(false);
    }
  };

  const handleValuesChange = (_: any, allValues: any) => {
    const { total_items, unit_price } = allValues;
    if (total_items && unit_price) {
      form.setFieldsValue({ total_amount: total_items * unit_price });
    }
  };

  if (fetching) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }}>
        <Spin size="large" tip="Loading Purchase Details..." />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={() => router.back()} 
        style={{ marginBottom: 16 }}
      >
        Back to List
      </Button>

      <Card
        title={
          <span>
            <ShoppingCartOutlined style={{ marginRight: 8 }} />
            Edit Purchase Order #{id}
          </span>
        }
      >
        <Form 
          form={form} 
          layout="vertical" 
          onFinish={onFinish}
          onValuesChange={handleValuesChange}
        >
          {/* ========================= */}
          {/* INVOICE & TRACKING */}
          {/* ========================= */}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="invoice_no" label="Invoice Number">
                <Input placeholder="INV-001" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="serial_number" label="Serial Number">
                <Input placeholder="Base Serial..." />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="lot_number" label="Lot Number">
                <Input placeholder="LOT-001..." />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="location" label="Receiving Location">
                <Input placeholder="Warehouse A..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="expiry_date" label="Expiry Date">
                <Input type="date" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          {/* ========================= */}
          {/* SUPPLIER */}
          {/* ========================= */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="supplier_name" label="Supplier Name">
                <Input placeholder="Supplier Name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="supplier_phone" label="Phone">
                <Input placeholder="+251..." />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          {/* ========================= */}
          {/* QUANTITY & PRICING */}
          {/* ========================= */}
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                name="total_items"
                label="Quantity"
                rules={[{ required: true, message: 'Required' }]}
              >
                <InputNumber style={{ width: '100%' }} min={1} />
              </Form.Item>
            </Col>
            <Col span={9}>
              <Form.Item name="unit_price" label="Unit Price ($)">
                <InputNumber style={{ width: '100%' }} min={0} precision={2} />
              </Form.Item>
            </Col>
            <Col span={9}>
              <Form.Item name="total_amount" label="Total Amount ($)">
                <InputNumber style={{ width: '100%' }} min={0} precision={2} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="note" label="Internal Notes">
            <Input.TextArea rows={3} placeholder="Optional notes..." />
          </Form.Item>

          <Row justify="end">
            <Space>
              <Button onClick={() => router.back()}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={loading} size="large">
                Update Purchase Order
              </Button>
            </Space>
          </Row>
        </Form>
      </Card>
    </div>
  );
}
