"use strict";
/* ============================================================================
   1. DATA — the twelve signs, with full celestial ruling-body profiles
   ==========================================================================*/

const PLANET_GLYPH = {
  Sun:"☉", Moon:"☽", Mercury:"☿", Venus:"♀", Mars:"♂", Jupiter:"♃", Saturn:"♄",
  Uranus:"♅", Neptune:"♆", Pluto:"♇", Chiron:"⚷", Ceres:"⚳", Pallas:"⚴",
  Juno:"⚵", Vesta:"⚶", Eris:"⯰"
};

const SIGNS = [
  {
    id:"aries", name:"Aries", glyph:"♈", symbol:"The Ram", dates:"Mar 21 – Apr 19",
    element:"Fire", modality:"Cardinal", polarity:"Yang", house:1, houseName:"Self & Identity",
    arc:"0° – 30°", bodyPart:"Head, face, cerebral cortex",
    drive:"To begin. To be first. To exist without asking permission.",
    core:"Aries is the ignition point of the wheel — 0° of the tropical zodiac, timed exactly to the vernal equinox. Its intelligence is pre-verbal and instantaneous: it acts, and only afterwards discovers what it meant by acting. Everything that follows in the zodiac is, in some sense, a refinement of this first unedited impulse.",
    rulers:[
      {body:"Mars", type:"both", label:"Traditional & Modern",
       note:"Uncontested ruler in both systems — no modern reassignment was ever proposed. Mars orbits in 687 days with two captured moons, Phobos and Deimos (“fear” and “panic”), and owes its colour to iron-oxide dust. Astrologically it governs the metabolism of desire: adrenaline, appetite, the survival reflex."},
      {body:"Eris", type:"minor", label:"Minor · Contemporary",
       note:"Dwarf planet located in 2005 on a 558-year orbit; its discovery is what forced Pluto's reclassification. Many contemporary astrologers file Eris in the Aries family — the uninvited guest who throws the golden apple and forces a reckoning that politeness had deferred."}
    ],
    rulerNote:"Aries, Taurus, Leo, Cancer, Gemini and Capricorn retain their classical rulers intact; only Scorpio, Aquarius and Pisces were formally split by the modern system.",
    keywords:["Initiation","Courage","Instinct","Assertion","Raw Will"],
    strengths:["Decisive under pressure","Fearless at the starting line","Honest to a fault","Regenerates energy fast"],
    shadows:["Impatience with process","Combativeness","Weak follow-through","Blind spot for others' pace"]
  },
  {
    id:"taurus", name:"Taurus", glyph:"♉", symbol:"The Bull", dates:"Apr 20 – May 20",
    element:"Earth", modality:"Fixed", polarity:"Yin", house:2, houseName:"Value & Resources",
    arc:"30° – 60°", bodyPart:"Throat, neck, thyroid",
    drive:"To make what is good last.",
    core:"Taurus is the zodiac's first act of consolidation: it takes the raw fire Aries struck and builds a body around it. Its intelligence is sensory rather than conceptual — it knows through touch, taste, weight and duration. Whatever cannot survive contact with the physical world, Taurus quietly declines to believe in.",
    rulers:[
      {body:"Venus", type:"both", label:"Traditional & Modern",
       note:"Venus by night in the classical scheme — the earthy, tactile, possessive face of the planet. Venus rotates retrograde and so slowly that its day is longer than its 225-day year, and its conjunctions with Earth trace a five-petalled pentagram across eight years. That harmonic geometry is the astronomical root of Venus's ancient link to beauty and proportion."},
      {body:"Ceres", type:"minor", label:"Minor · Contemporary",
       note:"Largest body in the asteroid belt, promoted to dwarf planet in 2006. Frequently nominated as a Taurean co-ruler for its dominion over harvest, nourishment, and the felt sufficiency of the material world."}
    ],
    rulerNote:"Taurus and Libra are the two Venus-ruled signs — one holds beauty as substance, the other as ratio.",
    keywords:["Stability","Sensuality","Endurance","Worth","Cultivation"],
    strengths:["Unshakeable reliability","Deep sensory intelligence","Patience with slow processes","Loyal past reason"],
    shadows:["Inertia dressed as principle","Possessiveness","Resistance to necessary change","Comfort as an anaesthetic"]
  },
  {
    id:"gemini", name:"Gemini", glyph:"♊", symbol:"The Twins", dates:"May 21 – Jun 20",
    element:"Air", modality:"Mutable", polarity:"Yang", house:3, houseName:"Mind & Exchange",
    arc:"60° – 90°", bodyPart:"Lungs, hands, nervous system",
    drive:"To know both sides — and then to find a third.",
    core:"Gemini is perception splitting into language. Where Taurus holds one thing, Gemini holds two and compares them; the sign behaves less like a personality than like a nervous system running permanently in parallel. Its gift and its cost are the same: nothing is ever only one thing.",
    rulers:[
      {body:"Mercury", type:"both", label:"Traditional & Modern",
       note:"Mercury by day — the airy, gathering, promiscuous face of the planet. Closest body to the Sun, an 88-day year, no moon, and a surface swinging roughly 600 °C between day and night. Mercury is velocity, translation, and comfort with extremes of register; it turns retrograde three to four times a year, more than any other planet."}
    ],
    rulerNote:"Gemini is one of the signs never reassigned to an outer planet. No Uranus, Neptune or Pluto claim on it was ever widely accepted — its rulership remains purely classical.",
    keywords:["Curiosity","Duality","Language","Agility","Connection"],
    strengths:["Learns at speed","Socially fluent anywhere","Genuinely, unfeignedly interested","Reframes a stuck problem"],
    shadows:["Scattered focus","Restlessness","Skims where depth was needed","Says it before it is meant"]
  },
  {
    id:"cancer", name:"Cancer", glyph:"♋", symbol:"The Crab", dates:"Jun 21 – Jul 22",
    element:"Water", modality:"Cardinal", polarity:"Yin", house:4, houseName:"Home & Origin",
    arc:"90° – 120°", bodyPart:"Chest, stomach, breasts",
    drive:"To protect what cannot yet protect itself.",
    core:"Cancer opens at the summer solstice — the year's maximum light, and the precise moment that light begins to recede. The sign is built on that paradox: it initiates through feeling rather than force, and it defends what it loves behind a shell it grew itself, out of its own material.",
    rulers:[
      {body:"Moon", type:"both", label:"Traditional & Modern",
       note:"Sole ruler in both systems. Tidally locked to Earth, with a 27.3-day sidereal orbit and a 29.5-day phase cycle. The Moon moves faster than any other body in the chart, changing sign every two and a half days — astrologically the seat of mood, memory, instinct and tidal return."},
      {body:"Ceres", type:"minor", label:"Minor · Contemporary",
       note:"The Demeter archetype — nurture, attachment, and the grief of separation. Widely read as a Cancerian co-signature for the mother-and-child bond and everything that bond costs."}
    ],
    rulerNote:"Cancer and Leo are the zodiac's two unpaired signs: the Moon and Sun rule exactly one sign each, while every classical planet rules two.",
    keywords:["Nurture","Memory","Protection","Belonging","Tides"],
    strengths:["Reads a room before anyone speaks","Ferocious loyalty","Long memory for kindness","Creates genuine safety"],
    shadows:["Retreat instead of confrontation","Mood as weather system","Clings to a past version","Asks indirectly, resents directly"]
  },
  {
    id:"leo", name:"Leo", glyph:"♌", symbol:"The Lion", dates:"Jul 23 – Aug 22",
    element:"Fire", modality:"Fixed", polarity:"Yang", house:5, houseName:"Creation & Play",
    arc:"120° – 150°", bodyPart:"Heart, spine, upper back",
    drive:"To be seen radiating what is actually inside.",
    core:"Leo is fire made stable — a sustained burn rather than a spark. Ruled by the only body in the system that generates its own light, Leo's task is authorship: to make something that could only have come from this particular self, and then to stand next to it without apology.",
    rulers:[
      {body:"Sun", type:"both", label:"Traditional & Modern",
       note:"A G2V main-sequence star holding 99.86% of the solar system's mass. It rotates differentially — 25 days at the equator, 35 at the poles — on an ~11-year magnetic cycle. Astrologically the core identity: what remains when nothing is being performed for anyone."}
    ],
    rulerNote:"Leo has never been given a modern co-ruler. Solar rulership is treated as indivisible.",
    keywords:["Radiance","Creativity","Loyalty","Dignity","Performance"],
    strengths:["Generous by reflex","Warm enough to magnetise a room","Creatively courageous","Steadfast in devotion"],
    shadows:["Pride that cannot bend","Need for the applause to continue","Dramatising the ordinary","Difficulty being unremarkable"]
  },
  {
    id:"virgo", name:"Virgo", glyph:"♍", symbol:"The Maiden", dates:"Aug 23 – Sep 22",
    element:"Earth", modality:"Mutable", polarity:"Yin", house:6, houseName:"Work, Health & Craft",
    arc:"150° – 180°", bodyPart:"Digestive system, intestines",
    drive:"To refine the thing until it actually works.",
    core:"Virgo is discrimination in its original sense: the ability to tell one thing from a nearly identical thing. Mutable earth breaks solid form back down into components so it can be corrected and put to use. Virgo is the zodiac's editor — and, like all editors, is happiest when the work is better and no one can tell why.",
    rulers:[
      {body:"Mercury", type:"both", label:"Traditional & Modern",
       note:"Mercury by night — and Virgo is also Mercury's sign of exaltation, the only place in the zodiac where a planet both rules and is exalted. Here Mercury's speed converts into precision rather than variety: the same instrument, tuned instead of scattered."},
      {body:"Chiron", type:"minor", label:"Minor · Contemporary",
       note:"A centaur body discovered in 1977 on an unstable ~50.7-year orbit crossing between Saturn and Uranus. The “wounded healer” is co-assigned across the Virgo–Pisces healing axis: Virgo treats the mechanism, Pisces accepts the wound."},
      {body:"Ceres", type:"minor", label:"Minor · Contemporary",
       note:"Nominated by some modern schools for Virgo's dominion over harvest, diet, and the daily maintenance of a body that has to keep working."}
    ],
    rulerNote:"Virgo also inherited Vulcan — a 19th-century hypothetical intra-Mercurial planet that was searched for, never found, and is still cited in some esoteric traditions.",
    keywords:["Discernment","Service","Craft","Analysis","Purification"],
    strengths:["Attention no one else is paying","Practically, measurably useful","Improves the system it enters","Competence without noise"],
    shadows:["Perfectionism as procrastination","Critique running with no off switch","Anxiety mistaken for rigour","Over-functioning for other people"]
  },
  {
    id:"libra", name:"Libra", glyph:"♎", symbol:"The Scales", dates:"Sep 23 – Oct 22",
    element:"Air", modality:"Cardinal", polarity:"Yang", house:7, houseName:"Partnership & the Other",
    arc:"180° – 210°", bodyPart:"Kidneys, lower back, skin",
    drive:"To find the arrangement in which nothing is crushed.",
    core:"Libra opens at the autumn equinox — the year's second point of perfect balance — and is the only sign whose symbol is an object rather than a creature. Its intelligence is relational: it thinks by weighing one position against another, and it cannot locate itself except in reference to someone else.",
    rulers:[
      {body:"Venus", type:"both", label:"Traditional & Modern",
       note:"Venus by day. Where Taurean Venus is touch and possession, Libran Venus is proportion, composition and the ethics of fairness — Venus as ratio rather than appetite. Same planet, opposite hand."},
      {body:"Pallas", type:"minor", label:"Minor · Contemporary",
       note:"Pallas Athene: asteroid of strategy, pattern recognition and the just cause. Regularly co-assigned to Libra's legal, diplomatic and design faculties."},
      {body:"Juno", type:"minor", label:"Minor · Contemporary",
       note:"Asteroid of committed partnership and the actual terms of the contract — a natural fit for the sign that governs the seventh house."}
    ],
    rulerNote:"Libra's exaltation of Saturn is the sign's hidden spine: the aesthetic sign is also the sign of law, judgement and structural fairness.",
    keywords:["Balance","Harmony","Justice","Aesthetics","Relationship"],
    strengths:["Diplomatic without being dishonest","Genuinely fair-minded","Strong compositional eye","Makes others feel considered"],
    shadows:["Indecision as a lifestyle","Conflict avoided until it detonates","People-pleasing","Loses its own outline in the other"]
  },
  {
    id:"scorpio", name:"Scorpio", glyph:"♏", symbol:"The Scorpion, Eagle & Phoenix", dates:"Oct 23 – Nov 21",
    element:"Water", modality:"Fixed", polarity:"Yin", house:8, houseName:"Depth, Death & Shared Power",
    arc:"210° – 240°", bodyPart:"Reproductive & eliminative systems",
    drive:"To go all the way in, and come back changed.",
    core:"Scorpio is water held under pressure — fixed feeling that refuses to evaporate. It governs everything held in common and everything held in secret: intimacy, inheritance, debt, taboo, and the process by which one identity has to die so that the next one can exist. It does not do partial.",
    rulers:[
      {body:"Mars", type:"trad", label:"Traditional / Classical",
       note:"Mars by night in the Ptolemaic scheme. Here Mars is not the cavalry charge of Aries but the long siege: strategy, endurance, and force held deliberately in reserve."},
      {body:"Pluto", type:"mod", label:"Modern",
       note:"Assigned to Scorpio soon after its 1930 discovery. A 248-year orbit steeply inclined to the ecliptic, and a body reclassified as a dwarf planet in 2006 — a demotion astrology declined to act on. Pluto governs compulsion, buried power, and transformation that cannot be reversed."},
      {body:"Vesta", type:"minor", label:"Minor · Contemporary",
       note:"Asteroid of the sacred flame: devotion, sexual focus, and what a person is willing to consecrate and keep private."}
    ],
    rulerNote:"Scorpio is the clearest case of the traditional/modern split. Mars gives the sign its will; Pluto gives it its fate.",
    keywords:["Intensity","Transformation","Depth","Power","Regeneration"],
    strengths:["Emotional courage others lack","Genuinely unshockable","Total, unhedged loyalty","Sees straight through performance"],
    shadows:["Control disguised as care","Suspicion by default","Grudges kept in perfect condition","Secrecy used as leverage"]
  },
  {
    id:"sagittarius", name:"Sagittarius", glyph:"♐", symbol:"The Archer", dates:"Nov 22 – Dec 21",
    element:"Fire", modality:"Mutable", polarity:"Yang", house:9, houseName:"Meaning & the Far Horizon",
    arc:"240° – 270°", bodyPart:"Hips, thighs, liver",
    drive:"To find out what all of it actually means.",
    core:"Sagittarius is fire that has turned from assertion to search. It takes Scorpio's hard-won underground knowledge and asks what it is for — the sign of philosophy, foreign territory, higher law, and the belief structure a person is actually living by rather than the one they claim.",
    rulers:[
      {body:"Jupiter", type:"both", label:"Traditional & Modern",
       note:"Jupiter by day. An 11.86-year orbit — roughly one sign per year — with 95+ confirmed moons and enough mass to act as the inner solar system's gravitational shield, deflecting comets that would otherwise reach us. The planet of expansion, protection and excess."},
      {body:"Chiron", type:"minor", label:"Minor · Contemporary",
       note:"The centaur body for the centaur sign. In myth Chiron is the teacher of heroes, which maps precisely onto Sagittarius's double function as both eternal student and inevitable mentor."}
    ],
    rulerNote:"Astronomically notable: Sagittarius A*, the supermassive black hole at the centre of our galaxy, sits at roughly 27° of tropical Sagittarius — the densest, most massive point of sky the zodiac crosses.",
    keywords:["Exploration","Truth-seeking","Optimism","Freedom","Philosophy"],
    strengths:["Holds the widest frame in the room","Faith that is actually contagious","Blunt to the point of usefulness","Comfortable in unmapped territory"],
    shadows:["Tactlessness sold as honesty","Promises larger than capacity","Restlessness that leaves things unfinished","Dogma wearing the costume of freedom"]
  },
  {
    id:"capricorn", name:"Capricorn", glyph:"♑", symbol:"The Sea-Goat", dates:"Dec 22 – Jan 19",
    element:"Earth", modality:"Cardinal", polarity:"Yin", house:10, houseName:"Structure & Public Standing",
    arc:"270° – 300°", bodyPart:"Bones, knees, skin, teeth",
    drive:"To build something that outlives the builder.",
    core:"Capricorn begins at the winter solstice — the longest night, and the exact turn back toward light. Its symbol is a hybrid: a goat with the tail of a fish, climbing the material world while remaining anchored in the unconscious depths it came from. Ambition here is not vanity; it is a long argument with time.",
    rulers:[
      {body:"Saturn", type:"both", label:"Traditional & Modern",
       note:"Saturn by night. A 29.46-year orbit — the basis of the Saturn Return, astrology's most-cited transit and its rite of passage into adulthood. Rings of ice and rock, and a persistent hexagonal storm at the north pole: geometry, limit and structure made literally visible."}
    ],
    rulerNote:"Like Leo and Cancer, Capricorn was never given an outer-planet co-ruler; Saturn's authority over it is undivided in both the classical and modern systems.",
    keywords:["Discipline","Authority","Ambition","Mastery","Time"],
    strengths:["Follow-through bordering on inevitability","Strategic patience measured in years","Carries weight without complaint","Improves with age, visibly"],
    shadows:["Coldness rationalised as realism","Work as identity","Fixation on status markers","Withholding warmth as a form of control"]
  },
  {
    id:"aquarius", name:"Aquarius", glyph:"♒", symbol:"The Water Bearer", dates:"Jan 20 – Feb 18",
    element:"Air", modality:"Fixed", polarity:"Yang", house:11, houseName:"Collective & Future",
    arc:"300° – 330°", bodyPart:"Ankles, circulatory system",
    drive:"To improve the design for everyone — including the people not born yet.",
    core:"Aquarius is an air sign that carries water: an abstract intelligence pouring out feeling it prefers to hold at arm's length. It is the systems-thinker of the zodiac, loyal to principle over person and to the group over the individual, which is exactly what makes it both a reformer and, occasionally, hard to reach.",
    rulers:[
      {body:"Saturn", type:"trad", label:"Traditional / Classical",
       note:"Saturn by day. The classical ruler explains the half of Aquarius nobody expects: disciplined, structural, unsentimental, and quite capable of enforcing a rule it invented."},
      {body:"Uranus", type:"mod", label:"Modern",
       note:"Assigned after its 1781 discovery — the first planet ever found by telescope, which is itself an Aquarian event. An 84-year orbit and a 98° axial tilt mean it rotates on its side, effectively retrograde relative to the rest of the system. The planet of deviation, shock and sudden liberation."}
    ],
    rulerNote:"The Saturn/Uranus pairing is the sign's central tension — the rule-maker and the rule-breaker sharing one throne. Aquarians tend to be one of the two, loudly, and the other one quietly.",
    keywords:["Innovation","Objectivity","Community","Reform","Detachment"],
    strengths:["Originality that isn't posturing","Principled under social pressure","Includes whoever was excluded","Genuinely unbothered by consensus"],
    shadows:["Emotional distance as policy","Contrarianism for its own sake","Idealism hardened into dogma","Turning people into categories"]
  },
  {
    id:"pisces", name:"Pisces", glyph:"♓", symbol:"The Fishes", dates:"Feb 19 – Mar 20",
    element:"Water", modality:"Mutable", polarity:"Yin", house:12, houseName:"Dissolution & the Unbounded",
    arc:"330° – 360°", bodyPart:"Feet, lymphatic system",
    drive:"To dissolve the line between self and everything else.",
    core:"Pisces closes the wheel by returning every previous sign to solution. Two fish bound together and swimming in opposite directions: the mystic and the escapist, compassion without borders and the difficulty of maintaining any. It is the last sign because it is where individual identity is given back.",
    rulers:[
      {body:"Jupiter", type:"trad", label:"Traditional / Classical",
       note:"Jupiter by night. The classical ruler supplies Pisces with faith, generosity and the capacity to find meaning where there is no evidence for it — for better and for worse."},
      {body:"Neptune", type:"mod", label:"Modern",
       note:"Predicted mathematically from irregularities in Uranus's orbit, then found in 1846 within a degree of the prediction — a planet discovered through intuition about an invisible influence, which is almost too on-the-nose. A 165-year orbit and the fastest winds in the solar system. Governs imagination, dissolution and illusion."},
      {body:"Chiron", type:"minor", label:"Minor · Contemporary",
       note:"Co-assigned across the Virgo–Pisces axis. Where Virgo repairs the mechanism, Pisces heals by accepting that the wound is part of the design."}
    ],
    rulerNote:"Pisces is one of only three signs formally split between a classical and a modern ruler — Jupiter's faith and Neptune's fog are not always distinguishable from the inside.",
    keywords:["Compassion","Imagination","Surrender","Intuition","Unity"],
    strengths:["Empathy without a gate on it","Artistic depth","Forgives faster than is reasonable","Hears what was not said"],
    shadows:["Escapism in many disguises","No usable boundaries","Suffering as identity","Self-deception, sincerely held"]
  }
];

