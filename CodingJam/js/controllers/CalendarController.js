/**
 * CalendarController.js
 * 
 * Core controller for managing calendar views in the Pomodoro app.
 * Delegates rendering and event handling to specialized modules.
 */

import { TaskStatus, SessionType } from '../models/Task.js';
import { StorageManager } from '../services/StorageManager.js';
import { Settings } from '../models/Settings.js';
import { CalendarViewRenderer } from './calendar/CalendarViewRenderer.js';
import { CalendarEventHandler } from './calendar/CalendarEventHandler.js';

/**
 * CalendarController class for managing calendar views
 */
export class CalendarController {
    /**
     * Create a new CalendarController
     * @param {TaskController} taskController Reference to the TaskController
     */
    constructor(taskController) {
        this.taskController = taskController;
        
        // Current view state
        this.currentDate = new Date();
        this.currentView = 'daily'; // 'daily' or 'weekly'
        
        // Get settings
        this.settings = new Settings(StorageManager.getSettings());
        
        // Find DOM elements
        this.initElements();
        
        // Create renderer and event handler
        this.renderer = new CalendarViewRenderer(this);
        this.eventHandler = new CalendarEventHandler(this);
        
        // Initialize calendar
        this.initCalendar();
    }

    /**
     * Initialize DOM elements
     */
    initElements() {
        this.elements = {
            // Calendar container and views
            container: document.querySelector('.calendar-container'),
            dayView: document.getElementById('day-view'),
            weekView: document.getElementById('week-view'),
            
            // View control buttons
            dailyViewBtn: document.getElementById('calendar-daily'),
            weeklyViewBtn: document.getElementById('calendar-weekly'),
            
            // Navigation
            currentWeekDisplay: document.getElementById('current-week-display'),
            prevWeekBtn: document.getElementById('prev-week'),
            nextWeekBtn: document.getElementById('next-week'),
            todayBtn: document.getElementById('goto-today'),
            thisWeekBtn: document.getElementById('goto-this-week'),
            nextWeekBtn2: document.getElementById('goto-next-week')
        };
    }

    /**
     * Initialize the calendar
     */
    initCalendar() {
        // Set initial view
        this.setView(this.currentView);
        
        // Set up event listeners
        this.eventHandler.setupEventListeners();
        
        // Render the calendar
        this.renderCalendar();
    }

    /**
     * Set the calendar view (daily or weekly)
     * @param {string} view View name ('daily' or 'weekly')
     */
    setView(view) {
        if (view !== 'daily' && view !== 'weekly') {
            return;
        }
        
        this.currentView = view;
        
        // Update UI buttons
        if (this.elements.dailyViewBtn && this.elements.weeklyViewBtn) {
            this.elements.dailyViewBtn.classList.toggle('active', view === 'daily');
            this.elements.weeklyViewBtn.classList.toggle('active', view === 'weekly');
        }
        
        // Update view containers
        if (this.elements.dayView && this.elements.weekView) {
            this.elements.dayView.classList.toggle('hidden', view !== 'daily');
            this.elements.weekView.classList.toggle('hidden', view !== 'weekly');
        }
        
        // Render the appropriate view
        this.renderCalendar();
        
        // Save view preference
        const settings = StorageManager.getSettings();
        settings.calendarView = view;
        StorageManager.saveSettings(settings);
    }

    /**
     * Render the calendar based on current view
     */
    renderCalendar() {
        if (this.currentView === 'daily') {
            this.renderer.renderDailyView();
        } else {
            this.renderer.renderWeeklyView();
        }
        
        this.updateNavigationDisplay();
    }

    /**
     * Update the navigation display (current week text)
     */
    updateNavigationDisplay() {
        if (!this.elements.currentWeekDisplay) {
            return;
        }
        
        // Get first and last day of the week
        const firstDay = this.getStartOfWeek(this.currentDate);
        const lastDay = new Date(firstDay);
        lastDay.setDate(lastDay.getDate() + 6);
        
        // Format dates
        const firstDayStr = this.formatDate(firstDay);
        const lastDayStr = this.formatDate(lastDay);
        
        // Update display
        this.elements.currentWeekDisplay.textContent = `${firstDayStr} - ${lastDayStr}`;
    }

