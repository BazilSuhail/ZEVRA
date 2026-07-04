// ─── Utils Barrel ───────────────────────────────────────────────────────────
//
// Usage in components:
//   import { api } from '@/utils';
//   import { API, SOCKET_EVENTS } from '@/constants';
//   import { socketEmit } from '@/utils/hooks';
//
//   const data = await api.get<User[]>('/api/users/search', { q: 'john' });
//   const channel = await api.post<Channel>('/api/channels', { type: 'DIRECT', participantIds: ['...'] });
//   const result = await socketEmit<SendMessageResponse>(SOCKET_EVENTS.SEND_MESSAGE, { ... });
//

export { api, request, getAccessToken, getRefreshToken, setTokens, clearTokens, loadRefreshToken } from './api';
export type { HttpMethod, RequestOptions } from './api';

export { socket } from './socket';
