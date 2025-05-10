/**
 * NotificationService.js
 * 
 * Service for managing browser notifications in the Pomodoro app.
 * Handles notification permissions, sending notifications, and notification history.
 */

import { StorageManager } from './StorageManager.js';

/**
 * NotificationType enum defines the types of notifications
 */
export const NotificationType = {
    SESSION_START: 'session_start',
    SESSION_END: 'session_end',
    TASK_REMINDER: 'task_reminder',
    TASK_COMPLETED: 'task_completed',
    TASK_MISSED: 'task_missed',
    PRIORITY_ALERT: 'priority_alert'
};

/**
 * NotificationService class for managing notifications
 */
export class NotificationService {
    /**
     * Create a new NotificationService
     */
    constructor() {
        // Check if Notification API is supported
        this.isSupported = 'Notification' in window;
        
        // Get current permission status
        this.permissionStatus = this.isSupported ? Notification.permission : 'denied';
        
        // Notification sound effects
        this.sounds = {
            focusStart: new Audio('../assets/sounds/focus-start.mp3'),
            focusEnd: new Audio('../assets/sounds/timer-end.mp3'),
            breakStart: new Audio('../assets/sounds/break-start.mp3'),
            breakEnd: new Audio('../assets/sounds/break-end.mp3'),
            taskComplete: new Audio('../assets/sounds/task-complete.mp3'),
            reminder: new Audio('../assets/sounds/reminder.mp3')
        };
        
        // Request permission on initialization if not already granted/denied
        if (this.isSupported && this.permissionStatus === 'default') {
            this.requestPermission();
        }
    }

    /**
     * Request notification permission from the user
     * @returns {Promise<boolean>} True if permission granted
     */
    async requestPermission() {
        if (!this.isSupported) {
            return false;
        }
        
        try {
            const permission = await Notification.requestPermission();
            this.permissionStatus = permission;
            return permission === 'granted';
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        }
    }

    /**
     * Check if notifications are currently enabled
     * @returns {boolean} True if notifications are enabled and allowed
     */
    areNotificationsEnabled() {
        // Check if notifications are supported and permission is granted
        const basicCheck = this.isSupported && this.permissionStatus === 'granted';
        
        if (!basicCheck) {
            return false;
        }
        
        // Check if notifications are enabled in settings
        const settings = StorageManager.getSettings();
        return settings.notifications?.enabled !== false;
    }

    /**
     * Show a notification with the given details
     * @param {string} title Notification title
     * @param {string} body Notification body text
     * @param {string} type Notification type (from NotificationType enum)
     * @param {Object} data Additional notification data
     * @param {boolean} withSound Whether to play a sound with the notification
     * @returns {boolean} True if notification was shown
     */
    showNotification(title, body, type, data = {}, withSound = true) {
        // Check if notifications are enabled
        if (!this.areNotificationsEnabled()) {
            console.log(`Notification suppressed (disabled): ${title}`);
            return false;
        }
        
        // Check settings for this specific notification type
        const settings = StorageManager.getSettings();
        
        // Skip if this notification type is disabled
        if (settings.notifications && 
            type in settings.notifications && 
            settings.notifications[type] === false) {
            console.log(`Notification suppressed (type disabled): ${title}`);
            return false;
        }
        
        try {
            // Create and show the notification
            const notification = new Notification(title, {
                body: body,
                icon: '/assets/icons/favicon.ico',
                tag: type, // For grouping similar notifications
                requireInteraction: type === NotificationType.TASK_REMINDER // Keep task reminders visible until dismissed
            });
            
            // Handle notification click
            notification.onclick = () => {
                // Focus the window
                window.focus();
                
                // Handle specific actions based on notification type
                if (data.taskId && (
                    type === NotificationType.SESSION_START || 
                    type === NotificationType.TASK_REMINDER
                )) {
                    // Start the task if applicable
                    if (window.app) {
                        window.app.startTask(data.taskId);
                    }
                }
                
                notification.close();
            };
            
            // Auto-close most notifications after 5 seconds
            if (type !== NotificationType.TASK_REMINDER) {
                setTimeout(() => notification.close(), 5000);
            }
            
            // Play sound if enabled
            if (withSound && settings.notifications?.sound !== false) {
                this.playSound(type);
            }
            
            // Add to notification history
            this.addToHistory(title, body, type, data);
            
            return true;
        } catch (error) {
            console.error('Error showing notification:', error);
            return false;
        }
    }

