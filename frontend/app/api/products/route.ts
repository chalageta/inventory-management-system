import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '10');
    const search = req.nextUrl.searchParams.get('search') || '';
    const categoryId = req.nextUrl.searchParams.get('category_id');
    const lowStock = req.nextUrl.searchParams.get('low_stock') === 'true';

    const offset = (page - 1) * limit;

    let sql = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.deleted_at IS NULL
    `;
    const values: any[] = [];

    if (search) {
      sql += ' AND (p.name LIKE ? OR p.sku LIKE ?)';
      values.push(`%${search}%`, `%${search}%`);
    }

    if (categoryId) {
      sql += ' AND p.category_id = ?';
      values.push(parseInt(categoryId));
    }

    if (lowStock) {
      sql += ' AND p.stock_quantity <= p.reorder_level';
    }

    sql += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    values.push(limit, offset);

    const products = await query(sql, values);

    // Get total count
    let countSql = 'SELECT COUNT(*) as total FROM products WHERE deleted_at IS NULL';
    const countValues: any[] = [];

    if (search) {
      countSql += ' AND (name LIKE ? OR sku LIKE ?)';
      countValues.push(`%${search}%`, `%${search}%`);
    }

    if (categoryId) {
      countSql += ' AND category_id = ?';
      countValues.push(parseInt(categoryId));
    }

    if (lowStock) {
      countSql += ' AND stock_quantity <= reorder_level';
    }

    const countResult = await query(countSql, countValues);
    const total = (countResult as any[])[0]?.total || 0;

    return NextResponse.json({
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const {
      category_id,
      name,
      sku,
      barcode,
      description,
      unit_price,
      tax_rate,
      stock_quantity,
      reorder_level,
    } = await req.json();

    if (!name || !sku || !category_id || unit_price === undefined) {
      return NextResponse.json(
        { error: 'Name, SKU, Category ID, and Unit Price are required' },
        { status: 400 }
      );
    }

    const sql = `
      INSERT INTO products (
        category_id, name, sku, barcode, description,
        unit_price, tax_rate, stock_quantity, reorder_level
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await query(sql, [
      category_id,
      name,
      sku,
      barcode || null,
      description || null,
      parseFloat(unit_price),
      parseFloat(tax_rate || 0),
      parseInt(stock_quantity || 0),
      parseInt(reorder_level || 10),
    ]);

    return NextResponse.json(
      {
        message: 'Product created successfully',
        id: (result as any).insertId,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating product:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'SKU already exists' },
        { status: 409 }
      );
    }

    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
