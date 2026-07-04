"use client";

import {
  memo,
  useCallback,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import {
  FiAlertCircle,
  FiKey,
  FiLoader,
  FiLock,
  FiShield,
  FiUser,
  FiZap,
} from "react-icons/fi";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { useAuthStore } from "@/context/stores";
import { api, setTokens } from "@/utils";
import { srpClient } from "@/utils/srp";

import "feral-blob/blob.css";

type BlobMood =
  | "neutral"
  | "happy"
  | "sad"
  | "hmm"
  | "sideEye";

type BlobGaze = {
  x: number;
  y: number;
};

const buttonAnimation = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: {
    type: "tween" as const,
    duration: 0.15,
    ease: "easeInOut" as const,
  },
};

const blobTransition = {
  type: "tween" as const,
  duration: 0.4,
  ease: "easeInOut" as const,
};

const JellyBlobMascot = dynamic(
  () => import("feral-blob").then((module) => module.JellyBlobMascot),
  {
    ssr: false,
    loading: () => <div className="h-full w-full" />,
  }
);

const MemoizedJellyBlobMascot = memo(JellyBlobMascot);

const FeatureBadge = memo(function FeatureBadge({
  icon,
  children,
  color,
}: {
  icon: ReactNode;
  children: ReactNode;
  color: "purple" | "indigo" | "violet";
}) {
  const colors = {
    purple:
      "border-purple-500/30 bg-purple-900/30 text-purple-300 [&>svg]:text-purple-400",
    indigo:
      "border-indigo-500/30 bg-indigo-900/30 text-indigo-300 [&>svg]:text-indigo-400",
    violet:
      "border-violet-500/30 bg-violet-900/30 text-violet-300 [&>svg]:text-violet-400",
  };

  return (
    <span
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${colors[color]}`}
    >
      {icon}
      {children}
    </span>
  );
});

const LoginMascot = memo(function LoginMascot({
  mood,
  gaze,
}: {
  mood: BlobMood;
  gaze: BlobGaze;
}) {
  const message = {
    happy: "Credentials verified! Signing in...",
    neutral: "Your zero-knowledge security companion.",
    hmm: "Focusing on your login credentials...",
    sideEye: "Keeping a side-eye on your password...",
    sad: "Oops! Double check your credentials.",
  }[mood];

  return (
    <>
      <div className="mt-4 flex h-[280px] w-[280px] items-center justify-center xl:h-[390px] xl:w-[390px]">
        <MotionConfig transition={blobTransition}>
          <div className="h-full w-full">
            <MemoizedJellyBlobMascot mood={mood} gaze={gaze} />
          </div>
        </MotionConfig>
      </div>

      <p className="mt-2 text-center text-sm font-semibold text-purple-300">
        {message}
      </p>
    </>
  );
});

const ErrorMessage = memo(function ErrorMessage({
  error,
}: {
  error: string | null;
}) {
  return (
    <AnimatePresence initial={false}>
      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-4 flex min-w-0 items-center gap-2 overflow-hidden rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          <FiAlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span className="break-words">{error}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

function InputField({
  label,
  icon,
  type = "text",
  value,
  placeholder,
  minLength,
  required = true,
  onChange,
  onFocus,
  onBlur,
}: {
  label: string;
  icon: ReactNode;
  type?: string;
  value: string;
  placeholder: string;
  minLength?: number;
  required?: boolean;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-purple-200/90">
        {label}
      </label>

      <div className="flex min-w-0 items-center gap-2 rounded-xl border border-purple-900/40 bg-black/60 px-4 py-3 transition-all focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500/40">
        <span className="shrink-0 text-purple-400">{icon}</span>

        <input
          type={type}
          value={value}
          placeholder={placeholder}
          minLength={minLength}
          required={required}
          autoComplete={type === "password" ? "current-password" : "username"}
          onFocus={onFocus}
          onBlur={onBlur}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
        />
      </div>
    </div>
  );
}

const LoginForm = memo(function LoginForm({
  onMoodChange,
}: {
  onMoodChange: (mood: BlobMood, gaze: BlobGaze) => void;
}) {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUsernameFocus = useCallback(() => {
    if (!loading) {
      onMoodChange("hmm", { x: 12, y: -5 });
    }
  }, [loading, onMoodChange]);

  const handlePasswordFocus = useCallback(() => {
    if (!loading) {
      onMoodChange("sideEye", { x: 15, y: 10 });
    }
  }, [loading, onMoodChange]);

  const handleInputBlur = useCallback(() => {
    if (!loading && !error) {
      onMoodChange("neutral", { x: 0, y: 0 });
    }
  }, [error, loading, onMoodChange]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      setError(null);

      const cleanUsername = username.trim();

      if (cleanUsername.length < 3) {
        setError("Username must be at least 3 characters");
        onMoodChange("sideEye", { x: 15, y: 10 });
        return;
      }

      if (password.length < 8) {
        setError("Password must be at least 8 characters");
        onMoodChange("sideEye", { x: 15, y: 10 });
        return;
      }

      setLoading(true);
      onMoodChange("hmm", { x: 0, y: 0 });

      try {
        const startRes = await api.post<{
          success: boolean;
          userId: string;
          username: string;
          srpSalt: string;
          B: string;
        }>("/api/auth/login/start", {
          username: cleanUsername,
        });

        if (!startRes.success) {
          throw new Error("Login start failed");
        }

        const { A, M1 } = await srpClient({
          username: cleanUsername,
          password,
          srpSalt: startRes.srpSalt,
          B: startRes.B,
        });

        const finishRes = await api.post<{
          success: boolean;
          user: {
            id: string;
            username: string;
            email: string;
          };
          accessToken: string;
          refreshToken: string;
        }>("/api/auth/login/finish", {
          username: cleanUsername,
          A,
          M1,
        });

        if (!finishRes.success) {
          throw new Error("Login failed");
        }

        setTokens(finishRes.accessToken, finishRes.refreshToken);
        setAuth(finishRes.user, finishRes.accessToken);

        onMoodChange("happy", { x: 0, y: 0 });
        router.push("/chat");
      } catch (err: unknown) {
        const responseError = err as {
          response?: {
            data?: {
              message?: string | string[];
            };
          };
          message?: string;
        };

        const responseMessage = responseError.response?.data?.message;

        const message =
          responseMessage ||
          responseError.message ||
          "Something went wrong";

        setError(Array.isArray(message) ? message[0] : message);
        onMoodChange("sad", { x: 0, y: 0 });
      } finally {
        setLoading(false);
      }
    },
    [
      username,
      password,
      onMoodChange,
      router,
      setAuth,
    ]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-w-0 w-full max-w-md justify-self-center lg:justify-self-end"
    >
      <div className="mb-4 inline-flex max-w-full items-center gap-2 rounded-full border border-purple-800/40 bg-purple-950/60 px-3 py-1 text-xs text-purple-300">
        <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-purple-400" />
        <span className="truncate">Secure Authentication Vault</span>
      </div>

      <h2 className="mb-1 text-2xl font-bold text-white">Sign in</h2>

      <p className="mb-6 text-sm text-purple-200/70">
        Welcome back. Enter your credentials to continue.
      </p>

      <ErrorMessage error={error} />

      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          label="Username or Email"
          icon={<FiUser className="h-4 w-4" />}
          value={username}
          placeholder="Your username or email"
          minLength={3}
          onChange={setUsername}
          onFocus={handleUsernameFocus}
          onBlur={handleInputBlur}
        />

        <InputField
          label="Password"
          icon={<FiLock className="h-4 w-4" />}
          type="password"
          value={password}
          placeholder="••••••••"
          minLength={8}
          onChange={setPassword}
          onFocus={handlePasswordFocus}
          onBlur={handleInputBlur}
        />

        <motion.button
          {...buttonAnimation}
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-950/50 transition-colors hover:from-purple-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <FiLoader className="h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </motion.button>
      </form>

      <p className="mt-6 text-center text-sm text-purple-200/60">
        Don&apos;t have an account?{" "}
        <Link
          href="/auth/register"
          className="font-medium text-purple-400 hover:text-purple-300 hover:underline"
        >
          Sign up
        </Link>
      </p>
    </motion.div>
  );
});

export default function LoginPage() {
  const [blobMood, setBlobMood] = useState<BlobMood>("neutral");
  const [blobGaze, setBlobGaze] = useState<BlobGaze>({ x: 0, y: 0 });

  const handleMoodChange = useCallback(
    (mood: BlobMood, gaze: BlobGaze) => {
      setBlobMood((previousMood) =>
        previousMood === mood ? previousMood : mood
      );

      setBlobGaze((previousGaze) =>
        previousGaze.x === gaze.x && previousGaze.y === gaze.y
          ? previousGaze
          : gaze
      );
    },
    []
  );

  return (
    <main className="relative h-dvh w-screen overflow-hidden bg-zinc-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-950 to-purple-950/80" />

        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(147, 51, 234, 0.35) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-purple-900/20 blur-2xl sm:h-96 sm:w-96 sm:blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-indigo-950/30 blur-2xl sm:h-96 sm:w-96 sm:blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-950/20 blur-2xl" />
      </div>

      <nav className="absolute inset-x-0 top-0 z-30 px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
          <Link href="/" className="group flex items-center gap-2">
            <Image
              src="/zevra-logo.webp"
              alt="Zevra"
              width={32}
              height={32}
              priority
              className="h-8 w-8 object-contain"
            />

            <span className="text-lg font-extrabold tracking-tight text-white transition-colors group-hover:text-purple-300">
              Zevra
            </span>
          </Link>
        </div>
      </nav>

      <section className="h-full w-full overflow-y-auto overflow-x-hidden px-4 pb-6 pt-24 sm:px-6 lg:overflow-hidden lg:px-8">
        <div className="relative mx-auto flex min-h-full w-full max-w-7xl items-center">
          <div className="relative grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="pointer-events-none absolute bottom-[15%] left-1/2 top-[15%] hidden w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-purple-500/40 to-transparent lg:block" />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="hidden min-w-0 flex-col items-center justify-center lg:flex"
            >
              <div className="w-full max-w-xl text-left">
                <h1 className="text-3xl font-bold leading-tight tracking-tight text-white xl:text-4xl">
                  Welcome Back
                </h1>

                <p className="mt-3 text-sm leading-relaxed text-purple-200/80">
                  Step back into your secure zero-knowledge encrypted messaging
                  hub.
                </p>
              </div>

              <div className="mt-5 flex w-full max-w-xl flex-wrap gap-2">
                <FeatureBadge
                  color="purple"
                  icon={<FiShield className="h-3.5 w-3.5" />}
                >
                  Zero Knowledge
                </FeatureBadge>

                <FeatureBadge
                  color="indigo"
                  icon={<FiKey className="h-3.5 w-3.5" />}
                >
                  Client Keys Only
                </FeatureBadge>

                <FeatureBadge
                  color="violet"
                  icon={<FiZap className="h-3.5 w-3.5" />}
                >
                  Realtime Sync
                </FeatureBadge>
              </div>

              <LoginMascot mood={blobMood} gaze={blobGaze} />
            </motion.div>

            <LoginForm onMoodChange={handleMoodChange} />
          </div>
        </div>
      </section>
    </main>
  );
}
