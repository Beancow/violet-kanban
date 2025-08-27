// Simpler picker: return the first non-empty queue item in the provided
// queues (preserves caller-controlled priority order). This intentionally
// avoids per-item scheduling checks — the orchestrator/backoff jobs are
// responsible for scheduling and retries.
export default function pickNextFromQueues(queues: Array<any[] | undefined>) {
    // Return the first non-empty queue array (preserves priority order).
    for (const q of queues) {
        if (q && q.length > 0) return q;
    }
    return undefined;
}
