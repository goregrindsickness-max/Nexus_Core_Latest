import React from 'react';
import { RefreshCw } from 'lucide-react';
import { GENRE_CLUSTERS } from './authConstants';

export interface PromoterRegistrationSectionProps {
  promoterSectionAOpen: boolean;
  setPromoterSectionAOpen: (val: boolean) => void;
  promoterSectionBOpen: boolean;
  setPromoterSectionBOpen: (val: boolean) => void;
  promoterSectionCOpen: boolean;
  setPromoterSectionCOpen: (val: boolean) => void;
  promoterPipeline: string;
  setPromoterPipeline: React.Dispatch<React.SetStateAction<'subscription' | 'festival'>> | ((val: any) => void);
  promoterAgency: string;
  setPromoterAgency: (val: string) => void;
  promoterTitle: string;
  setPromoterTitle: (val: string) => void;
  promoterRegion: string;
  setPromoterRegion: (val: string) => void;
  promoterPhone: string;
  setPromoterPhone: (val: string) => void;
  promoterAdminEmail: string;
  setPromoterAdminEmail: (val: string) => void;
  promoterBookingEmail: string;
  setPromoterBookingEmail: (val: string) => void;
  promoterVenueClass: string;
  setPromoterVenueClass: (val: string) => void;
  promoterCapacity: string;
  setPromoterCapacity: (val: string) => void;
  promoterCurrency: string;
  setPromoterCurrency: (val: string) => void;
  promoterSocialOpen: boolean;
  setPromoterSocialOpen: (val: boolean) => void;
  promoterInstagram: string;
  setPromoterInstagram: (val: string) => void;
  promoterTwitter: string;
  setPromoterTwitter: (val: string) => void;
  promoterWebsite: string;
  setPromoterWebsite: (val: string) => void;
  isPromoterGenresExpanded: boolean;
  setIsPromoterGenresExpanded: (val: boolean) => void;
  promoterGenres: string[];
  setPromoterGenres: React.Dispatch<React.SetStateAction<string[]>>;
  promoterLegalFullName: string;
  setPromoterLegalFullName: (val: string) => void;
  setPromoterLegalFirstName: (val: string) => void;
  setPromoterLegalLastName: (val: string) => void;
  promoterLegalEntityType: string;
  setPromoterLegalEntityType: (val: string) => void;
  promoterTaxId: string;
  setPromoterTaxId: (val: string) => void;
  promoterStreetAddress: string;
  setPromoterStreetAddress: (val: string) => void;
  promoterCity: string;
  setPromoterCity: (val: string) => void;
  promoterState: string;
  setPromoterState: (val: string) => void;
  promoterCountry: string;
  setPromoterCountry: (val: string) => void;
  promoterTechRider: string;
  setPromoterTechRider: (val: string) => void;
  promoterSecurityMap?: string;
  setPromoterSecurityMap?: (val: string) => void;
  promoterDeferTechSpecs?: boolean;
  setPromoterDeferTechSpecs?: (val: boolean) => void;
  promoterStripeConnected: boolean;
  setPromoterStripeConnected: (val: boolean) => void;
  promoterPaypalConnected: boolean;
  setPromoterPaypalConnected: (val: boolean) => void;
  promoterSetupPaymentLater: boolean;
  setPromoterSetupPaymentLater: (val: boolean) => void;
  promoterLogo?: string;
  setPromoterLogo?: (val: string) => void;
  promoterCoverImage?: string;
  setPromoterCoverImage?: (val: string) => void;
}

