import { createClient, type SupabaseClient, type RealtimeChannel } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: { eventsPerSecond: 10 },
      },
    });
  }
  return client;
}

const channels = new Map<string, RealtimeChannel>();
const channelReady = new Map<string, Promise<void>>();

function getChannel(name: string) {
  let channel = channels.get(name);
  if (!channel) {
    channel = getSupabase().channel(name);
    channels.set(name, channel);
  }
  return channel;
}

function subscribeChannel(name: string) {
  const existing = channelReady.get(name);
  if (existing) return existing;

  const channel = getChannel(name);
  const ready = new Promise<void>((resolve, reject) => {
    channel.subscribe((status) => {
      console.log(`[Realtime] ${name}: ${status}`);
      if (status === "SUBSCRIBED") resolve();
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        channelReady.delete(name);
        reject(new Error(`${name}: ${status}`));
      }
    });
  });
  channelReady.set(name, ready);
  return ready;
}

// ─── Messages ───────────────────────────────────────────────────────────────
// Messages are broadcast after the server confirms the database write.

export function subscribeToMessages(
  channelId: string,
  onInsert: (msg: Record<string, unknown>) => void,
  onDelete?: (messageId: string) => void,
) {
  const name = `room:${channelId}`;
  const ch = getChannel(name);

  ch.on("broadcast", { event: "new-message" }, ({ payload }) => {
    console.log(`[Realtime] received new-message in ${name}`);
    onInsert((payload as { message: Record<string, unknown> }).message);
  });

  if (onDelete) {
    ch.on("broadcast", { event: "delete-message" }, ({ payload }) => {
      onDelete((payload as { messageId: string }).messageId);
    });
  }

  void subscribeChannel(name).catch((error) => console.error("[Realtime] message subscription failed", error));
  return ch;
}

export function broadcastNewMessage(channelId: string, message: Record<string, unknown>) {
  const name = `room:${channelId}`;
  const ch = getChannel(name);
  void subscribeChannel(name).then(() => ch.send({
    type: "broadcast",
    event: "new-message",
    payload: { message },
  })).then((status) => console.log(`[Realtime] sent new-message in ${name}: ${status}`))
    .catch((error) => console.error(`[Realtime] new-message failed`, error));
}

export function broadcastDelete(channelId: string, messageId: string) {
  const name = `room:${channelId}`;
  const ch = getChannel(name);
  void subscribeChannel(name).then(() => ch.send({
    type: "broadcast",
    event: "delete-message",
    payload: { messageId },
  })).catch((error) => console.error(`[Realtime] delete-message failed`, error));
}

let channelsRoom: RealtimeChannel | null = null;

function getChannelsRoom(): RealtimeChannel {
  if (!channelsRoom) channelsRoom = getSupabase().channel("channels-room");
  return channelsRoom;
}

export function subscribeToChannels(
  onUpdate: (channelId: string, updates: Record<string, unknown>) => void,
) {
  const ch = getChannelsRoom();
  ch.on("broadcast", { event: "channel-update" }, ({ payload }) => {
    const p = payload as { channelId: string; updates: Record<string, unknown> };
    onUpdate(p.channelId, p.updates);
  });
  void subscribeChannel("channels-room").catch((error) => console.error("[Realtime] channels subscription failed", error));
  return ch;
}

export function broadcastChannelUpdate(channelId: string, updates: Record<string, unknown>) {
  const ch = getChannelsRoom();
  void subscribeChannel("channels-room").then(() => ch.send({
    type: "broadcast",
    event: "channel-update",
    payload: { channelId, updates },
  }))
    .catch((error) => console.error(`[Realtime] channel-update failed`, error));
}

// ─── Presence ───────────────────────────────────────────────────────────────
// Must add .on() handlers BEFORE .subscribe(). Track and subscribe share one channel.

let onlineChannel: RealtimeChannel | null = null;
let onlineReady = false;
const presenceSubscribers = new Set<
  (state: Record<string, { user_id: string; username: string }[]>) => void
>();

function getOnlineChannel(): RealtimeChannel {
  if (!onlineChannel) {
    onlineChannel = getSupabase().channel("online");
    // Register before either tracking or subscription can start.
    onlineChannel.on("presence", { event: "sync" }, () => {
      const state = onlineChannel?.presenceState() as Record<
        string,
        { user_id: string; username: string }[]
      > ?? {};
      for (const subscriber of presenceSubscribers) subscriber(state);
    });
  }
  return onlineChannel;
}

