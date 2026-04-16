import { query, getConnection } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const connection = await getConnection();

  try {
    const id = parseInt(params.id);

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
          { error: 'Only draft sales can be confirmed' },
          { status: 400 }
        );
      }

      // Get all items for this sale
      const itemsSql = `
        SELECT product_id, quantity FROM sale_items WHERE sale_id = ?
      `;
      const itemsResult = (await connection.execute(itemsSql, [id]))[0] as any[];

      // Reduce stock for each product
      for (const item of itemsResult) {
        const updateStockSql = `
          UPDATE products SET stock_quantity = stock_quantity - ?
          WHERE id = ? AND deleted_at IS NULL
        `;
        await connection.execute(updateStockSql, [item.quantity, item.product_id]);
      }

      // Update sale status to confirmed
      const updateSaleSql = `
        UPDATE sales SET status = 'confirmed'
        WHERE id = ? AND deleted_at IS NULL
      `;
      await connection.execute(updateSaleSql, [id]);

      await connection.commit();

      return NextResponse.json({ message: 'Sale confirmed successfully' });
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } catch (error: any) {
    console.error('Error confirming sale:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to confirm sale' },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}
