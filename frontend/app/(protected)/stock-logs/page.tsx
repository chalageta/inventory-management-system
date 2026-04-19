'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Table, Input, Button, Tag, Avatar, Space, Typography, Spin, Card, Breadcrumb } from 'antd';
import { ReloadOutlined, SearchOutlined, HistoryOutlined, ArrowRightOutlined } from '@ant-design/icons';
import api from '@/lib/api';

const { Title, Text } = Typography;

interface StockLog {
    id: number;
    created_at: string;
    product_name: string;
    serial_number: string;
    action_type: 'IN' | 'OUT' | 'STATUS_CHANGE' | 'ADJUSTMENT' | 'SOLD' |'ARCHIVE'
    from_status: string | null;
    to_status: string;
    note: string;
    user_name: string;
}

const StockLogsPage = () => {
    const [logs, setLogs] = useState<StockLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [pagination, setPagination] = useState<any>(null);

    const fetchLogs = useCallback(async (page: number, search: string = '') => {
        setLoading(true);
        try {
            const { data } = await api.get('/stock-logs', {
                params: {
                    page,
                    limit: 10,
                    search: search || undefined,
                },
            });

            setLogs(data.data || []);
            setPagination(data.pagination);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Debounce Search
    useEffect(() => {
        const delay = setTimeout(() => {
            fetchLogs(1, searchQuery);
            setCurrentPage(1);
        }, 500);

        return () => clearTimeout(delay);
    }, [searchQuery, fetchLogs]);

    useEffect(() => {
        fetchLogs(currentPage, searchQuery);
    }, [currentPage]);

   const formatDate = (date: string) => {
  if (!date) return '-';

  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

    const getTagColor = (type: string) => {
        switch (type) {
            case 'IN':
                return 'green';
            case 'SOLD':
                return 'red';
            case 'STATUS_CHANGE':
                return 'blue';
            case 'ADJUSTMENT':
                return 'orange';
            case 'ARCHIVE':
                return 'purple';
            case 'OUT':
                return 'volcano';
            default:
                return 'default';
        }
    };

    const columns = [
        {
            title: 'No',
            key: 'no',
            render: (_: any, __: any, index: number) =>
                (currentPage - 1) * 10 + index + 1,
            width: 60,
            className: 'text-gray-400 font-mono text-xs',
        },
        {
            title: 'Date',
            dataIndex: 'created_at',
            key: 'date',
            render: (value: string) => (
                <div className="flex flex-col">
                    <Text strong>{formatDate(value)}</Text>
                </div>
            ),
        },
        {
            title: 'Product',
            key: 'product',
            render: (record: StockLog) => (
                <div className="flex flex-col">
                    <Text strong className="text-blue-600 truncate max-w-[200px] block">
                        {record.product_name}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 11 }} className="font-mono">
                        {record.serial_number}
                    </Text>
                </div>
            ),
        },
        {
            title: 'Action',
            dataIndex: 'action_type',
            key: 'action',
            render: (type: string) => (
                <Tag color={getTagColor(type)} className="rounded-full px-3 border-none font-medium">
                    {type.replace('_', ' ')}
                </Tag>
            ),
        },
        {
            title: 'Movement',
            key: 'status_change',
            render: (record: StockLog) => (
                <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-xs px-2 py-0.5 bg-gray-100 rounded">
                        {record.from_status || 'INIT'}
                    </span>
                    <ArrowRightOutlined className="text-gray-300 text-[10px]" />
                    <span className="text-blue-600 text-xs font-semibold px-2 py-0.5 bg-blue-50 rounded border border-blue-100">
                        {record.to_status}
                    </span>
                </div>
            ),
        },
        {
            title: 'Note',
            dataIndex: 'note',
            key: 'note',
            ellipsis: true,
            className: 'text-gray-500 italic',
            render: (note: string) => note || '-',
        },
        {
            title: 'User',
            key: 'user',
            render: (record: StockLog) => (
                <div className="flex items-center gap-2">
                    <Avatar 
                        size={24}
                        className="bg-indigo-500 border-2 border-white shadow-sm ring-1 ring-indigo-100"
                    >
                        {record.user_name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Text className="text-gray-700 text-sm">{record.user_name}</Text>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500 p-2 md:p-0">
            {/* Breadcrumbs */}
            <Breadcrumb
                items={[
                    { title: <span className="text-gray-400 hover:text-blue-600 cursor-pointer">Inventory</span> },
                    { title: <span className="font-medium text-gray-900">Stock Audit Logs</span> },
                ]}
                className="mb-2"
            />

            {/* Header section with Title and Actions */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                    <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200">
                        <HistoryOutlined className="text-white text-2xl" />
                    </div>
                    <div>
                        <Title level={2} style={{ margin: 0 }} className="font-extrabold tracking-tight text-gray-900">
                            Audit Trail
                        </Title>
                        <Text type="secondary" className="text-base text-gray-500">
                            Transparent logs of every stock movement and status update.
                        </Text>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto">
                     <Input
                        placeholder="Search product or serial..."
                        prefix={<SearchOutlined className="text-gray-400" />}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        allowClear
                        className="flex-1 lg:w-72 h-11 rounded-xl shadow-sm border-gray-200 hover:border-blue-400 focus:border-blue-500 transition-all"
                    />
                    <Button
                        icon={<ReloadOutlined className="text-gray-600" />}
                        onClick={() => fetchLogs(currentPage, searchQuery)}
                        className="h-11 w-11 flex items-center justify-center rounded-xl hover:bg-gray-50 hover:text-blue-600 border-gray-200 shadow-sm"
                    />
                </div>
            </div>

            {/* Main Table Card */}
            <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
                <Table
                    columns={columns}
                    dataSource={logs}
                    rowKey="id"
                    loading={{
                        spinning: loading,
                        indicator: <Spin size="large" className="text-blue-600" />,
                    }}
                    pagination={pagination ? {
                        current: currentPage,
                        pageSize: 10,
                        total: pagination.total || (pagination.totalPages * 10),
                        onChange: (page) => setCurrentPage(page),
                        showSizeChanger: false,
                        showQuickJumper: true,
                        showTotal: (total) => (
                            <span className="text-gray-500">
                                Page <span className="text-gray-900 font-medium">{currentPage}</span> of <span className="text-gray-900 font-medium">{pagination.totalPages || Math.ceil(total / 10)}</span>
                            </span>
                        ),
                        position: ['bottomRight'],
                        className: "px-6 py-4 border-t border-gray-50 mb-0",
                    } : false}
                    scroll={{ x: 'max-content' }}
                    className="modern-ant-table"
                />
            </div>
        </div>
    );
};

export default StockLogsPage;