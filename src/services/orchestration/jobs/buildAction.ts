// Minimal buildAction job stub
export async function buildActionJob(item: any) {
    // build the action payload to send to the worker/server
    return { action: 'noop', payload: item };
}

export default buildActionJob;
