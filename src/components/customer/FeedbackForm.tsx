'use client';
import { useState } from 'react';
import { X, Star } from 'lucide-react';

interface FeedbackFormProps {
  merchantId: string;
  merchantName: string;
  onClose: () => void;
}

export default function FeedbackForm({ merchantId, merchantName, onClose }: FeedbackFormProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) { setError('Please write a message.'); return; }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant_id: merchantId,
          message: message.trim(),
          rating: rating ?? undefined,
          is_anonymous: isAnonymous,
        }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed to submit');
      setDone(true);
      setTimeout(onClose, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  }

  const displayRating = hoverRating ?? rating;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Sheet / Modal */}
      <div className="bg-white w-full sm:max-w-md rounded-t-[24px] sm:rounded-[24px] p-6 space-y-5 animate-slide-up shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-jakarta font-bold text-lg">Leave Feedback</h2>
          <button onClick={onClose} className="p-1.5 text-text-light hover:text-text-dark rounded-lg">
            <X size={20} />
          </button>
        </div>

        {done ? (
          <div className="text-center py-6 space-y-2">
            <p className="text-4xl">🙏</p>
            <p className="font-jakarta font-bold text-xl text-primary">Thank you!</p>
            <p className="text-text-medium text-sm">Your feedback has been sent to {merchantName}.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <p className="text-text-medium text-sm">
              Share your experience at <span className="font-semibold text-text-dark">{merchantName}</span>
            </p>

            {/* Star rating */}
            <div>
              <p className="text-sm font-semibold text-text-dark mb-2">Rating (optional)</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star === rating ? null : star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="p-0.5 transition-transform hover:scale-110"
                    aria-label={`Rate ${star} stars`}
                  >
                    <Star
                      size={28}
                      className={displayRating !== null && star <= displayRating
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-semibold text-text-dark mb-1">
                Message <span className="text-status-error">*</span>
              </label>
              <textarea
                className="form-input min-h-[100px] resize-none"
                placeholder="How was your experience?"
                maxLength={500}
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
              />
              <p className="text-xs text-text-light text-right mt-1">{message.length}/500</p>
            </div>

            {/* Anonymous checkbox */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={e => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 rounded border-brand-border accent-primary"
              />
              <span className="text-sm text-text-medium">Send anonymously</span>
            </label>

            {error && (
              <p className="text-sm text-status-error font-medium">{error}</p>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl border border-brand-border text-sm font-semibold text-text-medium hover:bg-brand-bg transition-colors"
              >
                Skip
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 btn-primary justify-center disabled:opacity-60"
              >
                {submitting ? 'Sending…' : 'Send Feedback'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
