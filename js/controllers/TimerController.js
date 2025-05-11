/**
 * TimerController.js
 * 
 * Core controller for managing the Pomodoro timer functionality.
 * Now uses specialized managers for different responsibilities.
 */

import { TaskStatus, SessionType } from '../models/Task.js';
import { TimerStateManager } from './timer/TimerStateManager.js';
import { TimerWorkerManager } from './timer/TimerWorkerManager.js';
import { SessionManager } from './timer/SessionManager.js';
import { FocusModeManager } from './timer/FocusModeManager.js';
import { TimerNotificationManager } from './timer/TimerNotificationManager.js';

/**
 * TimerController class for managing the Pomodoro timer
 * Acts as a facade for various specialized timer managers
 */
export class TimerController {
    /**
     * Create a new TimerController
     * @param {TaskController} taskController Reference to the TaskController
     * @param {NotificationService} notificationService Reference to the NotificationService
     * @param {TimerView} timerView Reference to the TimerView
     * @param {Object} app Reference to the main app instance
     */
    constructor(taskController, notificationService, timerView = null, app = null) {
        this.taskController = taskController;
        this.timerView = timerView;
        this.app = app;
        
        // Initialize managers
        this.stateManager = new TimerStateManager();
        this.sessionManager = new SessionManager(taskController);
        this.workerManager = new TimerWorkerManager(
            this.updateTimerDisplay.bind(this),
            this.handleTimerComplete.bind(this)
        );
        this.notificationManager = new TimerNotificationManager(notificationService);
        this.focusModeManager = new FocusModeManager();
        
        // Set up worker state change handler
        this.workerManager.setStateChangeCallback(this.handleWorkerStateChange.bind(this));
        
        // Initialize UI elements
        this.initUIElements();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Set up visibility change listener
        this.setupVisibilityChangeListener();
        
        // Timer sound effects
        this.sounds = {
            focusEnd: new Audio('../assets/sounds/timer-end.mp3'),
            breakEnd: new Audio('../assets/sounds/break-start.mp3')
        };
    }

    /**
     * Initialize UI elements
     */
    initUIElements() {
        // Timer UI elements
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
    }

