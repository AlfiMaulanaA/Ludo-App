'use client';

import React, { useState } from 'react';
import { X, Send } from 'lucide-react';

export default function ChatPanel({ messages = [], onClose, onSendMessage }) {
  const [text, setText] = useState('');

  const handleSubmit = e => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text.trim());
    setText('');
  };

  return (
    <div className="modal-backdrop">
      <div className="w-full max-w-md card p-5 rounded-3xl border-2 border-slate-100 shadow-2xl flex flex-col h-[440px] relative animate-pop-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3 mb-3">
          <h3 className="text-sm font-display font-extrabold text-slate-800">Obrolan Permainan</h3>
          <button type="button" onClick={onClose} className="icon-btn w-8 h-8 rounded-xl">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-3">
          {messages.length === 0 ? (
            <div className="text-center text-xs font-semibold text-slate-400 py-12">Belum ada pesan. Sapa pemain lain!</div>
          ) : (
            messages.map(msg => (
              <div key={msg.id} className="p-3 rounded-2xl bg-slate-50 border-2 border-slate-100 text-xs">
                <div className="flex items-center justify-between font-display font-extrabold mb-1">
                  <span className="text-purple-600">{msg.sender}</span>
                  <span className="text-[10px] text-slate-400 font-normal">{msg.time}</span>
                </div>
                <div className="text-slate-800 font-body break-words">{msg.text}</div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            maxLength={100}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Tulis pesan..."
            className="input text-xs"
          />
          <button
            type="submit"
            className="btn btn-purple btn-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
