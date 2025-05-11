/**
 * TimerView.js
 * 
 * View component for managing the timer UI and interactions.
 */

import { SessionType } from '../models/Task.js';

/**
 * TimerView class for managing timer UI elements
 */
export class TimerView {
    /**
     * Create a new TimerView
     * @param {Object} app Reference to the main app
     */
    constructor(app) {
        this.app = app;
        
        // Timer UI elements
        this.elements = {
            container: document.getElementById('timer-container'),
            clock: document.getElementById('timer-clock'),
            type: document.getElementById('timer-type'),
            progressBar: document.getElementById('timer-progress-bar'),
            currentTask: document.getElementById('current-task-name'),
            taskStatus: document.getElementById('current-task-status'),
            sessionCounter: document.getElementById('session-counter'),
            currentSession: document.getElementById('current-session'),
            totalSessions: document.getElementById('total-sessions'),
            startBtn: document.getElementById('timer-start-btn'),
            pauseBtn: document.getElementById('timer-pause-btn'),
            endBtn: document.getElementById('timer-end-btn'),
            focusModeBtn: document.getElementById('focus-mode-btn')
        };
        
        // Focus mode elements
        this.focusElements = {
            overlay: document.getElementById('focus-mode-overlay'),
            clock: document.getElementById('focus-timer-clock'),
            type: document.getElementById('focus-timer-type'),
            task: document.getElementById('focus-timer-task'),
            exitBtn: document.getElementById('exit-focus-mode-btn')
        };
        
        // Set up event listeners
        this.setupEventListeners();
    }

    /**
     * Set up event listeners for timer controls
     */
    setupEventListeners() {
    if (this.elements.startBtn) {
        this.elements.startBtn.addEventListener('click', () => {
            if (!this.app || !this.app.timerController) {
                console.error('TimerController not available');
                return;
            }
            
            const timerController = this.app.timerController;
            
            if (timerController.timerState === 'stopped') {
                // If no task is active, show a message
                if (!timerController.activeTask) {
                    this.showMessage('Please select a task first');
                    return;
                }
                
                timerController.startTimer();
            } else if (timerController.timerState === 'paused') {
                timerController.resumeTimer();
            }
        });
    }
    
    // Improved pause button event listener
    if (this.elements.pauseBtn) {
        // Remove any existing click handlers to avoid duplicates
        const newPauseHandler = () => {
            console.log('Pause button clicked');
            
            if (!this.app || !this.app.timerController) {
                console.error('TimerController not available');
                return;
            }
            
            const timerController = this.app.timerController;
            console.log('Current timer state:', timerController.timerState);
            
            if (timerController.timerState === 'running') {
                console.log('Calling pauseTimer method');
                timerController.pauseTimer();
            } else {
                console.log('Timer not in running state, cannot pause');
            }
        };
        
        this.elements.pauseBtn.removeEventListener('click', this.pauseClickHandler);
        this.pauseClickHandler = newPauseHandler;
        this.elements.pauseBtn.addEventListener('click', this.pauseClickHandler);
    }
    
    if (this.elements.endBtn) {
        this.elements.endBtn.addEventListener('click', () => {
            if (!this.app || !this.app.timerController) return;
            
            const timerController = this.app.timerController;
            
            if (timerController.timerState !== 'stopped' && timerController.activeTask) {
                if (confirm('Are you sure you want to end this task?')) {
                    timerController.endTask();
                }
            }
        });
    }
    
    if (this.elements.focusModeBtn) {
        this.elements.focusModeBtn.addEventListener('click', () => {
            if (!this.app || !this.app.timerController) return;
            
            const timerController = this.app.timerController;
            timerController.toggleFocusMode();
        });
    }
    
    if (this.focusElements.exitBtn) {
        this.focusElements.exitBtn.addEventListener('click', () => {
            if (!this.app || !this.app.timerController) return;
            
            const timerController = this.app.timerController;
            timerController.exitFocusMode();
        });
    }
}

    /**
     * Update the timer display
     * @param {number} timeLeft Time left in seconds
     * @param {number} progress Progress percentage (0-100)
     */
    updateTimerDisplay(timeLeft, progress) {
        if (!this.elements.clock || !this.elements.progressBar) {
            return;
        }
        
        // IMPROVEMENT 3: Show 00:00 instead of 25:00 when no task is active
        if (!this.app.timerController.activeTask) {
            this.elements.clock.textContent = "00:00";
            this.elements.progressBar.style.width = "0%";
            return;
        }
        
        // Format time left as MM:SS
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Update the timer display
        this.elements.clock.textContent = timeString;
        this.elements.progressBar.style.width = `${progress}%`;
        
        // Update focus mode timer if active
        if (this.app.timerController.isFocusMode && this.focusElements.clock) {
            this.focusElements.clock.textContent = timeString;
        }
    }


    /**
     * Update the timer container class based on session type
     * @param {string} sessionType Type of session (focus or break)
     */
    updateTimerContainerClass(sessionType, isPaused = false) {
        if (!this.elements.container) {
            return;
        }
        
        // Remove existing state classes
        this.elements.container.classList.remove('focus-state', 'break-state', 'paused-state');
        
        if (isPaused) {
            // Add paused state styling
            this.elements.container.classList.add('paused-state');
            this.elements.type.textContent = 'PAUSED';
            
            // Update focus mode type if active
            if (this.app.timerController.isFocusMode && this.focusElements.type) {
                this.focusElements.type.textContent = 'PAUSED';
            }
        } else {
            // Add class based on session type
            if (sessionType === SessionType.FOCUS) {
                this.elements.container.classList.add('focus-state');
                this.elements.type.textContent = 'FOCUS';
                
                // Update focus mode type if active
                if (this.app.timerController.isFocusMode && this.focusElements.type) {
                    this.focusElements.type.textContent = 'FOCUS TIME';
                }
            } else {
                this.elements.container.classList.add('break-state');
                this.elements.type.textContent = 'BREAK';
                
                // Update focus mode type if active
                if (this.app.timerController.isFocusMode && this.focusElements.type) {
                    this.focusElements.type.textContent = 'BREAK TIME';
                }
            }
        }
    }

