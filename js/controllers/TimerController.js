/**
 * TimerController.js
 * 
 * Controller for managing the Pomodoro timer functionality.
 * Handles timer state, session transitions, and UI updates.
 */

import { TaskStatus, SessionType } from '../models/Task.js';
import { StorageManager } from '../services/StorageManager.js';

/**
 * TimerController class for managing the Pomodoro timer
 */
export class TimerController {
    /**
     * Create a new TimerController
     * @param {TaskController} taskController Reference to the TaskController
     * @param {NotificationService} notificationService Reference to the NotificationService
     * @param {TimerView} timerView Reference to the TimerView
     */
    constructor(taskController, notificationService, timerView = null) {
        this.taskController = taskController;
        this.notificationService = notificationService;
        this.timerView = timerView;
        this.activeTask = null;
        this.currentSession = null;
        this.timerState = 'stopped'; // 'running', 'paused', 'stopped'
        this.isFocusMode = false;
        
        // Initialize the Web Worker
        this.initWorker();
        
        // Set up UI elements
        this.timerElements = {
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
        this.focusModeElements = {
            overlay: document.getElementById('focus-mode-overlay'),
            clock: document.getElementById('focus-timer-clock'),
            type: document.getElementById('focus-timer-type'),
            task: document.getElementById('focus-timer-task'),
            exitBtn: document.getElementById('exit-focus-mode-btn')
        };
        
        // Set up event listeners (only if timerView is not provided)
        if (!this.timerView) {
            this.setupEventListeners();
        }
        
        // Timer sound effects
        this.sounds = {
            focusEnd: new Audio('../assets/sounds/timer-end.mp3'),
            breakEnd: new Audio('../assets/sounds/break-start.mp3')
        };
        
        // Auto-pause on visibility change
        this.setupVisibilityChangeListener();
    }

    /**
     * Initialize the Web Worker for background timing
     */
    initWorker() {
        this.worker = new Worker('js/services/TimerWorker.js');
        
        // Listen for messages from the worker
        this.worker.onmessage = (e) => {
            const data = e.data;
            
            switch (data.type) {
                case 'tick':
                    this.updateTimerDisplay(data.timeLeft, data.progress);
                    break;
                case 'complete':
                    this.handleTimerComplete();
                    break;
                case 'paused':
                    this.timerState = 'paused';
                    this.updateControlButtons();
                    break;
                case 'resumed':
                    this.timerState = 'running';
                    this.updateControlButtons();
                    break;
                case 'stopped':
                    this.timerState = 'stopped';
                    this.updateControlButtons();
                    break;
            }
        };
    }

    /**
     * Set up event listeners for timer controls
     */
    setupEventListeners() {
        // Check if elements exist before adding listeners
        if (this.timerElements.startBtn) {
            this.timerElements.startBtn.addEventListener('click', () => {
                if (this.timerState === 'stopped') {
                    // If no task is active, do nothing
                    if (!this.activeTask) {
                        alert('Please select a task first.');
                        return;
                    }
                    
                    this.startTimer();
                } else if (this.timerState === 'paused') {
                    this.resumeTimer();
                }
            });
        }
        
        if (this.timerElements.pauseBtn) {
            this.timerElements.pauseBtn.addEventListener('click', () => {
                if (this.timerState === 'running') {
                    this.pauseTimer();
                }
            });
        }
        
        if (this.timerElements.endBtn) {
            this.timerElements.endBtn.addEventListener('click', () => {
                if (this.timerState !== 'stopped' && this.activeTask) {
                    if (confirm('Are you sure you want to end this task?')) {
                        this.endTask();
                    }
                }
            });
        }
        
        if (this.timerElements.focusModeBtn) {
            this.timerElements.focusModeBtn.addEventListener('click', () => {
                this.toggleFocusMode();
            });
        }
        
        if (this.focusModeElements.exitBtn) {
            this.focusModeElements.exitBtn.addEventListener('click', () => {
                this.exitFocusMode();
            });
        }
    }

    /**
     * Set up visibility change listener for auto-pause
     */
    setupVisibilityChangeListener() {
        document.addEventListener('visibilitychange', () => {
            const settings = StorageManager.getSettings();
            
            // Check if auto-pause is enabled in settings
            if (settings.autoPauseOnInactiveTab !== false) {
                if (document.hidden && this.timerState === 'running') {
                    // Auto-pause when tab is hidden
                    this.pauseTimer();
                }
            }
        });
    }

    /**
     * Set the active task for the timer
     * @param {Task} task Task object
     */
    setActiveTask(task) {
        // If a task is already active and different from the new one, confirm switch
        if (this.activeTask && this.activeTask.id !== task.id && this.timerState !== 'stopped') {
            if (!confirm('Another task is currently in progress. Switch to the new task?')) {
                return false;
            }
            
            // Stop the current timer
            this.stopTimer();
        }
        
        // Set the new active task
        this.activeTask = task;
        
        // Update the timer UI
        this.updateTaskDisplay();
        
        // Get the current session
        this.currentSession = task.getCurrentSession();
        
        // Update control buttons
        this.updateControlButtons();
        
        return true;
    }

    /**
     * Start the timer for the current session
     */
    startTimer() {
        if (!this.activeTask || !this.currentSession) {
            return;
        }
        
        // Update task status
        this.activeTask.start();
        this.taskController.updateTask(this.activeTask.id, this.activeTask);
        
        // Get session duration in seconds
        const durationSeconds = this.currentSession.duration * 60;
        
        // Set timer container class based on session type
        this.updateTimerContainerClass();
        
        // Start the worker timer
        this.worker.postMessage({
            command: 'start',
            duration: durationSeconds
        });
        
        // Update timer state
        this.timerState = 'running';
        
        // Update control buttons
        this.updateControlButtons();
        
        // If task has focus mode enabled, enter focus mode
        if (this.activeTask.useFocusMode) {
            this.enterFocusMode();
        }
        
        // Show notification that the session started
        if (this.notificationService) {
            if (this.currentSession.type === SessionType.FOCUS) {
                this.notificationService.showFocusStartNotification(
                    this.activeTask, 
                    this.activeTask.progress.currentSession + 1
                );
            } else {
                this.notificationService.showBreakStartNotification(this.activeTask);
            }
        }
    }

    /**
     * Pause the timer
     */
    pauseTimer() {
        if (this.timerState === 'running') {
            // Pause the worker timer
            this.worker.postMessage({ command: 'pause' });
            
            // Update task status (to partial if it was ongoing)
            if (this.activeTask && this.activeTask.status === TaskStatus.ONGOING) {
                this.activeTask.pause();
                this.taskController.updateTask(this.activeTask.id, this.activeTask);
            }
        }
    }

    /**
     * Resume the timer
     */
    resumeTimer() {
        if (this.timerState === 'paused') {
            // Resume the worker timer
            this.worker.postMessage({ command: 'resume' });
            
            // Update task status (to ongoing if it was partial)
            if (this.activeTask && this.activeTask.status === TaskStatus.PARTIAL) {
                this.activeTask.start();
                this.taskController.updateTask(this.activeTask.id, this.activeTask);
            }
        }
    }

    /**
     * Stop the timer
     */
    stopTimer() {
        // Stop the worker timer
        this.worker.postMessage({ command: 'stop' });
        
        // Reset the timer display
        this.updateTimerDisplay(0, 100);
        
        // Update timer state
        this.timerState = 'stopped';
        
        // Update control buttons
        this.updateControlButtons();
        
        // Exit focus mode if active
        if (this.isFocusMode) {
            this.exitFocusMode();
        }
    }

    /**
     * End the current task
     */
    endTask() {
        if (!this.activeTask) {
            return;
        }
        
        // Complete all remaining sessions
        while (this.activeTask.getCurrentSession()) {
            this.activeTask.completeCurrentSession();
        }
        
        // Save the task
        this.taskController.updateTask(this.activeTask.id, this.activeTask);
        
        // Stop the timer
        this.stopTimer();
        
        // Clear the active task
        this.activeTask = null;
        this.currentSession = null;
        
        // Update the display
        this.updateTaskDisplay();
        
        // Show notification
        if (this.notificationService) {
            this.notificationService.showTaskCompletedNotification(this.activeTask);
        }
    }

    /**
     * Handle timer completion
     */
    handleTimerComplete() {
        // Play sound based on session type
        if (this.currentSession) {
            if (this.currentSession.type === SessionType.FOCUS) {
                this.sounds.focusEnd.play();
            } else {
                this.sounds.breakEnd.play();
            }
        }
        
        // Show notification
        if (this.notificationService) {
            if (this.currentSession.type === SessionType.FOCUS) {
                this.notificationService.showFocusEndNotification(
                    this.activeTask,
                    this.activeTask.progress.completedSessions
                );
            } else {
                this.notificationService.showBreakEndNotification(this.activeTask);
            }
        }
        
        // Mark current session as completed
        if (this.activeTask) {
            this.taskController.completeTaskSession(this.activeTask.id);
            
            // Get the updated task
            this.activeTask = this.taskController.getTaskById(this.activeTask.id);
            
            // Update the session counter
            this.updateSessionCounter();
            
            // Get the next session
            this.currentSession = this.activeTask.getCurrentSession();
            
            // Check if all sessions are completed
            if (!this.currentSession) {
                // Task is completed
                this.stopTimer();
                
                // Show task completed message
                if (this.notificationService) {
                    this.notificationService.showTaskCompletedNotification(this.activeTask);
                }
                
                return;
            }
            
            // Update timer container class for the new session
            this.updateTimerContainerClass();
            
            // Check if auto-start next session is enabled
            const settings = StorageManager.getSettings();
            if (settings.autoStartNextSession) {
                // Auto-start the next session
                this.startTimer();
            } else {
                // Stop the timer and wait for user action
                this.stopTimer();
            }
        } else {
            // No active task, just stop the timer
            this.stopTimer();
        }
    }

    /**
     * Update the timer display
     * @param {number} timeLeft Time left in seconds
     * @param {number} progress Progress percentage (0-100)
     */
    updateTimerDisplay(timeLeft, progress) {
        if (this.timerView) {
            // Use TimerView to update the display
            this.timerView.updateTimerDisplay(timeLeft, progress);
        } else if (this.timerElements.clock && this.timerElements.progressBar) {
            // Fallback to direct DOM manipulation
            // Format time left as MM:SS
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            // Update the timer display
            this.timerElements.clock.textContent = timeString;
            this.timerElements.progressBar.style.width = `${progress}%`;
            
            // Update focus mode timer if active
            if (this.isFocusMode && this.focusModeElements.clock) {
                this.focusModeElements.clock.textContent = timeString;
            }
        }
    }

    /**
     * Update the timer container class based on session type
     */
    updateTimerContainerClass() {
        if (this.timerView) {
            // Use TimerView to update the container class
            if (this.currentSession) {
                this.timerView.updateTimerContainerClass(this.currentSession.type);
            }
        } else if (this.timerElements.container && this.currentSession) {
            // Fallback to direct DOM manipulation
            // Remove existing state classes
            this.timerElements.container.classList.remove('focus-state', 'break-state');
            
            // Add class based on session type
            if (this.currentSession.type === SessionType.FOCUS) {
                this.timerElements.container.classList.add('focus-state');
                this.timerElements.type.textContent = 'FOCUS';
                
                // Update focus mode type if active
                if (this.isFocusMode && this.focusModeElements.type) {
                    this.focusModeElements.type.textContent = 'FOCUS TIME';
                }
            } else {
                this.timerElements.container.classList.add('break-state');
                this.timerElements.type.textContent = 'BREAK';
                
                // Update focus mode type if active
                if (this.isFocusMode && this.focusModeElements.type) {
                    this.focusModeElements.type.textContent = 'BREAK TIME';
                }
            }
        }
    }

    /**
     * Update the task display
     */
    updateTaskDisplay() {
        if (this.timerView) {
            // Use TimerView to update the task display
            let statusText = '';
            if (this.activeTask) {
                switch (this.activeTask.status) {
                    case TaskStatus.ONGOING:
                        statusText = 'In progress';
                        break;
                    case TaskStatus.PARTIAL:
                        statusText = 'Paused';
                        break;
                    default:
                        statusText = 'Ready to start';
                        break;
                }
            }
            
            this.timerView.updateTaskDisplay(this.activeTask, statusText);
        } else if (this.timerElements.currentTask && this.timerElements.taskStatus) {
            // Fallback to direct DOM manipulation
            if (this.activeTask) {
                this.timerElements.currentTask.textContent = this.activeTask.name;
                
                let statusText = '';
                switch (this.activeTask.status) {
                    case TaskStatus.ONGOING:
                        statusText = 'In progress';
                        break;
                    case TaskStatus.PARTIAL:
                        statusText = 'Paused';
                        break;
                    default:
                        statusText = 'Ready to start';
                        break;
                }
                
                this.timerElements.taskStatus.textContent = statusText;
                
                // Update session counter
                this.updateSessionCounter();
                
                // Update focus mode task if active
                if (this.isFocusMode && this.focusModeElements.task) {
                    this.focusModeElements.task.textContent = `Working on: ${this.activeTask.name}`;
                }
            } else {
                this.timerElements.currentTask.textContent = 'No Active Task';
                this.timerElements.taskStatus.textContent = 'Start a task to begin tracking time';
                
                // Reset session counter
                if (this.timerElements.currentSession && this.timerElements.totalSessions) {
                    this.timerElements.currentSession.textContent = '0';
                    this.timerElements.totalSessions.textContent = '0';
                }
            }
        }
    }

    /**
     * Update the session counter
     */
    updateSessionCounter() {
        if (this.timerView) {
            // Use TimerView to update the session counter
            if (this.activeTask) {
                this.timerView.updateSessionCounter(this.activeTask.progress);
            } else {
                this.timerView.updateSessionCounter(null);
            }
        } else if (this.timerElements.currentSession && this.timerElements.totalSessions && this.activeTask) {
            // Fallback to direct DOM manipulation
            const progress = this.activeTask.progress;
            this.timerElements.currentSession.textContent = progress.completedSessions;
            this.timerElements.totalSessions.textContent = progress.totalSessions;
        }
    }

    /**
     * Update the control buttons state
     */
    updateControlButtons() {
        if (this.timerView) {
            // Use TimerView to update the control buttons
            this.timerView.updateControlButtons(this.timerState, !!this.activeTask);
        } else if (this.timerElements.startBtn && this.timerElements.pauseBtn && this.timerElements.endBtn) {
            // Fallback to direct DOM manipulation
            switch (this.timerState) {
                case 'running':
                    this.timerElements.startBtn.disabled = true;
                    this.timerElements.pauseBtn.disabled = false;
                    this.timerElements.endBtn.disabled = false;
                    break;
                case 'paused':
                    this.timerElements.startBtn.disabled = false;
                    this.timerElements.startBtn.textContent = 'Resume';
                    this.timerElements.pauseBtn.disabled = true;
                    this.timerElements.endBtn.disabled = false;
                    break;
                case 'stopped':
                    this.timerElements.startBtn.disabled = !this.activeTask;
                    this.timerElements.startBtn.textContent = 'Start';
                    this.timerElements.pauseBtn.disabled = true;
                    this.timerElements.endBtn.disabled = true;
                    break;
            }
            
            // Update focus mode button
            if (this.timerElements.focusModeBtn) {
                this.timerElements.focusModeBtn.disabled = this.timerState === 'stopped';
            }
        }
    }

    /**
     * Toggle focus mode
     */
    toggleFocusMode() {
        if (this.isFocusMode) {
            this.exitFocusMode();
        } else {
            this.enterFocusMode();
        }
    }

    /**
     * Enter focus mode
     */
    enterFocusMode() {
        // Enable focus mode
        this.isFocusMode = true;
        
        // Save focus mode preference for the task
        if (this.activeTask) {
            this.activeTask.useFocusMode = true;
            this.taskController.updateTask(this.activeTask.id, this.activeTask);
        }
        
        if (this.timerView) {
            // Use TimerView to update focus mode
            this.timerView.updateFocusMode(true);
        } else if (this.focusModeElements.overlay) {
            // Fallback to direct DOM manipulation
            // Update focus mode UI
            if (this.activeTask) {
                this.focusModeElements.task.textContent = `Working on: ${this.activeTask.name}`;
            }
            
            if (this.currentSession) {
                this.focusModeElements.type.textContent = 
                    this.currentSession.type === SessionType.FOCUS ? 'FOCUS TIME' : 'BREAK TIME';
            }
            
            // Get current time from worker
            this.worker.postMessage({ command: 'getTimeLeft' });
            
            // Show the overlay
            this.focusModeElements.overlay.classList.add('active');
        }
        
        // Request full screen if possible (needs user gesture)
        try {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
            }
        } catch (e) {
            console.warn('Could not enter full screen mode:', e);
        }
    }

