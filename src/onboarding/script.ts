// The onboarding journey, in the order of the brief:
// 1 Meet Nix & Riff → 2 Meet Python → 3 Python in the wild → 4 Speak Python → 5 Your workspace → 6 First project.
import { CONCEPTS, type Line } from './concepts';
import type { ConceptId, OnboardingState } from './progress';

export interface Chapter {
  id: string;
  title: string;
  /** Children may skip this chapter (it's background, not a skill). */
  skippable?: boolean;
}

export const CHAPTERS: Chapter[] = [
  { id: 'meet', title: 'Meet Nix & Riff' },
  { id: 'python', title: 'Meet Python', skippable: true },
  { id: 'wild', title: 'Python in the wild', skippable: true },
  { id: 'speak', title: 'Speak Python' },
  { id: 'workspace', title: 'Your workspace' },
  { id: 'project', title: 'First project' },
];

export type Screen =
  | { id: string; chapter: number; kind: 'talk'; lines: Line[]; cta?: string }
  | { id: string; chapter: number; kind: 'name'; lines: Line[] }
  | { id: string; chapter: number; kind: 'experience'; lines: Line[] }
  | { id: string; chapter: number; kind: 'quick-check'; lines: Line[] }
  | { id: string; chapter: number; kind: 'check-result'; lines: Line[] }
  | { id: string; chapter: number; kind: 'refresher'; lines: Line[] }
  | { id: string; chapter: number; kind: 'sandwich'; lines: Line[] }
  | { id: string; chapter: number; kind: 'hello'; lines: Line[] }
  | { id: string; chapter: number; kind: 'compare'; lines: Line[] }
  | { id: string; chapter: number; kind: 'quiz'; lines: Line[]; question: string; choices: string[]; answer: number; right: Line; wrong: Line }
  | { id: string; chapter: number; kind: 'uses'; lines: Line[] }
  | { id: string; chapter: number; kind: 'match'; lines: Line[] }
  | { id: string; chapter: number; kind: 'dream'; lines: Line[] }
  | { id: string; chapter: number; kind: 'concept'; concept: ConceptId; index: number }
  | { id: string; chapter: number; kind: 'tour'; lines: Line[] }
  | { id: string; chapter: number; kind: 'finale'; lines: Line[] };

