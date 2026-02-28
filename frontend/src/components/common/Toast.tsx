'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { create } from 'zustand';
import { cn } from '@/lib/utils';

// ─── Toast Store ──────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastStore {
  toasts: Toast[];
  add: (toast: Omit<Toast, 'id'>) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (toast) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
  },
  remove: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}));

// ─── Convenience helpers ──────────────────────────────────

export const toast = {
  success: (title: string, message?: string, duration = 4000) =>
    useToastStore.getState().add({ type: 'success', title, message, duration }),
  error: (title: string, message?: string, duration = 5000) =>
    useToastStore.getState().add({ type: 'error', title, message, duration }),
  warning: (title: string, message?: string, duration = 4000) =>
    useToastStore.getState().add({ type: 'warning', title, message, duration }),
  info: (title: string, message?: string, duration = 4000) =>
    useToastStore.getState().add({ type: 'info', title, message, duration }),
};

// ─── Toast Item ───────────────────────────────────────────

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5 text-green-500" />,
  error: <XCircle className="w-5 h-5 text-red-500" />,
  warning: <AlertCircle className="w-5 h-5 text-yellow-500" />,
  info: <Info className="w-5 h-5 text-blue-500" />,
};

const STYLES: Record<ToastType, string> = {
  success: 'border-green-200 dark:border-green-800',
  error: 'border-red-200 dark:border-red-800',
  warning: 'border-yellow-200 dark:border-yellow-800',
  info: 'border-blue-200 dark:border-blue-800',
};

function ToastItem({ toast: t }: { toast: Toast }) {
  const remove = useToastStore((s) => s.remove);

  useEffect(() => {
    const duration = t.duration ?? 4000;
    const timer = setTimeout(() => remove(t.id), duration);
    return () => clearTimeout(timer);
  }, [t.id, t.duration, remove]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={cn(
        'flex items-start gap-3 p-4 bg-card rounded-xl border shadow-card-hover',
        'min-w-[300px] max-w-[420px] pointer-events-auto',
        STYLES[t.type]
      )}
    >
      <div className="flex-shrink-0 mt-0.5">{ICONS[t.type]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{t.title}</p>
        {t.message && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{t.message}</p>
        )}
      </div>
      <button
        onClick={() => remove(t.id)}
        className="flex-shrink-0 w-6 h-6 rounded-md hover:bg-muted flex items-center justify-center transition-colors"
        aria-label="Đóng thông báo"
      >
        <X className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
    </motion.div>
  );
}

// ─── Toast Container ──────────────────────────────────────

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div
      className="fixed top-4 right-4 z-[300] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-label="Thông báo"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>
  );
}
