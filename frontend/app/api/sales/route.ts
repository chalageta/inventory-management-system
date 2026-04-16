import { query, getConnection } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '10');
    const status = req.nextUrl.searchParams.get('status');
    const search = req.nextUrl.searchParams.get('search') || '';

    const offset = (page - 1) * limit;

    let sql = 'SELECT * FROM sales WHERE deleted_at IS NULL';
    const values: any[] = [];

    if (status) {
      sql += ' AND status = ?';
      values.push(status);
    }

    if (search) {
      sql += ' AND sale_number LIKE ?';
      values.push(`%${search}%`);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    values.push(limit, offset);

    const sales = await query(sql, values);

    // Get total count
    let countSql = 'SELECT COUNT(*) as total FROM sales WHERE deleted_at IS NULL';
    const countValues: any[] = [];

    if (status) {
      countSql += ' AND status = ?';
      countValues.push(status);
    }

    if (search) {
      countSql += ' AND sale_number LIKE ?';
      countValues.push(`%${search}%`);
    }

    const countResult = await query(countSql, countValues);
    const total = (countResult as any[])[0]?.total || 0;

    return NextResponse.json({
      data: sales,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const connection = await getConnection();

  try {
    const { items, notes } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items array is required and must not be empty' },
        { status: 400 }
      );
    }

    await connection.beginTransaction();

    try {
      // Generate sale number
      const saleNumber = `SALE-${Date.now()}`;

      // Create sale record
      const insertSaleSql = `
        INSERT INTO sales (sale_number, status, notes)
        VALUES (?, 'draft', ?)
      `;
      const saleResult = await connection.execute(insertSaleSql, [saleNumber, notes || null]);
      const saleId = (saleResult[0] as any).insertId;

      let subtotal = 0;
      let totalTax = 0;

      // Insert sale items
      for (const item of items) {
        const { product_id, quantity, unit_price, tax_rate } = item;

        if (!product_id || !quantity || unit_price === undefined) {
          throw new Error('Product ID, Quantity, and Unit Price are required for each item');
        }

        const itemSubtotal = quantity * unit_price;
        const itemTax = itemSubtotal * (parseFloat(tax_rate || 0) / 100);

        const insertItemSql = `
          INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, tax_rate)
          VALUES (?, ?, ?, ?, ?)
        `;

        await connection.execute(insertItemSql, [
          saleId,
          product_id,
          quantity,
          parseFloat(unit_price),
          parseFloat(tax_rate || 0),
        ]);

        subtotal += itemSubtotal;
        totalTax += itemTax;
      }

      const total = subtotal + totalTax;

      // Update sale totals
      const updateSaleSql = `
        UPDATE sales SET subtotal = ?, tax_amount = ?, total = ?
        WHERE id = ?
      `;

      await connection.execute(updateSaleSql, [subtotal, totalTax, total, saleId]);

      await connection.commit();

      return NextResponse.json(
        {
          message: 'Sale created successfully',
          id: saleId,
          sale_number: saleNumber,
        },
        { status: 201 }
      );
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } catch (error: any) {
    console.error('Error creating sale:', error);
    return NextResponse.json({ error: error.message || 'Failed to create sale' }, { status: 500 });
  } finally {
    connection.release();
  }
}
