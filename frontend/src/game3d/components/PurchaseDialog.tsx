import React from 'react';

export interface ShopItem {
    id: string;
    name: string;
    price: number;
    description: string;
    type: 'toy' | 'food' | 'accessory' | 'health';
}

interface PurchaseDialogProps {
    item: ShopItem | null;
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    currentBalance: number;
}

export const PurchaseDialog: React.FC<PurchaseDialogProps> = ({
    item,
    isOpen,
    onConfirm,
    onCancel,
    currentBalance
}) => {
    if (!isOpen || !item) return null;

    const canAfford = currentBalance >= item.price;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="relative w-full max-w-md bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/50 overflow-hidden transform transition-all scale-100"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Background Gradient */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 pointer-events-none" />

                <div className="relative p-6 pt-8">
                    <h2 className="text-3xl font-bold text-gray-800 mb-2 truncate" title={item.name}>
                        {item.name}
                    </h2>

                    <div className="flex items-center space-x-2 text-sm font-medium text-gray-500 uppercase tracking-wide mb-6">
                        <span className="bg-gray-100 px-2 py-1 rounded-md">{item.type}</span>
                    </div>

                    <p className="text-gray-600 mb-8 min-h-[3rem] line-clamp-3">
                        {item.description}
                    </p>

                    <div className="bg-gray-50 rounded-xl p-4 mb-8 border border-gray-100">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-500">Price</span>
                            <span className="text-xl font-bold text-gray-800">${item.price}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                            <span className="text-gray-500">Your Balance</span>
                            <span className={`font-mono font-medium ${canAfford ? 'text-green-600' : 'text-red-500'}`}>
                                ${currentBalance}
                            </span>
                        </div>
                    </div>

                    {!canAfford && (
                        <div className="mb-4 text-center">
                            <span className="text-red-500 font-medium text-sm flex items-center justify-center gap-1">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Insufficient funds
                            </span>
                        </div>
                    )}

                    <div className="flex gap-4">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors focus:ring-2 focus:ring-gray-200 outline-none"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={!canAfford}
                            className={`flex-1 px-4 py-3 text-white font-bold rounded-xl shadow-lg transition-all transform active:scale-95 focus:ring-2 focus:ring-offset-2 outline-none
                ${canAfford
                                    ? 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/30 focus:ring-blue-500'
                                    : 'bg-gray-300 cursor-not-allowed shadow-none'
                                }`}
                        >
                            Confirm Purchase
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
