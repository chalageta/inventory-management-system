'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Download, RefreshCw, ChevronRight, BarChart3, PieChart, TrendingUp, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState('daily-sales');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const reports = [
    { id: 'daily-sales', name: 'Daily Sales', icon: <TrendingUp className="h-4 w-4" />, endpoint: '/api/reports/sales-trends' },
    { id: 'monthly-sales', name: 'Monthly Sales', icon: <BarChart3 className="h-4 w-4" />, endpoint: '/api/reports/sales-trends' },
    { id: 'top-products', name: 'Top Products', icon: <PieChart className="h-4 w-4" />, endpoint: '/api/reports/top-products' },
    { id: 'stock-value', name: 'Stock Value', icon: <Calendar className="h-4 w-4" />, endpoint: '/api/reports/stock-value' },
    { id: 'tax-collected', name: 'Tax Collected', icon: <Download className="h-4 w-4" />, endpoint: '/api/reports/tax' },
    { id: 'low-stock', name: 'Low Stock Alert', icon: <AlertCircle className="h-4 w-4" />, endpoint: '/api/reports/stats-summary' },
  ];

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const config = reports.find(r => r.id === selectedReport);
      if (!config) return;

      const params = new URLSearchParams({
        type: selectedReport, // This passes 'monthly-sales' or 'daily-sales'
        ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate }),
      });

      const res = await fetch(`${config.endpoint}?${params}`);
      const data = await res.json();

      if (selectedReport === 'low-stock') {
        setReportData(data.low_stock_items || []);
      } else {
        setReportData(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      toast.error('Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  }, [selectedReport, startDate, endDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const getTotalValue = () => {
    return reportData.reduce((sum, row) => {
      const val = row.total || row.total_revenue || row.stock_value || row.tax_collected || 0;
      return sum + parseFloat(val);
    }, 0);
  };

  const renderReportContent = () => {
    if (loading) return <div className="py-20 text-center animate-pulse text-slate-500">Generating report...</div>;
    if (reportData.length === 0) return <div className="py-20 text-center text-muted-foreground">No records found for this period.</div>;

    return (
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/50">
            {selectedReport.includes('sales') && (
              <>
                <TableHead>{selectedReport === 'monthly-sales' ? 'Month' : 'Date'}</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead className="text-right">Tax</TableHead>
                <TableHead className="text-right font-bold">Total Gross</TableHead>
              </>
            )}
            {selectedReport === 'top-products' && (
              <>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Qty Sold</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </>
            )}
            {selectedReport === 'stock-value' && (
              <>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right font-bold">Total Value</TableHead>
              </>
            )}
            {selectedReport === 'tax-collected' && (
              <>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Tax Collected</TableHead>
                <TableHead className="text-right">Total Sales</TableHead>
              </>
            )}
            {selectedReport === 'low-stock' && (
              <>
                <TableHead>Product</TableHead>
                <TableHead className="text-right text-destructive">Current Stock</TableHead>
                <TableHead className="text-right">Min Level</TableHead>
                <TableHead className="text-right">Shortage</TableHead>
              </>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {reportData.map((row, idx) => (
            <TableRow key={idx} className="hover:bg-slate-50/50 transition-colors">
              {selectedReport.includes('sales') && (
                <>
                  <TableCell className="font-medium text-slate-700">{row.date || row.month}</TableCell>
                  <TableCell className="text-right">{row.sale_count}</TableCell>
                  <TableCell className="text-right">${parseFloat(row.subtotal).toLocaleString()}</TableCell>
                  <TableCell className="text-right">${parseFloat(row.tax).toLocaleString()}</TableCell>
                  <TableCell className="text-right font-bold text-slate-900">${parseFloat(row.total).toLocaleString()}</TableCell>
                </>
              )}
              {selectedReport === 'top-products' && (
                <>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="font-mono text-xs text-slate-500">{row.sku}</TableCell>
                  <TableCell className="text-right font-bold">{row.total_quantity}</TableCell>
                  <TableCell className="text-right text-green-600">${parseFloat(row.total_revenue).toLocaleString()}</TableCell>
                </>
              )}
              {selectedReport === 'stock-value' && (
                <>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="text-slate-500">{row.category}</TableCell>
                  <TableCell className="text-right">{row.quantity_on_hand}</TableCell>
                  <TableCell className="text-right font-bold">${parseFloat(row.stock_value).toLocaleString()}</TableCell>
                </>
              )}
              {selectedReport === 'tax-collected' && (
                <>
                  <TableCell>{row.date}</TableCell>
                  <TableCell className="text-right text-orange-600 font-bold">${parseFloat(row.tax_collected).toLocaleString()}</TableCell>
                  <TableCell className="text-right">${parseFloat(row.sales_total).toLocaleString()}</TableCell>
                </>
              )}
              {selectedReport === 'low-stock' && (
                <>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="text-right text-destructive font-bold">{row.stock_quantity}</TableCell>
                  <TableCell className="text-right">{row.reorder_level}</TableCell>
                  <TableCell className="text-right bg-red-50 text-red-700 font-medium">-{row.shortage}</TableCell>
                </>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="flex h-screen bg-[#f8fafc]">
      <main className="flex-1 overflow-auto p-6 lg:p-10">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Business Intelligence</h1>
            <p className="text-slate-500 mt-1 text-sm">Advanced reporting for ECC Inventory Management.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={fetchReport} className="bg-white shadow-sm border-slate-200">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button className="bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-200">
              <Download className="h-4 w-4 mr-2" /> Export PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1 space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-3">Report Types</p>
            {reports.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedReport(r.id)}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 ${
                  selectedReport === r.id 
                  ? 'bg-white border-blue-100 shadow-xl shadow-blue-50/50 ring-1 ring-blue-50 text-blue-700 font-bold' 
                  : 'bg-transparent border-transparent hover:bg-slate-200/50 text-slate-600'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className={`${selectedReport === r.id ? 'text-blue-600' : 'text-slate-400'}`}>{r.icon}</span>
                  {r.name}
                </span>
                <ChevronRight className={`h-4 w-4 transition-transform ${selectedReport === r.id ? 'opacity-100 translate-x-1' : 'opacity-20'}`} />
              </button>
            ))}
          </aside>

          <section className="lg:col-span-3 space-y-6">
            <Card className="border-slate-200/60 shadow-sm overflow-hidden bg-white">
              <CardContent className="p-4 flex flex-wrap items-end gap-4">
                <div className="space-y-1.5 flex-1 min-w-[150px]">
                  <Label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Period From</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input type="date" className="pl-9 bg-slate-50/50 border-slate-200 focus:bg-white" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5 flex-1 min-w-[150px]">
                  <Label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Period To</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input type="date" className="pl-9 bg-slate-50/50 border-slate-200 focus:bg-white" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                </div>
                <Button onClick={fetchReport} className="bg-blue-600 hover:bg-blue-700 px-8 shadow-md shadow-blue-100">
                  Run Report
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white overflow-hidden shadow-2xl shadow-slate-200/50 border-slate-200/60 rounded-2xl">
              <CardHeader className="border-b border-slate-100 bg-slate-50/30 py-5">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base font-bold text-slate-800">Dataset View</CardTitle>
                  <div className="flex gap-2">
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                      {reportData.length} records
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="min-h-[400px]">
                  {renderReportContent()}
                </div>
                {reportData.length > 0 && selectedReport !== 'low-stock' && (
                  <div className="p-8 bg-slate-900 border-t border-slate-800 flex justify-end">
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cumulative Total</p>
                      <h2 className="text-4xl font-black text-white">
                        <span className="text-blue-400 mr-2">$</span>
                        {getTotalValue().toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </h2>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}