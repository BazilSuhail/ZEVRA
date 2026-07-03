"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiArchive, FiKey, FiMessageSquare, FiPlus, FiSettings, FiShield, FiUser, FiUsers } from "react-icons/fi";

const chats = [
  { id: "ava", name: "Ava Morgan", preview: "The launch notes are ready", time: "09:42", online: true },
  { id: "studio", name: "Zevra Studio", preview: "Milo: I pushed the latest draft", time: "Yesterday", online: true, group: true },
  { id: "leo", name: "Leo Park", preview: "Encrypted message", time: "Tue", online: false },
  { id: "research", name: "Research team", preview: "New secure channel", time: "Mon", online: false, group: true },
];

const navigation = [
  ["/chat/profile", FiUser, "Profile"],
  ["/chat/keys", FiKey, "Keys"],
  ["/chat/audit", FiShield, "Security"],
  ["/chat/settings", FiSettings, "Settings"],
] as const;

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f7f9] text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <aside className="hidden w-[74px] shrink-0 flex-col items-center border-r border-zinc-200 bg-white py-5 dark:border-zinc-800 dark:bg-zinc-900 md:flex">
        <Link href="/chat" className="mb-8 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-lg font-black text-white shadow-lg shadow-indigo-200 dark:shadow-none">Z</Link>
        <Link href="/chat" title="Chats" className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400"><FiMessageSquare /></Link>
        <button title="New chat" className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800"><FiPlus /></button>
        <div className="mt-auto flex flex-col items-center gap-2">
          {navigation.map(([href, Icon, label]) => <Link key={href} href={href} title={label} className={`flex h-10 w-10 items-center justify-center rounded-xl ${pathname === href ? "bg-zinc-100 text-indigo-600 dark:bg-zinc-800" : "text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}><Icon /></Link>)}
          <div className="mt-3 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 font-bold text-amber-700">M</div>
        </div>
      </aside>

      <section className="flex w-full max-w-[330px] shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 px-5 pb-4 pt-6 dark:border-zinc-800">
          <div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-500">Zevra / demo</p><h1 className="mt-1 text-2xl font-bold tracking-tight">Messages</h1></div><button title="New conversation" className="rounded-lg bg-indigo-600 p-2.5 text-white hover:bg-indigo-700"><FiPlus /></button></div>
          <div className="mt-5 flex gap-1 rounded-lg bg-zinc-100 p-1 text-xs font-semibold dark:bg-zinc-800"><span className="flex-1 rounded-md bg-white px-3 py-2 text-center text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white">All chats</span><span className="flex-1 px-3 py-2 text-center text-zinc-500">Groups</span></div>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {chats.map((chat, index) => <Link key={chat.id} href={`/chat/${chat.group ? "group" : "dm"}/${chat.id}`} className={`mb-1 flex gap-3 rounded-xl p-3 transition-colors ${pathname.includes(chat.id) ? "bg-indigo-50 dark:bg-indigo-950/40" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/70"}`}><div className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${index % 2 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{chat.group ? <FiUsers /> : chat.name.split(" ").map((part) => part[0]).join("")} {chat.online && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-zinc-900" />}</div><div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><p className="truncate text-sm font-semibold">{chat.name}</p><span className="text-[10px] text-zinc-400">{chat.time}</span></div><p className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400">{chat.preview}</p></div></Link>)}
          <div className="mt-6 flex items-center gap-2 px-3 text-[11px] font-medium uppercase tracking-wider text-zinc-400"><FiArchive /> Archived chats are hidden in demo mode</div>
        </div>
      </section>
      <main className="flex min-w-0 flex-1">{children}</main>
    </div>
  );
}
