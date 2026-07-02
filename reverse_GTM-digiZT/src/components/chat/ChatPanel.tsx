"use client";

import { type KeyboardEvent } from "react";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
}

export function ChatPanel({ messages, value, onChange, onSend, disabled }: ChatPanelProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Pogovorni brief</h2>
        <p className="text-sm text-slate-600">
          Zapišite idejo v slovenščini. Enter pošlje sporočilo, Shift+Enter doda novo vrstico.
        </p>
      </div>

      <div className="mb-4 max-h-[18rem] overflow-y-auto rounded-xl bg-slate-50 p-3">
        <ul className="space-y-3" aria-label="Nit sporočil">
          {messages.map((message, index) => (
            <li
              key={`${message.role}-${index}`}
              className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm ${
                message.role === "user"
                  ? "ml-auto bg-indigo-600 text-white"
                  : "mr-auto bg-white text-slate-800 shadow-sm"
              }`}
            >
              {message.content}
            </li>
          ))}
        </ul>
      </div>

      <label className="block text-sm font-medium text-slate-700" htmlFor="brief-input">
        Opis kampanje
      </label>
      <textarea
        id="brief-input"
        className="mt-2 min-h-32 w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Npr. Želimo promovirati brezplačen veterinarski pregled za družine ..."
      />

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          Freeform besedilo je namenjeno osnutku; za najbolj zanesljivo analizo uporabite stranski obrazec.
        </p>
        <button
          type="button"
          onClick={onSend}
          disabled={disabled}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Pošlji
        </button>
      </div>
    </section>
  );
}
