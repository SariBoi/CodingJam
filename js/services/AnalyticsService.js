/**
 * AnalyticsService.js
 * 
 * Service for tracking and analyzing productivity data.
 * Handles tracking of completed sessions, time spent, and analysis of user productivity.
 */

import { StorageManager } from './StorageManager.js';

/**
 * AnalyticsService class for tracking productivity statistics
 */
export class AnalyticsService {
    /**
     * Create a new AnalyticsService
     */
    constructor() {
        // Load analytics data from storage
        this.analytics = StorageManager.getAnalytics();
    }

    /**
     * Record completion of a Pomodoro session
     * @param {Object} task Task object
     * @param {Object} session Session object
     * @param {boolean} wasFocus Whether it was a focus session
     */
    recordSessionCompletion(task, session, wasFocus) {
        // Get today's date string
        const today = new Date().toISOString().split('T')[0];
        
        // Initialize analytics objects if needed
        this.analytics.completedSessions = this.analytics.completedSessions || 0;
        this.analytics.totalFocusTime = this.analytics.totalFocusTime || 0;
        this.analytics.totalBreakTime = this.analytics.totalBreakTime || 0;
        this.analytics.dailyStats = this.analytics.dailyStats || {};
        this.analytics.dailyStats[today] = this.analytics.dailyStats[today] || {
            focusTime: 0,
            breakTime: 0,
            sessions: 0,
            tasks: new Set()
        };
        
        // Update general stats
        this.analytics.completedSessions++;
        
        // Update session type specific stats
        if (wasFocus) {
            this.analytics.totalFocusTime += session.duration;
            this.analytics.dailyStats[today].focusTime += session.duration;
        } else {
            this.analytics.totalBreakTime += session.duration;
            this.analytics.dailyStats[today].breakTime += session.duration;
        }
        
        // Update daily stats
        this.analytics.dailyStats[today].sessions++;
        this.analytics.dailyStats[today].tasks.add(task.id);
        
        // Save to storage
        StorageManager.saveAnalytics(this.analytics);
    }

    /**
     * Record completion of a task
     * @param {Object} task Completed task
     * @param {boolean} onTime Whether completed by due date
     */
    recordTaskCompletion(task, onTime = true) {
        // Initialize if needed
        this.analytics.completedTasks = this.analytics.completedTasks || 0;
        this.analytics.timeEstimationAccuracy = this.analytics.timeEstimationAccuracy || [];
        
        // Update completed tasks count
        this.analytics.completedTasks++;
        
        // Calculate time estimation accuracy
        const estimatedTime = task.estimatedDuration * 60; // Convert to minutes
        const actualTime = task.progress.timeSpent;
        const accuracy = (actualTime / estimatedTime) * 100;
        
        // Add to time estimation accuracy history
        this.analytics.timeEstimationAccuracy.push({
            taskId: task.id,
            taskName: task.name,
            estimatedTime,
            actualTime,
            accuracy,
            timestamp: new Date().toISOString()
        });
        
        // Trim history if it gets too long
        if (this.analytics.timeEstimationAccuracy.length > 50) {
            this.analytics.timeEstimationAccuracy = 
                this.analytics.timeEstimationAccuracy.slice(-50);
        }
        
        // Save to storage
        StorageManager.saveAnalytics(this.analytics);
    }

    /**
     * Record abandonment of a Pomodoro session
     * @param {Object} task Task object
     * @param {Object} session Session object
     * @param {number} timeSpent Time spent in minutes
     */
    recordSessionAbandonment(task, session, timeSpent) {
        // Initialize if needed
        this.analytics.abandonedSessions = this.analytics.abandonedSessions || 0;
        
        // Update abandoned sessions count
        this.analytics.abandonedSessions++;
        
        // Save to storage
        StorageManager.saveAnalytics(this.analytics);
    }

