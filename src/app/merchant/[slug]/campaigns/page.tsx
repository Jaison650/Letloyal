import { redirect } from 'next/navigation';
import { getMerchantAuthFromCookies, isMerchant } from '@/lib/auth';
import { getMerchantBySlug, getAllCampaigns } from '@/lib/merchants';
import DashboardShell from '@/components/merchant/DashboardShell';
import CampaignsList from '@/components/merchant/CampaignsList';
import NewCampaignButton from '@/components/merchant/NewCampaignButton';

export default async function CampaignsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const auth = await getMerchantAuthFromCookies();
  if (!auth || !isMerchant(auth) || auth.slug !== slug) redirect('/merchant/login');

  const merchant = await getMerchantBySlug(slug);
  if (!merchant) redirect('/merchant/login');

  const campaigns = await getAllCampaigns(merchant.id);

  return (
    <DashboardShell
      slug={slug}
      merchantName={merchant.business_name}
      planTier={merchant.plan_tier}
      logoSvg={merchant.logo_svg}
      brandColor={merchant.brand_color}
    >
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-jakarta font-bold text-2xl lg:text-3xl">Campaigns</h1>
          <p className="text-text-medium mt-1">
            {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''} · {campaigns.filter(c => c.status === 'active').length} active
          </p>
        </div>
        <NewCampaignButton />
      </div>

      <CampaignsList initialCampaigns={campaigns} />
    </DashboardShell>
  );
}
