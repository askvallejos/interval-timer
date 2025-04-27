document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const actionInput = document.getElementById('action');
    const restInput = document.getElementById('rest');
    const repsInput = document.getElementById('reps');
    // const actionValue = document.getElementById('action-value');
    // const restValue = document.getElementById('rest-value');
    // const repsValue = document.getElementById('reps-value');
    const stepperInputs = [actionInput, restInput, repsInput];
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const timerDisplay = document.getElementById('timerDisplay');
    const countdownPhase = document.getElementById('countdownPhase');
    const timeLeft = document.getElementById('timeLeft');
    const progressBar = document.getElementById('progressBar');
    const currentRep = document.getElementById('currentRep');
    const totalTime = document.getElementById('totalTime');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const sunIcon = document.getElementById('sunIcon');
    const moonIcon = document.getElementById('moonIcon');
    const increaseButtons = document.querySelectorAll('.increase-button');
    const decreaseButtons = document.querySelectorAll('.decrease-button');
    
    // iOS Picker Elements (keep for future reference)
    // const iosPicker = document.getElementById('iosPicker');
    // const pickerContent = document.getElementById('pickerContent');
    // const pickerTitle = document.getElementById('pickerTitle');
    // const cancelPicker = document.getElementById('cancelPicker');
    // const donePicker = document.getElementById('donePicker');
    // const inputContainers = document.querySelectorAll('.input-container');
    
    // let currentPickerField = null;
    // let selectedValue = null;
    // let lastScrollPosition = 0;
    // let isScrolling = false;
    
    // Check if device supports haptic feedback
    const canVibrate = 'vibrate' in navigator;
    
    // Haptic feedback function
    function hapticFeedback(intensity) {
        if (!canVibrate) return;
        
        switch (intensity) {
            case 'light':
                navigator.vibrate(10);
                break;
            case 'medium':
                navigator.vibrate(20);
                break;
            case 'heavy':
                navigator.vibrate([30, 50, 30]);
                break;
            case 'success':
                navigator.vibrate([10, 50, 10, 50, 30]);
                break;
            case 'error':
                navigator.vibrate([100, 30, 100]);
                break;
            default:
                navigator.vibrate(15);
        }
    }

    // Initialize iOS stepper controls
    function initIOSSteppers() {
        // Set max and min values for each field
        const limits = {
            action: { min: 1, max: 300 },
            rest: { min: 1, max: 300 },
            reps: { min: 1, max: 30 }
        };
        
        // Handle increase button clicks
        increaseButtons.forEach(button => {
            button.addEventListener('click', () => {
                const field = button.dataset.field;
                const input = document.getElementById(field);
                const valueEl = document.getElementById(`${field}-value`);
                const currentValue = parseInt(input.value);
                const newValue = Math.min(currentValue + 1, limits[field].max);
                
                if (currentValue < limits[field].max) {
                    clickSound.currentTime = 0; // Reset sound to beginning
                    clickSound.play(); // Play iOS click sound
                    hapticFeedback('light');
                    input.value = newValue;
                    valueEl.textContent = newValue;
                    
                    // Enable decrease button if it was disabled
                    enableDecreaseButton(field);
                    
                    // Disable increase button if we hit max
                    if (newValue === limits[field].max) {
                        button.disabled = true;
                    }
                }
            });
        });
        
        // Handle decrease button clicks
        decreaseButtons.forEach(button => {
            button.addEventListener('click', () => {
                const field = button.dataset.field;
                const input = document.getElementById(field);
                const valueEl = document.getElementById(`${field}-value`);
                const currentValue = parseInt(input.value);
                const newValue = Math.max(currentValue - 1, limits[field].min);
                
                if (currentValue > limits[field].min) {
                    clickSound.currentTime = 0; // Reset sound to beginning
                    clickSound.play(); // Play iOS click sound
                    hapticFeedback('light');
                    input.value = newValue;
                    valueEl.textContent = newValue;
                    
                    // Enable increase button if it was disabled
                    enableIncreaseButton(field);
                    
                    // Disable decrease button if we hit min
                    if (newValue === limits[field].min) {
                        button.disabled = true;
                    }
                }
            });
        });
        
        // Handle manual input
        stepperInputs.forEach(input => {
            // Update display value on input change
            input.addEventListener('input', () => {
                const field = input.id;
                const valueEl = document.getElementById(`${field}-value`);
                
                // Remove non-numeric characters
                input.value = input.value.replace(/[^0-9]/g, '');
                
                // Update display
                valueEl.textContent = input.value;
            });
            
            // Validate and update buttons on blur
            input.addEventListener('blur', () => {
                const field = input.id;
                const valueEl = document.getElementById(`${field}-value`);
                let val = parseInt(input.value);
                
                // If empty or not a number, set to min
                if (isNaN(val) || val === 0) {
                    val = limits[field].min;
                }
                
                // Enforce limits
                val = Math.max(limits[field].min, Math.min(val, limits[field].max));
                
                // Update input and display
                input.value = val;
                valueEl.textContent = val;
                
                // Update button states
                updateButtonStates(field, val);
            });
            
            // Handle keyboard enter key
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    input.blur();
                }
            });
        });
        
        // Check initial values and set button states
        function checkInitialValues() {
            Object.keys(limits).forEach(field => {
                const input = document.getElementById(field);
                const currentValue = parseInt(input.value);
                
                if (currentValue <= limits[field].min) {
                    document.querySelector(`.decrease-button[data-field="${field}"]`).disabled = true;
                }
                
                if (currentValue >= limits[field].max) {
                    document.querySelector(`.increase-button[data-field="${field}"]`).disabled = true;
                }
            });
        }
        
        function updateButtonStates(field, value) {
            const decreaseBtn = document.querySelector(`.decrease-button[data-field="${field}"]`);
            const increaseBtn = document.querySelector(`.increase-button[data-field="${field}"]`);
            
            decreaseBtn.disabled = (value <= limits[field].min);
            increaseBtn.disabled = (value >= limits[field].max);
        }
        
        function enableDecreaseButton(field) {
            const button = document.querySelector(`.decrease-button[data-field="${field}"]`);
            button.disabled = false;
        }
        
        function enableIncreaseButton(field) {
            const button = document.querySelector(`.increase-button[data-field="${field}"]`);
            button.disabled = false;
        }
        
        // Initialize stepper states
        checkInitialValues();
    }

    // Initialize iOS picker functionality
    function initIOSPicker() {
        // Check if using mobile device
        const isMobile = window.matchMedia('(max-width: 640px)').matches;
        
        if (isMobile) {
            // We're using steppers now, so this is kept for reference
            // but not actively used
        }
    }
    
    // // Create picker items based on field type
    // function createPickerItems(fieldType) {
    //     // Kept for reference, not actively used
    // }
    
    // // Find and highlight the closest item to the center
    // function updateSelectedItem() {
    //     // Kept for reference, not actively used
    // }
    
    // // Snap to the closest item
    // function snapToClosestItem() {
    //     // Kept for reference, not actively used
    // }
    
    // Debounce function to limit scroll event handling
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Dark mode setup
    function initDarkMode() {
        // Check for saved theme preference or use system preference
        const isDarkMode = localStorage.getItem('darkMode') === 'true' || 
            (localStorage.getItem('darkMode') === null && 
             window.matchMedia('(prefers-color-scheme: dark)').matches);
        
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            sunIcon.classList.add('hidden');
            moonIcon.classList.remove('hidden');
        } else {
            document.documentElement.classList.remove('dark');
            sunIcon.classList.remove('hidden');
            moonIcon.classList.add('hidden');
        }
    }

    // Toggle dark mode
    function toggleDarkMode() {
        hapticFeedback('light');
        
        if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('darkMode', 'false');
            sunIcon.classList.remove('hidden');
            moonIcon.classList.add('hidden');
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('darkMode', 'true');
            sunIcon.classList.add('hidden');
            moonIcon.classList.remove('hidden');
        }
    }

    // Initialize dark mode
    initDarkMode();
    
    // Initialize iOS steppers
    initIOSSteppers();
    
    // Initialize iOS picker (kept for reference)
    initIOSPicker();

    // Dark mode toggle event listener
    darkModeToggle.addEventListener('click', toggleDarkMode);

    // Timer variables
    let timer;
    let phase = 'countdown'; // countdown, action, rest
    let currentRepCount = 0;
    let totalSeconds = 0;
    let secondsRemaining = 0;
    let originalTime = 0;
    let actionTime, restTime, reps;
    
    // Sound effects - preload sounds
    const beepSound = new Audio('https://assets.mixkit.co/active_storage/sfx/1082/1082-preview.mp3');
    const completeSound = new Audio('https://assets.mixkit.co/active_storage/sfx/952/952-preview.mp3');
    const clickSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2585/2585-preview.mp3'); // Light switch tap sound
    
    // Preload sounds
    beepSound.load();
    completeSound.load();
    clickSound.load();

    // Format time as MM:SS
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // Update the progress bar
    function updateProgress() {
        const percentage = ((originalTime - secondsRemaining) / originalTime) * 100;
        progressBar.style.width = `${percentage}%`;
    }

    // Update timer display
    function updateDisplay() {
        timeLeft.textContent = secondsRemaining;
        updateProgress();
        currentRep.textContent = `Rep: ${currentRepCount}/${reps}`;
        totalTime.textContent = `Total: ${formatTime(totalSeconds)}`;
    }

    // Timer logic
    function runTimer() {
        secondsRemaining--;
        totalSeconds++;
        
        updateDisplay();
        
        if (secondsRemaining <= 0) {
            if (phase === 'countdown') {
                // Start the action phase
                phase = 'action';
                countdownPhase.textContent = 'ACTION!';
                countdownPhase.classList.remove('text-black', 'dark:text-white');
                countdownPhase.classList.add('text-ios-green', 'dark:text-ios-green');
                timeLeft.classList.remove('text-ios-blue', 'dark:text-ios-blue');
                timeLeft.classList.add('text-ios-green', 'dark:text-ios-green');
                progressBar.classList.remove('bg-ios-blue', 'dark:bg-ios-blue');
                progressBar.classList.add('bg-ios-green', 'dark:bg-ios-green');
                
                secondsRemaining = actionTime;
                originalTime = actionTime;
                currentRepCount++;
                beepSound.play();
                hapticFeedback('medium');
            } else if (phase === 'action') {
                // Start the rest phase
                phase = 'rest';
                countdownPhase.textContent = 'REST';
                countdownPhase.classList.remove('text-ios-green', 'dark:text-ios-green');
                countdownPhase.classList.add('text-ios-orange', 'dark:text-ios-orange');
                timeLeft.classList.remove('text-ios-green', 'dark:text-ios-green');
                timeLeft.classList.add('text-ios-orange', 'dark:text-ios-orange');
                progressBar.classList.remove('bg-ios-green', 'dark:bg-ios-green');
                progressBar.classList.add('bg-ios-orange', 'dark:bg-ios-orange');
                
                secondsRemaining = restTime;
                originalTime = restTime;
                beepSound.play();
                hapticFeedback('medium');
            } else if (phase === 'rest') {
                if (currentRepCount < reps) {
                    // Start next action phase
                    phase = 'action';
                    countdownPhase.textContent = 'ACTION!';
                    countdownPhase.classList.remove('text-ios-orange', 'dark:text-ios-orange');
                    countdownPhase.classList.add('text-ios-green', 'dark:text-ios-green');
                    timeLeft.classList.remove('text-ios-orange', 'dark:text-ios-orange');
                    timeLeft.classList.add('text-ios-green', 'dark:text-ios-green');
                    progressBar.classList.remove('bg-ios-orange', 'dark:bg-ios-orange');
                    progressBar.classList.add('bg-ios-green', 'dark:bg-ios-green');
                    
                    secondsRemaining = actionTime;
                    originalTime = actionTime;
                    currentRepCount++;
                    beepSound.play();
                    hapticFeedback('medium');
                } else {
                    // Workout complete
                    completeSound.play();
                    hapticFeedback('success');
                    stopTimer();
                    countdownPhase.textContent = 'COMPLETE!';
                    countdownPhase.classList.remove('text-ios-orange', 'dark:text-ios-orange');
                    countdownPhase.classList.add('text-ios-blue', 'dark:text-ios-blue');
                    timeLeft.textContent = '🎉';
                    return;
                }
            }
            updateProgress();
        }
    }

    // Start the timer
    function startTimer() {
        // Get input values
        actionTime = parseInt(actionInput.value);
        restTime = parseInt(restInput.value);
        reps = parseInt(repsInput.value);
        
        // Validate inputs
        if (actionTime < 1 || restTime < 1 || reps < 1) {
            hapticFeedback('error');
            alert('Please enter valid values (minimum 1)');
            return;
        }
        
        hapticFeedback('medium');
        
        // Hide input form, show timer
        timerDisplay.classList.remove('hidden');
        startBtn.parentElement.parentElement.classList.add('hidden');
        
        // Initialize timer
        phase = 'countdown';
        countdownPhase.textContent = 'Get Ready!';
        countdownPhase.className = 'text-2xl font-bold text-black dark:text-white mb-2';
        timeLeft.className = 'text-8xl font-bold text-ios-blue dark:text-ios-blue mb-6';
        progressBar.className = 'bg-ios-blue dark:bg-ios-blue h-2 rounded-full';
        
        currentRepCount = 0;
        totalSeconds = 0;
        secondsRemaining = 3; // Countdown from 3
        originalTime = 3;
        
        updateDisplay();
        
        // Start the timer
        timer = setInterval(runTimer, 1000);
    }

    // Stop the timer
    function stopTimer() {
        clearInterval(timer);
        startBtn.parentElement.parentElement.classList.remove('hidden');
        timerDisplay.classList.add('hidden');
        hapticFeedback('medium');
    }

    // Event listeners
    startBtn.addEventListener('click', startTimer);
    stopBtn.addEventListener('click', stopTimer);
    
    // Add iOS-specific quick-tap event listener
    if ('ontouchstart' in document.documentElement) {
        startBtn.addEventListener('touchstart', function() {
            this.classList.add('active');
        });
        
        startBtn.addEventListener('touchend', function() {
            this.classList.remove('active');
        });
        
        stopBtn.addEventListener('touchstart', function() {
            this.classList.add('active');
        });
        
        stopBtn.addEventListener('touchend', function() {
            this.classList.remove('active');
        });
        
        // Add touch events for stepper buttons
        increaseButtons.forEach(button => {
            button.addEventListener('touchstart', function() {
                this.classList.add('active');
            });
            
            button.addEventListener('touchend', function() {
                this.classList.remove('active');
            });
        });
        
        decreaseButtons.forEach(button => {
            button.addEventListener('touchstart', function() {
                this.classList.add('active');
            });
            
            button.addEventListener('touchend', function() {
                this.classList.remove('active');
            });
        });
    }
}); 