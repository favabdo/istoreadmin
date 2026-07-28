import { useEffect, useState } from 'react';
import { QrCode } from 'lucide-react';
import { generateQrDataUrl } from '../lib/generateQr';

interface Props {
  value: string;
  size?: number;
  className?: string;
}

export default function QrCodePreview({ value, size = 120, className = '' }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const text = value.trim();
    if (!text) {
      setDataUrl(null);
      return;
    }
    generateQrDataUrl(text).then((url) => {
      if (!cancelled) setDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [value]);

  if (!value.trim()) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`rounded-xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-slate-300 ${className}`}
      >
        <QrCode className="w-6 h-6" />
      </div>
    );
  }

  if (!dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`rounded-xl border border-slate-200 bg-slate-50 animate-pulse ${className}`}
      />
    );
  }

  return (
    <img
      src={dataUrl}
      alt="QR الرقم التسلسلي"
      style={{ width: size, height: size }}
      className={`rounded-xl border border-slate-200 bg-white p-1 ${className}`}
    />
  );
}
