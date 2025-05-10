/**
 * app.js
 * 
 * Main application entry point.
 * Initializes all controllers and components.
 */

import { StorageManager } from './services/StorageManager.js';
import { Settings } from './models/Settings.js';
import { TaskController } from './controllers/TaskController.js';
import { TimerController } from './controllers/TimerController.js';
import { CalendarController } from './controllers/CalendarController.js';
import { NotificationService } from './services/NotificationService.js';
import { ReminderService } from './services/ReminderService.js';
import { TaskView } from './views/TaskView.js';
import { TimerView } from './views/TimerView.js';
import { SettingsView } from './views/SettingsView.js';
import { AnalyticsService } from './services/AnalyticsService.js';
import { FocusModeManager } from './services/FocusModeManager.js';
import { RecurringTaskManager } from './services/RecurringTaskManager.js';
import { ThemeManager } from './services/ThemeManager.js';
import { ErrorHandler } from './services/ErrorHandler.js';

/**
 * Main App class
 */
class App {
    constructor() {
        // Check if localStorage is available
        if (!StorageManager.isAvailable()) {
            this.showStorageError();
            return;
        }
        
        // Initialize error handler
        this.errorHandler = new ErrorHandler();
        
        // Initialize settings
        this.initSettings();
        
        // Initialize controllers
        this.taskController = new TaskController();
        this.notificationService = new NotificationService();

        // Initialize views
        this.taskView = new TaskView(this);
        this.timerView = new TimerView(this);
        this.settingsView = new SettingsView(this);
        
        // Initialize controllers that depend on views
        this.timerController = new TimerController(this.taskController, this.notificationService, this.timerView);
        this.calendarController = new CalendarController(this.taskController);
        this.reminderService = new ReminderService(this.taskController, this.notificationService);
        
        // Initialize additional services
        this.analyticsService = new AnalyticsService();
        this.focusModeManager = new FocusModeManager();
        this.recurringTaskManager = new RecurringTaskManager(this.taskController);
        this.themeManager = new ThemeManager();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize UI
        this.initUI();
        
        // Initialize recurring tasks
        this.recurringTaskManager.checkAndScheduleRecurringTasks();
        
        console.log('Pomodoro Scheduler App initialized');
    }

    /**
     * Initialize settings
     */
    initSettings() {
        const storedSettings = StorageManager.getSettings();
        this.settings = new Settings(storedSettings);
        
        // Apply theme
        this.settings.applyTheme();
    }

    /**
     * Initialize UI
     */
    initUI() {
        // Update settings form with current values
        this.updateSettingsForm();
        
        // Load and display tasks
        this.refreshTaskLists();
        
        // Set up sidebar tabs
        this.setupSidebarTabs();
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Settings form
        const settingsForm = document.getElementById('settings-form');
        if (settingsForm) {
            settingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveSettings();
            });
        }
    }

    /**
     * Set up sidebar tabs
     */
    setupSidebarTabs() {
        const tabs = document.querySelectorAll('.sidebar-tab');
        const contents = document.querySelectorAll('.sidebar-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs
                tabs.forEach(t => t.classList.remove('active'));
                
                // Add active class to clicked tab
                tab.classList.add('active');
                
                // Hide all content sections
                contents.forEach(content => content.classList.add('hidden'));
                
                // Show the corresponding content
                const tabId = tab.dataset.tab;
                document.getElementById(`${tabId}-tab`).classList.remove('hidden');
            });
        });
    }

    /**
     * Refresh task lists
     */
    refreshTaskLists() {
        // Use TaskView to refresh tasks
        if (this.taskView) {
            this.taskView.refreshTaskLists();
        }
    }

    /**
     * Update settings form with current values
     */
    updateSettingsForm() {
        if (this.settingsView) {
            this.settingsView.updateSettingsForm();
        }
    }

    /**
     * Save settings from the form
     */
    saveSettings() {
        if (this.settingsView) {
            this.settingsView.saveSettings();
        }
    }

    /**
     * Show storage error message
     */
    showStorageError() {
        document.body.innerHTML = `
            <div class="container mt-5">
                <div class="alert alert-danger">
                    <h4>Storage Error</h4>
                    <p>This app requires localStorage to function properly, but it appears to be disabled or unavailable in your browser.</p>
                    <p>Please enable cookies and localStorage, or try a different browser.</p>
                </div>
            </div>
        `;
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

    /**
     * Start a task by ID
     * @param {string} taskId Task ID
     */
    startTask(taskId) {
        // Check if a task is already active
        const activeTask = this.timerController.activeTask;
        
        // Get the task to start
        const task = this.taskController.getTaskById(taskId);
        if (!task) return;
        
        // Check if starting this task would interrupt a higher priority task
        if (activeTask && activeTask.status === 'ongoing') {
            const higherPriorityTask = this.taskController.checkForHigherPriorityTask(task);
            
            if (higherPriorityTask && higherPriorityTask.id !== activeTask.id) {
                // Ask the user if they want to switch to a lower priority task
                if (!confirm(`There is a higher priority task (${higherPriorityTask.name}) that should be worked on first. Do you still want to start this task?`)) {
                    return;
                }
            }
        }
        
        // Set the active task in the timer controller
        const success = this.timerController.setActiveTask(task);
        
        if (success) {
            // Start the timer
            this.timerController.startTimer();
            
            // Refresh the task lists
            this.refreshTaskLists();
            
            // Refresh the calendar
            this.calendarController.refreshCalendar();
        }
    }
}

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