export const PromoterRegistrationSection: React.FC<PromoterRegistrationSectionProps> = ({
  promoterSectionAOpen,
  setPromoterSectionAOpen,
  promoterSectionBOpen,
  setPromoterSectionBOpen,
  promoterSectionCOpen,
  setPromoterSectionCOpen,
  promoterPipeline,
  setPromoterPipeline,
  promoterAgency,
  setPromoterAgency,
  promoterTitle,
  setPromoterTitle,
  promoterRegion,
  setPromoterRegion,
  promoterPhone,
  setPromoterPhone,
  promoterAdminEmail,
  setPromoterAdminEmail,
  promoterBookingEmail,
  setPromoterBookingEmail,
  promoterVenueClass,
  setPromoterVenueClass,
  promoterCapacity,
  setPromoterCapacity,
  promoterCurrency,
  setPromoterCurrency,
  promoterSocialOpen,
  setPromoterSocialOpen,
  promoterInstagram,
  setPromoterInstagram,
  promoterTwitter,
  setPromoterTwitter,
  promoterWebsite,
  setPromoterWebsite,
  isPromoterGenresExpanded,
  setIsPromoterGenresExpanded,
  promoterGenres,
  setPromoterGenres,
  promoterLegalFullName,
  setPromoterLegalFullName,
  setPromoterLegalFirstName,
  setPromoterLegalLastName,
  promoterLegalEntityType,
  setPromoterLegalEntityType,
  promoterTaxId,
  setPromoterTaxId,
  promoterStreetAddress,
  setPromoterStreetAddress,
  promoterCity,
  setPromoterCity,
  promoterState,
  setPromoterState,
  promoterCountry,
  setPromoterCountry,
  promoterTechRider,
  setPromoterTechRider,
  promoterSecurityMap,
  setPromoterSecurityMap,
  promoterDeferTechSpecs,
  setPromoterDeferTechSpecs,
  promoterStripeConnected,
  setPromoterStripeConnected,
  promoterPaypalConnected,
  setPromoterPaypalConnected,
  promoterSetupPaymentLater,
  setPromoterSetupPaymentLater,
}) => {
  return (
    <div className="px-0 py-4 space-y-4 bg-[#0a0a0c] w-full">
      {/* STEP A MODULE */}
      <div className="w-full border-y border-yellow-500/20 overflow-hidden bg-zinc-950/20">
        <div 
          className="bg-yellow-500/5 p-3.5 flex justify-between items-center cursor-pointer hover:bg-yellow-500/10 transition-colors border-b border-yellow-500/20"
          onClick={() => setPromoterSectionAOpen(!promoterSectionAOpen)}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xs">🏟️</span>
            <h4 className="text-[10px] font-bold tracking-wider uppercase text-zinc-300 font-mono">
              Section A: Agency & Venue Showcase
            </h4>
          </div>
          <span className="text-zinc-500 text-[9px] font-mono">
            {promoterSectionAOpen ? 'COLLAPSE [-]' : 'EXPAND [+]'}
          </span>
        </div>
        {promoterSectionAOpen && (
          <div className="p-4 space-y-4 bg-black/30">
            {/* Apex Account Scope Toggle Grid */}
            <div className="space-y-1.5 text-left border-b border-zinc-900 pb-3">
              <label className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase mb-1 block">
                CHOOSE ACCOUNT ACCESS PIPELINE
              </label>
              <div className="grid grid-cols-2 gap-3 mb-1">
                <button
                  type="button"
                  onClick={() => setPromoterPipeline('subscription')}
                  className={`p-3 rounded-md font-mono text-xs uppercase tracking-wider transition-all border ${
                    promoterPipeline === 'subscription'
                      ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/40 font-bold shadow-[0_0_8px_rgba(234,179,8,0.2)]'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                  }`}
                >
                  🏢 VENUE / YEAR-ROUND AGENCY
                </button>
                <button
                  type="button"
                  onClick={() => setPromoterPipeline('festival')}
                  className={`p-3 rounded-md font-mono text-xs uppercase tracking-wider transition-all border ${
                    promoterPipeline === 'festival'
                      ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/40 font-bold shadow-[0_0_8px_rgba(234,179,8,0.2)]'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                  }`}
                >
                  🎪 ANNUAL FESTIVAL OPERATOR
                </button>
              </div>
              {/* Dynamic Onboarding Micro-Text Descriptors */}
              {promoterPipeline === 'subscription' ? (
                <p className="text-[11px] font-sans text-zinc-400 leading-normal mt-1 text-center">
                  Select for year-round venues, nightclubs, or active booking agencies. Unlocks full access to the operational command deck, calendar planning grids, and routing engines. Includes an unrestricted 30-day free trial before billing begins across our 3 operational subscription tiers.
                </p>
              ) : (
                <p className="text-[11px] font-sans text-zinc-400 leading-normal mt-1 text-center">
                  Select if you build and manage a standalone annual event or seasonal showcase series. Keeps your platform presence and historical ledgers permanently active. Choose between a low $49 flat initialization fee per event lifecycle, or a $1 per-ticket-sold structure settled directly on our platform at final door checkout.
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Booking Agency / Production Name</label>
                <input 
                  type="text" 
                  placeholder="ENTER BOOKING AGENCY OR VENUE PRODUCTION"
                  value={promoterAgency}
                  onChange={(e) => setPromoterAgency(e.target.value)}
                  autoComplete="new-password"
                  data-lpignore="true"
                  className="w-full bg-zinc-950 border border-yellow-500/30 focus:border-yellow-500 text-yellow-500 rounded p-2.5 text-xs font-mono outline-none placeholder-zinc-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">My Title / Role</label>
                  <input 
                    type="text" 
                    placeholder="e.g. TALENT BUYER, OWNER"
                    value={promoterTitle}
                    onChange={(e) => setPromoterTitle(e.target.value)}
                    autoComplete="new-password"
                    data-lpignore="true"
                    className="w-full bg-zinc-950 border border-yellow-500/30 focus:border-yellow-500 text-yellow-500 rounded p-2.5 text-xs font-mono outline-none placeholder-zinc-700"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Promoting Jurisdiction / Region</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Texas, South-West USA"
                    value={promoterRegion}
                    onChange={(e) => setPromoterRegion(e.target.value)}
                    autoComplete="new-password"
                    data-lpignore="true"
                    className="w-full bg-zinc-950 border border-yellow-500/30 focus:border-yellow-500 text-yellow-500 rounded p-2.5 text-xs font-mono outline-none placeholder-zinc-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Admin Phone Number</label>
                  <input 
                    type="text" 
                    placeholder="PHONE NUMBER"
                    value={promoterPhone}
                    onChange={(e) => setPromoterPhone(e.target.value)}
                    autoComplete="new-password"
                    data-lpignore="true"
                    className="w-full bg-zinc-950 border border-yellow-500/30 focus:border-yellow-500 text-yellow-500 rounded p-2.5 text-xs font-mono outline-none placeholder-zinc-700"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Administrative Email</label>
                  <input 
                    type="email" 
                    placeholder="ADMIN EMAIL"
                    value={promoterAdminEmail}
                    onChange={(e) => setPromoterAdminEmail(e.target.value)}
                    autoComplete="new-password"
                    data-lpignore="true"
                    className="w-full bg-zinc-950 border border-yellow-500/30 focus:border-yellow-500 text-yellow-500 rounded p-2.5 text-xs font-mono outline-none placeholder-zinc-700"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Booking Submissions Email</label>
                  <input 
                    type="email" 
                    placeholder="BOOKING EMAIL"
                    value={promoterBookingEmail}
                    onChange={(e) => setPromoterBookingEmail(e.target.value)}
                    autoComplete="new-password"
                    data-lpignore="true"
                    className="w-full bg-zinc-950 border border-yellow-500/30 focus:border-yellow-500 text-yellow-500 rounded p-2.5 text-xs font-mono outline-none placeholder-zinc-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Venue Classification</label>
                  <select 
                    value={promoterVenueClass}
                    onChange={(e) => setPromoterVenueClass(e.target.value)}
                    className="w-full bg-zinc-950 border border-yellow-500/30 focus:border-yellow-500 text-yellow-500 rounded p-2.5 text-xs font-mono outline-none"
                  >
                    <option value="Club">CLUB</option>
                    <option value="Theater">THEATER</option>
                    <option value="Arena">ARENA</option>
                    <option value="Festival">FESTIVAL</option>
                    <option value="Outdoor">OUTDOOR STAGE</option>
                  </select>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Venue Capacity</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 350, 1500"
                    value={promoterCapacity}
                    onChange={(e) => setPromoterCapacity(e.target.value)}
                    autoComplete="new-password"
                    data-lpignore="true"
                    className="w-full bg-zinc-950 border border-yellow-500/30 focus:border-yellow-500 text-yellow-500 rounded p-2.5 text-xs font-mono outline-none placeholder-zinc-700"
                  />
                </div>

                {/* Currency Standard Row */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Default Settlement Currency</label>
                  <select 
                    value={promoterCurrency}
                    onChange={(e) => setPromoterCurrency(e.target.value)}
                    className="w-full bg-zinc-950 border border-yellow-500/30 focus:border-yellow-500 text-yellow-500 rounded p-2.5 text-xs font-mono outline-none"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="CAD">CAD</option>
                    <option value="AUD">AUD</option>
                    <option value="JPY">JPY</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Instagram, Twitter, Website */}
            <div className="border border-yellow-500/20 rounded-lg p-3 bg-zinc-950/30">
              <div 
                className="flex items-center justify-between cursor-pointer group"
                onClick={() => setPromoterSocialOpen(!promoterSocialOpen)}
              >
                <span className="text-[8px] font-mono font-bold text-zinc-400 uppercase tracking-widest cursor-pointer">
                  🌐 Socials & Website links
                </span>
                <span className="text-zinc-500 text-[10px] group-hover:text-yellow-500 transition-colors">
                  {promoterSocialOpen ? '▼' : '▶'}
                </span>
              </div>
              {promoterSocialOpen && (
                <div className="mt-3 space-y-3 pt-3 border-t border-zinc-900">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Instagram Handle</label>
                    <input 
                      type="text" 
                      placeholder="@HANDLE"
                      value={promoterInstagram}
                      onChange={(e) => setPromoterInstagram(e.target.value)}
                      autoComplete="new-password"
                      data-lpignore="true"
                      className="w-full bg-zinc-950 border border-yellow-500/30 focus:border-yellow-500 text-yellow-500 rounded p-2.5 text-xs font-mono outline-none placeholder-zinc-700"
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Twitter / X Handle</label>
                    <input 
                      type="text" 
                      placeholder="@HANDLE"
                      value={promoterTwitter}
                      onChange={(e) => setPromoterTwitter(e.target.value)}
                      autoComplete="new-password"
                      data-lpignore="true"
                      className="w-full bg-zinc-950 border border-yellow-500/30 focus:border-yellow-500 text-yellow-500 rounded p-2.5 text-xs font-mono outline-none placeholder-zinc-700"
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Official Website URL</label>
                    <input 
                      type="url" 
                      placeholder="HTTPS://DOMAIN.COM"
                      value={promoterWebsite}
                      onChange={(e) => setPromoterWebsite(e.target.value)}
                      autoComplete="new-password"
                      data-lpignore="true"
                      className="w-full bg-zinc-950 border border-yellow-500/30 focus:border-yellow-500 text-yellow-500 rounded p-2.5 text-xs font-mono outline-none placeholder-zinc-700"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* GENRE TAXONOMY MATRIX */}
            <div className="space-y-1.5 pt-2 text-left">
              <div 
                className="flex items-center justify-between cursor-pointer group"
                onClick={() => setIsPromoterGenresExpanded(!isPromoterGenresExpanded)}
              >
                <div>
                  <label className="block text-[8px] font-mono tracking-wider text-yellow-500 font-bold uppercase cursor-pointer">Genre Taxonomy Matrix</label>
                  <div className="text-[7.5px] font-mono text-zinc-600 uppercase mt-0.5">
                    [ SELECT PRIMARY SONIC CLUSTERS FOR BOOKING ALGORITHMS ]
                  </div>
                </div>
                <span className="text-zinc-500 text-[10px] group-hover:text-yellow-500 transition-colors">
                  {isPromoterGenresExpanded ? '▼' : '▶'}
                </span>
              </div>
              
              {isPromoterGenresExpanded && (
                <div className="mt-3 space-y-3">
                  {GENRE_CLUSTERS.map((cluster, clusterIdx) => (
                    <div key={`promoter-cluster-${clusterIdx}-${cluster.name}`} className="bg-zinc-950/50 border border-zinc-800/80 rounded-lg p-3">
                      <div className="text-[8px] font-mono font-bold text-zinc-400 mb-2 uppercase tracking-widest">{cluster.name}</div>
                      <div className="flex flex-wrap gap-1.5">
                        {cluster.genres.map((genre, gIdx) => (
                          <button
                            key={`promoter-cluster-${clusterIdx}-genre-${gIdx}-${genre}`}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setPromoterGenres(prev => 
                                prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
                              );
                            }}
                            className={`text-[8.5px] font-mono px-2 py-1 rounded border transition-colors ${
                              promoterGenres.includes(genre)
                                ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/40 shadow-[0_0_8px_rgba(234,179,8,0.25)]'
                                : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-400'
                            }`}
                          >
                            {genre}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* STEP B MODULE (Collapsed by default) */}
      <div className="w-full border-y border-yellow-500/20 overflow-hidden bg-zinc-950/20">
        <div 
          className="bg-yellow-500/5 p-3.5 flex justify-between items-center cursor-pointer hover:bg-yellow-500/10 transition-colors border-b border-yellow-500/20"
          onClick={() => setPromoterSectionBOpen(!promoterSectionBOpen)}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xs">⚖️</span>
            <h4 className="text-[10px] font-bold tracking-wider uppercase text-zinc-300 font-mono">
              Section B: Tax Hygiene & Venue Specifications
            </h4>
          </div>
          <span className="text-zinc-500 text-[9px] font-mono">
            {promoterSectionBOpen ? 'COLLAPSE [-]' : 'EXPAND [+]'}
          </span>
        </div>
        {promoterSectionBOpen && (
          <div className="p-4 space-y-4 bg-black/30">
            <div className="space-y-1.5 text-left">
              <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Legal Full Name</label>
              <input 
                type="text" 
                placeholder="LEGAL FULL NAME"
                value={promoterLegalFullName}
                onChange={(e) => {
                  setPromoterLegalFullName(e.target.value);
                  const parts = e.target.value.trim().split(' ');
                  setPromoterLegalFirstName(parts[0] || '');
                  setPromoterLegalLastName(parts.slice(1).join(' ') || '');
                }}
                autoComplete="new-password"
                data-lpignore="true"
                className="w-full bg-zinc-950 border border-yellow-500/30 focus:border-yellow-500 text-yellow-500 rounded p-2.5 text-xs font-mono outline-none placeholder-zinc-700"
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Legal Entity Type</label>
              <select 
                value={promoterLegalEntityType}
                onChange={(e) => setPromoterLegalEntityType(e.target.value)}
                className="w-full bg-zinc-950 border border-yellow-500/30 focus:border-yellow-500 text-yellow-500 rounded p-2.5 text-xs font-mono outline-none"
              >
                <option value="SOLE_PROPRIETORSHIP">SOLE PROPRIETORSHIP</option>
                <option value="LLC">LLC</option>
                <option value="CORPORATION">CORPORATION</option>
                <option value="PARTNERSHIP">PARTNERSHIP</option>
              </select>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Taxpayer Identification (EIN / SSN)</label>
              <input 
                type="text" 
                placeholder="12-3456789 or SSN"
                value={promoterTaxId}
                onChange={(e) => setPromoterTaxId(e.target.value)}
                autoComplete="new-password"
                data-lpignore="true"
                className="w-full bg-zinc-950 border border-yellow-500/30 focus:border-yellow-500 text-yellow-500 rounded p-2.5 text-xs font-mono outline-none placeholder-zinc-700"
              />
            </div>

            {/* Core Venue Location Mapping Array Grid */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="space-y-1.5 text-left">
                <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Street Address</label>
                <input 
                  type="text" 
                  placeholder="Venue Operational Street Address"
                  value={promoterStreetAddress}
                  onChange={(e) => setPromoterStreetAddress(e.target.value)}
                  autoComplete="new-password"
                  data-lpignore="true"
                  className="w-full bg-zinc-950 border border-yellow-500/30 focus:border-yellow-500 text-yellow-500 rounded p-2.5 text-xs font-mono outline-none placeholder-zinc-700"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">City</label>
                <input 
                  type="text" 
                  placeholder="City"
                  value={promoterCity}
                  onChange={(e) => setPromoterCity(e.target.value)}
                  autoComplete="new-password"
                  data-lpignore="true"
                  className="w-full bg-zinc-950 border border-yellow-500/30 focus:border-yellow-500 text-yellow-500 rounded p-2.5 text-xs font-mono outline-none placeholder-zinc-700"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">State / Province</label>
                <input 
                  type="text" 
                  placeholder="e.g., TX"
                  value={promoterState}
                  onChange={(e) => setPromoterState(e.target.value)}
                  autoComplete="new-password"
                  data-lpignore="true"
                  className="w-full bg-zinc-950 border border-yellow-500/30 focus:border-yellow-500 text-yellow-500 rounded p-2.5 text-xs font-mono outline-none placeholder-zinc-700"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Country</label>
                <input 
                  type="text" 
                  placeholder="e.g., USA"
                  value={promoterCountry}
                  onChange={(e) => setPromoterCountry(e.target.value)}
                  autoComplete="new-password"
                  data-lpignore="true"
                  className="w-full bg-zinc-950 border border-yellow-500/30 focus:border-yellow-500 text-yellow-500 rounded p-2.5 text-xs font-mono outline-none placeholder-zinc-700"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left mt-2">
              <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Tech Rider Document Link / URL</label>
              <input 
                type="text" 
                placeholder="HTTPS://DRIVE.GOOGLE.COM/FILE/... or N/A"
                value={promoterTechRider}
                onChange={(e) => setPromoterTechRider(e.target.value)}
                autoComplete="new-password"
                data-lpignore="true"
                className="w-full bg-zinc-950 border border-yellow-500/30 focus:border-yellow-500 text-yellow-500 rounded p-2.5 text-xs font-mono outline-none placeholder-zinc-700"
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Security Map Document Link / URL</label>
              <input 
                type="text" 
                placeholder="HTTPS://DRIVE.GOOGLE.COM/FILE/... or N/A"
                value={promoterSecurityMap}
                onChange={(e) => setPromoterSecurityMap(e.target.value)}
                autoComplete="new-password"
                data-lpignore="true"
                className="w-full bg-zinc-950 border border-yellow-500/30 focus:border-yellow-500 text-yellow-500 rounded p-2.5 text-xs font-mono outline-none placeholder-zinc-700"
              />
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="w-full p-3 rounded border bg-zinc-950 border-zinc-800 text-zinc-500 flex items-center justify-center gap-2 cursor-pointer hover:border-zinc-700 transition-colors">
                <input 
                  type="checkbox" 
                  checked={promoterDeferTechSpecs}
                  onChange={(e) => setPromoterDeferTechSpecs(e.target.checked)}
                  className="w-3 h-3 accent-yellow-500 rounded border-zinc-700 cursor-pointer"
                />
                <span className="text-[10px] font-mono font-bold text-zinc-400">DEFER DETAILED TECHNICAL SPECIFICATIONS</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* STEP C MODULE (Collapsed by default) */}
      <div className="w-full border-y border-yellow-500/20 overflow-hidden bg-zinc-950/20">
        <div 
          className="bg-yellow-500/5 p-3.5 flex justify-between items-center cursor-pointer hover:bg-yellow-500/10 transition-colors border-b border-yellow-500/20"
          onClick={() => setPromoterSectionCOpen(!promoterSectionCOpen)}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xs">💳</span>
            <h4 className="text-[10px] font-bold tracking-wider uppercase text-zinc-300 font-mono">
              Section C: Financial Routing & Settlement
            </h4>
          </div>
          <span className="text-zinc-500 text-[9px] font-mono">
            {promoterSectionCOpen ? 'COLLAPSE [-]' : 'EXPAND [+]'}
          </span>
        </div>
        {promoterSectionCOpen && (
          <div className="p-4 space-y-4 bg-black/30">
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setPromoterStripeConnected(true)}
                className={`w-full p-3 rounded border text-[10px] font-mono font-bold flex items-center justify-center gap-2 transition-colors ${
                  promoterStripeConnected 
                    ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500' 
                    : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                }`}
              >
                <RefreshCw className="w-3 h-3 animate-spin-slow" />
                {promoterStripeConnected ? '[ STRIPE MERCHANT CONNECTED ]' : 'AUTHORIZE STRIPE'}
              </button>
              
              <button
                type="button"
                onClick={() => setPromoterPaypalConnected(true)}
                className={`w-full p-3 rounded border text-[10px] font-mono font-bold flex items-center justify-center gap-2 transition-colors ${
                  promoterPaypalConnected 
                    ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500' 
                    : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                }`}
              >
                <RefreshCw className="w-3 h-3 animate-spin-slow" />
                {promoterPaypalConnected ? '[ PAYPAL MERCHANT CONNECTED ]' : 'AUTHORIZE PAYPAL'}
              </button>
              
              <label className="w-full p-3 rounded border bg-zinc-950 border-zinc-800 text-zinc-500 flex items-center justify-center gap-2 cursor-pointer hover:border-zinc-700 transition-colors">
                <input 
                  type="checkbox" 
                  checked={promoterSetupPaymentLater}
                  onChange={(e) => setPromoterSetupPaymentLater(e.target.checked)}
                  className="w-3 h-3 accent-yellow-500 rounded border-zinc-700 cursor-pointer"
                />
                <span className="text-[10px] font-mono font-bold">SETUP PAYMENT ARCHITECTURE LATER</span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
