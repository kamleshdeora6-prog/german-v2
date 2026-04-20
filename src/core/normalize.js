
export function normalizeText(s){
  return (s||'').toString().normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[“”"'.,!?;:()]/g,' ').replace(/\s+/g,' ').trim();
}
export function normalizePassageItem(item={}){
  return {
    ...item,
    title: item.title || item.chapter || item.topic || 'Passage',
    chapter: item.chapter || item.topic || '',
    level: item.level || 'A1',
    german: item.german || item.text_de || item.text || item.de || '',
    english: item.english || item.text_en || item.en || '',
  };
}
export function normalizeVocabItem(item={}){
  const word = item.word || item.de || item.german || item.front || '';
  const translation = item.translation || item.en || item.english || item.back || '';
  return {
    ...item,
    word,
    de: word,
    translation,
    en: translation,
    type: item.type || 'vocab',
    level: item.level || 'A1',
    topic: item.topic || item.category || 'General',
    article: item.article || '',
    plural: item.plural || '',
    example_de: item.example_de || item.german_example || '',
    example_en: item.example_en || item.english_example || ''
  };
}
export function normalizeFlashcardItem(item={}){
  const front = item.front || item.word || item.de || item.german || item.prompt || '';
  const back = item.back || item.translation || item.en || item.english || item.answer || '';
  return { ...item, front, back, category: item.category || item.topic || item.type || 'general', topic: item.topic || item.category || item.type || 'general', level: item.level || 'A1' };
}
export function normalizeConjugationItem(item={}){
  const forms = item.forms || item.conjugation || item.persons || {};
  return {
    ...item,
    verb: item.verb || item.infinitive || item.base || '',
    infinitive: item.infinitive || item.verb || item.base || '',
    english: item.english || item.translation || item.meaning || '',
    forms: {
      ich: forms.ich || item.ich || '', du: forms.du || item.du || '', er: forms.er || forms['er/sie/es'] || item.er || '',
      wir: forms.wir || item.wir || '', ihr: forms.ihr || item.ihr || '', sie: forms.sie || forms['sie/Sie'] || item.sie || ''
    },
    level: item.level || 'A1',
    topic: item.topic || 'verbs'
  };
}
export function normalizeExerciseItem(item={}){
  return {
    ...item,
    question: item.question || item.prompt || item.title || item.front || '',
    answer: item.answer || item.solution || item.correct || item.back || '',
    options: Array.isArray(item.options) ? item.options : Array.isArray(item.choices) ? item.choices : [],
    explanation: item.explanation || item.reason || item.reason_de || '',
    level: item.level || 'A1',
    type: item.type || item.topic || 'general',
    topic: item.topic || item.type || 'general'
  };
}
export function normalizeSentenceBank(bank={}){
  if(Array.isArray(bank)) return { all: bank.map(x=>normalizeExerciseItem(x)) };
  const out={};
  for(const [k,v] of Object.entries(bank||{})) out[k]=Array.isArray(v)?v.map(x=>normalizeExerciseItem(x)):[];
  return out;
}
export function normalizeLidQuestion(q={}){
  return {
    ...q,
    question_de: q.question_de || q.question || q.de || '',
    question_en: q.question_en || q.en || '',
    options: (q.options || q.answers || []).map(opt => typeof opt === 'string' ? {de:opt,en:'',correct:false} : {de: opt.de || opt.text || opt.answer || '', en: opt.en || '', correct: !!opt.correct}),
  };
}
