/* Cosmic Atlas — glossary.
   Astronomical terms are defined as astronomy defines them. Astrological
   terms are described as the tradition uses them, without endorsement and
   without mockery. Nothing here forecasts anything.
   Sorted alphabetically by term. */

const GLOSSARY = [
  {
    id: "air",
    term: "Air (element)",
    short: "Gemini, Libra, Aquarius — the thinking, connecting element.",
    full: "One of the four classical elements, shared by Gemini, Libra and Aquarius. Astrologers associate air with language, ideas, comparison and social contact — the impulse to describe a thing rather than to feel it. Air signs alternate around the zodiac with fire signs, and together the two are called the active or extraverted polarity.",
    cat: "basic",
    see: ["element", "fire", "earth-element", "water", "polarity"]
  },
  {
    id: "angular-houses",
    term: "Angular houses",
    short: "Houses 1, 4, 7 and 10 — the four strongest corners.",
    full: "The four houses that begin at the chart's angles: the 1st at the Ascendant, the 4th at the IC, the 7th at the Descendant, the 10th at the Midheaven. Traditionally these are the most prominent positions in a chart, and a planet placed in one is described as strongly placed. The other two groups are the succedent houses (2, 5, 8, 11) and the cadent houses (3, 6, 9, 12).",
    cat: "house",
    see: ["house", "cadent", "ascendant", "midheaven", "ic", "descendant"]
  },
  {
    id: "ascendant",
    term: "Ascendant",
    short: "The zodiac degree rising in the east at your birth moment.",
    full: "The Ascendant is the exact point of the zodiac coming up over the eastern horizon at a given time and place. It marks the cusp of the first house and sets the whole house framework, which is why an accurate birth time matters so much in chart casting. Because the sky turns roughly one degree every four minutes, the Ascendant moves through all twelve signs in about twenty-four hours.",
    cat: "chart",
    see: ["rising-sign", "descendant", "house", "cusp", "natal-chart"]
  },
  {
    id: "aspect",
    term: "Aspect",
    short: "A meaningful angle between two points in a chart.",
    full: "An aspect is the angular distance between two bodies measured along the zodiac. The five classical, or Ptolemaic, aspects are the conjunction (0°), sextile (60°), square (90°), trine (120°) and opposition (180°). Astrologers read aspects as describing how two parts of a chart relate — easily, tensely, or not at all — and treat unaspected points as comparatively isolated.",
    cat: "aspect",
    see: ["conjunction", "sextile", "square", "trine", "opposition", "orb", "quincunx"]
  },
  {
    id: "aspect-orb",
    term: "Aspect orb",
    short: "How many degrees off exact a given aspect is still counted.",
    full: "Different aspects are conventionally given different allowances. A common modern scheme grants about 8° to conjunctions and oppositions, 6° to squares and trines, 4° to sextiles and 2-3° to minor aspects such as the quincunx. Many astrologers widen the allowance by a degree or two when the Sun or Moon is involved, and narrow it for slow outer planets. There is no agreed standard, so two practitioners can legitimately disagree about whether an aspect exists at all.",
    cat: "aspect",
    see: ["orb", "aspect", "luminary", "quincunx"]
  },
  {
    id: "aspect-pattern",
    term: "Aspect pattern",
    short: "A named shape made by three or more connected aspects.",
    full: "When several aspects link up into a recognisable geometric figure, astrologers name the whole shape rather than reading each angle separately. Common patterns include the grand trine (an equilateral triangle), the T-square (an opposition with a third point square to both) and the grand cross (two oppositions at right angles). Patterns are simply a bookkeeping convenience — a way of describing several aspects at once.",
    cat: "aspect",
    see: ["grand-trine", "t-square", "aspect", "stellium"]
  },
  {
    id: "astrology-vs-astronomy",
    term: "Astrology vs astronomy",
    short: "Same ancient roots; one became a science, one did not.",
    full: "For most of recorded history the two were a single practice: the same people tracked planetary positions and interpreted them. They separated over the seventeenth and eighteenth centuries, as physical explanation replaced symbolic explanation in the study of the sky. Astronomy is now a natural science that measures and models physical objects. Astrology is an interpretive tradition; it is not a science, and controlled studies have not found support for its predictive claims. This site treats it as a symbolic system worth understanding on its own terms, and states astronomical facts as facts.",
    cat: "basic",
    see: ["geocentric", "tropical-zodiac", "precession", "zodiac"]
  },
  {
    id: "benefic",
    term: "Benefic",
    short: "Traditionally the helpful planets — Venus and Jupiter.",
    full: "In traditional astrology, Venus is the lesser benefic and Jupiter the greater benefic. The label describes an expected quality of influence in the older texts, not a moral judgement about the planet. Most modern astrologers use the terms loosely or drop them altogether, on the grounds that any placement can be read constructively or destructively.",
    cat: "body",
    see: ["malefic", "sect", "dignity"]
  },
  {
    id: "cadent",
    term: "Cadent houses",
    short: "Houses 3, 6, 9 and 12 — the ones falling away from the angles.",
    full: "The four houses that immediately precede the angular houses: 3, 6, 9 and 12. The name comes from the Latin for falling, because in the sky's daily rotation these houses are falling away from the angles. Traditional astrology considers planets here less prominent; the classical themes of these houses are learning, work, belief and retreat.",
    cat: "house",
    see: ["angular-houses", "house", "house-system"]
  },
  {
    id: "cardinal",
    term: "Cardinal (modality)",
    short: "Aries, Cancer, Libra, Capricorn — the four signs that start seasons.",
    full: "One of the three modalities. Each cardinal sign begins at a solstice or equinox in the tropical zodiac, so the group is tied directly to the turning points of the year. Astrologers associate cardinal signs with initiation and setting things in motion. The other two modalities are fixed and mutable.",
    cat: "basic",
    see: ["modality", "fixed", "mutable", "equinox", "solstice"]
  },
  {
    id: "chart-ruler",
    term: "Chart ruler",
    short: "The planet that rules your rising sign.",
    full: "Because the first house describes the person as a whole, the planet ruling the sign on its cusp is given special weight and called the chart ruler. A chart with Scorpio rising, for instance, has Mars as its traditional chart ruler, or Pluto in modern practice. Astrologers then look at where that planet sits by sign, house and aspect.",
    cat: "chart",
    see: ["ruler", "ascendant", "rising-sign", "house"]
  },
  {
    id: "conjunction",
    term: "Conjunction",
    short: "Two bodies at roughly the same zodiac degree — 0°.",
    full: "The tightest of the major aspects: two planets occupying nearly the same longitude, so they appear close together along the zodiac. Astrologers read a conjunction as a blending, with the two meanings fused rather than in dialogue. Whether it is treated as easy or difficult depends entirely on which bodies are involved.",
    cat: "aspect",
    see: ["aspect", "opposition", "orb", "stellium"]
  },
  {
    id: "cusp",
    term: "Cusp",
    short: "A boundary line — between two houses, or two signs.",
    full: "In house terms, a cusp is the exact degree where one house ends and the next begins; the first-house cusp is the Ascendant and the tenth-house cusp is the Midheaven. In sign terms, people sometimes say they were born on the cusp when the Sun was near the edge of a sign. Astronomically there is no in-between: at any instant the Sun occupies one zodiac degree, not two.",
    cat: "chart",
    see: ["house", "ascendant", "midheaven", "ic", "descendant", "degree"]
  },
  {
    id: "decan",
    term: "Decan",
    short: "A 10° third of a sign — 36 of them around the zodiac.",
    full: "Each 30° sign divides into three decans of 10° each, giving thirty-six in total. The scheme descends from Egyptian star-clocks, where thirty-six groups of stars marked the hours of the night. Astrologers assign a secondary ruling planet to each decan, so the first decan of Aries reads differently from the third.",
    cat: "technique",
    see: ["degree", "zodiac", "ruler"]
  },
  {
    id: "degree",
    term: "Degree",
    short: "One 360th of the circle; each sign is exactly 30 of them.",
    full: "The zodiac is a full circle of 360 degrees divided into twelve equal signs of 30 degrees each. Positions are usually written as sign, degree and minute — for example 14° Leo 27' — where one degree contains 60 minutes of arc. Fine detail matters because aspects and house cusps are measured to the minute.",
    cat: "astronomy",
    see: ["zodiac", "ecliptic", "orb", "cusp"]
  },
  {
    id: "descendant",
    term: "Descendant",
    short: "The degree setting in the west — opposite the Ascendant.",
    full: "The Descendant is the point of the zodiac going down over the western horizon at a given moment, always exactly 180° from the Ascendant. It marks the cusp of the seventh house, which the tradition assigns to partnership and to anyone met face to face. It is one of the chart's four angles.",
    cat: "chart",
    see: ["ascendant", "angular-houses", "cusp", "house"]
  },
  {
    id: "detriment",
    term: "Detriment",
    short: "A planet in the sign opposite the one it rules.",
    full: "Rulership pairs each planet with a sign; detriment is the sign directly across the zodiac from it. Mars rules Aries, so Mars in Libra is in detriment; Venus rules Libra, so Venus in Aries is in detriment. Traditional astrology reads a planet in detriment as working in unfamiliar conditions rather than as broken.",
    cat: "technique",
    see: ["dignity", "ruler", "fall", "exaltation"]
  },
  {
    id: "dignity",
    term: "Dignity",
    short: "How at home a planet is in the sign it occupies.",
    full: "Dignity is a scoring system inherited from Hellenistic and medieval astrology, rating a planet's condition by sign. The four best-known states are rulership and exaltation (strong), and detriment and fall (weak). Older systems added further layers such as triplicity, term and face, producing a numerical score for each planet.",
    cat: "technique",
    see: ["ruler", "exaltation", "detriment", "fall", "mutual-reception"]
  },
  {
    id: "direct-motion",
    term: "Direct motion",
    short: "A planet moving forward through the zodiac — the normal state.",
    full: "Direct, or prograde, motion means a body's apparent longitude is increasing, carrying it forward through the signs in the usual order. It is the ordinary condition of every planet; retrograde motion is the temporary exception. The moment of turning from one to the other is called a station.",
    cat: "astronomy",
    see: ["retrograde", "stationary", "ecliptic"]
  },
  {
    id: "dwarf-planet",
    term: "Dwarf planet",
    short: "Round, orbits the Sun, but has not cleared its orbital zone.",
    full: "A category defined by the International Astronomical Union in 2006: a body that orbits the Sun, has enough mass to pull itself into a nearly round shape, has not cleared other objects from the neighbourhood of its orbit, and is not a moon. Pluto, Eris, Ceres, Makemake and Haumea are the recognised examples, and Pluto's reclassification that year removed it from the list of planets. Astrologers, whose categories are symbolic rather than physical, generally kept using Pluto exactly as before.",
    cat: "astronomy",
    see: ["astrology-vs-astronomy", "personal-planets"]
  },
  {
    id: "earth-element",
    term: "Earth (element)",
    short: "Taurus, Virgo, Capricorn — the practical, material element.",
    full: "One of the four classical elements, shared by Taurus, Virgo and Capricorn. Astrologers associate earth with substance, patience, usefulness and the evidence of the senses. Earth alternates with water around the zodiac, and the two together form the receptive polarity.",
    cat: "basic",
    see: ["element", "air", "fire", "water", "polarity"]
  },
  {
    id: "ecliptic",
    term: "Ecliptic",
    short: "The Sun's apparent yearly path around the sky.",
    full: "The ecliptic is the great circle traced by the Sun against the background stars over a year — in physical terms, the plane of Earth's orbit projected onto the sky. The Moon and planets stay within a narrow band of about 8-9° either side of it, and that band is the zodiac. Eclipses take their name from it, since they can only happen when the Moon is crossing this line.",
    cat: "astronomy",
    see: ["zodiac", "obliquity", "lunar-node", "equinox", "degree"]
  },
  {
    id: "element",
    term: "Element",
    short: "Fire, earth, air or water — four signs each.",
    full: "The twelve signs divide into four elements of three signs apiece, a scheme borrowed from Greek natural philosophy. Signs of the same element sit 120° apart, which is why they form trines with one another. Element is one of the two main ways of grouping signs; the other is modality.",
    cat: "basic",
    see: ["fire", "earth-element", "air", "water", "modality", "trine", "polarity"]
  },
  {
    id: "ephemeris",
    term: "Ephemeris",
    short: "A table of where the planets are, day by day.",
    full: "An ephemeris lists computed positions of the Sun, Moon and planets for regular intervals, usually daily at midnight or noon. Modern ephemerides are produced by agencies such as NASA's Jet Propulsion Laboratory from precise gravitational models, and the same numbers serve navigators, astronomers and astrologers alike. Chart software simply looks up or interpolates these positions.",
    cat: "astronomy",
    see: ["natal-chart", "transit", "geocentric", "ingress"]
  },
  {
    id: "equinox",
    term: "Equinox",
    short: "The two moments a year when the Sun crosses the equator.",
    full: "An equinox occurs when the Sun crosses the celestial equator, around 20 March and around 22 September. On those dates day and night are close to equal length everywhere on Earth, which is what the name means. The March equinox is the anchor of the tropical zodiac: it defines 0° Aries by definition, regardless of which constellation lies behind the Sun.",
    cat: "astronomy",
    see: ["solstice", "tropical-zodiac", "precession", "ecliptic", "cardinal"]
  },
  {
    id: "exaltation",
    term: "Exaltation",
    short: "A sign where a planet is traditionally considered honoured.",
    full: "Alongside rulership, exaltation marks a sign in which a planet is said to be especially well placed. The classical assignments include the Sun in Aries, the Moon in Taurus, Jupiter in Cancer, Saturn in Libra, Mars in Capricorn, Venus in Pisces and Mercury in Virgo. The opposite sign in each case is that planet's fall.",
    cat: "technique",
    see: ["dignity", "fall", "ruler", "detriment"]
  },
  {
    id: "fall",
    term: "Fall",
    short: "A planet in the sign opposite its exaltation.",
    full: "Fall is the counterpart to exaltation: the sign 180° away from where a planet is honoured. Saturn is exalted in Libra and therefore in fall in Aries; the Sun is exalted in Aries and in fall in Libra. Traditional texts treat it as the weaker of the two debilities, alongside detriment.",
    cat: "technique",
    see: ["exaltation", "detriment", "dignity"]
  },
  {
    id: "fire",
    term: "Fire (element)",
    short: "Aries, Leo, Sagittarius — the driving, outward element.",
    full: "One of the four classical elements, shared by Aries, Leo and Sagittarius. Astrologers associate fire with energy, confidence, impulse and the wish to act before analysing. Fire alternates with air around the zodiac, and the two together form the active polarity.",
    cat: "basic",
    see: ["element", "earth-element", "air", "water", "polarity"]
  },
  {
    id: "fixed",
    term: "Fixed (modality)",
    short: "Taurus, Leo, Scorpio, Aquarius — the middle-of-season signs.",
    full: "One of the three modalities. Each fixed sign falls in the settled middle of a season, after the cardinal sign has begun it. Astrologers associate fixed signs with persistence, consolidation and resistance to change. Note the unrelated use of the word in fixed stars.",
    cat: "basic",
    see: ["modality", "cardinal", "mutable", "fixed-stars"]
  },
  {
    id: "fixed-stars",
    term: "Fixed stars",
    short: "Named background stars used as extra chart points.",
    full: "Stars such as Regulus, Aldebaran, Spica and Algol have carried astrological meanings since antiquity, and some astrologers still note when a planet sits near one. They were called fixed because, unlike the planets, they hold their positions relative to each other. They are not truly fixed: each has its own proper motion, and precession shifts all of them against the tropical zodiac by about one degree every seventy-two years.",
    cat: "astronomy",
    see: ["precession", "tropical-zodiac", "sidereal-zodiac", "fixed"]
  },
  {
    id: "geocentric",
    term: "Geocentric",
    short: "Positions measured as seen from Earth.",
    full: "A geocentric coordinate frame places the observer at the Earth and describes where things appear in the sky from here. Astrological charts are drawn geocentrically, and so are many practical astronomical tables, because that is what an observer on the ground actually sees. Using this frame is a choice of viewpoint, not a claim about physics: the Solar System is heliocentric, with the planets orbiting the Sun.",
    cat: "astronomy",
    see: ["heliocentric", "retrograde", "ephemeris", "natal-chart"]
  },
  {
    id: "grand-trine",
    term: "Grand trine",
    short: "Three bodies forming a 120° triangle, usually in one element.",
    full: "A grand trine appears when three planets sit roughly 120° apart, making an equilateral triangle across the chart. Because signs of the same element are 120° apart, the three points usually share an element — a fire grand trine, a water grand trine, and so on. Astrologers read it as a closed circuit of easy exchange, sometimes so self-sufficient that it goes unused.",
    cat: "aspect",
    see: ["trine", "aspect-pattern", "element", "t-square"]
  },
  {
    id: "heliocentric",
    term: "Heliocentric",
    short: "Positions measured as seen from the Sun.",
    full: "A Sun-centred frame, and the physically correct description of the Solar System: the planets, including Earth, orbit the Sun. It replaced the Earth-centred model in astronomy after Copernicus, Kepler and Newton. Retrograde motion, which looks mysterious from Earth, is simply a perspective effect in this frame. A small minority of astrologers work with heliocentric charts, but nearly all standard practice is geocentric.",
    cat: "astronomy",
    see: ["geocentric", "retrograde", "astrology-vs-astronomy"]
  },
  {
    id: "house",
    term: "House",
    short: "One of twelve life areas, measured from the horizon.",
    full: "Houses divide the sky as seen from a particular place and time into twelve sectors, starting at the Ascendant. Where signs describe a manner or style, houses describe a department of life — money, home, work, partnership and so on. Because they depend on the horizon, houses turn a full circle roughly every twenty-four hours, which is why the birth time is needed.",
    cat: "house",
    see: ["house-system", "ascendant", "cusp", "angular-houses", "cadent"]
  },
  {
    id: "house-system",
    term: "House system",
    short: "One of several rival methods for cutting the sky into twelve.",
    full: "There is no single agreed way to divide the houses, and different methods put the same planet in different houses. Whole sign houses give each house one entire sign; Placidus, Koch and Regiomontanus divide space or time in ways that produce unequal houses. The choice is a matter of tradition and preference within astrology, not a question with an astronomical answer.",
    cat: "house",
    see: ["whole-sign-houses", "placidus", "house", "cusp"]
  },
  {
    id: "ic",
    term: "IC (Imum Coeli)",
    short: "The lowest point of the chart — the fourth house cusp.",
    full: "Latin for the lowest heaven. The IC is the point of the ecliptic directly beneath the birthplace at the given moment, exactly opposite the Midheaven, and it forms the cusp of the fourth house. Astrologers read it for home, family and origins, in contrast to the public Midheaven above it.",
    cat: "chart",
    see: ["midheaven", "angular-houses", "cusp", "house"]
  },
  {
    id: "ingress",
    term: "Ingress",
    short: "The moment a body crosses from one sign into the next.",
    full: "An ingress is simply an entry: the Sun's ingress into Aries at the March equinox, for example, or Mars entering Gemini. Because the tropical zodiac is defined by the equinox, the Sun's four ingresses into the cardinal signs coincide with the equinoxes and solstices. Astrologers use ingress charts as a way of marking the start of a period.",
    cat: "technique",
    see: ["equinox", "solstice", "tropical-zodiac", "transit", "ephemeris"]
  },
  {
    id: "luminary",
    term: "Luminary",
    short: "The Sun and the Moon — the two lights.",
    full: "Traditional astrology calls the Sun and Moon the lights, or luminaries, to distinguish them from the five visible planets. They move fastest, appear largest and are given the widest orbs. Neither is a planet in astronomical terms — one is a star and the other a satellite — but the older vocabulary treats all seven together as the classical bodies.",
    cat: "body",
    see: ["personal-planets", "lunation", "sun-sign", "sect", "orb"]
  },
  {
    id: "lunar-node",
    term: "Lunar node",
    short: "Where the Moon's path crosses the Sun's path.",
    full: "The Moon's orbit is tilted about 5.1° to the ecliptic, so it crosses that plane at two opposite points: the ascending, or north, node and the descending, or south, node. Eclipses can only happen when a new or full Moon occurs near one of them. The nodes drift backwards along the ecliptic, completing a circuit in about 18.6 years, and astrologers read them as an axis of direction rather than as physical bodies.",
    cat: "astronomy",
    see: ["ecliptic", "lunation", "retrograde", "opposition"]
  },
  {
    id: "lunation",
    term: "Lunation",
    short: "One full new-Moon-to-new-Moon cycle, about 29.5 days.",
    full: "The synodic month, averaging 29.53 days, running from one new Moon through first quarter, full Moon and last quarter back to new. It is the cycle of changing angle between Sun and Moon as seen from Earth, which is what produces the phases. Astrologers use the same cycle as a template, reading the new Moon as a beginning and the full Moon as a culmination.",
    cat: "astronomy",
    see: ["luminary", "conjunction", "opposition", "lunar-node", "void-of-course"]
  },
  {
    id: "malefic",
    term: "Malefic",
    short: "Traditionally the difficult planets — Mars and Saturn.",
    full: "In traditional astrology, Mars is the lesser malefic and Saturn the greater malefic. The label reflects the older texts' expectations of hardship, not a claim that the planets cause harm. Modern astrologers largely retired the term, preferring to describe the same placements as demanding rather than bad.",
    cat: "body",
    see: ["benefic", "sect", "dignity"]
  },
  {
    id: "midheaven",
    term: "Midheaven (MC)",
    short: "The highest point of the chart — the tenth house cusp.",
    full: "The Midheaven, or Medium Coeli, is the point where the ecliptic crosses the meridian above the birthplace — the chart's noon position. It forms the cusp of the tenth house in most quadrant house systems, and astrologers read it for career, reputation and public role. It is not the same as the zenith, which is the point directly overhead.",
    cat: "chart",
    see: ["ic", "zenith", "angular-houses", "cusp", "house-system"]
  },
  {
    id: "modality",
    term: "Modality",
    short: "Cardinal, fixed or mutable — four signs each.",
    full: "Also called quadruplicity. The twelve signs divide into three modalities of four signs apiece, according to where they fall in a season: cardinal signs begin one, fixed signs hold its middle, mutable signs end it. Signs of the same modality sit 90° or 180° apart, which is why they form squares and oppositions. Modality and element together identify each sign uniquely.",
    cat: "basic",
    see: ["cardinal", "fixed", "mutable", "element", "square", "opposition"]
  },
  {
    id: "mutable",
    term: "Mutable",
    short: "Gemini, Virgo, Sagittarius, Pisces — the season-ending signs.",
    full: "One of the three modalities. Each mutable sign closes a season and hands over to the next, so the group sits at the transitions of the year. Astrologers associate mutable signs with adaptability, revision and a tolerance for loose ends. The other two modalities are cardinal and fixed.",
    cat: "basic",
    see: ["modality", "cardinal", "fixed"]
  },
  {
    id: "mutual-reception",
    term: "Mutual reception",
    short: "Two planets each sitting in the other's home sign.",
    full: "Mutual reception occurs when two planets occupy each other's sign of rulership — Mars in Libra with Venus in Aries, for example. Traditional astrology treats it as a cooperative arrangement in which each planet can operate through the other, softening what would otherwise be an awkward placement. Some astrologers extend the idea to exaltation as well as rulership.",
    cat: "technique",
    see: ["ruler", "dignity", "exaltation", "detriment"]
  },
  {
    id: "natal-chart",
    term: "Natal chart",
    short: "A map of the sky for the moment and place of a birth.",
    full: "Also called a birth chart or radix. It is a diagram of where the Sun, Moon and planets stood along the zodiac at a given date, time and location, together with the houses generated by the horizon at that moment. Everything else in astrological practice — transits, synastry, progressions — is measured against this one baseline map.",
    cat: "chart",
    see: ["ascendant", "house", "transit", "synastry", "ephemeris"]
  },
  {
    id: "obliquity",
    term: "Obliquity of the ecliptic",
    short: "Earth's axial tilt — about 23.4°, and the reason for seasons.",
    full: "The angle between Earth's equator and the plane of its orbit, currently about 23.44° and decreasing very slowly. It is why the Sun's height in the sky changes through the year, and therefore why seasons, solstices and equinoxes exist at all. Over roughly 41,000 years the tilt oscillates between about 22.1° and 24.5°. This is a separate motion from precession, which changes the direction the axis points rather than its tilt.",
    cat: "astronomy",
    see: ["ecliptic", "equinox", "solstice", "precession"]
  },
  {
    id: "opposition",
    term: "Opposition",
    short: "A 180° angle — two points facing each other across the chart.",
    full: "The aspect of maximum separation: two bodies on opposite sides of the zodiac, six signs apart. Astrologers read it as a tension between two things that need each other, in the way the Ascendant needs the Descendant. In astronomy the same word describes a planet opposite the Sun in the sky, which is when it appears brightest and rises at sunset.",
    cat: "aspect",
    see: ["aspect", "conjunction", "square", "t-square", "modality"]
  },
  {
    id: "orb",
    term: "Orb",
    short: "The wiggle room allowed around an exact aspect.",
    full: "Aspects are almost never mathematically exact, so astrologers allow a margin — the orb — within which the aspect still counts. A trine with an 8° orb, for example, is anything from 112° to 128°. The tighter the orb, the more strongly the aspect is usually weighted; a difference of a few degrees can decide whether an aspect is read at all.",
    cat: "aspect",
    see: ["aspect-orb", "aspect", "degree", "conjunction"]
  },
  {
    id: "personal-planets",
    term: "Personal planets",
    short: "Sun, Moon, Mercury, Venus and Mars — the fast-moving ones.",
    full: "The bodies that move quickly enough to differ noticeably between people born weeks apart, so astrologers read them as describing individual character. Jupiter and Saturn are called social planets, and Uranus, Neptune and Pluto — which take decades to cross a single sign — are called generational, since everyone born in a stretch of years shares them.",
    cat: "body",
    see: ["luminary", "dwarf-planet", "natal-chart", "transit"]
  },
  {
    id: "placidus",
    term: "Placidus",
    short: "The most common modern house system, based on time.",
    full: "Named after the seventeenth-century monk Placidus de Titis, this system divides the time it takes a degree to travel from the horizon to the meridian into equal parts, producing houses of unequal size. It has been the default in most twentieth-century chart software, which is why so many people meet it first. It breaks down at high latitudes, where some degrees never rise or set, so other systems are used near the poles.",
    cat: "house",
    see: ["house-system", "whole-sign-houses", "house", "midheaven"]
  },
  {
    id: "polarity",
    term: "Polarity",
    short: "The alternating active and receptive halves of the zodiac.",
    full: "The signs alternate around the circle in two groups: fire and air signs form one polarity, earth and water signs the other. Older texts call them masculine and feminine, or diurnal and nocturnal; modern writers usually prefer active and receptive, or positive and negative in the electrical rather than moral sense. Every sign is separated from the next by a change of polarity.",
    cat: "basic",
    see: ["element", "fire", "air", "earth-element", "water", "sect"]
  },
  {
    id: "precession",
    term: "Precession of the equinoxes",
    short: "Earth's axis wobbles, dragging the equinox point slowly backwards.",
    full: "Earth's rotation axis slowly traces a cone, like a spinning top, completing one circuit in about 25,772 years. This drags the equinox points westward along the ecliptic at roughly one degree every seventy-two years. The practical consequence is that the tropical zodiac, fixed to the March equinox around two thousand years ago, has drifted about 24° from the constellations that share its names — very nearly a whole sign. So the Sun at 5° tropical Aries is now seen against the stars of Pisces.",
    cat: "astronomy",
    see: ["equinox", "tropical-zodiac", "sidereal-zodiac", "ecliptic", "obliquity", "fixed-stars"]
  },
  {
    id: "quincunx",
    term: "Quincunx",
    short: "A 150° angle — the awkward one, also called the inconjunct.",
    full: "Five signs apart, so the two signs share neither element, modality nor polarity and have no obvious common ground. Astrologers read it as a mismatch requiring constant small adjustments rather than an outright conflict. It is a minor aspect and is normally given a tight orb of two or three degrees.",
    cat: "aspect",
    see: ["aspect", "aspect-orb", "element", "modality"]
  },
  {
    id: "retrograde",
    term: "Retrograde",
    short: "A planet appearing to move backwards — an illusion of perspective.",
    full: "Retrograde motion is when a planet's apparent position drifts backwards through the zodiac for a stretch of weeks or months. Nothing actually reverses: Earth and the other planet are simply moving at different speeds along different orbits, and the effect is the same as a slower car appearing to slide backwards as you overtake it. Mercury does this about three times a year for roughly three weeks each time. Astrologers read retrograde periods as a turn inward or a call to review, which is an interpretation of the appearance, not a physical effect.",
    cat: "astronomy",
    see: ["direct-motion", "stationary", "geocentric", "heliocentric"]
  },
  {
    id: "rising-sign",
    term: "Rising sign",
    short: "The sign that was coming over the horizon when you were born.",
    full: "The sign containing the Ascendant. Along with the Sun sign and Moon sign it makes up what is often called the big three. It changes roughly every two hours, so two people born the same day in the same city can have different rising signs — which is why astrologers ask for a birth time.",
    cat: "chart",
    see: ["ascendant", "sun-sign", "chart-ruler", "natal-chart"]
  },
  {
    id: "ruler",
    term: "Ruler",
    short: "The planet traditionally in charge of a given sign.",
    full: "Each sign is assigned a ruling planet: Mars rules Aries, Venus rules Taurus, and so on around the circle. In the traditional scheme the seven classical bodies cover all twelve signs, with five planets ruling two signs each. Modern astrology reassigned Scorpio to Pluto, Aquarius to Uranus and Pisces to Neptune after those planets were discovered, and both schemes remain in use.",
    cat: "technique",
    see: ["chart-ruler", "dignity", "detriment", "exaltation", "mutual-reception"]
  },
  {
    id: "sect",
    term: "Sect",
    short: "Whether a chart is a day chart or a night chart.",
    full: "A revived traditional technique. If the Sun is above the horizon at birth the chart is diurnal; if below, nocturnal. The Sun, Jupiter and Saturn belong to the day sect and the Moon, Venus and Mars to the night sect, with Mercury taking whichever side it rises with. Astrologers use sect to decide which benefic and which malefic is better placed to act well in a given chart.",
    cat: "technique",
    see: ["benefic", "malefic", "luminary", "polarity", "ascendant"]
  },
  {
    id: "sextile",
    term: "Sextile",
    short: "A 60° angle — mild, cooperative, two signs apart.",
    full: "Two signs apart, so the signs share polarity but not element — fire with air, or earth with water. Astrologers read it as an opportunity that has to be taken up rather than a benefit that arrives on its own, making it the gentler cousin of the trine. It is usually given a smaller orb than the major hard aspects.",
    cat: "aspect",
    see: ["aspect", "trine", "polarity", "aspect-orb"]
  },
  {
    id: "sidereal-zodiac",
    term: "Sidereal zodiac",
    short: "A zodiac aligned to the constellations rather than the seasons.",
    full: "The sidereal zodiac keeps its twelve divisions tied to the background stars, so it tracks with the constellations as precession moves them. It is the standard in Indian astrology, or Jyotish. The gap between it and the tropical zodiac is called the ayanamsa and currently runs to about 24°, which is why a tropical Aries Sun is usually a sidereal Pisces Sun. Neither system's divisions match the ragged real constellations exactly, since both use equal 30° signs.",
    cat: "astronomy",
    see: ["tropical-zodiac", "precession", "zodiac", "fixed-stars"]
  },
  {
    id: "solstice",
    term: "Solstice",
    short: "The two moments a year when the Sun stops climbing and turns.",
    full: "A solstice occurs when the Sun reaches its greatest distance north or south of the celestial equator, around 21 June and 21 December. These are the longest and shortest days, and the name comes from the Latin for the Sun standing still, because its daily change in height briefly stalls before reversing. In the tropical zodiac they mark 0° Cancer and 0° Capricorn.",
    cat: "astronomy",
    see: ["equinox", "obliquity", "tropical-zodiac", "cardinal", "ingress"]
  },
  {
    id: "square",
    term: "Square",
    short: "A 90° angle — the friction one.",
    full: "Three signs apart, so the two signs share a modality but differ in both element and polarity. Astrologers read it as productive friction: two drives that cannot easily be satisfied at once, which the tradition treats as a source of effort rather than an obstacle. With the opposition it is one of the two classic hard aspects.",
    cat: "aspect",
    see: ["aspect", "opposition", "trine", "t-square", "modality"]
  },
  {
    id: "stationary",
    term: "Stationary",
    short: "The pause when a planet turns retrograde or direct.",
    full: "At the turning point between direct and retrograde motion, a planet's apparent movement along the zodiac slows to nearly nothing for a few days. Astronomers call these the stationary points; astrologers describe a planet as stationary retrograde or stationary direct depending on which way it is about to go. Traditional practice gives extra emphasis to a planet caught at a station.",
    cat: "astronomy",
    see: ["retrograde", "direct-motion", "ephemeris"]
  },
  {
    id: "stellium",
    term: "Stellium",
    short: "Three or more planets bunched in one sign or house.",
    full: "A cluster of at least three bodies in the same sign or the same house. Astrologers read it as a heavy concentration of emphasis in one area, with the individual meanings pulled together. There is no fixed rule about the minimum count or whether the planets must all be in orb of each other, so definitions vary between practitioners.",
    cat: "aspect",
    see: ["conjunction", "aspect-pattern", "house", "orb"]
  },
  {
    id: "sun-sign",
    term: "Sun sign",
    short: "The zodiac sign the Sun occupied on your birthday.",
    full: "The sign most people mean when they say what they are. Because the tropical zodiac is anchored to the equinox, the dates stay roughly fixed to the calendar year, shifting by a day or so with leap years. Newspaper and app horoscopes use this single factor alone; astrologers themselves treat it as one element among dozens in a full chart.",
    cat: "basic",
    see: ["luminary", "rising-sign", "tropical-zodiac", "natal-chart"]
  },
  {
    id: "synastry",
    term: "Synastry",
    short: "Comparing two charts to describe a relationship.",
    full: "The technique of laying two natal charts over each other and reading the aspects each person's planets make to the other's. Astrologers use it for couples, but also for friendships, families and business partners. A related method, the composite chart, instead averages the two charts into a single hypothetical one.",
    cat: "technique",
    see: ["natal-chart", "aspect", "transit"]
  },
  {
    id: "t-square",
    term: "T-square",
    short: "An opposition plus a third planet square to both.",
    full: "Two planets in opposition, with a third square to each — a right-angled triangle spanning three signs of the same modality. The point at the corner, called the apex or focal planet, carries the pressure of both ends. Astrologers read it as the most demanding of the common aspect patterns, and often as the most productive.",
    cat: "aspect",
    see: ["square", "opposition", "aspect-pattern", "grand-trine", "modality"]
  },
  {
    id: "transit",
    term: "Transit",
    short: "Where a planet is right now, measured against your birth chart.",
    full: "A transit is the aspect formed between a planet's current position and a fixed point in a natal chart — Saturn crossing a natal Sun, for instance. It is the main technique astrologers use to relate a chart to a particular date. In astronomy the same word means something narrower: a body passing directly across the face of another, as Venus does across the Sun.",
    cat: "technique",
    see: ["natal-chart", "aspect", "ephemeris", "ingress", "synastry"]
  },
  {
    id: "trine",
    term: "Trine",
    short: "A 120° angle — the easy, flowing one.",
    full: "Four signs apart, which means the two signs almost always share an element. Astrologers read it as the most harmonious of the major aspects: the two bodies understand each other and cooperate without effort. The traditional caution is that ease can become inertia, since nothing in a trine forces anything to happen.",
    cat: "aspect",
    see: ["aspect", "square", "sextile", "element", "grand-trine"]
  },
  {
    id: "tropical-zodiac",
    term: "Tropical zodiac",
    short: "A zodiac tied to the seasons, not to the constellations.",
    full: "The system used by nearly all Western astrology. It defines 0° Aries as the March equinox and divides the circle into twelve equal 30° signs from there, so the signs track the seasons rather than the stars. Because of precession, the equinox point has moved about 24° since the scheme was fixed roughly two thousand years ago, so tropical sign names no longer line up with the constellations behind them — a fact astronomy and astrology both acknowledge and simply interpret differently.",
    cat: "astronomy",
    see: ["sidereal-zodiac", "precession", "equinox", "zodiac", "sun-sign"]
  },
  {
    id: "void-of-course",
    term: "Void of course",
    short: "The Moon making no more major aspects before it changes sign.",
    full: "A condition of the Moon: from its last major aspect to another planet until the moment it leaves the sign it is in, it is described as void of course. The stretch can last minutes or many hours. Traditional electional astrology avoids beginning things during it, on the reasoning that nothing further is due to connect.",
    cat: "technique",
    see: ["lunation", "aspect", "ingress", "luminary"]
  },
  {
    id: "water",
    term: "Water (element)",
    short: "Cancer, Scorpio, Pisces — the feeling, absorbing element.",
    full: "One of the four classical elements, shared by Cancer, Scorpio and Pisces. Astrologers associate water with emotion, memory, empathy and indirect knowing. Water alternates with earth around the zodiac, and the two together form the receptive polarity.",
    cat: "basic",
    see: ["element", "fire", "earth-element", "air", "polarity"]
  },
  {
    id: "whole-sign-houses",
    term: "Whole sign houses",
    short: "The oldest system — one whole sign equals one house.",
    full: "In whole sign houses, the entire sign containing the Ascendant becomes the first house, the next sign the second, and so on, so every house is exactly 30° and sign and house boundaries coincide. It is the earliest system in Hellenistic astrology and has been widely revived since the 1990s. In it the Midheaven is not automatically the tenth house cusp; it may land in the ninth, tenth or eleventh.",
    cat: "house",
    see: ["house-system", "placidus", "house", "ascendant", "midheaven"]
  },
  {
    id: "zenith",
    term: "Zenith",
    short: "The point straight up above your head.",
    full: "An astronomical term for the point on the celestial sphere directly overhead a given observer; the opposite point, straight down, is the nadir. It is often confused with the Midheaven, but the two differ: the Midheaven is where the ecliptic crosses the meridian, which only coincides with the zenith at particular latitudes and moments.",
    cat: "astronomy",
    see: ["midheaven", "ecliptic", "ic"]
  },
  {
    id: "zodiac",
    term: "Zodiac",
    short: "The band of sky the Sun, Moon and planets travel through.",
    full: "Astronomically, the zodiac is a belt about 8-9° either side of the ecliptic within which the Sun, Moon and planets are always found. Astrologically it is that belt divided into twelve equal 30° signs. The name comes from a Greek phrase meaning circle of little animals. The thirteenth constellation the Sun crosses, Ophiuchus, is real but was never part of the twelve-fold scheme, which is a division of degrees rather than a list of constellations.",
    cat: "basic",
    see: ["ecliptic", "tropical-zodiac", "sidereal-zodiac", "degree", "element"]
  }
];
