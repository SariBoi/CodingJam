/**
 * TaskFormManager.js
 * 
 * Manages the task form and modal interactions.
 * Handles form validation, data retrieval, and task creation/editing.
 */
const bootstrap = window.bootstrap;
/**
 * TaskFormManager class for handling task form operations
 */
export class TaskFormManager {
    /**
     * Create a new TaskFormManager
     * @param {TaskView} taskView Reference to the parent TaskView
     */
    constructor(taskView) {
        this.taskView = taskView;
        this.app = taskView.app;
        this.updatedSettings = null;
    }

    /**
     * Initialize event listeners for task form elements
     */
    initTaskFormListeners() {
        // All timer preset radio buttons
        const timerPresetRadios = document.querySelectorAll('input[name="timer-preset"]');
        if (timerPresetRadios.length > 0) {
            timerPresetRadios.forEach(radio => {
                radio.addEventListener('change', () => {
                    // Only show custom inputs if custom is selected
                    document.getElementById('custom-timer-inputs').style.display = 
                        document.getElementById('timer-custom').checked ? 'block' : 'none';
                });
            });
        }
        
        // Recurring task toggle
        const taskRecurringCheckbox = document.getElementById('task-recurring');
        if (taskRecurringCheckbox) {
            taskRecurringCheckbox.addEventListener('change', () => {
                document.getElementById('recurring-options').style.display = 
                    taskRecurringCheckbox.checked ? 'block' : 'none';
            });
        }
        
        // Save task button
        const saveTaskBtn = document.getElementById('save-task-btn');
        if (saveTaskBtn) {
            saveTaskBtn.addEventListener('click', () => {
                this.saveTask();
            });
        }
        
        // Add task button
        const addTaskBtn = document.getElementById('add-task-btn');
        if (addTaskBtn) {
            addTaskBtn.addEventListener('click', () => {
                this.showTaskModal();
            });
        }
    }

    /**
     * Update task form defaults based on new settings
     * @param {Object} settings Updated settings
     */
    updateTaskFormDefaults(settings) {
        // Update the task modal's default values
        // This will be applied next time the modal is opened
        this.updatedSettings = settings;
        
        // If the task modal is currently open, update it immediately
        const modal = document.getElementById('task-modal');
        const isModalOpen = modal && modal.classList.contains('show');
        
        if (isModalOpen) {
            this.updateTaskFormWithSettings(settings);
        }
    }

    /**
     * Update task form with settings values
     * @param {Object} settings Settings object
     */
    updateTaskFormWithSettings(settings) {
        // Update timer presets based on settings
        const focusDuration = settings.focusDuration;
        const breakDuration = settings.breakDuration;
        
        // Only update if no task is being edited (if task-id is empty)
        const taskId = document.getElementById('task-id').value;
        if (taskId) return; // Don't update for existing tasks
        
        // Select preset based on settings
        if (focusDuration === 25 && breakDuration === 5) {
            document.getElementById('timer-default').checked = true;
            document.getElementById('custom-timer-inputs').style.display = 'none';
        } else if (focusDuration === 15 && breakDuration === 3) {
            document.getElementById('timer-short').checked = true;
            document.getElementById('custom-timer-inputs').style.display = 'none';
        } else if (focusDuration === 50 && breakDuration === 10) {
            document.getElementById('timer-long').checked = true;
            document.getElementById('custom-timer-inputs').style.display = 'none';
        } else {
            // Use custom timer preset
            document.getElementById('timer-custom').checked = true;
            document.getElementById('custom-timer-inputs').style.display = 'block';
            document.getElementById('custom-focus-time').value = focusDuration;
            document.getElementById('custom-break-time').value = breakDuration;
        }
        
        // Update reminder value based on settings
        this.updateReminderDropdown(settings.defaultReminderTime);
    }

    /**
     * Update the reminder dropdown with default time
     * @param {number|null} defaultReminderTime Default reminder time
     */
    updateReminderDropdown(defaultReminderTime) {
        const reminderSelect = document.getElementById('task-reminder');
        if (!reminderSelect) return;
        
        // Remove the static "Default" option if it exists
        const defaultOption = Array.from(reminderSelect.options).find(opt => opt.value === 'default');
        if (defaultOption) {
            reminderSelect.removeChild(defaultOption);
        }
        
        // Create a new default option with the current setting value
        const newDefaultOption = document.createElement('option');
        newDefaultOption.value = 'default';
        
        // Set appropriate label based on the default reminder time
        if (defaultReminderTime === null) {
            newDefaultOption.textContent = "Default (Don't remind me)";
        } else {
            let timeText;
            if (defaultReminderTime === 60) {
                timeText = "1 hour before";
            } else if (defaultReminderTime === 120) {
                timeText = "2 hours before";
            } else {
                timeText = `${defaultReminderTime} minutes before`;
            }
            newDefaultOption.textContent = `Default (${timeText})`;
        }
        
        // Add the option at the top
        reminderSelect.insertBefore(newDefaultOption, reminderSelect.firstChild);
        
        // Select the default option
        reminderSelect.value = 'default';
    }

