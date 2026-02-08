// Focus-visible styles for keyboard navigation
export const focusClasses = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-discord-blurple focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900';

// Add focus-visible polyfill behavior
export const useFocusVisible = () => {
    if (typeof window !== 'undefined') {
        // Track if user is using keyboard
        let hadKeyboardEvent = true;
        const keyboardThrottleTimeMs = 100;
        let keyboardThrottleTimeout;

        const handleKeyDown = (e) => {
            if (e.metaKey || e.altKey || e.ctrlKey) {
                return;
            }

            if (keyboardThrottleTimeout) {
                clearTimeout(keyboardThrottleTimeout);
            }

            hadKeyboardEvent = true;
            keyboardThrottleTimeout = setTimeout(() => {
                hadKeyboardEvent = false;
            }, keyboardThrottleTimeMs);
        };

        const handlePointerDown = () => {
            hadKeyboardEvent = false;
        };

        const handleFocus = (e) => {
            if (hadKeyboardEvent) {
                e.target.setAttribute('data-focus-visible', 'true');
            }
        };

        const handleBlur = (e) => {
            e.target.removeAttribute('data-focus-visible');
        };

        document.addEventListener('keydown', handleKeyDown, true);
        document.addEventListener('mousedown', handlePointerDown, true);
        document.addEventListener('pointerdown', handlePointerDown, true);
        document.addEventListener('touchstart', handlePointerDown, true);
        document.addEventListener('focus', handleFocus, true);
        document.addEventListener('blur', handleBlur, true);

        return () => {
            document.removeEventListener('keydown', handleKeyDown, true);
            document.removeEventListener('mousedown', handlePointerDown, true);
            document.removeEventListener('pointerdown', handlePointerDown, true);
            document.removeEventListener('touchstart', handlePointerDown, true);
            document.removeEventListener('focus', handleFocus, true);
            document.removeEventListener('blur', handleBlur, true);
        };
    }
};
