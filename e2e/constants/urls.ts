/** URL helpers for the FeedTheMonster app. */

export const BASE_URL = 'http://localhost:8080';

export const Routes = {
  /** Default game entry – English, no user ID */
  game: (params?: { lang?: string; userId?: string; source?: string }) => {
    const p = new URLSearchParams();
    p.set('cr_lang', params?.lang ?? 'english');
    if (params?.userId) p.set('cr_user_id', params.userId);
    if (params?.source) p.set('source', params.source);
    return `/?${p.toString()}`;
  },
} as const;
