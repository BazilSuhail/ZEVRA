"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  FiArrowLeft, FiShield, FiLock, FiSend,
  FiLoader, FiAlertCircle, FiTrash2, FiCheckCircle,
  FiUsers, FiInfo, FiChevronDown,
} from "react-icons/fi";
import { api } from "@/utils/api";
import { useAuth } from "@/context/useAuth";
import { useKeys } from "@/context/stores/keysStore";
import { useMessages } from "@/context/stores/messagesStore";
import { useChannels } from "@/context/stores/channelsStore";
import { useWatermark } from "@/utils/watermark";
import {
  encryptMessage, generateGroupKey,
  encryptGroupKeyForReceiver,
  signMessage, verifySignature,
} from "@/utils/crypto";
import { decryptContent } from "@/utils/decrypt";
import { MessageLoader } from "@/components/loaders/MessageLoader";
import {
  subscribeToMessages, subscribeToTyping,
  broadcastTyping, broadcastTypingStop, broadcastNewMessage,
  broadcastDelete, broadcastChannelUpdate,
} from "@/utils/supabase";
import type { Message, ChannelInfo } from "@/utils/types";

// ─── Helpers ──────────────────────────────────────────────────────────────
const parseParticipantIds = (raw: unknown): string[] => {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    const cleaned = raw.replace(/[{}"]/g, "");
    return cleaned ? cleaned.split(",").filter(Boolean) : [];
  }
  return [];
};

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 0) return time;
  if (diffDays === 1) return `Yesterday ${time}`;
  if (diffDays < 7) return `${d.toLocaleDateString([], { weekday: "short" })} ${time}`;
  return `${d.toLocaleDateString([], { month: "short", day: "numeric" })} ${time}`;
};

