'use client';
import { useState, useEffect } from 'react';
import { ArrowRight, Clock, Users, Target, User, CheckCircle2 } from 'lucide-react';

interface Broadcast {
  id: string;
  title: string;
  message: string;
  audience: string;
  sent_count: number;
  created_at: string;
}

const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'All Customers', icon: <Users size={16} />, description: 'Everyone enrolled in your loyalty program' },
  { value: 'near_reward', label: 'Near Reward', icon: <Target size={16} />, description: 'Customers 60%+ of the way to their reward' },
  { value: 'inactive', label: 'Inactive (30+ days)', icon: <User size={16} />, description: 'Customers who haven\'t visited in 30+ days' },
];

export default function BroadcastComposer({ merchantSlug }: { merchantSlug: string }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('all');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState<{ count: number } | null>(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<Broadcast[]>([]);

  useEffect(() => {
    fetch(`/api/merchants/${merchantSlug}/broadcast`)
      .then(r => r.json())
      .then(d => setHistory(d.broadcasts || []))
      .catch(() => {});
  }, [merchantSlug]);

  async function handleSend() {
    if (!title.trim() || !message.trim()) { setError('Title and message are required.'); return; }
    setSending(true);
    setError('');
    setSuccess(null);
    try {
      const res = await fetch(`/api/merchants/${merchantSlug}/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), message: message.trim(), audience }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to send.'); return; }
      setSuccess({ count: data.sentCount });
      setTitle('');
      setMessage('');
      setHistory(prev => [{ id: data.broadcastId, title: title.trim(), message: message.trim(), audience, sent_count: data.sentCount, created_at: new Date().toISOString() }, ...prev]);
    } finally {
      setSending(false);
    }
  }

  const audienceLabels: Record<string, string> = { all: 'All', near_reward: 'Near Reward', inactive: 'Inactive' };

  return (
    <div className="space-y-6">
      {/* Composer */}
      <div className="card space-y-5">
        <h2 className="font-sora font-bold text-lg">New Campaign Message</h2>

        {success && (
          <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
            <CheckCircle2 size={18} className="text-status-success shrink-0" />
            <p className="text-sm font-semibold text-status-success">
              Message sent to {success.count} customer{success.count !== 1 ? 's' : ''}!
            </p>
          </div>
        )}
        {error && <p className="text-xs text-status-error font-medium">{error}</p>}

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-medium uppercase tracking-wide">Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Flash Sale Today Only! 🔥"
            maxLength={100}
            className="form-input w-full"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-medium uppercase tracking-wide">Message</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="e.g. Double points all day today. Visit us before 8pm!"
            rows={3}
            maxLength={300}
            className="form-input w-full resize-none"
          />
          <p className="text-xs text-text-light text-right">{message.length}/300</p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-text-medium uppercase tracking-wide">Audience</label>
          <div className="grid gap-2">
            {AUDIENCE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setAudience(opt.value)}
                className={`flex items-start gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                  audience === opt.value
                    ? 'border-primary bg-primary-light'
                    : 'border-brand-border hover:border-primary/40'
                }`}
              >
                <span className={`mt-0.5 ${audience === opt.value ? 'text-primary' : 'text-text-light'}`}>{opt.icon}</span>
                <div>
                  <p className={`text-sm font-semibold ${audience === opt.value ? 'text-primary' : 'text-text-dark'}`}>{opt.label}</p>
                  <p className="text-xs text-text-medium mt-0.5">{opt.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSend}
          disabled={sending || !title.trim() || !message.trim()}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white bg-primary hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
        >
          <ArrowRight size={16} /> {sending ? 'Sending…' : 'Send Campaign'}
        </button>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-text-light" />
            <h2 className="font-sora font-bold text-lg">Past Campaigns</h2>
          </div>
          <div className="space-y-3">
            {history.map(b => (
              <div key={b.id} className="bg-brand-bg rounded-xl px-4 py-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm">{b.title}</p>
                  <span className="text-xs font-semibold text-primary bg-primary-light px-2 py-0.5 rounded-full">
                    {audienceLabels[b.audience] || b.audience}
                  </span>
                </div>
                <p className="text-xs text-text-medium leading-relaxed">{b.message}</p>
                <p className="text-xs text-text-light">
                  Sent to {b.sent_count} customer{b.sent_count !== 1 ? 's' : ''} ·{' '}
                  {new Date(b.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
