/**
 * SettingsFormManager.js
 * 
 * Handles form-related operations for the settings view.
 * Manages form field updates, validation, and data retrieval.
 */

export class SettingsFormManager {
    /**
     * Create a new SettingsFormManager
     * @param {SettingsView} settingsView Reference to the parent SettingsView
     */
    constructor(settingsView) {
        this.settingsView = settingsView;
        this.settingsForm = settingsView.settingsForm;
    }
    
    /**
     * Set up form-related event listeners
     */
    setupFormEventListeners() {
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
     * Update timer duration fields with values from settings
     * @param {Settings} settings Settings object
     */
    updateTimerDurations(settings) {
        const focusDurationSelect = document.getElementById('default-focus-time');
        const breakDurationSelect = document.getElementById('default-break-time');
        
        if (focusDurationSelect) {
            // Try to find matching option or set to custom
            const focusOption = [...focusDurationSelect.options].find(opt => 
                parseInt(opt.value) === settings.focusDuration
            );
            
            if (focusOption) {
                focusDurationSelect.value = focusOption.value;
            } else {
                focusDurationSelect.value = 'custom';
                // Add a custom focus duration field if needed
                this.showCustomDurationField('focus', settings.focusDuration);
            }
        }
        
        if (breakDurationSelect) {
            // Try to find matching option or set to custom
            const breakOption = [...breakDurationSelect.options].find(opt => 
                parseInt(opt.value) === settings.breakDuration
            );
            
            if (breakOption) {
                breakDurationSelect.value = breakOption.value;
            } else {
                breakDurationSelect.value = 'custom';
                // Add a custom break duration field if needed
                this.showCustomDurationField('break', settings.breakDuration);
            }
        }
    }
    
    /**
     * Update active hours fields with values from settings
     * @param {Settings} settings Settings object
     */
    updateActiveHours(settings) {
        const activeHoursStart = document.getElementById('active-hours-start');
        const activeHoursEnd = document.getElementById('active-hours-end');
        
        if (activeHoursStart) {
            activeHoursStart.value = settings.activeHours.start;
        }
        
        if (activeHoursEnd) {
            activeHoursEnd.value = settings.activeHours.end;
        }
    }
    
    /**
     * Update reminder settings with values from settings
     * @param {Settings} settings Settings object
     */
    updateReminderSettings(settings) {
        const reminderTimeSelect = document.getElementById('default-reminder-time');
        if (reminderTimeSelect) {
            // Add "Don't remind me" option if it doesn't exist
            let noneOption = Array.from(reminderTimeSelect.options).find(opt => opt.value === 'none');
            if (!noneOption) {
                noneOption = document.createElement('option');
                noneOption.value = 'none';
                noneOption.textContent = "Don't remind me";
                reminderTimeSelect.appendChild(noneOption);
            }
            
            // Now set the selected value
            if (settings.defaultReminderTime === null) {
                reminderTimeSelect.value = 'none';
            } else {
                const reminderOption = [...reminderTimeSelect.options].find(opt => 
                    parseInt(opt.value) === settings.defaultReminderTime
                );
                
                if (reminderOption) {
                    reminderTimeSelect.value = reminderOption.value;
                } else {
                    reminderTimeSelect.value = 'custom';
                    this.showCustomReminderField(settings.defaultReminderTime);
                }
            }
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
                const displayTime = this.settingsView.formatTimeForDisplay(time);
                
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
        startSelect.value = this.settingsView.settings.activeHours.start;
        endSelect.value = this.settingsView.settings.activeHours.end;
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
     * Get focus and break durations from form
     * @returns {Object} Object with focusDuration and breakDuration
     */
    getDurations() {
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
        
        return { focusDuration, breakDuration };
    }
    
    /**
     * Get reminder time from form
     * @returns {number|null} Reminder time in minutes or null if disabled
     */
    getReminderTime() {
        // Get default reminder time
        let defaultReminderTime;
        const reminderSelect = document.getElementById('default-reminder-time');
        if (reminderSelect.value === 'none') {
            defaultReminderTime = null;
        } else if (reminderSelect.value === 'custom') {
            defaultReminderTime = parseInt(document.getElementById('custom-reminder-value').value);
        } else {
            defaultReminderTime = parseInt(reminderSelect.value);
        }
        
        return defaultReminderTime;
    }
}