import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    await pool.execute('SELECT 1');
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      db: 'connected',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { status: 'error', timestamp: new Date().toISOString(), db: 'disconnected', error: msg },
      { status: 503 }
    );
  }
}
