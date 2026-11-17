import React from 'react';
import { RefreshCw } from 'lucide-react';
import { GENRE_CLUSTERS, CREATIVE_CORE_SKILLS } from './authConstants';
import { COUNTRIES, US_STATES } from '../../constants/location';

export interface CreativeRegistrationSectionProps {
  creativeSectionAOpen: boolean;
  setCreativeSectionAOpen: (val: boolean) => void;
  creativeSectionBOpen: boolean;
  setCreativeSectionBOpen: (val: boolean) => void;
  creativeSectionCOpen: boolean;
  setCreativeSectionCOpen: (val: boolean) => void;
  creativeBusinessName: string;
  setCreativeBusinessName: (val: string) => void;
  creativeHandle: string;
  setCreativeHandle: (val: string) => void;
  creativeBiography: string;
  setCreativeBiography: (val: string) => void;
  creativeCity: string;
  setCreativeCity: (val: string) => void;
  creativeState: string;
  setCreativeState: (val: string) => void;
  creativeCountry: string;
  setCreativeCountry: (val: string) => void;
  creativeSocialOpen: boolean;
  setCreativeSocialOpen: (val: boolean) => void;
  creativeInstagram: string;
  setCreativeInstagram: (val: string) => void;
  creativeArtStation: string;
  setCreativeArtStation: (val: string) => void;
  creativeWebsite: string;
  setCreativeWebsite: (val: string) => void;
  creativePrimarySpecialty: string;
  setCreativePrimarySpecialty: (val: string) => void;
  creativeCoreSkill: string;
  setCreativeCoreSkill: (val: string) => void;
  creativeSecondarySpecialty: string;
  setCreativeSecondarySpecialty: (val: string) => void;
  creativeSecondaryCoreSkill: string;
  setCreativeSecondaryCoreSkill: (val: string) => void;
  creativePrimaryGear: string;
  setCreativePrimaryGear: (val: string) => void;
  isCreativeGenresExpanded: boolean;
  setIsCreativeGenresExpanded: (val: boolean) => void;
  creativeGenres: string[];
  setCreativeGenres: React.Dispatch<React.SetStateAction<string[]>>;
  creativeLegalFullName: string;
  setCreativeLegalFullName: (val: string) => void;
  setCreativeLegalFirstName: (val: string) => void;
  setCreativeLegalLastName: (val: string) => void;
  creativeLegalEntityType: string;
  setCreativeLegalEntityType: (val: string) => void;
  creativeTaxId: string;
  setCreativeTaxId: (val: string) => void;
  creativeBaseRateSetup: string;
  setCreativeBaseRateSetup: (val: string) => void;
  creativeBaseRateValue: number;
  setCreativeBaseRateValue: (val: number) => void;
  creativeBroadcastBulletin: string;
  setCreativeBroadcastBulletin: (val: string) => void;
  creativeStripeConnected: boolean;
  setCreativeStripeConnected: (val: boolean) => void;
  creativePaypalConnected: boolean;
  setCreativePaypalConnected: (val: boolean) => void;
  creativeSetupPaymentLater: boolean;
  setCreativeSetupPaymentLater: (val: boolean) => void;
}

