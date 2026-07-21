// ─── Attachment message payloads ────────────────────────────────────────────
//
// Attachment descriptors live INSIDE the E2EE ciphertext as a versioned JSON
// envelope, so the server only ever stores the encrypted blob — URLs and
// filenames are never readable by it. Everything else (legacy text messages,
// undecryptable payloads) must keep rendering as plain text.

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // mirrors server limit

export const ALLOWED_ATTACHMENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

export interface AttachmentDescriptor {
  url: string;
  name: string;
  mime: string;
  size: number;
  width?: number;
  height?: number;
}

export interface FileContent {
  v: 1;
  kind: "file";
  caption: string;
  file: AttachmentDescriptor;
}

export type MessageContent = { kind: "text"; text: string } | FileContent;

export function buildFileContent(
  caption: string,
  file: AttachmentDescriptor,
): string {
  const payload: FileContent = { v: 1, kind: "file", caption, file };
  return JSON.stringify(payload);
}

export function parseMessageContent(plaintext: string): MessageContent {
  if (plaintext.startsWith("{")) {
    try {
      const obj = JSON.parse(plaintext);
      if (
        obj &&
        obj.v === 1 &&
        obj.kind === "file" &&
        typeof obj.file === "object" &&
        obj.file !== null &&
        typeof obj.file.url === "string" &&
        typeof obj.file.name === "string"
      ) {
        return {
          v: 1,
          kind: "file",
          caption: typeof obj.caption === "string" ? obj.caption : "",
          file: {
            url: obj.file.url,
            name: obj.file.name,
            mime:
              typeof obj.file.mime === "string"
                ? obj.file.mime
                : "application/octet-stream",
            size: typeof obj.file.size === "number" ? obj.file.size : 0,
            width:
              typeof obj.file.width === "number" ? obj.file.width : undefined,
            height:
              typeof obj.file.height === "number" ? obj.file.height : undefined,
          },
        };
      }
    } catch {
      // not our envelope — fall through to plain text
    }
  }
  return { kind: "text", text: plaintext };
}

export function isImageMime(mime: string): boolean {
  return mime.startsWith("image/");
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes < 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Sidebar / preview label: "🖼 Photo", "📎 file.pdf", or the text itself. */
export function contentPreviewText(plaintext: string): string {
  const content = parseMessageContent(plaintext);
  if (content.kind === "file") {
    return isImageMime(content.file.mime)
      ? "🖼 Photo"
      : `📎 ${content.file.name}`;
  }
  return content.text;
}
