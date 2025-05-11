/**
 * ReminderService.js
 * 
 * Service for scheduling and managing task reminders.
 * Checks for upcoming tasks and schedules notifications.
 */

import { TaskStatus } from '../models/Task.js';
import { NotificationType } from './NotificationService.js';

/**
 * ReminderService class for managing task reminders
 */
export class ReminderService {
    /**
     * Create a new ReminderService
     * @param {TaskController} taskController Reference to the TaskController
     * @param {NotificationService} notificationService Reference to the NotificationService
     */
    constructor(taskController, notificationService) {
        this.taskController = taskController;
        this.notificationService = notificationService;
        
        // Map of scheduled reminder IDs by task ID
        this.scheduledReminders = new Map();
        
        // Start the reminder check interval
        this.startReminderCheck();
    }

    /**
     * Start the regular reminder check interval
     */
    startReminderCheck() {
        // Check for upcoming tasks every minute
        this.checkInterval = setInterval(() => {
            this.checkForUpcomingTasks();
        }, 60000); // 60 seconds
        
        // Also check immediately on startup
        setTimeout(() => {
            this.checkForUpcomingTasks();
        }, 5000); // 5 seconds after startup
    }

    /**
     * Stop the reminder check interval
     */
    stopReminderCheck() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    /**
     * Check for upcoming tasks and schedule reminders
     */
    checkForUpcomingTasks() {
        // Get all pending tasks
        const pendingTasks = this.taskController.getPendingTasks();
        
        // Current time
        const now = new Date();
        
        // Process each task
        pendingTasks.forEach(task => {
            // Skip tasks without start date/time
            if (!task.startDate || !task.startTime) {
                return;
            }
            
            // Skip tasks that already have a scheduled reminder
            if (this.scheduledReminders.has(task.id)) {
                return;
            }
            
            // Calculate task start time
            const startDateTime = new Date(`${task.startDate}T${task.startTime}`);
            
            // Skip tasks that have already started or are more than 24 hours away
            const timeDiff = startDateTime - now;
            if (timeDiff <= 0 || timeDiff > 24 * 60 * 60 * 1000) {
                return;
            }
            
            // Get the reminder time (minutes before start)
            const reminderTime = task.reminderTime || 60; // Default to 1 hour
            
            // Calculate when to show the reminder
            const reminderDateTime = new Date(startDateTime);
            reminderDateTime.setMinutes(reminderDateTime.getMinutes() - reminderTime);
            
            // Skip if reminder time has already passed
            if (reminderDateTime <= now) {
                return;
            }
            
            // Schedule the reminder
            this.scheduleTaskReminder(task, reminderDateTime, reminderTime);
        });
        
        // Check for tasks that should be marked as missed
        this.checkForMissedTasks();
    }

    /**
     * Schedule a reminder for a task
     * @param {Object} task Task object
     * @param {Date} reminderTime Time to show the reminder
     * @param {number} minutesUntilStart Minutes until the task starts
     */
    scheduleTaskReminder(task, reminderTime, minutesUntilStart) {
        // Skip if the notification service is not available
        if (!this.notificationService) {
            return;
        }
        
        // Schedule the notification
        const reminderId = this.notificationService.scheduleNotification(
            'Task Reminder',
            `"${task.name}" starts in ${minutesUntilStart === 60 ? '1 hour' : minutesUntilStart + ' minutes'}`,
            reminderTime,
            NotificationType.TASK_REMINDER,
            { taskId: task.id, minutesUntilStart }
        );
        
        // Store the reminder ID
        if (reminderId) {
            this.scheduledReminders.set(task.id, reminderId);
        }
    }

    /**
     * Cancel a scheduled reminder for a task
     * @param {string} taskId Task ID
     * @returns {boolean} True if a reminder was cancelled
     */
    cancelTaskReminder(taskId) {
        // Get the reminder ID
        const reminderId = this.scheduledReminders.get(taskId);
        
        if (reminderId && this.notificationService) {
            // Cancel the notification
            const cancelled = this.notificationService.cancelScheduledNotification(reminderId);
            
            // Remove from the map
            if (cancelled) {
                this.scheduledReminders.delete(taskId);
            }
            
            return cancelled;
        }
        
        return false;
    }

    /**
     * Cancel all scheduled reminders
     */
    cancelAllReminders() {
        if (!this.notificationService) {
            return;
        }
        
        // Cancel each reminder
        for (const [taskId, reminderId] of this.scheduledReminders) {
            this.notificationService.cancelScheduledNotification(reminderId);
        }
        
        // Clear the map
        this.scheduledReminders.clear();
    }

    /**
     * Check for tasks that should be marked as missed
     */
    checkForMissedTasks() {
        // Get all pending tasks
        const pendingTasks = this.taskController.getPendingTasks();
        
        // Check each task
        pendingTasks.forEach(task => {
            if (task.status === TaskStatus.PENDING && task.shouldBeMarkedAsMissed()) {
                // Mark as missed
                task.markAsMissed();
                
                // Update the task
                this.taskController.updateTask(task.id, task);
                
                // Show a notification
                if (this.notificationService) {
                    this.notificationService.showTaskMissedNotification(task);
                }
                
                // Cancel any scheduled reminder
                this.cancelTaskReminder(task.id);
            }
        });
    }

    /**
     * Check for higher priority tasks
     * @param {Object} currentTask The task being worked on
     * @returns {Object|null} Higher priority task or null
     */
    checkForHigherPriorityTask(currentTask) {
        if (!currentTask) {
            return null;
        }
        
        const higherPriorityTask = this.taskController.checkForHigherPriorityTask(currentTask);
        
        if (higherPriorityTask && this.notificationService) {
            // Show a notification about the higher priority task
            this.notificationService.showPriorityAlertNotification(higherPriorityTask);
        }
        
        return higherPriorityTask;
    }
}