'use client';

import { memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import NetworkSelector from './NetworkSelector';
import WalletConnect from './WalletConnect';

function Navigation() {
    const pathname = usePathname();
    const isHomePage = pathname === '/';

    return (
        <nav className={`border-b ${isHomePage ? 'border-gray-900 bg-black' : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'}`}>
            <div className="px-6 py-3">
                <div className="flex items-center justify-between">

                    <Link href="/" className="flex items-center gap-2">
                        <span className={`text-lg font-semibold ${isHomePage ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
                            Audit Flow
                        </span>
                    </Link>


                    <div className="flex items-center gap-1">
                        <Link
                            href="/deploy"
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${pathname === '/deploy'
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                : isHomePage
                                    ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                        >
                            Deploy
                        </Link>
                        <Link
                            href="/audit"
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${pathname === '/audit'
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                : isHomePage
                                    ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                        >
                            Audit Report
                        </Link>
                        <Link
                            href="/history"
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${pathname === '/history'
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                : isHomePage
                                    ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                        >
                            History
                        </Link>
                        <Link
                            href="/docs"
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${pathname === '/docs'
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                : isHomePage
                                    ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                        >
                            Docs
                        </Link>
                        <Link
                            href="/profile"
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${pathname === '/profile'
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                : isHomePage
                                    ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                        >
                            Profile
                        </Link>
                    </div>


                    <div className="flex items-center gap-3">
                        <NetworkSelector />
                        <WalletConnect />
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default memo(Navigation);
