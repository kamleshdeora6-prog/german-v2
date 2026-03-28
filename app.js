const state={data:{passages:[],notes:{},exercises:[],flashcards:[],conjugation:[],sentences:{},vocab:[]},ui:{section:'dashboard',practiceTab:'exercises',vocabTab:'list'},exercise:{pool:[],index:0,current:null},typing:{current:null},writing:{current:null},flash:{pool:[],index:0,flipped:false},conj:{pool:[],index:0,current:null,quiz:null},match:{pairs:[],selected:null,matched:0}};
const LS_KEY='german_app_replacement_v2';
let currentUtterance=null;
function todayKey(){return new Date().toISOString().slice(0,10)}
function loadStore(){const raw=localStorage.getItem(LS_KEY);const base={theme:'theme-focus',missionPreset:'medium',daily:{},weakAreas:{},history:[],localPassages:[]};try{return Object.assign(base, raw?JSON.parse(raw):{});}catch{return base;}}
function saveStore(){localStorage.setItem(LS_KEY, JSON.stringify(store));}
let store=loadStore();
function ensureToday(){if(!store.daily[todayKey()]) store.daily[todayKey()]={passages:0,exercises:0,exercisesCorrect:0,vocab:0,writing:0,typingChecks:0};}
ensureToday();
const missionTargets={easy:{passages:1,exercises:10,vocab:8,writing:1},medium:{passages:2,exercises:20,vocab:12,writing:2},hard:{passages:3,exercises:35,vocab:20,writing:3},intense:{passages:5,exercises:60,vocab:30,writing:5}};
const q=s=>document.querySelector(s), qa=s=>Array.from(document.querySelectorAll(s));
async function loadJson(path){const res=await fetch(path+'?v=' + Date.now()); if(!res.ok) throw new Error(path); return res.json();}
async function init(){try{
 const [passages,notes,exercises,flashcards,conjugation,sentences,vocab]=await Promise.all([loadJson('data/passages.json'),loadJson('data/notes.json'),loadJson('data/exercises.json'),loadJson('data/flashcards.json'),loadJson('data/conjugation.json'),loadJson('data/sentences.json'),loadJson('data/vocab.json')]);
 state.data.passages=[...passages,...(store.localPassages||[])];
 state.data.notes=notes; state.data.exercises=exercises.exercises||[]; state.data.flashcards=flashcards.flashcards||[]; state.data.conjugation=conjugation.verbs||[]; state.data.sentences=sentences; state.data.vocab=Array.isArray(vocab)?vocab:(vocab.words||[]);
 bootstrap();
 }catch(err){console.error(err); alert('Failed to load one or more files. Make sure all GitHub files are uploaded together.');}
}
function bootstrap(){document.body.className=store.theme; q('#themeSelect').value=store.theme; q('#missionPreset').value=store.missionPreset; updateAudioState(false); bindNav(); buildCounts(); buildRoadmap(); buildInsights(); setupTopControls(); setupPassages(); setupExercises(); setupTyping(); setupWriting(); setupVocab(); setupConj(); setupFlashcards(); setupGrammar(); setupNotes(); updateMissionUI(); goSection('dashboard');}
function bindNav(){qa('.navbtn').forEach(btn=>btn.onclick=()=>goSection(btn.dataset.section)); qa('[data-practice]').forEach(btn=>btn.onclick=()=>switchPractice(btn.dataset.practice)); qa('[data-vocabtab]').forEach(btn=>btn.onclick=()=>switchVocabTab(btn.dataset.vocabtab));}
function goSection(name){state.ui.section=name; qa('.navbtn').forEach(b=>b.classList.toggle('active', b.dataset.section===name)); qa('.app-section').forEach(sec=>sec.classList.add('hidden')); q('#section-'+name).classList.remove('hidden');}
window.goSection=goSection;
function setupTopControls(){q('#themeSelect').onchange=e=>{store.theme=e.target.value; document.body.className=store.theme; saveStore();}; q('#missionPreset').onchange=e=>{store.missionPreset=e.target.value; saveStore(); updateMissionUI();}; q('#resetTodayBtn').onclick=()=>{store.daily[todayKey()]={passages:0,exercises:0,exercisesCorrect:0,vocab:0,writing:0,typingChecks:0}; saveStore(); updateMissionUI(); buildInsights();};}
function buildCounts(){q('#dataCounts').textContent=`${state.data.passages.length} passages • ${Object.keys(state.data.notes).length} notes • ${state.data.exercises.length} exercises • ${state.data.vocab.length} vocab • ${state.data.conjugation.length} verbs`;}
function updateStreak(){const days=Object.keys(store.daily).sort(); let streak=0; let d=new Date(); while(true){const key=d.toISOString().slice(0,10); const day=store.daily[key]; if(day && (day.passages+day.exercises+day.vocab+day.writing)>0){streak++; d.setDate(d.getDate()-1);} else break;} q('#streakBadge').textContent='Streak '+streak;}
function topWeak(){const entries=Object.entries(store.weakAreas||{}).sort((a,b)=>b[1]-a[1]); return entries[0]?.[0] || '—';}
function updateWeakBadge(){q('#weakAreaBadge').textContent='Weak area: '+topWeak().replaceAll('_',' ');}
function updateMissionUI(){ensureToday(); const t=missionTargets[store.missionPreset]; const d=store.daily[todayKey()]; const map=[['Passages','passages'],['Exercises','exercisesCorrect'],['Vocab','vocab'],['Writing','writing']]; map.forEach(([name,key])=>{const target=name==='Exercises'?t.exercises:t[key.toLowerCase()]||t[name.toLowerCase()]||t[(name==='Vocab'?'vocab':'writing')];}); setMission('Passages', d.passages, t.passages); setMission('Exercises', d.exercisesCorrect, t.exercises); setMission('Vocab', d.vocab, t.vocab); setMission('Writing', d.writing, t.writing); q('#statPassages').textContent=d.passages; q('#statExercises').textContent=d.exercisesCorrect; q('#statVocab').textContent=d.vocab; q('#statWriting').textContent=d.writing; updateStreak(); updateWeakBadge();}
function setMission(name,current,target){const id='mission'+name; q('#'+id).style.width=Math.min(100,(current/Math.max(1,target))*100)+'%'; q('#'+id+'Text').textContent=`${current}/${target}`;}
function markArea(area, good=false){ensureToday(); if(!good){store.weakAreas[area]=(store.weakAreas[area]||0)+1;} saveStore(); updateWeakBadge();}
function buildRoadmap(){const roadmap=[
 {level:'A1',emoji:'🌱',focus:'Build basics',items:['articles + pronouns','present tense verbs','question words','simple daily sentences']},
 {level:'A2',emoji:'🚶',focus:'Expand everyday German',items:['Perfekt','modal verbs','prepositions','weil / dass / wenn']},
 {level:'B1',emoji:'🧭',focus:'Handle real-life topics',items:['relative clauses','reflexive verbs','word order','book themes: work, housing, shopping, health']},
 {level:'B2',emoji:'🚀',focus:'Argue and write clearly',items:['Konjunktiv II','passive','opinion phrases','longer writing + formal style']},
 ]; q('#roadmapCards').innerHTML=roadmap.map(r=>`<div class="card"><div class="row" style="justify-content:space-between"><strong>${r.emoji} ${r.level}</strong><span class="pill">${r.focus}</span></div><ul class="small">${r.items.map(i=>`<li>${i}</li>`).join('')}</ul></div>`).join('');}
