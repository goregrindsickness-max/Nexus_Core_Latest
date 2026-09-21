import React, { useState, useEffect } from 'react';
import { RefreshCw, Plus, X, ShieldCheck, CheckCircle2, Upload, FileText, Truck, Shirt, AlertCircle, Sparkles, Layers, Users } from 'lucide-react';
import { COUNTRIES, US_STATES } from '../../constants/location';
import { MASTER_GENRES } from '../../constants/genres';
import { uploadBase64ToStorage } from '../../supabase';
import { communityBandManager, CommunityBandRecord } from '../../lib/communityBands';

export interface BandRegistrationSectionProps {
  bandSectionAOpen: boolean;
  setBandSectionAOpen: (val: boolean) => void;
  bandSectionBOpen: boolean;
  setBandSectionBOpen: (val: boolean) => void;
  bandSectionCOpen: boolean;
  setBandSectionCOpen: (val: boolean) => void;
  bandName: string;
  setBandName: (val: string) => void;
  bandCity: string;
  setBandCity: (val: string) => void;
  bandCountry: string;
  setBandCountry: (val: string) => void;
  bandStateProvince: string;
  setBandStateProvince: (val: string) => void;
  bandGenre: string;
  setBandGenre: (val: string) => void;
  bandTags: string[];
  setBandTags: React.Dispatch<React.SetStateAction<string[]>>;
  bandRoster: { name: string, role: string, access: string }[];
  setBandRoster: React.Dispatch<React.SetStateAction<{ name: string, role: string, access: string }[]>>;
  bandBiography: string;
  setBandBiography: (val: string) => void;
  bandCustomUrl: string;
  setBandCustomUrl: (val: string) => void;
  bandSocialOpen: boolean;
  setBandSocialOpen: (val: boolean) => void;
  bandInstagram: string;
  setBandInstagram: (val: string) => void;
  bandSpotify: string;
  setBandSpotify: (val: string) => void;
  bandYoutubeVideo: string;
  setBandYoutubeVideo: (val: string) => void;
  bandBandcamp: string;
  setBandBandcamp: (val: string) => void;
  bandMetalArchivesUrl: string;
  setBandMetalArchivesUrl: (val: string) => void;
  bandWebsite: string;
  setBandWebsite: (val: string) => void;
  bandMyRole: string;
  setBandMyRole: (val: string) => void;
  bandFormationYear: string;
  setBandFormationYear: (val: string) => void;
  bandPrimaryEmail: string;
  setBandPrimaryEmail: (val: string) => void;
  bandPhone: string;
  setBandPhone: (val: string) => void;
  bandRecordLabel: string;
  setBandRecordLabel: (val: string) => void;
  bandLegalName: string;
  setBandLegalName: (val: string) => void;
  bandTaxId: string;
  setBandTaxId: (val: string) => void;
  bandLegalType: string;
  setBandLegalType: (val: string) => void;
  bandStripeConnected: boolean;
  setBandStripeConnected: (val: boolean) => void;
  bandPaypalConnected: boolean;
  setBandPaypalConnected: (val: boolean) => void;
  bandSetupPaymentLater: boolean;
  setBandSetupPaymentLater: (val: boolean) => void;
  // Extended fields
  selectedApparelSizes?: string[];
  setSelectedApparelSizes?: (sizes: string[]) => void;
  touringVehicle?: string;
  setTouringVehicle?: (val: string) => void;
  bandTechRider?: string;
  setBandTechRider?: (val: string) => void;
  bandIsVerified?: boolean;
  setBandIsVerified?: (val: boolean) => void;
  bandVerificationPlatform?: string;
  setBandVerificationPlatform?: (val: string) => void;
}

