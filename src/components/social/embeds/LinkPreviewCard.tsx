import React from 'react';
import { Globe, ExternalLink } from 'lucide-react';

interface LinkPreviewCardProps {
  message: string;
}

export const LinkPreviewCard: React.FC<LinkPreviewCardProps> = ({ message }) => {
  const urls = message?.match(/(https?:\/\/[^\s]+)/g);
  if (!urls || urls.length === 0) return null;
  const firstUrl = urls[0];
  let domain = 'external-link.com';
  try {
    domain = new URL(firstUrl).hostname.replace(/^www\./, '');
  } catch (e) {}

  return (
    <a
      href={firstUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="mt-2.5 mb-1 block group rounded-xl bg-[#0c0d12] border border-sky-500/30 hover:border-sky-400/80 p-3 transition-all shadow-md hover:shadow-[0_0_15px_rgba(56,189,248,0.25)]"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-sky-950/80 border border-sky-500/40 flex items-center justify-center text-sky-400 shrink-0 group-hover:scale-105 transition-transform">
            <Globe className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-mono text-sky-400 font-extrabold uppercase tracking-widest block truncate">
              {domain}
            </span>
            <p className="text-xs font-mono text-zinc-300 truncate group-hover:text-white transition-colors">
              {firstUrl}
            </p>
          </div>
        </div>
        <div className="px-3 py-1.5 bg-sky-500/10 border border-sky-500/30 group-hover:bg-sky-500 group-hover:text-black text-sky-400 text-[10px] font-mono font-bold uppercase rounded-lg flex items-center gap-1 shrink-0 transition-all">
          <span>Visit Link</span>
          <ExternalLink className="w-3 h-3" />
        </div>
      </div>
    </a>
  );
};
