/**
 * TaskView.js
 * 
 * View component for rendering task lists and handling task interactions.
 */

import { TaskFormManager } from './tasks/TaskFormManager.js';
import { TaskListRenderer } from './tasks/TaskListRenderer.js';

/**
 * TaskView class for managing task UI elements
 */
export class TaskView {
    /**
     * Create a new TaskView
     * @param {Object} app Reference to the main app
     */
    constructor(app) {
        this.app = app;
        
        // Task list containers
        this.elements = {
            ongoingTasksContainer: document.getElementById('ongoing-tasks'),
            completedTasksContainer: document.getElementById('completed-tasks')
        };
        
        // Initialize sub-components
        this.formManager = new TaskFormManager(this);
        this.listRenderer = new TaskListRenderer(this);
        
        // Initialize event listeners for task form elements
        this.formManager.initTaskFormListeners();
        
        // Listen for settings changes
        document.addEventListener('settings-updated', this.handleSettingsUpdate.bind(this));
    }

    /**
     * Format duration in hours and minutes
     * @param {number} durationInHours Duration in hours (decimal)
     * @returns {string} Formatted duration string
     */
    formatDuration(durationInHours) {
        const totalMinutes = Math.round(durationInHours * 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        
        if (hours === 0) {
            return `${minutes} mins`;
        } else if (minutes === 0) {
            return `${hours} hr`;
        } else {
            return `${hours} hr ${minutes} mins`;
        }
    }

    /**
     * Refresh all task lists
     * @param {string} selectedTaskId Optional ID of the selected task for highlighting
     */
    refreshTaskLists(selectedTaskId = null) {
        this.listRenderer.refreshTaskLists(selectedTaskId);
    }

    /**
     * Start a task by ID
     * @param {string} taskId Task ID
     */
    startTask(taskId) {
        if (this.app && this.app.startTask) {
            this.app.startTask(taskId);
        }
    }

    /**
     * Edit a task
     * @param {string} taskId Task ID
     */
    editTask(taskId) {
        const task = this.app.taskController.getTaskById(taskId);
        if (task) {
            this.formManager.showTaskModal(task);
        }
    }

     /**
     * Select a task without starting it
     * @param {string} taskId Task ID
     */
    selectTask(taskId) {
        if (this.app && this.app.selectTask) {
            this.app.selectTask(taskId);
        }
    }

    /**
     * Handle settings updates
     * @param {Event} event Settings updated event
     */
    handleSettingsUpdate(event) {
        // Store the updated settings
        if (event.detail) {
            // Update task form with new defaults next time it's opened
            this.formManager.updateTaskFormDefaults(event.detail);
        }
    }

    /**
     * Format a date string for display
     * @param {string} dateStr Date string in YYYY-MM-DD format
     * @returns {string} Formatted date string
     */
    formatDate(dateStr) {
        if (!dateStr) return '';
        
        const date = new Date(dateStr);
        return date.toLocaleDateString();
    }

    /**
     * Format a time string for display
     * @param {string} timeStr Time string in HH:MM format
     * @returns {string} Formatted time string
     */
    formatTime(timeStr) {
        if (!timeStr) return '';
        
        const [hours, minutes] = timeStr.split(':');
        const h = parseInt(hours);
        const period = h >= 12 ? 'PM' : 'AM';
        const formattedHours = h % 12 === 0 ? 12 : h % 12;
        
        return `${formattedHours}:${minutes} ${period}`;
    }
}