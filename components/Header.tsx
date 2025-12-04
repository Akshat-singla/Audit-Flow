'use client';

import { memo } from 'react';
import NetworkSelector from './NetworkSelector';
import WalletConnect from './WalletConnect';

function Header() {
    return (
        <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <NetworkSelector />
                        <WalletConnect />
                    </div>
                </div>
            </div>
        </header>
    );
}

export default memo(Header);
