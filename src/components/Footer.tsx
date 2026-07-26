import whatsappLogo from '../whatsapp-logo.png';
import gmailLogo from '../gmail-logo.png';

// Rendered at the very end of the page <body> flow on every screen (Login,
// Dashboard, Profile...). Layouts that use this component wrap their content
// in a `min-h-screen flex flex-col` container with the main content area set
// to `flex-1`, so this footer is always pinned to the true bottom of the
// page — not just glued under whatever content happens to be above it.
export default function Footer() {
  return (
    <div className="w-full py-8 flex flex-col items-center gap-3 text-center" dir="rtl">
      <p className="text-slate-500 text-xs sm:text-sm font-semibold">
        Website by <span className="font-black text-slate-700">Abdullah Elsawy</span>
      </p>
      <div className="flex items-center gap-6">
        <a
          href="https://wa.me/201061163091"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1.5 group"
        >
          <span className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300 p-1.5 border border-slate-100">
            <img src={whatsappLogo} alt="WhatsApp" className="w-full h-full object-contain" />
          </span>
        </a>
        <a
          href="mailto:abdallah666mo@gmail.com"
          className="flex flex-col items-center gap-1.5 group"
        >
          <span className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300 p-1.5 border border-slate-100">
            <img src={gmailLogo} alt="Gmail" className="w-full h-full object-contain" />
          </span>
        </a>
      </div>
    </div>
  );
}
