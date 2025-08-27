'use client';
import React, { useEffect, useState } from 'react';

interface Props {
    src?: string | null;
    alt?: string;
    fallback: string;
    size?: number;
    className?: string;
    style?: React.CSSProperties;
}

export default function AvatarWithFallback({
    src,
    alt,
    fallback,
    size = 32,
    className,
    style,
}: Props) {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        setLoaded(false);
        setError(false);
        if (!src) return;
        let cancelled = false;
        const img = new Image();
        img.src = src;
        img.onload = () => {
            if (!cancelled) setLoaded(true);
        };
        img.onerror = () => {
            if (!cancelled) setError(true);
        };
        return () => {
            cancelled = true;
            img.onload = null;
            img.onerror = null;
        };
    }, [src]);

    const avatarSize = size;
    const imgStyle: React.CSSProperties = {
        width: avatarSize,
        height: avatarSize,
        borderRadius: '50%',
        objectFit: 'cover',
        transition: 'opacity 220ms ease',
        opacity: loaded ? 1 : 0,
        display: loaded ? 'block' : 'none',
    };

    const fallbackStyle: React.CSSProperties = {
        width: avatarSize,
        height: avatarSize,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#eef2ff',
        color: '#0f172a',
        fontWeight: 600,
        fontSize: Math.max(12, Math.floor(avatarSize / 2.5)),
    };

    return (
        <div
            className={className}
            style={{ display: 'inline-block', ...style }}
        >
            {src && !error && (
                <img src={src} alt={alt || fallback} style={imgStyle} />
            )}
            {(error || !src || !loaded) && (
                <div style={fallbackStyle} aria-hidden>
                    {fallback}
                </div>
            )}
        </div>
    );
}
