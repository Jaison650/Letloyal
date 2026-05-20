'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Camera, AlertCircle, Coffee } from 'lucide-react';
import Logo from '@/components/ui/Logo';

const DEMO_STORES = [
  { slug: 'brewhouse-cafe', name: 'BrewHouse Café', color: '#6B3F2A' },
  { slug: 'bella-beauty', name: 'Bella Beauty', color: '#7B2D8B' },
  { slug: 'the-fit-club', name: 'The Fit Club', color: '#1A6B2F' },
  { slug: 'metro-deli', name: 'Metro Deli', color: '#D4820A' },
  { slug: 'luxe-boutique', name: 'Luxe Boutique', color: '#C0392B' },
  { slug: 'casa-pizzeria', name: 'Casa Pizzeria', color: '#E65C00' },
];

export default function ScanPage() {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [cameraStarted, setCameraStarted] = useState(false);

  useEffect(() => {
    if (!scanning) return;
    let scanner: { clear: () => Promise<void> } | null = null;

    (async () => {
      try {
        // Dynamically import to avoid SSR issues
        const { Html5QrcodeScanner } = await import('html5-qrcode');
        scanner = new Html5QrcodeScanner(
          'qr-reader',
          { fps: 10, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true },
          false
        );
        (scanner as unknown as { render: (onSuccess: (text: string) => void, onError: () => void) => void }).render(
          (decodedText: string) => {
            scanner?.clear().catch(() => {});
            // Validate it's a LetLoyal URL
            const base = window.location.origin;
            if (decodedText.includes('/store/')) {
              window.location.href = decodedText;
            } else {
              setError('This QR code is not a LetLoyal store code. Try again.');
              setScanning(false);
            }
          },
          () => { /* ignore scan errors */ }
        );
        setCameraStarted(true);
      } catch (err) {
        setError('Could not start camera. Please allow camera access and try again.');
        setScanning(false);
      }
    })();

    return () => {
      scanner?.clear().catch(() => {});
    };
  }, [scanning]);

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center px-4 pb-10">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center pt-8">
          <Link href="/"><Logo variant="light" size={26} /></Link>
          <h1 className="font-jakarta font-bold text-2xl mt-5">Scan a QR Code</h1>
          <p className="text-text-medium mt-2">Point your camera at a LetLoyal merchant&apos;s QR code</p>
        </div>

        {/* Camera area */}
        {!scanning ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-brand-border p-8 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-primary-light rounded-2xl flex items-center justify-center">
              <Camera size={28} className="text-primary" />
            </div>
            <div>
              <p className="font-semibold">Ready to scan</p>
              <p className="text-sm text-text-medium mt-1">We&apos;ll request camera permission when you start</p>
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-status-error w-full">
                <AlertCircle size={14} /> {error}
              </div>
            )}
            <button
              onClick={() => { setError(''); setScanning(true); }}
              className="btn-primary w-full"
            >
              <Camera size={16} /> Start Camera
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden shadow-card-hover">
            {/* QR viewfinder */}
            <div className="relative">
              <div
                id="qr-reader"
                ref={scannerRef}
                className="w-full"
              />
              {/* Corner markers */}
              <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg pointer-events-none" />
              <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg pointer-events-none" />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg pointer-events-none" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg pointer-events-none" />
            </div>
            <div className="p-4 text-center">
              <button onClick={() => setScanning(false)} className="text-sm text-text-light hover:text-primary transition-colors">
                Cancel scanning
              </button>
            </div>
          </div>
        )}

        {/* Fallback: manual merchant list */}
        <div>
          <p className="text-xs text-text-light text-center mb-3 font-medium uppercase tracking-wide">Or go to a demo store directly</p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_STORES.map((store) => (
              <Link
                key={store.slug}
                href={`/store/${store.slug}`}
                className="flex items-center gap-2 bg-white rounded-xl border border-brand-border px-3 py-2.5 hover:border-primary hover:bg-primary-light transition-colors min-h-[44px]"
              >
                <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: store.color }}>
                  <Coffee size={12} className="text-white" />
                </div>
                <span className="text-xs font-semibold truncate">{store.name}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Link href="/dashboard" className="text-sm text-primary font-semibold hover:underline">
            ← Back to my cards
          </Link>
        </div>
      </div>
    </div>
  );
}