export const SCREENS: Screen[] = [
  // ---------- 1. Meet Nix & Riff ----------
  {
    id: 'hello',
    chapter: 0,
    kind: 'talk',
    lines: [
      { who: 'riff', pose: 'welcome', text: 'Heyyy! You made it!' },
      { who: 'nix', pose: 'welcome', text: 'Welcome to yg python. I\'m **Nix**.' },
      { who: 'riff', pose: 'celebrating', text: 'And I\'m **Riff**! We\'re going to learn Python together, and then build cool stuff with it.' },
      { who: 'nix', pose: 'thinking', text: 'I\'m the one with all the questions. Figuring out how things work is my favourite thing.' },
      { who: 'riff', pose: 'encouraging', text: 'And I cheer the loudest. Especially when something goes wrong. That\'s when it gets fun!' },
    ],
    cta: 'Nice to meet you!',
  },
  {
    id: 'your-name',
    chapter: 0,
    kind: 'name',
    lines: [{ who: 'nix', pose: 'teaching', text: 'So, what should we call you? A nickname is great too.' }],
  },
  {
    id: 'experience',
    chapter: 0,
    kind: 'experience',
    lines: [{ who: 'riff', pose: 'thinking', text: '{name}, quick question. Have you written any Python before?' }],
  },
  {
    id: 'quick-check',
    chapter: 0,
    kind: 'quick-check',
    lines: [
      { who: 'nix', pose: 'reading', text: 'Let\'s see what you already know! 11 quick questions, including a few about errors.' },
      { who: 'riff', pose: 'encouraging', text: 'No pressure. If you\'re not sure, just say so. It helps us pick the right path for you.' },
    ],
  },
  {
    id: 'check-result',
    chapter: 0,
    kind: 'check-result',
    lines: [{ who: 'nix', pose: 'reading', text: 'Results are in, {name}!' }],
  },
  {
    id: 'refresher',
    chapter: 3,
    kind: 'refresher',
    lines: [
      { who: 'nix', pose: 'teaching', text: 'Quick refresher time! Here are the 7 basics in one place. The ones you missed are at the top.' },
      { who: 'riff', pose: 'coding', text: 'Run any example to see it in action. Then finish with one mini challenge!' },
    ],
  },
  {
    id: 'map',
    chapter: 0,
    kind: 'talk',
    lines: [
      { who: 'nix', pose: 'teaching', text: 'Here\'s the plan. First we meet Python. Then we see where it\'s hiding in the real world.' },
      { who: 'riff', pose: 'pointing', text: 'Then you learn to speak it, explore your workspace, and build your very first project!' },
      { who: 'nix', pose: 'encouraging', text: 'You can\'t break anything here. Try things, make mistakes, and see what happens.' },
    ],
    cta: 'Let\'s go!',
  },

  // ---------- 2. Meet Python ----------
  {
    id: 'instructions',
    chapter: 1,
    kind: 'talk',
    lines: [
      { who: 'nix', pose: 'thinking', text: 'Here\'s a puzzle. Computers are super fast. But how do they know what to do?' },
      { who: 'riff', pose: 'confused', text: 'Magic?' },
      { who: 'nix', pose: 'teaching', text: 'Nope! **Instructions.** A computer only does exactly what it\'s told, in exactly that order.' },
    ],
  },
  {
    id: 'sandwich',
    chapter: 1,
    kind: 'sandwich',
    lines: [{ who: 'riff', pose: 'coding', text: 'Let\'s test it! Pretend I\'m a computer. Put my sandwich instructions in order, then press **Run**.' }],
  },
  {
    id: 'languages',
    chapter: 1,
    kind: 'hello',
    lines: [
      { who: 'nix', pose: 'teaching', text: 'People use languages to talk to each other. A **programming language** is how we talk to computers.' },
      { who: 'riff', pose: 'pointing', text: 'Tap each card to find out who says hello this way.' },
    ],
  },
  {
    id: 'why-python',
    chapter: 1,
    kind: 'compare',
    lines: [
      { who: 'nix', pose: 'reading', text: 'There are lots of programming languages. We picked **Python** because it reads almost like English.' },
      { who: 'riff', pose: 'teaching', text: 'Look! Both of these programs do the same thing.' },
    ],
  },
  {
    id: 'program-quiz',
    chapter: 1,
    kind: 'quiz',
    lines: [{ who: 'nix', pose: 'thinking', text: 'Let\'s check. Remember my sandwich puzzle?' }],
    question: 'What is a program?',
    choices: ['A list of instructions for a computer', 'A type of computer', 'A video game'],
    answer: 0,
    right: { who: 'riff', pose: 'celebrating', text: 'Exactly! And Python is the language you\'ll write those instructions in.' },
    wrong: { who: 'nix', pose: 'encouraging', text: 'Close! A program is a list of instructions, like my sandwich steps. Python is how we write them.' },
  },

  // ---------- 3. Python in the wild ----------
  {
    id: 'uses',
    chapter: 2,
    kind: 'uses',
    lines: [
      { who: 'riff', pose: 'surprised', text: 'Okay, here\'s the WILD part. Python isn\'t just for school. It\'s everywhere!' },
      { who: 'nix', pose: 'reading', text: 'Flip through these cards. Every one of them is real.' },
    ],
  },
  {
    id: 'match',
    chapter: 2,
    kind: 'match',
    lines: [{ who: 'nix', pose: 'thinking', text: 'Memory test! Match each thing with what Python does for it.' }],
  },
  {
    id: 'dream',
    chapter: 2,
    kind: 'dream',
    lines: [{ who: 'riff', pose: 'pointing', text: 'Now the fun question. If you could build one of these, which would you build first?' }],
  },

  // ---------- 4. Speak Python ----------
  {
    id: 'speak-intro',
    chapter: 3,
    kind: 'talk',
    lines: [
      { who: 'nix', pose: 'teaching', text: 'Time to speak Python! We\'ll learn seven small words and ideas, one at a time.' },
      { who: 'riff', pose: 'coding', text: 'And you\'ll type and run every single one yourself. No just watching!' },
    ],
    cta: 'I\'m ready',
  },
  ...CONCEPTS.map((c, i): Screen => ({ id: `concept-${c.id}`, chapter: 3, kind: 'concept', concept: c.id, index: i })),

  // ---------- 5. Your workspace ----------
  {
    id: 'tour',
    chapter: 4,
    kind: 'tour',
    lines: [
      { who: 'nix', pose: 'teaching', text: 'You\'ve learned to speak Python. Now let\'s explore the workspace where you\'ll build your projects.' },
      { who: 'riff', pose: 'encouraging', text: 'You\'ll do each step yourself. We\'ll show you where to look.' },
    ],
  },

  // ---------- 6. First project ----------
  {
    id: 'finale',
    chapter: 5,
    kind: 'finale',
    lines: [
      { who: 'riff', pose: 'level-up', text: '{name}, LOOK at what you just did!' },
      { who: 'nix', pose: 'level-up', text: 'You can make Python talk, do maths, remember things and even listen.' },
      { who: 'riff', pose: 'celebrating', text: 'You\'re ready to build something of your own. Let\'s make your name light up!' },
    ],
  },
];

export const FIRST_SCREEN = SCREENS[0].id;

const byId = (id: string) => SCREENS.find((s) => s.id === id)!;
const PRE = ['hello', 'your-name', 'experience'];
const EXPERIENCED = [...PRE, 'quick-check', 'check-result'];
/** The full beginner journey after the introductions. */
const BEGINNER_REST = SCREENS.filter((s) => s.chapter > 0 || s.id === 'map')
  .filter((s) => s.kind !== 'refresher')
  .map((s) => s.id);

/**
 * The screens this child will see, in order. It depends on what they told us and how the quick
 * check went: beginners and low scorers get the whole journey; middling scorers a refresher and
 * the workspace tour; high scorers choose between the project, a refresher or the tour.
 */
export function pathFor(st: OnboardingState): Screen[] {
  let ids: string[];
  if (st.experience !== 'some') ids = [...PRE, ...BEGINNER_REST];
  else if (st.track === 'lessons') ids = [...EXPERIENCED, ...BEGINNER_REST];
  else if (st.track === 'refresher') ids = [...EXPERIENCED, 'refresher', 'tour', 'finale'];
  else if (st.track === 'ready' && st.readyChoice === 'refresher') ids = [...EXPERIENCED, 'refresher', 'finale'];
  else if (st.track === 'ready' && st.readyChoice === 'tour') ids = [...EXPERIENCED, 'tour', 'finale'];
  else ids = EXPERIENCED;
  return ids.map(byId);
}
