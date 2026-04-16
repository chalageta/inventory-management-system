import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const reportType = req.nextUrl.searchParams.get('type') || 'daily-sales';
    const startDate = req.nextUrl.searchParams.get('start_date');
    const endDate = req.nextUrl.searchParams.get('end_date');

    let result;

    switch (reportType) {
      case 'daily-sales':
        result = await getDailySalesReport(startDate, endDate);
        break;
      case 'monthly-sales':
        result = await getMonthlySalesReport(startDate, endDate);
        break;
      case 'top-products':
        result = await getTopProductsReport(startDate, endDate);
        break;
      case 'stock-value':
        result = await getStockValueReport();
        break;
      case 'tax-collected':
        result = await getTaxCollectedReport(startDate, endDate);
        break;
      case 'low-stock':
        result = await getLowStockReport();
        break;
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}

async function getDailySalesReport(startDate?: string | null, endDate?: string | null) {
  let sql = `
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as sale_count,
      SUM(subtotal) as subtotal,
      SUM(tax_amount) as tax,
      SUM(total) as total
    FROM sales
    WHERE deleted_at IS NULL AND status IN ('confirmed', 'done')
  `;
  const values: any[] = [];

  if (startDate) {
    sql += ' AND DATE(created_at) >= ?';
    values.push(startDate);
  }

  if (endDate) {
    sql += ' AND DATE(created_at) <= ?';
    values.push(endDate);
  }

  sql += ' GROUP BY DATE(created_at) ORDER BY date DESC';

  const data = await query(sql, values);
  return { report_type: 'daily-sales', data };
}

async function getMonthlySalesReport(startDate?: string | null, endDate?: string | null) {
  let sql = `
    SELECT 
      DATE_FORMAT(created_at, '%Y-%m') as month,
      COUNT(*) as sale_count,
      SUM(subtotal) as subtotal,
      SUM(tax_amount) as tax,
      SUM(total) as total
    FROM sales
    WHERE deleted_at IS NULL AND status IN ('confirmed', 'done')
  `;
  const values: any[] = [];

  if (startDate) {
    sql += ' AND DATE(created_at) >= ?';
    values.push(startDate);
  }

  if (endDate) {
    sql += ' AND DATE(created_at) <= ?';
    values.push(endDate);
  }

  sql += ' GROUP BY DATE_FORMAT(created_at, "%Y-%m") ORDER BY month DESC';

  const data = await query(sql, values);
  return { report_type: 'monthly-sales', data };
}

async function getTopProductsReport(startDate?: string | null, endDate?: string | null) {
  let sql = `
    SELECT 
      p.id,
      p.name,
      p.sku,
      SUM(si.quantity) as total_quantity,
      SUM(si.line_total) as total_revenue
    FROM sale_items si
    JOIN products p ON si.product_id = p.id
    JOIN sales s ON si.sale_id = s.id
    WHERE s.deleted_at IS NULL AND s.status IN ('confirmed', 'done')
  `;
  const values: any[] = [];

  if (startDate) {
    sql += ' AND DATE(s.created_at) >= ?';
    values.push(startDate);
  }

  if (endDate) {
    sql += ' AND DATE(s.created_at) <= ?';
    values.push(endDate);
  }

  sql += ' GROUP BY p.id, p.name, p.sku ORDER BY total_revenue DESC LIMIT 10';

  const data = await query(sql, values);
  return { report_type: 'top-products', data };
}

async function getStockValueReport() {
  const sql = `
    SELECT 
      p.id,
      p.name,
      p.sku,
      c.name as category,
      p.stock_quantity,
      p.unit_price,
      (p.stock_quantity * p.unit_price) as total_value
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.deleted_at IS NULL AND p.stock_quantity > 0
    ORDER BY total_value DESC
  `;

  const data = await query(sql);
  return { report_type: 'stock-value', data };
}

async function getTaxCollectedReport(startDate?: string | null, endDate?: string | null) {
  let sql = `
    SELECT 
      DATE(created_at) as date,
      SUM(tax_amount) as tax_collected,
      SUM(total) as sales_total
    FROM sales
    WHERE deleted_at IS NULL AND status IN ('confirmed', 'done')
  `;
  const values: any[] = [];

  if (startDate) {
    sql += ' AND DATE(created_at) >= ?';
    values.push(startDate);
  }

  if (endDate) {
    sql += ' AND DATE(created_at) <= ?';
    values.push(endDate);
  }

  sql += ' GROUP BY DATE(created_at) ORDER BY date DESC';

  const data = await query(sql, values);
  return { report_type: 'tax-collected', data };
}

async function getLowStockReport() {
  const sql = `
    SELECT 
      p.id,
      p.name,
      p.sku,
      c.name as category,
      p.stock_quantity,
      p.reorder_level,
      (p.reorder_level - p.stock_quantity) as shortage
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.deleted_at IS NULL AND p.stock_quantity <= p.reorder_level
    ORDER BY shortage DESC
  `;

  const data = await query(sql);
  return { report_type: 'low-stock', data };
}
