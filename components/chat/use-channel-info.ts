"use client";

import { useEffect, useState } from "react";
import { api, getErrorMessage } from "@/utils/api";
import type { ChannelInfo } from "./use-conversation";

/** GET /channels/:id — channel row + members (for the info pages). */
export function useChannelInfo(channelId: string) {
  const [channel, setChannel] = useState<ChannelInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api
      .get<ChannelInfo>(`/channels/${channelId}`)
      .then((data) => {
        if (alive) setChannel(data);
      })
      .catch((err) => {
        if (alive) setError(getErrorMessage(err, "Failed to load conversation details"));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [channelId]);

  return { channel, error, loading };
}
