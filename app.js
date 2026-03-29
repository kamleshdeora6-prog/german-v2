
const LS_KEY = 'german_coach_v3_state';
const state = {
  data: { passages: [], notes: {}, exercises: [], flashcards: [], conjugation: [], sentences: {}, vocab: [] },
  ui: { section: 'dashboard', study: 'smart', practice: 'exercises', vocabMode: 'match' },
  exercisePool: [],
  currentExercise: null,
  currentTypingIndex: 0,
  currentWritingIndex: 0,
  flashPool: [],
  flashIndex: 0,
  flashFlipped: false,
  matchRound: { pairs: [], selected: null, matched: 0 },
  typeWord: null,
  conjPool: [],
  conjQuiz: null,
  currentUtterance: null,
};

const q = (s) => document.querySelector(s);
const qa = (s) => [...document.querySelectorAll(s)];

const EXPLANATIONS = {
  articles: { rule: 'Match the noun with the correct article and case.', example: 'den Mann, dem Mann, kein Mann' },
  prepositions: { rule: 'Learn which prepositions need accusative, dative, or a two-way meaning.', example: 'mit dem Bus, für den Kurs, in die Stadt / in der Stadt' },
  connectors: { rule: 'weil, dass, obwohl, wenn, damit send the verb to the end.', example: 'Ich lerne, damit ich die Prüfung bestehe.' },
  word_order: { rule: 'In subordinate clauses, the verb goes to the end.', example: '..., weil ich heute keine Zeit habe.' },
  passive: { rule: 'Use werden + Partizip II for passive.', example: 'Das Auto wird repariert.' },
  konjunktiv_ii: { rule: 'Use würde / hätte / wäre for polite or hypothetical meaning.', example: 'Ich würde gern mehr reisen.' },
  relative_clauses: { rule: 'Relative pronouns agree with the noun and case in the clause.', example: 'Der Mann, der dort steht, ...' },
  adjectives: { rule: 'Adjective endings depend on article, gender, and case.', example: 'ein guter Mann / den guten Mann' },
  sentence_patterns: { rule: 'Memorise whole sentence frames, not only single words.', example: 'Es ist wichtig, dass ... / Ich habe vor, ... zu ...' },
  translation_en_de: { rule: 'Build the sentence with correct German word order, articles, and case.', example: 'I think that he is tired. → Ich denke, dass er müde ist.' },
  mixed_quiz: { rule: 'Use the sentence clue to identify the grammar pattern.', example: 'Look for prepositions, connectors, or case signals.' },
  default: { rule: 'Check article, verb position, case, and spelling.', example: 'Read the whole sentence before answering.' }
};

const WRITING_TASKS = [
  { title: 'Formal email', prompt: 'Write a short formal email asking for an appointment. Use a greeting, your request, and a polite closing.' },
  { title: 'Opinion paragraph', prompt: 'Write 4–5 sentences about social media or online learning. Use: Einerseits / Andererseits / Meiner Meinung nach.' },
  { title: 'Complaint message', prompt: 'Write a complaint to a neighbour or a service company. Explain the problem and ask for a solution.' },
  { title: 'Work topic', prompt: 'Write about your job or dream job. Include what you do, what is important, and what you would like to improve.' },
];

