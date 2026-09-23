/* Deutsch Coach – Frau Weber.
   A strict teacher's voice, used at planning time, on repeated mistakes, on broken streaks
   and when someone asks for a shortcut. Three tones: streng (default), neutral, freundlich.
   Rules that never change, whatever the tone:
     · she mocks the request or the habit, never the person;
     · she never fires on a first attempt or on a typo – only on a confirmed, repeated error;
     · if someone is doing badly AND still showing up, she switches to keeping them in the chair. */
(function () {
  "use strict";
  const W = (window.Weber = {});
  const tone = () => (Store.get().settings.tone || "streng");
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  const L = {
    /* --- the plan is realistic --- */
    planOk: {
      streng: [
        "{level} in {weeks} weeks, {min} minutes a day. That is a real plan, not a wish. Miss three days and we recalculate – you won't enjoy that conversation.",
        "Acceptable. {lessons} lessons and {words} words a day. Nobody will do it for you.",
        "Good. Now the boring part: doing it on the days you don't feel like it. That's the part that decides.",
      ],
      neutral: ["{level} in {weeks} weeks means about {min} minutes a day. That's realistic if you keep to it.", "Fine. {lessons} lessons and {words} words a day."],
      freundlich: ["That's a sensible plan – about {min} minutes a day. You can do that. 🙂", "Nice goal! {lessons} lessons and {words} words a day, and we'll adjust as we go."],
    },
    /* --- the plan is fantasy --- */
    planMad: {
      streng: [
        "{level} in {days} days. Courses budget {hours} hours for that. You have {days} days and, let me guess, a job. Shall we plan for {level}, or for something you'll still be doing in week three?",
        "{days} days. That works out at {min} minutes every single day, including the day you're ill and the day you're travelling. Pick a date you can defend.",
        "Ambitious is good. Impossible is just a way of failing on schedule. Give me {realWeeks} weeks and I'll take you seriously.",
      ],
      neutral: ["{level} usually needs about {hours} hours. In {days} days that's {min} minutes a day – very demanding. Consider {realWeeks} weeks instead."],
      freundlich: ["That's a big goal! {level} normally takes about {hours} hours, so {days} days means {min} minutes a day. {realWeeks} weeks would be gentler."],
    },
    /* --- the plan is far too easy --- */
    planLazy: {
      streng: [
        "{min} minutes a day. At that speed you'll be ordering coffee confidently in {year}. The visa office will have moved twice by then.",
        "That isn't a plan, it's a hobby. Twenty minutes a day would finish this three times faster.",
        "You've given yourself {weeks} weeks for work worth {realWeeks}. Either raise the pace or lower the goal – drifting does neither.",
      ],
      neutral: ["At {min} minutes a day this will take until about {year}. Raising it a little would help."],
      freundlich: ["That's very relaxed – around {year} at this pace. Even ten more minutes a day would speed things up a lot."],
    },
    /* --- why it matters; used at planning time and monthly, never after a wrong answer --- */
    stakes: {
      streng: [
        "Your certificate isn't decoration. Employers ask for B1, the residence office asks for B1, and neither accepts “I understood most of it”.",
        "Every week you postpone is a week you're competing against people who didn't.",
        "Language is the thing standing between you and the job you're qualified for. Treat it like the job interview it is.",
      ],
      neutral: ["B1 is what most employers and authorities ask for, so the certificate is worth planning around."],
      freundlich: ["Getting to B1 opens doors – jobs, paperwork, conversations. Worth the effort. 🙂"],
    },
    /* --- asking for a shortcut --- */
    shortcut: {
      streng: [
        "A shortcut. Wonderful. I'll fetch the one the other four million learners missed.",
        "There is no trick for the {topic}. There is Tuesday, and there is Thursday, and doing it on both.",
        "You can have it fast or you can have it badly. The second one is quicker, and you'll pay for it in the exam.",
      ],
      neutral: ["There's no shortcut for {topic}, but there is a shorter route: ten focused minutes daily beats an hour on Sunday."],
      freundlich: ["No magic trick, sorry – but short daily practice really is the fastest way. 🙂"],
    },
    /* --- the same rule missed again (only after repeated, confirmed errors) --- */
    repeat: {
      streng: [
        "“{topic}” again. That's {n} times. It isn't a difficult rule. It's an unrehearsed one. Read it aloud, then we continue.",
        "{n} times now on {topic}. At some point we should admit this rule needs five minutes of your attention rather than five more guesses.",
        "Same rule, {n}th time. Guessing is not a strategy; the rule card is right there.",
      ],
      neutral: ["That's {n} times on {topic}. Worth reading the rule card before the next round."],
      freundlich: ["{topic} again ({n}×) – totally normal, it's a tricky one. Let's look at the rule together. 🙂"],
    },
    /* --- streak broken --- */
    streak: {
      streng: [
        "{days} days, then nothing for {gap}. German doesn't wait for you; it quietly leaves.",
        "A {gap}-day gap. Your vocabulary noticed, even if you didn't.",
        "Back, are we. Fine. Ten minutes now beats the apology.",
      ],
      neutral: ["You had {days} days going, then a {gap}-day gap. Start again today – short is fine."],
      freundlich: ["Welcome back! A {gap}-day break happens. Let's do a short session today. 🙂"],
    },
    /* --- struggling but still showing up: never pile on --- */
    rough: {
      streng: ["That was ugly. It happens. Three drills and stop for today – tired practice teaches nothing.", "Bad session, not a bad learner. Do these three, then close the app."],
      neutral: ["Tough session. Do three short drills and leave it there for today."],
      freundlich: ["That was a hard one – be kind to yourself. Three quick drills and that's plenty for today. 🙂"],
    },
    /* --- behind schedule --- */
    behind: {
      streng: [
        "You're {n} lessons behind. The date doesn't move on its own, so either the pace rises or the date does. Which?",
        "{n} lessons behind after {weeks} weeks. I've rewritten the plan. You won't like the new daily number, and that's the point.",
      ],
      neutral: ["You're {n} lessons behind. I've recalculated the daily load."],
      freundlich: ["You're {n} lessons behind – no drama, I've adjusted the plan. 🙂"],
    },
    ahead: {
      streng: ["Ahead of schedule. Don't celebrate, consolidate – review the weak topics while you're winning.", "Ahead by {n} lessons. Good. Now do it again next week."],
      neutral: ["You're {n} lessons ahead of plan. Nicely done."],
      freundlich: ["You're {n} lessons ahead – brilliant work! 🎉"],
    },
  };

  W.say = (kind, vars = {}) => {
    const set = L[kind]; if (!set) return "";
    let t = pick(set[tone()] || set.neutral || set.streng);
    Object.entries(vars).forEach(([k, v]) => (t = t.split("{" + k + "}").join(String(v))));
    return t;
  };
  W.html = (kind, vars, cls = "") => `<div class="weber ${cls}"><span class="wav">FW</span><p>${H.esc(W.say(kind, vars)).replace(/“([^”]*)”/g, "<b>“$1”</b>")}</p></div>`;

  /* Hours usually needed per level (guided learning hours, the range course books quote). */
  W.HOURS = { A1: 80, A2: 160, B1: 300, B2: 450, C1: 600, C2: 750 };
  /* How demanding a plan is: <25 min/day = lazy, >150 min/day = fantasy for most working adults. */
  W.judgePlan = ({ hoursNeeded, days }) => {
    const min = Math.round((hoursNeeded * 60) / Math.max(1, days));
    if (min > 150) return { verdict: "planMad", min };
    if (min < 15) return { verdict: "planLazy", min };
    return { verdict: "planOk", min };
  };
})();
