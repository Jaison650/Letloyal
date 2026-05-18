import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { queryOne } from '@/lib/db';
import { comparePassword, signToken, cookieOptions, COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { phone_number, password } = await req.json();

    if (!phone_number?.trim() || !password) {
      return NextResponse.json({ error: 'Phone number and password are required.' }, { status: 400 });
    }

    const phone = phone_number.replace(/\s/g, '');

    const customer = await queryOne<{
      id: string;
      phone_number: string;
      password_hash: string;
      first_name: string | null;
      status: string;
    }>('SELECT id, phone_number, password_hash, first_name, status FROM customers WHERE phone_number = ?', [phone]);

    if (!customer) {
      return NextResponse.json({ error: 'No account found with that phone number.' }, { status: 401 });
    }
    if (customer.status !== 'active') {
      return NextResponse.json({ error: 'Your account has been suspended.' }, { status: 403 });
    }

    const valid = await comparePassword(password, customer.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
    }

    const token = signToken({
      sub: customer.id,
      type: 'customer',
      phone,
      firstName: customer.first_name ?? undefined,
    });

    const cookieStore = await cookies();
    const opts = cookieOptions(COOKIE_NAME);
    cookieStore.set(opts.name, token, opts);

    return NextResponse.json({
      success: true,
      customer: { id: customer.id, phone_number: customer.phone_number, first_name: customer.first_name },
    });
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
