/**
 * TimerStateManager.js
 * 
 * Manages the timer state (running, paused, stopped) and state transitions.
 */

export class TimerStateManager {
    constructor() {
        this.state = 'stopped'; // 'running', 'paused', 'stopped'
        this.stateChangeListeners = [];
    }

    /**
     * Get the current timer state
     * @returns {string} Current state
     */
    getState() {
        return this.state;
    }

    /**
     * Change the timer state
     * @param {string} newState New timer state
     */
    changeState(newState) {
        if (this.state === newState) return;
        
        const oldState = this.state;
        this.state = newState;
        
        // Notify listeners
        this.notifyStateChange(oldState, newState);
    }

    /**
     * Add a state change listener
     * @param {Function} listener Listener function
     */
    addStateChangeListener(listener) {
        this.stateChangeListeners.push(listener);
    }

    /**
     * Remove a state change listener
     * @param {Function} listener Listener function to remove
     */
    removeStateChangeListener(listener) {
        const index = this.stateChangeListeners.indexOf(listener);
        if (index !== -1) {
            this.stateChangeListeners.splice(index, 1);
        }
    }

    /**
     * Notify all listeners of a state change
     * @param {string} oldState Previous state
     * @param {string} newState New state
     * @private
     */
    notifyStateChange(oldState, newState) {
        this.stateChangeListeners.forEach(listener => {
            listener(oldState, newState);
        });
    }

    /**
     * Check if the timer is in a specific state
     * @param {string} state State to check
     * @returns {boolean} True if timer is in specified state
     */
    isInState(state) {
        return this.state === state;
    }

    /**
     * Check if timer is running
     * @returns {boolean} True if timer is running
     */
    isRunning() {
        return this.state === 'running';
    }

    /**
     * Check if timer is paused
     * @returns {boolean} True if timer is paused
     */
    isPaused() {
        return this.state === 'paused';
    }

    /**
     * Check if timer is stopped
     * @returns {boolean} True if timer is stopped
     */
    isStopped() {
        return this.state === 'stopped';
    }
}