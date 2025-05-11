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
    // Modified initTaskFormListeners method with more reliable event binding
    initTaskFormListeners() {
        console.log('Setting up task form event listeners');
        
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
        
        // Save task button - directly attach the handler in a more reliable way
        const saveTaskBtn = document.getElementById('save-task-btn');
        if (saveTaskBtn) {
            console.log('Found save task button, attaching click handler');
            
            // Remove any existing click handlers to avoid duplicates
            saveTaskBtn.removeEventListener('click', this.saveTaskHandler);
            
            // Create a bound handler function and store it
            this.saveTaskHandler = this.saveTask.bind(this);
            
            // Add the new handler
            saveTaskBtn.addEventListener('click', this.saveTaskHandler);
        } else {
            console.warn('Save task button not found in the DOM');
        }
        
        // Add task button
        const addTaskBtn = document.getElementById('add-task-btn');
        if (addTaskBtn) {
            addTaskBtn.addEventListener('click', () => {
                this.showTaskModal();
            });
        }
        
        // Timer preset radio buttons
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
        
        console.log('Task form event listeners setup complete');
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
            // Set form fields with task data
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
            
            // Set timer settings
            if (taskData.timerSettings?.useCustomTimer) {
                document.getElementById('timer-custom').checked = true;
                document.getElementById('custom-timer-inputs').style.display = 'block';
                document.getElementById('custom-focus-time').value = taskData.timerSettings.focusDuration;
                document.getElementById('custom-break-time').value = taskData.timerSettings.breakDuration;
            } else {
                // Set preset radio button based on timer settings
                const focusDuration = taskData.timerSettings.focusDuration;
                const breakDuration = taskData.timerSettings.breakDuration;
                
                if (focusDuration === 25 && breakDuration === 5) {
                    document.getElementById('timer-default').checked = true;
                } else if (focusDuration === 15 && breakDuration === 3) {
                    document.getElementById('timer-short').checked = true;
                } else if (focusDuration === 50 && breakDuration === 10) {
                    document.getElementById('timer-long').checked = true;
                } else {
                    // Use custom timer preset for any non-standard settings
                    document.getElementById('timer-custom').checked = true;
                    document.getElementById('custom-timer-inputs').style.display = 'block';
                    document.getElementById('custom-focus-time').value = focusDuration;
                    document.getElementById('custom-break-time').value = breakDuration;
                }
            }
            
            document.getElementById('procrastination-mode').checked = taskData.procrastinationMode;
            
            if (taskData.isRecurring) {
                document.getElementById('task-recurring').checked = true;
                document.getElementById('recurring-options').style.display = 'block';
                
                // Check the appropriate day checkboxes
                if (taskData.recurringDays && taskData.recurringDays.length > 0) {
                    taskData.recurringDays.forEach(day => {
                        const checkbox = document.getElementById(`day-${day}`);
                        if (checkbox) checkbox.checked = true;
                    });
                }
            }
            
            // Set reminder value
            const reminderSelect = document.getElementById('task-reminder');
            if (taskData.reminderTime === null) {
                reminderSelect.value = 'none';
            } else if (taskData.reminderTime === this.app.settings.defaultReminderTime) {
                reminderSelect.value = 'default';
            } else if ([15, 30, 60, 120].includes(taskData.reminderTime)) {
                // Find the option that matches the reminder time
                reminderSelect.value = taskData.reminderTime.toString();
            } else {
                // Default to "default" if no match
                reminderSelect.value = 'default';
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
    // Modified saveTask method with better debugging and error handling
    saveTask() {
        console.log('Save Task button clicked');
        
        try {
            // Get common form values
            const taskId = document.getElementById('task-id').value;
            console.log('Task ID:', taskId);
            
            const name = document.getElementById('task-name').value.trim();
            const dueDate = document.getElementById('task-due-date').value;
            const dueTime = document.getElementById('task-due-time').value;
            const startDate = document.getElementById('task-start-date').value;
            const startTime = document.getElementById('task-start-time').value;

            const durationHours = parseFloat(document.getElementById('task-duration-hours').value) || 0;
            const durationMinutes = parseFloat(document.getElementById('task-duration-minutes').value) || 0;
            const estimatedDuration = durationHours + (durationMinutes / 60); // Convert to hours

            const priority = document.getElementById('task-priority').value;

            // --- VALIDATIONS ---
            if (!name) {
                alert('Task name is required.');
                return;
            }
            if (estimatedDuration <= 0) {
                alert('Please enter a valid estimated duration (at least 1 minute).');
                return;
            }

            // Get timer settings
            const timerPreset = document.querySelector('input[name="timer-preset"]:checked').value;
            let focusDuration, breakDuration, useCustomTimer;

            if (timerPreset === 'custom') {
                useCustomTimer = true;
                focusDuration = parseInt(document.getElementById('custom-focus-time').value);
                breakDuration = parseInt(document.getElementById('custom-break-time').value);

                if (isNaN(focusDuration) || focusDuration <= 0 || isNaN(breakDuration) || breakDuration <= 0) {
                    alert('Please enter valid custom focus and break durations (must be greater than 0).');
                    return;
                }
            } else {
                useCustomTimer = false;
                switch (timerPreset) {
                    case 'short':
                        focusDuration = 15; breakDuration = 3; break;
                    case 'long':
                        focusDuration = 50; breakDuration = 10; break;
                    default: // 'default'
                        focusDuration = 25; breakDuration = 5; break;
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

            const procrastinationMode = document.getElementById('procrastination-mode').checked;
            const isRecurring = document.getElementById('task-recurring').checked;
            const recurringDays = [];
            if (isRecurring) {
                for (let i = 0; i < 7; i++) {
                    if (document.getElementById(`day-${i}`).checked) {
                        recurringDays.push(i);
                    }
                }
                if (recurringDays.length === 0) {
                    alert('Please select at least one day for recurring tasks.');
                    return;
                }
            }

            // --- Construct taskData object ---
            const taskData = {
                name,
                dueDate: dueDate || null,
                dueTime: dueTime || null,
                startDate: startDate || null,
                startTime: startTime || null,
                estimatedDuration: estimatedDuration,
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

            console.log('Task data to save:', taskData);

            // --- Handle Task Creation or Update ---
            if (taskId) {
                // Editing an existing task
                console.log('Updating existing task with ID:', taskId);
                const originalTask = this.app.taskController.getTaskById(taskId);

                if (originalTask && originalTask.status === 'ongoing') {
                    const confirmMsg = 'Changing focus or break times for an ongoing task will restart the current timer session with the new durations. Continue?';
                    const originalTimerSettings = originalTask.timerSettings;
                    const newTimerSettings = taskData.timerSettings;

                    if (newTimerSettings.focusDuration !== originalTimerSettings.focusDuration ||
                        newTimerSettings.breakDuration !== originalTimerSettings.breakDuration) {
                        if (!confirm(confirmMsg)) {
                            return; // User cancelled
                        }
                    }
                }
                
                // Actually update the task
                const updatedTask = this.app.taskController.updateTask(taskId, taskData);
                console.log('Task updated:', updatedTask);
            } else {
                // Creating a new task
                console.log('Creating new task');
                const createdTask = this.app.taskController.createTask(taskData);
                console.log('Task created:', createdTask);
            }

            // Refresh UI
            this.taskView.refreshTaskLists();
            if (this.app.calendarController) {
                this.app.calendarController.refreshCalendar();
            }

            // Close the modal
            const modalElement = document.getElementById('task-modal');
            if (modalElement) {
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) {
                    console.log('Closing modal');
                    modal.hide();
                } else {
                    console.warn('Could not get Bootstrap modal instance');
                }
            } else {
                console.warn('Modal element not found');
            }
            
            console.log('Save task operation completed successfully');
        } catch (error) {
            // Catch and log any errors that might be preventing the save
            console.error('Error in saveTask method:', error);
            alert('An error occurred while saving the task: ' + error.message);
        }
    }
}