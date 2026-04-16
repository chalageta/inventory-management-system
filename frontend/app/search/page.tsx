"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Table, Form, Input, Button, Card, Tag, Select, 
  Modal, Descriptions, message, Row, Col, Space, Pagination 
} from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';

// Status mapping based on your StatusConstants.java
const APPLICATION_STATUSES = [
  { label: 'Submitted', value: 'Submitted' },
  { label: 'Amendment Submitted', value: 'Amendment Submitted' },
  { label: 'Cancellation Submitted', value: 'Cancellation Submitted' },
  { label: 'LPCO Amendment Requested', value: 'LPCO Amendment Requested' },
  { label: 'Accepted', value: 'Accepted' },
  { label: 'Denied', value: 'Denied' },
  { label: 'Verifying', value: 'Verifying' },
  { label: 'Verified', value: 'Verified' },
  { label: 'Correction Query by Verifier', value: 'Correction Query by Verifier' },
  { label: 'Inspecting', value: 'Inspecting' },
  { label: 'Inspected', value: 'Inspected' },
  { label: 'Cancellation Approved', value: 'Cancellation Approved' },
  { label: 'Cancellation Rejected', value: 'Cancellation Rejected' },
  { label: 'LPCO Amendment Approved', value: 'LPCO Amendment Approved' },
  { label: 'LPCO Amendment Rejected', value: 'LPCO Amendment Rejected' },
  { label: 'Approved', value: 'Approved' },
  { label: 'Rejected', value: 'Rejected' },
];

export default function ApplicationSearchPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  
  // Backend Page State (Aligning with your gov.et.nuegp...Page.java)
  const [totalElements, setTotalElements] = useState(0);
  const [pageNo, setPageNo] = useState(0); // Backend uses 0-based index
  const [pageSize, setPageSize] = useState(10);
