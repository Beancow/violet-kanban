import React from 'react';
export default function ListProviderShim({
    children,
}: {
    children?: React.ReactNode;
}) {
    return <>{children}</>;
}
