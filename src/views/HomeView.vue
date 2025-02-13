<template>
  <div class="container" role="main">
    <h1 class="title">🚀 Typing Speed Test</h1>
    
    <div class="stats" aria-live="polite">
      <div class="stat-item">
        <span class="stat-label">WPM:</span>
        <span class="stat-value">{{ wpm }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Accuracy:</span>
        <span class="stat-value">{{ accuracy }}%</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Time:</span>
        <span class="stat-value">{{ elapsedTime.toFixed(1) }}s</span>
      </div>
    </div>

    <p class="instruction" aria-live="polite">
      <strong>Type the following sentence:</strong>
    </p>
    
    <p class="sentence" aria-label="Text to type">
      <span 
        v-for="(char, index) in selectedSentence" 
        :key="index"
        :class="getCharClass(index)"
        :aria-hidden="true"
      >{{ char }}</span>
    </p>

    <textarea 
      v-model="text" 
      @input="handleTyping" 
      :disabled="isComplete" 
      placeholder="Start typing here..."
      class="typing-area"
      aria-label="Type the text here"
      :aria-invalid="errorCount > 0"
      autofocus
    ></textarea>

    <div v-if="isComplete" class="results" role="status" aria-live="polite">
      <p class="result">
        🎉 Great job! Your results:
        <br>
        Speed: <strong>{{ wpm }} WPM</strong>
        <br>
        Accuracy: <strong>{{ accuracy }}%</strong>
      </p>
      <button 
        @click="restartTest" 
        class="restart-btn"
        aria-label="Start a new test"
      >
        🔄 Try Again
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from "vue";

// Move sentences to a separate config file
import { sentences } from '@/config/sentences';

// Add more reactive state
const text = ref("");
const startTime = ref(null);
const endTime = ref(null);
const selectedSentence = ref("");
const errorCount = ref(0);
const accuracy = ref(100);

// Add more computed properties
const isComplete = computed(() => text.value === selectedSentence.value);
const elapsedTime = computed(() => {
  if (!startTime.value) return 0;
  const endTimeValue = endTime.value || Date.now();
  return (endTimeValue - startTime.value) / 1000;
});
const wpm = computed(() => {
  if (!startTime.value || elapsedTime.value === 0) return 0;
  const words = text.value.trim().split(/\s+/).length || 0;
  return Math.round((words / elapsedTime.value) * 60);
});

// Improved character class handling
const getCharClass = (index) => {
  if (!text.value[index]) return "pending";
  return text.value[index] === selectedSentence.value[index] ? "correct" : "incorrect";
};

// Add keystroke tracking
const totalKeystrokes = ref(0);
const correctKeystrokes = ref(0);
const totalAttemptedChars = ref(0);

// Update handleTyping function
const handleTyping = () => {
  // Start timer on first character
  if (!startTime.value && text.value.length > 0) {
    startTime.value = Date.now();
  }
  
  // Set end time if completed
  if (text.value === selectedSentence.value) {
    endTime.value = Date.now();
  }

  // Track keystrokes and calculate accuracy
  if (text.value.length === 0) {
    errorCount.value = 0;
    accuracy.value = 100;
    totalKeystrokes.value = 0;
    correctKeystrokes.value = 0;
    totalAttemptedChars.value = 0;
  } else {
    const currentLength = text.value.length;
    
    // New keystroke
    if (currentLength > totalAttemptedChars.value) {
      totalKeystrokes.value++;
      const lastCharIndex = currentLength - 1;
      
      if (text.value[lastCharIndex] === selectedSentence.value[lastCharIndex]) {
        correctKeystrokes.value++;
      }
    }
    
    totalAttemptedChars.value = currentLength;

    // Calculate accuracy based on total keystrokes (including mistakes)
    if (totalKeystrokes.value > 0) {
      accuracy.value = Math.round((correctKeystrokes.value / totalKeystrokes.value) * 100);
    }
    errorCount.value = totalKeystrokes.value - correctKeystrokes.value;
  }
};

// Update initializeTest function
const initializeTest = () => {
  selectedSentence.value = sentences[Math.floor(Math.random() * sentences.length)];
  text.value = "";
  startTime.value = null;
  endTime.value = null;
  errorCount.value = 0;
  accuracy.value = 100;
  totalKeystrokes.value = 0;
  correctKeystrokes.value = 0;
  totalAttemptedChars.value = 0;
};

// Add keyboard handling
const handleKeyDown = (e) => {
  if (isComplete.value && e.key === 'Enter') {
    restartTest();
  }
};

// Add timer update
const currentTime = ref(Date.now());
let timerInterval;

const updateTimer = () => {
  if (startTime.value && !endTime.value) {
    currentTime.value = Date.now();
  }
};

onMounted(() => {
  initializeTest();
  window.addEventListener('keydown', handleKeyDown);
  // Start timer interval
  timerInterval = setInterval(updateTimer, 100);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  // Clear timer interval
  clearInterval(timerInterval);
});

const restartTest = () => {
  initializeTest();
  currentTime.value = Date.now();
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');

.container {
  max-width: 700px;
  margin: 50px auto;
  text-align: center;
  padding: 30px;
  background: #111;
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  color: #f1c40f;
  font-family: 'JetBrains Mono', monospace;
}
.title {
  font-size: 2em;
  margin-bottom: 15px;
  color: #f1c40f;
}
.instruction {
  font-size: 1.2em;
  color: #f1c40f;
  margin-bottom: 10px;
}
.sentence {
  font-size: 1.4em;
  font-weight: bold;
  background: #222;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  color: #f1c40f;
  white-space: pre-wrap;
  line-height: 1.5;
}
.typing-area {
  width: 100%;
  height: 100px;
  margin-top: 10px;
  padding: 12px;
  font-size: 1.3em;
  font-family: 'JetBrains Mono', monospace;
  border-radius: 8px;
  border: none;
  box-shadow: inset 0 3px 6px rgba(0, 0, 0, 0.3);
  color: #f1c40f;
  background: #000;
  outline: none;
  resize: none;
}
.correct {
  color: #f1c40f;
}
.incorrect {
  color: #e74c3c;
  text-decoration: underline;
}
.result {
  font-size: 1.3em;
  color: #27ae60;
  margin-top: 15px;
  font-weight: bold;
}
.restart-btn {
  margin-top: 20px;
  padding: 14px 22px;
  font-size: 1.3em;
  cursor: pointer;
  border: none;
  background: linear-gradient(135deg, #f1c40f, #e67e22);
  color: #1a1a1a;
  border-radius: 50px;
  font-weight: bold;
  box-shadow: 0 4px 10px rgba(241, 196, 15, 0.5);
  transition: background 0.3s ease, transform 0.2s;
}
.restart-btn:hover {
  background: linear-gradient(135deg, #d4ac0d, #c0392b);
  transform: scale(1.1);
}
.restart-btn:active {
  transform: scale(0.95);
  box-shadow: 0 2px 6px rgba(241, 196, 15, 0.3);
}

.stats {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin: 1rem 0;
  flex-wrap: wrap;
}

.stat-item {
  background: #222;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  min-width: 120px;
}

.stat-label {
  font-size: 0.9em;
  opacity: 0.8;
}

.stat-value {
  font-size: 1.2em;
  font-weight: bold;
}

.pending {
  color: #666;
}

/* Add focus styles for accessibility */
.typing-area:focus {
  box-shadow: 0 0 0 3px rgba(241, 196, 15, 0.5);
}

.restart-btn:focus {
  outline: 3px solid rgba(241, 196, 15, 0.5);
  outline-offset: 2px;
}

/* Add responsive design */
@media (max-width: 600px) {
  .container {
    margin: 20px 10px;
    padding: 15px;
  }
  
  .stats {
    gap: 1rem;
  }
  
  .stat-item {
    min-width: 100px;
  }
}
</style>
