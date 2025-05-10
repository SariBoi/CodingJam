/**
 * CalendarController.js
 * 
 * Controller for managing calendar views in the Pomodoro app.
 * Handles rendering tasks on daily and weekly calendars.
 */

import { TaskStatus, SessionType } from '../models/Task.js';
import { StorageManager } from '../services/StorageManager.js';

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
        
        // Calendar elements
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
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Get settings
        this.settings = new Settings(StorageManager.getSettings());
        
        // Initialize calendar
        this.initCalendar();
    }

    /**
     * Set up event listeners for calendar controls
     */
    setupEventListeners() {
        // View toggle buttons
        if (this.elements.dailyViewBtn) {
            this.elements.dailyViewBtn.addEventListener('click', () => {
                this.setView('daily');
            });
        }
        
        if (this.elements.weeklyViewBtn) {
            this.elements.weeklyViewBtn.addEventListener('click', () => {
                this.setView('weekly');
            });
        }
        
        // Navigation buttons
        if (this.elements.prevWeekBtn) {
            this.elements.prevWeekBtn.addEventListener('click', () => {
                this.navigateWeek(-1);
            });
        }
        
        if (this.elements.nextWeekBtn) {
            this.elements.nextWeekBtn.addEventListener('click', () => {
                this.navigateWeek(1);
            });
        }
        
        // Quick navigation buttons
        if (this.elements.todayBtn) {
            this.elements.todayBtn.addEventListener('click', () => {
                this.goToToday();
            });
        }
        
        if (this.elements.thisWeekBtn) {
            this.elements.thisWeekBtn.addEventListener('click', () => {
                this.goToThisWeek();
            });
        }
        
        if (this.elements.nextWeekBtn2) {
            this.elements.nextWeekBtn2.addEventListener('click', () => {
                this.goToNextWeek();
            });
        }
    }

    /**
     * Initialize the calendar
     */
    initCalendar() {
        // Set initial view
        this.setView(this.currentView);
        
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
     * Render the calendar based on current view
     */
    renderCalendar() {
        if (this.currentView === 'daily') {
            this.renderDailyView();
        } else {
            this.renderWeeklyView();
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
     * Render the daily view
     */
    renderDailyView() {
        if (!this.elements.dayView) {
            return;
        }
        
        // Clear existing content
        const hourContainer = this.elements.dayView.querySelector('.hour-container');
        if (!hourContainer) {
            return;
        }
        
        hourContainer.innerHTML = '';
        
        // Get settings for active hours
        const activeHours = this.settings.activeHours;
        let startHour = parseInt(activeHours.start.split(':')[0]);
        let endHour = parseInt(activeHours.end.split(':')[0]);
        
        // If end hour is less than start hour, assume it's the next day
        if (endHour <= startHour) {
            endHour += 24;
        }
        
        // Get tasks for the current date
        const tasks = this.taskController.getTasksForDate(this.currentDate);
        
        // Check if we need to extend the hours to show all tasks
        for (const task of tasks) {
            if (task.startTime) {
                const taskHour = parseInt(task.startTime.split(':')[0]);
                if (taskHour < startHour) {
                    startHour = taskHour;
                }
                
                // Check end time considering task duration
                const taskEndHour = taskHour + Math.ceil(task.estimatedDuration);
                if (taskEndHour > endHour) {
                    endHour = taskEndHour;
                }
            }
        }
        
        // Render hour markers
        for (let hour = startHour; hour <= endHour; hour++) {
            const displayHour = hour % 24; // Handle hours >= 24
            const hourMarker = this.createHourMarker(displayHour);
            hourContainer.appendChild(hourMarker);
        }
        
        // Render tasks on the calendar
        this.renderTasksOnDailyView(tasks, startHour);
    }

    /**
     * Create an hour marker element
     * @param {number} hour Hour (0-23)
     * @returns {HTMLElement} Hour marker element
     */
    createHourMarker(hour) {
        const hourMarker = document.createElement('div');
        hourMarker.className = 'hour-marker';
        
        // Format hour (12-hour format with AM/PM)
        const hourStr = this.formatHour(hour);
        
        hourMarker.innerHTML = `
            <div class="hour-label">${hourStr}</div>
            <div class="hour-slots" data-hour="${hour}"></div>
        `;
        
        return hourMarker;
    }

    /**
     * Render tasks on the daily view
     * @param {Array} tasks Array of tasks
     * @param {number} startHour First hour to display
     */
    renderTasksOnDailyView(tasks, startHour) {
        for (const task of tasks) {
            // Skip tasks without start time
            if (!task.startTime) {
                continue;
            }
            
            // Get task start hour and minute
            const [hours, minutes] = task.startTime.split(':').map(Number);
            
            // Calculate task position and duration
            const taskStartHour = hours + (minutes / 60);
            const taskDuration = task.estimatedDuration;
            
            // Get all sessions for this task
            const sessions = task.sessions;
            
            // Track current time position for sessions
            let currentPosition = taskStartHour;
            
            // Render each session
            for (const session of sessions) {
                // Skip already completed sessions for past days
                const taskDate = new Date(task.startDate);
                const isToday = this.isSameDay(this.currentDate, taskDate);
                if (session.completed && !isToday) {
                    // For completed sessions, just advance position
                    currentPosition += session.duration / 60;
                    continue;
                }
                
                // Calculate session position
                const sessionStartHour = currentPosition;
                const sessionDuration = session.duration / 60; // Convert minutes to hours
                
                // Create session element
                const sessionElement = this.createSessionElement(task, session, sessionStartHour, sessionDuration, startHour);
                
                // Append to the appropriate hour slot
                const hourIndex = Math.floor(sessionStartHour);
                const hourSlot = this.elements.dayView.querySelector(`.hour-slots[data-hour="${hourIndex}"]`);
                
                if (hourSlot) {
                    hourSlot.appendChild(sessionElement);
                }
                
                // Advance position for next session
                currentPosition += sessionDuration;
            }
        }
    }

    /**
     * Create a session element for the calendar
     * @param {Object} task Task object
     * @param {Object} session Session object
     * @param {number} startHour Start hour position (e.g., 9.5 for 9:30)
     * @param {number} duration Duration in hours
     * @param {number} firstHour First hour displayed on calendar
     * @returns {HTMLElement} Session element
     */
    createSessionElement(task, session, startHour, duration, firstHour) {
        const sessionElement = document.createElement('div');
        sessionElement.className = 'task-event';
        
        // Add appropriate class based on session type
        sessionElement.classList.add(
            session.type === SessionType.FOCUS ? 'session-focus' : 'session-break'
        );
        
        // Add priority class
        sessionElement.classList.add(`priority-${task.priority}-indicator`);
        
        // Add completed class if applicable
        if (session.completed) {
            sessionElement.classList.add('completed');
        }
        
        // Calculate position
        const hourHeight = 60; // Height of one hour in pixels
        const topPosition = (startHour - firstHour) * hourHeight;
        const height = duration * hourHeight;
        
        // Set style for positioning
        sessionElement.style.top = `${topPosition}px`;
        sessionElement.style.height = `${height}px`;
        sessionElement.style.width = 'calc(100% - 10px)';
        
        // Add content
        sessionElement.innerHTML = `
            <div class="task-event-name">${task.name}</div>
            <div class="task-event-time">${this.formatSessionTime(startHour, duration, session.type)}</div>
        `;
        
        // Add data attributes
        sessionElement.dataset.taskId = task.id;
        sessionElement.dataset.sessionId = session.id;
        
        // Add click handler
        sessionElement.addEventListener('click', () => {
            this.handleSessionClick(task, session);
        });
        
        return sessionElement;
    }

    /**
     * Render the weekly view
     */
    renderWeeklyView() {
        if (!this.elements.weekView) {
            return;
        }
        
        // Clear existing content
        const dayHeaders = this.elements.weekView.querySelector('.day-headers');
        const weekGrid = this.elements.weekView.querySelector('.week-grid');
        
        if (!dayHeaders || !weekGrid) {
            return;
        }
        
        dayHeaders.innerHTML = '';
        weekGrid.innerHTML = '';
        
        // Get the start of the week (Sunday)
        const startOfWeek = this.getStartOfWeek(this.currentDate);
        
        // Create day headers
        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(day.getDate() + i);
            
            const isToday = this.isSameDay(day, new Date());
            
            const dayHeader = document.createElement('div');
            dayHeader.className = 'day-header';
            if (isToday) {
                dayHeader.classList.add('current');
            }
            
            // Format as "Mon, Feb 15"
            const dayStr = day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            dayHeader.textContent = dayStr;
            
            dayHeaders.appendChild(dayHeader);
        }
        
        // Get settings for active hours
        const activeHours = this.settings.activeHours;
        let startHour = parseInt(activeHours.start.split(':')[0]);
        let endHour = parseInt(activeHours.end.split(':')[0]);
        
        // If end hour is less than start hour, assume it's the next day
        if (endHour <= startHour) {
            endHour += 24;
        }
        
        // Get tasks for the current week
        const weekTasks = this.taskController.getTasksForWeek(startOfWeek);
        
        // Extend hours if needed to fit tasks
        for (const dateStr in weekTasks) {
            for (const task of weekTasks[dateStr]) {
                if (task.startTime) {
                    const taskHour = parseInt(task.startTime.split(':')[0]);
                    if (taskHour < startHour) {
                        startHour = taskHour;
                    }
                    
                    // Check end time considering task duration
                    const taskEndHour = taskHour + Math.ceil(task.estimatedDuration);
                    if (taskEndHour > endHour) {
                        endHour = taskEndHour;
                    }
                }
            }
        }
        
        // Create time grid
        for (let hour = startHour; hour <= endHour; hour++) {
            const displayHour = hour % 24; // Handle hours >= 24
            
            // Create row header (time label)
            const timeLabel = document.createElement('div');
            timeLabel.className = 'week-grid-hour';
            timeLabel.textContent = this.formatHour(displayHour);
            weekGrid.appendChild(timeLabel);
            
            // Create cells for each day
            for (let day = 0; day < 7; day++) {
                const cell = document.createElement('div');
                cell.className = 'week-grid-cell';
                cell.dataset.hour = displayHour;
                cell.dataset.day = day;
                
                // Mark current day
                const currentDay = new Date(startOfWeek);
                currentDay.setDate(currentDay.getDate() + day);
                if (this.isSameDay(currentDay, new Date())) {
                    cell.classList.add('current');
                }
                
                weekGrid.appendChild(cell);
            }
        }
        
        // Render tasks on the weekly view
        this.renderTasksOnWeeklyView(weekTasks, startHour, startOfWeek);
    }

    /**
     * Render tasks on the weekly view
     * @param {Object} weekTasks Object with dates as keys and task arrays as values
     * @param {number} startHour First hour to display
     * @param {Date} startOfWeek First day of the week
     */
    renderTasksOnWeeklyView(weekTasks, startHour, startOfWeek) {
        // Process each day
        for (let day = 0; day < 7; day++) {
            const currentDay = new Date(startOfWeek);
            currentDay.setDate(currentDay.getDate() + day);
            
            const dateStr = currentDay.toISOString().split('T')[0];
            const tasksForDay = weekTasks[dateStr] || [];
            
            // Process each task for this day
            for (const task of tasksForDay) {
                // Skip tasks without start time
                if (!task.startTime) {
                    continue;
                }
                
                // Get task start hour and minute
                const [hours, minutes] = task.startTime.split(':').map(Number);
                
                // Calculate task position and duration
                const taskStartHour = hours + (minutes / 60);
                
                // Track current time position for sessions
                let currentPosition = taskStartHour;
                
                // Render each session
                for (const session of task.sessions) {
                    // Calculate session position
                    const sessionStartHour = currentPosition;
                    const sessionDuration = session.duration / 60; // Convert minutes to hours
                    
                    // Create session element
                    const sessionElement = this.createWeeklySessionElement(
                        task, session, sessionStartHour, sessionDuration, startHour, day
                    );
                    
                    // Append to the grid
                    this.elements.weekView.querySelector('.week-grid').appendChild(sessionElement);
                    
                    // Advance position for next session
                    currentPosition += sessionDuration;
                }
            }
        }
    }

    /**
     * Create a session element for the weekly view
     * @param {Object} task Task object
     * @param {Object} session Session object
     * @param {number} startHour Start hour position (e.g., 9.5 for 9:30)
     * @param {number} duration Duration in hours
     * @param {number} firstHour First hour displayed on calendar
     * @param {number} dayIndex Day index (0-6)
     * @returns {HTMLElement} Session element
     */
    createWeeklySessionElement(task, session, startHour, duration, firstHour, dayIndex) {
        const sessionElement = document.createElement('div');
        sessionElement.className = 'task-event weekly-event';
        
        // Add appropriate class based on session type
        sessionElement.classList.add(
            session.type === SessionType.FOCUS ? 'session-focus' : 'session-break'
        );
        
        // Add priority class
        sessionElement.classList.add(`priority-${task.priority}-indicator`);
        
        // Add completed class if applicable
        if (session.completed) {
            sessionElement.classList.add('completed');
        }
        
        // Calculate position
        const hourHeight = 40; // Height of one hour in weekly view
        const dayWidth = 100 / 7; // Width percentage for each day
        const topPosition = (startHour - firstHour) * hourHeight;
        const height = duration * hourHeight;
        const leftPosition = dayIndex * dayWidth;
        
        // Set style for positioning
        sessionElement.style.top = `${topPosition}px`;
        sessionElement.style.height = `${height}px`;
        sessionElement.style.left = `${leftPosition}%`;
        sessionElement.style.width = `${dayWidth}%`;
        
        // Add content (shorter for weekly view)
        sessionElement.innerHTML = `
            <div class="task-event-name">${task.name}</div>
        `;
        
        // Add tooltip with more details
        sessionElement.title = `${task.name} (${this.formatSessionTime(startHour, duration, session.type)})`;
        
        // Add data attributes
        sessionElement.dataset.taskId = task.id;
        sessionElement.dataset.sessionId = session.id;
        
        // Add click handler
        sessionElement.addEventListener('click', () => {
            this.handleSessionClick(task, session);
        });
        
        return sessionElement;
    }

    /**
     * Handle click on a calendar session
     * @param {Object} task Task object
     * @param {Object} session Session object
     */
    handleSessionClick(task, session) {
        // Task details modal or start task feature can be implemented here
        // For now, just log the info
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
     * Refresh the calendar view
     */
    refreshCalendar() {
        this.renderCalendar();
    }
}

// Import Settings class
import { Settings } from '../models/Settings.js';