    /**
     * Show the task creation/edit modal
     * @param {Object} taskData Optional task data for editing
     */
    showTaskModal(taskData = null) {
        // Get the modal element
        const modal = document.getElementById('task-modal');
        if (!modal) return;
        
        // Get the Bootstrap modal instance
        const modalInstance = bootstrap.Modal.getOrCreateInstance(modal);
        
        // Update modal title
        document.getElementById('task-modal-title').textContent = 
            taskData ? 'Edit Task' : 'Add New Task';
        
        // Clear the form
        document.getElementById('task-form').reset();
        
        // Hide custom options by default
        document.getElementById('custom-timer-inputs').style.display = 'none';
        document.getElementById('recurring-options').style.display = 'none';
            
        // If creating a new task, apply settings defaults
        if (!taskData) {
            // Get settings
            const settings = this.app.settings;
            
            // Check if default focus and break times match a preset
            const focusDuration = settings.focusDuration;
            const breakDuration = settings.breakDuration;
            
            // Select preset based on settings
            if (focusDuration === 25 && breakDuration === 5) {
                document.getElementById('timer-default').checked = true;
            } else if (focusDuration === 15 && breakDuration === 3) {
                document.getElementById('timer-short').checked = true;
            } else if (focusDuration === 50 && breakDuration === 10) {
                document.getElementById('timer-long').checked = true;
            } else {
                // Use custom timer preset
                document.getElementById('timer-custom').checked = true;
                document.getElementById('custom-timer-inputs').style.display = 'block';
                document.getElementById('custom-focus-time').value = focusDuration;
                document.getElementById('custom-break-time').value = breakDuration;
            }
            
            // Set reminder value based on settings
            const reminderSelect = document.getElementById('task-reminder');
            if (settings.defaultReminderTime === null) {
                reminderSelect.value = 'none';
            } else if ([15, 30, 60, 120].includes(settings.defaultReminderTime)) {
                reminderSelect.value = settings.defaultReminderTime.toString();
            } else {
                reminderSelect.value = 'default';
            }
        }
        
        // Fill the form with task data if editing
        if (taskData) {
            document.getElementById('task-id').value = taskData.id;
            document.getElementById('task-name').value = taskData.name;
            
            if (taskData.dueDate) {
                document.getElementById('task-due-date').value = taskData.dueDate;
            }
            
            if (taskData.dueTime) {
                document.getElementById('task-due-time').value = taskData.dueTime;
            }
            
            if (taskData.startDate) {
                document.getElementById('task-start-date').value = taskData.startDate;
            }
            
            if (taskData.startTime) {
                document.getElementById('task-start-time').value = taskData.startTime;
            }
            
            // Split duration into hours and minutes
            const totalHours = taskData.estimatedDuration;
            const hours = Math.floor(totalHours);
            const minutes = Math.round((totalHours - hours) * 60);
            
            document.getElementById('task-duration-hours').value = hours;
            document.getElementById('task-duration-minutes').value = minutes;
            
            document.getElementById('task-priority').value = taskData.priority;
            
            if (taskData.timerSettings?.useCustomTimer) {
                document.getElementById('timer-custom').checked = true;
                document.getElementById('custom-timer-inputs').style.display = 'block';
                document.getElementById('custom-focus-time').value = taskData.timerSettings.focusDuration;
                document.getElementById('custom-break-time').value = taskData.timerSettings.breakDuration;
            } else {
                // Set preset radio button based on timer settings
                const presetMap = {
                    '25-5': 'default',
                    '15-3': 'short',
                    '50-10': 'long'
                };
                
                const presetKey = `${taskData.timerSettings.focusDuration}-${taskData.timerSettings.breakDuration}`;
                const preset = presetMap[presetKey] || 'default';
                
                document.getElementById(`timer-${preset}`).checked = true;
            }
            
            document.getElementById('procrastination-mode').checked = taskData.procrastinationMode;
            
            if (taskData.isRecurring) {
                document.getElementById('task-recurring').checked = true;
                document.getElementById('recurring-options').style.display = 'block';
                
                // Check the appropriate day checkboxes
                taskData.recurringDays.forEach(day => {
                    document.getElementById(`day-${day}`).checked = true;
                });
            }
            
            // Set reminder value
            const reminderSelect = document.getElementById('task-reminder');
            if (taskData.reminderTime === null) {
                reminderSelect.value = 'none';
            } else if (taskData.reminderTime === this.app.settings.defaultReminderTime) {
                reminderSelect.value = 'default';
            } else {
                // Find the closest option
                const options = [15, 30, 60, 120];
                const closest = options.find(op => op === taskData.reminderTime);
                
                if (closest) {
                    reminderSelect.value = closest.toString();
                } else {
                    reminderSelect.value = 'default';
                }
            }
        }
        
        if (!taskData) {
            // Apply any updated settings that were saved while the modal was closed
            const settings = this.updatedSettings || (this.app.settings ? this.app.settings.toObject() : null);

            if (settings) {
                this.updateTaskFormWithSettings(settings);
            }
        }

        // Show the modal
        modalInstance.show();
    }

