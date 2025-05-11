/**
 * CalendarViewRenderer.js
 * 
 * Responsible for rendering the calendar views (daily and weekly).
 * Handles the visual representation of tasks and sessions.
 */

import { SessionType } from '../../models/Task.js';

/**
 * CalendarViewRenderer class for handling calendar rendering
 */
export class CalendarViewRenderer {
    /**
     * Create a new CalendarViewRenderer
     * @param {CalendarController} controller Reference to the CalendarController
     */
    constructor(controller) {
        this.controller = controller;
    }

    /**
     * Render the daily view
     */
    renderDailyView() {
        const elements = this.controller.elements;
        if (!elements.dayView) {
            return;
        }
        
        // Clear existing content
        const hourContainer = elements.dayView.querySelector('.hour-container');
        if (!hourContainer) {
            return;
        }
        
        hourContainer.innerHTML = '';
        
        // Get settings for active hours
        const activeHours = this.controller.settings.activeHours;
        let startHour = parseInt(activeHours.start.split(':')[0]);
        let endHour = parseInt(activeHours.end.split(':')[0]);
        
        // If end hour is less than start hour, assume it's the next day
        if (endHour <= startHour) {
            endHour += 24;
        }
        
        // Get tasks for the current date
        const tasks = this.controller.taskController.getTasksForDate(this.controller.currentDate);
        
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
        const hourStr = this.controller.formatHour(hour);
        
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
            
            // Track current time position for sessions
            let currentPosition = taskStartHour;
            
            // Render each session
            for (const session of task.sessions) {
                // Skip already completed sessions for past days
                const taskDate = new Date(task.startDate);
                const isToday = this.controller.isSameDay(this.controller.currentDate, taskDate);
                if (session.completed && !isToday) {
                    // For completed sessions, just advance position
                    currentPosition += session.duration / 60;
                    continue;
                }
                
                // Calculate session position
                const sessionStartHour = currentPosition;
                const sessionDuration = session.duration / 60; // Convert minutes to hours
                
                // Create session element
                const sessionElement = this.createSessionElement(
                    task, session, sessionStartHour, sessionDuration, startHour
                );
                
                // Append to the appropriate hour slot
                const hourIndex = Math.floor(sessionStartHour);
                const hourSlot = this.controller.elements.dayView.querySelector(
                    `.hour-slots[data-hour="${hourIndex}"]`
                );
                
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
            <div class="task-event-time">${this.controller.formatSessionTime(startHour, duration, session.type)}</div>
        `;
        
        // Add data attributes
        sessionElement.dataset.taskId = task.id;
        sessionElement.dataset.sessionId = session.id;
        
        // Add click handler
        sessionElement.addEventListener('click', () => {
            this.controller.handleSessionClick(task, session);
        });
        
        return sessionElement;
    }

    /**
     * Render the weekly view
     */
    renderWeeklyView() {
        const elements = this.controller.elements;
        if (!elements.weekView) {
            return;
        }
        
        // Clear existing content
        const dayHeaders = elements.weekView.querySelector('.day-headers');
        const weekGrid = elements.weekView.querySelector('.week-grid');
        
        if (!dayHeaders || !weekGrid) {
            return;
        }
        
        dayHeaders.innerHTML = '';
        weekGrid.innerHTML = '';
        
        // Get the start of the week (Sunday)
        const startOfWeek = this.controller.getStartOfWeek(this.controller.currentDate);
        
        // Create day headers
        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(day.getDate() + i);
            
            const isToday = this.controller.isSameDay(day, new Date());
            
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
        const activeHours = this.controller.settings.activeHours;
        let startHour = parseInt(activeHours.start.split(':')[0]);
        let endHour = parseInt(activeHours.end.split(':')[0]);
        
        // If end hour is less than start hour, assume it's the next day
        if (endHour <= startHour) {
            endHour += 24;
        }
        
        // Get tasks for the current week
        const weekTasks = this.controller.taskController.getTasksForWeek(startOfWeek);
        
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
            timeLabel.textContent = this.controller.formatHour(displayHour);
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
                if (this.controller.isSameDay(currentDay, new Date())) {
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
                    this.controller.elements.weekView.querySelector('.week-grid').appendChild(sessionElement);
                    
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
        sessionElement.title = `${task.name} (${this.controller.formatSessionTime(startHour, duration, session.type)})`;
        
        // Add data attributes
        sessionElement.dataset.taskId = task.id;
        sessionElement.dataset.sessionId = session.id;
        
        // Add click handler
        sessionElement.addEventListener('click', () => {
            this.controller.handleSessionClick(task, session);
        });
        
        return sessionElement;
    }
}