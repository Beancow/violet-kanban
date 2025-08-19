'use client';

import React, { useState, useCallback, ReactNode } from 'react';
import { ToastContext } from '@/hooks/useToast';
import {
    ToastProvider as RadixToastProvider,
    ToastRoot,
    ToastTitle,
    ToastDescription,
    ToastClose,
    ToastViewport,
} from '@/components/Toast';

export type ToastMessage = {
    id: string;
    title: string;
    description?: string;
};

export const AppToastProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const showToast = useCallback((title: string, description?: string) => {
        const id = new Date().toISOString() + Math.random();
        setToasts((prevToasts) => [...prevToasts, { id, title, description }]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prevToasts) =>
            prevToasts.filter((toast) => toast.id !== id)
        );
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, toasts, removeToast }}>
            {children}
            <RadixToastProvider>
                {toasts.map(({ id, title, description }) => (
                    <ToastRoot
                        key={id}
                        onOpenChange={() => removeToast(id)}
                        open={true}
                        duration={5000}
                    >
                        <ToastTitle>{title}</ToastTitle>
                        {description && (
                            <ToastDescription>{description}</ToastDescription>
                        )}
                        <ToastClose />
                    </ToastRoot>
                ))}
                <ToastViewport />
            </RadixToastProvider>
        </ToastContext.Provider>
    );
};