/* ---- element / modality / polarity reference ---- */
const ELEMENTS = {
  Fire:{ color:"var(--fire)", hex:"#ff5f45", temper:"Hot & Dry",
    desc:"the element of spirit and animating will — self-generating, future-facing, interested in what could be. Fire acts in order to find out.",
    gift:"momentum, and the nerve to start before it is safe" },
  Earth:{ color:"var(--earth)", hex:"#3fdc8b", temper:"Cold & Dry",
    desc:"the element of substance and consequence — slow, sensory, interested in what actually holds weight. Earth tests by building.",
    gift:"form, patience, and the discipline of the actual" },
  Air:{ color:"var(--air)", hex:"#ffd35e", temper:"Hot & Moist",
    desc:"the element of mind and relation — mobile, abstract, interested in the space between things. Air understands by comparing.",
    gift:"perspective, language, and the ability to step outside the situation" },
  Water:{ color:"var(--water)", hex:"#4fb6ff", temper:"Cold & Moist",
    desc:"the element of feeling and merger — receptive, cyclical, interested in what runs beneath the surface. Water knows by absorbing.",
    gift:"depth, feeling, and the real reason under the stated one" }
};

const MODALITIES = {
  Cardinal:{ color:"var(--cardinal)", hex:"#ff6fc4",
    desc:"Cardinal signs open each season. They initiate — they generate motion and set direction.",
    tempo:"Initiates — starts the motion", gift:"the willingness to begin" },
  Fixed:{ color:"var(--fixed)", hex:"#a988ff",
    desc:"Fixed signs hold the middle of each season. They sustain, concentrate and resist — the zodiac's ballast.",
    tempo:"Sustains — holds the charge", gift:"the stamina to stay" },
  Mutable:{ color:"var(--mutable)", hex:"#4fe6d0",
    desc:"Mutable signs end each season and prepare the next. They adapt, distribute and dissolve — the zodiac's connective tissue.",
    tempo:"Adapts — changes the shape", gift:"the flexibility to change shape" }
};

