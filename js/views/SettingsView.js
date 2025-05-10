/**
 * SettingsView.js
 * 
 * View component for managing application settings.
 * Handles rendering and updating settings UI.
 */

import { StorageManager } from '../services/StorageManager.js';
import { Settings } from '../models/Settings.js';
import { ThemeManager } from '../services/ThemeManager.js';

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
        
        // Theme settings
        const themeRadios = this.settingsForm.querySelectorAll('input[name="theme"]');
        themeRadios.forEach(radio => {
            radio.checked = radio.value === this.settings.theme;
        });
        
        // Timer durations
        const focusDurationSelect = document.getElementById('default-focus-time');
        const breakDurationSelect = document.getElementById('default-break-time');
        
        if (focusDurationSelect) {
            // Try to find matching option or set to custom
            const focusOption = [...focusDurationSelect.options].find(opt => 
                parseInt(opt.value) === this.settings.focusDuration
            );
            
            if (focusOption) {
                focusDurationSelect.value = focusOption.value;
            } else {
                focusDurationSelect.value = 'custom';
                // Add a custom focus duration field if needed
                this.showCustomDurationField('focus', this.settings.focusDuration);
            }
        }
        
        if (breakDurationSelect) {
            // Try to find matching option or set to custom
            const breakOption = [...breakDurationSelect.options].find(opt => 
                parseInt(opt.value) === this.settings.breakDuration
            );
            
            if (breakOption) {
                breakDurationSelect.value = breakOption.value;
            } else {
                breakDurationSelect.value = 'custom';
                // Add a custom break duration field if needed
                this.showCustomDurationField('break', this.settings.breakDuration);
            }
        }
        
        // Active hours
        const activeHoursStart = document.getElementById('active-hours-start');
        const activeHoursEnd = document.getElementById('active-hours-end');
        
        if (activeHoursStart) {
            activeHoursStart.value = this.settings.activeHours.start;
        }
        
        if (activeHoursEnd) {
            activeHoursEnd.value = this.settings.activeHours.end;
        }
        
        // Ensure all time options are populated for active hours
        this.populateTimeOptions();
        
        // Default reminder time
        const reminderTimeSelect = document.getElementById('default-reminder-time');
        if (reminderTimeSelect) {
            const reminderOption = [...reminderTimeSelect.options].find(opt => 
                parseInt(opt.value) === this.settings.defaultReminderTime
            );
            
            if (reminderOption) {
                reminderTimeSelect.value = reminderOption.value;
            } else {
                reminderTimeSelect.value = 'custom';
                // Add a custom reminder time field if needed
                this.showCustomReminderField(this.settings.defaultReminderTime);
            }
        }
        
        // Add auto-start next session option
        this.addAutoStartOption();
        
        // Add auto-pause option
        this.addAutoPauseOption();
        
        // Add notification settings
        this.addNotificationSettings();
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
        
        // Custom duration toggle for focus time
        const focusDurationSelect = document.getElementById('default-focus-time');
        if (focusDurationSelect) {
            focusDurationSelect.addEventListener('change', () => {
                if (focusDurationSelect.value === 'custom') {
                    this.showCustomDurationField('focus');
                } else {
                    this.hideCustomDurationField('focus');
                }
            });
        }
        
        // Custom duration toggle for break time
        const breakDurationSelect = document.getElementById('default-break-time');
        if (breakDurationSelect) {
            breakDurationSelect.addEventListener('change', () => {
                if (breakDurationSelect.value === 'custom') {
                    this.showCustomDurationField('break');
                } else {
                    this.hideCustomDurationField('break');
                }
            });
        }
        
        // Custom reminder time toggle
        const reminderTimeSelect = document.getElementById('default-reminder-time');
        if (reminderTimeSelect) {
            reminderTimeSelect.addEventListener('change', () => {
                if (reminderTimeSelect.value === 'custom') {
                    this.showCustomReminderField();
                } else {
                    this.hideCustomReminderField();
                }
            });
        }
    }
    
    /**
     * Populate time options for active hours selects
     */
    populateTimeOptions() {
        const startSelect = document.getElementById('active-hours-start');
        const endSelect = document.getElementById('active-hours-end');
        
        if (!startSelect || !endSelect) return;
        
        // Clear existing options
        startSelect.innerHTML = '';
        endSelect.innerHTML = '';
        
        // Add options for every 30 minutes
        for (let hour = 0; hour < 24; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                const displayTime = this.formatTimeForDisplay(time);
                
                const startOption = document.createElement('option');
                startOption.value = time;
                startOption.textContent = displayTime;
                startSelect.appendChild(startOption);
                
                const endOption = document.createElement('option');
                endOption.value = time;
                endOption.textContent = displayTime;
                endSelect.appendChild(endOption);
            }
        }
        
        // Set selected values
        startSelect.value = this.settings.activeHours.start;
        endSelect.value = this.settings.activeHours.end;
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
     * Show custom duration input field
     * @param {string} type 'focus' or 'break'
     * @param {number} value Initial value
     */
    showCustomDurationField(type, value = null) {
        const containerId = `custom-${type}-container`;
        const fieldId = `custom-${type}-value`;
        
        // Check if container already exists
        let container = document.getElementById(containerId);
        
        if (!container) {
            // Create container
            container = document.createElement('div');
            container.id = containerId;
            container.className = 'mt-2';
            
            // Create input group
            container.innerHTML = `
                <div class="input-group input-group-sm">
                    <input type="number" class="form-control" id="${fieldId}" 
                           min="1" max="120" value="${value || ''}" required>
                    <span class="input-group-text">minutes</span>
                </div>
            `;
            
            // Insert after select
            const select = document.getElementById(`default-${type}-time`);
            if (select) {
                select.parentNode.insertBefore(container, select.nextSibling);
            }
        } else if (value) {
            // Update existing field value
            document.getElementById(fieldId).value = value;
        }
        
        // Show the container
        container.style.display = 'block';
    }
    
    /**
     * Hide custom duration input field
     * @param {string} type 'focus' or 'break'
     */
    hideCustomDurationField(type) {
        const container = document.getElementById(`custom-${type}-container`);
        if (container) {
            container.style.display = 'none';
        }
    }
    
    /**
     * Show custom reminder time input field
     * @param {number} value Initial value
     */
    showCustomReminderField(value = null) {
        const containerId = 'custom-reminder-container';
        const fieldId = 'custom-reminder-value';
        
        // Check if container already exists
        let container = document.getElementById(containerId);
        
        if (!container) {
            // Create container
            container = document.createElement('div');
            container.id = containerId;
            container.className = 'mt-2';
            
            // Create input group
            container.innerHTML = `
                <div class="input-group input-group-sm">
                    <input type="number" class="form-control" id="${fieldId}" 
                           min="1" max="1440" value="${value || ''}" required>
                    <span class="input-group-text">minutes before</span>
                </div>
            `;
            
            // Insert after select
            const select = document.getElementById('default-reminder-time');
            if (select) {
                select.parentNode.insertBefore(container, select.nextSibling);
            }
        } else if (value) {
            // Update existing field value
            document.getElementById(fieldId).value = value;
        }
        
        // Show the container
        container.style.display = 'block';
    }
    
    /**
     * Hide custom reminder time input field
     */
    hideCustomReminderField() {
        const container = document.getElementById('custom-reminder-container');
        if (container) {
            container.style.display = 'none';
        }
    }
    
    /**
     * Add auto-start next session option to settings form
     */
    addAutoStartOption() {
        // Check if the option already exists
        if (document.getElementById('auto-start-next-session')) {
            // Just update the value
            document.getElementById('auto-start-next-session').checked = 
                this.settings.autoStartNextSession || false;
            return;
        }
        
        // Create the option group
        const group = document.createElement('div');
        group.className = 'form-group mt-4';
        
        // Create label
        const label = document.createElement('label');
        label.textContent = 'Timer Behavior';
        group.appendChild(label);
        
        // Create check option
        const checkDiv = document.createElement('div');
        checkDiv.className = 'form-check mt-2';
        checkDiv.innerHTML = `
            <input class="form-check-input" type="checkbox" id="auto-start-next-session" 
                   ${this.settings.autoStartNextSession ? 'checked' : ''}>
            <label class="form-check-label" for="auto-start-next-session">
                Auto-start next session after completion
            </label>
        `;
        group.appendChild(checkDiv);
        
        // Add to form
        this.settingsForm.insertBefore(group, this.settingsForm.querySelector('button[type="submit"]').parentNode);
    }
    
    /**
     * Add auto-pause option to settings form
     */
    addAutoPauseOption() {
        // Check if the option already exists
        if (document.getElementById('auto-pause-inactive')) {
            // Just update the value
            document.getElementById('auto-pause-inactive').checked = 
                this.settings.autoPauseOnInactiveTab !== false; // Default to true
            return;
        }
        
        // Get the timer behavior group or create it
        let group = Array.from(this.settingsForm.querySelectorAll('label')).find(
            label => label.textContent.includes('Timer Behavior')
        );
        
        group = group.parentNode;
        
        // Create check option
        const checkDiv = document.createElement('div');
        checkDiv.className = 'form-check mt-2';
        checkDiv.innerHTML = `
            <input class="form-check-input" type="checkbox" id="auto-pause-inactive" 
                   ${this.settings.autoPauseOnInactiveTab !== false ? 'checked' : ''}>
            <label class="form-check-label" for="auto-pause-inactive">
                Auto-pause when tab is inactive
            </label>
        `;
        group.appendChild(checkDiv);
    }
    
    /**
     * Add notification settings to settings form
     */
    addNotificationSettings() {
        // Check if the section already exists
        if (document.getElementById('notification-settings-section')) {
            // Just update the values
            document.getElementById('notifications-enabled').checked = 
                this.settings.notifications?.enabled !== false; // Default to true
            document.getElementById('notifications-sound').checked = 
                this.settings.notifications?.sound !== false; // Default to true
            return;
        }
        
        // Create the section
        const section = document.createElement('div');
        section.id = 'notification-settings-section';
        section.className = 'form-group mt-4';
        
        // Create heading
        const heading = document.createElement('label');
        heading.textContent = 'Notifications';
        section.appendChild(heading);
        
        // Create notification options
        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'mt-2';
        
        // Enabled option
        const enabledDiv = document.createElement('div');
        enabledDiv.className = 'form-check';
        enabledDiv.innerHTML = `
            <input class="form-check-input" type="checkbox" id="notifications-enabled" 
                   ${this.settings.notifications?.enabled !== false ? 'checked' : ''}>
            <label class="form-check-label" for="notifications-enabled">
                Enable notifications
            </label>
        `;
        optionsDiv.appendChild(enabledDiv);
        
        // Sound option
        const soundDiv = document.createElement('div');
        soundDiv.className = 'form-check';
        soundDiv.innerHTML = `
            <input class="form-check-input" type="checkbox" id="notifications-sound" 
                   ${this.settings.notifications?.sound !== false ? 'checked' : ''}>
            <label class="form-check-label" for="notifications-sound">
                Play sound with notifications
            </label>
        `;
        optionsDiv.appendChild(soundDiv);
        
        // Request permission button
        const permissionDiv = document.createElement('div');
        permissionDiv.className = 'mt-2';
        
        const permissionBtn = document.createElement('button');
        permissionBtn.type = 'button';
        permissionBtn.className = 'btn btn-sm btn-outline-secondary';
        permissionBtn.textContent = 'Request Notification Permission';
        permissionBtn.addEventListener('click', this.requestNotificationPermission.bind(this));
        
        permissionDiv.appendChild(permissionBtn);
        optionsDiv.appendChild(permissionDiv);
        
        section.appendChild(optionsDiv);
        
        // Add to form
        this.settingsForm.insertBefore(section, this.settingsForm.querySelector('button[type="submit"]').parentNode);
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
        
        // Get focus duration
        let focusDuration;
        const focusSelect = document.getElementById('default-focus-time');
        if (focusSelect.value === 'custom') {
            focusDuration = parseInt(document.getElementById('custom-focus-value').value);
        } else {
            focusDuration = parseInt(focusSelect.value);
        }
        
        // Get break duration
        let breakDuration;
        const breakSelect = document.getElementById('default-break-time');
        if (breakSelect.value === 'custom') {
            breakDuration = parseInt(document.getElementById('custom-break-value').value);
        } else {
            breakDuration = parseInt(breakSelect.value);
        }
        
        // Get active hours
        const activeHoursStart = document.getElementById('active-hours-start').value;
        const activeHoursEnd = document.getElementById('active-hours-end').value;
        
        // Get default reminder time
        let defaultReminderTime;
        const reminderSelect = document.getElementById('default-reminder-time');
        if (reminderSelect.value === 'custom') {
            defaultReminderTime = parseInt(document.getElementById('custom-reminder-value').value);
        } else {
            defaultReminderTime = parseInt(reminderSelect.value);
        }
        
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
        
        // Dispatch event for other components to update
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