import React from 'react';
import { Preview } from '@storybook/react';
import { MockAppProvider } from '../src/storybook/mocks';
import { Theme } from '@radix-ui/themes';
import * as RadixTooltip from '@radix-ui/react-tooltip';
import '@radix-ui/themes/styles.css';

const preview: Preview = {
    decorators: [
        (Story) => (
            <Theme>
                <RadixTooltip.Provider>
                    <MockAppProvider>
                        <div style={{ padding: 24 }}>
                            <Story />
                        </div>
                    </MockAppProvider>
                </RadixTooltip.Provider>
            </Theme>
        ),
    ],
};

export default preview;
