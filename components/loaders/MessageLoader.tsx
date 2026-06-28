import { FiLoader } from "react-icons/fi";
import { motion } from "motion/react";

export function MessageLoader({
  isSelf,
  isDecrypting,
}: {
  isSelf: boolean;
  isDecrypting?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isSelf ? "justify-end" : "gap-2"}`}
    >
      {!isSelf && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700">
          <div className="h-6 w-6 animate-pulse rounded-full bg-zinc-300 dark:bg-zinc-600" />
        </div>
      )}
      <div className={`flex flex-col ${isSelf ? "items-end w-[70%]" : "items-start w-[70%]"}`}>
        {!isSelf && <div className="mb-1 h-3 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />}
        <div
          className={`rounded-2xl px-4 py-2.5 ${isSelf
            ? "rounded-tr-md bg-indigo-400/40 dark:bg-indigo-600/30"
            : "rounded-tl-md bg-zinc-200 dark:bg-zinc-700/50"
          }`}
        >
          {isDecrypting ? (
            <div className="flex items-center gap-2">
              <FiLoader className="h-4 w-4 animate-spin text-indigo-400" />
              <span className="text-sm text-zinc-400 dark:text-zinc-500">Decrypting...</span>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <div className={`h-4 w-48 animate-pulse rounded ${isSelf
                  ? "bg-indigo-300/60 dark:bg-indigo-400/30"
                  : "bg-zinc-300 dark:bg-zinc-600"
                }`} />
                <div className={`h-4 w-32 animate-pulse rounded ${isSelf
                  ? "bg-indigo-300/60 dark:bg-indigo-400/30"
                  : "bg-zinc-300 dark:bg-zinc-600"
                }`} />
              </div>
              <div className="mt-1 h-2 w-12 animate-pulse rounded bg-zinc-300/60 dark:bg-zinc-600/60" />
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
