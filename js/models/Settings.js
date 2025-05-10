/**
 * Settings.js
 * 
 * Defines the Settings class which manages user preferences for the Pomodoro app.
 */

import { DEFAULT_SETTINGS } from '../services/StorageManager.js';

/**
 * Settings class for managing user preferences
 */
export class Settings {
    /**
     * Create a new Settings instance
     * @param {Object} settingsData Settings data object
     */
    constructor(settingsData = {}) {
        // Theme settings
        this.theme = settingsData.theme || DEFAULT_SETTINGS.theme;
        
        // Timer default durations
        this.focusDuration = settingsData.focusDuration || DEFAULT_SETTINGS.focusDuration;
        this.breakDuration = settingsData.breakDuration || DEFAULT_SETTINGS.breakDuration;
        
        // Active hours (when the user is typically active)
        this.activeHours = {
            start: settingsData.activeHours?.start || DEFAULT_SETTINGS.activeHours.start,
            end: settingsData.activeHours?.end || DEFAULT_SETTINGS.activeHours.end
        };
        
        // Default reminder time (in minutes before task start)
        this.defaultReminderTime = settingsData.defaultReminderTime || DEFAULT_SETTINGS.defaultReminderTime;
        
        // Notification settings
        this.notifications = {
            enabled: settingsData.notifications?.enabled !== undefined ? 
                settingsData.notifications.enabled : true,
            sound: settingsData.notifications?.sound !== undefined ?
                settingsData.notifications.sound : true,
            taskStart: settingsData.notifications?.taskStart !== undefined ?
                settingsData.notifications.taskStart : true,
            sessionEnd: settingsData.notifications?.sessionEnd !== undefined ?
                settingsData.notifications.sessionEnd : true,
            breakEnd: settingsData.notifications?.breakEnd !== undefined ?
                settingsData.notifications.breakEnd : true,
            taskComplete: settingsData.notifications?.taskComplete !== undefined ?
                settingsData.notifications.taskComplete : true,
            reminderTime: settingsData.notifications?.reminderTime !== undefined ?
                settingsData.notifications.reminderTime : true
        };
        
        // Timer presets for quick selection
        this.timerPresets = settingsData.timerPresets || [
            { name: 'Default', focusDuration: 25, breakDuration: 5 },
            { name: 'Short', focusDuration: 15, breakDuration: 3 },
            { name: 'Long', focusDuration: 50, breakDuration: 10 }
        ];
        
        // Calendar view settings
        this.calendarView = settingsData.calendarView || 'daily';
        
        // Auto-start next session
        this.autoStartNextSession = settingsData.autoStartNextSession !== undefined ?
            settingsData.autoStartNextSession : false;
        
        // Auto-pause on inactive tab
        this.autoPauseOnInactiveTab = settingsData.autoPauseOnInactiveTab !== undefined ?
            settingsData.autoPauseOnInactiveTab : true;
    }

    /**
     * Apply theme to the document
     */
    applyTheme() {
        const themeCssLink = document.getElementById('theme-css');
        
        if (themeCssLink) {
            themeCssLink.href = `css/themes/${this.theme}.css`;
        }
        
        // Add theme class to body
        document.body.classList.remove('light-theme', 'dark-theme');
        document.body.classList.add(`${this.theme}-theme`);
    }

    /**
     * Get active hours as Date objects
     * @returns {Object} Object with start and end Date objects
     */
    getActiveHoursAsDate() {
        const today = new Date();
        const [startHours, startMinutes] = this.activeHours.start.split(':').map(Number);
        const [endHours, endMinutes] = this.activeHours.end.split(':').map(Number);
        
        const startDate = new Date(today);
        startDate.setHours(startHours, startMinutes, 0, 0);
        
        const endDate = new Date(today);
        endDate.setHours(endHours, endMinutes, 0, 0);
        
        return { start: startDate, end: endDate };
    }

    /**
     * Get the active hours span in minutes
     * @returns {number} Active hours span in minutes
     */
    getActiveHoursSpan() {
        const { start, end } = this.getActiveHoursAsDate();
        
        // Handle case where end time is on the next day
        let diff = end - start;
        if (diff < 0) {
            diff += 24 * 60 * 60 * 1000; // Add 24 hours in milliseconds
        }
        
        return diff / (60 * 1000); // Convert to minutes
    }

    /**
     * Check if a given time is within active hours
     * @param {Date} time The time to check
     * @returns {boolean} True if within active hours
     */
    isWithinActiveHours(time) {
        const { start, end } = this.getActiveHoursAsDate();
        const timeHours = time.getHours();
        const timeMinutes = time.getMinutes();
        
        const startHours = start.getHours();
        const startMinutes = start.getMinutes();
        
        const endHours = end.getHours();
        const endMinutes = end.getMinutes();
        
        // Create comparison values (hours * 60 + minutes)
        const timeValue = timeHours * 60 + timeMinutes;
        const startValue = startHours * 60 + startMinutes;
        const endValue = endHours * 60 + endMinutes;
        
        // Check if time is within range
        if (startValue <= endValue) {
            // Normal case: start time is before end time
            return timeValue >= startValue && timeValue <= endValue;
        } else {
            // End time is on the next day
            return timeValue >= startValue || timeValue <= endValue;
        }
    }

    /**
     * Get a timer preset by name
     * @param {string} presetName Name of the preset
     * @returns {Object|null} Timer preset object or null if not found
     */
    getTimerPreset(presetName) {
        return this.timerPresets.find(preset => preset.name.toLowerCase() === presetName.toLowerCase()) || null;
    }

    /**
     * Convert settings to a plain object for storage
     * @returns {Object} Plain object representation of settings
     */
    toObject() {
        return {
            theme: this.theme,
            focusDuration: this.focusDuration,
            breakDuration: this.breakDuration,
            activeHours: this.activeHours,
            defaultReminderTime: this.defaultReminderTime,
            notifications: this.notifications,
            timerPresets: this.timerPresets,
            calendarView: this.calendarView,
            autoStartNextSession: this.autoStartNextSession,
            autoPauseOnInactiveTab: this.autoPauseOnInactiveTab
        };
    }

    /**
     * Create a Settings instance from a plain object
     * @param {Object} obj Plain object with settings data
     * @returns {Settings} Settings instance
     */
    static fromObject(obj) {
        return new Settings(obj);
    }
}