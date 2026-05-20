'use client';
import { useEffect, useState, useRef } from 'react';
import { Bell, X, ExternalLink } from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  action_url: string | null;
  is_read: boolean;
  created_at: string;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  async function fetchNotifications() {
    try {
      const res = await fetch('/api/customer/notifications');
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch { /* ignore */ }
  }

  async function handleOpen() {
    setOpen(!open);
    if (!open && unreadCount > 0) {
      setLoading(true);
      try {
        await fetch('/api/customer/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      } finally {
        setLoading(false);
      }
    }
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  const iconMap: Record<string, string> = {
    near_reward: '🎯',
    reward_unlocked: '🎉',
    merchant_broadcast: '📢',
    milestone: '⭐',
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        className="relative w-9 h-9 rounded-full bg-brand-bg border border-brand-border flex items-center justify-center hover:bg-white transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} className="text-text-medium" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent rounded-full text-white text-[9px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-2xl border border-brand-border z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border">
            <h3 className="font-jakarta font-bold text-sm">Notifications</h3>
            <button onClick={() => setOpen(false)} className="p-1 rounded-full hover:bg-brand-bg transition-colors">
              <X size={14} className="text-text-light" />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-3xl mb-2">🔔</p>
                <p className="text-sm text-text-light">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-brand-border last:border-0 transition-colors ${!n.is_read ? 'bg-primary-light/40' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg shrink-0 mt-0.5">{iconMap[n.type] || '💬'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-dark">{n.title}</p>
                      <p className="text-xs text-text-medium mt-0.5 leading-relaxed">{n.body}</p>
                      <p className="text-[10px] text-text-light mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                    {n.action_url && (
                      <a href={n.action_url} className="shrink-0 mt-0.5">
                        <ExternalLink size={13} className="text-primary hover:text-primary/70" />
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
