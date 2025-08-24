// Lightweight secret manager shim. This file provides a small abstraction
// so CI or runtime can fetch the Firebase service account from a secret
// manager. It supports environment-only fetching today (recommended) and
// can be extended to call GCP/AWS APIs if deployed with credentials.
export async function fetchServiceAccountFromSecretManager(): Promise<
    string | null
> {
    // If a raw JSON env is present, prefer it
    if (process.env.FIREBASE_SERVICE_ACCOUNT)
        return process.env.FIREBASE_SERVICE_ACCOUNT;
    if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
        try {
            return Buffer.from(
                process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
                'base64'
            ).toString('utf8');
        } catch {
            return null;
        }
    }

    // Future: call into cloud secret managers here if environment indicates
    // a provider and the runtime has credentials. For now, return null so
    // callers can fallback to local files in dev.
    return null;
}

export default { fetchServiceAccountFromSecretManager };
