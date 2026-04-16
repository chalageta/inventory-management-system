'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Input, Form, message, Spin } from 'antd';
import { getPurchaseDetail, updatePurchase } from '@/lib/purchase';

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

        // ✅ YOUR API STRUCTURE
        const purchase = res.purchase;

        if (!purchase) {
          message.error('Purchase not found');
          return;
        }

        // ⚠️ Only allow edit if pending
        if (purchase.status !== 'pending') {
          message.error('Only pending purchases can be edited');
          router.push('/purchases');
          return;
        }

        form.setFieldsValue({
          supplier_name: purchase.supplier_name,
          supplier_phone: purchase.supplier_phone,
          invoice_no: purchase.invoice_no,
          reference: purchase.reference,
          total_items: purchase.total_items,
          note: purchase.note
        });

      } catch (err: any) {
        message.error(err?.message || 'Failed to load');
      } finally {
        setFetching(false);
      }
    };

    if (id) load();
  }, [id]);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      await updatePurchase(Number(id), values);
      message.success('Purchase updated');
      router.push('/purchases');
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Error updating');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <Spin style={{ marginTop: 100 }} />;
  }

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Form.Item name="supplier_name" label="Supplier Name">
        <Input />
      </Form.Item>

      <Form.Item name="supplier_phone" label="Supplier Phone">
        <Input />
      </Form.Item>

      <Form.Item name="invoice_no" label="Invoice No">
        <Input />
      </Form.Item>

      <Form.Item name="reference" label="Reference">
        <Input />
      </Form.Item>

      <Form.Item name="total_items" label="Total Items">
        <Input type="number" />
      </Form.Item>

      <Form.Item name="note" label="Note">
        <Input.TextArea />
      </Form.Item>

      <Button type="primary" htmlType="submit" loading={loading}>
        Update Purchase
      </Button>
    </Form>
  );
}