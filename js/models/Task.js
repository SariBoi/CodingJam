/**
 * Task.js
 * 
 * Defines the Task class which represents a task in the Pomodoro app.
 * Contains properties and methods for managing task data and state.
 */

/**
 * Generates a unique ID for a task
 * @returns {string} Unique ID
 */
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * Task status enum
 */
export const TaskStatus = {
    PENDING: 'pending',    // Not started yet
    ONGOING: 'ongoing',    // Currently in progress
    PARTIAL: 'partial',    // Started but paused
    COMPLETED: 'completed', // Finished
    MISSED: 'missed'       // Start time passed but not started
};

/**
 * Task priority enum
 */
export const TaskPriority = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high'
};

/**
 * Session type enum
 */
export const SessionType = {
    FOCUS: 'focus',
    BREAK: 'break'
};

/**
 * Task class representing a task in the application
 */
export class Task {
    /**
     * Create a new Task
     * @param {Object} taskData Task data
     */
    constructor(taskData = {}) {
        this.id = taskData.id || generateUniqueId();
        this.name = taskData.name || 'Untitled Task';
        this.status = taskData.status || TaskStatus.PENDING;
        this.priority = taskData.priority || TaskPriority.MEDIUM;
        
        // Times and dates
        this.createdAt = taskData.createdAt || new Date().toISOString();
        this.estimatedDuration = taskData.estimatedDuration || 1; // In hours
        this.startDate = taskData.startDate || null;
        this.startTime = taskData.startTime || null;
        this.dueDate = taskData.dueDate || null;
        this.dueTime = taskData.dueTime || null;
        
        // Timer settings
        this.timerSettings = taskData.timerSettings || {
            focusDuration: 25, // minutes
            breakDuration: 5,  // minutes
            useCustomTimer: false
        };
        
        // Reminder and notification
        this.reminderTime = taskData.reminderTime || 60; // minutes before start
        
        // Procrastination mode (start with break)
        this.procrastinationMode = taskData.procrastinationMode || false;
        
        // Recurring task settings
        this.isRecurring = taskData.isRecurring || false;
        this.recurringDays = taskData.recurringDays || []; // Array of day indices (0=Sunday, 6=Saturday)
        
        // Focus mode setting for this task
        this.useFocusMode = taskData.useFocusMode || false;
        
        // Sessions (calculated based on estimated duration)
        this.sessions = taskData.sessions || this.calculateSessions();
        
        // Count only focus sessions for progress tracking
        const focusSessions = this.sessions.filter(s => s.type === SessionType.FOCUS);
        
        // Progress tracking
        this.progress = taskData.progress || {
            completedSessions: 0,
            totalSessions: focusSessions.length, // Only count focus sessions
            currentSession: 0,
            timeSpent: 0 // In minutes
        };
        
        // Tags for future categorization
        this.tags = taskData.tags || [];
    }

    /**
     * Calculate Pomodoro sessions based on estimated duration
     * @returns {Array} Array of session objects
     */
    calculateSessions() {
        const { focusDuration, breakDuration } = this.timerSettings;
        const estimatedMinutes = this.estimatedDuration * 60;
        
        // Calculate number of complete Pomodoro cycles (focus + break)
        const focusSessionCount = Math.ceil(estimatedMinutes / focusDuration);
        const sessions = [];
        
        // If procrastination mode is enabled, start with a break
        if (this.procrastinationMode) {
            sessions.push({
                id: generateUniqueId(),
                type: SessionType.BREAK,
                duration: breakDuration,
                completed: false
            });
        }
        
        // Create focus and break sessions alternately
        for (let i = 0; i < focusSessionCount; i++) {
            // Add focus session
            sessions.push({
                id: generateUniqueId(),
                type: SessionType.FOCUS,
                duration: focusDuration,
                completed: false
            });
            
            // Add break session after each focus session except the last one
            if (i < focusSessionCount - 1) {
                sessions.push({
                    id: generateUniqueId(),
                    type: SessionType.BREAK,
                    duration: breakDuration,
                    completed: false
                });
            }
        }
        
        return sessions;
    }

    /**
     * Get the next session that's not completed
     * @returns {Object|null} Next session or null if all completed
     */
    getNextSession() {
        return this.sessions.find(session => !session.completed) || null;
    }

    /**
     * Start the task
     * @returns {Task} Updated task
     */
    start() {
        this.status = TaskStatus.ONGOING;
        
        // If a session is currently active, update its start time
        const currentSession = this.getCurrentSession();
        if (currentSession) {
            currentSession.startedAt = new Date().toISOString();
        }
        
        return this;
    }

    /**
     * Pause the task
     * @returns {Task} Updated task
     */
    pause() {
        if (this.status === TaskStatus.ONGOING) {
            this.status = TaskStatus.PARTIAL;
            
            // Update the current session
            const currentSession = this.getCurrentSession();
            if (currentSession && currentSession.startedAt) {
                const now = new Date();
                const startTime = new Date(currentSession.startedAt);
                const timeSpentInSession = (now - startTime) / 60000; // Convert to minutes
                
                // Update task timeSpent
                this.progress.timeSpent += timeSpentInSession;
                
                // Clear startedAt so we know this session is paused
                delete currentSession.startedAt;
            }
        }
        
        return this;
    }