    /**
     * Update the task display
     * @param {Object} task Active task or null
     * @param {string} status Task status text
     */
    updateTaskDisplay(task, status) {
        if (!this.elements.currentTask || !this.elements.taskStatus) {
            return;
        }
        
        if (task) {
            this.elements.currentTask.textContent = task.name;
            
            // If status is provided, use it directly
            if (status) {
                this.elements.taskStatus.textContent = status;
            } else {
                // Otherwise, determine status based on task state and timer state
                const timerState = this.app.timerController.timerState;
                
                switch (task.status) {
                    case 'ongoing':
                        this.elements.taskStatus.textContent = 'Task Ongoing';
                        break;
                    case 'partial':
                        this.elements.taskStatus.textContent = 'Task Stopped';
                        break;
                    default:
                        this.elements.taskStatus.textContent = 'Task Ready To Start';
                        break;
                }
                
                // Override based on timer state if necessary
                if (timerState === 'running') {
                    this.elements.taskStatus.textContent = 'Task Ongoing';
                } else if (timerState === 'paused') {
                    this.elements.taskStatus.textContent = 'Task Stopped';
                }
            }
            
            // Update session counter
            this.updateSessionCounter(task.progress);
            
            // Update focus mode task if active
            if (this.app.timerController.isFocusMode && this.focusElements.task) {
                this.focusElements.task.textContent = `Working on: ${task.name}`;
            }
        } else {
            this.elements.currentTask.textContent = 'No Active Task';
            this.elements.taskStatus.textContent = 'Start a task to begin tracking time';
            
            // Reset session counter
            this.updateSessionCounter(null);
        }
    }

    /**
     * Update the session counter
     * @param {Object} progress Task progress object or null
     */
    updateSessionCounter(progress) {
        if (!this.elements.currentSession || !this.elements.totalSessions) {
            return;
        }
        
        // IMPROVEMENT 3 & 4: Show N/A when no active task or fix the counter bug
        if (!progress) {
            this.elements.currentSession.textContent = "N";
            this.elements.totalSessions.textContent = "A";
            return;
        }
        
        // Fix for bug #4: Make sure we're displaying the correct session count
        this.elements.currentSession.textContent = progress.completedSessions;
        this.elements.totalSessions.textContent = progress.totalSessions;
        
        // For debugging, log the values
        console.log(`Updating session counter: ${progress.completedSessions}/${progress.totalSessions}`);
    }

    /**
     * Update the control buttons state based on timer state
     * @param {string} timerState Current timer state ('running', 'paused', 'stopped')
     * @param {boolean} hasActiveTask Whether there is an active task
     */
    updateControlButtons(timerState, hasActiveTask) {
        if (!this.elements.startBtn || !this.elements.pauseBtn || !this.elements.endBtn) {
            console.error('TimerView.updateControlButtons: Some button elements not found');
            return;
        }
        
        // IMPROVEMENT 3: Ensure buttons are properly disabled when no task is active
        switch (timerState) {
            case 'running':
                this.elements.startBtn.disabled = true;
                this.elements.pauseBtn.disabled = false;
                this.elements.endBtn.disabled = false;
                break;
            case 'paused':
                this.elements.startBtn.disabled = false;
                this.elements.startBtn.textContent = 'Resume';
                this.elements.pauseBtn.disabled = true;
                this.elements.endBtn.disabled = false;
                break;
            case 'stopped':
                this.elements.startBtn.disabled = !hasActiveTask;
                this.elements.startBtn.textContent = 'Start';
                this.elements.pauseBtn.disabled = true;
                this.elements.endBtn.disabled = !hasActiveTask; // Also disable End Task when no task is active
                break;
        }
        
        // Update focus mode button
        if (this.elements.focusModeBtn) {
            this.elements.focusModeBtn.disabled = timerState === 'stopped' || !hasActiveTask;
        }
    }



    /**
     * Handle focus mode state change
     * @param {boolean} isActive Whether focus mode is active
     */
    updateFocusMode(isActive) {
        if (!this.focusElements.overlay) {
            return;
        }
        
        if (isActive) {
            this.focusElements.overlay.classList.add('active');
        } else {
            this.focusElements.overlay.classList.remove('active');
        }
    }

    /**
     * Show a transition animation between focus and break states
     * @param {string} fromState Previous state
     * @param {string} toState New state
     */
    showStateTransition(fromState, toState) {
        if (!this.elements.container) {
            return;
        }
        
        // Add transition class
        this.elements.container.classList.add('state-transition');
        
        // Add pulse animation
        this.elements.container.classList.add('pulse-animation');
        
        // Remove after animation completes
        setTimeout(() => {
            this.elements.container.classList.remove('state-transition', 'pulse-animation');
        }, 1000);
    }

    /**
     * Show a message to the user
     * @param {string} message Message to show
     */
    showMessage(message) {
        // A simple implementation using alert
        // Could be enhanced with a toast/snackbar component
        alert(message);
    }
}