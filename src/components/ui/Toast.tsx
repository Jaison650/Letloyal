'use client';
import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, X } from 'lucide-react';
import { clsx } from 'clsx';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

const icons = {
  success: <CheckCircle2 size={20} className="text-status-success shrink-0" />,
  error: <XCircle size={20} className="text-status-error shrink-0" />,
  info: <AlertCircle size={20} className="text-primary shrink-0" />,
};

export default function Toast({ message, type = 'success', duration = 4000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={clsx(
        'fixed bottom-6 right-6 z-50 bg-white rounded-2xl shadow-card-hover border border-brand-border px-5 py-4 flex items-start gap-3 max-w-sm transition-all duration-300',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      )}
      role="alert"
    >
      {icons[type]}
      <p className="text-sm font-medium text-text-dark flex-1">{message}</p>
      <button onClick={() => { setVisible(false); setTimeout(onClose, 300); }} aria-label="Dismiss" className="text-text-light hover:text-text-dark shrink-0">
        <X size={16} />
      </button>
    </div>
  );
}

// Toast manager hook
export function useToast() {
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: ToastType }>>([]);
  const counterRef = useRef(0);

  const showToast = (message: string, type: ToastType = 'success') => {
    const id = ++counterRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const ToastContainer = () => (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {toasts.map((t) => (
        <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  );

  return { showToast, ToastContainer };
}
