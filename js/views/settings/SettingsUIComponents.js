/**
 * SettingsUIComponents.js
 * 
 * Creates and manages UI components for the settings view.
 * Responsible for rendering settings UI elements dynamically.
 */

export class SettingsUIComponents {
    /**
     * Create a new SettingsUIComponents
     * @param {SettingsView} settingsView Reference to the parent SettingsView
     */
    constructor(settingsView) {
        this.settingsView = settingsView;
        this.settingsForm = settingsView.settingsForm;
    }
    
    /**
     * Add auto-start next session option to settings form
     * @param {Settings} settings Settings object
     */
    addAutoStartOption(settings) {
        // Check if the option already exists
        if (document.getElementById('auto-start-next-session')) {
            // Just update the value
            document.getElementById('auto-start-next-session').checked = 
                settings.autoStartNextSession || false;
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
                   ${settings.autoStartNextSession ? 'checked' : ''}>
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
     * @param {Settings} settings Settings object
     */
    addAutoPauseOption(settings) {
        // Check if the option already exists
        if (document.getElementById('auto-pause-inactive')) {
            // Just update the value
            document.getElementById('auto-pause-inactive').checked = 
                settings.autoPauseOnInactiveTab !== false; // Default to true
            return;
        }
        
        // Get the timer behavior group or create it
        let group = Array.from(this.settingsForm.querySelectorAll('label')).find(
            label => label.textContent.includes('Timer Behavior')
        );
        
        if (!group) {
            return; // Can't find the group, auto-start option might not be added yet
        }
        
        group = group.parentNode;
        
        // Create check option
        const checkDiv = document.createElement('div');
        checkDiv.className = 'form-check mt-2';
        checkDiv.innerHTML = `
            <input class="form-check-input" type="checkbox" id="auto-pause-inactive" 
                   ${settings.autoPauseOnInactiveTab !== false ? 'checked' : ''}>
            <label class="form-check-label" for="auto-pause-inactive">
                Auto-pause when tab is inactive
            </label>
        `;
        group.appendChild(checkDiv);
    }
    
    /**
     * Add notification settings to settings form
     * @param {Settings} settings Settings object
     */
    addNotificationSettings(settings) {
        // Check if the section already exists
        if (document.getElementById('notification-settings-section')) {
            // Just update the values
            document.getElementById('notifications-enabled').checked = 
                settings.notifications?.enabled !== false; // Default to true
            document.getElementById('notifications-sound').checked = 
                settings.notifications?.sound !== false; // Default to true
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
                   ${settings.notifications?.enabled !== false ? 'checked' : ''}>
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
                   ${settings.notifications?.sound !== false ? 'checked' : ''}>
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
        permissionBtn.addEventListener('click', this.settingsView.requestNotificationPermission.bind(this.settingsView));
        
        permissionDiv.appendChild(permissionBtn);
        optionsDiv.appendChild(permissionDiv);
        
        section.appendChild(optionsDiv);
        
        // Add to form
        this.settingsForm.insertBefore(section, this.settingsForm.querySelector('button[type="submit"]').parentNode);
    }
}