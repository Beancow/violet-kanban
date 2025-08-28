// Minimal pickNext job stub
export function pickNextJob(queues: any[]) {
    // simple pick-first for now
    return queues && queues.length ? queues[0] : null;
}

export default pickNextJob;
