/**
 * TimerWorkerManager.js
 * 
 * Manages the Web Worker for background timing in the Pomodoro app.
 */

export class TimerWorkerManager {
    /**
     * Create a new TimerWorkerManager
     * @param {Function} onTick Callback function for tick events
     * @param {Function} onComplete Callback function for timer completion
     */
    constructor(onTick, onComplete) {
        this.worker = null;
        this.onTick = onTick;
        this.onComplete = onComplete;
        this.onStateChange = null;
        
        this.initWorker();
    }

    /**
     * Initialize the Web Worker
     */
    initWorker() {
        this.worker = new Worker('js/services/TimerWorker.js');
        
        // Set up message handler
        this.worker.onmessage = (e) => {
            const data = e.data;
            
            switch (data.type) {
                case 'tick':
                    if (this.onTick) {
                        this.onTick(data.timeLeft, data.progress);
                    }
                    break;
                    
                case 'complete':
                    if (this.onComplete) {
                        this.onComplete();
                    }
                    break;
                    
                case 'paused':
                case 'resumed':
                case 'stopped':
                    if (this.onStateChange) {
                        this.onStateChange(data.type);
                    }
                    break;
            }
        };
    }

    /**
     * Set state change callback
     * @param {Function} callback State change callback function
     */
    setStateChangeCallback(callback) {
        this.onStateChange = callback;
    }

    /**
     * Start the timer
     * @param {number} duration Duration in seconds
     */
    startTimer(duration) {
        this.worker.postMessage({
            command: 'start',
            duration: duration
        });
    }

    /**
     * Pause the timer
     */
    pauseTimer() {
        this.worker.postMessage({
            command: 'pause'
        });
    }

    /**
     * Resume the timer
     */
    resumeTimer() {
        this.worker.postMessage({
            command: 'resume'
        });
    }

    /**
     * Stop the timer
     */
    stopTimer() {
        this.worker.postMessage({
            command: 'stop'
        });
    }

    /**
     * Get current time left
     */
    getTimeLeft() {
        this.worker.postMessage({
            command: 'getTimeLeft'
        });
    }
}