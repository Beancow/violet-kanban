'use client';
import { Flex, Text, Select, TextField, Button, Grid } from '@radix-ui/themes';
import type { UseFormReturn } from 'react-hook-form';
import type { Organization } from '@/types/appState.type';
import type { z } from 'zod';
import type { OrganizationSchema as OrgSchemaType } from '@/schema/organizationSchema';
import { Pencil1Icon } from '@radix-ui/react-icons';

const ORG_TYPES = [
    { value: 'company', label: 'Company' },
    { value: 'personal', label: 'Personal' },
    { value: 'private', label: 'Private' },
];

type OrganizationFormValues = z.infer<
    typeof import('@/schema/organizationSchema').OrganizationSchema
>;

interface OrganizationFormProps {
    organization?: Organization;
    onSubmit: (orgData: OrganizationFormValues) => void;
    form: UseFormReturn<OrganizationFormValues>;
}

export default function OrganizationForm({
    organization,
    onSubmit,
    form,
}: OrganizationFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
    } = form;

    const orgType = watch('orgType');

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Grid columns={{ xs: '1', md: '2' }} gap='4'>
                <Flex direction='column'>
                    <Text as='label' size='2' mb='1'>
                        Organization Name
                    </Text>
                    <TextField.Root
                        {...register('name')}
                        placeholder='Organization Name'
                    />
                    {errors.name && (
                        <Text color='red'>{errors.name.message}</Text>
                    )}
                </Flex>
                <Flex direction='column'>
                    <Text as='label' size='2' mb='1'>
                        Organization Type
                    </Text>
                    <Select.Root
                        value={orgType}
                        onValueChange={(value) =>
                            setValue(
                                'orgType',
                                value as OrganizationFormValues['orgType']
                            )
                        }
                    >
                        <Select.Trigger />
                        <Select.Content>
                            {ORG_TYPES.map((type) => (
                                <Select.Item
                                    key={type.value}
                                    value={type.value}
                                >
                                    {type.label}
                                </Select.Item>
                            ))}
                        </Select.Content>
                    </Select.Root>
                    {errors.orgType && (
                        <Text color='red'>{errors.orgType.message}</Text>
                    )}
                </Flex>
                {orgType === 'company' && (
                    <Flex direction='column'>
                        <Text as='label' size='2' mb='1'>
                            Company Name
                        </Text>
                        <TextField.Root
                            {...register('companyName')}
                            placeholder='Company Name'
                        />
                        {errors.companyName && (
                            <Text color='red'>
                                {errors.companyName.message}
                            </Text>
                        )}
                    </Flex>
                )}
                {orgType === 'company' && (
                    <Flex direction='column'>
                        <Text as='label' size='2' mb='1'>
                            Company Website
                        </Text>
                        <TextField.Root
                            {...register('companyWebsite')}
                            placeholder='Company Website'
                        />
                        {errors.companyWebsite && (
                            <Text color='red'>
                                {errors.companyWebsite.message}
                            </Text>
                        )}
                    </Flex>
                )}
                <Flex direction='column'>
                    <Text as='label' size='2' mb='1'>
                        Logo URL
                    </Text>
                    <TextField.Root
                        {...register('logoURL')}
                        placeholder='Logo URL'
                    />
                    {errors.logoURL && (
                        <Text color='red'>{errors.logoURL.message}</Text>
                    )}
                </Flex>
            </Grid>
            <Flex justify='end' m='0'>
                <Button type='submit' variant='solid' color='green'>
                    <Pencil1Icon />
                    {organization?.id ? 'Save Changes' : 'Create'}
                </Button>
            </Flex>
        </form>
    );
}
