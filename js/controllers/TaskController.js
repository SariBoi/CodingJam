/**
 * TaskController.js
 * 
 * Controller for managing tasks in the Pomodoro app.
 * Handles CRUD operations, task status changes, and task scheduling.
 */

import { StorageManager } from '../services/StorageManager.js';
import { Task, TaskStatus, TaskPriority, SessionType } from '../models/Task.js';

/**
 * TaskController class for managing tasks
 */
export class TaskController {
    constructor() {
        // Local cache of tasks
        this._tasks = [];
        
        // Load tasks from storage
        this.loadTasks();

        // Add to TaskController.js
        this.pausedTaskStates = new Map(); // Store task ID -> time left mapping
    }

    /**
     * Load tasks from storage
     */
    loadTasks() {
        const storedTasks = StorageManager.getTasks();
        this._tasks = storedTasks.map(taskData => Task.fromObject(taskData));
        
        // Check for missed tasks
        this.checkForMissedTasks();
    }

    /**
     * Save tasks to storage
     * @private
     */
    _saveTasks() {
        const taskObjects = this._tasks.map(task => task.toObject());
        StorageManager.saveTasks(taskObjects);
    }

    /**
     * Check for tasks that should be marked as missed
     */
    checkForMissedTasks() {
        let tasksUpdated = false;
        
        this._tasks.forEach(task => {
            if (task.shouldBeMarkedAsMissed()) {
                task.markAsMissed();
                tasksUpdated = true;
            }
        });
        
        if (tasksUpdated) {
            this._saveTasks();
        }
    }

    /**
     * Get all tasks
     * @returns {Array} Array of Task objects
     */
    getAllTasks() {
        return [...this._tasks];
    }

    /**
     * Get tasks filtered by status
     * @param {string} status Task status to filter by
     * @returns {Array} Filtered array of Task objects
     */
    getTasksByStatus(status) {
        return this._tasks.filter(task => task.status === status);
    }

