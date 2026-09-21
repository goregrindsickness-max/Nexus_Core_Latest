import { getSupabase } from '../../../supabase';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  Plus,
  X,
  TrendingUp,
  PlayCircle,
  PlaySquare,
  Users,
  MessageCircle,
  Share2,
  Trash2,
  Send,
  Link as LinkIcon,
  Heart,
  Zap
} from 'lucide-react';
import { UploadClipModal } from './UploadClipModal';
import { calculateClipsDashboardStats } from '../utils/clipsPersistenceService';

export interface ClipsOverlaysModalProps {
  showClipsAnalyticsModal: boolean;
  setShowClipsAnalyticsModal: (val: boolean) => void;
  showMyClipsModal: boolean;
  setShowMyClipsModal: (val: boolean) => void;
  showUploadClipModal: boolean;
  setShowUploadClipModal: (val: boolean) => void;
  activeClipComments: any;
  setActiveClipComments: (val: any) => void;
  activeClipShare: any;
  setActiveClipShare: (val: any) => void;
  activeClipMetrics: any;
  setActiveClipMetrics: (val: any) => void;
  clips: any[];
  setClips?: React.Dispatch<React.SetStateAction<any[]>>;
  deleteClip?: (id: string) => void;
  newClipTitle: string;
  setNewClipTitle: (val: string) => void;
  newClipCaption: string;
  setNewClipCaption: (val: string) => void;
  newClipVideoUrl: string;
  setNewClipVideoUrl: (val: string) => void;
  newClipSongTitle: string;
  setNewClipSongTitle: (val: string) => void;
  newClipBandName: string;
  setNewClipBandName: (val: string) => void;
  newClipTags: string;
  setNewClipTags: (val: string) => void;
  selectedClipFile: File | null;
  setSelectedClipFile: (val: File | null) => void;
  userProfile: any;
  triggerNotification?: (msg: string) => void;
}

