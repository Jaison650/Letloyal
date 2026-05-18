import { redirect } from 'next/navigation';
import { getMerchantAuthFromCookies, isMerchant } from '@/lib/auth';
import { getMerchantBySlug } from '@/lib/merchants';
import DashboardShell from '@/components/merchant/DashboardShell';
import CustomerTable from '@/components/merchant/CustomerTable';

export default async function CustomersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const auth = await getMerchantAuthFromCookies();
  if (!auth || !isMerchant(auth) || auth.slug !== slug) redirect('/merchant/login');

  const merchant = await getMerchantBySlug(slug);
  if (!merchant) redirect('/merchant/login');

  return (
    <DashboardShell slug={slug} merchantName={merchant.business_name} planTier={merchant.plan_tier} logoSvg={merchant.logo_svg} brandColor={merchant.brand_color}>
      <div className="mb-8">
        <h1 className="font-sora font-bold text-2xl lg:text-3xl">Customers</h1>
        <p className="text-text-medium mt-1">All customers enrolled in your loyalty campaigns.</p>
      </div>
      <CustomerTable merchantSlug={slug} />
    </DashboardShell>
  );
}
