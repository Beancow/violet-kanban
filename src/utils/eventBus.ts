import { safeCaptureException } from '@/lib/sentryWrapper';

export type EventMap = {
    'queue:updated': { kind?: 'board' | 'list' | 'card' };
    'sync:started': void;
    'sync:stopped': void;
    'worker:outgoing': unknown;
    'worker:message': unknown;
    'tempid:set-request': { tempId: string; realId: string };
    'tempid:clear-request': { tempId: string };
    'tempid:set': { tempId: string; realId: string };
    'tempid:cleared': { tempId: string };
    'reconciliation:request': { payload: unknown; queueItem?: unknown };
    'reconciliation:success': { payload: unknown; queueItem?: unknown };
    'reconciliation:fail': {
        payload: unknown;
        queueItem?: unknown;
        error?: unknown;
    };
};

type Handler<T> = (payload: T) => void;

const listeners: { [K in keyof EventMap]?: Handler<EventMap[K]>[] } = {};

export const eventBus = {
    on<K extends keyof EventMap>(name: K, fn: Handler<EventMap[K]>) {
        listeners[name] = listeners[name] || [];
        (listeners[name] as Handler<EventMap[K]>[]).push(fn);
        return () => eventBus.off(name, fn);
    },
    off<K extends keyof EventMap>(name: K, fn: Handler<EventMap[K]>) {
        const arr = listeners[name];
        if (!arr) return;
        listeners[name] = arr.filter((h) => h !== fn) as any;
    },
    emit<K extends keyof EventMap>(name: K, payload: EventMap[K]) {
        const arr = listeners[name];
        if (!arr || arr.length === 0) return;
        for (const h of arr.slice()) {
            try {
                (h as any)(payload as any);
            } catch (e) {
                safeCaptureException(e);
            }
        }
    },
};

export default eventBus;
