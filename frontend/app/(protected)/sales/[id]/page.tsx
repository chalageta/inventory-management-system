'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Printer,
  Archive,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import api from '@/lib/api'; // Using your existing axios instance

interface SaleItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  uom: string;
  serial_numbers: string; // From your GROUP_CONCAT in backend
}

interface Sale {
  id: number;
  reference: string;
  customer_name: string;
  status: 'Completed' | 'Cancelled' | 'Pending';
  total_amount: number;
  tax_amount: number;
  user_name: string;
  created_at: string;
  items: SaleItem[];
}

export default function SaleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const saleId = params.id;

  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSale = useCallback(async () => {
    try {
      setLoading(true);
      // Matches your backend GET /api/sales/:id
      const res = await api.get(`/sales/${saleId}`);
      setSale(res.data);
    } catch (error: any) {
      console.error('Error fetching sale:', error);
      toast.error(error.response?.data?.error || 'Sale not found');
      router.push('/sales');
    } finally {
      setLoading(false);
    }
  }, [saleId, router]);

  useEffect(() => {
    if (saleId) fetchSale();
  }, [fetchSale]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!confirm(`Are you sure you want to change status to ${newStatus}?`)) return;

    try {
      await api.put(`/sales/${saleId}/status`, { status: newStatus });
      toast.success(`Sale marked as ${newStatus}`);
      fetchSale();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Update failed');
    }
  };

  const handleArchive = async () => {
    if (!confirm('Archive this sale record?')) return;
    try {
      await api.delete(`/sales/${saleId}`);
      toast.success('Sale archived');
      router.push('/sales');
    } catch (error: any) {
      toast.error('Failed to archive');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium">Loading Terminal Data...</p>
        </div>
      </div>
    );
  }

  if (!sale) return null;

  return (
    <div className="flex h-screen bg-[#f8f9fc]">
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">

          {/* Header Actions */}
          <div className="max-w-6xl mx-auto mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <Link href="/sales">
                <Button variant="ghost" size="sm" className="gap-2 text-slate-500 hover:text-slate-900 mb-2">
                  <ArrowLeft className="h-4 w-4" /> Back to Sales
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">
                  {sale.reference}
                </h2>
                <Badge className={
                  sale.status === 'Completed' ? 'bg-green-100 text-green-700 border-green-200' :
                    sale.status === 'Cancelled' ? 'bg-red-100 text-red-700 border-red-200' :
                      'bg-blue-100 text-blue-700'
                }>
                  {sale.status}
                </Badge>
              </div>
              <p className="text-slate-400 text-xs mt-1 font-medium">
                PROCESSED BY: {sale.user_name?.toUpperCase()} • {new Date(sale.created_at).toLocaleString()}
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="gap-2" onClick={() => window.print()}>
                <Printer className="h-4 w-4" /> Print Receipt
              </Button>
              {sale.status !== 'Cancelled' && (
                <Button variant="destructive" className="gap-2" onClick={() => handleUpdateStatus('Cancelled')}>
                  <XCircle className="h-4 w-4" /> Cancel Sale
                </Button>
              )}
              <Button variant="ghost" className="text-slate-400 hover:text-red-600" onClick={handleArchive}>
                <Archive className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="max-w-6xl mx-auto grid gap-6">

            {/* Customer Information */}
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
              <CardContent className="p-6 flex items-center justify-between bg-white">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Customer / Client</p>
                  <h3 className="text-xl font-bold text-slate-800">{sale.customer_name}</h3>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Method</p>
                  <Badge variant="outline" className="rounded-full px-4">Direct Sale</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Sale Items Table */}
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
              <CardHeader className="bg-white border-b border-slate-50">
                <CardTitle className="text-sm font-black uppercase text-slate-500 tracking-wider">Line Items</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="pl-6">Description</TableHead>
                      <TableHead>Qty</TableHead>
                        <TableHead className="text-right pr-6">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sale.items.map((item) => (
                      <TableRow key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                        <TableCell className="pl-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800">{item.product_name}</span>
                            {item.serial_numbers && (
                              <span className="text-[10px] text-blue-600 font-mono mt-1 bg-blue-50 px-2 py-0.5 rounded-md self-start">
                                SN: {item.serial_numbers}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-slate-600">{item.quantity} {item.uom || 'units'}</span>
                        </TableCell>
                        <TableCell className="text-right font-mono text-slate-500">
                          ${Number(item.unit_price).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right pr-6 font-bold text-slate-900">
                          ${(item.quantity * item.unit_price).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Totals and Footer */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-none shadow-sm rounded-3xl p-6 bg-white">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <AlertCircle className="h-3 w-3 text-blue-500" /> Transaction Notes
                </h4>
                <p className="text-sm text-slate-500 italic">
                  No additional notes were recorded for this transaction.
                </p>
              </Card>

              <Card className="border-none shadow-xl rounded-[40px] bg-slate-900 text-white p-8">
                <div className="space-y-4">
                  <div className="flex justify-between text-slate-400">
                    <span className="text-xs uppercase font-bold tracking-widest">Subtotal</span>
                    <span className="font-mono">${(Number(sale.total_amount) - Number(sale.tax_amount)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span className="text-xs uppercase font-bold tracking-widest">Tax Amount</span>
                    <span className="font-mono">${Number(sale.tax_amount).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-white/10 pt-4 flex justify-between items-end">
                    <div>
                      <span className="text-blue-400 text-[10px] font-black uppercase tracking-tighter">Grand Total</span>
                      <h2 className="text-4xl font-black tracking-tighter">${Number(sale.total_amount).toFixed(2)}</h2>
                    </div>
                    <CheckCircle2 className="h-10 w-10 text-blue-500/20" />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}