export const BandRegistrationSection: React.FC<BandRegistrationSectionProps> = ({
  bandSectionAOpen,
  setBandSectionAOpen,
  bandSectionBOpen,
  setBandSectionBOpen,
  bandSectionCOpen,
  setBandSectionCOpen,
  bandName,
  setBandName,
  bandCity,
  setBandCity,
  bandCountry,
  setBandCountry,
  bandStateProvince,
  setBandStateProvince,
  bandGenre,
  setBandGenre,
  bandTags,
  setBandTags,
  bandRoster,
  setBandRoster,
  bandBiography,
  setBandBiography,
  bandCustomUrl,
  setBandCustomUrl,
  bandSocialOpen,
  setBandSocialOpen,
  bandInstagram,
  setBandInstagram,
  bandSpotify,
  setBandSpotify,
  bandYoutubeVideo,
  setBandYoutubeVideo,
  bandBandcamp,
  setBandBandcamp,
  bandMetalArchivesUrl,
  setBandMetalArchivesUrl,
  bandWebsite,
  setBandWebsite,
  bandMyRole,
  setBandMyRole,
  bandFormationYear,
  setBandFormationYear,
  bandPrimaryEmail,
  setBandPrimaryEmail,
  bandPhone,
  setBandPhone,
  bandRecordLabel,
  setBandRecordLabel,
  bandLegalName,
  setBandLegalName,
  bandTaxId,
  setBandTaxId,
  bandLegalType,
  setBandLegalType,
  bandStripeConnected,
  setBandStripeConnected,
  bandPaypalConnected,
  setBandPaypalConnected,
  bandSetupPaymentLater,
  setBandSetupPaymentLater,
  selectedApparelSizes = ['S', 'M', 'L', 'XL', '2XL'],
  setSelectedApparelSizes,
  touringVehicle = 'Van',
  setTouringVehicle,
  bandTechRider = '',
  setBandTechRider,
  bandIsVerified = true,
  setBandIsVerified,
  bandVerificationPlatform = 'Official Band Direct Registration',
  setBandVerificationPlatform,
}) => {
  const allSizes = ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];

  const [matchedArchive, setMatchedArchive] = useState<CommunityBandRecord | null>(null);
  const [claimModeChoice, setClaimModeChoice] = useState<'adopt' | 'clean' | 'none'>('none');
  const [claimedNotice, setClaimedNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!bandName || bandName.trim().length < 2) {
      setMatchedArchive(null);
      return;
    }
    const found = communityBandManager.findByName(bandName);
    if (found && found.verification_status === 'community_archive') {
      setMatchedArchive(found);
    } else {
      setMatchedArchive(null);
    }
  }, [bandName]);

  const handleAdoptArchive = (archive: CommunityBandRecord) => {
    setClaimModeChoice('adopt');
    if (archive.city && setBandCity) setBandCity(archive.city);
    if (archive.country && setBandCountry) setBandCountry(archive.country);
    if (archive.state && setBandStateProvince) setBandStateProvince(archive.state);
    if (archive.genre && setBandGenre) setBandGenre(archive.genre);
    if (archive.bio && setBandBiography) setBandBiography(archive.bio);
    if (archive.spotify_url && setBandSpotify) setBandSpotify(archive.spotify_url);
    if (archive.bandcamp_url && setBandBandcamp) setBandBandcamp(archive.bandcamp_url);
    if (archive.metal_archives_url && setBandMetalArchivesUrl) setBandMetalArchivesUrl(archive.metal_archives_url);
    if (archive.subgenres && setBandTags) setBandTags(archive.subgenres);
    setClaimedNotice(`Adopted ${archive.name} archive foundation! (${archive.followers_count || 120} followers & discography linked)`);
  };

  const handleCleanSlate = (archive: CommunityBandRecord) => {
    setClaimModeChoice('clean');
    if (setBandBiography) setBandBiography('');
    setClaimedNotice(`Claimed official handle for ${archive.name}! Starting with a clean official slate while inheriting ${archive.followers_count || 120} followers.`);
  };

  return (
    <div className="px-0 py-4 space-y-4 bg-[#0a0a0c] w-full">
      {/* STEP A MODULE */}
      <div className="w-full border-y border-emerald-900/40 overflow-hidden bg-zinc-950/20">
        <div 
          className="bg-emerald-950/20 p-3.5 flex justify-between items-center cursor-pointer hover:bg-emerald-950/30 transition-colors border-b border-emerald-900/40"
          onClick={() => setBandSectionAOpen(!bandSectionAOpen)}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xs">⚡</span>
            <h4 className="text-[10px] font-bold tracking-wider uppercase text-emerald-400">
              Section A: Primary Sonic Identity & Official Verification
            </h4>
          </div>
          <span className="text-zinc-500 text-[9px] font-mono">
            {bandSectionAOpen ? 'COLLAPSE [-]' : 'EXPAND [+]'}
          </span>
        </div>
        {bandSectionAOpen && (
          <div className="p-4 space-y-4 bg-black/30">
            {/* OFFICIAL VERIFICATION BLOCK */}
            <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/40 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] font-mono font-bold text-emerald-300 uppercase tracking-wider">
                    Official Artist Account Verification
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={bandIsVerified}
                      onChange={(e) => setBandIsVerified && setBandIsVerified(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                  <span className="text-[9px] font-mono text-emerald-400 font-bold">
                    {bandIsVerified ? 'VERIFIED OFFICIAL' : 'UNVERIFIED'}
                  </span>
                </div>
              </div>
              <p className="text-[9px] text-zinc-400 font-mono">
                Confirms this workspace as an official, band-operated entity (not fan-managed) to grant full administrative rights & verified badge immediately.
              </p>
              {bandIsVerified && (
                <div className="pt-2 border-t border-emerald-900/50 grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                  <div>
                    <label className="text-[8px] font-mono text-zinc-500 uppercase">Verification Method</label>
                    <select
                      value={bandVerificationPlatform}
                      onChange={(e) => setBandVerificationPlatform && setBandVerificationPlatform(e.target.value)}
                      className="w-full bg-zinc-950 border border-emerald-900/60 rounded p-2 text-[10px] font-mono text-emerald-400 focus:border-emerald-500 outline-none"
                    >
                      <option value="Official Band Direct Registration">Official Band Direct Registration</option>
                      <option value="Official Spotify Artist Page Link">Official Spotify Artist Page Link</option>
                      <option value="Metal Archives / Bandcamp Verified">Metal Archives / Bandcamp Verified</option>
                      <option value="Direct Management / Record Label Owner">Direct Management / Record Label Owner</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 pt-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-[9px] font-mono text-emerald-300 font-bold">
                      [ ✓ LEGITIMATE OFFICIAL BAND PROFILE CONFIRMED ]
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Artist / Band Name</label>
                  {matchedArchive && (
                    <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30 animate-pulse">
                      COMMUNITY ARCHIVE FOUND
                    </span>
                  )}
                </div>
                <input 
                  type="text" 
                  placeholder="ENTER OFFICIAL BAND NAME"
                  value={bandName}
                  onChange={(e) => {
                    setBandName(e.target.value);
                    setClaimModeChoice('none');
                    setClaimedNotice(null);
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-emerald-400 focus:border-emerald-500 outline-none placeholder-zinc-700"
                />

                {/* REAL-TIME COLLISION / COMMUNITY ARCHIVE ALERT */}
                {matchedArchive && (
                  <div className="p-3 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-zinc-900 to-amber-950/30 space-y-2.5 animate-in fade-in slide-in-from-top-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-amber-400 shrink-0" />
                        <div>
                          <span className="text-xs font-bold text-white font-mono block">
                            Fan Archive Detected: "{matchedArchive.name}"
                          </span>
                          <span className="text-[10px] text-zinc-400 font-sans">
                            {matchedArchive.followers_count || 120} followers • {matchedArchive.discography?.length || 0} catalog releases • Curated by {matchedArchive.curated_by || 'Fan Community'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {claimedNotice ? (
                      <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-[10px] font-mono text-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        {claimedNotice}
                      </div>
                    ) : (
                      <div className="space-y-2 pt-1 border-t border-zinc-800">
                        <span className="text-[9px] font-mono font-bold text-zinc-300 uppercase block">
                          Are you an official band member or manager? Claim this page:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleAdoptArchive(matchedArchive)}
                            className="p-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/50 text-emerald-300 font-mono text-[10px] font-bold text-left flex items-center justify-between cursor-pointer transition-all"
                          >
                            <span className="flex items-center gap-1.5">
                              <Layers className="w-3 h-3 text-emerald-400" />
                              Adopt & Keep Fan Data
                            </span>
                            <span className="text-[8px] bg-emerald-800/60 px-1 py-0.2 rounded uppercase">Fast</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCleanSlate(matchedArchive)}
                            className="p-2 rounded-lg bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/50 text-purple-300 font-mono text-[10px] font-bold text-left flex items-center justify-between cursor-pointer transition-all"
                          >
                            <span className="flex items-center gap-1.5">
                              <Sparkles className="w-3 h-3 text-purple-400" />
                              Clean Slate (Fresh Start)
                            </span>
                            <span className="text-[8px] bg-purple-800/60 px-1 py-0.2 rounded uppercase">Fresh</span>
                          </button>
                        </div>
                        <p className="text-[9px] text-zinc-500 italic">
                          * Both options preserve all existing followers, subscribers, and community tags for your official launch.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Hometown City</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Austin"
                    value={bandCity}
                    onChange={(e) => setBandCity(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-emerald-400 focus:border-emerald-500 outline-none placeholder-zinc-700"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Country</label>
                  <select 
                    value={bandCountry}
                    onChange={(e) => setBandCountry(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-emerald-400 focus:border-emerald-500 outline-none"
                  >
                    {COUNTRIES.map((c, cIdx) => (
                      <option key={`${c.code}-${cIdx}`} value={c.code}>{c.name.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>

              {(bandCountry === 'USA' || bandCountry === 'US') && (
                <div className="space-y-1.5 text-left">
                  <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">State</label>
                  <select 
                    value={bandStateProvince}
                    onChange={(e) => setBandStateProvince(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-emerald-400 focus:border-emerald-500 outline-none"
                  >
                    <option value="">SELECT STATE...</option>
                    {US_STATES.map((st, idx) => (
                      <option key={`${st.code}-${idx}`} value={st.code}>{st.name.toUpperCase()} ({st.code})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Primary Sonic Classification</label>
                  <select 
                    value={bandGenre}
                    onChange={(e) => {
                      setBandGenre(e.target.value);
                      const cluster = MASTER_GENRES.find(c => c.name === e.target.value);
                      if (cluster && cluster.tags.length > 0) {
                        setBandTags([cluster.tags[0].label]);
                      } else {
                        setBandTags([]);
                      }
                    }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-emerald-400 focus:border-emerald-500 outline-none"
                  >
                    <option value="">SELECT CLASSIFICATION...</option>
                    {MASTER_GENRES.map((g, gIdx) => (
                      <option key={`${g.name}-${gIdx}`} value={g.name}>{g.name}</option>
                    ))}
                  </select>
                </div>

                {bandGenre && (
                  <div className="space-y-1.5 text-left">
                    <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Genre Tags (Select up to 3)</label>
                    <div className="flex flex-wrap gap-1.5 p-2 bg-zinc-950 border border-zinc-800 rounded max-h-24 overflow-y-auto">
                      {MASTER_GENRES.find(c => c.name === bandGenre)?.tags.map((tagObj, idx) => {
                        const tag = tagObj.label;
                        const isSelected = bandTags.includes(tag);
                        return (
                          <button
                            key={`${tagObj.id}-${idx}`}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setBandTags(bandTags.filter(t => t !== tag));
                              } else {
                                if (bandTags.length < 3) {
                                  setBandTags([...bandTags, tag]);
                                }
                              }
                            }}
                            className={`text-[9px] font-mono px-2 py-0.5 rounded border transition-colors ${
                              isSelected 
                                ? 'bg-emerald-950 border-emerald-500 text-emerald-400 font-bold' 
                                : 'bg-black/50 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                            }`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase flex items-center justify-between">
                  <span>Current Band Members / Roster</span>
                  <button 
                    type="button" 
                    onClick={() => setBandRoster([...bandRoster, { name: '', role: '', access: 'Band Member' }])} 
                    className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" /> ADD MEMBER
                  </button>
                </label>
                <div className="space-y-2">
                  {bandRoster.map((member, index) => (
                    <div key={`reg-member-row-${index}`} className="flex flex-col sm:flex-row gap-2 bg-zinc-900/50 p-2 border border-zinc-800 rounded">
                      <input 
                        type="text" 
                        placeholder="Member Name"
                        value={member.name}
                        onChange={(e) => {
                          const newRoster = [...bandRoster];
                          newRoster[index].name = e.target.value;
                          setBandRoster(newRoster);
                        }}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs font-mono text-emerald-400 focus:border-emerald-500 outline-none placeholder-zinc-700"
                      />
                      <input 
                        type="text" 
                        placeholder="Role / Instrument"
                        value={member.role}
                        onChange={(e) => {
                          const newRoster = [...bandRoster];
                          newRoster[index].role = e.target.value;
                          setBandRoster(newRoster);
                        }}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs font-mono text-emerald-400 focus:border-emerald-500 outline-none placeholder-zinc-700"
                      />
                      <select
                        value={member.access}
                        onChange={(e) => {
                          const newRoster = [...bandRoster];
                          newRoster[index].access = e.target.value;
                          setBandRoster(newRoster);
                        }}
                        className="w-full sm:w-auto bg-zinc-950 border border-zinc-800 rounded p-2 text-xs font-mono text-emerald-400 focus:border-emerald-500 outline-none"
                      >
                        <option value="Band Member">Band Member</option>
                        <option value="Admin">Admin</option>
                        <option value="View Only">View Only</option>
                      </select>
                      <button 
                        type="button" 
                        onClick={() => setBandRoster(bandRoster.filter((_, i) => i !== index))} 
                        className="p-2 text-zinc-500 hover:text-emerald-400 bg-zinc-950 border border-zinc-800 rounded transition-colors flex items-center justify-center shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {bandRoster.length === 0 && (
                    <div className="text-[10px] text-zinc-500 font-mono italic p-4 text-center border border-zinc-800 border-dashed rounded">
                      No members added yet. Click 'ADD MEMBER' to build your roster.
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Biography / Lineage</label>
                <textarea 
                  rows={3}
                  placeholder="SHORT BAND BIO & HISTORY..."
                  value={bandBiography}
                  onChange={(e) => setBandBiography(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-emerald-400 focus:border-emerald-500 outline-none placeholder-zinc-700 resize-none"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Custom URL Handle</label>
                <div className="flex items-center">
                  <span className="bg-zinc-900 border border-r-0 border-zinc-800 rounded-l p-2.5 text-xs font-mono text-zinc-500">/</span>
                  <input 
                    type="text" 
                    placeholder="mybandname"
                    value={bandCustomUrl}
                    onChange={(e) => setBandCustomUrl(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-r p-2.5 text-xs font-mono text-emerald-400 focus:border-emerald-500 outline-none placeholder-zinc-700"
                  />
                </div>
              </div>
            </div>

            {/* Socials & Streaming Node Collapsible */}
            <div className="border border-zinc-800/60 rounded-lg p-3 bg-zinc-950/30">
              <div 
                className="flex items-center justify-between cursor-pointer group"
                onClick={() => setBandSocialOpen(!bandSocialOpen)}
              >
                <span className="text-[8px] font-mono font-bold text-zinc-400 uppercase tracking-widest cursor-pointer">
                  🌐 Socials & Streaming Links
                </span>
                <span className="text-zinc-500 text-[10px] group-hover:text-emerald-400 transition-colors">
                  {bandSocialOpen ? '▼' : '▶'}
                </span>
              </div>
              {bandSocialOpen && (
                <div className="mt-3 space-y-3 pt-3 border-t border-zinc-900">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Instagram Handle</label>
                    <input 
                      type="text" 
                      placeholder="@HANDLE"
                      value={bandInstagram}
                      onChange={(e) => setBandInstagram(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-emerald-400 focus:border-emerald-500 outline-none placeholder-zinc-700"
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Spotify Artist URL</label>
                    <input 
                      type="url" 
                      placeholder="HTTPS://OPEN.SPOTIFY.COM/ARTIST/..."
                      value={bandSpotify}
                      onChange={(e) => setBandSpotify(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-emerald-400 focus:border-emerald-500 outline-none placeholder-zinc-700"
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">YouTube Featured Video Link</label>
                    <input 
                      type="url" 
                      placeholder="HTTPS://YOUTUBE.COM/WATCH?V=..."
                      value={bandYoutubeVideo}
                      onChange={(e) => setBandYoutubeVideo(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-emerald-400 focus:border-emerald-500 outline-none placeholder-zinc-700"
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Bandcamp URL</label>
                    <input 
                      type="url" 
                      placeholder="HTTPS://BANDNAME.BANDCAMP.COM"
                      value={bandBandcamp}
                      onChange={(e) => setBandBandcamp(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-emerald-400 focus:border-emerald-500 outline-none placeholder-zinc-700"
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Metal Archives URL</label>
                    <input 
                      type="url" 
                      placeholder="HTTPS://WWW.METAL-ARCHIVES.COM/BANDS/..."
                      value={bandMetalArchivesUrl}
                      onChange={(e) => setBandMetalArchivesUrl(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-emerald-400 focus:border-emerald-500 outline-none placeholder-zinc-700"
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Official Website URL</label>
                    <input 
                      type="url" 
                      placeholder="HTTPS://DOMAIN.COM"
                      value={bandWebsite}
                      onChange={(e) => setBandWebsite(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-emerald-400 focus:border-emerald-500 outline-none placeholder-zinc-700"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* STEP B MODULE (Collapsed by default) */}
      <div className="w-full border-y border-emerald-900/40 overflow-hidden bg-zinc-950/20">
        <div 
          className="bg-emerald-950/20 p-3.5 flex justify-between items-center cursor-pointer hover:bg-emerald-950/30 transition-colors border-b border-emerald-900/40"
          onClick={() => setBandSectionBOpen(!bandSectionBOpen)}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xs">⚖️</span>
            <h4 className="text-[10px] font-bold tracking-wider uppercase text-emerald-400">
              Section B: Operations, Sizing, Logistics & Tech Rider
            </h4>
          </div>
          <span className="text-zinc-500 text-[9px] font-mono">
            {bandSectionBOpen ? 'COLLAPSE [-]' : 'EXPAND [+]'}
          </span>
        </div>
        {bandSectionBOpen && (
          <div className="p-4 space-y-4 bg-black/30">
            {/* DEFAULT APPAREL SIZES */}
            <div className="space-y-1.5 text-left">
              <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase flex items-center gap-1.5">
                <Shirt className="w-3 h-3 text-emerald-400" />
                <span>Default Apparel Sizes Offered</span>
              </label>
              <div className="flex flex-wrap gap-2 p-2.5 bg-zinc-950 border border-zinc-800 rounded">
                {allSizes.map((sz, idx) => {
                  const isSelected = selectedApparelSizes.includes(sz);
                  return (
                    <button
                      key={`${sz}-${idx}`}
                      type="button"
                      onClick={() => {
                        if (setSelectedApparelSizes) {
                          if (isSelected) {
                            setSelectedApparelSizes(selectedApparelSizes.filter(s => s !== sz));
                          } else {
                            setSelectedApparelSizes([...selectedApparelSizes, sz]);
                          }
                        }
                      }}
                      className={`text-[10px] font-mono font-bold px-3 py-1 rounded border transition-colors ${
                        isSelected 
                          ? 'bg-emerald-950 border-emerald-500 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.2)]' 
                          : 'bg-black/60 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TOUR VEHICLE & LOGISTICS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase flex items-center gap-1.5">
                  <Truck className="w-3 h-3 text-emerald-400" />
                  <span>Tour Vehicle Dropdown</span>
                </label>
                <select 
                  value={touringVehicle}
                  onChange={(e) => setTouringVehicle && setTouringVehicle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-emerald-400 focus:border-emerald-500 outline-none"
                >
                  <option value="Van">VAN (Cargo / Passenger)</option>
                  <option value="Sprinter">SPRINTER VAN</option>
                  <option value="Tour Bus">TOUR BUS</option>
                  <option value="SUV">SUV / CROSSOVER</option>
                  <option value="Car / Sedan">CAR / SEDAN</option>
                  <option value="Trailer Only">TRAILER ONLY</option>
                  <option value="None / Fly-in">NONE / FLY-IN SHOWS ONLY</option>
                </select>
              </div>

              {/* TECH RIDER & STAGE PLOT FILE UPLOADER */}
              <div className="space-y-1.5 text-left">
                <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3 h-3 text-emerald-400" />
                    <span>Tech Rider & Stage Plot</span>
                  </span>
                  {bandTechRider && <span className="text-emerald-400 text-[8px] font-mono font-bold">✓ DOCUMENT ATTACHED</span>}
                </label>
                <div className="flex gap-2">
                  <input 
                    type="url" 
                    placeholder="Document URL or Google Drive link..."
                    value={bandTechRider}
                    onChange={(e) => setBandTechRider && setBandTechRider(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-emerald-400 focus:border-emerald-500 outline-none placeholder-zinc-700"
                  />
                  <label className="shrink-0 bg-emerald-950/80 border border-emerald-500/50 hover:bg-emerald-900 text-emerald-400 px-3 py-2 rounded text-[10px] font-mono font-bold cursor-pointer flex items-center gap-1.5 transition-colors">
                    <Upload className="w-3 h-3" />
                    <span>UPLOAD</span>
                    <input 
                      type="file" 
                      accept=".pdf,.doc,.docx,.png,.jpg"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = async (evt) => {
                            const base64 = evt.target?.result as string;
                            const uploadedUrl = await uploadBase64ToStorage(base64, 'documents', 'band-rider', file.name.replace(/[^a-zA-Z0-9.-]/g, '_'));
                            if (uploadedUrl && setBandTechRider) {
                              setBandTechRider(uploadedUrl);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">My Role in Band</label>
                <input 
                  type="text" 
                  placeholder="e.g. Lead Guitarist / Manager"
                  value={bandMyRole}
                  onChange={(e) => setBandMyRole(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-emerald-400 focus:border-emerald-500 outline-none placeholder-zinc-700"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Formation Year</label>
                <input 
                  type="number" 
                  placeholder="e.g. 2018"
                  value={bandFormationYear}
                  onChange={(e) => setBandFormationYear(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-emerald-400 focus:border-emerald-500 outline-none placeholder-zinc-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Primary Band Contact Email</label>
                <input 
                  type="email" 
                  placeholder="BAND@DOMAIN.COM"
                  value={bandPrimaryEmail}
                  onChange={(e) => setBandPrimaryEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-emerald-400 focus:border-emerald-500 outline-none placeholder-zinc-700"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Booking / Management Phone</label>
                <input 
                  type="tel" 
                  placeholder="+1 (555) 000-0000"
                  value={bandPhone}
                  onChange={(e) => setBandPhone(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-emerald-400 focus:border-emerald-500 outline-none placeholder-zinc-700"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Record Label (If signed)</label>
              <input 
                type="text" 
                placeholder="e.g. Century Media / Independent"
                value={bandRecordLabel}
                onChange={(e) => setBandRecordLabel(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-emerald-400 focus:border-emerald-500 outline-none placeholder-zinc-700"
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Legal Entity Name (for tax/payouts)</label>
              <input 
                type="text" 
                placeholder="e.g. Heavy Riffs LLC"
                value={bandLegalName}
                onChange={(e) => setBandLegalName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-emerald-400 focus:border-emerald-500 outline-none placeholder-zinc-700"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Legal Entity Type</label>
                <select 
                  value={bandLegalType}
                  onChange={(e) => setBandLegalType(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-emerald-400 focus:border-emerald-500 outline-none"
                >
                  <option value="LLC">LLC</option>
                  <option value="PARTNERSHIP">PARTNERSHIP</option>
                  <option value="SOLE_PROPRIETORSHIP">SOLE PROPRIETORSHIP</option>
                  <option value="CORPORATION">CORPORATION</option>
                </select>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Tax Identification Number (EIN / SSN)</label>
                <input 
                  type="text" 
                  placeholder="XX-XXXXXXX"
                  value={bandTaxId}
                  onChange={(e) => setBandTaxId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs font-mono text-emerald-400 focus:border-emerald-500 outline-none placeholder-zinc-700"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* STEP C MODULE (Collapsed by default) */}
      <div className="w-full border-y border-emerald-900/40 overflow-hidden bg-zinc-950/20">
        <div 
          className="bg-emerald-950/20 p-3.5 flex justify-between items-center cursor-pointer hover:bg-emerald-950/30 transition-colors border-b border-emerald-900/40"
          onClick={() => setBandSectionCOpen(!bandSectionCOpen)}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xs">💳</span>
            <h4 className="text-[10px] font-bold tracking-wider uppercase text-emerald-400">
              Section C: Financial Routing & Payout Setup
            </h4>
          </div>
          <span className="text-zinc-500 text-[9px] font-mono">
            {bandSectionCOpen ? 'COLLAPSE [-]' : 'EXPAND [+]'}
          </span>
        </div>
        {bandSectionCOpen && (
          <div className="p-4 space-y-4 bg-black/30">
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setBandStripeConnected(true)}
                className={`w-full p-3 rounded border text-[10px] font-mono font-bold flex items-center justify-center gap-2 transition-colors ${
                  bandStripeConnected 
                    ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400' 
                    : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                }`}
              >
                <RefreshCw className="w-3 h-3 animate-spin-slow" />
                {bandStripeConnected ? '[ STRIPE MERCHANT CONNECTED ]' : 'AUTHORIZE STRIPE'}
              </button>
              
              <button
                type="button"
                onClick={() => setBandPaypalConnected(true)}
                className={`w-full p-3 rounded border text-[10px] font-mono font-bold flex items-center justify-center gap-2 transition-colors ${
                  bandPaypalConnected 
                    ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400' 
                    : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                }`}
              >
                <RefreshCw className="w-3 h-3 animate-spin-slow" />
                {bandPaypalConnected ? '[ PAYPAL MERCHANT CONNECTED ]' : 'AUTHORIZE PAYPAL'}
              </button>
              
              <label className="w-full p-3 rounded border bg-zinc-950 border-zinc-800 text-zinc-500 flex items-center justify-center gap-2 cursor-pointer hover:border-zinc-700 transition-colors">
                <input 
                  type="checkbox" 
                  checked={bandSetupPaymentLater}
                  onChange={(e) => setBandSetupPaymentLater(e.target.checked)}
                  className="w-3 h-3 accent-emerald-500 rounded border-zinc-700 cursor-pointer"
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

