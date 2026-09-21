import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FeedItem } from '../../../data/socialFeedMockData';
import { loadFeedCache, saveFeedCache, getDeletedPostIdsLocal, resolveWorkspaceEntityId, isBrokenOrDeletedPost, cleanBrokenPostsFromAllStores } from '../utils/feedCacheUtils';
import { getSupabase, subscribeToTable } from '../../../supabase';
import { extractYouTubeId } from '../utils/postSyncUtils';
import { mergePostWithReactions } from '../utils/reactionStore';

interface UseFeedLocalCacheOptions {
  portalRole: string;
  userProfile?: any;
  defaultFeed?: FeedItem[];
  activeBand?: any;
  activeBandId?: string;
  workspaceEntityId?: string;
}

export function useFeedLocalCache({
  portalRole,
  userProfile,
  defaultFeed = [],
  activeBand,
  activeBandId,
  workspaceEntityId
}: UseFeedLocalCacheOptions) {
  const [feed, _setFeed] = useState<FeedItem[]>([]);

  const resolvedEntityId = useMemo(() => {
    return workspaceEntityId || resolveWorkspaceEntityId(portalRole, activeBand, activeBandId, userProfile);
  }, [workspaceEntityId, portalRole, activeBand, activeBandId, userProfile]);

  const setFeed = useCallback((action: React.SetStateAction<FeedItem[]>) => {
    _setFeed(prev => {
      return typeof action === 'function' ? (action as Function)(prev) : action;
    });
  }, []);

  // Load feed posts from IndexedDB on mount / user change, then sync with Supabase
  useEffect(() => {
    let active = true;
    const loadFeed = async () => {
      try {
        // Asynchronously sweep and clean any stale broken posts across IndexedDB
        cleanBrokenPostsFromAllStores().catch(() => {});

        const storedFeed = await loadFeedCache(portalRole, userProfile?.id, resolvedEntityId);
        if (!active) return;
        let finalFeed = storedFeed || [];

        // Fetch from Supabase
        const supabaseClient = getSupabase();
        if (supabaseClient) {
          try {
            const { data, error } = await supabaseClient
              .from('nexus_posts')
              .select('*, profiles:profile_id(*)')
              .order('created_at', { ascending: false })
              .limit(100);

            if (!error && data) {
              const deletedPosts = getDeletedPostIdsLocal();
              const filteredData = data.filter((item: any) => {
                if (deletedPosts.includes(item.id)) return false;
                if (isBrokenOrDeletedPost(item)) return false;
                try {
                  const postObj = typeof item.data === 'string' ? JSON.parse(item.data) : (item.data || {});
                  if (isBrokenOrDeletedPost(postObj)) return false;
                } catch (e) {}
                return true;
              });

              if (filteredData.length > 0) {
                const remoteFeed = filteredData.map((item: any) => {
                  try {
                    const postObj = typeof item.data === 'string' ? JSON.parse(item.data) : (item.data || {});

                    const isSelf = userProfile?.id && (userProfile.id === item.profiles?.id || userProfile.id === item.profile_id);
                    const liveSelfAvatar = isSelf ? (userProfile?.avatar || userProfile?.avatar_url || userProfile?.profile_avatar) : null;

                    const isCreativePost = postObj.workspace_type === 'creative' ||
                      postObj.workspaceType === 'creative' ||
                      postObj.authorRole === 'Creative Pro' ||
                      postObj.author?.role === 'Creative Pro' ||
                      postObj.persona_id?.includes('creative') ||
                      (item.profiles?.account_type === 'creative');

                    const isBandPost = !isCreativePost && (
                      postObj.workspace_type === 'band' ||
                      postObj.workspaceType === 'band' ||
                      postObj.authorRole === 'Band / Artist' ||
                      postObj.author?.isBand ||
                      postObj.persona_id?.includes('band') ||
                      (item.profiles?.account_type === 'band')
                    );

                    const isLabelPost = !isCreativePost && !isBandPost && (
                      postObj.workspace_type === 'label' ||
                      postObj.workspaceType === 'label' ||
                      postObj.authorRole === 'Record Label' ||
                      postObj.persona_id?.includes('label') ||
                      (item.profiles?.account_type === 'label')
                    );

                    const isPromoterPost = !isCreativePost && !isBandPost && !isLabelPost && (
                      postObj.workspace_type === 'promoter' ||
                      postObj.workspaceType === 'promoter' ||
                      postObj.authorRole === 'Promoter / Venue' ||
                      postObj.authorRole === 'Promoter' ||
                      postObj.persona_id?.includes('promoter') ||
                      (item.profiles?.account_type === 'promoter')
                    );

                    const resolvedWorkspaceType = isCreativePost ? 'creative' :
                      isBandPost ? 'band' :
                      isLabelPost ? 'label' :
                      isPromoterPost ? 'promoter' :
                      (postObj.workspace_type || (item.profiles?.account_type === 'fan' ? 'fan_only' : 'industry_pro'));

                    const resolvedRole = isCreativePost ? 'Creative Pro' :
                      isBandPost ? 'Band / Artist' :
                      isLabelPost ? 'Record Label' :
                      isPromoterPost ? 'Promoter / Venue' :
                      (postObj.authorRole || postObj.author?.role || (item.profiles?.account_type === 'fan' ? 'FAN' : 'Industry Pro'));

                    const resolvedName = (isBandPost && (postObj.author?.name || postObj.authorName))
                      ? (postObj.author?.name || postObj.authorName)
                      : (isLabelPost && (postObj.author?.name || postObj.authorName))
                      ? (postObj.author?.name || postObj.authorName)
                      : (isCreativePost && (postObj.author?.name || postObj.authorName))
                      ? (postObj.author?.name || postObj.authorName)
                      : (postObj.authorName || postObj.author?.name || item.profiles?.console_handle || item.profiles?.full_name || 'Anonymous');

                    const dedicatedAvatar = postObj.authorAvatar || postObj.author?.avatar;
                    const resolvedAvatar = (dedicatedAvatar && !dedicatedAvatar.includes('ui-avatars.com'))
                      ? dedicatedAvatar
                      : (isSelf
                        ? (liveSelfAvatar || item.profiles?.avatar_url || item.profiles?.avatar || item.profiles?.profile_avatar || item.profiles?.profile_image || dedicatedAvatar || undefined)
                        : (item.profiles?.avatar_url || item.profiles?.avatar || item.profiles?.profile_avatar || item.profiles?.profile_image || dedicatedAvatar || undefined));

                    const author = {
                      id: postObj.author?.id || item.profiles?.id || item.profile_id,
                      name: resolvedName,
                      avatar: resolvedAvatar,
                      role: resolvedRole,
                      workspace_type: resolvedWorkspaceType,
                      workspaceType: resolvedWorkspaceType,
                      isYou: isSelf
                    };

                    const rxObj = typeof item.reactions === 'object' && item.reactions !== null && !Array.isArray(item.reactions)
                      ? item.reactions
                      : typeof postObj.reactions === 'object' && postObj.reactions !== null && !Array.isArray(postObj.reactions)
                        ? postObj.reactions
                        : { likes: 0, horns: 0, hype: 0, brutal: 0, respect: 0, crushed: 0 };

                    const normalizedReactions = {
                      likes: Number(rxObj.likes || rxObj.thumbs || rxObj.heart || 0),
                      horns: Number(rxObj.horns || 0),
                      hype: Number(rxObj.hype || rxObj.flame || 0),
                      brutal: Number(rxObj.brutal || rxObj.heavy || 0),
                      respect: Number(rxObj.respect || 0),
                      crushed: Number(rxObj.crushed || 0)
                    };

                    const contentText = item.content || postObj.content || postObj.text || '';
                    const rawMediaUrl = item.media_url || postObj.media_url || postObj.mediaUrl || postObj.image || (postObj.images && postObj.images[0]) || null;

                    const ytId = postObj.youtubeId || postObj.youtube_id || extractYouTubeId(postObj.youtubeUrl || postObj.youtube_url || rawMediaUrl || contentText);
                    const ytUrl = postObj.youtubeUrl || postObj.youtube_url || (ytId ? `https://www.youtube.com/watch?v=${ytId}` : null);

                    const resolvedMediaUrl = rawMediaUrl || ytUrl || postObj.tapeData?.audioUrl || postObj.songData?.audioUrl || null;
                    const imagesArr = postObj.images && postObj.images.length > 0
                      ? postObj.images
                      : (resolvedMediaUrl ? [resolvedMediaUrl] : []);

                    const resolvedBandcampData = postObj.bandcampData || postObj.bandcamp_data || null;
                    const resolvedBandcampUrl = postObj.bandcampUrl || postObj.bandcamp_url || (rawMediaUrl && rawMediaUrl.includes('bandcamp.com') ? rawMediaUrl : null);

                    const parsedPostItem = {
                      ...postObj,
                      id: item.id || postObj.id,
                      timestamp: item.created_at || postObj.timestamp || postObj.created_at || new Date().toISOString(),
                      created_at: item.created_at || postObj.created_at || postObj.timestamp || new Date().toISOString(),
                      content: contentText,
                      image: resolvedMediaUrl,
                      mediaUrl: resolvedMediaUrl,
                      media_url: resolvedMediaUrl,
                      images: imagesArr,
                      youtubeId: ytId || postObj.youtubeId,
                      youtube_id: ytId || postObj.youtube_id,
                      youtubeUrl: ytUrl || postObj.youtubeUrl,
                      youtube_url: ytUrl || postObj.youtube_url,
                      bandcampData: resolvedBandcampData,
                      bandcamp_data: resolvedBandcampData,
                      bandcampUrl: resolvedBandcampUrl,
                      bandcamp_url: resolvedBandcampUrl,
                      tapeData: postObj.tapeData,
                      songData: postObj.songData,
                      pollData: postObj.pollData,
                      merchData: postObj.merchData,
                      reactions: normalizedReactions,
                      likes_count: normalizedReactions.likes,
                      author: author,
                      type: postObj.type || (postObj.tapeData ? 'tape_share' : postObj.songData ? 'song' : postObj.pollData ? 'poll' : postObj.merchData ? 'merch_drop' : 'post')
                    };
                    return mergePostWithReactions(parsedPostItem, userProfile?.id);
                  } catch (err) {
                    console.warn("Failed to parse remote post JSON:", err);
                    return null;
                  }
                }).filter(Boolean) as FeedItem[];

                if (storedFeed && storedFeed.length > 0) {
                  const remoteMap = new Map(remoteFeed.map(p => [p.id, p]));
                  const merged: FeedItem[] = [];

                  remoteFeed.forEach(rp => {
                    const sp = storedFeed.find(s => s.id === rp.id);
                    if (sp) {
                      const combined = {
                        ...rp,
                        reactions: {
                          likes: Math.max(rp.reactions?.likes || 0, sp.reactions?.likes || 0),
                          horns: Math.max(rp.reactions?.horns || 0, sp.reactions?.horns || 0),
                          hype: Math.max(rp.reactions?.hype || 0, sp.reactions?.hype || 0),
                          brutal: Math.max(rp.reactions?.brutal || 0, sp.reactions?.brutal || 0),
                          respect: Math.max(rp.reactions?.respect || 0, sp.reactions?.respect || 0),
                          crushed: Math.max(rp.reactions?.crushed || 0, sp.reactions?.crushed || 0),
                        },
                        user_reactions: sp.user_reactions || rp.user_reactions,
                        user_liked: sp.user_liked ?? rp.user_liked,
                      };
                      combined.likes_count = combined.reactions.likes;
                      merged.push(mergePostWithReactions(combined, userProfile?.id));
                    } else {
                      merged.push(mergePostWithReactions(rp, userProfile?.id));
                    }
                  });

                  storedFeed.forEach(sp => {
                    const isDraftOrOptimistic = sp.id.startsWith('draft_') || sp.id.startsWith('local_') || (sp as any).isOptimistic;
                    if (isDraftOrOptimistic && !remoteMap.has(sp.id) && !deletedPosts.includes(sp.id) && !isBrokenOrDeletedPost(sp)) {
                      merged.push(mergePostWithReactions(sp, userProfile?.id));
                    }
                  });

                  finalFeed = merged.filter(p => !isBrokenOrDeletedPost(p));
                } else {
                  finalFeed = remoteFeed.filter(p => !isBrokenOrDeletedPost(p)).map(p => mergePostWithReactions(p, userProfile?.id));
                }

                // Query comments
                try {
                  const { data: commentsRows } = await supabaseClient
                    .from('nexus_post_comments')
                    .select('*')
                    .order('created_at', { ascending: true });

                  if (commentsRows && commentsRows.length > 0) {
                    const commentsByPost: Record<string, any[]> = {};
                    commentsRows.forEach((c: any) => {
                      if (!c.post_id) return;
                      if (!commentsByPost[c.post_id]) commentsByPost[c.post_id] = [];
                      commentsByPost[c.post_id].push({
                        id: c.id,
                        post_id: c.post_id,
                        user_id: c.user_id,
                        parent_comment_id: c.parent_comment_id || null,
                        username: c.user_id || 'Fan',
                        author: c.user_id || 'Fan',
                        text: c.content,
                        content: c.content,
                        time: c.created_at ? new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
                        created_at: c.created_at
                      });
                    });

                    finalFeed = finalFeed.map(p => ({
                      ...p,
                      comments: commentsByPost[p.id] || p.comments || []
                    }));
                  }
                } catch (commErr) {
                  console.warn("Notice querying nexus_post_comments:", commErr);
                }

                // Query polls
                try {
                  const { data: pollsRows } = await supabaseClient.from('nexus_polls').select('*');
                  const { data: votesRows } = await supabaseClient.from('nexus_poll_votes').select('*');

                  if (pollsRows && pollsRows.length > 0) {
                    const pollsByPost = pollsRows.reduce((acc, p) => { acc[p.post_id] = p; return acc; }, {} as Record<string, any>);
                    const votesByPoll = votesRows ? votesRows.reduce((acc, v) => {
                      if (!acc[v.poll_id]) acc[v.poll_id] = [];
                      acc[v.poll_id].push(v);
                      return acc;
                    }, {} as Record<string, any[]>) : {};

                    finalFeed = finalFeed.map(post => {
                      if (pollsByPost[post.id]) {
                        const p = pollsByPost[post.id];
                        const pollVotes = votesByPoll[p.id] || [];
                        const optionsWithVotes = p.options.map((opt: any, idx: number) => {
                          const optionVotes = pollVotes.filter((v: any) => v.selected_option_index === idx).length;
                          return { ...opt, votes: optionVotes };
                        });

                        return {
                          ...post,
                          type: 'poll',
                          pollData: {
                            pollId: p.id,
                            question: p.question,
                            variant: p.category,
                            isTimed: !p.is_unbiased,
                            expiresAt: p.expires_at,
                            options: optionsWithVotes,
                            totalVotes: pollVotes.length
                          }
                        };
                      }
                      return post;
                    });
                  }
                } catch (pollErr) {
                  console.warn("Notice querying nexus_polls:", pollErr);
                }

                // Sort posts by descending timestamp
                finalFeed.sort((a: any, b: any) => {
                  const timeA = new Date(a.timestamp || 0).getTime();
                  const timeB = new Date(b.timestamp || 0).getTime();
                  return timeB - timeA;
                });
              } else {
                finalFeed = defaultFeed;
              }
            } else if (!error && !data) {
              finalFeed = defaultFeed;
            }
          } catch (e) {
            console.warn("Failed to sync feed from Supabase", e);
          }
        }

        if (finalFeed.length < 10 && defaultFeed.length > 0) {
          const existingIds = new Set(finalFeed.map((item: any) => item.id));
          const toAppend = defaultFeed
            .filter(item => !existingIds.has(item.id))
            .map(item => mergePostWithReactions(item, userProfile?.id));
          finalFeed = [...finalFeed, ...toAppend];
        }

        finalFeed = finalFeed.map(p => mergePostWithReactions(p, userProfile?.id));

        if (active) {
          _setFeed(finalFeed);
        }
      } catch (e) {
        console.warn("Failed to load feed from IndexedDB:", e);
      }
    };

    loadFeed();
    return () => {
      active = false;
    };
  }, [portalRole, resolvedEntityId, userProfile?.id, defaultFeed]);

  // Real-time syncing for posts and comments
  useEffect(() => {
    let active = true;
    const unsub1 = subscribeToTable('nexus_posts', async (payload) => {
      if (!active) return;
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        try {
          const newItem = payload.new;
          let parsedPost = typeof newItem.data === 'string' ? JSON.parse(newItem.data) : (newItem.data || {});

          let profile = newItem.profiles;
          if (!profile && newItem.profile_id) {
            const supabaseClient = getSupabase();
            if (supabaseClient) {
              const { data: profData } = await supabaseClient.from('profiles').select('*').eq('id', newItem.profile_id).single();
              profile = profData;
            }
          }

          const isSelf = userProfile?.id && (userProfile.id === profile?.id || userProfile.id === newItem.profile_id);
          const liveSelfAvatar = isSelf ? (userProfile?.avatar || userProfile?.avatar_url || userProfile?.profile_avatar) : null;

          const isCreativePost = parsedPost.workspace_type === 'creative' ||
            parsedPost.workspaceType === 'creative' ||
            parsedPost.authorRole === 'Creative Pro' ||
            parsedPost.author?.role === 'Creative Pro' ||
            parsedPost.persona_id?.includes('creative') ||
            (profile?.account_type === 'creative');

          const isBandPost = !isCreativePost && (
            parsedPost.workspace_type === 'band' ||
            parsedPost.workspaceType === 'band' ||
            parsedPost.authorRole === 'Band / Artist' ||
            parsedPost.author?.isBand ||
            parsedPost.persona_id?.includes('band') ||
            (profile?.account_type === 'band')
          );

          const isLabelPost = !isCreativePost && !isBandPost && (
            parsedPost.workspace_type === 'label' ||
            parsedPost.workspaceType === 'label' ||
            parsedPost.authorRole === 'Record Label' ||
            parsedPost.persona_id?.includes('label') ||
            (profile?.account_type === 'label')
          );

          const isPromoterPost = !isCreativePost && !isBandPost && !isLabelPost && (
            parsedPost.workspace_type === 'promoter' ||
            parsedPost.workspaceType === 'promoter' ||
            parsedPost.authorRole === 'Promoter / Venue' ||
            parsedPost.authorRole === 'Promoter' ||
            parsedPost.persona_id?.includes('promoter') ||
            (profile?.account_type === 'promoter')
          );

          const resolvedWorkspaceType = isCreativePost ? 'creative' :
            isBandPost ? 'band' :
            isLabelPost ? 'label' :
            isPromoterPost ? 'promoter' :
            (parsedPost.workspace_type || (profile?.account_type === 'fan' ? 'fan_only' : 'industry_pro'));

          const resolvedRole = isCreativePost ? 'Creative Pro' :
            isBandPost ? 'Band / Artist' :
            isLabelPost ? 'Record Label' :
            isPromoterPost ? 'Promoter / Venue' :
            (parsedPost.authorRole || parsedPost.author?.role || (profile?.account_type === 'fan' ? 'FAN' : 'Industry Pro'));

          const resolvedName = (isBandPost && (parsedPost.author?.name || parsedPost.authorName))
            ? (parsedPost.author?.name || parsedPost.authorName)
            : (isLabelPost && (parsedPost.author?.name || parsedPost.authorName))
            ? (parsedPost.author?.name || parsedPost.authorName)
            : (isCreativePost && (parsedPost.author?.name || parsedPost.authorName))
            ? (parsedPost.author?.name || parsedPost.authorName)
            : (parsedPost.authorName || parsedPost.author?.name || profile?.console_handle || profile?.full_name || 'Anonymous');

          const dedicatedAvatar = parsedPost.authorAvatar || parsedPost.author?.avatar;
          const resolvedAvatar = (dedicatedAvatar && !dedicatedAvatar.includes('ui-avatars.com'))
            ? dedicatedAvatar
            : (isSelf
              ? (liveSelfAvatar || profile?.avatar_url || profile?.avatar || profile?.profile_avatar || profile?.profile_image || dedicatedAvatar || undefined)
              : (profile?.avatar_url || profile?.avatar || profile?.profile_avatar || profile?.profile_image || dedicatedAvatar || undefined));

          const author = {
            id: parsedPost.author?.id || profile?.id || newItem.profile_id,
            name: resolvedName,
            avatar: resolvedAvatar,
            role: resolvedRole,
            workspace_type: resolvedWorkspaceType,
            workspaceType: resolvedWorkspaceType,
            isYou: isSelf
          };

          const contentText = newItem.content || parsedPost.content || parsedPost.text || '';
          const rawMediaUrl = newItem.media_url || parsedPost.media_url || parsedPost.mediaUrl || parsedPost.image || (parsedPost.images && parsedPost.images[0]) || null;

          const ytId = parsedPost.youtubeId || parsedPost.youtube_id || extractYouTubeId(parsedPost.youtubeUrl || parsedPost.youtube_url || rawMediaUrl || contentText);
          const ytUrl = parsedPost.youtubeUrl || parsedPost.youtube_url || (ytId ? `https://www.youtube.com/watch?v=${ytId}` : null);

          const resolvedMediaUrl = rawMediaUrl || ytUrl || parsedPost.tapeData?.audioUrl || parsedPost.songData?.audioUrl || null;
          const imagesArr = parsedPost.images && parsedPost.images.length > 0
            ? parsedPost.images
            : (resolvedMediaUrl ? [resolvedMediaUrl] : []);

          parsedPost = {
            ...parsedPost,
            id: newItem.id || parsedPost.id,
            timestamp: newItem.created_at || parsedPost.timestamp || parsedPost.created_at || new Date().toISOString(),
            created_at: newItem.created_at || parsedPost.created_at || parsedPost.timestamp || new Date().toISOString(),
            content: contentText,
            image: resolvedMediaUrl,
            mediaUrl: resolvedMediaUrl,
            media_url: resolvedMediaUrl,
            images: imagesArr,
            youtubeId: ytId || parsedPost.youtubeId,
            youtube_id: ytId || parsedPost.youtube_id,
            youtubeUrl: ytUrl || parsedPost.youtubeUrl,
            youtube_url: ytUrl || parsedPost.youtube_url,
            tapeData: parsedPost.tapeData,
            songData: parsedPost.songData,
            pollData: parsedPost.pollData,
            merchData: parsedPost.merchData,
            author: author,
            type: parsedPost.type || (parsedPost.tapeData ? 'tape_share' : parsedPost.songData ? 'song' : parsedPost.pollData ? 'poll' : parsedPost.merchData ? 'merch_drop' : 'post')
          };

          const deletedPosts = getDeletedPostIdsLocal();
          if (deletedPosts.includes(parsedPost.id) || isBrokenOrDeletedPost(parsedPost)) return;

          _setFeed(prev => {
            let nextPrev = prev;
            if (nextPrev.some(p => p.id.startsWith('mock_'))) {
              nextPrev = nextPrev.filter(p => !p.id.startsWith('mock_'));
            }

            // Check exact ID match
            let matchIdx = nextPrev.findIndex(p => p.id === parsedPost.id || p.id === `nexus_post_${parsedPost.id}`);

            // If no exact ID match, check for optimistic duplicate created recently
            if (matchIdx === -1) {
              matchIdx = nextPrev.findIndex(p => {
                const sameAuthor = p.author?.name === parsedPost.author?.name || p.author?.isYou;
                const sameContent = (p.content || '').trim() === (parsedPost.content || '').trim();
                const pImg = p.image || p.images?.[0];
                const newImg = parsedPost.image || parsedPost.images?.[0];
                const sameImage = pImg === newImg || !pImg || !newImg;
                const isRecent = p.timestamp === 'Just now' || Math.abs(new Date(p.timestamp || 0).getTime() - new Date(parsedPost.timestamp || 0).getTime()) < 30000;
                return sameAuthor && sameContent && sameImage && isRecent;
              });
            }

            if (matchIdx !== -1) {
              const updated = [...nextPrev];
              const mergedPost = mergePostWithReactions({
                ...updated[matchIdx],
                ...parsedPost,
                id: parsedPost.id,
                image: parsedPost.image || updated[matchIdx].image || updated[matchIdx].images?.[0],
                images: (parsedPost.images && parsedPost.images.length > 0) ? parsedPost.images : (updated[matchIdx].images || (updated[matchIdx].image ? [updated[matchIdx].image] : [])),
                user_reactions: updated[matchIdx].user_reactions || parsedPost.user_reactions,
                user_liked: updated[matchIdx].user_liked ?? parsedPost.user_liked,
              }, userProfile?.id);
              updated[matchIdx] = mergedPost;
              return updated;
            } else {
              const freshPost = mergePostWithReactions(parsedPost, userProfile?.id);
              return [freshPost, ...nextPrev].sort((a: any, b: any) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
            }
          });
        } catch (e) { }
      } else if (payload.eventType === 'DELETE') {
        const { id } = payload.old;
        if (id) {
          const postId = id.startsWith('nexus_post_') ? id.replace('nexus_post_', '') : id;
          _setFeed(prev => prev.filter(p => p.id !== postId && p.id !== id));
        }
      }
    });

    const unsubComments = subscribeToTable('nexus_post_comments', (payload) => {
      if (!active) return;
      if (payload.eventType === 'INSERT') {
        const c = payload.new;
        if (!c.post_id) return;
        setFeed(prev => prev.map(post => {
          if (post.id === c.post_id || post.id === `nexus_post_${c.post_id}`) {
            const newComm = {
              id: c.id,
              post_id: c.post_id,
              user_id: c.user_id,
              parent_comment_id: c.parent_comment_id || null,
              username: c.user_id || 'Fan',
              author: c.user_id || 'Fan',
              text: c.content,
              content: c.content,
              time: c.created_at ? new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
              timeAgo: c.created_at ? new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
              created_at: c.created_at
            };
            const existing = post.comments || [];
            if (existing.some((x: any) => x.id === c.id)) return post;
            return {
              ...post,
              comments: [...existing, newComm]
            };
          }
          return post;
        }));
      }
    });

    const handlePostDeletedSync = (e: any) => {
      if (!active) return;
      const deletedId = e.detail?.id || e.detail;
      if (deletedId) {
        _setFeed(prev => prev.filter(p => p.id !== deletedId && p.id !== `nexus_post_${deletedId}`));
      }
    };
    window.addEventListener('nexus_post_deleted', handlePostDeletedSync as EventListener);

    const handleReactionSync = (e: any) => {
      if (!active) return;
      const detail = e.detail;
      if (!detail || !detail.postId) return;
      _setFeed(prev => {
        let matched = false;
        const next = prev.map(p => {
          if (p.id === detail.postId) {
            matched = true;
            return {
              ...p,
              reactions: detail.reactions,
              likes_count: detail.likes_count,
              user_liked: detail.user_liked,
              user_reactions: detail.user_reactions,
            };
          }
          return p;
        });
        return matched ? next : prev;
      });
    };
    window.addEventListener('nexus_reaction_updated', handleReactionSync as EventListener);

    return () => {
      active = false;
      if (unsub1) unsub1();
      if (unsubComments) unsubComments();
      window.removeEventListener('nexus_post_deleted', handlePostDeletedSync as EventListener);
      window.removeEventListener('nexus_reaction_updated', handleReactionSync as EventListener);
    };
  }, [userProfile?.id, setFeed]);

  // Save feed posts to IndexedDB whenever feed state updates
  useEffect(() => {
    if (feed && feed.length > 0) {
      saveFeedCache(portalRole, feed, userProfile?.id, resolvedEntityId);
    }
  }, [feed, portalRole, resolvedEntityId, userProfile?.id]);

  return {
    feed,
    setFeed,
    _setFeed
  };
}
