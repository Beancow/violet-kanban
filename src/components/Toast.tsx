'use client';

import * as Toast from '@radix-ui/react-toast';
import React from 'react';
import styles from './Toast.module.css';

// Exports for use in the useToast hook
export const ToastProvider = Toast.Provider;
export const ToastClose = Toast.Close;

// Styled wrapper components
export const ToastViewport = () => (
    <Toast.Viewport className={styles.viewport} />
);

export const ToastRoot = React.forwardRef<
    React.ElementRef<typeof Toast.Root>,
    React.ComponentPropsWithoutRef<typeof Toast.Root>
>(({ className, ...props }, ref) => (
    <Toast.Root ref={ref} className={`${styles.toastRoot} ${className}`} {...props} />
));
ToastRoot.displayName = Toast.Root.displayName;


export const ToastTitle = React.forwardRef<
    React.ElementRef<typeof Toast.Title>,
    React.ComponentPropsWithoutRef<typeof Toast.Title>
>(({ className, ...props }, ref) => (
    <Toast.Title ref={ref} className={`${styles.toastTitle} ${className}`} {...props} />
));
ToastTitle.displayName = Toast.Title.displayName;


export const ToastDescription = React.forwardRef<
    React.ElementRef<typeof Toast.Description>,
    React.ComponentPropsWithoutRef<typeof Toast.Description>
>(({ className, ...props }, ref) => (
    <Toast.Description ref={ref} className={`${styles.toastDescription} ${className}`} {...props} />
));
ToastDescription.displayName = Toast.Description.displayName;


export const ToastAction = React.forwardRef<
    React.ElementRef<typeof Toast.Action>,
    React.ComponentPropsWithoutRef<typeof Toast.Action>
>(({ className, ...props }, ref) => (
    <Toast.Action ref={ref} className={`${styles.toastAction} ${className}`} {...props} />
));
ToastAction.displayName = Toast.Action.displayName;