    /**
     * Play a sound based on notification type
     * @param {string} type Notification type
     */
    playSound(type) {
        let sound;
        
        // Select the appropriate sound based on notification type
        switch (type) {
            case NotificationType.SESSION_START:
                sound = this.sounds.focusStart;
                break;
            case NotificationType.SESSION_END:
                sound = this.sounds.focusEnd;
                break;
            case NotificationType.TASK_COMPLETED:
                sound = this.sounds.taskComplete;
                break;
            case NotificationType.TASK_REMINDER:
                sound = this.sounds.reminder;
                break;
            default:
                // Default sound for other notification types
                sound = this.sounds.reminder;
                break;
        }
        
        // Play the sound
        if (sound) {
            sound.play().catch(e => {
                // Silent failure - sound may fail if user hasn't interacted with the page
                console.warn('Sound could not be played:', e);
            });
        }
    }

    /**
     * Add a notification to the history
     * @param {string} title Notification title
     * @param {string} body Notification body text
     * @param {string} type Notification type
     * @param {Object} data Additional notification data
     */
    addToHistory(title, body, type, data) {
        const notification = {
            title,
            body,
            type,
            data,
            timestamp: new Date().toISOString()
        };
        
        StorageManager.addNotification(notification);
    }

    /**
     * Get notification history
     * @param {number} limit Maximum number of notifications to return
     * @returns {Array} Array of notification objects
     */
    getHistory(limit = 20) {
        const history = StorageManager.getNotificationHistory();
        
        // Sort by timestamp (newest first) and limit the result
        return history
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }

    /**
     * Clear notification history
     */
    clearHistory() {
        StorageManager.clearNotificationHistory();
    }

    /**
     * Schedule a notification for a specific time
     * @param {string} title Notification title
     * @param {string} body Notification body text
     * @param {Date} time Time to show the notification
     * @param {string} type Notification type
     * @param {Object} data Additional notification data
     * @returns {string} Schedule ID (for cancellation)
     */
    scheduleNotification(title, body, time, type, data = {}) {
        const now = new Date();
        const delay = time - now;
        
        // If time is in the past, return without scheduling
        if (delay <= 0) {
            return null;
        }
        
        // Generate a unique ID for this scheduled notification
        const scheduleId = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Store the timeout ID so it can be cancelled
        const timeoutId = setTimeout(() => {
            this.showNotification(title, body, type, data);
        }, delay);
        
        // Store in localStorage for tracking
        const scheduledNotifications = this.getScheduledNotifications();
        scheduledNotifications.push({
            id: scheduleId,
            title,
            body,
            type,
            data,
            scheduledTime: time.toISOString()
        });
        
        localStorage.setItem('scheduled_notifications', JSON.stringify(scheduledNotifications));
        
        // Store the timeout ID in memory (will be lost on page refresh)
        this._scheduledTimeouts = this._scheduledTimeouts || {};
        this._scheduledTimeouts[scheduleId] = timeoutId;
        
        return scheduleId;
    }

    /**
     * Cancel a scheduled notification
     * @param {string} scheduleId Schedule ID
     * @returns {boolean} True if notification was cancelled
     */
    cancelScheduledNotification(scheduleId) {
        // Clear the timeout if it exists in memory
        if (this._scheduledTimeouts && this._scheduledTimeouts[scheduleId]) {
            clearTimeout(this._scheduledTimeouts[scheduleId]);
            delete this._scheduledTimeouts[scheduleId];
        }
        
        // Remove from localStorage
        const scheduledNotifications = this.getScheduledNotifications();
        const updatedNotifications = scheduledNotifications.filter(n => n.id !== scheduleId);
        
        localStorage.setItem('scheduled_notifications', JSON.stringify(updatedNotifications));
        
        return scheduledNotifications.length !== updatedNotifications.length;
    }

    /**
     * Get all scheduled notifications
     * @returns {Array} Array of scheduled notification objects
     */
    getScheduledNotifications() {
        try {
            const stored = localStorage.getItem('scheduled_notifications');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error retrieving scheduled notifications:', error);
            return [];
        }
    }

