'use client';

import { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Row,
  Col,
  message,
  Divider,
  Typography
} from 'antd';

import {
  ShoppingCartOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';

import { createPurchase } from '@/lib/purchase';
import { getProducts } from '@/lib/products';
import { toast } from 'sonner';

const { Text } = Typography;
const { Option } = Select;

interface PurchaseDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PurchaseDialog({
  open,
  onClose,
  onSuccess
}: PurchaseDialogProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // =========================
  // FETCH PRODUCTS
  // =========================
  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const res = await getProducts({ page: 1, limit: 100 });
      setProducts(res?.data || []);
    } catch {
      message.error('Failed to load products');
    } finally {
      setLoadingProducts(false);
    }
  };

  // =========================
  // RESET + LOAD
  // =========================
  useEffect(() => {
    if (open) {
      form.resetFields();
      fetchProducts();
    }
  }, [open]);

  // =========================
  // AUTO CALCULATE TOTAL
  // =========================
  const handleValuesChange = (_: any, allValues: any) => {
    const { total_items, unit_price } = allValues;

    if (total_items && unit_price) {
      const total = total_items * unit_price;
      form.setFieldsValue({ total_amount: total });
    }
  };

  // =========================
  // SUBMIT
  // =========================
const handleSubmit = async () => {
  try {
    const values = await form.validateFields();
    setLoading(true);

    const payload = {
      ...values,
      reference: values.reference || '',
      total_amount:
        values.total_amount ||
        values.total_items * values.unit_price
    };

    await createPurchase(payload);

    toast.success('Purchase created successfully');

    onSuccess();
    onClose();

  } catch (err: any) {
    const backendError =
      err?.response?.data?.error ||
      err?.message ||
      'Failed to create purchase';

    toast.error(backendError);

  } finally {
    setLoading(false);
  }
};

  return (
    <Modal
      title={
        <span>
          <ShoppingCartOutlined style={{ marginRight: 8 }} />
          New Purchase Order
        </span>
      }
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={720}
      okText="Create Order"
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleValuesChange}
        initialValues={{
          total_items: 1,
          unit_price: 0,
          total_amount: 0
        }}
      >

        {/* ========================= */}
        {/* PRODUCT */}
        {/* ========================= */}
        <Form.Item
          name="product_id"
          label="Product"
          rules={[{ required: true, message: 'Select product' }]}
        >
          <Select
            placeholder="Select product"
            loading={loadingProducts}
            showSearch
            optionFilterProp="children"
          >
            {products.map((p) => (
              <Option key={p.id} value={p.id}>
                {p.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* ========================= */}
        {/* INVOICE */}
        {/* ========================= */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="invoice_no"
              label="Invoice Number"
               >
              <Input placeholder="INV-2026-001" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="reference" label="Reference">
              <Input placeholder="PO-REF..." />
            </Form.Item>
          </Col>
        </Row>

        <Divider />

        {/* ========================= */}
        {/* SUPPLIER */}
        {/* ========================= */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="supplier_name"
              label="Supplier Name"
             
            >
              <Input placeholder="Global Med Inc." />
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
        {/* ORDER DETAILS */}
        {/* ========================= */}
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="total_items"
              label="Quantity"
              rules={[{ required: true, type: 'number', min: 1 }]}
            >
              <InputNumber style={{ width: '100%' }} min={1} />
            </Form.Item>
          </Col>
        </Row>

        {/* ========================= */}
        {/* NOTE */}
        {/* ========================= */}
        <Form.Item
          name="note"
          label="Internal Notes"
          tooltip={{
            title: 'Visible only internally',
            icon: <InfoCircleOutlined />
          }}
        >
          <Input.TextArea rows={3} placeholder="Optional notes..." />
        </Form.Item>

      </Form>
    </Modal>
  );
}