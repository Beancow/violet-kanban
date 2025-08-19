'use client';
import {
    Button,
    Flex,
    Card,
    Heading,
    Text,
    Select,
    TextField,
    Grid,
} from '@radix-ui/themes';
import {
    CreateOrganizationResult,
    Organization,
    User,
} from '@/types/appState.type';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { OrganizationSchema } from '@/schema/organizationSchema';

type OrganizationFormValues = {
    name: string;
    orgType: 'personal' | 'company' | 'private';
    companyName?: string;
    companyWebsite?: string;
    logoURL?: string;
};

export default function OrganizationForm({
    user,
    onSubmit,
    onDelete,
    organization,
}: {
    user: User | null;
    onSubmit: (
        data: OrganizationFormValues
    ) => Promise<CreateOrganizationResult>;
    onDelete?: () => Promise<void>;
    organization?: Organization;
}) {
    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
    } = useForm<OrganizationFormValues>({
        resolver: zodResolver(OrganizationSchema),
        defaultValues: {
            name: organization?.name ?? '',
            orgType: organization?.orgType ?? 'personal',
            companyName: organization?.companyName ?? '',
            companyWebsite: organization?.companyWebsite ?? '',
            logoURL: organization?.logoURL ?? '',
        },
        mode: 'onChange',
    });

    // For Radix Select, manually update orgType
    const orgType = watch('orgType');

    console.log('Form errors:', errors);

    return (
        <Card size='4' style={{ width: 425, margin: '0 auto' }}>
            <Heading as='h1' size='6' align='center' mb='5'>
                {organization ? 'Update' : 'Create'} Organization
            </Heading>

            {user && (
                <Flex direction='column' gap='1' mb='4'>
                    <Text as='div' size='2' weight='bold'>
                        Current User
                    </Text>
                    <Text as='div' size='2' color='gray'>
                        Email: {user.email}
                    </Text>
                    <Text as='div' size='2' color='gray'>
                        UID: {user.id}
                    </Text>
                </Flex>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
                <Grid
                    columns={{ xs: '1', sm: 'auto 1fr' }}
                    gap='4'
                    width='100%'
                    mb='4'
                >
                    <Flex direction='column' gap='3'>
                        <Text as='label' size='2' mb='1' weight='bold'>
                            Organization Name
                        </Text>
                        <TextField.Root>
                            <input
                                {...register('name')}
                                placeholder='Enter organization name'
                                style={{ all: 'unset', width: '100%' }}
                            />
                        </TextField.Root>
                        {errors.name && (
                            <Text as='div' size='2' color='red'>
                                {errors.name.message}
                            </Text>
                        )}

                        <Text as='label' size='2' mb='1' weight='bold'>
                            Company Name
                        </Text>
                        <TextField.Root>
                            <TextField.Slot>
                                <input
                                    {...register('companyName')}
                                    style={{ all: 'unset', width: '100%' }}
                                />
                            </TextField.Slot>
                        </TextField.Root>
                        {errors.companyName && (
                            <Text as='div' size='2' color='red'>
                                {errors.companyName.message}
                            </Text>
                        )}

                        <Text as='label' size='2' mb='1' weight='bold'>
                            Company Website
                        </Text>
                        <TextField.Root>
                            <input
                                {...register('companyWebsite')}
                                placeholder='Enter company website'
                                style={{ all: 'unset', width: '100%' }}
                            />
                        </TextField.Root>
                        {errors.companyWebsite && (
                            <Text as='div' size='2' color='red'>
                                {errors.companyWebsite.message}
                            </Text>
                        )}
                    </Flex>
                    <Flex direction='column' gap='3'>
                        <Text as='label' size='2' mb='1' weight='bold'>
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
                                <Select.Item value='personal'>
                                    Personal
                                </Select.Item>
                                <Select.Item value='company'>
                                    Company
                                </Select.Item>
                                <Select.Item value='private'>
                                    Private
                                </Select.Item>
                            </Select.Content>
                        </Select.Root>
                        {errors.orgType && (
                            <Text as='div' size='2' color='red'>
                                {errors.orgType.message}
                            </Text>
                        )}

                        <Text as='label' size='2' mb='1' weight='bold'>
                            Logo URL
                        </Text>
                        <TextField.Root>
                            <input
                                {...register('logoURL')}
                                placeholder='Enter logo URL'
                                style={{ all: 'unset', width: '100%' }}
                            />
                        </TextField.Root>
                        {errors.logoURL && (
                            <Text as='div' size='2' color='red'>
                                {errors.logoURL.message}
                            </Text>
                        )}
                    </Flex>
                </Grid>

                <Flex gap='3' mt='6' justify='end'>
                    {organization && onDelete && (
                        <Button color='red' onClick={onDelete}>
                            Delete Organization
                        </Button>
                    )}
                    <Button color='green' type='submit'>
                        {organization ? 'Update' : 'Create'} Organization
                    </Button>
                </Flex>
            </form>
        </Card>
    );
}
