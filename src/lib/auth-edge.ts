// Edge-safe JWT helpers — no db imports, no Node.js built-ins.
// Used by middleware only. API routes use the full auth.ts instead.

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

function base64urlDecode(str: string): string {
  // Convert base64url to base64
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
  return atob(padded);
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(base64urlDecode(parts[1]));
    if (!payload?.sub || !payload?.type) return null;
    // Check expiry
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

export function isCustomer(p: TokenPayload): p is CustomerPayload {
  return p.type === 'customer';
}

export function isMerchant(p: TokenPayload): p is MerchantPayload {
  return p.type === 'merchant';
}