function defaultStore() {
  return {
    theme: 'theme-focus',
    missionPreset: 'medium',
    missionCustom: { passages: 2, exercises: 20, vocab: 12, writing: 2 },
    daily: {},
    weakAreas: {},
    difficultWords: [],
    progress: {
      uniquePassagesEver: [],
      uniqueVocabEver: [],
      lastSection: 'dashboard',
      lastPractice: 'exercises'
    }
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

const store = loadStore();

function saveStore() {
  localStorage.setItem(LS_KEY, JSON.stringify(store));
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function ensureToday() {
  const key = todayKey();
  if (!store.daily[key]) {
    store.daily[key] = {
      uniquePassages: [],
      repeatedPassages: 0,
      correctExercises: 0,
      attemptedExercises: 0,
      uniqueVocab: [],
      writingDone: 0,
      typingChecks: 0
    };
  }
}

function getToday() {
  ensureToday();
  return store.daily[todayKey()];
}

const missionTargets = {
  easy: { passages: 1, exercises: 10, vocab: 8, writing: 1 },
  medium: { passages: 2, exercises: 20, vocab: 12, writing: 2 },
  hard: { passages: 3, exercises: 35, vocab: 18, writing: 3 },
  custom: null
};

async function loadJsonSmart(relPath) {
  const paths = [relPath, './' + relPath, new URL(relPath, window.location.href).toString()];
  let lastErr;
  for (const path of paths) {
    try {
      const res = await fetch(path, { cache: 'no-store' });
      if (!res.ok) throw new Error(`${relPath} → HTTP ${res.status}`);
      return await res.json();
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error('Failed to load ' + relPath);
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
    state.data.passages = Array.isArray(passages) ? passages : [];
    state.data.notes = notes || {};
    state.data.exercises = exercises?.exercises || [];
    state.data.flashcards = flashcards?.flashcards || [];
    state.data.conjugation = conjugation?.verbs || [];
    state.data.sentences = sentences || {};
    state.data.vocab = Array.isArray(vocab) ? vocab : [];
    bootstrap();
  } catch (err) {
    console.error(err);
    q('#dataCounts').textContent = 'Data failed to load';
    alert('Data files could not load. Please keep index.html, styles.css, app.js, the data folder, and the assets folder together in the repo root.');
  }
}

function bootstrap() {
  document.body.className = store.theme;
  q('#themeSelect').value = store.theme;
  q('#missionPreset').value = store.missionPreset;
  q('#pageTitle').textContent = 'Dashboard';
  wireNav();
  wireDashboard();
  setupStudy();
  setupVocab();
  setupGrammar();
  setupExercises();
  setupTyping();
  setupWriting();
  setupConjugation();
  setupReview();
  buildCounts();
  updateDashboard();
  applyMissionPresetUI();
  goSection(store.progress.lastSection || 'dashboard');
}

function wireNav() {
  qa('.navbtn').forEach(btn => btn.onclick = () => goSection(btn.dataset.section));
  q('#openSidebarBtn').onclick = () => q('#sidebar').classList.add('open');
  q('#closeSidebarBtn').onclick = () => q('#sidebar').classList.remove('open');
  qa('[data-study]').forEach(btn => btn.onclick = () => switchStudy(btn.dataset.study));
  qa('[data-practice]').forEach(btn => btn.onclick = () => switchPractice(btn.dataset.practice));
  qa('[data-vocabmode]').forEach(btn => btn.onclick = () => switchVocabMode(btn.dataset.vocabmode));
}

function goSection(name) {
  state.ui.section = name;
  store.progress.lastSection = name;
  saveStore();
  qa('.navbtn').forEach(btn => btn.classList.toggle('active', btn.dataset.section === name));
  qa('.app-section').forEach(sec => sec.classList.add('hidden'));
  q('#section-' + name)?.classList.remove('hidden');
  q('#pageTitle').textContent = name.charAt(0).toUpperCase() + name.slice(1);
  q('#sidebar').classList.remove('open');
}

function wireDashboard() {
  q('#themeSelect').onchange = e => { store.theme = e.target.value; document.body.className = store.theme; saveStore(); };
  q('#missionPreset').onchange = e => { store.missionPreset = e.target.value; saveStore(); applyMissionPresetUI(); updateDashboard(); };
  ['customPassages','customExercises','customVocab','customWriting'].forEach(id => {
    q('#' + id).onchange = () => {
      store.missionCustom = {
        passages: Number(q('#customPassages').value || 2),
        exercises: Number(q('#customExercises').value || 20),
        vocab: Number(q('#customVocab').value || 12),
        writing: Number(q('#customWriting').value || 2),
      };
      saveStore();
      updateDashboard();
    };
  });
  q('#resetTodayBtn').onclick = () => {
    if (!confirm('Reset today’s progress?')) return;
    store.daily[todayKey()] = {
      uniquePassages: [], repeatedPassages: 0, correctExercises: 0, attemptedExercises: 0, uniqueVocab: [], writingDone: 0, typingChecks: 0
    };
    saveStore();
    updateDashboard();
  };
  q('#continueBtn').onclick = continueStudying;
  q('#practiceWeakBtn').onclick = () => {
    goSection('practice');
    switchPractice('exercises');
    q('#exerciseSortFilter').value = 'weak';
    buildExercisePool();
    nextExercise();
  };
}

function currentMission() {
  return store.missionPreset === 'custom' ? store.missionCustom : missionTargets[store.missionPreset] || missionTargets.medium;
}

function applyMissionPresetUI() {
  q('#missionBadge').textContent = store.missionPreset;
  const isCustom = store.missionPreset === 'custom';
  q('#customMissionPanel').classList.toggle('hidden', !isCustom);
  q('#customPassages').value = store.missionCustom.passages;
  q('#customExercises').value = store.missionCustom.exercises;
  q('#customVocab').value = store.missionCustom.vocab;
  q('#customWriting').value = store.missionCustom.writing;
}

function buildCounts() {
  q('#aboutCounts').textContent = `${state.data.passages.length} passages • ${state.data.exercises.length} exercises • ${state.data.vocab.length} vocabulary items • ${Object.keys(state.data.notes).length} grammar notes • ${state.data.conjugation.length} verbs`;
}

function updateDashboard() {
  const d = getToday();
  const mission = currentMission();
  q('#statUniquePassages').textContent = d.uniquePassages.length;
  q('#statCorrectExercises').textContent = d.correctExercises;
  q('#statUniqueVocab').textContent = d.uniqueVocab.length;
  q('#statWriting').textContent = d.writingDone;

  setProgress('miniPassages', d.uniquePassages.length, mission.passages);
  setProgress('miniExercises', d.correctExercises, mission.exercises);
  setProgress('miniVocab', d.uniqueVocab.length, mission.vocab);
  setProgress('miniWriting', d.writingDone, mission.writing);

  setMissionRow('Passages', 'missionPassages', d.uniquePassages.length, mission.passages);
  setMissionRow('Exercises', 'missionExercises', d.correctExercises, mission.exercises);
  setMissionRow('Vocabulary', 'missionVocab', d.uniqueVocab.length, mission.vocab);
  setMissionRow('Writing', 'missionWriting', d.writingDone, mission.writing);

  const totalDone = d.uniquePassages.length + d.correctExercises + d.uniqueVocab.length + d.writingDone;
  q('#todaySummary').textContent = totalDone
    ? `Today: ${d.uniquePassages.length} unique passage(s), ${d.correctExercises} correct exercise(s), ${d.uniqueVocab.length} new vocab item(s), ${d.writingDone} writing task(s). Repeated passages: ${d.repeatedPassages}.`
    : 'Choose a study flow or continue where you left off.';

  updateWeakUI();
  updateSideStats();
}

function setProgress(id, value, target) {
  const pct = Math.max(0, Math.min(100, Math.round((value / Math.max(1, target)) * 100)));
  q('#' + id).style.width = pct + '%';
}

function setMissionRow(label, baseId, value, target) {
  q('#' + baseId + 'Text').textContent = `${value} / ${target}`;
  setProgress(baseId + 'Bar', value, target);
}

function updateSideStats() {
  q('#sideStreak').textContent = `🔥 ${calculateStreak()} day streak`;
  q('#sideWeak').textContent = `⚠ Weak: ${topWeakLabel()}`;
}

function calculateStreak() {
  const keys = Object.keys(store.daily).sort();
  let streak = 0;
  let day = new Date();
  while (true) {
    const key = day.toISOString().slice(0,10);
    const d = store.daily[key];
    const active = d && (d.uniquePassages.length || d.correctExercises || d.uniqueVocab.length || d.writingDone);
    if (active) { streak += 1; day.setDate(day.getDate() - 1); }
    else break;
  }
  return streak;
}

function updateWeakUI() {
  const entries = Object.entries(store.weakAreas || {}).sort((a,b)=>b[1]-a[1]).slice(0,4);
  const weakList = q('#weakList');
  const weakPanel = q('#weakAreaPanel');
  weakList.innerHTML = '';
  weakPanel.innerHTML = '';
  if (!entries.length) {
    weakList.innerHTML = '<div class="muted small">No weak area data yet. Start practicing and the app will learn from your mistakes.</div>';
    weakPanel.innerHTML = weakList.innerHTML;
    return;
  }
  for (const [key, score] of entries) {
    const html = `<div class="list-item"><div class="top"><strong>${prettyType(key)}</strong><span class="badge">${score} misses</span></div><div class="small muted">Focus suggestion: ${suggestionForType(key)}</div></div>`;
    weakList.insertAdjacentHTML('beforeend', html);
    weakPanel.insertAdjacentHTML('beforeend', html);
  }
}

function topWeakLabel() {
  const top = Object.entries(store.weakAreas || {}).sort((a,b)=>b[1]-a[1])[0];
  return top ? prettyType(top[0]) : '—';
}

function increaseWeak(type) {
  store.weakAreas[type] = (store.weakAreas[type] || 0) + 1;
  saveStore();
  updateWeakUI();
  updateSideStats();
}

function decreaseWeak(type) {
  if (!store.weakAreas[type]) return;
  store.weakAreas[type] = Math.max(0, store.weakAreas[type] - 1);
  saveStore();
  updateWeakUI();
  updateSideStats();
}

function continueStudying() {
  if ((store.progress.lastSection || 'dashboard') === 'practice') {
    goSection('practice');
    switchPractice(store.progress.lastPractice || 'exercises');
    return;
  }
  goSection('practice');
  switchPractice('exercises');
}

// Study and search
function setupStudy() {
  const chapters = [...new Set(state.data.passages.map(p => p.chapter || 'General'))].sort();
  q('#smartTopicSelect').innerHTML = chapters.map(ch => `<option>${escapeHtml(ch)}</option>`).join('');
  q('#smartTopicSelect').onchange = renderSmartStudy;
  q('#goToTypingBtn').onclick = () => { goSection('practice'); switchPractice('typing'); };
  q('#goToVocabBtn').onclick = () => { goSection('study'); switchStudy('vocab'); };
  q('#goToExercisesBtn').onclick = () => { goSection('practice'); switchPractice('exercises'); };
  q('#globalSearchInput').oninput = renderGlobalSearch;
  renderSmartStudy();
}

function switchStudy(name) {
  state.ui.study = name;
  qa('[data-study]').forEach(btn => btn.classList.toggle('active', btn.dataset.study === name));
  qa('.study-panel').forEach(p => p.classList.add('hidden'));
  q('#study-' + name).classList.remove('hidden');
}

function renderSmartStudy() {
  const chapter = q('#smartTopicSelect').value;
  const passage = state.data.passages.find(p => (p.chapter || 'General') === chapter) || state.data.passages[0];
  q('#smartPassageTitle').textContent = passage ? `${passage.title} (${passage.level})` : 'No passage';
  const vocab = state.data.vocab.filter(v => (v.topic || '').toLowerCase().includes((chapter || '').split('–').pop().trim().toLowerCase()) || (v.level || '') === (passage?.level || '')); 
  q('#smartVocabList').textContent = vocab.slice(0,8).map(v => `${v.de} — ${v.en}`).join(' • ') || 'Use the vocab section to explore more words.';
  const grammar = ['grammar_master_articles','grammar_connectors_master','grammar_da_words','grammar_sentence_patterns_b1b2'].filter(k => state.data.notes[k]);
  q('#smartGrammarList').textContent = grammar.map(k => prettyNoteKey(k)).join(' • ');
}

function renderGlobalSearch() {
  const term = q('#globalSearchInput').value.trim().toLowerCase();
  const out = q('#globalSearchResults');
  out.innerHTML = '';
  if (!term) {
    out.innerHTML = '<div class="muted small">Search notes, vocabulary, and passages.</div>';
    return;
  }
  const results = [];
  state.data.passages.forEach(p => {
    const hay = `${p.title} ${p.chapter} ${p.german} ${p.english}`.toLowerCase();
    if (hay.includes(term)) results.push({ kind: 'Passage', title: p.title, text: p.chapter + ' • ' + p.level });
  });
  state.data.vocab.forEach(v => {
    const hay = `${v.de} ${v.en} ${v.topic}`.toLowerCase();
    if (hay.includes(term)) results.push({ kind: 'Vocab', title: `${v.de} — ${v.en}`, text: `${v.topic} • ${v.level}` });
  });
  Object.entries(state.data.notes).forEach(([k, v]) => {
    if (String(v).toLowerCase().includes(term) || prettyNoteKey(k).toLowerCase().includes(term)) {
      results.push({ kind: 'Grammar', title: prettyNoteKey(k), text: String(v).slice(0, 120) + '…' });
    }
  });
  out.innerHTML = results.slice(0, 18).map(r => `<div class="search-item"><strong>${escapeHtml(r.kind)}:</strong> ${escapeHtml(r.title)}<div class="small muted mt12">${escapeHtml(r.text)}</div></div>`).join('') || '<div class="muted small">No results.</div>';
}

// Vocabulary
function setupVocab() {
  const topics = ['All', ...new Set(state.data.vocab.map(v => v.topic || 'Other'))].sort();
  const levels = ['All', ...new Set(state.data.vocab.map(v => v.level || 'Other'))].sort();
  q('#vocabTopicFilter').innerHTML = topics.map(v => `<option>${escapeHtml(v)}</option>`).join('');
  q('#vocabLevelFilter').innerHTML = levels.map(v => `<option>${escapeHtml(v)}</option>`).join('');
  q('#vocabTopicFilter').onchange = renderVocabList;
  q('#vocabLevelFilter').onchange = renderVocabList;
  q('#vocabSearch').oninput = renderVocabList;
  q('#newMatchBtn').onclick = newMatchRound;
  q('#checkTypeBtn').onclick = checkTypeWord;
  q('#nextTypeBtn').onclick = nextTypeWord;
  q('#markDifficultBtn').onclick = markCurrentWordDifficult;
  renderVocabList();
  newMatchRound();
  nextTypeWord();
}

function switchVocabMode(name) {
  state.ui.vocabMode = name;
  qa('[data-vocabmode]').forEach(btn => btn.classList.toggle('active', btn.dataset.vocabmode === name));
  qa('.vocab-mode').forEach(p => p.classList.add('hidden'));
  q('#vocab-' + name + '-mode').classList.remove('hidden');
  if (name === 'review') renderDifficultWords();
}

function filteredVocab() {
  const topic = q('#vocabTopicFilter').value;
  const level = q('#vocabLevelFilter').value;
  const term = q('#vocabSearch').value.trim().toLowerCase();
  return state.data.vocab.filter(v => {
    return (topic === 'All' || v.topic === topic) && (level === 'All' || v.level === level) && (!term || `${v.de} ${v.en} ${v.example_de || ''} ${v.example_en || ''}`.toLowerCase().includes(term));
  });
}

function renderVocabList() {
  const items = filteredVocab();
  q('#vocabCountBadge').textContent = `${items.length} words`;
  q('#vocabList').innerHTML = items.slice(0, 180).map((v, idx) => `
    <div class="list-item">
      <div class="top"><strong>${escapeHtml(v.de)}</strong><span class="badge">${escapeHtml(v.level || '—')} • ${escapeHtml(v.topic || 'General')}</span></div>
      <div class="mt12">${escapeHtml(v.en)}</div>
      <div class="small muted mt12">${escapeHtml(v.example_de || '')}</div>
      <div class="small muted">${escapeHtml(v.example_en || '')}</div>
      <div class="row gap-sm wrap mt12"><button class="ghost-btn" onclick="markVocabSeen('${encodeURIComponent(v.de)}')">Mark learned</button><button class="ghost-btn" onclick="markSpecificWordDifficult('${encodeURIComponent(v.de)}')">Difficult</button></div>
    </div>`).join('') || '<div class="muted small">No words match the current filter.</div>';
}
window.markVocabSeen = function(encoded){ markVocabSeen(decodeURIComponent(encoded)); };
window.markSpecificWordDifficult = function(encoded){ markSpecificWordDifficult(decodeURIComponent(encoded)); };

function markVocabSeen(word) {
  const d = getToday();
  if (!d.uniqueVocab.includes(word)) d.uniqueVocab.push(word);
  if (!store.progress.uniqueVocabEver.includes(word)) store.progress.uniqueVocabEver.push(word);
  saveStore();
  updateDashboard();
}

function markSpecificWordDifficult(word) {
  if (!store.difficultWords.includes(word)) store.difficultWords.push(word);
  saveStore();
  renderDifficultWords();
}

function newMatchRound() {
  const pool = shuffle([...state.data.vocab]).slice(0, 6);
  state.matchRound.pairs = pool;
  state.matchRound.selected = null;
  state.matchRound.matched = 0;
  const left = shuffle(pool.map((v, i) => ({ side: 'de', id: i, label: v.de })));
  const right = shuffle(pool.map((v, i) => ({ side: 'en', id: i, label: v.en })));
  q('#matchGame').innerHTML = `<div class="match-col">${left.map(item => `<button class="match-btn" data-side="de" data-id="${item.id}">${escapeHtml(item.label)}</button>`).join('')}</div>
  <div class="match-col">${right.map(item => `<button class="match-btn" data-side="en" data-id="${item.id}">${escapeHtml(item.label)}</button>`).join('')}</div>`;
  qa('.match-btn').forEach(btn => btn.onclick = () => chooseMatch(btn));
  q('#matchStatus').textContent = 'Match the English and German words.';
}

function chooseMatch(btn) {
  if (btn.classList.contains('done')) return;
  const side = btn.dataset.side;
  const id = btn.dataset.id;
  if (!state.matchRound.selected) {
    state.matchRound.selected = { side, id, el: btn };
    btn.classList.add('selected');
    return;
  }
  if (state.matchRound.selected.side === side) {
    state.matchRound.selected.el.classList.remove('selected');
    state.matchRound.selected = { side, id, el: btn };
    btn.classList.add('selected');
    return;
  }
  const first = state.matchRound.selected;
  const match = first.id === id;
  first.el.classList.remove('selected');
  if (match) {
    first.el.classList.add('done');
    btn.classList.add('done');
    state.matchRound.matched += 1;
    const word = state.matchRound.pairs[Number(id)].de;
    markVocabSeen(word);
    q('#matchStatus').textContent = `Correct match: ${state.matchRound.pairs[Number(id)].de} — ${state.matchRound.pairs[Number(id)].en}`;
    if (state.matchRound.matched === state.matchRound.pairs.length) q('#matchStatus').textContent = 'Round complete. Great work.';
  } else {
    q('#matchStatus').textContent = 'Not a match. Try again.';
  }
  state.matchRound.selected = null;
}

function nextTypeWord() {
  const items = filteredVocab();
  state.typeWord = items[Math.floor(Math.random() * items.length)] || state.data.vocab[0];
  q('#typePrompt').textContent = state.typeWord ? `${state.typeWord.en} (${state.typeWord.topic}, ${state.typeWord.level})` : 'No word available';
  q('#typeAnswer').value = '';
  q('#typeFeedback').textContent = 'Type the German word.';
}

function checkTypeWord() {
  const value = q('#typeAnswer').value.trim();
  if (!state.typeWord) return;
  if (normalise(value) === normalise(state.typeWord.de)) {
    q('#typeFeedback').innerHTML = `<span class="ok">Correct.</span> ${escapeHtml(state.typeWord.de)} = ${escapeHtml(state.typeWord.en)}`;
    markVocabSeen(state.typeWord.de);
  } else {
    q('#typeFeedback').innerHTML = `<span class="bad">Not quite.</span> Correct: <strong>${escapeHtml(state.typeWord.de)}</strong><br><span class="small muted">Example: ${escapeHtml(state.typeWord.example_de || '')}</span>`;
    markSpecificWordDifficult(state.typeWord.de);
  }
}

function markCurrentWordDifficult() {
  if (state.typeWord) {
    markSpecificWordDifficult(state.typeWord.de);
    q('#typeFeedback').textContent = `${state.typeWord.de} added to difficult words.`;
  }
}

function renderDifficultWords() {
  const items = state.data.vocab.filter(v => store.difficultWords.includes(v.de));
  q('#difficultWordsList').innerHTML = items.map(v => `<div class="list-item"><div class="top"><strong>${escapeHtml(v.de)}</strong><span class="badge">Difficult</span></div><div class="mt12">${escapeHtml(v.en)}</div><div class="small muted mt12">${escapeHtml(v.example_de || '')}</div></div>`).join('') || '<div class="muted small">No difficult words saved yet.</div>';
}

// Grammar
function setupGrammar() {
  const keys = Object.keys(state.data.notes);
  q('#grammarNoteSelect').innerHTML = keys.map(k => `<option value="${escapeHtml(k)}">${escapeHtml(prettyNoteKey(k))}</option>`).join('');
  q('#grammarNoteSelect').onchange = renderGrammarNote;
  renderGrammarMaster();
  renderGrammarNote();
}

function renderGrammarMaster() {
  const cards = [
    ['Articles + kein', 'grammar_master_articles'],
    ['Personal pronouns', 'grammar_personal_pronouns_full'],
    ['Possessive words', 'grammar_possessive_pronouns'],
    ['Reflexive pronouns', 'grammar_reflexive_pronouns'],
    ['Adjective endings', 'grammar_adjective_endings'],
    ['Connectors', 'grammar_connectors_master'],
    ['Da-words', 'grammar_da_words'],
    ['Case signals', 'grammar_case_signals'],
    ['Sentence patterns', 'grammar_sentence_patterns_b1b2']
  ];
  q('#grammarMasterGrid').innerHTML = cards.map(([title, key]) => `<div class="grammar-table-card"><h3>${escapeHtml(title)}</h3><pre>${escapeHtml(state.data.notes[key] || 'Missing')}</pre></div>`).join('');
}

function renderGrammarNote() {
  const key = q('#grammarNoteSelect').value;
  q('#grammarNoteView').textContent = state.data.notes[key] || 'No note selected.';
}

// Exercises
function setupExercises() {
  const types = ['All', ...new Set(state.data.exercises.map(e => e.type))];
  const levels = ['All', ...new Set(state.data.exercises.map(e => e.level))];
  q('#exerciseTypeFilter').innerHTML = types.map(v => `<option>${escapeHtml(v)}</option>`).join('');
  q('#exerciseLevelFilter').innerHTML = levels.map(v => `<option>${escapeHtml(v)}</option>`).join('');
  q('#exerciseTypeFilter').onchange = () => { buildExercisePool(); nextExercise(); };
  q('#exerciseLevelFilter').onchange = () => { buildExercisePool(); nextExercise(); };
  q('#exerciseSortFilter').onchange = () => { buildExercisePool(); nextExercise(); };
  q('#submitExerciseBtn').onclick = submitExercise;
  q('#nextExerciseBtn').onclick = nextExercise;
  q('#showHintBtn').onclick = () => {
    if (state.currentExercise) q('#exerciseHintBox').textContent = state.currentExercise.hint || 'No extra hint.';
  };
  buildExercisePool();
  nextExercise();
}

function switchPractice(name) {
  state.ui.practice = name;
  store.progress.lastPractice = name;
  saveStore();
  qa('[data-practice]').forEach(btn => btn.classList.toggle('active', btn.dataset.practice === name));
  qa('.practice-panel').forEach(p => p.classList.add('hidden'));
  q('#practice-' + name).classList.remove('hidden');
}

function buildExercisePool() {
  const type = q('#exerciseTypeFilter').value;
  const level = q('#exerciseLevelFilter').value;
  let pool = state.data.exercises.filter(e => (type === 'All' || e.type === type) && (level === 'All' || e.level === level));
  if (q('#exerciseSortFilter').value === 'weak') {
    pool = pool.sort((a,b) => (store.weakAreas[b.type] || 0) - (store.weakAreas[a.type] || 0));
  }
  state.exercisePool = shuffle(pool);
  q('#exerciseBadge').textContent = `${state.exercisePool.length} exercises`;
}

function nextExercise() {
  if (!state.exercisePool.length) buildExercisePool();
  state.currentExercise = state.exercisePool.pop() || null;
  q('#exerciseAnswer').value = '';
  if (!state.currentExercise) {
    q('#exerciseQuestionBox').textContent = 'No exercises available.';
    return;
  }
  q('#exerciseQuestionBox').innerHTML = `<strong>${escapeHtml(prettyType(state.currentExercise.type))}</strong><div class="mt12">${escapeHtml(state.currentExercise.question)}</div>`;
  q('#exerciseHintBox').textContent = 'Use the hint button if you want help.';
  q('#exerciseFeedback').innerHTML = '<div class="muted">Submit your answer to see feedback.</div>';
}

function submitExercise() {
  const ex = state.currentExercise;
  if (!ex) return;
  const answer = q('#exerciseAnswer').value.trim();
  const correct = normalise(answer) === normalise(ex.answer || '');
  const today = getToday();
  today.attemptedExercises += 1;
  const explanation = EXPLANATIONS[ex.type] || EXPLANATIONS.default;
  if (correct) {
    today.correctExercises += 1;
    decreaseWeak(ex.type);
    q('#exerciseFeedback').innerHTML = `
      <div class="ok"><strong>Correct.</strong></div>
      <div class="mt12"><strong>Rule:</strong> ${escapeHtml(explanation.rule)}</div>
      <div class="mt12"><strong>Example:</strong> ${escapeHtml(explanation.example)}</div>`;
  } else {
    increaseWeak(ex.type);
    q('#exerciseFeedback').innerHTML = `
      <div class="bad"><strong>Your answer:</strong> ${escapeHtml(answer || '(empty)')}</div>
      <div class="mt12"><strong>Correct answer:</strong> ${escapeHtml(ex.answer || '(empty)')}</div>
      <div class="mt12"><strong>Why:</strong> ${escapeHtml(explanation.rule)}</div>
      <div class="mt12"><strong>Example:</strong> ${escapeHtml(explanation.example)}</div>
      <div class="mt12 small muted">Hint: ${escapeHtml(ex.hint || 'Read the full sentence carefully.')}</div>`;
  }
  saveStore();
  updateDashboard();
}

// Typing / passages
function setupTyping() {
  const levels = ['All', ...new Set(state.data.passages.map(p => normaliseLevel(p.level)))];
  q('#typingLevelFilter').innerHTML = levels.map(v => `<option>${escapeHtml(v)}</option>`).join('');
  q('#typingLevelFilter').onchange = renderTypingSelect;
  q('#typingPassageSelect').onchange = () => {
    state.currentTypingIndex = Number(q('#typingPassageSelect').value || 0);
    renderTypingPassage();
  };
  q('#playAudioBtn').onclick = playCurrentPassageAudio;
  q('#stopAudioBtn').onclick = stopAudio;
  q('#checkTypingBtn').onclick = checkTyping;
  q('#clearTypingBtn').onclick = () => { q('#typingInput').value = ''; q('#typingFeedback').textContent = 'Cleared.'; };
  renderTypingSelect();
}

function normaliseLevel(level) {
  const s = String(level || '').toUpperCase();
  if (s.startsWith('A1')) return 'A1';
  if (s.startsWith('A2')) return 'A2';
  if (s.startsWith('B1')) return 'B1';
  if (s.startsWith('B2')) return 'B2';
  return s || 'Other';
}

function getTypingPool() {
  const level = q('#typingLevelFilter').value;
  return state.data.passages.filter(p => level === 'All' || normaliseLevel(p.level) === level);
}

function renderTypingSelect() {
  const pool = getTypingPool();
  q('#typingPassageSelect').innerHTML = pool.map((p, idx) => `<option value="${idx}">${escapeHtml(p.title)} — ${escapeHtml(p.chapter || 'General')} (${escapeHtml(normaliseLevel(p.level))})</option>`).join('');
  state.currentTypingIndex = 0;
  renderTypingPassage();
}

function currentTypingPassage() {
  return getTypingPool()[state.currentTypingIndex] || null;
}

function renderTypingPassage() {
  const p = currentTypingPassage();
  q('#typingReference').value = p ? p.german : 'No passage.';
  q('#typingInput').value = '';
  q('#typingFeedback').textContent = p ? `English: ${p.english}` : 'No passage.';
  q('#typingStatusBadge').textContent = p ? `${normaliseLevel(p.level)} passage` : 'Ready';
}

function playCurrentPassageAudio() {
  const p = currentTypingPassage();
  if (!p) return;
  stopAudio();
  const u = new SpeechSynthesisUtterance(p.german);
  u.lang = 'de-DE';
  u.rate = Number(q('#audioSpeedSelect').value || 1);
  state.currentUtterance = u;
  speechSynthesis.speak(u);
}

function stopAudio() {
  speechSynthesis.cancel();
  state.currentUtterance = null;
}

function checkTyping() {
  const p = currentTypingPassage();
  if (!p) return;
  const typed = q('#typingInput').value.trim();
  const ref = p.german.trim();
  const accuracy = computeAccuracy(ref, typed);
  const today = getToday();
  today.typingChecks += 1;
  const passageKey = `${p.title}||${p.chapter}`;
  let msg = `Accuracy: ${accuracy}%`;
  if (accuracy >= 70) {
    if (!today.uniquePassages.includes(passageKey)) {
      today.uniquePassages.push(passageKey);
      if (!store.progress.uniquePassagesEver.includes(passageKey)) store.progress.uniquePassagesEver.push(passageKey);
      msg += ' • Counted as a unique passage today.';
    } else {
      today.repeatedPassages += 1;
      msg += ' • Good review. Counted as a repeat, not a new passage.';
    }
  } else {
    msg += ' • Need 70%+ to count for the mission.';
  }
  q('#typingFeedback').textContent = msg;
  saveStore();
  updateDashboard();
}

function computeAccuracy(a, b) {
  const aa = a.replace(/\s+/g, ' ').trim();
  const bb = b.replace(/\s+/g, ' ').trim();
  if (!aa.length) return 0;
  let matches = 0;
  const len = Math.max(aa.length, bb.length);
  for (let i = 0; i < Math.min(aa.length, bb.length); i++) if (aa[i] === bb[i]) matches += 1;
  return Math.round((matches / len) * 100);
}

// Writing
function setupWriting() {
  q('#writingTaskSelect').innerHTML = WRITING_TASKS.map((t, i) => `<option value="${i}">${escapeHtml(t.title)}</option>`).join('');
  q('#writingTaskSelect').onchange = () => {
    state.currentWritingIndex = Number(q('#writingTaskSelect').value || 0);
    renderWritingTask();
  };
  q('#submitWritingBtn').onclick = submitWriting;
  q('#nextWritingBtn').onclick = () => {
    state.currentWritingIndex = (state.currentWritingIndex + 1) % WRITING_TASKS.length;
    q('#writingTaskSelect').value = state.currentWritingIndex;
    renderWritingTask();
  };
  renderWritingTask();
}

function renderWritingTask() {
  const task = WRITING_TASKS[state.currentWritingIndex];
  q('#writingPrompt').textContent = task.prompt;
  q('#writingInput').value = '';
  q('#writingFeedback').innerHTML = '<div class="muted">Use connectors, good word order, and enough detail.</div>';
}

function submitWriting() {
  const text = q('#writingInput').value.trim();
  const issues = [];
  if (text.length < 40) issues.push('Write a little more so the task becomes useful practice.');
  if (!/[A-ZÄÖÜ]/.test(text[0] || '')) issues.push('Start with a capital letter.');
  if (text.includes(' weil ') && !/[a-zäöüß]$/.test((text.split(' weil ')[1] || '').trim().split(' ')[0] || '')) {
    // very light heuristic, do nothing strong
  }
  if (!/[.!?]$/.test(text)) issues.push('Add a full stop or final punctuation.');
  const goodPatterns = ['dass', 'weil', 'damit', 'andererseits', 'meiner Meinung nach'].filter(p => text.toLowerCase().includes(p.toLowerCase()));
  const qualifies = text.length >= 40;
  if (qualifies) {
    getToday().writingDone += 1;
    saveStore();
    updateDashboard();
  }
  q('#writingFeedback').innerHTML = `
    <div><strong>Status:</strong> ${qualifies ? '<span class="ok">Counted for today.</span>' : '<span class="warn">Too short to count.</span>'}</div>
    <div class="mt12"><strong>Useful structures you used:</strong> ${goodPatterns.length ? escapeHtml(goodPatterns.join(', ')) : 'Try using weil, dass, damit, or opinion phrases.'}</div>
    <div class="mt12"><strong>Coach notes:</strong><ul>${issues.length ? issues.map(i => `<li>${escapeHtml(i)}</li>`).join('') : '<li>Good job. Next step: add one more connector and one longer sentence.</li>'}</ul></div>`;
}

// Conjugation
function setupConjugation() {
  const levels = ['All', ...new Set(state.data.conjugation.map(v => v.level || 'Other'))];
  q('#conjLevelFilter').innerHTML = levels.map(v => `<option>${escapeHtml(v)}</option>`).join('');
  q('#conjLevelFilter').onchange = renderConjSelect;
  q('#conjVerbSelect').onchange = () => renderConjCard();
  q('#checkConjBtn').onclick = checkConjQuiz;
  q('#nextConjBtn').onclick = nextConjQuiz;
  renderConjSelect();
}

function conjFiltered() {
  const level = q('#conjLevelFilter').value;
  return state.data.conjugation.filter(v => level === 'All' || v.level === level);
}

function renderConjSelect() {
  const pool = conjFiltered();
  q('#conjVerbSelect').innerHTML = pool.map((v, i) => `<option value="${i}">${escapeHtml(v.infinitive)} — ${escapeHtml(v.english)}</option>`).join('');
  renderConjCard();
}

function currentVerb() {
  return conjFiltered()[Number(q('#conjVerbSelect').value || 0)] || null;
}

function renderConjCard() {
  const verb = currentVerb();
  if (!verb) return;
  q('#conjCard').innerHTML = `<div><strong>${escapeHtml(verb.infinitive)}</strong> — ${escapeHtml(verb.english)} <span class="badge">${escapeHtml(verb.level)} • ${escapeHtml(verb.type)}</span></div>
  <div class="conj-grid">${Object.entries(verb.forms || {}).map(([k,v]) => `<div class="conj-form"><span>${escapeHtml(k)}</span><strong>${escapeHtml(v)}</strong></div>`).join('')}</div>`;
  nextConjQuiz();
}

function nextConjQuiz() {
  const verb = currentVerb();
  if (!verb) return;
  const entries = Object.entries(verb.forms || {});
  const [pronoun, form] = entries[Math.floor(Math.random() * entries.length)];
  state.conjQuiz = { pronoun, form, infinitive: verb.infinitive };
  q('#conjQuizPrompt').textContent = `${verb.infinitive} → ${pronoun}`;
  q('#conjQuizAnswer').value = '';
  q('#conjQuizFeedback').textContent = 'Type the correct form.';
}

function checkConjQuiz() {
  if (!state.conjQuiz) return;
  const answer = q('#conjQuizAnswer').value.trim();
  if (normalise(answer) === normalise(state.conjQuiz.form)) {
    q('#conjQuizFeedback').innerHTML = `<span class="ok">Correct.</span> ${state.conjQuiz.pronoun} ${state.conjQuiz.form}`;
  } else {
    q('#conjQuizFeedback').innerHTML = `<span class="bad">Correct form:</span> ${state.conjQuiz.pronoun} ${state.conjQuiz.form}`;
  }
}

// Review
function setupReview() {
  const categories = ['All', ...new Set(state.data.flashcards.map(f => f.category || 'General'))];
  q('#flashCategoryFilter').innerHTML = categories.map(c => `<option>${escapeHtml(c)}</option>`).join('');
  q('#flashCategoryFilter').onchange = buildFlashPool;
  q('#flipFlashBtn').onclick = flipFlash;
  q('#nextFlashBtn').onclick = nextFlash;
  q('#flashCard').onclick = flipFlash;
  buildFlashPool();
}

function buildFlashPool() {
  const cat = q('#flashCategoryFilter').value;
  state.flashPool = shuffle(state.data.flashcards.filter(f => cat === 'All' || f.category === cat));
  state.flashIndex = 0;
  state.flashFlipped = false;
  renderFlash();
}

function currentFlash() { return state.flashPool[state.flashIndex] || null; }
function renderFlash() {
  const item = currentFlash();
  q('#flashCard').textContent = item ? (state.flashFlipped ? item.back : item.front) : 'No flashcards';
}
function flipFlash() { state.flashFlipped = !state.flashFlipped; renderFlash(); }
function nextFlash() { if (!state.flashPool.length) return; state.flashIndex = (state.flashIndex + 1) % state.flashPool.length; state.flashFlipped = false; renderFlash(); }

// Helpers
function prettyType(type) {
  return String(type || '').replaceAll('_', ' ').replace(/\b\w/g, m => m.toUpperCase());
}
function prettyNoteKey(key) {
  return String(key || '').replaceAll('_', ' ').replace(/\b\w/g, m => m.toUpperCase());
}
function suggestionForType(type) {
  const map = {
    connectors: 'Review weil, dass, damit, and verb-final clauses.',
    word_order: 'Read the clause from left to right and place the verb at the end.',
    prepositions: 'Group prepositions by case and learn them in chunks.',
    articles: 'Use the grammar master table and compare der / den / dem.',
    adjectives: 'Focus first on nominative, accusative masculine, and dative.',
    passive: 'Remember: werden + Partizip II.',
    konjunktiv_ii: 'Use würde / hätte / wäre for polite or hypothetical meaning.'
  };
  return map[type] || 'Repeat the explanation and try 5 more items in this category.';
}
function normalise(s) { return String(s || '').trim().toLowerCase().replace(/[.,!?]/g, '').replace(/\s+/g, ' '); }
function shuffle(arr) { return arr.sort(() => Math.random() - 0.5); }
function escapeHtml(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
    e.preventDefault();
    q('#sidebar').classList.toggle('open');
  }
});

init();
