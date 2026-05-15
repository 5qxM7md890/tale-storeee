'use client';

import * as React from 'react';
import clsx from 'clsx';

type ToastKind = 'success' | 'error' | 'info';

type Toast = {
  id: string;
  message: string;
  kind: ToastKind;
};

type ToastApi = {
  push: (message: string, kind?: ToastKind) => void;
};

const ToastCtx = React.createContext<ToastApi | null>(null);

export function ToastProvider({children}: {children: React.ReactNode}) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const api = React.useMemo<ToastApi>(() => {
    return {
      push: (message, kind = 'info') => {
        const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
        const t: Toast = {id, message, kind};
        setToasts((prev) => [...prev, t]);
        window.setTimeout(() => {
          setToasts((prev) => prev.filter((x) => x.id !== id));
        }, 2600);
      }
    };
  }, []);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed left-4 right-4 top-16 z-[80] space-y-2 sm:left-auto sm:right-4 sm:w-[320px]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={clsx(
              'pointer-events-auto w-full rounded-2xl border px-4 py-3 text-sm shadow-xl backdrop-blur',
              'bg-black/70',
              t.kind === 'success' && 'border-violet-400/30',
              t.kind === 'error' && 'border-red-400/30',
              t.kind === 'info' && 'border-white/10'
            )}
          >
            <div
              className={clsx(
                'font-semibold break-words',
                t.kind === 'success' && 'text-violet-200',
                t.kind === 'error' && 'text-red-200',
                t.kind === 'info' && 'text-white'
              )}
            >
              {t.message}
            </div>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