function buildInsights(){ensureToday(); const d=store.daily[todayKey()]; const weak=topWeak(); q('#insightsBox').innerHTML=`<p><strong>Today:</strong> ${d.passages} passages, ${d.exercisesCorrect} correct exercises, ${d.vocab} vocab items, ${d.writing} writing tasks.</p><p><strong>Main weak spot:</strong> ${weak.replaceAll('_',' ')}.</p><p><strong>Suggestion:</strong> ${weak==='—'?'Start with one passage and 10 exercises.':`Do 10 more ${weak.replaceAll('_',' ')} exercises, then review one related note.`}</p>`;}
// Passages
function setupPassages(){const levels=['All','A1','A2','B1','B2']; q('#passageLevel').innerHTML=levels.map(x=>`<option>${x}</option>`).join(''); q('#passageLevel').onchange=renderPassages; q('#passageSearch').oninput=renderPassages; q('#saveLocalPassageBtn').onclick=()=>{const german=q('#localPassageGerman').value.trim(), english=q('#localPassageEnglish').value.trim(); if(!german) return; const p={level:q('#localPassageLevel').value,chapter:'Local entry',title:german.split(/
/)[0].slice(0,60),german,english}; store.localPassages.push(p); saveStore(); state.data.passages.push(p); q('#localPassageGerman').value=''; q('#localPassageEnglish').value=''; renderPassages();}; renderPassages();}
function renderPassages(){const level=q('#passageLevel').value||'All'; const term=(q('#passageSearch').value||'').toLowerCase(); let list=state.data.passages.filter(p=>(level==='All'||(p.level||'').toUpperCase()===level) && (!term || [p.title,p.chapter,p.german,p.english].join(' ').toLowerCase().includes(term))); q('#passagesList').innerHTML=list.map((p,i)=>`<div class="card"><div class="row" style="justify-content:space-between"><div><span class="pill">${p.level}</span> <strong>${p.title||'Untitled passage'}</strong><div class="small muted">${p.chapter||''}</div></div><div class="row"><button onclick="listenText(${i})">🔊 Listen</button><button class="stop-audio-btn" onclick="stopSpeech()">⏹ Stop</button><button onclick="markPassageRead(${i})">✅ Read</button></div></div><pre style="white-space:pre-wrap">${escapeHtml(p.german||'')}</pre>${p.english?`<details><summary>English</summary><pre style="white-space:pre-wrap">${escapeHtml(p.english)}</pre></details>`:''}</div>`).join('') || '<div class="card">No passages found.</div>';}
window.listenText=(i)=>speak(state.data.passages[i]?.german||''); 
window.stopSpeech=stopSpeech;
window.markPassageRead=(i)=>{ensureToday(); store.daily[todayKey()].passages++; saveStore(); updateMissionUI(); buildInsights(); alert('Passage counted for today.');};
function speak(text){
 if(!('speechSynthesis' in window)) return alert('Speech is not supported in this browser.');
 stopSpeech();
 currentUtterance=new SpeechSynthesisUtterance(text);
 currentUtterance.lang='de-DE';
 currentUtterance.rate=Number(q('#audioSpeed')?.value||1);
 currentUtterance.onend=()=>{currentUtterance=null; updateAudioState(false);};
 speechSynthesis.speak(currentUtterance);
 updateAudioState(true);
}
function stopSpeech(){
 if(!('speechSynthesis' in window)) return;
 speechSynthesis.cancel();
 currentUtterance=null;
 updateAudioState(false);
}
function updateAudioState(isPlaying){
 qa('.stop-audio-btn').forEach(btn=>btn.disabled=!isPlaying);
}
// Exercises
const typeLabels={articles:'Articles',prepositions:'Prepositions',connectors:'Connectors',adjectives:'Adjective endings',word_order:'Word order',passive:'Passive',konjunktiv_ii:'Konjunktiv II',relative_clauses:'Relative clauses',translation_en_de:'Translation EN→DE',sentence_patterns:'Sentence patterns',mixed_quiz:'Mixed quiz'};
function setupExercises(){q('#exerciseLevel').innerHTML=['All','A1','A2','B1','B2'].map(x=>`<option>${x}</option>`).join(''); const types=['All',...Array.from(new Set(state.data.exercises.map(e=>e.type))).sort()]; q('#exerciseType').innerHTML=types.map(t=>`<option value="${t}">${typeLabels[t]||t.replaceAll('_',' ')}</option>`).join(''); q('#exerciseLevel').onchange=buildExercisePool; q('#exerciseType').onchange=buildExercisePool; q('#exerciseOrder').onchange=buildExercisePool; q('#checkExerciseBtn').onclick=checkExercise; q('#nextExerciseBtn').onclick=nextExercise; q('#restartExerciseBtn').onclick=buildExercisePool; buildExercisePool();}
function buildExercisePool(){const level=q('#exerciseLevel').value||'All', type=q('#exerciseType').value||'All', order=q('#exerciseOrder').value||'random'; let pool=state.data.exercises.filter(e=>(level==='All'||e.level===level) && (type==='All'||e.type===type)); if(order==='random') pool=shuffle(pool); state.exercise.pool=pool; state.exercise.index=0; renderExercise();}
function renderExercise(){const pool=state.exercise.pool; q('#exerciseProgressPill').textContent=`Progress: ${Math.min(pool.length,state.exercise.index+ (pool.length?1:0))}/${pool.length}`; if(!pool.length){q('#exerciseQuestion').textContent='No exercises found for this filter.'; q('#exerciseHintPill').textContent='Mode: —'; q('#exerciseResult').textContent=''; q('#exerciseAnswer').value=''; return;} const item=pool[Math.min(state.exercise.index,pool.length-1)]; state.exercise.current=item; q('#exerciseQuestion').textContent=item.question; q('#exerciseHintPill').textContent=`${item.level} • ${typeLabels[item.type]||item.type}`; q('#exerciseResult').textContent=item.hint||''; q('#exerciseAnswer').value='';}
function normalize(s){return (s||'').toLowerCase().replace(/[“”„]/g,'"').replace(/[’']/g,"'").replace(/\s+/g,' ').trim();}
function checkExercise(){const item=state.exercise.current; if(!item) return; ensureToday(); store.daily[todayKey()].exercises++; const user=q('#exerciseAnswer').value.trim(); const ok=normalize(user)===normalize(item.answer); if(ok){store.daily[todayKey()].exercisesCorrect++; q('#exerciseResult').innerHTML=`<span class="good">✔ Correct</span>`;} else {q('#exerciseResult').innerHTML=`<span class="bad">✘ Not quite.</span><br>Answer: <strong>${escapeHtml(item.answer)}</strong>${item.hint?`<br>Hint: ${escapeHtml(item.hint)}`:''}`; markArea(item.type,false);} saveStore(); updateMissionUI(); buildInsights();}
function nextExercise(){if(!state.exercise.pool.length) return; state.exercise.index=(state.exercise.index+1)%state.exercise.pool.length; renderExercise();}
// typing
function switchPractice(tab){state.ui.practiceTab=tab; qa('[data-practice]').forEach(b=>b.classList.toggle('active',b.dataset.practice===tab)); ['exercises','typing','writing'].forEach(t=>q('#practice-'+t).classList.toggle('hidden',t!==tab));}
function setupTyping(){const opts=state.data.passages.map((p,i)=>`<option value="${i}">${p.level} • ${p.title}</option>`).join(''); q('#typingPassageSelect').innerHTML=opts; q('#typingPassageSelect').onchange=renderTypingPassage; q('#typingShowEnglish').onchange=renderTypingPassage; q('#typingListenBtn').onclick=()=>speak(state.typing.current?.german||''); q('#checkTypingBtn').onclick=()=>{const ref=normalize(state.typing.current?.german||''), user=normalize(q('#typingInput').value); const accuracy=Math.round(similarity(ref,user)*100); q('#typingResult').innerHTML=accuracy>=95?`<span class="good">Great job.</span> Accuracy ${accuracy}%`:`<span class="bad">Keep practicing.</span> Accuracy ${accuracy}%`; ensureToday(); store.daily[todayKey()].typingChecks++; if(accuracy>=85) store.daily[todayKey()].writing++; saveStore(); updateMissionUI(); buildInsights();}; q('#clearTypingBtn').onclick=()=>q('#typingInput').value=''; renderTypingPassage();}
function renderTypingPassage(){const p=state.data.passages[Number(q('#typingPassageSelect').value)||0]; state.typing.current=p; q('#typingReference').textContent=p?.german||''; const show=q('#typingShowEnglish').value==='1'; q('#typingEnglishWrap').classList.toggle('hidden',!show); q('#typingEnglishWrap').textContent=show?(p?.english||''):'';}
// writing
function setupWriting(){q('#newWritingPromptBtn').onclick=newWritingPrompt; q('#checkWritingBtn').onclick=()=>{const prompt=state.writing.current; const user=q('#writingInput').value.trim(); if(!prompt||!user) return; const ok=normalize(user)===normalize(prompt.de); const score=Math.round(similarity(normalize(prompt.de),normalize(user))*100); q('#writingResult').innerHTML=ok?`<span class="good">✔ Excellent.</span>`:`<span class="bad">Model answer:</span> ${escapeHtml(prompt.de)}<br>Similarity: ${score}%`; ensureToday(); store.daily[todayKey()].writing++; if(!ok) markArea('sentence_writing',false); saveStore(); updateMissionUI(); buildInsights();}; newWritingPrompt();}
function newWritingPrompt(){const pools=[...(state.data.sentences.a2||[]).map(x=>({...x,level:'A2'})),...(state.data.sentences.b1||[]).map(x=>({...x,level:'B1'})),...(state.data.sentences.b2||[]).map(x=>({...x,level:'B2'}))]; state.writing.current=pools[Math.floor(Math.random()*pools.length)]; q('#writingPrompt').textContent=state.writing.current.en; q('#writingInput').value=''; q('#writingResult').textContent='';}
// vocab
function setupVocab(){q('#vocabLevel').innerHTML=['All','A1','A2','B1','B2'].map(x=>`<option>${x}</option>`).join(''); const topics=['All',...Array.from(new Set(state.data.vocab.map(v=>v.topic))).sort()]; q('#vocabTopic').innerHTML=topics.map(t=>`<option>${t}</option>`).join(''); ['#vocabLevel','#vocabTopic'].forEach(s=>q(s).onchange=renderVocab); q('#vocabSearch').oninput=renderVocab; q('#newMatchGameBtn').onclick=buildMatchGame; renderVocab(); buildMatchGame();}
function switchVocabTab(tab){state.ui.vocabTab=tab; qa('[data-vocabtab]').forEach(b=>b.classList.toggle('active',b.dataset.vocabtab===tab)); q('#vocab-list-tab').classList.toggle('hidden',tab!=='list'); q('#vocab-game-tab').classList.toggle('hidden',tab!=='game');}
function renderVocab(){const level=q('#vocabLevel').value||'All', topic=q('#vocabTopic').value||'All', term=(q('#vocabSearch').value||'').toLowerCase(); const list=state.data.vocab.filter(v=>(level==='All'||v.level===level) && (topic==='All'||v.topic===topic) && (!term||(`${v.de} ${v.en} ${v.topic}`).toLowerCase().includes(term))); q('#vocabStats').textContent=`${list.length} vocabulary items shown`; q('#vocabList').innerHTML=list.slice(0,200).map((v,i)=>`<div class="card"><div class="row" style="justify-content:space-between"><div><span class="pill">${v.level}</span> <strong>${escapeHtml(v.de)}</strong> — ${escapeHtml(v.en)}</div><button onclick="countVocabSeen('${encodeURIComponent(v.de)}')">👁 Seen</button></div><div class="small muted">${escapeHtml(v.topic)}</div>${v.example_de?`<div class="small" style="margin-top:8px"><em>${escapeHtml(v.example_de)}</em></div>`:''}</div>`).join('') || '<div class="card">No vocabulary found for this filter.</div>';}
window.countVocabSeen=(key)=>{ensureToday(); store.daily[todayKey()].vocab++; saveStore(); updateMissionUI(); buildInsights();};
function buildMatchGame(){const pool=shuffle([...state.data.vocab]).slice(0,6); state.match.pairs=pool; state.match.selected=null; state.match.matched=0; q('#matchStatus').textContent='Select one German item and then its English pair.'; q('#matchGerman').innerHTML=pool.map((v,i)=>`<button class="match-btn" data-side="de" data-id="${i}">${escapeHtml(v.de)}</button>`).join(''); const shuffledEn=shuffle(pool.map((v,i)=>({en:v.en,id:i}))); q('#matchEnglish').innerHTML=shuffledEn.map(v=>`<button class="match-btn" data-side="en" data-id="${v.id}">${escapeHtml(v.en)}</button>`).join(''); qa('.match-btn').forEach(btn=>btn.onclick=()=>onMatchClick(btn));}
function onMatchClick(btn){if(btn.classList.contains('done')) return; const side=btn.dataset.side, id=btn.dataset.id; if(!state.match.selected){state.match.selected={side,id,el:btn}; btn.classList.add('selected'); return;} const prev=state.match.selected; if(prev.el===btn) return; const isMatch=prev.id===id && prev.side!==side; if(isMatch){prev.el.classList.remove('selected'); prev.el.classList.add('done'); btn.classList.add('done'); state.match.selected=null; state.match.matched++; ensureToday(); store.daily[todayKey()].vocab++; saveStore(); updateMissionUI(); if(state.match.matched===state.match.pairs.length) q('#matchStatus').textContent='Round complete ✔';} else {prev.el.classList.remove('selected'); state.match.selected=null; q('#matchStatus').textContent='Not a match. Try again.';}}
// conjugation
function setupConj(){q('#conjLevel').innerHTML=['All','A1','A2','B1','B2'].map(x=>`<option>${x}</option>`).join(''); q('#conjLevel').onchange=filterConjPool; q('#conjSearch').oninput=filterConjPool; q('#nextVerbBtn').onclick=()=>{state.conj.index=(state.conj.index+1)%Math.max(1,state.conj.pool.length); renderConj();}; q('#checkConjBtn').onclick=checkConjQuiz; q('#nextConjQuizBtn').onclick=newConjQuiz; filterConjPool();}
function filterConjPool(){const level=q('#conjLevel').value||'All', term=(q('#conjSearch').value||'').toLowerCase(); state.conj.pool=state.data.conjugation.filter(v=>(level==='All'||v.level===level) && (!term||(`${v.infinitive} ${v.english}`).toLowerCase().includes(term))); state.conj.index=0; renderConj();}
function renderConj(){const v=state.conj.pool[state.conj.index]||state.data.conjugation[0]; if(!v) return; state.conj.current=v; q('#conjVerbTitle').textContent=v.infinitive; q('#conjVerbMeta').textContent=`${v.level} • ${v.type} • ${v.english}`; q('#conjForms').innerHTML=Object.entries(v.forms).map(([k,val])=>`<div class="formbox"><div class="label">${k}</div><strong>${escapeHtml(val)}</strong></div>`).join(''); newConjQuiz();}
function newConjQuiz(){const v=state.conj.current; if(!v) return; const pronouns=Object.keys(v.forms); const p=pronouns[Math.floor(Math.random()*pronouns.length)]; state.conj.quiz={pronoun:p,answer:v.forms[p]}; q('#conjQuizPrompt').textContent=`${v.infinitive} → ${p} = ?`; q('#conjQuizAnswer').value=''; q('#conjQuizResult').textContent='';}
function checkConjQuiz(){const user=normalize(q('#conjQuizAnswer').value); const ans=normalize(state.conj.quiz.answer); const ok=user===ans; q('#conjQuizResult').innerHTML=ok?'<span class="good">✔ Correct</span>':`<span class="bad">✘</span> ${escapeHtml(state.conj.quiz.answer)}`; if(!ok) markArea('conjugation',false);}
// flashcards
function setupFlashcards(){const cats=['All',...Array.from(new Set(state.data.flashcards.map(f=>f.category))).sort()]; q('#flashCategory').innerHTML=cats.map(c=>`<option>${c}</option>`).join(''); q('#flashCategory').onchange=buildFlashPool; q('#flashOrder').onchange=buildFlashPool; q('#flashCard').onclick=flipFlash; q('#nextFlashBtn').onclick=nextFlash; buildFlashPool();}
function buildFlashPool(){const cat=q('#flashCategory').value||'All', order=q('#flashOrder').value||'random'; let pool=state.data.flashcards.filter(f=>cat==='All'||f.category===cat); if(order==='random') pool=shuffle(pool); state.flash.pool=pool; state.flash.index=0; state.flash.flipped=false; renderFlash();}
function renderFlash(){const f=state.flash.pool[state.flash.index]; if(!f){q('#flashCard').textContent='No flashcards found.'; return;} q('#flashCard').innerHTML=`<div><div class="pill">${f.category}</div><div style="margin-top:12px">${escapeHtml(state.flash.flipped?f.back:f.front)}</div></div>`;}
function flipFlash(){state.flash.flipped=!state.flash.flipped; renderFlash();}
function nextFlash(){state.flash.index=(state.flash.index+1)%Math.max(1,state.flash.pool.length); state.flash.flipped=false; renderFlash();}
// grammar + notes
function setupGrammar(){q('#grammarTablesText').textContent=`ARTICLES
Nom: der / die / das / die
Akk: den / die / das / die
Dat: dem / der / dem / den
Gen: des / der / des / der

PERSONAL PRONOUNS
Nom: ich, du, er, sie, es, wir, ihr, sie/Sie
Akk: mich, dich, ihn, sie, es, uns, euch, sie/Sie
Dat: mir, dir, ihm, ihr, ihm, uns, euch, ihnen/Ihnen

POSSESSIVES (basic)
mein, dein, sein, ihr, sein, unser, euer, ihr/Ihr

NEGATION
kein / keine / keinen / keinem / keiner / keines

PREPOSITIONS + AKKUSATIV
durch, für, gegen, ohne, um

PREPOSITIONS + DATIV
aus, bei, mit, nach, seit, von, zu, gegenüber

TWO-WAY PREPOSITIONS
an, auf, hinter, in, neben, über, unter, vor, zwischen
Movement = Akkusativ, location = Dativ

CORE B1/B2 STRUCTURES
• weil / dass / wenn → verb at the end
• relative clauses → der, die, das / denen / dessen / deren
• passive → werden + Partizip II
• Konjunktiv II → hätte, wäre, würde
• sentence patterns → Es ist wichtig, dass ... / Ich habe vor, ... zu ... / Einerseits ..., andererseits ...`}
function setupNotes(){q('#notesSearch').oninput=renderNotes; renderNotes();}
function renderNotes(){const term=(q('#notesSearch').value||'').toLowerCase(); const entries=Object.entries(state.data.notes).filter(([k,v])=>!term||(`${k} ${v}`).toLowerCase().includes(term)); q('#notesList').innerHTML=entries.map(([k,v])=>`<div class="card note-item"><div class="row" style="justify-content:space-between"><strong>${escapeHtml(k.replaceAll('_',' '))}</strong><span class="pill">Note</span></div><pre>${escapeHtml(v)}</pre></div>`).join('');}
// helpers
function shuffle(arr){return [...arr].sort(()=>Math.random()-.5)}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",""":"&quot;","'":"&#39;"}[m]))}
function similarity(a,b){if(!a||!b) return 0; const la=a.length, lb=b.length; const dp=Array.from({length:la+1},(_,i)=>Array(lb+1).fill(0)); for(let i=0;i<=la;i++) dp[i][0]=i; for(let j=0;j<=lb;j++) dp[0][j]=j; for(let i=1;i<=la;i++){ for(let j=1;j<=lb;j++){ const cost=a[i-1]===b[j-1]?0:1; dp[i][j]=Math.min(dp[i-1][j]+1,dp[i][j-1]+1,dp[i-1][j-1]+cost);} } const dist=dp[la][lb]; return 1 - dist/Math.max(la,lb);}
init();