const POLARITIES = {
  Yang:{ desc:"projective and outward-directed — expression precedes reflection. Classically called positive, diurnal or masculine; it covers the Fire and Air signs." },
  Yin:{ desc:"receptive and inward-directed — reflection precedes expression. Classically called negative, nocturnal or feminine; it covers the Earth and Water signs." }
};

const ASPECTS = {
  0:{ name:"Conjunction", deg:"0°", sym:"☌",
      def:"Same sign, same degree of the wheel. There is no distance to negotiate — and therefore no perspective either." },
  1:{ name:"Semi-sextile", deg:"30°", sym:"⚺",
      def:"Neighbouring signs share nothing — not element, not modality, not polarity. The zodiac is deliberately built this way: each sign is a correction of the one before it. Contact here is subtle, slightly irritating, and quietly formative." },
  2:{ name:"Sextile", deg:"60°", sym:"⚹",
      def:"Complementary elements (Fire with Air, Earth with Water) in the same polarity but different modalities. The aspect of easy opportunity: it works — but only if somebody actually does something with it." },
  3:{ name:"Square", deg:"90°", sym:"□",
      def:"The same modality, opposite polarity, and elements that do not naturally mix. Two signs pushing at identical speed in incompatible directions. Squares are the engine of the zodiac: friction that produces motion." },
  4:{ name:"Trine", deg:"120°", sym:"△",
      def:"The same element and the same polarity, expressed through different modalities. The most fluent relationship on the wheel — instant mutual recognition, and the standing risk that nothing ever gets challenged." },
  5:{ name:"Quincunx", deg:"150°", sym:"⚻",
      def:"No shared element, no shared modality, no shared polarity, and no clean geometric relationship. Nothing translates automatically. Whatever these two build has to be built consciously, or not at all." },
  6:{ name:"Opposition", deg:"180°", sym:"☍",
      def:"The same modality and polarity across complementary elements. Not enemies but the two ends of a single axis — each holding the half of a shared function that the other has disowned." }
};

const AXES = {
  "aries|libra":{ title:"The Axis of Self & Other",
    text:"Identity versus relationship. Aries answers “what do I want?” and Libra answers “what is fair?” — and each is chronically bad at the other's question. The mature version of this axis is a person who can state a preference and hold a negotiation in the same breath." },
  "taurus|scorpio":{ title:"The Axis of Mine & Ours",
    text:"What I own versus what we share. Taurus builds security by accumulating and keeping; Scorpio builds it by merging, exposing and periodically destroying. Both are answers to the same fear. The axis resolves when holding on and letting go stop being opposites." },
  "gemini|sagittarius":{ title:"The Axis of Data & Meaning",
    text:"Information versus wisdom. Gemini collects facts without demanding they cohere; Sagittarius demands coherence and will sand off the facts that resist it. Gemini without Sagittarius is trivia; Sagittarius without Gemini is doctrine." },
  "cancer|capricorn":{ title:"The Axis of Private & Public",
    text:"The home versus the world, running through the solstices — the two extremes of the year. Cancer secures by belonging, Capricorn by achieving. Both are strategies for not being unprotected. Neither works alone: a person needs somewhere to be nobody and somewhere to be somebody." },
  "leo|aquarius":{ title:"The Axis of the One & the Many",
    text:"The individual versus the collective. Leo insists that the particular self matters; Aquarius insists that the system matters more than any occupant of it. Leo keeps Aquarius human; Aquarius keeps Leo honest about scale." },
  "virgo|pisces":{ title:"The Axis of Analysis & Surrender",
    text:"The part versus the whole — the zodiac's healing axis. Virgo repairs by separating a problem into components; Pisces heals by dissolving the separation entirely. Chiron is co-assigned to both ends of this axis for exactly that reason." }
};

/* ---- force TEXT presentation for all astrological glyphs ----
   Without U+FE0E many systems render ♈–♓, ♀ and ♂ as colour emoji tiles,
   which destroys the element colour-coding and the crispness of the wheel. */
const VS15 = "\uFE0E";
SIGNS.forEach(s => { s.glyph += VS15; });
Object.keys(PLANET_GLYPH).forEach(k => { PLANET_GLYPH[k] += VS15; });
Object.keys(ASPECTS).forEach(k => { ASPECTS[k].sym += VS15; });

/* ============================================================================
   2. GEOMETRY
   ==========================================================================*/
const SVG_NS = "http://www.w3.org/2000/svg";
const CX = 410, CY = 410;
const R_NODE = 300;     // radius of node centres
const NODE_R = 52;      // node disc radius

const el = (n, attrs) => {
  const e = document.createElementNS(SVG_NS, n);
  if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
};
const posOf = (i) => {
  const a = (-90 + i * 30) * Math.PI / 180;
  return { x: CX + R_NODE * Math.cos(a), y: CY + R_NODE * Math.sin(a) };
};
const dist = (i, j) => { const d = Math.abs(i - j); return Math.min(d, 12 - d); };
const idxOf = (id) => SIGNS.findIndex(s => s.id === id);
const ord = (n) => { const t=["th","st","nd","rd"], v=n%100; return n + (t[(v-20)%10] || t[v] || t[0]); };

/* ============================================================================
   2b. COMPATIBILITY ENGINE
   A transparent, additive 100-point model. Every term is derived from the
   structure of the wheel itself, so the number can always be taken apart.
   ==========================================================================*/

/* Angular relationship — the dominant term (max 40). */
const ASPECT_SCORE = { 0:30, 1:18, 2:33, 3:20, 4:38, 5:15, 6:28 };

/* Elemental temperament (max 25). Fire+Air and Earth+Water are the two
   classical complementary pairings; same-element is fluent but redundant. */
const ELEMENT_PAIR = {
  "Air|Air":22, "Earth|Earth":22, "Fire|Fire":22, "Water|Water":22,
  "Air|Fire":25, "Earth|Water":25,
  "Earth|Fire":11, "Fire|Water":8, "Air|Earth":10, "Air|Water":12
};

/* Modal tempo (max 15). Matching modality means competing for the same
   moment; staggered modalities cover for one another. */
const MODALITY_PAIR = {
  same:6, "Cardinal|Fixed":11, "Cardinal|Mutable":14, "Fixed|Mutable":13
};

/* Classical planetary sympathy between the two signs' traditional rulers
   (max 10). The outer planets have no traditional friendship table, so the
   affinity term is computed on the seven classical bodies only. */
const PLANET_AFFINITY = {
  Sun:     { Sun:10, Moon:8,  Mercury:6,  Venus:7,  Mars:7,  Jupiter:9,  Saturn:3  },
  Moon:    { Sun:8,  Moon:10, Mercury:6,  Venus:9,  Mars:4,  Jupiter:8,  Saturn:4  },
  Mercury: { Sun:6,  Moon:6,  Mercury:10, Venus:8,  Mars:5,  Jupiter:6,  Saturn:6  },
  Venus:   { Sun:7,  Moon:9,  Mercury:8,  Venus:10, Mars:7,  Jupiter:9,  Saturn:5  },
  Mars:    { Sun:7,  Moon:4,  Mercury:5,  Venus:7,  Mars:10, Jupiter:6,  Saturn:4  },
  Jupiter: { Sun:9,  Moon:8,  Mercury:6,  Venus:9,  Mars:6,  Jupiter:10, Saturn:5  },
  Saturn:  { Sun:3,  Moon:4,  Mercury:6,  Venus:5,  Mars:4,  Jupiter:5,  Saturn:10 }
};

const BANDS = [
  { min:85, name:"Natural Resonance", hex:"#3fdc8b",
    blurb:"These two run on the same current. Understanding arrives before it is asked for — the work is making sure something still gets challenged." },
  { min:70, name:"Magnetic Polarity", hex:"#4fe6d0",
    blurb:"Strong pull with real charge in it. The attraction is structural, and so is the friction; this pairing is rarely lukewarm." },
  { min:55, name:"Conscious Translation", hex:"#ffd35e",
    blurb:"Workable, but nothing is automatic. Every point of contact has to be interpreted rather than assumed." },
  { min:45, name:"Productive Friction", hex:"#ff9f43",
    blurb:"Genuinely difficult and genuinely useful. The pressure is structural, not personal — and it is the kind that produces movement." },
  { min:0,  name:"High Effort", hex:"#ff5f45",
    blurb:"Almost nothing in common at the structural level. This pairing can work, but only deliberately, and only with both parties translating in good faith." }
];
const bandOf = (n) => BANDS.find(b => n >= b.min);

function classicalRuler(s){
  const r = s.rulers.find(x => x.type === "trad" || x.type === "both");
  return r ? r.body.replace(VS15, "") : "Sun";
}

const _compatCache = {};
function compat(i, j){
  const key = Math.min(i,j) + "-" + Math.max(i,j);
  if (_compatCache[key]) return _compatCache[key];

  const a = SIGNS[i], b = SIGNS[j];
  const dd = dist(i, j);
  const asp = ASPECTS[dd];

  const aspPts = ASPECT_SCORE[dd];
  const elPts  = ELEMENT_PAIR[[a.element, b.element].sort().join("|")];
  const modPts = a.modality === b.modality
    ? MODALITY_PAIR.same
    : MODALITY_PAIR[[a.modality, b.modality].sort().join("|")];
  const polPts = a.polarity === b.polarity ? 10 : 6;
  const ra = classicalRuler(a), rb = classicalRuler(b);
  const rulPts = PLANET_AFFINITY[ra][rb];

  const total = aspPts + elPts + modPts + polPts + rulPts;

  const soft = (dd === 4 || dd === 2);
  const aspNote = asp.name + " · " + asp.deg + " — " +
    (dd === 6 ? "polarised, high charge"
     : dd === 0 ? "identical, no distance to negotiate"
     : soft ? "flowing, low resistance" : "friction-bearing");

  let elNote;
  if (a.element === b.element){
    elNote = "Both " + a.element + " — one shared language, no translation required.";
  } else if (elPts === 25){
    elNote = a.element + " and " + b.element + " — complementary. " +
      (elPts === 25 && (a.element === "Fire" || b.element === "Fire")
        ? "Air feeds fire; fire gives air something to carry."
        : "Water gives earth something to grow; earth gives water a shape.");
  } else {
    elNote = a.element + " (" + ELEMENTS[a.element].temper + ") against " +
      b.element + " (" + ELEMENTS[b.element].temper + ") — temperaments that do not naturally mix.";
  }

  const modNote = a.modality === b.modality
    ? "Both " + a.modality + " — identical tempo, so they compete for the same moment."
    : a.modality + " and " + b.modality + " — staggered tempos that cover for each other.";

  const polNote = a.polarity === b.polarity
    ? "Both " + a.polarity + " — the same fundamental orientation."
    : a.polarity + " meets " + b.polarity + " — opposite orientation, magnetic but effortful.";

  const rulNote = ra === rb
    ? "Shared classical ruler — " + (PLANET_GLYPH[ra] || "") + " " + ra + ". The deepest kinship available on the wheel."
    : (PLANET_GLYPH[ra] || "") + " " + ra + " and " + (PLANET_GLYPH[rb] || "") + " " + rb + " — " +
      (rulPts >= 8 ? "classical sympathy." : rulPts >= 6 ? "neutral regard." : "classical antipathy.");

  const out = {
    total: total,
    band: bandOf(total),
    aspect: asp,
    parts: [
      { label:"Angular aspect",   value:aspPts, max:40, note:aspNote },
      { label:"Elemental blend",  value:elPts,  max:25, note:elNote  },
      { label:"Modal tempo",      value:modPts, max:15, note:modNote },
      { label:"Polarity",         value:polPts, max:10, note:polNote },
      { label:"Ruler affinity",   value:rulPts, max:10, note:rulNote }
    ]
  };
  _compatCache[key] = out;
  return out;
}

