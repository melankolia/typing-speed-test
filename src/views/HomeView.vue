<template>
  <div class="container" role="main">
    <h1 class="title">🚀 Typing Speed Test</h1>
    
    <div class="sentence-types">
      <button 
        v-for="type in ['default', 'quote', 'programming', 'business']" 
        :key="type"
        @click="changeSentenceType(type)"
        :class="{ active: sentenceType === type }"
        class="type-btn"
      >
        {{ type.charAt(0).toUpperCase() + type.slice(1) }}
      </button>
    </div>
    
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

    <!-- Add Web3 connection button -->
    <div class="web3-section">
      <button 
        @click="connectWallet" 
        class="connect-btn"
        v-if="!isConnected"
        :disabled="isConnecting"
      >
        <span class="connect-btn-content">
          <span class="wallet-icon">{{ isConnecting ? '⏳' : '🦊' }}</span>
          {{ isConnecting ? 'Connecting...' : 'Connect Wallet' }}
        </span>
      </button>
      
      <!-- High Scores Section -->
      <div v-if="isConnected && (highScores.length || pendingScores.length > 0)" class="high-scores">
        <h3>🏆 High Scores</h3>
        <div class="scores-list">
          <div v-for="(score, index) in displayScores" 
               :key="index" 
               :class="['score-item', { 'pending-score': score.isPending }]"
          >
            <span class="score-address">
              {{ score.isPending ? 'Pending...' : formatAddress(score.player) }}
            </span>
            <span>{{ score.wpm }} WPM</span>
            <span>{{ score.accuracy }}%</span>
            <span>{{ score.category }}</span>
            <span 
              v-if="score.isPending" 
              class="pending-badge"
            >
              {{ pendingScores.length > 1 ? `Pending (${pendingScores.length})...` : 'Pending...' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Update results section -->
    <div v-if="isComplete" class="results" role="status" aria-live="polite">
      <p class="result">
        🎉 Great job! Your results:
        <br>
        Speed: <strong>{{ wpm }} WPM</strong>
        <br>
        Accuracy: <strong>{{ accuracy }}%</strong>
        <br>
        <span v-if="isConnected" class="auto-save-text">
          {{ pendingScores.length > 0 
            ? `Saving scores... (${pendingScores.length} pending)` 
            : 'Score will be saved automatically...' 
          }}
        </span>
        <span v-else class="connect-wallet-text">
          Connect wallet to save your score!
        </span>
      </p>
      <button 
        @click="restartTest" 
        class="restart-btn"
        aria-label="Start a new test"
      >
        🔄 Try Again
      </button>
    </div>

    <!-- Add a loading spinner component -->
    <div v-if="isSaving" class="loading-overlay">
      <div class="loading-spinner"></div>
    </div>

    <!-- Add toast notification -->
    <Transition name="fade">
      <ToastNotification
        v-if="toast"
        :message="toast.message"
        :type="toast.type"
      />
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from "vue";
import { web3Service } from '@/services/web3Service';
import ToastNotification from '@/components/ToastNotification.vue';

// Move sentences to a separate config file
import { sentences, getNewSentence, getSentenceByType } from '@/config/sentences';

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

// Add sentence type state
const sentenceType = ref('default'); // Can be 'default', 'quote', 'programming', 'business'

// Add reactive state for Web3
const isConnected = ref(false);
const highScores = ref([]);

// Add loading states
const isSaving = ref(false);
const isConnecting = ref(false);

const toast = ref(null);
const showToast = (message, type = 'success') => {
  toast.value = { message, type };
  setTimeout(() => {
    toast.value = null;
  }, 3000);
};

// Change pendingScore to pendingScores array
const pendingScores = ref([]);

// Add a helper function to format address
const formatAddress = (address) => {
  if (!address) return 'Unknown';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Update handleTyping function
const handleTyping = () => {
  // Start timer on first character
  if (!startTime.value && text.value.length > 0) {
    startTime.value = Date.now();
  }
  
  // Set end time and auto-save if completed
  if (text.value === selectedSentence.value) {
    endTime.value = Date.now();
    // Auto-save if connected to wallet
    if (isConnected.value) {
      saveScore();
    }
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
  // Get a new sentence based on type
  selectedSentence.value = sentenceType.value === 'default' 
    ? getNewSentence()
    : getSentenceByType(sentenceType.value);
    
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
  pendingScores.value = []; // Clear any pending scores
});

const restartTest = () => {
  initializeTest();
  currentTime.value = Date.now();
};

// Add sentence type selector
const changeSentenceType = (type) => {
  sentenceType.value = type;
  restartTest();
};

// Add methods for Web3 interaction
const connectWallet = async () => {
  try {
    isConnecting.value = true;
    await web3Service.connect();
    isConnected.value = true;
    await loadHighScores();
  } catch (error) {
    console.error('Failed to connect wallet:', error);
  } finally {
    isConnecting.value = false;
  }
};

const loadHighScores = async () => {
  if (isConnected.value) {
    highScores.value = await web3Service.getHighScores();
  }
};

// Update saveScore function
const saveScore = async () => {
  if (isConnected.value && isComplete.value) {
    try {
      // Create new pending score
      const newPendingScore = {
        id: Date.now(),
        player: 'Pending...',
        wpm: wpm.value,
        accuracy: accuracy.value,
        category: sentenceType.value,
        timestamp: new Date(),
        isPending: true
      };
      
      // Add to pending scores
      pendingScores.value.push(newPendingScore);
      
      // Wait 2 seconds before restarting to show final stats
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Start new game
      restartTest();
      
      // Save score in background
      await web3Service.saveScore(
        newPendingScore.wpm,
        newPendingScore.accuracy,
        newPendingScore.category
      );
      
      // Remove this specific pending score
      pendingScores.value = pendingScores.value.filter(
        score => score.id !== newPendingScore.id
      );
      
      await loadHighScores();
      showToast('Score saved successfully! 🎉');
    } catch (error) {
      console.error('Error saving score:', error);
      pendingScores.value = pendingScores.value.filter(
        score => score.id !== newPendingScore.id
      );
      showToast('Failed to save score. Please try again.', 'error');
    }
  }
};

// Update displayScores computed property
const displayScores = computed(() => {
  // Get all scores and pending scores
  const scores = [...highScores.value];
  if (pendingScores.value.length > 0) {
    scores.unshift(...pendingScores.value);
  }
  
  // Sort scores by WPM in descending order and take top 50
  return scores
    .sort((a, b) => b.wpm - a.wpm) // Sort by WPM
    .slice(0, 50); // Take top 50 scores
});
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

.sentence-types {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.type-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background: #222;
  color: #f1c40f;
  cursor: pointer;
  transition: all 0.3s ease;
}

.type-btn:hover {
  background: #333;
}

.type-btn.active {
  background: #f1c40f;
  color: #222;
}

/* Add Web3 styles */
.web3-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #333;
}

.connect-btn {
  background: #2ecc71;
  color: white;
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.1em;
  transition: all 0.3s ease;
  min-width: 200px; /* Ensure consistent width */
}

.connect-btn:disabled {
  background: #1a8a4c;
  cursor: not-allowed;
  transform: none;
}

.connect-btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.wallet-icon {
  display: inline-block;
  transition: opacity 0.3s ease;
}

/* Remove the rotating animation */
.connect-btn:disabled span:first-child {
  animation: none;
}

/* Optional: Add a subtle pulse animation for the connecting state */
@keyframes subtle-pulse {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}

.connect-btn:disabled .wallet-icon {
  animation: subtle-pulse 1.5s infinite ease-in-out;
}

.high-scores {
  margin-top: 2rem;
}

.scores-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
  max-height: 400px; /* Limit height */
  overflow-y: auto; /* Add scrolling */
  padding-right: 10px; /* Space for scrollbar */
}

/* Add custom scrollbar styling */
.scores-list::-webkit-scrollbar {
  width: 8px;
}

.scores-list::-webkit-scrollbar-track {
  background: #1a1a1a;
  border-radius: 4px;
}

.scores-list::-webkit-scrollbar-thumb {
  background: #f1c40f;
  border-radius: 4px;
}

.scores-list::-webkit-scrollbar-thumb:hover {
  background: #f39c12;
}

.score-item {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 1rem;
  padding: 0.8rem;
  background: #222;
  border-radius: 4px;
  align-items: center;
}

.score-address {
  font-family: 'JetBrains Mono', monospace;
  color: #f1c40f;
  font-size: 0.9em;
}

.save-score-btn {
  margin-top: 1rem;
  background: #3498db;
  color: white;
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.1em;
  transition: all 0.3s ease;
}

.save-score-btn:hover {
  background: #2980b9;
}

/* Add these styles */
.connect-btn:disabled,
.save-score-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #f1c40f;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Update pending score styles */
.pending-score {
  position: relative;
  opacity: 0.8;
  background: #2c3e50 !important;
  border: 1px solid #f1c40f;
  transition: all 0.3s ease;
}

.pending-score:not(:first-child) {
  opacity: 0.6;
}

.pending-badge {
  position: absolute;
  top: -10px;
  right: -10px;
  background: #f1c40f;
  color: #2c3e50;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8em;
  font-weight: bold;
  animation: pulse 1.5s infinite;
  white-space: nowrap;
}

/* Update auto-save text for multiple pending */
.auto-save-text {
  font-size: 0.9em;
  color: #2ecc71;
  display: block;
  margin-top: 0.5rem;
  transition: all 0.3s ease;
}

.auto-save-text:has(+ .pending-count) {
  color: #f1c40f;
}

.connect-wallet-text {
  font-size: 0.9em;
  color: #f1c40f;
  display: block;
  margin-top: 0.5rem;
}
</style>
