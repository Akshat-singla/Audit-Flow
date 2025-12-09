'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { useStore } from '@/lib/store';
import { announceToScreenReader } from '@/lib/accessibility';

interface EventLog {
    id: string;
    eventName: string;
    args: Record<string, any>;
    blockNumber: number;
    transactionHash: string;
    timestamp: number;
}

interface EventMonitorProps {
    contractAddress: string;
    abi: any[];
    networkId: string;
}

export default function EventMonitor({ contractAddress, abi, networkId }: EventMonitorProps) {
    const { wallet, networks } = useStore();
    const [events, setEvents] = useState<EventLog[]>([]);
    const [isMonitoring, setIsMonitoring] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
    const contractRef = useRef<ethers.Contract | null>(null);
    const listenersRef = useRef<Map<string, any>>(new Map());

    const network = networks.find(n => n.id === networkId);

    // Get all events from ABI
    const eventDefinitions = abi.filter((item: any) => item.type === 'event');

    const startMonitoring = useCallback(async () => {
        if (!wallet.isConnected || !network) return;

        const provider = new ethers.BrowserProvider((window as any).ethereum);

        try {
            const contract = new ethers.Contract(contractAddress, abi, provider);
            contractRef.current = contract;

            // Listen to all events
            eventDefinitions.forEach((eventDef: any) => {
                const eventName = eventDef.name;

                const listener = (...args: any[]) => {
                    const event = args[args.length - 1]; // Last arg is the event object

                    const eventArgs: Record<string, any> = {};
                    eventDef.inputs.forEach((input: any, index: number) => {
                        eventArgs[input.name || `arg${index}`] = args[index];
                    });

                    const newEvent: EventLog = {
                        id: `${event.transactionHash}-${event.logIndex}`,
                        eventName,
                        args: eventArgs,
                        blockNumber: event.blockNumber,
                        transactionHash: event.transactionHash,
                        timestamp: Date.now()
                    };

                    setEvents(prev => [newEvent, ...prev]);
                    announceToScreenReader(`New event: ${eventName}`);
                };

                contract.on(eventName, listener);
                listenersRef.current.set(eventName, listener);
            });

            setIsMonitoring(true);
            announceToScreenReader('Event monitoring started');
        } catch (error) {
            console.error('Failed to start monitoring:', error);
        }
    }, [wallet.isConnected, network, contractAddress, abi, eventDefinitions]);

    const stopMonitoring = useCallback(() => {
        if (contractRef.current) {
            listenersRef.current.forEach((listener, eventName) => {
                contractRef.current?.off(eventName, listener);
            });
            listenersRef.current.clear();
        }

        setIsMonitoring(false);
        announceToScreenReader('Event monitoring stopped');
    }, []);

    const loadHistoricalEvents = useCallback(async () => {
        if (!wallet.isConnected || !network) return;

        const provider = new ethers.BrowserProvider((window as any).ethereum);

        try {
            const contract = new ethers.Contract(contractAddress, abi, provider);
            const currentBlock = await provider.getBlockNumber();
            const fromBlock = Math.max(0, currentBlock - 1000); // Last 1000 blocks

            const historicalEvents: EventLog[] = [];

            for (const eventDef of eventDefinitions) {
                const filter = contract.filters[eventDef.name]();
                const logs = await contract.queryFilter(filter, fromBlock, currentBlock);

                logs.forEach((log: any) => {
                    const eventArgs: Record<string, any> = {};
                    eventDef.inputs.forEach((input: any, index: number) => {
                        eventArgs[input.name || `arg${index}`] = log.args?.[index];
                    });

                    historicalEvents.push({
                        id: `${log.transactionHash}-${log.logIndex}`,
                        eventName: eventDef.name,
                        args: eventArgs,
                        blockNumber: log.blockNumber,
                        transactionHash: log.transactionHash,
                        timestamp: Date.now()
                    });
                });
            }

            setEvents(prev => [...prev, ...historicalEvents].sort((a, b) => b.blockNumber - a.blockNumber));
            announceToScreenReader(`Loaded ${historicalEvents.length} historical events`);
        } catch (error) {
            console.error('Failed to load historical events:', error);
        }
    }, [wallet.isConnected, network, contractAddress, abi, eventDefinitions]);

    const clearEvents = useCallback(() => {
        setEvents([]);
        announceToScreenReader('Events cleared');
    }, []);

    const exportEvents = useCallback(() => {
        const dataStr = JSON.stringify(events, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `events-${contractAddress}-${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
        announceToScreenReader('Events exported');
    }, [events, contractAddress]);

    useEffect(() => {
        return () => {
            stopMonitoring();
        };
    }, [stopMonitoring]);

    const formatValue = (value: any): string => {
        if (typeof value === 'bigint') {
            return value.toString();
        }
        if (typeof value === 'object') {
            return JSON.stringify(value);
        }
        return String(value);
    };

    const filteredEvents = selectedEvent
        ? events.filter(e => e.eventName === selectedEvent)
        : events;

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <button
                        onClick={isMonitoring ? stopMonitoring : startMonitoring}
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${isMonitoring
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                    >
                        {isMonitoring ? 'Stop' : 'Start'} Monitoring
                    </button>
                    <button
                        onClick={loadHistoricalEvents}
                        disabled={isMonitoring}
                        className="px-3 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                    >
                        Load History
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={exportEvents}
                        disabled={events.length === 0}
                        className="px-3 py-1.5 text-sm font-medium bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                        title="Export events"
                    >
                        Export
                    </button>
                    <button
                        onClick={clearEvents}
                        disabled={events.length === 0}
                        className="px-3 py-1.5 text-sm font-medium bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                        title="Clear events"
                    >
                        Clear
                    </button>
                </div>
            </div>

            {/* Event Filter */}
            {eventDefinitions.length > 0 && (
                <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Filter by Event
                    </label>
                    <select
                        value={selectedEvent || 'all'}
                        onChange={(e) => setSelectedEvent(e.target.value === 'all' ? null : e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    >
                        <option value="all">All Events ({events.length})</option>
                        {eventDefinitions.map((eventDef: any) => {
                            const count = events.filter(e => e.eventName === eventDef.name).length;
                            return (
                                <option key={eventDef.name} value={eventDef.name}>
                                    {eventDef.name} ({count})
                                </option>
                            );
                        })}
                    </select>
                </div>
            )}

            {/* Status */}
            <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="text-gray-600 dark:text-gray-400">
                    {isMonitoring ? 'Monitoring active' : 'Monitoring inactive'} • {filteredEvents.length} events
                </span>
            </div>

            {/* Events List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredEvents.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        {isMonitoring ? 'Waiting for events...' : 'No events captured yet'}
                    </div>
                ) : (
                    filteredEvents.map((event) => (
                        <div
                            key={event.id}
                            className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm font-medium text-blue-600 dark:text-blue-400">
                                        {event.eventName}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        Block {event.blockNumber}
                                    </span>
                                </div>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {new Date(event.timestamp).toLocaleTimeString()}
                                </span>
                            </div>

                            {Object.keys(event.args).length > 0 && (
                                <div className="space-y-1 mb-2">
                                    {Object.entries(event.args).map(([key, value]) => (
                                        <div key={key} className="text-xs">
                                            <span className="text-gray-600 dark:text-gray-400">{key}:</span>{' '}
                                            <span className="font-mono text-gray-900 dark:text-gray-100">
                                                {formatValue(value)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <a
                                href={`${network?.explorerUrl}/tx/${event.transactionHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-mono"
                            >
                                {event.transactionHash.slice(0, 10)}...{event.transactionHash.slice(-8)}
                            </a>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
