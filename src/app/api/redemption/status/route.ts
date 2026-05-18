import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest, isCustomer } from '@/lib/auth';
import { queryOne } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = getAuthFromRequest(req);
  if (!auth || !isCustomer(auth)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const row = await queryOne<{ status: string }>(
    'SELECT status FROM redemptions WHERE id = ? AND customer_id = ?',
    [id, auth.sub]
  );

  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ status: row.status });
}
