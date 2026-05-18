import { randomInt } from 'crypto';
import { OTP_EXPIRY_SECONDS } from './constants';

export function generateOTP(): string {
  // cryptographically random 6-digit code (000000–999999)
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

export function getOTPExpiry(): Date {
  const expiry = new Date();
  expiry.setSeconds(expiry.getSeconds() + OTP_EXPIRY_SECONDS);
  return expiry;
}

export function isOTPExpired(expiresAt: Date | string): boolean {
  return new Date() > new Date(expiresAt);
}

export function secondsUntilExpiry(expiresAt: Date | string): number {
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
}
