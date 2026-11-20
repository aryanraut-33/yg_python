// "Speak Python": the seven first ideas, one lesson each.
// Every lesson: analogy → example → tap each part → try it (run, see the result) → challenge → done.
import type { Pose, Who } from './mascots';
import type { ConceptId } from './progress';
import checkPrint from '../../content/onboarding/check-print.py?raw';
import checkStrings from '../../content/onboarding/check-strings.py?raw';
import checkNumbers from '../../content/onboarding/check-numbers.py?raw';
import checkVariables from '../../content/onboarding/check-variables.py?raw';
import checkMath from '../../content/onboarding/check-math.py?raw';
import checkComments from '../../content/onboarding/check-comments.py?raw';
import checkInput from '../../content/onboarding/check-input.py?raw';

export interface Line {
  who: Who;
  pose: Pose;
  /** Short and spoken. `code` and **bold** allowed. {name} becomes the child's name. */
  text: string;
}

export interface CodePart {
  code: string;
  /** Tap-to-explain text. Parts without one are plain code. */
  explain?: string;
}

export interface Concept {
  id: ConceptId;
  /** Short name for the map and chips. */
  short: string;
  title: string;
  analogy: Line[];
  parts: CodePart[];
  tryPrompt: Line;
  /** Must the child change the code before running? */
  tryNeedsChange: boolean;
  tryDone: Line;
  challenge: {
    lines: Line[];
    starter: string;
    check: string;
    hints: string[];
    success: Line;
  };
  quickCheck: { code: string; question: string; choices: string[]; answer: number };
  /** One-line reminder for the quick refresher. */
  recap: string;
}

export const exampleCode = (c: Concept) => c.parts.map((p) => p.code).join('');

