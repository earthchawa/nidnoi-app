const STORAGE_KEY = 'nidnoi_progress_v2';

let dailyData = {
  date: '',
  theme: '',
  words: []
};

let appState = {
  lastLessonDate: '',
  currentIndex: 0,
  learnedIds: [],
  quizPassed: false,
  streak: 0,
  lastStreakDate: ''
};

let quizQuestions = [];
let currentQuizIndex = 0;
let currentQuizScore = 0;
let quizAnswered = false;

// 1. Initialize & Fetch Daily Data
async function initApp() {
  try {
    // เติม timestamp ป้องกัน Browser Cache เวลาไฟล์ JSON อัปเดตใหม่แต่ละวัน
    const response = await fetch(`./data/daily-words.json?t=${new Date().getTime()}`);
    if (!response.ok) throw new Error('Failed to load daily words');
    dailyData = await response.json();
  } catch (error) {
    console.error('Error loading JSON, using fallback:', error);
    document.getElementById('daily-theme').textContent = 'Offline Mode';
    return;
  }

  loadState();
  bindEvents();
  renderPills();
  renderCurrentWord();
  updateHeaderUI();

  if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
  }
}

// 2. State Management (Handles Daily Reset & Streak)
function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    appState = { ...appState, ...JSON.parse(saved) };
  }

  // หากไฟล์ JSON เป็นของวันใหม่ ให้รีเซ็ตความคืบหน้ารายวัน แต่เก็บ Streak ไว้
  if (appState.lastLessonDate !== dailyData.date) {
    appState.lastLessonDate = dailyData.date;
    appState.currentIndex = 0;
    appState.learnedIds = [];
    appState.quizPassed = false;
    saveState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  updateHeaderUI();
}

function markDailyStreakCompleted() {
  if (appState.lastStreakDate !== dailyData.date) {
    appState.streak += 1;
    appState.lastStreakDate = dailyData.date;
    saveState();
  }
}

// 3. UI Rendering
function updateHeaderUI() {
  const total = dailyData.words.length;
  const learnedCount = appState.learnedIds.length;

  document.getElementById('daily-theme').textContent = `${dailyData.theme} (${dailyData.date})`;
  document.getElementById('learned-count').textContent = `${learnedCount}/${total}`;
  document.getElementById('streak-count').textContent = appState.streak;

  let progressPercent = total > 0 ? (learnedCount / total) * 80 : 0;
  if (appState.quizPassed) progressPercent += 20;
  document.getElementById('main-progress-bar').style.width = `${progressPercent}%`;

  const quizDot = document.getElementById('nav-quiz-dot');
  if (appState.quizPassed) {
    quizDot.classList.add('hidden');
  } else {
    quizDot.classList.remove('hidden');
  }
}

function renderPills() {
  const container = document.getElementById('word-pills');
  container.innerHTML = '';

  dailyData.words.forEach((word, idx) => {
    const isLearned = appState.learnedIds.includes(word.id);
    const isCurrent = idx === appState.currentIndex;

    const btn = document.createElement('button');
    btn.onclick = () => {
      appState.currentIndex = idx;
      saveState();
      renderCurrentWord();
    };

    let classes = 'w-11 h-11 rounded-2xl font-black text-sm flex items-center justify-center transition-all ';
    if (isCurrent) {
      classes += 'bg-duo-blue text-white shadow-md scale-110 ring-4 ring-sky-100';
    } else if (isLearned) {
      classes += 'bg-green-100 text-duo-greenDark border-2 border-duo-green';
    } else {
      classes += 'bg-gray-100 text-gray-400 border-2 border-gray-200';
    }

    btn.className = classes;
    btn.innerHTML = isLearned ? '✓' : idx + 1;
    container.appendChild(btn);
  });
}

function renderCurrentWord() {
  const word = dailyData.words[appState.currentIndex];
  if (!word) return;

  const isLearned = appState.learnedIds.includes(word.id);

  document.getElementById('word-category').textContent = word.category;
  document.getElementById('word-emoji').textContent = word.emoji;
  document.getElementById('word-thai').textContent = word.thai;
  document.getElementById('word-phonetic').textContent = word.phonetic;
  document.getElementById('word-english').textContent = word.english;

  document.getElementById('word-ex-thai').textContent = word.exThai;
  document.getElementById('word-ex-phonetic').textContent = word.exPhonetic;
  document.getElementById('word-ex-english').textContent = `"${word.exEnglish}"`;
  document.getElementById('word-note').textContent = `💡 Tip: ${word.note}`;

  const statusBadge = document.getElementById('word-status-badge');
  const markBtn = document.getElementById('btn-mark-learned');

  if (isLearned) {
    statusBadge.textContent = '✓ Learned';
    statusBadge.className = 'text-xs font-extrabold px-3 py-1 rounded-full bg-green-100 text-duo-greenDark';
    markBtn.className = 'flex-1 btn-3d-white text-duo-greenDark font-extrabold py-4 px-6 rounded-2xl text-lg flex items-center justify-center gap-2';
    markBtn.innerHTML = '<span>✅ Learned!</span>';
  } else {
    statusBadge.textContent = `Word ${appState.currentIndex + 1} of ${dailyData.words.length}`;
    statusBadge.className = 'text-xs font-extrabold px-3 py-1 rounded-full bg-gray-100 text-gray-500';
    markBtn.className = 'flex-1 btn-3d-green text-white font-extrabold py-4 px-6 rounded-2xl text-lg flex items-center justify-center gap-2';
    markBtn.innerHTML = '<span>✨ Mark as Learned</span>';
  }

  renderPills();
}

