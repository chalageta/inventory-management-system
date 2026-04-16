'use client';

import { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Checkbox, Row, Col } from 'antd';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function UsersDialog({
  open,
  onOpenChange,
  onSuccess
}: any) {

  const [form] = Form.useForm();

  // ✅ FIX: always array
  const [roles, setRoles] = useState<any[]>([]);

  // =========================
  // LOAD ROLES
  // =========================
  useEffect(() => {
    if (open) {
      api.get('/rbac/roles')
        .then(res => {
          // ✅ FIX HERE (important)
          setRoles(res?.data?.data || []);
        })
        .catch(() => toast.error('Failed to load roles'));
    }
  }, [open]);

  // =========================
  // SUBMIT
  // =========================
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const payload = {
        name: values.name,
        email: values.email,
        password: values.password,
        phone: values.phone,
        gender: values.gender,
        address: values.address,
        bio: values.bio,

        // ✅ ensure array always
        roleIds: values.roleIds || []
      };

      await api.post('/auth/register', payload);

      toast.success('User created successfully');

      form.resetFields();
      onOpenChange(false);
      onSuccess();

    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to create user');
    }
  };

  return (
    <Modal
      title="Create User"
      open={open}
      maskClosable={false}
      closable={false}
      onCancel={() => onOpenChange(false)}
      onOk={handleSubmit}
      okText="Create User"
      width={750}
    >

      <Form form={form} layout="vertical">

        {/* ================= USER INFO ================= */}
        <Row gutter={16}>

          <Col span={12}>
            <Form.Item name="name" label="Full Name" rules={[{ required: true }]}>
              <Input placeholder="Enter name" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="email" label="Email" rules={[{ required: true }]}>
              <Input placeholder="Enter email" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="password" label="Password" rules={[{ required: true }]}>
              <Input.Password placeholder="Enter password" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="phone" label="Phone">
              <Input placeholder="+251..." />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="gender" label="Gender">
              <Select placeholder="Select gender">
                <Select.Option value="Male">Male</Select.Option>
                <Select.Option value="Female">Female</Select.Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="address" label="Address">
              <Input placeholder="Enter address" />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item name="bio" label="Bio">
              <Input.TextArea rows={3} placeholder="Short bio..." />
            </Form.Item>
          </Col>

        </Row>

        {/* ================= ROLES ================= */}
        <div className="mt-4 mb-2 font-semibold text-gray-600">
          Assign Roles
        </div>

        <Form.Item
          name="roleIds"
          rules={[{ required: true, message: 'Select at least one role' }]}
        >
          <Checkbox.Group className="w-full">

            <Row gutter={[10, 10]}>

              {Array.isArray(roles) && roles.map(role => (
                <Col span={12} key={role.id}>
                  <div className="p-2 border rounded hover:border-blue-400 transition">
                    <Checkbox value={role.id}>
                      {role.name}
                    </Checkbox>
                  </div>
                </Col>
              ))}

            </Row>

          </Checkbox.Group>
        </Form.Item>

      </Form>
    </Modal>
  );
}