/* ranked list of every other sign, best first */
function rankFor(i){
  return SIGNS.map((s, j) => j === i ? null : { i:j, sign:s, c:compat(i, j) })
              .filter(Boolean)
              .sort((x, y) => y.c.total - x.c.total);
}
const elColor = (s) => ELEMENTS[s.element].hex;

/* ============================================================================
   3. STATE
   ==========================================================================*/
const state = {
  elements: new Set(),
  modalities: new Set(),
  oppositions: new Set(),   // "all" or individual axis keys
  selection: [],            // up to two sign indices
  rays: false,              // compatibility rays from a single selected sign
  matrix: false             // full 12x12 compatibility matrix in the panel
};

const layerBg     = document.getElementById("layer-bg");
const layerAspect = document.getElementById("layer-aspects");
const layerPair   = document.getElementById("layer-pair");
const layerNodes  = document.getElementById("layer-nodes");
const layerHub    = document.getElementById("layer-hub");
const panelBody   = document.getElementById("panelBody");
const panelTitle  = document.getElementById("panelTitle");
const selStrip    = document.getElementById("selStrip");

/* ============================================================================
   4. STARFIELD
   ==========================================================================*/
/* Honour reduced-motion in JS as well as CSS: don't create 170 animated
   layers at all if the user has asked for less movement. */
var REDUCE_MOTION = (function(){
  try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
  catch (e){ return false; }
})();

/* Smooth scrolling is motion too — one helper so every call site agrees. */
function scrollBehavior(){ return REDUCE_MOTION ? "auto" : "smooth"; }

(function starfield(){
  const host = document.getElementById("stars");
  if (REDUCE_MOTION) return;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 170; i++){
    const s = document.createElement("i");
    const size = Math.random() < .86 ? (Math.random()*1.5 + .6) : (Math.random()*2.4 + 1.8);
    s.style.width = s.style.height = size.toFixed(2) + "px";
    s.style.left = (Math.random()*100).toFixed(3) + "%";
    s.style.top  = (Math.random()*100).toFixed(3) + "%";
    s.style.animationDuration = (2.6 + Math.random()*6).toFixed(2) + "s";
    s.style.animationDelay = (-Math.random()*8).toFixed(2) + "s";
    if (Math.random() < .18) s.style.background = Math.random() < .5 ? "#bcd4ff" : "#ffd9c0";
    frag.appendChild(s);
  }
  host.appendChild(frag);
})();

/* ============================================================================
   5. WHEEL BACKGROUND
   ==========================================================================*/
(function drawBackground(){
  layerBg.appendChild(el("circle", { cx:CX, cy:CY, r:378, fill:"url(#voidGrad)" }));
  [378, 356, 244, 176].forEach((r, i) =>
    layerBg.appendChild(el("circle", { cx:CX, cy:CY, r, class: i===1 ? "ring" : "ring-faint" }))
  );
  // dashed inner orbit
  const dash = el("circle", { cx:CX, cy:CY, r:210, class:"ring-faint" });
  dash.setAttribute("stroke-dasharray", "2 8");
  layerBg.appendChild(dash);

  // 36 minor ticks (every 10°) + 12 major ticks (every 30°)
  for (let d = 0; d < 360; d += 10){
    const a = (d - 90) * Math.PI/180;
    const major = d % 30 === 0;
    const r1 = major ? 356 : 366, r2 = 378;
    layerBg.appendChild(el("line", {
      x1: CX + r1*Math.cos(a), y1: CY + r1*Math.sin(a),
      x2: CX + r2*Math.cos(a), y2: CY + r2*Math.sin(a),
      class: major ? "tick" : "tick-min"
    }));
  }
  // cusp spokes
  for (let i = 0; i < 12; i++){
    const a = (i*30 - 105) * Math.PI/180;
    layerBg.appendChild(el("line", {
      x1: CX + 176*Math.cos(a), y1: CY + 176*Math.sin(a),
      x2: CX + 356*Math.cos(a), y2: CY + 356*Math.sin(a),
      class:"tick-min"
    }));
  }
})();

/* ============================================================================
   6. HUB
   ==========================================================================*/
let hubGlyph, hubT1, hubT2;
(function drawHub(){
  layerHub.appendChild(el("circle", { cx:CX, cy:CY, r:132, fill:"url(#hubGrad)" }));
  layerHub.appendChild(el("circle", { cx:CX, cy:CY, r:132, class:"hub-ring" }));
  const inner = el("circle", { cx:CX, cy:CY, r:118, class:"hub-ring" });
  inner.setAttribute("stroke-dasharray","1 6");
  layerHub.appendChild(inner);

  hubGlyph = el("text", { x:CX, y:CY-18, class:"hub-glyph", fill:"#cbd4ff" });
  hubGlyph.textContent = "✷";
  hubT1 = el("text", { x:CX, y:CY+22, class:"hub-t1" });
  hubT1.textContent = "Zodiac";
  hubT2 = el("text", { x:CX, y:CY+44, class:"hub-t2" });
  hubT2.textContent = "Select a sign";
  layerHub.append(hubGlyph, hubT1, hubT2);
})();

function setHub(){
  const sel = state.selection;
  if (sel.length === 0){
    hubGlyph.textContent = "✷"; hubGlyph.setAttribute("fill", "#cbd4ff");
    hubT1.textContent = "Zodiac"; hubT2.textContent = "Select a sign";
  } else if (sel.length === 1){
    const s = SIGNS[sel[0]];
    hubGlyph.textContent = s.glyph; hubGlyph.setAttribute("fill", elColor(s));
    hubT1.textContent = s.name;
    hubT2.textContent = s.element + " · " + s.modality;
  } else {
    const a = SIGNS[sel[0]], b = SIGNS[sel[1]];
    const asp = ASPECTS[dist(sel[0], sel[1])];
    hubGlyph.textContent = a.glyph + " " + asp.sym + " " + b.glyph;
    hubGlyph.setAttribute("fill", "#e6ebff");
    hubT1.textContent = asp.name;
    hubT2.textContent = asp.deg + " apart";
  }
}

/* ============================================================================
   7. NODES
   ==========================================================================*/
const nodeEls = [];
SIGNS.forEach((s, i) => {
  const p = posOf(i);
  const g = el("g", {
    class:"node", tabindex:"0", role:"button",
    "aria-label": s.name + ", " + s.element + " " + s.modality + " sign, ruled by " + s.rulers.map(r=>r.body).join(" and "),
    transform:"translate(" + p.x.toFixed(2) + "," + p.y.toFixed(2) + ")"
  });
  g.style.setProperty("--c", elColor(s));

  g.appendChild(el("circle", { class:"halo", r:NODE_R-4, cx:0, cy:0 }));
  g.appendChild(el("circle", { class:"disc", r:NODE_R, cx:0, cy:0 }));
  g.appendChild(el("circle", { class:"rim",  r:NODE_R+7, cx:0, cy:0 }));

  const gl = el("text", { class:"glyph", x:0, y:-9 }); gl.textContent = s.glyph;
  const nm = el("text", { class:"nm", x:0, y:15 });    nm.textContent = s.name.toUpperCase();
  const md = el("text", { class:"md", x:0, y:31 });    md.textContent = s.modality;
  g.append(gl, nm, md);

  g.addEventListener("click", () => toggleSelect(i));
  g.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " "){ e.preventDefault(); toggleSelect(i); }
  });
  layerNodes.appendChild(g);
  nodeEls.push(g);
});

/* ============================================================================
   8. ASPECT LINE RENDERING
   ==========================================================================*/
function drawAspect(i, j, color, width, delay, opacity){
  const p = posOf(i), q = posOf(j);
  const dx = q.x - p.x, dy = q.y - p.y;
  const full = Math.hypot(dx, dy);
  const ux = dx/full, uy = dy/full, pad = NODE_R + 7;
  const x1 = p.x + ux*pad, y1 = p.y + uy*pad;
  const x2 = q.x - ux*pad, y2 = q.y - uy*pad;
  const L = Math.max(1, full - pad*2);

  const g = el("g", { class:"aspect-g" });
  const hit = el("line", { class:"aspect-hit", x1, y1, x2, y2 });
  const line = el("line", { class:"aspect", x1, y1, x2, y2 });
  line.setAttribute("stroke", color);
  line.setAttribute("stroke-width", width);
  line.style.opacity = opacity;
  line.style.strokeDasharray = L + " " + L;
  line.style.strokeDashoffset = L;
  line.style.filter = "drop-shadow(0 0 6px " + color + "AA)";
  line.style.transition = "stroke-dashoffset .85s cubic-bezier(.2,.75,.25,1) " + delay + "ms, stroke-width .25s ease, opacity .3s ease";

  g.append(hit, line);
  g.addEventListener("click", () => { state.selection = [i, j]; syncAll(); });
  g.style.cursor = "pointer";
  layerAspect.appendChild(g);
  requestAnimationFrame(() => requestAnimationFrame(() => { line.style.strokeDashoffset = "0"; }));
}

function renderAspects(){
  layerAspect.textContent = "";
  let k = 0;
  const active = new Set();

  // TRINES — element triangles
  Object.keys(ELEMENTS).forEach(elm => {
    if (!state.elements.has(elm)) return;
    const ids = SIGNS.map((s, i) => s.element === elm ? i : -1).filter(i => i >= 0);
    ids.forEach(i => active.add(i));
    for (let a = 0; a < ids.length; a++){
      const b = (a + 1) % ids.length;
      drawAspect(ids[a], ids[b], ELEMENTS[elm].hex, 1.9, (k++) * 55, .92);
    }
  });

  // SQUARES — modality quadrangles
  Object.keys(MODALITIES).forEach(m => {
    if (!state.modalities.has(m)) return;
    const ids = SIGNS.map((s, i) => s.modality === m ? i : -1).filter(i => i >= 0);
    ids.forEach(i => active.add(i));
    for (let a = 0; a < ids.length; a++){
      const b = (a + 1) % ids.length;
      drawAspect(ids[a], ids[b], MODALITIES[m].hex, 1.7, (k++) * 55, .88);
    }
  });

  // OPPOSITIONS — diameters
  if (state.oppositions.size){
    for (let i = 0; i < 6; i++){
      const key = SIGNS[i].id + "|" + SIGNS[i+6].id;
      if (!state.oppositions.has("all") && !state.oppositions.has(key)) continue;
      active.add(i); active.add(i+6);
      drawAspect(i, i + 6, "#e7ebff", 1.5, (k++) * 55, .8);
    }
  }

  const anyFilter = state.elements.size || state.modalities.size || state.oppositions.size;
  nodeEls.forEach((g, i) => g.classList.toggle("dim", !!anyFilter && !active.has(i)));
}