    /**
     * Get productivity summary for a specific date range
     * @param {string} startDate Start date (YYYY-MM-DD)
     * @param {string} endDate End date (YYYY-MM-DD)
     * @returns {Object} Productivity summary object
     */
    getProductivitySummary(startDate, endDate) {
        const summary = {
            totalFocusTime: 0,
            totalBreakTime: 0,
            completedSessions: 0,
            completedTasks: 0,
            averageAccuracy: 0,
            dailyBreakdown: {}
        };
        
        // Create array of all dates in range
        const dates = this.getDatesInRange(startDate, endDate);
        
        // Get stats for each date
        dates.forEach(date => {
            const dailyStats = this.analytics.dailyStats[date];
            
            if (dailyStats) {
                summary.totalFocusTime += dailyStats.focusTime;
                summary.totalBreakTime += dailyStats.breakTime;
                summary.completedSessions += dailyStats.sessions;
                summary.completedTasks += dailyStats.tasks.size;
                
                summary.dailyBreakdown[date] = {
                    focusTime: dailyStats.focusTime,
                    breakTime: dailyStats.breakTime,
                    sessions: dailyStats.sessions,
                    tasks: dailyStats.tasks.size
                };
            } else {
                summary.dailyBreakdown[date] = {
                    focusTime: 0,
                    breakTime: 0,
                    sessions: 0,
                    tasks: 0
                };
            }
        });
        
        // Calculate average time estimation accuracy
        const accuracyEntries = this.analytics.timeEstimationAccuracy.filter(entry => {
            const entryDate = entry.timestamp.split('T')[0];
            return entryDate >= startDate && entryDate <= endDate;
        });
        
        if (accuracyEntries.length > 0) {
            const totalAccuracy = accuracyEntries.reduce((sum, entry) => sum + entry.accuracy, 0);
            summary.averageAccuracy = totalAccuracy / accuracyEntries.length;
        }
        
        return summary;
    }

    /**
     * Get array of all dates in a range
     * @param {string} startDate Start date (YYYY-MM-DD)
     * @param {string} endDate End date (YYYY-MM-DD)
     * @returns {Array} Array of date strings
     */
    getDatesInRange(startDate, endDate) {
        const dates = [];
        const currentDate = new Date(startDate);
        const endDateObj = new Date(endDate);
        
        while (currentDate <= endDateObj) {
            dates.push(currentDate.toISOString().split('T')[0]);
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return dates;
    }

    /**
     * Get time estimation accuracy statistics
     * @returns {Object} Accuracy statistics
     */
    getAccuracyStats() {
        if (!this.analytics.timeEstimationAccuracy || 
            this.analytics.timeEstimationAccuracy.length === 0) {
            return {
                average: 0,
                trend: 'neutral',
                history: []
            };
        }
        
        // Calculate average accuracy
        const totalAccuracy = this.analytics.timeEstimationAccuracy.reduce(
            (sum, entry) => sum + entry.accuracy, 0
        );
        const averageAccuracy = totalAccuracy / this.analytics.timeEstimationAccuracy.length;
        
        // Determine trend (improving, worsening, or neutral)
        let trend = 'neutral';
        if (this.analytics.timeEstimationAccuracy.length >= 5) {
            const recentEntries = this.analytics.timeEstimationAccuracy.slice(-5);
            const recentAccuracy = recentEntries.reduce(
                (sum, entry) => sum + entry.accuracy, 0
            ) / recentEntries.length;
            
            const olderEntries = this.analytics.timeEstimationAccuracy.slice(-10, -5);
            if (olderEntries.length > 0) {
                const olderAccuracy = olderEntries.reduce(
                    (sum, entry) => sum + entry.accuracy, 0
                ) / olderEntries.length;
                
                const percentChange = ((recentAccuracy - olderAccuracy) / olderAccuracy) * 100;
                if (percentChange > 5) {
                    trend = 'improving';
                } else if (percentChange < -5) {
                    trend = 'worsening';
                }
            }
        }
        
        return {
            average: averageAccuracy,
            trend,
            history: this.analytics.timeEstimationAccuracy.map(entry => ({
                taskName: entry.taskName,
                accuracy: entry.accuracy,
                date: entry.timestamp.split('T')[0]
            }))
        };
    }
}