
const state = {
  data: {
    passages: [],
    notes: {},
    exercises: [],
    flashcards: [],
    conjugation: [],
    sentences: {},
    vocab: []
  },
  ui: {
    section: 'dashboard',
    practiceTab: 'exercises',
    vocabTab: 'list'
  },
  exercise: {
    pool: [],
    index: 0,
    current: null,
    answered: false
  },
  typing: { currentIndex: 0 },
  writing: { current: null },
  flash: { pool: [], index: 0, flipped: false },
  conj: { pool: [], index: 0, current: null, quiz: null },
  match: { pairs: [], selected: null, matched: 0 }
};

const LS_KEY = 'german_study_app_github_v3';
let currentUtterance = null;

const q = (s) => document.querySelector(s);
const qa = (s) => Array.from(document.querySelectorAll(s));

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function defaultStore() {
  return {
    theme: 'theme-focus',
    missionPreset: 'medium',
    daily: {},
    weakAreas: {},
    localPassages: []
  };
}

function loadStore() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return Object.assign(defaultStore(), raw ? JSON.parse(raw) : {});
  } catch {
    return defaultStore();
  }
}

function saveStore() {
  localStorage.setItem(LS_KEY, JSON.stringify(store));
}

let store = loadStore();

function ensureToday() {
  const key = todayKey();
  if (!store.daily[key]) {
    store.daily[key] = {
      passages: 0,
      exercises: 0,
      exercisesCorrect: 0,
      vocab: 0,
      writing: 0,
      typingChecks: 0
    };
  }
}
ensureToday();

const missionTargets = {
  easy: { passages: 1, exercises: 10, vocab: 8, writing: 1 },
  medium: { passages: 2, exercises: 20, vocab: 12, writing: 2 },
  hard: { passages: 3, exercises: 35, vocab: 20, writing: 3 },
  intense: { passages: 5, exercises: 60, vocab: 30, writing: 5 }
};

