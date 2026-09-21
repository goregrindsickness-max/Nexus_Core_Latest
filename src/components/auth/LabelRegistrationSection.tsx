import React, { useState } from 'react';
import { RefreshCw, CreditCard } from 'lucide-react';
import { GENRE_CLUSTERS } from './authConstants';
import { getSupabase } from '../../supabase';

export interface LabelRegistrationSectionProps {
  labelSectionAOpen: boolean;
  setLabelSectionAOpen: (val: boolean) => void;
  labelSectionBOpen: boolean;
  setLabelSectionBOpen: (val: boolean) => void;
  labelSectionCOpen: boolean;
  setLabelSectionCOpen: (val: boolean) => void;
  labelCompanyName: string;
  setLabelCompanyName: (val: string) => void;
  labelVerificationId: string;
  setLabelVerificationId: (val: string) => void;
  labelUrlSlug: string;
  setLabelUrlSlug: (val: string) => void;
  labelArOperationsEmail: string;
  setLabelArOperationsEmail: (val: string) => void;
  labelLegalClearancePhone: string;
  setLabelLegalClearancePhone: (val: string) => void;
  labelBookingEmail: string;
  setLabelBookingEmail: (val: string) => void;
  labelHeadquarters: string;
  setLabelHeadquarters: (val: string) => void;
  labelFoundedYear: string;
  setLabelFoundedYear: (val: string) => void;
  labelRosterCount: string;
  setLabelRosterCount: (val: string) => void;
  labelPlanTier: string;
  setLabelPlanTier: (val: string) => void;
  labelIsAnnualBilling: boolean;
  setLabelIsAnnualBilling: (val: boolean) => void;
  selectedRosterArtists: string[];
  setSelectedRosterArtists: React.Dispatch<React.SetStateAction<string[]>>;
  rosterSearchQuery: string;
  setRosterSearchQuery: (val: string) => void;
  isSearchingRoster: boolean;
  rosterSearchResults: Array<{ id: string; name: string }>;
  labelSubLabels: string;
  setLabelSubLabels: (val: string) => void;
  labelMasterDistroModel: string;
  setLabelMasterDistroModel: (val: string) => void;
  labelDigitalAccreditationScheme: string;
  setLabelDigitalAccreditationScheme: (val: string) => void;
  distChannelDsp: boolean;
  setDistChannelDsp: (val: boolean) => void;
  distChannelDirect: boolean;
  setDistChannelDirect: (val: boolean) => void;
  distChannelPhysical: boolean;
  setDistChannelPhysical: (val: boolean) => void;
  labelDefaultContractSplit: number;
  setLabelDefaultContractSplit: (val: number) => void;
  isLabelGenresExpanded: boolean;
  setIsLabelGenresExpanded: (val: boolean) => void;
  labelGenres: string[];
  setLabelGenres: React.Dispatch<React.SetStateAction<string[]>>;
  labelLegalEntityType: string;
  setLabelLegalEntityType: (val: string) => void;
  labelTaxRegistrationNumber: string;
  setLabelTaxRegistrationNumber: (val: string) => void;
  labelShippingPostalCode: string;
  setLabelShippingPostalCode: (val: string) => void;
  labelShippingCountry: string;
  setLabelShippingCountry: (val: string) => void;
  labelStripeConnected: boolean;
  setLabelStripeConnected: (val: boolean) => void;
  labelPaypalConnected: boolean;
  setLabelPaypalConnected: (val: boolean) => void;
  labelSetupPaymentLater: boolean;
  setLabelSetupPaymentLater: (val: boolean) => void;
  labelAvatar?: string;
  setLabelAvatar?: (val: string) => void;
  labelBanner?: string;
  setLabelBanner?: (val: string) => void;
  triggerNotification?: (msg: string) => void;
}

