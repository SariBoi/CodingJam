/**
 * CalendarEventHandler.js
 * 
 * Handles event listeners and user interactions for the Calendar.
 */

/**
 * CalendarEventHandler class for handling calendar interactions
 */
export class CalendarEventHandler {
    /**
     * Create a new CalendarEventHandler
     * @param {CalendarController} controller Reference to the CalendarController
     */
    constructor(controller) {
        this.controller = controller;
    }

    /**
     * Set up event listeners for calendar controls
     */
    setupEventListeners() {
        const elements = this.controller.elements;
        
        // View toggle buttons
        if (elements.dailyViewBtn) {
            elements.dailyViewBtn.addEventListener('click', () => {
                this.controller.setView('daily');
            });
        }
        
        if (elements.weeklyViewBtn) {
            elements.weeklyViewBtn.addEventListener('click', () => {
                this.controller.setView('weekly');
            });
        }
        
        // Navigation buttons
        if (elements.prevWeekBtn) {
            elements.prevWeekBtn.addEventListener('click', () => {
                this.controller.navigateWeek(-1);
            });
        }
        
        if (elements.nextWeekBtn) {
            elements.nextWeekBtn.addEventListener('click', () => {
                this.controller.navigateWeek(1);
            });
        }
        
        // Quick navigation buttons
        if (elements.todayBtn) {
            elements.todayBtn.addEventListener('click', () => {
                this.controller.goToToday();
            });
        }
        
        if (elements.thisWeekBtn) {
            elements.thisWeekBtn.addEventListener('click', () => {
                this.controller.goToThisWeek();
            });
        }
        
        if (elements.nextWeekBtn2) {
            elements.nextWeekBtn2.addEventListener('click', () => {
                this.controller.goToNextWeek();
            });
        }
        
        // Add keyboard navigation
        this.setupKeyboardNavigation();
        
        // Add touch gestures if supported
        if ('ontouchstart' in window) {
            this.setupTouchGestures();
        }
    }
    
    /**
     * Set up keyboard navigation
     */
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Only process if focus is not in an input or form element
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || 
                e.target.tagName === 'SELECT' || e.target.isContentEditable) {
                return;
            }
            
            // Check if calendar tab is active
            const calendarTab = document.querySelector('.sidebar-tab[data-tab="calendar"]');
            if (!calendarTab || !calendarTab.classList.contains('active')) {
                return;
            }
            
            switch (e.key) {
                case 'ArrowLeft':
                    // Previous day/week
                    if (this.controller.currentView === 'daily') {
                        this.goToPreviousDay();
                    } else {
                        this.controller.navigateWeek(-1);
                    }
                    break;
                    
                case 'ArrowRight':
                    // Next day/week
                    if (this.controller.currentView === 'daily') {
                        this.goToNextDay();
                    } else {
                        this.controller.navigateWeek(1);
                    }
                    break;
                    
                case 'Home':
                    // Go to today
                    this.controller.goToToday();
                    break;
                    
                case 't':
                    // Today
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.controller.goToToday();
                    }
                    break;
                    
                case 'd':
                    // Daily view
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.controller.setView('daily');
                    }
                    break;
                    
                case 'w':
                    // Weekly view
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.controller.setView('weekly');
                    }
                    break;
            }
        });
    }
    
    /**
     * Set up touch gestures for navigation
     */
    setupTouchGestures() {
        const calendarContainer = this.controller.elements.container;
        if (!calendarContainer) return;
        
        let touchStartX = 0;
        let touchStartY = 0;
        
        calendarContainer.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });
        
        calendarContainer.addEventListener('touchend', (e) => {
            if (!e.changedTouches || !e.changedTouches[0]) return;
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const diffX = touchEndX - touchStartX;
            const diffY = touchEndY - touchStartY;
            
            // Only process horizontal swipes that are significant and more horizontal than vertical
            if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
                if (diffX > 0) {
                    // Swipe right - go to previous day/week
                    if (this.controller.currentView === 'daily') {
                        this.goToPreviousDay();
                    } else {
                        this.controller.navigateWeek(-1);
                    }
                } else {
                    // Swipe left - go to next day/week
                    if (this.controller.currentView === 'daily') {
                        this.goToNextDay();
                    } else {
                        this.controller.navigateWeek(1);
                    }
                }
            }
        }, { passive: true });
    }
    
    /**
     * Go to the previous day
     */
    goToPreviousDay() {
        if (this.controller.currentView !== 'daily') return;
        
        const newDate = new Date(this.controller.currentDate);
        newDate.setDate(newDate.getDate() - 1);
        this.controller.currentDate = newDate;
        this.controller.renderCalendar();
    }
    
    /**
     * Go to the next day
     */
    goToNextDay() {
        if (this.controller.currentView !== 'daily') return;
        
        const newDate = new Date(this.controller.currentDate);
        newDate.setDate(newDate.getDate() + 1);
        this.controller.currentDate = newDate;
        this.controller.renderCalendar();
    }
}