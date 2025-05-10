/**
 * StorageManager.js
 * 
 * A service that handles all localStorage operations for the Pomodoro app.
 * Provides methods to store and retrieve tasks, settings, and other app data.
 */

// Storage keys
const STORAGE_KEYS = {
    TASKS: 'pomodoro_tasks',
    SETTINGS: 'pomodoro_settings',
    ANALYTICS: 'pomodoro_analytics',
    NOTIFICATION_HISTORY: 'pomodoro_notifications'
};

// Default app settings
const DEFAULT_SETTINGS = {
    theme: 'dark',
    focusDuration: 25,
    breakDuration: 5,
    defaultReminderTime: 60, // minutes before task start
    activeHours: {
        start: '8:00',
        end: '20:00'
    }
};

/**
 * StorageManager class for handling localStorage operations
 */
export class StorageManager {
    /**
     * Check if localStorage is available
     * @returns {boolean} True if localStorage is available
     */
    static isAvailable() {
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, testKey);
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Get all tasks from storage
     * @returns {Array} Array of task objects, or empty array if none found
     */
    static getTasks() {
        try {
            const tasksJson = localStorage.getItem(STORAGE_KEYS.TASKS);
            return tasksJson ? JSON.parse(tasksJson) : [];
        } catch (error) {
            console.error('Error retrieving tasks from storage:', error);
            return [];
        }
    }

    /**
     * Save tasks to storage
     * @param {Array} tasks Array of task objects
     * @returns {boolean} True if successful
     */
    static saveTasks(tasks) {
        try {
            localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
            return true;
        } catch (error) {
            console.error('Error saving tasks to storage:', error);
            
            // Handle storage quota exceeded error
            if (error instanceof DOMException && error.code === 22) {
                alert('Storage full. Please export your data to continue using the app.');
            }
            
            return false;
        }
    }

    /**
     * Get a task by ID
     * @param {string} taskId The task ID to find
     * @returns {Object|null} The task object or null if not found
     */
    static getTaskById(taskId) {
        const tasks = this.getTasks();
        return tasks.find(task => task.id === taskId) || null;
    }

    /**
     * Add a new task to storage
     * @param {Object} task The task object to add
     * @returns {boolean} True if successful
     */
    static addTask(task) {
        const tasks = this.getTasks();
        tasks.push(task);
        return this.saveTasks(tasks);
    }

    /**
     * Update an existing task
     * @param {Object} updatedTask The updated task object
     * @returns {boolean} True if successful
     */
    static updateTask(updatedTask) {
        const tasks = this.getTasks();
        const index = tasks.findIndex(task => task.id === updatedTask.id);
        
        if (index !== -1) {
            tasks[index] = updatedTask;
            return this.saveTasks(tasks);
        }
        
        return false;
    }

    /**
     * Delete a task by ID
     * @param {string} taskId The ID of the task to delete
     * @returns {boolean} True if successful
     */
    static deleteTask(taskId) {
        const tasks = this.getTasks();
        const filteredTasks = tasks.filter(task => task.id !== taskId);
        
        if (filteredTasks.length !== tasks.length) {
            return this.saveTasks(filteredTasks);
        }
        
        return false;
    }

    /**
     * Get app settings from storage
     * @returns {Object} Settings object or default settings if none found
     */
    static getSettings() {
        try {
            const settingsJson = localStorage.getItem(STORAGE_KEYS.SETTINGS);
            const savedSettings = settingsJson ? JSON.parse(settingsJson) : {};
            
            // Merge with default settings to ensure all properties exist
            return { ...DEFAULT_SETTINGS, ...savedSettings };
        } catch (error) {
            console.error('Error retrieving settings from storage:', error);
            return { ...DEFAULT_SETTINGS };
        }
    }

    /**
     * Save app settings to storage
     * @param {Object} settings Settings object
     * @returns {boolean} True if successful
     */
    static saveSettings(settings) {
        try {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('Error saving settings to storage:', error);
            return false;
        }
    }

