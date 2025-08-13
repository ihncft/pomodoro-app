// DOM
const minutesDisplay = document.getElementById("minutes");
const secondsDisplay = document.getElementById("seconds");
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const resetBtn = document.getElementById("reset-btn");
const modeButtons = document.querySelectorAll(".mode-btn");
const countDisplay = document.getElementById("count");
document
  .getElementById("whitenoise-volume")
  .addEventListener("input", function () {
    if (whiteNoiseAudio) {
      whiteNoiseAudio.volume = parseFloat(this.value);
    }
  });
document
  .getElementById("auto-start-toggle")
  .addEventListener("change", function () {
    autoStartEnabled = this.checked;
    localStorage.setItem("autoStartEnabled");
  });

// Timer
let timer;
let isRunning = false;
let timeLeft = 25 * 60;
let currentMode = "pomodoro";
let pomodoroCount = 0;
let autoStartEnabled = localStorage.getItem("autoStartEnabled") !== "false";

// Initialize checkbox state
document.getElementById("auto-start-toggle").checked = autoStartEnabled;

// White Noise
let whiteNoiseAudio = null;
let isWhiteNoisePlaying = false;

// Presets
const modes = {
  pomodoro: 25 * 60,
  "short-break": 5 * 60,
  "long-break": 15 * 60,
};

// Initialize the timer display
updateDisplay();

// Event Listeners
startBtn.addEventListener("click", startTimer);
pauseBtn.addEventListener("click", pauseTimer);
resetBtn.addEventListener("click", resetTimer);

modeButtons.forEach((button) => {
  button.addEventListener("click", () => switchMode(button.dataset.mode));
});

// Timer functions
function startTimer() {
  if (!isRunning) {
    isRunning = true;

    // Start white noise if in pomodoro mode
    if (currentMode === "pomodoro") {
      startWhiteNoise();
    }

    timer = setInterval(() => {
      timeLeft--;
      updateDisplay();

      if (timeLeft <= 0) {
        clearInterval(timer);
        isRunning = false;
        playAlarm();

        if (currentMode === "pomodoro") {
          pomodoroCount++;
          countDisplay.textContent = pomodoroCount;

          // Stop white noise when switching to break
          stopWhiteNoise();

          if (autoStartEnabled) {
            if (pomodoroCount % 4 === 0) {
              switchMode("long-break");
            } else {
              switchMode("short-break");
            }
            startTimer();
          }
        } else {
          if (autoStartEnabled) {
            switchMode("pomodoro");
            startTimer();
          }
        }
      }
    }, 1000);
  }
}

function pauseTimer() {
  clearInterval(timer);
  isRunning = false;
}

function resetTimer() {
  pauseTimer();
  stopWhiteNoise();
  timeLeft = modes[currentMode];
  updateDisplay();
}

function updateDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  minutesDisplay.textContent = minutes.toString().padStart(2, "0");
  secondsDisplay.textContent = seconds.toString().padStart(2, "0");
}

function switchMode(mode) {
  // Stop white noise when switching to any break mode
  if (mode !== "pomodoro" && isWhiteNoisePlaying) {
    stopWhiteNoise();
  }

  currentMode = mode;
  timeLeft = modes[mode];

  // Update active button
  modeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === mode);
  });

  // Update display
  updateDisplay();

  // Reset timer if it's running
  if (isRunning) {
    resetTimer();
    startTimer();
  }
}

function playAlarm() {
  const volumeControl = document.getElementById("volume");
  const volume = parseFloat(volumeControl.value);

  const audio = new Audio("./assets/30-seconds.mp3");
  audio.volume = volume;
  audio.play().catch((error) => {
    console.error("Audio playback failed:", error);
    // Fallback to browser beep if local file fails
    fallbackBeep();
  });
}

function fallbackBeep() {
  // Simple browser beep fallback
  const ctx = new (window.AudioContext)();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = "sine";
  oscillator.frequency.value = 800;
  gainNode.gain.value = 0.5; // Volume control

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start();
  setTimeout(() => oscillator.stop(), 500);
}

function startWhiteNoise() {
  if (!isWhiteNoisePlaying && currentMode === "pomodoro") {
    const volumeControl = document.getElementById("whitenoise-volume");
    const volume = parseFloat(volumeControl.value);

    whiteNoiseAudio = new Audio("./assets/whitenoise.mp3");
    whiteNoiseAudio.volume = volume;
    whiteNoiseAudio.loop = true;

    const playPromise = whiteNoiseAudio.play();

    if (playPromise !== undefined) {
      playPromise
        .then((_) => {
          isWhiteNoisePlaying = true;
        })
        .catch((error) => {
          console.error("White noise playback failed:", error);
        });
    }
  }
}

function stopWhiteNoise() {
  if (isWhiteNoisePlaying) {
    whiteNoiseAudio.pause();
    whiteNoiseAudio.currentTime = 0;
    isWhiteNoisePlaying = false;
  }
}
