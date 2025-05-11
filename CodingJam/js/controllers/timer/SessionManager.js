/**
 * SessionManager.js
 * 
 * Manages Pomodoro session transitions, completions, and task status updates.
 */

import { TaskStatus, SessionType } from '../../models/Task.js';

export class SessionManager {
    /**
     * Create a new SessionManager
     * @param {TaskController} taskController Reference to the TaskController
     */
    constructor(taskController) {
        this.taskController = taskController;
        this.activeTask = null;
        this.currentSession = null;
        this.sessionListeners = [];
    }

    /**
     * Set the active task
     * @param {Task} task Task object
     * @returns {Object|null} Current session or null
     */
    setActiveTask(task) {
        this.activeTask = task;
        this.currentSession = task ? task.getCurrentSession() : null;
        return this.currentSession;
    }

    /**
     * Get the active task
     * @returns {Task|null} Active task or null
     */
    getActiveTask() {
        return this.activeTask;
    }

    /**
     * Get the current session
     * @returns {Object|null} Current session or null
     */
    getCurrentSession() {
        return this.currentSession;
    }

    /**
     * Complete the current session
     * @returns {Object|null} Next session or null if task is completed
     */
    completeCurrentSession() {
        if (!this.activeTask) {
            return null;
        }

        // Mark current session as completed
        this.taskController.completeTaskSession(this.activeTask.id);
        
        // Get the updated task
        this.activeTask = this.taskController.getTaskById(this.activeTask.id);
        
        // Get the next session
        this.currentSession = this.activeTask ? this.activeTask.getCurrentSession() : null;
        
        // Notify listeners
        this.notifySessionComplete();
        
        return this.currentSession;
    }

    /**
     * Start the current task
     */
    startTask() {
        if (!this.activeTask) {
            return;
        }
        
        // Update task status
        this.activeTask.start();
        this.taskController.updateTask(this.activeTask.id, this.activeTask);
        
        // Notify listeners
        this.notifyTaskStarted();
    }

    /**
     * Pause the current task
     */
    pauseTask() {
        if (!this.activeTask || this.activeTask.status !== TaskStatus.ONGOING) {
            return;
        }
        
        // Update task status
        this.activeTask.pause();
        this.taskController.updateTask(this.activeTask.id, this.activeTask);
        
        // Notify listeners
        this.notifyTaskPaused();
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
        
        // Reset the task and session
        const endedTask = this.activeTask;
        this.activeTask = null;
        this.currentSession = null;
        
        // Notify listeners
        this.notifyTaskEnded(endedTask);
    }

    /**
     * Add a session listener
     * @param {Object} listener Listener object with optional callback methods
     */
    addSessionListener(listener) {
        this.sessionListeners.push(listener);
    }

    /**
     * Remove a session listener
     * @param {Object} listener Listener to remove
     */
    removeSessionListener(listener) {
        const index = this.sessionListeners.indexOf(listener);
        if (index !== -1) {
            this.sessionListeners.splice(index, 1);
        }
    }

    /**
     * Notify all listeners that a session has been completed
     * @private
     */
    notifySessionComplete() {
        this.sessionListeners.forEach(listener => {
            if (listener.onSessionComplete) {
                listener.onSessionComplete(this.activeTask, this.currentSession);
            }
        });
    }

    /**
     * Notify all listeners that a task has been started
     * @private
     */
    notifyTaskStarted() {
        this.sessionListeners.forEach(listener => {
            if (listener.onTaskStarted) {
                listener.onTaskStarted(this.activeTask);
            }
        });
    }

    /**
     * Notify all listeners that a task has been paused
     * @private
     */
    notifyTaskPaused() {
        this.sessionListeners.forEach(listener => {
            if (listener.onTaskPaused) {
                listener.onTaskPaused(this.activeTask);
            }
        });
    }

    /**
     * Notify all listeners that a task has been ended
     * @param {Task} task The ended task
     * @private
     */
    notifyTaskEnded(task) {
        this.sessionListeners.forEach(listener => {
            if (listener.onTaskEnded) {
                listener.onTaskEnded(task);
            }
        });
    }

    /**
     * Check if the current session is a focus session
     * @returns {boolean} True if focus session
     */
    isFocusSession() {
        return this.currentSession && this.currentSession.type === SessionType.FOCUS;
    }

    /**
     * Check if the current session is a break session
     * @returns {boolean} True if break session
     */
    isBreakSession() {
        return this.currentSession && this.currentSession.type === SessionType.BREAK;
    }
}