function renderPair(){
  layerPair.textContent = "";

  /* compatibility rays: one selected sign -> all eleven others */
  if (state.rays && state.selection.length === 1){
    const i = state.selection[0];
    const p = posOf(i);
    SIGNS.forEach((_, j) => {
      if (j === i) return;
      const c = compat(i, j);
      const q = posOf(j);
      const dx = q.x - p.x, dy = q.y - p.y, full = Math.hypot(dx, dy);
      const ux = dx/full, uy = dy/full, pad = NODE_R + 7;
      const x1 = p.x + ux*pad, y1 = p.y + uy*pad;
      const x2 = q.x - ux*pad, y2 = q.y - uy*pad;
      const L = Math.max(1, full - pad*2);
      const t = (c.total - 40) / 55;                 // 0 (worst) .. 1 (best)

      const line = el("line", { class:"ray", x1, y1, x2, y2 });
      line.setAttribute("stroke", c.band.hex);
      line.setAttribute("stroke-width", (1 + t * 3).toFixed(2));
      line.style.opacity = (0.32 + t * 0.55).toFixed(2);
      line.style.filter = "drop-shadow(0 0 5px " + c.band.hex + "AA)";
      line.style.strokeDasharray = L + " " + L;
      line.style.strokeDashoffset = L;
      line.style.transition = "stroke-dashoffset .8s cubic-bezier(.2,.75,.25,1) " + (j * 35) + "ms";
      layerPair.appendChild(line);
      requestAnimationFrame(() => requestAnimationFrame(() => { line.style.strokeDashoffset = "0"; }));

      /* anchor the label a fixed distance back from the target node, so short
         and long rays both label legibly next to the sign they refer to */
      const back = Math.min(36, L * 0.42);
      const lx = x2 - ux * back, ly = y2 - uy * back;
      const num = el("text", { class:"ray-num", x: lx.toFixed(1), y: (ly + 4).toFixed(1) });
      num.setAttribute("fill", c.band.hex);
      num.textContent = c.total;
      layerPair.appendChild(num);
    });
    return;
  }

  if (state.selection.length !== 2) return;
  const [i, j] = state.selection;
  const p = posOf(i), q = posOf(j);
  const dx = q.x - p.x, dy = q.y - p.y, full = Math.hypot(dx, dy);
  const ux = dx/full, uy = dy/full, pad = NODE_R + 8;
  layerPair.appendChild(el("line", {
    class:"pair-line",
    x1: p.x + ux*pad, y1: p.y + uy*pad,
    x2: q.x - ux*pad, y2: q.y - uy*pad
  }));
}

/* ============================================================================
   9. CONTROLS
   ==========================================================================*/
function chip(label, colorVar, pressed){
  const b = document.createElement("button");
  b.type = "button"; b.className = "chip";
  b.setAttribute("aria-pressed", pressed ? "true" : "false");
  if (colorVar){
    b.style.setProperty("--chipc", colorVar);
    b.innerHTML = '<span class="dot" style="color:' + colorVar + '"></span>' + label;
  } else {
    b.textContent = label;
  }
  return b;
}

(function buildControls(){
  const ec = document.getElementById("elemChips");
  Object.keys(ELEMENTS).forEach(name => {
    const b = chip(name, ELEMENTS[name].hex, false);
    b.addEventListener("click", () => {
      state.elements.has(name) ? state.elements.delete(name) : state.elements.add(name);
      b.setAttribute("aria-pressed", state.elements.has(name));
      renderAspects();
    });
    ec.appendChild(b);
  });

  const mc = document.getElementById("modChips");
  Object.keys(MODALITIES).forEach(name => {
    const b = chip(name, MODALITIES[name].hex, false);
    b.addEventListener("click", () => {
      state.modalities.has(name) ? state.modalities.delete(name) : state.modalities.add(name);
      b.setAttribute("aria-pressed", state.modalities.has(name));
      renderAspects();
    });
    mc.appendChild(b);
  });

  const oc = document.getElementById("oppChips");
  const allBtn = chip("All 6 axes", "#e7ebff", false);
  allBtn.addEventListener("click", () => {
    if (state.oppositions.has("all")) state.oppositions.clear();
    else { state.oppositions.clear(); state.oppositions.add("all"); }
    syncOppChips(); renderAspects();
  });
  oc.appendChild(allBtn);

  for (let i = 0; i < 6; i++){
    const key = SIGNS[i].id + "|" + SIGNS[i+6].id;
    const b = chip(SIGNS[i].glyph + " ↔ " + SIGNS[i+6].glyph, null, false);
    b.dataset.axis = key;
    b.style.setProperty("--chipc", "#e7ebff");
    b.style.fontFamily = '"Segoe UI Symbol","Apple Symbols","Noto Sans Symbols 2",sans-serif';
    b.title = SIGNS[i].name + " ↔ " + SIGNS[i+6].name;
    b.addEventListener("click", () => {
      state.oppositions.delete("all");
      state.oppositions.has(key) ? state.oppositions.delete(key) : state.oppositions.add(key);
      syncOppChips(); renderAspects();
    });
    oc.appendChild(b);
  }

  function syncOppChips(){
    allBtn.setAttribute("aria-pressed", state.oppositions.has("all"));
    oc.querySelectorAll("[data-axis]").forEach(b => {
      b.setAttribute("aria-pressed",
        state.oppositions.has("all") || state.oppositions.has(b.dataset.axis));
    });
  }
  window.__syncOppChips = syncOppChips;

  const raysBtn = document.getElementById("btnRays");
  raysBtn.style.setProperty("--chipc", "#a78bfa");
  raysBtn.addEventListener("click", () => {
    state.rays = !state.rays;
    raysBtn.setAttribute("aria-pressed", state.rays);
    renderPair();
  });

  const mxBtn = document.getElementById("btnMatrix");
  mxBtn.style.setProperty("--chipc", "#63d3ff");
  mxBtn.addEventListener("click", () => {
    state.matrix = !state.matrix;
    if (state.matrix) state.selection = [];
    mxBtn.setAttribute("aria-pressed", state.matrix);
    syncAll();
  });

  document.getElementById("btnAll").addEventListener("click", () => {
    Object.keys(ELEMENTS).forEach(n => state.elements.add(n));
    Object.keys(MODALITIES).forEach(n => state.modalities.add(n));
    state.oppositions.clear(); state.oppositions.add("all");
    syncChips(); renderAspects();
  });
  document.getElementById("btnClear").addEventListener("click", () => {
    state.elements.clear(); state.modalities.clear(); state.oppositions.clear();
    state.selection = []; state.matrix = false;
    syncChips(); renderAspects(); syncAll();
  });
})();

function syncChips(){
  document.querySelectorAll("#elemChips .chip").forEach(b => {
    b.setAttribute("aria-pressed", state.elements.has(b.textContent.trim()));
  });
  document.querySelectorAll("#modChips .chip").forEach(b => {
    b.setAttribute("aria-pressed", state.modalities.has(b.textContent.trim()));
  });
  window.__syncOppChips();
}

/* legend */
(function legend(){
  const host = document.getElementById("legend");
  const parts = [];
  Object.keys(ELEMENTS).forEach(n => parts.push('<span><b style="background:' + ELEMENTS[n].hex + ';color:' + ELEMENTS[n].hex + '"></b>' + n + ' · Trine</span>'));
  Object.keys(MODALITIES).forEach(n => parts.push('<span><b style="background:' + MODALITIES[n].hex + ';color:' + MODALITIES[n].hex + '"></b>' + n + ' · Square</span>'));
  parts.push('<span><b style="background:#e7ebff;color:#e7ebff"></b>Opposition Axis</span>');
  host.innerHTML = parts.join("");
})();

/* ============================================================================
   10. SELECTION
   ==========================================================================*/
function toggleSelect(i){
  state.matrix = false;
  const at = state.selection.indexOf(i);
  if (at > -1) state.selection.splice(at, 1);
  else if (state.selection.length < 2) state.selection.push(i);
  else state.selection = [i];
  syncAll();
}
function selectPair(a, b){
  state.matrix = false; state.selection = [a, b]; syncAll();
  if (typeof writeHash === "function" && typeof current !== "undefined" && current === "wheel")
    writeHash("#/wheel/" + SIGNS[a].id + "+" + SIGNS[b].id, true);
}

document.addEventListener("click", function(e){
  const t = e.target.closest("[data-try]");
  if (t){
    const [a, b] = t.dataset.try.split(",").map(Number);
    selectPair(a, b);
  }
});

function syncAll(){
  const mxBtn = document.getElementById("btnMatrix");
  if (mxBtn) mxBtn.setAttribute("aria-pressed", state.matrix);
  nodeEls.forEach((g, i) => g.classList.toggle("selected", state.selection.includes(i)));
  renderPair();
  setHub();
  renderSelStrip();
  renderPanel();
  saveWheelState();
  if (typeof announce === "function"){
    const sel = state.selection;
    if (state.matrix) announce("Compatibility matrix shown.");
    else if (sel.length === 2)
      announce(SIGNS[sel[0]].name + " and " + SIGNS[sel[1]].name + " compared.");
    else if (sel.length === 1) announce(SIGNS[sel[0]].name + " profile shown.");
  }
}

/* Filter chips and selection survive a reload. */
function saveWheelState(){
  if (typeof store !== "function") return;
  store("wheel", {
    elements: [...state.elements],
    modalities: [...state.modalities],
    oppositions: [...state.oppositions],
    selection: state.selection.slice(),
    rays: state.rays
  });
}

function restoreWheelState(){
  if (typeof load !== "function") return;
  const s = load("wheel", null);
  if (!s) return;
  try {
    state.elements    = new Set(s.elements || []);
    state.modalities  = new Set(s.modalities || []);
    state.oppositions = new Set(s.oppositions || []);
    state.selection   = (s.selection || []).filter(i => i >= 0 && i < SIGNS.length);
    state.rays        = !!s.rays;
    const rb = document.getElementById("btnRays");
    if (rb) rb.setAttribute("aria-pressed", state.rays);
    syncChips(); renderAspects(); syncAll();
  } catch (e){ /* stale shape — ignore and start clean */ }
}

/* A rotating nudge beats a dead "No signs selected" on the site's main screen. */
const EMPTY_HINTS = [
  ["aries", "libra", "Try Aries, then Libra — an opposition"],
  ["taurus", "virgo", "Try Taurus, then Virgo — an earth trine"],
  ["cancer", "aries", "Try Cancer, then Aries — a cardinal square"],
  ["gemini", "sagittarius", "Try Gemini, then Sagittarius — a mutable axis"],
  ["leo", "scorpio", "Try Leo, then Scorpio — a fixed square"]
];

