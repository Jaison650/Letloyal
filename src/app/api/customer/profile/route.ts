import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest, isCustomer } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth || !isCustomer(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customer = await queryOne<{
      first_name: string | null;
      last_name: string | null;
      email: string | null;
      phone_number: string;
    }>(
      `SELECT first_name, last_name, email, phone_number
       FROM customers WHERE id = ?`,
      [auth.sub],
    );

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (err) {
    console.error('GET /api/customer/profile error:', err);
    return NextResponse.json({ error: 'Failed to load profile.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth || !isCustomer(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json() as {
      first_name?: string;
      last_name?: string;
      email?: string;
    };

    const { first_name, last_name, email } = body;

    const fields: string[] = [];
    const params: unknown[] = [];

    if (first_name !== undefined) { fields.push('first_name = ?'); params.push(first_name.trim() || null); }
    if (last_name  !== undefined) { fields.push('last_name = ?');  params.push(last_name.trim()  || null); }
    if (email      !== undefined) { fields.push('email = ?');      params.push(email.trim()      || null); }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    params.push(auth.sub);
    await query(
      `UPDATE customers SET ${fields.join(', ')} WHERE id = ?`,
      params as string[],
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PUT /api/customer/profile error:', err);
    return NextResponse.json({ error: 'Failed to update profile.' }, { status: 500 });
  }
}
