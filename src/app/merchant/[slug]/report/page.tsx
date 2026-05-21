import { redirect } from 'next/navigation';
import { getMerchantAuthFromCookies, isMerchant } from '@/lib/auth';
import { getMerchantBySlug } from '@/lib/merchants';
import DashboardShell from '@/components/merchant/DashboardShell';
import RetentionReport from '@/components/merchant/report/RetentionReport';

export default async function ReportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const auth = await getMerchantAuthFromCookies();
  if (!auth || !isMerchant(auth) || auth.slug !== slug) {
    redirect('/merchant/login');
  }

  const merchant = await getMerchantBySlug(slug);
  if (!merchant) redirect('/merchant/login');

  return (
    <DashboardShell
      slug={slug}
      merchantName={merchant.business_name}
      planTier={merchant.plan_tier}
      logoSvg={merchant.logo_svg}
      brandColor={merchant.brand_color}
    >
      <RetentionReport slug={slug} merchantName={merchant.business_name} />
    </DashboardShell>
  );
}
