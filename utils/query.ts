"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { api, request } from "./api";

// ─── Query hook ───────────────────────────────────────────────────────────────
// Usage:
//   const { data, isLoading } = useFetch<Channel[]>('channels', () => api.get('/channels'));

export function useFetch<T>(
  key: string | readonly unknown[],
  fn: () => Promise<T>,
  options?: Omit<UseQueryOptions<T>, "queryKey" | "queryFn">
) {
  return useQuery<T>({
    queryKey: Array.isArray(key) ? key : [key],
    queryFn: fn,
    ...options,
  });
}

// ─── Mutation hook ────────────────────────────────────────────────────────────
// Usage:
//   const send = useAct<Message>((data) => api.post('/messages', data));
//   send.mutate({ channelId, encryptedContent, ... });

export function useAct<TData, TVariables = unknown>(
  fn: (vars: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, Error, TVariables> & {
    invalidate?: string | readonly unknown[];
  }
) {
  const qc = useQueryClient();

  return useMutation<TData, Error, TVariables>({
    mutationFn: fn,
    onSuccess: (...args) => {
      options?.onSuccess?.(...args);
      if (options?.invalidate) {
        qc.invalidateQueries({
          queryKey: Array.isArray(options.invalidate)
            ? options.invalidate
            : [options.invalidate],
        });
      }
    },
    ...options,
  });
}

// ─── Export raw api + request for direct use in pages ─────────────────────────

export { api, request, useQueryClient };
