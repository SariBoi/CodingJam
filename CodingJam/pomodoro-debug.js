/**
 * pomodoro-debug.js
 * 
 * Debug utility script to diagnose GitHub Pages issues with Pomodoro app
 * This script performs step-by-step diagnostics and reports issues
 */

// Create debug UI
function createDebugUI() {
    const debugContainer = document.createElement('div');
    debugContainer.id = 'debug-container';
    debugContainer.style.position = 'fixed';
    debugContainer.style.top = '0';
    debugContainer.style.left = '0';
    debugContainer.style.width = '100%';
    debugContainer.style.backgroundColor = 'rgba(0,0,0,0.8)';
    debugContainer.style.color = 'white';
    debugContainer.style.padding = '10px';
    debugContainer.style.fontSize = '14px';
    debugContainer.style.zIndex = '9999';
    debugContainer.style.maxHeight = '80vh';
    debugContainer.style.overflow = 'auto';
    
    const heading = document.createElement('h2');
    heading.textContent = 'Pomodoro App Debug';
    heading.style.fontSize = '16px';
    heading.style.marginBottom = '10px';
    debugContainer.appendChild(heading);
    
    const logContainer = document.createElement('div');
    logContainer.id = 'debug-log';
    debugContainer.appendChild(logContainer);
    
    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Toggle Debug Panel';
    toggleButton.style.position = 'fixed';
    toggleButton.style.top = '10px';
    toggleButton.style.right = '10px';
    toggleButton.style.zIndex = '10000';
    toggleButton.style.padding = '5px 10px';
    toggleButton.onclick = () => {
        if (debugContainer.style.display === 'none') {
            debugContainer.style.display = 'block';
            toggleButton.textContent = 'Hide Debug Panel';
        } else {
            debugContainer.style.display = 'none';
            toggleButton.textContent = 'Show Debug Panel';
        }
    };
    
    document.body.appendChild(debugContainer);
    document.body.appendChild(toggleButton);
    
    return logContainer;
}

// Log a debug message
function logDebug(message, status = 'info') {
    const logContainer = document.getElementById('debug-log');
    
    if (!logContainer) return;
    
    const msgElement = document.createElement('div');
    msgElement.className = `debug-message debug-${status}`;
    msgElement.style.marginBottom = '5px';
    msgElement.style.padding = '5px';
    msgElement.style.borderLeft = `3px solid ${getStatusColor(status)}`;
    
    const timestamp = new Date().toLocaleTimeString();
    msgElement.textContent = `[${timestamp}] ${message}`;
    
    logContainer.appendChild(msgElement);
    
    // Also log to console
    console.log(`[DEBUG - ${status}] ${message}`);
    
    return msgElement;
}

// Get color for status
function getStatusColor(status) {
    switch (status) {
        case 'success': return '#4caf50';
        case 'error': return '#f44336';
        case 'warning': return '#ff9800';
        default: return '#2196f3';
    }
}

// Test basic HTML/JS connectivity
function testBasicConnectivity() {
    logDebug('Starting basic connectivity test...', 'info');
    try {
        if (document.readyState === 'complete') {
            logDebug('✓ Document fully loaded', 'success');
        } else {
            logDebug('⚠ Document not fully loaded - unexpected behavior may occur', 'warning');
        }
        
        if (window.jQuery) {
            logDebug('✓ jQuery detected: v' + window.jQuery.fn.jquery, 'success');
        } else {
            logDebug('ℹ jQuery not detected - this is OK if you\'re not using it', 'info');
        }
        
        if (window.bootstrap) {
            logDebug('✓ Bootstrap JS detected', 'success');
        } else {
            logDebug('⚠ Bootstrap JS not detected - UI components may not work', 'warning');
        }
        
        return true;
    } catch (error) {
        logDebug('✗ Basic connectivity test failed: ' + error.message, 'error');
        return false;
    }
}

