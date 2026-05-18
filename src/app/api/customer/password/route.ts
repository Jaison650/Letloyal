import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getAuthFromRequest, isCustomer } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

export async function PUT(req: NextRequest) {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth || !isCustomer(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json() as {
      current_password?: string;
      new_password?: string;
    };

    const { current_password, new_password } = body;

    if (!current_password || !new_password) {
      return NextResponse.json(
        { error: 'current_password and new_password are required' },
        { status: 400 },
      );
    }

    if (new_password.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters' },
        { status: 400 },
      );
    }

    const customer = await queryOne<{ password_hash: string }>(
      `SELECT password_hash FROM customers WHERE id = ?`,
      [auth.sub],
    );

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const valid = await bcrypt.compare(current_password, customer.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    const newHash = await bcrypt.hash(new_password, 12);
    await query(`UPDATE customers SET password_hash = ? WHERE id = ?`, [newHash, auth.sub]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PUT /api/customer/password error:', err);
    return NextResponse.json({ error: 'Failed to update password.' }, { status: 500 });
  }
}