    /**
     * Get analytics data from storage
     * @returns {Object} Analytics data object or empty object if none found
     */
    static getAnalytics() {
        try {
            const analyticsJson = localStorage.getItem(STORAGE_KEYS.ANALYTICS);
            return analyticsJson ? JSON.parse(analyticsJson) : {
                totalFocusTime: 0,
                totalBreakTime: 0,
                completedTasks: 0,
                completedSessions: 0,
                abandonedSessions: 0,
                dailyStats: {},
                weeklyStats: {},
                monthlyStats: {}
            };
        } catch (error) {
            console.error('Error retrieving analytics from storage:', error);
            return {};
        }
    }

    /**
     * Save analytics data to storage
     * @param {Object} analytics Analytics data object
     * @returns {boolean} True if successful
     */
    static saveAnalytics(analytics) {
        try {
            localStorage.setItem(STORAGE_KEYS.ANALYTICS, JSON.stringify(analytics));
            return true;
        } catch (error) {
            console.error('Error saving analytics to storage:', error);
            return false;
        }
    }

    /**
     * Get notification history from storage
     * @returns {Array} Array of notification objects or empty array if none found
     */
    static getNotificationHistory() {
        try {
            const notificationsJson = localStorage.getItem(STORAGE_KEYS.NOTIFICATION_HISTORY);
            return notificationsJson ? JSON.parse(notificationsJson) : [];
        } catch (error) {
            console.error('Error retrieving notification history from storage:', error);
            return [];
        }
    }

    /**
     * Save notification history to storage
     * @param {Array} notifications Array of notification objects
     * @returns {boolean} True if successful
     */
    static saveNotificationHistory(notifications) {
        try {
            localStorage.setItem(STORAGE_KEYS.NOTIFICATION_HISTORY, JSON.stringify(notifications));
            return true;
        } catch (error) {
            console.error('Error saving notification history to storage:', error);
            return false;
        }
    }

    /**
     * Add a notification to history
     * @param {Object} notification The notification object to add
     * @returns {boolean} True if successful
     */
    static addNotification(notification) {
        const notifications = this.getNotificationHistory();
        notifications.push({
            ...notification,
            timestamp: new Date().toISOString()
        });
        
        // Keep only the last 50 notifications to prevent storage overflow
        const trimmedNotifications = notifications.slice(-50);
        return this.saveNotificationHistory(trimmedNotifications);
    }

    /**
     * Clear all notifications from history
     * @returns {boolean} True if successful
     */
    static clearNotificationHistory() {
        return this.saveNotificationHistory([]);
    }

    /**
     * Export all app data as a JSON string
     * @returns {string} JSON string with all app data
     */
    static exportData() {
        const exportData = {
            tasks: this.getTasks(),
            settings: this.getSettings(),
            analytics: this.getAnalytics(),
            notifications: this.getNotificationHistory(),
            exportDate: new Date().toISOString()
        };
        
        return JSON.stringify(exportData);
    }

    /**
     * Import app data from a JSON string
     * @param {string} jsonData JSON string with app data
     * @returns {boolean} True if successful
     */
    static importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            // Validate data structure
            if (!data.tasks || !Array.isArray(data.tasks)) {
                throw new Error('Invalid tasks data');
            }
            
            // Import each data category
            this.saveTasks(data.tasks);
            
            if (data.settings) {
                this.saveSettings(data.settings);
            }
            
            if (data.analytics) {
                this.saveAnalytics(data.analytics);
            }
            
            if (data.notifications && Array.isArray(data.notifications)) {
                this.saveNotificationHistory(data.notifications);
            }
            
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    /**
     * Calculate the approximate storage usage
     * @returns {number} Approximate storage usage in bytes
     */
    static getStorageUsage() {
        let totalSize = 0;
        
        for (const key in STORAGE_KEYS) {
            const data = localStorage.getItem(STORAGE_KEYS[key]) || '';
            totalSize += data.length * 2; // Approximate size in bytes (2 bytes per character)
        }
        
        return totalSize;
    }

    /**
     * Clear all app data from storage
     * @returns {boolean} True if successful
     */
    static clearAllData() {
        try {
            for (const key in STORAGE_KEYS) {
                localStorage.removeItem(STORAGE_KEYS[key]);
            }
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            return false;
        }
    }
}

// Export storage keys as well for use in other modules
export { STORAGE_KEYS, DEFAULT_SETTINGS };