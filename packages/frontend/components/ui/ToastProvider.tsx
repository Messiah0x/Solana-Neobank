'use client';

import { ToastContext, useToastState } from '@/lib/useToast';
import { ToastContainer } from './ToastContainer';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const state = useToastState();

  return (
    <ToastContext.Provider value={state}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}
