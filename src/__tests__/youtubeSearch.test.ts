import { describe, it, expect } from 'vitest';
import {
  extractYtInitialDataJson,
  parseYouTubeInitialDataVideos,
} from '../../server/lib/youtubeSearch';
import { getYouTubeId, extractYouTubeVideoId } from '../utils/youtubeUtils';

describe('YouTube Search Parser & URL Resolution', () => {
  it('extracts ytInitialData safely even when descriptions contain braces or script tags', () => {
    const html = `
      <html><head></head><body>
      <script nonce="abc">
        var ytInitialData = {"contents":{"note":"test } </script> inside string","twoColumnSearchResultsRenderer":{"primaryContents":{"sectionListRenderer":{"contents":[{"itemSectionRenderer":{"contents":[{"videoRenderer":{"videoId":"dQw4w9WgXcQ","title":{"runs":[{"text":"Test Band - Live at Obscene Extreme"}]},"ownerText":{"runs":[{"text":"Goregrind TV"}]},"lengthText":{"simpleText":"12:34"},"shortViewCountText":{"simpleText":"42K views"},"publishedTimeText":{"simpleText":"2 years ago"},"thumbnail":{"thumbnails":[{"url":"//i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"}]}}}]}}]}}}}};
      </script>
      </body></html>
    `;

    const parsed = extractYtInitialDataJson(html);
    expect(parsed).not.toBeNull();

    const videos = parseYouTubeInitialDataVideos(parsed, 12);
    expect(videos).toHaveLength(1);
    expect(videos[0]).toEqual({
      videoId: 'dQw4w9WgXcQ',
      title: 'Test Band - Live at Obscene Extreme',
      channelName: 'Goregrind TV',
      duration: '12:34',
      viewCountText: '42K views',
      publishedTime: '2 years ago',
      thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    });
  });

  it('deduplicates videoRenderers, detects LIVE streams, and respects limit', () => {
    const initialData = {
      contents: {
        twoColumnSearchResultsRenderer: {
          primaryContents: {
            sectionListRenderer: {
              contents: [
                {
                  itemSectionRenderer: {
                    contents: [
                      {
                        videoRenderer: {
                          videoId: 'abc12345678',
                          title: { simpleText: 'First Live Stream' },
                          shortBylineText: { runs: [{ text: 'Underground Fest' }] },
                          badges: [{ metadataBadgeRenderer: { style: 'BADGE_STYLE_TYPE_LIVE_NOW', label: 'LIVE' } }],
                        },
                      },
                      {
                        videoRenderer: {
                          videoId: 'abc12345678',
                          title: { simpleText: 'Duplicate Should Be Ignored' },
                        },
                      },
                      {
                        richItemRenderer: {
                          content: {
                            videoRenderer: {
                              videoId: 'xyz98765432',
                              title: { runs: [{ text: 'Second Set' }] },
                              longBylineText: { runs: [{ text: 'Studio Vault' }] },
                              lengthText: { simpleText: '04:20' },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
      },
    };

    const all = parseYouTubeInitialDataVideos(initialData, 10);
    expect(all).toHaveLength(2);
    expect(all[0].duration).toBe('LIVE');
    expect(all[0].thumbnailUrl).toBe('https://i.ytimg.com/vi/abc12345678/hqdefault.jpg');
    expect(all[1].videoId).toBe('xyz98765432');

    const capped = parseYouTubeInitialDataVideos(initialData, 1);
    expect(capped).toHaveLength(1);
  });

  it('extracts 11-char IDs from standard, shortened, shorts, and live YouTube URLs', () => {
    expect(getYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=12s')).toBe('dQw4w9WgXcQ');
    expect(getYouTubeId('https://youtu.be/dQw4w9WgXcQ?si=test')).toBe('dQw4w9WgXcQ');
    expect(getYouTubeId('https://www.youtube.com/shorts/abc12345678')).toBe('abc12345678');
    expect(getYouTubeId('https://m.youtube.com/live/xyz98765432?feature=share')).toBe('xyz98765432');
    expect(extractYouTubeVideoId('sanguisugabogg live set')).toBeNull();
  });
});