// Test if DOM elements exist
function testDOMElements() {
    logDebug('Testing critical DOM elements...', 'info');
    
    const criticalElements = [
        { id: 'timer-container', description: 'Timer container' },
        { id: 'timer-clock', description: 'Timer clock display' },
        { id: 'timer-start-btn', description: 'Timer start button' },
        { id: 'task-form', description: 'Task form' },
        { id: 'add-task-btn', description: 'Add task button' },
        { id: 'ongoing-tasks', description: 'Ongoing tasks container' },
        { id: 'settings-form', description: 'Settings form' }
    ];
    
    let missingElements = 0;
    
    criticalElements.forEach(element => {
        const domElement = document.getElementById(element.id);
        if (domElement) {
            logDebug(`✓ Found ${element.description} (${element.id})`, 'success');
        } else {
            logDebug(`✗ Missing ${element.description} (${element.id})`, 'error');
            missingElements++;
        }
    });
    
    if (missingElements === 0) {
        logDebug('All critical DOM elements found', 'success');
        return true;
    } else {
        logDebug(`${missingElements} critical DOM elements missing`, 'error');
        return false;
    }
}

// Test localStorage functionality
function testLocalStorage() {
    logDebug('Testing localStorage functionality...', 'info');
    
    try {
        // Test basic functionality
        localStorage.setItem('pomodoro_test', 'test_value');
        const testValue = localStorage.getItem('pomodoro_test');
        localStorage.removeItem('pomodoro_test');
        
        if (testValue === 'test_value') {
            logDebug('✓ localStorage basic functionality working', 'success');
        } else {
            logDebug('✗ localStorage read/write test failed', 'error');
            return false;
        }
        
        // Test JSON serialization
        const testObject = { test: 'value', number: 123 };
        localStorage.setItem('pomodoro_test_json', JSON.stringify(testObject));
        const retrievedJson = localStorage.getItem('pomodoro_test_json');
        localStorage.removeItem('pomodoro_test_json');
        
        try {
            const parsedObject = JSON.parse(retrievedJson);
            if (parsedObject.test === testObject.test && parsedObject.number === testObject.number) {
                logDebug('✓ localStorage JSON serialization working', 'success');
            } else {
                logDebug('✗ localStorage JSON values don\'t match', 'error');
                return false;
            }
        } catch (e) {
            logDebug('✗ localStorage JSON parsing failed: ' + e.message, 'error');
            return false;
        }
        
        // Check if app is already using localStorage
        let existingData = false;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('pomodoro_')) {
                existingData = true;
                logDebug(`ℹ Found existing app data: ${key}`, 'info');
            }
        }
        
        if (!existingData) {
            logDebug('ℹ No existing app data found in localStorage', 'info');
        }
        
        return true;
        
    } catch (error) {
        logDebug('✗ localStorage test failed: ' + error.message, 'error');
        if (error.name === 'SecurityError') {
            logDebug('⚠ localStorage blocked by browser security policy (using private browsing?)', 'warning');
        }
        return false;
    }
}

// Test ES6 module imports
async function testModuleImports() {
    logDebug('Testing ES6 module imports...', 'info');
    
    const modules = [
        { path: './js/app.js', name: 'Main App' },
        { path: './js/models/Task.js', name: 'Task Model' },
        { path: './js/models/Settings.js', name: 'Settings Model' },
        { path: './js/services/StorageManager.js', name: 'Storage Manager' },
        { path: './js/controllers/TaskController.js', name: 'Task Controller' },
        { path: './js/controllers/TimerController.js', name: 'Timer Controller' }
    ];
    
    let successCount = 0;
    
    for (const module of modules) {
        try {
            const moduleResult = await import(module.path)
                .catch(e => {
                    throw e;
                });
            
            if (moduleResult) {
                logDebug(`✓ Successfully imported ${module.name} (${module.path})`, 'success');
                successCount++;
                
                // List exports for verification
                const exports = Object.keys(moduleResult);
                if (exports.length > 0) {
                    logDebug(`  └ Exports: ${exports.join(', ')}`, 'info');
                } else {
                    logDebug(`  └ No named exports found`, 'warning');
                }
            }
        } catch (error) {
            logDebug(`✗ Failed to import ${module.name} (${module.path}): ${error.message}`, 'error');
            
            // Give more helpful error messages for common issues
            if (error.message.includes('Failed to fetch')) {
                logDebug(`  └ This likely means the file doesn't exist at this path`, 'error');
            } else if (error.message.includes('unexpected token')) {
                logDebug(`  └ This likely means the file has syntax errors`, 'error');
            } else if (error.message.includes('module specifier')) {
                logDebug(`  └ This likely means there's an import path issue inside the module`, 'error');
            }
        }
    }
    
    if (successCount === modules.length) {
        logDebug('All modules imported successfully', 'success');
        return true;
    } else {
        logDebug(`${successCount}/${modules.length} modules imported successfully`, 'warning');
        return false;
    }
}

