/**
 * Accessibility utilities for focus management and screen reader announcements
 */

/**
 * Focus trap for modals - keeps focus within the modal
 */
export class FocusTrap {
    private element: HTMLElement;
    private previouslyFocusedElement: HTMLElement | null = null;
    private focusableElements: HTMLElement[] = [];

    constructor(element: HTMLElement) {
        this.element = element;
    }

    /**
     * Activate the focus trap
     */
    activate() {
        // Store the currently focused element
        this.previouslyFocusedElement = document.activeElement as HTMLElement;

        // Get all focusable elements within the trap
        this.updateFocusableElements();

        // Focus the first focusable element
        if (this.focusableElements.length > 0) {
            this.focusableElements[0].focus();
        }

        // Add event listener for tab key
        document.addEventListener('keydown', this.handleKeyDown);
    }

    /**
     * Deactivate the focus trap and restore focus
     */
    deactivate() {
        document.removeEventListener('keydown', this.handleKeyDown);

        // Restore focus to the previously focused element
        if (this.previouslyFocusedElement) {
            this.previouslyFocusedElement.focus();
        }
    }

    /**
     * Update the list of focusable elements
     */
    private updateFocusableElements() {
        const focusableSelectors = [
            'a[href]',
            'button:not([disabled])',
            'textarea:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
        ];

        this.focusableElements = Array.from(
            this.element.querySelectorAll<HTMLElement>(focusableSelectors.join(','))
        ).filter((el) => {
            // Filter out hidden elements
            return el.offsetParent !== null;
        });
    }

    /**
     * Handle keyboard navigation within the trap
     */
    private handleKeyDown = (event: KeyboardEvent) => {
        if (event.key !== 'Tab') return;

        this.updateFocusableElements();

        if (this.focusableElements.length === 0) return;

        const firstElement = this.focusableElements[0];
        const lastElement = this.focusableElements[this.focusableElements.length - 1];
        const activeElement = document.activeElement as HTMLElement;

        // Shift + Tab (backwards)
        if (event.shiftKey) {
            if (activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
            }
        }
        // Tab (forwards)
        else {
            if (activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            }
        }
    };
}

/**
 * Announce a message to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove the announcement after a delay
    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
}

/**
 * Hook for managing focus trap in React components
 */
export function useFocusTrap(isActive: boolean, elementRef: React.RefObject<HTMLElement>) {
    const focusTrapRef = React.useRef<FocusTrap | null>(null);

    React.useEffect(() => {
        if (!elementRef.current) return;

        if (isActive) {
            focusTrapRef.current = new FocusTrap(elementRef.current);
            focusTrapRef.current.activate();
        }

        return () => {
            if (focusTrapRef.current) {
                focusTrapRef.current.deactivate();
                focusTrapRef.current = null;
            }
        };
    }, [isActive, elementRef]);
}

// Re-export React for the hook
import React from 'react';
