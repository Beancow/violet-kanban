import React from 'react';
export default function QueueProviderShim({
    children,
}: {
    children?: React.ReactNode;
}) {
    return <>{children}</>;
}
