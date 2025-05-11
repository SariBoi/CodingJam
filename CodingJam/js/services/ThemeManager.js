/**
 * ThemeManager.js
 * 
 * Service for managing themes in the Pomodoro app.
 * Handles theme switching, especially during focus/break transitions.
 */

import { StorageManager } from './StorageManager.js';

/**
 * ThemeManager class for handling theme changes
 */
export class ThemeManager {
    /**
     * Create a new ThemeManager
     */
    constructor() {
        this.currentTheme = 'dark'; // Default theme
        this.availableThemes = ['dark', 'light'];
        this.themeTransitionInProgress = false;
        
        // Get theme from settings
        const settings = StorageManager.getSettings();
        if (settings && settings.theme) {
            this.currentTheme = settings.theme;
        }
        
        // Apply initial theme
        this.applyTheme(this.currentTheme);
        
        // Set up event listeners for settings changes
        this.setupSettingsChangeListener();
    }

    /**
     * Apply a theme to the document
     * @param {string} theme Theme name ('dark' or 'light')
     */
    applyTheme(theme) {
        if (!this.availableThemes.includes(theme)) {
            console.warn(`Theme '${theme}' is not available. Using 'dark' instead.`);
            theme = 'dark';
        }
        
        this.currentTheme = theme;
        
        // Update theme CSS link
        const themeCssLink = document.getElementById('theme-css');
        if (themeCssLink) {
            themeCssLink.href = `css/themes/${theme}.css`;
        }
        
        // Update body class
        document.body.classList.remove(...this.availableThemes.map(t => `${t}-theme`));
        document.body.classList.add(`${theme}-theme`);
    }

    /**
     * Get the current theme
     * @returns {string} Current theme name
     */
    getCurrentTheme() {
        return this.currentTheme;
    }

    /**
     * Get the opposite theme
     * @returns {string} Opposite theme name
     */
    getOppositeTheme() {
        return this.currentTheme === 'dark' ? 'light' : 'dark';
    }

    /**
     * Switch to a specific theme
     * @param {string} theme Theme name
     */
    switchTheme(theme) {
        if (theme === this.currentTheme) return;
        
        this.applyTheme(theme);
        
        // Update settings
        const settings = StorageManager.getSettings();
        settings.theme = theme;
        StorageManager.saveSettings(settings);
    }

    /**
     * Toggle between dark and light themes
     */
    toggleTheme() {
        const newTheme = this.getOppositeTheme();
        this.switchTheme(newTheme);
    }

    /**
     * Transition to a theme with animation
     * @param {string} theme Theme to transition to
     */
    transitionToTheme(theme) {
        if (this.themeTransitionInProgress) return;
        
        this.themeTransitionInProgress = true;
        
        // Add transition class
        document.body.classList.add('theme-transition');
        
        // Apply the new theme after a short delay
        setTimeout(() => {
            this.applyTheme(theme);
            
            // Remove transition class after animation completes
            setTimeout(() => {
                document.body.classList.remove('theme-transition');
                this.themeTransitionInProgress = false;
            }, 500);
        }, 50);
    }

    /**
     * Transition to break theme
     * Used when a focus session ends and break begins
     */
    transitionToBreakTheme() {
        const oppositeTheme = this.getOppositeTheme();
        this.transitionToTheme(oppositeTheme);
    }

    /**
     * Transition to focus theme
     * Used when a break ends and focus session begins
     */
    transitionToFocusTheme() {
        // Restore the original theme from settings
        const settings = StorageManager.getSettings();
        this.transitionToTheme(settings.theme);
    }

    /**
     * Flash the screen to indicate a transition
     * @param {string} type Transition type ('focus-to-break' or 'break-to-focus')
     */
    flashTransition(type) {
        // Create flash overlay if it doesn't exist
        let flashOverlay = document.getElementById('theme-flash-overlay');
        
        if (!flashOverlay) {
            flashOverlay = document.createElement('div');
            flashOverlay.id = 'theme-flash-overlay';
            flashOverlay.style.position = 'fixed';
            flashOverlay.style.top = '0';
            flashOverlay.style.left = '0';
            flashOverlay.style.width = '100vw';
            flashOverlay.style.height = '100vh';
            flashOverlay.style.opacity = '0';
            flashOverlay.style.pointerEvents = 'none';
            flashOverlay.style.transition = 'opacity 0.5s ease';
            flashOverlay.style.zIndex = '9999';
            
            document.body.appendChild(flashOverlay);
        }
        
        // Set flash color based on transition type
        if (type === 'focus-to-break') {
            // Transitioning to break - use calming color
            flashOverlay.style.backgroundColor = 'rgba(76, 175, 80, 0.3)'; // Green
        } else {
            // Transitioning to focus - use energizing color
            flashOverlay.style.backgroundColor = 'rgba(33, 150, 243, 0.3)'; // Blue
        }
        
        // Show flash
        flashOverlay.style.opacity = '1';
        
        // Hide flash after animation
        setTimeout(() => {
            flashOverlay.style.opacity = '0';
        }, 500);
    }

    /**
     * Set up listener for settings changes
     */
    setupSettingsChangeListener() {
        document.addEventListener('settings-updated', (e) => {
            if (e.detail && e.detail.theme && e.detail.theme !== this.currentTheme) {
                this.applyTheme(e.detail.theme);
            }
        });
    }
}