export const CONCEPTS: Concept[] = [
  {
    id: 'print',
    recap: '`print( )` shows whatever is inside the brackets on the screen.',
    short: 'print()',
    title: 'print(): make Python talk',
    analogy: [
      { who: 'nix', pose: 'teaching', text: "Python can't talk out loud. But it can show words on the screen." },
      { who: 'riff', pose: 'pointing', text: "It's like handing Python a megaphone! Whatever you put inside, it shouts out." },
      { who: 'nix', pose: 'reading', text: 'The megaphone is called `print`. Tap each part of the code to see what it does.' },
    ],
    parts: [
      { code: 'print', explain: 'The command. It tells Python: show something on the screen.' },
      { code: '(', explain: 'An opening bracket. What you want to show goes inside the brackets.' },
      { code: '"Hello!"', explain: 'The message. Words go inside quotes.' },
      { code: ')', explain: 'The closing bracket. Every ( needs a ) to match it.' },
    ],
    tryPrompt: { who: 'riff', pose: 'encouraging', text: 'Your turn! Change `Hello!` to anything you like, then press **Run**.' },
    tryNeedsChange: true,
    tryDone: { who: 'riff', pose: 'celebrating', text: 'Python said it! {name}, you just wrote real Python.' },
    challenge: {
      lines: [{ who: 'nix', pose: 'thinking', text: 'Challenge: make Python say hello to **both** of us. One line for Riff, one line for Nix.' }],
      starter: 'print("Hi Riff!")\n',
      check: checkPrint,
      hints: ['Each `print( )` shows one line. You need two of them.', 'Copy the first line onto the next line, then change Riff to Nix.', 'print("Hi Riff!")\nprint("Hi Nix!")'],
      success: { who: 'riff', pose: 'celebrating', text: 'Hi to you too! Two lines, two prints. Nailed it.' },
    },
    quickCheck: { code: 'print("Nix")', question: 'What will this show?', choices: ['Nix', '"Nix"', 'print("Nix")', 'An error'], answer: 0 },
  },
  {
    id: 'strings',
    recap: 'Text (a **string**) goes inside quotes. `+` glues two strings together.',
    short: 'Text',
    title: 'Text: words inside quotes',
    analogy: [
      { who: 'nix', pose: 'teaching', text: 'In Python, text is called a **string**: letters strung together like beads on a thread.' },
      { who: 'riff', pose: 'teaching', text: 'The quotes work like a speech bubble. Python copies exactly what’s inside. Spaces, capitals, everything!' },
      { who: 'nix', pose: 'reading', text: 'And here’s a neat trick: `+` glues two strings together. Tap the parts.' },
    ],
    parts: [
      { code: 'print(' },
      { code: '"Riff says: ROAR!"', explain: 'A string. Everything between the quotes is copied exactly, even the spaces.' },
      { code: ')\nprint(' },
      { code: '"Nix"', explain: 'Another string.' },
      { code: ' + ', explain: 'A + between two strings glues them together. No space is added in between!' },
      { code: '"Riff"', explain: 'Glued straight onto "Nix", so Python shows NixRiff.' },
      { code: ')' },
    ],
    tryPrompt: { who: 'nix', pose: 'thinking', text: 'Experiment: delete one of the `"` quote marks, press **Run**, and see what Python says. Then put it back and run again.' },
    tryNeedsChange: true,
    tryDone: { who: 'nix', pose: 'encouraging', text: 'Python needs both quotes to know where the words start and stop. Mistakes like that are how everyone learns.' },
    challenge: {
      lines: [{ who: 'riff', pose: 'pointing', text: 'Superhero time! Glue two strings with `+` to print your superhero name, like `"Captain" + "Comet"`.' }],
      starter: 'print("Captain")\n',
      check: checkStrings,
      hints: ['Put a `+` and a second string inside the brackets.', 'Each word needs its own quotes: `"Super" + "Nix"`', 'print("Captain" + "Comet")'],
      success: { who: 'riff', pose: 'celebrating', text: 'That’s an AWESOME superhero name.' },
    },
    quickCheck: { code: 'print("Riff" + "Nix")', question: 'What will this show?', choices: ['RiffNix', 'Riff Nix', 'Riff + Nix', 'An error'], answer: 0 },
  },
  {
    id: 'numbers',
    recap: 'Numbers have no quotes, so Python can do maths with them. `"2" + "2"` is text: 22.',
    short: 'Numbers',
    title: 'Numbers: no quotes needed',
    analogy: [
      { who: 'nix', pose: 'teaching', text: 'Numbers are different from text. Python can do maths with them, like a super-fast calculator.' },
      { who: 'riff', pose: 'thinking', text: 'Here’s a trick that surprises almost everyone. Watch the quotes closely!' },
    ],
    parts: [
      { code: 'print(' },
      { code: '2 + 2', explain: 'Numbers with no quotes. Python adds them up, so this shows 4.' },
      { code: ')\nprint(' },
      { code: '"2" + "2"', explain: 'These have quotes, so they are text! + glues the text together: 22.' },
      { code: ')' },
    ],
    tryPrompt: { who: 'riff', pose: 'pointing', text: 'Press **Run** and compare the two answers. Then try your own numbers.' },
    tryNeedsChange: false,
    tryDone: { who: 'nix', pose: 'surprised', text: '4 and 22! Same digits, different answers. Quotes change everything.' },
    challenge: {
      lines: [{ who: 'nix', pose: 'thinking', text: 'Challenge: make one line print **4** using numbers, and another line print **22** using text.' }],
      starter: 'print()\nprint()\n',
      check: checkNumbers,
      hints: ['Numbers: no quotes. Text: quotes.', 'For 4, add two numbers: `print(2 + 2)`', 'print(2 + 2)\nprint("2" + "2")'],
      success: { who: 'riff', pose: 'celebrating', text: 'Calculator AND glue. You totally get it.' },
    },
    quickCheck: { code: 'print("2" + "2")', question: 'What will this show?', choices: ['22', '4', '2 + 2', 'An error'], answer: 0 },
  },
  {
    id: 'variables',
    recap: 'A **variable** is a labelled box: `snack = "samosa"` puts samosa in the snack box.',
    short: 'Variables',
    title: 'Variables: boxes with labels',
    analogy: [
      { who: 'nix', pose: 'teaching', text: 'A **variable** is like a lunchbox with a label. You put something inside and find it later by its label.' },
      { who: 'riff', pose: 'encouraging', text: 'Then you can open the box anytime, just by saying its name!' },
    ],
    parts: [
      { code: 'snack', explain: 'The label on the box. You choose the name.' },
      { code: ' = ', explain: 'Here, = means "put this into the box". It’s not "equals" like in maths.' },
      { code: '"samosa"', explain: 'What goes inside the box.' },
      { code: '\n' },
      { code: 'print(snack)', explain: 'No quotes around snack, so Python opens the box and shows what’s inside.' },
    ],
    tryPrompt: { who: 'riff', pose: 'pointing', text: 'Swap `samosa` for your favourite snack and **Run** it.' },
    tryNeedsChange: true,
    tryDone: { who: 'riff', pose: 'celebrating', text: 'Yum! Python remembered it for you.' },
    challenge: {
      lines: [{ who: 'nix', pose: 'thinking', text: 'Challenge: make a box called `pet` with the name of your dream pet inside. Then print it.' }],
      starter: 'pet = ""\n',
      check: checkVariables,
      hints: ['Put a name between the quotes after `pet =`.', 'Then add a new line that opens the box: `print(pet)`', 'pet = "Bruno"\nprint(pet)'],
      success: { who: 'riff', pose: 'celebrating', text: 'Best pet ever. Your box works!' },
    },
    quickCheck: { code: 'food = "dosa"\nprint(food)', question: 'What will this show?', choices: ['dosa', 'food', '"dosa"', 'An error'], answer: 0 },
  },
  {
    id: 'math',
    recap: '`+` add, `-` take away, `*` times, `/` divide. Boxes with numbers work too.',
    short: 'Maths',
    title: 'Maths: Python the calculator',
    analogy: [
      { who: 'riff', pose: 'teaching', text: 'Python does maths faster than anyone. Even me. And I’m FAST.' },
      { who: 'nix', pose: 'teaching', text: 'Plus is `+`, minus is `-`, times is `*` and divide is `/`. You can do maths with boxes too!' },
    ],
    parts: [
      { code: 'coins = 12', explain: 'A box holding the number 12. No quotes, so it’s a number.' },
      { code: '\n' },
      { code: 'print(coins + 5)', explain: 'Adds 5 to whatever is in the box: 17.' },
      { code: '\n' },
      { code: 'print(coins * 2)', explain: '* means times. 12 times 2 is 24.' },
    ],
    tryPrompt: { who: 'nix', pose: 'thinking', text: 'Change `12` to another number and **Run**. Watch both answers change.' },
    tryNeedsChange: true,
    tryDone: { who: 'nix', pose: 'encouraging', text: 'Change the box once, and every answer updates. That’s the power of variables.' },
    challenge: {
      lines: [{ who: 'riff', pose: 'pointing', text: 'Pizza party! 3 pizzas, 8 slices each. Make a box called `slices` that works out the total with `*`, then print it.' }],
      starter: 'pizzas = 3\nslices_each = 8\n',
      check: checkMath,
      hints: ['Make a new box: `slices = ...`', 'Multiply the two boxes with `*`: `pizzas * slices_each`', 'slices = pizzas * slices_each\nprint(slices)'],
      success: { who: 'riff', pose: 'celebrating', text: '24 slices! Who’s hungry?' },
    },
    quickCheck: { code: 'x = 5\nprint(x * 3)', question: 'What will this show?', choices: ['15', '53', 'x3', '8'], answer: 0 },
  },
  {
    id: 'comments',
    recap: 'A line starting with `#` is a note for humans. Python skips it.',
    short: 'Comments',
    title: 'Comments: notes for humans',
    analogy: [
      { who: 'nix', pose: 'reading', text: 'Sometimes you want to leave a note in your code, for yourself or a friend.' },
      { who: 'riff', pose: 'teaching', text: 'Start a line with `#` and Python skips it completely. It’s invisible to Python!' },
    ],
    parts: [
      { code: '# This is a note for humans', explain: 'A comment. The # tells Python: ignore this line.' },
      { code: '\n' },
      { code: 'print("Only this line runs")', explain: 'A normal line of code. Python runs this one.' },
    ],
    tryPrompt: { who: 'riff', pose: 'encouraging', text: 'Add your own note on a new line starting with `#`, then **Run**. Does the output change?' },
    tryNeedsChange: true,
    tryDone: { who: 'nix', pose: 'encouraging', text: 'Same output! Comments are for people, not for Python.' },
    challenge: {
      lines: [{ who: 'nix', pose: 'surprised', text: 'Uh oh, this code prints a spoiler! Turn the spoiler line into a comment so it doesn’t run.' }],
      starter: 'print("The movie starts!")\nprint("SPOILER: the robot is the hero")\nprint("The end")\n',
      check: checkComments,
      hints: ['Find the line with SPOILER in it.', 'Put a `#` at the very start of that line.', '# print("SPOILER: the robot is the hero")'],
      success: { who: 'riff', pose: 'celebrating', text: 'Spoiler saved! Nobody\'s movie is ruined.' },
    },
    quickCheck: { code: '# print("A")\nprint("B")', question: 'What will this show?', choices: ['B', 'A, then B', 'A', 'Nothing'], answer: 0 },
  },
  {
    id: 'input',
    recap: '`input("question")` asks and waits. The answer goes into a box.',
    short: 'input()',
    title: 'input(): ask a question',
    analogy: [
      { who: 'riff', pose: 'teaching', text: 'So far Python does all the talking. Let\'s make it LISTEN.' },
      { who: 'nix', pose: 'teaching', text: '`input()` shows a question and waits for someone to type an answer. The answer goes into a box.' },
    ],
    parts: [
      { code: 'name', explain: 'The box that will hold the answer.' },
      { code: ' = ' },
      { code: 'input("What\'s your name? ")', explain: 'Shows the question and waits. Whatever you type goes into the name box.' },
      { code: '\n' },
      { code: 'print("Hi", name)', explain: 'A comma inside print( ) shows things side by side, with a space between them.' },
    ],
    tryPrompt: { who: 'nix', pose: 'thinking', text: '**Run** it, then type your answer in the box under the output and press Enter.' },
    tryNeedsChange: false,
    tryDone: { who: 'riff', pose: 'celebrating', text: 'Python listened! Your programs can talk AND listen now.' },
    challenge: {
      lines: [{ who: 'riff', pose: 'pointing', text: 'Challenge: ask for a favourite animal, then print a sentence that uses the answer, like "I love tigers".' }],
      starter: 'animal = input("Favourite animal? ")\n',
      check: checkInput,
      hints: ['The answer is stored in the `animal` box.', 'Use a comma in print: `print("I love", animal)`', 'print("I love", animal)'],
      success: { who: 'riff', pose: 'celebrating', text: 'That’s a real conversation with your computer!' },
    },
    quickCheck: {
      code: 'answer = input("Ready? ")',
      question: 'What does this line do?',
      choices: ['Shows "Ready?" and waits for someone to type an answer', 'Prints the word answer', 'Makes the code run faster', 'Deletes the answer'],
      answer: 0,
    },
  },
];
