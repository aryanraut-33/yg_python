// The 11 hero slides (Figma Landing page + Name Light Show as slide 1).
export interface Slide {
  key: string;
  name: string;
  category: string;
  headline: string;
  sub: string;
  /** Route of the playable project, or null while it's "coming soon". */
  href: string | null;
}

/** Slide 0 is about the platform itself; the rest show projects kids build. */
export const INTRO: Slide = {
  key: 'intro',
  name: 'yg python',
  category: 'Real Python for kids aged 9–15',
  headline: 'Learn Python by\nbuilding things you love.',
  sub: 'Games, art, robots, space missions. Kids learn real Python by making real projects, one step at a time.',
  href: '/start',
};

export const PROJECT_SLIDES: Slide[] = [
  {
    key: 'lights',
    name: 'Name Light Show',
    category: 'Start here',
    headline: 'Make your name\nlight up.',
    sub: 'Your first project. Put your name in lights, write a loop, and turn it into a light show in about 10 minutes.',
    href: '/play/name-light-show',
  },
  {
    key: 'cloak',
    name: 'Invisible Cloak',
    category: 'Camera magic',
    headline: 'Hold up a cloth.\nDisappear.',
    sub: 'Pick a colour, point your webcam, and write the Python that swaps it for the room behind you.',
    href: null,
  },
  {
    key: 'finger',
    name: 'Finger Painter',
    category: 'Camera magic',
    headline: 'Paint in the air\nwith one finger.',
    sub: 'Your webcam tracks 21 points on your hand. A few lines of Python turn your fingertip into a brush.',
    href: null,
  },
  {
    key: 'rover',
    name: 'Mars Rover Rescue',
    category: 'Robots',
    headline: 'Drive a rover\nacross Mars.',
    sub: 'Write the commands, steer around the craters and bring the rover home before its battery runs out.',
    href: null,
  },
  {
    key: 'drone',
    name: 'Drone Delivery',
    category: 'Robots',
    headline: 'Fly a parcel\nacross the city.',
    sub: 'Program a drone to fight the wind, find the right rooftop and land the delivery.',
    href: null,
  },
  {
    key: 'lander',
    name: 'Chandrayaan Lander',
    category: 'Space',
    headline: 'Land softly\non the Moon.',
    sub: 'Fire the thrusters at just the right moment. Your code decides whether the lander touches down.',
    href: null,
  },
  {
    key: 'planet',
    name: 'Planet Maker',
    category: 'Space',
    headline: 'Design a planet.\nName it after you.',
    sub: 'Choose its size, colours and rings, then let gravity pull your moons into orbit.',
    href: null,
  },
  {
    key: 'doodle',
    name: 'Doodle Guesser',
    category: 'Make your own AI',
    headline: 'Draw a number.\nWatch it guess.',
    sub: 'Train your own model on hundreds of doodles, then see if it can read your handwriting.',
    href: null,
  },
  {
    key: 'cricket',
    name: 'Cricket Stats Explorer',
    category: 'Real-world data',
    headline: 'Settle every\ncricket argument.',
    sub: 'Load real match data, rank the top scorers and draw the charts that prove who’s best.',
    href: null,
  },
  {
    key: 'train',
    name: 'Train Route Finder',
    category: 'Real-world data',
    headline: 'Find the fastest\ntrain home.',
    sub: 'Turn the rail map into a graph and write the code that finds the quickest way between cities.',
    href: null,
  },
  {
    key: 'cipher',
    name: 'Secret Code Machine',
    category: 'Codes & stories',
    headline: 'Write a secret code\nonly family can crack.',
    sub: 'Build a cipher machine, scramble a message and send it. Only someone with the key can read it.',
    href: null,
  },
];

/** The hero rotates the intro and four projects (chosen by the user, 2026-11-20). */
const HERO_KEYS = ['rover', 'drone', 'lander', 'cloak'];
export const SLIDES: Slide[] = [INTRO, ...HERO_KEYS.map((k) => PROJECT_SLIDES.find((s) => s.key === k)!)];
