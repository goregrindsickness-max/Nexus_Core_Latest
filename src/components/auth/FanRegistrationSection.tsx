import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { COUNTRIES, US_STATES } from '../../constants/location';
import { MASTER_GENRES } from '../../constants/genres';

export interface FanRegistrationSectionProps {
  fullName: string;
  setFullName: (val: string) => void;
  screenName: string;
  setScreenName: (val: string) => void;
  signupEmail: string;
  setSignupEmail: (val: string) => void;
  signUpPassword: string;
  setSignUpPassword: (val: string) => void;
  showSignUpPassword: boolean;
  setShowSignUpPassword: (val: boolean) => void;
  city: string;
  setCity: (val: string) => void;
  country: string;
  setCountry: (val: string) => void;
  stateProvince: string;
  setStateProvince: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  zipCode: string;
  setZipCode: (val: string) => void;
  signUpUnlockPin: string;
  setSignUpUnlockPin: (val: string) => void;
  isWorkspaceRegistration: boolean;
  customGenre: string;
  setCustomGenre: (val: string) => void;
  isMicroGenresExpanded: boolean;
  setIsMicroGenresExpanded: (val: boolean) => void;
  expandedSignupClusters: Record<string, boolean>;
  setExpandedSignupClusters: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export const FanRegistrationSection: React.FC<FanRegistrationSectionProps> = ({
  fullName,
  setFullName,
  screenName,
  setScreenName,
  signupEmail,
  setSignupEmail,
  signUpPassword,
  setSignUpPassword,
  showSignUpPassword,
  setShowSignUpPassword,
  city,
  setCity,
  country,
  setCountry,
  stateProvince,
  setStateProvince,
  phone,
  setPhone,
  zipCode,
  setZipCode,
  signUpUnlockPin,
  setSignUpUnlockPin,
  isWorkspaceRegistration,
  customGenre,
  setCustomGenre,
  isMicroGenresExpanded,
  setIsMicroGenresExpanded,
  expandedSignupClusters,
  setExpandedSignupClusters,
}) => {
  return (
    <div className="space-y-4 text-left">
      {/* Tier 1: Personal Identifiers */}
      <div className="space-y-3">
        <div>
          <label className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">Full Legal Name</label>
          <input
            type="text"
            placeholder="Full Legal Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="off"
            data-lpignore="true"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm font-sans text-emerald-500 placeholder-zinc-700 focus:border-emerald-500/80 transition-all outline-none"
          />
        </div>
        <div>
          <label className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">Handle / Screen Name</label>
          <input
            type="text"
            placeholder="@handle/ screen name"
            value={screenName}
            onChange={(e) => setScreenName(e.target.value)}
            autoComplete="off"
            data-lpignore="true"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm font-sans text-emerald-500 placeholder-zinc-700 focus:border-emerald-500/80 transition-all outline-none"
          />
        </div>
      </div>

      {/* Tier 3: Core Credentials & Location */}
      <div className="space-y-3">
        <div>
          <label className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">Email Address</label>
          <input
            type="email"
            placeholder="Email Address"
            value={signupEmail}
            onChange={(e) => setSignupEmail(e.target.value)}
            autoComplete="off"
            data-lpignore="true"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm font-sans text-emerald-500 placeholder-zinc-700 focus:border-emerald-500/80 transition-all outline-none"
          />
        </div>
        <div>
          <label className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">Password</label>
          <div className="relative">
            <input
              type={showSignUpPassword ? 'text' : 'password'}
              placeholder="Choose Password"
              value={signUpPassword}
              onChange={(e) => setSignUpPassword(e.target.value)}
              autoComplete="new-password"
              data-lpignore="true"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 pr-10 text-sm font-sans text-emerald-500 placeholder-zinc-700 focus:border-emerald-500/80 transition-all outline-none"
            />
            <button
              type="button"
              onClick={() => setShowSignUpPassword(!showSignUpPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              {showSignUpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 items-end">
          <div>
            <label className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">City</label>
            <input
              type="text"
              placeholder="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              autoComplete="off"
              data-lpignore="true"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm font-sans text-emerald-500 placeholder-zinc-700 focus:border-emerald-500/80 transition-all outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">Country</label>
            <select
              value={country || 'USA'}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm font-sans text-emerald-500 focus:border-emerald-500/80 transition-all outline-none font-mono"
            >
              {COUNTRIES.map((c, cIdx) => (
                <option key={`${c.code}-${cIdx}`} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          {(!country || country.trim().toUpperCase() === 'USA' || country.trim().toUpperCase() === 'US') ? (
            <div>
              <label className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">State</label>
              <select
                value={stateProvince}
                onChange={(e) => setStateProvince(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm font-sans text-emerald-500 focus:border-emerald-500/80 transition-all outline-none font-mono"
              >
                <option value="">SELECT STATE...</option>
                {US_STATES.map((st, idx) => (
                  <option key={`${st.code}-${idx}`} value={st.code}>{st.name.toUpperCase()} ({st.code})</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">Province / Region</label>
              <input
                type="text"
                placeholder="PROVINCE / REGION..."
                value={stateProvince}
                onChange={(e) => setStateProvince(e.target.value.toUpperCase())}
                autoComplete="off"
                data-lpignore="true"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm font-sans text-emerald-500 placeholder-zinc-700 focus:border-emerald-500/80 transition-all outline-none"
              />
            </div>
          )}
        </div>
        <input
          type="tel"
          placeholder="Mobile Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
          autoComplete="off"
          data-lpignore="true"
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm font-sans text-emerald-500 placeholder-zinc-700 focus:border-emerald-500/80 transition-all outline-none"
        />
        <input
          type="text"
          placeholder="ZIP Code (e.g. 75020) [Private/Shipping]"
          value={zipCode}
          onChange={(e) => setZipCode(e.target.value)}
          autoComplete="off"
          data-lpignore="true"
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm font-sans text-emerald-500 placeholder-zinc-700 focus:border-emerald-500/80 transition-all outline-none"
        />
      </div>

      {/* Access PIN */}
      <div className="space-y-3">
        <div>
          <label className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">6-Digit Quick Login PIN</label>
          <input
            type="text"
            placeholder="6-Digit Quick Login PIN Input"
            value={signUpUnlockPin}
            onChange={(e) => setSignUpUnlockPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            autoComplete="off"
            data-lpignore="true"
            maxLength={6}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm font-mono tracking-widest text-emerald-500 placeholder-zinc-700 focus:border-emerald-500/80 transition-all outline-none"
          />
        </div>
      </div>

      {/* Algorithmic Micro-Genre Clustering Panel */}
      {!isWorkspaceRegistration && (
        <div className="bg-zinc-950/20 border border-emerald-500/80 rounded-lg p-3 mb-2 select-none">
          <div
            className="flex justify-between items-center cursor-pointer"
            onClick={() => setIsMicroGenresExpanded(!isMicroGenresExpanded)}
          >
            <span className="text-[11px] font-mono tracking-wide text-zinc-400 font-bold flex items-center gap-2">
              <span>{isMicroGenresExpanded ? '▼' : '▶'}</span> MY PREFERRED GENRES (ALGORITHMIC FEED CALIBRATION)
            </span>
            {customGenre.trim() && (
              <span className="text-[9px] font-mono font-bold bg-[#FF9900]/20 text-[#FF9900] border border-[#FF9900]/40 px-2 py-0.5 rounded">
                {customGenre.split(',').map((s) => s.trim()).filter(Boolean).length} Selected
              </span>
            )}
          </div>
          {isMicroGenresExpanded && (
            <div className="mt-3 space-y-2">
              {MASTER_GENRES.map((cluster, idx) => {
                const isExpanded = !!expandedSignupClusters[cluster.name];
                const selectedList = customGenre.split(',').map((g) => g.trim()).filter(Boolean);
                const selectedCount = cluster.tags.filter((tag) => selectedList.includes(tag.label)).length;

                return (
                  <div key={`${cluster.name || '' || ''}-${idx}`} className="border border-zinc-850 rounded-lg bg-black/60 overflow-hidden">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedSignupClusters((prev) => ({ ...prev, [cluster.name]: !prev[cluster.name] }));
                      }}
                      className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-zinc-900/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase text-zinc-300">{cluster.name}</span>
                        {selectedCount > 0 && (
                          <span className="bg-[#FF9900]/20 border border-[#FF9900]/50 text-[#FF9900] text-[8px] font-mono font-bold px-1.5 py-0.2 rounded-full">
                            {selectedCount} Selected
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500">{isExpanded ? '▲' : '▼'}</span>
                    </button>

                    {isExpanded && (
                      <div className="p-2.5 bg-zinc-950/80 border-t border-zinc-900 flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                        {cluster.tags.map((tag, idx) => {
                          const isSelected = selectedList.includes(tag.label);
                          return (
                            <button
                              key={`${tag.id}-${idx}`}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                let updated: string[];
                                if (isSelected) {
                                  updated = selectedList.filter((g) => g !== tag.label);
                                } else {
                                  updated = [...selectedList, tag.label];
                                }
                                setCustomGenre(updated.join(', '));
                              }}
                              className={`text-[9px] font-mono px-2 py-1 rounded border transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#FF9900]/20 border-[#FF9900] text-[#FF9900] font-bold shadow-[0_0_8px_rgba(255,153,0,0.2)]'
                                  : 'bg-black border-zinc-800 text-zinc-500 hover:border-zinc-600'
                              }`}
                            >
                              {tag.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