    /**
     * Exit focus mode
     */
    exitFocusMode() {
        // Disable focus mode
        this.isFocusMode = false;
        
        if (this.timerView) {
            // Use TimerView to update focus mode
            this.timerView.updateFocusMode(false);
        } else if (this.focusModeElements.overlay) {
            // Fallback to direct DOM manipulation
            // Hide the overlay
            this.focusModeElements.overlay.classList.remove('active');
        }
        
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
    }

    /**
     * Check if notifications are supported and permission is granted
     * @returns {boolean} True if notifications are supported and allowed
     */
    areNotificationsEnabled() {
        return "Notification" in window && Notification.permission === "granted";
    }

    /**
     * Request notification permission
     * @returns {Promise<boolean>} Promise that resolves to true if permission is granted
     */
    async requestNotificationPermission() {
        if (!("Notification" in window)) {
            return false;
        }
        
        if (Notification.permission === "granted") {
            return true;
        }
        
        const permission = await Notification.requestPermission();
        return permission === "granted";
    }

    /**
     * Show a notification
     * @param {string} title Notification title
     * @param {string} body Notification body text
     */
    showNotification(title, body) {
        // First check settings to see if notifications are enabled
        const settings = StorageManager.getSettings();
        if (!settings.notifications?.enabled) {
            return;
        }
        
        // Check if notifications are supported and allowed
        if (this.areNotificationsEnabled()) {
            const notification = new Notification(title, {
                body: body,
                icon: '/assets/icons/favicon.ico'
            });
            
            // Auto-close after 5 seconds
            setTimeout(() => notification.close(), 5000);
            
            // Add to notification history
            StorageManager.addNotification({
                title,
                body,
                type: 'timer',
                taskId: this.activeTask ? this.activeTask.id : null
            });
        } else {
            // Request permission for next time
            this.requestNotificationPermission();
            
            // Log message as fallback
            console.log(`${title}: ${body}`);
        }
    }
}
