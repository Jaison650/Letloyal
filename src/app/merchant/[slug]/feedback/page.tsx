import { redirect } from 'next/navigation';
import { getMerchantAuthFromCookies, isMerchant } from '@/lib/auth';
import { getMerchantBySlug } from '@/lib/merchants';
import { query } from '@/lib/db';
import DashboardShell from '@/components/merchant/DashboardShell';
import { Star } from 'lucide-react';

interface FeedbackRow {
  id: string;
  message: string;
  rating: number | null;
  is_anonymous: number | boolean;
  created_at: string;
  customer_name: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={14}
          className={s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
        />
      ))}
    </div>
  );
}

export default async function FeedbackPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const auth = await getMerchantAuthFromCookies();
  if (!auth || !isMerchant(auth) || auth.slug !== slug) redirect('/merchant/login');

  const merchant = await getMerchantBySlug(slug);
  if (!merchant) redirect('/merchant/login');

  const feedbackRows = await query<FeedbackRow>(
    `SELECT f.id, f.message, f.rating, f.is_anonymous, f.created_at,
            CASE
              WHEN f.customer_id IS NULL OR f.is_anonymous = 1 THEN 'Anonymous'
              ELSE COALESCE(c.first_name, 'Customer')
            END AS customer_name
     FROM feedback f
     LEFT JOIN customers c ON c.id = f.customer_id
     WHERE f.merchant_id = ?
     ORDER BY f.created_at DESC`,
    [merchant.id],
  );

  return (
    <DashboardShell
      slug={slug}
      merchantName={merchant.business_name}
      planTier={merchant.plan_tier}
      logoSvg={merchant.logo_svg}
      brandColor={merchant.brand_color}
    >
      <div className="mb-8">
        <h1 className="font-sora font-bold text-2xl lg:text-3xl">Customer Feedback</h1>
        <p className="text-text-medium mt-1">
          See what customers are saying about {merchant.business_name}.
        </p>
      </div>

      {feedbackRows.length === 0 ? (
        <div className="bg-white rounded-[20px] border border-brand-border shadow-card p-12 text-center space-y-3">
          <p className="text-5xl">💬</p>
          <p className="font-sora font-bold text-xl">No feedback yet</p>
          <p className="text-text-medium text-sm">
            Feedback from customers will appear here after they scan your QR code.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {feedbackRows.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-[20px] border border-brand-border shadow-card p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold text-sm shrink-0">
                    {item.customer_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-text-dark">{item.customer_name}</p>
                    <p className="text-xs text-text-light">
                      {new Date(item.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                {item.rating !== null && (
                  <StarRating rating={item.rating} />
                )}
              </div>
              <p className="text-text-dark text-sm leading-relaxed">{item.message}</p>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
