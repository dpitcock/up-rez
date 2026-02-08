import React from 'react';
import { BaseBlockProps } from './types';

interface ContainerProps extends BaseBlockProps {
    children?: React.ReactNode;
}

export const Container = ({ children, mode }: ContainerProps) => {
    return (
        <div className={mode === 'email' ? 'email-container' : 'w-full'}>
            {children}
        </div>
    );
};
