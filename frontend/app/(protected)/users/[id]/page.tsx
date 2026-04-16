'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  Card, Row, Col, Input, Typography, Spin,
  Button, Form, Checkbox, message, Select,
  Avatar, Divider, Tag, Space
} from 'antd';
import {
  EditOutlined,
  StopOutlined,
  UserOutlined,
  SaveOutlined,
  CloseOutlined
} from '@ant-design/icons';
import api from '@/lib/api';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export default function UserDetailsPage() {
  const { id } = useParams();

  const [form] = Form.useForm();

  const [user, setUser] = useState<any>(null);
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [preview, setPreview] = useState<string | null>(null);
  const [fileList, setFileList] = useState<any[]>([]);

  const BASE_URL =
    process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';

  // ================= TOAST HANDLER =================
  const showSuccess = (msg: string) => message.success(msg);
  const showError = (err: any, fallback: string) =>
    message.error(err?.response?.data?.error || err?.message || fallback);

  // ================= FETCH =================
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [userRes, rolesRes, userRolesRes] = await Promise.all([
        api.get(`/auth/users/${id}`),
        api.get('/rbac/roles'),
        api.get(`/rbac/user-roles/${id}`)
      ]);

      const userData = userRes.data;

      const rolesList = rolesRes.data?.data || [];
      const assignedRoleIds =
        userRolesRes.data?.roles?.map((r: any) => r.id) || [];

      setUser(userData);
      setAvailableRoles(rolesList);

      if (userData.image) {
        setPreview(
          `${BASE_URL}${userData.image.startsWith('/') ? '' : '/'}${userData.image}`
        );
      }

      form.setFieldsValue({
        ...userData,
        roles: assignedRoleIds
      });

    } catch (err) {
      showError(err, 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  }, [id, form, BASE_URL]);

  useEffect(() => {
    if (id) fetchData();
  }, [id, fetchData]);

  // ================= SAVE =================
  const handleSave = async (values: any) => {
    setSaving(true);
    try {
      const formData = new FormData();

      formData.append('name', values.name || '');
      formData.append('email', values.email || '');
      formData.append('phone', values.phone || '');
      formData.append('address', values.address || '');
      formData.append('gender', values.gender || '');
      formData.append('bio', values.bio || '');

      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append('image', fileList[0].originFileObj);
      }

      const updateRes = await api.put(`/auth/users/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const roleRes = await api.post('/rbac/assign-roles', {
        userId: id,
        roleIds: values.roles || []
      });

      // ✅ backend-driven success messages
      showSuccess(
        updateRes?.data?.message ||
        roleRes?.data?.message ||
        'User updated successfully'
      );

      setIsEditing(false);
      setFileList([]);
      fetchData();

    } catch (err) {
      showError(err, 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  // ================= ACTIVATE / DEACTIVATE =================
  const handleDeactivate = async () => {
    try {
      const res = await api.put(`/auth/users/${id}/deactivate`);
      showSuccess(res?.data?.message || 'User deactivated');
      fetchData();
    } catch (err) {
      showError(err, 'Failed to deactivate user');
    }
  };

  const handleActivate = async () => {
    try {
      const res = await api.put(`/auth/users/${id}/activate`);
      showSuccess(res?.data?.message || 'User activated');
      fetchData();
    } catch (err) {
      showError(err, 'Failed to activate user');
    }
  };

  // ================= LOADING =================
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!user) return <div>User not found</div>;

  return (
    <div className="p-6 sm:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-5xl mx-auto">

        <Card className="rounded-2xl shadow-lg border-0">

          {/* PROFILE HEADER */}
          <div className="flex flex-col sm:flex-row gap-6 mb-8 items-start sm:items-center">

            <Avatar size={110} src={preview} icon={<UserOutlined />} />

            <div className="flex-1">
              <Title level={3} className="!mb-1">
                {user.name}
              </Title>

              <Text type="secondary">{user.email}</Text>

              <div className="mt-3 flex flex-wrap gap-2">
                <Tag color={user.is_active ? 'green' : 'red'}>
                  {user.is_active ? 'ACTIVE' : 'INACTIVE'}
                </Tag>

                {user.roles?.map((r: any, i: number) => (
                  <Tag key={i} color="blue">
                    {typeof r === 'string' ? r : r.name}
                  </Tag>
                ))}
              </div>
            </div>
          </div>

          {/* FORM */}
          <Form form={form} layout="vertical" onFinish={handleSave}>
            <Row gutter={[16, 16]}>

              <Col xs={24} md={12}>
                <Form.Item name="name" label="Full Name">
                  <Input disabled={!isEditing} />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item name="email" label="Email">
                  <Input disabled={!isEditing} />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item name="phone" label="Phone">
                  <Input disabled={!isEditing} />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item name="gender" label="Gender">
                  <Select disabled={!isEditing}>
                    <Option value="Male">Male</Option>
                    <Option value="Female">Female</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col span={24}>
                <Form.Item name="address" label="Address">
                  <Input disabled={!isEditing} />
                </Form.Item>
              </Col>

              <Col span={24}>
                <Form.Item name="bio" label="Bio">
                  <TextArea rows={3} disabled={!isEditing} />
                </Form.Item>
              </Col>
            </Row>

            {/* ROLES */}
            <Divider orientation="left">Roles</Divider>

            <Form.Item name="roles">
              <Checkbox.Group disabled={!isEditing}>
                <Row gutter={[10, 10]}>
                  {availableRoles.map((role) => (
                    <Col xs={12} sm={8} key={role.id}>
                      <div className="p-2 border rounded-lg hover:bg-slate-50 transition">
                        <Checkbox value={role.id}>
                          {role.name}
                        </Checkbox>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Checkbox.Group>
            </Form.Item>

            {/* ACTIONS */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">

              {!isEditing ? (
                <>
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </Button>

                  {user.is_active ? (
                    <Button danger icon={<StopOutlined />} onClick={handleDeactivate}>
                      Deactivate
                    </Button>
                  ) : (
                    <Button type="primary" onClick={handleActivate}>
                      Activate
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button
                    icon={<CloseOutlined />}
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    loading={saving}
                    htmlType="submit"
                  >
                    Save Changes
                  </Button>
                </>
              )}

            </div>

          </Form>
        </Card>
      </div>
    </div>
  );
}