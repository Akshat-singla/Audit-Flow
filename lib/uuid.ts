/**
 * Generates a UUID v4 string
 * Uses crypto.randomUUID() if available (modern browsers), otherwise falls back to a polyfill
 */
export function generateUUID(): string {
    // Use native crypto.randomUUID if available
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    // Fallback implementation for older browsers
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
