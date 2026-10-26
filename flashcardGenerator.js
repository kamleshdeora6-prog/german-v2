// Optional flashcard generator (non-breaking)
export function generateExtraFlashcards(vocab, verbs) {
  const cards = [];
  let id = 1;

  for (const v of vocab) {
    cards.push({
      id: `gen_${id++}`,
      type: "vocab",
      level: v.level || "A1",
      topic: v.topic || "",
      front: v.word,
      back: v.translation
    });
  }

  for (const vb of verbs) {
    cards.push({
      id: `gen_${id++}`,
      type: "verb",
      level: vb.level || "A1",
      topic: vb.topic || "",
      front: vb.verb,
      back: vb.translation
    });
  }

  return cards;
}
