import React from 'react';
import { Preview } from '@storybook/react';
import { MockAppProvider } from '../src/storybook/mocks';

const preview: Preview = {
    decorators: [
        (Story) => (
            <MockAppProvider>
                <div style={{ padding: 24 }}>
                    <Story />
                </div>
            </MockAppProvider>
        ),
    ],
};

export default preview;
