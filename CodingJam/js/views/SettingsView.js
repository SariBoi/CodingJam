/**
 * SettingsView.js
 * 
 * Core view component for managing application settings.
 * Handles rendering and updating settings UI.
 */

import { StorageManager } from '../services/StorageManager.js';
import { Settings } from '../models/Settings.js';
import { ThemeManager } from '../services/ThemeManager.js';
import { SettingsFormManager } from './settings/SettingsFormManager.js';
import { SettingsUIComponents } from './settings/SettingsUIComponents.js';

/**
 * SettingsView class for managing settings UI
 */
export class SettingsView {
    /**
     * Create a new SettingsView
     * @param {Object} app Reference to the main app
     */
    constructor(app) {
        this.app = app;
        this.themeManager = new ThemeManager();
        this.settings = null;
        
        // Settings form element
        this.settingsForm = document.getElementById('settings-form');
        
        // Initialize form manager and UI components
        this.formManager = new SettingsFormManager(this);
        this.uiComponents = new SettingsUIComponents(this);
        
        // Initialize settings
        this.loadSettings();
        
        // Set up event listeners
        this.setupEventListeners();
    }

    /**
     * Load settings from storage
     */
    loadSettings() {
        const storedSettings = StorageManager.getSettings();
        this.settings = new Settings(storedSettings);
        
        // Update form with current values
        this.updateSettingsForm();
    }

    /**
     * Update settings form with current values
     */
    updateSettingsForm() {
        if (!this.settingsForm) return;
        
        // Update theme settings
        const themeRadios = this.settingsForm.querySelectorAll('input[name="theme"]');
        themeRadios.forEach(radio => {
            radio.checked = radio.value === this.settings.theme;
        });
        
        // Update timer durations using form manager
        this.formManager.updateTimerDurations(this.settings);
        
        // Update active hours
        this.formManager.updateActiveHours(this.settings);
        
        // Ensure all time options are populated for active hours
        this.formManager.populateTimeOptions();
        
        // Update reminder settings
        this.formManager.updateReminderSettings(this.settings);
        
        // Add auto-start next session option
        this.uiComponents.addAutoStartOption(this.settings);
        
        // Add auto-pause option
        this.uiComponents.addAutoPauseOption(this.settings);
        
        // Add notification settings
        this.uiComponents.addNotificationSettings(this.settings);
    }
    
