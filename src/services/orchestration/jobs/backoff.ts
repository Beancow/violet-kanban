// Minimal backoff job stub
export function calculateBackoff(retryCount: number) {
    const base = 1000; // ms
    return Math.min(60000, base * Math.pow(2, retryCount));
}

export default calculateBackoff;
