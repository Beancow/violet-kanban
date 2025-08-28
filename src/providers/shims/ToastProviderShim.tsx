import React from 'react';
export default function ToastProviderShim({
    children,
}: {
    children?: React.ReactNode;
}) {
    return <>{children}</>;
}
