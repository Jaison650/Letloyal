'use client';
import { useState } from 'react';
import { Target, PauseCircle, PlayCircle, Copy, Pencil, Plus } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import { useToast } from '@/components/ui/Toast';
import type { Campaign } from '@/lib/merchants';

const TABS = [
  { label: 'All',    value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Paused', value: 'paused' },
  { label: 'Ended',  value: 'ended' },
] as const;

export default function CampaignsList({ initialCampaigns }: { initialCampaigns: Campaign[] }) {
  const [tab, setTab] = useState<'all' | 'active' | 'paused' | 'ended'>('all');
  const { showToast, ToastContainer } = useToast();

  const filtered = tab === 'all'
    ? initialCampaigns
    : initialCampaigns.filter((c) => c.status === tab);

  function handleAction(action: 'edit' | 'pause' | 'resume' | 'duplicate') {
    const messages: Record<string, string> = {
      edit:      'Campaign editing is available in the full version.',
      pause:     'Campaign pausing is available in the full version.',
      resume:    'Campaign resuming is available in the full version.',
      duplicate: 'Campaign duplication is available in the full version.',
    };
    showToast(messages[action], 'info');
  }

  return (
    <>
      <ToastContainer />

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-6">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`shrink-0 px-5 py-2 rounded-full text-sm font-semibold transition-colors min-h-[40px] ${
              tab === t.value
                ? 'bg-primary text-white'
                : 'bg-white border border-brand-border text-text-medium hover:bg-brand-bg'
            }`}
          >
            {t.label}
            {t.value !== 'all' && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                tab === t.value ? 'bg-white/20 text-white' : 'bg-brand-bg text-text-light'
              }`}>
                {initialCampaigns.filter((c) => c.status === t.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Campaign cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="w-16 h-16 bg-primary-light rounded-2xl flex items-center justify-center">
            <Target size={28} className="text-primary opacity-50" />
          </div>
          <div>
            <p className="font-jakarta font-bold text-lg text-text-dark">
              {tab === 'all' ? 'No campaigns yet' : `No ${tab} campaigns`}
            </p>
            <p className="text-text-medium text-sm mt-1 max-w-xs">
              {tab === 'all'
                ? 'Create your first loyalty campaign to start rewarding customers.'
                : `You have no ${tab} campaigns right now.`}
            </p>
          </div>
          {tab === 'all' && (
            <button
              onClick={() => showToast('Campaign creation is available in the full version.', 'info')}
              className="btn-primary mt-2"
            >
              <Plus size={16} /> Create First Campaign
            </button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {filtered.map((c) => {
            const redemptionRate = c.participants_count > 0
              ? Math.round((c.redemptions_count / c.participants_count) * 100)
              : 0;
            const isPaused = c.status === 'paused';

            return (
              <div key={c.id} className="card space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-jakarta font-bold text-lg truncate">{c.name}</p>
                    <p className="text-sm text-text-medium mt-0.5 line-clamp-2">{c.reward_description}</p>
                  </div>
                  <div className="flex flex-col gap-1.5 items-end shrink-0">
                    <Badge variant={c.status as 'active' | 'paused' | 'ended'}>
                      {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                    </Badge>
                    <Badge variant={c.campaign_type === 'visit_based' ? 'visit' : 'spend'}>
                      <Target size={10} /> {c.campaign_type === 'visit_based' ? 'Visit' : 'Spend'}
                    </Badge>
                  </div>
                </div>

                {/* Reward info */}
                <div className="bg-brand-bg rounded-xl px-4 py-3 text-sm text-text-medium">
                  <span className="font-semibold text-text-dark">{c.reward_threshold}</span>{' '}
                  {c.campaign_type === 'visit_based' ? 'visits' : 'points'} →{' '}
                  <span className="text-primary font-semibold">{c.reward_description}</span>
                  {c.campaign_type === 'spend_based' && c.points_per_euro && (
                    <span className="text-xs text-text-light ml-2">({c.points_per_euro} pts/€)</span>
                  )}
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 bg-brand-bg rounded-xl p-4">
                  <div className="text-center">
                    <p className="text-xl font-jakarta font-bold text-primary">{c.participants_count}</p>
                    <p className="text-xs text-text-light mt-0.5">Participants</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-jakarta font-bold text-accent">{c.redemptions_count}</p>
                    <p className="text-xs text-text-light mt-0.5">Redeemed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-jakarta font-bold text-text-dark">{redemptionRate}%</p>
                    <p className="text-xs text-text-light mt-0.5">Rate</p>
                  </div>
                </div>

                {/* Progress + dates */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-text-medium font-medium">
                    <span>Threshold: {c.reward_threshold} {c.campaign_type === 'visit_based' ? 'visits' : 'pts'}</span>
                    <span>Started {new Date(c.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}</span>
                  </div>
                  <ProgressBar value={Math.min(100, redemptionRate)} height="sm" />
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1 border-t border-brand-border">
                  <button
                    onClick={() => handleAction('edit')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-text-medium hover:text-primary hover:bg-primary-light rounded-lg transition-colors min-h-[36px]"
                  >
                    <Pencil size={13} /> Edit
                  </button>
                  <button
                    onClick={() => handleAction(isPaused ? 'resume' : 'pause')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-colors min-h-[36px] ${
                      isPaused
                        ? 'text-text-medium hover:text-status-success hover:bg-green-50'
                        : 'text-text-medium hover:text-status-warning hover:bg-orange-50'
                    }`}
                  >
                    {isPaused
                      ? <><PlayCircle size={13} /> Resume</>
                      : <><PauseCircle size={13} /> Pause</>}
                  </button>
                  <button
                    onClick={() => handleAction('duplicate')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-text-medium hover:text-primary hover:bg-primary-light rounded-lg transition-colors min-h-[36px]"
                  >
                    <Copy size={13} /> Duplicate
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
