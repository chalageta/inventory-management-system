"use client";
import React, { useState, useEffect } from 'react';
import { List, Card, Tag, Button, Pagination, Spin, message } from 'antd';
import { LayoutOutlined, BankOutlined, ClockCircleOutlined } from '@ant-design/icons';

const PAGE_SIZE = 10;

export default function ServiceDiscovery() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchServices = async (page: number) => {
    setLoading(true);
    const skip = (page - 1) * PAGE_SIZE;
    
    try {
      // Constructing the payload for the API
      const response = await fetch('http://157.180.54.165:8090/api/ServiceDiscovery/GetAllServices', {
        method: 'POST', // Adjust to GET if your API expects params in URL
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Skip: skip,
          Top: PAGE_SIZE,
          RequireTotalCount: true
        }),
      });

      const result = await response.json();
      setServices(result.data);
      setTotalCount(result.Count);
    } catch (error) {
      message.error("Failed to load services");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices(currentPage);
  }, [currentPage]);

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Service Directory</h1>
        <p className="text-gray-500">Discover and apply for government services</p>
      </header>

      <Spin spinning={loading}>
        <List
          grid={{ gutter: 16, column: 1 }}
          dataSource={services}
          renderItem={(item: any) => (
            <List.Item>
              <Card 
                className="hover:shadow-md transition-shadow border-gray-200"
                bodyStyle={{ padding: '20px' }}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Tag color="blue" className="rounded-md m-0">
                        ID: {item.ID}
                      </Tag>
                      <span className="text-xs text-gray-400 uppercase font-semibold flex items-center gap-1">
                        <BankOutlined /> {item.OrganizationName}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{item.Name}</h3>
                    
                    <p className="text-gray-600 line-clamp-2 text-sm mb-3">
                      {item.Description}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <ClockCircleOutlined /> Processing: {item.EstimatedProcessingTimeString}
                      </span>
                      <span className="flex items-center gap-1">
                        <LayoutOutlined /> Type: {item.OrganizationType}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-shrink-0">
                    <Button 
                      type="primary" 
                      size="large"
                      className="bg-blue-600 hover:bg-blue-700 h-12 px-8 rounded-lg font-semibold flex items-center"
                      onClick={() => message.info(`Applying for ${item.Name}`)}
                    >
                      Apply Now
                    </Button>
                  </div>
                </div>
              </Card>
            </List.Item>
          )}
        />
      </Spin>

      <div className="mt-8 flex justify-center bg-white p-4 rounded-xl shadow-sm">
        <Pagination
          current={currentPage}
          total={totalCount}
          pageSize={PAGE_SIZE}
          onChange={(page) => setCurrentPage(page)}
          showSizeChanger={false}
          className="modern-pagination"
        />
      </div>
    </div>
  );
}