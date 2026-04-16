'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Table, Input, Button, Tag, Space,
  Typography, Popconfirm, Card, Avatar
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UserOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { getUsers, deleteUser } from '@/lib/users';
import { toast } from 'sonner';
import UsersDialog from './users-dialog';
import { useRouter } from 'next/navigation';
import { Eye, EyeClosed, EyeIcon } from 'lucide-react';

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
    if (role.includes('ADMIN') || role.includes('SUPERVISOR')) return 'volcano';
    if (role.includes('VERIFICATION') || role.includes('APPROVAL')) return 'green';
    return 'blue';
  };

  const columns = [
    {
      title: '#',
      width: 50,
      render: (_: any, __: any, index: number) => (page - 1) * limit + index + 1,
    },
   {
  title: 'User',
  key: 'user',
  minWidth: 200,
  render: (_: any, record: any) => (
    <div
      onClick={() => router.push(`/users/${record.id}`)}
      className="cursor-pointer  flex items-center gap-3 p-2 rounded-md"
    >
      <div className="flex flex-col min-w-0">
        <span className="font-semibold text-primary truncate">
          {record.name || 'No Name'}
        </span>

        <span className="text-xs text-primary/80 truncate">
          {record.email || 'No Email'}
        </span>
      </div>
    </div>
  ),
},
   {
  title: 'Roles',
  key: 'roles',
  render: (u: any) => (
    <Space wrap>
      {u.roles?.length ? (
        u.roles.map((role: string, index: number) => (
          <Tag
            key={`${u.id}-${role}-${index}`}
            color={getRoleColor(role)}
            className="rounded-md border-none px-2 py-0.5 text-[10px] font-bold uppercase"
          >
            {role.replace(/^ROLE_/, '')}
          </Tag>
        ))
      ) : (
        <Tag color="default">No Role</Tag>
      )}
    </Space>
  ),
},
    {
      title: 'Status',
      dataIndex: 'is_active',
      width: 100,
      render: (active: boolean) => (
        <Tag
          className="rounded-full px-3 py-0.5 text-[10px] font-bold uppercase border-none"
          color={active ? 'green' : 'red'}
        >
          {active ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      align: 'right' as const,
      render: (u: any) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => router.push(`/users/${u.id}`)}
          />
          <Popconfirm title="Delete user?" onConfirm={() => handleDelete(u.id)}>
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <Title level={2} className="!mb-0">Staff Management</Title>
            <Text type="secondary">Review and manage employee system access.</Text>
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
            Add User
          </Button>
        </div>

        {/* SEARCH & TABLE CONTAINER */}
        <Card className="shadow-sm border-none rounded-xl overflow-hidden">
          <div className="mb-6">
            <Input
              placeholder="Filter by name or email..."
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
            scroll={{ x: 800 }} // 🔥 Allows horizontal scroll on mobile instead of squashing
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