import { eventBus, EventMap } from './eventBus';
import { safeCaptureException } from '@/lib/sentryWrapper';

// Lightweight, typed helpers that wrap eventBus with error handling wired
// to Sentry via `safeCaptureException`.

type OnHandler<T> = [T] extends [void] ? () => void : (payload: T) => void;

export function emitEvent<K extends keyof EventMap>(
    name: K,
    payload: EventMap[K]
) {
    try {
        eventBus.emit(name as any, payload as any);
    } catch (e) {
        safeCaptureException(e as Error);
    }
}

// Subscribe to events. Returns an unsubscribe function (cleanup).
export function onEvent<K extends keyof EventMap>(
    name: K,
    fn: OnHandler<EventMap[K]>
): () => void {
    try {
        return eventBus.on(name as any, fn as any) as () => void;
    } catch (e) {
        safeCaptureException(e as Error);
        return () => {};
    }
}

// Subscribe to an event and return a cleanup function. Wraps eventBus.on
// and centralizes error handling for listener registration.
// (typed overload above)