export const LabelRegistrationSection: React.FC<LabelRegistrationSectionProps> = ({
  labelSectionAOpen,
  setLabelSectionAOpen,
  labelSectionBOpen,
  setLabelSectionBOpen,
  labelSectionCOpen,
  setLabelSectionCOpen,
  labelCompanyName,
  setLabelCompanyName,
  labelVerificationId,
  setLabelVerificationId,
  labelUrlSlug,
  setLabelUrlSlug,
  labelArOperationsEmail,
  setLabelArOperationsEmail,
  labelLegalClearancePhone,
  setLabelLegalClearancePhone,
  labelBookingEmail,
  setLabelBookingEmail,
  labelHeadquarters,
  setLabelHeadquarters,
  labelFoundedYear,
  setLabelFoundedYear,
  labelRosterCount,
  setLabelRosterCount,
  labelPlanTier,
  setLabelPlanTier,
  labelIsAnnualBilling,
  setLabelIsAnnualBilling,
  selectedRosterArtists,
  setSelectedRosterArtists,
  rosterSearchQuery,
  setRosterSearchQuery,
  isSearchingRoster,
  rosterSearchResults,
  labelSubLabels,
  setLabelSubLabels,
  labelMasterDistroModel,
  setLabelMasterDistroModel,
  labelDigitalAccreditationScheme,
  setLabelDigitalAccreditationScheme,
  distChannelDsp,
  setDistChannelDsp,
  distChannelDirect,
  setDistChannelDirect,
  distChannelPhysical,
  setDistChannelPhysical,
  labelDefaultContractSplit,
  setLabelDefaultContractSplit,
  isLabelGenresExpanded,
  setIsLabelGenresExpanded,
  labelGenres,
  setLabelGenres,
  labelLegalEntityType,
  setLabelLegalEntityType,
  labelTaxRegistrationNumber,
  setLabelTaxRegistrationNumber,
  labelShippingPostalCode,
  setLabelShippingPostalCode,
  labelShippingCountry,
  setLabelShippingCountry,
  labelStripeConnected,
  setLabelStripeConnected,
  labelPaypalConnected,
  setLabelPaypalConnected,
  labelSetupPaymentLater,
  setLabelSetupPaymentLater,
  triggerNotification,
}) => {
  return (
    <div className="px-0 py-4 space-y-4 bg-[#0a0a0c] w-full">
      {/* STEP A MODULE */}
      <div className="w-full border-y border-orange-900/30 overflow-hidden bg-zinc-950/20">
        <div 
          className="bg-orange-950/15 p-3.5 flex justify-between items-center cursor-pointer hover:bg-orange-950/25 transition-colors border-b border-orange-900/30"
          onClick={() => setLabelSectionAOpen(!labelSectionAOpen)}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xs">📀</span>
            <h4 className="text-[10px] font-bold tracking-wider uppercase text-zinc-300">
              Section A: Label Corporate & Distribution Branding
            </h4>
          </div>
          <span className="text-zinc-500 text-[9px] font-mono">
            {labelSectionAOpen ? 'COLLAPSE [-]' : 'EXPAND [+]'}
          </span>
        </div>
        {labelSectionAOpen && (
          <div className="p-4 space-y-4 bg-black/30">
            <div className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Corporate Label / Company Name</label>
                <input 
                  type="text" 
                  autoComplete="new-password"
                  data-lpignore="true"
                  placeholder="ENTER REGISTERED LABEL COMPANY NAME"
                  value={labelCompanyName}
                  onChange={(e) => setLabelCompanyName(e.target.value)}
                  className="w-full bg-zinc-950 border border-orange-500/30 focus:border-orange-500 text-orange-500 rounded p-2.5 text-xs font-mono outline-none placeholder-zinc-700 uppercase"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Verification ID / Code Prefix (ISRC/UPC)</label>
                  <input 
                    type="text" 
                    autoComplete="new-password"
                    data-lpignore="true"
                    placeholder="e.g. Coma 001 (Comatose Music)"
                    value={labelVerificationId}
                    onChange={(e) => setLabelVerificationId(e.target.value)}
                    className="w-full bg-zinc-950 border border-orange-500/30 focus:border-orange-500 text-orange-500 rounded p-2.5 text-xs font-mono outline-none placeholder-zinc-700 uppercase"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Label Portal URL Slug</label>
                  <input 
                    type="text" 
                    autoComplete="new-password"
                    data-lpignore="true"
                    placeholder="e.g. nuclear-blast"
                    value={labelUrlSlug}
                    onChange={(e) => setLabelUrlSlug(e.target.value)}
                    className="w-full bg-zinc-950 border border-orange-500/30 focus:border-orange-500 text-orange-500 rounded p-2.5 text-xs font-mono outline-none placeholder-zinc-700 uppercase"
                  />
                </div>
              </div>

              {/* OPERATIONAL ROUTING ADDITIONS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">A&R Operations Email</label>
                  <input 
                    type="email" 
                    autoComplete="new-password"
                    data-lpignore="true"
                    placeholder="A&R / Roster Communications Email"
                    value={labelArOperationsEmail}
                    onChange={(e) => setLabelArOperationsEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-orange-500/30 focus:border-orange-500 text-orange-500 rounded p-2.5 text-xs font-mono outline-none placeholder-zinc-700 uppercase"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Legal / Clearance Phone</label>
                  <input 
                    type="text" 
                    autoComplete="new-password"
                    data-lpignore="true"
                    placeholder="Licensing & Clearance Contact"
                    value={labelLegalClearancePhone}
                    onChange={(e) => setLabelLegalClearancePhone(e.target.value)}
                    className="w-full bg-zinc-950 border border-orange-500/30 focus:border-orange-500 text-orange-500 rounded p-2.5 text-xs font-mono outline-none placeholder-zinc-700 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Primary Booking Email (Does not inherit primary email)</label>
                  <input 
                    type="email" 
                    autoComplete="new-password"
                    data-lpignore="true"
                    placeholder="e.g. booking@comatosemusic.com"
                    value={labelBookingEmail}
                    onChange={(e) => setLabelBookingEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-orange-500/30 focus:border-orange-500 text-orange-500 rounded p-2.5 text-xs font-mono outline-none placeholder-zinc-700 uppercase"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Headquarters / Location</label>
                  <input 
                    type="text" 
                    autoComplete="new-password"
                    data-lpignore="true"
                    placeholder="e.g. Los Angeles, CA"
                    value={labelHeadquarters}
                    onChange={(e) => setLabelHeadquarters(e.target.value)}
                    className="w-full bg-zinc-950 border border-orange-500/30 focus:border-orange-500 text-orange-500 rounded p-2.5 text-xs font-mono outline-none placeholder-zinc-700 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Founded Year</label>
                  <input 
                    type="text" 
                    autoComplete="new-password"
                    data-lpignore="true"
                    placeholder="e.g. 2026"
                    value={labelFoundedYear}
                    onChange={(e) => setLabelFoundedYear(e.target.value)}
                    className="w-full bg-zinc-950 border border-orange-500/30 focus:border-orange-500 text-orange-500 rounded p-2.5 text-xs font-mono outline-none placeholder-zinc-700 uppercase"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Label Roster Count</label>
                  <input 
                    type="text" 
                    autoComplete="new-password"
                    data-lpignore="true"
                    placeholder="e.g. 15 Artists"
                    value={labelRosterCount}
                    onChange={(e) => setLabelRosterCount(e.target.value)}
                    className="w-full bg-zinc-950 border border-orange-500/30 focus:border-orange-500 text-orange-500 rounded p-2.5 text-xs font-mono outline-none placeholder-zinc-700 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Distribution Plan Tier</label>
                  <select 
                    value={labelPlanTier}
                    onChange={(e) => setLabelPlanTier(e.target.value)}
                    className="w-full bg-zinc-950 border border-orange-500/30 focus:border-orange-500 text-orange-500 rounded p-2.5 text-xs font-mono outline-none"
                  >
                    <option 
                      value="independent_imprint" 
                      className="bg-zinc-950 text-orange-500"
                      disabled={selectedRosterArtists.length > 10}
                    >
                      {`INDEPENDENT LABEL — $29.99/MO [CAPACITY: 10 BANDS | ACTIVE: ${selectedRosterArtists.length}/10${10 - selectedRosterArtists.length < 0 ? ' - EXCEEDED' : ` | REMAINING: ${10 - selectedRosterArtists.length}`}]`}
                    </option>
                    <option 
                      value="underground_syndicate" 
                      className="bg-zinc-950 text-orange-500"
                      disabled={selectedRosterArtists.length > 25}
                    >
                      {`UNDERGROUND SYNDICATE — $59.99/MO [CAPACITY: 25 BANDS | ACTIVE: ${selectedRosterArtists.length}/25${25 - selectedRosterArtists.length < 0 ? ' - EXCEEDED' : ` | REMAINING: ${25 - selectedRosterArtists.length}`}]`}
                    </option>
                    <option 
                      value="sovereign_record_group" 
                      className="bg-zinc-950 text-orange-500"
                    >
                      {`ELITE RECORD LABEL — $89.99/MO [CAPACITY: UNLIMITED | ACTIVE: ${selectedRosterArtists.length} BANDS]`}
                    </option>
                  </select>
                  
                  {/* CAPACITY BADGE DESCRIPTORS */}
                  {labelPlanTier === 'independent_imprint' && (
                    <div className="mt-1.5 text-[9px] font-mono px-2.5 py-1 text-center rounded bg-orange-500/10 text-orange-500 border border-orange-500/40 uppercase tracking-wider animate-fadeIn">
                      Includes up to 10 Active Managed Bands
                    </div>
                  )}
                  {labelPlanTier === 'underground_syndicate' && (
                    <div className="mt-1.5 text-[9px] font-mono px-2.5 py-1 text-center rounded bg-orange-500/10 text-orange-500 border border-orange-500/40 uppercase tracking-wider animate-fadeIn">
                      Includes up to 25 Active Managed Bands
                    </div>
                  )}
                  {labelPlanTier === 'sovereign_record_group' && (
                    <div className="mt-1.5 text-[9px] font-mono px-2.5 py-1 text-center rounded bg-orange-500/10 text-orange-500 border border-orange-500/40 uppercase tracking-wider animate-fadeIn">
                      Includes Unlimited Managed Bands & Rosters
                    </div>
                  )}

                  <p className="text-[7.5px] font-mono text-orange-400/80 leading-normal mt-1 uppercase">
                    ⚡ Record labels secure a 30-day free trial period before any billing transaction is authorized.
                  </p>
                </div>

                <div className="space-y-1.5 text-left flex flex-col justify-end pb-1">
                  <label className="w-full p-2.5 rounded border bg-zinc-950 border-orange-500/30 text-zinc-500 flex items-center justify-center gap-2 cursor-pointer hover:border-orange-500 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={labelIsAnnualBilling}
                      onChange={(e) => setLabelIsAnnualBilling(e.target.checked)}
                      className="w-3 h-3 accent-orange-500 rounded border-zinc-700 cursor-pointer"
                    />
                    <span className="text-[10px] font-mono font-bold text-zinc-400">ANNUAL BILLING (SAVE 20%)</span>
                  </label>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* STEP B MODULE (Collapsed by default) */}
      <div className="w-full border-y border-orange-900/30 overflow-hidden bg-zinc-950/20">
        <div 
          className="bg-orange-950/15 p-3.5 flex justify-between items-center cursor-pointer hover:bg-orange-950/25 transition-colors border-b border-orange-900/30"
          onClick={() => setLabelSectionBOpen(!labelSectionBOpen)}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xs">💿</span>
            <h4 className="text-[10px] font-bold tracking-wider uppercase text-zinc-300">
              Section B: Sonic Genres, Roster & Contract Splitting
            </h4>
          </div>
          <span className="text-zinc-500 text-[9px] font-mono">
            {labelSectionBOpen ? 'COLLAPSE [-]' : 'EXPAND [+]'}
          </span>
        </div>
        {labelSectionBOpen && (
          <div className="p-4 space-y-4 bg-black/30">
            <div className="space-y-1.5 text-left">
              <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Artist Roster Linked Accounts (Nexus Core Search)</label>
              
              {/* DISMISSIBLE ORANGE TOKEN BADGES */}
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedRosterArtists.length === 0 ? (
                  <span className="text-[9px] font-mono text-zinc-600 uppercase">No roster acts linked. Search to add below.</span>
                ) : (
                  selectedRosterArtists.map((artist, idx) => (
                    <span 
                      key={`${artist}-${idx}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono rounded bg-orange-500/10 text-orange-500 border border-orange-500/40 uppercase tracking-wide"
                    >
                      💿 {artist}
                      <button
                        type="button"
                        onClick={() => setSelectedRosterArtists(prev => prev.filter(a => a !== artist))}
                        className="text-orange-500/60 hover:text-orange-400 font-bold ml-1 cursor-pointer focus:outline-none"
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* SEARCH INPUT */}
              <div className="relative">
                <input 
                  type="text"
                  autoComplete="new-password"
                  data-lpignore="true"
                  placeholder="SEARCH ACTIVE CORE DATABASE..."
                  value={rosterSearchQuery}
                  onChange={(e) => setRosterSearchQuery(e.target.value)}
                  className="w-full bg-zinc-950 border border-orange-500/30 focus:border-orange-500 text-orange-500 rounded p-2.5 text-xs font-mono outline-none"
                />
                {rosterSearchQuery && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-zinc-950 border border-orange-500/40 rounded-md shadow-xl max-h-48 overflow-y-auto">
                    {isSearchingRoster ? (
                      <div className="p-3 text-xs font-mono text-orange-400/60 uppercase">Searching active core database...</div>
                    ) : rosterSearchResults.length === 0 ? (
                      <div className="p-3 text-xs font-mono text-orange-400/60 uppercase flex justify-between items-center">
                        <span>No exact core profile match found</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (rosterSearchQuery.trim() && !selectedRosterArtists.includes(rosterSearchQuery.trim())) {
                              setSelectedRosterArtists(prev => [...prev, rosterSearchQuery.trim()]);
                              setRosterSearchQuery('');
                            }
                          }}
                          className="text-[9px] font-bold bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 px-2 py-1 rounded border border-orange-500/40 focus:outline-none"
                        >
                          CREATE & LINK "{rosterSearchQuery.toUpperCase()}"
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-orange-500/10">
                        {rosterSearchResults.map((result, idx) => (
                          <button
                            key={`${result.id}-${idx}`}
                            type="button"
                            onClick={() => {
                              if (!selectedRosterArtists.includes(result.name)) {
                                setSelectedRosterArtists(prev => [...prev, result.name]);
                              }
                              setRosterSearchQuery('');
                            }}
                            className="w-full text-left p-2.5 text-xs font-mono text-orange-500 hover:bg-orange-500/15 transition-all flex items-center justify-between focus:outline-none"
                          >
                            <span>{result.name.toUpperCase()}</span>
                            <span className="text-[8px] text-zinc-500">LINK PROFILE</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Sub-Labels / Imprints (Comma-Separated)</label>
              <input 
                type="text" 
                autoComplete="new-password"
                data-lpignore="true"
                placeholder="e.g. Sub-Label Black, Noise Records"
                value={labelSubLabels}
                onChange={(e) => setLabelSubLabels(e.target.value)}
                className="w-full bg-zinc-950 border border-orange-500/30 focus:border-orange-500 text-orange-500 rounded p-2.5 text-xs font-mono outline-none placeholder-zinc-700 uppercase"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Master Distribution Model</label>
                <select 
                  value={labelMasterDistroModel}
                  onChange={(e) => setLabelMasterDistroModel(e.target.value)}
                  className="w-full bg-zinc-950 border border-orange-500/30 focus:border-orange-500 text-orange-500 rounded p-2.5 text-xs font-mono outline-none"
                >
                  <option value="IN_HOUSE_FULFILLMENT" className="bg-zinc-950 text-orange-500">IN-HOUSE EXCLUSIVE FULFILLMENT</option>
                  <option value="DIRECT_TO_DSP" className="bg-zinc-950 text-orange-500">DIRECT DSP PIPELINE</option>
                  <option value="PHYSICAL_DISTRO" className="bg-zinc-950 text-orange-500">PHYSICAL MERCH & VINYL DISTRO</option>
                </select>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Digital Accreditation Scheme</label>
                <select 
                  value={labelDigitalAccreditationScheme}
                  onChange={(e) => setLabelDigitalAccreditationScheme(e.target.value)}
                  className="w-full bg-zinc-950 border border-orange-500/30 focus:border-orange-500 text-orange-500 rounded p-2.5 text-xs font-mono outline-none"
                >
                  <option value="LABEL_PROVIDES_INDEPENDENT_CODES" className="bg-zinc-950 text-orange-500">LABEL DELIVERS INDEPENDENT CODES</option>
                  <option value="NEXUS_GENERATES_UPC_ISRC" className="bg-zinc-950 text-orange-500">NEXUS GENERATES UPC/ISRC ON RELEASE</option>
                  <option value="THIRD_PARTY_CARRIER" className="bg-zinc-950 text-orange-500">THIRD PARTY EMBEDDED CARRIER</option>
                </select>
              </div>
            </div>

            {/* DISTRIBUTION TARGET CHANNELS MATRIX */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase mb-1">TARGET DISTRIBUTION CHANNELS</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setDistChannelDsp(!distChannelDsp)}
                  className={`p-3 rounded border text-left font-mono text-[9px] uppercase transition-all flex items-center justify-between ${
                    distChannelDsp 
                      ? 'bg-orange-500/10 text-orange-500 border border-orange-500/40' 
                      : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                  }`}
                >
                  <span>Major DSP Streaming (Spotify/Apple)</span>
                  <span>{distChannelDsp ? '[X]' : '[ ]'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDistChannelDirect(!distChannelDirect)}
                  className={`p-3 rounded border text-left font-mono text-[9px] uppercase transition-all flex items-center justify-between ${
                    distChannelDirect 
                      ? 'bg-orange-500/10 text-orange-500 border border-orange-500/40' 
                      : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                  }`}
                >
                  <span>Direct Digital Nodes (Bandcamp)</span>
                  <span>{distChannelDirect ? '[X]' : '[ ]'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDistChannelPhysical(!distChannelPhysical)}
                  className={`p-3 rounded border text-left font-mono text-[9px] uppercase transition-all flex items-center justify-between ${
                    distChannelPhysical 
                      ? 'bg-orange-500/10 text-orange-500 border border-orange-500/40' 
                      : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                  }`}
                >
                  <span>Physical Logistics (Vinyl/CD)</span>
                  <span>{distChannelPhysical ? '[X]' : '[ ]'}</span>
                </button>
              </div>
            </div>

            <div className="space-y-2 text-left bg-zinc-950/40 p-3 rounded-lg border border-zinc-900">
              <div className="flex justify-between items-center">
                <label className="text-[8px] font-mono tracking-wider text-zinc-400 uppercase">DEFAULT CONTRACT REVENUE SPLIT</label>
                <span className="text-xs font-mono font-bold text-orange-400">{labelDefaultContractSplit}% TO ARTIST</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={labelDefaultContractSplit}
                onChange={(e) => setLabelDefaultContractSplit(parseInt(e.target.value))}
                className="w-full accent-orange-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[7px] font-mono text-zinc-600">
                <span>100% TO LABEL</span>
                <span>50/50 SPLIT</span>
                <span>100% TO ARTIST</span>
              </div>
            </div>

            {/* GENRE TAXONOMY MATRIX */}
            <div className="space-y-1.5 pt-2 text-left">
              <div 
                className="flex items-center justify-between cursor-pointer group"
                onClick={() => setIsLabelGenresExpanded(!isLabelGenresExpanded)}
              >
                <div>
                  <label className="block text-[8px] font-mono tracking-wider text-orange-400 font-bold uppercase cursor-pointer">Genre Taxonomy Matrix</label>
                  <div className="text-[7.5px] font-mono text-zinc-600 uppercase mt-0.5">
                    [ CHOOSE PRIMARY GENRE GROUPS FOR DISTRIBUTION PIPELINES ]
                  </div>
                </div>
                <span className="text-zinc-500 text-[10px] group-hover:text-orange-400 transition-colors">
                  {isLabelGenresExpanded ? '▼' : '▶'}
                </span>
              </div>
              
              {isLabelGenresExpanded && (
                <div className="mt-3 space-y-3">
                  {GENRE_CLUSTERS.map((cluster, clusterIdx) => (
                    <div key={`label-cluster-${clusterIdx}-${cluster.name}`} className="bg-zinc-950/50 border border-zinc-800/80 rounded-lg p-3">
                      <div className="text-[8px] font-mono font-bold text-zinc-400 mb-2 uppercase tracking-widest">{cluster.name}</div>
                      <div className="flex flex-wrap gap-1.5">
                        {cluster.genres.map((genre, gIdx) => (
                          <button
                            key={`label-cluster-${clusterIdx}-genre-${gIdx}-${genre}`}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setLabelGenres(prev => 
                                prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
                              );
                            }}
                            className={`text-[8.5px] font-mono px-2 py-1 rounded border transition-colors ${
                              labelGenres.includes(genre)
                                ? 'bg-orange-950/40 border-orange-500 text-orange-300 shadow-[0_0_8px_rgba(249,115,22,0.2)]'
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

      {/* STEP C MODULE (Collapsed by default) */}
      <div className="w-full border-y border-orange-900/30 overflow-hidden bg-zinc-950/20">
        <div 
          className="bg-orange-950/15 p-3.5 flex justify-between items-center cursor-pointer hover:bg-orange-950/25 transition-colors border-b border-orange-900/30"
          onClick={() => setLabelSectionCOpen(!labelSectionCOpen)}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xs">⚖️</span>
            <h4 className="text-[10px] font-bold tracking-wider uppercase text-zinc-300">
              Section C: Tax Hygiene & Financial Settlement
            </h4>
          </div>
          <span className="text-zinc-500 text-[9px] font-mono">
            {labelSectionCOpen ? 'COLLAPSE [-]' : 'EXPAND [+]'}
          </span>
        </div>
        {labelSectionCOpen && (
          <div className="p-4 space-y-4 bg-black/30">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Legal Entity Type</label>
                <select 
                  value={labelLegalEntityType}
                  onChange={(e) => setLabelLegalEntityType(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-orange-400 focus:border-orange-500 outline-none"
                >
                  <option value="LLC">LLC</option>
                  <option value="CORPORATION">CORPORATION</option>
                  <option value="PARTNERSHIP">PARTNERSHIP</option>
                  <option value="SOLE_PROPRIETORSHIP">SOLE PROPRIETORSHIP</option>
                </select>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Tax Registration (EIN / Corporate Tax ID)</label>
                <input 
                  type="text" 
                  autoComplete="new-password"
                  data-lpignore="true"
                  placeholder="EIN / TAX REGISTRATION"
                  value={labelTaxRegistrationNumber}
                  onChange={(e) => setLabelTaxRegistrationNumber(e.target.value)}
                  className="w-full bg-zinc-950 border border-orange-500/30 focus:border-orange-500 text-orange-500 rounded p-2.5 text-xs font-mono outline-none placeholder-zinc-700 uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Fulfillment / Shipping Postal Code</label>
                <input 
                  type="text" 
                  autoComplete="new-password"
                  data-lpignore="true"
                  placeholder="POSTAL CODE"
                  value={labelShippingPostalCode}
                  onChange={(e) => setLabelShippingPostalCode(e.target.value)}
                  className="w-full bg-zinc-950 border border-orange-500/30 focus:border-orange-500 text-orange-500 rounded p-2.5 text-xs font-mono outline-none placeholder-zinc-700 uppercase"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Shipping Country</label>
                <input 
                  type="text" 
                  autoComplete="new-password"
                  data-lpignore="true"
                  placeholder="e.g. US, DE, UK"
                  value={labelShippingCountry}
                  onChange={(e) => setLabelShippingCountry(e.target.value)}
                  className="w-full bg-zinc-950 border border-orange-500/30 focus:border-orange-500 text-orange-500 rounded p-2.5 text-xs font-mono outline-none placeholder-zinc-700 uppercase"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    const supabase = getSupabase();
                    triggerNotification?.("Initiating secure Stripe Connect onboarding...");
                    const { data, error } = await supabase.functions.invoke('create-connect-account', {
                      body: {
                        email: labelArOperationsEmail || labelBookingEmail || 'label@operations.io',
                        country: labelShippingCountry || 'US',
                        business_type: 'company',
                        return_url: window.location.href,
                        refresh_url: window.location.href,
                      }
                    });
                    if (error) throw error;
                    if (data?.url) {
                      window.location.href = data.url;
                    } else {
                      triggerNotification?.("Stripe account initialization requested.");
                    }
                  } catch (err: any) {
                    triggerNotification?.(`⚠️ STRIPE CONNECT: ${err.message || 'Verification redirect ready'}`);
                  }
                }}
                className={`w-full p-3 rounded border text-[10px] font-mono font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  labelStripeConnected 
                    ? 'bg-orange-950/40 border-orange-500 text-orange-400' 
                    : 'bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                {labelStripeConnected ? '[ STRIPE EXPRESS LINKED ]' : 'CONNECT STRIPE EXPRESS (PAYOUTS)'}
              </button>
              
              <button
                type="button"
                onClick={async () => {
                  try {
                    const response = await fetch('/api/auth/paypal/url');
                    if (!response.ok) throw new Error('Failed to fetch PayPal auth URL');
                    const { url } = await response.json();
                    const width = 600, height = 700;
                    const left = window.screen.width / 2 - width / 2;
                    const top = window.screen.height / 2 - height / 2;
                    const win = window.open(url, 'paypal_oauth_popup', `width=${width},height=${height},top=${top},left=${left}`);
                    if (!win) {
                      triggerNotification?.("⚠️ POPUP BLOCKED: Please enable popups.");
                    }
                  } catch (err: any) {
                    triggerNotification?.(`⚠️ PAYPAL CONNECT ERROR: ${err.message}`);
                  }
                }}
                className={`w-full p-3 rounded border text-[10px] font-mono font-bold flex items-center justify-center gap-2 transition-colors ${
                  labelPaypalConnected 
                    ? 'bg-orange-950/40 border-orange-500 text-orange-400' 
                    : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                }`}
              >
                <RefreshCw className="w-3 h-3 animate-spin-slow" />
                {labelPaypalConnected ? '[ PAYPAL MERCHANT CONNECTED ]' : 'AUTHORIZE PAYPAL'}
              </button>
              
              <label className="w-full p-3 rounded border bg-zinc-950 border-zinc-800 text-zinc-500 flex items-center justify-center gap-2 cursor-pointer hover:border-zinc-700 transition-colors">
                <input 
                  type="checkbox" 
                  checked={labelSetupPaymentLater}
                  onChange={(e) => setLabelSetupPaymentLater(e.target.checked)}
                  className="w-3 h-3 accent-orange-500 rounded border-zinc-700 cursor-pointer"
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
