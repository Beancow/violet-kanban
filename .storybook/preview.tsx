import React from 'react';
import { MockAppProvider, GlobalSeed } from '../src/storybook/mocks';
import { Theme } from '@radix-ui/themes';
import * as RadixTooltip from '@radix-ui/react-tooltip';
import '@radix-ui/themes/styles.css';

export const decorators = [
    (Story, context) => (
        <Theme>
            <RadixTooltip.Provider>
                <MockAppProvider>
                    <GlobalSeed>
                        <div style={{ padding: 24 }}>
                            <Story {...context} />
                        </div>
                    </GlobalSeed>
                </MockAppProvider>
            </RadixTooltip.Provider>
        </Theme>
    ),
];

export const parameters = {
    // add storybook parameters here if needed
};
