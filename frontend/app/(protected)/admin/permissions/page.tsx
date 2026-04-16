'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Space,
  Typography,
  Popconfirm,
  Tag,
  Select,
  Row,
  Col,
} from 'antd';

import {
  PlusOutlined,
  DeleteOutlined,
  SafetyOutlined,
  SearchOutlined,
} from '@ant-design/icons';

import api from '@/lib/api';
import { toast } from 'sonner';

const { Title } = Typography;
const { Option } = Select;

export default function PermissionManagementPage() {
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string | null>(null);

  const [form] = Form.useForm();

  // ================= LOAD =================
 const fetchPermissions = async () => {
  setLoading(true);
  try {
    const res = await api.get('/rbac/permissions');

    setPermissions(res.data?.flat || []); // ✅ IMPORTANT FIX

  } catch {
    toast.error('Failed to load permissions');
    setPermissions([]);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchPermissions();
  }, []);
const handleCreate = async (values: any) => {
  try {
    const res = await api.post('/rbac/permissions', values);

    toast.success(res.data?.message || 'Permission created successfully');

    setIsModalOpen(false);
    form.resetFields();
    fetchPermissions();
  } catch (err: any) {
    toast.error(err?.response?.data?.error || 'Create failed');
  }
};

const handleDelete = async (id: number) => {
  try {
    const res = await api.delete(`/rbac/permissions/${id}`);

    toast.success(res.data?.message || 'Permission deleted successfully');

    fetchPermissions();
  } catch (err: any) {
    toast.error(err?.response?.data?.error || 'Delete failed');
  }
};

  // ================= FILTERED DATA =================
  const filteredData = permissions.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.module.toLowerCase().includes(search.toLowerCase());

    const matchModule = moduleFilter ? p.module === moduleFilter : true;

    return matchSearch && matchModule;
  });

  const modules = Array.from(new Set(permissions.map((p) => p.module)));

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen">

      {/* HEADER */}
      <Card className="rounded-2xl shadow-sm mb-4">
        <Row justify="space-between" align="middle" gutter={[12, 12]}>
          <Col xs={24} md={12}>
            <Title level={3} className="!mb-0 flex items-center gap-2">
              <SafetyOutlined /> Permission Management
            </Title>
          </Col>

          <Col xs={24} md={12} className="flex justify-end">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsModalOpen(true)}
            >
              Create Permission
            </Button>
          </Col>
        </Row>

        {/* FILTERS */}
        <Row gutter={10} className="mt-4">
          <Col xs={24} md={12}>
            <Input
              placeholder="Search permission or module..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Col>

          <Col xs={24} md={12}>
            <Select
              allowClear
              placeholder="Filter by module"
              className="w-full"
              onChange={(v) => setModuleFilter(v)}
            >
              {modules.map((m) => (
                <Option key={m} value={m}>
                  {m}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      {/* TABLE */}
      <Card className="rounded-2xl">
        <Table
          rowKey="id"
          loading={loading}
          dataSource={filteredData}
          pagination={{ pageSize: 8 }}
          columns={[
            {
              title: 'Permission',
              dataIndex: 'name',
              render: (t) => <b>{t}</b>,
            },
            {
              title: 'Module',
              dataIndex: 'module',
              render: (m) => <Tag color="blue">{m}</Tag>,
            },
            {
              title: 'Action',
              render: (_, record) => (
                <Space>
                  <Popconfirm
                    title="Delete permission?"
                    onConfirm={() => handleDelete(record.id)}
                  >
                    <Button danger icon={<DeleteOutlined />} size="small">
                      Delete
                    </Button>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      {/* MODAL */}
      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        title="Create Permission"
        centered
      >
        <Form layout="vertical" form={form} onFinish={handleCreate}>
          <Form.Item
            name="name"
            label="Permission Name"
            rules={[{ required: true }]}
          >
            <Input placeholder="e.g. user.create" />
          </Form.Item>

          <Form.Item
            name="module"
            label="Module"
            rules={[{ required: true }]}
          >
            <Input placeholder="e.g. User Management" />
          </Form.Item>

          <Button type="primary" htmlType="submit" block>
            Create
          </Button>
        </Form>
      </Modal>
    </div>
  );
}