    /**
     * Save a task from the modal form
     */
    saveTask() {
        // Get form values
        const taskId = document.getElementById('task-id').value;
        const name = document.getElementById('task-name').value;
        const dueDate = document.getElementById('task-due-date').value;
        const dueTime = document.getElementById('task-due-time').value;
        const startDate = document.getElementById('task-start-date').value;
        const startTime = document.getElementById('task-start-time').value;
        
        // Get duration from hours and minutes inputs
        const durationHours = parseFloat(document.getElementById('task-duration-hours').value) || 0;
        const durationMinutes = parseFloat(document.getElementById('task-duration-minutes').value) || 0;
        const duration = durationHours + (durationMinutes / 60); // Convert to hours
        
        const priority = document.getElementById('task-priority').value;
        
        // Validate required fields
        if (!name) {
            alert('Task name is required');
            return;
        }
        
        if (durationHours === 0 && durationMinutes === 0) {
            alert('Please enter a valid duration (at least 1 minute)');
            return;
        }
        
        // Get timer settings
        const timerPreset = document.querySelector('input[name="timer-preset"]:checked').value;
        let focusDuration, breakDuration, useCustomTimer;
        
        if (timerPreset === 'custom') {
            useCustomTimer = true;
            focusDuration = parseInt(document.getElementById('custom-focus-time').value);
            breakDuration = parseInt(document.getElementById('custom-break-time').value);
            
            // Validate custom timer values
            if (isNaN(focusDuration) || focusDuration <= 0 || 
                isNaN(breakDuration) || breakDuration <= 0) {
                alert('Please enter valid focus and break durations');
                return;
            }
        } else {
            useCustomTimer = false;
            
            // Set durations based on preset
            switch (timerPreset) {
                case 'short':
                    focusDuration = 15;
                    breakDuration = 3;
                    break;
                case 'long':
                    focusDuration = 50;
                    breakDuration = 10;
                    break;
                default: // default
                    focusDuration = 25;
                    breakDuration = 5;
                    break;
            }
        }
        
        // Get reminder setting
        const reminderValue = document.getElementById('task-reminder').value;
        let reminderTime;
        
        if (reminderValue === 'none') {
            reminderTime = null;
        } else if (reminderValue === 'default') {
            reminderTime = this.app.settings.defaultReminderTime;
        } else {
            reminderTime = parseInt(reminderValue);
        }
        
        // Get other options
        const procrastinationMode = document.getElementById('procrastination-mode').checked;
        const isRecurring = document.getElementById('task-recurring').checked;
        
        // Get recurring days if applicable
        const recurringDays = [];
        if (isRecurring) {
            for (let i = 0; i < 7; i++) {
                if (document.getElementById(`day-${i}`).checked) {
                    recurringDays.push(i);
                }
            }
            
            // Validate recurring days
            if (recurringDays.length === 0) {
                alert('Please select at least one day for recurring tasks');
                return;
            }
        }
        
        // Create task data object
        const taskData = {
            name,
            dueDate: dueDate || null,
            dueTime: dueTime || null,
            startDate: startDate || null,
            startTime: startTime || null,
            estimatedDuration: duration,
            priority,
            timerSettings: {
                focusDuration,
                breakDuration,
                useCustomTimer
            },
            reminderTime,
            procrastinationMode,
            isRecurring,
            recurringDays
        };
        
        // Create or update task
        if (taskId) {
            this.app.taskController.updateTask(taskId, taskData);
        } else {
            this.app.taskController.createTask(taskData);
        }
        
        // Refresh task lists
        this.taskView.refreshTaskLists();
        
        // Refresh the calendar if it exists
        if (this.app.calendarController) {
            this.app.calendarController.refreshCalendar();
        }
        
        // Close the modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('task-modal'));
        if (modal) {
            modal.hide();
        }
    }
}