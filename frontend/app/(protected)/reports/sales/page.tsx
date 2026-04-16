'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  DatePicker,
  Select,
  Spin,
  Table,
  Button,
} from 'antd';
import {
  PrinterOutlined,
  DownloadOutlined,
  RiseOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import api from '@/lib/api';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const { RangePicker } = DatePicker;

export default function SalesReport() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>({ current: [] });

  const [filters, setFilters] = useState({
    type: 'day',
    dates: [
      dayjs().subtract(7, 'day'),
      dayjs(),
    ] as [dayjs.Dayjs, dayjs.Dayjs],
  });

  // ================= FETCH =================
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [start, end] = filters.dates;

      const res = await api.get('/reports/sales-trends', {
        params: {
          type: filters.type,
          startDate: start.format('YYYY-MM-DD'),
          endDate: end.format('YYYY-MM-DD'),
        },
      });

      setData(res.data);
    } catch (err) {
      console.error('Sales report error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ================= TOTAL =================
  const totalSales =
    data.current?.reduce((sum: number, i: any) => sum + i.total_sales, 0) || 0;

  // ================= PRINT =================
  const handlePrint = () => window.print();

  // ================= EXPORT EXCEL =================
  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      (data.current || []).map((item: any) => ({
        Period: dayjs(item.period).format('MMM DD'),
        Sales: item.total_sales,
        Items: item.total_items_sold,
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales');
    XLSX.writeFile(workbook, 'sales-report.xlsx');
  };

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Sales Report</h1>

        <div className="space-x-2">
          <Button icon={<PrinterOutlined />} onClick={handlePrint}>
            Print / PDF
          </Button>

          <Button icon={<DownloadOutlined />} onClick={exportExcel}>
            Excel
          </Button>
        </div>
      </div>

      {/* FILTERS */}
      <Card>
        <Row gutter={16}>
          <Col>
            <Select
              value={filters.type}
              onChange={(val) =>
                setFilters((p) => ({ ...p, type: val }))
              }
              options={[
                { value: 'day', label: 'Daily' },
                { value: 'month', label: 'Monthly' },
              ]}
            />
          </Col>

          <Col>
            <RangePicker
              value={filters.dates}
              onChange={(val) =>
                val &&
                setFilters((p) => ({
                  ...p,
                  dates: val as any,
                }))
              }
            />
          </Col>
        </Row>
      </Card>

      {/* KPI */}
      <Row gutter={16}>
        <Col span={12}>
          <Card>
            <Statistic
              title="Total Sales"
              value={totalSales}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>

        <Col span={12}>
          <Card>
            <Statistic
              title="Avg Sales/Period"
              value={
                data.current?.length
                  ? (totalSales / data.current.length).toFixed(2)
                  : 0
              }
              prefix={<RiseOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* CHART */}
      <Card title="Sales Trend">
        {loading ? (
          <Spin />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.current}>
              <CartesianGrid strokeDasharray="3 3" />
              
              {/* ✅ FORMAT DATE HERE */}
              <XAxis
                dataKey="period"
                tickFormatter={(value) =>
                  dayjs(value).format(filters.type === 'month' ? 'MMM YYYY' : 'MMM DD')
                }
              />

              <YAxis />
              <Tooltip
                labelFormatter={(value) =>
                  dayjs(value).format('MMM DD, YYYY')
                }
              />
              <Bar dataKey="total_sales" fill="#1890ff" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* TABLE */}
      <Card title="Detailed Sales">
        <Table
          dataSource={data.current}
          rowKey="period"
          pagination={false}
          columns={[
            {
              title: 'Period',
              dataIndex: 'period',
              render: (val) => dayjs(val).format('MMM DD'),
            },
            { title: 'Sales', dataIndex: 'total_sales' },
            {
              title: 'Items Sold',
              dataIndex: 'total_items_sold',
            },
            {
              title: 'Top Products',
              dataIndex: 'products_sold',
              render: (val) =>
                val?.slice(0, 3).join(', ') || '-',
            },
          ]}
        />
      </Card>
    </div>
  );
}