export const CreativeRegistrationSection: React.FC<CreativeRegistrationSectionProps> = ({
  creativeSectionAOpen,
  setCreativeSectionAOpen,
  creativeSectionBOpen,
  setCreativeSectionBOpen,
  creativeSectionCOpen,
  setCreativeSectionCOpen,
  creativeBusinessName,
  setCreativeBusinessName,
  creativeHandle,
  setCreativeHandle,
  creativeBiography,
  setCreativeBiography,
  creativeCity,
  setCreativeCity,
  creativeState,
  setCreativeState,
  creativeCountry,
  setCreativeCountry,
  creativeSocialOpen,
  setCreativeSocialOpen,
  creativeInstagram,
  setCreativeInstagram,
  creativeArtStation,
  setCreativeArtStation,
  creativeWebsite,
  setCreativeWebsite,
  creativePrimarySpecialty,
  setCreativePrimarySpecialty,
  creativeCoreSkill,
  setCreativeCoreSkill,
  creativeSecondarySpecialty,
  setCreativeSecondarySpecialty,
  creativeSecondaryCoreSkill,
  setCreativeSecondaryCoreSkill,
  creativePrimaryGear,
  setCreativePrimaryGear,
  isCreativeGenresExpanded,
  setIsCreativeGenresExpanded,
  creativeGenres,
  setCreativeGenres,
  creativeLegalFullName,
  setCreativeLegalFullName,
  setCreativeLegalFirstName,
  setCreativeLegalLastName,
  creativeLegalEntityType,
  setCreativeLegalEntityType,
  creativeTaxId,
  setCreativeTaxId,
  creativeBaseRateSetup,
  setCreativeBaseRateSetup,
  creativeBaseRateValue,
  setCreativeBaseRateValue,
  creativeBroadcastBulletin,
  setCreativeBroadcastBulletin,
  creativeStripeConnected,
  setCreativeStripeConnected,
  creativePaypalConnected,
  setCreativePaypalConnected,
  creativeSetupPaymentLater,
  setCreativeSetupPaymentLater,
}) => {
  return (
    <div className="px-0 py-4 space-y-4 bg-[#0a0a0c] w-full">
      {/* STEP A MODULE */}
      <div className="w-full border-y border-purple-900/30 overflow-hidden bg-zinc-950/20">
        <div 
          className="bg-purple-950/15 p-3.5 flex justify-between items-center cursor-pointer hover:bg-purple-950/25 transition-colors border-b border-purple-900/30"
          onClick={() => setCreativeSectionAOpen(!creativeSectionAOpen)}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xs">📝</span>
            <h4 className="text-[10px] font-bold tracking-wider uppercase text-zinc-300">
              Section A: Specialty & EPK Portfolio
            </h4>
          </div>
          <span className="text-zinc-500 text-[9px] font-mono">
            {creativeSectionAOpen ? 'COLLAPSE [-]' : 'EXPAND [+]'}
          </span>
        </div>
        {creativeSectionAOpen && (
          <div className="p-4 space-y-4 bg-black/30">
            {/* Business Name, handle, bio */}
            <div className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Creative / Business Name</label>
                <input 
                  type="text" 
                  placeholder="ENTER CREATIVE DESIGN ALIAS"
                  value={creativeBusinessName}
                  onChange={(e) => setCreativeBusinessName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-purple-400 focus:border-purple-500 outline-none placeholder-zinc-700"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Custom screen name / handle</label>
                <input 
                  type="text" 
                  placeholder="e.g. jondoe"
                  value={creativeHandle}
                  onChange={(e) => setCreativeHandle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-purple-400 focus:border-purple-500 outline-none placeholder-zinc-700"
                />
              </div>
              
              <div className="space-y-1.5 text-left">
                <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Bio / Tagline</label>
                <input 
                  type="text" 
                  placeholder="A SHORT BIO..."
                  value={creativeBiography}
                  onChange={(e) => setCreativeBiography(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-purple-400 focus:border-purple-500 outline-none placeholder-zinc-700"
                />
              </div>

              {/* Location Matrix: 3 Columns (City text, State dropdown, Country dropdown) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5 text-left">
                  <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">City</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Austin"
                    value={creativeCity}
                    onChange={(e) => setCreativeCity(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-purple-400 focus:border-purple-500 outline-none placeholder-zinc-700"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">State / Province</label>
                  <select 
                    value={creativeState}
                    onChange={(e) => setCreativeState(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-purple-400 focus:border-purple-500 outline-none"
                  >
                    <option value="">SELECT STATE...</option>
                    {US_STATES.map((st, idx) => (
                      <option key={`${st.code}-${idx}`} value={st.code}>{st.name.toUpperCase()} ({st.code})</option>
                    ))}
                    <option value="OUTSIDE_US">Outside US / Int'l</option>
                  </select>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Country</label>
                  <select 
                    value={creativeCountry}
                    onChange={(e) => setCreativeCountry(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-purple-400 focus:border-purple-500 outline-none"
                  >
                    {COUNTRIES.map((c, cIdx) => (
                      <option key={`${c.code}-${cIdx}`} value={c.code}>{c.name.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Instagram, Artstation, Website (Collapsed by default) */}
            <div className="border border-zinc-800/60 rounded-lg p-3 bg-zinc-950/30">
              <div 
                className="flex items-center justify-between cursor-pointer group"
                onClick={() => setCreativeSocialOpen(!creativeSocialOpen)}
              >
                <span className="text-[8px] font-mono font-bold text-zinc-400 uppercase tracking-widest cursor-pointer">
                  🌐 Socials & Portfolio links
                </span>
                <span className="text-zinc-500 text-[10px] group-hover:text-purple-400 transition-colors">
                  {creativeSocialOpen ? '▼' : '▶'}
                </span>
              </div>
              {creativeSocialOpen && (
                <div className="mt-3 space-y-3 pt-3 border-t border-zinc-900">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Instagram Handle</label>
                    <input 
                      type="text" 
                      placeholder="@HANDLE"
                      value={creativeInstagram}
                      onChange={(e) => setCreativeInstagram(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-purple-400 focus:border-purple-500 outline-none placeholder-zinc-700"
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">ArtStation / Behance Link</label>
                    <input 
                      type="url" 
                      placeholder="HTTPS://ARTSTATION.COM/"
                      value={creativeArtStation}
                      onChange={(e) => setCreativeArtStation(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-purple-400 focus:border-purple-500 outline-none placeholder-zinc-700"
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Official Website URL</label>
                    <input 
                      type="url" 
                      placeholder="HTTPS://DOMAIN.COM"
                      value={creativeWebsite}
                      onChange={(e) => setCreativeWebsite(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-purple-400 focus:border-purple-500 outline-none placeholder-zinc-700"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Skills Configuration */}
            <div className="space-y-4 pt-2">
              {/* Primary Skill */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5 text-left">
                  <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Primary Specialty Sector</label>
                  <select 
                    value={creativePrimarySpecialty}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCreativePrimarySpecialty(val);
                      setCreativeCoreSkill(CREATIVE_CORE_SKILLS[val]?.[0] || '');
                    }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-purple-400 focus:border-purple-500 outline-none"
                  >
                    <option value="GRAPHIC_DESIGN">GRAPHIC DESIGN</option>
                    <option value="PHOTOGRAPHY">PHOTOGRAPHY</option>
                    <option value="VIDEO_PRODUCTION">VIDEO PRODUCTION</option>
                    <option value="AUDIO_ENGINEERING">AUDIO ENGINEERING</option>
                    <option value="SESSION_MUSICIAN_TECHS">SESSION MUSICIAN TECHS</option>
                  </select>
                </div>
                
                <div className="space-y-1.5 text-left">
                  <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Specific Core Skill</label>
                  <select 
                    value={creativeCoreSkill}
                    onChange={(e) => setCreativeCoreSkill(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-purple-400 focus:border-purple-500 outline-none"
                  >
                    {(CREATIVE_CORE_SKILLS[creativePrimarySpecialty] || []).map((skill, idx) => (
                      <option key={`${skill}-${idx}`} value={skill}>{skill.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Secondary Skill */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5 text-left">
                  <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Secondary Specialty Sector</label>
                  <select 
                    value={creativeSecondarySpecialty}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCreativeSecondarySpecialty(val);
                      setCreativeSecondaryCoreSkill(CREATIVE_CORE_SKILLS[val]?.[0] || '');
                    }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-purple-400 focus:border-purple-500 outline-none"
                  >
                    <option value="GRAPHIC_DESIGN">GRAPHIC DESIGN</option>
                    <option value="PHOTOGRAPHY">PHOTOGRAPHY</option>
                    <option value="VIDEO_PRODUCTION">VIDEO PRODUCTION</option>
                    <option value="AUDIO_ENGINEERING">AUDIO ENGINEERING</option>
                    <option value="SESSION_MUSICIAN_TECHS">SESSION MUSICIAN TECHS</option>
                  </select>
                </div>
                
                <div className="space-y-1.5 text-left">
                  <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Secondary Core Skill</label>
                  <select 
                    value={creativeSecondaryCoreSkill}
                    onChange={(e) => setCreativeSecondaryCoreSkill(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-purple-400 focus:border-purple-500 outline-none"
                  >
                    {(CREATIVE_CORE_SKILLS[creativeSecondarySpecialty] || []).map((skill, idx) => (
                      <option key={`${skill}-${idx}`} value={skill}>{skill.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Primary Gear, software, tools */}
            <div className="space-y-1.5 text-left">
              <label className="text-[8px] font-mono tracking-wider text-purple-400 font-bold uppercase">Primary Gear, software or tools used</label>
              <input 
                type="text" 
                placeholder="e.g., Photoshop CC, Figma, Pro Tools, Sony FX3"
                value={creativePrimaryGear}
                onChange={(e) => setCreativePrimaryGear(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-purple-400 focus:border-purple-500 outline-none placeholder-zinc-700"
              />
              <div className="text-[7.5px] font-mono text-zinc-600 uppercase mt-1">
                [ EQUIPMENT PARSER: A COMMA-SEPARATED BUFFER ARRAY WILL BE CONSTRUCTED ON SUBMIT ]
              </div>
            </div>

            {/* GENRE TAXONOMY MATRIX */}
            <div className="space-y-1.5 pt-2 text-left">
              <div 
                className="flex items-center justify-between cursor-pointer group"
                onClick={() => setIsCreativeGenresExpanded(!isCreativeGenresExpanded)}
              >
                <div>
                  <label className="block text-[8px] font-mono tracking-wider text-purple-400 font-bold uppercase cursor-pointer">Genre Taxonomy Matrix</label>
                  <div className="text-[7.5px] font-mono text-zinc-600 uppercase mt-0.5">
                    [ SELECT PRIMARY SONIC CLUSTERS FOR CONTRACT DISCOVERY ALGORITHMS ]
                  </div>
                </div>
                <span className="text-zinc-500 text-[10px] group-hover:text-purple-400 transition-colors">
                  {isCreativeGenresExpanded ? '▼' : '▶'}
                </span>
              </div>
              
              {isCreativeGenresExpanded && (
                <div className="mt-3 space-y-3">
                  {GENRE_CLUSTERS.map((cluster, clusterIdx) => (
                    <div key={`cluster-${clusterIdx}-${cluster.name}`} className="bg-zinc-950/50 border border-zinc-800/80 rounded-lg p-3">
                      <div className="text-[8px] font-mono font-bold text-zinc-400 mb-2 uppercase tracking-widest">{cluster.name}</div>
                      <div className="flex flex-wrap gap-1.5">
                        {cluster.genres.map((genre, gIdx) => (
                          <button
                            key={`cluster-${clusterIdx}-genre-${gIdx}-${genre}`}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setCreativeGenres(prev => 
                                prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
                              );
                            }}
                            className={`text-[8.5px] font-mono px-2 py-1 rounded border transition-colors ${
                              creativeGenres.includes(genre)
                                ? 'bg-purple-900/40 border-purple-500 text-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.2)]'
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
      <div className="w-full border-y border-purple-900/30 overflow-hidden bg-zinc-950/20">
        <div 
          className="bg-purple-950/15 p-3.5 flex justify-between items-center cursor-pointer hover:bg-purple-950/25 transition-colors border-b border-purple-900/30"
          onClick={() => setCreativeSectionBOpen(!creativeSectionBOpen)}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xs">⚖️</span>
            <h4 className="text-[10px] font-bold tracking-wider uppercase text-zinc-300">
              Section B: Tax Hygiene & Base Ratings
            </h4>
          </div>
          <span className="text-zinc-500 text-[9px] font-mono">
            {creativeSectionBOpen ? 'COLLAPSE [-]' : 'EXPAND [+]'}
          </span>
        </div>
        {creativeSectionBOpen && (
          <div className="p-4 space-y-4 bg-black/30">
            <div className="space-y-1.5 text-left">
              <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Legal Full Name</label>
              <input 
                type="text" 
                placeholder="LEGAL FULL NAME"
                value={creativeLegalFullName}
                onChange={(e) => {
                  setCreativeLegalFullName(e.target.value);
                  const parts = e.target.value.trim().split(' ');
                  setCreativeLegalFirstName(parts[0] || '');
                  setCreativeLegalLastName(parts.slice(1).join(' ') || '');
                }}
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-purple-400 focus:border-purple-500 outline-none placeholder-zinc-700"
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Legal Entity Type</label>
              <select 
                value={creativeLegalEntityType}
                onChange={(e) => setCreativeLegalEntityType(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-purple-400 focus:border-purple-500 outline-none"
              >
                <option value="SOLE_PROPRIETORSHIP">SOLE PROPRIETORSHIP</option>
                <option value="LLC">LLC</option>
                <option value="CORPORATION">CORPORATION</option>
                <option value="PARTNERSHIP">PARTNERSHIP</option>
              </select>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Taxpayer Identification (EIN / Social Security)</label>
              <input 
                type="text" 
                placeholder="12-3456789 or SSN"
                value={creativeTaxId}
                onChange={(e) => setCreativeTaxId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-purple-400 focus:border-purple-500 outline-none placeholder-zinc-700"
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Base Rate Setup</label>
              <select 
                value={creativeBaseRateSetup}
                onChange={(e) => setCreativeBaseRateSetup(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-purple-400 focus:border-purple-500 outline-none"
              >
                <option value="DAY_RATE">DAY RATE</option>
                <option value="HOURLY_RATE">HOURLY RATE</option>
                <option value="PROJECT_FLAT">PROJECT FLAT</option>
              </select>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Base Rate Value (USD)</label>
              <input 
                type="number" 
                placeholder="350"
                value={creativeBaseRateValue || ''}
                onChange={(e) => setCreativeBaseRateValue(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-purple-400 focus:border-purple-500 outline-none placeholder-zinc-700"
              />
            </div>
            
            <div className="space-y-1.5 text-left">
              <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Live Update Ticker</label>
              <input 
                type="text" 
                placeholder="AVAILABLE FOR TOURING GIGS STARTING JUL"
                value={creativeBroadcastBulletin}
                onChange={(e) => setCreativeBroadcastBulletin(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-purple-400 focus:border-purple-500 outline-none placeholder-zinc-700"
              />
            </div>
          </div>
        )}
      </div>

      {/* STEP C MODULE (Collapsed by default) */}
      <div className="w-full border-y border-purple-900/30 overflow-hidden bg-zinc-950/20">
        <div 
          className="bg-purple-950/15 p-3.5 flex justify-between items-center cursor-pointer hover:bg-purple-950/25 transition-colors border-b border-purple-900/30"
          onClick={() => setCreativeSectionCOpen(!creativeSectionCOpen)}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xs">💳</span>
            <h4 className="text-[10px] font-bold tracking-wider uppercase text-zinc-300">
              Section C: Financial Routing & Visual Assets
            </h4>
          </div>
          <span className="text-zinc-500 text-[9px] font-mono">
            {creativeSectionCOpen ? 'COLLAPSE [-]' : 'EXPAND [+]'}
          </span>
        </div>
        {creativeSectionCOpen && (
          <div className="p-4 space-y-4 bg-black/30">
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setCreativeStripeConnected(true)}
                className={`w-full p-3 rounded border text-[10px] font-mono font-bold flex items-center justify-center gap-2 transition-colors ${
                  creativeStripeConnected 
                    ? 'bg-purple-900/40 border-purple-500 text-purple-400' 
                    : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                }`}
              >
                <RefreshCw className="w-3 h-3 animate-spin-slow" />
                {creativeStripeConnected ? '[ STRIPE MERCHANT CONNECTED ]' : 'AUTHORIZE STRIPE'}
              </button>
              
              <button
                type="button"
                onClick={() => setCreativePaypalConnected(true)}
                className={`w-full p-3 rounded border text-[10px] font-mono font-bold flex items-center justify-center gap-2 transition-colors ${
                  creativePaypalConnected 
                    ? 'bg-purple-900/40 border-purple-500 text-purple-400' 
                    : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                }`}
              >
                <RefreshCw className="w-3 h-3 animate-spin-slow" />
                {creativePaypalConnected ? '[ PAYPAL CREATIVE CONNECTED ]' : 'AUTHORIZE PAYPAL'}
              </button>
              
              <label className="w-full p-3 rounded border bg-zinc-950 border-zinc-800 text-zinc-500 flex items-center justify-center gap-2 cursor-pointer hover:border-zinc-700 transition-colors">
                <input 
                  type="checkbox" 
                  checked={creativeSetupPaymentLater}
                  onChange={(e) => setCreativeSetupPaymentLater(e.target.checked)}
                  className="w-3 h-3 accent-purple-500 rounded border-zinc-700 cursor-pointer"
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
