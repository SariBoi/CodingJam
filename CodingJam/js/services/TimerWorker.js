/**
 * TimerWorker.js
 * 
 * A Web Worker that handles timing in the background.
 * Ensures accurate timing even when the browser tab is not active.
 */

// Timer state
let timer = null;
let startTime = null;
let timeLeft = 0;
let pausedTime = null;
let originalDuration = 0;

// The last time we sent a tick event
let lastTickTime = null;
let tickInterval = 1000; // 1 second in milliseconds

/**
 * Handle messages from the main thread
 */
self.onmessage = function(e) {
    const command = e.data.command;
    
    switch (command) {
        case 'start':
            startTimer(e.data.duration);
            break;
        case 'pause':
            pauseTimer();
            break;
        case 'resume':
            resumeTimer();
            break;
        case 'stop':
            stopTimer();
            break;
        case 'getTimeLeft':
            getTimeLeft();
            break;
    }
};

/**
 * Start the timer with the given duration
 * @param {number} duration Duration in seconds
 */
function startTimer(duration) {
    // Clear any existing timer
    stopTimer();
    
    // Set initial values
    timeLeft = duration;
    originalDuration = duration;
    startTime = Date.now();
    lastTickTime = startTime;
    
    // Notify main thread of initial state
    self.postMessage({
        type: 'tick',
        timeLeft: timeLeft,
        progress: 100, // Start at 100%
        originalDuration: originalDuration
    });
    
    // Start the timer
    timer = setInterval(timerTick, 100); // Check time every 100ms for accuracy
}

/**
 * Pause the timer
 */
function pauseTimer() {
    if (timer) {
        clearInterval(timer);
        timer = null;
        
        // Store time when paused
        pausedTime = Date.now();
        
        // Calculate time left
        const elapsed = Math.floor((pausedTime - startTime) / 1000);
        timeLeft = Math.max(0, originalDuration - elapsed);
        
        // Always notify main thread
        self.postMessage({
            type: 'paused',
            timeLeft: timeLeft,
            progress: (timeLeft / originalDuration) * 100,
            originalDuration: originalDuration
        });
    }
}

/**
 * Resume the timer
 */
function resumeTimer() {
    if (!timer && pausedTime) {
        // Adjust start time to account for the pause
        const pauseDuration = Date.now() - pausedTime;
        startTime = startTime + pauseDuration;
        pausedTime = null;
        lastTickTime = Date.now();
        
        // Notify main thread with details
        self.postMessage({
            type: 'resumed',
            timeLeft: timeLeft,
            progress: (timeLeft / originalDuration) * 100,
            originalDuration: originalDuration
        });
        
        // Restart timer
        timer = setInterval(timerTick, 100);
    }
}

/**
 * Stop the timer completely
 */
function stopTimer() {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
    
    // Reset all values
    startTime = null;
    timeLeft = 0;
    pausedTime = null;
    originalDuration = 0;
    
    // Notify main thread
    self.postMessage({
        type: 'stopped'
    });
}

/**
 * Get the current time left
 */
function getTimeLeft() {
    if (timer) {
        // Timer is running, calculate time left
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        timeLeft = Math.max(0, originalDuration - elapsed);
    }
    
    // Notify main thread
    self.postMessage({
        type: 'timeLeft',
        timeLeft: timeLeft,
        progress: originalDuration ? (timeLeft / originalDuration) * 100 : 0,
        originalDuration: originalDuration
    });
}

/**
 * Timer tick callback function
 * Handles the actual counting down and notifies the main thread
 */
function timerTick() {
    const now = Date.now();
    const elapsed = Math.floor((now - startTime) / 1000);
    timeLeft = Math.max(0, originalDuration - elapsed);
    
    // Check if we've reached a new second (to avoid too many messages)
    if (now - lastTickTime >= tickInterval) {
        lastTickTime = now;
        
        // Send tick message
        self.postMessage({
            type: 'tick',
            timeLeft: timeLeft,
            progress: (timeLeft / originalDuration) * 100,
            originalDuration: originalDuration
        });
    }
    
    // Check if timer completed
    if (timeLeft === 0) {
        clearInterval(timer);
        timer = null;
        
        // Send complete message
        self.postMessage({
            type: 'complete',
            originalDuration: originalDuration
        });
    }
}