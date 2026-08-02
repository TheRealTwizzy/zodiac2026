/* Cosmic Atlas — quiz bank
   cat: "elements" | "modalities" | "rulers" | "aspects" | "houses" | "astronomy" | "basics"
   level: 1 = easy, 2 = medium, 3 = harder
   a: 0-based index of the correct entry in choices
*/
const QUIZ = [

  /* ---------- ELEMENTS ---------- */
  {
    id: "q1",
    cat: "elements",
    level: 1,
    q: "Which element does Scorpio belong to?",
    choices: ["Fire", "Earth", "Air", "Water"],
    a: 3,
    why: "Scorpio is one of the three water signs, along with Cancer and Pisces. The scorpion imagery throws people off — go by the grouping, not the animal."
  },
  {
    id: "q2",
    cat: "elements",
    level: 1,
    q: "Which of these is a fire sign?",
    choices: ["Cancer", "Virgo", "Sagittarius", "Libra"],
    a: 2,
    why: "The fire signs are Aries, Leo and Sagittarius. Cancer is water, Virgo is earth and Libra is air."
  },
  {
    id: "q3",
    cat: "elements",
    level: 1,
    q: "How many signs share each element?",
    choices: ["Two", "Three", "Four", "Six"],
    a: 1,
    why: "Twelve signs divided among four elements gives three signs each. Each trio is spaced evenly around the circle, 120° apart."
  },
  {
    id: "q4",
    cat: "elements",
    level: 2,
    q: "Aquarius, whose symbol is the Water-Bearer, belongs to which element?",
    choices: ["Water", "Air", "Fire", "Earth"],
    a: 1,
    why: "Aquarius is an air sign, grouped with Gemini and Libra. The figure in the symbol is carrying water, not made of it — a classic beginner trap."
  },
  {
    id: "q5",
    cat: "elements",
    level: 2,
    q: "Which trio is made up entirely of earth signs?",
    choices: ["Taurus, Virgo, Capricorn", "Taurus, Libra, Capricorn", "Aries, Leo, Scorpio", "Gemini, Virgo, Pisces"],
    a: 0,
    why: "Taurus, Virgo and Capricorn are the three earth signs. Libra is air, and Aries and Leo are fire."
  },
  {
    id: "q6",
    cat: "elements",
    level: 1,
    q: "Which element does Virgo belong to?",
    choices: ["Fire", "Earth", "Air", "Water"],
    a: 1,
    why: "Virgo sits with Taurus and Capricorn in the earth group. An easy way to remember it: the earth signs are the 2nd, 6th and 10th signs in order."
  },
  {
    id: "q7",
    cat: "elements",
    level: 2,
    q: "In the traditional system, which element is associated with emotion, memory and intuition?",
    choices: ["Fire", "Earth", "Air", "Water"],
    a: 3,
    why: "Astrologers describe water as the feeling element, air as the thinking one, fire as the acting one and earth as the practical one. These are descriptive labels inside the tradition, not measured traits."
  },
  {
    id: "q8",
    cat: "elements",
    level: 1,
    q: "Libra belongs to which element?",
    choices: ["Air", "Water", "Fire", "Earth"],
    a: 0,
    why: "Libra is air, grouped with Gemini and Aquarius. The three air signs are spaced 120° apart around the zodiac circle."
  },

  /* ---------- MODALITIES ---------- */
  {
    id: "q9",
    cat: "modalities",
    level: 1,
    q: "Which modality does Leo belong to?",
    choices: ["Cardinal", "Fixed", "Mutable", "Cadent"],
    a: 1,
    why: "Leo is fixed, along with Taurus, Scorpio and Aquarius. Cadent is a term for houses, not for signs."
  },
  {
    id: "q10",
    cat: "modalities",
    level: 2,
    q: "Which four signs are the cardinal signs?",
    choices: ["Aries, Cancer, Libra, Capricorn", "Taurus, Leo, Scorpio, Aquarius", "Gemini, Virgo, Sagittarius, Pisces", "Aries, Taurus, Gemini, Cancer"],
    a: 0,
    why: "Aries, Cancer, Libra and Capricorn are cardinal. The second option lists the fixed signs and the third lists the mutable ones."
  },
  {
    id: "q11",
    cat: "modalities",
    level: 1,
    q: "How many signs share each modality?",
    choices: ["Three", "Four", "Six", "Two"],
    a: 1,
    why: "Twelve signs across three modalities gives four signs each — one from every element, so each modality group contains a fire, an earth, an air and a water sign."
  },
  {
    id: "q12",
    cat: "modalities",
    level: 3,
    q: "In the tropical zodiac, what do the four cardinal signs have in common?",
    choices: ["Each one begins as a new season begins", "Each one is a fire sign", "Each one is ruled by the Sun", "Each one lasts exactly 28 days"],
    a: 0,
    why: "Tropical Aries starts at the March equinox, Cancer at the June solstice, Libra at the September equinox and Capricorn at the December solstice. The cardinal group is literally the seasonal turning points."
  },
  {
    id: "q13",
    cat: "modalities",
    level: 1,
    q: "Which modality does Gemini belong to?",
    choices: ["Cardinal", "Fixed", "Mutable", "Angular"],
    a: 2,
    why: "Gemini is mutable, with Virgo, Sagittarius and Pisces. The mutable signs close out each season. Angular describes houses, not signs."
  },
  {
    id: "q14",
    cat: "modalities",
    level: 1,
    q: "Which of these is a fixed sign?",
    choices: ["Aries", "Taurus", "Libra", "Sagittarius"],
    a: 1,
    why: "Taurus is fixed. Aries and Libra are cardinal, and Sagittarius is mutable."
  },

  /* ---------- RULERSHIPS ---------- */
  {
    id: "q15",
    cat: "rulers",
    level: 2,
    q: "Which planet rules Aquarius in the traditional system?",
    choices: ["Uranus", "Saturn", "Mercury", "Neptune"],
    a: 1,
    why: "Traditional rulership gives Aquarius to Saturn, which also rules Capricorn. Uranus is the modern assignment, added only after its discovery in 1781."
  },
  {
    id: "q16",
    cat: "rulers",
    level: 1,
    q: "Which planet is given as the modern ruler of Aquarius?",
    choices: ["Saturn", "Uranus", "Pluto", "Neptune"],
    a: 1,
    why: "Modern astrologers assign Uranus to Aquarius. Many keep Saturn alongside it as the traditional or co-ruler."
  },
  {
    id: "q17",
    cat: "rulers",
    level: 2,
    q: "In modern rulerships, which body is assigned to Scorpio?",
    choices: ["Mars", "Pluto", "Saturn", "Neptune"],
    a: 1,
    why: "Modern schemes give Scorpio to Pluto; the traditional ruler is Mars, and plenty of astrologers still use both."
  },
  {
    id: "q18",
    cat: "rulers",
    level: 2,
    q: "Traditionally, Mercury rules Gemini and which other sign?",
    choices: ["Virgo", "Taurus", "Leo", "Pisces"],
    a: 0,
    why: "Mercury rules both Gemini and Virgo. In the traditional scheme every planet except the Sun and Moon governs two signs, one on each side of the circle."
  },
  {
    id: "q19",
    cat: "rulers",
    level: 3,
    q: "Which planet rules Pisces in the traditional system?",
    choices: ["Neptune", "Jupiter", "Venus", "The Moon"],
    a: 1,
    why: "Jupiter is the traditional ruler of both Sagittarius and Pisces. Neptune, discovered in 1846, is the modern assignment for Pisces."
  },
  {
    id: "q20",
    cat: "rulers",
    level: 1,
    q: "Which body rules Leo in both the traditional and the modern scheme?",
    choices: ["The Moon", "The Sun", "Mercury", "Mars"],
    a: 1,
    why: "Leo is the Sun's only sign, just as Cancer is the Moon's only sign. Every other sign in the traditional scheme shares its ruler with a partner sign."
  },
  {
    id: "q21",
    cat: "rulers",
    level: 2,
    q: "Venus traditionally rules Libra and which other sign?",
    choices: ["Taurus", "Aries", "Capricorn", "Cancer"],
    a: 0,
    why: "Venus rules Taurus and Libra. Aries and Capricorn belong to Mars and Saturn, and Cancer belongs to the Moon."
  },
  {
    id: "q22",
    cat: "rulers",
    level: 3,
    q: "Why do modern rulerships bring in Uranus, Neptune and Pluto when the traditional scheme does not?",
    choices: ["Those three bodies were only discovered from 1781 onward, long after the traditional scheme was set", "The traditional scheme was lost and had to be rebuilt from scratch", "Astronomers asked astrologers to add them", "They orbit closer to the Sun than Saturn does"],
    a: 0,
    why: "The traditional scheme uses the seven bodies visible to the unaided eye. Uranus was found in 1781, Neptune in 1846 and Pluto in 1930, so astrologers only had them to work with afterwards."
  },

  /* ---------- ASPECTS & GEOMETRY ---------- */
  {
    id: "q23",
    cat: "aspects",
    level: 1,
    q: "A trine is an angle of how many degrees?",
    choices: ["60°", "90°", "120°", "180°"],
    a: 2,
    why: "A trine is 120°, one third of the circle. Draw all three and you get an equilateral triangle across the chart."
  },
  {
    id: "q24",
    cat: "aspects",
    level: 1,
    q: "A square is an angle of how many degrees?",
    choices: ["45°", "90°", "120°", "150°"],
    a: 1,
    why: "A square is 90°, one quarter of the circle. The 45° angle is a semi-square and 150° is a quincunx — both are minor aspects."
  },
  {
    id: "q25",
    cat: "aspects",
    level: 1,
    q: "Two planets sitting on opposite sides of the chart, 180° apart, form which aspect?",
    choices: ["A conjunction", "A sextile", "An opposition", "A trine"],
    a: 2,
    why: "180° is an opposition — the two bodies face each other across the wheel, and the pair always falls in signs of the same modality."
  },
  {
    id: "q26",
    cat: "aspects",
    level: 2,
    q: "A sextile is an angle of how many degrees?",
    choices: ["30°", "60°", "72°", "90°"],
    a: 1,
    why: "A sextile is 60°, one sixth of the circle. That is also exactly two signs apart, since each sign spans 30°."
  },
  {
    id: "q27",
    cat: "aspects",
    level: 2,
    q: "Signs that share the same element are how many degrees apart along the zodiac?",
    choices: ["60°", "90°", "120°", "180°"],
    a: 2,
    why: "Same-element signs sit 120° apart, which is why they form trines. Aries at 0°, Leo at 120° and Sagittarius at 240° make the fire triangle."
  },
  {
    id: "q28",
    cat: "aspects",
    level: 1,
    q: "Two planets in nearly the same spot along the zodiac, close to 0° apart, are described as being in...",
    choices: ["conjunction", "opposition", "square", "sextile"],
    a: 0,
    why: "That is a conjunction. Astronomically it just means the two bodies share almost the same ecliptic longitude as seen from Earth."
  },
  {
    id: "q29",
    cat: "aspects",
    level: 2,
    q: "Which sign sits directly opposite Taurus, 180° away?",
    choices: ["Scorpio", "Leo", "Aquarius", "Virgo"],
    a: 0,
    why: "Taurus is the 2nd sign and Scorpio the 8th, exactly six signs apart — six times 30° is 180°. Every sign has one partner directly across the wheel."
  },
  {
    id: "q30",
    cat: "aspects",
    level: 3,
    q: "In astrological practice, what does an orb mean?",
    choices: ["The margin either side of an exact angle within which an aspect is still counted", "The physical size of a planet", "The outer circle drawn around a chart wheel", "A planet's distance from the Sun"],
    a: 0,
    why: "Angles are almost never exact, so astrologers allow a tolerance — for example calling 118° a trine. How wide an orb to permit is a matter of convention, and practitioners disagree."
  },

  /* ---------- HOUSES ---------- */
  {
    id: "q31",
    cat: "houses",
    level: 1,
    q: "How many houses does a standard astrological chart divide the sky into?",
    choices: ["Eight", "Ten", "Twelve", "Thirteen"],
    a: 2,
    why: "Twelve houses, matching the twelve signs in number — but they are a separate layer of the chart, cut a different way."
  },
  {
    id: "q32",
    cat: "houses",
    level: 2,
    q: "The cusp, or starting edge, of the 1st house is better known as...",
    choices: ["the Midheaven", "the Ascendant, or rising sign", "the Descendant", "the Nadir"],
    a: 1,
    why: "The Ascendant is the degree of the ecliptic rising on the eastern horizon at the moment and place of birth. The Descendant is its opposite point, on the western horizon."
  },
  {
    id: "q33",
    cat: "houses",
    level: 3,
    q: "What is the difference between the signs and the houses?",
    choices: ["Signs divide the Sun's yearly path; houses divide the sky relative to the local horizon at one moment and place", "Houses divide the Sun's path and signs divide the horizon", "They are two names for the same twelve divisions", "Houses are used only in sidereal astrology"],
    a: 0,
    why: "Signs come from Earth's yearly orbit, houses come from Earth's daily rotation. That is why two people born the same day in different places can share sun signs but have different rising signs."
  },
  {
    id: "q34",
    cat: "houses",
    level: 2,
    q: "In many house systems, the cusp of the 10th house is called...",
    choices: ["the Ascendant", "the Midheaven, or Medium Coeli", "the Vertex", "the Descendant"],
    a: 1,
    why: "The Midheaven is the highest point of the ecliptic above the horizon at that moment. It is usually abbreviated MC, from the Latin Medium Coeli."
  },
  {
    id: "q35",
    cat: "houses",
    level: 2,
    q: "Why does an accurate birth time matter so much for the houses?",
    choices: ["Because the Sun changes sign every few hours", "Because Earth's rotation sweeps the whole zodiac past the horizon in about 24 hours, so the rising degree is always moving", "Because the Moon completes an orbit in a single day", "Because houses are recalculated every leap year"],
    a: 1,
    why: "Earth turns once a day, so the entire 360° of the zodiac passes the horizon in that time. The Sun by contrast takes about a month to cross one sign, which is why sun signs are far less time-sensitive."
  },
  {
    id: "q36",
    cat: "houses",
    level: 3,
    q: "On average, how quickly does the rising degree on the eastern horizon advance?",
    choices: ["About 1° every 4 minutes", "About 1° every hour", "About 1° every day", "About 1° every 72 years"],
    a: 0,
    why: "360° in roughly 24 hours works out to about 1° every 4 minutes, though the real rate speeds up and slows down depending on latitude and which sign is rising. The 72-year figure belongs to precession, a completely different motion."
  },

  /* ---------- ASTRONOMY ---------- */
  {
    id: "q37",
    cat: "astronomy",
    level: 2,
    q: "About how long does one full cycle of Earth's axial precession take?",
    choices: ["2,160 years", "12,000 years", "25,772 years", "100,000 years"],
    a: 2,
    why: "One complete wobble of Earth's axis takes about 25,772 years, which works out to roughly 1° every 72 years. Divide that cycle by twelve and you get the 2,160-year figure sometimes quoted for an astrological age."
  },
  {
    id: "q38",
    cat: "astronomy",
    level: 3,
    q: "The Sun's yearly path crosses one constellation that is not among the twelve zodiac signs. Which?",
    choices: ["Orion", "Ophiuchus", "Cetus", "Draco"],
    a: 1,
    why: "The Sun passes through the lower part of Ophiuchus for about two and a half weeks each year, between Scorpius and Sagittarius. It has never been a sign, because signs are equal 30° slices rather than star patterns."
  },
  {
    id: "q39",
    cat: "astronomy",
    level: 1,
    q: "Which of these planets cannot be seen with the unaided eye?",
    choices: ["Mars", "Saturn", "Neptune", "Venus"],
    a: 2,
    why: "The naked-eye planets are Mercury, Venus, Mars, Jupiter and Saturn — which is why the traditional system has seven bodies, those five plus the Sun and Moon. Neptune needs at least binoculars."
  },
  {
    id: "q40",
    cat: "astronomy",
    level: 1,
    q: "In 2006 the International Astronomical Union reclassified Pluto as...",
    choices: ["a moon of Neptune", "a dwarf planet", "a comet", "an asteroid"],
    a: 1,
    why: "The IAU adopted a formal definition of planet in 2006, and Pluto did not meet the clause about clearing its orbital neighbourhood. Nothing about Pluto itself changed — only the category we file it under."
  },
  {
    id: "q41",
    cat: "astronomy",
    level: 3,
    q: "What is actually happening during a Mercury retrograde?",
    choices: ["Mercury reverses direction and orbits the Sun backwards for a few weeks", "Mercury appears to drift backwards against the background stars as it overtakes Earth on its faster inner orbit", "Mercury stops moving entirely", "Mercury passes behind the Sun and is hidden from view"],
    a: 1,
    why: "Retrograde motion is a viewing effect, not a real reversal. Mercury laps Earth on the inside track, and while it passes us its apparent position among the stars slides backwards — the same illusion as a faster car seeming to slip backwards as you overtake it."
  },
  {
    id: "q42",
    cat: "astronomy",
    level: 2,
    q: "About how long does Saturn take to complete one orbit of the Sun?",
    choices: ["12 years", "29.5 years", "84 years", "248 years"],
    a: 1,
    why: "Saturn's orbital period is about 29.46 years. The other figures are close to Jupiter at 11.86 years, Uranus at 84 years and Pluto at 248 years."
  },
  {
    id: "q43",
    cat: "astronomy",
    level: 2,
    q: "Who discovered Uranus, and when?",
    choices: ["Galileo, in 1610", "William Herschel, in 1781", "Johann Galle, in 1846", "Clyde Tombaugh, in 1930"],
    a: 1,
    why: "William Herschel spotted Uranus in 1781 with a homemade telescope. Galle observed Neptune in 1846 where Le Verrier's and Adams's calculations predicted it, and Tombaugh found Pluto in 1930."
  },
  {
    id: "q44",
    cat: "astronomy",
    level: 3,
    q: "Which statement about the twelve zodiac constellations is true?",
    choices: ["They are all exactly 30° wide", "They vary widely in size, from roughly 7° to roughly 44° along the Sun's path", "They each contain the same number of bright stars", "They can only be seen from the northern hemisphere"],
    a: 1,
    why: "Constellations are irregular patches of sky: the Sun crosses Scorpius in about a week and takes over six weeks to cross Virgo. Only the signs are equal, because equal 30° slices are a measuring convention rather than a star pattern."
  },

  /* ---------- BASICS ---------- */
  {
    id: "q45",
    cat: "basics",
    level: 1,
    q: "How many signs make up the zodiac?",
    choices: ["Ten", "Twelve", "Thirteen", "Twenty-four"],
    a: 1,
    why: "Twelve, a number that comes from the Moon completing roughly twelve cycles of phases in one solar year."
  },
  {
    id: "q46",
    cat: "basics",
    level: 1,
    q: "How wide is each zodiac sign?",
    choices: ["12°", "30°", "36°", "45°"],
    a: 1,
    why: "A full circle is 360°, divided by twelve, so each sign is exactly 30° wide. Babylonian mathematics counted in base 60, which is where the 360° circle comes from."
  },
  {
    id: "q47",
    cat: "basics",
    level: 1,
    q: "What does someone's sun sign refer to?",
    choices: ["The sign the Sun occupied along the ecliptic at the moment of their birth", "The sign rising in the east at their birth", "The brightest constellation visible on their birthday", "The sign the Moon occupied at their birth"],
    a: 0,
    why: "The sun sign is just where the Sun sat in the zodiac band on that date. The rising sign and the moon sign are separate placements, and a full chart tracks all of them."
  },
  {
    id: "q48",
    cat: "basics",
    level: 2,
    q: "The zodiac is a band of sky centred on which line?",
    choices: ["The celestial equator", "The ecliptic, the Sun's apparent yearly path", "The Milky Way", "The horizon"],
    a: 1,
    why: "The ecliptic is the line the Sun traces against the stars over a year. The Moon and planets stay within a few degrees of it, which is why that narrow band is the part of the sky the zodiac maps."
  }

];