// 4. User Actions & Speech
function toggleLearned() {
  const currentWord = dailyData.words[appState.currentIndex];
  const idx = appState.learnedIds.indexOf(currentWord.id);

  if (idx === -1) {
    appState.learnedIds.push(currentWord.id);
    showToast('Word marked as learned! 🌟');

    if (appState.learnedIds.length === dailyData.words.length) {
      markDailyStreakCompleted();
      triggerConfetti();
      setTimeout(() => showToast('All words learned! Take the Quick Quiz 🎯'), 1200);
    } else if (appState.currentIndex < dailyData.words.length - 1) {
      setTimeout(() => nextWord(), 350);
    }
  } else {
    appState.learnedIds.splice(idx, 1);
  }

  saveState();
  renderCurrentWord();
}

function prevWord() {
  appState.currentIndex = appState.currentIndex > 0 ? appState.currentIndex - 1 : dailyData.words.length - 1;
  saveState();
  renderCurrentWord();
}

function nextWord() {
  appState.currentIndex = appState.currentIndex < dailyData.words.length - 1 ? appState.currentIndex + 1 : 0;
  saveState();
  renderCurrentWord();
}

function speakThai(text) {
  if (!('speechSynthesis' in window)) {
    showToast('Speech not supported on this device');
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'th-TH';
  utterance.rate = 0.85;

  const voices = window.speechSynthesis.getVoices();
  const thaiVoice = voices.find(v => v.lang.includes('th') || v.lang.includes('TH'));
  if (thaiVoice) utterance.voice = thaiVoice;

  window.speechSynthesis.speak(utterance);
}

// 5. Quiz Engine
function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function startQuiz() {
  quizQuestions = shuffleArray(dailyData.words);
  currentQuizIndex = 0;
  currentQuizScore = 0;

  document.getElementById('quiz-result-box').classList.add('hidden');
  document.getElementById('quiz-active-box').classList.remove('hidden');
  renderQuizQuestion();
}

function renderQuizQuestion() {
  quizAnswered = false;
  const currentQ = quizQuestions[currentQuizIndex];

  document.getElementById('quiz-step-text').textContent = `Question ${currentQuizIndex + 1} of ${quizQuestions.length}`;
  document.getElementById('quiz-emoji').textContent = currentQ.emoji;
  document.getElementById('quiz-thai').textContent = currentQ.thai;
  document.getElementById('quiz-phonetic').textContent = currentQ.phonetic;
  document.getElementById('quiz-feedback').classList.add('hidden');

  const wrongPool = dailyData.words.filter(w => w.id !== currentQ.id);
  const wrongChoices = shuffleArray(wrongPool).slice(0, 2);
  const options = shuffleArray([currentQ, ...wrongChoices]);

  const optionsContainer = document.getElementById('quiz-options');
  optionsContainer.innerHTML = '';

  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'w-full btn-3d-white p-4 rounded-2xl text-left font-extrabold text-gray-700 text-base flex items-center justify-between';
    btn.innerHTML = `<span>${opt.english}</span><span class="text-xl">${opt.emoji}</span>`;
    btn.onclick = () => handleQuizAnswer(btn, opt.id === currentQ.id, currentQ.english);
    optionsContainer.appendChild(btn);
  });
}

