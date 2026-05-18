'use client';
import { Plus } from 'lucide-react';

export default function NewCampaignButton() {
  return (
    <button
      onClick={() => alert('Campaign creation is available in the full version. In demo, 6 merchants are pre-configured.')}
      className="btn-primary shrink-0"
    >
      <Plus size={16} /> New Campaign
    </button>
  );
}
