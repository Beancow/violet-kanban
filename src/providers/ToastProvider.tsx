'use client';
import React, {
    createContext,
    useContext,
    useMemo,
    useState,
    useCallback,
    useEffect,
    useRef,
} from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import * as RadixToast from '@radix-ui/react-toast';
import styles from '@/components/Toast.module.css';

type ToastItem = {
    id: string;
    title?: string;
    description?: string;
    duration?: number;
};

type ToastApi = {
    addToast: (t: Omit<ToastItem, 'id'>) => string;
    removeToast: (id: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

// Module-scoped item so its identity is stable across renders. Accepts an
// onClose callback to avoid recreating handlers in the provider render loop.
const ToastListItem = React.memo(function ToastListItem({
    t,
    onClose,
}: {
    t: ToastItem;
    onClose: (id: string) => void;
}) {
    return (
        <RadixToast.Root
            key={t.id}
            className={styles.toastRoot}
            defaultOpen
            onOpenChange={(open) => {
                if (!open) onClose(t.id);
            }}
        >
            {t.title && (
                <RadixToast.Title className={styles.toastTitle}>
                    {t.title}
                </RadixToast.Title>
            )}
            {t.description && (
                <RadixToast.Description className={styles.toastDescription}>
                    {t.description}
                </RadixToast.Description>
            )}
            <RadixToast.Action
                className={styles.toastAction}
                altText='Close'
                asChild
            >
                <button aria-label='close'>OK</button>
            </RadixToast.Action>
        </RadixToast.Root>
    );
});

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    // Stable remover to give to Radix without recreating a new callback each
    // render. This helps avoid triggering Radix internals that compose refs
    // when the handler identity changes rapidly.
    const removeToastStable = useCallback((id: string) => {
        setToasts((s) => s.filter((x) => x.id !== id));
    }, []);

    const api = useMemo<ToastApi>(
        () => ({
            addToast: (t) => {
                const id =
                    String(Date.now()) + Math.random().toString(36).slice(2, 8);
                setToasts((s) => [...s, { id, ...t }]);
                return id;
            },
            removeToast: (id) => setToasts((s) => s.filter((x) => x.id !== id)),
        }),
        []
    );

    // Local rendering will use the module-scoped `ToastListItem` component
    // which is memoized there to keep identity stable across renders.

    // Create a DOM container for the portal so toast updates are isolated
    // from the main app render tree. This reduces the chance of Radix
    // internal ref updates causing setState loops on the main tree.
    const portalContainerRef = useRef<HTMLElement | null>(null);
    useEffect(() => {
        if (typeof document === 'undefined') return;
        const el = document.createElement('div');
        el.setAttribute('id', 'violet-toast-root');
        portalContainerRef.current = el;
        document.body.appendChild(el);
        return () => {
            try {
                if (
                    portalContainerRef.current &&
                    portalContainerRef.current.parentNode
                )
                    portalContainerRef.current.parentNode.removeChild(
                        portalContainerRef.current
                    );
            } catch (_) {}
            portalContainerRef.current = null;
        };
    }, []);

    const portalContent = (
        <div aria-hidden className={styles.portalHost}>
            {toasts.map((t) => (
                <ToastListItem key={t.id} t={t} onClose={removeToastStable} />
            ))}
            <RadixToast.Viewport className={styles.viewport} />
        </div>
    );

    return (
        <RadixToast.Provider>
            <ToastContext.Provider value={api}>
                {children}
                {portalContainerRef.current
                    ? createPortal(portalContent, portalContainerRef.current)
                    : null}
            </ToastContext.Provider>
        </RadixToast.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
}

export default ToastProvider;
