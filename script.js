document.addEventListener("DOMContentLoaded", () => {
  // Prevent zoom and scroll
  document.addEventListener(
    "touchmove",
    function (e) {
      if (e.touches.length > 1) {
        e.preventDefault(); // Prevent pinch zoom
      }
    },
    { passive: false }
  );

  document.addEventListener(
    "wheel",
    function (e) {
      if (e.ctrlKey) {
        e.preventDefault(); // Prevent ctrl+wheel zoom
      }
    },
    { passive: false }
  );

  // Handle double-tap zooming
  let lastTapTime = 0;
  document.addEventListener(
    "touchend",
    function (e) {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTapTime;
      if (tapLength < 500 && tapLength > 0) {
        e.preventDefault(); // Prevent double-tap zoom
      }
      lastTapTime = currentTime;
    },
    { passive: false }
  );

  // Audio initialization for iOS
  let audioInitialized = false;
  let beepSound = null;
  let completeSound = null;

  // Initialize audio context for iOS
  function initializeAudio() {
    if (audioInitialized) return;
    
    try {
      // Create audio elements
      beepSound = loadAudio("beep.mp3");
      completeSound = loadAudio("complete.mp3");
      
      // Pre-load and prime the audio for iOS
      const primeAudio = (audio) => {
        if (audio) {
          audio.load();
          // Play and immediately pause to unlock audio on iOS
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.then(() => {
              audio.pause();
              audio.currentTime = 0;
            }).catch(() => {
              // Ignore errors during priming
            });
          }
        }
      };
      
      primeAudio(beepSound);
      primeAudio(completeSound);
      
      audioInitialized = true;
      console.log('Audio initialized for iOS');
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  }

  // Add user gesture listeners to initialize audio
  const userGestureEvents = ['touchstart', 'touchend', 'mousedown', 'keydown'];
  
  function handleFirstUserGesture() {
    initializeAudio();
    // Remove listeners after first interaction
    userGestureEvents.forEach(event => {
      document.removeEventListener(event, handleFirstUserGesture);
    });
  }
  
  userGestureEvents.forEach(event => {
    document.addEventListener(event, handleFirstUserGesture, { once: true });
  });

  // DOM Elements
  const activeInput = document.getElementById("active");
  const restInput = document.getElementById("rest");
  const repsInput = document.getElementById("reps");
  const stepperInputs = [activeInput, restInput, repsInput];
  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const timerDisplay = document.getElementById("timerDisplay");
  const countdownPhase = document.getElementById("countdownPhase");
  const timeLeft = document.getElementById("timeLeft");
  const progressBar = document.getElementById("progressBar");
  const currentRep = document.getElementById("currentRep");
  const totalTime = document.getElementById("totalTime");
  const darkModeToggle = document.getElementById("darkModeToggle");
  const infiniteRepsToggle = document.getElementById("infiniteRepsToggle");
  const sunIcon = document.getElementById("sunIcon");
  const moonIcon = document.getElementById("moonIcon");
  const increaseButtons = document.querySelectorAll(".increase-button");
  const decreaseButtons = document.querySelectorAll(".decrease-button");
  const completionModal = document.getElementById("completionModal");
  const completionReps = document.getElementById("completionReps");
  const completionTime = document.getElementById("completionTime");
  const completionActiveTime = document.getElementById("completionActiveTime");
  const completionRestTime = document.getElementById("completionRestTime");
  const continueBtn = document.getElementById("continueBtn");
  const workoutLog = document.getElementById("workoutLog");
  const copyLogBtn = document.getElementById("copyLogBtn");

  // Check if device supports haptic feedback
  const canVibrate = "vibrate" in navigator;

  // Check if pause button exists
  const hasPauseButton = pauseBtn !== null;

  // Haptic feedback function
  function hapticFeedback(intensity) {
    if (!canVibrate) return;

    switch (intensity) {
      case "light":
        navigator.vibrate(10);
        break;
      case "medium":
        navigator.vibrate(20);
        break;
      case "heavy":
        navigator.vibrate([30, 50, 30]);
        break;
      case "success":
        navigator.vibrate([10, 50, 10, 50, 30]);
        break;
      case "error":
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
      active: { min: 5, max: 300 },
      rest: { min: 5, max: 300 },
      reps: { min: 1, max: 30 },
    };

    // Handle increase button clicks
    increaseButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const field = button.dataset.field;
        const input = document.getElementById(field);
        const valueEl = document.getElementById(`${field}-value`);
        const currentValue = parseInt(input.value);
        
        // Use different step sizes based on field type
        const stepSize = field === 'reps' ? 1 : 5;
        const newValue = Math.min(currentValue + stepSize, limits[field].max);

        if (currentValue < limits[field].max) {
          hapticFeedback("light");
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
    decreaseButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const field = button.dataset.field;
        const input = document.getElementById(field);
        const valueEl = document.getElementById(`${field}-value`);
        const currentValue = parseInt(input.value);
        
        // Use different step sizes based on field type
        const stepSize = field === 'reps' ? 1 : 5;
        const newValue = Math.max(currentValue - stepSize, limits[field].min);

        if (currentValue > limits[field].min) {
          hapticFeedback("light");
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
    stepperInputs.forEach((input) => {
      // Update display value on input change
      input.addEventListener("input", () => {
        const field = input.id;
        const valueEl = document.getElementById(`${field}-value`);

        // Remove non-numeric characters
        input.value = input.value.replace(/[^0-9]/g, "");

        // Update display
        valueEl.textContent = input.value;
      });

      // Validate and update buttons on blur
      input.addEventListener("blur", () => {
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
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          input.blur();
        }
      });
    });

    // Check initial values and set button states
    function checkInitialValues() {
      Object.keys(limits).forEach((field) => {
        const input = document.getElementById(field);
        const currentValue = parseInt(input.value);

        if (currentValue <= limits[field].min) {
          document.querySelector(
            `.decrease-button[data-field="${field}"]`
          ).disabled = true;
        }

        if (currentValue >= limits[field].max) {
          document.querySelector(
            `.increase-button[data-field="${field}"]`
          ).disabled = true;
        }
      });
    }

    function updateButtonStates(field, value) {
      const decreaseBtn = document.querySelector(
        `.decrease-button[data-field="${field}"]`
      );
      const increaseBtn = document.querySelector(
        `.increase-button[data-field="${field}"]`
      );

      decreaseBtn.disabled = value <= limits[field].min;
      increaseBtn.disabled = value >= limits[field].max;
    }

    function enableDecreaseButton(field) {
      const button = document.querySelector(
        `.decrease-button[data-field="${field}"]`
      );
      button.disabled = false;
    }

    function enableIncreaseButton(field) {
      const button = document.querySelector(
        `.increase-button[data-field="${field}"]`
      );
      button.disabled = false;
    }

    // Initialize stepper states
    checkInitialValues();
  }

  // Initialize iOS picker functionality
  function initIOSPicker() {
    // Check if using mobile device
    const isMobile = window.matchMedia("(max-width: 640px)").matches;

    if (isMobile) {
      // We're using steppers now, so this is kept for reference
      // but not actively used
    }
  }

  // Dark mode setup
  function initDarkMode() {
    // Check for saved theme preference or use system preference
    const isDarkMode =
      localStorage.getItem("darkMode") === "true" ||
      (localStorage.getItem("darkMode") === null &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      sunIcon.classList.add("hidden");
      moonIcon.classList.remove("hidden");
    } else {
      document.documentElement.classList.remove("dark");
      sunIcon.classList.remove("hidden");
      moonIcon.classList.add("hidden");
    }
  }

  // Toggle dark mode
  function toggleDarkMode() {
    hapticFeedback("light");

    if (document.documentElement.classList.contains("dark")) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
      sunIcon.classList.remove("hidden");
      moonIcon.classList.add("hidden");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("darkMode", "true");
      sunIcon.classList.add("hidden");
      moonIcon.classList.remove("hidden");
    }
  }

  // Initialize dark mode
  initDarkMode();

  // Initialize iOS steppers
  initIOSSteppers();

  // Initialize iOS picker (kept for reference)
  initIOSPicker();

  // Dark mode toggle event listener
  darkModeToggle.addEventListener("click", toggleDarkMode);

  // Timer variables
  let timer;
  let phase = "countdown"; // countdown, active, rest
  let currentRepCount = 0;
  let totalSeconds = 0;
  let secondsRemaining = 0;
  let originalTime = 0;
  let activeTime, restTime, reps;
  let totalActiveSeconds = 0;
  let totalRestSeconds = 0;
  let isInfiniteMode = false;
  let isPaused = false;

  // Sound effects - try different path structures for Netlify compatibility
  function loadAudio(filename) {
    const audio = new Audio();

    // Try different possible paths
    const paths = [
      `/sounds/${filename}`, // Netlify often serves from root
      `sounds/${filename}`, // Relative without public
      `/public/sounds/${filename}`, // Absolute path from root
      `./public/sounds/${filename}`, // Relative path from current directory
      filename, // Just the filename as fallback
    ];

    // Try to load the first path
    audio.src = paths[0];

    // Set up error handler to try alternate paths
    let pathIndex = 0;
    audio.addEventListener("error", function handleAudioError() {
      pathIndex++;
      console.log(
        `Trying alternative path for ${filename}: ${paths[pathIndex]}`
      );

      if (pathIndex < paths.length) {
        audio.src = paths[pathIndex];
      } else {
        console.error(`Failed to load sound: ${filename}`);
        // Remove the error handler to prevent infinite loop
        audio.removeEventListener("error", handleAudioError);
      }
    });

    return audio;
  }

  // Additional sound error handling
  function playSoundWithFallback(sound) {
    // Check if audio is initialized and sound exists
    if (!audioInitialized || !sound) {
      console.log('Audio not initialized or sound not available');
      return;
    }
    
    // For mobile Safari, we need to play sounds in response to a user gesture
    if (!sound.paused) {
      sound.pause();
      sound.currentTime = 0;
    }

    const playPromise = sound.play();

    if (playPromise !== undefined) {
      playPromise.then(() => {
        console.log('Sound played successfully');
      }).catch((error) => {
        console.error("Error playing sound:", error);
        // Try to reinitialize audio and play again
        initializeAudio();
        setTimeout(() => {
          if (sound && !sound.paused) {
            sound.pause();
            sound.currentTime = 0;
          }
          const retryPromise = sound.play();
          if (retryPromise !== undefined) {
            retryPromise.catch((err) => {
              console.error("Retry attempt failed:", err);
            });
          }
        }, 100);
      });
    }
  }

  // Format time as MM:SS
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }

  // Get current date and time formatted
  function getCurrentDateTime() {
    const now = new Date();
    return now.toLocaleString();
  }

  // Generate workout log text
  function generateWorkoutLog(reps, totalTime, activeTime, restTime) {
    return `${getCurrentDateTime()}
Reps: ${reps}
Total Time: ${totalTime}
Total Active: ${activeTime}
Total Rest: ${restTime}`;
  }

  // Update the progress bar
  function updateProgress() {
    const percentage = ((originalTime - secondsRemaining) / originalTime) * 100;
    progressBar.style.width = `${percentage}%`;
  }

  // Update timer display
  function updateDisplay() {
    // Display the actual time remaining for clearer UX
    if (phase === "countdown") {
      // For countdown phase, just show the number as is (3, 2, 1)
      timeLeft.textContent = secondsRemaining;
    } else if (phase === "active" || phase === "rest") {
      // For active and rest phases, show the actual remaining time
      timeLeft.textContent = secondsRemaining;
    }

    updateProgress();
    currentRep.textContent = isInfiniteMode ? `Rep: ${currentRepCount}` : `Rep: ${currentRepCount}/${reps}`;
    totalTime.textContent = `Total: ${formatTime(totalSeconds)}`;
  }

  // Timer logic
  function runTimer() {
    // First, decrement the timer
    secondsRemaining--;
    
    // Check if the current phase is complete and handle transitions
    if (secondsRemaining <= 0) {
      // Handle phase transitions
      if (phase === "countdown") {
        // Start the active phase
        phase = "active";
        currentRepCount++;
        secondsRemaining = activeTime;
        originalTime = activeTime;
        countdownPhase.textContent = "Active";
        countdownPhase.className =
          "text-2xl font-bold text-active-color dark:text-active-color mb-2";
        timeLeft.className =
          "text-8xl font-bold text-active-color dark:text-active-color mb-6";
        progressBar.className = "bg-active-color dark:bg-active-color h-2 rounded-full";
        playSoundWithFallback(beepSound);
        hapticFeedback("medium");
      } else if (phase === "active") {
        // This active phase is done
        totalActiveSeconds += activeTime;

        // Check if this was the last rep
        if (!isInfiniteMode && currentRepCount >= reps) {
          // Workout complete - show completion modal
          completionReps.textContent = reps;
          completionTime.textContent = formatTime(totalSeconds);
          completionActiveTime.textContent = formatTime(totalActiveSeconds);
          completionRestTime.textContent = formatTime(totalRestSeconds);
          
          // Generate and set workout log
          workoutLog.textContent = generateWorkoutLog(
            reps,
            formatTime(totalSeconds),
            formatTime(totalActiveSeconds),
            formatTime(totalRestSeconds)
          );
          
          clearInterval(timer);
          completionModal.classList.remove("hidden");
          timerDisplay.classList.add("hidden");
          
          playSoundWithFallback(completeSound);
          hapticFeedback("success");
          return;
        }

        // Start rest phase
        phase = "rest";
        secondsRemaining = restTime;
        originalTime = restTime;
        countdownPhase.textContent = "Rest";
        countdownPhase.className =
          "text-2xl font-bold text-rest-color dark:text-rest-color mb-2";
        timeLeft.className =
          "text-8xl font-bold text-rest-color dark:text-rest-color mb-6";
        progressBar.className = "bg-rest-color dark:bg-rest-color h-2 rounded-full";
        
        playSoundWithFallback(beepSound);
        hapticFeedback("medium");
      } else if (phase === "rest") {
        // The rest phase is done
        totalRestSeconds += restTime;

        // Start a new active phase
        phase = "active";
        if (!isInfiniteMode) {
          currentRepCount++;
        } else {
          // For infinite mode, increment rep count in rest phase
          currentRepCount++;
        }
        secondsRemaining = activeTime;
        originalTime = activeTime;
        countdownPhase.textContent = "Active";
        countdownPhase.className =
          "text-2xl font-bold text-active-color dark:text-active-color mb-2";
        timeLeft.className =
          "text-8xl font-bold text-active-color dark:text-active-color mb-6";
        progressBar.className = "bg-active-color dark:bg-active-color h-2 rounded-full";
        
        playSoundWithFallback(beepSound);
        hapticFeedback("medium");
      }
    }

    // Update the display AFTER handling phase transitions
    updateDisplay();

    // Update progress and rep counter
    if (phase === "countdown") {
      currentRep.textContent = isInfiniteMode ? "Rep: 0" : `Rep: 0/${reps}`;
    } else {
      currentRep.textContent = isInfiniteMode ? `Rep: ${currentRepCount}` : `Rep: ${currentRepCount}/${reps}`;
      // Only increment total seconds when not in countdown phase
      totalSeconds++;
    }
    
    updateProgress();
  }

  // Start the timer
  function startTimer() {
    // Get input values
    activeTime = parseInt(activeInput.value);
    restTime = parseInt(restInput.value);
    
    if (!isInfiniteMode) {
      reps = parseInt(repsInput.value);
    } else {
      reps = Infinity; // Set to infinity
      stopBtn.textContent = "Complete"; // Change button text to Complete
    }

    // Validate inputs
    if (activeTime < 1 || restTime < 1 || (reps < 1 && !isInfiniteMode)) {
      hapticFeedback("error");
      alert("Please enter valid values (minimum 1)");
      return;
    }

    hapticFeedback("medium");

    // Hide input form, show timer
    timerDisplay.classList.remove("hidden");
    startBtn.parentElement.parentElement.classList.add("hidden");

    // Initialize timer
    phase = "countdown";
    countdownPhase.textContent = "Get Ready!";
    countdownPhase.className =
      "text-2xl font-bold text-black dark:text-white mb-2";
    timeLeft.className =
      "text-8xl font-bold text-primary-color dark:text-primary-color mb-6";
    progressBar.className = "bg-primary-color dark:bg-primary-color h-2 rounded-full";

    currentRepCount = 0;
    totalSeconds = 0;
    totalActiveSeconds = 0;
    totalRestSeconds = 0;
    secondsRemaining = 3; // Countdown from 3
    originalTime = 3;
    isPaused = false;

    updateDisplay();

    // Show pause button and reset its text (only if it exists)
    if (hasPauseButton) {
      pauseBtn.classList.remove("hidden");
      pauseBtn.textContent = "Pause";
    }

    // Start the timer
    timer = setInterval(runTimer, 1000);
  }

  // Pause/Resume the timer
  function pauseResumeTimer() {
    hapticFeedback("medium");
    
    if (isPaused) {
      // Resume the timer
      timer = setInterval(runTimer, 1000);
      pauseBtn.textContent = "Pause";
      isPaused = false;
    } else {
      // Pause the timer
      clearInterval(timer);
      pauseBtn.textContent = "Continue";
      isPaused = true;
    }
  }

  // Stop the timer
  function stopTimer() {
    clearInterval(timer);

    // Reset the button text if in infinite mode
    if (isInfiniteMode) {
      stopBtn.textContent = "Stop";
    }

    // Hide pause button and reset its text (only if it exists)
    if (hasPauseButton) {
      pauseBtn.classList.add("hidden");
      pauseBtn.textContent = "Pause";
      isPaused = false;
    }

    // If infinite mode, show the completion stats
    if (isInfiniteMode && phase !== "countdown") {
      completionReps.textContent = currentRepCount;
      completionTime.textContent = formatTime(totalSeconds);
      completionActiveTime.textContent = formatTime(totalActiveSeconds);
      completionRestTime.textContent = formatTime(totalRestSeconds);
      
      // Generate and set workout log
      workoutLog.textContent = generateWorkoutLog(
        currentRepCount,
        formatTime(totalSeconds),
        formatTime(totalActiveSeconds),
        formatTime(totalRestSeconds)
      );
      
      completionModal.classList.remove("hidden");
      timerDisplay.classList.add("hidden");
      playSoundWithFallback(completeSound);
      hapticFeedback("success");
    } else if (!completionModal.classList.contains("hidden")) {
      // Timer completed naturally, modal is showing
      // Do not show the input form until Continue is pressed
    } else {
      // Normal stop - show input form immediately
      startBtn.parentElement.parentElement.classList.remove("hidden");
      timerDisplay.classList.add("hidden");
    }

    hapticFeedback("medium");
  }

  // Event listeners
  startBtn.addEventListener("click", () => {
    // Ensure audio is initialized before starting timer
    if (!audioInitialized) {
      initializeAudio();
    }
    startTimer();
  });
  stopBtn.addEventListener("click", stopTimer);
  if (hasPauseButton) {
    pauseBtn.addEventListener("click", pauseResumeTimer);
  }

  // Continue button event listener
  continueBtn.addEventListener("click", () => {
    hapticFeedback("medium");
    completionModal.classList.add("hidden");
    startBtn.parentElement.parentElement.classList.remove("hidden");

    // Reset the timer display for next use
    countdownPhase.textContent = "Get Ready!";
    countdownPhase.className =
      "text-2xl font-bold text-black dark:text-white mb-2";
    timeLeft.className =
      "text-8xl font-bold text-primary-color dark:text-primary-color mb-6";
    timeLeft.textContent = "3";
    progressBar.className = "bg-primary-color dark:bg-primary-color h-2 rounded-full";
    progressBar.style.width = "0%";

    // Ensure pause button is hidden (only if it exists)
    if (hasPauseButton) {
      pauseBtn.classList.add("hidden");
      pauseBtn.textContent = "Pause";
      isPaused = false;
    }
  });

  // Copy workout log to clipboard
  copyLogBtn.addEventListener("click", () => {
    try {
      navigator.clipboard.writeText(workoutLog.textContent).then(() => {
        // Visual feedback for success
        copyLogBtn.classList.add("bg-active-color", "text-white");
        copyLogBtn.querySelector("span").textContent = "Copied!";
        
        // Haptic feedback
        hapticFeedback("medium");
        
        // Reset button after delay
        setTimeout(() => {
          copyLogBtn.classList.remove("bg-active-color", "text-white");
          copyLogBtn.classList.add("bg-surface-secondary", "dark:bg-gray-700");
          copyLogBtn.querySelector("span").textContent = "Copy";
        }, 1500);
      });
    } catch (err) {
      console.error("Failed to copy text: ", err);
      
      // Visual feedback for failure
      copyLogBtn.classList.add("bg-danger-color", "text-white");
      copyLogBtn.querySelector("span").textContent = "Error!";
      
      // Reset button after delay
      setTimeout(() => {
        copyLogBtn.classList.remove("bg-danger-color", "text-white");
        copyLogBtn.classList.add("bg-surface-secondary", "dark:bg-gray-700");
        copyLogBtn.querySelector("span").textContent = "Copy";
      }, 1500);
    }
  });

  // Add iOS-specific quick-tap event listener
  if ("ontouchstart" in document.documentElement) {
    startBtn.addEventListener("touchstart", function () {
      this.classList.add("active");
      // Initialize audio for iOS
      if (!audioInitialized) {
        initializeAudio();
      }
    });

    startBtn.addEventListener("touchend", function () {
      this.classList.remove("active");
    });

    stopBtn.addEventListener("touchstart", function () {
      this.classList.add("active");
    });

    stopBtn.addEventListener("touchend", function () {
      this.classList.remove("active");
    });

    // Add touch events for stepper buttons
    increaseButtons.forEach((button) => {
      button.addEventListener("touchstart", function () {
        this.classList.add("active");
      });

      button.addEventListener("touchend", function () {
        this.classList.remove("active");
      });
    });

    decreaseButtons.forEach((button) => {
      button.addEventListener("touchstart", function () {
        this.classList.add("active");
      });

      button.addEventListener("touchend", function () {
        this.classList.remove("active");
      });
    });

    // Add touch event for continue button
    continueBtn.addEventListener("touchstart", function () {
      this.classList.add("active");
    });

    continueBtn.addEventListener("touchend", function () {
      this.classList.remove("active");
    });

    // Add touch events for pause button (only if it exists)
    if (hasPauseButton) {
      pauseBtn.addEventListener("touchstart", function () {
        this.classList.add("active");
      });

      pauseBtn.addEventListener("touchend", function () {
        this.classList.remove("active");
      });
    }
  }

  // Proverb Slideshow Functionality
  function initProverbSlideshow() {
    const proverbText = document.getElementById("proverbText");
    const proverbSource = document.getElementById("proverbSource");
    const proverbSlideshow = document.getElementById("proverbSlideshow");

    let proverbs = [];
    let currentProverbIndex = 0;
    let lastProverbIndex = -1; // Track the last shown proverb index
    let slideshowInterval;

    // Set initial opacity to 0 for smooth fade-in
    proverbText.style.opacity = "0";
    proverbSource.style.opacity = "0";

    // Attempt to load proverbs from file only
    const loadProverbs = async () => {
      try {
        // Try first path
        const response = await fetch("./public/data/carousel.json");
        if (!response.ok) throw new Error("First fetch failed");
        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Error:", error);
      }
    };

    // Load proverbs and initialize display
    loadProverbs().then((data) => {
      proverbs = data;
      if (proverbs.length > 0) {
        displayRandomProverb();
        startProverbSlideshow();
      }
    });

    function displayRandomProverb() {
      if (proverbs.length === 0) return;
      
      // If there's only one proverb, we have no choice but to display it
      if (proverbs.length === 1) {
        currentProverbIndex = 0;
        displayProverb(currentProverbIndex);
        return;
      }
      
      let newIndex;
      do {
        // Generate a new random index
        newIndex = Math.floor(Math.random() * proverbs.length);
        // Repeat until we get an index different from the last shown proverb
      } while (newIndex === lastProverbIndex);
      
      // Update the current and last indices
      currentProverbIndex = newIndex;
      lastProverbIndex = newIndex;
      
      // Display the selected proverb
      displayProverb(currentProverbIndex);
    }

    function displayProverb(index) {
      if (proverbs.length === 0) return;

      const proverb = proverbs[index];

      // Add fade-out effect
      proverbText.style.opacity = "0";
      proverbSource.style.opacity = "0";

      setTimeout(() => {
        proverbText.textContent = proverb.proverb;
        proverbSource.textContent = proverb.source;

        // Add fade-in effect
        proverbText.style.opacity = "1";
        proverbSource.style.opacity = "1";
      }, 500);
    }

    function startProverbSlideshow() {
      // Clear any existing interval
      if (slideshowInterval) clearInterval(slideshowInterval);

      // Apply transition style for smooth opacity changes
      proverbText.style.transition = "opacity 0.5s ease";
      proverbSource.style.transition = "opacity 0.5s ease";

      // Start the slideshow interval with random proverbs
      slideshowInterval = setInterval(() => {
        displayRandomProverb();
      }, 10000); // Change every 10 seconds
    }

    // Show the slideshow and hide it when timer is active
    startBtn.addEventListener("click", () => {
      proverbSlideshow.classList.add("hidden");
    });

    continueBtn.addEventListener("click", () => {
      proverbSlideshow.classList.remove("hidden");
      // Reset the slideshow when returning to view
      displayRandomProverb();
      startProverbSlideshow();
    });

    stopBtn.addEventListener("click", () => {
      proverbSlideshow.classList.remove("hidden");
      // Reset the slideshow when returning to view
      displayRandomProverb();
      startProverbSlideshow();
    });
  }

  function initInfiniteMode() {
    // Initialize infinite mode toggle
    infiniteRepsToggle.addEventListener("click", () => {
      isInfiniteMode = !isInfiniteMode;
      hapticFeedback("medium");
      
      // Toggle button appearance
      if (isInfiniteMode) {
        infiniteRepsToggle.classList.remove("bg-surface-secondary", "dark:bg-gray-700");
        infiniteRepsToggle.classList.add("bg-primary-color", "text-white");
        
        // Disable reps input
        document.querySelector('[data-field="reps"]').classList.add("opacity-50", "pointer-events-none");
        repsInput.disabled = true;
      } else {
        infiniteRepsToggle.classList.add("bg-surface-secondary", "dark:bg-gray-700");
        infiniteRepsToggle.classList.remove("bg-primary-color", "text-white");
        
        // Enable reps input
        document.querySelector('[data-field="reps"]').classList.remove("opacity-50", "pointer-events-none");
        repsInput.disabled = false;
      }
    });
  }

  // Initialize all components
  // initIOSPicker(); // Commented out as per original code
  initDarkMode();
  initInfiniteMode(); // Initialize infinite mode toggle
  initProverbSlideshow(); // Initialize the proverb slideshow

  // Show slideshow by default
  const proverbSlideshow = document.getElementById("proverbSlideshow");
  if (proverbSlideshow) {
    proverbSlideshow.classList.remove("hidden");
  }
});
