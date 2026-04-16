'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Table, Input, Button, Tag, Space,
  Typography, Popconfirm, Card, Avatar, Tooltip
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UserOutlined,
  EyeOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { getUsers, deleteUser } from '@/lib/users';
import { toast } from 'sonner';
import UsersDialog from './users-dialog';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const router = useRouter();
  const limit = 10;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUsers({
        search: search || undefined,
        page,
        limit
      });

      // Deduplicate and set data
      const uniqueUsers = Array.from(
        new Map((res.data || []).map((u: any) => [u.id, u])).values()
      );

      setUsers(uniqueUsers);
      setTotal(res.pagination?.total || 0);

    } catch (err: any) {
      if (err?.response?.status === 403) {
        toast.error('Access Denied');
        router.push('/no-access');
        return;
      }
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [search, page, router]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (id: number) => {
    try {
      await deleteUser(id);
      toast.success('User deleted');
      fetchUsers();
    } catch {
      toast.error('Delete failed');
    }
  };

  const getRoleColor = (role: string) => {
    const r = role.toUpperCase();
    if (r === 'ADMIN') return 'volcano';
    if (r === 'FINANCE') return 'gold';
    if (r === 'CASHIER') return 'cyan';
    if (r === 'PURCHASER') return 'purple';
    if (r === 'STOREMAN') return 'geekblue';
    return 'blue';
  };

  const columns = [
    {
      title: 'User',
      key: 'user',
      render: (_: any, record: any) => (
        <div className="flex items-center gap-3">
          <Avatar 
            icon={<UserOutlined />} 
            className="bg-primary-light text-primary flex-shrink-0"
          >
            {record.name?.charAt(0)}
          </Avatar>
          <div className="flex flex-col min-w-0">
            <Text strong className="truncate m-0 leading-none">
              {record.name || 'No Name'}
            </Text>
            <Text type="secondary" className="text-[11px] truncate">
              {record.email}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Roles',
      key: 'roles',
      render: (record: any) => (
        <Space wrap size={[0, 4]}>
          {record.roles?.map((role: string) => (
            <Tag
              key={`${record.id}-${role}`}
              color={getRoleColor(role)}
              className="rounded-md border-none px-2 py-0 text-[10px] font-bold uppercase"
            >
              {role}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      width: 100,
      render: (active: number) => (
        <Tag
          className="rounded-full px-3 py-0 text-[10px] font-bold uppercase border-none"
          color={active === 1 ? 'green' : 'red'}
        >
          {active === 1 ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Last Activity',
      dataIndex: 'last_login',
      width: 150,
      render: (date: string) => (
        <div className="text-[11px] text-slate-500 flex items-center gap-1">
          <ClockCircleOutlined />
          {date ? dayjs(date).fromNow() : 'Never'}
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      align: 'right' as const,
      render: (u: any) => (
        <Space size="small">
          <Tooltip title="View Profile">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => router.push(`/users/${u.id}`)}
            />
          </Tooltip>
          <Tooltip title="Edit User">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingUser(u);
                setDialogOpen(true);
              }}
            />
          </Tooltip>
          <Popconfirm title="Delete user?" onConfirm={() => handleDelete(u.id)} okText="Yes" cancelText="No">
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <Title level={2} className="!mb-0">Staff Management</Title>
            <Text type="secondary">Manage system users, roles, and access permissions.</Text>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingUser(null);
              setDialogOpen(true);
            }}
            className="rounded-lg shadow-md h-12"
          >
            Add New Staff
          </Button>
        </div>

        {/* DATA CARD */}
        <Card className="shadow-sm border-none rounded-xl">
          <div className="mb-6">
            <Input
              placeholder="Search by name, email or phone..."
              prefix={<SearchOutlined className="text-slate-400" />}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              allowClear
              className="max-w-md h-10 rounded-lg"
            />
          </div>

          <Table
            columns={columns}
            dataSource={users}
            rowKey="id"
            loading={loading}
            scroll={{ x: 800 }}
            pagination={{
              current: page,
              total,
              pageSize: limit,
              onChange: (p) => setPage(p),
              showSizeChanger: false,
              position: ['bottomRight'],
            }}
          />
        </Card>

        <UsersDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          editingUser={editingUser}
          onSuccess={() => {
            setDialogOpen(false);
            fetchUsers();
          }}
        />
      </div>
    </div>
  );
}