export const ClipsOverlaysModal: React.FC<ClipsOverlaysModalProps> = ({
  showClipsAnalyticsModal,
  setShowClipsAnalyticsModal,
  showMyClipsModal,
  setShowMyClipsModal,
  showUploadClipModal,
  setShowUploadClipModal,
  activeClipComments,
  setActiveClipComments,
  activeClipShare,
  setActiveClipShare,
  activeClipMetrics,
  setActiveClipMetrics,
  clips,
  setClips,
  deleteClip,
  newClipTitle,
  setNewClipTitle,
  newClipCaption,
  setNewClipCaption,
  newClipVideoUrl,
  setNewClipVideoUrl,
  newClipSongTitle,
  setNewClipSongTitle,
  newClipBandName,
  setNewClipBandName,
  newClipTags,
  setNewClipTags,
  selectedClipFile,
  setSelectedClipFile,
  userProfile,
  triggerNotification,
}) => {
  const [commentInputText, setCommentInputText] = useState('');
  const dashboardStats = calculateClipsDashboardStats(clips, userProfile?.id);
  const myClipsList = dashboardStats.activeClips;

  return (
    <>
      {/* Clips Analytics Modal */}
      <AnimatePresence>
        {showClipsAnalyticsModal && (
          <motion.div key="clips-analytics-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-[#121214] border border-zinc-900 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-900 bg-black sticky top-0 z-10">
                <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 font-display text-white">
                  <Activity className="w-4 h-4 text-emerald-400" /> Creator Dashboard: Clips Analytics
                </span>
                <button 
                  onClick={() => setShowClipsAnalyticsModal(false)}
                  className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-900/50 cursor-pointer transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="overflow-y-auto no-scrollbar p-4 space-y-4 bg-zinc-950">
                {/* Aggregate Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: 'Total Views', val: dashboardStats.totalViews.toLocaleString(), color: 'text-white' },
                    { label: 'Avg Engagement', val: dashboardStats.avgEngagementRate, color: 'text-emerald-400' },
                    { label: 'Total Likes', val: dashboardStats.totalLikes.toLocaleString(), color: 'text-rose-400' },
                    { label: 'Total Shares', val: dashboardStats.totalShares.toLocaleString(), color: 'text-cyan-400', icon: TrendingUp }
                  ].map((stat, i) => (
                    <div key={`stat-box-${stat.label}-${i}`} className="bg-black border border-zinc-900 p-3 rounded-xl flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] uppercase font-bold text-zinc-500 font-mono tracking-wider">{stat.label}</span>
                      <div className={`text-xl font-black mt-1 ${stat.color} flex items-center gap-1`}>
                        {stat.icon && <stat.icon className="w-4 h-4" />}
                        {stat.val}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-900 mt-2">
                  <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider">
                    Published Clips ({myClipsList.length})
                  </h3>
                  <button
                    onClick={() => {
                      setShowClipsAnalyticsModal(false);
                      setShowUploadClipModal(true);
                    }}
                    className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-rose-400 hover:text-rose-300"
                  >
                    <Plus className="w-3.5 h-3.5" /> Upload New
                  </button>
                </div>
                
                <div className="space-y-3">
                  {myClipsList.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
                      <PlaySquare className="w-8 h-8 text-zinc-600" />
                      <p className="text-xs text-zinc-400">No clips published yet</p>
                    </div>
                  ) : (
                    myClipsList.map((clip, idx) => (
                      <div key={clip.id ? `dash-clip-${clip.id}-${idx}` : `dash-clip-${idx}`} className="bg-black border border-zinc-900 rounded-xl p-3 flex flex-col sm:flex-row gap-4 items-center">
                        <div className="w-full sm:w-20 h-32 sm:h-20 bg-zinc-900 rounded-lg shrink-0 relative overflow-hidden flex items-center justify-center">
                          {clip.thumbnailUrl ? (
                            <img src={clip.thumbnailUrl} className="w-full h-full object-cover opacity-70" alt="" />
                          ) : clip.videoUrl ? (
                            <video src={clip.videoUrl} className="w-full h-full object-cover opacity-70" muted playsInline />
                          ) : (
                            <PlayCircle className="w-6 h-6 text-zinc-500" />
                          )}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <PlayCircle className="w-6 h-6 text-white/50" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0 w-full space-y-2">
                          <p className="text-xs text-white font-medium truncate">{clip.caption || clip.title || 'Untitled Clip'}</p>
                          <div className="grid grid-cols-4 gap-2 border-t border-zinc-900/50 pt-2">
                            <div className="flex flex-col">
                               <span className="text-[9px] uppercase font-bold text-zinc-500 font-mono">Views</span>
                               <span className="text-xs font-bold text-white">{Number(clip.views || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex flex-col">
                               <span className="text-[9px] uppercase font-bold text-zinc-500 font-mono">Likes</span>
                               <span className="text-xs font-bold text-rose-400">{Number(clip.likes || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex flex-col">
                               <span className="text-[9px] uppercase font-bold text-zinc-500 font-mono">Comments</span>
                               <span className="text-xs font-bold text-cyan-400">{Number(clip.comments || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex flex-col">
                               <span className="text-[9px] uppercase font-bold text-zinc-500 font-mono">Shares</span>
                               <span className="text-xs font-bold text-emerald-400">{Number(clip.shares || 0).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="w-full sm:w-auto mt-2 sm:mt-0 flex sm:flex-col gap-2 shrink-0">
                          <button 
                            onClick={() => triggerNotification?.(`Clip boosted across trending reels!`)}
                            className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-[10px] uppercase font-bold text-white px-3 py-2 rounded-lg transition-colors text-center"
                          >
                            Boost
                          </button>
                          {deleteClip && (
                            <button 
                              onClick={() => deleteClip(clip.id)}
                              className="flex-1 bg-rose-950/20 hover:bg-rose-900/30 text-[10px] uppercase font-bold text-rose-400 border border-rose-900/50 px-3 py-2 rounded-lg transition-colors text-center"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* My Clips Grid Modal */}
      <AnimatePresence>
        {showMyClipsModal && (
          <motion.div key="my-clips-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowMyClipsModal(false)}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#121214] border border-cyan-900/40 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-900 bg-black sticky top-0 z-10">
                <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 font-display text-cyan-400">
                  <PlaySquare className="w-4 h-4" /> My Clips Grid
                </span>
                <button 
                  onClick={() => setShowMyClipsModal(false)}
                  className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-900/50 cursor-pointer transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="overflow-y-auto no-scrollbar p-4 bg-zinc-950 flex-1">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {(() => {
                    const myRealClips = clips.filter(c => c.user_id === userProfile?.id || (userProfile?.name && c.creator === userProfile?.name));
                    
                    if (myRealClips.length === 0) {
                      return (
                        <div className="col-span-full py-16 flex flex-col items-center justify-center text-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
                            <PlaySquare className="w-8 h-8" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-zinc-200">No clips uploaded yet</h4>
                            <p className="text-xs text-zinc-500 mt-1 max-w-xs">Share your latest music performances, behind-the-scenes clips, or promotional videos with the network.</p>
                          </div>
                          <button 
                            onClick={() => {
                              setShowMyClipsModal(false);
                              setShowUploadClipModal(true);
                            }}
                            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                          >
                            Upload Your First Clip
                          </button>
                        </div>
                      );
                    }

                    return myRealClips.map((clip, clipIdx) => (
                      <div key={clip.id ? `my-clip-${clip.id}-${clipIdx}` : `my-clip-${clipIdx}`} className="relative aspect-[9/16] bg-zinc-900 rounded-xl overflow-hidden group border border-zinc-850 hover:border-cyan-500/50 transition-all">
                        {clip.videoUrl ? (
                          <video src={clip.videoUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" playsInline />
                        ) : (
                          <img src={clip.thumbnailUrl || "https://images.unsplash.com/photo-1540039155732-d6741b687c22?q=80&w=300"} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        
                        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between z-10">
                          <div className="flex flex-col gap-0.5">
                            <span className="flex items-center gap-1 text-[10px] font-bold text-white">
                              <PlayCircle className="w-3 h-3 text-cyan-400" /> {clip.views?.toLocaleString() || '100'}
                            </span>
                            <span className="flex items-center gap-1 text-[10px] font-bold text-white">
                              <Heart className="w-3 h-3 text-rose-400" /> {clip.likes?.toLocaleString() || '0'}
                            </span>
                          </div>
                          {clip.audio && (
                            <span className="bg-black/60 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold text-zinc-400 truncate max-w-[80px]">
                              {clip.audio.replace('Original Audio - ', '')}
                            </span>
                          )}
                        </div>

                        <div className="absolute top-2 right-2 flex gap-1 z-20">
                          <button 
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (window.confirm("Are you sure you want to permanently delete this clip?")) {
                                await deleteClip(clip.id);
                              }
                            }}
                            className="bg-black/80 p-2 rounded-full hover:bg-rose-600 border border-zinc-800 text-zinc-400 hover:text-white transition-all shadow-md cursor-pointer"
                            title="Delete Clip"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        
                        {clip.title && (
                          <div className="absolute top-2 left-2 max-w-[70%] bg-black/60 px-2 py-1 rounded text-[9px] font-bold text-white truncate font-mono z-10">
                            {clip.title}
                          </div>
                        )}
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Upload Clip Overlay Modal */}
      <UploadClipModal
        showUploadClipModal={showUploadClipModal}
        setShowUploadClipModal={setShowUploadClipModal}
        newClipVideoUrl={newClipVideoUrl}
        setNewClipVideoUrl={setNewClipVideoUrl}
        selectedClipFile={selectedClipFile}
        setSelectedClipFile={setSelectedClipFile}
        newClipCaption={newClipCaption}
        setNewClipCaption={setNewClipCaption}
        newClipTitle={newClipTitle}
        setNewClipTitle={setNewClipTitle}
        newClipSongTitle={newClipSongTitle}
        setNewClipSongTitle={setNewClipSongTitle}
        newClipBandName={newClipBandName}
        setNewClipBandName={setNewClipBandName}
        newClipTags={newClipTags}
        setNewClipTags={setNewClipTags}
        setClips={setClips}
        userProfile={userProfile}
        triggerNotification={triggerNotification}
        getSupabase={getSupabase}
      />

      {/* Clip Comments Modal */}
      <AnimatePresence>
        {activeClipComments !== null && (
          <motion.div key="clip-comments-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setActiveClipComments(null)}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#121214] border border-zinc-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-900 bg-black sticky top-0 z-10">
                <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 font-display text-white">
                  <MessageCircle className="w-4 h-4 text-cyan-400" /> Comments
                </span>
                <button onClick={() => setActiveClipComments(null)} className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-900/50 cursor-pointer transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="overflow-y-auto p-4 space-y-4 bg-zinc-950 flex-1 min-h-[300px]">
                <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-3 py-10">
                  <MessageCircle className="w-8 h-8 opacity-20" />
                  <span className="text-xs font-bold">No comments yet.</span>
                  <span className="text-[10px]">Be the first to share your thoughts.</span>
                </div>
              </div>
              <div className="p-4 border-t border-zinc-900 bg-black sticky bottom-0">
                <div className="flex items-center gap-2">
                  <img src={userProfile?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'} className="w-8 h-8 rounded-full border border-zinc-800" alt="" />
                  <input type="text" placeholder="Add a comment..." className="flex-1 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50" />
                  <button onClick={() => {
                    triggerNotification?.("Comment posted!");
                    setActiveClipComments(null);
                  }} className="bg-cyan-600 hover:bg-cyan-500 text-white rounded-full p-2 transition-colors">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Clip Share Modal */}
      <AnimatePresence>
        {activeClipShare !== null && (
          <motion.div key="clip-share-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setActiveClipShare(null)}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#121214] border border-zinc-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-900 bg-black">
                <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 font-display text-white">
                  <Share2 className="w-4 h-4 text-cyan-400" /> Share Clip
                </span>
                <button onClick={() => setActiveClipShare(null)} className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-900/50 cursor-pointer transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 grid grid-cols-4 gap-4 bg-zinc-950 text-center">
                <button onClick={() => { triggerNotification?.("Link copied to clipboard!"); setActiveClipShare(null); }} className="flex flex-col items-center gap-2 group">
                  <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center group-hover:bg-cyan-900/40 group-hover:text-cyan-400 transition-colors border border-zinc-800">
                    <LinkIcon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-zinc-400 group-hover:text-white">Copy Link</span>
                </button>
                <button onClick={() => { triggerNotification?.("Sent via Direct Message"); setActiveClipShare(null); }} className="flex flex-col items-center gap-2 group">
                  <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center group-hover:bg-cyan-900/40 group-hover:text-cyan-400 transition-colors border border-zinc-800">
                    <Send className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-zinc-400 group-hover:text-white">Message</span>
                </button>
                <button onClick={() => { triggerNotification?.("Shared to your Story"); setActiveClipShare(null); }} className="flex flex-col items-center gap-2 group">
                  <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center group-hover:bg-purple-900/40 group-hover:text-purple-400 transition-colors border border-zinc-800">
                    <Plus className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-zinc-400 group-hover:text-white">Add Story</span>
                </button>
                <button onClick={() => { triggerNotification?.("Cross-posted to other socials"); setActiveClipShare(null); }} className="flex flex-col items-center gap-2 group">
                  <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center group-hover:bg-rose-900/40 group-hover:text-rose-400 transition-colors border border-zinc-800">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-zinc-400 group-hover:text-white">External</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Clip Metrics / Who Viewed Modal */}
      <AnimatePresence>
        {activeClipMetrics !== null && (
          <motion.div key="clip-metrics-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setActiveClipMetrics(null)}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#121214] border border-zinc-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[70vh]"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-900 bg-black sticky top-0 z-10">
                <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 font-display text-white">
                  <Users className="w-4 h-4 text-emerald-400" /> Clip Activity
                </span>
                <button onClick={() => setActiveClipMetrics(null)} className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-900/50 cursor-pointer transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="overflow-y-auto p-4 space-y-3 bg-zinc-950 flex-1">
                <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-3 py-10">
                  <Activity className="w-8 h-8 opacity-20" />
                  <span className="text-xs font-bold">No activity yet.</span>
                  <span className="text-[10px]">Views and reactions will appear here.</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </>
  );
};