const router = useRouter();
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  /**
   * Core Fetch Function
   */
  const fetchData = useCallback(async (searchValues: any = {}, page = 0, size = 10) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('pageNo', page.toString());
      params.append('pageSize', size.toString());

      Object.keys(searchValues).forEach(key => {
        if (searchValues[key]) params.append(key, searchValues[key]);
      });

      const response = await fetch(`http://localhost:8080/search?${params.toString()}`);
      const result = await response.json();
      
      // result follows your Java Page<T> structure
      setData(result.content || []);
      setTotalElements(result.totalElements || 0);
      setPageNo(result.pageNo);
      setPageSize(result.pageSize);
    } catch (error) {
      message.error("Failed to connect to application service");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData({}, 0, 10);
  }, [fetchData]);

  const onSearch = (values: any) => {
    fetchData(values, 0, pageSize);
  };

  const onReset = () => {
    form.resetFields();
    fetchData({}, 0, 10);
  };

  const handlePageChange = (page: number, size: number) => {
    // Frontend Pagination is 1-based, Backend is 0-based
    fetchData(form.getFieldsValue(), page - 1, size);
  };

  const handleViewDetail = async (refNo: string) => {
    setDetailLoading(true);
    setDetailVisible(true);
    try {
      const response = await fetch(`http://localhost:8080/detail?applicationRefNo=${encodeURIComponent(refNo)}`);
      const result = await response.json();
      if (result.success) setDetailData(result.data);
    } catch (error) {
      message.error("Failed to load details");
    } finally {
      setDetailLoading(false);
    }
  };

  const columns = [
    {
      title: 'No',
      key: 'index',
      width: 60,
      align: 'center' as const,
      render: (_: any, __: any, index: number) => (pageNo * pageSize) + index + 1,
    },
    {
      title: 'Reference No. / Date',
      key: 'reference',
      render: (record: any) => (
        <div>
          <a onClick={() => handleViewDetail(record.applicationRefNo)} style={{ fontWeight: '600', color: '#00a8a8' }}>
            {record.applicationRefNo}
          </a>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
            {record.createdDt ? dayjs(record.createdDt).format('MMM DD, YYYY') : '-'}
          </div>
        </div>
      ),
    },
    {
      title: 'Application No. / Accepted Date',
      key: 'application',
      render: (record: any) => (
        <div>
          <div style={{ fontWeight: '500' }}>{record.applicationNo || ""}</div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
            {record.accpDt ? dayjs(record.accpDt).format('MMM DD, YYYY') : ""}
          </div>
        </div>
      ),
    },
    {
      title: 'Processing Status',
      key: 'status',
      render: (record: any) => (
        <a 
          style={{ color: '#00a8a8', fontWeight: 'bold',  }}
          onClick={() => router.push(`/history?refNo=${encodeURIComponent(record.applicationRefNo)}`)}
        >
          {record.status}
        </a>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      {/* Search Section */}
      <Card bordered={false} style={{ marginBottom: 16, borderRadius: 8 }}>
        <Form form={form} layout="vertical" onFinish={onSearch}>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="applicationRefNo" label="Reference No.">
                <Input placeholder="Search Ref No" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="applicationNo" label="Application No.">
                <Input placeholder="Search App No" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="status" label="Status">
                <Select placeholder="Select Status" allowClear showSearch optionFilterProp="label">
                  {APPLICATION_STATUSES.map(status => (
                    <Select.Option key={status.value} value={status.value} label={status.label}>
                      {status.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6} style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '24px' }}>
              <Space>
                <Button type="primary" icon={<SearchOutlined />} htmlType="submit" style={{ backgroundColor: '#27ae60', border: 'none' }}>
                  Search
                </Button>
                <Button icon={<ReloadOutlined />} onClick={onReset}>Reset</Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Table Section */}
      <Card bordered={false} bodyStyle={{ padding: '0px' }}>
        {/* Custom Header with All Rows count */}
        <div style={{ padding: '16px 16px 0 16px', display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <span>All <b>{totalElements}</b> Rows</span>
            <Select 
              value={pageSize} 
              size="small" 
              onChange={(val) => fetchData(form.getFieldsValue(), 0, val)}
              style={{ width: 80 }}
            >
              {[10, 20, 30, 50, 100].map(s => <Select.Option key={s} value={s}>{s}</Select.Option>)}
            </Select>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="applicationRefNo"
          loading={loading}
          bordered
          size="middle"
          pagination={false} // We are using a custom Pagination component for positioning
        />

        {/* Right-Bottom Aligned Pagination */}
        <div style={{ padding: '16px', display: 'flex', justifyContent: 'flex-end' }}>
          <Pagination
            current={pageNo + 1}
            pageSize={pageSize}
            total={totalElements}
            onChange={handlePageChange}
            showSizeChanger={false} // Size changer handled in header for cleaner UI
            showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
          />
        </div>
      </Card>

      {/* Detail Modal */}
      <Modal
        title={<span style={{ color: '#1890ff' }}>Application Full Details</span>}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[<Button key="close" type="primary" onClick={() => setDetailVisible(false)}>Close</Button>]}
        width={800}
      >
        {detailLoading ? <p>Loading...</p> : detailData && (
          <Descriptions bordered column={2} size="small" labelStyle={{ fontWeight: 'bold', background: '#fafafa' }}>
            <Descriptions.Item label="Reference No" span={2}>
              <b style={{ color: '#27ae60' }}>{detailData.applicationRefNo}</b>
            </Descriptions.Item>
            
            <Descriptions.Item label="Application No">{detailData.applicationNo || '-'}</Descriptions.Item>
            <Descriptions.Item label="Applicant ID">{detailData.applicantId}</Descriptions.Item>

            <Descriptions.Item label="Service Type">{detailData.applicationType}</Descriptions.Item>
            <Descriptions.Item label="Priority">
              <Tag color={detailData.priority === 'High' ? 'red' : 'blue'}>{detailData.priority?.toUpperCase()}</Tag>
            </Descriptions.Item>

            <Descriptions.Item label="Workflow ID">{detailData.workflowId}</Descriptions.Item>
            <Descriptions.Item label="Accepted Date">
              {detailData.accpDt ? dayjs(detailData.accpDt).format('MMM DD, YYYY hh:mm A') : '-'}
            </Descriptions.Item>

            <Descriptions.Item label="Created Date">
              {dayjs(detailData.createdDt).format('MMM DD, YYYY hh:mm A')}
            </Descriptions.Item>
            <Descriptions.Item label="Est. Completion">
              {dayjs(detailData.estimatedCompletionDt).format('MMM DD, YYYY')}
            </Descriptions.Item>

            <Descriptions.Item label="Business Details" span={2}>
              <div style={{ background: '#f9f9f9', padding: '10px', borderRadius: '4px' }}>
                <Row gutter={[16, 8]}>
                  <Col span={12}><b>Business:</b> {detailData.formData?.businessName}</Col>
                  <Col span={12}><b>Owner:</b> {detailData.formData?.ownerName}</Col>
                  <Col span={24}><b>Capital:</b> {detailData.formData?.capital?.toLocaleString()} ETB</Col>
                </Row>
              </div>
            </Descriptions.Item>

            <Descriptions.Item label="Last Update" span={2}>
              {dayjs(detailData.updatedDt).format('MMM DD, YYYY hh:mm A')} by <b>{detailData.updatedBy}</b>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}