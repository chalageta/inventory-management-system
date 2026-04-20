'use client';

import { useEffect, useState } from 'react';
import { Modal, Form, Input, Button } from 'antd';
import api from '@/lib/api';
import { toast } from 'sonner';

interface CategoriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingId: number | null;
  onSuccess: () => void;
}

export default function CategoriesDialog({
  open,
  onOpenChange,
  editingId,
  onSuccess,
}: CategoriesDialogProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Sync form with editingId
  useEffect(() => {
    if (open) {
      if (editingId) {
        fetchCategory(editingId);
      } else {
        form.resetFields();
      }
    }
  }, [open, editingId, form]);

  const fetchCategory = async (id: number) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/categories/${id}`);
      form.setFieldsValue({
        name: data.name,
        description: data.description || '',
      });
    } catch (error: any) {
      toast.error('Failed to load category details');
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      if (editingId) {
        await api.put(`/categories/${editingId}`, values);
        toast.success('Category updated successfully');
      } else {
        await api.post('/categories', values);
        toast.success('Category created successfully');
      }
      onSuccess();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to save category';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <span className="text-xl font-black tracking-tight">
          {editingId ? 'Edit Category' : 'New Category'}
        </span>
      }
      open={open}
      onCancel={() => onOpenChange(false)}
      footer={null}
      maskClosable={false}
      closable={true}
      centered
      destroyOnHidden
      className="modern-modal"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        requiredMark={false}
        className="pt-4"
      >
        <Form.Item
          label={<span className="text-[10px] font-black uppercase text-slate-400">Category Name</span>}
          name="name"
          rules={[{ required: true, message: 'Please enter a category name' }]}
        >
          <Input
            placeholder="e.g. Electronics"
            className="rounded-xl bg-slate-50 border-slate-100 p-2.5 hover:border-blue-400 focus:border-primary"
          />
        </Form.Item>

        <Form.Item
          label={<span className="text-[10px] font-black uppercase text-slate-400">Description</span>}
          name="description"
        >
          <Input.TextArea
            placeholder="Enter category details..."
            rows={4}
            className="rounded-xl bg-slate-50 border-slate-100 p-2.5 hover:border-blue-400 focus:border-primary"
          />
        </Form.Item>

        <div className="flex gap-3 pt-4">
          <Button
            onClick={() => onOpenChange(false)}
            className="flex-1 rounded-xl font-bold h-11 border-slate-200"
          >
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className="flex-1 rounded-xl font-bold h-11 bg-primary shadow-lg shadow-blue-100 hover:bg-primary"
          >
            {editingId ? 'Update' : 'Create'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}