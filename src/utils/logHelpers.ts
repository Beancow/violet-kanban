// Minimal logging helper for DataProvider and other contexts
export default function logDataProvider(...args: unknown[]) {
    if (process.env.NODE_ENV === 'development') {
        // Only log in development for readability
        console.log('[DataProvider]', ...args);
    }
}