    /**
     * Set up event listeners for timer controls
     */
    setupEventListeners() {
        if (!this.timerView) {
            if (this.timerElements.startBtn) {
                this.timerElements.startBtn.addEventListener('click', () => {
                    if (this.stateManager.isStopped()) {
                        if (!this.getActiveTask()) {
                            alert('Please select a task first.');
                            return;
                        }
                        this.startTimer();
                    } else if (this.stateManager.isPaused()) {
                        this.resumeTimer();
                    }
                });
            }
            
            if (this.timerElements.pauseBtn) {
                this.timerElements.pauseBtn.addEventListener('click', () => {
                    if (this.stateManager.isRunning()) {
                        this.pauseTimer();
                    }
                });
            }
            
            if (this.timerElements.endBtn) {
                this.timerElements.endBtn.addEventListener('click', () => {
                    if (!this.stateManager.isStopped() && this.getActiveTask()) {
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
    }

    /**
     * Set up visibility change listener for auto-pause
     */
    setupVisibilityChangeListener() {
        document.addEventListener('visibilitychange', () => {
            const settings = this.app.settings;
            
            // Check if auto-pause is enabled in settings
            if (settings.autoPauseOnInactiveTab !== false) {
                if (document.hidden && this.stateManager.isRunning()) {
                    // Auto-pause when tab is hidden
                    this.pauseTimer();
                }
            }
        });
    }

    /**
     * Handle worker state change
     * @param {string} stateType State change type from worker
     */
    handleWorkerStateChange(stateType) {
        switch (stateType) {
            case 'paused':
                this.stateManager.changeState('paused');
                break;
            case 'resumed':
                this.stateManager.changeState('running');
                break;
            case 'stopped':
                this.stateManager.changeState('stopped');
                break;
        }
        
        // Update UI
        this.updateControlButtons();
    }

    /**
     * Set the active task for the timer
     * @param {Task} task Task object
     * @param {boolean} autoConfirm Whether to automatically confirm switching tasks
     * @returns {boolean} Success flag
     */
    setActiveTask(task, autoConfirm = true) {
        // If a task is already active and different from the new one, confirm switch
        if (this.getActiveTask() && this.getActiveTask().id !== task.id && !this.stateManager.isStopped()) {
            if (!autoConfirm && !confirm('Another task is currently in progress. Switch to the new task?')) {
                return false;
            }
            
            // Pause the current timer if it's running
            if (this.stateManager.isRunning()) {
                this.pauseTimer();
            }
        }
        
        // Set the new active task
        this.sessionManager.setActiveTask(task);
        
        // Update the timer UI
        this.updateTaskDisplay();
        
        // Update control buttons
        this.updateControlButtons();
        
        return true;
    }

    /**
     * Get the active task
     * @returns {Task|null} Active task or null
     */
    get activeTask() {
        return this.sessionManager.getActiveTask();
    }

    /**
     * Get the active task (alternative method)
     * @returns {Task|null} Active task or null
     */
    getActiveTask() {
        return this.sessionManager.getActiveTask();
    }

    /**
     * Start the timer for the current session
     */
    startTimer() {
        const task = this.getActiveTask();
        const session = this.sessionManager.getCurrentSession();
        
        if (!task || !session) {
            return;
        }
        
        // Start the task in the session manager
        this.sessionManager.startTask();
        
        // Get session duration in seconds
        const durationSeconds = session.duration * 60;
        
        // Set timer container class based on session type
        this.updateTimerContainerClass(session.type);
        
        // Start the worker timer
        this.workerManager.startTimer(durationSeconds);
        
        // Update timer state
        this.stateManager.changeState('running');
        
        // Update control buttons
        this.updateControlButtons();
        
        // If task has focus mode enabled, enter focus mode
        if (task.useFocusMode) {
            this.enterFocusMode();
        }
        
        // Show notification that the session started
        if (session.type === SessionType.FOCUS) {
            this.notificationManager.showFocusStartNotification(
                task, 
                task.progress.currentSession + 1
            );
        } else {
            this.notificationManager.showBreakStartNotification(task);
        }
    }

    /**
     * Pause the timer
     */
    pauseTimer() {
        if (this.stateManager.isRunning()) {
            // Pause the worker timer
            this.workerManager.pauseTimer();
            
            // Update timer state
            this.stateManager.changeState('paused');
            
            // Pause the task in the session manager
            this.sessionManager.pauseTask();
            
            // Update timer container class for paused state
            const session = this.sessionManager.getCurrentSession();
            if (session) {
                this.updateTimerContainerClass(session.type, true);
            }
            
            // Update control buttons
            this.updateControlButtons();
        }
    }

    /**
     * Resume the timer
     */
    resumeTimer() {
        if (this.stateManager.isPaused()) {
            // Resume the worker timer
            this.workerManager.resumeTimer();
            
            // Update timer state
            this.stateManager.changeState('running');
            
            // Resume the task in the session manager
            this.sessionManager.startTask();
            
            // Update timer container class to remove paused state
            const session = this.sessionManager.getCurrentSession();
            if (session) {
                this.updateTimerContainerClass(session.type, false);
            }
            
            // Update control buttons
            this.updateControlButtons();
        }
    }

    /**
     * Stop the timer
     */
    stopTimer() {
        // Stop the worker timer
        this.workerManager.stopTimer();
        
        // Reset the timer display
        this.updateTimerDisplay(0, 100);
        
        // Update timer state
        this.stateManager.changeState('stopped');
        
        // Update control buttons
        this.updateControlButtons();
        
        // Exit focus mode if active
        if (this.focusModeManager.isFocusModeActive()) {
            this.exitFocusMode();
        }
    }

    /**
     * End the current task
     */
    endTask() {
        if (!this.getActiveTask()) {
            return;
        }
        
        // End the task in the session manager
        const endedTask = this.sessionManager.getActiveTask(); // Save reference for notification
        this.sessionManager.endTask();
        
        // Stop the timer
        this.stopTimer();
        
        // Update the display
        this.updateTaskDisplay();
        
        // Show notification
        this.notificationManager.showTaskCompletedNotification(endedTask);
    }

    /**
     * Handle timer completion
     */
    handleTimerComplete() {
        const task = this.getActiveTask();
        const session = this.sessionManager.getCurrentSession();
        
        if (!task || !session) {
            // No active task, just stop the timer
            this.stopTimer();
            return;
        }
        
        // Play sound based on session type
        if (session.type === SessionType.FOCUS) {
            this.sounds.focusEnd.play();
        } else {
            this.sounds.breakEnd.play();
        }
        
        // Show notification
        if (session.type === SessionType.FOCUS) {
            this.notificationManager.showFocusEndNotification(
                task,
                task.progress.completedSessions
            );
        } else {
            this.notificationManager.showBreakEndNotification(task);
        }
        
        // Complete the current session
        const nextSession = this.sessionManager.completeCurrentSession();
        
        // Refresh the task list to update progress
        if (this.app && this.app.taskView) {
            this.app.taskView.refreshTaskLists(task.id);
        }
        
        // Refresh the calendar if available
        if (this.app && this.app.calendarController) {
            this.app.calendarController.refreshCalendar();
        }
        
        // Check if all sessions are completed
        if (!nextSession) {
            // Task is completed
            this.stopTimer();
            
            // Show task completed message
            this.notificationManager.showTaskCompletedNotification(task);
            
            return;
        }
        
        // Update timer container class for the new session
        this.updateTimerContainerClass();
        
        // Check if auto-start next session is enabled
        const settings = this.app.settings;
        if (settings.autoStartNextSession) {
            // Auto-start the next session
            this.startTimer();
        } else {
            // Stop the timer and wait for user action
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
            // Format time left as MM:SS
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            // Update the timer display
            this.timerElements.clock.textContent = timeString;
            this.timerElements.progressBar.style.width = `${progress}%`;
            
            // Update focus mode timer if active
            if (this.focusModeManager.isFocusModeActive() && this.focusModeElements.clock) {
                this.focusModeElements.clock.textContent = timeString;
            }
        }
    }

    /**
     * Update the timer container class based on session type
     */
    updateTimerContainerClass(sessionType, isPaused = false) {
        const session = this.sessionManager.getCurrentSession();
        sessionType = sessionType || (session ? session.type : SessionType.FOCUS);
        
        if (this.timerView) {
            // Use TimerView to update the container class
            this.timerView.updateTimerContainerClass(sessionType, isPaused);
        } else if (this.timerElements.container) {
            // Remove existing state classes
            this.timerElements.container.classList.remove('focus-state', 'break-state', 'paused-state');
            
            if (isPaused) {
                // Add paused state class
                this.timerElements.container.classList.add('paused-state');
                this.timerElements.type.textContent = 'PAUSED';
                
                // Update focus mode type if active
                if (this.focusModeManager.isFocusModeActive() && this.focusModeElements.type) {
                    this.focusModeElements.type.textContent = 'PAUSED';
                }
            } else {
                // Add class based on session type
                if (sessionType === SessionType.FOCUS) {
                    this.timerElements.container.classList.add('focus-state');
                    this.timerElements.type.textContent = 'FOCUS';
                    
                    // Update focus mode type if active
                    if (this.focusModeManager.isFocusModeActive() && this.focusModeElements.type) {
                        this.focusModeElements.type.textContent = 'FOCUS TIME';
                    }
                } else {
                    this.timerElements.container.classList.add('break-state');
                    this.timerElements.type.textContent = 'BREAK';
                    
                    // Update focus mode type if active
                    if (this.focusModeManager.isFocusModeActive() && this.focusModeElements.type) {
                        this.focusModeElements.type.textContent = 'BREAK TIME';
                    }
                }
            }
        }
    }

    /**
     * Update the task display
     */
    updateTaskDisplay() {
        const task = this.getActiveTask();
        
        if (this.timerView) {
            // Use TimerView to update the task display
            let statusText = '';
            if (task) {
                switch (task.status) {
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
            
            this.timerView.updateTaskDisplay(task, statusText);
        } else if (this.timerElements.currentTask && this.timerElements.taskStatus) {
            if (task) {
                this.timerElements.currentTask.textContent = task.name;
                
                let statusText = '';
                switch (task.status) {
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
                if (this.focusModeManager.isFocusModeActive() && this.focusModeElements.task) {
                    this.focusModeElements.task.textContent = `Working on: ${task.name}`;
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
        const task = this.getActiveTask();
        
        if (this.timerView) {
            // Use TimerView to update the session counter
            if (task) {
                this.timerView.updateSessionCounter(task.progress);
            } else {
                this.timerView.updateSessionCounter(null);
            }
        } else if (this.timerElements.currentSession && this.timerElements.totalSessions && task) {
            // Fallback to direct DOM manipulation
            const progress = task.progress;
            this.timerElements.currentSession.textContent = progress.completedSessions;
            this.timerElements.totalSessions.textContent = progress.totalSessions;
        }
    }

    /**
     * Update the control buttons state
     */
    updateControlButtons() {
        const timerState = this.stateManager.getState();
        const hasActiveTask = !!this.getActiveTask();
        
        if (this.timerView) {
            // Use TimerView to update the control buttons
            this.timerView.updateControlButtons(timerState, hasActiveTask);
        } else if (this.timerElements.startBtn && this.timerElements.pauseBtn && this.timerElements.endBtn) {
            switch (timerState) {
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
                    this.timerElements.startBtn.disabled = !hasActiveTask;
                    this.timerElements.startBtn.textContent = 'Start';
                    this.timerElements.pauseBtn.disabled = true;
                    this.timerElements.endBtn.disabled = true;
                    break;
            }
        }
        
        // Update focus mode button
        if (this.timerElements.focusModeBtn) {
            this.timerElements.focusModeBtn.disabled = timerState === 'stopped';
        }
    }

    /**
     * Toggle focus mode
     */
    toggleFocusMode() {
        if (this.focusModeManager.isFocusModeActive()) {
            this.exitFocusMode();
        } else {
            this.enterFocusMode();
        }
    }

    /**
     * Enter focus mode
     */
    enterFocusMode() {
        // Save focus mode preference for the task
        const task = this.getActiveTask();
        if (task) {
            task.useFocusMode = true;
            this.taskController.updateTask(task.id, task);
        }
        
        // Get current time from worker
        this.workerManager.getTimeLeft();
        
        // Delegate to focus mode manager
        this.focusModeManager.enterFocusMode(
            task,
            this.sessionManager.getCurrentSession(),
            this.focusModeElements
        );
    }

    /**
     * Exit focus mode
     */
    exitFocusMode() {
        this.focusModeManager.exitFocusMode();
    }

    /**
     * Get focus mode active state
     * @returns {boolean} True if focus mode is active
     */
    get isFocusMode() {
        return this.focusModeManager.isFocusModeActive();
    }

    /**
     * Get the current timer state
     * @returns {string} Timer state
     */
    get timerState() {
        return this.stateManager.getState();
    }
}