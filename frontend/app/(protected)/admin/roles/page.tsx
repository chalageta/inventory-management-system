'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Card, Table, Button, Modal, Form, Input, message,
  Space, Typography, Checkbox, Row, Col, Divider,
  Popconfirm, Tooltip, Tag, Badge, Collapse, Alert
} from 'antd';
import type { CheckboxValueType } from 'antd/es/checkbox/Group';

import {
  PlusOutlined, DeleteOutlined,
  CheckCircleOutlined, EyeOutlined,
  UnorderedListOutlined, FolderOpenOutlined
} from '@ant-design/icons';

import api from '@/lib/api';
import { ShieldEllipsisIcon } from 'lucide-react';

const { Title, Text } = Typography;
const { Panel } = Collapse;

interface Permission {
  id: number;
  name: string;
  module: string;
  created_at: string;
}

interface Role {
  id: number;
  name: string;
  created_at: string;
}

type PermissionsGrouped = Record<string, Permission[]>;

export default function RoleManagementPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissionsGrouped, setAllPermissionsGrouped] = useState<PermissionsGrouped>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPermOpen, setIsPermOpen] = useState(false);

  const [form] = Form.useForm();
  const [activeRole, setActiveRole] = useState<Role | null>(null);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);

  // ================= 1. INITIAL LOAD =================
  const fetchData = useCallback(async (pageNum = page, searchText = search) => {
    setLoading(true);
    try {
      const [roleRes, permRes] = await Promise.all([
        api.get('/rbac/roles', { params: { page: pageNum, limit, search: searchText } }),
        api.get('/rbac/permissions')
      ]);
      setRoles(roleRes.data?.data || []);
      setTotal(roleRes.data?.pagination?.total || 0);
      setAllPermissionsGrouped(permRes.data?.grouped || {});
    } catch (error) {
      message.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ================= 2. SORTING LOGIC (BY CHECKED STATUS) =================
  const sortedPermissionsGrouped = useMemo(() => {
    const sorted: PermissionsGrouped = {};
    Object.entries(allPermissionsGrouped).forEach(([moduleName, perms]) => {
      sorted[moduleName] = [...perms].sort((a, b) => {
        const aChecked = selectedPermissionIds.includes(a.id);
        const bChecked = selectedPermissionIds.includes(b.id);
        if (aChecked && !bChecked) return -1;
        if (!aChecked && bChecked) return 1;
        return 0;
      });
    });
    return sorted;
  }, [allPermissionsGrouped, selectedPermissionIds]);


  const isModuleFullySelected = (modulePerms: Permission[]): boolean => {
    return modulePerms.length > 0 && 
           modulePerms.every(p => selectedPermissionIds.includes(p.id));
  };

  const isModulePartiallySelected = (modulePerms: Permission[]): boolean => {
    const selectedCount = modulePerms.filter(p => 
      selectedPermissionIds.includes(p.id)
    ).length;
    return selectedCount > 0 && selectedCount < modulePerms.length;
  };

  const toggleModulePermissions = (modulePerms: Permission[]) => {
    const moduleIds = modulePerms.map(p => p.id);
    const allSelected = isModuleFullySelected(modulePerms);
    
    if (allSelected) {
      // Deselect all in module
      setSelectedPermissionIds(prev => 
        prev.filter(id => !moduleIds.includes(id))
      );
    } else {
      // Select all in module
      setSelectedPermissionIds(prev => 
        [...new Set([...prev, ...moduleIds])]
      );
    }
  };

  const handlePermissionChange = (checkedValues: CheckboxValueType[], modulePerms: Permission[]) => {
    const moduleIds = modulePerms.map(p => p.id);
    setSelectedPermissionIds(prev => {
      // Filter out all permissions that belong to this module first
      const otherModuleIds = prev.filter(id => !moduleIds.includes(id));
      // Then add the new selections from this module
      return [...otherModuleIds, ...(checkedValues as number[])];
    });
  };

  // ================= 4. OPEN MODAL =================
  const openPermissionsModal = async (role: Role) => {
    setActiveRole(role);
    setSelectedPermissionIds([]); 
    setIsPermOpen(true);
    try {
      const res = await api.get(`/rbac/role-permissions/${role.id}`);
      const currentIds = res.data?.permissions?.map((p: Permission) => p.id) || [];
      setSelectedPermissionIds(currentIds);
    } catch (error) {
      message.error('Could not load permissions for this role');
    }
  };

  // ================= 5. SAVE =================
  const handleSavePermissions = async () => {
    if (!activeRole) return;
    setSubmitting(true);
    try {
      await api.post('/rbac/assign-permissions', {
        roleId: activeRole.id,
        permissionIds: selectedPermissionIds
      });
      message.success('Permissions updated successfully');
      setIsPermOpen(false);
      fetchData();
    } catch (error) {
      message.error('Failed to save permissions');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/rbac/roles/${id}`);
      message.success('Role deleted');
      fetchData();
    } catch {
      message.error('Delete failed');
    }
  };

  const handleCreateRole = async (values: { name: string }) => {
    try {
      await api.post('/rbac/roles', values);
      message.success('Role created successfully');
      setIsCreateOpen(false);
      form.resetFields();
      fetchData();
    } catch {
      message.error('Failed to create role');
    }
  };

  // ================= 6. RENDER MODULE PANEL =================
  const renderModulePanel = (moduleName: string, perms: Permission[]) => {
    const moduleKey = `module-${moduleName}`;
    const isFullySelected = isModuleFullySelected(perms);
    const isPartial = isModulePartiallySelected(perms);
    
    let moduleStatus: React.ReactNode = null;
    if (isFullySelected) {
      moduleStatus = <Badge status="success" text="All" />;
    } else if (isPartial) {
      moduleStatus = <Badge status="processing" text="Partial" />;
    }

    return (
      <Panel
        key={moduleKey}
        header={
          <div className="flex items-center justify-between w-full pr-4">
            <div className="flex items-center gap-2">
              <FolderOpenOutlined className="text-primary" />
              <Text strong className="uppercase text-sm">
                {moduleName.replace(/-/g, ' ')}
              </Text>
              <Tag color="blue" className="ml-2">{perms.length}</Tag>
            </div>
            <Space>
              {moduleStatus}
              <Button
                size="small"
                type={isFullySelected ? "primary" : "default"}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleModulePermissions(perms);
                }}
              >
                {isFullySelected ? 'Deselect All' : 'Select All'}
              </Button>
            </Space>
          </div>
        }
        extra={
          <Checkbox
            checked={isFullySelected}
            indeterminate={isPartial}
            onChange={() => toggleModulePermissions(perms)}
            onClick={(e) => e.stopPropagation()}
          />
        }
      >
        <Checkbox.Group
          className="w-full"
          value={selectedPermissionIds}
          onChange={(vals) => handlePermissionChange(vals, perms)}
        >
          <Row gutter={[12, 12]}>
            {perms.map((perm) => {
              const isChecked = selectedPermissionIds.includes(perm.id);
              return (
                <Col xs={24} sm={12} md={8} lg={6} key={perm.id}>
                  <Card
                    size="small"
                    className={`cursor-pointer transition-all ${
                      isChecked 
                        ? 'border-primary bg-blue-50 shadow-sm' 
                        : 'border-slate-200 hover:border-blue-300'
                    }`}
                    onClick={() => {
                      setSelectedPermissionIds(prev => 
                        isChecked
                          ? prev.filter(id => id !== perm.id)
                          : [...prev, perm.id]
                      );
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <Checkbox
                        value={perm.id}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <Text 
                          strong 
                          className={`text-sm capitalize block truncate ${
                            isChecked ? 'text-primary' : 'text-slate-700'
                          }`}
                          title={perm.name.replace(/_/g, ' ')}
                        >
                          {perm.name.replace(/_/g, ' ')}
                        </Text>
                        <Text type="secondary" className="text-xs block">
                          ID: {perm.id}
                        </Text>
                      </div>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </Checkbox.Group>
      </Panel>
    );
  };

  // ================= 7. COLUMNS DEFINITION =================
  const columns = [
    {
      title: 'Role Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Tag color="blue" className="font-semibold px-3 py-1 border-0 rounded-md uppercase tracking-wider">
          {name}
        </Tag>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => (
        <Text type="secondary" className="text-xs">
          {new Date(date).toLocaleDateString()}
        </Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      align: 'right' as const,
      render: (_: any, record: Role) => (
        <Space>
          <Tooltip title="Manage Permissions">
            <Button 
              className="flex items-center justify-center border-blue-100 text-primary hover:bg-blue-50"
              icon={<EyeOutlined />} 
              onClick={() => openPermissionsModal(record)} 
            />
          </Tooltip>
          <Popconfirm 
            title="Delete this role?" 
            onConfirm={() => handleDelete(record.id)} 
            okText="Yes" 
            cancelText="No"
          >
            <Button danger type="text" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
      
      {/* HEADER */}
      <Card className="mb-6 rounded-xl shadow-sm border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Title level={3} className="!m-0 flex items-center gap-3 font-bold text-slate-800">
              <ShieldEllipsisIcon size={28} className="text-primary" /> 
              RBAC Management
            </Title>
            <Text className="text-slate-500 block mt-1">
              Define roles and manage permissions by module
            </Text>
          </div>
          <Button 
            type="primary" 
            size="large" 
            className="rounded-lg h-11 px-6 font-semibold"
            icon={<PlusOutlined />} 
            onClick={() => setIsCreateOpen(true)}
          >
            Create New Role
          </Button>
        </div>
      </Card>

      {/* SEARCH & FILTERS */}
      <Card className="mb-4 rounded-xl shadow-sm border-slate-200">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={8}>
            <Input
              placeholder="Search roles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onPressEnter={() => fetchData(1, search)}
              prefix={<UnorderedListOutlined className="text-slate-400" />}
              allowClear
            />
          </Col>
          <Col xs={24} md={16} className="text-right">
            <Button onClick={() => fetchData()}>Refresh</Button>
          </Col>
        </Row>
      </Card>

      {/* ROLES TABLE */}
      <Card className="rounded-xl shadow-sm border-0 overflow-hidden">
        <Table
          rowKey="id"
          loading={loading}
          dataSource={roles}
          pagination={{ 
            current: page, 
            pageSize: limit, 
            total, 
            onChange: (p) => { setPage(p); fetchData(p, search); },
            showSizeChanger: false,
            showTotal: (total) => `Total ${total} roles`
          }}
          columns={columns}
          locale={{ emptyText: 'No roles found' }}
        />
      </Card>

      {/* MODAL: PERMISSIONS BY MODULE */}
      <Modal
        title={
          <div className="pb-2">
            <Text type="secondary" className="text-[10px] uppercase font-bold tracking-widest text-primary">
              Edit Access Control
            </Text>
            <Title level={4} className="!m-0 text-slate-800 uppercase">
              {activeRole?.name}
            </Title>
          </div>
        }
        open={isPermOpen}
        onCancel={() => setIsPermOpen(false)}
        width={1200}
        centered
        footer={[
          <Button key="cancel" className="rounded-lg px-6" onClick={() => setIsPermOpen(false)}>
            Cancel
          </Button>,
          <Button 
            key="save" 
            type="primary" 
            className="rounded-lg px-8 font-semibold"
            loading={submitting} 
            icon={<CheckCircleOutlined />} 
            onClick={handleSavePermissions}
          >
            Save Changes
          </Button>
        ]}
      >
        <div className="py-2" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <Alert
            message="Tip: Checked permissions appear first in each module"
            type="info"
            showIcon
            className="mb-4"
            closable
          />
          
          <Collapse 
            defaultActiveKey={Object.keys(sortedPermissionsGrouped)}
            className="permission-collapse"
            ghost={false}
            bordered
          >
            {Object.entries(sortedPermissionsGrouped)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([moduleName, perms]) => 
                renderModulePanel(moduleName, perms)
              )
            }
          </Collapse>
        </div>
      </Modal>

      {/* CREATE ROLE MODAL */}
      <Modal
        title={
          <>
            <PlusOutlined className="mr-2 text-primary" />
            Create New Role
          </>
        }
        open={isCreateOpen}
        onCancel={() => {
          setIsCreateOpen(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText="Create Role"
        cancelText="Cancel"
        confirmLoading={submitting}
      >
        <Form 
          form={form} 
          layout="vertical" 
          onFinish={handleCreateRole}
          initialValues={{ name: '' }}
        >
          <Form.Item 
            name="name" 
            label={
              <label>
                Role Name <Text type="danger">*</Text>
              </label>
            } 
            rules={[
              { required: true, message: 'Please enter a role name' },
              { pattern: /^[a-zA-Z0-9_]+$/, message: 'Only letters, numbers, and underscores allowed' }
            ]}
            extra="Use underscores for multi-word names (e.g., finance_manager)"
          >
            <Input 
              placeholder="e.g. Finance_Manager" 
              className="rounded-md h-10" 
              maxLength={50}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}