"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, Table, Descriptions, Button, Input, Row, Col, Spin } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

export default function ProcessingHistoryPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const refNo = searchParams.get('refNo');
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (refNo) {
      fetch(`http://localhost:8080/status-history?applicationRefNo=${encodeURIComponent(refNo)}`)
        .then(res => res.json())
        .then(json => {
          setData(json);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [refNo]);

  if (loading) return <div style={{ textAlign: 'center', padding: '100px' }}><Spin size="large" /></div>;

  const historyColumns = [
    { title: 'No', dataIndex: 'applicationRefNoSN', key: 'sn', width: 60 },
    { 
      title: 'Processing Status', 
      dataIndex: 'statusName', 
      key: 'status',
      render: (text: string) => <span style={{ color: '#00a8a8', fontWeight: 'bold' }}>{text}</span>
    },
    { 
      title: 'Processing Date/Time', 
      dataIndex: 'statusDt', 
      key: 'date',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm:ss')
    },
    { title: 'Remark', dataIndex: 'remark', key: 'remark' },
    { 
        title: 'Processing Information', 
        dataIndex: 'processingInfo', 
        key: 'info',
        render: (text: string) => <span style={{ color: '#00a8a8' }}>{text}</span>
    },
    { title: 'Application Version', dataIndex: 'version', key: 'version', render: () => "1" },
  ];

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ color: '#002140', margin: 0 }}>PROCESSING HISTORY</h2>
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>Back to Search</Button>
      </div>

      <Card title={<span style={{ color: '#27ae60' }}>Application Information</span>} bordered={false} style={{ marginBottom: 20 }}>
        <Row gutter={[32, 16]}>
          <Col span={12}>
            <label>Reference No.</label>
            <Input value={data?.application?.applicationRefNo} readOnly style={{ background: '#f5f5f5' }} />
          </Col>
          <Col span={12}>
            <label>Reference Date</label>
            <Input value={dayjs(data?.application?.createdDt).format('DD/MM/YYYY')} readOnly style={{ background: '#f5f5f5' }} />
          </Col>
          <Col span={12}>
            <label>Applicant TIN</label>
            <Input value={data?.application?.applicantId} readOnly style={{ background: '#f5f5f5' }} />
          </Col>
          <Col span={12}>
            <label>Applicant Name</label>
            <Input value="Trader Test" readOnly style={{ background: '#f5f5f5' }} />
          </Col>
          <Col span={12}>
            <label>Application No.</label>
            <Input value={data?.application?.applicationNo} readOnly style={{ background: '#f5f5f5' }} />
          </Col>
          <Col span={12}>
            <label>Application Date</label>
            <Input value={dayjs(data?.application?.createdDt).format('DD/MM/YYYY')} readOnly style={{ background: '#f5f5f5' }} />
          </Col>
        </Row>
      </Card>

      <Card title={<span style={{ color: '#27ae60' }}>Processing History</span>} bordered={false}>
        <Table 
          dataSource={data?.applicationHistList} 
          columns={historyColumns} 
          pagination={false} 
          bordered 
          size="middle"
          rowKey={(record, index) => index || 0}
        />
      </Card>
    </div>
  );
}