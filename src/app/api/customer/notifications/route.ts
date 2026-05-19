import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest, isCustomer } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = getAuthFromRequest(req);
  if (!auth || !isCustomer(auth)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const notifications = await query<{
    id: string; type: string; title: string; body: string;
    action_url: string | null; is_read: boolean; created_at: string;
  }>(
    `SELECT id, type, title, body, action_url, is_read, created_at
       FROM notifications
      WHERE recipient_type = 'customer' AND recipient_id = ?
      ORDER BY created_at DESC LIMIT 30`,
    [auth.sub]
  );

  const unreadCount = notifications.filter(n => !n.is_read).length;
  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(req: NextRequest) {
  const auth = getAuthFromRequest(req);
  if (!auth || !isCustomer(auth)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { ids } = body as { ids?: string[] };

  if (ids && ids.length > 0) {
    const placeholders = ids.map(() => '?').join(',');
    await query(
      `UPDATE notifications SET is_read = TRUE
        WHERE recipient_type = 'customer' AND recipient_id = ? AND id IN (${placeholders})`,
      [auth.sub, ...ids]
    );
  } else {
    await query(
      `UPDATE notifications SET is_read = TRUE WHERE recipient_type = 'customer' AND recipient_id = ?`,
      [auth.sub]
    );
  }
  return NextResponse.json({ success: true });
}
