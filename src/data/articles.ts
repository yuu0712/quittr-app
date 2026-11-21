/**
 * Learn articles — original, plain-language explainers written for this app.
 * General information only, not medical advice.
 */

export type ArticleCategory = 'Basics' | 'Mind' | 'Sleep' | 'Health' | 'Guides';

export interface ArticleBlock {
  type: 'p' | 'h';
  text: string;
}

export interface Article {
  id: string;
  title: string;
  subtitle: string;
  category: ArticleCategory;
  minutes: number;
  emoji: string;
  gradient: [string, string];
  /** shown in the "Start here" path on the Learn home, in order */
  startHere?: number;
  body: ArticleBlock[];
}

const p = (text: string): ArticleBlock => ({ type: 'p', text });
const h = (text: string): ArticleBlock => ({ type: 'h', text });

export const ARTICLES: readonly Article[] = [
  {
    id: 'understanding-the-problem',
    title: 'Understanding the Problem',
    subtitle: 'How nicotine hooks your brain',
    category: 'Basics',
    minutes: 6,
    emoji: '🧠',
    gradient: ['#f59e0b', '#ef4444'],
    startHere: 1,
    body: [
      p('A pouch looks harmless: no smoke, no smell, nothing to light. But inside, the nicotine reaches your brain in minutes and tells it to release dopamine — the chemical your brain uses to say "that was good, do that again."'),
      p('Repeat that signal often enough and your brain adapts. It produces a little less dopamine on its own and starts treating the pouch as the normal way to feel focused, calm, or awake. That is not a character flaw. It is learning, done by chemistry.'),
      h('Why pouches hook so quietly'),
      p('A cigarette forces breaks: you have to go outside, and it ends. A pouch has no natural stopping point. It works in meetings, in the car, in bed. Many people end up using from waking to sleeping — a steady drip their brain now expects.'),
      p('The good news inside the bad news: because this is learned, it can be unlearned. When the nicotine stops, the brain gradually restores its own dopamine balance. Most people feel the sharpest discomfort in the first days, then a steady easing over the following weeks.'),
      h('What this means for your quit'),
      p('You are not fighting a habit so much as retraining a system. Every pouch-free hour is a small training session. Cravings are not a sign it is failing — they are the old learning asking to be refreshed, and each one you ride out weakens it.'),
    ],
  },
  {
    id: 'five-minute-rule',
    title: 'The 5-Minute Rule',
    subtitle: 'Riding out a craving, step by step',
    category: 'Mind',
    minutes: 4,
    emoji: '🌊',
    gradient: ['#06b6d4', '#3b82f6'],
    startHere: 2,
    body: [
      p('A craving feels like it will keep rising until you give in. In reality it behaves like a wave: it builds, peaks, and falls — usually within about 3 to 5 minutes — whether you use or not.'),
      h('The technique'),
      p('1. Notice and name it: "This is a craving. It will peak and pass." Naming it moves it from a command to an event.'),
      p('2. Set a timer for 5 minutes. You are not quitting forever in this moment — you are only outlasting one wave.'),
      p('3. Change your body, not just your mind: cold water, a short walk, chewing gum, slow breathing (in for 4, hold for 4, out for 6). Physical change breaks the loop faster than arguing with yourself.'),
      p('4. When the timer ends, check in. Most people find the urge has dropped from a shout to a murmur. Log the win — your brain learns from proof.'),
      h('Why the Panic Button exists'),
      p('The Panic Button on the Home tab is this technique in one tap. Use it early, when the wave is small, not only at the peak.'),
    ],
  },
  {
    id: 'hidden-dangers',
    title: 'Hidden Dangers',
    subtitle: 'Signs you are using more than you think',
    category: 'Basics',
    minutes: 5,
    emoji: '⚠️',
    gradient: ['#8b5cf6', '#ec4899'],
    startHere: 3,
    body: [
      p('Pouch use creeps. Because there is no smoke break and no smell, the usual signals that you are "having a lot" never appear. These are the signs people most often recognise in themselves:'),
      p('• The first pouch goes in within minutes of waking — before coffee, before your phone.\n• You keep a pouch in during most of the day, replacing one with the next.\n• You have increased the strength (for example 3mg to 6mg) to feel the same effect.\n• You keep spare cans in the car, desk, and jacket "just in case", and feel uneasy without one.\n• You have tried to cut down before and quietly drifted back.'),
      h('The tolerance trap'),
      p('Tolerance means the same dose produces a smaller effect, so the dose grows. A can that lasted three days lasts one. Total daily nicotine — pouches multiplied by strength — is the number that matters, and it is the number almost nobody tracks. That is exactly what the Journal and a taper plan make visible.'),
      p('None of this makes you weak. It makes the product effective at its job. Seeing the pattern clearly is the first step out of it.'),
    ],
  },
  {
    id: 'quit-timeline',
    title: 'Your Quit Timeline',
    subtitle: 'What happens day by day after you stop',
    category: 'Basics',
    minutes: 7,
    emoji: '📅',
    gradient: ['#22c55e', '#14b8a6'],
    startHere: 4,
    body: [
      p('Everyone is different, but the broad shape of nicotine withdrawal is well known. Knowing what is coming — and that it is temporary — makes it much easier to stay the course.'),
      h('Days 1–3: the peak'),
      p('Cravings are strongest and most frequent. Irritability, restlessness, low mood, headaches, and trouble concentrating are common. This is your brain noticing the missing signal and protesting. It is also the worst of it: symptoms typically peak around day 3.'),
      h('Days 4–7: the turn'),
      p('Physical symptoms fade. Cravings still come, but they are shorter and tied to specific moments — after meals, with coffee, in the car. Sleep may still be uneven. Your mouth starts to feel like yours again.'),
      h('Weeks 2–4: retraining'),
      p('Focus and mood level out as dopamine balance recovers. Triggers weaken one by one as you live each routine — the drive, the deadline, the evening — without a pouch for the first time.'),
      h('Months 2–3: the new normal'),
      p('Most people describe cravings as occasional and easy to dismiss. By 90 days — this app\'s Nicotine-Free goal — the daily work is done. What remains is simply not starting again.'),
      p('If you are tapering instead of stopping at once, the same timeline applies, stretched out and softened: smaller peaks, spread over more weeks.'),
    ],
  },
  {
    id: 'how-tapering-works',
    title: 'How Tapering Works',
    subtitle: 'The ladder method, explained',
    category: 'Guides',
    minutes: 6,
    emoji: '🪜',
    gradient: ['#6366f1', '#8b5cf6'],
    startHere: 5,
    body: [
      p('Cold turkey works for some people. For many heavy users it fails for a predictable reason: the drop from a full dose to zero is the single hardest step, taken on the hardest day. Tapering splits that cliff into stairs.'),
      h('Two levers, one at a time'),
      p('Your daily nicotine has two parts: how many pouches, and how strong each one is. Tapering moves one lever at a time. First the count steps down week by week — 12, 10, 8, 6, and so on. Only when the count is low does the strength step down, from 6mg toward 3mg. Each step is small enough that the week barely notices.'),
      h('A ceiling, not a target'),
      p('The daily number in a taper is a maximum, not a quota. Finishing the day under it is a win, not a waste. And going over it is data, not failure: the plan can hold a step for another week instead of collapsing.'),
      h('Why the end date matters'),
      p('A taper without a zero date drifts. Your plan sets Zero Day in advance — a date on the calendar, decided while you are calm, rather than a decision you have to win again every tired evening.'),
      p('Ready when you are: Profile → Start a taper builds your personal ladder from your current count and strength.'),
    ],
  },
  {
    id: 'sleep-without-nicotine',
    title: 'Sleep Without Nicotine',
    subtitle: 'Why nights get rough, then better',
    category: 'Sleep',
    minutes: 5,
    emoji: '🌙',
    gradient: ['#7c3aed', '#312e81'],
    body: [
      p('Nicotine is a stimulant, but regular users often feel it helps them sleep — what it actually does is relieve the low-level withdrawal that builds overnight. When you quit, the first nights can be restless: vivid dreams, waking early, a wired-but-tired feeling.'),
      h('What helps this week'),
      p('• Keep a fixed wake time, even after a bad night. It anchors everything else.\n• No pouches as a "nightcap" during a taper — move your last pouch earlier each week instead.\n• Cut caffeine after midday while withdrawal lasts; your sensitivity to it may be higher than you expect.\n• If you wake at 3 a.m., get up briefly rather than lying there negotiating with a craving.'),
      h('The other side'),
      p('Within a few weeks, most people report deeper, less broken sleep than they had while using — the stimulant is gone, and so is the overnight withdrawal cycle that used to wake them.'),
    ],
  },
  {
    id: 'gums-and-mouth',
    title: 'Your Gums on Pouches',
    subtitle: 'What sitting against your gum all day does',
    category: 'Health',
    minutes: 5,
    emoji: '🦷',
    gradient: ['#0ea5e9', '#22c55e'],
    body: [
      p('A pouch spends 30 to 60 minutes pressed against one spot of gum, many times a day. Users commonly report soreness, irritation, and a white or wrinkled patch where the pouch sits, and dentists report gum recession — the gum pulling away from the tooth — at the usual placement site.'),
      h('Why it matters'),
      p('Receded gums do not grow back on their own, and exposed tooth roots are more sensitive and more vulnerable to decay. Dry mouth from constant use adds to the risk, because saliva is the mouth\'s main defence.'),
      h('The recovery'),
      p('Soft-tissue irritation usually calms within days to weeks of stopping, and the constant dry, sore feeling fades with it. If you have a sore that does not heal within two weeks of quitting, or visible recession, get a dentist to look — that advice stands whether you quit with this app or not.'),
      p('While tapering, rotate placement spots and give your mouth pouch-free hours. It reduces harm on the way down — and those hours are practice for zero.'),
    ],
  },
  {
    id: 'replace-the-ritual',
    title: 'Replace the Ritual',
    subtitle: 'Beating the oral fixation, not just the drug',
    category: 'Mind',
    minutes: 4,
    emoji: '🔁',
    gradient: ['#f97316', '#f59e0b'],
    body: [
      p('Ask long-time users what they miss and many will not say the buzz — they will say the thing under their lip. The tingling, the flavour, the small ritual of placing a pouch: the mouth learns the habit as deeply as the brain learns the chemical.'),
      h('Give the ritual a successor'),
      p('• Strong mints or gum at the exact moments you used to place a pouch — after meals, starting the car, sitting at your desk.\n• Nicotine-free pouches, if the physical sensation is the hard part. The ritual survives while the dose falls to zero.\n• A toothpick or a glass of cold water works for some people — the specific substitute matters less than having one chosen in advance.'),
      h('Plan the moments, not the day'),
      p('You do not crave all day. You crave at five or six repeatable moments. List yours, assign each one a substitute, and the day gets much smaller.'),
    ],
  },
  {
    id: 'brain-fog',
    title: 'Brain Fog Is Normal',
    subtitle: 'Concentration, mood, and the dip in the middle',
    category: 'Health',
    minutes: 4,
    emoji: '🌫️',
    gradient: ['#64748b', '#334155'],
    body: [
      p('A few days into quitting, many people feel slower: words hide, focus slips, small things irritate. It is easy to read this as "I genuinely work better on nicotine." What is actually happening is withdrawal — nicotine had been topping up attention artificially, and the brain needs a short period to recalibrate.'),
      h('How long'),
      p('For most people the fog peaks in the first week and lifts steadily over the next two to three. What returns is not just baseline: without the spike-and-crash cycle of dose, wait, dose, concentration across the whole day tends to be steadier than it was while using.'),
      h('Getting through the dip'),
      p('• Front-load hard tasks to your best hour, and forgive the rest.\n• Short walks genuinely help — movement is one of the few instant, legal focus aids.\n• Tell people close to you that this week may be a blunt one. Irritability is a symptom, not a personality change.'),
    ],
  },
];

export function articlesByCategory(
  category: ArticleCategory | 'All',
): Article[] {
  if (category === 'All') return [...ARTICLES];
  return ARTICLES.filter((a) => a.category === category);
}

export const START_HERE: Article[] = ARTICLES.filter(
  (a) => a.startHere !== undefined,
).sort((a, b) => (a.startHere ?? 0) - (b.startHere ?? 0));
