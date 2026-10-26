// Auto-generated data loader for German Coach
// Exposes combined datasets and simple getters

import vocab from './data/vocab.json';
import verbs from './data/verbs.json';
import flashcards from './data/flashcards.json';
import passages from './data/passages.json';

export const dataMeta = {
  vocab_count: Array.isArray(vocab) ? vocab.length : 0,
  verb_count: Array.isArray(verbs) ? verbs.length : 0,
  flashcard_count: Array.isArray(flashcards) ? flashcards.length : 0,
  passage_count: Array.isArray(passages) ? passages.length : 0,
};

export const datasets = {
  vocab,
  verbs,
  flashcards,
  passages,
};

// Simple search helpers
export function searchVocab(query) {
  const q = String(query || '').toLowerCase();
  return vocab.filter(v =>
    (v.word || '').toLowerCase().includes(q) ||
    (v.translation || '').toLowerCase().includes(q)
  );
}

export function getPassagesByLevel(level) {
  return passages.filter(p => p.level === level);
}

export function getFlashcardsByType(type) {
  return flashcards.filter(c => c.type === type);
}

export function getVerbsByLevel(level) {
  return verbs.filter(v => v.level === level);
}
