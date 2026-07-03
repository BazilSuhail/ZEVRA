// ─── Utils Barrel ───────────────────────────────────────────────────────────
//
// Usage in components:
//   import { api, socket, useApiQuery, useApiMutation, useSocketMutation } from '@/utils';
//   import { API, SOCKET_EVENTS } from '@/constants';
//
//   const { data } = useApiQuery<User[]>({
//     key: ['users', search],
//     url: API.USERS.SEARCH,
//     params: { q: search },
//   });
//
//   const { mutate } = useApiMutation<CreateRes, CreateBody>({
//     method: 'POST',
//     url: API.CHANNELS.CREATE,
//   });
//

export { api, request, getAccessToken, getRefreshToken, setTokens, clearTokens, loadRefreshToken } from './api';
export type { HttpMethod, RequestOptions } from './api';

export { socket } from './socket';

export { useApiQuery, useApiMutation, useSocketMutation } from './hooks';
export type { UseApiQueryOptions, UseApiMutationOptions, UseSocketMutationOptions } from './hooks';
