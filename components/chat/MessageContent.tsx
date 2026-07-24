"use client";

import Image from "next/image";
import { FiAlertTriangle, FiFile, FiLock, FiMaximize2 } from "react-icons/fi";
import type { StoredMessage } from "@/lib/db";
import {
  formatFileSize,
  isImageMime,
  parseMessageContent,
  type FileContent,
} from "@/lib/message-content";
import { useUiStore } from "@/context/stores/ui-store";

interface MessageContentProps {
  msg: StoredMessage;
  isMine: boolean;
  onOpenFile: (content: FileContent) => void;
}

/**
 * Renders a message body: deleted marker, undecryptable / locked states,
 * plain text, or an attachment card (image preview or file chip).
 */
export default function MessageContent({ msg, isMine, onOpenFile }: MessageContentProps) {
  const openUnlock = useUiStore((s) => s.setUnlockKeysOpen);

  if (msg.isDeleted) {
    return <span className={`italic ${isMine ? "text-indigo-200" : "text-zinc-400"}`}>Message deleted</span>;
  }

  if (msg.decryptState === "locked") {
    return (
      <span className={`flex flex-wrap items-center gap-2 text-xs ${isMine ? "text-indigo-100" : "text-zinc-500 dark:text-zinc-400"}`}>
        <FiLock className="h-3.5 w-3.5 shrink-0" />
        Encrypted — keys locked on this device
        <button
          type="button"
          onClick={() => openUnlock(true)}
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold transition-colors ${
            isMine
              ? "bg-white/15 text-white hover:bg-white/25"
              : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/15 dark:text-indigo-300 dark:hover:bg-indigo-500/25"
          }`}
        >
          Unlock keys
        </button>
      </span>
    );
  }

  if (msg.decryptState === "failed") {
    return (
      <span className={`flex items-center gap-2 text-xs italic ${isMine ? "text-indigo-100" : "text-zinc-500 dark:text-zinc-400"}`}>
        <FiAlertTriangle className="h-3.5 w-3.5 shrink-0" />
        Can&apos;t decrypt this message
      </span>
    );
  }

  const content = parseMessageContent(msg.plaintext);
  if (content.kind === "text") {
    return <span className="whitespace-pre-wrap break-words">{content.text}</span>;
  }

  const { file, caption } = content;
  const isImage = isImageMime(file.mime);
  const aspect = file.width && file.height ? `${file.width} / ${file.height}` : "4 / 3";

  return (
    <div className="min-w-0">
      <button
        type="button"
        onClick={() => onOpenFile({ v: 1, kind: "file", caption, file })}
        aria-label={`Open ${file.name}`}
        className="group/img block w-full cursor-pointer text-left"
      >
        {isImage ? (
          <div
            className="relative max-h-80 w-full overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800"
            style={{ aspectRatio: aspect }}
          >
            <Image
              src={file.url}
              alt={file.name}
              fill
              sizes="(max-width: 640px) 70vw, 320px"
              className="object-cover transition-transform duration-200 group-hover/img:scale-[1.02]"
            />
          </div>
        ) : (
          <div className="flex items-center gap-2.5 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 transition-colors hover:border-indigo-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-indigo-500/50">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
              <FiFile className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold text-zinc-800 dark:text-zinc-100">
                {file.name}
              </span>
              <span className="block text-[10px] text-zinc-500 dark:text-zinc-400">
                {formatFileSize(file.size)}
              </span>
            </span>
            <FiMaximize2 className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
          </div>
        )}
      </button>
      {caption && <p className="mt-1.5 whitespace-pre-wrap break-words">{caption}</p>}
    </div>
  );
}