    /**
     * Set up event listeners for settings controls
     */
    setupEventListeners() {
        if (!this.settingsForm) return;
        
        // Form submission
        this.settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSettings();
        });
        
        // Theme change
        const themeRadios = this.settingsForm.querySelectorAll('input[name="theme"]');
        themeRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                if (radio.checked) {
                    this.themeManager.switchTheme(radio.value);
                }
            });
        });
        
        // Set up form-related event listeners
        this.formManager.setupFormEventListeners();
    }
    
    /**
     * Format time string for display
     * @param {string} timeStr Time string in HH:MM format
     * @returns {string} Formatted time string
     */
    formatTimeForDisplay(timeStr) {
        if (!timeStr) return '';
        
        const [hours, minutes] = timeStr.split(':');
        const h = parseInt(hours);
        const period = h >= 12 ? 'PM' : 'AM';
        const formattedHours = h % 12 === 0 ? 12 : h % 12;
        
        return `${formattedHours}:${minutes} ${period}`;
    }
    
    /**
     * Request notification permission
     */
    requestNotificationPermission() {
        if (!("Notification" in window)) {
            alert("This browser does not support desktop notifications");
            return;
        }
        
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                new Notification("Notifications Enabled", {
                    body: "You will now receive notifications from Pomodoro Scheduler",
                    icon: "/assets/icons/favicon.ico"
                });
            }
        });
    }
    
    /**
     * Save settings from form
     */
    saveSettings() {
        // Get form values
        const theme = document.querySelector('input[name="theme"]:checked').value;
        
        // Get focus and break durations from form manager
        const { focusDuration, breakDuration } = this.formManager.getDurations();
        
        // Get active hours
        const activeHoursStart = document.getElementById('active-hours-start').value;
        const activeHoursEnd = document.getElementById('active-hours-end').value;
        
        // Get default reminder time from form manager
        const defaultReminderTime = this.formManager.getReminderTime();
        
        // Get auto settings
        const autoStartNextSession = document.getElementById('auto-start-next-session').checked;
        const autoPauseOnInactiveTab = document.getElementById('auto-pause-inactive').checked;
        
        // Get notification settings
        const notificationsEnabled = document.getElementById('notifications-enabled').checked;
        const notificationsSound = document.getElementById('notifications-sound').checked;
        
        // Update settings
        this.settings.theme = theme;
        this.settings.focusDuration = focusDuration;
        this.settings.breakDuration = breakDuration;
        this.settings.activeHours = {
            start: activeHoursStart,
            end: activeHoursEnd
        };
        this.settings.defaultReminderTime = defaultReminderTime;
        this.settings.autoStartNextSession = autoStartNextSession;
        this.settings.autoPauseOnInactiveTab = autoPauseOnInactiveTab;
        
        // Update notifications settings
        this.settings.notifications = {
            ...(this.settings.notifications || {}),
            enabled: notificationsEnabled,
            sound: notificationsSound
        };
        
        // Save to storage
        StorageManager.saveSettings(this.settings.toObject());
        
        // Apply theme
        this.themeManager.applyTheme(theme);
        
        // Dispatch event for other components to update - with detailed settings data
        document.dispatchEvent(new CustomEvent('settings-updated', {
            detail: this.settings.toObject()
        }));
        
        // Show success message
        this.showSettingsSavedMessage();
    }
    
    /**
     * Show settings saved message
     */
    showSettingsSavedMessage() {
        // Create toast message if it doesn't exist
        let toast = document.getElementById('settings-saved-toast');
        
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'settings-saved-toast';
            toast.className = 'toast-message';
            toast.style.position = 'fixed';
            toast.style.bottom = '20px';
            toast.style.right = '20px';
            toast.style.backgroundColor = '#198754';
            toast.style.color = 'white';
            toast.style.padding = '10px 20px';
            toast.style.borderRadius = '5px';
            toast.style.zIndex = '9999';
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s ease';
            
            document.body.appendChild(toast);
        }
        
        // Set message
        toast.textContent = 'Settings saved successfully!';
        
        // Show toast
        toast.style.opacity = '1';
        
        // Hide after 3 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
        }, 3000);
    }
    
    /**
     * Reset settings to defaults
     */
    resetToDefaults() {
        if (confirm('Are you sure you want to reset all settings to defaults?')) {
            // Create default settings
            this.settings = new Settings();
            
            // Save to storage
            StorageManager.saveSettings(this.settings.toObject());
            
            // Update form
            this.updateSettingsForm();
            
            // Apply theme
            this.themeManager.applyTheme(this.settings.theme);
            
            // Show success message
            this.showSettingsSavedMessage();
        }
    }
    
    /**
     * Initialize the settings page by adding a reset button
     */
    initSettingsPage() {
        // Check if we already added the reset button
        if (document.getElementById('reset-settings-btn')) {
            return;
        }
        
        // Find submit button container
        const submitBtnContainer = this.settingsForm.querySelector('.form-group:last-child');
        
        if (submitBtnContainer) {
            // Add reset button
            const resetBtn = document.createElement('button');
            resetBtn.id = 'reset-settings-btn';
            resetBtn.type = 'button';
            resetBtn.className = 'btn btn-outline-danger ms-2';
            resetBtn.textContent = 'Reset to Defaults';
            resetBtn.addEventListener('click', this.resetToDefaults.bind(this));
            
            // Add to container
            submitBtnContainer.querySelector('button').after(resetBtn);
        }
    }
}