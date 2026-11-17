import React, { useState, useEffect } from 'react';
import { BarChart2, Clock, ChevronRight, Lock, Trophy, CheckCircle, Check } from 'lucide-react';
import { PollEmbedData, PollOption } from '../timeline/types';

export interface PollWidgetProps {
  post: {
    id: string;
    pollData?: PollEmbedData;
    [key: string]: any;
  };
  pollVote?: { optionId: string; totalVotes: number; options: PollOption[] };
  onVote: (optionId: string, pollData: PollEmbedData) => void;
}

export const PollWidget: React.FC<PollWidgetProps> = ({
  post,
  pollVote,
  onVote,
}) => {
  if (!post.pollData) return null;

  const [localVote, setLocalVote] = useState<{ optionId: string; totalVotes: number; options: PollOption[] } | null>(() => {
    if (pollVote) return pollVote;
    if (typeof window !== 'undefined' && post?.id) {
      try {
        const stored = localStorage.getItem(`nexus_poll_vote_${post.id}`);
        if (stored) return JSON.parse(stored);
      } catch (e) {
        // ignore
      }
    }
    return null;
  });

  useEffect(() => {
    if (pollVote) {
      setLocalVote(pollVote);
    }
  }, [pollVote]);

  const activeVote = pollVote || localVote;
  const pollVotes: Record<string, { optionId: string; totalVotes: number; options: PollOption[] }> = activeVote 
    ? { [post.id]: activeVote } 
    : {};

  const handleVotePoll = (postId: string, optionId: string, pollData: PollEmbedData) => {
    const updatedOptions = pollData.options.map(opt =>
      opt.id === optionId ? { ...opt, votes: (opt.votes || 0) + 1 } : opt
    );
    const updatedTotal = (pollData.totalVotes || pollData.options.reduce((a, b) => a + (b.votes || 0), 0)) + 1;
    const newVote = {
      optionId,
      totalVotes: updatedTotal,
      options: updatedOptions
    };
    setLocalVote(newVote);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`nexus_poll_vote_${postId}`, JSON.stringify(newVote));
      } catch (e) {
        // ignore
      }
    }
    onVote(optionId, pollData);
  };

  return (
    <div className="bg-[#07080a] border border-amber-500/30 rounded-lg p-2.5 sm:p-3 my-2 space-y-2 shadow-inner relative overflow-hidden text-left">
      <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-1.5">
        <div className="flex items-center gap-1.5 text-amber-400 font-mono text-[11px] sm:text-xs font-black uppercase tracking-wider min-w-0 flex-1 overflow-hidden">
          <BarChart2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          {post.pollData.question.length > 28 ? (
            <div className="overflow-hidden flex items-center min-w-0 flex-1">
              <div className="animate-marquee-smooth gap-3 shrink-0">
                <span className="text-[11px] sm:text-xs font-mono font-black text-amber-400 uppercase tracking-wider">{post.pollData.question}</span>
                <span className="text-[11px] sm:text-xs font-mono font-black text-amber-600 uppercase tracking-wider">•</span>
                <span className="text-[11px] sm:text-xs font-mono font-black text-amber-400 uppercase tracking-wider">{post.pollData.question}</span>
                <span className="text-[11px] sm:text-xs font-mono font-black text-amber-600 uppercase tracking-wider">•</span>
              </div>
            </div>
          ) : (
            <span className="truncate">{post.pollData.question}</span>
          )}
        </div>

        {/* Poll Badges: Timed Countdown + Unbiased / Live status */}
        <div className="flex items-center gap-1.5 shrink-0">
          {(() => {
            const nowMs = Date.now();
            const expiresAtMs = post.pollData?.expiresAt ? new Date(post.pollData.expiresAt).getTime() : null;
            const isExpired = Boolean(expiresAtMs && nowMs >= expiresAtMs);

            const getRemainingText = (isoStr?: string) => {
              if (!isoStr) return null;
              const diff = new Date(isoStr).getTime() - Date.now();
              if (diff <= 0) return 'CLOSED';
              const hours = Math.floor(diff / (1000 * 60 * 60));
              const days = Math.floor(hours / 24);
              const remHours = hours % 24;
              const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
              if (days > 0) return `${days}d ${remHours}h left`;
              if (hours > 0) return `${hours}h ${mins}m left`;
              return `${mins}m left`;
            };

            return (
              <>
                {/* Timed poll status badge */}
                {post.pollData?.expiresAt && (
                  <span className={`text-[9px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 ${
                    isExpired
                      ? 'text-rose-400 bg-rose-950/80 border border-rose-500/50'
                      : 'text-amber-300 bg-amber-950/90 border border-amber-500/60 animate-pulse'
                  }`}>
                    <Clock className="w-2.5 h-2.5" />
                    {isExpired ? 'CLOSED' : getRemainingText(post.pollData.expiresAt)}
                  </span>
                )}
              </>
            );
          })()}
        </div>
      </div>

      {(() => {
        const currentVote = pollVotes[post.id];
        const hasVoted = Boolean(currentVote);
        const nowMs = Date.now();
        const expiresAtMs = post.pollData?.expiresAt ? new Date(post.pollData.expiresAt).getTime() : null;
        const isExpired = Boolean(expiresAtMs && nowMs >= expiresAtMs);
        const revealResults = hasVoted || isExpired;

        const optionsList = currentVote ? currentVote.options : post.pollData.options;
        const totalVotes = currentVote ? currentVote.totalVotes : (post.pollData.totalVotes || optionsList.reduce((a, b) => a + (b.votes || 0), 0));

        // Calculate max votes for leading indicator (#1 in yellow/amber)
        const maxVotes = Math.max(...optionsList.map((o) => o.votes || 0));

        return (
          <div className="space-y-1.5">
            {/* If NOT voted and NOT expired, show clean unbiased voting buttons */}
            {!revealResults ? (
              <div className="space-y-1.5">
                {optionsList.map((opt, optIdx) => (
                  <button
                    key={`poll-opt-${opt.id || optIdx}-${optIdx}`}
                    onClick={() => handleVotePoll(post.id, opt.id, post.pollData!)}
                    className="w-full relative group overflow-hidden rounded-lg border border-purple-900/30 bg-zinc-950/90 hover:bg-amber-950/25 hover:border-amber-500/70 py-1.5 px-2.5 sm:py-2 sm:px-3 text-left transition-all cursor-pointer shadow hover:shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                  >
                    <div className="flex items-center justify-between font-mono text-xs font-bold gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-zinc-600 group-hover:border-amber-400 flex items-center justify-center shrink-0 transition-colors">
                          <div className="w-1.5 h-1.5 rounded-full bg-transparent group-hover:bg-amber-400 transition-colors" />
                        </div>
                        <span className="text-zinc-200 group-hover:text-white transition-colors truncate text-[11px] sm:text-xs">{opt.text}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all shrink-0 opacity-40 group-hover:opacity-100" />
                    </div>
                  </button>
                ))}
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-0.5">
                  <span className="flex items-center gap-1 text-zinc-400">
                    <Lock className="w-3 h-3 text-amber-500/80" /> Results hidden to prevent voting bias
                  </span>
                  <span>{totalVotes} total votes</span>
                </div>
              </div>
            ) : (
              /* If VOTED or EXPIRED, reveal live results with animations & leading answer in yellow! */
              <div className="space-y-1.5 animate-in fade-in duration-500">
                {optionsList.map((opt, optIdx) => {
                  const pct = totalVotes > 0 ? Math.round(((opt.votes || 0) / totalVotes) * 100) : 0;
                  const isVoted = currentVote?.optionId === opt.id;
                  const isLeading = (opt.votes || 0) === maxVotes && maxVotes > 0;

                  return (
                    <div
                      key={`poll-result-${opt.id || optIdx}-${optIdx}`}
                      className={`w-full relative overflow-hidden rounded-lg border text-left py-1.5 px-2.5 sm:py-2 sm:px-3 transition-all ${
                        isLeading
                          ? 'bg-[#0f0d06] border-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                          : isVoted
                          ? 'bg-rose-950/40 border-rose-500/80'
                          : 'bg-zinc-950/80 border-purple-900/30 text-zinc-300'
                      }`}
                    >
                      {/* Animated progress bar fill — NO white stroke for unpicked options */}
                      <div
                        className={`absolute top-0 left-0 bottom-0 transition-all duration-1000 ease-out ${
                          isLeading
                            ? 'bg-amber-500/35 border-r-2 border-amber-400'
                            : isVoted
                            ? 'bg-rose-500/25 border-r-2 border-rose-400/50'
                            : 'bg-zinc-800/30'
                        }`}
                        style={{ width: `${pct}%` }}
                      />

                      <div className="relative z-10 flex items-center justify-between font-mono text-xs font-bold gap-2">
                        <div className="flex items-center gap-2 truncate min-w-0 flex-1">
                          {isLeading ? (
                            <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
                          ) : isVoted ? (
                            <CheckCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          ) : (
                            <BarChart2 className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                          )}
                          <span className={`truncate text-[11px] sm:text-xs ${isLeading ? 'text-amber-200 font-extrabold' : 'text-zinc-200'}`}>
                            {opt.text}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isLeading && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-950 border border-amber-500/80 text-amber-300 text-[8px] sm:text-[9px] font-mono font-black uppercase tracking-wider shadow-[0_0_8px_rgba(245,158,11,0.4)] animate-in zoom-in-75 duration-300">
                              <Trophy className="w-2.5 h-2.5 text-amber-400 fill-amber-400/30" /> #1 LEADER
                            </span>
                          )}
                          {isVoted && !isLeading && (
                            <span className="text-[8px] sm:text-[9px] font-mono font-bold text-rose-300 bg-rose-950 border border-rose-500/60 px-1.5 py-0.5 rounded">
                              YOUR VOTE
                            </span>
                          )}
                          <span className={`text-[11px] sm:text-xs font-mono font-black ${isLeading ? 'text-amber-400' : 'text-zinc-300'}`}>
                            {pct}% ({opt.votes || 0})
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pt-0.5 border-t border-zinc-800/60 animate-in fade-in duration-700">
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    {isExpired ? (
                      <>
                        <Lock className="w-3 h-3 text-rose-400" /> Voting deadline passed • Final tally
                      </>
                    ) : (
                      <>
                        <Check className="w-3 h-3" /> Vote recorded • Live results revealed
                      </>
                    )}
                  </span>
                  <span className="text-zinc-400">{totalVotes} total network votes</span>
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
};
