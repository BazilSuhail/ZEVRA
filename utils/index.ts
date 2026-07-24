// ─── Utils Barrel ───────────────────────────────────────────────────────────
//
// Usage in components:
//   import { api } from '@/utils';
//   const data = await api.get<User[]>('/api/users/search', { q: 'john' });
//

export { api, request, getAccessToken, getRefreshToken, setTokens, clearTokens, loadRefreshToken, getErrorMessage } from './api';
export type { HttpMethod, RequestOptions } from './api';
