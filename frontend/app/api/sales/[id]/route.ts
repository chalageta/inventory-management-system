import { query, getConnection } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    const sql = `
      SELECT s.*, 
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', si.id,
            'product_id', si.product_id,
            'product_name', p.name,
            'quantity', si.quantity,
            'unit_price', si.unit_price,
            'tax_rate', si.tax_rate,
            'line_total', si.line_total
          )
        ) FROM sale_items si
        LEFT JOIN products p ON si.product_id = p.id
        WHERE si.sale_id = s.id) as items
      FROM sales s
      WHERE s.id = ? AND s.deleted_at IS NULL
    `;
    const results = (await query(sql, [id])) as any[];

    if (results.length === 0) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    const sale = results[0];
    if (sale.items) {
      sale.items = JSON.parse(sale.items);
    }

    return NextResponse.json(sale);
  } catch (error) {
    console.error('Error fetching sale:', error);
    return NextResponse.json({ error: 'Failed to fetch sale' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const connection = await getConnection();

  try {
    const id = parseInt(params.id);
    const { items, notes } = await req.json();

    await connection.beginTransaction();

    try {
      // Check if sale exists and is in draft status
      const checkSql = 'SELECT status FROM sales WHERE id = ? AND deleted_at IS NULL';
      const checkResult = (await connection.execute(checkSql, [id]))[0] as any[];

      if (checkResult.length === 0) {
        await connection.rollback();
        return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
      }

      if (checkResult[0].status !== 'draft') {
        await connection.rollback();
        return NextResponse.json(
          { error: 'Only draft sales can be updated' },
          { status: 400 }
        );
      }

      // Delete existing items
      const deleteSql = 'DELETE FROM sale_items WHERE sale_id = ?';
      await connection.execute(deleteSql, [id]);

      let subtotal = 0;
      let totalTax = 0;

      // Insert new items
      if (items && Array.isArray(items)) {
        for (const item of items) {
          const { product_id, quantity, unit_price, tax_rate } = item;

          const itemSubtotal = quantity * unit_price;
          const itemTax = itemSubtotal * (parseFloat(tax_rate || 0) / 100);

          const insertItemSql = `
            INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, tax_rate)
            VALUES (?, ?, ?, ?, ?)
          `;

          await connection.execute(insertItemSql, [
            id,
            product_id,
            quantity,
            parseFloat(unit_price),
            parseFloat(tax_rate || 0),
          ]);

          subtotal += itemSubtotal;
          totalTax += itemTax;
        }
      }

      const total = subtotal + totalTax;

      // Update sale
      const updateSql = `
        UPDATE sales SET subtotal = ?, tax_amount = ?, total = ?, notes = ?
        WHERE id = ?
      `;

      await connection.execute(updateSql, [subtotal, totalTax, total, notes || null, id]);

      await connection.commit();

      return NextResponse.json({ message: 'Sale updated successfully' });
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } catch (error: any) {
    console.error('Error updating sale:', error);
    return NextResponse.json({ error: error.message || 'Failed to update sale' }, { status: 500 });
  } finally {
    connection.release();
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    // Check if sale is in draft status
    const checkSql = 'SELECT status FROM sales WHERE id = ? AND deleted_at IS NULL';
    const checkResult = (await query(checkSql, [id])) as any[];

    if (checkResult.length === 0) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    if (checkResult[0].status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft sales can be deleted' },
        { status: 400 }
      );
    }

    // Soft delete
    const sql = 'UPDATE sales SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL';
    const result = await query(sql, [id]);

    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Sale deleted successfully' });
  } catch (error) {
    console.error('Error deleting sale:', error);
    return NextResponse.json({ error: 'Failed to delete sale' }, { status: 500 });
  }
}
