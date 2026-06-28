"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FiArrowLeft,
  FiUsers,
  FiArchive,
  FiUserPlus,
  FiLoader,
  FiAlertCircle,
  FiTrash2,
  FiX,
  FiLogOut,
  FiShieldOff,
  FiMoreVertical,
} from "react-icons/fi";
import { useFetch, useAct, useQueryClient } from "@/utils/query";
import { api } from "@/utils/api";
import { useAuth } from "@/context/useAuth";
import type { ChannelInfo } from "@/utils/types";

function parseParticipantIds(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    const cleaned = raw.replace(/[{}"]/g, "");
    if (!cleaned) return [];
    return cleaned.split(",").filter(Boolean);
  }
  return [];
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmColor?: string;
  icon: typeof FiAlertCircle;
  iconColor?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  confirmColor = "bg-red-600 hover:bg-red-700",
  icon: Icon,
  iconColor = "text-red-500",
  loading,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
        onClick={onCancel}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
          <h3 className="mb-2 text-lg font-semibold">{title}</h3>
          <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">{message}</p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${confirmColor}`}
            >
              {loading ? <FiLoader className="mx-auto h-4 w-4 animate-spin" /> : confirmLabel}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Member Action Menu ───────────────────────────────────────────────────────

interface MemberMenuProps {
  isOpen: boolean;
  isSelf: boolean;
  isMemberAdmin: boolean;
  isMyAdmin: boolean;
  onRemove: () => void;
  onBlock: () => void;
  onClose: () => void;
}

function MemberMenu({ isOpen, isSelf, isMemberAdmin, isMyAdmin, onRemove, onBlock, onClose }: MemberMenuProps) {
  if (!isOpen) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute right-0 top-full z-40 mt-1 w-44 rounded-xl border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
    >
      {!isSelf && (
        <>
          {isMyAdmin && !(isMemberAdmin && isMyAdmin) && (
            <button
              onClick={() => { onRemove(); onClose(); }}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <FiTrash2 className="h-4 w-4" /> Remove from group
            </button>
          )}
          <button
            onClick={() => { onBlock(); onClose(); }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20"
          >
            <FiShieldOff className="h-4 w-4" /> Block user
          </button>
        </>
      )}
      {isSelf && (
        <button
          onClick={() => { onRemove(); onClose(); }}
          className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          <FiLogOut className="h-4 w-4" /> Leave group
        </button>
      )}
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ChannelInfoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user: me } = useAuth();
  const qc = useQueryClient();
  const [addUsername, setAddUsername] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);

  // Modal states
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    confirmColor?: string;
    icon: typeof FiAlertCircle;
    onConfirm: () => void;
  }>({ open: false, title: "", message: "", confirmLabel: "", icon: FiAlertCircle, onConfirm: () => {} });

  const { data: channel, isLoading } = useFetch<ChannelInfo>(
    ["channel", id],
    () => api.get<ChannelInfo>(`/channels/${id}`),
    { staleTime: 30_000 }
  );

  const archiveChannel = useAct(
    () => api.post(`/channels/${id}/archive`),
    {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["channels"] });
        router.push("/chat");
      },
    }
  );

  const addMember = useAct(
    (vars: { userId: string; role: string }) =>
      api.post(`/channels/${id}/members`, vars),
    {
      onSuccess: () => {
        setAddUsername("");
        setAddError(null);
        qc.invalidateQueries({ queryKey: ["channel", id] });
      },
      onError: (err: Error) => {
        setAddError(err.message || "Failed to add member");
      },
    }
  );

  const removeMember = useAct(
    (userId: string) => api.del(`/channels/${id}/members/${userId}`),
    {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["channel", id] });
        qc.invalidateQueries({ queryKey: ["channels"] });
      },
    }
  );

  const handleAddMember = async () => {
    if (!addUsername.trim()) return;
    setAddError(null);
    try {
      const users = await api.get<{ id: string; username: string }[]>(
        `/api/users/search?q=${encodeURIComponent(addUsername)}&limit=5`
      );
      const found = users.find((u) => u.username.toLowerCase() === addUsername.toLowerCase());
      if (!found) {
        setAddError("User not found");
        return;
      }
      addMember.mutate({ userId: found.id, role: "MEMBER" });
    } catch {
      setAddError("Search failed");
    }
  };

  const openRemoveModal = (userId: string, username: string) => {
    setConfirmModal({
      open: true,
      title: "Remove Member",
      message: `Are you sure you want to remove ${username} from this group? They will no longer have access to messages or media in this conversation.`,
      confirmLabel: "Remove",
      confirmColor: "bg-red-600 hover:bg-red-700",
      icon: FiTrash2,
      onConfirm: () => {
        removeMember.mutate(userId);
        setConfirmModal((prev) => ({ ...prev, open: false }));
      },
    });
  };

  const openLeaveModal = () => {
    setConfirmModal({
      open: true,
      title: "Leave Group",
      message: "Are you sure you want to leave this group? You will lose access to all messages and media. An admin can add you back later.",
      confirmLabel: "Leave Group",
      confirmColor: "bg-red-600 hover:bg-red-700",
      icon: FiLogOut,
      onConfirm: () => {
        if (me) {
          removeMember.mutate(me.id);
          setConfirmModal((prev) => ({ ...prev, open: false }));
          router.push("/chat");
        }
      },
    });
  };

  const openArchiveModal = () => {
    const isArchived = channel?.isArchived;
    setConfirmModal({
      open: true,
      title: isArchived ? "Unarchive Channel" : "Archive Channel",
      message: isArchived
        ? "This channel will reappear in your chat list and you will receive new messages again."
        : "This channel will be hidden from your chat list. You can unarchive it later from channel info.",
      confirmLabel: isArchived ? "Unarchive" : "Archive",
      confirmColor: isArchived ? "bg-indigo-600 hover:bg-indigo-700" : "bg-amber-600 hover:bg-amber-700",
      icon: FiArchive,
      onConfirm: () => {
        archiveChannel.mutate();
        setConfirmModal((prev) => ({ ...prev, open: false }));
      },
    });
  };

  const openBlockModal = (username: string) => {
    setConfirmModal({
      open: true,
      title: `Block ${username}?`,
      message: `You won't receive messages from ${username} anymore. This action can be reversed from your blocked users list.`,
      confirmLabel: "Block",
      confirmColor: "bg-amber-600 hover:bg-amber-700",
      icon: FiShieldOff,
      onConfirm: () => {
        // TODO: wire to backend block endpoint
        setConfirmModal((prev) => ({ ...prev, open: false }));
      },
    });
  };

  const isGroup = channel?.type === "GROUP";
  const myRole = channel?.members?.find((m) => m.id === me?.id)?.role;
  const isAdmin = myRole === "ADMIN";

  return (
    <div className="flex flex-1 flex-col overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {/* Header */}
      <div className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <Link href={`/chat/channel/${id}`} className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <FiArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold">Channel Info</h1>
        </div>
      </div>

      <div className="flex-1 px-6 py-6">
        <div className="w-full space-y-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <FiLoader className="h-6 w-6 animate-spin text-zinc-400" />
            </div>
          )}

          {/* Channel details */}
          {channel && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                  {channel.name?.[0]?.toUpperCase() || (isGroup ? "G" : "D")}
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{channel.name || "Direct Message"}</h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {isGroup
                      ? `${channel.members?.length ?? 0} members`
                      : "Direct message"}
                  </p>
                  {channel.isArchived && (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      <FiArchive className="h-3 w-3" /> Archived
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Members */}
          {channel && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <FiUsers className="h-5 w-5 text-indigo-500" />Members
                <span className="ml-auto rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  {channel.members?.length ?? 0}
                </span>
              </h2>
              <div className="space-y-2">
                {channel.members?.map((m, i) => {
                  const isSelf = m.id === me?.id;
                  const isMemberAdmin = m.role === "ADMIN";

                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="relative flex items-center justify-between rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                            {m.username[0]?.toUpperCase()}
                          </div>
                          {isMemberAdmin && (
                            <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500">
                              <FiShieldOff className="h-2.5 w-2.5 text-white" style={{ transform: "rotate(0deg)" }} />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {m.username}
                            {isSelf && <span className="ml-1 text-xs text-zinc-400">(you)</span>}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {isMemberAdmin ? "Admin" : "Member"} · Joined {new Date(m.joinedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isMemberAdmin && (
                          <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-bold text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                            ADMIN
                          </span>
                        )}
                        {/* Only show menu button if admin or self */}
                        {(isAdmin || isSelf) && (
                          <div className="relative">
                            <button
                              onClick={() => setMenuOpenFor(menuOpenFor === m.id ? null : m.id)}
                              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                            >
                              <FiMoreVertical className="h-4 w-4" />
                            </button>
                            <AnimatePresence>
                              <MemberMenu
                                isOpen={menuOpenFor === m.id}
                                isSelf={isSelf}
                                isMemberAdmin={isMemberAdmin}
                                isMyAdmin={isAdmin}
                                onRemove={() => openRemoveModal(m.id, m.username)}
                                onBlock={() => openBlockModal(m.username)}
                                onClose={() => setMenuOpenFor(null)}
                              />
                            </AnimatePresence>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Add member (group only, admin only) */}
              {isGroup && isAdmin && (
                <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-700">
                  <p className="mb-2 text-sm font-medium">Add member</p>
                  {addError && (
                    <p className="mb-2 flex items-center gap-1 text-xs text-red-500">
                      <FiAlertCircle className="h-3 w-3" />{addError}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={addUsername}
                      onChange={(e) => setAddUsername(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
                      placeholder="Search by username..."
                      className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800"
                    />
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAddMember}
                      disabled={addMember.isPending || !addUsername.trim()}
                      className="flex items-center gap-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {addMember.isPending ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiUserPlus className="h-4 w-4" />}
                      Add
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Actions */}
          {channel && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-4 text-lg font-semibold">Actions</h2>
              <div className="space-y-2">
                <button
                  onClick={openArchiveModal}
                  disabled={archiveChannel.isPending}
                  className="flex w-full items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  <FiArchive className="h-5 w-5 text-zinc-400" />
                  {channel.isArchived ? "Unarchive Channel" : "Archive Channel"}
                </button>

                {isGroup && !isAdmin && (
                  <button
                    onClick={openLeaveModal}
                    className="flex w-full items-center gap-3 rounded-xl border border-red-200 px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    <FiLogOut className="h-5 w-5" />
                    Leave Group
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        confirmColor={confirmModal.confirmColor}
        icon={confirmModal.icon}
        loading={removeMember.isPending || archiveChannel.isPending}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
}
