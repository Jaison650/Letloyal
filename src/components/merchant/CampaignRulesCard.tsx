'use client';
import { useState } from 'react';
import { Target, ChevronDown, Users, Gift } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import OfferRules from '@/components/ui/OfferRules';

interface Campaign {
  id: string;
  name: string;
  campaign_type: string;
  participants_count: number;
  redemptions_count: number;
  reward_description: string;
  reward_threshold: number;
}

interface CampaignRulesCardProps {
  campaign: Campaign;
  merchantSlug: string;
  brandColor: string;
}

export default function CampaignRulesCard({ campaign, merchantSlug, brandColor }: CampaignRulesCardProps) {
  const [open, setOpen] = useState(false);
  const [rules, setRules] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!open && !loaded) {
      setLoading(true);
      try {
        const res = await fetch(`/api/merchants/${merchantSlug}/campaigns/${campaign.id}/rules`);
        const data = await res.json();
        if (Array.isArray(data?.rules?.items)) setRules(data.rules.items);
        setLoaded(true);
      } catch {/* silent */} finally {
        setLoading(false);
      }
    }
    setOpen(o => !o);
  }

  return (
    <div className="border border-brand-border rounded-xl overflow-hidden">
      {/* Header row — always visible */}
      <button
        onClick={toggle}
        className="w-full flex items-center gap-2 p-3 sm:p-4 bg-brand-bg hover:bg-white transition-colors text-left min-w-0"
      >
        <div className="flex-1 min-w-0">
          {/* Name + type badge on one line */}
          <div className="flex items-center gap-1.5 mb-1 min-w-0">
            <p className="font-semibold text-sm truncate flex-1 min-w-0">{campaign.name}</p>
            <span className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-primary-light text-primary">
              <Target size={8} /> {campaign.campaign_type === 'visit_based' ? 'Visits' : 'Spend'}
            </span>
            <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-status-success">
              Active
            </span>
          </div>
          {/* Stats row */}
          <div className="flex items-center gap-2 text-[11px] text-text-medium">
            <span className="flex items-center gap-0.5"><Users size={9} /> {campaign.participants_count}</span>
            <span className="text-text-light">·</span>
            <span className="flex items-center gap-0.5"><Gift size={9} /> {campaign.redemptions_count} redeemed</span>
          </div>
        </div>
        <ChevronDown
          size={15}
          className="text-text-light shrink-0 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {/* Collapsible rules */}
      {open && (
        <div className="px-4 pb-4 bg-white border-t border-brand-border">
          <div className="pt-3 space-y-2">
            {/* Reward line */}
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
              style={{ background: `${brandColor}10`, color: brandColor }}
            >
              <Gift size={14} />
              <span className="font-semibold">{campaign.reward_description}</span>
            </div>

            {/* Rules */}
            {loading && (
              <p className="text-xs text-text-light py-2 text-center">Loading rules…</p>
            )}
            {!loading && loaded && (
              <OfferRules
                rules={rules}
                mode="static"
                color={brandColor}
                title="Offer Terms"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
