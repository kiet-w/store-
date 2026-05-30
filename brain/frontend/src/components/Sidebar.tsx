'use client';

import { Home, Hash, Inbox, Search, Settings, Plus, ChevronRight } from 'lucide-react';

interface SidebarProps {
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

const CATEGORIES = [
  { id: 'Cooking', name: 'Cooking' },
  { id: 'Tech', name: 'Tech' },
  { id: 'Personal', name: 'Personal' },
  { id: 'Other', name: 'Other' },
];

export default function Sidebar({ selectedCategory, onSelectCategory }: SidebarProps) {
  return (
    <aside className="w-64 bg-sidebar border-r border-border flex flex-col h-full sticky top-0 px-3 py-4 select-none">
      <div className="flex items-center gap-2 px-2 py-1 mb-6">
        <div className="w-6 h-6 rounded bg-foreground text-background flex items-center justify-center text-xs font-bold">
          🧠
        </div>
        <span className="font-semibold text-sm truncate">Secondary Brain</span>
      </div>

      <nav className="flex-1 space-y-0.5">
        <button
          onClick={() => onSelectCategory(null)}
          className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium rounded transition-colors group ${
            selectedCategory === null
              ? 'bg-hover text-foreground'
              : 'text-secondary-text hover:bg-hover hover:text-foreground'
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>All Notes</span>
        </button>

        <div className="mt-6 mb-2">
          <h2 className="px-2 text-[11px] font-semibold text-secondary-text uppercase tracking-wider">
            Categories
          </h2>
        </div>
        
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium rounded transition-colors group ${
              selectedCategory === cat.id
                ? 'bg-hover text-foreground'
                : 'text-secondary-text hover:bg-hover hover:text-foreground'
            }`}
          >
            <Hash className="w-4 h-4" />
            <span>{cat.name}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto space-y-0.5">
        <button className="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-secondary-text rounded hover:bg-hover hover:text-foreground transition-colors">
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </button>
        <div className="pt-4 mt-4 border-t border-border">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500">
              JD
            </div>
            <span className="text-xs font-medium text-foreground truncate">John Doe</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
