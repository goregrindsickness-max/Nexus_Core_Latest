import React from 'react';
import { Settings, X, Upload, Globe, Disc, CreditCard, Banknote } from 'lucide-react';
import StripeConnectPayoutSection from '../../../StripeConnectPayoutSection';

interface LabelSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: any;
  setUserProfile: (profile: any) => void;
  bandRosterInput: string;
  setBandRosterInput: (val: string) => void;
  subLabelsInput: string;
  setSubLabelsInput: (val: string) => void;
  expandedClusters: Record<string, boolean>;
  setExpandedClusters: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  activeClearanceLevel: number;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCoverImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setLabelOAuthProcessor: React.Dispatch<React.SetStateAction<{ id: 'stripe' | 'paypal'; name: string } | null>> | ((proc: { id: 'stripe' | 'paypal'; name: string } | null) => void);
  setLabelOAuthStep: (step: number) => void;
  showLocalToast: (msg: string) => void;
}

export const LabelSettingsDrawer: React.FC<LabelSettingsDrawerProps> = ({
  isOpen,
  onClose,
  userProfile,
  setUserProfile,
  bandRosterInput,
  setBandRosterInput,
  subLabelsInput,
  setSubLabelsInput,
  expandedClusters,
  setExpandedClusters,
  activeClearanceLevel,
  handleImageUpload,
  handleCoverImageUpload,
  setLabelOAuthProcessor,
  setLabelOAuthStep,
  showLocalToast
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#000000] flex flex-col text-zinc-100 animate-in fade-in duration-200">
      <div className="w-full h-full flex flex-col relative">
        <div className="absolute inset-x-0 top-0 h-1 bg-[#f97316]" />
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A1A1A] bg-zinc-900/40">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-[#f97316] animate-spin" style={{ animationDuration: '6s' }} />
            <h3 className="font-mono font-bold text-xs tracking-widest uppercase text-white">
              RECORD LABEL CONSOLE: REGISTRATION & MERCHANT SETTINGS
            </h3>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Custom Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          {/* SECTION A: MEDIA ASSETS */}
          <div className="space-y-4 bg-zinc-950/40 p-4 rounded-xl border border-[#1A1A1A]">
            <h4 className="text-[10px] uppercase font-mono tracking-widest text-[#f97316] font-bold flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#f97316] rounded-full animate-ping" />
              [ Section A: Corporate Media Assets / Picture Uploaders ]
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Avatar / Logo */}
              <div className="space-y-3 flex flex-col items-center justify-center p-4 bg-black border border-zinc-900 rounded-lg">
                <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider block self-start">Corporate Emblem / Avatar Logo</span>
                <div className="relative group w-24 h-24 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 flex items-center justify-center shadow-md">
                  {userProfile.label_avatar ? (
                    <>
                      <img 
                        src={userProfile.label_avatar} 
                        alt="Av" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                      <button 
                        type="button" 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setUserProfile({...userProfile, label_avatar: ''});
                        }}
                        className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold border border-zinc-950 z-10 cursor-pointer"
                        title="Remove logo"
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <Globe className="w-10 h-10 text-zinc-650" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById('label-avatar-uploader') as HTMLInputElement;
                    input?.click();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-805 rounded text-[10px] font-mono text-[#f97316] uppercase hover:brightness-110 transition-all cursor-pointer"
                >
                  <Upload className="w-3 h-3" />
                  Upload Logo (PNG/JPG)
                </button>
                <input 
                  id="label-avatar-uploader"
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageUpload} 
                />
              </div>

              {/* Cover Picture / Banner */}
              <div className="space-y-3 flex flex-col items-center justify-center p-4 bg-black border border-zinc-900 rounded-lg">
                <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider block self-start">Cover Banner / Billboard Artwork</span>
                <div className="relative group w-full h-24 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 flex items-center justify-center shadow-md">
                  {userProfile.label_banner ? (
                    <>
                      <img 
                        src={userProfile.label_banner} 
                        alt="Cov" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                      <button 
                        type="button" 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setUserProfile({...userProfile, label_banner: ''});
                        }}
                        className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold border border-zinc-950 z-10 cursor-pointer"
                        title="Remove cover"
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-zinc-600 gap-1">
                      <Disc className="w-8 h-8 opacity-40 animate-spin" style={{ animationDuration: '10s' }} />
                      <span className="text-[8px] font-mono">[ NO BANNER LOADED ]</span>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById('label-cover-uploader') as HTMLInputElement;
                    input?.click();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-805 rounded text-[10px] font-mono text-[#f97316] uppercase hover:brightness-110 transition-all cursor-pointer"
                >
                  <Upload className="w-3 h-3" />
                  Upload Banner (Aspect 16:9)
                </button>
                <input 
                  id="label-cover-uploader"
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleCoverImageUpload} 
                />
              </div>
            </div>
          </div>

          {/* SECTION B: IDENTITY & ROSTER CONFIG */}
          <div className="space-y-4 bg-zinc-950/40 p-4 rounded-xl border border-[#1A1A1A]">
            <h4 className="text-[10px] uppercase font-mono tracking-widest text-[#f97316] font-bold">
              [ Section B: Corporate Profile & Artist Roster ]
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 text-left">
                <label className="text-[9px] uppercase font-mono tracking-widest text-[#f97316] font-bold">Corporate Entity Name</label>
                <input
                  type="text"
                  className="w-full bg-[#0c0e12] border border-[#1A1A1A] text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-[#f97316] font-mono text-xs uppercase"
                  value={userProfile.label_company_name || ''}
                  onChange={(e) => setUserProfile({...userProfile, label_company_name: e.target.value.toUpperCase()})}
                  placeholder="e.g. SLAM CORP RECORDS"
                />
              </div>
              
              <div className="space-y-1 text-left">
                <label className="text-[9px] uppercase font-mono tracking-widest text-[#f97316] font-bold">URL Namespace Slug</label>
                <input
                  type="text"
                  className="w-full bg-[#0c0e12] border border-[#1A1A1A] text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-[#f97316] font-mono text-xs lowercase"
                  value={userProfile.label_url_slug || ''}
                  onChange={(e) => setUserProfile({...userProfile, label_url_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                  placeholder="e.g. slamcorp"
                />
              </div>
              
              <div className="space-y-1 text-left md:col-span-2">
                <label className="text-[9px] uppercase font-mono tracking-widest text-zinc-400">Primary Contact Route (Email)</label>
                <input
                  type="email"
                  className="w-full bg-[#0c0e12]/60 border border-zinc-900 text-zinc-500 px-3 py-2 rounded font-mono text-xs"
                  value={userProfile?.email}
                  disabled
                />
                <p className="text-[8px] font-mono text-zinc-500 mt-1">[!] Security credential locked dynamically.</p>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[9px] uppercase font-mono tracking-widest text-[#f97316] font-bold">Distribution HQ</label>
                <input
                  type="text"
                  className="w-full bg-[#0c0e12] border border-[#1A1A1A] text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-[#f97316] font-mono text-xs"
                  value={userProfile.label_headquarters || ''}
                  onChange={(e) => setUserProfile({...userProfile, label_headquarters: e.target.value})}
                  placeholder="e.g. New York, NY"
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[9px] uppercase font-mono tracking-widest text-[#f97316] font-bold">Founded Year</label>
                <input
                  type="text"
                  className="w-full bg-[#0c0e12] border border-[#1A1A1A] text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-[#f97316] font-mono text-xs"
                  value={userProfile.label_founded_year || ''}
                  onChange={(e) => setUserProfile({...userProfile, label_founded_year: e.target.value})}
                  placeholder="e.g. 2018"
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[9px] uppercase font-mono tracking-widest text-[#f97316] font-bold">Roster Count</label>
                <input
                  type="text"
                  className="w-full bg-[#0c0e12] border border-[#1A1A1A] text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-[#f97316] font-mono text-xs"
                  value={userProfile.label_roster_count || ''}
                  onChange={(e) => setUserProfile({...userProfile, label_roster_count: e.target.value})}
                  placeholder="e.g. 14"
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[9px] uppercase font-mono tracking-widest text-[#f97316] font-bold">Security Pin</label>
                <input
                  type="password"
                  maxLength={4}
                  className="w-full bg-[#0c0e12] border border-[#1A1A1A] text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-[#f97316] font-mono text-xs tracking-widest"
                  value={userProfile.label_security_pin || ''}
                  onChange={(e) => setUserProfile({...userProfile, label_security_pin: e.target.value.replace(/\D/g, '')})}
                  placeholder="****"
                />
              </div>

              <div className="space-y-1 text-left md:col-span-2">
                <label className="text-[9px] uppercase font-mono tracking-widest text-[#f97316] font-bold">Default Band Roster (Comma-Separated)</label>
                <input
                  type="text"
                  className="w-full bg-[#0c0e12] border border-[#1A1A1A] text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-[#f97316] font-mono text-xs"
                  value={bandRosterInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBandRosterInput(val);
                    setUserProfile({
                      ...userProfile,
                      label_band_roster: val.split(',').map(x => x.trim()).filter(Boolean)
                    });
                  }}
                  placeholder="e.g. TOMB MOLD, SANGUISUGABOGG, GOREGRIND SICKNESS"
                />
                <p className="text-[8.5px] text-zinc-550 font-mono">Input active roster keys separated by commas for internal mapping.</p>
              </div>

              <div className="space-y-1 text-left md:col-span-2">
                <label className="text-[9px] uppercase font-mono tracking-widest text-[#f97316] font-bold">Associated Imprints & Sub-Labels</label>
                <input
                  type="text"
                  className="w-full bg-[#0c0e12] border border-[#1A1A1A] text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-[#f97316] font-mono text-xs"
                  value={subLabelsInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSubLabelsInput(val);
                    setUserProfile({
                      ...userProfile,
                      label_sub_labels: val.split(',').map(x => x.trim()).filter(Boolean)
                    });
                  }}
                  placeholder="e.g. Gore Grind Imprints, Special Series"
                />
              </div>
            </div>
          </div>

          {/* SECTION C: LOGISTICS & OPERATIONS */}
          <div className="space-y-4 bg-zinc-950/40 p-4 rounded-xl border border-[#1A1A1A]">
            <h4 className="text-[10px] uppercase font-mono tracking-widest text-[#f97316] font-bold">
              [ Section C: Merchant Logistics & Legal Registry ]
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 text-left">
                <label className="text-[9px] uppercase font-mono tracking-widest text-zinc-400">Legal Entity Classification</label>
                <select
                  value={userProfile.label_legal_entity_type || 'LLC'}
                  onChange={(e) => setUserProfile({ ...userProfile, label_legal_entity_type: e.target.value })}
                  className="w-full bg-[#0c0e12] border border-[#1A1A1A] text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-[#f97316] font-mono text-xs"
                >
                  {['SOLE_PROPRIETORSHIP', 'LLC', 'C_CORP', 'S_CORP', 'PARTNERSHIP'].map((t, tIdx) => (
                    <option key={`${t}-${tIdx}`} value={t} className="bg-black text-xs">{t.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[9px] uppercase font-mono tracking-widest text-[#f97316] font-bold">Tax Compliance ID / EIN</label>
                <input
                  type="text"
                  className="w-full bg-[#0c0e12] border border-[#1A1A1A] text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-[#f97316] font-mono text-xs"
                  value={userProfile.label_tax_registration_number || ''}
                  onChange={(e) => setUserProfile({ ...userProfile, label_tax_registration_number: e.target.value })}
                  placeholder="e.g. 12-3456789"
                />
              </div>

              <div className="space-y-1 text-left md:col-span-2">
                <label className="text-[9px] uppercase font-mono tracking-widest text-zinc-400">Global Distro / Fulfillment Model</label>
                <select
                  value={userProfile.label_master_distro_model || 'IN_HOUSE_FULFILLMENT'}
                  onChange={(e) => setUserProfile({ ...userProfile, label_master_distro_model: e.target.value })}
                  className="w-full bg-[#0c0e12] border border-[#1A1A1A] text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-[#f97316] font-mono text-xs select-none"
                >
                  {['IN_HOUSE_FULFILLMENT', 'THIRD_PARTY_DISTRIBUTION', 'PRINT_ON_DEMAND_DROP_SHIP'].map((t, tIdx) => (
                    <option key={`${t}-${tIdx}`} value={t} className="bg-black text-xs">{t.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[9px] uppercase font-mono tracking-widest text-zinc-400">Shipping Origin Zip / Postal Code</label>
                <input
                  type="text"
                  className="w-full bg-[#0c0e12] border border-[#1A1A1A] text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-[#f97316] font-mono text-xs"
                  value={userProfile.label_shipping_postal_code || ''}
                  onChange={(e) => setUserProfile({ ...userProfile, label_shipping_postal_code: e.target.value })}
                  placeholder="e.g. 90210"
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[9px] uppercase font-mono tracking-widest text-zinc-400">Fulfillment Shipping Region</label>
                <select
                  value={userProfile.label_shipping_country || 'US'}
                  onChange={(e) => setUserProfile({ ...userProfile, label_shipping_country: e.target.value })}
                  className="w-full bg-[#0c0e12] border border-[#1A1A1A] text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-[#f97316] font-mono text-xs"
                >
                  <option value="US" className="bg-black">United States (US)</option>
                  <option value="UK" className="bg-black">United Kingdom (UK)</option>
                  <option value="EU" className="bg-black">European Union (EU)</option>
                  <option value="CA" className="bg-black">Canada (CA)</option>
                  <option value="AU" className="bg-black">Australia (AU)</option>
                  <option value="GLOBAL" className="bg-black">Global (GLOBAL)</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION D: ACQUISITIONS & CONTRACTS */}
          <div className="space-y-4 bg-zinc-950/40 p-4 rounded-xl border border-[#1A1A1A]">
            <h4 className="text-[10px] uppercase font-mono tracking-widest text-[#f97316] font-bold">
              [ Section D: Acquisition Splitting Ledger ]
            </h4>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-[#07090d] p-3 border border-zinc-900 rounded-lg">
                <label className="text-[9.5px] uppercase font-mono tracking-widest text-[#f97316] font-bold">Default Contract Split Percentage</label>
                <div className="text-xs font-mono font-black text-zinc-200 bg-zinc-900 px-2.5 py-1 rounded border border-zinc-800">
                  LABEL: <span className="text-[#f97316]">{userProfile.label_default_contract_split ?? 50}%</span> / ARTIST: <span className="text-[#00ffcc]">{100 - (userProfile.label_default_contract_split ?? 50)}%</span>
                </div>
              </div>
              
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                className="w-full accent-[#f97316] cursor-pointer h-2 bg-zinc-900 rounded-lg appearance-none"
                value={userProfile.label_default_contract_split ?? 50}
                onChange={(e) => setUserProfile({ ...userProfile, label_default_contract_split: Number(e.target.value) })}
              />
              <p className="text-[8.5px] text-zinc-550 font-mono uppercase">[ DRAG TO EDIT DEFAULT SPLIT. ALL DIRECT STOREFRONT TRANSACTIONS AUTOMATICALLY ROUTED BASED ON THESE VALUES. ]</p>

              <div className="space-y-1 text-left mt-3 pt-2">
                <label className="text-[9px] uppercase font-mono tracking-widest text-zinc-400">Digital Accreditation Scheme</label>
                <select
                  value={userProfile.label_digital_accreditation_scheme || 'LABEL_PROVIDES_INDEPENDENT_CODES'}
                  onChange={(e) => setUserProfile({ ...userProfile, label_digital_accreditation_scheme: e.target.value })}
                  className="w-full bg-[#0c0e12] border border-[#1A1A1A] text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-[#f97316] font-mono text-xs select-none"
                >
                  {['LABEL_PROVIDES_INDEPENDENT_CODES', 'PLATFORM_GENERATES_AUTOMATICALLY'].map((t, tIdx) => (
                    <option key={`${t}-${tIdx}`} value={t} className="bg-black text-xs">{t.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* SECTION E: TAXONOMY */}
          <div className="space-y-4 bg-zinc-950/40 p-4 rounded-xl border border-[#1A1A1A]">
            <h4 className="text-[10px] uppercase font-mono tracking-widest text-[#f97316] font-bold">
              [ Section E: Label's Genre Preferences ]
            </h4>
            
            <div className="space-y-4">
              {[
                {
                  name: 'CLUSTER 01: EXTREME METAL',
                  genres: ['DEATH METAL', 'SLAMMING BDM', 'BRUTAL DEATH METAL', 'BRUTAL DEATHCORE', 'TECHNICAL BDM', 'DEATH N\' ROLL', 'TECH DEATH', 'BLASTING BDM', 'GRINDCORE', 'DEATHGRIND', 'GOREGRIND/PORNOGRIND', 'THRASH METAL', 'DEATH THRASH', 'MELODIC DEATH', 'OSDM', 'DOOM', 'BLACK METAL', 'BLACKENED DEATH', 'SYMPHONIC BLACK', 'DEATHCORE', 'PROGRESSIVE DEATH']
                },
                {
                  name: 'CLUSTER 02: ROCK/HEAVY METAL',
                  genres: ['TRADITIONAL HEAVY METAL', 'DOOM METAL', 'STONER METAL', 'SLUDGE METAL', 'STONER ROCK', 'PROG METAL', 'POWER METAL', 'ALTERNATIVE ROCK', 'GOTHIC ROCK', 'HARD ROCK', 'NEW WAVE', 'FOLK METAL', 'AVANT-GARDE', 'DJENT', 'MATHCORE', 'MATH ROCK', 'SHOE GAZE', 'NOISE ROCK', 'INDIE ROCK', 'NU METAL']
                },
                {
                  name: 'CLUSTER 03: HARDCORE',
                  genres: ['TRADITIONAL HARDCORE', 'METALCORE', 'BEATDOWN', 'YOUTH CREW', 'FASTCORE', 'POST HARDCORE', 'MELODIC HARDCORE', 'SKRAMZ/SCREAMO', 'POWER VIOLENCE', 'MINCECORE']
                },
                {
                  name: 'CLUSTER 04: PUNK/ALTERNATIVE',
                  genres: ['PUNK ROCK', 'POP PUNK', 'MATH ROCK', 'MIDWEST EMO', 'SKATE PUNK', 'MELODIC PUNK', 'INDIE PUNK', 'POST PUNK', 'GRUNGE']
                },
                {
                  name: 'CLUSTER 05: INDUSTRIAL/EDM',
                  genres: ['EBM', 'SYNTHWAVE', 'DARKWAVE/COLD WAVE', 'AGGROTECH/TERROR EBM', 'TECHNO', 'INDUSTRIAL METAL', 'DUBSTEP', 'DRUM & BASS', 'GABBER/HARDSTYLE', 'BREAKCORE', 'HARSH NOISE WALL', 'WITCH HOUSE']
                },
                {
                  name: 'CLUSTER 06: HIP HOP/RAP',
                  genres: ['UNDERGROUND RAP', 'TRAP', 'BOOM BAP', 'PHONK', 'DRILL', 'CLOUD RAP', 'EXPERIMENTAL', 'GRIME']
                }
              ].map((cluster, idx) => {
                const currentGenres = userProfile.label_genres || [];
                const activeInCluster = cluster.genres.filter(genre => currentGenres.includes(genre));
                const isExpanded = !!expandedClusters[cluster.name];
                
                return (
                  <div key={`${cluster.name}-${idx}`} className="p-3 bg-black border border-zinc-900 rounded-lg space-y-3">
                    <button
                      type="button"
                      onClick={() => setExpandedClusters(prev => {
                        const wasExpanded = !!prev[cluster.name];
                        return { [cluster.name]: !wasExpanded };
                      })}
                      className="w-full flex items-center justify-between text-left select-none group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[8.5px] font-mono text-zinc-400 font-bold uppercase tracking-wider group-hover:text-[#f97316] transition-colors">
                          {cluster.name}
                        </span>
                        {activeInCluster.length > 0 && (
                          <span className="text-[8px] font-mono bg-[#f97316]/10 border border-[#f97316]/20 text-[#f97316] px-1.5 py-0.5 rounded-full leading-none">
                            {activeInCluster.length} ACTIVE
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500 group-hover:text-zinc-400 transition-colors">
                        {isExpanded ? '[ COLLAPSE ]' : '[ EXPAND ]'}
                      </span>
                    </button>
                    
                    {isExpanded && (
                      <div className="flex flex-wrap gap-1.5 pt-1 animate-fade-in">
                        {cluster.genres.map((genre, idx) => {
                          const isActive = currentGenres.includes(genre);
                          return (
                            <button
                              key={`${genre}-${idx}`}
                              type="button"
                              onClick={() => {
                                const updated = isActive 
                                  ? currentGenres.filter(x => x !== genre) 
                                  : [...currentGenres, genre];
                                setUserProfile({ ...userProfile, label_genres: updated });
                              }}
                              className={`px-2 py-0.5 text-[8px] font-mono uppercase tracking-wider rounded border transition-all cursor-pointer ${
                                isActive 
                                  ? 'bg-[#f97316]/15 border-[#f97316] text-[#f97316] shadow-sm shadow-[#f97316]/10'
                                  : 'bg-[#0a0c10] border-zinc-900 text-zinc-550 hover:border-zinc-800 hover:text-zinc-400'
                              }`}
                            >
                              {genre}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION F: MERCHANT KEYS */}
          <div className="space-y-4 bg-zinc-950/40 p-4 rounded-xl border border-[#1A1A1A]">
            <h4 className="text-[10px] uppercase font-mono tracking-widest text-[#f97316] font-bold">
              [ Section F: Merchant Payout Accounts & OAuth Connections ]
            </h4>
            
            {activeClearanceLevel < 5 && (
              <div className="p-3 bg-red-950/15 border border-red-950/40 rounded-xl text-red-400 text-[10px] leading-relaxed font-sans text-left">
                ⚠️ <strong>FINANCIAL ACCOUNT LOCKOUT:</strong> Level 5 Owner privilege is required to disconnect or update merchant payout routers. Level {activeClearanceLevel} has view-only telemetry rights over billing parameters.
              </div>
            )}
            
            <div className="space-y-4">
              {/* Stripe Area */}
              <StripeConnectPayoutSection
                userProfile={userProfile}
                setUserProfile={setUserProfile}
                triggerNotification={(msg) => showLocalToast(msg)}
                showLocalToast={showLocalToast}
                role="label"
                theme="orange"
                clearanceLevel={activeClearanceLevel}
              />

              {/* PayPal Area */}
              <div className="p-4 bg-black border border-zinc-900 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Banknote className="w-4 h-4 text-sky-400" />
                    <span className="text-[10px] font-mono text-white font-bold uppercase">PayPal Business Wallet</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded font-mono text-[8.5px] font-bold ${
                    userProfile.label_paypal_connected && userProfile.paypal_email
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                  }`}>
                    {userProfile.label_paypal_connected && userProfile.paypal_email ? '● LIVE SYNCED' : '○ DISCONNECTED'}
                  </span>
                </div>

                {userProfile.paypal_email ? (
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between bg-[#0c0e12] border border-zinc-900 p-3 rounded-lg text-left">
                      <div className="min-w-0">
                        <span className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-wider block">Connected PayPal Account</span>
                        <span className="text-xs font-mono text-sky-400 font-bold truncate block">{userProfile.paypal_email}</span>
                      </div>
                      <button
                        type="button"
                        disabled={activeClearanceLevel < 5}
                        onClick={() => {
                          setUserProfile({
                            ...userProfile,
                            paypal_email: '',
                            label_paypal_connected: false
                          });
                          showLocalToast("PayPal Account disconnected.");
                        }}
                        className="text-[9.5px] font-mono text-red-400 hover:text-red-300 font-bold px-2.5 py-1.5 bg-red-950/20 border border-red-950/40 rounded transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={activeClearanceLevel < 5}
                      onClick={() => {
                        setLabelOAuthProcessor({ id: 'paypal', name: 'PayPal' });
                        setLabelOAuthStep(0);
                      }}
                      className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-mono font-bold uppercase text-[9.5px] tracking-widest rounded-lg flex items-center justify-center gap-1.5 transition duration-150 cursor-pointer shadow-md shadow-sky-500/10 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                      <Banknote className="w-3.5 h-3.5" />
                      Connect PayPal via OAuth
                    </button>
                  </div>
                )}
              </div>

              {/* Deferred Checkbox */}
              <div className="flex items-center gap-2.5 p-1 text-left">
                <input
                  id="payment-deferred-switch"
                  type="checkbox"
                  checked={!!userProfile.label_setup_payment_later}
                  onChange={(e) => setUserProfile({ ...userProfile, label_setup_payment_later: e.target.checked })}
                  className="w-4 h-4 rounded accent-[#f97316] bg-[#0c0e12] border-zinc-900 cursor-pointer"
                />
                <label htmlFor="payment-deferred-switch" className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider cursor-pointer">
                  Deferred: setup direct checking gateways at payout phase
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1A1A1A] flex justify-end gap-3 bg-zinc-950/60">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-zinc-900 text-zinc-400 font-mono text-xs rounded border border-zinc-850 hover:bg-zinc-800 hover:text-white font-bold transition-all cursor-pointer"
          >
            DISCARD EDITS
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-[#f97316] text-black font-black font-mono text-xs tracking-widest rounded hover:bg-orange-400 font-bold transition-all shadow-md shadow-[#f97316]/10 cursor-pointer"
          >
            COMMIT STATE
          </button>
        </div>
      </div>
    </div>
  );
};
