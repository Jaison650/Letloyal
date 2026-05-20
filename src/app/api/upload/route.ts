import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { getMerchantAuthFromCookies } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const auth = await getMerchantAuthFromCookies();
  if (!auth || auth.type !== 'merchant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const slug = (auth as { slug: string }).slug;

  const form = await req.formData();
  const file = form.get('file') as File | null;
  const type = (form.get('type') as string) || 'image'; // 'logo' | 'banner'

  if (!file || file.size === 0) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  // Allow only common image types
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
  }

  // 5 MB limit
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 5 MB)' }, { status: 400 });
  }

  const ext = file.name.split('.').pop() ?? 'jpg';
  const pathname = `merchants/${slug}/${type}-${Date.now()}.${ext}`;

  const blob = await put(pathname, file, { access: 'public' });

  return NextResponse.json({ url: blob.url });
}
