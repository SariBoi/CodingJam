/**
 * RecurringTaskManager.js
 * 
 * Service for managing recurring tasks in the Pomodoro app.
 * Handles creation, scheduling, and management of recurring task instances.
 */

import { TaskController } from '../controllers/TaskController.js';
import { Task } from '../models/Task.js';

/**
 * RecurringTaskManager class for handling recurring tasks
 */
export class RecurringTaskManager {
    /**
     * Create a new RecurringTaskManager
     * @param {TaskController} taskController Reference to the TaskController
     */
    constructor(taskController) {
        this.taskController = taskController;
    }

    /**
     * Schedule recurring task instances for the next week
     * @param {Task} recurringTask The recurring task template
     */
    scheduleRecurringInstances(recurringTask) {
        if (!recurringTask.isRecurring || recurringTask.recurringDays.length === 0) {
            return;
        }
        
        // Get current date and date one week from now
        const today = new Date();
        const oneWeekLater = new Date(today);
        oneWeekLater.setDate(today.getDate() + 7);
        
        // Check each day in the next week
        for (let d = new Date(today); d <= oneWeekLater; d.setDate(d.getDate() + 1)) {
            const dayOfWeek = d.getDay(); // 0 = Sunday, 6 = Saturday
            
            // Check if this task recurs on this day of the week
            if (recurringTask.recurringDays.includes(dayOfWeek)) {
                const dateString = d.toISOString().split('T')[0];
                
                // Check if we already have an instance for this date
                const existingInstance = this.taskController.getAllTasks().find(task => 
                    task.startDate === dateString && 
                    task.name === recurringTask.name &&
                    task.isRecurringInstance
                );
                
                // If no instance exists, create one
                if (!existingInstance) {
                    this.createInstanceForDate(recurringTask, dateString);
                }
            }
        }
    }

    /**
     * Create a task instance for a specific date
     * @param {Task} recurringTask The recurring task template
     * @param {string} dateString Target date in YYYY-MM-DD format
     * @returns {Task|null} Created task instance or null if failed
     */
    createInstanceForDate(recurringTask, dateString) {
        // Skip if already created
        const existingTask = this.taskController.getAllTasks().find(task => 
            task.startDate === dateString && 
            task.name === recurringTask.name &&
            task.isRecurringInstance
        );
        
        if (existingTask) {
            return null;
        }
        
        // Create a new task based on the recurring template
        const newTask = {
            ...recurringTask.toObject(),
            id: undefined, // Will be generated
            startDate: dateString,
            isRecurringInstance: true,
            recurringParentId: recurringTask.id,
            status: 'pending',
            progress: {
                completedSessions: 0,
                totalSessions: recurringTask.progress.totalSessions,
                currentSession: 0,
                timeSpent: 0
            }
        };
        
        // Reset session completion statuses
        if (newTask.sessions) {
            newTask.sessions = newTask.sessions.map(session => ({
                ...session,
                id: undefined, // Will be generated
                completed: false
            }));
        }
        
        // Create the task
        return this.taskController.createTask(newTask);
    }

    /**
     * Update all instances of a recurring task
     * @param {string} recurringTaskId The recurring task ID
     * @param {Object} updates Updates to apply to instances
     */
    updateAllInstances(recurringTaskId, updates) {
        // Get all instances of this recurring task
        const instances = this.taskController.getAllTasks().filter(task => 
            task.isRecurringInstance && 
            task.recurringParentId === recurringTaskId
        );
        
        // Update each instance
        instances.forEach(instance => {
            // Only update future instances
            const instanceDate = new Date(instance.startDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (instanceDate >= today) {
                // Only update certain properties
                const safeUpdates = {
                    name: updates.name,
                    priority: updates.priority,
                    reminderTime: updates.reminderTime,
                    timerSettings: updates.timerSettings,
                    estimatedDuration: updates.estimatedDuration
                };
                
                // Don't update date-related properties
                this.taskController.updateTask(instance.id, safeUpdates);
            }
        });
    }

    /**
     * Delete all future instances of a recurring task
     * @param {string} recurringTaskId The recurring task ID
     */
    deleteAllFutureInstances(recurringTaskId) {
        // Get all instances of this recurring task
        const instances = this.taskController.getAllTasks().filter(task => 
            task.isRecurringInstance && 
            task.recurringParentId === recurringTaskId
        );
        
        // Delete future instances
        instances.forEach(instance => {
            const instanceDate = new Date(instance.startDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (instanceDate >= today) {
                this.taskController.deleteTask(instance.id);
            }
        });
    }

    /**
     * Get the next scheduled instance of a recurring task
     * @param {string} recurringTaskId The recurring task ID
     * @returns {Task|null} Next instance or null if none found
     */
    getNextInstance(recurringTaskId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Get all future instances sorted by date
        const futureInstances = this.taskController.getAllTasks()
            .filter(task => 
                task.isRecurringInstance && 
                task.recurringParentId === recurringTaskId &&
                new Date(task.startDate) >= today
            )
            .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
        
        return futureInstances.length > 0 ? futureInstances[0] : null;
    }

    /**
     * Check and schedule recurring tasks daily
     * Call this once per day or on application startup
     */
    checkAndScheduleRecurringTasks() {
        // Get all recurring tasks (non-instances)
        const recurringTasks = this.taskController.getAllTasks().filter(task => 
            task.isRecurring && !task.isRecurringInstance
        );
        
        // Schedule instances for each recurring task
        recurringTasks.forEach(task => {
            this.scheduleRecurringInstances(task);
        });
    }
}