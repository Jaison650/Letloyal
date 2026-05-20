import { redirect } from 'next/navigation';
import { getMerchantAuthFromCookies, isMerchant } from '@/lib/auth';
import { getMerchantBySlug } from '@/lib/merchants';
import DashboardShell from '@/components/merchant/DashboardShell';
import ProfileEditor from '@/components/merchant/ProfileEditor';
import { Settings } from 'lucide-react';

export default async function SettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const auth = await getMerchantAuthFromCookies();
  if (!auth || !isMerchant(auth) || auth.slug !== slug) redirect('/merchant/login');

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
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${merchant.brand_color}18` }}>
            <Settings size={20} style={{ color: merchant.brand_color }} />
          </div>
          <div>
            <h1 className="font-sora font-bold text-2xl text-text-dark">Store Profile</h1>
            <p className="text-sm text-text-medium">Manage your public store page, contact details and opening hours</p>
          </div>
        </div>
      </div>

      <ProfileEditor merchant={merchant} />
    </DashboardShell>
  );
}
