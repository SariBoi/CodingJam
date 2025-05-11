/**
 * TaskListRenderer.js
 * 
 * Handles rendering task lists and individual task elements.
 * Manages task list updates and interactions.
 */

import { TaskStatus } from '../../models/Task.js';

/**
 * TaskListRenderer class for rendering task lists
 */
export class TaskListRenderer {
    /**
     * Create a new TaskListRenderer
     * @param {TaskView} taskView Reference to the parent TaskView
     */
    constructor(taskView) {
        this.taskView = taskView;
        this.app = taskView.app;
        this.elements = taskView.elements;
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
            detailsText += `Due: ${this.taskView.formatDate(task.dueDate)}`;
            if (task.dueTime) {
                detailsText += ` at ${this.taskView.formatTime(task.dueTime)}`;
            }
        }
        
        if (task.estimatedDuration) {
            if (detailsText) detailsText += ' | ';
            detailsText += `Duration: ${this.taskView.formatDuration(task.estimatedDuration)}`;
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
                this.taskView.startTask(task.id);
            });
            
            // Edit button
            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-sm btn-outline-primary';
            editBtn.textContent = 'Edit';
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.taskView.editTask(task.id);
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
                this.taskView.selectTask(task.id);
            }
        });
        
        return taskItem;
    }
}