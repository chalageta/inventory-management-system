'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Table, Input, Button, Tag, Space, Typography,
  Card, Row, Col, Statistic, Badge, Modal, Upload, Select,
  Tooltip as AntTooltip, Empty
} from 'antd';
import {
  Search,
  Plus,
  FileDown,
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  AlertCircle,
  Package,
  Layers,
  BarChart3,
  X,
  FileSpreadsheet,
  ArrowUpRight,
  TrendingUp,
  Printer
} from 'lucide-react';
import {
  BarChart, Bar, Tooltip, ResponsiveContainer,
  CartesianGrid, XAxis, YAxis, Cell
} from 'recharts';

import ProductsDialog from './products-dialog';
import { getProducts, archiveProduct, uploadProductsExcel } from '@/lib/products';
import { toast } from 'sonner';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

const { Title, Text } = Typography;

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Barcode state
  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);
  const [selectedBarcodeProduct, setSelectedBarcodeProduct] = useState<any>(null);

  const limit = 10;

  // =========================
  // LOAD CATEGORIES
  // =========================
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data } = await api.get('/categories', {
          params: { page: 1, limit: 100 },
        });
        setCategories(data?.data || []);
      } catch (err) {
        toast.error('Failed to load categories');
      }
    };
    loadCategories();
  }, []);

  // =========================
  // FETCH PRODUCTS
  // =========================
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getProducts({
        search: search || undefined,
        status: status || undefined,
        category_id: selectedCategories.length > 0 ? selectedCategories.join(',') : undefined,
        page,
        limit
      });

      setProducts(res.data || []);
      setTotal(res.pagination?.total || 0);
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [search, status, page, selectedCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // =========================
  // STATS
  // =========================
  const stats = useMemo(() => {
    const lowStockCount = products.filter(
      p => (p.quantity_available || 0) <= (p.min_stock || 3)
    ).length;

    const chartData = products.slice(0, 6).map((p, index) => ({
      name: p.name.length > 10 ? p.name.substring(0, 10) + '..' : p.name,
      Stock: p.quantity_available || 0,
      color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][index % 6]
    }));

    const totalStock = products.reduce((acc, p) => acc + (p.quantity_available || 0), 0);

    return { lowStockCount, chartData, totalStock };
  }, [products]);

  // =========================
  // DELETE
  // =========================
  const handleDelete = async (id: number) => {
    try {
      await archiveProduct(id);
      toast.success('Product archived');
      fetchProducts();
    } catch (err) {
      toast.error('Archive failed');
    }
  };

  // =========================
  // TABLE COLUMNS
  // =========================
  const columns = [
    {
      title: 'Product Details',
      key: 'info',
      render: (p: any) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
            {p.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <Text strong className="text-sm">{p.name}</Text>
            <Text type="secondary" className="text-[11px]">
              {p.manufacturer || 'N/A'} • {p.model || 'N/A'}
            </Text>
          </div>
        </div>
      )
    },
    {
      title: 'Category',
      dataIndex: 'category_name',
      key: 'category',
      render: (cat: string) => (
        <Tag className="rounded-full px-3 border-none bg-secondary text-secondary-foreground">
          {cat}
        </Tag>
      )
    },
    {
      title: 'Stock Status',
      key: 'stock',
      render: (p: any) => {
        const qty = p.quantity_available || 0;
        const low = qty <= (p.min_stock || 3);

        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", low ? "bg-destructive animate-pulse" : "bg-emerald-500")} />
              <Text strong className={low ? 'text-destructive' : 'text-emerald-600'}>
                {qty} {p.uom}
              </Text>
            </div>
            {low && <Text className="text-[10px] text-destructive italic">Low Stock</Text>}
          </div>
        );
      }
    },
    {
      title: 'Actions',
      align: 'right' as const,
      render: (p: any) => (
        <Space>
          <AntTooltip title="Print Barcode">
            <Button
              type="text"
              size="small"
              icon={<Printer size={14} className="text-slate-500" />}
              onClick={() => {
                setSelectedBarcodeProduct(p);
                setBarcodeModalOpen(true);
              }}
              className="hover:bg-slate-100 hover:text-slate-700 rounded-md"
            />
          </AntTooltip>
          <AntTooltip title="Edit Product">
            <Button
              type="text"
              size="small"
              icon={<Edit2 size={14} className="text-muted-foreground" />}
              onClick={() => {
                setEditingId(p.id);
                setDialogOpen(true);
              }}
              className="hover:bg-primary/10 hover:text-primary rounded-md"
            />
          </AntTooltip>
          <Modal
            title={<div className="flex items-center gap-2 text-destructive"><AlertCircle size={18} /> Archive Product</div>}
            onOk={() => handleDelete(p.id)}
            okText="Archive"
            okButtonProps={{ danger: true }}
          >
            <p>Are you sure you want to archive <strong>{p.name}</strong>? This will remove it from active inventory.</p>
          </Modal>
          <AntTooltip title="Archive">
            <Button 
              type="text" 
              size="small" 
              danger 
              icon={<Trash2 size={14} />} 
              onClick={() => {
                Modal.confirm({
                  title: 'Archive Product',
                  icon: <AlertCircle className="text-destructive mr-2" />,
                  content: `Are you sure you want to archive ${p.name}?`,
                  okText: 'Archive',
                  okType: 'danger',
                  cancelText: 'Cancel',
                  onOk: () => handleDelete(p.id),
                });
              }}
              className="hover:bg-destructive/10 rounded-md"
            />
          </AntTooltip>
        </Space>
      )
    }
  ];

  const resetFilters = () => {
    setSearch('');
    setStatus(null);
    setSelectedCategories([]);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Package size={20} />
            <Text className="uppercase tracking-wider text-[10px] font-bold text-primary/70">Inventory Management</Text>
          </div>
          <Title level={2} className="!m-0 !font-extrabold tracking-tight">Products</Title>
          <Text type="secondary" className="text-sm">Manage your product catalog and monitor stock levels in real-time.</Text>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button 
            icon={<FileSpreadsheet size={16} />} 
            onClick={() => setUploadOpen(true)}
            className="rounded-xl border-slate-200 hover:border-primary hover:text-primary transition-all shadow-sm h-10"
          >
            Import
          </Button>
          <Button
            type="primary"
            icon={<Plus size={16} />}
            onClick={() => {
              setEditingId(null);
              setDialogOpen(true);
            }}
            className="rounded-xl shadow-md h-10 bg-primary hover:bg-primary/90 border-none px-6 font-semibold"
          >
            Add Product
          </Button>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-none shadow-sm overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Layers size={48} className="text-primary" />
          </div>
          <Statistic
            title={<span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Products</span>}
            value={total}
            prefix={<Package size={16} className="mr-2 text-primary" />}
            valueStyle={{ fontWeight: 800, fontSize: '24px' }}
          />
          <div className="mt-2 flex items-center text-[11px] text-emerald-600 font-medium">
            <TrendingUp size={12} className="mr-1" />
            <span>Across {categories.length} categories</span>
          </div>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm overflow-hidden group hover:shadow-md transition-all border-l-4 border-l-destructive">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-destructive">
            <AlertCircle size={48} />
          </div>
          <Statistic
            title={<span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Low Stock Alerts</span>}
            value={stats.lowStockCount}
            valueStyle={{ color: '#ef4444', fontWeight: 800, fontSize: '24px' }}
            prefix={<AlertCircle size={16} className="mr-2" />}
          />
          <div className="mt-2 flex items-center text-[11px] text-destructive font-medium uppercase">
            Needs attention
          </div>
        </Card>

        <Card className="md:col-span-2 rounded-2xl border-none shadow-sm overflow-hidden p-0">
          <div className="flex h-full items-center px-6 py-4 gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={16} className="text-primary" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock Distribution</span>
              </div>
              <div className="h-20">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.chartData}>
                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="Stock" radius={[4, 4, 0, 0]}>
                      {stats.chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="w-px h-16 bg-slate-100 hidden sm:block" />
            <div className="hidden sm:block">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Top Item</div>
              <div className="text-sm font-bold text-slate-800 max-w-[120px] truncate">
                {stats.chartData[0]?.name || 'No data'}
              </div>
              <div className="text-[10px] text-primary font-bold">{stats.chartData[0]?.Stock || 0} Units</div>
            </div>
          </div>
        </Card>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px] relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
          <Input
            placeholder="Search by name, model, barcode..."
            className="pl-10 h-11 border-slate-100 bg-slate-50 rounded-xl focus:bg-white focus:border-primary transition-all"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            suffix={search && <X size={14} className="cursor-pointer text-slate-400 hover:text-slate-600" onClick={() => setSearch('')} />}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            mode="multiple"
            placeholder={<div className="flex items-center gap-2"><Filter size={14} /> Category</div>}
            className="min-w-[180px]"
            variant="filled"
            maxTagCount="responsive"
            style={{ borderRadius: '12px' }}
            options={categories.map(c => ({ label: c.name, value: c.id }))}
            onChange={(vals) => {
              setSelectedCategories(vals);
              setPage(1);
            }}
          />

          <Select
            placeholder={<div className="flex items-center gap-2"><AlertCircle size={14} /> Status</div>}
            className="min-w-[140px]"
            variant="filled"
            allowClear
            onChange={(val) => {
              setStatus(val);
              setPage(1);
            }}
            options={[{ value: 'low_stock', label: 'Low Stock' }]}
          />

          {(search || status || selectedCategories.length > 0) && (
            <Button 
              type="text" 
              onClick={resetFilters} 
              className="text-primary font-semibold hover:bg-primary/5 rounded-lg"
            >
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* MAIN TABLE */}
      <Card className="rounded-3xl border-none shadow-sm overflow-hidden p-0 bg-white">
        <Table
          rowKey="id"
          dataSource={products}
          columns={columns}
          loading={loading}
          pagination={{
            current: page,
            total,
            pageSize: limit,
            onChange: (p) => setPage(p),
            showSizeChanger: false,
            className: "px-6 py-4",
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div className="space-y-2">
                    <p className="text-slate-500 font-medium">No products found</p>
                    <Button type="primary" size="small" onClick={() => setDialogOpen(true)}>Add New Product</Button>
                  </div>
                }
              />
            )
          }}
          className="modern-table"
        />
      </Card>

      {/* DIALOGS */}
      <ProductsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingId={editingId}
        onSuccess={fetchProducts}
      />

      <Modal
        title={
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <div className="font-bold">Import Products</div>
              <div className="text-[11px] text-slate-500 font-normal">Excel or CSV format supported</div>
            </div>
          </div>
        }
        open={uploadOpen}
        onCancel={() => !uploading && setUploadOpen(false)}
        footer={null}
        centered
        className="rounded-2xl overflow-hidden"
      >
        <Upload.Dragger
          accept=".xlsx,.xls"
          showUploadList={false}
          customRequest={async ({ file, onSuccess, onError }) => {
            try {
              setUploading(true);
              const res = await uploadProductsExcel(file as File);
              toast.success(`Success: Imported ${res.insertedProducts} products`);
              onSuccess?.(res);
              setUploadOpen(false);
              fetchProducts();
            } catch (err: any) {
              toast.error(err.response?.data?.error || 'Import failed');
              onError?.(err);
            } finally {
              setUploading(false);
            }
          }}
          className="border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 hover:bg-emerald-50/30 hover:border-emerald-200 transition-all p-8"
        >
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400">
              <ArrowUpRight size={32} />
            </div>
            <div>
              <p className="font-bold text-slate-700">Click or drag file to this area</p>
              <p className="text-sm text-slate-500">Support for single file upload. Strictly prohibited from uploading company data or other band files</p>
            </div>
            {uploading && <div className="text-primary font-bold animate-pulse">Processing file...</div>}
          </div>
        </Upload.Dragger>
      </Modal>

      {/* BARCODE PRINT MODAL */}
      <Modal
        title={
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
              <Printer size={20} />
            </div>
            <div>
              <div className="font-bold">Print Barcode Label</div>
              <div className="text-[11px] text-slate-500 font-normal">For {selectedBarcodeProduct?.name}</div>
            </div>
          </div>
        }
        open={barcodeModalOpen}
        onCancel={() => setBarcodeModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setBarcodeModalOpen(false)}>
            Close
          </Button>,
          <Button 
            key="print" 
            type="primary" 
            icon={<Printer size={16} />}
            onClick={() => {
              const printContent = document.getElementById('barcode-print-area');
              if (printContent) {
                const originalContents = document.body.innerHTML;
                document.body.innerHTML = printContent.innerHTML;
                window.print();
                document.body.innerHTML = originalContents;
                window.location.reload();
              }
            }}
          >
            Print Label
          </Button>
        ]}
        centered
        className="rounded-2xl overflow-hidden"
      >
        {selectedBarcodeProduct && (
          <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border border-slate-200 rounded-xl">
            <div id="barcode-print-area" className="flex flex-col items-center text-center p-4 bg-white w-full max-w-[300px]">
              <div className="font-bold text-sm mb-1 uppercase tracking-wide truncate w-full">
                {selectedBarcodeProduct.name}
              </div>
              <div className="text-xs text-gray-500 mb-3 truncate w-full">
                {selectedBarcodeProduct.manufacturer}
              </div>
              
              {selectedBarcodeProduct.barcode ? (
                <img 
                  src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(selectedBarcodeProduct.barcode)}&scale=3&includetext`} 
                  alt="Barcode"
                  className="max-w-full h-auto mb-2"
                />
              ) : (
                <div className="p-4 border-2 border-dashed border-red-200 text-red-500 rounded-lg text-sm bg-red-50">
                  No barcode assigned to this product
                </div>
              )}
              
              <div className="text-[10px] text-gray-400 mt-2">
                Generated by Inventory System
              </div>
            </div>
          </div>
        )}
      </Modal>

      <style jsx global>{`
        .modern-table .ant-table-thead > tr > th {
          background: #f8fafc;
          color: #64748b;
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.025em;
          border-bottom: 1px solid #f1f5f9;
        }
        .modern-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f8fafc;
          padding: 16px 12px;
        }
        .modern-table .ant-table-tbody > tr:hover > td {
          background: #f8fafc !important;
        }
        .ant-select-selector {
          border-radius: 12px !important;
        }
        .ant-card {
          border-radius: 1.5rem !important;
        }
      `}</style>
    </div>
  );
}
