'use client';
import { useState } from 'react';
import { Save, Globe, Phone, MapPin, Clock, Image, CheckCircle2, ExternalLink } from 'lucide-react';
import type { Merchant, WorkingHours, DayHours } from '@/lib/merchants';

const DAYS: { key: keyof WorkingHours; label: string }[] = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
];

const defaultHours: WorkingHours = {
  mon: { open: '09:00', close: '18:00' },
  tue: { open: '09:00', close: '18:00' },
  wed: { open: '09:00', close: '18:00' },
  thu: { open: '09:00', close: '18:00' },
  fri: { open: '09:00', close: '20:00' },
  sat: { open: '10:00', close: '17:00' },
  sun: null,
};

interface ProfileEditorProps {
  merchant: Merchant;
}

export default function ProfileEditor({ merchant }: ProfileEditorProps) {
  const [form, setForm] = useState({
    tagline:       merchant.tagline       ?? '',
    address:       merchant.address       ?? '',
    city:          merchant.city          ?? '',
    contact_phone: merchant.contact_phone ?? '',
    website:       merchant.website       ?? '',
    map_url:       merchant.map_url       ?? '',
    banner_url:    merchant.banner_url    ?? '',
    logo_url:      merchant.logo_url      ?? '',
  });

  const [hours, setHours] = useState<WorkingHours>(
    merchant.working_hours ?? defaultHours,
  );

  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState('');

  function setField(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    setSaved(false);
  }

  function setDayHours(day: keyof WorkingHours, field: keyof DayHours, value: string) {
    setHours(h => ({
      ...h,
      [day]: h[day] ? { ...h[day]!, [field]: value } : { open: '09:00', close: '18:00', [field]: value },
    }));
    setSaved(false);
  }

  function toggleDay(day: keyof WorkingHours) {
    setHours(h => ({
      ...h,
      [day]: h[day] ? null : { open: '09:00', close: '18:00' },
    }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/merchants/${merchant.slug}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, working_hours: hours }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setSaved(true);
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">

      {/* ── Brand images ── */}
      <section className="card space-y-5">
        <h2 className="font-sora font-bold text-lg flex items-center gap-2">
          <Image size={18} className="text-primary" /> Brand Images
        </h2>

        {/* Banner preview */}
        {form.banner_url && (
          <div className="w-full h-32 rounded-xl overflow-hidden border border-brand-border">
            <img src={form.banner_url} alt="Banner" className="w-full h-full object-cover" />
          </div>
        )}
        <div>
          <label className="form-label">Banner Image URL</label>
          <input
            type="url"
            placeholder="https://example.com/banner.jpg  (1200×400 recommended)"
            value={form.banner_url}
            onChange={e => setField('banner_url', e.target.value)}
            className="form-input"
          />
          <p className="text-xs text-text-light mt-1">Shown at the top of your customer store page. Landscape image works best.</p>
        </div>

        {/* Logo preview */}
        <div className="flex items-start gap-4">
          {form.logo_url ? (
            <img src={form.logo_url} alt="Logo" className="w-16 h-16 rounded-2xl object-cover border border-brand-border shrink-0" />
          ) : (
            <div
              className="w-16 h-16 rounded-2xl shrink-0 flex items-center justify-center overflow-hidden"
              style={{ background: `${merchant.brand_color}18` }}
              dangerouslySetInnerHTML={{ __html: merchant.logo_svg }}
            />
          )}
          <div className="flex-1">
            <label className="form-label">Logo Image URL</label>
            <input
              type="url"
              placeholder="https://example.com/logo.png  (square, min 200×200)"
              value={form.logo_url}
              onChange={e => setField('logo_url', e.target.value)}
              className="form-input"
            />
            <p className="text-xs text-text-light mt-1">Leave blank to use your current icon logo.</p>
          </div>
        </div>
      </section>

      {/* ── Business details ── */}
      <section className="card space-y-4">
        <h2 className="font-sora font-bold text-lg flex items-center gap-2">
          <MapPin size={18} className="text-primary" /> Business Details
        </h2>

        <div>
          <label className="form-label">Tagline</label>
          <input
            type="text"
            placeholder="Your best coffee in the city"
            value={form.tagline}
            onChange={e => setField('tagline', e.target.value)}
            className="form-input"
            maxLength={120}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">City</label>
            <input
              type="text"
              placeholder="Dublin"
              value={form.city}
              onChange={e => setField('city', e.target.value)}
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">Contact Phone</label>
            <div className="relative">
              <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light" />
              <input
                type="tel"
                placeholder="+353 1 234 5678"
                value={form.contact_phone}
                onChange={e => setField('contact_phone', e.target.value)}
                className="form-input pl-9"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="form-label">Full Address</label>
          <input
            type="text"
            placeholder="12 Main Street, Dublin 2, D02 AB12"
            value={form.address}
            onChange={e => setField('address', e.target.value)}
            className="form-input"
          />
        </div>

        <div>
          <label className="form-label">Website</label>
          <div className="relative">
            <Globe size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light" />
            <input
              type="url"
              placeholder="https://yourshop.com"
              value={form.website}
              onChange={e => setField('website', e.target.value)}
              className="form-input pl-9"
            />
          </div>
        </div>

        <div>
          <label className="form-label">Google Maps Link</label>
          <div className="relative">
            <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light" />
            <input
              type="url"
              placeholder="https://maps.google.com/?q=..."
              value={form.map_url}
              onChange={e => setField('map_url', e.target.value)}
              className="form-input pl-9"
            />
          </div>
          <p className="text-xs text-text-light mt-1">
            Paste the link from Google Maps &ldquo;Share&rdquo; button. Customers can tap to open directions.
          </p>
        </div>
      </section>

      {/* ── Working hours ── */}
      <section className="card space-y-4">
        <h2 className="font-sora font-bold text-lg flex items-center gap-2">
          <Clock size={18} className="text-primary" /> Opening Hours
        </h2>

        <div className="space-y-2">
          {DAYS.map(({ key, label }) => {
            const dayData = hours[key];
            const isOpen  = dayData !== null;
            return (
              <div key={key} className="flex items-center gap-3">
                {/* Day toggle */}
                <button
                  onClick={() => toggleDay(key)}
                  className={`w-24 text-xs font-semibold py-1.5 rounded-lg border transition-colors shrink-0 ${
                    isOpen
                      ? 'border-primary bg-primary-light text-primary'
                      : 'border-brand-border bg-brand-bg text-text-light'
                  }`}
                >
                  {label.slice(0, 3)}
                </button>

                {isOpen ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="time"
                      value={dayData!.open}
                      onChange={e => setDayHours(key, 'open', e.target.value)}
                      className="form-input py-1.5 text-sm flex-1"
                    />
                    <span className="text-text-light text-xs">–</span>
                    <input
                      type="time"
                      value={dayData!.close}
                      onChange={e => setDayHours(key, 'close', e.target.value)}
                      className="form-input py-1.5 text-sm flex-1"
                    />
                  </div>
                ) : (
                  <span className="text-xs text-text-light italic flex-1">Closed</span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Save ── */}
      <div className="flex items-center gap-3 pb-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-3 rounded-full font-bold text-white text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
          style={{ background: merchant.brand_color }}
        >
          {saving ? (
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : saved ? (
            <CheckCircle2 size={16} />
          ) : (
            <Save size={16} />
          )}
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
        </button>

        <a
          href={`/store/${merchant.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm text-primary font-semibold hover:underline"
        >
          <ExternalLink size={14} /> Preview customer page
        </a>

        {error && <p className="text-sm text-status-error">{error}</p>}
      </div>
    </div>
  );
}
