import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '10');
    const search = req.nextUrl.searchParams.get('search') || '';

    const offset = (page - 1) * limit;

    let sql = 'SELECT * FROM categories WHERE deleted_at IS NULL';
    const values: any[] = [];

    if (search) {
      sql += ' AND name LIKE ?';
      values.push(`%${search}%`);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    values.push(limit, offset);

    const categories = await query(sql, values);

    // Get total count
    let countSql = 'SELECT COUNT(*) as total FROM categories WHERE deleted_at IS NULL';
    const countValues: any[] = [];

    if (search) {
      countSql += ' AND name LIKE ?';
      countValues.push(`%${search}%`);
    }

    const countResult = await query(countSql, countValues);
    const total = (countResult as any[])[0]?.total || 0;

    return NextResponse.json({
      data: categories,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, description } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const sql = 'INSERT INTO categories (name, description) VALUES (?, ?)';
    const result = await query(sql, [name, description || null]);

    return NextResponse.json(
      {
        message: 'Category created successfully',
        id: (result as any).insertId,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating category:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'Category name already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
