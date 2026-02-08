import React from 'react';
import { UpRezBlocks } from './UpRezBlocks/registry';
import { RenderMode } from './UpRezBlocks/types';
import { processProps } from '../lib/templateUtils';

interface EasyRendererProps {
    templateJson: any; // The JSON structure
    mode: RenderMode;
    data: Record<string, any>;
}



export const EasyRenderer = ({ templateJson, mode, data }: EasyRendererProps) => {
    // This is a simplified "Renderer" logic that traverses the JSON tree
    // Structure expected: { root: { children: [ { component: 'Hero', props: {...} } ] } }

    // Default fallback if template is empty
    if (!templateJson || !templateJson.root || !templateJson.root.children) {
        return <div className="p-4 text-red-500">Empty Template</div>;
    }

    const renderNode = (node: any, index: number): React.ReactNode => {
        const ComponentData = (UpRezBlocks as any)[node.component];
        if (!ComponentData) return <div key={index}>Unknown Component: {node.component}</div>;

        const Component = ComponentData.component;
        const processedProps = processProps(node.props, data);

        // Handle recursive children if present
        let childrenNode = null;
        if (node.children && Array.isArray(node.children)) {
            childrenNode = node.children.map((child: any, i: number) => renderNode(child, i));
        }

        return (
            <Component key={index} {...processedProps} mode={mode}>
                {childrenNode}
            </Component>
        );
    };

    return (
        <div className={mode === 'email' ? 'email-container' : 'landing-container'}>
            {templateJson.root.children.map((child: any, i: number) => renderNode(child, i))}
        </div>
    );
};