function renderSelStrip(){
  if (!state.selection.length){
    const h = EMPTY_HINTS[Math.floor(Math.random() * EMPTY_HINTS.length)];
    const a = SIGNS.findIndex(s => s.id === h[0]);
    const b = SIGNS.findIndex(s => s.id === h[1]);
    selStrip.innerHTML = '<button class="empty-hint try" type="button" ' +
      'data-try="' + a + "," + b + '">' + h[2] + " →</button>";
    return;
  }
  selStrip.innerHTML = "";
  state.selection.forEach(i => {
    const s = SIGNS[i];
    const pill = document.createElement("span");
    pill.className = "sel-pill";
    pill.style.setProperty("--c", elColor(s));
    pill.innerHTML = '<span style="font-family:\'Segoe UI Symbol\',\'Apple Symbols\',serif">' + s.glyph + '</span>' + s.name;
    const x = document.createElement("button");
    x.type = "button"; x.textContent = "×"; x.setAttribute("aria-label", "Remove " + s.name);
    x.addEventListener("click", () => { toggleSelect(i); });
    pill.appendChild(x);
    selStrip.appendChild(pill);
  });
}

/* ============================================================================
   11. PANEL RENDERERS
   ==========================================================================*/
const esc = (t) => String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

function renderPanel(){
  const sel = state.selection;
  if (state.matrix)          { panelTitle.textContent = "Compatibility Matrix"; panelBody.innerHTML = matrixHTML(); }
  else if (sel.length === 0) { panelTitle.textContent = "The Wheel";      panelBody.innerHTML = introHTML(); }
  else if (sel.length === 1) { panelTitle.textContent = "Sign Profile";   panelBody.innerHTML = profileHTML(SIGNS[sel[0]]); }
  else                       { panelTitle.textContent = "Comparison";     panelBody.innerHTML = compareHTML(SIGNS[sel[0]], SIGNS[sel[1]]); }
  panelBody.firstElementChild && panelBody.firstElementChild.classList.add("fade-in");
  panelBody.scrollTop = 0;
  wireRelButtons();
  wireMatrix();
  animateGauge();
}

/* fill the score ring after the markup is in the DOM */
function animateGauge(){
  const ring = panelBody.querySelector(".g-fill");
  if (!ring) return;
  const r = +ring.getAttribute("r");
  const C = 2 * Math.PI * r;
  const pct = +ring.dataset.score / 100;
  ring.style.strokeDasharray = C.toFixed(2);
  ring.style.strokeDashoffset = C.toFixed(2);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    ring.style.strokeDashoffset = (C * (1 - pct)).toFixed(2);
  }));
}

function wireMatrix(){
  panelBody.querySelectorAll("td[data-a]").forEach(td => {
    td.addEventListener("click", () => selectPair(+td.dataset.a, +td.dataset.b));
  });
}

function wireRelButtons(){
  panelBody.querySelectorAll("[data-sign]").forEach(b => {
    b.addEventListener("click", () => {
      const i = idxOf(b.dataset.sign);
      if (b.dataset.pair){ selectPair(idxOf(b.dataset.pair), i); }
      else { state.selection = [i]; syncAll(); }
    });
  });
  panelBody.querySelectorAll("[data-filter]").forEach(b => {
    b.addEventListener("click", () => {
      const [kind, val] = b.dataset.filter.split(":");
      if (kind === "element") state.elements.add(val);
      if (kind === "modality") state.modalities.add(val);
      if (kind === "opposition") state.oppositions.add("all");
      if (kind === "elements") Object.keys(ELEMENTS).forEach(n => state.elements.add(n));
      if (kind === "modalities") Object.keys(MODALITIES).forEach(n => state.modalities.add(n));
      syncChips(); renderAspects();
    });
  });
}

/* ---------- intro ---------- */
function introHTML(){
  const elemRows = Object.keys(ELEMENTS).map(n => {
    const signs = SIGNS.filter(s => s.element === n);
    return '<li><span class="k" style="background:' + ELEMENTS[n].hex + ';color:#04050f">' + n + '</span>' +
      '<span><b style="color:' + ELEMENTS[n].hex + '">' + signs.map(s=>s.glyph+" "+s.name).join(" · ") + '</b><br>' +
      ELEMENTS[n].temper + ' — ' + esc(ELEMENTS[n].desc) + '</span></li>';
  }).join("");

  const modRows = Object.keys(MODALITIES).map(n => {
    const signs = SIGNS.filter(s => s.modality === n);
    return '<li><span class="k" style="background:' + MODALITIES[n].hex + ';color:#04050f">' + n + '</span>' +
      '<span><b style="color:' + MODALITIES[n].hex + '">' + signs.map(s=>s.glyph+" "+s.name).join(" · ") + '</b><br>' +
      esc(MODALITIES[n].desc) + '</span></li>';
  }).join("");

  return '' +
  '<div>' +
    '<p class="intro-lead">Twelve signs, four elements, three modalities, two polarities — and a geometry that ' +
    'is not decorative. Every relationship on this wheel is an exact angular fact.</p>' +

    '<ul class="howto">' +
      '<li><span class="k">Click</span><span>Select any sign to open its full profile — element, modality, house, and every celestial body that rules it.</span></li>' +
      '<li><span class="k">Click ×2</span><span>Select a second sign — or click any aspect line — to open the comparative reading: similarities, differences, and how the two balance.</span></li>' +
      '<li><span class="k">Filter</span><span>Toggle elements, modalities and polarity axes above to draw the trines, squares and oppositions across the wheel.</span></li>' +
      '<li><span class="k">Score</span><span>Every pairing carries a 0–100 compatibility score built from five structural terms. Open the <em>Compatibility matrix</em> for all 66 at once, or switch on <em>Compatibility rays</em> and select one sign to see its ranking drawn on the wheel.</span></li>' +
    '</ul>' +

    '<div class="sect">' +
      '<h3 class="sect-h">The Four Elements <span style="letter-spacing:.05em;text-transform:none;font-weight:500">— trines, 120° apart</span></h3>' +
      '<ul class="howto">' + elemRows + '</ul>' +
      '<div class="rel-row" style="margin-top:10px"><button class="rel" data-filter="elements:all">Draw all four trines ▸</button></div>' +
    '</div>' +

    '<div class="sect">' +
      '<h3 class="sect-h">The Three Modalities <span style="letter-spacing:.05em;text-transform:none;font-weight:500">— squares, 90° apart</span></h3>' +
      '<ul class="howto">' + modRows + '</ul>' +
      '<div class="rel-row" style="margin-top:10px"><button class="rel" data-filter="modalities:all">Draw all three squares ▸</button></div>' +
    '</div>' +

    '<div class="sect">' +
      '<h3 class="sect-h">The Two Polarities <span style="letter-spacing:.05em;text-transform:none;font-weight:500">— oppositions, 180° apart</span></h3>' +
      '<p class="body-copy"><b style="color:var(--text)">Yang</b> — ' + esc(POLARITIES.Yang.desc) + '</p>' +
      '<p class="body-copy"><b style="color:var(--text)">Yin</b> — ' + esc(POLARITIES.Yin.desc) + '</p>' +
      '<div class="rel-row">' +
        Object.keys(AXES).map(k => {
          const [a,b] = k.split("|");
          const A = SIGNS[idxOf(a)], B = SIGNS[idxOf(b)];
          return '<button class="rel" data-sign="' + b + '" data-pair="' + a + '"><span class="g">' + A.glyph + '</span>↔<span class="g">' + B.glyph + '</span> ' + A.name + ' / ' + B.name + '</button>';
        }).join("") +
      '</div>' +
    '</div>' +
  '</div>';
}

/* ---------- single sign profile ---------- */
function profileHTML(s){
  const c = elColor(s);
  const i = idxOf(s.id);
  const opp = SIGNS[(i + 6) % 12];
  const trines = SIGNS.filter(x => x.element === s.element && x.id !== s.id);
  const squares = SIGNS.filter(x => x.modality === s.modality && x.id !== s.id && dist(idxOf(x.id), i) === 3);

  const rulers = s.rulers.map(r =>
    '<div class="ruler">' +
      '<div class="ruler-top">' +
        '<span class="ruler-name"><span class="ruler-sym">' + (PLANET_GLYPH[r.body] || "✦") + '</span>' + esc(r.body) + '</span>' +
        '<span class="tag ' + r.type + '">' + esc(r.label) + '</span>' +
      '</div>' +
      '<p class="ruler-note">' + esc(r.note) + '</p>' +
    '</div>'
  ).join("");

  const relBtn = (x, pair) =>
    '<button class="rel" data-sign="' + x.id + '"' + (pair ? ' data-pair="' + pair + '"' : '') + '>' +
      '<span class="g" style="color:' + elColor(x) + '">' + x.glyph + '</span>' + x.name + '</button>';

  return '' +
  '<div style="--c:' + c + '">' +
    '<div class="prof-head">' +
      '<div class="prof-glyph">' + s.glyph + '</div>' +
      '<div>' +
        '<h3 class="prof-name">' + esc(s.name) + '</h3>' +
        '<p class="prof-sub">' + esc(s.symbol) + ' · ' + esc(s.dates) + '</p>' +
      '</div>' +
    '</div>' +
    '<p class="prof-drive">“' + esc(s.drive) + '”</p>' +
    plainBlock(s) +

    '<dl class="meta-grid">' +
      '<div class="meta"><dt>Element</dt><dd style="color:' + c + '">' + s.element + '</dd></div>' +
      '<div class="meta"><dt>Modality</dt><dd style="color:' + MODALITIES[s.modality].hex + '">' + s.modality + '</dd></div>' +
      '<div class="meta"><dt>Polarity</dt><dd>' + s.polarity + '</dd></div>' +
      '<div class="meta"><dt>House</dt><dd>' + ord(s.house) + ' · ' + esc(s.houseName) + '</dd></div>' +
      '<div class="meta"><dt>Zodiacal Arc</dt><dd>' + esc(s.arc) + '</dd></div>' +
      '<div class="meta"><dt>Quality</dt><dd>' + ELEMENTS[s.element].temper + '</dd></div>' +
      '<div class="meta"><dt>Rules the Body</dt><dd style="font-size:12px;font-weight:500">' + esc(s.bodyPart) + '</dd></div>' +
      '<div class="meta"><dt>Opposite</dt><dd style="font-size:12.5px">' + opp.glyph + ' ' + opp.name + '</dd></div>' +
    '</dl>' +

    '<div class="sect">' +
      '<h3 class="sect-h">Celestial Ruling Bodies</h3>' +
      rulers +
      (s.rulerNote ? '<p class="foot-note">' + esc(s.rulerNote) + '</p>' : '') +
    '</div>' +

    '<div class="sect">' +
      '<h3 class="sect-h">Core Energetic Signature</h3>' +
      '<details class="deeper" style="margin:0 0 12px"><summary>The long version</summary>' +
        '<div class="dbody"><p>' + esc(s.core) + '</p></div></details>' +
      '<div class="kw">' + s.keywords.map(k => '<span>' + esc(k) + '</span>').join("") + '</div>' +
    '</div>' +

    '<div class="sect two-col">' +
      '<div><h4 class="mini-h up">At its best</h4><ul class="tick-list">' +
        s.strengths.map(x => '<li>' + esc(x) + '</li>').join("") + '</ul></div>' +
      '<div><h4 class="mini-h down">Shadow expression</h4><ul class="tick-list">' +
        s.shadows.map(x => '<li>' + esc(x) + '</li>').join("") + '</ul></div>' +
    '</div>' +

    '<div class="sect">' +
      '<h3 class="sect-h">Compatibility Ranking</h3>' +
      '<p class="body-copy" style="font-size:12.5px;margin-bottom:10px">Every other sign scored against ' +
        s.name + ' on aspect, element, modality, polarity and ruler affinity. Click any row for the full reading.</p>' +
      rankFor(i).map(r =>
        '<button class="crow" data-sign="' + r.sign.id + '" data-pair="' + s.id + '">' +
          '<span class="g" style="color:' + elColor(r.sign) + '">' + r.sign.glyph + '</span>' +
          '<span class="nm">' + r.sign.name + '</span>' +
          '<span class="bar-track"><i class="bar-fill" style="--w:' + r.c.total + '%;background:' + r.c.band.hex + '"></i></span>' +
          '<span class="cnum" style="color:' + r.c.band.hex + '">' + r.c.total + '</span>' +
        '</button>'
      ).join("") +
      '<p class="foot-note" style="font-style:normal">Best match: <b style="color:' + rankFor(i)[0].c.band.hex + '">' +
        rankFor(i)[0].sign.name + ' (' + rankFor(i)[0].c.total + ')</b> · hardest: <b style="color:' +
        rankFor(i)[10].c.band.hex + '">' + rankFor(i)[10].sign.name + ' (' + rankFor(i)[10].c.total + ')</b>. ' +
        'Turn on <em>Compatibility rays</em> above to see this ranking drawn across the wheel.</p>' +
    '</div>' +

    '<div class="sect">' +
      '<h3 class="sect-h">Cosmic Relationships</h3>' +
      '<p class="body-copy" style="font-size:12.5px;margin-bottom:8px"><b style="color:' + c + '">Trine ' +
        '(120°, shared ' + s.element + ')</b> — effortless resonance. Click to compare:</p>' +
      '<div class="rel-row" style="margin-bottom:14px">' + trines.map(x => relBtn(x, s.id)).join("") + '</div>' +

      '<p class="body-copy" style="font-size:12.5px;margin-bottom:8px"><b style="color:' + MODALITIES[s.modality].hex + '">Square ' +
        '(90°, shared ' + s.modality + ')</b> — productive friction. Click to compare:</p>' +
      '<div class="rel-row" style="margin-bottom:14px">' + squares.map(x => relBtn(x, s.id)).join("") + '</div>' +

      '<p class="body-copy" style="font-size:12.5px;margin-bottom:8px"><b style="color:#e7ebff">Opposition (180°)</b> — the polarity axis:</p>' +
      '<div class="rel-row">' + relBtn(opp, s.id) + '</div>' +
    '</div>' +
  '</div>';
}

