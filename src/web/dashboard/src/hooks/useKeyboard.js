import { useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for handling keyboard shortcuts
 * @param {Object} shortcuts - Object mapping key combinations to handlers
 * Example: { 'ctrl+k': handleSearch, 'ctrl+b': handleToggleSidebar }
 */
const useKeyboard = (shortcuts = {}) => {
    const handlersRef = useRef(shortcuts);

    // Update handlers ref when shortcuts change
    useEffect(() => {
        handlersRef.current = shortcuts;
    }, [shortcuts]);

    const handleKeyDown = useCallback((event) => {
        const key = event.key.toLowerCase();
        const ctrl = event.ctrlKey || event.metaKey; // Support both Ctrl and Cmd (Mac)
        const shift = event.shiftKey;
        const alt = event.altKey;

        // Build key combination string
        let combo = '';
        if (ctrl) combo += 'ctrl+';
        if (shift) combo += 'shift+';
        if (alt) combo += 'alt+';
        combo += key;

        // Check if we have a handler for this combination
        const handler = handlersRef.current[combo];
        if (handler) {
            event.preventDefault();
            event.stopPropagation();
            handler(event);
        }
    }, []);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    return null;
};

export default useKeyboard;
