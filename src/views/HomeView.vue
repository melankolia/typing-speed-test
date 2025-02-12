<template>
  <div class="container">
    <h2 class="title">🚀 Typing Speed Test</h2>
    <p class="instruction"><strong>Type the following sentence:</strong></p>
    <p class="sentence">
      <span v-for="(char, index) in selectedSentence" :key="index" 
            :class="getCharClass(index)">{{ char }}</span>
    </p>
    <textarea 
      v-model="text" 
      @input="handleTyping" 
      :disabled="isComplete" 
      placeholder="Start typing here..."
      class="typing-area"
      autofocus
    ></textarea>
    <p v-if="isComplete" class="result">
      🎉 Great job! Your speed: <strong>{{ wpm }} WPM</strong>
    </p>
    <button v-if="isComplete" @click="restartTest" class="restart-btn">🔄 Try Again</button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";

const sentences = [
  "The quick brown fox jumps over the lazy dog.",
  "Vue 3 makes frontend development a breeze!",
  "Speed is the key to becoming a great typist."
];

const text = ref("");
const startTime = ref(null);
const endTime = ref(null);
const selectedSentence = ref("");

const initializeTest = () => {
  selectedSentence.value = sentences[Math.floor(Math.random() * sentences.length)];
  text.value = "";
  startTime.value = null;
  endTime.value = null;
};

onMounted(() => {
  initializeTest();
});

const isComplete = computed(() => text.value === selectedSentence.value);
const elapsedTime = computed(() => (endTime.value && startTime.value) ? (endTime.value - startTime.value) / 1000 : 0);
const wpm = computed(() => elapsedTime.value ? Math.round((text.value.trim().split(/\s+/).length / elapsedTime.value) * 60) : 0);

const getCharClass = (index) => {
  if (!text.value[index]) return "";
  return text.value[index] === selectedSentence.value[index] ? "correct" : "incorrect";
};

watch(text, (newValue) => {
  if (!startTime.value && newValue.length > 0) {
    startTime.value = Date.now();
  }
  if (newValue === selectedSentence.value) {
    endTime.value = Date.now();
  }
});

const restartTest = () => {
  initializeTest();
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
</style>