/* ---------- compatibility score block ---------- */
function scoreHTML(c){
  const bars = c.parts.map(pt =>
    '<div class="comp">' +
      '<div class="comp-top"><span class="bar-lbl">' + pt.label + '</span>' +
        '<span class="bar-val">' + pt.value + ' <span style="color:var(--faint);font-weight:500">/ ' + pt.max + '</span></span></div>' +
      '<div class="bar-track"><i class="bar-fill" style="--w:' +
        Math.round(pt.value / pt.max * 100) + '%;background:linear-gradient(90deg,' +
        c.band.hex + '88,' + c.band.hex + ')"></i></div>' +
      '<div class="bar-note">' + esc(pt.note) + '</div>' +
    '</div>'
  ).join("");

  return '' +
  '<div class="sect">' +
    '<h3 class="sect-h">Compatibility Score</h3>' +
    '<div class="score-wrap" style="--sc:' + c.band.hex + '">' +
      '<svg class="gauge" viewBox="0 0 120 120" aria-hidden="true">' +
        '<circle class="g-track" cx="60" cy="60" r="46"/>' +
        '<circle class="g-fill" cx="60" cy="60" r="46" data-score="' + c.total + '"/>' +
        '<text class="g-num" x="60" y="60">' + c.total + '</text>' +
        '<text class="g-den" x="60" y="78">/ 100</text>' +
      '</svg>' +
      '<div class="score-meta">' +
        '<div class="score-band">' + c.band.name + '</div>' +
        '<p class="score-blurb">' + esc(c.band.blurb) + '</p>' +
      '</div>' +
    '</div>' +
    '<div class="bars">' + bars + '</div>' +
    '<details class="method">' +
      '<summary>How this number is built</summary>' +
      '<p>The score is additive and fully decomposable — no hidden weighting, no lookup table of ' +
      'hand-written verdicts. Five structural terms sum to 100:</p>' +
      '<ul>' +
        '<li><code>Angular aspect (40)</code> — trine 38, sextile 33, conjunction 30, opposition 28, square 20, semi-sextile 18, quincunx 15.</li>' +
        '<li><code>Elemental blend (25)</code> — complementary 25, same element 22, mixed 8–12.</li>' +
        '<li><code>Modal tempo (15)</code> — different modalities 11–14, matching modality 6.</li>' +
        '<li><code>Polarity (10)</code> — matching 10, opposed 6.</li>' +
        '<li><code>Ruler affinity (10)</code> — classical sympathy between the two traditional rulers; shared ruler scores 10.</li>' +
      '</ul>' +
      '<p>Across all 66 sign pairs the model spans 44 (Aries–Cancer) to 92 (Gemini–Libra, Cancer–Pisces, Leo–Sagittarius). ' +
      'Affinity uses the seven classical bodies, since Uranus, Neptune and Pluto have no traditional friendship table.</p>' +
      '<p><em>Sun-sign compatibility is a sketch, not a chart. Real synastry compares two whole nativities — ' +
      'Moons, Ascendants, Venus and Mars placements and the aspects between them — and routinely overturns what the Sun signs suggest.</em></p>' +
    '</details>' +
  '</div>';
}

/* ---------- full 12 x 12 matrix ---------- */
let mxPick = 0;

/* the other eleven signs ranked against one, for the narrow-screen view */
function matrixRankedHTML(i){
  const a = SIGNS[i];
  const others = SIGNS.map((b, j) => ({ j, c: compat(i, j) }))
    .filter(x => x.j !== i)
    .sort((x, y) => y.c.total - x.c.total);
  return others.map(x =>
    '<button class="crow" data-sign="' + SIGNS[x.j].id + '" data-pair="' + a.id + '">' +
      '<span class="g" style="color:' + elColor(SIGNS[x.j]) + '">' + SIGNS[x.j].glyph + '</span>' +
      '<span class="nm">' + SIGNS[x.j].name + '</span>' +
      '<span class="bar-track"><i class="bar-fill" style="--w:' + x.c.total +
        '%;background:' + x.c.band.hex + '"></i></span>' +
      '<span class="cnum" style="color:' + x.c.band.hex + '">' + x.c.total + '</span>' +
    '</button>').join("");
}

document.addEventListener("change", function(e){
  if (e.target && e.target.id === "mxPick"){
    mxPick = +e.target.value;
    const host = document.getElementById("mxRanked");
    if (host) host.innerHTML = matrixRankedHTML(mxPick);
  }
});

function matrixHTML(){
  let head = '<tr><th></th>' + SIGNS.map(x =>
    '<th title="' + x.name + '" style="color:' + elColor(x) + '">' + x.glyph + '</th>').join("") + '</tr>';

  const rows = SIGNS.map((a, i) =>
    '<tr><th title="' + a.name + '" style="color:' + elColor(a) + '">' + a.glyph + '</th>' +
      SIGNS.map((b, j) => {
        if (i === j) return '<td class="self">·</td>';
        const c = compat(i, j);
        return '<td data-a="' + i + '" data-b="' + j + '" title="' + a.name + ' + ' + b.name +
               ' — ' + c.total + ', ' + c.band.name + '" style="background:' + c.band.hex + '">' +
               c.total + '</td>';
      }).join("") +
    '</tr>').join("");

  const legend = BANDS.map(b =>
    '<span><b style="background:' + b.hex + '"></b>' + b.name + ' · ' + b.min + '+</span>').join("");

  const ranked = [];
  for (let i = 0; i < 12; i++) for (let j = i + 1; j < 12; j++) ranked.push({ i, j, c: compat(i, j) });
  ranked.sort((x, y) => y.c.total - x.c.total);
  const listRow = (r) =>
    '<button class="crow" data-sign="' + SIGNS[r.j].id + '" data-pair="' + SIGNS[r.i].id + '">' +
      '<span class="g" style="color:' + elColor(SIGNS[r.i]) + '">' + SIGNS[r.i].glyph + '</span>' +
      '<span class="nm">' + SIGNS[r.i].name + ' &amp; ' + SIGNS[r.j].name + '</span>' +
      '<span class="bar-track"><i class="bar-fill" style="--w:' + r.c.total + '%;background:' + r.c.band.hex + '"></i></span>' +
      '<span class="cnum" style="color:' + r.c.band.hex + '">' + r.c.total + '</span>' +
    '</button>';

  /* Narrow screens get a pick-a-sign ranked list instead of a 13-column grid
     of 24px cells — same data, operable with a thumb. */
  const picker =
    '<div class="mx-narrow">' +
      '<label class="mx-pick-label" for="mxPick">Compare a sign against the other eleven</label>' +
      '<select id="mxPick" class="mx-pick">' +
        SIGNS.map((s, i) =>
          '<option value="' + i + '"' + (i === (mxPick || 0) ? " selected" : "") + '>' +
          s.glyph + '  ' + s.name + '</option>').join("") +
      '</select>' +
      '<div id="mxRanked">' + matrixRankedHTML(mxPick || 0) + '</div>' +
    '</div>';

  return '' +
  '<div>' +
    '<p class="intro-lead">All 66 pairings, scored on the same five structural terms. ' +
    'Click any cell to open the full comparative reading.</p>' +
    picker +
    '<div class="mx-wrap"><table class="mx">' + head + rows + '</table></div>' +
    '<div class="mx-legend">' + legend + '</div>' +
    '<div class="sect" style="margin-top:22px">' +
      '<h3 class="sect-h">Five strongest pairings</h3>' +
      ranked.slice(0, 5).map(listRow).join("") +
    '</div>' +
    '<div class="sect">' +
      '<h3 class="sect-h">Five hardest pairings</h3>' +
      ranked.slice(-5).reverse().map(listRow).join("") +
    '</div>' +
    '<p class="foot-note">A high score means less structural resistance, not more value. ' +
    'The friction-heavy pairings at the bottom of this matrix are where most of the growth in astrology is said to happen.</p>' +
  '</div>';
}

/* ---------- comparison ---------- */
function sharedRulers(a, b){
  const an = a.rulers.map(r => r.body), bn = b.rulers.map(r => r.body);
  return an.filter(n => bn.includes(n));
}
function complementary(e1, e2){
  return (e1 === "Fire" && e2 === "Air") || (e1 === "Air" && e2 === "Fire") ||
         (e1 === "Earth" && e2 === "Water") || (e1 === "Water" && e2 === "Earth");
}
function primaryRuler(s, kind){
  const r = s.rulers.find(x => x.type === kind || x.type === "both");
  return r ? r.body : "—";
}

