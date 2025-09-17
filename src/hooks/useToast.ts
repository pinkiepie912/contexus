import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  title: string;
  description?: string | undefined;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number | undefined;
}

// Simple toast implementation for MVP
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((
    title: string,
    options?: {
      description?: string;
      type?: Toast['type'];
      duration?: number;
    }
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      id,
      title,
      ...(options?.description !== undefined && { description: options.description }),
      type: options?.type || 'info',
      ...(options?.duration !== undefined && { duration: options.duration }),
    };

    setToasts(prev => [...prev, newToast]);

    // Auto-remove toast
    const duration = newToast.duration || 3000;
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);

    return id;
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return {
    toast,
    toasts,
    dismissToast,
  };
}