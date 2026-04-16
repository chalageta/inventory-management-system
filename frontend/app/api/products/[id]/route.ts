import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    const sql = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ? AND p.deleted_at IS NULL
    `;
    const results = (await query(sql, [id])) as any[];

    if (results.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(results[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
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
      is_active,
    } = await req.json();

    if (!name || !sku || !category_id || unit_price === undefined) {
      return NextResponse.json(
        { error: 'Name, SKU, Category ID, and Unit Price are required' },
        { status: 400 }
      );
    }

    const sql = `
      UPDATE products SET
        category_id = ?, name = ?, sku = ?, barcode = ?,
        description = ?, unit_price = ?, tax_rate = ?,
        stock_quantity = ?, reorder_level = ?, is_active = ?
      WHERE id = ? AND deleted_at IS NULL
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
      is_active !== false ? 1 : 0,
      id,
    ]);

    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Product updated successfully' });
  } catch (error: any) {
    console.error('Error updating product:', error);

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

    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    // Soft delete
    const sql = 'UPDATE products SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL';
    const result = await query(sql, [id]);

    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