    /**
     * Get pending tasks (not started yet)
     * @returns {Array} Array of pending Task objects
     */
    getPendingTasks() {
        return this.getTasksByStatus(TaskStatus.PENDING)
            .concat(this.getTasksByStatus(TaskStatus.MISSED))
            .sort((a, b) => {
                // First sort by missed status (missed tasks first)
                if (a.status === TaskStatus.MISSED && b.status !== TaskStatus.MISSED) return -1;
                if (a.status !== TaskStatus.MISSED && b.status === TaskStatus.MISSED) return 1;
                
                // Then sort by start time if available
                if (a.startDate && b.startDate) {
                    const aDate = new Date(`${a.startDate}T${a.startTime || '00:00'}`);
                    const bDate = new Date(`${b.startDate}T${b.startTime || '00:00'}`);
                    return aDate - bDate;
                }
                
                // Then by priority (high to low)
                const priorityOrder = {
                    [TaskPriority.HIGH]: 1,
                    [TaskPriority.MEDIUM]: 2,
                    [TaskPriority.LOW]: 3
                };
                
                if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                }
                
                // Finally by creation date (newest first)
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
    }

    /**
     * Get active and partial tasks
     * @returns {Array} Array of active and partial Task objects
     */
    getActiveAndPartialTasks() {
        return this._tasks.filter(task => 
            task.status === TaskStatus.ONGOING || 
            task.status === TaskStatus.PARTIAL
        );
    }

    /**
     * Get completed tasks
     * @returns {Array} Array of completed Task objects
     */
    getCompletedTasks() {
        return this.getTasksByStatus(TaskStatus.COMPLETED)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    /**
     * Get task by ID
     * @param {string} taskId Task ID
     * @returns {Task|null} Task object or null if not found
     */
    getTaskById(taskId) {
        return this._tasks.find(task => task.id === taskId) || null;
    }

    /**
     * Create a new task
     * @param {Object} taskData Task data
     * @returns {Task} Created Task object
     */
    createTask(taskData) {
        const task = new Task(taskData);
        this._tasks.push(task);
        this._saveTasks();
        
        // If it's a recurring task, schedule it
        if (task.isRecurring) {
            this._scheduleRecurringTask(task);
        }
        
        return task;
    }

    /**
     * Update an existing task
     * @param {string} taskId Task ID
     * @param {Object} taskData Updated task data
     * @returns {Task|null} Updated Task object or null if not found
     */
    updateTask(taskId, taskData) {
    const index = this._tasks.findIndex(task => task.id === taskId);
    
    if (index !== -1) {
        // Get the original task before updating
        const originalTask = this._tasks[index];
        const isOngoing = originalTask.status === TaskStatus.ONGOING;
        
        // Determine what has changed
        const changes = this._detectTaskChanges(originalTask, taskData);
        
        // Create a copy of the taskData to modify
        let updatedTaskData = {
            ...originalTask.toObject(),
            ...taskData
        };
        
        // Keep track of completed sessions before recalculating
        let completedSessions = originalTask.progress.completedSessions;
        
        // Force session recalculation if duration or timer settings changed
        if (changes.durationChanged || changes.timerSettingsChanged) {
            // Remove sessions to force recalculation
            delete updatedTaskData.sessions;
            
            // Store the number of completed sessions to restore after recalculation
            updatedTaskData._completedSessions = completedSessions;
        }
        
        // Create a new task to ensure data integrity
        const updatedTask = new Task(updatedTaskData);
        
        // If the task is ongoing, handle special update cases
        if (isOngoing) {
            this._handleOngoingTaskUpdate(originalTask, updatedTask, changes);
        }
        
        this._tasks[index] = updatedTask;
        this._saveTasks();
        
        // Update recurring schedule if needed
        if (updatedTask.isRecurring) {
            this._scheduleRecurringTask(updatedTask);
        }
        
        // If it's the active task, update it in the timer controller
        if (window.app && window.app.timerController && 
            window.app.timerController.activeTask && 
            window.app.timerController.activeTask.id === taskId) {
            window.app.timerController.handleTaskUpdate(updatedTask, changes);
        }
        
        return updatedTask;
    }
    
    return null;
}


    /**
     * Delete a task
     * @param {string} taskId Task ID
     * @returns {boolean} True if task was deleted
     */
    deleteTask(taskId) {
        const initialLength = this._tasks.length;
        this._tasks = this._tasks.filter(task => task.id !== taskId);
        
        if (this._tasks.length !== initialLength) {
            this._saveTasks();
            return true;
        }
        
        return false;
    }

    /**
     * Start a task
     * @param {string} taskId Task ID
     * @returns {Task|null} Updated Task object or null if not found
     */
    startTask(taskId) {
        const task = this.getTaskById(taskId);
        
        if (task) {
            // First, pause any ongoing tasks
            this._pauseAllOngoingTasks();
            
            // Then start this task
            task.start();
            this._saveTasks();
            return task;
        }
        
        return null;
    }

    /**
     * Pause a task
     * @param {string} taskId Task ID
     * @returns {Task|null} Updated Task object or null if not found
     */
    // When pausing a task
    pauseTask(taskId) {
        const task = this.getTaskById(taskId);
        if (task && task.status === TaskStatus.ONGOING) {
            // Store current time left
            this.pausedTaskStates.set(taskId, {
                timeLeft: currentTimeLeft,
                sessionIndex: task.progress.currentSession
            });
            task.pause();
            this._saveTasks();
            return task;
        }
        return null;
    }

    storePausedTaskState(taskId, timeLeft, sessionIndex) {
    console.log(`Storing paused state for task ${taskId}: ${timeLeft} seconds left, session ${sessionIndex}`);
        
        // Store the paused state
        this.pausedTaskStates.set(taskId, {
            timeLeft: timeLeft,
            sessionIndex: sessionIndex
        });
    }


    /**
     * Complete the current session of a task
     * @param {string} taskId Task ID
     * @returns {Task|null} Updated Task object or null if not found
     */
    completeTaskSession(taskId) {
        const task = this.getTaskById(taskId);
        
        if (task) {
            task.completeCurrentSession();
            this._saveTasks();
            return task;
        }
        
        return null;
    }

    /**
     * Mark a task as completed
     * @param {string} taskId Task ID
     * @returns {Task|null} Updated Task object or null if not found
     */
    completeTask(taskId) {
        const task = this.getTaskById(taskId);
        
        if (task) {
            task.status = TaskStatus.COMPLETED;
            this._saveTasks();
            return task;
        }
        
        return null;
    }

    /**
     * Unmark a completed task (return to pending)
     * @param {string} taskId Task ID
     * @returns {Task|null} Updated Task object or null if not found
     */
    unmarkCompletedTask(taskId) {
        const task = this.getTaskById(taskId);
        
        if (task && task.status === TaskStatus.COMPLETED) {
            if (task.endedEarly) {
                // This task was ended early via the "End Task" button
                // Restore it to PARTIAL status (paused) with its progress preserved
                task.status = TaskStatus.PARTIAL;
                
                // Clear the endedEarly flag
                delete task.endedEarly;
                
                // We don't reset progress because we want to maintain where they left off
            } else {
                // This task was completed naturally (all sessions finished)
                // Reset it to PENDING with all progress cleared
                task.status = TaskStatus.PENDING;
                
                // Reset progress
                task.progress.completedSessions = 0;
                task.progress.currentSession = 0;
                task.progress.timeSpent = 0;
                
                // Reset session completion status
                task.sessions.forEach(session => {
                    session.completed = false;
                    delete session.startedAt;
                });
            }
            
            this._saveTasks();
            return task;
        }
        
        return null;
    }

    /**
     * Get tasks scheduled for a specific date
     * @param {Date} date The date to get tasks for
     * @returns {Array} Array of tasks scheduled for the date
     */
    getTasksForDate(date) {
        const dateString = date.toISOString().split('T')[0];
        
        return this._tasks.filter(task => {
            // Task with specific start date
            if (task.startDate === dateString) {
                return true;
            }
            
            // Task with specific due date
            if (task.dueDate === dateString) {
                return true;
            }
            
            // Recurring task that occurs on this day of week
            if (task.isRecurring && task.recurringDays.includes(date.getDay())) {
                return true;
            }
            
            return false;
        });
    }

    /**
     * Get tasks for the current week
     * @param {Date} startOfWeek Start date of the week
     * @returns {Object} Object with dates as keys and task arrays as values
     */
    getTasksForWeek(startOfWeek) {
        const weekTasks = {};
        
        // Create 7 days starting from startOfWeek
        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(date.getDate() + i);
            
            const dateString = date.toISOString().split('T')[0];
            weekTasks[dateString] = this.getTasksForDate(date);
        }
        
        return weekTasks;
    }

    /**
     * Get the next higher priority task that should be started
     * @returns {Task|null} Next highest priority task or null
     */
    getNextHighPriorityTask() {
        const pendingTasks = this.getPendingTasks();
        
        // First, get tasks that are past their start time
        const tasksToStart = pendingTasks.filter(task => 
            task.startDate && task.startTime && task.shouldBeMarkedAsMissed()
        );
        
        if (tasksToStart.length > 0) {
            // Sort by priority and then by scheduled start time
            return tasksToStart.sort((a, b) => {
                // First by priority
                const priorityOrder = {
                    [TaskPriority.HIGH]: 1,
                    [TaskPriority.MEDIUM]: 2,
                    [TaskPriority.LOW]: 3
                };
                
                if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                }
                
                // Then by start time
                const aDate = new Date(`${a.startDate}T${a.startTime || '00:00'}`);
                const bDate = new Date(`${b.startDate}T${b.startTime || '00:00'}`);
                return aDate - bDate;
            })[0];
        }
        
        return null;
    }

