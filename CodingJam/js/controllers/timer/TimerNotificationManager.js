/**
 * TimerNotificationManager.js
 * 
 * Manages timer-related notifications including session start/end,
 * task completion, and break transitions.
 */

/**
 * TimerNotificationManager class for handling timer notifications
 */
export class TimerNotificationManager {
    /**
     * Create a new TimerNotificationManager
     * @param {NotificationService} notificationService Reference to the NotificationService
     */
    constructor(notificationService) {
        this.notificationService = notificationService;
    }

    /**
     * Show a focus session start notification
     * @param {Object} task Task object
     * @param {number} sessionNumber Current session number
     * @returns {boolean} True if notification was shown
     */
    showFocusStartNotification(task, sessionNumber) {
        if (!this.notificationService) return false;
        
        return this.notificationService.showFocusStartNotification(task, sessionNumber);
    }

    /**
     * Show a focus session end notification
     * @param {Object} task Task object
     * @param {number} sessionNumber Completed session number
     * @returns {boolean} True if notification was shown
     */
    showFocusEndNotification(task, sessionNumber) {
        if (!this.notificationService) return false;
        
        return this.notificationService.showFocusEndNotification(task, sessionNumber);
    }

    /**
     * Show a break start notification
     * @param {Object} task Task object
     * @returns {boolean} True if notification was shown
     */
    showBreakStartNotification(task) {
        if (!this.notificationService) return false;
        
        return this.notificationService.showBreakStartNotification(task);
    }

    /**
     * Show a break end notification
     * @param {Object} task Task object
     * @returns {boolean} True if notification was shown
     */
    showBreakEndNotification(task) {
        if (!this.notificationService) return false;
        
        return this.notificationService.showBreakEndNotification(task);
    }

    /**
     * Show a task completion notification
     * @param {Object} task Completed task object
     * @returns {boolean} True if notification was shown
     */
    showTaskCompletedNotification(task) {
        if (!this.notificationService) return false;
        
        return this.notificationService.showTaskCompletedNotification(task);
    }

    /**
     * Show a task reminder notification
     * @param {Object} task Task object
     * @param {number} minutesUntilStart Minutes until task starts
     * @returns {boolean} True if notification was shown
     */
    showTaskReminderNotification(task, minutesUntilStart) {
        if (!this.notificationService) return false;
        
        return this.notificationService.showTaskReminderNotification(task, minutesUntilStart);
    }

    /**
     * Request notification permission
     * @returns {Promise<boolean>} Promise that resolves to true if permission is granted
     */
    async requestNotificationPermission() {
        if (!this.notificationService) {
            return false;
        }
        
        return this.notificationService.requestPermission();
    }

    /**
     * Check if notifications are supported and enabled
     * @returns {boolean} True if notifications are supported and allowed
     */
    areNotificationsEnabled() {
        if (!this.notificationService) {
            return false;
        }
        
        return this.notificationService.areNotificationsEnabled();
    }

    /**
     * Show a generic notification
     * @param {string} title Notification title
     * @param {string} body Notification body
     * @param {string} type Notification type
     * @param {Object} data Additional data
     * @param {boolean} withSound Play sound with notification
     * @returns {boolean} True if notification was shown
     */
    showNotification(title, body, type, data = {}, withSound = true) {
        if (!this.notificationService) {
            console.log(`[Notification] ${title}: ${body}`);
            return false;
        }
        
        return this.notificationService.showNotification(title, body, type, data, withSound);
    }
}