function compareHTML(a, b){
  if (idxOf(a.id) > idxOf(b.id)) { const t = a; a = b; b = t; }
  const ia = idxOf(a.id), ib = idxOf(b.id);
  const d = dist(ia, ib);
  const asp = ASPECTS[d];
  const ca = elColor(a), cb = elColor(b);
  const shared = sharedRulers(a, b);
  const axisKey = [a.id, b.id].sort((x, y) => idxOf(x) - idxOf(y)).join("|");
  const axis = AXES[axisKey];

  /* ---- similarities ---- */
  const sims = [];
  if (a.element === b.element){
    sims.push("<b>Same element — " + a.element + ".</b> " + capitalize(ELEMENTS[a.element].desc) +
      " Both metabolise experience the same way, which is why they rarely have to explain themselves to each other.");
  } else if (complementary(a.element, b.element)){
    sims.push("<b>Complementary elements — " + a.element + " and " + b.element + ".</b> " +
      (a.element === "Fire" || b.element === "Fire"
        ? "Air feeds fire and fire gives air something to carry; the classical pairing of the two projective elements."
        : "Water gives earth something to grow, and earth gives water a shape to hold; the classical pairing of the two receptive elements.") +
      " They are different, but not opposed.");
  }
  if (a.modality === b.modality){
    sims.push("<b>Same modality — " + a.modality + ".</b> " + MODALITIES[a.modality].desc +
      " They move at the same tempo, and they hit the same wall at the same time.");
  }
  if (a.polarity === b.polarity){
    sims.push("<b>Same polarity — " + a.polarity + ".</b> Both are " + POLARITIES[a.polarity].desc);
  }
  shared.forEach(body => {
    const ra = a.rulers.find(r => r.body === body), rb = b.rulers.find(r => r.body === body);
    sims.push("<b>A shared ruling body — " + (PLANET_GLYPH[body] || "") + " " + body + ".</b> " +
      "The same planet governs both signs (" + ra.label.toLowerCase() + " for " + a.name +
      ", " + rb.label.toLowerCase() + " for " + b.name + "). Shared rulership is the deepest form of kinship in the chart: " +
      "two signs running the same instrument in different registers.");
  });
  if (d === 4 || d === 2){
    sims.push("<b>A supportive angle — the " + asp.name.toLowerCase() + ".</b> " + asp.def);
  }
  if (!sims.length){
    sims.push("<span style='color:var(--muted)'><b>Nothing structural in common.</b> No shared element, modality, polarity or ruler. " +
      "This is the zodiac's deliberate design: signs " + asp.deg + " apart are built to have no common language, so that any understanding between them has to be earned rather than assumed.</span>");
  }

  /* ---- differences ---- */
  const row = (label, va, vb, match, ca2, cb2) =>
    '<tr' + (match ? ' class="match"' : '') + '>' +
      '<td class="lbl">' + label + '</td>' +
      '<td class="a"' + (ca2 ? ' style="color:' + ca2 + '"' : '') + '>' + va + '</td>' +
      '<td' + (cb2 ? ' style="color:' + cb2 + '"' : '') + '>' + vb + '</td>' +
    '</tr>';

  const diffRows =
    row("Element", a.element, b.element, a.element === b.element, ca, cb) +
    row("Modality", a.modality, b.modality, a.modality === b.modality,
        MODALITIES[a.modality].hex, MODALITIES[b.modality].hex) +
    row("Polarity", a.polarity, b.polarity, a.polarity === b.polarity) +
    row("Traditional ruler",
        (PLANET_GLYPH[primaryRuler(a,"trad")] || "") + " " + primaryRuler(a, "trad"),
        (PLANET_GLYPH[primaryRuler(b,"trad")] || "") + " " + primaryRuler(b, "trad"),
        primaryRuler(a,"trad") === primaryRuler(b,"trad")) +
    row("Modern ruler",
        (PLANET_GLYPH[primaryRuler(a,"mod")] || "") + " " + primaryRuler(a, "mod"),
        (PLANET_GLYPH[primaryRuler(b,"mod")] || "") + " " + primaryRuler(b, "mod"),
        primaryRuler(a,"mod") === primaryRuler(b,"mod")) +
    row("House", ord(a.house) + " · " + a.houseName, ord(b.house) + " · " + b.houseName, false) +
    row("Core drive", esc(a.drive), esc(b.drive), false) +
    row("Tempo", MODALITIES[a.modality].tempo, MODALITIES[b.modality].tempo, a.modality === b.modality) +
    row("Shadow", esc(a.shadows[0]), esc(b.shadows[0]), false);

  /* ---- interconnection ---- */
  let bridge;
  if (d === 0){
    bridge = "Identical placement — there is nothing to reconcile and nothing to learn.";
  } else if (d === 4){
    bridge = a.name + " and " + b.name + " form part of the " + a.element.toLowerCase() +
      " grand trine. What flows between them requires no translation, which is precisely the hazard: a trine can " +
      "circulate the same assumption forever without anyone testing it. The " + a.modality.toLowerCase() + "/" +
      b.modality.toLowerCase() + " difference is the only friction available, and it is worth using.";
  } else if (d === 3){
    bridge = "Both are " + a.modality + ", so they operate at the same speed and want the same kind of motion — but " +
      a.element.toLowerCase() + " and " + b.element.toLowerCase() + " want it for irreconcilable reasons, and their polarities differ. " +
      "This is a square: the pressure is structural, not personal. Handled badly it becomes a standoff between two signs " +
      "who each think the other is being deliberately difficult; handled well it is the most productive tension on the wheel, " +
      "because neither can simply out-wait the other.";
  } else if (d === 6){
    bridge = "This is a full opposition — the same modality and polarity, stretched across complementary elements. " +
      "Opposite signs are not enemies; they are the two halves of one function, and each tends to project onto the other " +
      "exactly the capacity it has refused to develop in itself. " + a.name + " sees in " + b.name +
      " a version of the thing it will not do, and vice versa.";
  } else if (d === 2){
    bridge = "A sextile: complementary elements in the same polarity, running at different tempos. Nothing here is automatic, " +
      "but nothing resists either. The relationship rewards deliberate effort out of all proportion to the effort required — " +
      "which is also why it is so often left unused.";
  } else if (d === 1){
    bridge = "Adjacent signs on the wheel. " + b.name + " is the correction the zodiac applied to " + a.name +
      " — what came next because what came before was insufficient in one specific way. They share no common ground at all, " +
      "and the contact is more instructive than comfortable.";
  } else {
    bridge = "A quincunx — 150°, the angle of adjustment. These two have no shared element, modality or polarity, and no " +
      "geometric harmony to fall back on. Neither can intuit the other, which means every point of contact has to be " +
      "consciously negotiated. Relationships across this angle are either unusually deliberate or they quietly fail.";
  }

  const lendA = a.element === b.element
    ? a.name + " contributes " + MODALITIES[a.modality].gift + " to a shared " + a.element.toLowerCase() + " current."
    : a.name + " lends " + ELEMENTS[a.element].gift + ", plus " + MODALITIES[a.modality].gift + ".";
  const lendB = a.element === b.element
    ? b.name + " contributes " + MODALITIES[b.modality].gift + " to the same current."
    : b.name + " lends " + ELEMENTS[b.element].gift + ", plus " + MODALITIES[b.modality].gift + ".";

  return '' +
  '<div>' +
    '<div class="cmp-head">' +
      '<div class="cmp-sign" style="--c:' + ca + '"><span class="cg">' + a.glyph + '</span>' +
        '<span class="cn">' + a.name + '</span><span class="cs">' + a.element + ' · ' + a.modality + '</span></div>' +
      '<div class="cmp-mid">' +
        '<div class="cmp-angle">' + asp.sym + '</div>' +
        '<div class="cmp-asp">' + asp.name + '</div>' +
        '<div class="cmp-deg">' + asp.deg + ' · ' + Math.abs(a.house - b.house) + ' houses</div>' +
        '<div class="cmp-score" style="color:' + compat(ia, ib).band.hex + '">' +
          compat(ia, ib).total + ' <span style="opacity:.6;font-weight:600">/ 100</span></div>' +
      '</div>' +
      '<div class="cmp-sign" style="--c:' + cb + '"><span class="cg">' + b.glyph + '</span>' +
        '<span class="cn">' + b.name + '</span><span class="cs">' + b.element + ' · ' + b.modality + '</span></div>' +
    '</div>' +

    '<p class="aspect-def">' + esc(asp.def) + '</p>' +

    scoreHTML(compat(ia, ib)) +

    '<div class="sect">' +
      '<h3 class="sect-h">Cosmic Similarities</h3>' +
      '<ul class="sim-list">' +
        sims.map(t => '<li' + (t.indexOf("Nothing structural") > -1 ? ' class="none"' : '') + '><span class="ic">◈</span><span>' + t + '</span></li>').join("") +
      '</ul>' +
    '</div>' +

    '<div class="sect">' +
      '<h3 class="sect-h">Key Differences</h3>' +
      '<table class="diff-table">' +
        '<thead><tr><th></th><th style="color:' + ca + '">' + a.glyph + ' ' + a.name + '</th>' +
        '<th style="color:' + cb + '">' + b.glyph + ' ' + b.name + '</th></tr></thead>' +
        '<tbody>' + diffRows + '</tbody>' +
      '</table>' +
      '<p class="foot-note" style="font-style:normal">Rows in green are structurally shared; everything else is where these two genuinely diverge.</p>' +
    '</div>' +

    '<div class="sect balance">' +
      '<h3 class="sect-h">How They Interconnect &amp; Balance</h3>' +
      '<p>' + esc(bridge) + '</p>' +
      '<div class="lends">' +
        '<div class="lend" style="--lc:' + ca + '"><span><b>' + a.name + ' →</b> ' + esc(lendA) + '</span></div>' +
        '<div class="lend" style="--lc:' + cb + '"><span><b>' + b.name + ' →</b> ' + esc(lendB) + '</span></div>' +
      '</div>' +
      (axis
        ? '<div class="axis-quote"><div class="axh">' + esc(axis.title) + '</div><p>' + esc(axis.text) + '</p></div>'
        : '') +
      '<div class="rel-row" style="margin-top:16px">' +
        '<button class="rel" data-sign="' + a.id + '"><span class="g" style="color:' + ca + '">' + a.glyph + '</span>Full ' + a.name + ' profile</button>' +
        '<button class="rel" data-sign="' + b.id + '"><span class="g" style="color:' + cb + '">' + b.glyph + '</span>Full ' + b.name + ' profile</button>' +
      '</div>' +
    '</div>' +
  '</div>';
}

function capitalize(t){ return t.charAt(0).toUpperCase() + t.slice(1); }


/* ---- plain-language layer (added by the site build) ---- */
function plainBlock(s){
  var p = (typeof SIGNS_PLAIN !== "undefined") ? SIGNS_PLAIN[s.id] : null;
  if (!p) return "";
  return '<div class="plainbox" style="margin:4px 0 14px">' +
      '<p>' + esc(p.plain) + '</p></div>' +
    '<div class="notice calm" style="margin:0 0 16px">' +
      '<b>Common mix-up.</b> ' + esc(p.confuse) + '</div>';
}

/* ============================================================================
   12. BOOT
   ==========================================================================*/
syncAll();
renderAspects();
