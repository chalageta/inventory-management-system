'use client';

import { useEffect, useState } from 'react';
import {
  Card, Table, Button, Modal, Form, Input, message,
  Space, Typography, Tag, Checkbox, Row, Col, Divider,
  Popconfirm, Steps, Badge
} from 'antd';

import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  SafetyOutlined, ArrowRightOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';

import api from '@/lib/api';
import { ShieldEllipsisIcon } from 'lucide-react';

const { Title, Text } = Typography;

export default function RoleManagementPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // pagination + search
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isEdit, setIsEdit] = useState(false);

  const [form] = Form.useForm();
  const [activeRoleId, setActiveRoleId] = useState<number | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

  // ================= LOAD =================
  const fetchData = async (pageNum = page, searchText = search) => {
    setLoading(true);
    try {
      const [roleRes, permRes] = await Promise.all([
        api.get('/rbac/roles', {
          params: {
            page: pageNum,
            limit,
            search: searchText
          }
        }),
        api.get('/rbac/permissions')
      ]);

      setRoles(roleRes.data.data || []);
      setTotal(roleRes.data.pagination?.total || 0);
      setPermissions(permRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ================= OPEN CREATE =================
  const openCreateModal = () => {
    setIsEdit(false);
    setActiveRoleId(null);
    setCurrentStep(0);
    setSelectedPermissions([]);
    form.resetFields();
    setIsModalOpen(true);
  };

  // ================= OPEN EDIT =================
  const openEditModal = async (role: any) => {
    setIsEdit(true);
    setActiveRoleId(role.id);
    setCurrentStep(0);
    form.setFieldsValue({ name: role.name });

    try {
      const res = await api.get(`/rbac/role-permissions/${role.id}`);
      setSelectedPermissions(res.data.permissions.map((p: any) => p.id));
    } catch {
      message.error('Failed to load permissions');
    }

    setIsModalOpen(true);
  };

  // ================= STEP 1 =================
  const handleNextStep = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (isEdit && activeRoleId) {
        await api.put(`/rbac/roles/${activeRoleId}`, {
          name: values.name
        });
      } else {
        const res = await api.post('/rbac/roles', {
          name: values.name
        });

        const newId = res.data.roleId || res.data.id;
        if (!newId) throw new Error("Role ID missing");

        setActiveRoleId(newId);
      }

      setCurrentStep(1);
    } catch {
      message.error("Failed to proceed");
    } finally {
      setSubmitting(false);
    }
  };

  // ================= FINAL SAVE =================
  const handleFinalSave = async () => {
    if (!activeRoleId) return message.error("Role missing");

    setSubmitting(true);
    try {
      await api.post('/rbac/assign-permissions', {
        roleId: activeRoleId,
        permissionIds: selectedPermissions || []
      });

      message.success(isEdit ? 'Role updated successfully' : 'Role created successfully');

      setIsModalOpen(false);
      setCurrentStep(0);
      setSelectedPermissions([]);

      fetchData(page, search);
    } catch {
      message.error('Failed to save permissions');
    } finally {
      setSubmitting(false);
    }
  };

  // ================= DELETE =================
  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/rbac/roles/${id}`);
      message.success('Role deleted');
      fetchData(page, search);
    } catch {
      message.error('Delete failed');
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 bg-slate-50 min-h-screen">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:justify-between gap-3 bg-white p-4 sm:p-6 rounded-2xl shadow-sm">
        <div>
          <Title level={3} className="!mb-0 flex items-center gap-2">
            <ShieldEllipsisIcon /> Role Access Control
          </Title>
          <Text type="secondary">Manage roles and permissions</Text>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreateModal}
        >
          Create Role
        </Button>
      </div>

      {/* SEARCH */}
      <div className="mt-4 mb-3">
        <Input.Search
          placeholder="Search roles..."
          allowClear
          onSearch={(value) => {
            setSearch(value);
            setPage(1);
            fetchData(1, value);
          }}
        />
      </div>

      {/* TABLE */}
      <Card className="rounded-2xl">
        <Table
          rowKey="id"
          loading={loading}
          dataSource={roles}
          pagination={{
            current: page,
            pageSize: limit,
            total,
            onChange: (p) => {
              setPage(p);
              fetchData(p, search);
            }
          }}
          columns={[
            {
              title: 'Role Name',
              dataIndex: 'name',
              render: (t) => <b>{t}</b>
            },
            {
              title: 'Status',
              render: () => <Badge status="success" text="Active" />
            },
            {
              title: 'Actions',
              render: (_, r) => (
                <Space>
                  <Button icon={<EditOutlined />} onClick={() => openEditModal(r)}>
                    Edit
                  </Button>

                  <Popconfirm title="Delete?" onConfirm={() => handleDelete(r.id)}>
                    <Button danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              )
            }
          ]}
        />
      </Card>

      {/* MODAL */}
      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width="90%"
        style={{ maxWidth: 900 }}
        centered
      >

        <Steps
          current={currentStep}
          items={[
            { title: 'Identity' },
            { title: 'Permissions' }
          ]}
          className="mb-6"
        />

        {/* STEP 1 */}
        {currentStep === 0 && (
          <div>
            <Form form={form} layout="vertical">
              <Form.Item
                name="name"
                label="Role Name"
                rules={[{ required: true }]}
              >
                <Input size="large" />
              </Form.Item>
            </Form>

            <Button
              type="primary"
              loading={submitting}
              onClick={handleNextStep}
              icon={<ArrowRightOutlined />}
              block
            >
              Next
            </Button>
          </div>
        )}

        {/* STEP 2 */}
        {currentStep === 1 && (
          <>
            <Divider>Permissions</Divider>

            <Checkbox.Group
              value={selectedPermissions}
              onChange={(v) => setSelectedPermissions(v as number[])}
            >
              <Row gutter={[10, 10]}>
                {permissions.map((p) => (
                  <Col xs={24} sm={12} md={8} key={p.id}>
                    <div className="p-3 border rounded">
                      <Checkbox value={p.id}>
                        <div>
                          <b>{p.module}</b>
                          <div>{p.name}</div>
                        </div>
                      </Checkbox>
                    </div>
                  </Col>
                ))}
              </Row>
            </Checkbox.Group>

            <div className="flex justify-between mt-5">
              <Button onClick={() => setCurrentStep(0)}>
                Back
              </Button>

              <Button
                type="primary"
                loading={submitting}
                onClick={handleFinalSave}
                icon={<CheckCircleOutlined />}
              >
                Save
              </Button>
            </div>
          </>
        )}

      </Modal>
    </div>
  );
}