import { useRef, useState, useEffect, PointerEvent as ReactPointerEvent } from 'react';
import { X, ZoomIn, ZoomOut, Check } from 'lucide-react';

interface Props {
  imageSrc: string;
  /** Rendered crop viewport size in px (the visible circle). Output is exported at a higher, fixed resolution. */
  viewportSize?: number;
  /** Final exported square image size in px. */
  outputSize?: number;
  onCancel: () => void;
  onSave: (blob: Blob) => void;
}

// Lets the admin drag to reposition and use a slider to zoom in/out before an avatar photo
// is saved, instead of uploading the raw photo as-is with no control over framing.
export default function ImageCropModal({
  imageSrc,
  viewportSize = 260,
  outputSize = 500,
  onCancel,
  onSave,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const dragState = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1); // multiplier on top of the "cover" base scale
  const [pos, setPos] = useState({ x: 0, y: 0 }); // top-left of the image, in viewport px
  const [saving, setSaving] = useState(false);

  const baseScale = naturalSize ? Math.max(viewportSize / naturalSize.w, viewportSize / naturalSize.h) : 1;
  const scale = baseScale * zoom;
  const dispW = naturalSize ? naturalSize.w * scale : 0;
  const dispH = naturalSize ? naturalSize.h * scale : 0;

  const clamp = (x: number, y: number, w = dispW, h = dispH) => ({
    x: Math.min(0, Math.max(viewportSize - w, x)),
    y: Math.min(0, Math.max(viewportSize - h, y)),
  });

  // Center the image the first time we know its natural size.
  useEffect(() => {
    if (!naturalSize) return;
    const w = naturalSize.w * baseScale * zoom;
    const h = naturalSize.h * baseScale * zoom;
    setPos(clamp((viewportSize - w) / 2, (viewportSize - h) / 2, w, h));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [naturalSize]);

  const handleImgLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
  };

  const handleZoomChange = (nextZoom: number) => {
    if (!naturalSize) {
      setZoom(nextZoom);
      return;
    }
    const nextW = naturalSize.w * baseScale * nextZoom;
    const nextH = naturalSize.h * baseScale * nextZoom;
    // Keep the current viewport center fixed while zooming, instead of snapping back to top-left.
    const centerX = pos.x - viewportSize / 2;
    const centerY = pos.y - viewportSize / 2;
    const ratio = nextZoom / zoom;
    const nextX = viewportSize / 2 + centerX * ratio;
    const nextY = viewportSize / 2 + centerY * ratio;
    setZoom(nextZoom);
    setPos(clamp(nextX, nextY, nextW, nextH));
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragState.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    setPos(clamp(dragState.current.origX + dx, dragState.current.origY + dy));
  };

  const handlePointerUp = () => {
    dragState.current = null;
  };

  const handleSave = async () => {
    if (!naturalSize) return;
    setSaving(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = outputSize;
      canvas.height = outputSize;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('تعذر إنشاء الصورة');

      // Map the visible viewport rectangle back to source-image pixel coordinates.
      const sx = -pos.x / scale;
      const sy = -pos.y / scale;
      const sSize = viewportSize / scale;

      const img = imgRef.current!;
      ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, outputSize, outputSize);

      canvas.toBlob(
        (blob) => {
          setSaving(false);
          if (blob) onSave(blob);
        },
        'image/jpeg',
        0.92
      );
    } catch {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-slate-900 text-base">اقصّ الصورة الشخصية</h3>
          <button onClick={onCancel} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[11px] text-slate-400 font-bold mb-3">اسحب الصورة لتحريكها، وحرّك الشريط للتكبير أو التصغير، لحد ما تظبط الجزء اللي عايز يظهر.</p>

        {/* Crop viewport */}
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="relative mx-auto rounded-full overflow-hidden bg-slate-100 border border-slate-200 touch-none select-none cursor-grab active:cursor-grabbing"
          style={{ width: viewportSize, height: viewportSize }}
        >
          <img
            ref={imgRef}
            src={imageSrc}
            onLoad={handleImgLoad}
            alt="معاينة الصورة"
            draggable={false}
            className="absolute pointer-events-none max-w-none"
            style={{
              width: dispW || undefined,
              height: dispH || undefined,
              left: pos.x,
              top: pos.y,
            }}
          />
        </div>

        {/* Zoom slider */}
        <div className="flex items-center gap-3 mt-5">
          <ZoomOut className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
            className="flex-1 accent-[#c09d53]"
          />
          <ZoomIn className="w-4 h-4 text-slate-400 shrink-0" />
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !naturalSize}
            className="flex-1 py-3 rounded-xl bg-[#c09d53] hover:bg-[#a9863f] text-white font-black disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            {saving ? 'جاري الحفظ...' : 'حفظ الصورة'}
          </button>
        </div>
      </div>
    </div>
  );
}