// Examine app.js and find import statements
async function analyzeImportPaths() {
    logDebug('Analyzing import paths...', 'info');
    
    try {
        const response = await fetch('./js/app.js');
        if (!response.ok) {
            logDebug(`✗ Failed to fetch app.js: ${response.status} ${response.statusText}`, 'error');
            return false;
        }
        
        const appJsText = await response.text();
        
        // Extract import statements
        const importRegex = /import\s+(?:{[^}]+}|\w+)\s+from\s+['"]([^'"]+)['"]/g;
        let match;
        const importPaths = [];
        
        while ((match = importRegex.exec(appJsText)) !== null) {
            importPaths.push(match[1]);
        }
        
        if (importPaths.length === 0) {
            logDebug('No import statements found in app.js', 'warning');
            return false;
        }
        
        logDebug(`Found ${importPaths.length} import paths in app.js:`, 'info');
        
        // Test each import path
        for (const path of importPaths) {
            try {
                const absolutePath = path.startsWith('./') ? path : `./js/${path}`;
                const response = await fetch(absolutePath);
                
                if (response.ok) {
                    logDebug(`✓ ${path} - File exists`, 'success');
                } else {
                    logDebug(`✗ ${path} - File not found (${response.status})`, 'error');
                    logDebug(`  Alternative paths to try:`, 'info');
                    const alternatives = [
                        path.replace('./', '/'),
                        `/js/${path.replace('./', '')}`,
                        `/${path}`
                    ];
                    for (const alt of alternatives) {
                        logDebug(`  - ${alt}`, 'info');
                    }
                }
            } catch (error) {
                logDebug(`✗ Error checking ${path}: ${error.message}`, 'error');
            }
        }
        
        return true;
    } catch (error) {
        logDebug(`✗ Failed to analyze import paths: ${error.message}`, 'error');
        return false;
    }
}

// Check for mixed content issues
function checkMixedContent() {
    logDebug('Checking for mixed content issues...', 'info');
    
    const protocol = window.location.protocol;
    
    if (protocol === 'https:') {
        // Check for any HTTP resources
        const httpResources = [];
        
        // Check scripts
        document.querySelectorAll('script[src]').forEach(script => {
            if (script.src.startsWith('http:')) {
                httpResources.push(script.src);
            }
        });
        
        // Check stylesheets
        document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
            if (link.href.startsWith('http:')) {
                httpResources.push(link.href);
            }
        });
        
        // Check images
        document.querySelectorAll('img[src]').forEach(img => {
            if (img.src.startsWith('http:')) {
                httpResources.push(img.src);
            }
        });
        
        if (httpResources.length > 0) {
            logDebug(`⚠ Found ${httpResources.length} HTTP resources on HTTPS page. This may cause mixed content issues:`, 'warning');
            httpResources.forEach(resource => {
                logDebug(`  - ${resource}`, 'warning');
            });
            return false;
        } else {
            logDebug('✓ No mixed content issues detected', 'success');
            return true;
        }
    } else {
        logDebug(`ℹ Running on ${protocol} - mixed content checks not applicable`, 'info');
        return true;
    }
}

