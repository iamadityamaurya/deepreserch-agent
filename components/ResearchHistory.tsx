"use client";

import { useState, useEffect } from "react";
import { History, Trash2, X, Clock, FileText } from "lucide-react";
import { getHistory, deleteHistoryItem, clearHistory, HistoryItem } from "@/lib/history";

interface ResearchHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore: (item: HistoryItem) => void;
}

export default function ResearchHistory({ isOpen, onClose, onRestore }: ResearchHistoryProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      setHistory(getHistory());
    }
  }, [isOpen]);

  const handleDelete = (id: string) => {
    deleteHistoryItem(id);
    setHistory(getHistory());
  };

  const handleClear = () => {
    clearHistory();
    setHistory([]);
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside className="relative w-full max-w-md h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Research History
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No research history yet.</p>
              <p className="text-xs mt-1">Completed research sessions will appear here.</p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="group p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 hover:border-indigo-400 dark:hover:border-indigo-500/40 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    onClick={() => onRestore(item)}
                    className="flex-1 text-left cursor-pointer"
                  >
                    <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                      {item.topic}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(item.timestamp)}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                      <span className="capitalize">{item.searchDepth}</span>
                      {item.modelUsed && <span className="truncate max-w-[120px]">{item.modelUsed}</span>}
                    </div>
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/20 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                    title="Delete from history"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {history.length > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={handleClear}
              className="w-full py-2 rounded-lg border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-sm font-medium transition-colors cursor-pointer"
            >
              Clear all history
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
