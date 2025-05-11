/**
 * FocusModeManager.js
 * 
 * Module for handling full-screen focus mode functionality.
 * Manages focus mode state and UI changes.
 */

/**
 * FocusModeManager class for handling focus mode functionality
 */
export class FocusModeManager {
    /**
     * Create a new FocusModeManager
     */
    constructor() {
        this.isActive = false;
        this.overlayElement = null;
        this.timerElement = null;
        this.taskNameElement = null;
        this.exitButton = null;
        
        // Initialize focus mode overlay
        this.createOverlay();
        
        // Set up event listeners
        this.setupEventListeners();
    }

    /**
     * Create the focus mode overlay
     */
    createOverlay() {
        // Create overlay if it doesn't exist
        if (!document.getElementById('focus-mode-overlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'focus-mode-overlay';
            overlay.className = 'focus-mode-overlay';
            
            overlay.innerHTML = `
                <div class="focus-timer-display">
                    <div class="focus-timer-type" id="focus-timer-type">FOCUS TIME</div>
                    <div class="focus-timer-clock" id="focus-timer-clock">25:00</div>
                    <div class="focus-timer-task" id="focus-timer-task">Working on: Task Name</div>
                    <button class="btn btn-outline-light" id="exit-focus-mode-btn">Exit Focus Mode</button>
                </div>
            `;
            
            document.body.appendChild(overlay);
        }
        
        // Store references to elements
        this.overlayElement = document.getElementById('focus-mode-overlay');
        this.timerElement = document.getElementById('focus-timer-clock');
        this.timerTypeElement = document.getElementById('focus-timer-type');
        this.taskNameElement = document.getElementById('focus-timer-task');
        this.exitButton = document.getElementById('exit-focus-mode-btn');
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        if (this.exitButton) {
            this.exitButton.addEventListener('click', () => {
                this.exitFocusMode();
            });
        }
        
        // Listen for escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isActive) {
                this.exitFocusMode();
            }
        });
    }

    /**
     * Enter focus mode
     * @param {Object} task Current task
     * @param {Object} session Current session
     * @param {string} timerDisplay Current timer display
     */
    enterFocusMode(task, session, timerDisplay) {
        if (!this.overlayElement) {
            this.createOverlay();
        }
        
        // Update focus mode display
        if (this.timerElement) {
            this.timerElement.textContent = timerDisplay || '25:00';
        }
        
        if (this.timerTypeElement) {
            this.timerTypeElement.textContent = 
                session && session.type === 'break' ? 'BREAK TIME' : 'FOCUS TIME';
        }
        
        if (this.taskNameElement && task) {
            this.taskNameElement.textContent = `Working on: ${task.name}`;
        }
        
        // Show the overlay
        this.overlayElement.classList.add('active');
        
        // Request full screen if possible
        try {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
            }
        } catch (e) {
            console.warn('Could not enter full screen mode:', e);
        }
        
        this.isActive = true;
    }

    /**
     * Exit focus mode
     */
    exitFocusMode() {
        if (!this.overlayElement) return;
        
        // Hide the overlay
        this.overlayElement.classList.remove('active');
        
        // Exit full screen if in full screen mode
        if (document.fullscreenElement) {
            try {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
            } catch (e) {
                console.warn('Could not exit full screen mode:', e);
            }
        }
        
        this.isActive = false;
    }

    /**
     * Update timer display in focus mode
     * @param {string} timerDisplay Timer display text
     */
    updateTimer(timerDisplay) {
        if (!this.isActive || !this.timerElement) return;
        
        this.timerElement.textContent = timerDisplay;
    }

    /**
     * Update session type in focus mode
     * @param {string} sessionType Type of session ('focus' or 'break')
     */
    updateSessionType(sessionType) {
        if (!this.isActive || !this.timerTypeElement) return;
        
        this.timerTypeElement.textContent = 
            sessionType === 'break' ? 'BREAK TIME' : 'FOCUS TIME';
    }

    /**
     * Check if focus mode is active
     * @returns {boolean} True if focus mode is active
     */
    isFocusModeActive() {
        return this.isActive;
    }
}