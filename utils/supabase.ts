import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Subscribe to a channel for realtime messages.
 *
 * Usage:
 *   const sub = subscribeToChannel(channelId, (payload) => {
 *     setMessages(prev => [...prev, payload.new]);
 *   });
 *
 *   // Cleanup
 *   sub.unsubscribe();
 */
export function subscribeToChannel(
  channelId: string,
  onInsert: (payload: { new: Record<string, unknown> }) => void,
  onUpdate?: (payload: { new: Record<string, unknown> }) => void
) {
  const channel = supabase
    .channel(`channel:${channelId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `channel_id=eq.${channelId}`,
      },
      onInsert
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "messages",
        filter: `channel_id=eq.${channelId}`,
      },
      onUpdate ?? (() => {})
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to typing indicators for a channel.
 */
export function subscribeToTyping(
  channelId: string,
  onTyping: (userId: string) => void
) {
  const channel = supabase
    .channel(`typing:${channelId}`)
    .on("broadcast", { event: "typing" }, (payload) => {
      onTyping(payload.payload.userId as string);
    })
    .subscribe();

  return channel;
}

/**
 * Broadcast typing event.
 */
export function broadcastTyping(channelId: string, userId: string) {
  const channel = supabase.channel(`typing:${channelId}`);
  channel.send({
    type: "broadcast",
    event: "typing",
    payload: { userId },
  });
}