    /**
     * Complete the current session
     * @returns {Task} Updated task
     */
    completeCurrentSession() {
        const currentIndex = this.progress.currentSession;
        
        if (currentIndex < this.sessions.length) {
            const session = this.sessions[currentIndex];
            session.completed = true;
            
            // Update progress, only count focus sessions
            if (session.type === SessionType.FOCUS) {
                this.progress.completedSessions++;
            }
            
            // Move to next session
            this.progress.currentSession++;
            
            // Update task timeSpent
            this.progress.timeSpent += session.duration;
            
            // Check if all focus sessions are completed
            const focusSessions = this.sessions.filter(s => s.type === SessionType.FOCUS);
            if (this.progress.completedSessions >= focusSessions.length) {
                this.status = TaskStatus.COMPLETED;
            }
        }
        
        return this;
    }

    /**
     * Get the current session
     * @returns {Object|null} Current session or null
     */
    getCurrentSession() {
        return this.sessions[this.progress.currentSession] || null;
    }

    /**
     * Get count of focus sessions
     * @returns {number} Number of focus sessions
     */
    getFocusSessionCount() {
        return this.sessions.filter(s => s.type === SessionType.FOCUS).length;
    }

    /**
     * Get the number of completed focus sessions
     * @returns {number} Number of completed focus sessions
     */
    getCompletedFocusSessions() {
        return this.progress.completedSessions;
    }

    /**
     * Check if the task is overdue
     * @returns {boolean} True if task is overdue
     */
    isOverdue() {
        if (!this.dueDate) return false;
        
        const now = new Date();
        const dueDateTime = new Date(this.dueDate);
        
        if (this.dueTime) {
            const [hours, minutes] = this.dueTime.split(':').map(Number);
            dueDateTime.setHours(hours, minutes, 0, 0);
        }
        
        return now > dueDateTime;
    }

    /**
     * Check if the task should be marked as missed
     * @returns {boolean} True if task should be marked as missed
     */
    shouldBeMarkedAsMissed() {
        if (!this.startDate || this.status !== TaskStatus.PENDING) return false;
        
        const now = new Date();
        const startDateTime = new Date(this.startDate);
        
        if (this.startTime) {
            const [hours, minutes] = this.startTime.split(':').map(Number);
            startDateTime.setHours(hours, minutes, 0, 0);
        }
        
        return now > startDateTime;
    }

    /**
     * Mark the task as missed
     * @returns {Task} Updated task
     */
    markAsMissed() {
        if (this.status === TaskStatus.PENDING && this.shouldBeMarkedAsMissed()) {
            this.status = TaskStatus.MISSED;
        }
        
        return this;
    }

    /**
     * Calculate the completion percentage
     * @returns {number} Completion percentage (0-100)
     */
    getCompletionPercentage() {
        const focusSessions = this.getFocusSessionCount();
        if (focusSessions === 0) return 0;
        
        return Math.round((this.progress.completedSessions / focusSessions) * 100);
    }

    /**
     * Convert the task to a plain object for storage
     * @returns {Object} Plain object representation of the task
     */
    toObject() {
        return {
            id: this.id,
            name: this.name,
            status: this.status,
            priority: this.priority,
            createdAt: this.createdAt,
            estimatedDuration: this.estimatedDuration,
            startDate: this.startDate,
            startTime: this.startTime,
            dueDate: this.dueDate,
            dueTime: this.dueTime,
            timerSettings: this.timerSettings,
            reminderTime: this.reminderTime,
            procrastinationMode: this.procrastinationMode,
            isRecurring: this.isRecurring,
            recurringDays: this.recurringDays,
            useFocusMode: this.useFocusMode,
            sessions: this.sessions,
            progress: this.progress,
            tags: this.tags
        };
    }

    /**
     * Create a Task instance from a plain object
     * @param {Object} obj Plain object representing a task
     * @returns {Task} Task instance
     */
    static fromObject(obj) {
        return new Task(obj);
    }

    /**
     * Create a duplicate of this task for a recurring instance
     * @param {string} newDate The ISO date string for the new instance
     * @returns {Task} New Task instance
     */
    createRecurringInstance(newDate) {
        const taskData = this.toObject();
        
        // Generate new ID and reset status
        taskData.id = generateUniqueId();
        taskData.status = TaskStatus.PENDING;
        taskData.createdAt = new Date().toISOString();
        
        // Update the date
        taskData.startDate = newDate;
        
        // Calculate a new due date if one exists
        if (taskData.dueDate) {
            const oldStartDate = new Date(this.startDate);
            const oldDueDate = new Date(this.dueDate);
            const daysDifference = Math.round((oldDueDate - oldStartDate) / (1000 * 60 * 60 * 24));
            
            const newDueDate = new Date(newDate);
            newDueDate.setDate(newDueDate.getDate() + daysDifference);
            taskData.dueDate = newDueDate.toISOString().split('T')[0];
        }
        
        // Reset progress
        const focusSessions = taskData.sessions.filter(s => s.type === SessionType.FOCUS).length;
        taskData.progress = {
            completedSessions: 0,
            totalSessions: focusSessions, // Only count focus sessions
            currentSession: 0,
            timeSpent: 0
        };
        
        // Reset session completion status
        taskData.sessions.forEach(session => {
            session.id = generateUniqueId();
            session.completed = false;
            delete session.startedAt;
        });
        
        return new Task(taskData);
    }
}