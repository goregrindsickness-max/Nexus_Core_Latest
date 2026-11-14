import React from 'react';

export interface StoryItem {
  id: string;
  name: string;
  avatar?: string;
  image?: string;
  video?: string;
  border?: string;
  textColor?: string;
  caption?: string;
  musicTrack?: string;
  textOverlay?: string;
  [key: string]: any;
}

export interface StoriesCarouselSectionProps {
  stories: StoryItem[];
  onAddStory: () => void;
  onSelectStory: (story: StoryItem) => void;
}

export const StoriesCarouselSection: React.FC<StoriesCarouselSectionProps> = ({
  stories,
  onAddStory,
  onSelectStory,
}) => {
  const isCompactMode = stories.length < 3;

  return (
    <div className="max-w-2xl mx-auto pt-1 pb-1 px-4 sm:px-4">
      <h3 className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2 flex items-center justify-between">
        <span>🔥 Stories from the Pit</span>
        <span className="text-[9px] text-zinc-600 font-mono font-normal">24h Expires</span>
      </h3>

      {isCompactMode ? (
        <div className="h-[68px] px-3 rounded-2xl bg-[#0b0b0e] border border-zinc-800/80 flex items-center gap-3 overflow-x-auto no-scrollbar select-none">
          {/* Compact + Add to Story Button */}
          <button
            type="button"
            onClick={onAddStory}
            className="inline-flex items-center gap-2.5 pr-3.5 pl-1.5 py-1.5 rounded-full bg-zinc-900/90 border border-dashed border-zinc-700 hover:border-teal-400/60 hover:bg-zinc-900 transition-all shrink-0 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-purple-500/40"
          >
            <div className="w-8 h-8 rounded-full bg-zinc-950 border border-purple-500/50 group-hover:border-teal-400 flex items-center justify-center text-teal-300 shadow-[0_0_12px_rgba(157,78,223,0.28)] transition-colors">
              <span className="text-sm font-black leading-none">+</span>
            </div>
            <span className="text-[11px] font-bold text-zinc-200 group-hover:text-white whitespace-nowrap transition-colors">
              Add to Story
            </span>
          </button>

          {/* Compact Circular Avatar Rings with Glowing Purple/Teal Unread Borders */}
          {stories.length > 0 ? (
            <div className="flex items-center gap-3">
              {stories.map((story, sIdx) => {
                const storyKey = story.id ? `story-compact-${story.id}-${sIdx}` : `story-compact-${sIdx}`;
                const hasAvatar =
                  story?.avatar &&
                  typeof story.avatar === 'string' &&
                  (story.avatar.startsWith('http') ||
                    story.avatar.startsWith('/') ||
                    story.avatar.startsWith('data:'));

                return (
                  <button
                    key={storyKey}
                    type="button"
                    onClick={() => onSelectStory(story)}
                    title={story.name}
                    className="flex flex-col items-center justify-center shrink-0 cursor-pointer group focus:outline-none"
                  >
                    <div className="p-[2px] rounded-full bg-gradient-to-tr from-[#9d4edf] via-purple-500 to-[#00ffcc] shadow-[0_0_12px_rgba(157,78,223,0.45),0_0_8px_rgba(0,255,204,0.35)] group-hover:scale-105 transition-transform">
                      <div className="w-9 h-9 rounded-full bg-zinc-950 p-[1.5px] overflow-hidden flex items-center justify-center">
                        {hasAvatar ? (
                          <img
                            src={story.avatar}
                            alt={story.name}
                            className="w-full h-full rounded-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="text-xs font-black text-teal-300">
                            {story?.name ? story.name.charAt(0).toUpperCase() : '?'}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[9.5px] font-bold text-zinc-300 group-hover:text-white max-w-[68px] truncate leading-none mt-1">
                      {story.name}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <span className="text-[10px] font-mono text-zinc-600 truncate ml-auto pr-1">
              Share a 24h clip or photo from the pit
            </span>
          )}
        </div>
      ) : (
        <div className="flex flex-row overflow-x-auto no-scrollbar gap-3 pb-1 select-none">
          {/* Add to Story Block */}
          <button
            type="button"
            onClick={onAddStory}
            className="w-28 h-40 rounded-xl relative overflow-hidden flex-shrink-0 cursor-pointer bg-zinc-900 border border-dashed border-zinc-800 hover:border-rose-500/50 flex flex-col items-center justify-center p-3 text-center transition-all duration-200 group hover:scale-[1.02] focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full border border-zinc-700 group-hover:border-rose-500/80 flex items-center justify-center bg-zinc-950 text-zinc-500 group-hover:text-rose-400 mb-2 transition-colors shadow-inner">
              <span className="text-sm font-black">+</span>
            </div>
            <span className="text-[10px] font-bold text-zinc-400 group-hover:text-white transition-colors">
              Add to Story
            </span>
          </button>

          {/* Stories List */}
          {stories.map((story, sIdx) => {
            const storyKey = story.id ? `story-${story.id}-${sIdx}` : `story-${sIdx}`;
            const rawMedia = story.video || story.image || story.mediaUrl;
            const isVideo = Boolean(
              story.video ||
                (typeof rawMedia === 'string' &&
                  (rawMedia.endsWith('.mp4') || rawMedia.endsWith('.webm') || rawMedia.includes('video/mp4')))
            );

            return (
              <div
                key={storyKey}
                role="button"
                tabIndex={0}
                onClick={() => onSelectStory(story)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectStory(story);
                  }
                }}
                className={`w-28 h-40 rounded-xl relative overflow-hidden flex-shrink-0 cursor-pointer group border transition-all duration-200 ${
                  story.border || 'border-zinc-800'
                } hover:shadow-lg hover:shadow-rose-950/30 hover:scale-[1.03] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-rose-500/50`}
              >
                {/* Media Preview (Video or Image) with pointer-events-none so click always registers */}
                {isVideo ? (
                  <video
                    src={story.video || rawMedia}
                    muted
                    loop
                    autoPlay
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                  />
                ) : (
                  <img
                    src={story.image || rawMedia || ''}
                    alt={story.name}
                    className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                    referrerPolicy="no-referrer"
                  />
                )}

                {/* Gradient Scrim */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

                {/* Author Avatar Badge */}
                <div
                  className={`absolute top-2 left-2 w-8 h-8 rounded-full border-2 ${
                    story.border || 'border-rose-500'
                  } flex items-center justify-center bg-zinc-900 font-black ${
                    story.textColor || 'text-rose-400'
                  } text-xs z-10 overflow-hidden shadow-md pointer-events-none`}
                >
                  {story?.avatar &&
                  typeof story?.avatar === 'string' &&
                  (story?.avatar.startsWith('http') ||
                    story?.avatar.startsWith('/') ||
                    story?.avatar.startsWith('data:')) ? (
                    <img
                      src={story?.avatar}
                      className="w-full h-full object-cover"
                      alt=""
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    story?.avatar || (story?.name ? story.name.charAt(0) : '?')
                  )}
                </div>

                {/* Author Name */}
                <div className="absolute bottom-0 left-0 right-0 p-2 pointer-events-none">
                  <div className="text-[10px] font-bold text-white leading-tight truncate drop-shadow">
                    {story.name}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
