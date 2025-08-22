import React from 'react';
import AppProvider from '../src/providers/AppProvider';

export const parameters = {
    actions: { argTypesRegex: '^on.*' },
    controls: { expanded: true },
};

export const decorators = [
    (Story) =>
        React.createElement(
            AppProvider,
            null,
            React.createElement(
                'div',
                {
                    style: {
                        padding: '1rem',
                        fontFamily: 'system-ui, sans-serif',
                    },
                },
                React.createElement(Story)
            )
        ),
];
