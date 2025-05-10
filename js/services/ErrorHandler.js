/**
 * ErrorHandler.js
 * 
 * Utility for centralized error handling in the Pomodoro app.
 * Provides consistent error handling and user notifications.
 */

/**
 * ErrorHandler class for centralized error handling
 */
export class ErrorHandler {
    /**
     * Create a new ErrorHandler
     */
    constructor() {
        this.errors = [];
        this.errorOverlayElement = null;
        
        // Create error overlay
        this.createErrorOverlay();
    }

    /**
     * Create the error overlay for UI error display
     */
    createErrorOverlay() {
        if (document.getElementById('error-overlay')) return;
        
        const overlay = document.createElement('div');
        overlay.id = 'error-overlay';
        overlay.style.display = 'none';
        overlay.style.position = 'fixed';
        overlay.style.bottom = '20px';
        overlay.style.right = '20px';
        overlay.style.padding = '15px';
        overlay.style.backgroundColor = '#dc3545';
        overlay.style.color = 'white';
        overlay.style.borderRadius = '5px';
        overlay.style.maxWidth = '400px';
        overlay.style.zIndex = '9999';
        overlay.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
        
        const message = document.createElement('div');
        message.id = 'error-message';
        message.style.marginBottom = '10px';
        overlay.appendChild(message);
        
        const button = document.createElement('button');
        button.className = 'btn btn-sm btn-light';
        button.textContent = 'Dismiss';
        button.onclick = () => this.hideErrorOverlay();
        overlay.appendChild(button);
        
        document.body.appendChild(overlay);
        this.errorOverlayElement = overlay;
    }

    /**
     * Show the error overlay with a message
     * @param {string} message Error message
     */
    showErrorOverlay(message) {
        if (!this.errorOverlayElement) this.createErrorOverlay();
        
        document.getElementById('error-message').textContent = message;
        this.errorOverlayElement.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.hideErrorOverlay();
        }, 5000);
    }

    /**
     * Hide the error overlay
     */
    hideErrorOverlay() {
        if (this.errorOverlayElement) {
            this.errorOverlayElement.style.display = 'none';
        }
    }

    /**
     * Handle an error
     * @param {Error} error Error object
     * @param {string} context Context where error occurred
     * @param {boolean} showUI Whether to show UI notification
     */
    handleError(error, context = 'general', showUI = true) {
        // Log error
        console.error(`Error in ${context}:`, error);
        
        // Store error
        this.errors.push({
            message: error.message,
            stack: error.stack,
            context,
            timestamp: new Date().toISOString()
        });
        
        // Limit stored errors
        if (this.errors.length > 20) {
            this.errors = this.errors.slice(-20);
        }
        
        // Show UI notification if needed
        if (showUI) {
            let userMessage;
            
            // Customize message based on context
            switch (context) {
                case 'storage':
                    userMessage = 'Unable to save your data. Your changes may not be preserved.';
                    break;
                case 'timer':
                    userMessage = 'Timer error occurred. Please restart the timer.';
                    break;
                case 'notification':
                    userMessage = 'Could not show notification. Please check your browser settings.';
                    break;
                case 'task':
                    userMessage = 'Error while updating task. Please try again.';
                    break;
                default:
                    userMessage = 'An error occurred. Please refresh the page if problems persist.';
                    break;
            }
            
            this.showErrorOverlay(userMessage);
        }
        
        return false;
    }

    /**
     * Handle a storage error
     * @param {Error} error Error object
     */
    handleStorageError(error) {
        return this.handleError(error, 'storage', true);
    }

    /**
     * Handle a timer error
     * @param {Error} error Error object
     */
    handleTimerError(error) {
        return this.handleError(error, 'timer', true);
    }

    /**
     * Handle a notification error
     * @param {Error} error Error object
     */
    handleNotificationError(error) {
        return this.handleError(error, 'notification', true);
    }

    /**
     * Handle a task error
     * @param {Error} error Error object
     */
    handleTaskError(error) {
        return this.handleError(error, 'task', true);
    }

    /**
     * Get all stored errors
     * @returns {Array} Array of error objects
     */
    getErrors() {
        return [...this.errors];
    }

    /**
     * Clear all stored errors
     */
    clearErrors() {
        this.errors = [];
    }
}