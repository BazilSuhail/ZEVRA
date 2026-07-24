"use client";

import { MessageStatus } from "@/constants";
import type { MessageReaction, StoredMessage } from "@/lib/db";
import type { FileContent } from "@/lib/message-content";
import MessageContent from "./MessageContent";
import MessageFooter from "./MessageFooter";
import MessageReactions from "./MessageReactions";
import { isTempId } from "./use-conversation";

interface MessageItemProps {
  msg: StoredMessage;
  isMine: boolean;
  meId: string | undefined;
  /** Group chats show the sender above other people's messages */
  sender?: { name: string; color: string } | null;
  reactions: MessageReaction[] | undefined;
  pickerOpen: boolean;
  onPickerOpenChange: (open: boolean) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onRetry: (id: string) => void;
  onDiscard: (id: string) => void;
  onOpenFile: (content: FileContent) => void;
}

/** One chat bubble with content, reactions and delivery footer (DM + group). */
export default function MessageItem({
  msg,
  isMine,
  meId,
  sender,
  reactions,
  pickerOpen,
  onPickerOpenChange,
  onToggleReaction,
  onRetry,
  onDiscard,
  onOpenFile,
}: MessageItemProps) {
  const canReact =
    !msg.isDeleted && !isTempId(msg.id) && msg.status !== MessageStatus.FAILED;

  return (
    <div className={`mb-5 flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[80%] lg:max-w-120">
        {sender && (
          <div className="mb-1 flex items-center gap-2 px-1">
            <div
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${sender.color}`}
            >
              {sender.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-[11px] font-semibold text-zinc-500">{sender.name}</span>
          </div>
        )}
        <div className="group relative">
          <div
            className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
              isMine
                ? `rounded-br-sm bg-indigo-600 text-white ${msg.status === MessageStatus.FAILED ? "opacity-70" : ""}`
                : "rounded-bl-sm bg-white text-zinc-700 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-zinc-800"
            }`}
          >
            <MessageContent msg={msg} isMine={isMine} onOpenFile={onOpenFile} />
          </div>

          <MessageReactions
            messageId={msg.id}
            isMine={isMine}
            canReact={canReact}
            reactions={reactions}
            meId={meId}
            pickerOpen={pickerOpen}
            onPickerOpenChange={onPickerOpenChange}
            onToggle={onToggleReaction}
          />

          <MessageFooter msg={msg} isMine={isMine} onRetry={onRetry} onDiscard={onDiscard} />
        </div>
      </div>
    </div>
  );
}
