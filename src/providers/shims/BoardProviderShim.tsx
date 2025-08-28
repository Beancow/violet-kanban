import React from 'react';

export default function BoardProviderShim({
    children,
}: {
    children?: React.ReactNode;
}) {
    // shim that should delegate to BoardStoreDB in future
    return <>{children}</>;
}
