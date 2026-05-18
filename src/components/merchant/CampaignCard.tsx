'use client';
import { Target, Users, RotateCcw } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';

interface CampaignCardProps {
  id: string;
  name: string;
  campaign_type: 'visit_based' | 'spend_based';
  status: 'active' | 'paused' | 'ended';
  reward_description: string;
  reward_threshold: number;
  participants_count: number;
  redemptions_count: number;
}

export default function CampaignCard({
  name,
  campaign_type,
  status,
  reward_description,
  reward_threshold,
  participants_count,
  redemptions_count,
}: CampaignCardProps) {
  const redemptionRate =
    participants_count > 0
      ? Math.round((redemptions_count / participants_count) * 100)
      : 0;

  return (
    <div className="bg-white rounded-2xl border border-brand-border shadow-card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <p className="font-sora font-bold text-base text-text-dark truncate">{name}</p>
          <p className="text-xs text-text-light mt-0.5">{reward_description}</p>
        </div>
        <div className="flex items-center gap-1.5 ml-3 shrink-0">
          <Badge variant={campaign_type === 'visit_based' ? 'visit' : 'spend'}>
            <Target size={10} /> {campaign_type === 'visit_based' ? 'Visits' : 'Spend'}
          </Badge>
          <Badge variant={status === 'active' ? 'active' : status === 'paused' ? 'paused' : 'ended'}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center mt-4">
        <div>
          <p className="font-bold text-sm text-text-dark">{participants_count}</p>
          <p className="text-xs text-text-light flex items-center justify-center gap-1"><Users size={10} /> Members</p>
        </div>
        <div>
          <p className="font-bold text-sm text-text-dark">{redemptions_count}</p>
          <p className="text-xs text-text-light flex items-center justify-center gap-1"><RotateCcw size={10} /> Redeemed</p>
        </div>
        <div>
          <p className="font-bold text-sm text-text-dark">{redemptionRate}%</p>
          <p className="text-xs text-text-light">Rate</p>
        </div>
      </div>

      <div className="mt-4">
        <ProgressBar value={Math.min(100, redemptionRate)} height="sm" />
        <p className="text-xs text-text-light mt-1">Threshold: {reward_threshold}</p>
      </div>
    </div>
  );
}
