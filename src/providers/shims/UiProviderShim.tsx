import React from 'react';
export default function UiProviderShim({
    children,
}: {
    children?: React.ReactNode;
}) {
    return <>{children}</>;
}
