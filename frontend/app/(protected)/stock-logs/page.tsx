'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Table, Input, Button, Tag, Avatar, Space, Typography, Spin } from 'antd';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import api from '@/lib/api';

const { Title, Text } = Typography;

interface StockLog {
    id: number;
    created_at: string;
    product_name: string;
    serial_number: string;
    action_type: 'IN' | 'OUT' | 'STATUS_CHANGE' | 'ADJUSTMENT';
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

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    };

    const getTagColor = (type: string) => {
        switch (type) {
            case 'IN':
                return 'green';
            case 'OUT':
                return 'red';
            case 'STATUS_CHANGE':
                return 'blue';
            case 'ADJUSTMENT':
                return 'orange';
            default:
                return 'default';
        }
    };

    const columns = [
        {
            title: 'No',
            render: (_: any, __: any, index: number) =>
                (currentPage - 1) * 10 + index + 1,
            width: 70,
        },
        {
            title: 'Date',
            dataIndex: 'created_at',
            render: (value: string) => (
                <Text>{formatDate(value)}</Text>
            ),
        },
        {
            title: 'Product',
            render: (record: StockLog) => (
                <div>
                    <Text strong>{record.product_name}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {record.serial_number}
                    </Text>
                </div>
            ),
        },
        {
            title: 'Action',
            dataIndex: 'action_type',
            render: (type: string) => (
                <Tag color={getTagColor(type)}>{type}</Tag>
            ),
        },
        {
            title: 'Status Change',
            render: (record: StockLog) => (
                <Space>
                    <Text type="secondary">{record.from_status || 'INIT'}</Text>
                    <span>→</span>
                    <Tag color="blue">{record.to_status}</Tag>
                </Space>
            ),
        },
        {
            title: 'Note',
            dataIndex: 'note',
            ellipsis: true,
            render: (note: string) => (
                <Text type="secondary">{note || '-'}</Text>
            ),
        },
        {
            title: 'User',
            render: (record: StockLog) => (
                <Space>
                    <Avatar style={{ backgroundColor: '#6366f1' }}>
                        {record.user_name.charAt(0)}
                    </Avatar>
                    <Text>{record.user_name}</Text>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: 24 }}>
            {/* Header */}
            <Space
                style={{
                    width: '100%',
                    justifyContent: 'space-between',
                    marginBottom: 20,
                }}
            >
                <div>
                    <Title level={3} style={{ margin: 0 }}>
                        Stock Audit Logs
                    </Title>
                    <Text type="secondary">
                        Track all inventory movements
                    </Text>
                </div>

                <Space>
                    <Input
                        placeholder="Search product or serial..."
                        prefix={<SearchOutlined />}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        allowClear
                        style={{ width: 250 }}
                    />

                    <Button
                        icon={<ReloadOutlined />}
                        onClick={() => fetchLogs(currentPage, searchQuery)}
                    />
                </Space>
            </Space>

            {/* Table */}
            <Table
                columns={columns}
                dataSource={logs}
                rowKey="id"
                loading={{
                    spinning: loading,
                    indicator: <Spin />,
                }}
                pagination={false}
                bordered
            />

            {/* Pagination */}
            {pagination && (
                <div style={{ marginTop: 20, textAlign: 'right' }}>
                    <Button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((prev) => prev - 1)}
                        style={{ marginRight: 8 }}
                    >
                        Prev
                    </Button>

                    <Text style={{ margin: '0 10px' }}>
                        Page {currentPage} of {pagination.totalPages}
                    </Text>

                    <Button
                        disabled={currentPage === pagination.totalPages}
                        onClick={() => setCurrentPage((prev) => prev + 1)}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
};

export default StockLogsPage;