// Check file path case sensitivity
async function checkPathCaseSensitivity() {
    logDebug('Checking path case sensitivity issues...', 'info');
    
    const criticalPaths = [
        { normal: './js/app.js', variant: './js/App.js' },
        { normal: './js/models/Task.js', variant: './js/models/task.js' },
        { normal: './js/controllers/TaskController.js', variant: './js/controllers/taskcontroller.js' },
        { normal: './css/styles.css', variant: './css/Styles.css' }
    ];
    
    let potentialIssues = false;
    
    for (const path of criticalPaths) {
        try {
            const normalResponse = await fetch(path.normal);
            const variantResponse = await fetch(path.variant);
            
            if (normalResponse.ok && variantResponse.ok) {
                logDebug(`⚠ Both ${path.normal} and ${path.variant} are accessible - GitHub Pages is case-insensitive but your local environment might be case-sensitive`, 'warning');
                potentialIssues = true;
            } else if (normalResponse.ok) {
                logDebug(`✓ ${path.normal} exists and is case-sensitive`, 'success');
            } else if (variantResponse.ok) {
                logDebug(`⚠ ${path.variant} exists instead of ${path.normal} - this will cause case sensitivity issues`, 'warning');
                potentialIssues = true;
            } else {
                logDebug(`ℹ Neither ${path.normal} nor ${path.variant} exist`, 'info');
            }
        } catch (error) {
            logDebug(`✗ Error checking case sensitivity for ${path.normal}: ${error.message}`, 'error');
        }
    }
    
    if (potentialIssues) {
        logDebug('⚠ Potential case sensitivity issues detected. Ensure all file paths use the correct case.', 'warning');
        return false;
    } else {
        logDebug('✓ No case sensitivity issues detected', 'success');
        return true;
    }
}

// Run all tests
async function runAllTests() {
    const results = {
        basicConnectivity: false,
        domElements: false,
        localStorage: false,
        moduleImports: false,
        importPaths: false,
        mixedContent: false,
        caseSensitivity: false
    };
    
    try {
        // Basic connectivity
        results.basicConnectivity = testBasicConnectivity();
        
        // DOM elements
        results.domElements = testDOMElements();
        
        // localStorage functionality
        results.localStorage = testLocalStorage();
        
        // ES6 module imports
        results.moduleImports = await testModuleImports();
        
        // Import paths analysis
        results.importPaths = await analyzeImportPaths();
        
        // Mixed content check
        results.mixedContent = checkMixedContent();
        
        // Case sensitivity check
        results.caseSensitivity = await checkPathCaseSensitivity();
        
        // Summary
        logDebug('========================', 'info');
        logDebug('TEST SUMMARY:', 'info');
        for (const [test, result] of Object.entries(results)) {
            const status = result ? 'success' : 'error';
            logDebug(`${result ? '✓' : '✗'} ${test}: ${result ? 'PASSED' : 'FAILED'}`, status);
        }
        
        if (Object.values(results).every(Boolean)) {
            logDebug('🎉 All tests passed! If you\'re still experiencing issues, check the specific error messages in your app.', 'success');
        } else {
            logDebug('❌ Some tests failed. Review the errors above to identify issues.', 'error');
            
            // Provide recommendations
            logDebug('========================', 'info');
            logDebug('RECOMMENDATIONS:', 'info');
            
            if (!results.moduleImports || !results.importPaths) {
                logDebug('1. Check all import paths in your JavaScript files. Make sure they match exactly.', 'info');
                logDebug('2. Add a .nojekyll file to your GitHub repository to disable Jekyll processing.', 'info');
                logDebug('3. Make sure all necessary files are included in your repository.', 'info');
            }
            
            if (!results.domElements) {
                logDebug('4. Verify all HTML elements have the correct IDs that match your JavaScript.', 'info');
            }
            
            if (!results.localStorage) {
                logDebug('5. Make sure you\'re not using private browsing, as it can restrict localStorage.', 'info');
            }
            
            if (!results.caseSensitivity) {
                logDebug('6. Fix any case sensitivity issues in file paths and import statements.', 'info');
            }
        }
        
    } catch (error) {
        logDebug(`✗ Test suite failed unexpectedly: ${error.message}`, 'error');
        logDebug(`Stack trace: ${error.stack}`, 'error');
    }
}

// Initialize and run debug
document.addEventListener('DOMContentLoaded', async () => {
    const logContainer = createDebugUI();
    logDebug('Pomodoro App Debug Tool - v1.0', 'info');
    logDebug(`Running on: ${window.location.href}`, 'info');
    logDebug(`User Agent: ${navigator.userAgent}`, 'info');
    logDebug('========================', 'info');
    
    // Run tests after a short delay to ensure page is fully loaded
    setTimeout(() => {
        runAllTests();
    }, 500);
});
