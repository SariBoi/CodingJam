/**
 * FocusModeManager.js
 * 
 * Manages the focus mode functionality in the timer.
 * Handles entering/exiting focus mode and updating the UI.
 */

/**
 * FocusModeManager class for handling focus mode
 */
export class FocusModeManager {
    /**
     * Create a new FocusModeManager
     */
    constructor() {
        this.active = false;
    }

    /**
     * Enter focus mode
     * @param {Object} task Current task
     * @param {Object} session Current session
     * @param {Object} elements Focus mode UI elements
     */
    enterFocusMode(task, session, elements) {
        this.active = true;
        
        if (!elements || !elements.overlay) {
            console.warn('Focus mode elements not available');
            return;
        }
        
        // Update focus mode UI
        if (task && elements.task) {
            elements.task.textContent = `Working on: ${task.name}`;
        }
        
        if (session && elements.type) {
            elements.type.textContent = 
                session.type === 'break' ? 'BREAK TIME' : 'FOCUS TIME';
        }
        
        // Show the overlay
        elements.overlay.classList.add('active');
        
        // Request full screen if possible (needs user gesture)
        this.requestFullScreen();
    }

    /**
     * Exit focus mode
     */
    exitFocusMode() {
        this.active = false;
        
        // Find overlay element
        const overlay = document.getElementById('focus-mode-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
        
        // Exit full screen if in full screen mode
        this.exitFullScreen();
    }

    /**
     * Update timer display in focus mode
     * @param {string} timeDisplay Time display text
     * @param {string} sessionType Session type
     * @param {string} taskName Task name
     */
    updateFocusModeDisplay(timeDisplay, sessionType, taskName) {
        if (!this.active) return;
        
        const clockElement = document.getElementById('focus-timer-clock');
        const typeElement = document.getElementById('focus-timer-type');
        const taskElement = document.getElementById('focus-timer-task');
        
        if (clockElement && timeDisplay) {
            clockElement.textContent = timeDisplay;
        }
        
        if (typeElement && sessionType) {
            typeElement.textContent = 
                sessionType === 'break' ? 'BREAK TIME' : 'FOCUS TIME';
        }
        
        if (taskElement && taskName) {
            taskElement.textContent = `Working on: ${taskName}`;
        }
    }

    /**
     * Check if focus mode is active
     * @returns {boolean} True if focus mode is active
     */
    isFocusModeActive() {
        return this.active;
    }

    /**
     * Request full screen mode
     */
    requestFullScreen() {
        try {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
            } else if (document.documentElement.webkitRequestFullscreen) {
                document.documentElement.webkitRequestFullscreen();
            } else if (document.documentElement.msRequestFullscreen) {
                document.documentElement.msRequestFullscreen();
            }
        } catch (e) {
            console.warn('Could not enter full screen mode:', e);
        }
    }

    /**
     * Exit full screen mode
     */
    exitFullScreen() {
        if (document.fullscreenElement) {
            try {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                }
            } catch (e) {
                console.warn('Could not exit full screen mode:', e);
            }
        }
    }

    /**
     * Handle keyboard shortcuts for focus mode
     * @param {KeyboardEvent} event Keyboard event
     */
    handleKeyboardShortcut(event) {
        if (!this.active) return;
        
        // Exit focus mode on Escape key
        if (event.key === 'Escape') {
            this.exitFocusMode();
        }
    }
}