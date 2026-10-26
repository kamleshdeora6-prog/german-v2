
import { normalizeText } from './normalize.js';
export function compareAnswerLoose(user, correct){
  const u=normalizeText(user), c=normalizeText(correct);
  return !!u && (u===c || c.includes(u) || u.includes(c));
}
export function compareAnswerStrict(user, correct){
  return normalizeText(user)===normalizeText(correct);
}
