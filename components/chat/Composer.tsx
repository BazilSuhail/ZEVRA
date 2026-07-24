"use client";

import { useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { FiFile, FiLoader, FiPaperclip, FiSend, FiSmile, FiX } from "react-icons/fi";
import { api, getErrorMessage } from "@/utils/api";
import {
  ALLOWED_ATTACHMENT_TYPES,
  MAX_ATTACHMENT_BYTES,
  formatFileSize,
  isImageMime,
  type AttachmentDescriptor,
} from "@/lib/message-content";

interface ComposerProps {
  placeholder: string;
  disabled?: boolean;
  onTyping: () => void;
  onError: (message: string | null) => void;
  /** Resolves true when the message was queued (draft is then cleared). */
  onSend: (caption: string, attachment: AttachmentDescriptor | null) => Promise<boolean>;
}

/** Message input with attachment pick → validate → upload → chip. */
export default function Composer({ placeholder, disabled, onTyping, onError, onSend }: ComposerProps) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<AttachmentDescriptor | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file || uploading) return;

    onError(null);
    if (file.size > MAX_ATTACHMENT_BYTES) {
      onError("File too large — maximum size is 10 MB");
      return;
    }
    if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type)) {
      onError("Unsupported file type — images, PDF, DOC, DOCX or TXT only");
      return;
    }

    setUploading(true);
    try {
      const res = await api.upload<{ url: string; bytes?: number; width?: number; height?: number }>(
        "/uploads",
        file,
      );
      if (!res?.url) throw new Error("Upload failed");
      setPendingAttachment({
        url: res.url,
        name: file.name,
        mime: file.type,
        size: res.bytes ?? file.size,
        width: res.width,
        height: res.height,
      });
    } catch (err) {
      onError(getErrorMessage(err, "Upload failed"));
    } finally {
      setUploading(false);
    }
  };

  const handleSend = async () => {
    const caption = draft.trim();
    const attachment = pendingAttachment;
    if ((!caption && !attachment) || sending || uploading || disabled) return;

    setSending(true);
    setDraft("");
    setPendingAttachment(null);
    let queued = false;
    try {
      queued = await onSend(caption, attachment);
    } finally {
      setSending(false);
    }
    if (!queued) {
      setDraft(caption);
      setPendingAttachment(attachment);
    }
  };

  return (
    <div className="relative z-10 border-t border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
      {/* Pending attachment chip / upload progress */}
      {uploading ? (
        <div className="mb-2 flex items-center gap-2.5 rounded-xl border border-indigo-200 bg-indigo-50/70 px-3 py-2 dark:border-indigo-500/30 dark:bg-indigo-500/10">
          <FiLoader className="h-4 w-4 shrink-0 animate-spin text-indigo-500 dark:text-indigo-400" />
          <span className="min-w-0 flex-1 truncate text-xs font-medium text-indigo-700 dark:text-indigo-300">
            Uploading attachment…
          </span>
        </div>
      ) : pendingAttachment ? (
        <div className="mb-2 flex items-center gap-2.5 rounded-xl border border-indigo-200 bg-indigo-50/70 px-3 py-2 dark:border-indigo-500/30 dark:bg-indigo-500/10">
          {isImageMime(pendingAttachment.mime) ? (
            <Image
              src={pendingAttachment.url}
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 shrink-0 rounded-md object-cover"
            />
          ) : (
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-white text-indigo-600 dark:bg-zinc-900 dark:text-indigo-300">
              <FiFile className="h-4 w-4" />
            </span>
          )}
          <span className="min-w-0 flex-1 text-xs font-medium text-indigo-700 dark:text-indigo-300">
            <span className="block truncate">{pendingAttachment.name}</span>
            <span className="block text-[10px] font-normal text-indigo-400 dark:text-indigo-500">
              {formatFileSize(pendingAttachment.size)}
            </span>
          </span>
          <button
            type="button"
            aria-label="Remove attachment"
            onClick={() => setPendingAttachment(null)}
            className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-indigo-400 transition-colors hover:bg-indigo-100 hover:text-indigo-700 dark:hover:bg-indigo-500/20 dark:hover:text-indigo-200"
          >
            <FiX className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}

      <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800">
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_ATTACHMENT_TYPES.join(",")}
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          type="button"
          aria-label="Attach file"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || sending || disabled}
          className="p-2 text-zinc-400 transition-colors hover:text-indigo-600 disabled:opacity-40 dark:hover:text-indigo-400"
        >
          <FiPaperclip />
        </button>
        <input
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            onTyping();
          }}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder={pendingAttachment ? "Add a caption…" : placeholder}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          disabled={sending || disabled}
        />
        <button type="button" aria-hidden tabIndex={-1} className="p-2 text-zinc-400 hover:text-zinc-600">
          <FiSmile />
        </button>
        <button
          type="button"
          aria-label="Send message"
          onClick={handleSend}
          disabled={(!draft.trim() && !pendingAttachment) || sending || uploading || disabled}
          className="rounded-xl bg-indigo-600 p-2.5 text-white hover:bg-indigo-700 disabled:opacity-40"
        >
          {sending ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiSend className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
