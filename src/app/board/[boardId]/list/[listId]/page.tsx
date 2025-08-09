import { createListServerAction } from '@/lib/firebase/listServerActions';
import { useUser } from '@/contexts/UserProvider';
import { useAuth } from '@/contexts/AuthProvider';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Box, Button, Flex, Text, TextArea, TextField } from '@radix-ui/themes';
import { useAppToast } from '@/hooks/useToast';

export default function CreateListPage() {
    const params = useParams();
    const { boardId } = params;
    const { user } = useUser();
    const { authUser } = useAuth();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const { showToast } = useAppToast();

    const handleCreateList = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!user || !boardId || !authUser) {
            showToast('Error', 'You must be logged in and select a board to create a list.');
            return;
        }

        
        const formData = new FormData(event.currentTarget);

        const result = await createListServerAction({
            data: formData,
            uid: user.id,
            orgId: user.organizationIds[0], // Assuming the first organization for now
            boardId: boardId as string,
        });

        if (result.success) {
            showToast('Success', 'List created successfully!');
            setTitle('');
            setDescription('');
        } else {
            showToast('Error', `Error creating list: ${result.error?.message}`);
        }
    };

    return (
        <Box>
            <Text>Create New List for Board: {boardId}</Text>
            <form onSubmit={handleCreateList}>
                <Flex direction="column" gap="2">
                    <TextField.Root
                        placeholder="List Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        name="title"
                        required
                    />
                    <TextArea
                        placeholder="List Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        name="description"
                        required
                    />
                    <Button type="submit">Create List</Button>
                </Flex>
            </form>
        </Box>
    );
}
