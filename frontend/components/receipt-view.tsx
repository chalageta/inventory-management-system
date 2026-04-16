'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Printer, X } from 'lucide-react';

interface ReceiptItem {
  name: string;
  qty: number;
  uom: string;
  price: number;
  total: number;
  serials?: string;
}

interface ReceiptViewProps {
  data: {
    header: {
      company: string;
      address: string;
      reference: string;
      date: string;
      customer: string;
      cashier: string;
    };
    items: ReceiptItem[];
    summary: {
      subtotal: number;
      tax: number;
      total: number;
    };
  };
  onClose: () => void;
}

export function ReceiptView({ data, onClose }: ReceiptViewProps) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 2,
    }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const handlePrint = () => window.print();

  const parseSerials = (serials?: string) =>
    serials?.split(',').map((s) => s.trim()) || [];

  return (
    <div className="flex flex-col bg-slate-100 min-h-screen print:bg-white">
      {/* Top Controls - Hidden in Print */}
      <div className="sticky top-0 z-50 flex justify-between items-center p-3 bg-white border-b border-slate-200 print:hidden">
        <h3 className="font-bold text-base text-slate-900">Sale Receipt</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1">
            <Printer className="w-4 h-4" /> Print
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Receipt Wrapper */}
      <div className="overflow-auto py-6 px-3 print:p-0">
        <div
          id="printable-receipt"
          className="mx-auto w-full mx-auto w-full max-w-[210mm] min-h-[300px] bg-white border shadow-lg p-8 bg-white border shadow-lg p-8
                 print:max-w-full print:min-h-full print:shadow-none print:border-none print:p-6"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start border-b-2 border-slate-900 pb-4 mb-4">
            {/* Company Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 truncate">
                {data.header.company}
              </h1>
              <p className="text-sm text-slate-500 mt-1 italic truncate">{data.header.address}</p>
            </div>

            {/* Reference and Date */}
            <div className="mt-2 md:mt-0 text-left md:text-right flex-shrink-0">
              <div className="inline-block px-2 py-1 bg-slate-900 text-white font-mono text-xs mb-1">
                {data.header.reference}
              </div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Date Issued</p>
              <p className="text-sm font-medium">{formatDate(data.header.date)}</p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="mb-6">
            <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-1">Bill To</h4>
            <p className="text-base font-semibold text-slate-900">{data.header.customer}</p>
          </div>

          {/* Items Table */}
          <table className="w-full border-collapse mb-6 text-sm">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="text-left py-2 text-[10px] font-bold uppercase tracking-wider text-slate-900">
                  Pro Name
                </th>
                <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider text-slate-900">
                  Qty
                </th>
                <th className="text-right py-2 text-[10px] font-bold uppercase tracking-wider text-slate-900">
                  Price
                </th>
                <th className="text-right py-2 text-[10px] font-bold uppercase tracking-wider text-slate-900">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.items.map((item, idx) => (
                <tr key={idx} className="print:break-inside-avoid">
                  <td className="py-2">
                    <p className="font-medium text-slate-900">{item.name}</p>
                    {parseSerials(item.serials).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {parseSerials(item.serials).slice(0, 2).map((s, i) => (
                          <Badge key={i} variant="outline" className="text-[9px] font-mono">
                            {s}
                          </Badge>
                        ))}
                        {parseSerials(item.serials).length > 2 && (
                          <Badge variant="outline" className="text-[9px]">
                            +{parseSerials(item.serials).length - 2} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="py-2 text-center text-[10px] font-medium">
                    {item.qty} <span className="text-slate-400 text-[9px] lowercase">{item.uom}</span>
                  </td>
                  <td className="py-2 text-right text-[10px] text-slate-600">{formatCurrency(item.price)}</td>
                  <td className="py-2 text-right font-bold text-slate-900">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summary */}
          <div className="flex justify-end border-t-2 border-slate-900 pt-3">
            <div className="w-56 space-y-1 text-sm">
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Tax (Included)</span>
                <span>{formatCurrency(data.summary.tax)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-t border-slate-200">
                <span className="text-base font-black uppercase italic">Total</span>
                <span className="text-xl font-black text-slate-900">{formatCurrency(data.summary.total)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">
              Generated by {data.header.cashier} • Ref: {data.header.reference}
            </p>
            <p className="mt-1 text-sm font-medium">Thank you for your business!</p>
          </div>
        </div>
      </div>

      {/* Print CSS */}
      <style>{`
  @media print {
    body * { visibility: hidden; }
    #printable-receipt, #printable-receipt * { visibility: visible; }
    #printable-receipt {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: auto; /* مهم */
    }
  }
`}</style>
    </div>


  );
}