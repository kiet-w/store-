'use client';

import { Note } from '@/types/note';
import { RefreshCw, AlertCircle, Clock } from 'lucide-react';

interface NoteCardProps {
  note: Note;
}

const CATEGORY_ICONS: Record<string, string> = {
  Cooking: '🍳',
  Tech: '💻',
  Personal: '👤',
  Other: '📝',
};

export default function NoteCard({ note }: NoteCardProps) {
  if (note.status === 'PROCESSING') {
    return (
      <div className="p-5 rounded-xl border border-border bg-white dark:bg-zinc-900 shadow-sm animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-zinc-300 animate-spin-slow" />
          <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-1/3"></div>
        </div>
        <div className="space-y-3">
          <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-full"></div>
          <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-5/6"></div>
          <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-4/6"></div>
        </div>
        <div className="mt-6 flex justify-between items-center pt-4 border-t border-zinc-50 dark:border-zinc-800/50">
          <div className="h-2 bg-zinc-50 dark:bg-zinc-800 rounded w-16"></div>
          <div className="h-5 bg-zinc-50 dark:bg-zinc-800 rounded-full w-20"></div>
        </div>
      </div>
    );
  }

  if (note.status === 'FAILED') {
    return (
      <div className="p-5 rounded-xl border border-red-100 dark:border-red-900/20 bg-red-50/30 dark:bg-red-950/10 shadow-sm">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-red-800 dark:text-red-300 font-medium mb-1">Analysis failed</p>
            <p className="text-xs text-red-600/70 dark:text-red-400/50 line-clamp-2 italic mb-3">"{note.content}"</p>
            <button 
              className="flex items-center gap-1.5 text-xs font-semibold text-red-700 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="w-3 h-3" />
              Retry Analysis
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-xl border border-border bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 group">
      <div className="flex items-start justify-between mb-4 gap-4">
        <h3 className="font-bold text-foreground leading-tight text-lg">
          {note.title || 'Untitled Note'}
        </h3>
        {note.category && (
          <span className="shrink-0 text-xs bg-sidebar border border-border px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
            <span role="img" aria-label={note.category} className="text-sm">
              {CATEGORY_ICONS[note.category] || '📝'}
            </span>
            <span className="font-semibold text-foreground/70 uppercase tracking-tight">
              {note.category}
            </span>
          </span>
        )}
      </div>
      
      {note.summary && (
        <p className="text-[15px] text-foreground/80 mb-5 leading-relaxed font-medium">
          {note.summary}
        </p>
      )}

      {note.bullets && note.bullets.length > 0 && (
        <ul className="space-y-3 mb-6">
          {note.bullets.map((bullet, i) => (
            <li key={i} className="text-sm text-foreground/70 flex items-start gap-3">
              <span className="mt-1.5 w-1.5 h-1.5 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-600" />
              <span className="leading-snug">{bullet}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="pt-4 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-secondary-text uppercase tracking-widest">
            {new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
          <span className="w-1 h-1 rounded-full bg-zinc-200 dark:bg-zinc-800" />
          <span className="text-[11px] font-medium text-secondary-text/60">
            {new Date(note.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        
        <div className="relative">
          <button className="text-[11px] font-bold text-secondary-text hover:text-foreground transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100">
            View Source
          </button>
          <div className="absolute bottom-full right-0 mb-3 w-72 p-4 bg-zinc-900 dark:bg-zinc-950 text-zinc-100 text-xs rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-20 border border-zinc-800 pointer-events-none scale-95 group-hover:scale-100 origin-bottom-right">
            <p className="font-bold mb-2 text-zinc-400 uppercase tracking-tighter text-[10px]">Raw Capture</p>
            <p className="leading-relaxed font-medium italic text-zinc-300">"{note.content}"</p>
          </div>
        </div>
      </div>
    </div>
  );
}