    /**
     * Check if there is a higher priority task waiting
     * @param {Task} currentTask The current task
     * @returns {Task|null} Higher priority task or null
     */
    checkForHigherPriorityTask(currentTask) {
        if (!currentTask) return null;
        
        const priorityOrder = {
            [TaskPriority.HIGH]: 1,
            [TaskPriority.MEDIUM]: 2,
            [TaskPriority.LOW]: 3
        };
        
        // Get pending tasks with higher priority
        const higherPriorityTasks = this.getPendingTasks().filter(task => 
            priorityOrder[task.priority] < priorityOrder[currentTask.priority]
        );
        
        return higherPriorityTasks.length > 0 ? higherPriorityTasks[0] : null;
    }


        
    /**
     * Detect what has changed between originalTask and taskData
     * @private
     */
    _detectTaskChanges(originalTask, taskData) {
        const changes = {
            nameChanged: false,
            durationChanged: false,
            timerSettingsChanged: false,
            otherFieldsChanged: false
        };
        
        // Check if name changed
        if (taskData.name && taskData.name !== originalTask.name) {
            changes.nameChanged = true;
        }
        
        // Check if estimated duration changed
        if (taskData.estimatedDuration && taskData.estimatedDuration !== originalTask.estimatedDuration) {
            changes.durationChanged = true;
        }
        
        // Check if timer settings changed
        if (taskData.timerSettings) {
            const originalSettings = originalTask.timerSettings;
            const newSettings = taskData.timerSettings;
            
            if (newSettings.focusDuration !== originalSettings.focusDuration ||
                newSettings.breakDuration !== originalSettings.breakDuration ||
                newSettings.useCustomTimer !== originalSettings.useCustomTimer) {
                changes.timerSettingsChanged = true;
            }
        }
        
        // Check other fields for completeness
        const keysToIgnore = ['name', 'estimatedDuration', 'timerSettings', 'id', 'createdAt', 'status', 'sessions', 'progress'];
        for (const key in taskData) {
            if (!keysToIgnore.includes(key) && JSON.stringify(taskData[key]) !== JSON.stringify(originalTask[key])) {
                changes.otherFieldsChanged = true;
                break;
            }
        }
        
        return changes;
    }