    /**
     * Reschedule all pending notifications (useful after page refresh)
     */
    rescheduleNotifications() {
        const scheduledNotifications = this.getScheduledNotifications();
        const now = new Date();
        
        // Clear existing scheduled_notifications data
        localStorage.setItem('scheduled_notifications', JSON.stringify([]));
        
        // Reschedule each notification that's still in the future
        scheduledNotifications.forEach(notification => {
            const scheduledTime = new Date(notification.scheduledTime);
            
            if (scheduledTime > now) {
                this.scheduleNotification(
                    notification.title,
                    notification.body,
                    scheduledTime,
                    notification.type,
                    notification.data
                );
            }
        });
    }

    /**
     * Show a focus session start notification
     * @param {Object} task Task object
     * @param {number} sessionNumber Current session number
     * @returns {boolean} True if notification was shown
     */
    showFocusStartNotification(task, sessionNumber) {
        return this.showNotification(
            'Focus Session Started',
            `${task.name} - Session ${sessionNumber} of ${task.progress.totalSessions}`,
            NotificationType.SESSION_START,
            { taskId: task.id, sessionNumber }
        );
    }

    /**
     * Show a focus session end notification
     * @param {Object} task Task object
     * @param {number} sessionNumber Completed session number
     * @returns {boolean} True if notification was shown
     */
    showFocusEndNotification(task, sessionNumber) {
        return this.showNotification(
            'Focus Session Completed',
            `Time for a break! ${task.name} - Session ${sessionNumber} completed`,
            NotificationType.SESSION_END,
            { taskId: task.id, sessionNumber }
        );
    }

    /**
     * Show a break start notification
     * @param {Object} task Task object
     * @returns {boolean} True if notification was shown
     */
    showBreakStartNotification(task) {
        return this.showNotification(
            'Break Time',
            `Take a ${task.timerSettings.breakDuration}-minute break`,
            NotificationType.SESSION_START,
            { taskId: task.id, isBreak: true }
        );
    }

    /**
     * Show a break end notification
     * @param {Object} task Task object
     * @returns {boolean} True if notification was shown
     */
    showBreakEndNotification(task) {
        return this.showNotification(
            'Break Ended',
            `Ready to focus on ${task.name} again?`,
            NotificationType.SESSION_END,
            { taskId: task.id, isBreak: true }
        );
    }

    /**
     * Show a task completion notification
     * @param {Object} task Completed task object
     * @returns {boolean} True if notification was shown
     */
    showTaskCompletedNotification(task) {
        return this.showNotification(
            'Task Completed',
            `You've completed "${task.name}"`,
            NotificationType.TASK_COMPLETED,
            { taskId: task.id }
        );
    }

    /**
     * Show a task reminder notification
     * @param {Object} task Task object
     * @param {number} minutesUntilStart Minutes until the task starts
     * @returns {boolean} True if notification was shown
     */
    showTaskReminderNotification(task, minutesUntilStart) {
        const minutesText = minutesUntilStart === 60 
            ? '1 hour' 
            : `${minutesUntilStart} minutes`;
            
        return this.showNotification(
            'Task Reminder',
            `"${task.name}" starts in ${minutesText}`,
            NotificationType.TASK_REMINDER,
            { taskId: task.id, minutesUntilStart },
            true // With sound
        );
    }

    /**
     * Show a task missed notification
     * @param {Object} task Missed task object
     * @returns {boolean} True if notification was shown
     */
    showTaskMissedNotification(task) {
        return this.showNotification(
            'Task Missed',
            `You missed the scheduled start time for "${task.name}"`,
            NotificationType.TASK_MISSED,
            { taskId: task.id }
        );
    }

    /**
     * Show a higher priority task notification
     * @param {Object} highPriorityTask Higher priority task
     * @returns {boolean} True if notification was shown
     */
    showPriorityAlertNotification(highPriorityTask) {
        return this.showNotification(
            'Higher Priority Task',
            `"${highPriorityTask.name}" has higher priority and should be worked on first`,
            NotificationType.PRIORITY_ALERT,
            { taskId: highPriorityTask.id }
        );
    }
}