    /**
     * Navigate to a different week
     * @param {number} weeks Number of weeks to navigate (positive or negative)
     */
    navigateWeek(weeks) {
        const newDate = new Date(this.currentDate);
        newDate.setDate(newDate.getDate() + (weeks * 7));
        this.currentDate = newDate;
        
        // Update the calendar
        this.renderCalendar();
    }

    /**
     * Go to today's date
     */
    goToToday() {
        this.currentDate = new Date();
        this.renderCalendar();
    }

    /**
     * Go to the start of the current week
     */
    goToThisWeek() {
        const today = new Date();
        
        // Get the first day of the week (Sunday)
        const firstDayOfWeek = new Date(today);
        const dayOfWeek = today.getDay();
        firstDayOfWeek.setDate(today.getDate() - dayOfWeek);
        
        this.currentDate = firstDayOfWeek;
        this.renderCalendar();
    }

    /**
     * Go to the start of next week
     */
    goToNextWeek() {
        const today = new Date();
        
        // Get the first day of next week (Sunday)
        const firstDayOfNextWeek = new Date(today);
        const dayOfWeek = today.getDay();
        firstDayOfNextWeek.setDate(today.getDate() + (7 - dayOfWeek));
        
        this.currentDate = firstDayOfNextWeek;
        this.renderCalendar();
    }

    /**
     * Get the start of the week (Sunday) for a given date
     * @param {Date} date Date object
     * @returns {Date} First day of the week
     */
    getStartOfWeek(date) {
        const result = new Date(date);
        const dayOfWeek = date.getDay();
        result.setDate(date.getDate() - dayOfWeek);
        return result;
    }

    /**
     * Check if two dates are the same day
     * @param {Date} date1 First date
     * @param {Date} date2 Second date
     * @returns {boolean} True if dates are the same day
     */
    isSameDay(date1, date2) {
        return (
            date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate()
        );
    }

    /**
     * Format a date for display
     * @param {Date} date Date object
     * @returns {string} Formatted date string
     */
    formatDate(date) {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
        });
    }

    /**
     * Format an hour for display
     * @param {number} hour Hour (0-23)
     * @returns {string} Formatted hour string (e.g., "9:00 AM")
     */
    formatHour(hour) {
        const period = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:00 ${period}`;
    }

    /**
     * Format session time for display
     * @param {number} startHour Start hour (e.g., 9.5 for 9:30)
     * @param {number} duration Duration in hours
     * @param {string} type Session type
     * @returns {string} Formatted time string
     */
    formatSessionTime(startHour, duration, type) {
        const startHourInt = Math.floor(startHour);
        const startMinute = Math.round((startHour - startHourInt) * 60);
        
        const endHour = startHour + duration;
        const endHourInt = Math.floor(endHour);
        const endMinute = Math.round((endHour - endHourInt) * 60);
        
        const startPeriod = startHourInt >= 12 ? 'PM' : 'AM';
        const endPeriod = endHourInt >= 12 ? 'PM' : 'AM';
        
        const startHour12 = startHourInt % 12 || 12;
        const endHour12 = endHourInt % 12 || 12;
        
        const startStr = `${startHour12}:${startMinute.toString().padStart(2, '0')} ${startPeriod}`;
        const endStr = `${endHour12}:${endMinute.toString().padStart(2, '0')} ${endPeriod}`;
        
        const typeStr = type === SessionType.FOCUS ? 'Focus' : 'Break';
        
        return `${startStr} - ${endStr} (${typeStr})`;
    }

    /**
     * Handle click on a calendar session
     * @param {Object} task Task object
     * @param {Object} session Session object
     */
    handleSessionClick(task, session) {
        // Task details modal or start task feature can be implemented here
        console.log('Session clicked:', task.name, session.type);
        
        // Example implementation: Start the task if it's not completed
        if (task.status !== TaskStatus.COMPLETED) {
            const app = window.app;
            if (app) {
                app.startTask(task.id);
            }
        }
    }

    /**
     * Refresh the calendar view
     */
    refreshCalendar() {
        this.renderCalendar();
    }
}