'use client';
import { Box, Heading, Text } from '@radix-ui/themes';
import { useEffect, useState } from 'react';

interface LoadingPageProps {
    dataType: string;
}

const japes: { [key: string]: string[] } = {
    organizations: [
        'Herding cats... I mean, organizations.',
        'Just a moment, fetching your organizational bliss.',
        'Organizing the organizers. This might take a sec.',
        'Finding your tribe. Or at least your orgs.',
    ],
    boards: [
        'Polishing the kanban boards. Almost there!',
        'Arranging your tasks into aesthetically pleasing columns.',
        'Summoning your boards from the digital ether.',
        'Making sure your boards are perfectly aligned.',
    ],
    cards: [
        "Shuffling the cards. Don't worry, no cheating here!",
        'Dealing with your tasks, one card at a time.',
        'Just a moment, your cards are on their way.',
        'Ensuring all your cards are in the right deck.',
    ],
    default: [
        'Loading... because even data needs a coffee break.',
        'Please wait, the pixels are still assembling.',
        'Almost there! Just optimizing the fun.',
        'Patience, young padawan. Data is on its way.',
    ],
};

export default function LoadingPage({ dataType }: LoadingPageProps) {
    const [jape, setJape] = useState<string>('');

    useEffect(() => {
        const messages = japes[dataType] || japes.default;
        const randomIndex = Math.floor(Math.random() * messages.length);
        setJape(messages[randomIndex]);
    }, [dataType]);

    return (
        <Box
            style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                textAlign: 'center',
                padding: '20px',
            }}
        >
            <Heading as='h1' size='6' mb='3'>
                Loading {dataType}...
            </Heading>
            <Text size='4'>{jape}</Text>
        </Box>
    );
}
