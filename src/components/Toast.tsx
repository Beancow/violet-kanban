'use client';

import * as Toast from '@radix-ui/react-toast';
import React from 'react';
import styles from './Toast.module.css';

// Exports for use in the useToast hook
export const ToastProvider = Toast.Provider;
export const ToastClose = Toast.Close;

export const ToastRoot = ({
    className,
    ...props
}: React.ComponentPropsWithoutRef<typeof Toast.Root>) => (
    <Toast.Root className={`${styles.toastRoot} ${className}`} {...props} />
);

export const ToastTitle = ({
    className,
    ...props
}: React.ComponentPropsWithoutRef<typeof Toast.Title>) => (
    <Toast.Title className={`${styles.toastTitle} ${className}`} {...props} />
);

export const ToastDescription = ({
    className,
    ...props
}: React.ComponentPropsWithoutRef<typeof Toast.Description>) => (
    <Toast.Description
        className={`${styles.toastDescription} ${className}`}
        {...props}
    />
);

export const ToastAction = ({
    className,
    ...props
}: React.ComponentPropsWithoutRef<typeof Toast.Action>) => (
    <Toast.Action className={`${styles.toastAction} ${className}`} {...props} />
);
