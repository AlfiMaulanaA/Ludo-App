'use client';

import React from 'react';
import { X } from 'lucide-react';

const EMOTES = ['👍', '🔥', '🏆', '😭', '🎲', '😎', '😡', '🎉', '🤡', '👏'];

export default function EmotePicker({ onClose, onSelectEmote }) {
  return (
    <div className="modal-backdrop">
      <div className="w-full max-w-sm card p-5 rounded-3xl border-2 border-slate-100 shadow-2xl relative animate-pop-in">
        <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3 mb-4">
          <h3 className="text-sm font-display font-extrabold text-slate-800">Reaksi & Emote Quick</h3>
          <button type="button" onClick={onClose} className="icon-btn w-8 h-8 rounded-xl">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-5 gap-3">
          {EMOTES.map(emote => (
            <button
              type="button"
              key={emote}
              onClick={() => {
                onSelectEmote(emote);
                onClose();
              }}
              className="text-3xl p-3 rounded-2xl bg-slate-50 hover:bg-purple-100 hover:scale-125 transition-all flex items-center justify-center border-2 border-slate-100"
            >
              {emote}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