function ensureOnlineSubscribed() {
  if (!onlineReady) {
    onlineReady = true;
    getOnlineChannel().subscribe();
  }
}

export function trackPresence(userId: string, username: string) {
  const ch = getOnlineChannel();
  ensureOnlineSubscribed();
  ch.track({
    user_id: userId,
    username,
    online_at: new Date().toISOString(),
  });
  return ch;
}

export function subscribeToPresence(
  onSync: (state: Record<string, { user_id: string; username: string }[]>) => void,
) {
  const ch = getOnlineChannel();
  presenceSubscribers.add(onSync);
  ensureOnlineSubscribed();
  return {
    unsubscribe: () => presenceSubscribers.delete(onSync),
  };
}

// ─── Typing ─────────────────────────────────────────────────────────────────
// Fire-and-forget — no shared channel needed. Uses cached channel per-room.

export function broadcastTyping(channelId: string, userId: string, username: string) {
  const name = `typing:${channelId}`;
  const ch = getChannel(name);
  void subscribeChannel(name).then(() => ch.send({
    type: "broadcast",
    event: "typing:start",
    payload: { userId, username },
  }))
    .catch((error) => console.error(`[Realtime] typing:start failed`, error));
}

export function broadcastTypingStop(channelId: string, userId: string, username: string) {
  const name = `typing:${channelId}`;
  const ch = getChannel(name);
  void subscribeChannel(name).then(() => ch.send({
    type: "broadcast",
    event: "typing:stop",
    payload: { userId, username },
  }))
    .catch((error) => console.error(`[Realtime] typing:stop failed`, error));
}

export function subscribeToTyping(
  channelId: string,
  callbacks: {
    onStart: (payload: { userId: string; username: string }) => void;
    onStop: (payload: { userId: string; username: string }) => void;
  },
) {
  const name = `typing:${channelId}`;
  const ch = getChannel(name);
  ch.on("broadcast", { event: "typing:start" }, ({ payload }) => {
    callbacks.onStart(payload as { userId: string; username: string });
  })
    .on("broadcast", { event: "typing:stop" }, ({ payload }) => {
      callbacks.onStop(payload as { userId: string; username: string });
    });
  void subscribeChannel(name).catch((error) => console.error("[Realtime] typing subscription failed", error));
  return ch;
}

// ─── Reconnect Recovery ────────────────────────────────────────────────────
// After a Supabase Realtime reconnect, refetch messages to fill any gap
// that occurred during the disconnect.

let lastReconnectCallback: (() => void) | null = null;

export function onReconnect(callback: () => void) {
  lastReconnectCallback = callback;
}

// Listen for Supabase connection state changes
function setupReconnectListener() {
  const supabase = getSupabase();

  // Supabase client emits 'system' events for connection state changes.
  // We subscribe to a dedicated channel to detect reconnects.
  const monitor = supabase.channel("__reconnect_monitor__");

  // Track channel state — when it goes from CLOSED/TIMED_OUT to JOINED,
  // it means we reconnected and may have missed events.
  let wasDisconnected = false;

  monitor
    .on("system", { event: "channel" }, (payload) => {
      const state = payload.payload as string;
      if (state === "CHANNEL_ERROR" || state === "TIMED_OUT" || state === "CLOSED") {
        wasDisconnected = true;
      }
      if (state === "JOINING" && wasDisconnected) {
        wasDisconnected = false;
        // Give the connection time to stabilize before refetching
        setTimeout(() => {
          lastReconnectCallback?.();
        }, 1000);
      }
    })
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        // Connected — monitor for future disconnects
      }
    });
}

// Initialize reconnect listener once
let reconnectInitialized = false;
export function ensureReconnectListener() {
  if (!reconnectInitialized && typeof window !== "undefined") {
    reconnectInitialized = true;
    setupReconnectListener();
  }
}

// ─── Cleanup ────────────────────────────────────────────────────────────────

export function unsubscribeAll() {
  const supabase = getSupabase();
  supabase.removeAllChannels();
  channels.clear();
  channelReady.clear();
  presenceSubscribers.clear();
  channelsRoom = null;
  onlineChannel = null;
  onlineReady = false;
}
