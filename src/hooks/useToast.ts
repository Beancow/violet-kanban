'use client';

import { createContext, useContext } from 'react';
import { ToastMessage } from '@/contexts/AppProviders';

type ToastContextType = {
    showToast: (title: string, description?: string) => void;
    toasts: ToastMessage[];
    removeToast: (id: string) => void;
};

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useAppToast = () => {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useAppToast must be used within an AppToastProvider');
    }
    return context;
};