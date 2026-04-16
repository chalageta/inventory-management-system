'use client';

import { useEffect, useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, message } from 'antd';
import { z } from 'zod';
import { createProduct, updateProduct, getProduct } from '@/lib/products';
import api from '@/lib/api';
import { toast } from 'sonner';

// =======================
// ✅ CLEAN ZOD SCHEMA
// =======================
const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  barcode: z.string().optional(),
  min_stock: z.number().min(0, 'Must be >= 0'),
  uom: z.string().min(1, 'Unit is required'),
  description: z.string().optional(),
  category_id: z.number({
    required_error: 'Category is required',
  }),
});

interface Category {
  id: number;
  name: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingId: number | null;
  onSuccess: () => void;
}

export default function ProductsDialog({
  open,
  onOpenChange,
  editingId,
  onSuccess,
}: Props) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // =======================
  // LOAD CATEGORIES
  // =======================
  useEffect(() => {
    if (!open) return;

    const fetchCategories = async () => {
      try {
        const { data } = await api.get('/categories');
        setCategories(data.data || []);
      } catch {
        message.error('Failed to load categories');
      }
    };

    fetchCategories();
  }, [open]);

  // =======================
  // LOAD PRODUCT (EDIT)
  // =======================
  useEffect(() => {
    if (open && editingId) {
      getProduct(editingId)
        .then((data) => {
          form.setFieldsValue({
            name: data.name,
            barcode: data.barcode,
            min_stock: data.min_stock,
            uom: data.uom,
            description: data.description,
            category_id: data.category_id,
          });
        })
        .catch(() => message.error('Failed to load product'));
    } else if (open) {
      form.resetFields();
    }
  }, [open, editingId]);
const handleSubmit = async () => {
  try {
    const values = await form.validateFields();

    const parsed = productSchema.parse({
      ...values,
      min_stock: Number(values.min_stock),
    });

    setLoading(true);

    if (editingId) {
      await updateProduct(editingId, parsed);
      toast.success('Product updated');
    } else {
      await createProduct(parsed);
      toast.success('Product created');
    }

    onSuccess();
    form.resetFields();

  } catch (err: any) {

    // =========================
    // ZOD ERROR
    // =========================
    if (err?.errors?.length) {
      message.error(err.errors[0].message);
      return;
    }

    // =========================
    // AXIOS / API ERROR (FIXED)
    // =========================
    const apiError =
      err?.response?.data?.error ||
      err?.response?.data?.message ||
      err?.message ||
      'Save failed';

    // 👇 show friendly message
    message.error(apiError);

    // optional toast (better UX)
    toast.error(apiError);

  } finally {
    setLoading(false);
  }
};

  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      onOk={handleSubmit}
      confirmLoading={loading}
      destroyOnHidden
      maskClosable={false}
      title={editingId ? 'Edit Product' : 'Create Product'}
      okText={editingId ? 'Update' : 'Create'}
    >
      <Form form={form} layout="vertical" className="grid grid-cols-2 gap-4">

        {/* Name */}
        <Form.Item
          label="Product Name"
          name="name"
          rules={[{ required: true, message: 'Required' }]}
          className="col-span-2"
        >
          <Input placeholder="Enter product name" />
        </Form.Item>

        {/* Category */}
        <Form.Item
          label="Category"
          name="category_id"
          rules={[{ required: true, message: 'Select category' }]}
          className="col-span-2"
        >
          <Select
            placeholder="Select category"
            options={categories.map((c) => ({
              label: c.name,
              value: c.id,
            }))}
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>

        {/* Barcode */}
        <Form.Item label="Barcode" name="barcode">
          <Input />
        </Form.Item>

        {/* Unit */}
        <Form.Item
          label="Unit (UOM)"
          name="uom"
          rules={[{ required: true }]}
        >
          <Input placeholder="pcs / kg / box" />
        </Form.Item>

        {/* Min Stock */}
        <Form.Item
          label="Minimum Stock"
          name="min_stock"
          rules={[{ required: true }]}
        >
          <InputNumber className="w-full" min={0} />
        </Form.Item>

        {/* Description */}
        <Form.Item
          label="Description"
          name="description"
          className="col-span-2"
        >
          <Input.TextArea rows={3} />
        </Form.Item>

      </Form>
    </Modal>
  );
}