    /**
     * Handle updating an ongoing task based on what changed
     * @private
     */
    _handleOngoingTaskUpdate(originalTask, updatedTask, changes) {
        // If duration changed or timer settings changed, we need to handle session count correctly
        if (changes.durationChanged || changes.timerSettingsChanged) {
            // Get the new total sessions count (only focus sessions count for progress)
            const focusSessions = updatedTask.sessions.filter(s => s.type === SessionType.FOCUS);
            updatedTask.progress.totalSessions = focusSessions.length;
            
            // Retrieve the original completed sessions
            const originalCompletedSessions = updatedTask._completedSessions !== undefined ? 
                updatedTask._completedSessions : originalTask.progress.completedSessions;
                
            // Keep the ABSOLUTE number of completed sessions the same (not the ratio)
            // But ensure we don't exceed the new total
            updatedTask.progress.completedSessions = Math.min(
                originalCompletedSessions,
                updatedTask.progress.totalSessions
            );
            
            // Mark appropriate sessions as completed
            let completedFocusSessions = 0;
            for (let i = 0; i < updatedTask.sessions.length; i++) {
                const session = updatedTask.sessions[i];
                if (session.type === SessionType.FOCUS) {
                    if (completedFocusSessions < updatedTask.progress.completedSessions) {
                        session.completed = true;
                        completedFocusSessions++;
                    } else {
                        session.completed = false;
                    }
                } else if (i > 0 && updatedTask.sessions[i-1].completed) {
                    // Mark break sessions as completed if previous focus session is completed
                    session.completed = true;
                } else {
                    session.completed = false;
                }
            }
            
            // Set current session to the first uncompleted session
            updatedTask.progress.currentSession = 0;
            for (let i = 0; i < updatedTask.sessions.length; i++) {
                if (!updatedTask.sessions[i].completed) {
                    updatedTask.progress.currentSession = i;
                    break;
                }
            }
            
            // Clean up temporary property
            if (updatedTask._completedSessions !== undefined) {
                delete updatedTask._completedSessions;
            }
        } else {
            // If no duration or timer settings changes, just preserve the current session
            updatedTask.progress.currentSession = originalTask.progress.currentSession;
            updatedTask.progress.completedSessions = originalTask.progress.completedSessions;
            
            // Keep the completed status of sessions
            for (let i = 0; i < Math.min(updatedTask.sessions.length, originalTask.sessions.length); i++) {
                updatedTask.sessions[i].completed = originalTask.sessions[i].completed;
            }
            
            // If the current session exists in both tasks, preserve its state
            if (originalTask.progress.currentSession < originalTask.sessions.length &&
                originalTask.progress.currentSession < updatedTask.sessions.length) {
                updatedTask.sessions[originalTask.progress.currentSession].startedAt = 
                    originalTask.sessions[originalTask.progress.currentSession].startedAt;
            }
        }
        
        // Make sure to keep the ongoing status
        updatedTask.status = TaskStatus.ONGOING;
    }


    /**
     * Pause all ongoing tasks
     * @private
     */
    _pauseAllOngoingTasks() {
        let tasksUpdated = false;
        
        this._tasks.forEach(task => {
            if (task.status === TaskStatus.ONGOING) {
                task.pause();
                tasksUpdated = true;
            }
        });
        
        if (tasksUpdated) {
            this._saveTasks();
        }
    }

    /**
     * Schedule recurring instances of a task
     * @param {Task} task The recurring task
     * @private
     */
    _scheduleRecurringTask(task) {
        if (!task.isRecurring || task.recurringDays.length === 0) {
            return;
        }
        
        // Check if we have any instances of this task already created
        // for the next week and create them if needed
        const today = new Date();
        const endDate = new Date();
        endDate.setDate(today.getDate() + 7); // Look ahead 1 week
        
        for (let d = new Date(today); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dayOfWeek = d.getDay(); // 0 = Sunday, 6 = Saturday
            
            // Check if this task recurs on this day of the week
            if (task.recurringDays.includes(dayOfWeek)) {
                const dateString = d.toISOString().split('T')[0];
                
                // Check if we already have an instance for this date
                const existingInstance = this._tasks.find(t => 
                    t.startDate === dateString && 
                    t.name === task.name &&
                    t.estimatedDuration === task.estimatedDuration
                );
                
                // If no instance exists, create one
                if (!existingInstance) {
                    const newInstance = task.createRecurringInstance(dateString);
                    this._tasks.push(newInstance);
                }
            }
        }
        
        // Save after creating instances
        this._saveTasks();
    }
}