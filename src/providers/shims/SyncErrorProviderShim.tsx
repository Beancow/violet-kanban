import React from 'react';
export default function SyncErrorProviderShim({
    children,
}: {
    children?: React.ReactNode;
}) {
    return <>{children}</>;
}
