import { Satellite } from 'lucide-react';

export default function SpaceLoader({ language = 'en', kind = 'connection', compact = false, overlay = false }) {
  const isArabic = language === 'ar';
  const message = isArabic
    ? 'جاري استقبال البيانات من أرشيف ناسا الفضائي...'
    : kind === 'model'
      ? 'RECEIVING 3D TELEMETRY FROM NASA ARCHIVE...'
      : 'ESTABLISHING DEEP SPACE NETWORK LINK...';

  return (
    <div className={`space-loader ${compact ? 'space-loader-compact' : ''} ${overlay ? 'space-loader-overlay' : ''}`} role="status" aria-live="polite">
      <div className="radar-orbit" aria-hidden="true">
        <span className="radar-orbit-ring" />
        <span className="radar-orbit-arc" />
        <span className="radar-satellite satellite-a" />
        <span className="radar-satellite satellite-b" />
        <span className="radar-core"><Satellite size={compact ? 21 : 29} strokeWidth={1.35} /></span>
      </div>
      <div className="loader-readout">
        <p dir={isArabic ? 'rtl' : 'ltr'}>{message}</p>
        <span>{isArabic ? 'رابط الاتصالات العميقة // 01' : 'DEEP SPACE NETWORK // 01'}</span>
      </div>
    </div>
  );
}
