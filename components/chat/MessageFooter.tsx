"use client";

import { FiAlertCircle, FiAlertTriangle, FiCheck, FiClock, FiRotateCw, FiX } from "react-icons/fi";
import { MessageStatus } from "@/constants";
import type { StoredMessage } from "@/lib/db";

interface MessageFooterProps {
  msg: StoredMessage;
  isMine: boolean;
  onRetry: (id: string) => void;
  onDiscard: (id: string) => void;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** Timestamp, delivery state (sending / sent / failed + retry), signature warning. */
export default function MessageFooter({ msg, isMine, onRetry, onDiscard }: MessageFooterProps) {
  const failed = msg.status === MessageStatus.FAILED;
  const pending = msg.status === MessageStatus.PENDING;

  return (
    <p className={`mt-1 flex flex-wrap items-center gap-1 px-2 text-[10px] text-zinc-400 ${isMine ? "justify-end" : ""}`}>
      {msg.verified === false && !msg.isDeleted && (
        <span
          title="The sender's signature on this message could not be verified"
          className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-px font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
        >
          <FiAlertTriangle className="h-2.5 w-2.5" />
          Unverified
        </span>
      )}
      {formatTime(msg.createdAt)}
      {isMine && pending && <FiClock className="h-3 w-3" aria-label="Sending" />}
      {isMine && !pending && !failed && <FiCheck className="h-3 w-3" aria-label="Sent" />}
      {isMine && failed && (
        <>
          <span className="inline-flex items-center gap-0.5 font-semibold text-red-500">
            <FiAlertCircle className="h-3 w-3" />
            Not sent
          </span>
          <button
            type="button"
            onClick={() => onRetry(msg.id)}
            className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-px font-semibold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/15"
          >
            <FiRotateCw className="h-2.5 w-2.5" />
            Retry
          </button>
          <button
            type="button"
            aria-label="Discard message"
            onClick={() => onDiscard(msg.id)}
            className="grid h-4 w-4 place-items-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
          >
            <FiX className="h-2.5 w-2.5" />
          </button>
        </>
      )}
    </p>
  );
}
