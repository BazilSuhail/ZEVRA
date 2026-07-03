"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FiArrowLeft, FiCheck, FiLock, FiMoreHorizontal, FiPaperclip, FiSend, FiShield, FiSmile } from "react-icons/fi";

const people: Record<string, { name: string; status: string; group: boolean }> = {
  ava: { name: "Ava Morgan", status: "online now", group: false },
  leo: { name: "Leo Park", status: "last seen 2h ago", group: false },
  studio: { name: "Zevra Studio", status: "4 members", group: true },
  research: { name: "Research team", status: "6 members", group: true },
};

type Message = { id: number; author: string; text: string; time: string; mine?: boolean; encrypted?: boolean };

export default function MockChatPage() {
  const { id } = useParams<{ id: string }>();
  const person = people[id] ?? people.ava;
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [decrypting, setDecrypting] = useState(true);

  useEffect(() => {
    setLoading(true); setDecrypting(true); setMessages([]);
    const loadTimer = setTimeout(() => { setLoading(false); setMessages([{ id: 1, author: person.group ? "Ava Morgan" : person.name, text: "Hey, this is a local demo conversation.", time: "09:38" }, { id: 2, author: "Mina", text: "Messages are rendered from mock data only.", time: "09:40", encrypted: true }, { id: 3, author: "You", text: "That makes the UI easy to explore.", time: "09:42", mine: true }]); }, 650);
    const decryptTimer = setTimeout(() => setDecrypting(false), 1750);
    return () => { clearTimeout(loadTimer); clearTimeout(decryptTimer); };
  }, [id, person.name, person.group]);

  const send = () => { if (!draft.trim()) return; setMessages((current) => [...current, { id: Date.now(), author: "You", text: draft.trim(), time: "now", mine: true }]); setDraft(""); };
  const initials = person.group ? "ZS" : person.name.split(" ").map((part) => part[0]).join("");

  return <div className="flex min-w-0 flex-1 flex-col bg-[#fbfcfd] dark:bg-zinc-950">
    <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900 sm:px-7"><div className="flex items-center gap-3"><Link href="/chat" className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"><FiArrowLeft /></Link><div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700">{initials}</div><div><h2 className="text-sm font-bold">{person.name}</h2><p className="text-xs text-zinc-500">{person.status}</p></div></div><div className="flex items-center gap-2"><span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 sm:flex dark:bg-emerald-950/40 dark:text-emerald-400"><FiShield /> end-to-end encrypted</span><button title="More options" className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"><FiMoreHorizontal /></button></div></header>
    <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-10"><div className="mx-auto max-w-3xl"><div className="mb-8 text-center"><span className="rounded-full bg-zinc-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:bg-zinc-800">Today</span></div>{loading ? <div className="space-y-5"><div className="mx-auto h-4 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" /><div className="h-16 w-64 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" /><div className="ml-auto h-16 w-56 animate-pulse rounded-2xl bg-indigo-200 dark:bg-indigo-950" /></div> : messages.map((message) => <div key={message.id} className={`mb-5 flex ${message.mine ? "justify-end" : "justify-start"}`}><div className="max-w-[80%]"><p className="mb-1 px-2 text-[11px] font-semibold text-zinc-400">{message.mine ? "You" : message.author}</p><div className={`rounded-2xl px-4 py-3 text-sm leading-6 ${message.mine ? "rounded-br-sm bg-indigo-600 text-white" : "rounded-bl-sm bg-white text-zinc-700 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-zinc-800"}`}>{message.encrypted && decrypting ? <span className="flex items-center gap-2 text-zinc-400"><FiLock /><span className="h-3 w-28 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" /></span> : message.text}</div><p className="mt-1 flex items-center gap-1 px-2 text-[10px] text-zinc-400">{message.time} {message.mine && <FiCheck />}</p></div></div>)}</div></div>
    <div className="border-t border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"><div className="mx-auto max-w-3xl">{decrypting && <div className="mb-3 flex items-center gap-3 text-xs text-indigo-600 dark:text-indigo-400"><FiLock className="animate-pulse" /><span>Decrypting secure messages...</span><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-indigo-100 dark:bg-indigo-950"><div className="h-full w-[62%] bg-indigo-500" /></div><span>1/2</span></div>}<div className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"><button title="Attach file" className="p-2 text-zinc-400"><FiPaperclip /></button><input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => event.key === "Enter" && send()} placeholder="Write a message..." className="min-w-0 flex-1 bg-transparent text-sm outline-none" /><button title="Add emoji" className="p-2 text-zinc-400"><FiSmile /></button><button title="Send message" onClick={send} className="rounded-xl bg-indigo-600 p-2.5 text-white hover:bg-indigo-700"><FiSend /></button></div></div></div>
  </div>;
}
