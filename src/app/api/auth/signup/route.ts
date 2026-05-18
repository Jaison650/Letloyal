import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query, queryOne } from '@/lib/db';
import { hashPassword, signToken, cookieOptions, COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { phone_number, password, first_name } = await req.json();

    if (!phone_number?.trim()) {
      return NextResponse.json({ error: 'Phone number is required.' }, { status: 400 });
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    const phone = phone_number.replace(/\s/g, '');

    const existing = await queryOne('SELECT id FROM customers WHERE phone_number = ?', [phone]);
    if (existing) {
      return NextResponse.json({ error: 'Phone number already registered.' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    // Use MySQL UUID() directly in the INSERT
    await query(
      `INSERT INTO customers (id, phone_number, password_hash, first_name, phone_verified, status)
       VALUES (UUID(), ?, ?, ?, 1, 'active')`,
      [phone, passwordHash, first_name?.trim() || null],
    );

    const customer = await queryOne<{ id: string; phone_number: string; first_name: string | null }>(
      'SELECT id, phone_number, first_name FROM customers WHERE phone_number = ?',
      [phone],
    );
    if (!customer) throw new Error('Customer insert failed');

    const token = signToken({
      sub: customer.id,
      type: 'customer',
      phone,
      firstName: customer.first_name ?? undefined,
    });

    const cookieStore = await cookies();
    const opts = cookieOptions(COOKIE_NAME);
    cookieStore.set(opts.name, token, opts);

    return NextResponse.json(
      { success: true, customer: { id: customer.id, phone_number: customer.phone_number, first_name: customer.first_name } },
      { status: 201 },
    );
  } catch (err) {
    console.error('Signup error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
