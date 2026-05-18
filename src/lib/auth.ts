import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { queryOne } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_in_production';
const JWT_EXPIRY  = process.env.JWT_EXPIRY  || '30d';

export const COOKIE_NAME          = 'letloyal_auth';
export const MERCHANT_COOKIE_NAME = 'letloyal_merchant';

// ── Token payload shapes ──────────────────────────────────────────────────────
export interface CustomerPayload {
  sub: string;
  type: 'customer';
  phone: string;
  firstName?: string;
}

export interface MerchantPayload {
  sub: string;
  type: 'merchant';
  slug: string;
  plan: string;
}

export type TokenPayload = CustomerPayload | MerchantPayload;

// ── DB row shapes returned by the `From Request` helpers ──────────────────────
export interface Customer {
  id: string;
  phone_number: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  status: string;
  created_at: string;
}

export interface MerchantRow {
  id: string;
  slug: string;
  business_name: string;
  category: string;
  tagline: string | null;
  address: string | null;
  city: string | null;
  logo_svg: string | null;
  brand_color: string;
  plan_tier: string;
  is_demo: boolean;
}

// ── JWT helpers ────────────────────────────────────────────────────────────────
export function signToken(
  payload: CustomerPayload | MerchantPayload,
  expiresIn: string = JWT_EXPIRY,
): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as jwt.SignOptions);
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

// ── Password helpers ───────────────────────────────────────────────────────────
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ── Cookie helpers ─────────────────────────────────────────────────────────────
export function cookieOptions(
  cookieName: string = COOKIE_NAME,
  maxAge: number = 60 * 60 * 24 * 30,
) {
  return {
    name: cookieName,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge,
    path: '/',
  };
}

// Read auth from server-component cookie store (use inside Server Components / Route Handlers)
export async function getAuthFromCookies(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

// Read merchant auth from server-component cookie store
export async function getMerchantAuthFromCookies(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(MERCHANT_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

// Read auth from NextRequest (use inside middleware)
export function getAuthFromRequest(req: NextRequest): TokenPayload | null {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function getMerchantAuthFromRequest(req: NextRequest): TokenPayload | null {
  const token = req.cookies.get(MERCHANT_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

// ── DB-backed helpers for Route Handlers ──────────────────────────────────────
function extractCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get('cookie') || '';
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
}

export async function getCustomerFromRequest(
  request: Request,
): Promise<Customer | null> {
  const token = extractCookie(request, COOKIE_NAME);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || !isCustomer(payload)) return null;
  return queryOne<Customer>(
    `SELECT id, phone_number, first_name, last_name, email, status, created_at
       FROM customers WHERE id = ?`,
    [payload.sub],
  );
}

export async function getMerchantFromRequest(
  request: Request,
): Promise<MerchantRow | null> {
  const token = extractCookie(request, MERCHANT_COOKIE_NAME);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || !isMerchant(payload)) return null;
  return queryOne<MerchantRow>(
    `SELECT id, slug, business_name, category, tagline, address, city,
            logo_svg, brand_color, plan_tier, is_demo
       FROM merchants WHERE id = ?`,
    [payload.sub],
  );
}

// ── Type guards ────────────────────────────────────────────────────────────────
export function isCustomer(p: TokenPayload): p is CustomerPayload {
  return p.type === 'customer';
}

export function isMerchant(p: TokenPayload): p is MerchantPayload {
  return p.type === 'merchant';
}
