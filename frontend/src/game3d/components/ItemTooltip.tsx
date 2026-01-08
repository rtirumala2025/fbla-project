import React from 'react';

interface ItemTooltipProps {
    name: string;
    price: number;
    visible: boolean;
    x: number;
    y: number;
}

export const ItemTooltip: React.FC<ItemTooltipProps> = ({ name, price, visible, x, y }) => {
    if (!visible) return null;

    return (
        <div
            className="pointer-events-none fixed z-50 px-3 py-2 bg-gray-900/90 text-white rounded-lg shadow-xl backdrop-blur-sm border border-white/10 transform -translate-x-1/2 -translate-y-[120%] transition-opacity duration-150"
            style={{ left: x, top: y }}
        >
            <div className="flex flex-col items-center whitespace-nowrap">
                <span className="font-semibold text-sm">{name}</span>
                <span className="text-xs text-green-400 font-mono mt-0.5">${price}</span>
            </div>
            {/* Little arrow at bottom */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1 w-2 h-2 bg-gray-900/90 rotate-45 border-r border-b border-white/10"></div>
        </div>
    );
};
