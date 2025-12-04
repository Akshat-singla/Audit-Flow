/**
 * Toast notification system for user feedback
 * Provides success, error, warning, and info notifications
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

type ToastListener = (toasts: Toast[]) => void;

class ToastManager {
    private toasts: Toast[] = [];
    private listeners: Set<ToastListener> = new Set();
    private nextId = 0;

    /**
     * Subscribe to toast updates
     */
    subscribe(listener: ToastListener): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    /**
     * Notify all listeners of toast changes
     */
    private notify(): void {
        this.listeners.forEach(listener => listener([...this.toasts]));
    }

    /**
     * Add a toast notification
     */
    private addToast(type: ToastType, message: string, duration: number = 5000): string {
        const id = `toast-${this.nextId++}`;
        const toast: Toast = { id, type, message, duration };

        this.toasts.push(toast);
        this.notify();

        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                this.removeToast(id);
            }, duration);
        }

        return id;
    }

    /**
     * Remove a toast by ID
     */
    removeToast(id: string): void {
        this.toasts = this.toasts.filter(t => t.id !== id);
        this.notify();
    }

    /**
     * Show success toast
     */
    success(message: string, duration?: number): string {
        return this.addToast('success', message, duration);
    }

    /**
     * Show error toast
     */
    error(message: string, duration?: number): string {
        return this.addToast('error', message, duration);
    }

    /**
     * Show warning toast
     */
    warning(message: string, duration?: number): string {
        return this.addToast('warning', message, duration);
    }

    /**
     * Show info toast
     */
    info(message: string, duration?: number): string {
        return this.addToast('info', message, duration);
    }

    /**
     * Clear all toasts
     */
    clearAll(): void {
        this.toasts = [];
        this.notify();
    }

    /**
     * Get current toasts
     */
    getToasts(): Toast[] {
        return [...this.toasts];
    }
}

// Export singleton instance
export const toastManager = new ToastManager();
