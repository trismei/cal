/* content calendar — plain JS, saves to localStorage */
(() => {
  'use strict';

  const PERSONAL = (typeof window !== 'undefined' && window.CC_PERSONAL) || {};
  const KEY = 'content-calendar-v1';
  try {
    // data saved by earlier versions used a different key name: carry it (and its settings) over once
    const OLD = Object.keys(localStorage).find(k => /^[a-z]+-content-calendar-v1$/.test(k));
    if (OLD && !localStorage.getItem(KEY) && localStorage.getItem(OLD)) {
      Object.keys(localStorage).filter(k => k === OLD || k.startsWith(OLD + ':')).forEach(k => localStorage.setItem(KEY + k.slice(OLD.length), localStorage.getItem(k)));
    }
  } catch (e) { /* storage unavailable */ }
  const VIEW_KEY = KEY + ':view';
  const VERSION = 6;

  /* ================= your stuff ================= */

  const GOAL_LINE = PERSONAL.GOAL_LINE || "make every video feel like catching up with a friend: something useful, something real, something worth sharing.";

  // why you're doing all this (edit them on the home page)
  const DEFAULT_MOTIVATIONS = PERSONAL.DEFAULT_MOTIVATIONS || [
    ['🏡', 'a home that is fully mine'],
    ['✈️', 'travel more'],
    ['🛟', 'an emergency fund'],
    ['💻', 'work on my own terms'],
    ['🌱', 'build something that is mine'],
  ];
  const AFFIRMATIONS = PERSONAL.AFFIRMATIONS || [
    "small posts, every week. that's how the big things happen.",
    'done is better than perfect. post the thing.',
    'every pitch is practice. every no is a "not yet".',
    "you're building something that's yours.",
    "consistency beats talent that doesn't show up.",
    "you don't need to go viral. you need to keep going.",
    'someone out there needs the exact video only you can make.',
    "you're not behind. you're building 🌱",
    'less overthinking, more posting ✨',
    'trust the timing. do the work.',
    "you're closer than you think.",
    'the more you create, the more chances you give yourself to win.',
  ];

  const SERIES = PERSONAL.SERIES || [
    { name: 'how-to', tagline: 'teach one useful thing, start to finish.' },
    { name: 'day in my life', tagline: 'the real version of your days.' },
    { name: 'my honest take', tagline: 'your opinion on what everyone is talking about.' },
  ];
  const DEFAULT_SERIES = SERIES.map(s => s.name);
  const DEFAULT_TAGLINES = Object.fromEntries(SERIES.map(s => [s.name, s.tagline]));
  const OLD_PILLARS = ['Internship', 'Student', 'Budget'];

  // [series index, title, what to show]
  const CONTENT_BANK = PERSONAL.CONTENT_BANK || [
    [0, 'One tool that saves me an hour every week.', 'show the before and after'],
    [0, 'How I plan a week of content in one afternoon.', ''],
    [1, 'A realistic day in my life.', ''],
    [1, 'Come with me to my favorite café.', ''],
    [2, "Something everyone recommends that I don't.", ''],
  ];

  const LINE_CATS = [
    { id: 'transitions', label: 'transitions' },
    { id: 'commentary', label: 'sassy commentary' },
    { id: 'lifestyle', label: 'lifestyle & vlog' },
    { id: 'closing', label: 'closing lines' },
  ];
  const DEFAULT_LINES = PERSONAL.DEFAULT_LINES || {
    transitions: ["Okay, here's the thing.", 'Now this is the important part.', 'Let me show you how.'],
    commentary: ["Honestly? I'm not convinced.", 'This one surprised me.', 'Hear me out.'],
    lifestyle: ['Come along with me today.', "Today's plan is simple.", 'A slow start, then work.'],
    closing: ["That's it for today.", 'Try it and tell me how it goes.', 'See you in the next one.'],
  };
  const SERIES_LINE_CAT = PERSONAL.SERIES_LINE_CAT || {};

  const QUESTIONS = [
    'what would someone want to know about this, if we were catching up over coffee?',
    'can this be a ranking, a review, a 7-day try, a before/after, or a how-to?',
    'who do I want watching this, and what are they stuck on?',
    "what's the one annoying problem this solves?",
    "what's the \"wait, really?\" moment?",
    "what will they know after watching that they didn't before?",
    "where's my honest opinion? what do I actually think?",
    'what mistake did I make that they can skip?',
    'what would make someone send this to a friend?',
  ];

  /* ---------- brand messages ----------
     built on your pitch guides: subject = platform + brand + outcome · one line of who you are + proof ·
     why now / why them · the ask, tied to their product · offer the rate card (no prices in the first email).
     fill-ins come from "my kit" + each brand: {brand} {contact} {product} {hook} {idea} {found}
     {deliverables} {rate} {upfront} {invoice} {invoiceDue} {ratecard} {name} {title} {handle}
     {followers} {niche} {audience} {credential} {link} */

  const DEFAULT_PROFILE = PERSONAL.DEFAULT_PROFILE || {
    name: '', title: 'Content creator', handle: '', followers: '', niche: '', audience: '',
    audienceDetail: '', job: '', credential: '', link: '', email: '', lane: '',
  };

  const SIGN_OFF = `Warm regards,
{name}
{title} · {handle}
{link}`;

  const DEFAULT_TEMPLATES = PERSONAL.DEFAULT_TEMPLATES || [
    // first pitch: the frameworks from your Pitch Templates Pack (05), word for word, set up for TikTok
    {
      id: 'pitch-ph', group: 'pitch', name: 'A · Filipino-audience angle',
      text: `Subject: TikTok content for {brand}: {idea} for Filipino {audience}

Hi {contact},

I'm {name}, a {job} who creates content on TikTok about {niche} for Filipino {audience}. Most of my audience is in the Philippines ({audienceDetail}).

Many of them ask me about [the problem your audience has]. I'd love to create {format} showing how {brand} helps with that, in a way that feels local and practical.

If paid creator content is something you're open to, I'd be happy to send my rate card and a few concept ideas.

Thanks,
{name} | {link}`,
    },
    {
      id: 'pitch-use', group: 'pitch', name: 'B · "I use this at work" angle',
      text: `Subject: TikTok content for {brand}: how a {job} uses {product} every day

Hi {contact},

I'm {name}, a {job} and a creator on TikTok ({handle}, {followers} followers). I use {product} at work for [specific task], and my audience often asks how I [result].

I'd love to create {format} showing my real workflow with {product}, from the point of view of someone who uses it daily.

If paid creator content is something you're open to, I'd be happy to send my rate card and a few concept ideas.

Thanks,
{name} | {link}`,
    },
    {
      id: 'pitch-timely', group: 'pitch', name: 'C · timely-news angle',
      text: `Subject: TikTok content for {brand}: {hook} and what it means for {audience}

Hi {contact},

I'm {name}, a {job} who creates content about {niche} on TikTok.

With {hook}, a lot of {audience} are asking [their question]. I'd love to create {format} explaining what changed and where {brand} fits.

If paid creator content is something you're open to, I'd be happy to send my rate card and a few concept ideas.

Thanks,
{name} | {link}`,
    },
    {
      id: 'pitch-local', group: 'pitch', name: 'local brand (like sample 4)',
      text: `Subject: Collab idea for {brand}: {product} for [who you are]

Hi {contact},

I'm {name}, a creator on TikTok ({handle}, {followers} followers). I'm a {job}, and I post about {niche}. {found}, so I hope this can reach whoever handles creator partnerships.

[A routine your followers already see, e.g. "My followers see my work-from-café routine every week."] I'd love to create TikToks for {brand} about {idea}, with your {product} [where it fits in that routine].

Could you point me to the right person for creator partnerships? I'd be happy to send my rate card and a few concept ideas.

Warm regards,
{name}
{title}
{link}`,
    },

    // follow-ups: the scripts from 05 + 10 (day 4, then day 10 with one concept)
    {
      id: 'followup', group: 'follow', name: 'day 4 · follow-up',
      text: `Hi {contact}, just bumping this up in case it got buried. Happy to send a couple of concept ideas if that helps. Thanks!

{name}`,
    },
    {
      id: 'nudge', group: 'follow', name: 'day 10 · last note + one concept',
      text: `Hi {contact}, one last note from me on {idea} for {brand}. Here's one quick concept:

[hook: the first line I'd say on camera]
[what happens in the video, in one or two lines]

If the timing isn't right, no worries at all. I'd love to stay in touch for future campaigns.

{name}`,
    },

    // when they reply
    {
      id: 'rates', group: 'reply', name: 'rate card + concepts',
      text: `Hi {contact},

Thank you so much for getting back to me! 🤍 Here's my rate card:

{ratecard}

And a few concepts for {brand}:
1. {idea}
2. [concept two]
3. [concept three]

So I can put together the right package: how long would you need usage rights for, and what's your timeline?

Warm regards,
{name}`,
    },
    {
      id: 'ispaid', group: 'reply', name: '"is this paid?"',
      text: `Hi {contact}, thanks so much for reaching out! 🤍

Before we go further, is this a paid collaboration? If so, I'd be happy to send my rate card.

{name}`,
    },
    {
      id: 'budget', group: 'reply', name: '"what\'s your budget?"',
      text: `Hi {contact},

Thank you! To make sure I suggest the right package, could you share the budget you have in mind for this campaign? I'll put together options that fit.

{name}`,
    },
    {
      id: 'lowerfee', group: 'reply', name: 'lower fee + commission',
      text: `Hi {contact},

Thanks for being upfront! I can work with a lower fee of ₱[amount] plus [__]% commission on sales from my link or code, for {deliverables} (organic only, no paid-ads usage, link live for 30 days).

Payment terms: 50% upfront, balance after posting. Does that work for you?

{name}`,
    },
    {
      id: 'gifting', group: 'reply', name: 'gifted product only',
      text: `Hi {contact},

Thank you so much for thinking of me! For product-only collabs I can't promise a dedicated video, but I'm happy to try it. If you'd like guaranteed content, I'd be glad to send my rate card. 🤍

{name}`,
    },
    {
      id: 'notnow', group: 'reply', name: 'they said "not now"',
      text: `Hi {contact},

Thanks for letting me know! Would it be okay if I check back in [month or season]? In the meantime, here's a recent video my audience loved: [link]

{name}`,
    },

    // getting paid
    {
      id: 'upfront', group: 'paid', name: '50% upfront + scope',
      text: `Hi {contact},

Great, I'm so excited to work on this! My standard terms are 50% upfront ({upfront}) before production, and the balance when the content goes live. I'll send the invoice today.

To confirm the scope:
• {deliverables}
• posting on [date]
• 1 round of revisions
• organic use only, unless we agree on usage rights

{name}`,
    },
    {
      id: 'overdue', group: 'paid', name: 'invoice reminder',
      text: `Hi {contact},

A friendly reminder that invoice {invoice} for {deliverables} was due on {invoiceDue}, per our agreed terms. Could you please confirm when payment will be processed?

Thank you!
{name}`,
    },
    {
      id: 'form2307', group: 'paid', name: 'ask for BIR 2307',
      text: `Hi {contact},

Payment received, thank you! 🤍 If any tax was withheld on this, could you please send over BIR Form 2307 for my records?

{name}`,
    },

    // tricky inbox
    {
      id: 'bounced', group: 'inbox', name: 'email bounced',
      text: `Hi {brand} team,

I tried reaching your partnerships team, but my email bounced. Could you please pass this to whoever handles creator partnerships?

[paste your original pitch below]

{name}`,
    },
    {
      id: 'ooo', group: 'inbox', name: 'out of office → welcome back',
      text: `Hi {contact},

Welcome back! Following up on my note below about {idea} for {brand}. Happy to share concepts if useful.

{name}`,
    },
    {
      id: 'referred', group: 'inbox', name: 'pointed to someone else',
      text: `Hi {contact},

Your team pointed me to you for creator partnerships! [paste your short pitch]

{name}`,
    },
    {
      id: 'handoff', group: 'inbox', name: 'new contact took over',
      text: `Hi {contact},

Nice to meet you! Quick summary: I make TikToks about {niche} for {audience}. I proposed {idea} for {brand}. Happy to send my rate card and a few concepts.

{name}`,
    },
    {
      id: 'bot', group: 'inbox', name: 'AI assistant / ticket reply',
      text: `Thanks! Could you connect me with someone on the partnerships team, so I can share content ideas and my rate card?

{name}`,
    },

    // after posting
    {
      id: 'thanks', group: 'after', name: 'thank you + next one',
      text: `Hi {contact},

Thanks again for the collab! The {brand} video got [result in words: lots of saves / great questions in the comments]. [link to the video]

I'd love to do a follow-up for [next season or launch]. Happy to send ideas!

{name}`,
    },
  ];

  const TEMPLATE_GROUPS = [
    ['pitch', 'first pitch'],
    ['follow', 'follow-ups'],
    ['reply', 'when they reply'],
    ['paid', 'getting paid'],
    ['inbox', 'tricky inbox'],
    ['after', 'after posting'],
    ['mine', 'your own'],
  ];
  // which message groups to show for each brand stage (the rest sit behind "all messages")
  const STAGE_GROUPS = {
    pitch: ['pitch'],
    pitched: ['follow', 'inbox'],
    talking: ['reply'],
    booked: ['paid'],
    paid: ['paid', 'after'],
    passed: ['reply'],
  };

  // ids used by version 3, replaced by the set above
  const OLD_TEMPLATE_IDS = ['cold', 'dm', 'wrapup'];
  // fingerprints of the version 4 default texts: if yours still match, they get the new wording
  const V4_HASHES = { 'pitch-use': 1875957285, 'pitch-timely': -2027905227, 'pitch-local': -1999510945, followup: 1452465584, nudge: -1622142677, rates: 2018335149, gifting: 1924924245, thanks: -447189505 };
  // fingerprints of the version 5 default texts
  const V5_HASHES = {"pitch-use":1875957285,"pitch-timely":-2027905227,"pitch-local":-462109450,"followup":1452465584,"nudge":596084000,"rates":282200349,"ispaid":-648655016,"budget":-760462033,"lowerfee":1371440376,"gifting":1202687450,"notnow":1379209777,"upfront":-276593713,"overdue":-901830510,"form2307":941225743,"bounced":310512486,"ooo":1415057135,"referred":774673769,"handoff":1464483166,"bot":722925057,"thanks":-2105114670};
  const hashText = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return h; };

  /* ---------- rate card + media kit ---------- */
  const DEFAULT_RATECARD = {
    items: [
      { id: 'video', name: '1 short video (TikTok)', includes: 'script, filming, editing, 1 round of revisions', price: '' },
      { id: 'stories', name: 'story set (3 frames)', includes: 'with link sticker', price: '' },
      { id: 'carousel', name: 'carousel or photo post', includes: 'up to 10 slides', price: '' },
      { id: 'bundle', name: 'bundle', includes: '1 video + 3 stories', price: '' },
    ],
    addons: [
      { id: 'usage', name: 'usage rights (reposts or ads)', includes: 'per 30 days', price: '' },
      { id: 'exclusive', name: 'exclusivity (no competitor deals)', includes: 'per month', price: '' },
      { id: 'revision', name: 'extra revision round', includes: '', price: '' },
      { id: 'rush', name: 'rush (under 5 days)', includes: '', price: '' },
    ],
  };
  const KIT_CHECKS = [
    'my one-line lane is the first thing a brand reads',
    'numbers are current (screenshots from the last 30 days)',
    'every rate says "from ₱…" or shows a range',
    'my contact email works and is on both pages',
    `exported as PDFs: ${PERSONAL.KIT_NAME || 'YourName'}-RateCard.pdf + ${PERSONAL.KIT_NAME || 'YourName'}-MediaKit.pdf`,
  ];
  const KIT_CONTENTS = [
    ['who you are', 'photo, your one-line lane, contact email'],
    ['platforms', 'handles + follower counts'],
    ['audience', 'top cities, age range, gender split (cropped insights)'],
    ['performance', 'average views, saves or engagement on recent posts'],
    ['3 best posts', 'with links'],
    ['past collabs', 'categories only, if a contract keeps names private'],
    ['rates', 'attach your rate card, or "rate card on request"'],
  ];

  /* ---------- playbook (your guides, in short) ---------- */
  const PLAYBOOK_CADENCE = [
    ['day 0', 'send the pitch', 'Tue to Thu, 9 to 11 AM their time'],
    ['day 4', 'first follow-up', 'one line. offer to send concepts'],
    ['day 10', 'last nudge + value', 'one quick concept, then stop'],
    ['they reply', 'send your rate card', 'ranges + 2 to 3 concepts, within 24 hours'],
  ];
  const PLAYBOOK_ANATOMY = [
    ['subject = platform + brand + outcome', '"TikTok videos for [brand]: …" tells them what you sell'],
    ['who you are + proof', 'one line: followers, niche, one credential'],
    ['why now / why them', 'news, a season, a platform update, or how you already use it'],
    ['the ask', 'paid TikToks, tied to their product, in one or two sentences'],
    ['offer the rate card', 'no prices in the first email'],
    ['signature', 'name, title, link to your profile'],
  ];
  const PLAYBOOK_REPLIES = [
    ['"what are your rates?"', 'send your rate card in ranges and ask about usage and timeline', 'rates'],
    ['"what\'s your budget?" / "budget is limited"', 'ask for their budget first, then offer options that fit', 'budget'],
    ['"we only do gifting."', "you can't promise a dedicated video, but offer your rate card for guaranteed content", 'gifting'],
    ['a vague "collab" offer', 'ask if it\'s paid before anything else', 'ispaid'],
  ];
  const PLAYBOOK_SECTIONS = [
    {
      title: 'finding the right contact', open: false,
      items: [
        'a partnerships, creators, affiliates or ambassadors page on their website',
        'a named person in partnerships, influencer marketing or community (search "[brand] partnerships")',
        'their general or support email, with "could you pass this to whoever handles creator partnerships?"',
        'a short DM to the brand account, pointing to your email',
        'one pitch, then one or two polite follow-ups. that\'s it.',
      ],
    },
    {
      title: 'getting paid', open: false,
      items: [
        'pitches never quote a price. offer your rate card and concepts instead.',
        '50% upfront before production, balance when the content goes live (some brands pay 100% upfront).',
        "the upfront has to land before you post anything sponsored.",
        'agree on the scope in writing: number of posts, platforms, posting date, revisions, usage rights, how long links stay up.',
        'international brands: invoice in USD. PH brands: invoice in PHP, bank transfer or e-wallet.',
        'invoices need: invoice #, issue + due date, terms, itemized deliverables, upfront vs balance, your payment details, tax note (EWT) for local clients.',
        'save every receipt and match it to the brand before you post.',
      ],
    },
    {
      title: 'which brands to pitch', open: false,
      items: [
        'strongest: e-commerce platforms and store apps',
        'AI and work-from-home tools',
        'marketing and creator tools',
        'home and solo-living products',
        'lifestyle',
        'skip fintech for now (banks, e-wallets, lending): their exclusivity clauses can block other deals.',
        'only promote what you\'d recommend to a friend. trust is the real asset.',
      ],
    },
    {
      title: 'disclosure', open: false,
      items: [
        'disclose every paid, gifted or affiliate post, at the start, where people see it without tapping "more".',
        'turn on the paid-partnership label, plus a plain note: "#ad", "paid partnership with [brand]", "gifted by [brand]" or "affiliate link".',
        'say it in the video too ("this is sponsored by…"), not only in the caption.',
        'stories: disclose on every frame that shows the product or link.',
        "don't make claims you can't back up (health, income, guaranteed results), even if the brief asks.",
        'check your employer\'s rules before working with a brand in the same industry as your 9-to-5.',
      ],
    },
    {
      title: 'taxes in the PH (starter notes, not tax advice)', open: false,
      items: [
        'content income is taxable business income (RMC No. 97-2021 covers sponsored posts, fees, affiliate commissions and digital products).',
        'gifted products count too, at their fair market value.',
        'with a 9-to-5 + content income, you\'re a mixed-income earner: salary stays on payroll, content is reported as business income.',
        'register with the BIR before you earn regularly, then issue invoices for what you\'re paid.',
        'you may be able to choose the 8% option if you stay under the VAT threshold. it\'s usually picked in your first quarterly return.',
        'local clients may withhold tax (EWT). ask for BIR Form 2307 every time.',
        'keep invoices, receipts, 2307s and expenses from day one. USD income is still declared.',
      ],
      ask: [
        'do I need to register now, or once I earn regularly?',
        'graduated rates or the 8% option: which fits my expected side income?',
        'what do I file monthly, quarterly and yearly?',
        'how do I issue invoices: printed or electronic?',
        'how do I use the 2307s my clients give me?',
      ],
    },
  ];

  /* ---------- weekly batch (3 hours) ---------- */
  const BATCH_BLOCKS = [
    ['plan', 'plan', '30 min', 'pick one topic, write 3 post ideas from it, draft hooks and captions'],
    ['shoot', 'shoot', '60 min', 'record everything in one session: clips, voice-overs, screen recordings, photos'],
    ['edit', 'edit', '60 min', 'edit all posts in one sitting and add captions'],
    ['schedule', 'schedule', '30 min', 'schedule the week, then mark each post ✅ when it goes live'],
  ];
  const SHOOT_CHECKS = [
    "each post's main take + a backup take",
    '2 or 3 different hooks for each post',
    '5 to 10 b-roll clips: desk, hands typing, screen, commute, coffee',
    'screen recordings of any tool or process you mention',
    'a few photos for carousels or thumbnails',
    'one extra "answer a question" clip for later',
  ];

  /* ---------- 6-idea generator ---------- */
  const GEN_ANGLES = [
    ['problems', 'problems', 'what people struggle with'],
    ['howto', 'how-to', 'how to do something'],
    ['tools', 'tools & resources', 'what makes it easier'],
    ['lessons', 'lessons & examples', "what you've learned"],
  ];
  const GEN_STAGES = [
    ['discover', 'discover', 'what should beginners know?'],
    ['learn', 'learn', 'what can I teach them?'],
    ['action', 'take action', 'what can they try today?'],
  ];
  const GEN_PROMPTS = [
    ['why?', 'why does this matter?'],
    ['what?', 'what should someone know?'],
    ['how?', 'how can I teach them to do it?'],
    ['mistakes?', 'what mistakes should they avoid?'],
    ['example?', 'what example or lesson can I share?'],
    ['checklist?', 'what checklist or action step can I give them?'],
  ];

  /* ---------- disclosure on posts ---------- */
  const TODO_LISTS = [
    ['content', '🎬', 'content', '#F7C5DA'],
    ['collabs', '🤝', 'collabs', '#BFD6B6'],
    ['work', '💼', 'work', '#D9CEF3'],
    ['life', '🌷', 'life', '#F4DFA6'],
  ];
  const TODO_LIST = Object.fromEntries(TODO_LISTS.map(([id, icon, label, color]) => [id, { icon, label, color }]));

  const FORMATS = [['video', '📹', 'video'], ['carousel', '🖼️', 'carousel'], ['story', '📱', 'story']];
  const FMT = Object.fromEntries(FORMATS.map(([id, icon, label]) => [id, { icon, label }]));
  const SERIES_SHORT = PERSONAL.SERIES_SHORT || {};
  const seriesShort = name => SERIES_SHORT[name] || name;
  const fmtIcon = (id, size = 12) => svg(ICON['f' + (FMT[id] ? id : 'video')], size);
  // one soft colour per series, so you can tell them apart at a glance on the calendar
  const SERIES_COLORS = PERSONAL.SERIES_COLORS || {};
  const EXTRA_COLORS = ['#F7C5DA', '#BFD6B6', '#F4DFA6', '#D9CEF3', '#BFDCE8', '#F2CDB8'];
  function seriesColor(name) {
    if (!name) return 'var(--line-2)';
    if (SERIES_COLORS[name]) return SERIES_COLORS[name];
    const extras = state.pillars.filter(p => !SERIES_COLORS[p]);
    const i = extras.indexOf(name);
    return EXTRA_COLORS[(i < 0 ? 0 : i) % EXTRA_COLORS.length];
  }

  const SPONSOR_TYPES = [['', 'not sponsored'], ['paid', 'paid'], ['gifted', 'gifted'], ['affiliate', 'affiliate']];
  const DISCLOSE_ITEMS = [
    ['label', 'paid-partnership label turned on'],
    ['said', 'said it in the video ("this is sponsored by…")'],
    ['caption', '#ad / gifted / affiliate note at the start of the caption'],
  ];

  const OLD_DEFAULT_PITCH = PERSONAL.OLD_DEFAULT_PITCH || '';

  /* ================= statuses ================= */

  const STATUSES = [
    { id: 'idea', emoji: '💡', label: 'idea' },
    { id: 'scripted', emoji: '✍️', label: 'scripted' },
    { id: 'filmed', emoji: '🎬', label: 'filmed' },
    { id: 'posted', emoji: '✅', label: 'posted' },
  ];
  const S = Object.fromEntries(STATUSES.map(s => [s.id, s]));
  const NEXT = { idea: 'scripted', scripted: 'filmed', filmed: 'posted' };

  const CSTATUSES = [
    { id: 'pitch', emoji: '🎯', label: 'to pitch' },
    { id: 'pitched', emoji: '📨', label: 'pitched' },
    { id: 'talking', emoji: '💬', label: 'talking' },
    { id: 'booked', emoji: '🤝', label: 'booked' },
    { id: 'paid', emoji: '💸', label: 'paid' },
    { id: 'passed', emoji: '🌙', label: 'not now' },
  ];
  const CS = Object.fromEntries(CSTATUSES.map(s => [s.id, s]));
  const CNEXT = { pitch: 'pitched', pitched: 'talking', talking: 'booked', booked: 'paid' };
  const DEAL_TYPES = ['paid', 'gifted', 'affiliate', 'ugc', 'event'];

  const EMPTY_COL = {
    idea: 'type an idea up top ↑',
    scripted: 'nothing scripted yet',
    filmed: 'nothing filmed yet',
    posted: 'your posted videos land here',
  };
  const IDEA_COL_LIMIT = 6;

  const ICON = {
    todos: '<rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><path d="M8 12.3l2.8 2.8L16.2 9.5"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
    dots: '<circle cx="5.5" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="18.5" cy="12" r="1.3" fill="currentColor" stroke="none"/>',
    pencil: '<path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17z"/><path d="M14 7l3 3"/>',
    fvideo: '<rect x="3" y="5" width="18" height="14" rx="3.5"/><path d="M10.5 9.5v5l4-2.5z"/>',
    fcarousel: '<rect x="7" y="4" width="10" height="16" rx="2"/><path d="M3.5 7v10M20.5 7v10"/>',
    fstory: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.5"/>',
    calplus: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4M12 13v5M9.5 15.5h5"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    home: '<path d="M4 11 12 4.5l8 6.5v8.5a1.5 1.5 0 0 1-1.5 1.5H15v-6H9v6H5.5A1.5 1.5 0 0 1 4 19.5z"/>',
    board: '<rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="10" y="4" width="5" height="11" rx="1.5"/><rect x="17" y="4" width="4" height="7" rx="1.5"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    ideas: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/>',
    collabs: '<rect x="3" y="7" width="18" height="13" rx="3"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 12.5h18"/>',
    lines: '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H9l-5 4z"/>',
  };
  const svg = (paths, size = 18) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  const NAV = [
    ['home', 'home'], ['todos', 'to-dos'], ['board', 'board'], ['calendar', 'calendar'], ['ideas', 'ideas'], ['collabs', 'collabs'], ['lines', 'lines'],
  ];

  /* ================= helpers ================= */
  const $ = (s, r = document) => r.querySelector(s);
  const pad = n => String(n).padStart(2, '0');
  const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseYmd = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const todayStr = () => ymd(new Date());
  const addDays = (s, n) => { const d = parseYmd(s); d.setDate(d.getDate() + n); return ymd(d); };
  const weekStart = s => { const d = parseYmd(s); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return ymd(d); }; // monday
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const isDate = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
  const clampGoal = n => Math.min(14, Math.max(1, Number.parseInt(n, 10) || 3));
  const peso = n => '₱' + Math.round(n).toLocaleString('en-US');
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
  const maxDate = (a, b) => (a > b ? a : b);

  function fmtDate(s, rel = true) {
    if (!s) return '';
    const t = todayStr();
    if (rel && s === t) return 'today';
    if (rel && s === addDays(t, 1)) return 'tomorrow';
    if (rel && s === addDays(t, -1)) return 'yesterday';
    const d = parseYmd(s);
    const opts = { month: 'short', day: 'numeric' };
    if (d.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric';
    return d.toLocaleDateString('en-US', opts).toLowerCase();
  }

  function copyText(text) {
    const fallback = () => {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { /* ignore */ }
      ta.remove();
      return ok;
    };
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text).then(() => true, () => fallback());
    return Promise.resolve(fallback());
  }

  const viewHead = (title, sub, right = '') =>
    `<div class="view-head"><div><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div>${right}</div>`;

  /* ================= data ================= */
  function mk(p = {}) {
    const now = new Date().toISOString();
    const post = {
      id: uid(), title: '', pillar: '', insteadOf: '', tryAngle: '', outline: '', hook: '', script: '',
      date: '', status: 'idea', notes: '', postedAt: '', isExample: false,
      sponsor: '', brand: '', disclosed: {}, format: 'video',
      createdAt: now, updatedAt: now,
      ...p,
    };
    if (!S[post.status]) post.status = 'idea';
    if (!isDate(post.date)) post.date = '';
    if (!isDate(post.postedAt)) post.postedAt = '';
    ['title', 'pillar', 'insteadOf', 'tryAngle', 'outline', 'hook', 'script', 'notes'].forEach(k => {
      post[k] = post[k] == null ? '' : String(post[k]);
    });
    if (!SPONSOR_TYPES.some(([v]) => v === post.sponsor)) post.sponsor = '';
    if (!FMT[post.format]) post.format = 'video';
    post.brand = post.brand == null ? '' : String(post.brand);
    const dsc = post.disclosed && typeof post.disclosed === 'object' ? post.disclosed : {};
    post.disclosed = Object.fromEntries(DISCLOSE_ITEMS.map(([k]) => [k, !!dsc[k]]));
    return post;
  }

  function mkCollab(c = {}) {
    const now = new Date().toISOString();
    const col = {
      id: uid(), brand: '', status: 'pitch', type: 'paid', series: '', product: '', hook: '', why: '',
      contactName: '', contact: '', amount: '', deliverables: '',
      followUp: '', followStep: 0, due: '', notes: '', pitchedAt: '', paidAt: '',
      terms: '50-50', invoiceNo: '', invoiceDue: '', upfrontAt: '', balanceAt: '',
      ph: false, got2307: false, foundVia: '', postId: '',
      createdAt: now, updatedAt: now,
      ...c,
    };
    if (!CS[col.status]) col.status = 'pitch';
    ['followUp', 'due', 'pitchedAt', 'paidAt', 'invoiceDue', 'upfrontAt', 'balanceAt'].forEach(k => { if (!isDate(col[k])) col[k] = ''; });
    ['brand', 'type', 'series', 'product', 'hook', 'why', 'contactName', 'contact', 'amount', 'deliverables', 'notes', 'invoiceNo', 'foundVia', 'postId'].forEach(k => {
      col[k] = col[k] == null ? '' : String(col[k]);
    });
    col.followStep = Math.min(2, Math.max(0, Number(col.followStep) || 0));
    col.terms = col.terms === 'full' ? 'full' : '50-50';
    col.ph = !!col.ph;
    col.got2307 = !!col.got2307;
    return col;
  }

  function bankPosts() {
    const base = Date.now();
    return CONTENT_BANK.map(([si, title, outline], i) => mk({
      title, outline, pillar: SERIES[si].name,
      createdAt: new Date(base - i * 1000).toISOString(),
    }));
  }

  function normalizeLines(l) {
    const out = {};
    LINE_CATS.forEach(c => {
      out[c.id] = l && Array.isArray(l[c.id]) ? l[c.id].map(String).filter(x => x.trim()) : [...DEFAULT_LINES[c.id]];
    });
    return out;
  }

  const freshTemplates = () => DEFAULT_TEMPLATES.map(t => ({ ...t }));

  function normalizeTemplates(d, ver) {
    if (Array.isArray(d.templates) && d.templates.length) {
      let list = d.templates.filter(t => t && typeof t.text === 'string')
        .map(t => ({ id: String(t.id || uid()), group: String(t.group || 'mine'), name: String(t.name || 'template'), text: t.text }));
      if (ver < 4) {
        list = [...freshTemplates(), ...list.filter(t => !OLD_TEMPLATE_IDS.includes(t.id) && !DEFAULT_TEMPLATES.some(x => x.id === t.id)).map(t => ({ ...t, group: 'mine' }))];
      } else if (ver < 6) {
        // refresh the defaults you haven't edited, keep the ones you have, add the new ones
        list = list.map(t => {
          const def = DEFAULT_TEMPLATES.find(x => x.id === t.id);
          if (!def) return t;
          const h = hashText(t.text);
          return V4_HASHES[t.id] === h || V5_HASHES[t.id] === h ? { ...def } : { ...t, group: def.group };
        });
        DEFAULT_TEMPLATES.forEach(def => { if (!list.some(t => t.id === def.id)) list.push({ ...def }); });
        const order = id => { const i = DEFAULT_TEMPLATES.findIndex(x => x.id === id); return i < 0 ? 999 : i; };
        list.sort((a, b) => order(a.id) - order(b.id));
      }
      return list;
    }
    const list = freshTemplates();
    if (typeof d.pitchTemplate === 'string' && d.pitchTemplate.trim() && d.pitchTemplate !== OLD_DEFAULT_PITCH) {
      list.push({ id: 'mine', group: 'mine', name: 'my old pitch', text: d.pitchTemplate });
    }
    return list;
  }

  const defaultMotivations = () => DEFAULT_MOTIVATIONS.map(([emoji, text], i) => ({ id: 'm' + i, emoji, text }));

  function mkTodo(t = {}) {
    const now = new Date().toISOString();
    const todo = { id: uid(), title: '', done: false, doneAt: '', due: '', star: false, list: '', repeat: '', notes: '', createdAt: now, ...t };
    todo.title = String(todo.title || '');
    todo.notes = String(todo.notes || '');
    todo.done = !!todo.done;
    todo.star = !!todo.star;
    if (!isDate(todo.due)) todo.due = '';
    if (!TODO_LIST[todo.list]) todo.list = '';
    if (!['', 'daily', 'weekly', 'monthly'].includes(todo.repeat)) todo.repeat = '';
    if (typeof todo.doneAt !== 'string') todo.doneAt = '';
    return todo;
  }
  const starterTodos = () => {
    const t = todayStr();
    return [
      mkTodo({ title: 'fill in my kit: handle, followers, job + rate card', list: 'collabs', due: t, star: true }),
      mkTodo({ title: "plan this week's batch (about 3 hours)", list: 'content', due: t }),
      mkTodo({ title: 'pick 3 dream brands to pitch', list: 'collabs', due: addDays(t, 1) }),
      mkTodo({ title: 'post 1 video', list: 'content', due: addDays(t, 1), repeat: 'daily' }),
      mkTodo({ title: 'back up my calendar (⋯ → export)', list: 'life' }),
    ];
  };

  function normalizeRateCard(r) {
    const pick = (defs, saved) => defs.map(d => {
      const s = Array.isArray(saved) ? saved.find(x => x && x.id === d.id) : null;
      return { ...d, price: s && s.price != null ? String(s.price) : '', includes: s && s.includes != null ? String(s.includes) : d.includes };
    });
    return { items: pick(DEFAULT_RATECARD.items, r && r.items), addons: pick(DEFAULT_RATECARD.addons, r && r.addons) };
  }

  function normalizeProfile(p) {
    const out = { ...DEFAULT_PROFILE };
    if (p && typeof p === 'object') Object.keys(out).forEach(k => { if (p[k] != null) out[k] = String(p[k]); });
    return out;
  }

  function freshState() {
    return {
      version: VERSION, posts: bankPosts(), pillars: [...DEFAULT_SERIES], taglines: { ...DEFAULT_TAGLINES },
      weeklyGoal: 3, lastExport: '', collabs: [], lines: normalizeLines(null),
      templates: freshTemplates(), incomeGoal: 0, profile: normalizeProfile(null),
      rateCard: normalizeRateCard(null), kitChecks: {}, batch: {},
      motivations: defaultMotivations(),
      todos: starterTodos(),
    };
  }

  function normalize(d) {
    if (!d || !Array.isArray(d.posts)) throw new Error("this doesn't look like a content calendar backup");
    const ver = Number(d.version) || 1;
    let posts = d.posts.filter(p => p && typeof p === 'object').map(p => mk({ ...p, id: p.id || uid() }));
    let pillars = Array.isArray(d.pillars) && d.pillars.length ? d.pillars.map(String).filter(Boolean) : [...DEFAULT_SERIES];

    if (ver < 2) {
      // upgrade from the first version: swap the old pillars for your series and load the content bank
      posts = posts.filter(p => !p.isExample);
      const wasDefault = pillars.length === OLD_PILLARS.length && OLD_PILLARS.every(x => pillars.includes(x));
      pillars = [...DEFAULT_SERIES, ...(wasDefault ? [] : pillars.filter(x => !DEFAULT_SERIES.includes(x)))];
      const have = new Set(posts.map(p => p.title.trim().toLowerCase()));
      posts = posts.concat(bankPosts().filter(p => !have.has(p.title.trim().toLowerCase())));
    }
    posts.forEach(p => { if (p.pillar && !pillars.some(x => x.toLowerCase() === p.pillar.toLowerCase())) pillars.push(p.pillar); });

    return {
      version: VERSION,
      posts,
      pillars,
      taglines: { ...DEFAULT_TAGLINES, ...(d.taglines && typeof d.taglines === 'object' ? d.taglines : {}) },
      weeklyGoal: clampGoal(d.weeklyGoal),
      lastExport: typeof d.lastExport === 'string' ? d.lastExport : '',
      collabs: Array.isArray(d.collabs) ? d.collabs.filter(c => c && typeof c === 'object').map(c => {
        const col = mkCollab({ ...c, id: c.id || uid() });
        // older versions only knew "paid": treat those as paid in full on the day they were marked
        if (ver < 5 && col.status === 'paid' && !col.upfrontAt) { col.terms = 'full'; col.upfrontAt = col.paidAt; }
        return col;
      }) : [],
      lines: normalizeLines(d.lines),
      templates: normalizeTemplates(d, ver),
      incomeGoal: Math.max(0, Number(d.incomeGoal) || 0),
      profile: normalizeProfile(d.profile),
      rateCard: normalizeRateCard(d.rateCard),
      kitChecks: d.kitChecks && typeof d.kitChecks === 'object' ? { ...d.kitChecks } : {},
      batch: d.batch && typeof d.batch === 'object' ? d.batch : {},
      motivations: Array.isArray(d.motivations)
        ? d.motivations.filter(m => m && m.text).map(m => ({ id: String(m.id || uid()), emoji: String(m.emoji || ''), text: String(m.text) }))
        : defaultMotivations(),
      todos: Array.isArray(d.todos) ? d.todos.filter(t => t && t.title).map(t => mkTodo({ ...t, id: String(t.id || uid()) })) : starterTodos(),
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return normalize(JSON.parse(raw));
    } catch (e) { console.warn('could not read saved data', e); }
    return freshState();
  }

  let state = load();
  let storageOk = true;

  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      localStorage.setItem(KEY + ':editedAt', String(Date.now()));
      storageOk = true;
    } catch (e) {
      if (storageOk && !cloud.on) toast("couldn't save in this browser. export a backup!");
      storageOk = false;
    }
    queueCloudSave();
  }

  /* ================= sync across devices =================
     When this page runs as the published claude.ai version, everything is also saved to a private
     spot on your account (data/users/<you>/…, readable only by you) and kept in sync live.
     Opened as a plain local file, it stays offline-only, exactly as before. */
  const cloud = { on: false, ready: false, db: null, base: '', rev: '', json: '', writing: false, again: false, timer: null, status: 'local' };
  const PART_SIZE = 60000; // characters per stored piece (each piece stays well under the 256 KiB limit)

  function setSync(status) {
    cloud.status = status;
    const b = document.getElementById('sync-badge');
    if (!b) return;
    const map = {
      connecting: ['syncing…', 'busy'],
      saving: ['saving…', 'busy'],
      synced: ['synced', 'ok'],
      offline: ["offline · saved on this device", 'warn'],
      error: ["couldn't sync · saved on this device", 'warn'],
      full: ['sync storage is full', 'warn'],
    };
    const [label, cls] = map[status] || ['', ''];
    b.hidden = !cloud.on;
    b.className = 'sync-badge ' + cls;
    b.title = label;
    b.querySelector('span').textContent = label;
    const note = document.getElementById('sync-note');
    if (note) note.textContent = cloud.on ? `☁︎ ${label}. your phone and laptop share this calendar.` : 'saved in this browser only (open your claude.ai link to sync devices)';
  }

  function queueCloudSave() {
    if (!cloud.on || !cloud.ready) return;
    clearTimeout(cloud.timer);
    cloud.timer = setTimeout(pushCloud, 900);
  }

  async function pushCloud() {
    if (!cloud.on || !cloud.ready) return;
    if (cloud.writing) { cloud.again = true; return; }
    const json = JSON.stringify(state);
    if (json === cloud.json) { setSync('synced'); return; }
    cloud.writing = true;
    setSync('saving');
    const rev = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const parts = [];
    for (let i = 0; i < json.length; i += PART_SIZE) parts.push(json.slice(i, i + PART_SIZE));
    try {
      for (let i = 0; i < parts.length; i++) await cloud.db.doc(`${cloud.base}/part-${i}`).set({ s: parts[i], rev });
      await cloud.db.doc(`${cloud.base}/sync`).set({ parts: parts.length, rev, savedAt: Date.now() });
      cloud.json = json;
      cloud.rev = rev;
      localStorage.setItem(KEY + ':syncedAt', String(Date.now()));
      setSync('synced');
    } catch (err) {
      setSync(err && err.code === 'quota_exceeded' ? 'full' : 'error');
      if (err && err.code === 'unavailable') setTimeout(() => { cloud.again = true; }, 1500);
    } finally {
      cloud.writing = false;
      if (cloud.again) { cloud.again = false; queueCloudSave(); }
    }
  }

  async function readCloud(manifest) {
    const n = Number(manifest.parts) || 0;
    const snaps = await Promise.all(Array.from({ length: n }, (_, i) => cloud.db.doc(`${cloud.base}/part-${i}`).get()));
    if (snaps.some(s => !s.exists || s.data().rev !== manifest.rev)) return null; // another device is mid-save
    return snaps.map(s => s.data().s).join('');
  }

  function applyRemoteState(json) {
    let next;
    try { next = normalize(JSON.parse(json)); } catch (e) { return; }
    state = next;
    cloud.json = JSON.stringify(state);
    try { localStorage.setItem(KEY, cloud.json); } catch (e) { /* ignore */ }
    if (openId) { const p = find(openId); if (p) fillPanel(p); else closePanel(); }
    if (openCid) { const c = findC(openCid); if (c) fillCPanel(c); else closeCollab(); }
    const ta = document.getElementById('tpl-text');
    if (ta && document.activeElement !== ta) ta.blur();
    renderAll();
  }

  async function startCloud() {
    if (!window.claude || typeof window.claude.use !== 'function') return; // plain local file: offline mode
    let db = null, user = null;
    try { [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]); } catch (e) { /* ignore */ }
    const id = user ? await user.id().catch(() => null) : null;
    if (!db || !id) return; // signed out or not available: keep working on this device
    cloud.on = true;
    cloud.db = db;
    cloud.base = `data/users/${id}`;
    setSync('connecting');
    document.body.classList.add('syncing-start');
    const giveUp = setTimeout(() => {
      document.body.classList.remove('syncing-start');
      if (!cloud.ready) { cloud.ready = true; setSync('offline'); }
    }, 10000);
    let first = true;
    db.doc(`${cloud.base}/sync`).onSnapshot(async snap => {
      if (snap.metadata.hasPendingWrites) return;
      const m = snap.exists ? snap.data() : null;
      if (first && snap.metadata.fromCache && !m) return; // wait for the store's real answer
      const wasFirst = first;
      first = false;
      clearTimeout(giveUp);
      document.body.classList.remove('syncing-start');
      if (!m || !m.parts) {
        // nothing in the cloud yet: this device's calendar becomes the synced one
        cloud.ready = true;
        pushCloud();
        return;
      }
      if (m.rev === cloud.rev) { cloud.ready = true; setSync('synced'); return; }
      // edits made here while we couldn't reach the cloud, newer than the cloud copy, win
      const editedAt = Number(localStorage.getItem(KEY + ':editedAt')) || 0;
      const syncedAt = Number(localStorage.getItem(KEY + ':syncedAt')) || 0;
      if (cloud.ready && editedAt > syncedAt && editedAt > (m.savedAt || 0)) { pushCloud(); return; }
      let json = await readCloud(m).catch(() => null);
      if (json == null) { await new Promise(r => setTimeout(r, 1200)); json = await readCloud(m).catch(() => null); }
      if (json == null) { cloud.ready = true; return; }
      cloud.rev = m.rev;
      cloud.ready = true;
      if (json !== JSON.stringify(state)) applyRemoteState(json);
      else cloud.json = json;
      localStorage.setItem(KEY + ':syncedAt', String(Date.now()));
      setSync('synced');
      if (wasFirst) renderAll();
    }, err => {
      clearTimeout(giveUp);
      document.body.classList.remove('syncing-start');
      cloud.ready = true;
      setSync(err && err.code === 'revoked' ? 'error' : 'offline');
    });
  }
  persist();

  const find = id => state.posts.find(p => p.id === id);
  const findC = id => state.collabs.find(c => c.id === id);
  const touch = p => { p.updatedAt = new Date().toISOString(); };

  /* ================= ui state ================= */
  const VIEWS = NAV.map(n => n[0]);
  let view = 'home'; // the app always opens on your homepage
  let calMonth = todayStr().slice(0, 7);
  let openId = null, openCid = null;
  let helperId = null, helperPage = 0;
  let ideaQuery = '', ideaPillar = 'all';
  let lineTarget = 'script', drawerCat = 'transitions';
  let collabFilter = 'active', collabTab = 'pipeline', tplId = DEFAULT_TEMPLATES[0].id;
  let showAllTpls = false;
  let editingMot = null, motMenu = null, whyEdit = false;
  let hypeSeed = Math.floor(Math.random() * 1e6);
  let genSeries = '', genAngle = 'howto', genStage = 'learn', batchSeries = '';

  /* ================= in-app dialog ================= */
  function ask({ title, body = '', ok = 'ok', cancel = 'cancel', danger = false, input = null }) {
    return new Promise(resolve => {
      const wrap = $('#ask');
      $('#ask-title').textContent = title;
      $('#ask-body').textContent = body;
      $('#ask-body').hidden = !body;
      const inp = $('#ask-input');
      inp.hidden = !input;
      inp.value = input && input.value ? input.value : '';
      inp.placeholder = input && input.placeholder ? input.placeholder : '';
      const okBtn = $('#ask-ok'), cancelBtn = $('#ask-cancel');
      okBtn.textContent = ok;
      okBtn.classList.toggle('danger-fill', danger);
      cancelBtn.textContent = cancel;
      cancelBtn.hidden = !cancel;
      wrap.hidden = false;
      setTimeout(() => (input ? inp : okBtn).focus(), 30);
      const done = val => {
        wrap.hidden = true;
        okBtn.onclick = cancelBtn.onclick = wrap.onclick = inp.onkeydown = null;
        document.removeEventListener('keydown', onKey, true);
        resolve(val);
      };
      const onKey = e => {
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); done(input ? null : false); }
        if (e.key === 'Enter' && (input || document.activeElement === okBtn)) { e.preventDefault(); done(input ? inp.value.trim() : true); }
      };
      document.addEventListener('keydown', onKey, true);
      okBtn.onclick = () => done(input ? inp.value.trim() : true);
      cancelBtn.onclick = () => done(input ? null : false);
      wrap.onclick = e => { if (e.target === wrap) done(input ? null : false); };
    });
  }

  /* ================= toast ================= */
  let toastTimer;
  function toast(msg, action) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.toggle('has-action', !!action);
    if (action) {
      const b = document.createElement('button');
      b.textContent = action.label;
      b.addEventListener('click', () => { action.fn(); t.classList.remove('show', 'has-action'); });
      t.appendChild(b);
    }
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show', 'has-action'), action ? 6000 : 2600);
  }

  /* ================= post status ================= */
  function postedThisWeek() {
    const w = weekStart(todayStr());
    return state.posts.filter(p => p.status === 'posted' && p.postedAt && weekStart(p.postedAt) === w).length;
  }

  function setStatus(p, s) {
    if (!p || !S[s] || p.status === s) return;
    const before = postedThisWeek();
    p.status = s;
    if (s === 'posted') {
      if (!p.postedAt) p.postedAt = todayStr();
      if (!p.date) p.date = p.postedAt;
    } else {
      p.postedAt = '';
    }
    p.isExample = false;
    touch(p);
    persist();
    renderAll();
    if (openId === p.id) fillPanel(p);
    if (s === 'posted') {
      confetti();
      const after = postedThisWeek();
      if (before < state.weeklyGoal && after >= state.weeklyGoal) toast('weekly goal hit 🎉 so proud of you');
      else toast(`posted ✅ stamped ${fmtDate(p.postedAt)}`);
    } else {
      toast(`moved to ${S[s].emoji} ${S[s].label}`);
    }
  }
  function advance(id) {
    const p = find(id);
    if (p && NEXT[p.status]) setStatus(p, NEXT[p.status]);
  }

  /* ================= collab status + follow-up plan ================= */
  const followUpDue = c => c.followUp && c.followUp <= todayStr() && (c.status === 'pitched' || c.status === 'talking');

  /* payments: 50% upfront before production, balance when it goes live (or 100% upfront) */
  const amountOf = c => Number(c.amount) || 0;
  const upfrontAmt = c => (c.terms === 'full' ? amountOf(c) : amountOf(c) / 2);
  function payments(c) {
    const a = amountOf(c);
    if (!a) return [];
    if (c.terms === 'full') return c.upfrontAt ? [{ date: c.upfrontAt, amt: a }] : [];
    const out = [];
    if (c.upfrontAt) out.push({ date: c.upfrontAt, amt: a / 2 });
    if (c.balanceAt) out.push({ date: c.balanceAt, amt: a / 2 });
    return out;
  }
  const received = c => payments(c).reduce((s, p) => s + p.amt, 0);
  const fullyPaid = c => (c.terms === 'full' ? !!c.upfrontAt : !!(c.upfrontAt && c.balanceAt));
  const invoiceOverdue = c => !!c.invoiceDue && c.invoiceDue < todayStr() && !fullyPaid(c) && (c.status === 'booked' || c.status === 'paid');
  const needs2307 = c => c.ph && !c.got2307 && !!c.upfrontAt;
  const linkedPost = c => (c.postId ? find(c.postId) : null);

  function markPayment(c, which) {
    if (!c) return;
    const key = which === 'balance' ? 'balanceAt' : 'upfrontAt';
    c[key] = c[key] ? '' : todayStr();
    touch(c);
    if (fullyPaid(c) && c.status !== 'paid') { persist(); setCStatus(c, 'paid'); return; }
    if (!fullyPaid(c) && c.status === 'paid') c.status = 'booked';
    persist();
    renderAll();
    if (openCid === c.id) fillCPanel(c);
    if (c[key]) toast(which === 'balance' ? 'balance received 💸' : "upfront received 💸 you're clear to post");
  }

  function collabToPost(c) {
    if (!c) return;
    const existing = linkedPost(c);
    if (existing) { openPanel(existing.id); return; }
    const p = mk({
      title: `${c.brand}: ${c.why.trim() || 'sponsored video'}`,
      pillar: c.series,
      sponsor: c.type === 'gifted' ? 'gifted' : c.type === 'affiliate' ? 'affiliate' : 'paid',
      brand: c.brand,
      date: c.due,
      outline: c.deliverables,
    });
    state.posts.unshift(p);
    c.postId = p.id;
    touch(c);
    persist();
    toast('added to your board + calendar 🎬');
    openPanel(p.id);
  }

  function setCStatus(c, s) {
    if (!c || !CS[s] || c.status === s) return;
    const t = todayStr();
    c.status = s;
    let msg = `moved to ${CS[s].emoji} ${CS[s].label}`;
    if (s === 'pitch') { c.pitchedAt = ''; c.followStep = 0; c.followUp = ''; }
    if (s === 'pitched') {
      if (!c.pitchedAt) c.pitchedAt = t;
      if (c.followStep < 2 && (!c.followUp || c.followUp < t)) {
        c.followUp = maxDate(addDays(c.pitchedAt, c.followStep === 0 ? 4 : 10), t);
      }
      msg = `pitched 📨 follow-up on ${fmtDate(c.followUp)}`;
    }
    if (s === 'talking') { c.followUp = ''; msg = 'they replied! 💬 send your rate card within 24 hours'; }
    if (s === 'booked' || s === 'passed') c.followUp = '';
    if (s === 'paid') {
      c.followUp = '';
      if (!c.paidAt) c.paidAt = t;
      if (!c.upfrontAt) c.upfrontAt = t;
      if (c.terms !== 'full' && !c.balanceAt) c.balanceAt = t;
      const n = amountOf(c);
      msg = n ? `💸 paid in full! ${peso(n)} from ${c.brand}` : '💸 paid! a little win for the week';
      confetti();
      if (c.ph && !c.got2307) msg += ' · ask for BIR 2307';
    } else {
      c.paidAt = '';
    }
    touch(c);
    persist();
    renderAll();
    if (openCid === c.id) fillCPanel(c);
    toast(msg);
  }
  function cadvance(id) {
    const c = findC(id);
    if (c && CNEXT[c.status]) setCStatus(c, CNEXT[c.status]);
  }

  function markFollowSent(c) {
    if (!c) return;
    const t = todayStr();
    if (c.followStep === 0) {
      c.followStep = 1;
      c.followUp = maxDate(addDays(c.pitchedAt || t, 10), addDays(t, 3));
      toast(`follow-up sent ✓ last nudge on ${fmtDate(c.followUp)}`);
    } else {
      c.followStep = 2;
      c.followUp = '';
      toast("last nudge sent ✓ if they don't reply, let it go 🌙");
    }
    touch(c);
    persist();
    renderAll();
    if (openCid === c.id) fillCPanel(c);
  }

  function suggestTpl(c) {
    if (c.status === 'pitch') return 'pitch-use';
    if (c.status === 'pitched') return c.followStep === 0 ? 'followup' : c.followStep === 1 ? 'nudge' : '';
    if (c.status === 'talking') return 'rates';
    if (c.status === 'booked') return !c.upfrontAt ? 'upfront' : invoiceOverdue(c) ? 'overdue' : '';
    if (c.status === 'paid') return needs2307(c) ? 'form2307' : 'thanks';
    if (c.status === 'passed') return 'notnow';
    return '';
  }

  /* ================= header: week pill, menu, nudge ================= */
  function weekCounts() {
    const m = {};
    state.posts.forEach(p => {
      if (p.status === 'posted' && p.postedAt) { const w = weekStart(p.postedAt); m[w] = (m[w] || 0) + 1; }
    });
    return m;
  }

  function streakWeeks(counts) {
    const g = state.weeklyGoal;
    let w = weekStart(todayStr()), s = 0;
    if ((counts[w] || 0) < g) w = addDays(w, -7);
    while ((counts[w] || 0) >= g) { s++; w = addDays(w, -7); }
    return s;
  }

  function renderWeek() {
    const counts = weekCounts();
    const n = counts[weekStart(todayStr())] || 0;
    const g = state.weeklyGoal;
    let dots = '';
    for (let i = 0; i < Math.max(g, n); i++) dots += `<span class="dot ${i < n ? 'on' : ''}"></span>`;
    $('#week-dots').innerHTML = dots;
    $('#week-count').textContent = `${n}/${g}`;
    const s = streakWeeks(counts);
    const st = $('#streak');
    st.textContent = s ? `🔥 ${s}` : '';
    st.hidden = !s;
    $('#week-pill').title = `${n} of ${g} posted this week${s ? ` · ${s}-week streak` : ''}`;
    $('#today-label').textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toLowerCase();

    // menu details
    $('#goal-val').textContent = g;
    $('#menu-week').textContent = n >= g ? `${n} of ${g} posted this week · goal hit 🎉` : `${n} of ${g} posted this week`;
    $('#menu-streak').textContent = s ? `🔥 ${s}-week streak. keep it going!` : 'your streak starts the first week you hit your goal';
  }

  function backupText() {
    if (!state.lastExport) return { text: 'no backup yet', days: Infinity };
    const days = Math.floor((Date.now() - new Date(state.lastExport).getTime()) / 864e5);
    return { text: days <= 0 ? 'last backup today' : days === 1 ? 'last backup yesterday' : `last backup ${days} days ago`, days };
  }

  function renderMenu() {
    const b = backupText();
    $('#backup-note').textContent = `${b.text} · ${plural(state.posts.length, 'post')}, ${plural(state.collabs.length, 'collab')}, ${plural(state.todos.length, 'to-do')}`;
    setSync(cloud.status);
  }

  function renderNudge() {
    const c = { idea: 0, scripted: 0, filmed: 0, posted: 0 };
    state.posts.forEach(p => c[p.status]++);
    const n = postedThisWeek(), g = state.weeklyGoal;
    const dow = (new Date().getDay() + 6) % 7;
    const t = todayStr();
    // on the collabs tab, "next up" already covers brand to-dos
    const onCollabs = view === 'collabs';
    const fu = onCollabs ? [] : state.collabs.filter(followUpDue);
    const replied = onCollabs ? [] : state.collabs.filter(x => x.status === 'talking' && !Number(x.amount));
    const dueSoon = onCollabs ? [] : state.collabs.filter(x => x.status === 'booked' && x.due && x.due <= addDays(t, 3));
    const touched = state.collabs.length + c.scripted + c.filmed + c.posted;
    const b = backupText();
    let msg = '', btn = '';
    if (fu.length) { msg = fu.length === 1 ? `time to follow up with <b>${esc(fu[0].brand)}</b> 💌` : `<b>${fu.length} brand follow-ups</b> are due 💌`; btn = '<button class="chip" data-view="collabs">open collabs</button>'; }
    else if (replied.length) { msg = `<b>${esc(replied[0].brand)}</b> replied! send your rate card within 24 hours 💬`; btn = `<button class="chip" data-open-collab="${replied[0].id}">open</button>`; }
    else if (dueSoon.length) { msg = `<b>${esc(dueSoon[0].brand)}</b> content is due ${fmtDate(dueSoon[0].due)} 🤝`; btn = `<button class="chip" data-open-collab="${dueSoon[0].id}">open</button>`; }
    else if (view !== 'todos' && state.todos.some(x => !x.done && x.due && x.due < t)) {
      const n2 = state.todos.filter(x => !x.done && x.due && x.due < t).length;
      msg = `<b>${plural(n2, 'to-do')}</b> ${n2 === 1 ? 'is' : 'are'} overdue. you've got this 💪`;
      btn = '<button class="chip" data-view="todos">see to-dos</button>';
    }
    else if (c.filmed >= 3) msg = `you have <b>${c.filmed} filmed posts</b> ready to go up ✅`;
    else if (c.scripted >= 3) msg = `you have <b>${c.scripted} scripted posts</b> waiting to be filmed 🎬`;
    else if (n < g && dow >= 3 && c.filmed > 0) msg = `<b>${g - n} more</b> to hit this week's goal, and you already have ${c.filmed} filmed 🎬`;
    else if (!cloud.on && ((b.days === Infinity && touched >= 5) || (b.days !== Infinity && b.days >= 14 && touched))) { msg = `${b.text}. a quick export keeps everything safe 💾`; btn = '<button class="chip" data-export>export</button>'; }
    else if (c.scripted === 0 && c.filmed === 0 && c.idea > 0) { msg = `<b>${plural(c.idea, 'idea')}</b> waiting in the bank. pick one to script ✍️`; btn = '<button class="chip" data-view="ideas">pick one</button>'; }
    const el = $('#nudge');
    if (view === 'home' || view === 'todos') msg = '';
    el.innerHTML = msg ? `<span>${msg}</span>${btn}` : '';
    el.hidden = !msg;
  }

  function renderNav() {
    const html = NAV.map(([id, label]) =>
      `<button class="nav-btn ${view === id ? 'active' : ''}" data-view="${id}" ${view === id ? 'aria-current="page"' : ''}>${svg(ICON[id])}<span>${label}</span></button>`).join('');
    $('#top-tabs').innerHTML = html;
    $('#bottom-nav').innerHTML = html;
  }

  /* ================= board ================= */
  function sorter(status) {
    if (status === 'posted') return (a, b) => (b.postedAt || '').localeCompare(a.postedAt || '') || b.updatedAt.localeCompare(a.updatedAt);
    return (a, b) => {
      if (a.date && b.date) return a.date.localeCompare(b.date);
      if (a.date) return -1;
      if (b.date) return 1;
      return b.updatedAt.localeCompare(a.updatedAt) || b.createdAt.localeCompare(a.createdAt);
    };
  }

  function dateBadge(p) {
    const d = p.status === 'posted' ? p.postedAt || p.date : p.date;
    if (!d) return '';
    const t = todayStr();
    const cls = d === t ? 'today' : (d < t && p.status !== 'posted' ? 'late' : '');
    return `<span class="date ${cls}">${fmtDate(d)}</span>`;
  }

  const seriesTag = name => name ? `<span class="tag" title="${esc(name)}">${esc(name)}</span>` : '';

  function statusChip(p) {
    const s = S[p.status];
    if (!NEXT[p.status]) return `<span class="chip done">${s.emoji} ${s.label}</span>`;
    const n = S[NEXT[p.status]];
    return `<button class="chip" data-advance="${p.id}" title="mark as ${n.label}">${s.emoji} → ${n.emoji} ${n.label}</button>`;
  }

  function preview(p) {
    if (p.hook) return `“${esc(p.hook)}”`;
    if (p.tryAngle) return `try → ${esc(p.tryAngle)}`;
    if (p.outline) return esc(p.outline);
    return '';
  }

  function cardHTML(p) {
    const pv = preview(p);
    const ad = p.sponsor ? `<span class="tag ad">${p.sponsor === 'paid' ? '#ad' : p.sponsor}</span>` : '';
    const top = seriesTag(p.pillar) + `<span class="fmt" title="${FMT[p.format].label}">${FMT[p.format].icon}</span>` + ad + dateBadge(p);
    return `<article class="card ${p.status}" draggable="true" data-open="${p.id}" tabindex="0">
      ${top ? `<div class="card-top">${top}</div>` : ''}
      <h3>${esc(p.title) || '<span class="muted">untitled</span>'}</h3>
      ${pv ? `<p class="hook">${pv}</p>` : ''}
      <div class="card-foot">${statusChip(p)}${p.status === 'idea' ? `<button class="link small" data-helper="${p.id}">✨ angle</button>` : ''}</div>
    </article>`;
  }

  function renderBoard() {
    const cols = STATUSES.map(s => {
      const items = state.posts.filter(p => p.status === s.id).sort(sorter(s.id));
      let shown = items, more = '';
      if (s.id === 'idea' && items.length > IDEA_COL_LIMIT) {
        shown = items.slice(0, IDEA_COL_LIMIT);
        more = `<button class="see-all" data-view="ideas">+ ${items.length - IDEA_COL_LIMIT} more in the idea bank →</button>`;
      }
      return `<div class="col" data-status="${s.id}">
        <div class="col-head"><span>${s.emoji} ${s.label}</span><span class="count">${items.length}</span></div>
        <div class="col-body">${shown.map(cardHTML).join('') || `<p class="empty">${EMPTY_COL[s.id]}</p>`}${more}</div>
      </div>`;
    }).join('');
    $('#view-board').innerHTML = viewHead('board', 'tap the status on a card (or drag it) to move it along',
      `<button class="ghost" data-open-modal="batch">🗓 this week's batch · ${batchDone()}/4</button>`) + `<div class="board">${cols}</div>`;
  }

  /* ================= calendar ================= */
  function renderCalendar() {
    const [y, m] = calMonth.split('-').map(Number);
    const first = `${calMonth}-01`;
    const last = ymd(new Date(y, m, 0));
    const start = weekStart(first);
    const end = addDays(weekStart(last), 6);
    const t = todayStr();
    const byDate = {};
    const push = (d, html, rank) => (byDate[d] = byDate[d] || []).push({ html, rank });
    state.posts.forEach(p => {
      if (!p.date) return;
      const f = FMT[p.format];
      push(p.date, `<button class="pill post ${p.status === 'posted' ? 'posted' : ''}" data-open="${p.id}" style="--sc:${seriesColor(p.pillar)}" title="${esc(`${p.title} · ${f.label}${p.pillar ? ' · ' + p.pillar : ''} · ${S[p.status].label}`)}">
        <span class="pl-title">${esc(p.title) || 'untitled'}</span>
        <span class="pl-meta"><span class="pl-fmt">${fmtIcon(p.format, 11)}${f.label}</span>${p.status !== 'idea' ? `<span class="pl-status" title="${S[p.status].label}">${S[p.status].emoji}</span>` : ''}</span>
        ${p.pillar ? `<span class="pl-series">${esc(seriesShort(p.pillar))}</span>` : ''}
      </button>`,
        STATUSES.findIndex(s => s.id === p.status));
    });
    state.collabs.forEach(c => {
      if (!c.due || c.status === 'passed') return;
      push(c.due, `<button class="pill collab" data-open-collab="${c.id}" title="${esc('🤝 ' + c.brand + ' content due')}"><span class="pe">🤝 </span>${esc(c.brand)}</button>`, 9);
    });
    Object.values(byDate).forEach(a => a.sort((a, b) => b.rank - a.rank));

    const lastRowStart = addDays(end, -6);
    let cells = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(d => `<div class="dow">${d}</div>`).join('');
    for (let d = start; d <= end; d = addDays(d, 1)) {
      const items = byDate[d] || [];
      const inMonth = d.slice(0, 7) === calMonth;
      cells += `<div class="day ${inMonth ? '' : 'out'} ${d === t ? 'today' : ''} ${d >= lastRowStart ? 'lastrow' : ''}" data-day="${d}" title="${items.length ? '' : 'plan a post on ' + fmtDate(d, false)}">
        <span class="num">${Number(d.slice(8))}</span>
        ${items.map(i => i.html).join('')}
      </div>`;
    }

    const agenda = [
      ...state.posts.filter(p => p.date && p.date.slice(0, 7) === calMonth).map(p => ({ d: p.date, attr: `data-open="${p.id}"`, t: p.title || 'untitled', e: S[p.status].emoji, m: `${FMT[p.format].icon} ${FMT[p.format].label}${p.pillar ? ' · ' + seriesShort(p.pillar) : ''}`, c: p.pillar ? seriesColor(p.pillar) : '' })),
      ...state.collabs.filter(c => c.due && c.status !== 'passed' && c.due.slice(0, 7) === calMonth).map(c => ({ d: c.due, attr: `data-open-collab="${c.id}"`, t: `${c.brand} content due`, e: '🤝' })),
    ].sort((a, b) => a.d.localeCompare(b.d));
    const monthLabel = new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toLowerCase();
    const ws = weekStart(calDay);
    const short = d => parseYmd(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toLowerCase();
    const label = calMode === 'month' ? monthLabel
      : calMode === 'week' ? (ws === weekStart(t) ? 'this week' : ws === addDays(weekStart(t), 7) ? 'next week' : ws === addDays(weekStart(t), -7) ? 'last week' : `${short(ws)} – ${short(addDays(ws, 6))}`)
      : (calDay === t ? 'today' : calDay === addDays(t, 1) ? 'tomorrow' : calDay === addDays(t, -1) ? 'yesterday' : parseYmd(calDay).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase());
    const sub = calMode === 'month' ? 'tap an empty day to plan a post · drag posts to move them'
      : calMode === 'week' ? `${short(ws)} – ${short(addDays(ws, 6))} · drag posts between days`
      : `${parseYmd(calDay).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toLowerCase()}`;
    const unit = calMode === 'month' ? 'month' : calMode;
    const body = calMode === 'week' ? calWeekHTML(byDate) : calMode === 'day' ? calDayHTML() : '';

    const searchFocused = document.activeElement && document.activeElement.id === 'tray-search';
    const placing = placingId && find(placingId);
    if (placingId && !placing) placingId = null;
    $('#view-calendar').innerHTML = viewHead(label, sub,
      `<div class="cal-nav">
        <div class="seg-switch cal-modes" role="tablist">
          <button class="${calMode === 'day' ? 'on' : ''}" data-calmode="day">day</button>
          <button class="${calMode === 'week' ? 'on' : ''}" data-calmode="week">week</button>
          <button class="${calMode === 'month' ? 'on' : ''}" data-calmode="month">month</button>
        </div>
        <button class="ghost small tray-toggle ${trayOpen ? 'on' : ''}" data-tray-toggle aria-expanded="${trayOpen}">💡 ideas · ${trayIdeas().length}</button>
        <button class="icon" data-cal="-1" aria-label="previous ${unit}">‹</button>
        <button class="ghost small" data-cal="0">today</button>
        <button class="icon" data-cal="1" aria-label="next ${unit}">›</button>
      </div>`) + `
      ${placing ? `<div class="placing"><span>📅 tap a day for <b>${esc(placing.title || 'untitled')}</b></span><button class="chip" data-place-cancel>cancel</button></div>` : ''}
      <div class="cal-layout ${trayOpen ? 'with-tray' : ''}">
        <div class="cal-main">
          ${calMode === 'month' ? `<div class="cal-grid ${placing ? 'placing-mode' : ''}">${cells}</div>` : body}
          <div class="legend">
            ${state.pillars.map(p => `<span><i class="sdot" style="background:${seriesColor(p)}"></i>${esc(seriesShort(p))}</span>`).join('')}
            <span class="legend-sep"></span>
            <span>✍️ scripted · 🎬 filmed · ✅ posted</span><span><i class="lg collab"></i>collab due</span>
          </div>
          <div class="agenda ${calMode !== 'month' ? 'off' : ''}">
            <p class="section-label">this month</p>
            ${agenda.map(a => `<button class="agenda-row" ${a.attr}><span class="d">${fmtDate(a.d)}</span><span class="t">${esc(a.t)}${a.m ? `<span class="agenda-meta">${a.c ? `<i class="sdot" style="background:${a.c}"></i>` : ''}${esc(a.m)}</span>` : ''}</span><span>${a.e}</span></button>`).join('') || '<p class="muted small-text">nothing dated this month yet</p>'}
          </div>
        </div>
        ${trayOpen ? `
        <aside class="idea-tray" id="idea-tray" aria-label="your ideas">
          <div class="tray-head"><b>💡 your ideas</b><span class="count" id="tray-count"></span><button class="icon small" data-tray-toggle aria-label="close ideas">✕</button></div>
          <input class="search tray-search" id="tray-search" type="search" placeholder="search ideas…" value="${esc(trayQuery)}" aria-label="search ideas">
          <select class="tray-select" id="tray-series" aria-label="filter by series">
            <option value="all">all series</option>
            ${state.pillars.map(p => `<option value="${esc(p)}" ${traySeries === p ? 'selected' : ''}>${esc(p)}</option>`).join('')}
          </select>
          <div class="tray-list" id="tray-list"></div>
          <p class="tray-hint">drag an idea onto a day, or tap the calendar icon then a day. drop a post back here to unschedule it.</p>
        </aside>` : ''}
      </div>`;
    if (trayOpen) {
      renderTrayList();
      const s = $('#tray-search');
      s.addEventListener('input', () => { trayQuery = s.value; renderTrayList(); });
      $('#tray-series').addEventListener('change', e => { traySeries = e.target.value; renderTrayList(); });
      if (searchFocused) { s.focus({ preventScroll: true }); s.setSelectionRange(s.value.length, s.value.length); }
    }
  }

  function calWeekHTML(byDate) {
    const t = todayStr();
    const ws = weekStart(calDay);
    const days = [0, 1, 2, 3, 4, 5, 6].map(i => addDays(ws, i));
    return `<div class="cal-week ${placingId ? 'placing-mode' : ''}">${days.map(d => {
      const items = byDate[d] || [];
      const dn = parseYmd(d);
      return `<div class="day cw-day ${d === t ? 'today' : ''} ${d < t ? 'past' : ''}" data-day="${d}">
        <button class="wd-head" data-calpick="${d}" title="open this day">
          <span class="wd-name">${dn.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase()}</span>
          <span class="wd-num">${dn.getDate()}</span>
          ${items.length ? `<span class="wd-count">${items.length}</span>` : ''}
        </button>
        <div class="cw-list">${items.map(i => i.html).join('')}</div>
        <span class="wd-add">+ plan a post</span>
      </div>`;
    }).join('')}</div>`;
  }

  function calDayHTML() {
    const t = todayStr();
    const d = calDay;
    const ws = weekStart(d);
    const posts = state.posts.filter(p => p.date === d)
      .sort((a, b) => STATUSES.findIndex(s => s.id === b.status) - STATUSES.findIndex(s => s.id === a.status));
    const dues = state.collabs.filter(c => c.due === d && c.status !== 'passed');
    const strip = [0, 1, 2, 3, 4, 5, 6].map(i => {
      const x = addDays(ws, i);
      const n = state.posts.filter(p => p.date === x).length + state.collabs.filter(c => c.due === x && c.status !== 'passed').length;
      const dn = parseYmd(x);
      return `<button class="ds-day ${x === d ? 'on' : ''} ${x === t ? 'today' : ''}" data-calpick="${x}">
        <span>${dn.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase()}</span><b>${dn.getDate()}</b><i>${n ? '●'.repeat(Math.min(n, 3)) : ''}</i>
      </button>`;
    }).join('');
    const card = p => {
      const f = FMT[p.format];
      return `<article class="cd-card ${p.status}" data-open="${p.id}" style="--sc:${seriesColor(p.pillar)}" tabindex="0">
        <div class="cd-top">
          ${p.pillar ? `<span class="cd-series">${esc(seriesShort(p.pillar))}</span>` : ''}
          <span class="cd-fmt">${fmtIcon(p.format, 12)}${f.label}</span>
          ${p.sponsor ? `<span class="tag ad">${p.sponsor === 'paid' ? '#ad' : p.sponsor}</span>` : ''}
        </div>
        <h3>${esc(p.title) || 'untitled'}</h3>
        ${preview(p) ? `<p class="hook">${preview(p)}</p>` : ''}
        <div class="cd-foot">${statusChip(p)}</div>
      </article>`;
    };
    return `
      <div class="day-strip">${strip}</div>
      <div class="day cd-day ${placingId ? 'placing-mode' : ''}" data-day="${d}">
        ${dues.map(c => `<button class="cd-collab" data-open-collab="${c.id}">🤝 <b>${esc(c.brand)}</b> content is due today${c.deliverables ? ` · ${esc(c.deliverables)}` : ''}</button>`).join('')}
        ${posts.map(card).join('')}
        ${!posts.length && !dues.length ? `<p class="cd-empty">nothing planned for this day yet.${trayOpen ? ' drag an idea in from the drawer, or' : ''}</p>` : ''}
        <button class="cd-new" data-new-post="${d}">+ plan a post for ${d === t ? 'today' : fmtDate(d, false)}</button>
      </div>`;
  }

  // every post without a date that isn't posted yet: your ideas (and anything scripted or filmed but unscheduled)
  function trayIdeas() {
    const q = trayQuery.trim().toLowerCase();
    const rank = { filmed: 0, scripted: 1, idea: 2 };
    return state.posts
      .filter(p => !p.date && p.status !== 'posted')
      .filter(p => traySeries === 'all' || p.pillar === traySeries)
      .filter(p => !q || [p.title, p.hook, p.outline, p.tryAngle, p.pillar].join(' ').toLowerCase().includes(q))
      .sort((a, b) => (rank[a.status] - rank[b.status]) || b.createdAt.localeCompare(a.createdAt));
  }

  function renderTrayList() {
    const list = trayIdeas();
    $('#tray-count').textContent = list.length;
    $('#tray-list').innerHTML = list.map(p => `
      <div class="tray-item ${placingId === p.id ? 'placing' : ''}" data-open="${p.id}" tabindex="0" style="--sc:${seriesColor(p.pillar)}" aria-label="${esc(p.title)}. drag onto a day">
        <span class="ti-main">
          <span class="ti-title">${esc(p.title) || 'untitled'}</span>
          <span class="ti-meta">
            ${p.pillar ? `<span class="ti-series">${esc(seriesShort(p.pillar))}</span>` : ''}
            <span class="ti-fmt">${fmtIcon(p.format, 12)}${FMT[p.format].label}</span>
            ${p.status !== 'idea' ? `<span class="ti-status">${S[p.status].emoji} ${S[p.status].label}</span>` : ''}
          </span>
        </span>
        <button class="ti-place" data-place="${p.id}" aria-label="pick a day for ${esc(p.title)}">${svg(ICON.calplus, 17)}</button>
      </div>`).join('') || `<p class="muted small-text tray-empty">${trayQuery || traySeries !== 'all' ? 'nothing matches' : 'every idea has a date 🎉'}</p>`;
  }

  function newOnDate(d) {
    const p = mk({ date: d });
    state.posts.unshift(p);
    persist();
    renderAll();
    openPanel(p.id, true);
  }

  /* ================= calendar drag & drop =================
     works with a mouse and with touch (press and hold). hover the ‹ › arrows while dragging to flip months. */
  let calDrag = null;
  let swallowClick = false;
  let placingId = null, trayQuery = '', traySeries = 'all';
  let calMode = 'month', calDay = todayStr();
  try { const m = localStorage.getItem(KEY + ':calMode'); if (m === 'day' || m === 'week') calMode = m; } catch (e) { /* ignore */ }

  // ‹ › and "today" for whichever calendar view is open
  function shiftCal(d) {
    if (d === 0) { calDay = todayStr(); calMonth = calDay.slice(0, 7); return; }
    if (calMode === 'day') calDay = addDays(calDay, d);
    else if (calMode === 'week') calDay = addDays(calDay, d * 7);
    else { const [y, m] = calMonth.split('-').map(Number); calMonth = ymd(new Date(y, m - 1 + d, 1)).slice(0, 7); return; }
    calMonth = calDay.slice(0, 7);
  }
  let trayOpen = window.innerWidth > 700;
  try { const v = localStorage.getItem(KEY + ':tray'); if (v !== null) trayOpen = v === '1'; } catch (e) { /* ignore */ }

  function moveToDate(kind, id, newDate) {
    const item = kind === 'post' ? find(id) : kind === 'todo' ? state.todos.find(x => x.id === id) : findC(id);
    if (!item) return;
    const key = kind === 'post' ? 'date' : 'due';
    const oldDate = item[key];
    if (oldDate === newDate) return;
    item[key] = newDate;
    touch(item);
    persist();
    renderAll();
    const label0 = kind === 'collab' ? `${item.brand} due date` : (item.title || 'post');
    const label = label0.length > 28 ? label0.slice(0, 28) + '…' : label0;
    const msg = !newDate ? `${label} is back in your ideas 💡`
      : !oldDate ? `${label} is planned for ${fmtDate(newDate, false)} 📅`
      : `moved ${label} to ${fmtDate(newDate, false)} 📅`;
    toast(msg, {
      label: 'undo',
      fn: () => { item[key] = oldDate; touch(item); persist(); renderAll(); },
    });
  }

  function startCalDrag(x, y) {
    if (!calDrag || calDrag.active) return;
    calDrag.active = true;
    const item = calDrag.kind === 'post' ? find(calDrag.id) : calDrag.kind === 'todo' ? state.todos.find(x => x.id === calDrag.id) : findC(calDrag.id);
    const g = document.createElement('div');
    g.className = 'drag-ghost' + (calDrag.pill.classList.contains('posted') ? ' posted' : '') + (calDrag.kind === 'collab' ? ' collab' : '') + (calDrag.kind === 'todo' ? ' todo' : '');
    g.textContent = calDrag.kind === 'post' ? `${S[item.status].emoji} ${item.title || 'untitled'}`
      : calDrag.kind === 'todo' ? `○ ${item.title}`
      : `🤝 ${item.brand}`;
    document.body.appendChild(g);
    calDrag.ghost = g;
    calDrag.pill.classList.add('drag-src');
    document.body.classList.add('cal-dragging');
    moveGhost(x, y);
    if (calDrag.touch && navigator.vibrate) navigator.vibrate(12); // tiny buzz on phones only
  }
  function moveGhost(x, y) { if (calDrag && calDrag.ghost) calDrag.ghost.style.transform = `translate(${x + 12}px, ${y + 8}px) rotate(-2deg)`; }

  function endCalDrag(x, y, cancel) {
    if (!calDrag) return;
    const d = calDrag;
    calDrag = null;
    clearTimeout(d.timer);
    clearTimeout(d.navTimer);
    if (!d.active) return; // just a tap: let it open as usual
    swallowClick = true;
    setTimeout(() => { swallowClick = false; }, 80);
    d.ghost.remove();
    document.body.classList.remove('cal-dragging');
    document.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
    const under = cancel ? null : document.elementFromPoint(x, y);
    if (under && under.closest('#idea-tray') && d.kind === 'post' && d.from) { moveToDate('post', d.id, ''); return; }
    const day = under && under.closest(d.kind === 'todo' ? '#view-todos .day' : '#view-calendar .day');
    const target = day && (day.dataset.day || day.dataset.tdday);
    if (!target || target === d.from) { if (d.kind === 'todo') renderTodos(); else renderCalendar(); return; }
    moveToDate(d.kind, d.id, target);
  }

  document.addEventListener('pointerdown', e => {
    if (!(e.target instanceof Element) || e.target.closest('[data-place]')) return;
    if (e.target.closest('[data-todo-check]')) return;
    if (e.target.closest('[data-advance]')) return;
    const pill = e.target.closest('#view-calendar .pill, #view-calendar .cd-card, #view-calendar .tray-item, #view-todos .tdc');
    if (!pill || e.button > 0) return;
    if (pill.classList.contains('tray-item') && e.pointerType !== 'mouse') return; // lets the list scroll on phones
    const day = pill.closest('.day');
    calDrag = {
      kind: pill.dataset.tdc ? 'todo' : pill.dataset.open ? 'post' : 'collab',
      id: pill.dataset.tdc || pill.dataset.open || pill.dataset.openCollab,
      pill, from: day ? (day.dataset.day || day.dataset.tdday) : '',
      x: e.clientX, y: e.clientY, touch: e.pointerType !== 'mouse', active: false,
    };
    if (calDrag.touch) calDrag.timer = setTimeout(() => startCalDrag(calDrag.x, calDrag.y), 280);
  });

  document.addEventListener('pointermove', e => {
    if (!calDrag) return;
    if (!calDrag.active) {
      const dist = Math.hypot(e.clientX - calDrag.x, e.clientY - calDrag.y);
      if (!calDrag.touch && dist > 5) startCalDrag(e.clientX, e.clientY);
      else if (calDrag.touch) { calDrag.x = e.clientX; calDrag.y = e.clientY; if (dist > 12) { clearTimeout(calDrag.timer); calDrag = null; } }
      return;
    }
    e.preventDefault();
    moveGhost(e.clientX, e.clientY);
    const under = document.elementFromPoint(e.clientX, e.clientY);
    const day = under && under.closest(calDrag.kind === 'todo' ? '#view-todos .day' : '#view-calendar .day');
    document.querySelectorAll('.day.drop-target').forEach(el => { if (el !== day) el.classList.remove('drop-target'); });
    if (day) day.classList.add('drop-target');
    const tray = $('#idea-tray');
    if (tray) tray.classList.toggle('drop-target', !!(under && under.closest('#idea-tray') && calDrag.kind === 'post' && calDrag.from));
    const nav = under && under.closest('#view-calendar [data-cal], #view-todos [data-tdcal], #view-todos [data-tdweek]');
    const navDir = nav ? Number(nav.dataset.cal || nav.dataset.tdcal || nav.dataset.tdweek) : 0;
    if (nav && navDir) {
      if (!calDrag.navTimer) {
        calDrag.navTimer = setTimeout(() => {
          if (!calDrag) return;
          if (nav.dataset.tdweek) {
            todoWeek = addDays(todoWeek, navDir * 7);
            renderTodos();
          } else if (nav.dataset.tdcal) {
            const [y, m] = todoCalMonth.split('-').map(Number);
            todoCalMonth = ymd(new Date(y, m - 1 + navDir, 1)).slice(0, 7);
            renderTodos();
          } else {
            shiftCal(navDir);
            renderCalendar();
          }
          calDrag.navTimer = null;
        }, 550);
      }
    } else if (calDrag.navTimer) { clearTimeout(calDrag.navTimer); calDrag.navTimer = null; }
  }, { passive: false });

  document.addEventListener('pointerup', e => endCalDrag(e.clientX, e.clientY, false));
  document.addEventListener('pointercancel', e => endCalDrag(e.clientX, e.clientY, true));
  // after a drag, don't let the release count as a click (it would open a post or plan a new one)
  document.addEventListener('click', e => { if (swallowClick) { swallowClick = false; e.stopPropagation(); e.preventDefault(); } }, true);
  document.addEventListener('contextmenu', e => { if (calDrag && calDrag.touch) e.preventDefault(); });

  /* ================= idea bank ================= */
  function ideaMatches() {
    const q = ideaQuery.trim().toLowerCase();
    return state.posts
      .filter(p => p.status === 'idea' && !p.date)
      .filter(p => ideaPillar === 'all' || (ideaPillar === 'none' ? !p.pillar : p.pillar === ideaPillar))
      .filter(p => !q || [p.title, p.hook, p.insteadOf, p.tryAngle, p.outline, p.script, p.notes, p.pillar].join(' ').toLowerCase().includes(q))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  function renderIdeas() {
    const el = $('#view-ideas');
    if (!el.dataset.built) {
      el.innerHTML = viewHead('idea bank', 'every 💡 idea without a date. pick what to make next.',
        '<div class="head-actions"><button class="ghost" data-open-modal="gen">✦ 6-idea generator</button><button class="ghost" id="idea-random">🎲 pick for me</button></div>') + `
        <input id="idea-search" class="search" type="search" placeholder="search ideas…" aria-label="search ideas">
        <div class="filters" id="idea-filters"></div>
        <p class="tagline" id="idea-tagline"></p>
        <p class="muted small-text" id="idea-count"></p>
        <div class="idea-list" id="idea-list"></div>`;
      el.dataset.built = '1';
      $('#idea-search').addEventListener('input', e => { ideaQuery = e.target.value; renderIdeas(); });
      $('#idea-random').addEventListener('click', () => {
        const list = ideaMatches();
        if (!list.length) return toast('no ideas to pick from yet');
        const p = list[Math.floor(Math.random() * list.length)];
        const row = document.querySelector(`.idea-row[data-open="${p.id}"]`);
        if (row) { row.scrollIntoView({ block: 'center', behavior: 'smooth' }); row.classList.remove('flash'); void row.offsetWidth; row.classList.add('flash'); }
        toast('how about this one? 🎲');
      });
    }
    if (ideaPillar !== 'all' && ideaPillar !== 'none' && !state.pillars.includes(ideaPillar)) ideaPillar = 'all';
    const opts = [['all', 'all'], ...state.pillars.map(p => [p, p])];
    if (state.posts.some(p => p.status === 'idea' && !p.date && !p.pillar)) opts.push(['none', 'no series']);
    $('#idea-filters').innerHTML = opts.map(([v, l]) => `<button class="chip ${ideaPillar === v ? 'on' : ''}" data-filter-pillar="${esc(v)}">${esc(l)}</button>`).join('');
    $('#idea-tagline').textContent = state.taglines[ideaPillar] || '';

    const list = ideaMatches();
    const total = state.posts.filter(p => p.status === 'idea' && !p.date).length;
    $('#idea-count').textContent = list.length === total ? plural(total, 'idea') : `${list.length} of ${total} ideas`;
    $('#idea-list').innerHTML = list.map(p => {
      const pv = preview(p);
      return `<div class="idea-row" data-open="${p.id}" tabindex="0">
        <div class="idea-main">
          ${ideaPillar === 'all' ? seriesTag(p.pillar) : ''}
          <h3>${esc(p.title) || 'untitled'}</h3>
          ${pv ? `<p class="hook">${pv}</p>` : ''}
        </div>
        <div class="row-actions">
          <button class="chip" data-helper="${p.id}" title="angle helper">✨</button>
          <button class="chip" data-advance="${p.id}" title="mark as scripted">→ ✍️</button>
        </div>
      </div>`;
    }).join('') || `<p class="empty">${total ? 'nothing matches that' : 'no undated ideas. add one up top ↑'}</p>`;
  }

  /* ================= collabs ================= */
  const isActive = c => ['pitch', 'pitched', 'talking', 'booked'].includes(c.status);

  function collabSort(a, b) {
    const fa = followUpDue(a), fb = followUpDue(b);
    if (fa !== fb) return fa ? -1 : 1;
    const da = a.due || a.followUp, db = b.due || b.followUp;
    if (da && db && da !== db) return da.localeCompare(db);
    if (da && !db) return -1;
    if (db && !da) return 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  }

  function nextAction(c) {
    const t = todayStr();
    switch (c.status) {
      case 'pitch': return { text: 'next: send the first pitch ✉️', cls: '' };
      case 'pitched':
        if (followUpDue(c)) return { text: c.followStep === 0 ? 'day-4 follow-up is due 💌' : 'last nudge is due 💌', cls: 'hot' };
        if (c.followStep === 2) return { text: 'last nudge sent. waiting 🌙', cls: '' };
        return { text: c.followUp ? `${c.followStep === 0 ? 'follow up' : 'last nudge'} ${fmtDate(c.followUp)}` : 'waiting to hear back', cls: '' };
      case 'talking':
        if (followUpDue(c)) return { text: 'follow up today 💌', cls: 'hot' };
        if (!Number(c.amount)) return { text: 'next: send your rate card', cls: 'hot' };
        return { text: 'talking it through', cls: '' };
      case 'booked': {
        if (invoiceOverdue(c)) return { text: `invoice overdue since ${fmtDate(c.invoiceDue)}`, cls: 'hot' };
        const soon = c.due && c.due <= addDays(t, 3);
        if (!c.upfrontAt) return { text: amountOf(c) ? `next: invoice the upfront (${peso(upfrontAmt(c))})` : 'next: confirm the rate + invoice', cls: soon ? 'hot' : '' };
        const lp = linkedPost(c);
        if (lp && lp.status === 'posted' && c.terms !== 'full') return { text: "it's live! invoice the balance", cls: 'hot' };
        if (!c.due) return { text: 'upfront in ✓ agree on a due date', cls: '' };
        return { text: `upfront in ✓ due ${fmtDate(c.due)}`, cls: c.due <= t ? 'hot' : '' };
      }
      case 'paid':
        if (needs2307(c)) return { text: 'paid ✓ ask for BIR 2307 🧾', cls: 'hot' };
        return { text: c.paidAt ? `paid ${fmtDate(c.paidAt)} 💸` : 'paid 💸', cls: 'done' };
      default: return { text: 'maybe later 🌙', cls: '' };
    }
  }

  function brandCard(c) {
    const na = nextAction(c);
    const amt = Number(c.amount) ? `<span class="amt">${peso(Number(c.amount))}</span>` : '';
    const initial = (c.brand.trim()[0] || '?').toUpperCase();
    const sub = c.product || c.contactName || c.contact;
    const chip = CNEXT[c.status]
      ? `<button class="chip" data-cadvance="${c.id}" title="move to ${CS[CNEXT[c.status]].label}">${CS[c.status].emoji} → ${CS[CNEXT[c.status]].emoji}</button>`
      : `<span class="chip done">${CS[c.status].emoji} ${CS[c.status].label}</span>`;
    return `<article class="bcard ${c.status}" data-open-collab="${c.id}" tabindex="0">
      <div class="bcard-top">
        <span class="avatar" aria-hidden="true">${esc(initial)}</span>
        <div class="bcard-name"><h3>${esc(c.brand) || 'untitled brand'}</h3>${sub ? `<span>${esc(sub)}</span>` : ''}</div>
        ${amt}
      </div>
      ${c.why ? `<p class="hook">${esc(c.why)}</p>` : ''}
      <div class="bcard-foot"><span class="next ${na.cls}">${na.text}</span>${chip}</div>
    </article>`;
  }

  function fillTemplate(text, c) {
    const P = state.profile;
    const first = (c.contactName || '').trim().split(/\s+/)[0];
    const n = Number(c.amount);
    const map = {
      brand: c.brand || '[brand]',
      contact: first || (c.brand ? `${c.brand} team` : 'there'),
      product: c.product.trim() || c.brand || '[product]',
      hook: c.hook.trim().replace(/[.,\s]+$/, '') || '[the recent news or update]',
      idea: c.why.trim() || '[the video idea]',
      why: c.why.trim() || '[the video idea]',
      deliverables: c.deliverables.trim() || '[deliverables]',
      rate: n ? peso(n) : '[rate]',
      name: P.name.trim() || '[your name]',
      title: P.title.trim() || 'Content creator',
      handle: P.handle.trim() || '[@handle]',
      followers: P.followers.trim() || '[followers]',
      niche: P.niche.trim() || '[what you post about]',
      credential: P.credential.trim(),
      link: P.link.trim() || '[TikTok link]',
      audience: P.audience.trim() || '[your audience]',
      audienceDetail: P.audienceDetail.trim() || '[age range or top cities]',
      job: P.job.trim() || '[your job]',
      format: c.deliverables.trim() || '[number] TikTok videos',
      found: c.foundVia.trim().replace(/[.,\s]+$/, '') || '[say how you found this email, e.g. "Your website lists this address for partnerships"]',
      upfront: amountOf(c) ? peso(upfrontAmt(c)) : '[50% of the fee]',
      invoice: c.invoiceNo.trim() || '[#]',
      invoiceDue: c.invoiceDue ? fmtDate(c.invoiceDue, false) : '[date]',
      ratecard: rateCardText(),
    };
    return text
      .replace(/\{(\w+)\}/g, (m, k) => (k in map ? map[k] : m))
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/ +\n/g, '\n');
  }

  function rateCardText() {
    const fmt = v => { const s = String(v).trim(); return s.startsWith('₱') ? s : `₱${s}`; };
    const items = state.rateCard.items.filter(i => i.price.trim())
      .map(i => `• ${i.name}: from ${fmt(i.price)}${i.includes ? ` (${i.includes})` : ''}`);
    const adds = state.rateCard.addons.filter(i => i.price.trim())
      .map(i => `${i.name} +${fmt(i.price)}${i.includes ? ` ${i.includes}` : ''}`);
    if (!items.length) return '[your rate card: add your "from ₱" prices in collabs → my kit]';
    return items.join('\n') + (adds.length ? `\n\nadd-ons: ${adds.join(' · ')}` : '');
  }

  function copyTemplate(tid, cid) {
    const c = findC(cid);
    const tp = state.templates.find(x => x.id === tid);
    if (!c || !tp) return;
    copyText(fillTemplate(tp.text, c)).then(ok => toast(ok ? `copied "${tp.name}" for ${c.brand || 'this brand'} ✉️` : "couldn't copy"));
  }

  function updateHero() {
    const t = todayStr(), month = t.slice(0, 7);
    const all = state.collabs.flatMap(payments);
    const paidMonth = all.filter(p => p.date.slice(0, 7) === month).reduce((s, p) => s + p.amt, 0);
    const paidYear = all.filter(p => p.date.slice(0, 4) === t.slice(0, 4)).reduce((s, p) => s + p.amt, 0);
    const booked = state.collabs.filter(c => c.status === 'booked' || c.status === 'paid').reduce((s, c) => s + Math.max(0, amountOf(c) - received(c)), 0);
    const g = state.incomeGoal;
    $('#hero-paid').textContent = peso(paidMonth);
    $('#hero-bar').style.width = g ? Math.min(100, (paidMonth / g) * 100) + '%' : '0%';
    $('#hero-bar-wrap').hidden = !g;
    $('#hero-goal-note').textContent = !g ? '' : paidMonth >= g ? 'goal hit 🎉' : `${peso(g - paidMonth)} to go`;
    $('#hero-booked').textContent = peso(booked);
    $('#hero-year').textContent = peso(paidYear);
    $('#hero-active').textContent = state.collabs.filter(isActive).length;
  }

  function renderNextUp() {
    const t = todayStr();
    const rows = [];
    state.collabs.filter(followUpDue).sort(collabSort).forEach(c => {
      const tid = c.status === 'pitched' && c.followStep === 1 ? 'nudge' : 'followup';
      const what = c.status === 'pitched' && c.followStep === 1 ? 'last nudge (with one concept)' : 'follow-up';
      rows.push(`<div class="todo hot"><span>💌 ${what} for <b>${esc(c.brand)}</b>${c.followUp < t ? ' · overdue' : ''}</span>
        <span class="todo-actions"><button class="chip" data-copy-tpl="${tid}" data-cid="${c.id}">copy</button>${c.status === 'pitched' ? `<button class="chip" data-follow-sent="${c.id}">mark sent</button>` : ''}</span></div>`);
    });
    state.collabs.filter(c => c.status === 'talking' && !Number(c.amount)).forEach(c => rows.push(
      `<div class="todo hot"><span>💬 <b>${esc(c.brand)}</b> replied. send rate ranges + 2 to 3 concepts</span>
        <span class="todo-actions"><button class="chip" data-copy-tpl="rates" data-cid="${c.id}">copy rate card</button></span></div>`));
    state.collabs.filter(c => c.status === 'booked' && !c.upfrontAt).forEach(c => {
      const soon = c.due && c.due <= addDays(t, 3);
      rows.push(`<div class="todo ${soon ? 'hot' : ''}"><span>💳 invoice <b>${esc(c.brand)}</b> for the upfront${amountOf(c) ? ` (${peso(upfrontAmt(c))})` : ''}${soon ? ". don't post until it lands" : ''}</span>
        <span class="todo-actions"><button class="chip" data-copy-tpl="upfront" data-cid="${c.id}">copy terms</button><button class="chip" data-pay="${c.id}|upfront">mark received</button></span></div>`);
    });
    state.collabs.filter(invoiceOverdue).forEach(c => rows.push(
      `<div class="todo hot"><span>⏰ <b>${esc(c.brand)}</b> invoice${c.invoiceNo ? ' ' + esc(c.invoiceNo) : ''} is overdue</span>
        <span class="todo-actions"><button class="chip" data-copy-tpl="overdue" data-cid="${c.id}">copy reminder</button></span></div>`));
    state.collabs.filter(c => c.status === 'booked' && c.upfrontAt && c.terms !== 'full' && !c.balanceAt && linkedPost(c) && linkedPost(c).status === 'posted').forEach(c => rows.push(
      `<div class="todo hot"><span>🎉 the <b>${esc(c.brand)}</b> video is live. invoice the balance${amountOf(c) ? ` (${peso(amountOf(c) - upfrontAmt(c))})` : ''}</span>
        <span class="todo-actions"><button class="chip" data-pay="${c.id}|balance">mark received</button></span></div>`));
    state.collabs.filter(needs2307).forEach(c => rows.push(
      `<div class="todo"><span>🧾 ask <b>${esc(c.brand)}</b> for BIR Form 2307</span>
        <span class="todo-actions"><button class="chip" data-copy-tpl="form2307" data-cid="${c.id}">copy</button><button class="chip" data-got2307="${c.id}">got it</button></span></div>`));
    state.collabs.filter(c => c.status === 'booked' && c.upfrontAt && c.due && c.due <= addDays(t, 7) && !(linkedPost(c) && linkedPost(c).status === 'posted')).sort((a, b) => a.due.localeCompare(b.due)).forEach(c => rows.push(
      `<div class="todo ${c.due <= t ? 'hot' : ''}"><span>🤝 <b>${esc(c.brand)}</b> content due ${fmtDate(c.due)}</span>
        <span class="todo-actions"><button class="chip" data-open-collab="${c.id}">open</button></span></div>`));
    state.collabs.filter(c => c.status === 'pitched' && c.followStep === 2 && c.pitchedAt && c.pitchedAt <= addDays(t, -14)).forEach(c => rows.push(
      `<div class="todo"><span>🌙 no reply from <b>${esc(c.brand)}</b> after your last nudge. it's okay to let it go</span>
        <span class="todo-actions"><button class="chip" data-cmove="${c.id}|passed">move to not now</button></span></div>`));
    const toPitch = state.collabs.filter(c => c.status === 'pitch').length;
    if (toPitch) rows.push(
      `<div class="todo"><span>🎯 ${plural(toPitch, 'brand')} ready for a first pitch <span class="muted">· best sent Tue to Thu, 9 to 11 AM</span></span>
        <span class="todo-actions"><button class="chip" data-cfilter="pitch">see ${toPitch === 1 ? 'it' : 'them'}</button></span></div>`);
    $('#next-up-list').innerHTML = rows.slice(0, 6).join('')
      || '<p class="caught-up">all caught up ✨ type a dream brand in the bar up top to start a pitch</p>';
  }

  function renderPipeline() {
    updateHero();
    renderNextUp();
    const filters = [['active', 'active', state.collabs.filter(isActive).length],
      ...CSTATUSES.map(s => [s.id, `${s.emoji} ${s.label}`, state.collabs.filter(c => c.status === s.id).length])];
    $('#stage-strip').innerHTML = filters.filter(([id, , n]) => n || id === 'active' || id === collabFilter).map(([id, label, n]) =>
      `<button class="stage ${collabFilter === id ? 'on' : ''}" data-cfilter="${id}">${label}<span class="n">${n}</span></button>`).join('');
    const list = state.collabs.filter(c => collabFilter === 'active' ? isActive(c) : c.status === collabFilter).sort(collabSort);
    const empty = state.collabs.length
      ? '<div class="collab-empty"><p class="muted">nothing here right now</p></div>'
      : `<div class="collab-empty">
          <p><b>start a dream list.</b> type a brand you already use and love in the bar up top, then press enter.</p>
          <p class="muted">${esc(PERSONAL.COLLAB_IDEAS || 'ideas: the apps, tools and places you already use and love')}</p>
        </div>`;
    $('#collab-grid').innerHTML = list.map(brandCard).join('') || empty;
  }

  function renderTemplateList() {
    if (!state.templates.some(x => x.id === tplId)) tplId = state.templates[0] ? state.templates[0].id : '';
    $('#tpl-list').innerHTML = TEMPLATE_GROUPS.map(([g, label]) => {
      const items = state.templates.filter(x => (x.group || 'mine') === g);
      if (!items.length) return '';
      return `<p class="tpl-group">${label}</p>` + items.map(x =>
        `<button class="tpl-item ${x.id === tplId ? 'on' : ''}" data-tpl-tab="${esc(x.id)}">${esc(x.name)}</button>`).join('');
    }).join('') + '<button class="tpl-item add" id="tpl-add">+ new template</button>';
    const tp = state.templates.find(x => x.id === tplId);
    const ta = $('#tpl-text');
    if (document.activeElement !== ta) ta.value = tp ? tp.text : '';
    ta.disabled = !tp;
    $('#tpl-name').textContent = tp ? tp.name : '';
    const isDefault = tp && DEFAULT_TEMPLATES.some(d => d.id === tp.id);
    $('#tpl-reset').hidden = !isDefault;
    $('#tpl-del').hidden = !tp || isDefault;
  }

  function syncProfileInputs() {
    document.querySelectorAll('[data-profile]').forEach(inp => {
      if (document.activeElement !== inp) inp.value = state.profile[inp.dataset.profile] || '';
    });
    document.querySelectorAll('[data-rc]').forEach(inp => {
      if (document.activeElement === inp) return;
      const [list, id, key] = inp.dataset.rc.split('|');
      const row = state.rateCard[list].find(x => x.id === id);
      inp.value = row ? row[key] : '';
    });
    document.querySelectorAll('[data-kit]').forEach(inp => { inp.checked = !!state.kitChecks[inp.dataset.kit]; });
    const goal = $('#income-goal');
    if (goal && document.activeElement !== goal) goal.value = state.incomeGoal || '';
  }

  function buildCollabs() {
    const el = $('#view-collabs');
    const profileField = (k, label, ph, wide = false) =>
      `<label class="field ${wide ? 'wide' : ''}"><span class="label">${label}</span><input data-profile="${k}" placeholder="${esc(ph)}"></label>`;
    const rcRows = list => state.rateCard[list].map(r => `
      <div class="rc-row">
        <div class="rc-name"><b>${esc(r.name)}</b><input class="rc-inc" data-rc="${list}|${r.id}|includes" placeholder="what's included" aria-label="what's included in ${esc(r.name)}"></div>
        <label class="rc-price"><span>${list === 'addons' ? '+ ₱' : 'from ₱'}</span><input data-rc="${list}|${r.id}|price" inputmode="text" placeholder="___" aria-label="price for ${esc(r.name)}"></label>
      </div>`).join('');

    el.innerHTML = viewHead('collabs', 'pitch brands, follow up, get paid',
      `<div class="seg-switch" role="tablist">
        <button data-ctab="pipeline">pipeline</button>
        <button data-ctab="messages">messages</button>
        <button data-ctab="kit">my kit</button>
        <button data-ctab="playbook">playbook</button>
      </div>`) + `

      <div id="collab-pipeline">
        <div class="collab-hero">
          <div class="hero-main">
            <span class="label">paid this month</span>
            <b class="big" id="hero-paid">₱0</b>
            <div class="goal-bar" id="hero-bar-wrap"><span id="hero-bar"></span></div>
            <label class="goal-edit">monthly goal ₱<input id="income-goal" type="number" inputmode="numeric" min="0" step="500" placeholder="set one"><span id="hero-goal-note"></span></label>
          </div>
          <div class="hero-stats">
            <div class="hstat"><span class="label">still coming in</span><b id="hero-booked">₱0</b></div>
            <div class="hstat"><span class="label">paid this year</span><b id="hero-year">₱0</b></div>
            <div class="hstat"><span class="label">active brands</span><b id="hero-active">0</b></div>
          </div>
        </div>
        <section class="block">
          <p class="section-label">next up</p>
          <div id="next-up-list"></div>
        </section>
        <section class="block">
          <div class="stage-strip" id="stage-strip"></div>
          <div class="collab-grid" id="collab-grid"></div>
        </section>
      </div>

      <div id="collab-messages" hidden>
        <section class="card-box">
          <div class="box-head"><h3>message templates</h3><span class="muted">open a brand and tap one to copy it, filled in with their details + yours</span></div>
          <div class="tpl-layout">
            <div class="tpl-list" id="tpl-list"></div>
            <div class="tpl-editor">
              <div class="tpl-editor-head"><b id="tpl-name"></b><span><button class="link small" id="tpl-reset">reset to default</button><button class="link small" id="tpl-del">delete</button></span></div>
              <textarea id="tpl-text" rows="18" aria-label="template text"></textarea>
              <p class="muted small-text">fill-ins: {brand} {contact} {product} {hook} {idea} {found} {format} {deliverables} {upfront} {invoice} {invoiceDue} {ratecard} {name} {job} {handle} {followers} {niche} {audience} {audienceDetail} {credential} {link}</p>
            </div>
          </div>
        </section>
      </div>

      <div id="collab-kit" hidden>
        <section class="card-box">
          <div class="box-head"><h3>your details</h3><span class="muted">filled into every message, so each pitch carries your proof</span></div>
          <div class="profile-grid">
            ${profileField('name', 'name', 'your name')}
            ${profileField('handle', 'tiktok handle', '@yourhandle')}
            ${profileField('followers', 'followers', 'e.g. 12.4K')}
            ${profileField('title', 'title under your name', 'Content creator')}
            ${profileField('email', 'contact email', 'you@email.com')}
            ${profileField('link', 'link (tiktok or media kit)', 'tiktok.com/@yourhandle')}
            ${profileField('job', 'your job (for "I\'m a ___")', 'e.g. automation intern')}
            ${profileField('niche', 'what you post about', 'tech, automation and life outside the laptop', true)}
            ${profileField('audience', 'who watches (no "Filipino", the pitch adds it)', 'e.g. students and young professionals')}
            ${profileField('audienceDetail', 'audience detail', 'e.g. mostly 18 to 30, Metro Manila + Cebu')}
          </div>
          <label class="field"><span class="label">one credential (one sentence, optional)</span><input data-profile="credential" placeholder="e.g. I build automations for small businesses as a [role] at [company]."></label>
          <label class="field"><span class="label">your one-line lane</span><input data-profile="lane" placeholder="I help ___ with ___ because I do it every day at work."></label>
        </section>

        <section class="card-box">
          <div class="box-head"><h3>rate card</h3><span class="muted">pesos, "from ₱" prices. goes into the rate card message automatically</span></div>
          <div class="rc-table">${rcRows('items')}</div>
          <p class="section-label rc-addons">add-ons</p>
          <div class="rc-table">${rcRows('addons')}</div>
          <p class="muted small-text rc-tip">set prices from how long each one takes you. charge more for usage rights, exclusivity and rush. review them every few deals and raise them as you grow.</p>
        </section>

        <section class="card-box">
          <div class="box-head"><h3>media kit</h3><span class="muted">1 to 2 pages, made in Canva</span></div>
          <div class="kit-cols">
            <div>
              <p class="section-label">what goes in it</p>
              <ul class="kit-list">${KIT_CONTENTS.map(([a, b]) => `<li><b>${esc(a)}</b><span>${esc(b)}</span></li>`).join('')}</ul>
            </div>
            <div>
              <p class="section-label">before you send</p>
              ${KIT_CHECKS.map((k, i) => `<label class="check"><input type="checkbox" data-kit="${i}"><span>${esc(k)}</span></label>`).join('')}
            </div>
          </div>
        </section>
      </div>

      <div id="collab-playbook" hidden>
        <section class="card-box">
          <div class="box-head"><h3>the pitch rhythm</h3><span class="muted">one pitch, two follow-ups, then let it go</span></div>
          <div class="cadence">${PLAYBOOK_CADENCE.map(([when, what, how], i) => `
            <div class="cad-step ${i === 3 ? 'reply' : ''}"><span class="cad-when">${when}</span><b>${what}</b><span class="muted">${how}</span></div>`).join('')}
          </div>
          <div class="playbook-cols">
            <div>
              <p class="section-label">anatomy of a pitch</p>
              <ol class="anatomy">${PLAYBOOK_ANATOMY.map(([a, b]) => `<li><b>${esc(a)}</b><span>${esc(b)}</span></li>`).join('')}</ol>
            </div>
            <div>
              <p class="section-label">if they say…</p>
              ${PLAYBOOK_REPLIES.map(([q, a, tid]) => `<div class="if-say"><b>${esc(q)}</b><span>${esc(a)}</span><button class="link small" data-goto-tpl="${tid}">see message</button></div>`).join('')}
            </div>
          </div>
        </section>
        ${PLAYBOOK_SECTIONS.map(s => `
          <details class="card-box acc" ${s.open ? 'open' : ''}>
            <summary><h3>${esc(s.title)}</h3><span class="chev" aria-hidden="true">›</span></summary>
            <ul class="tips">${s.items.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
            ${s.ask ? `<p class="section-label">questions to bring to an accountant</p><ol class="tips">${s.ask.map(x => `<li>${esc(x)}</li>`).join('')}</ol>` : ''}
          </details>`).join('')}
      </div>`;
    el.dataset.built = '1';

    $('#income-goal').addEventListener('input', e => { state.incomeGoal = Math.max(0, Number(e.target.value) || 0); persist(); updateHero(); });
    $('#tpl-text').addEventListener('input', e => {
      const tp = state.templates.find(x => x.id === tplId);
      if (tp) { tp.text = e.target.value; persist(); }
    });
    $('#tpl-reset').addEventListener('click', async () => {
      const d = DEFAULT_TEMPLATES.find(x => x.id === tplId);
      const tp = state.templates.find(x => x.id === tplId);
      if (!d || !tp || !(await ask({ title: `reset "${tp.name}"?`, body: 'it goes back to the default text. your edits to it are replaced.', ok: 'reset' }))) return;
      tp.text = d.text; persist(); $('#tpl-text').value = d.text; toast('reset ✓');
    });
    $('#tpl-del').addEventListener('click', async () => {
      const tp = state.templates.find(x => x.id === tplId);
      if (!tp || !(await ask({ title: `delete "${tp.name}"?`, ok: 'delete', danger: true }))) return;
      state.templates = state.templates.filter(x => x !== tp);
      persist();
      $('#tpl-text').blur();
      renderTemplateList();
    });
  }

  const COLLAB_TABS = ['pipeline', 'messages', 'kit', 'playbook'];

  function renderCollabs() {
    if (!$('#view-collabs').dataset.built) buildCollabs();
    if (!COLLAB_TABS.includes(collabTab)) collabTab = 'pipeline';
    document.querySelectorAll('[data-ctab]').forEach(b => b.classList.toggle('on', b.dataset.ctab === collabTab));
    COLLAB_TABS.forEach(t => { $(`#collab-${t}`).hidden = collabTab !== t; });
    syncProfileInputs();
    renderPipeline();
    renderTemplateList();
  }

  /* ================= lines ================= */
  function renderLines() {
    $('#view-lines').innerHTML = viewHead('lines', 'your signature lines. tap one to copy it.') + `
      <div class="north-star"><span class="label">the goal of every video</span><p>${esc(GOAL_LINE)}</p></div>
      <div class="line-groups">${LINE_CATS.map(cat => `
        <section class="line-group">
          <div class="group-head"><span>${cat.label}</span><span class="count">${state.lines[cat.id].length}</span></div>
          <div class="line-list">${state.lines[cat.id].map((l, i) => `
            <div class="line-row">
              <button class="line-text" data-copy-line="${cat.id}|${i}">“${esc(l)}”</button>
              <button class="icon small" data-del-line="${cat.id}|${i}" aria-label="remove line">×</button>
            </div>`).join('')}
          </div>
          <form class="line-add" data-add-line="${cat.id}">
            <input placeholder="add a line…" aria-label="add a ${esc(cat.label)} line">
            <button class="chip" type="submit">add</button>
          </form>
        </section>`).join('')}
      </div>`;
  }

  function renderDrawer() {
    $('#line-cats').innerHTML = LINE_CATS.map(c => `<button class="chip ${drawerCat === c.id ? 'on' : ''}" data-line-cat="${c.id}">${c.label}</button>`).join('');
    $('#line-chips').innerHTML = state.lines[drawerCat].map((l, i) => `<button class="line-chip" data-insert-line="${drawerCat}|${i}">${esc(l)}</button>`).join('') || '<p class="muted small-text">no lines here yet. add some in the lines tab</p>';
  }

  function insertLine(text) {
    const el = lineTarget === 'hook' ? $('#f-hook') : $('#f-script');
    if (lineTarget === 'hook') {
      el.value = el.value.trim() ? `${el.value.trim()} ${text}` : text;
    } else {
      const pos = typeof el.selectionStart === 'number' ? el.selectionStart : el.value.length;
      const before = el.value.slice(0, pos), after = el.value.slice(pos);
      const pre = before && !before.endsWith('\n') ? '\n' : '';
      const post = after && !after.startsWith('\n') ? '\n' : '';
      el.value = before + pre + text + post + after;
      const np = (before + pre + text).length;
      try { el.setSelectionRange(np, np); } catch (e) { /* ignore */ }
    }
    el.dispatchEvent(new Event('input'));
    toast(`added to your ${lineTarget} ✦`);
  }

  /* ================= home ================= */
  function dayNumber() { const d = new Date(); return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 864e5); }

  function homeTodos() {
    const t = todayStr();
    const out = [];
    const push = (icon, html, attrs, btn) => out.push({ icon, html, attrs, btn });
    const fu = state.collabs.filter(followUpDue);
    if (fu.length) push('💌', fu.length === 1 ? `follow up with <b>${esc(fu[0].brand)}</b>` : `<b>${fu.length} brand follow-ups</b> are due`, fu.length === 1 ? `data-open-collab="${fu[0].id}"` : 'data-view="collabs"', 'open');
    state.collabs.filter(c => c.status === 'talking' && !amountOf(c)).slice(0, 1).forEach(c =>
      push('💬', `<b>${esc(c.brand)}</b> replied. send your rate card`, `data-open-collab="${c.id}"`, 'open'));
    state.collabs.filter(c => c.status === 'booked' && !c.upfrontAt).slice(0, 1).forEach(c =>
      push('💳', `invoice <b>${esc(c.brand)}</b> for the upfront`, `data-open-collab="${c.id}"`, 'open'));
    state.posts.filter(p => p.date === t && p.status !== 'posted').slice(0, 1).forEach(p =>
      push('📅', `<b>${esc(p.title)}</b> is planned for today`, `data-open="${p.id}"`, 'open'));
    const filmed = state.posts.filter(p => p.status === 'filmed').length;
    const scripted = state.posts.filter(p => p.status === 'scripted').length;
    if (filmed) push('✅', `<b>${plural(filmed, 'filmed video')}</b> ready to post`, 'data-view="board"', 'board');
    else if (scripted) push('🎬', `<b>${plural(scripted, 'scripted post')}</b> waiting to be filmed`, 'data-view="board"', 'board');
    const done = batchDone();
    if (done < 4) push('🗓', `this week's batch: <b>${done} of 4</b> blocks done`, 'data-open-modal="batch"', 'plan');
    if (!scripted && !filmed) push('✍️', 'pick one idea to script today', 'data-view="ideas"', 'ideas');
    return out.slice(0, 4);
  }

  function renderHome() {
    const P = state.profile;
    const t = todayStr();
    const hr = new Date().getHours();
    const greet = hr < 12 ? 'good morning' : hr < 18 ? 'good afternoon' : 'good evening';
    const mots = state.motivations;
    const featured = mots.length ? mots[(hypeSeed + dayNumber()) % mots.length] : null;
    const quote = AFFIRMATIONS[hypeSeed % AFFIRMATIONS.length];
    const scriptedNow = state.posts.some(p => p.status === 'scripted');
    const filmedNow = state.posts.some(p => p.status === 'filmed');
    const ctaHint = state.posts.some(p => p.date === t && p.status !== 'posted') ? "opens today's planned video"
      : scriptedNow ? 'opens your next scripted video' : filmedNow ? 'opens a filmed video, ready to post' : 'picks an idea for you to script';

    // this week
    const counts = weekCounts();
    const n = counts[weekStart(t)] || 0, g = state.weeklyGoal, streak = streakWeeks(counts);
    let dots = '';
    for (let i = 0; i < Math.max(g, n); i++) dots += `<span class="dot ${i < n ? 'on' : ''}"></span>`;
    const pays = state.collabs.flatMap(payments);
    const paidMonth = pays.filter(p => p.date.slice(0, 7) === t.slice(0, 7)).reduce((s, p) => s + p.amt, 0);
    const ig = state.incomeGoal;
    // all time, in one quiet line
    const allPosted = state.posts.filter(p => p.status === 'posted').length;
    const pitchedCount = state.collabs.filter(c => c.pitchedAt || ['talking', 'booked', 'paid'].includes(c.status)).length;
    const earnedAll = pays.reduce((s, p) => s + p.amt, 0);
    const wins = [
      allPosted ? plural(allPosted, 'video') + ' posted' : '',
      pitchedCount ? plural(pitchedCount, 'brand') + ' pitched' : '',
      earnedAll ? peso(earnedAll) + ' earned' : '',
    ].filter(Boolean);

    // today: your to-dos + the one thing the app thinks matters most
    const mine = todayTodos();
    const shown = mine.slice(0, 4);
    const nudge = homeTodos()[0];

    const whyCards = mots.map((m, i) => `
            <div class="mot ${i % 3 === 1 ? 'sage' : i % 3 === 2 ? 'plain' : ''} ${editingMot === m.id ? 'editing' : ''}">
              ${editingMot === m.id ? `
              <div class="mot-form">
                <input class="mot-emoji-field" id="edit-mot-emoji" value="${esc(m.emoji || '✨')}" maxlength="4" aria-label="emoji">
                <textarea class="mot-text-field" id="edit-mot-text" rows="2" aria-label="edit dream">${esc(m.text)}</textarea>
                <div class="mot-form-actions">
                  <button class="chip save" data-save-mot="${m.id}">save</button>
                  <button class="chip" data-cancel-mot>cancel</button>
                </div>
              </div>` : `
              <span class="mot-emoji">${esc(m.emoji || '✨')}</span>
              <span class="mot-text">${esc(m.text)}</span>
              <span class="mot-actions">
                <button class="mot-btn" data-mot-menu="${m.id}" aria-label="options for ${esc(m.text)}" aria-expanded="${motMenu === m.id}">${svg(ICON.dots, 16)}</button>
                ${motMenu === m.id ? `<span class="mot-pop" role="menu">
                  <button role="menuitem" data-edit-mot="${m.id}">${svg(ICON.pencil, 14)}edit</button>
                  <button role="menuitem" data-del-mot="${m.id}">${svg(ICON.close, 14)}remove</button>
                </span>` : ''}
              </span>`}
            </div>`).join('');

    $('#view-home').innerHTML = `
      <section class="home-hero">
        <p class="greet">${greet}, ${esc(P.name || 'bestie')} ${hr < 18 ? '☀️' : '🌙'}</p>
        <div class="hype-row">
          <h2 class="hype pop">${esc(quote)}</h2>
          <button class="icon hype-again" data-hype-again aria-label="show another hype line" title="another one">${svg(ICON.refresh, 17)}</button>
        </div>
        ${featured ? `<p class="for-line">today's video is for <span class="for-pill">${esc(featured.emoji || '✨')} ${esc(featured.text)}</span></p>` : ''}
        <button class="cta" data-lets-create title="${ctaHint}">✨ let's create</button>
      </section>

      <section class="home-sec">
        <div class="home-sec-head"><h3>today</h3><button class="link small" data-view="todos">see all →</button></div>
        <div class="today-card">
          ${shown.map(x => `
          <div class="hm-td ${x.star ? 'starred' : ''}">
            <button class="td-check" data-todo-check="${x.id}" aria-label="mark done: ${esc(x.title)}">${svg(ICON.check, 13)}</button>
            <span class="hm-td-title">${esc(x.title)}</span>
            ${x.due < t ? '<span class="td-chip late">overdue</span>' : ''}${x.star ? '<span class="hm-star">★</span>' : ''}
          </div>`).join('')}
          ${mine.length > shown.length ? `<button class="hm-more" data-view="todos">+ ${mine.length - shown.length} more for today</button>` : ''}
          ${!shown.length ? `<p class="hm-empty">${nudge ? 'no to-dos for today.' : 'all caught up ✨ romanticize the rest of your day'}</p>` : ''}
          ${nudge ? `<button class="hm-nudge" ${nudge.attrs}><span class="hm-nudge-icon">${nudge.icon}</span><span class="hm-nudge-text"><span class="label">next up</span><span>${nudge.html}</span></span><span class="hodo-go">→</span></button>` : ''}
        </div>
      </section>

      <section class="home-sec">
        <div class="home-sec-head"><h3>this week</h3></div>
        <div class="week-strip">
          <button class="ws-cell" data-view="board">
            <span class="label">posted</span>
            <b>${n}<span>/${g}</span></b>
            <span class="dots">${dots}</span>
          </button>
          <button class="ws-cell" data-view="collabs">
            <span class="label">earned this month</span>
            <b>${peso(paidMonth)}</b>
            ${ig ? `<span class="goal-bar"><span style="width:${Math.min(100, (paidMonth / ig) * 100)}%"></span></span>` : '<span class="ws-sub">set a goal in collabs</span>'}
          </button>
          <div class="ws-cell">
            <span class="label">streak</span>
            <b>${streak ? `🔥 ${streak}<span> ${streak === 1 ? 'week' : 'weeks'}</span>` : '—'}</b>
            <span class="ws-sub">${streak ? 'keep it going' : n >= g ? 'goal hit 🎉' : `${g - n} more to start one`}</span>
          </div>
        </div>
        <p class="wins-line">${wins.length ? `all time: ${wins.join(' · ')} 🥹` : 'day one energy. every creator you look up to started at zero 🌱'}</p>
      </section>

      <section class="home-sec">
        <div class="home-sec-head"><h3>my why</h3><button class="link small" data-why-edit>${whyEdit ? 'done' : 'edit'}</button></div>
        ${whyEdit ? `
        <div class="mot-grid">
          ${whyCards}
          <form class="mot add" id="mot-add" autocomplete="off">
            <input id="mot-emoji" class="mot-emoji-in" maxlength="4" placeholder="✨" aria-label="emoji">
            <input id="mot-text" placeholder="+ add another dream…" aria-label="add a dream">
            <button type="submit" class="chip">add</button>
          </form>
        </div>` : `
        <div class="why-row">
          ${mots.map(m => `<button class="why-chip ${featured && m.id === featured.id ? 'today' : ''}" data-why-edit>${esc(m.emoji || '✨')} ${esc(m.text)}</button>`).join('') || '<button class="why-chip add" data-why-edit>+ add your first dream</button>'}
        </div>`}
      </section>

      <p class="home-goal">${esc(GOAL_LINE)}</p>`;
    const editText = $('#edit-mot-text');
    if (editText) { autoGrow(editText); editText.focus({ preventScroll: true }); editText.setSelectionRange(editText.value.length, editText.value.length); }
  }

  function letsCreate() {
    const t = todayStr();
    const today = state.posts.find(p => p.date === t && p.status !== 'posted');
    const scripted = state.posts.filter(p => p.status === 'scripted').sort(sorter('scripted'))[0];
    const filmed = state.posts.filter(p => p.status === 'filmed').sort(sorter('filmed'))[0];
    if (today) { openPanel(today.id); toast("today's the day. you've got this 🎬"); return; }
    if (scripted) { openPanel(scripted.id); toast("it's scripted. now we film! 🎬"); return; }
    if (filmed) { openPanel(filmed.id); toast('already filmed? post it, bestie ✅'); return; }
    const ideas = state.posts.filter(p => p.status === 'idea');
    if (!ideas.length) { $('#quick-input').focus(); toast('drop your first idea up top ✨'); return; }
    const p = ideas[Math.floor(Math.random() * ideas.length)];
    openPanel(p.id);
    toast("this one's yours today. kaya mo 'to 💪");
  }

  // a little celebration 🎉
  function confetti() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const colors = ['#F8C8DC', '#B7CBB0', '#C4648F', '#EFF4ED', '#FDEEF4'];
    const box = document.createElement('div');
    box.className = 'confetti';
    for (let i = 0; i < 70; i++) {
      const s = document.createElement('i');
      s.style.left = Math.random() * 100 + 'vw';
      s.style.background = colors[i % colors.length];
      s.style.animationDelay = Math.random() * 0.35 + 's';
      s.style.animationDuration = 1.4 + Math.random() * 1.1 + 's';
      s.style.transform = `rotate(${Math.random() * 360}deg)`;
      if (i % 3 === 0) s.style.borderRadius = '50%';
      box.appendChild(s);
    }
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 3000);
  }

  /* ================= to-dos ================= */
  let editingTodo = null, todoFilter = 'all', focusTodoTitle = false;
  let todoMode = 'list', todoCalMonth = todayStr().slice(0, 7), todoSelDay = todayStr();
  let todoWeek = weekStart(todayStr());
  try { const m = localStorage.getItem(KEY + ':todoMode'); if (m === 'calendar' || m === 'week') todoMode = m; } catch (e) { /* ignore */ }

  const todayTodos = () => state.todos
    .filter(t => !t.done && t.due && t.due <= todayStr())
    .sort((a, b) => (b.star - a.star) || a.due.localeCompare(b.due) || a.createdAt.localeCompare(b.createdAt));

  // "film the hook tomorrow ! #content" → title + date + ⭐ + list
  function parseTodo(raw) {
    let text = ` ${raw} `;
    let due = '', star = false, list = '';
    const t = todayStr();
    const take = (re, fn) => { text = text.replace(re, (...m) => { fn(...m); return ' '; }); };
    take(/\s!+(?=\s)/g, () => { star = true; });
    take(/\s#(\w+)(?=\s)/gi, (m, tag) => {
      const hit = TODO_LISTS.find(([id]) => id.startsWith(tag.toLowerCase()) || tag.toLowerCase().startsWith(id));
      if (hit && !list) list = hit[0];
    });
    take(/\s(today|tonight|ngayon|mamaya)(?=\s)/gi, () => { due = t; });
    take(/\s(tomorrow|tmrw|tmr|bukas)(?=\s)/gi, () => { due = addDays(t, 1); });
    take(/\snext week(?=\s)/gi, () => { due = addDays(weekStart(t), 7); });
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    take(/\s(?:on\s)?(sun|mon|tue|tues|wed|thu|thur|thurs|fri|sat)(?:day|nesday|sday|urday|rsday)?(?=\s)/gi, (m, d) => {
      const target = days.indexOf(d.slice(0, 3).toLowerCase());
      const now = parseYmd(t).getDay();
      due = addDays(t, (target - now + 7) % 7);
    });
    return { title: text.replace(/\s+/g, ' ').trim(), due, star, list };
  }

  function addTodo(raw, defaultDue = '') {
    const p = parseTodo(raw);
    if (!p.title) return null;
    if (!p.due && defaultDue) p.due = defaultDue;
    if (!p.list && todoFilter !== 'all') p.list = todoFilter;
    const todo = mkTodo(p);
    state.todos.unshift(todo);
    persist();
    return todo;
  }

  function nextRepeat(t) {
    const base = maxDate(t.due || todayStr(), todayStr());
    if (t.repeat === 'daily') return addDays(base, 1);
    if (t.repeat === 'weekly') return addDays(base, 7);
    const d = parseYmd(base); d.setMonth(d.getMonth() + 1); return ymd(d);
  }

  function toggleTodo(id) {
    const t = state.todos.find(x => x.id === id);
    if (!t) return;
    const hadOpenToday = todayTodos().length;
    t.done = !t.done;
    t.doneAt = t.done ? new Date().toISOString() : '';
    let spawned = null;
    if (t.done && t.repeat) {
      spawned = mkTodo({ title: t.title, list: t.list, star: t.star, repeat: t.repeat, notes: t.notes, due: nextRepeat(t) });
      state.todos.unshift(spawned);
      t.repeat = ''; // the finished one stays in "done"; the repeat lives on in the new one
    }
    persist();
    const row = document.querySelector(`.td[data-todo="${id}"]`);
    if (row && t.done) row.classList.add('checking');
    setTimeout(() => { renderTodosIfOpen(); if (view === 'home') renderHome(); renderNudge(); }, t.done && row ? 320 : 0);
    if (!t.done) { toast('back on your list'); return; }
    if (hadOpenToday && !todayTodos().length) { confetti(); toast("all done for today! you're amazing 🎉"); return; }
    toast(spawned ? `done ✓ next one ${fmtDate(spawned.due)} 🔁` : 'done ✓', {
      label: 'undo',
      fn: () => {
        t.done = false; t.doneAt = '';
        if (spawned) { t.repeat = spawned.repeat; state.todos = state.todos.filter(x => x !== spawned); }
        persist(); renderTodosIfOpen(); if (view === 'home') renderHome();
      },
    });
  }

  function deleteTodo(id) {
    const i = state.todos.findIndex(x => x.id === id);
    if (i < 0) return;
    const [t] = state.todos.splice(i, 1);
    editingTodo = null;
    persist(); renderTodosIfOpen(); if (view === 'home') renderHome();
    toast(`deleted "${t.title.length > 30 ? t.title.slice(0, 30) + '…' : t.title}"`, {
      label: 'undo', fn: () => { state.todos.splice(i, 0, t); persist(); renderTodosIfOpen(); },
    });
  }

  const renderTodosIfOpen = () => { if (view === 'todos') renderTodos(); };

  function dueChip(t) {
    if (!t.due) return '';
    const today = todayStr();
    const cls = !t.done && t.due < today ? 'late' : t.due === today ? 'today' : '';
    const label = !t.done && t.due < today ? `overdue · ${fmtDate(t.due)}` : fmtDate(t.due);
    return `<span class="td-chip ${cls}">${svg(ICON.calendar, 11)}${label}</span>`;
  }

  function todoRow(t) {
    const L = TODO_LIST[t.list];
    const meta = [
      dueChip(t),
      L ? `<span class="td-chip list" style="--lc:${L.color}">${L.icon} ${L.label}</span>` : '',
      t.repeat ? `<span class="td-chip">🔁 ${t.repeat}</span>` : '',
      t.notes.trim() ? `<span class="td-chip">📝 note</span>` : '',
    ].join('');
    const editing = editingTodo === t.id;
    return `<div class="td ${t.done ? 'done' : ''} ${editing ? 'editing' : ''} ${t.star && !t.done ? 'starred' : ''}" data-todo="${t.id}">
      <div class="td-line">
        <button class="td-check" data-todo-check="${t.id}" aria-label="${t.done ? 'mark not done' : 'mark done'}: ${esc(t.title)}">${svg(ICON.check, 13)}</button>
        <button class="td-main" data-todo-edit="${t.id}" aria-label="edit ${esc(t.title)}">
          <span class="td-title">${esc(t.title)}</span>
          ${meta ? `<span class="td-meta">${meta}</span>` : ''}
        </button>
        <button class="td-star ${t.star ? 'on' : ''}" data-todo-star="${t.id}" aria-label="${t.star ? 'unmark' : 'mark'} important" title="important">${t.star ? '★' : '☆'}</button>
      </div>
      ${editing ? `
      <div class="td-editor">
        <input class="td-in" id="td-title" value="${esc(t.title)}" aria-label="to-do">
        <div class="td-ed-row">
          <span class="label">when</span>
          <div class="pillars">
            <button class="chip ${t.due === todayStr() ? 'on' : ''}" data-todo-due="${t.id}|today">today</button>
            <button class="chip ${t.due === addDays(todayStr(), 1) ? 'on' : ''}" data-todo-due="${t.id}|tomorrow">tomorrow</button>
            <button class="chip ${t.due === addDays(weekStart(todayStr()), 7) ? 'on' : ''}" data-todo-due="${t.id}|nextweek">next week</button>
            <button class="chip ${!t.due ? 'on' : ''}" data-todo-due="${t.id}|none">someday</button>
            <input type="date" class="td-date" id="td-due" value="${t.due}" aria-label="pick a date">
          </div>
        </div>
        <div class="td-ed-row">
          <span class="label">list</span>
          <div class="pillars">${TODO_LISTS.map(([id, icon, label]) => `<button class="chip ${t.list === id ? 'on' : ''}" data-todo-list="${t.id}|${id}">${icon} ${label}</button>`).join('')}</div>
        </div>
        <div class="td-ed-row">
          <span class="label">repeat</span>
          <div class="pillars">${[['', 'never'], ['daily', 'every day'], ['weekly', 'every week'], ['monthly', 'every month']].map(([id, label]) => `<button class="chip ${t.repeat === id ? 'on' : ''}" data-todo-repeat="${t.id}|${id}">${label}</button>`).join('')}</div>
        </div>
        <textarea class="td-in td-notes" id="td-notes" rows="2" placeholder="notes, links, details…" aria-label="notes">${esc(t.notes)}</textarea>
        <div class="td-ed-foot">
          <button class="danger" data-todo-del="${t.id}">delete</button>
          <button class="chip save" data-todo-close>done editing</button>
        </div>
      </div>` : ''}
    </div>`;
  }

  function renderTodos() {
    const el = $('#view-todos');
    const t = todayStr();
    const inFilter = x => todoFilter === 'all' || x.list === todoFilter;
    const open = state.todos.filter(x => !x.done && inFilter(x));
    const today = open.filter(x => x.due && x.due <= t)
      .sort((a, b) => (b.star - a.star) || a.due.localeCompare(b.due) || a.createdAt.localeCompare(b.createdAt));
    const upcoming = open.filter(x => x.due && x.due > t)
      .sort((a, b) => a.due.localeCompare(b.due) || (b.star - a.star));
    const someday = open.filter(x => !x.due).sort((a, b) => (b.star - a.star) || b.createdAt.localeCompare(a.createdAt));
    const done = state.todos.filter(x => x.done && inFilter(x)).sort((a, b) => b.doneAt.localeCompare(a.doneAt));
    const doneToday = state.todos.filter(x => x.done && x.doneAt && ymd(new Date(x.doneAt)) === t).length;
    const totalToday = doneToday + state.todos.filter(x => !x.done && x.due && x.due <= t).length;
    const pct = totalToday ? Math.round((doneToday / totalToday) * 100) : 0;

    // upcoming grouped by day
    const groups = [];
    upcoming.forEach(x => { const g = groups[groups.length - 1]; if (g && g.d === x.due) g.items.push(x); else groups.push({ d: x.due, items: [x] }); });
    const dayLabel = d => {
      const name = parseYmd(d).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      return d === addDays(t, 1) ? `tomorrow · ${name}` : `${name} · ${fmtDate(d, false)}`;
    };

    const counts = Object.fromEntries(TODO_LISTS.map(([id]) => [id, state.todos.filter(x => !x.done && x.list === id).length]));
    el.innerHTML = viewHead('to-dos', 'little steps, big dreams. type in the bar up top to add one.',
      `<div class="seg-switch" role="tablist">
        <button class="${todoMode === 'list' ? 'on' : ''}" data-todo-mode="list">list</button>
        <button class="${todoMode === 'week' ? 'on' : ''}" data-todo-mode="week">week</button>
        <button class="${todoMode === 'calendar' ? 'on' : ''}" data-todo-mode="calendar">month</button>
      </div>`) + `
      <div class="td-hero">
        <div class="td-ring" style="--p:${pct}">
          <span>${totalToday ? `${doneToday}/${totalToday}` : '✨'}</span>
        </div>
        <div class="td-hero-text">
          <b>${!totalToday ? 'nothing due today' : doneToday === totalToday ? 'all done for today 🎉' : `${totalToday - doneToday} left for today`}</b>
          <span>${!totalToday ? 'plan tomorrow, or enjoy the free time 🌷' : doneToday === totalToday ? 'proud of you. rest is productive too.' : doneToday ? "you're on a roll. keep going 💪" : 'one at a time, bestie. start with the ⭐ ones.'}</span>
        </div>
      </div>
      <p class="td-tip">try typing: <code>film hook tomorrow !</code> · <code>send pitch to Notion fri #collabs</code> · <code>pay bills bukas #life</code></p>
      <div class="filters td-filters">
        <button class="chip ${todoFilter === 'all' ? 'on' : ''}" data-todo-filter="all">all</button>
        ${TODO_LISTS.map(([id, icon, label]) => `<button class="chip ${todoFilter === id ? 'on' : ''}" data-todo-filter="${id}">${icon} ${label}${counts[id] ? ` <span class="n">${counts[id]}</span>` : ''}</button>`).join('')}
      </div>

      <div id="td-body">
      <section class="td-sec">
        <div class="td-sec-head"><h3>today</h3><span class="count">${today.length}</span></div>
        ${today.map(todoRow).join('') || `<p class="td-empty">${doneToday ? 'cleared! 🎉' : 'nothing for today. add one with "today" in it ✍️'}</p>`}
      </section>

      <section class="td-sec">
        <div class="td-sec-head"><h3>upcoming</h3><span class="count">${upcoming.length}</span></div>
        ${groups.map(g => `<p class="td-day">${dayLabel(g.d)}</p>${g.items.map(todoRow).join('')}`).join('') || '<p class="td-empty">nothing scheduled. add a date like "fri" or "next week".</p>'}
      </section>

      <section class="td-sec">
        <div class="td-sec-head"><h3>someday</h3><span class="count">${someday.length}</span></div>
        ${someday.map(todoRow).join('') || '<p class="td-empty">no someday to-dos.</p>'}
      </section>

      ${done.length ? `
      <details class="td-sec td-done" ${editingTodo && done.some(x => x.id === editingTodo) ? 'open' : ''}>
        <summary class="td-sec-head"><h3>done</h3><span class="count">${done.length}</span><span class="chev" aria-hidden="true">›</span></summary>
        ${done.slice(0, 30).map(todoRow).join('')}
        <button class="link small td-clear" data-todo-clear>clear done to-dos</button>
      </details>` : ''}
      </div>`;
    if (todoMode === 'calendar') $('#td-body').innerHTML = todoCalendarHTML();
    if (todoMode === 'week') $('#td-body').innerHTML = todoWeekHTML();
    if (view === 'todos') {
      $('#quick-input').placeholder = todoMode !== 'list'
        ? `add a to-do for ${todoSelDay === todayStr() ? 'today' : fmtDate(todoSelDay, false)}…`
        : (window.matchMedia('(max-width: 700px)').matches ? 'add a to-do…' : 'add a to-do… (try “tomorrow”, “fri”, “!” for important, #work)');
    }

    const ti = $('#td-title');
    if (ti && focusTodoTitle) { focusTodoTitle = false; ti.focus({ preventScroll: true }); ti.setSelectionRange(ti.value.length, ti.value.length); }
    const tn = $('#td-notes');
    if (tn) autoGrow(tn);
  }

  function todoCalendarHTML() {
    const t = todayStr();
    const [y, m] = todoCalMonth.split('-').map(Number);
    const first = `${todoCalMonth}-01`;
    const last = ymd(new Date(y, m, 0));
    const start = weekStart(first);
    const end = addDays(weekStart(last), 6);
    const lastRowStart = addDays(end, -6);
    const inFilter = x => todoFilter === 'all' || x.list === todoFilter;
    const byDate = {};
    state.todos.filter(x => x.due && inFilter(x)).forEach(x => (byDate[x.due] = byDate[x.due] || []).push(x));
    Object.values(byDate).forEach(a => a.sort((p, q) => (p.done - q.done) || (q.star - p.star) || p.createdAt.localeCompare(q.createdAt)));

    const chip = x => {
      const L = TODO_LIST[x.list];
      return `<div class="tdc ${x.done ? 'done' : ''} ${!x.done && x.due < t ? 'late' : ''} ${x.star && !x.done ? 'star' : ''}" data-tdc="${x.id}" style="--lc:${L ? L.color : 'var(--line-2)'}" title="${esc(x.title)}">
        <button class="tdc-check" data-todo-check="${x.id}" aria-label="${x.done ? 'mark not done' : 'mark done'}: ${esc(x.title)}">${svg(ICON.check, 9)}</button>
        <span class="tdc-title">${x.star && !x.done ? '★ ' : ''}${esc(x.title)}</span>
      </div>`;
    };
    let cells = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(d => `<div class="dow">${d}</div>`).join('');
    for (let d = start; d <= end; d = addDays(d, 1)) {
      const items = byDate[d] || [];
      const open = items.filter(x => !x.done).length;
      cells += `<div class="day td-cday ${d.slice(0, 7) === todoCalMonth ? '' : 'out'} ${d === t ? 'today' : ''} ${d === todoSelDay ? 'selected' : ''} ${d >= lastRowStart ? 'lastrow' : ''}" data-tdday="${d}">
        <span class="num">${Number(d.slice(8))}</span>
        ${items.slice(0, 4).map(chip).join('')}
        ${items.length > 4 ? `<span class="tdc-more">+${items.length - 4} more</span>` : ''}
        ${items.length ? `<span class="tdc-dots" aria-hidden="true">${items.slice(0, 5).map(x => `<i class="${x.done ? 'done' : ''}" style="background:${TODO_LIST[x.list] ? TODO_LIST[x.list].color : 'var(--grey-2)'}"></i>`).join('')}</span>` : ''}
        ${open && d < t ? '<span class="tdc-late-dot" aria-hidden="true"></span>' : ''}
      </div>`;
    }

    const dayItems = (byDate[todoSelDay] || []);
    const overdue = todoSelDay === t ? state.todos.filter(x => !x.done && x.due && x.due < t && inFilter(x)) : [];
    const someday = state.todos.filter(x => !x.done && !x.due && inFilter(x)).length;
    const name = parseYmd(todoSelDay).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const label = new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toLowerCase();
    return `
      <section class="td-sec">
        <div class="tdcal-head">
          <h3>${label}</h3>
          <div class="cal-nav">
            <button class="icon" data-tdcal="-1" aria-label="previous month">‹</button>
            <button class="ghost small" data-tdcal="0">today</button>
            <button class="icon" data-tdcal="1" aria-label="next month">›</button>
          </div>
        </div>
        <div class="cal-grid td-cal">${cells}</div>
        <p class="td-cal-hint">tap a day to see its to-dos and add to it · drag a to-do to move it</p>
      </section>
      ${todoDayViewHTML()}`;
  }

  function todoDayViewHTML() {
    const t = todayStr();
    const inFilter = x => todoFilter === 'all' || x.list === todoFilter;
    const dayItems = state.todos.filter(x => x.due === todoSelDay && inFilter(x))
      .sort((p, q) => (p.done - q.done) || (q.star - p.star) || p.createdAt.localeCompare(q.createdAt));
    const overdue = todoSelDay === t ? state.todos.filter(x => !x.done && x.due && x.due < t && inFilter(x)) : [];
    const someday = state.todos.filter(x => !x.done && !x.due && inFilter(x)).length;
    const name = parseYmd(todoSelDay).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    return `
      <section class="td-sec td-dayview">
        <div class="td-sec-head"><h3>${todoSelDay === t ? 'today' : todoSelDay === addDays(t, 1) ? 'tomorrow' : name} · ${fmtDate(todoSelDay, false)}</h3><span class="count">${dayItems.filter(x => !x.done).length}</span></div>
        ${overdue.length ? `<p class="td-day">overdue</p>${overdue.map(todoRow).join('')}<p class="td-day">today</p>` : ''}
        ${dayItems.map(todoRow).join('') || `<p class="td-empty">nothing on this day yet. type in the bar up top to add one ✍️</p>`}
        ${someday ? `<button class="link small td-someday" data-todo-mode="list">${plural(someday, 'someday to-do')} without a date →</button>` : ''}
      </section>`;
  }

  function todoWeekHTML() {
    const t = todayStr();
    const inFilter = x => todoFilter === 'all' || x.list === todoFilter;
    const days = [0, 1, 2, 3, 4, 5, 6].map(i => addDays(todoWeek, i));
    const fmtShort = d => parseYmd(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toLowerCase();
    const label = todoWeek === weekStart(t) ? 'this week' : todoWeek === addDays(weekStart(t), 7) ? 'next week' : todoWeek === addDays(weekStart(t), -7) ? 'last week' : 'week';
    const openWeek = days.reduce((s, d) => s + state.todos.filter(x => !x.done && x.due === d && inFilter(x)).length, 0);
    const doneWeek = days.reduce((s, d) => s + state.todos.filter(x => x.done && x.due === d && inFilter(x)).length, 0);
    const cols = days.map(d => {
      const items = state.todos.filter(x => x.due === d && inFilter(x))
        .sort((p, q) => (p.done - q.done) || (q.star - p.star) || p.createdAt.localeCompare(q.createdAt));
      const dn = parseYmd(d);
      return `<div class="day td-wday ${d === t ? 'today' : ''} ${d === todoSelDay ? 'selected' : ''} ${d < t ? 'past' : ''}" data-tdday="${d}">
        <div class="wd-head">
          <span class="wd-name">${dn.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase()}</span>
          <span class="wd-num">${dn.getDate()}</span>
          ${items.filter(x => !x.done).length ? `<span class="wd-count">${items.filter(x => !x.done).length}</span>` : ''}
        </div>
        <div class="wd-list">
          ${items.map(x => {
            const L = TODO_LIST[x.list];
            return `<div class="tdc wk ${x.done ? 'done' : ''} ${!x.done && x.due < t ? 'late' : ''} ${x.star && !x.done ? 'star' : ''}" data-tdc="${x.id}" style="--lc:${L ? L.color : 'var(--line-2)'}">
              <button class="tdc-check" data-todo-check="${x.id}" aria-label="${x.done ? 'mark not done' : 'mark done'}: ${esc(x.title)}">${svg(ICON.check, 9)}</button>
              <span class="tdc-title">${x.star && !x.done ? '★ ' : ''}${esc(x.title)}</span>
            </div>`;
          }).join('')}
        </div>
        <span class="wd-add">+ add</span>
      </div>`;
    }).join('');
    return `
      <section class="td-sec">
        <div class="tdcal-head">
          <h3>${label} <span class="wk-range">${fmtShort(days[0])} – ${fmtShort(days[6])}</span></h3>
          <div class="cal-nav">
            <button class="icon" data-tdweek="-1" aria-label="previous week">‹</button>
            <button class="ghost small" data-tdweek="0">this week</button>
            <button class="icon" data-tdweek="1" aria-label="next week">›</button>
          </div>
        </div>
        <p class="wk-sum">${openWeek + doneWeek ? `${doneWeek} of ${openWeek + doneWeek} done this week${doneWeek && !openWeek ? ' 🎉' : ''}` : 'a fresh week. what do you want to get done?'}</p>
        <div class="td-week">${cols}</div>
        <p class="td-cal-hint">tap a day to add to it · drag to-dos between days</p>
      </section>
      ${todoDayViewHTML()}`;
  }

  function editTodoField(id, fn) {
    const t = state.todos.find(x => x.id === id);
    if (!t) return;
    fn(t);
    persist();
    renderTodos();
  }

  /* ================= render all ================= */
  function renderView() {
    renderNav();
    renderNudge();
    VIEWS.forEach(v => { $(`#view-${v}`).hidden = v !== view; });
    const narrow = window.matchMedia('(max-width: 700px)').matches;
    $('#quick-input').placeholder = view === 'collabs'
      ? (narrow ? 'add a brand…' : 'add a brand you want to work with…')
      : view === 'todos'
        ? (narrow ? 'add a to-do…' : 'add a to-do… (try “tomorrow”, “fri”, “!” for important, #work)')
        : (narrow || !PERSONAL.QUICK_HINT ? 'add an idea…' : `add an idea… (${PERSONAL.QUICK_HINT})`);
    if (view === 'home') renderHome();
    if (view === 'todos') renderTodos();
    if (view === 'board') renderBoard();
    if (view === 'calendar') renderCalendar();
    if (view === 'ideas') renderIdeas();
    if (view === 'collabs') renderCollabs();
    if (view === 'lines') renderLines();
  }

  function renderAll() {
    renderWeek();
    renderMenu();
    renderView();
  }

  let renderTimer;
  const scheduleRender = () => { clearTimeout(renderTimer); renderTimer = setTimeout(renderAll, 250); };

  function autoGrow(el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }

  function slideIn(panel) {
    $('#scrim').hidden = false;
    panel.setAttribute('aria-hidden', 'false');
    $('.panel-body', panel).scrollTop = 0;
    void panel.offsetWidth; // force layout so the slide-in transition runs
    panel.classList.add('open');
    document.body.classList.add('panel-open');
  }
  function slideOut(panel) {
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    if (document.activeElement && panel.contains(document.activeElement)) document.activeElement.blur();
    $('#scrim').hidden = true;
    document.body.classList.remove('panel-open');
  }

  /* ================= post panel ================= */
  const FIELDS = {
    title: '#f-title', insteadOf: '#f-instead', tryAngle: '#f-try', outline: '#f-outline',
    hook: '#f-hook', script: '#f-script', date: '#f-date', notes: '#f-notes', brand: '#f-brand',
  };

  function fillPanel(p) {
    Object.entries(FIELDS).forEach(([k, sel]) => { const el = $(sel); if (el.value !== p[k]) el.value = p[k]; });
    autoGrow($('#f-title'));
    $('#f-status').innerHTML = STATUSES.map(s =>
      `<button class="${p.status === s.id ? 'on' : ''}" data-set-status="${s.id}">${s.emoji}<span>${s.label}</span></button>`).join('');
    renderPillarPicker(p);
    renderNoteLink(p);
    renderSponsor(p);
    renderFormat(p);
    $('#posted-row').hidden = p.status !== 'posted';
    $('#f-posted').value = p.postedAt || '';
    $('#f-meta').textContent = `added ${fmtDate(p.createdAt.slice(0, 10))}`;
  }

  function renderFormat(p) {
    $('#f-format').innerHTML = FORMATS.map(([id, icon, label]) =>
      `<button class="chip ${p.format === id ? 'on' : ''}" data-format="${id}">${icon} ${label}</button>`).join('');
  }

  function renderSponsor(p) {
    $('#f-sponsor').innerHTML = SPONSOR_TYPES.map(([v, l]) => `<button class="chip ${p.sponsor === v ? 'on' : ''}" data-sponsor="${v}">${l}</button>`).join('');
    $('#f-sponsor-box').hidden = !p.sponsor;
    $('#f-disclose').innerHTML = DISCLOSE_ITEMS.map(([k, l]) =>
      `<label class="check"><input type="checkbox" data-disclose="${k}" ${p.disclosed[k] ? 'checked' : ''}><span>${esc(l)}</span></label>`).join('');
  }

  function renderPillarPicker(p) {
    $('#f-pillar').innerHTML = state.pillars.map(x =>
      `<button class="chip ${p.pillar === x ? 'on' : ''}" data-pillar="${esc(x)}">${esc(x)}</button>`).join('') +
      '<button class="chip ghost-chip" id="add-pillar-btn" title="add a new series">+ series</button>';
    $('#f-tagline').textContent = state.taglines[p.pillar] || '';
  }

  function renderNoteLink(p) {
    const m = p.notes.match(/https?:\/\/[^\s<>"]+/);
    $('#note-link').innerHTML = m ? `<a href="${esc(m[0])}" target="_blank" rel="noopener">open link ↗</a>` : '';
  }

  const savedTimers = {};
  function markSaved(sel = '#saved-label') {
    const l = $(sel);
    l.textContent = 'saved ✓';
    clearTimeout(savedTimers[sel]);
    savedTimers[sel] = setTimeout(() => { l.textContent = 'autosaves as you type'; }, 1400);
  }

  function openPanel(id, focusTitle = false) {
    const p = find(id);
    if (!p) return;
    if (openCid) closeCollab();
    closeMenu();
    openId = id;
    lineTarget = 'script';
    drawerCat = SERIES_LINE_CAT[p.pillar] || 'transitions';
    $('#line-drawer').hidden = true;
    fillPanel(p);
    slideIn($('#panel'));
    autoGrow($('#f-title'));
    if (focusTitle || !p.title) $('#f-title').focus({ preventScroll: true });
  }

  function closePanel() {
    if (!openId) return;
    const p = find(openId);
    openId = null;
    slideOut($('#panel'));
    if (p && !p.title.trim()) {
      state.posts = state.posts.filter(x => x !== p);
      persist();
      toast('no title, so it was not kept');
    }
    renderAll();
  }

  Object.entries(FIELDS).forEach(([k, sel]) => {
    const el = $(sel);
    const handler = () => {
      const p = find(openId);
      if (!p || p[k] === el.value) return;
      p[k] = el.value;
      p.isExample = false;
      touch(p);
      persist();
      markSaved();
      if (k === 'title') autoGrow(el);
      if (k === 'notes') renderNoteLink(p);
      scheduleRender();
    };
    el.addEventListener('input', handler);
    el.addEventListener('change', handler);
  });
  $('#f-title').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('#f-instead').focus(); } });
  $('#f-hook').addEventListener('focus', () => { lineTarget = 'hook'; });
  $('#f-script').addEventListener('focus', () => { lineTarget = 'script'; });

  $('#f-posted').addEventListener('change', e => {
    const p = find(openId);
    if (!p || !isDate(e.target.value)) { if (p) e.target.value = p.postedAt; return; }
    p.postedAt = e.target.value; touch(p); persist(); markSaved(); scheduleRender();
  });

  $('#clear-date').addEventListener('click', () => {
    const p = find(openId);
    if (!p) return;
    p.date = ''; $('#f-date').value = ''; touch(p); persist(); markSaved(); renderAll();
  });

  $('#delete-post').addEventListener('click', async () => {
    const p = find(openId);
    if (!p) return;
    if (!(await ask({ title: `delete "${p.title || 'untitled'}"?`, body: "this can't be undone.", ok: 'delete', danger: true }))) return;
    state.posts = state.posts.filter(x => x !== p);
    persist();
    openId = null;
    slideOut($('#panel'));
    renderAll();
    toast('deleted');
  });

  $('#panel-close').addEventListener('click', closePanel);
  $('#panel-helper').addEventListener('click', () => { if (openId) openHelper(openId); });
  $('#lines-toggle').addEventListener('click', () => {
    const d = $('#line-drawer');
    d.hidden = !d.hidden;
    $('#lines-toggle').classList.toggle('on', !d.hidden);
    if (!d.hidden) renderDrawer();
  });

  function addPillarInline() {
    const btn = $('#add-pillar-btn');
    const input = document.createElement('input');
    input.className = 'chip-input';
    input.placeholder = 'new series';
    input.setAttribute('aria-label', 'new series name');
    btn.replaceWith(input);
    input.focus();
    let finished = false;
    const done = save => {
      if (finished) return;
      finished = true;
      const name = input.value.trim();
      const p = find(openId);
      if (save && name && p) {
        let existing = state.pillars.find(x => x.toLowerCase() === name.toLowerCase());
        if (!existing) { state.pillars.push(name); existing = name; toast(`added series: ${name}`); }
        p.pillar = existing; touch(p); persist(); renderAll();
      }
      if (p) renderPillarPicker(p);
    };
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); done(true); }
      if (e.key === 'Escape') { e.stopPropagation(); done(false); }
    });
    input.addEventListener('blur', () => done(true));
  }

  /* ================= collab panel ================= */
  const CFIELDS = {
    brand: '#c-brand', product: '#c-product', hook: '#c-hook', why: '#c-why',
    contactName: '#c-contactName', contact: '#c-contact',
    amount: '#c-amount', deliverables: '#c-deliverables', followUp: '#c-followUp', due: '#c-due', notes: '#c-notes',
    invoiceNo: '#c-invoiceNo', invoiceDue: '#c-invoiceDue', foundVia: '#c-foundVia',
  };

  function renderPay(c) {
    const show = c.status === 'booked' || c.status === 'paid';
    $('#c-pay-sec').hidden = !show;
    $('#c-cal').innerHTML = show
      ? `<button class="ghost small" data-collab-post="${c.id}">${linkedPost(c) ? '🎬 open its post' : '＋ add to my content calendar'}</button>
         ${linkedPost(c) ? '' : '<span class="muted small-text">adds a sponsored post on the due date, with a disclosure checklist</span>'}`
      : '';
    if (!show) { $('#c-pay').innerHTML = ''; return; }
    const a = amountOf(c), up = upfrontAmt(c);
    const amt = v => (a ? ` · ${peso(v)}` : '');
    $('#c-pay').innerHTML = `
      <div class="pillars">
        <button class="chip ${c.terms !== 'full' ? 'on' : ''}" data-terms="50-50">50% upfront, 50% after posting</button>
        <button class="chip ${c.terms === 'full' ? 'on' : ''}" data-terms="full">100% upfront</button>
      </div>
      <div class="pay-rows">
        <label class="check"><input type="checkbox" data-pay="${c.id}|upfront" ${c.upfrontAt ? 'checked' : ''}><span>${c.terms === 'full' ? 'full payment' : 'upfront'} received${amt(up)}${c.upfrontAt ? ` <em>${fmtDate(c.upfrontAt)}</em>` : ''}</span></label>
        ${c.terms === 'full' ? '' : `<label class="check"><input type="checkbox" data-pay="${c.id}|balance" ${c.balanceAt ? 'checked' : ''}><span>balance received${amt(a - up)}${c.balanceAt ? ` <em>${fmtDate(c.balanceAt)}</em>` : ''}</span></label>`}
      </div>
      ${!c.upfrontAt ? '<p class="warn">don\'t post anything sponsored until the upfront lands 🙅‍♀️</p>' : ''}
      <label class="check"><input type="checkbox" data-ph="${c.id}" ${c.ph ? 'checked' : ''}><span>PH brand (they may withhold EWT)</span></label>
      ${c.ph ? `<label class="check sub"><input type="checkbox" data-got2307="${c.id}" ${c.got2307 ? 'checked' : ''}><span>BIR Form 2307 received</span></label>` : ''}`;
  }

  function renderPlan(c) {
    const el = $('#c-plan');
    if (c.status === 'pitch') {
      el.innerHTML = '<p class="tip">✉️ send on <b>Tue to Thu, 9 to 11 AM</b> their time. lead with your proof, tie the ask to their product, and keep prices out of the first email. move it to 📨 pitched once it\'s sent.</p>';
      return;
    }
    if (c.status !== 'pitched' || !c.pitchedAt) { el.innerHTML = ''; return; }
    const t = todayStr();
    const d4 = c.followStep === 0 && c.followUp ? c.followUp : addDays(c.pitchedAt, 4);
    const d10 = c.followStep === 1 && c.followUp ? c.followUp : addDays(c.pitchedAt, 10);
    const state4 = c.followStep >= 1 ? 'done' : (d4 <= t ? 'due' : '');
    const state10 = c.followStep >= 2 ? 'done' : (c.followStep === 1 && d10 <= t ? 'due' : '');
    const step = (cls, when, what) => `<div class="plan-step ${cls}"><i></i><span class="when">${when}</span><span>${what}</span></div>`;
    el.innerHTML = `<div class="plan">
      <p class="section-label">follow-up plan</p>
      ${step('done', `pitched ${fmtDate(c.pitchedAt)}`, 'first pitch sent')}
      ${step(state4, fmtDate(d4), 'short follow-up')}
      ${step(state10, fmtDate(d10), 'last nudge + one concept, then stop')}
      ${c.followStep < 2 ? `<div class="plan-actions">
        <button class="chip" data-copy-tpl="${c.followStep === 0 ? 'followup' : 'nudge'}" data-cid="${c.id}">copy ${c.followStep === 0 ? 'follow-up' : 'last nudge'}</button>
        <button class="chip" data-follow-sent="${c.id}">mark ${c.followStep === 0 ? 'follow-up' : 'last nudge'} sent</button>
      </div>` : '<p class="muted small-text">all follow-ups sent. if they reply, move them to 💬 talking.</p>'}
    </div>`;
  }

  function fillCPanel(c) {
    Object.entries(CFIELDS).forEach(([k, sel]) => { const el = $(sel); if (el.value !== c[k]) el.value = c[k]; });
    autoGrow($('#c-brand'));
    $('#c-status').innerHTML = CSTATUSES.map(s =>
      `<button class="${c.status === s.id ? 'on' : ''}" data-set-cstatus="${s.id}">${s.emoji}<span>${s.label}</span></button>`).join('');
    renderPlan(c);
    renderPay(c);
    $('#c-type').innerHTML = DEAL_TYPES.map(t => `<button class="chip ${c.type === t ? 'on' : ''}" data-ctype="${t}">${t}</button>`).join('');
    $('#c-series').innerHTML = state.pillars.map(x => `<button class="chip ${c.series === x ? 'on' : ''}" data-cseries="${esc(x)}">${esc(x)}</button>`).join('');
    const sug = suggestTpl(c);
    const stageGroups = STAGE_GROUPS[c.status] || [];
    $('#c-tpls').innerHTML = TEMPLATE_GROUPS.map(([g, label]) => {
      const items = state.templates.filter(x => (x.group || 'mine') === g);
      if (!items.length || (!showAllTpls && !stageGroups.includes(g) && !items.some(x => x.id === sug))) return '';
      return `<div class="tpl-row"><span class="tpl-row-label">${label}</span><div class="tpl-buttons">${items.map(t =>
        `<button class="chip ${t.id === sug ? 'suggest' : ''}" data-copy-tpl="${esc(t.id)}" data-cid="${c.id}">${t.id === sug ? '✦ ' : ''}${esc(t.name)}</button>`).join('')}</div></div>`;
    }).join('') + `<button class="link small tpl-all" data-tpl-all>${showAllTpls ? 'show fewer' : 'all messages'}</button>`;
    const stamps = [];
    if (c.pitchedAt) stamps.push(`pitched ${fmtDate(c.pitchedAt)}`);
    if (c.paidAt) stamps.push(`paid ${fmtDate(c.paidAt)}`);
    $('#c-meta').textContent = [`added ${fmtDate(c.createdAt.slice(0, 10))}`, ...stamps].join(' · ');
  }

  function openCollab(id, focusBrand = false) {
    const c = findC(id);
    if (!c) return;
    if (openId) closePanel();
    closeMenu();
    openCid = id;
    showAllTpls = false;
    fillCPanel(c);
    slideIn($('#cpanel'));
    autoGrow($('#c-brand'));
    if (focusBrand || !c.brand) $('#c-brand').focus({ preventScroll: true });
  }

  function closeCollab() {
    if (!openCid) return;
    const c = findC(openCid);
    openCid = null;
    slideOut($('#cpanel'));
    if (c && !c.brand.trim()) {
      state.collabs = state.collabs.filter(x => x !== c);
      persist();
      toast('no brand name, so it was not kept');
    }
    renderAll();
  }

  Object.entries(CFIELDS).forEach(([k, sel]) => {
    const el = $(sel);
    const handler = () => {
      const c = findC(openCid);
      if (!c || c[k] === el.value) return;
      c[k] = el.value;
      touch(c);
      persist();
      markSaved('#c-saved-label');
      if (k === 'brand') autoGrow(el);
      if (k === 'amount') renderPay(c);
      scheduleRender();
    };
    el.addEventListener('input', handler);
    el.addEventListener('change', handler);
  });
  $('#c-brand').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('#c-product').focus(); } });
  $('#cpanel-close').addEventListener('click', closeCollab);

  $('#delete-collab').addEventListener('click', async () => {
    const c = findC(openCid);
    if (!c) return;
    if (!(await ask({ title: `delete "${c.brand || 'this collab'}"?`, body: "this can't be undone.", ok: 'delete', danger: true }))) return;
    state.collabs = state.collabs.filter(x => x !== c);
    persist();
    openCid = null;
    slideOut($('#cpanel'));
    renderAll();
    toast('deleted');
  });

  $('#scrim').addEventListener('click', () => { if (openCid) closeCollab(); else closePanel(); });

  /* ================= angle helper ================= */
  function renderHelperQs() {
    const start = (helperPage * 3) % QUESTIONS.length;
    $('#helper-qs').innerHTML = [0, 1, 2].map(i => `<li>${esc(QUESTIONS[(start + i) % QUESTIONS.length])}</li>`).join('');
  }

  function openHelper(id) {
    const p = find(id);
    if (!p) return;
    helperId = id;
    helperPage = 0;
    $('#helper-title').textContent = p.title || 'untitled';
    $('#h-instead').value = p.insteadOf;
    $('#h-try').value = p.tryAngle;
    renderHelperQs();
    $('#helper').hidden = false;
  }
  function closeHelper() {
    if (!helperId) return;
    const id = helperId;
    helperId = null;
    $('#helper').hidden = true;
    if (openId === id) fillPanel(find(id));
    renderAll();
  }
  [['#h-instead', 'insteadOf'], ['#h-try', 'tryAngle']].forEach(([sel, k]) => {
    $(sel).addEventListener('input', e => {
      const p = find(helperId);
      if (!p) return;
      p[k] = e.target.value; p.isExample = false; touch(p); persist();
    });
  });
  $('#helper-more').addEventListener('click', () => { helperPage++; renderHelperQs(); });
  $('#helper-close').addEventListener('click', closeHelper);
  $('#helper-done').addEventListener('click', closeHelper);
  $('#helper').addEventListener('click', e => { if (e.target.id === 'helper') closeHelper(); });

  /* ================= weekly batch + idea generator ================= */
  const batchWeek = () => weekStart(todayStr());
  function batchData() {
    const wk = batchWeek();
    if (!state.batch[wk]) state.batch[wk] = { blocks: {}, shots: {} };
    Object.keys(state.batch).sort().slice(0, -10).forEach(k => delete state.batch[k]); // keep 10 weeks
    return state.batch[wk];
  }
  const batchDone = () => {
    const b = state.batch[batchWeek()];
    return b && b.blocks ? BATCH_BLOCKS.filter(([k]) => b.blocks[k]).length : 0;
  };

  function renderBatch() {
    const b = state.batch[batchWeek()] || { blocks: {}, shots: {} };
    $('#batch-blocks').innerHTML = BATCH_BLOCKS.map(([k, label, time, what]) => `
      <label class="bblock ${b.blocks[k] ? 'done' : ''}">
        <input type="checkbox" data-batch="${k}" ${b.blocks[k] ? 'checked' : ''}>
        <span class="bb-main"><b>${label}</b><span>${what}</span></span>
        <span class="bb-time">${time}</span>
      </label>`).join('');
    const n = batchDone();
    $('#batch-progress').textContent = n === 4 ? 'all 4 done this week 🎉' : `${n} of 4 done this week`;
    $('#batch-series').innerHTML = state.pillars.map(x => `<button class="chip ${batchSeries === x ? 'on' : ''}" data-bseries="${esc(x)}">${esc(x)}</button>`).join('');
    $('#batch-shots').innerHTML = SHOOT_CHECKS.map((s, i) =>
      `<label class="check"><input type="checkbox" data-shot="${i}" ${b.shots && b.shots[i] ? 'checked' : ''}><span>${esc(s)}</span></label>`).join('');
  }

  function renderGen() {
    $('#gen-series').innerHTML = state.pillars.map(x => `<button class="chip ${genSeries === x ? 'on' : ''}" data-gseries="${esc(x)}">${esc(x)}</button>`).join('');
    $('#gen-angles').innerHTML = GEN_ANGLES.map(([k, l]) => `<button class="chip ${genAngle === k ? 'on' : ''}" data-gangle="${k}">${l}</button>`).join('');
    $('#gen-stages').innerHTML = GEN_STAGES.map(([k, l]) => `<button class="chip ${genStage === k ? 'on' : ''}" data-gstage="${k}">${l}</button>`).join('');
    const ang = GEN_ANGLES.find(x => x[0] === genAngle), stg = GEN_STAGES.find(x => x[0] === genStage);
    $('#gen-hint').innerHTML = `<b>${ang[1]}</b>: ${ang[2]} · <b>${stg[1]}</b>: ${stg[2]}`;
    if (!$('#gen-prompts').children.length) {
      $('#gen-prompts').innerHTML = GEN_PROMPTS.map(([tag, q], i) =>
        `<label class="angle-line"><span class="angle-pre">${tag}</span><input id="g-${i}" placeholder="${esc(q)}"></label>`).join('');
    }
  }

  const MODALS = ['batch', 'gen'];
  function openModal(id) {
    closeMenu();
    if (id === 'batch') renderBatch();
    if (id === 'gen') { if (!genSeries && view === 'ideas' && state.pillars.includes(ideaPillar)) genSeries = ideaPillar; renderGen(); }
    $(`#${id}-modal`).hidden = false;
  }
  function closeModals() {
    let closed = false;
    MODALS.forEach(id => { const m = $(`#${id}-modal`); if (!m.hidden) { m.hidden = true; closed = true; } });
    if (closed) renderAll();
    return closed;
  }

  $('#b-add').addEventListener('click', () => {
    const topic = $('#b-topic').value.trim();
    const made = [['teach', '#b-teach'], ['story', '#b-story'], ['answer', '#b-answer']].map(([role, sel]) => {
      const v = $(sel).value.trim();
      if (!v) return null;
      return mk({ title: v, pillar: batchSeries, outline: `${role}${topic ? ` · this week's topic: ${topic}` : ''}` });
    }).filter(Boolean);
    if (!made.length) { toast('write at least one post idea first'); return; }
    state.posts.unshift(...made);
    persist();
    ['#b-teach', '#b-story', '#b-answer'].forEach(s => { $(s).value = ''; });
    toast(`added ${plural(made.length, 'idea')} 💡`);
  });

  $('#g-add').addEventListener('click', () => {
    const ang = GEN_ANGLES.find(x => x[0] === genAngle), stg = GEN_STAGES.find(x => x[0] === genStage);
    const made = GEN_PROMPTS.map(([tag], i) => {
      const v = $(`#g-${i}`).value.trim();
      return v ? mk({ title: v, pillar: genSeries, outline: `${ang[1]} · ${stg[1]} · ${tag}` }) : null;
    }).filter(Boolean);
    if (!made.length) { toast('fill in at least one prompt first'); return; }
    state.posts.unshift(...made);
    persist();
    GEN_PROMPTS.forEach((_, i) => { $(`#g-${i}`).value = ''; });
    toast(`added ${plural(made.length, 'idea')} to the bank 💡`);
  });

  /* ================= menu ================= */
  function openMenu() { renderMenu(); $('#menu').hidden = false; $('#menu-btn').setAttribute('aria-expanded', 'true'); }
  function closeMenu() { $('#menu').hidden = true; $('#menu-btn').setAttribute('aria-expanded', 'false'); }
  const toggleMenu = () => ($('#menu').hidden ? openMenu() : closeMenu());
  $('#menu-btn').addEventListener('click', e => { e.stopPropagation(); toggleMenu(); });
  $('#week-pill').addEventListener('click', e => { e.stopPropagation(); toggleMenu(); });

  /* ================= quick add ================= */
  function matchSeries(tag) {
    const n = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const t = n(tag);
    if (!t) return '';
    return state.pillars.find(x => n(x) === t)
      || state.pillars.find(x => n(x).startsWith(t))
      || state.pillars.find(x => x.toLowerCase().split(/[^a-z0-9]+/).some(w => w && w.startsWith(t)))
      || '';
  }

  $('#quick-add').addEventListener('submit', e => {
    e.preventDefault();
    const input = $('#quick-input');
    let series = '';
    const text = input.value.replace(/(^|\s)#([^\s#]+)/g, (m, sp, tag) => {
      if (series) return m;
      const hit = matchSeries(tag);
      if (hit) { series = hit; return sp; }
      return m;
    }).replace(/\s+/g, ' ').trim();
    if (!text) { input.focus(); return; }

    if (view === 'todos') {
      const todo = addTodo(input.value, todoMode !== 'list' ? todoSelDay : '');
      input.value = '';
      if (!todo) return;
      renderTodos();
      toast(`added ✓${todo.due ? ' · ' + fmtDate(todo.due) : ''}${todo.star ? ' · ⭐' : ''}`);
      return;
    }
    if (view === 'collabs') {
      state.collabs.unshift(mkCollab({ brand: text, series }));
      persist();
      input.value = '';
      collabTab = 'pipeline';
      if (!['active', 'pitch'].includes(collabFilter)) collabFilter = 'active';
      renderAll();
      toast(`${text} added to 🎯 to pitch. tap it to plan the pitch`);
      return;
    }
    state.posts.unshift(mk({ title: text, pillar: series }));
    persist();
    input.value = '';
    renderAll();
    toast(`added to ideas 💡${series ? ' · ' + series : ''}`);
  });

  /* ================= export / import ================= */
  async function exportData() {
    const data = { app: 'content-calendar', exportedAt: new Date().toISOString(), ...state };
    const text = JSON.stringify(data, null, 2);
    const filename = `content-calendar-backup-${todayStr()}.json`;
    if (window.claude && typeof window.claude.use === 'function') {
      const downloads = await window.claude.use('downloads').catch(() => null);
      if (downloads) {
        try { await downloads.save({ filename, data: text }); } catch (e) { toast('backup not saved'); return; }
      } else {
        const ok = await copyText(text);
        toast(ok ? 'backup copied. paste it into a note to keep it 💾' : "couldn't export here");
        if (!ok) return;
      }
    } else {
      const blob = new Blob([text], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    state.lastExport = new Date().toISOString();
    persist();
    renderMenu();
    renderNudge();
    toast('backup downloaded 💾');
  }

  $('#export-btn').addEventListener('click', exportData);
  $('#import-btn').addEventListener('click', () => $('#import-file').click());
  $('#import-file').addEventListener('change', async e => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const next = normalize(JSON.parse(await file.text()));
      const ok = await ask({
        title: `restore from "${file.name}"?`,
        body: `it has ${plural(next.posts.length, 'post')}, ${plural(next.collabs.length, 'collab')} and ${plural(next.todos.length, 'to-do')}. this replaces everything you have now${cloud.on ? ', on all your devices' : ''} (${plural(state.posts.length, 'post')}, ${plural(state.collabs.length, 'collab')}).`,
        ok: 'restore',
      });
      if (!ok) return;
      next.lastExport = next.lastExport || state.lastExport;
      if (openId) closePanel();
      if (openCid) closeCollab();
      closeMenu();
      const ta = $('#tpl-text');
      if (ta) ta.blur();
      state = next;
      persist();
      renderAll();
      toast(`restored ${plural(state.posts.length, 'post')} ✓`);
    } catch (err) {
      ask({ title: "couldn't import that file", body: err.message, ok: 'ok', cancel: '' });
    }
  });

  function changeGoal(d) { state.weeklyGoal = clampGoal(state.weeklyGoal + d); persist(); renderAll(); }
  $('#goal-minus').addEventListener('click', () => changeGoal(-1));
  $('#goal-plus').addEventListener('click', () => changeGoal(1));

  /* ================= delegated clicks ================= */
  const lineRef = v => { const [cat, i] = v.split('|'); return [cat, Number(i)]; };

  document.addEventListener('click', e => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    if (!$('#menu').hidden && !t.closest('#menu')) closeMenu();
    let el;
    if ((el = t.closest('[data-open-modal]'))) return openModal(el.dataset.openModal);
    if ((el = t.closest('[data-todo-check]'))) return toggleTodo(el.dataset.todoCheck);
    if ((el = t.closest('[data-todo-star]'))) { const id = el.dataset.todoStar; return editTodoField(id, x => { x.star = !x.star; }); }
    if ((el = t.closest('[data-todo-edit]'))) {
      const id = el.dataset.todoEdit;
      editingTodo = editingTodo === id ? null : id;
      focusTodoTitle = !!editingTodo;
      return renderTodos();
    }
    if (t.closest('[data-todo-close]')) { editingTodo = null; return renderTodos(); }
    if ((el = t.closest('[data-todo-due]'))) {
      const [id, when] = el.dataset.todoDue.split('|');
      const d = todayStr();
      return editTodoField(id, x => { x.due = when === 'today' ? d : when === 'tomorrow' ? addDays(d, 1) : when === 'nextweek' ? addDays(weekStart(d), 7) : ''; });
    }
    if ((el = t.closest('[data-todo-list]'))) { const [id, list] = el.dataset.todoList.split('|'); return editTodoField(id, x => { x.list = x.list === list ? '' : list; }); }
    if ((el = t.closest('[data-todo-repeat]'))) { const [id, r] = el.dataset.todoRepeat.split('|'); return editTodoField(id, x => { x.repeat = r; if (r && !x.due) x.due = todayStr(); }); }
    if ((el = t.closest('[data-todo-del]'))) return deleteTodo(el.dataset.todoDel);
    if ((el = t.closest('[data-todo-filter]'))) { todoFilter = el.dataset.todoFilter; return renderTodos(); }
    if ((el = t.closest('[data-todo-mode]'))) {
      todoMode = el.dataset.todoMode;
      editingTodo = null;
      try { localStorage.setItem(KEY + ':todoMode', todoMode); } catch (err) { /* ignore */ }
      return renderTodos();
    }
    if ((el = t.closest('[data-tdweek]'))) {
      const d = Number(el.dataset.tdweek);
      if (d === 0) { todoWeek = weekStart(todayStr()); todoSelDay = todayStr(); }
      else { todoWeek = addDays(todoWeek, d * 7); todoSelDay = todoWeek; }
      return renderTodos();
    }
    if ((el = t.closest('[data-tdcal]'))) {
      const d = Number(el.dataset.tdcal);
      if (d === 0) { todoCalMonth = todayStr().slice(0, 7); todoSelDay = todayStr(); }
      else { const [y, m] = todoCalMonth.split('-').map(Number); todoCalMonth = ymd(new Date(y, m - 1 + d, 1)).slice(0, 7); }
      return renderTodos();
    }
    if ((el = t.closest('[data-tdc]'))) {
      const id = el.dataset.tdc;
      const cell = el.closest('[data-tdday]');
      if (cell) todoSelDay = cell.dataset.tdday;
      editingTodo = id;
      renderTodos();
      const row = document.querySelector(`.td-dayview .td[data-todo="${id}"]`);
      if (row) row.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    if ((el = t.closest('[data-tdday]'))) {
      todoSelDay = el.dataset.tdday;
      editingTodo = null;
      renderTodos();
      if (window.matchMedia('(max-width: 700px)').matches) { const dv = $('.td-dayview'); if (dv) dv.scrollIntoView({ block: 'start', behavior: 'smooth' }); }
      return;
    }
    if (t.closest('[data-todo-clear]')) {
      const gone = state.todos.filter(x => x.done);
      state.todos = state.todos.filter(x => !x.done);
      persist(); renderTodos();
      toast(`cleared ${plural(gone.length, 'done to-do')}`, { label: 'undo', fn: () => { state.todos.push(...gone); persist(); renderTodos(); } });
      return;
    }
    if (t.closest('[data-tray-toggle]')) {
      trayOpen = !trayOpen;
      try { localStorage.setItem(KEY + ':tray', trayOpen ? '1' : '0'); } catch (err) { /* ignore */ }
      return renderCalendar();
    }
    if ((el = t.closest('[data-place]'))) {
      placingId = placingId === el.dataset.place ? null : el.dataset.place;
      renderCalendar();
      if (placingId) $('.placing') && $('.placing').scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    if (t.closest('[data-place-cancel]')) { placingId = null; return renderCalendar(); }
    if (placingId && (el = t.closest('#view-calendar .day'))) {
      const id = placingId;
      placingId = null;
      return moveToDate('post', id, el.dataset.day);
    }
    if (t.closest('[data-why-edit]')) { whyEdit = !whyEdit; editingMot = null; motMenu = null; return renderHome(); }
    if (t.closest('[data-hype-again]')) { hypeSeed = Math.floor(Math.random() * 1e6); renderHome(); return; }
    if (t.closest('[data-lets-create]')) return letsCreate();
    if ((el = t.closest('[data-mot-menu]'))) { motMenu = motMenu === el.dataset.motMenu ? null : el.dataset.motMenu; renderHome(); return; }
    if (motMenu && !t.closest('.mot-pop')) { motMenu = null; if (view === 'home') renderHome(); }
    if ((el = t.closest('[data-edit-mot]'))) { motMenu = null; editingMot = el.dataset.editMot; renderHome(); return; }
    if ((el = t.closest('[data-save-mot]'))) { saveMot(el.dataset.saveMot); return; }
    if (t.closest('[data-cancel-mot]')) { editingMot = null; renderHome(); return; }
    if ((el = t.closest('[data-del-mot]'))) {
      motMenu = null;
      const i = state.motivations.findIndex(x => x.id === el.dataset.delMot);
      if (i < 0) return;
      const [m] = state.motivations.splice(i, 1);
      persist(); renderHome();
      toast(`removed "${m.text}"`, { label: 'undo', fn: () => { state.motivations.splice(i, 0, m); persist(); renderHome(); } });
      return;
    }
    if (t.closest('[data-focus-add]')) { window.scrollTo({ top: 0, behavior: 'smooth' }); $('#quick-input').focus({ preventScroll: true }); return; }
    if (t.closest('[data-close-modal]')) { closeModals(); return; }
    if (t.classList.contains('modal-wrap') && t.id !== 'helper') { closeModals(); return; }
    if ((el = t.closest('[data-pay]'))) { const [id, w] = el.dataset.pay.split('|'); return markPayment(findC(id), w); }
    if ((el = t.closest('[data-got2307]'))) {
      const c = findC(el.dataset.got2307);
      if (!c) return;
      c.got2307 = !c.got2307; touch(c); persist(); renderAll();
      if (openCid === c.id) fillCPanel(c);
      if (c.got2307) toast('2307 saved for your records 🧾');
      return;
    }
    if ((el = t.closest('[data-ph]'))) {
      const c = findC(el.dataset.ph);
      if (!c) return;
      c.ph = !c.ph; touch(c); persist(); renderPay(c); scheduleRender();
      return;
    }
    if ((el = t.closest('[data-terms]'))) {
      const c = findC(openCid);
      if (!c) return;
      c.terms = el.dataset.terms;
      if (c.terms === 'full') c.balanceAt = '';
      touch(c); persist(); renderPay(c); scheduleRender();
      return;
    }
    if ((el = t.closest('[data-collab-post]'))) return collabToPost(findC(el.dataset.collabPost));
    if (t.closest('[data-tpl-all]')) { showAllTpls = !showAllTpls; const c = findC(openCid); if (c) fillCPanel(c); return; }
    if ((el = t.closest('[data-goto-tpl]'))) {
      collabTab = 'messages'; tplId = el.dataset.gotoTpl;
      renderCollabs(); window.scrollTo({ top: 0 });
      return;
    }
    if ((el = t.closest('[data-format]'))) {
      const p = find(openId);
      if (!p) return;
      p.format = el.dataset.format; touch(p); persist(); markSaved(); renderFormat(p); scheduleRender();
      return;
    }
    if ((el = t.closest('[data-sponsor]'))) {
      const p = find(openId);
      if (!p) return;
      p.sponsor = el.dataset.sponsor; touch(p); persist(); markSaved(); renderSponsor(p); scheduleRender();
      return;
    }
    if ((el = t.closest('[data-disclose]'))) {
      const p = find(openId);
      if (!p) return;
      p.disclosed[el.dataset.disclose] = el.checked; touch(p); persist(); markSaved();
      return;
    }
    if ((el = t.closest('[data-batch]'))) { batchData().blocks[el.dataset.batch] = el.checked; persist(); renderBatch(); return; }
    if ((el = t.closest('[data-shot]'))) { batchData().shots[el.dataset.shot] = el.checked; persist(); return; }
    if ((el = t.closest('[data-bseries]'))) { batchSeries = batchSeries === el.dataset.bseries ? '' : el.dataset.bseries; renderBatch(); return; }
    if ((el = t.closest('[data-gseries]'))) { genSeries = genSeries === el.dataset.gseries ? '' : el.dataset.gseries; renderGen(); return; }
    if ((el = t.closest('[data-gangle]'))) { genAngle = el.dataset.gangle; renderGen(); return; }
    if ((el = t.closest('[data-gstage]'))) { genStage = el.dataset.gstage; renderGen(); return; }
    if ((el = t.closest('[data-kit]'))) { state.kitChecks[el.dataset.kit] = el.checked; persist(); return; }
    if ((el = t.closest('[data-copy-tpl]'))) return copyTemplate(el.dataset.copyTpl, el.dataset.cid);
    if ((el = t.closest('[data-follow-sent]'))) return markFollowSent(findC(el.dataset.followSent));
    if ((el = t.closest('[data-cmove]'))) { const [id, s] = el.dataset.cmove.split('|'); return setCStatus(findC(id), s); }
    if ((el = t.closest('[data-cfilter]'))) {
      collabFilter = el.dataset.cfilter;
      renderPipeline();
      if (el.closest('.todo')) $('#stage-strip').scrollIntoView({ block: 'start', behavior: 'smooth' });
      return;
    }
    if ((el = t.closest('[data-ctab]'))) { collabTab = el.dataset.ctab; return renderCollabs(); }
    if (t.closest('#tpl-add')) {
      ask({ title: 'name your template', input: { placeholder: 'e.g. event invite reply' }, ok: 'create' }).then(name => {
        if (!name) return;
        const tp = { id: uid(), group: 'mine', name, text: `Hi {contact},\n\n\n\n{name}` };
        state.templates.push(tp);
        tplId = tp.id;
        persist();
        renderTemplateList();
        $('#tpl-text').focus();
      });
      return;
    }
    if ((el = t.closest('[data-tpl-tab]'))) {
      tplId = el.dataset.tplTab;
      $('#tpl-text').blur();
      renderTemplateList();
      if (el.closest('.if-say')) $('#tpl-text').scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    if ((el = t.closest('[data-advance]'))) return advance(el.dataset.advance);
    if ((el = t.closest('[data-cadvance]'))) return cadvance(el.dataset.cadvance);
    if ((el = t.closest('[data-helper]'))) return openHelper(el.dataset.helper);
    if ((el = t.closest('[data-export]'))) return exportData();
    if ((el = t.closest('[data-set-status]'))) return setStatus(find(openId), el.dataset.setStatus);
    if ((el = t.closest('[data-set-cstatus]'))) return setCStatus(findC(openCid), el.dataset.setCstatus);
    if ((el = t.closest('[data-pillar]'))) {
      const p = find(openId);
      if (!p) return;
      p.pillar = p.pillar === el.dataset.pillar ? '' : el.dataset.pillar;
      p.isExample = false; touch(p); persist(); markSaved(); renderPillarPicker(p); scheduleRender();
      return;
    }
    if ((el = t.closest('[data-ctype]'))) {
      const c = findC(openCid);
      if (!c) return;
      c.type = el.dataset.ctype; touch(c); persist(); markSaved('#c-saved-label'); fillCPanel(c); scheduleRender();
      return;
    }
    if ((el = t.closest('[data-cseries]'))) {
      const c = findC(openCid);
      if (!c) return;
      c.series = c.series === el.dataset.cseries ? '' : el.dataset.cseries;
      touch(c); persist(); markSaved('#c-saved-label'); fillCPanel(c); scheduleRender();
      return;
    }
    if (t.closest('#add-pillar-btn')) return addPillarInline();
    if ((el = t.closest('[data-line-cat]'))) { drawerCat = el.dataset.lineCat; return renderDrawer(); }
    if ((el = t.closest('[data-insert-line]'))) {
      const [cat, i] = lineRef(el.dataset.insertLine);
      if (state.lines[cat] && state.lines[cat][i] != null) insertLine(state.lines[cat][i]);
      return;
    }
    if ((el = t.closest('[data-copy-line]'))) {
      const [cat, i] = lineRef(el.dataset.copyLine);
      const line = state.lines[cat] && state.lines[cat][i];
      if (line) copyText(line).then(ok => toast(ok ? 'copied ✦' : "couldn't copy"));
      return;
    }
    if ((el = t.closest('[data-del-line]'))) {
      const [cat, i] = lineRef(el.dataset.delLine);
      const line = state.lines[cat] && state.lines[cat][i];
      if (line == null) return;
      state.lines[cat].splice(i, 1); persist(); renderLines();
      toast('line removed', { label: 'undo', fn: () => { state.lines[cat].splice(i, 0, line); persist(); renderLines(); } });
      return;
    }
    if ((el = t.closest('[data-filter-pillar]'))) { ideaPillar = el.dataset.filterPillar; return renderIdeas(); }
    if ((el = t.closest('[data-view]'))) {
      if (openId) closePanel();
      if (openCid) closeCollab();
      view = el.dataset.view;
      try { localStorage.setItem(VIEW_KEY, view); } catch (err) { /* ignore */ }
      window.scrollTo({ top: 0 });
      return renderView();
    }
    if ((el = t.closest('[data-cal]'))) { shiftCal(Number(el.dataset.cal)); return renderCalendar(); }
    if ((el = t.closest('[data-calmode]'))) {
      calMode = el.dataset.calmode;
      if (calMode === 'month') calMonth = calDay.slice(0, 7);
      try { localStorage.setItem(KEY + ':calMode', calMode); } catch (err) { /* ignore */ }
      return renderCalendar();
    }
    if ((el = t.closest('[data-calpick]'))) { calDay = el.dataset.calpick; calMonth = calDay.slice(0, 7); calMode = 'day'; try { localStorage.setItem(KEY + ':calMode', 'day'); } catch (err) { /* ignore */ } return renderCalendar(); }
    if ((el = t.closest('[data-new-post]'))) return newOnDate(el.dataset.newPost);
    if ((el = t.closest('[data-open-collab]'))) return openCollab(el.dataset.openCollab);
    if ((el = t.closest('[data-open]'))) return openPanel(el.dataset.open);
    if ((el = t.closest('[data-day]'))) { if (el.classList.contains('cd-day')) return; return newOnDate(el.dataset.day); }
  });

  document.addEventListener('input', e => {
    const tgt = e.target;
    if (tgt instanceof Element && tgt.id === 'edit-mot-text') { autoGrow(tgt); return; }
    if (tgt instanceof Element && editingTodo && ['td-title', 'td-notes', 'td-due'].includes(tgt.id)) {
      const td = state.todos.find(x => x.id === editingTodo);
      if (!td) return;
      if (tgt.id === 'td-title') { if (tgt.value.trim()) td.title = tgt.value; }
      if (tgt.id === 'td-notes') { td.notes = tgt.value; autoGrow(tgt); }
      if (tgt.id === 'td-due') { if (isDate(tgt.value) || !tgt.value) { td.due = tgt.value; persist(); renderTodos(); return; } }
      persist();
      return;
    }
    const inp = e.target;
    if (!(inp instanceof HTMLInputElement)) return;
    if (inp.dataset.profile) { state.profile[inp.dataset.profile] = inp.value; persist(); return; }
    if (inp.dataset.rc) {
      const [list, id, key] = inp.dataset.rc.split('|');
      const row = state.rateCard[list] && state.rateCard[list].find(x => x.id === id);
      if (row) { row[key] = inp.value; persist(); }
    }
  });

  function saveMot(id) {
    const m = state.motivations.find(x => x.id === id);
    const text = ($('#edit-mot-text') || {}).value || '';
    if (!m) return;
    if (!text.trim()) { toast('a dream needs some words 🤍'); return; }
    m.text = text.replace(/\s+/g, ' ').trim();
    m.emoji = ($('#edit-mot-emoji') || {}).value.trim() || '✨';
    editingMot = null;
    persist(); renderHome();
    toast('saved 🤍');
  }
  document.addEventListener('keydown', e => {
    if (e.target instanceof Element && e.target.id === 'td-title' && e.key === 'Enter') { e.preventDefault(); editingTodo = null; renderTodos(); }
  });
  // Enter saves, Esc cancels while editing a dream
  document.addEventListener('keydown', e => {
    const tgt = e.target;
    if (!(tgt instanceof Element) || !editingMot || !['edit-mot-text', 'edit-mot-emoji'].includes(tgt.id)) return;
    if (e.key === 'Enter') { e.preventDefault(); saveMot(editingMot); }
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); editingMot = null; renderHome(); }
  }, true);

  document.addEventListener('submit', e => {
    if (e.target.id === 'mot-add') {
      e.preventDefault();
      const text = $('#mot-text').value.trim();
      if (!text) return;
      state.motivations.push({ id: uid(), emoji: $('#mot-emoji').value.trim() || '✨', text });
      persist(); renderHome();
      $('#mot-text').focus({ preventScroll: true });
      toast('added to your why 🤍');
      return;
    }
    const form = e.target;
    if (!(form instanceof HTMLFormElement) || !form.dataset.addLine) return;
    e.preventDefault();
    const input = form.querySelector('input');
    const text = input.value.trim();
    if (!text) return;
    state.lines[form.dataset.addLine].push(text);
    persist();
    renderLines();
    const again = document.querySelector(`[data-add-line="${form.dataset.addLine}"] input`);
    if (again) again.focus({ preventScroll: true });
    toast('line added ✦');
  });

  /* ================= drag and drop (board) ================= */
  let dragId = null;
  document.addEventListener('dragstart', e => {
    const card = e.target instanceof Element && e.target.closest('.card');
    if (!card) return;
    dragId = card.dataset.open;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', dragId);
    card.classList.add('dragging');
  });
  document.addEventListener('dragend', () => {
    dragId = null;
    document.querySelectorAll('.dragging, .over').forEach(x => x.classList.remove('dragging', 'over'));
  });
  document.addEventListener('dragover', e => {
    const col = dragId && e.target instanceof Element && e.target.closest('.col');
    if (!col) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    document.querySelectorAll('.col.over').forEach(c => c !== col && c.classList.remove('over'));
    col.classList.add('over');
  });
  document.addEventListener('drop', e => {
    const col = e.target instanceof Element && e.target.closest('.col');
    if (!col) return;
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || dragId;
    col.classList.remove('over');
    setStatus(find(id), col.dataset.status);
  });

  /* ================= keyboard ================= */
  document.addEventListener('keydown', e => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '');
    if (e.key === 'Escape') {
      if (calDrag && calDrag.active) return endCalDrag(0, 0, true);
      if (motMenu) { motMenu = null; return renderHome(); }
      if (editingTodo) { editingTodo = null; return renderTodos(); }
      if (placingId) { placingId = null; return renderCalendar(); }
      if (!$('#menu').hidden) return closeMenu();
      if (closeModals()) return;
      if (helperId) return closeHelper();
      if (openCid) return closeCollab();
      if (openId) return closePanel();
      if (typing) document.activeElement.blur();
      return;
    }
    if (!typing && (e.key === '/' || e.key === 'n') && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      $('#quick-input').focus();
      return;
    }
    if (!typing && e.key === 'Enter') {
      const ds = document.activeElement?.dataset || {};
      if (ds.openCollab) openCollab(ds.openCollab);
      else if (ds.open) openPanel(ds.open);
    }
  });

  /* ================= other tabs ================= */
  window.addEventListener('storage', e => {
    if (e.key !== KEY || !e.newValue) return;
    try {
      state = normalize(JSON.parse(e.newValue));
      if (openId) { const p = find(openId); if (p) fillPanel(p); else closePanel(); }
      if (openCid) { const c = findC(openCid); if (c) fillCPanel(c); else closeCollab(); }
      renderAll();
    } catch (err) { /* ignore */ }
  });

  // keep dream cards sized to their text when the screen size changes
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { const ta = $('#edit-mot-text'); if (ta) autoGrow(ta); }, 120);
  });

  document.addEventListener('visibilitychange', () => { if (!document.hidden && !openId && !openCid) renderAll(); });

  renderAll();
  startCloud();

  // offline support when installed from the web (not inside claude.ai, not as a local file)
  if ('serviceWorker' in navigator && location.protocol === 'https:' && !window.claude) {
    navigator.serviceWorker.register('sw.js').catch(() => { /* fine without it */ });
  }
})();
