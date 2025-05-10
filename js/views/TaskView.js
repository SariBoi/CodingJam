/**
 * TaskView.js
 * 
 * View component for rendering task lists and handling task interactions.
 */

import { TaskStatus, TaskPriority } from '../models/Task.js';

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
        
        // Initialize event listeners for task form elements
        this.initTaskFormListeners();
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
        // Only proceed if containers exist
        if (!this.elements.ongoingTasksContainer || !this.elements.completedTasksContainer) {
            return;
        }
        
        // Get currently selected task ID if not provided
        if (!selectedTaskId && this.app && this.app.timerController) {
            const activeTask = this.app.timerController.activeTask;
            if (activeTask) {
                selectedTaskId = activeTask.id;
            }
        }
        
        // Clear containers
        this.elements.ongoingTasksContainer.innerHTML = '';
        this.elements.completedTasksContainer.innerHTML = '';
        
        // Get tasks from controller
        const pendingTasks = this.app.taskController.getPendingTasks();
        const activeAndPartialTasks = this.app.taskController.getActiveAndPartialTasks();
        const completedTasks = this.app.taskController.getCompletedTasks();
        
        // Display pending and active tasks
        const ongoingTasks = [...activeAndPartialTasks, ...pendingTasks];
        
        if (ongoingTasks.length === 0) {
            this.elements.ongoingTasksContainer.innerHTML = `
                <div class="empty-state">
                    <p>Damn you're free, maybe get busy?</p>
                </div>
            `;
        } else {
            ongoingTasks.forEach(task => {
                const taskElement = this.createTaskElement(task);
                
                // Add selected class if this is the selected task
                if (selectedTaskId && task.id === selectedTaskId) {
                    taskElement.classList.add('task-selected');
                }
                
                this.elements.ongoingTasksContainer.appendChild(taskElement);
            });
        }
        
        // Display completed tasks
        if (completedTasks.length === 0) {
            this.elements.completedTasksContainer.innerHTML = `
                <div class="empty-state">
                    <p>No completed tasks yet.</p>
                </div>
            `;
        } else {
            completedTasks.forEach(task => {
                this.elements.completedTasksContainer.appendChild(this.createTaskElement(task, true));
            });
        }
    }

    /**
     * Create a task list element
     * @param {Object} task Task object
     * @param {boolean} isCompleted Whether this is for the completed list
     * @returns {HTMLElement} Task element
     */
    createTaskElement(task, isCompleted = false) {
        const taskItem = document.createElement('div');
        taskItem.className = 'task-item';
        taskItem.dataset.id = task.id;
        
        // Add status-specific class
        if (task.status === TaskStatus.MISSED) {
            taskItem.classList.add('task-missed');
        } else if (task.status === TaskStatus.PARTIAL) {
            taskItem.classList.add('task-partial');
        }
        
        // Create task header
        const taskHeader = document.createElement('div');
        taskHeader.className = 'task-item-header';
        
        const taskName = document.createElement('div');
        taskName.className = 'task-item-name';
        taskName.textContent = task.name;
        
        const taskPriority = document.createElement('div');
        taskPriority.className = `task-item-priority priority-${task.priority}`;
        taskPriority.textContent = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
        
        taskHeader.appendChild(taskName);
        taskHeader.appendChild(taskPriority);
        
        // Create task details
        const taskDetails = document.createElement('div');
        taskDetails.className = 'task-item-details';
        
        let detailsText = '';
        
        if (task.dueDate) {
            detailsText += `Due: ${this.formatDate(task.dueDate)}`;
            if (task.dueTime) {
                detailsText += ` at ${this.formatTime(task.dueTime)}`;
            }
        }
        
        if (task.estimatedDuration) {
            if (detailsText) detailsText += ' | ';
            detailsText += `Duration: ${this.formatDuration(task.estimatedDuration)}`;
        }
        
        taskDetails.textContent = detailsText;
        
        // Create progress indicator for ongoing tasks
        const taskProgress = document.createElement('div');
        taskProgress.className = 'task-item-progress';
        
        if (task.progress && task.progress.totalSessions > 0) {
            const percentage = task.getCompletionPercentage();
            taskProgress.textContent = `Progress: ${task.progress.completedSessions}/${task.progress.totalSessions} sessions (${percentage}%)`;
        }
        
        // Create action buttons
        const taskActions = document.createElement('div');
        taskActions.className = 'task-item-actions';
        
        if (isCompleted) {
            // Button to unmark as completed
            const unmarkBtn = document.createElement('button');
            unmarkBtn.className = 'btn btn-sm btn-outline-secondary';
            unmarkBtn.textContent = 'Unmark as Completed';
            unmarkBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.app.taskController.unmarkCompletedTask(task.id);
                this.refreshTaskLists();
                
                // Refresh the calendar if it exists
                if (this.app.calendarController) {
                    this.app.calendarController.refreshCalendar();
                }
            });
            
            taskActions.appendChild(unmarkBtn);
        } else {
            // Start button
            const startBtn = document.createElement('button');
            startBtn.className = 'btn btn-sm btn-success';
            startBtn.textContent = 'Start';
            startBtn.disabled = task.status === TaskStatus.ONGOING;
            startBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.startTask(task.id);
            });
            
            // Edit button
            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-sm btn-outline-primary';
            editBtn.textContent = 'Edit';
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.editTask(task.id);
            });
            
            // Delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-sm btn-outline-danger';
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this task?')) {
                    this.app.taskController.deleteTask(task.id);
                    this.refreshTaskLists();
                    
                    // Refresh the calendar if it exists
                    if (this.app.calendarController) {
                        this.app.calendarController.refreshCalendar();
                    }
                }
            });
            
            taskActions.appendChild(startBtn);
            taskActions.appendChild(editBtn);
            taskActions.appendChild(deleteBtn);
        }
        
        // Assemble task item
        taskItem.appendChild(taskHeader);
        taskItem.appendChild(taskDetails);
        taskItem.appendChild(taskProgress);
        taskItem.appendChild(taskActions);
        
        // Add click handler to show task details
        taskItem.addEventListener('click', (e) => {
            // Don't select if clicking on a button in the task
            if (e.target.tagName !== 'BUTTON') {
                this.selectTask(task.id);
            }
        });
        
        return taskItem;
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
            this.showTaskModal(task);
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
        this.refreshTaskLists();
        
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