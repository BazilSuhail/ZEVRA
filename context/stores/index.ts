// ─── Combined Store Export ──────────────────────────────────────────────────
//
// Usage:
//   import { useAuthStore, useChatStore, useSocketStore, useUiStore, useCallStore } from '@/context/stores';
//
//   const user = useAuthStore((s) => s.user);
//   const rooms = useChatStore((s) => s.rooms);
//   const isConnected = useSocketStore((s) => s.isConnected);
//   const theme = useUiStore((s) => s.theme);
//   const activeCall = useCallStore((s) => s.activeCall);
//

export { useAuthStore, type User, type AuthState, type AuthActions } from './auth-store';
export { useChatStore, type ChatState, type ChatActions } from './chat-store';
export { useSocketStore, type SocketState, type SocketActions, type ConnectionStatus } from './socket-store';
export { useUiStore, type UiState, type UiActions, type Theme } from './ui-store';
export { useCallStore, type ActiveCall, type IncomingCall, type CallMethod, type CallStatus, type CallState, type CallActions } from './call-store';
export type { StoredRoom, StoredCall } from '@/lib/db';
