import { useOrganizationProvider } from '@/providers/OrganizationProvider';
import OrganizationForm from '../forms/OrganizationForm';
import { Organization } from '@/types/appState.type';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    OrganizationFormValues,
    OrganizationSchema,
} from '@/schema/organizationSchema';
import React, { useState, useEffect } from 'react';
import * as RadixToast from '@radix-ui/react-toast';
import stylesToast from '@/components/Toast.module.css';

export default function OrganizationFormWrapper({
    onClose,
    organization,
}: {
    onClose?: () => void;
    organization?: Organization;
}) {
    const refetchOrganizations = useOrganizationProvider().refetchOrganizations;
    const form = useForm<OrganizationFormValues>({
        resolver: zodResolver(OrganizationSchema),
        defaultValues: {
            name: organization?.name ?? '',
            type: organization?.type ?? 'company',
            companyName: organization?.companyName ?? undefined,
            companyWebsite: organization?.companyWebsite ?? undefined,
            logoURL: organization?.logoURL ?? undefined,
        },
    });

    const [toastOpen, setToastOpen] = useState(false);
    useEffect(() => {
        if (!toastOpen) return;
        const t = setTimeout(() => setToastOpen(false), 3500);
        return () => clearTimeout(t);
    }, [toastOpen]);

    const handleSubmit = async (orgData: OrganizationFormValues) => {
        try {
            const res = await fetch('/api/orgs/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orgData),
            });
            if (res.ok) {
                // If this was a create (not editing an existing org), clear the form
                if (!organization) form.reset();
                // show a small success toast
                if (!organization) setToastOpen(true);
                await refetchOrganizations();
            } else {
                // TODO: Show error to user
            }
        } catch (err) {
            // Log network/submit errors for diagnostics; do not swallow silently

            console.error('OrganizationFormWrapper submit error', err);
        }
        if (onClose) onClose();
    };

    return (
        <>
            <OrganizationForm
                onSubmit={handleSubmit}
                organization={organization}
                form={form}
            />
            <RadixToast.Root
                className={stylesToast.toastRoot}
                open={toastOpen}
                onOpenChange={setToastOpen}
            >
                <RadixToast.Title className={stylesToast.toastTitle}>
                    Organization created
                </RadixToast.Title>
                <RadixToast.Description
                    className={stylesToast.toastDescription}
                >
                    The organization was created successfully.
                </RadixToast.Description>
                <RadixToast.Close asChild>
                    <button aria-label='Close toast'>Close</button>
                </RadixToast.Close>
            </RadixToast.Root>
        </>
    );
}