const formatDateSeparator = (dateStr: string) => {
  const d = new Date(dateStr);
  const diffDays = Math.floor((new Date().getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
};

const hashColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const colors = [
    "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
    "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    "bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400",
    "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
    "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
    "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
    "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
  ];
  return colors[Math.abs(hash) % colors.length];
};

const mapRowToMessage = (row: Record<string, unknown>): Message => ({
  id: (row.id ?? row.ID) as string,
  channelId: (row.channelId ?? row.channel_id) as string,
  senderId: (row.senderId ?? row.sender_id) as string,
  messageType: ((row.messageType ?? row.message_type) as string) || "TEXT",
  encryptedContent: (row.encryptedContent ?? row.encrypted_content) as string,
  contentIv: ((row.contentIv ?? row.content_iv) as string) || "",
  contentTag: ((row.contentTag ?? row.content_tag) as string) || "",
  signature: ((row.signature) as string) || "",
  sequenceNumber: ((row.sequenceNumber ?? row.sequence_number) as number) || 0,
  senderKeyEpoch: ((row.senderKeyEpoch ?? row.sender_key_epoch) as number) || 0,
  metadata: ((row.metadata) as Record<string, unknown>) ?? {},
  isDeleted: ((row.isDeleted ?? row.is_deleted) as boolean) || false,
  createdAt: ((row.createdAt ?? row.created_at) as string) || new Date().toISOString(),
});

const EMPTY_MSGS: Message[] = [];

// ─── Main Component ──────────────────────────────────────────────────────
export default function ChannelPage() {
  const { id } = useParams<{ id: string }>();
  const { user: me } = useAuth();
  const { privateKey, privateKeySign, publicKey: myPubKey, isUnlocked } = useKeys();

  // ─── State ──────────────────────────────────────────────────────────────
  const [text, setText] = useState("");
  const [nameMap, setNameMap] = useState<Record<string, string>>({});
  const [pubKeyMap, setPubKeyMap] = useState<Record<string, string>>({});
  const [pubKeySignMap, setPubKeySignMap] = useState<Record<string, string>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, number>>({});
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptProgress, setDecryptProgress] = useState({ total: 0, done: 0 });
  const [channel, setChannel] = useState<ChannelInfo | null>(null);
  const [loadingChannel, setLoadingChannel] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasScrolledRef = useRef(false);
  const shouldStickToBottomRef = useRef(true);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const lastSeenAtRef = useRef<string | null>(null);
  const decryptionLockRef = useRef(false);

  // ─── Stores ─────────────────────────────────────────────────────────────
  const messages = useMessages((s) => s.messages[id] ?? EMPTY_MSGS);
  const loadMessages = useMessages((s) => s.loadMessages);
  const addMessage = useMessages((s) => s.addMessage);
  const removeMessage = useMessages((s) => s.removeMessage);
  const hardRemove = useMessages((s) => s.hardRemove);
  const mergeDecrypted = useMessages((s) => s.mergeDecrypted);
  const updateChannel = useChannels((s) => s.updateChannel);

  useEffect(() => {
    hasScrolledRef.current = false;
    shouldStickToBottomRef.current = true;
    setShowScrollButton(false);
    setTypingUsers({});
  }, [id]);

  // ─── Fetch Channel & Keys ──────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    api.get<ChannelInfo>(`/channels/${id}`).then((data) => {
      if (cancelled) return;
      setChannel(data);
      setLoadingChannel(false);
      const map: Record<string, string> = {};
      for (const m of data.members) map[m.id] = m.username;
      setNameMap(map);

      const memberIds = data.members.map((m) => m.id);
      if (memberIds.length) {
        api.get<Record<string, { publicKey: string; publicKeySign: string }>>(
          `/keys/public?userIds=${memberIds.join("&userIds=")}`
        ).then((keys) => {
          if (cancelled) return;
          const pkMap: Record<string, string> = {};
          const pksMap: Record<string, string> = {};
          for (const [uid, k] of Object.entries(keys)) {
            pkMap[uid] = k.publicKey;
            pksMap[uid] = k.publicKeySign;
          }
          setPubKeyMap(pkMap);
          setPubKeySignMap(pksMap);
        });
      }
    });
    return () => { cancelled = true; };
  }, [id]);

  // ─── Decrypt Messages ──────────────────────────────────────────────────
  const decryptMsg = useCallback(async (msg: Message): Promise<Message> => {
    if (!privateKey || !msg.contentIv || msg.contentIv === "") return msg;

    try {
      const { plaintext } = await decryptContent(
        msg.encryptedContent, msg.contentIv, msg.contentTag,
        id, msg.senderKeyEpoch ?? 0, msg.senderId,
      );

      if (msg.signature && pubKeySignMap[msg.senderId]) {
        const valid = verifySignature(
          pubKeySignMap[msg.senderId], msg.signature, id, msg.encryptedContent, msg.sequenceNumber
        );
        if (!valid) console.warn("Invalid signature on message", msg.id);
      }

      return { ...msg, decryptedText: plaintext };
    } catch (err) {
      console.error("Decryption failed:", err);
      return { ...msg, decryptFailed: true };
    }
  }, [id, privateKey, pubKeySignMap]);

  // ─── Decrypt Messages Effect (with lock to prevent flicker) ──────────
  useEffect(() => {
    if (!isUnlocked || !messages.length || decryptionLockRef.current) return;

    const needsDecrypt = messages.filter((m) => !m.decryptedText && !m.decryptFailed && m.contentIv);
    if (!needsDecrypt.length) {
      setIsDecrypting(false);
      return;
    }

    decryptionLockRef.current = true;
    setIsDecrypting(true);
    setDecryptProgress({ total: needsDecrypt.length, done: 0 });

    let cancelled = false;

    const run = async () => {
      const results: Message[] = [];
      for (let i = 0; i < needsDecrypt.length; i++) {
        if (cancelled) break;
        const decrypted = await decryptMsg(needsDecrypt[i]);
        results.push(decrypted);
        setDecryptProgress(prev => ({ ...prev, done: i + 1 }));
      }

      if (!cancelled && results.length) {
        mergeDecrypted(id, results);
        const latest = results[0];
        if (latest?.decryptedText) {
          updateChannel(id, { lastMessageContent: latest.decryptedText });
        }
        setIsDecrypting(false);
      }
      decryptionLockRef.current = false;
    };

    run();
    return () => {
      cancelled = true;
      decryptionLockRef.current = false;
      setIsDecrypting(false);
    };
  }, [messages, isUnlocked, decryptMsg, id, mergeDecrypted, updateChannel]);

  // ─── Fetch Messages ────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    api.get<{ messages: Message[] }>(`/messages/channel/${id}?limit=50`).then((data) => {
      if (cancelled) return;
      loadMessages(id, data.messages);
      setLoadingMessages(false);
      if (data.messages.length) {
        const lastMsg = data.messages[0];
        lastSeenAtRef.current = lastMsg.createdAt;
        if (me && lastMsg.senderId !== me.id) {
          useWatermark.getState().setWatermark(id, lastMsg.id);
        }
      }
    });
    return () => { cancelled = true; };
  }, [id, me]);

  // ─── Realtime Subscriptions ────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    const sub = subscribeToMessages(
      id,
      (row) => {
        const msg = mapRowToMessage(row);
        addMessage(id, msg);
        if (me && msg.senderId !== me.id) useWatermark.getState().setWatermark(id, msg.id);
        lastSeenAtRef.current = msg.createdAt;
      },
      (messageId) => removeMessage(id, messageId),
    );
    return () => { sub.unsubscribe(); };
  }, [id, me, addMessage, removeMessage]);

  useEffect(() => {
    if (!id) return;
    const sub = subscribeToTyping(id, {
      onStart: (payload) => {
        if (payload.userId === me?.id) return;
        setTypingUsers((prev) => ({ ...prev, [payload.userId]: Date.now() }));
      },
      onStop: (payload) => {
        setTypingUsers((prev) => {
          const next = { ...prev };
          delete next[payload.userId];
          return next;
        });
      },
    });
    return () => { sub.unsubscribe(); };
  }, [id, me?.id]);

  // ─── Typing Cleanup ────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers((prev) => {
        const cleaned = { ...prev };
        let changed = false;
        for (const [uid, ts] of Object.entries(cleaned)) {
          if (now - ts > 3000) { delete cleaned[uid]; changed = true; }
        }
        return changed ? cleaned : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  }, []);

  const handleTyping = useCallback(() => {
    if (!me || !id) return;
    broadcastTyping(id, me.id, me.username);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => broadcastTypingStop(id, me.id, me.username), 2000);
  }, [me, id]);

  useEffect(() => () => { useWatermark.getState().syncToServer(id); }, [id]);

  // ─── Scroll Management ─────────────────────────────────────────────────
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    if (!loadingMessages && !hasScrolledRef.current) {
      container.scrollTop = container.scrollHeight;
      hasScrolledRef.current = true;
      shouldStickToBottomRef.current = true;
    }

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      shouldStickToBottomRef.current = isNearBottom;
      setShowScrollButton(!isNearBottom && messages.length > 10);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [loadingMessages, messages.length]);

  useEffect(() => {
    if (loadingMessages || !hasScrolledRef.current || !shouldStickToBottomRef.current) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, loadingMessages]);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // ─── Send Message ──────────────────────────────────────────────────────
  const getOrCreateGroupKey = useCallback(async (): Promise<{ groupKey: Uint8Array; epoch: number }> => {
    const epoch = 0;
    const cached = useKeys.getState().getGroupKey(id, epoch);
    if (cached) return { groupKey: cached, epoch };

    if (!privateKey || !myPubKey) throw new Error("Keys not unlocked");

    const groupKey = generateGroupKey();
    const members = channel?.members ?? [];
    const items: Array<{ receiverId: string; encryptedKey: string; keySignature: string }> = [];

    for (const member of members) {
      if (member.id === me?.id) continue;
      const memberPubKey = pubKeyMap[member.id];
      if (!memberPubKey) continue;
      items.push({
        receiverId: member.id,
        encryptedKey: await encryptGroupKeyForReceiver(groupKey, privateKey, memberPubKey, id, epoch),
        keySignature: "",
      });
    }

    items.push({
      receiverId: me!.id,
      encryptedKey: await encryptGroupKeyForReceiver(groupKey, privateKey, myPubKey, id, epoch),
      keySignature: "",
    });

    await api.post("/keys/sender-keys", { groupId: id, epoch, items });
    useKeys.getState().setGroupKey(id, epoch, groupKey);
    return { groupKey, epoch };
  }, [id, privateKey, myPubKey, channel, pubKeyMap, me]);

  const handleSend = useCallback(async () => {
    if (!text.trim() || sending || !isUnlocked || !privateKeySign) {
      if (!isUnlocked) setError("Unlock your keys first");
      return;
    }
    setSending(true);
    setError(null);
    const tempId = `temp-${Date.now()}`;
    const messageText = text.trim();

    try {
      const { groupKey, epoch } = await getOrCreateGroupKey();
      const { ciphertext, iv, tag } = await encryptMessage(messageText, groupKey);
      const signature = signMessage(privateKeySign, id, ciphertext, 0);

      const optimisticMsg: Message = {
        id: tempId,
        channelId: id,
        senderId: me?.id ?? "",
        messageType: "TEXT",
        encryptedContent: ciphertext,
        contentIv: iv,
        contentTag: tag,
        signature,
        sequenceNumber: 0,
        senderKeyEpoch: epoch,
        metadata: {},
        isDeleted: false,
        createdAt: new Date().toISOString(),
        decryptedText: messageText,
      };

      addMessage(id, optimisticMsg);
      setText("");

      updateChannel(id, {
        lastMessageContent: messageText,
        lastMessageSenderId: me?.id ?? "",
        lastMessageSenderName: me?.username ?? "",
        lastMessageAt: optimisticMsg.createdAt,
      });

      const data = await api.post<Message>("/messages", {
        channelId: id,
        encryptedContent: ciphertext,
        contentIv: iv,
        contentTag: tag,
        signature,
        sequenceNumber: 0,
        senderKeyEpoch: epoch,
        messageType: "TEXT",
        metadata: {},
      });

      hardRemove(id, tempId);
      addMessage(id, { ...data, decryptedText: messageText } as Message);

      broadcastNewMessage(id, {
        id: data.id,
        channelId: data.channelId,
        sender_id: data.senderId,
        message_type: data.messageType,
        encrypted_content: data.encryptedContent,
        content_iv: data.contentIv,
        content_tag: data.contentTag,
        signature: data.signature,
        sequence_number: data.sequenceNumber,
        sender_key_epoch: data.senderKeyEpoch,
        metadata: data.metadata,
        is_deleted: data.isDeleted,
        created_at: data.createdAt,
      });

      broadcastChannelUpdate(id, {
        last_message_id: data.id,
        last_message_at: data.createdAt,
        last_message_content: messageText,
        last_message_sender_id: me?.id ?? "",
        last_message_sender_name: me?.username ?? "",
      });

      updateChannel(id, {
        lastMessageContent: messageText,
        lastMessageSenderId: me?.id ?? "",
        lastMessageSenderName: me?.username ?? "",
        lastMessageAt: data.createdAt,
      });
      lastSeenAtRef.current = data.createdAt;
    } catch (err) {
      hardRemove(id, tempId);
      setError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }, [text, sending, id, me, isUnlocked, privateKeySign, getOrCreateGroupKey, addMessage, hardRemove, updateChannel]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // ─── Memoized Values ──────────────────────────────────────────────────
  const displayMessages = useMemo(() => messages.slice().reverse(), [messages]);

  const channelName = useMemo(() =>
    channel?.name ||
    (channel?.type === "DIRECT" && me
      ? nameMap[parseParticipantIds(channel.participantIds).find((pid) => pid !== me.id) || ""]
      : "Chat") || "Chat",
    [channel, me, nameMap]
  );

  const senderName = useCallback((senderId: string) =>
    senderId === me?.id ? "You" : (nameMap[senderId] || senderId.slice(0, 8)),
    [me, nameMap]
  );

  // ─── Memoized Grouped Messages ────────────────────────────────────────
  const groupedByDate = useMemo(() => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = "";
    for (const msg of displayMessages) {
      const msgDate = new Date(msg.createdAt).toDateString();
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msg.createdAt, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    }
    return groups;
  }, [displayMessages]);

  const isMessageDecrypting = useCallback((msg: Message) => {
    if (!isUnlocked || !msg.contentIv) return false;
    if (msg.senderId === me?.id && msg.decryptedText) return false;
    if (msg.decryptedText || msg.decryptFailed) return false;
    if (msg.senderId === me?.id && !msg.contentIv) return false;
    return true;
  }, [isUnlocked, me?.id]);

  // ─── Memoized MessageBubble ────────────────────────────────────────────
  const MessageBubble = useCallback(({ msg, isSelf }: { msg: Message; isSelf: boolean }) => {
    const displayText = msg.decryptedText || (msg.decryptFailed ? "[Unable to decrypt]" : "[Encrypted message]");
    const name = senderName(msg.senderId);
    const colorClass = hashColor(name);

    if (msg.isDeleted) {
      return <div key={msg.id} className="flex justify-center"><span className="text-xs text-zinc-400 italic">Message deleted</span></div>;
    }

    if (isSelf) {
      return (
        <motion.div
          key={msg.id}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", damping: 20 }}
          className="flex justify-end"
        >
          <div className="flex flex-col items-end w-[70%]">
            <div className="group relative">
              <div className="rounded-2xl rounded-tr-md bg-gradient-to-br from-indigo-500 to-indigo-600 px-4 py-2.5 text-white shadow-lg shadow-indigo-500/20">
                <p className="text-sm leading-relaxed break-words">{displayText}</p>
                <p className="mt-1 flex items-center gap-2 text-[10px] text-indigo-200">
                  <span>{formatTime(msg.createdAt)}</span>
                  <FiCheckCircle className="h-3 w-3" />
                </p>
              </div>
              <button
                aria-label="Delete message"
                onClick={() => api.del(`/messages/${msg.id}`).then(() => { removeMessage(id, msg.id); broadcastDelete(id, msg.id); })}
                className="absolute -top-2 -right-8 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg p-1 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
              >
                <FiTrash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        key={msg.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 20 }}
        className="flex gap-2"
      >
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${colorClass}`}>
          {name[0]?.toUpperCase() || "?"}
        </div>
        <div className="flex flex-col items-start w-[70%]">
          <p className="mb-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">{name}</p>
          <div className="rounded-2xl rounded-tl-md bg-zinc-100 dark:bg-zinc-800 px-4 py-2.5 shadow-sm">
            <p className="text-sm leading-relaxed break-words dark:text-zinc-200">{displayText}</p>
            <p className="mt-1 text-[10px] text-zinc-400">{formatTime(msg.createdAt)}</p>
          </div>
        </div>
      </motion.div>
    );
  }, [senderName, id, removeMessage]);

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-1 h-full flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header - Static */}
      <div className="flex items-center justify-between border-b border-zinc-200 bg-white/80 backdrop-blur-sm px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/chat" className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 md:hidden transition-colors">
            <FiArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-sm font-bold text-white shadow-lg shadow-indigo-500/20">
            {channelName[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate">{channelName}</p>
            <p className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
              <FiUsers className="h-3 w-3" />
              {loadingChannel ? "Loading..." : `${channel?.members?.length ?? 0} members`}
            </p>
          </div>
        </div>
        <Link href={`/chat/channel/${id}/info`} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
          <FiInfo className="h-5 w-5" />
        </Link>
      </div>

      {/* Encryption Banner - Static */}
      <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 py-2 text-xs text-indigo-600 dark:from-indigo-900/10 dark:to-purple-900/10 dark:text-indigo-400 border-b border-indigo-100/50 dark:border-indigo-800/20">
        <FiShield className="h-3 w-3" />
        <span>Messages are end-to-end encrypted</span>
        <FiLock className="h-3 w-3" />
      </div>

      {/* Decryption Progress - Animated */}
      <AnimatePresence mode="wait">
        {isDecrypting && decryptProgress.total > 0 && (
          <motion.div
            key="decrypt-progress"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-between gap-4 bg-gradient-to-r from-indigo-50/90 to-purple-50/90 dark:from-indigo-900/20 dark:to-purple-900/20 px-4 py-2 text-xs text-indigo-600 dark:text-indigo-400 border-b border-indigo-100/50 dark:border-indigo-800/20"
          >
            <div className="flex items-center gap-2">
              <FiLoader className="h-3 w-3 animate-spin" />
              <span className="font-medium">Decrypting messages...</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-32 overflow-hidden rounded-full bg-indigo-200 dark:bg-indigo-800/50">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${(decryptProgress.done / decryptProgress.total) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <span className="text-zinc-500 dark:text-zinc-400 font-mono text-[10px]">
                {decryptProgress.done}/{decryptProgress.total}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keys Locked Warning - Animated */}
      <AnimatePresence mode="wait">
        {!isUnlocked && (
          <motion.div
            key="keys-locked"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center gap-2 bg-amber-50 dark:bg-amber-900/10 py-2 text-xs text-amber-600 dark:text-amber-400 border-b border-amber-100/50 dark:border-amber-800/20"
          >
            <FiAlertCircle className="h-3 w-3 animate-pulse" />
            <span>Re-enter your password to unlock encryption keys</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden relative">
        <AnimatePresence mode="wait">
          {loadingMessages ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-12"
            >
              <FiLoader className="h-8 w-8 animate-spin text-indigo-400" />
            </motion.div>
          ) : !displayMessages.length ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center justify-center py-16 text-zinc-400"
            >
              <div className="rounded-full bg-zinc-100 dark:bg-zinc-800 p-4 mb-4">
                <FiShield className="h-8 w-8" />
              </div>
              <p className="text-sm font-medium">No messages yet</p>
              <p className="mt-1 text-xs text-zinc-300 dark:text-zinc-600">Send the first message to start the conversation</p>
            </motion.div>
          ) : (
            <motion.div
              key="messages"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {groupedByDate.map((group) => (
                <div key={group.date}>
                  <div className="flex items-center justify-center py-2">
                    <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                      {formatDateSeparator(group.date)}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {group.messages.map((msg) => {
                      const isSelf = msg.senderId === me?.id;
                      const isDecryptingMsg = isMessageDecrypting(msg);

                      if (isDecryptingMsg) {
                        return <MessageLoader key={msg.id} isSelf={isSelf} isDecrypting={isDecryptingMsg} />;
                      }

                      return <MessageBubble key={msg.id} msg={msg} isSelf={isSelf} />;
                    })}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scroll to Bottom Button */}
        <AnimatePresence>
          {showScrollButton && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={scrollToBottom}
              aria-label="Scroll to latest message"
              className="absolute bottom-4 right-4 rounded-full bg-indigo-600 p-3 text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-all hover:scale-105"
            >
              <FiChevronDown className="h-4 w-4" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Typing Indicator */}
        <AnimatePresence>
          {Object.keys(typingUsers).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="space-y-2 mt-3"
            >
              {Object.keys(typingUsers).map((uid) => {
                const name = nameMap[uid] || "Someone";
                const colorClass = hashColor(name);
                return (
                  <div key={uid} className="flex gap-2">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${colorClass}`}>
                      {name[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="flex flex-col items-start">
                      <p className="mb-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">{name}</p>
                      <div className="rounded-2xl rounded-tl-md bg-zinc-100 dark:bg-zinc-800 px-4 py-2.5">
                        <span className="text-sm text-zinc-400 dark:text-zinc-500">
                          typing
                          <span className="inline-flex gap-0.5 ml-0.5">
                            <motion.span
                              animate={{ opacity: [0, 1, 0] }}
                              transition={{ duration: 1.4, repeat: Infinity, delay: 0 }}
                            >.</motion.span>
                            <motion.span
                              animate={{ opacity: [0, 1, 0] }}
                              transition={{ duration: 1.4, repeat: Infinity, delay: 0.2 }}
                            >.</motion.span>
                            <motion.span
                              animate={{ opacity: [0, 1, 0] }}
                              transition={{ duration: 1.4, repeat: Infinity, delay: 0.4 }}
                            >.</motion.span>
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* Send Bar */}
      <div className="border-t border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80 px-4 py-3">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-2 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 dark:border-red-800/30 dark:bg-red-900/20 px-3 py-2 text-xs text-red-600 dark:text-red-400"
            >
              <FiAlertCircle className="h-3 w-3 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={text}
              onChange={(e) => { setText(e.target.value); handleTyping(); }}
              onKeyDown={handleKeyDown}
              placeholder={isUnlocked ? "Type a message..." : "🔒 Unlock keys to send..."}
              disabled={sending || !isUnlocked}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all disabled:opacity-50"
            />
            {text.length > 0 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 dark:text-zinc-500">
                {text.length}
              </div>
            )}
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            aria-label="Send message"
            disabled={!text.trim() || sending || !isUnlocked}
            className="shrink-0 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-50 disabled:hover:shadow-indigo-500/30 transition-all"
          >
            {sending ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiSend className="h-4 w-4" />}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