function handleQuizAnswer(selectedBtn, isCorrect, correctAnswerText) {
  if (quizAnswered) return;
  quizAnswered = true;

  const feedbackBox = document.getElementById('quiz-feedback');
  const feedbackTitle = document.getElementById('quiz-feedback-title');
  const feedbackSub = document.getElementById('quiz-feedback-sub');
  const continueBtn = document.getElementById('btn-quiz-continue');

  document.getElementById('quiz-options').querySelectorAll('button').forEach(b => b.classList.add('pointer-events-none'));
  feedbackBox.classList.remove('hidden');

  if (isCorrect) {
    currentQuizScore++;
    selectedBtn.className = 'w-full p-4 rounded-2xl text-left font-extrabold text-duo-greenDark bg-green-100 border-2 border-duo-green text-base flex items-center justify-between';
    feedbackBox.className = 'rounded-2xl p-4 border-2 bg-green-50 border-duo-green text-duo-greenDark';
    feedbackTitle.textContent = '🎉 Correct! เก่งมาก (Kèng mâak)';
    feedbackSub.textContent = 'Great job!';
    continueBtn.className = 'px-5 py-2.5 rounded-xl font-extrabold text-white text-sm btn-3d-green';
    speakThai(quizQuestions[currentQuizIndex].thai);
  } else {
    selectedBtn.className = 'w-full p-4 rounded-2xl text-left font-extrabold text-duo-redDark bg-red-100 border-2 border-duo-red text-base flex items-center justify-between';
    feedbackBox.className = 'rounded-2xl p-4 border-2 bg-red-50 border-duo-red text-duo-redDark';
    feedbackTitle.textContent = 'Not quite 💡';
    feedbackSub.textContent = `Correct answer: "${correctAnswerText}"`;
    continueBtn.className = 'px-5 py-2.5 rounded-xl font-extrabold text-white text-sm bg-duo-red';
  }
}

function finishQuiz() {
  document.getElementById('quiz-active-box').classList.add('hidden');
  document.getElementById('quiz-result-box').classList.remove('hidden');

  const total = quizQuestions.length;
  document.getElementById('result-score').textContent = `${currentQuizScore} / ${total}`;

  if (currentQuizScore >= Math.ceil(total * 0.6)) {
    appState.quizPassed = true;
    markDailyStreakCompleted();
    saveState();
    triggerConfetti();
    document.getElementById('result-emoji').textContent = '🏆';
    document.getElementById('result-title').textContent = 'เก่งมาก! (Amazing!)';
    document.getElementById('result-subtitle').textContent = 'You completed today’s Thai quiz!';
  } else {
    document.getElementById('result-emoji').textContent = '💪';
    document.getElementById('result-title').textContent = 'Keep Practicing!';
    document.getElementById('result-subtitle').textContent = 'Review today’s flashcards and try again.';
  }
}

// 6. Event Listeners & Utilities
function switchTab(tab) {
  const viewLearn = document.getElementById('view-learn');
  const viewQuiz = document.getElementById('view-quiz');
  const navLearn = document.getElementById('nav-learn');
  const navQuiz = document.getElementById('nav-quiz');

  if (tab === 'learn') {
    viewLearn.classList.remove('hidden');
    viewQuiz.classList.add('hidden');
    navLearn.className = 'flex flex-col items-center gap-1 w-1/2 py-1 rounded-2xl transition text-duo-green scale-105';
    navQuiz.className = 'flex flex-col items-center gap-1 w-1/2 py-1 rounded-2xl transition text-gray-400 relative';
    renderCurrentWord();
  } else {
    viewLearn.classList.add('hidden');
    viewQuiz.classList.remove('hidden');
    navQuiz.className = 'flex flex-col items-center gap-1 w-1/2 py-1 rounded-2xl transition text-duo-purple scale-105 relative';
    navLearn.className = 'flex flex-col items-center gap-1 w-1/2 py-1 rounded-2xl transition text-gray-400';
    startQuiz();
  }
}

function bindEvents() {
  document.getElementById('btn-prev').onclick = prevWord;
  document.getElementById('btn-next').onclick = nextWord;
  document.getElementById('btn-mark-learned').onclick = toggleLearned;
  
  document.getElementById('btn-speak-word').onclick = () => speakThai(dailyData.words[appState.currentIndex].thai);
  document.getElementById('btn-speak-ex').onclick = () => speakThai(dailyData.words[appState.currentIndex].exThai);
  document.getElementById('btn-speak-quiz').onclick = () => speakThai(quizQuestions[currentQuizIndex].thai);

  document.getElementById('btn-quiz-continue').onclick = () => {
    if (currentQuizIndex < quizQuestions.length - 1) {
      currentQuizIndex++;
      renderQuizQuestion();
    } else {
      finishQuiz();
    }
  };

  document.getElementById('btn-quiz-retry').onclick = startQuiz;
  document.getElementById('btn-back-learn').onclick = () => switchTab('learn');
  document.getElementById('nav-learn').onclick = () => switchTab('learn');
  document.getElementById('nav-quiz').onclick = () => switchTab('quiz');
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.replace('opacity-0', 'opacity-100');
  setTimeout(() => toast.classList.replace('opacity-100', 'opacity-0'), 2200);
}

function triggerConfetti() {
  if (typeof confetti === 'function') {
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
  }
}

window.addEventListener('DOMContentLoaded', initApp);