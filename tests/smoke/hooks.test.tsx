import React, { useRef, useEffect } from 'react';
import { render } from '@testing-library/react';

test('smoke: useRef inside a component does not throw', () => {
    function C() {
        const r = useRef(0);
        useEffect(() => {
            r.current = 1;
        }, []);
        return <div data-testid='ok'>{r.current}</div>;
    }

    const { getByTestId } = render(<C />);
    expect(getByTestId('ok')).toBeTruthy();
});