async function loadJsonSmart(relPath) {
  const candidates = [
    relPath,
    './' + relPath,
    new URL(relPath, window.location.href).toString()
  ];
  let lastError = null;

  for (const path of candidates) {
    try {
      const res = await fetch(path, { cache: 'no-store' });
      if (!res.ok) throw new Error(`${relPath} -> HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error(`Failed to load ${relPath}`);
}

async function init() {
  try {
    const [passages, notes, exercises, flashcards, conjugation, sentences, vocab] = await Promise.all([
      loadJsonSmart('data/passages.json'),
      loadJsonSmart('data/notes.json'),
      loadJsonSmart('data/exercises.json'),
      loadJsonSmart('data/flashcards.json'),
      loadJsonSmart('data/conjugation.json'),
      loadJsonSmart('data/sentences.json'),
      loadJsonSmart('data/vocab.json')
    ]);

    state.data.passages = [...(Array.isArray(passages) ? passages : []), ...(store.localPassages || [])];
    state.data.notes = notes || {};
    state.data.exercises = exercises?.exercises || (Array.isArray(exercises) ? exercises : []);
    state.data.flashcards = flashcards?.flashcards || (Array.isArray(flashcards) ? flashcards : []);
    state.data.conjugation = conjugation?.verbs || (Array.isArray(conjugation) ? conjugation : []);
    state.data.sentences = sentences || {};
    state.data.vocab = Array.isArray(vocab) ? vocab : (vocab?.items || vocab?.words || []);

    bootstrap();
  } catch (err) {
    console.error(err);
    q('#dataCounts').textContent = 'Data failed to load';
    alert('The app could not load its JSON files. Make sure index.html, app.js, styles.css, the data folder, and the assets folder are all in the repo root.');
  }
}

function bootstrap() {
  document.body.className = store.theme;
  q('#themeSelect').value = store.theme;
  q('#missionPreset').value = store.missionPreset;
  bindNav();
  setupTopControls();
  setupPassages();
  setupExercises();
  setupTyping();
  setupWriting();
  setupVocab();
  setupConj();
  setupFlashcards();
  setupGrammar();
  setupNotes();
  buildCounts();
  buildRoadmap();
  updateMissionUI();
  buildInsights();
  updateAudioState(false);
  goSection('dashboard');
}

function bindNav() {
  qa('.navbtn').forEach((btn) => {
    btn.onclick = () => goSection(btn.dataset.section);
  });
  qa('[data-practice]').forEach((btn) => {
    btn.onclick = () => switchPractice(btn.dataset.practice);
  });
  qa('[data-vocabtab]').forEach((btn) => {
    btn.onclick = () => switchVocabTab(btn.dataset.vocabtab);
  });
}

function goSection(name) {
  state.ui.section = name;
  qa('.navbtn').forEach((b) => b.classList.toggle('active', b.dataset.section === name));
  qa('.app-section').forEach((sec) => sec.classList.add('hidden'));
  q('#section-' + name)?.classList.remove('hidden');
}
window.goSection = goSection;

function setupTopControls() {
  q('#themeSelect').onchange = (e) => {
    store.theme = e.target.value;
    document.body.className = store.theme;
    saveStore();
  };
  q('#missionPreset').onchange = (e) => {
    store.missionPreset = e.target.value;
    saveStore();
    updateMissionUI();
    buildInsights();
  };
  q('#resetTodayBtn').onclick = () => {
    store.daily[todayKey()] = { passages: 0, exercises: 0, exercisesCorrect: 0, vocab: 0, writing: 0, typingChecks: 0 };
    saveStore();
    updateMissionUI();
    buildInsights();
  };
}

function buildCounts() {
  q('#dataCounts').textContent = `${state.data.passages.length} passages • ${Object.keys(state.data.notes).length} notes • ${state.data.exercises.length} exercises • ${state.data.vocab.length} vocab • ${state.data.conjugation.length} verbs`;
}

function updateStreak() {
  const days = Object.keys(store.daily).sort();
  let streak = 0;
  let d = new Date();
  while (true) {
    const key = d.toISOString().slice(0, 10);
    const day = store.daily[key];
    if (day && (day.passages + day.exercises + day.vocab + day.writing) > 0) {
      streak += 1;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  q('#streakBadge').textContent = 'Streak ' + streak;
}

function topWeak() {
  const entries = Object.entries(store.weakAreas || {}).sort((a, b) => b[1] - a[1]);
  return entries[0]?.[0] || '—';
}

function updateWeakBadge() {
  q('#weakAreaBadge').textContent = 'Weak area: ' + topWeak().replaceAll('_', ' ');
}

function updateMissionUI() {
  ensureToday();
  const t = missionTargets[store.missionPreset] || missionTargets.medium;
  const d = store.daily[todayKey()];
  setMission('Passages', d.passages, t.passages);
  setMission('Exercises', d.exercisesCorrect, t.exercises);
  setMission('Vocab', d.vocab, t.vocab);
  setMission('Writing', d.writing, t.writing);
  q('#statPassages').textContent = d.passages;
  q('#statExercises').textContent = d.exercisesCorrect;
  q('#statVocab').textContent = d.vocab;
  q('#statWriting').textContent = d.writing;
  updateStreak();
  updateWeakBadge();
}

function setMission(name, current, target) {
  const id = 'mission' + name;
  q('#' + id).style.width = Math.min(100, (current / Math.max(1, target)) * 100) + '%';
  q('#' + id + 'Text').textContent = `${current}/${target}`;
}

function markArea(area, good = false) {
  if (!good) {
    store.weakAreas[area] = (store.weakAreas[area] || 0) + 1;
    saveStore();
    updateWeakBadge();
  }
}

function buildRoadmap() {
  const roadmap = [
    { level: 'A1', emoji: '🌱', focus: 'Build basics', items: ['articles + pronouns', 'present tense verbs', 'question words', 'simple daily sentences'] },
    { level: 'A2', emoji: '🚶', focus: 'Expand everyday German', items: ['Perfekt', 'modal verbs', 'prepositions', 'weil / dass / wenn'] },
    { level: 'B1', emoji: '🧭', focus: 'Handle real-life topics', items: ['relative clauses', 'reflexive verbs', 'word order', 'work, housing, shopping, health'] },
    { level: 'B2', emoji: '🚀', focus: 'Argue and write clearly', items: ['Konjunktiv II', 'passive', 'opinion phrases', 'formal and longer writing'] }
  ];
  q('#roadmapCards').innerHTML = roadmap.map((r) => `
    <div class="card">
      <div class="row" style="justify-content:space-between"><strong>${r.emoji} ${r.level}</strong><span class="pill">${r.focus}</span></div>
      <ul class="small">${r.items.map((i) => `<li>${i}</li>`).join('')}</ul>
    </div>
  `).join('');
}

function buildInsights() {
  ensureToday();
  const d = store.daily[todayKey()];
  const weak = topWeak();
  q('#insightsBox').innerHTML = `
    <p><strong>Today:</strong> ${d.passages} passages, ${d.exercisesCorrect} correct exercises, ${d.vocab} vocabulary items, ${d.writing} writing tasks.</p>
    <p><strong>Main weak spot:</strong> ${weak.replaceAll('_', ' ')}.</p>
    <p><strong>Suggestion:</strong> ${weak === '—' ? 'Start with one passage and 10 exercises.' : `Do 10 more ${weak.replaceAll('_', ' ')} exercises, then review one related note.`}</p>
  `;
}

// Passages
function setupPassages() {
  q('#passageLevel').innerHTML = ['All', 'A1', 'A2', 'B1', 'B2'].map((x) => `<option>${x}</option>`).join('');
  q('#passageLevel').onchange = renderPassages;
  q('#passageSearch').oninput = renderPassages;
  q('#saveLocalPassageBtn').onclick = saveLocalPassage;
  renderPassages();
}

function saveLocalPassage() {
  const german = q('#localPassageGerman').value.trim();
  const english = q('#localPassageEnglish').value.trim();
  if (!german) return;
  const firstLine = german.split('\n')[0].slice(0, 60);
  const p = {
    level: q('#localPassageLevel').value,
    chapter: 'Local entry',
    title: firstLine || 'Local passage',
    german,
    english
  };
  store.localPassages.push(p);
  state.data.passages.push(p);
  q('#localPassageGerman').value = '';
  q('#localPassageEnglish').value = '';
  saveStore();
  buildCounts();
  renderPassages();
}

function renderPassages() {
  const level = q('#passageLevel').value || 'All';
  const term = (q('#passageSearch').value || '').toLowerCase();
  const list = state.data.passages.filter((p) => {
    const blob = [p.title, p.chapter, p.german, p.english].filter(Boolean).join(' ').toLowerCase();
    return (level === 'All' || String(p.level || '').toUpperCase() === level) && (!term || blob.includes(term));
  });

  q('#passagesList').innerHTML = list.map((p) => `
    <div class="card">
      <div class="row" style="justify-content:space-between;gap:12px;align-items:flex-start">
        <div>
          <span class="pill">${escapeHtml(p.level || '')}</span>
          <strong>${escapeHtml(p.title || 'Untitled passage')}</strong>
          <div class="small muted">${escapeHtml(p.chapter || '')}</div>
        </div>
        <div class="row">
          <button onclick="listenPassageByText(${JSON.stringify(encodeURIComponent(p.german || ''))})">🔊 Listen</button>
          <button class="stop-audio-btn" onclick="stopSpeech()">⏹ Stop</button>
          <button onclick="countPassageDone()">✅ Done</button>
        </div>
      </div>
      <pre style="white-space:pre-wrap">${escapeHtml(p.german || '')}</pre>
      ${p.english ? `<details><summary>English</summary><pre style="white-space:pre-wrap">${escapeHtml(p.english)}</pre></details>` : ''}
    </div>
  `).join('') || '<div class="card">No passages found.</div>';
}

window.listenPassageByText = (encoded) => speak(decodeURIComponent(encoded));
window.stopSpeech = stopSpeech;
window.countPassageDone = () => {
  ensureToday();
  store.daily[todayKey()].passages += 1;
  saveStore();
  updateMissionUI();
  buildInsights();
};

function speak(text) {
  if (!('speechSynthesis' in window)) {
    alert('Speech is not supported in this browser.');
    return;
  }
  stopSpeech();
  currentUtterance = new SpeechSynthesisUtterance(text);
  currentUtterance.lang = 'de-DE';
  currentUtterance.rate = Number(q('#audioSpeed')?.value || 1);
  currentUtterance.onend = () => {
    currentUtterance = null;
    updateAudioState(false);
  };
  speechSynthesis.speak(currentUtterance);
  updateAudioState(true);
}

function stopSpeech() {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  currentUtterance = null;
  updateAudioState(false);
}

function updateAudioState(isPlaying) {
  qa('.stop-audio-btn').forEach((btn) => {
    btn.disabled = !isPlaying;
  });
}

// Practice
const typeLabels = {
  articles: 'Articles',
  prepositions: 'Prepositions',
  connectors: 'Connectors',
  adjectives: 'Adjectives',
  word_order: 'Word order',
  passive: 'Passive',
  konjunktiv_ii: 'Konjunktiv II',
  relative_clauses: 'Relative clauses',
  translation: 'Translation',
  sentence_build: 'Sentence building',
  error_fix: 'Error correction',
  multiple_choice: 'Multiple choice',
  infinitiv_zu: 'Infinitiv mit zu',
  infinitiv_ohne_zu: 'Infinitiv ohne zu',
  sowohl_als_auch: 'sowohl ... als auch',
  weder_noch: 'weder ... noch',
  zu_vs_dass: 'zu vs dass',
  misc: 'Mixed'
};

function setupExercises() {
  q('#exerciseLevel').innerHTML = ['All', 'A1', 'A2', 'B1', 'B2'].map((x) => `<option>${x}</option>`).join('');
  const types = ['All', ...new Set(state.data.exercises.map((e) => e.type || 'misc'))].sort();
  q('#exerciseType').innerHTML = types.map((t) => `<option value="${escapeHtml(t)}">${escapeHtml(typeLabels[t] || t)}</option>`).join('');
  q('#exerciseLevel').onchange = rebuildExercisePool;
  q('#exerciseType').onchange = rebuildExercisePool;
  q('#exerciseOrder').onchange = rebuildExercisePool;
  q('#checkExerciseBtn').onclick = checkExercise;
  q('#nextExerciseBtn').onclick = nextExercise;
  q('#restartExerciseBtn').onclick = rebuildExercisePool;
  switchPractice('exercises');
  rebuildExercisePool();
}

function switchPractice(tab) {
  state.ui.practiceTab = tab;
  qa('[data-practice]').forEach((b) => b.classList.toggle('active', b.dataset.practice === tab));
  q('#practice-exercises').classList.toggle('hidden', tab !== 'exercises');
  q('#practice-typing').classList.toggle('hidden', tab !== 'typing');
  q('#practice-writing').classList.toggle('hidden', tab !== 'writing');
}

function rebuildExercisePool() {
  const level = q('#exerciseLevel').value || 'All';
  const type = q('#exerciseType').value || 'All';
  const order = q('#exerciseOrder').value || 'random';
  let pool = state.data.exercises.filter((e) => (level === 'All' || e.level === level) && (type === 'All' || (e.type || 'misc') === type));
  if (order === 'random') pool = shuffle(pool);
  state.exercise.pool = pool;
  state.exercise.index = 0;
  renderExercise();
}

function renderExercise() {
  const pool = state.exercise.pool;
  q('#exerciseProgressPill').textContent = `Progress ${pool.length ? state.exercise.index + 1 : 0}/${pool.length}`;
  const ex = pool[state.exercise.index];
  state.exercise.current = ex || null;
  state.exercise.answered = false;

  if (!ex) {
    q('#exerciseQuestion').textContent = 'No exercises found for this filter.';
    q('#exerciseAnswer').value = '';
    q('#exerciseAnswer').disabled = true;
    q('#exerciseResult').innerHTML = 'Change the filters above.';
    q('#exerciseHintPill').textContent = 'Mode: —';
    return;
  }

  q('#exerciseAnswer').disabled = false;
  q('#exerciseQuestion').textContent = ex.question || 'Question';
  q('#exerciseAnswer').value = '';
  q('#exerciseResult').textContent = '';
  q('#exerciseHintPill').textContent = `Mode: ${ex.mode || 'typing'} • ${typeLabels[ex.type] || ex.type || 'mixed'}`;
}

function checkExercise() {
  const ex = state.exercise.current;
  if (!ex || state.exercise.answered) return;
  const user = normalize(q('#exerciseAnswer').value);
  const answers = Array.isArray(ex.answer) ? ex.answer : [ex.answer ?? ''];
  const ok = answers.some((a) => normalize(String(a)) === user);
  state.exercise.answered = true;
  ensureToday();
  store.daily[todayKey()].exercises += 1;
  if (ok) store.daily[todayKey()].exercisesCorrect += 1;
  if (!ok) markArea(ex.type || 'misc', false);
  saveStore();
  updateMissionUI();
  buildInsights();
  q('#exerciseResult').innerHTML = ok
    ? '<span class="good">✔ Correct</span>'
    : `<span class="bad">✘</span> Correct answer: ${escapeHtml(String(answers[0]))}${ex.hint ? `<br>Hint: ${escapeHtml(ex.hint)}` : ''}`;
}

function nextExercise() {
  if (!state.exercise.pool.length) return;
  state.exercise.index = (state.exercise.index + 1) % state.exercise.pool.length;
  renderExercise();
}

// Typing
function setupTyping() {
  q('#typingPassageSelect').innerHTML = state.data.passages.map((p, i) => `<option value="${i}">${escapeHtml((p.level || '') + ' • ' + (p.title || p.german?.slice(0, 40) || 'Passage'))}</option>`).join('');
  q('#typingPassageSelect').onchange = renderTypingPassage;
  q('#typingShowEnglish').onchange = renderTypingPassage;
  q('#typingListenBtn').onclick = () => {
    const p = state.data.passages[Number(q('#typingPassageSelect').value) || 0];
    speak(p?.german || '');
  };
  q('#typingStopBtn').onclick = stopSpeech;
  q('#checkTypingBtn').onclick = checkTyping;
  q('#clearTypingBtn').onclick = () => {
    q('#typingInput').value = '';
    q('#typingResult').textContent = '';
  };
  renderTypingPassage();
}

function renderTypingPassage() {
  const p = state.data.passages[Number(q('#typingPassageSelect').value) || 0];
  q('#typingReference').textContent = p?.german || '';
  const show = q('#typingShowEnglish').value === '1';
  q('#typingEnglishWrap').classList.toggle('hidden', !show);
  q('#typingEnglishWrap').textContent = show ? (p?.english || '') : '';
}

function checkTyping() {
  const ref = normalize(q('#typingReference').textContent);
  const user = normalize(q('#typingInput').value);
  const score = Math.round(similarity(ref, user) * 100);
  ensureToday();
  store.daily[todayKey()].typingChecks += 1;
  if (score < 90) markArea('typing', false);
  saveStore();
  buildInsights();
  q('#typingResult').innerHTML = score >= 95 ? `<span class="good">✔ Excellent (${score}%)</span>` : `Similarity: ${score}%`;
}

// Writing
function setupWriting() {
  q('#newWritingPromptBtn').onclick = newWritingPrompt;
  q('#checkWritingBtn').onclick = checkWriting;
  newWritingPrompt();
}

function getWritingPool() {
  return [
    ...((state.data.sentences.a2 || []).map((x) => ({ ...x, level: 'A2' }))),
    ...((state.data.sentences.b1 || []).map((x) => ({ ...x, level: 'B1' }))),
    ...((state.data.sentences.b2 || []).map((x) => ({ ...x, level: 'B2' })))
  ];
}

function newWritingPrompt() {
  const pool = getWritingPool();
  state.writing.current = pool[Math.floor(Math.random() * pool.length)] || null;
  q('#writingPrompt').textContent = state.writing.current?.en || 'No prompt available.';
  q('#writingInput').value = '';
  q('#writingResult').textContent = '';
}

function checkWriting() {
  const prompt = state.writing.current;
  const user = q('#writingInput').value.trim();
  if (!prompt || !user) return;
  const score = Math.round(similarity(normalize(prompt.de), normalize(user)) * 100);
  const ok = normalize(prompt.de) === normalize(user);
  ensureToday();
  store.daily[todayKey()].writing += 1;
  if (!ok) markArea('sentence_writing', false);
  saveStore();
  updateMissionUI();
  buildInsights();
  q('#writingResult').innerHTML = ok ? '<span class="good">✔ Excellent</span>' : `<span class="bad">Model answer:</span> ${escapeHtml(prompt.de)}<br>Similarity: ${score}%`;
}

// Vocab
function setupVocab() {
  q('#vocabLevel').innerHTML = ['All', 'A1', 'A2', 'B1', 'B2'].map((x) => `<option>${x}</option>`).join('');
  const topics = ['All', ...new Set(state.data.vocab.map((v) => v.topic || 'General'))].sort();
  q('#vocabTopic').innerHTML = topics.map((t) => `<option>${escapeHtml(t)}</option>`).join('');
  q('#vocabLevel').onchange = renderVocab;
  q('#vocabTopic').onchange = renderVocab;
  q('#vocabSearch').oninput = renderVocab;
  q('#newMatchGameBtn').onclick = buildMatchGame;
  renderVocab();
  buildMatchGame();
}

function switchVocabTab(tab) {
  state.ui.vocabTab = tab;
  qa('[data-vocabtab]').forEach((b) => b.classList.toggle('active', b.dataset.vocabtab === tab));
  q('#vocab-list-tab').classList.toggle('hidden', tab !== 'list');
  q('#vocab-game-tab').classList.toggle('hidden', tab !== 'game');
}

function renderVocab() {
  const level = q('#vocabLevel').value || 'All';
  const topic = q('#vocabTopic').value || 'All';
  const term = (q('#vocabSearch').value || '').toLowerCase();
  const list = state.data.vocab.filter((v) => {
    const blob = `${v.de || ''} ${v.en || ''} ${v.topic || ''}`.toLowerCase();
    return (level === 'All' || v.level === level) && (topic === 'All' || (v.topic || 'General') === topic) && (!term || blob.includes(term));
  });

  q('#vocabStats').textContent = `${list.length} vocabulary items shown`;
  q('#vocabList').innerHTML = list.slice(0, 250).map((v) => `
    <div class="card">
      <div class="row" style="justify-content:space-between">
        <div><span class="pill">${escapeHtml(v.level || '')}</span> <strong>${escapeHtml(v.de || '')}</strong> — ${escapeHtml(v.en || '')}</div>
        <button onclick="countVocabSeen()">👁 Seen</button>
      </div>
      <div class="small muted">${escapeHtml(v.topic || 'General')}</div>
      ${v.example_de ? `<div class="small" style="margin-top:8px"><em>${escapeHtml(v.example_de)}</em></div>` : ''}
    </div>
  `).join('') || '<div class="card">No vocabulary found for this filter.</div>';
}

window.countVocabSeen = () => {
  ensureToday();
  store.daily[todayKey()].vocab += 1;
  saveStore();
  updateMissionUI();
  buildInsights();
};

function buildMatchGame() {
  const pool = shuffle([...state.data.vocab]).slice(0, 6);
  state.match.pairs = pool;
  state.match.selected = null;
  state.match.matched = 0;
  q('#matchStatus').textContent = 'Select one German item and then its English pair.';
  q('#matchGerman').innerHTML = pool.map((v, i) => `<button class="match-btn" data-side="de" data-id="${i}">${escapeHtml(v.de)}</button>`).join('');
  const shuffledEn = shuffle(pool.map((v, i) => ({ id: i, en: v.en })));
  q('#matchEnglish').innerHTML = shuffledEn.map((v) => `<button class="match-btn" data-side="en" data-id="${v.id}">${escapeHtml(v.en)}</button>`).join('');
  qa('.match-btn').forEach((btn) => {
    btn.onclick = () => onMatchClick(btn);
  });
}

function onMatchClick(btn) {
  if (btn.classList.contains('done')) return;
  const side = btn.dataset.side;
  const id = btn.dataset.id;
  if (!state.match.selected) {
    state.match.selected = { side, id, el: btn };
    btn.classList.add('selected');
    return;
  }
  const prev = state.match.selected;
  if (prev.el === btn) return;
  const isMatch = prev.id === id && prev.side !== side;
  prev.el.classList.remove('selected');
  state.match.selected = null;
  if (isMatch) {
    prev.el.classList.add('done');
    btn.classList.add('done');
    state.match.matched += 1;
    ensureToday();
    store.daily[todayKey()].vocab += 1;
    saveStore();
    updateMissionUI();
    buildInsights();
    if (state.match.matched === state.match.pairs.length) q('#matchStatus').textContent = 'Round complete ✔';
  } else {
    q('#matchStatus').textContent = 'Not a match. Try again.';
  }
}

// Conjugation
function setupConj() {
  q('#conjLevel').innerHTML = ['All', 'A1', 'A2', 'B1', 'B2'].map((x) => `<option>${x}</option>`).join('');
  q('#conjLevel').onchange = filterConjPool;
  q('#conjSearch').oninput = filterConjPool;
  q('#nextVerbBtn').onclick = () => {
    if (!state.conj.pool.length) return;
    state.conj.index = (state.conj.index + 1) % state.conj.pool.length;
    renderConj();
  };
  q('#checkConjBtn').onclick = checkConjQuiz;
  q('#nextConjQuizBtn').onclick = newConjQuiz;
  filterConjPool();
}

function filterConjPool() {
  const level = q('#conjLevel').value || 'All';
  const term = (q('#conjSearch').value || '').toLowerCase();
  state.conj.pool = state.data.conjugation.filter((v) => (level === 'All' || v.level === level) && (!term || `${v.infinitive} ${v.english}`.toLowerCase().includes(term)));
  state.conj.index = 0;
  renderConj();
}

function renderConj() {
  const v = state.conj.pool[state.conj.index] || null;
  state.conj.current = v;
  if (!v) {
    q('#conjVerbTitle').textContent = 'No verb found';
    q('#conjVerbMeta').textContent = '';
    q('#conjForms').innerHTML = '';
    q('#conjQuizPrompt').textContent = 'Change the filter.';
    return;
  }
  q('#conjVerbTitle').textContent = v.infinitive;
  q('#conjVerbMeta').textContent = `${v.level} • ${v.type} • ${v.english}`;
  q('#conjForms').innerHTML = Object.entries(v.forms || {}).map(([k, val]) => `<div class="formbox"><div class="label">${escapeHtml(k)}</div><strong>${escapeHtml(val)}</strong></div>`).join('');
  newConjQuiz();
}

function newConjQuiz() {
  const v = state.conj.current;
  if (!v || !v.forms) return;
  const pronouns = Object.keys(v.forms);
  const p = pronouns[Math.floor(Math.random() * pronouns.length)];
  state.conj.quiz = { pronoun: p, answer: v.forms[p] };
  q('#conjQuizPrompt').textContent = `${v.infinitive} → ${p} = ?`;
  q('#conjQuizAnswer').value = '';
  q('#conjQuizResult').textContent = '';
}

function checkConjQuiz() {
  if (!state.conj.quiz) return;
  const user = normalize(q('#conjQuizAnswer').value);
  const ans = normalize(state.conj.quiz.answer);
  const ok = user === ans;
  q('#conjQuizResult').innerHTML = ok ? '<span class="good">✔ Correct</span>' : `<span class="bad">✘</span> ${escapeHtml(state.conj.quiz.answer)}`;
  if (!ok) markArea('conjugation', false);
}

// Flashcards
function setupFlashcards() {
  const cats = ['All', ...new Set(state.data.flashcards.map((f) => f.category || 'General'))].sort();
  q('#flashCategory').innerHTML = cats.map((c) => `<option>${escapeHtml(c)}</option>`).join('');
  q('#flashOrder').onchange = buildFlashPool;
  q('#flashCategory').onchange = buildFlashPool;
  q('#flashCard').onclick = flipFlash;
  q('#nextFlashBtn').onclick = nextFlash;
  buildFlashPool();
}

function buildFlashPool() {
  const cat = q('#flashCategory').value || 'All';
  const order = q('#flashOrder').value || 'random';
  let pool = state.data.flashcards.filter((f) => cat === 'All' || (f.category || 'General') === cat);
  if (order === 'random') pool = shuffle(pool);
  state.flash.pool = pool;
  state.flash.index = 0;
  state.flash.flipped = false;
  renderFlash();
}

function renderFlash() {
  const f = state.flash.pool[state.flash.index];
  if (!f) {
    q('#flashCard').textContent = 'No flashcards found.';
    return;
  }
  q('#flashCard').innerHTML = `<div><div class="pill">${escapeHtml(f.category || 'General')}</div><div style="margin-top:12px">${escapeHtml(state.flash.flipped ? f.back : f.front)}</div></div>`;
}

function flipFlash() {
  state.flash.flipped = !state.flash.flipped;
  renderFlash();
}

function nextFlash() {
  if (!state.flash.pool.length) return;
  state.flash.index = (state.flash.index + 1) % state.flash.pool.length;
  state.flash.flipped = false;
  renderFlash();
}

// Grammar / notes
function setupGrammar() {
  q('#grammarTablesText').textContent = `ARTICLES
Nom: der / die / das / die
Akk: den / die / das / die
Dat: dem / der / dem / den
Gen: des / der / des / der

UNBESTIMMTE ARTIKEL
Nom: ein / eine / ein
Akk: einen / eine / ein
Dat: einem / einer / einem
Gen: eines / einer / eines

NEGATION
kein / keine / keinen / keinem / keiner / keines

PERSONAL PRONOUNS
Nom: ich, du, er, sie, es, wir, ihr, sie/Sie
Akk: mich, dich, ihn, sie, es, uns, euch, sie/Sie
Dat: mir, dir, ihm, ihr, ihm, uns, euch, ihnen/Ihnen

POSSESSIVES
mein, dein, sein, ihr, sein, unser, euer, ihr/Ihr

REFLEXIVE PRONOUNS
mich, dich, sich, uns, euch, sich

PREPOSITIONS + AKKUSATIV
durch, für, gegen, ohne, um, bis, entlang

PREPOSITIONS + DATIV
aus, bei, mit, nach, seit, von, zu, gegenüber, außer, ab

TWO-WAY PREPOSITIONS
an, auf, hinter, in, neben, über, unter, vor, zwischen
Movement = Akkusativ, location = Dativ

CORE B1/B2 STRUCTURES
• weil / dass / wenn → verb at the end
• relative clauses → der, die, das / denen / dessen / deren
• passive → werden + Partizip II
• Konjunktiv II → hätte, wäre, würde
• sentence patterns → Es ist wichtig, dass ... / Ich habe vor, ... zu ... / Einerseits ..., andererseits ...`;
}

function setupNotes() {
  q('#notesSearch').oninput = renderNotes;
  renderNotes();
}

function renderNotes() {
  const term = (q('#notesSearch').value || '').toLowerCase();
  const entries = Object.entries(state.data.notes).filter(([k, v]) => `${k} ${v}`.toLowerCase().includes(term));
  q('#notesList').innerHTML = entries.map(([k, v]) => `
    <div class="card note-item">
      <div class="row" style="justify-content:space-between"><strong>${escapeHtml(k.replaceAll('_', ' '))}</strong><span class="pill">Note</span></div>
      <pre>${escapeHtml(v)}</pre>
    </div>
  `).join('') || '<div class="card">No notes found.</div>';
}

// Helpers
function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function normalize(s) {
  return String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function similarity(a, b) {
  if (!a || !b) return 0;
  const la = a.length;
  const lb = b.length;
  const dp = Array.from({ length: la + 1 }, (_, i) => Array.from({ length: lb + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= la; i++) {
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  const dist = dp[la][lb];
  return 1 - dist / Math.max(la, lb);
}

init();
