import React from 'react';
import { Preview } from '@storybook/react';
import { MockAppProvider, GlobalSeed } from '../src/storybook/mocks';
import { Theme } from '@radix-ui/themes';
import * as RadixTooltip from '@radix-ui/react-tooltip';
import '@radix-ui/themes/styles.css';

const preview: Preview = {
    decorators: [
        (Story) => (
            <Theme>
                <RadixTooltip.Provider>
                    <MockAppProvider>
                        <GlobalSeed>
                            <div style={{ padding: 24 }}>
                                <Story />
                            </div>
                        </GlobalSeed>
                    </MockAppProvider>
                </RadixTooltip.Provider>
            </Theme>
        ),
    ],
};

export default preview;
