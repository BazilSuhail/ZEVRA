'use client';

import {
  useQuery,
  useMutation,
  type UseQueryOptions,
  type UseMutationOptions,
  type QueryKey,
} from '@tanstack/react-query';
import { api, type HttpMethod } from './api';

// ─── useApiQuery ────────────────────────────────────────────────────────────
//
// Wraps React Query + our api.get() for clean component usage.
//
// Usage:
//   const { data, isLoading, error } = useApiQuery<User[]>({
//     key: ['users', 'search'],
//     url: API.USERS.SEARCH,
//     params: { q: searchQuery },
//     enabled: !!searchQuery,
//   });
//

export interface UseApiQueryOptions<T> extends Omit<UseQueryOptions<T, Error>, 'queryFn' | 'queryKey'> {
  /** React Query cache key. */
  key: QueryKey;
  /** API endpoint URL (use constants from @/constants). */
  url: string;
  /** Query params (for GET requests). */
  params?: Record<string, unknown>;
  /** Request timeout in ms. */
  timeout?: number;
}

export function useApiQuery<T>({
  key,
  url,
  params,
  timeout,
  ...queryOptions
}: UseApiQueryOptions<T>) {
  return useQuery<T, Error>({
    queryKey: key,
    queryFn: () => api.get<T>(url, params),
    ...queryOptions,
  });
}

// ─── useApiMutation ─────────────────────────────────────────────────────────
//
// Wraps React Query mutations + our api.post/put/delete.
//
// Usage:
//   const { mutate, isPending } = useApiMutation<CreateChannelResponse, CreateChannelBody>({
//     method: 'POST',
//     url: API.CHANNELS.CREATE,
//     onSuccess: (data) => { ... },
//   });
//   mutate({ type: 'DIRECT', participantIds: ['...'] });
//

export interface UseApiMutationOptions<TData, TVariables>
  extends Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'> {
  method: HttpMethod;
  url: string | ((variables: TVariables) => string);
  /** Transform variables to request body. Default: variables itself. */
  toBody?: (variables: TVariables) => unknown;
}

export function useApiMutation<TData, TVariables = unknown>({
  method,
  url,
  toBody,
  ...mutationOptions
}: UseApiMutationOptions<TData, TVariables>) {
  return useMutation<TData, Error, TVariables>({
    mutationFn: async (variables) => {
      const resolvedUrl = typeof url === 'function' ? url(variables) : url;
      const body = toBody ? toBody(variables) : variables;

      switch (method) {
        case 'GET':
          return api.get<TData>(resolvedUrl, body as Record<string, unknown>);
        case 'POST':
          return api.post<TData>(resolvedUrl, body);
        case 'PUT':
          return api.put<TData>(resolvedUrl, body);
        case 'PATCH':
          return api.patch<TData>(resolvedUrl, body);
        case 'DELETE':
          return api.delete<TData>(resolvedUrl);
        default:
          throw new Error(`Unsupported method: ${method}`);
      }
    },
    ...mutationOptions,
  });
}

// ─── useSocketMutation ──────────────────────────────────────────────────────
//
// For socket-based operations that need ack (send message, get messages, etc.)
// Returns a mutation that calls socket.emit().
//
// Usage:
//   const { mutate, isPending } = useSocketMutation({
//     event: SOCKET_EVENTS.SEND_MESSAGE,
//     onSuccess: (res) => { ... },
//   });
//   mutate({ channelId, encryptedContent, ... });
//

import { socket } from './socket';

export interface UseSocketMutationOptions<TData, TVariables>
  extends Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'> {
  event: string;
  timeout?: number;
}

export function useSocketMutation<TData, TVariables = unknown>({
  event,
  timeout,
  ...mutationOptions
}: UseSocketMutationOptions<TData, TVariables>) {
  return useMutation<TData, Error, TVariables>({
    mutationFn: (variables) => socket.emit<TData>(event, variables, timeout),
    ...mutationOptions,
  });
}
