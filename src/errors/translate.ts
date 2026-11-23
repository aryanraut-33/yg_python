// Error translator v0: turns Python errors into kid language.
// Tone rules (docs/HANDOFF.md §5): "Python got confused", never "you made a mistake";
// point to the line and the pattern, not the answer; always end with a next action.
import type { PythonErrorInfo } from '../runtime/protocol';

export interface KidError {
  /** Pattern id, for the on-device report. */
  id: string;
  title: string;
  /** Short explanation. `backticks` render as code. */
  message: string;
  /** What to try next. */
  tip: string;
  line: number | null;
}

interface Rule {
  id: string;
  match(e: PythonErrorInfo, lineText: string): boolean;
  /** `title` replaces the usual "Python got confused" heading. */
  build(e: PythonErrorInfo, lineText: string): { message: string; tip: string; title?: string };
}

const at = (e: PythonErrorInfo) => (e.line !== null ? ` on line ${e.line}` : '');
const has = (e: PythonErrorInfo, s: string | RegExp) =>
  typeof s === 'string' ? e.message.includes(s) : s.test(e.message);
const quoteChars = /[“”‘’]/;

const RULES: Rule[] = [
  // ---------- Mars rover events (not Python mistakes: the mission went wrong) ----------
  {
    id: 'rover-stuck',
    match: (e) => e.type === 'RoverStuck',
    build: (e) => ({ title: 'The rover is stuck', message: e.message, tip: 'Trace the route square by square with your finger. Where does it cross a crater?' }),
  },
  {
    id: 'rover-off-map',
    match: (e) => e.type === 'RoverOffMap',
    build: (e) => ({ title: 'The rover reached the edge', message: e.message, tip: 'Check the number in `rover.forward(...)` on this line, and which way the rover is facing.' }),
  },
  {
    id: 'rover-battery',
    match: (e) => e.type === 'BatteryEmpty',
    build: (e) => ({ title: 'The rover ran out of battery', message: e.message, tip: 'Every square costs 3% and every turn costs 1%. Look for a route with fewer squares.' }),
  },
  // ---------- Blanks left in fill-in steps ----------
  {
    id: 'blank-left',
    match: (e) => e.type === 'NameError' && /^_+$/.test(e.name ?? ''),
    build: () => ({
      message: 'There\'s still a blank `___` in your code.',
      tip: 'Replace the `___` with your answer, then press Run again.',
    }),
  },
  // ---------- Names & Variables ----------
  {
    id: 'name-typo',
    match: (e) => e.type === 'NameError' && !!e.suggestion,
    build: (e) => ({
      message: `Python doesn't know \`${e.name}\`. Did you mean \`${e.suggestion}\`?`,
      tip: `Check the spelling of \`${e.name}\`. Names must match exactly, even capital letters.`,
    }),
  },
  {
    id: 'name-missing-quotes',
    match: (e, line) => e.type === 'NameError' && !!e.name && /^[A-Za-z]+$/.test(e.name) && new RegExp(`=\\s*${e.name}\\b`).test(line),
    build: (e) => ({
      message: `Python doesn't know \`${e.name}\`. If it's a word or a name, it needs quotes around it.`,
      tip: `Try \`"${e.name}"\` with quotes, so Python knows it's text.`,
    }),
  },
  {
    id: 'unbound-local',
    match: (e) => e.type === 'UnboundLocalError',
    build: (e) => ({
      message: `Python tried to use \`${e.name ?? 'a variable'}\` before it was given a value on this side of the function.`,
      tip: 'Give the variable a starting value with `=` before using or changing it.',
    }),
  },
  {
    id: 'name-unknown',
    match: (e) => e.type === 'NameError',
    build: (e) => ({
      message: `Python doesn't know what \`${e.name ?? 'that name'}\` is yet.`,
      tip: 'Check the spelling. If it\'s a variable, make sure it gets a value (with `=`) on a line above this one. If it\'s text, put quotes around it.',
    }),
  },
  // ---------- Attributes (Modules & Simulators first, then generic) ----------
  {
    id: 'stage-attribute',
    match: (e) => e.type === 'AttributeError' && /module 'stage'/.test(e.message),
    build: (e) => ({
      message: e.suggestion
        ? `The stage doesn't have \`${e.name}\`. Did you mean \`stage.${e.suggestion}\`?`
        : `The stage doesn't have \`${e.name}\`.`,
      tip: 'Check the spelling of the command after the dot. Stage commands include `circle`, `rect`, `line`, `text`, `background` and `wait`.',
    }),
  },
  {
    id: 'turtle-attribute',
    match: (e) => e.type === 'AttributeError' && /module 'turtle'/.test(e.message),
    build: (e) => ({
      message: e.suggestion
        ? `Turtle doesn't have \`${e.name}\`. Did you mean \`turtle.${e.suggestion}\`?`
        : `Turtle doesn't have \`${e.name}\`.`,
      tip: 'Check the command after `turtle.`. Common commands include `forward`, `backward`, `left`, `right`, `circle`, `penup`, `pendown` and `color`.',
    }),
  },
  {
    id: 'rover-attribute',
    match: (e) => e.type === 'AttributeError' && /module 'rover'/.test(e.message),
    build: (e) => ({
      message: e.suggestion
        ? `The rover doesn't have \`${e.name}\`. Did you mean \`rover.${e.suggestion}\`?`
        : `The rover doesn't have \`${e.name}\`.`,
      tip: 'Check the command after `rover.`. Commands include `mission`, `forward`, `turn`, `battery` and `scan`.',
    }),
  },
  {
    id: 'str-has-no-append',
    match: (e) => e.type === 'AttributeError' && has(e, "'str' object has no attribute 'append'"),
    build: () => ({
      message: '`append()` adds items to a list `[ ]`, not to text.',
      tip: 'To add text to text, use `+`, like `name = name + "!"`. Use `.append()` only for lists.',
    }),
  },
  {
    id: 'list-has-no-split',
    match: (e) => e.type === 'AttributeError' && has(e, "'list' object has no attribute 'split'"),
    build: () => ({
      message: '`split()` breaks text into a list, but this variable is already a list.',
      tip: 'Only text has `.split()`. If you already have a list, you can use its items directly.',
    }),
  },
  {
    id: 'attribute',
    match: (e) => e.type === 'AttributeError',
    build: (e) => ({
      message: e.suggestion ? `That doesn't have \`${e.name}\`. Did you mean \`${e.suggestion}\`?` : e.message,
      tip: 'Check the spelling of the word after the dot.',
    }),
  },
  // ---------- Stage & Turtle arguments ----------
  {
    id: 'stage-argument',
    match: (e) => !!e.fromStage && (e.type === 'ValueError' || e.type === 'TypeError'),
    build: (e) => ({
      message: e.message,
      tip: 'Look at the stage command on this line and check what\'s inside the brackets.',
    }),
  },
  {
    id: 'turtle-color-error',
    match: (e) => e.type === 'ValueError' && has(e, /bad color sequence|unknown color/),
    build: () => ({
      message: 'Turtle doesn\'t recognize that colour name.',
      tip: 'Use colour names like `"red"`, `"blue"`, `"coral"`, `"mint"`, `"butter"`, or a hex code like `"#FFD66B"`.',
    }),
  },
  // ---------- Syntax (specific patterns must precede syntax-generic) ----------
  {
    id: 'curly-quotes',
    match: (e, line) => (e.type === 'SyntaxError' && has(e, 'invalid character')) || (e.type === 'SyntaxError' && quoteChars.test(line)),
    build: () => ({
      message: 'This line has curly quotes like “ or ’. Python only understands straight quotes.',
      tip: 'Delete the curly quotes and type them again with the " key in the editor.',
    }),
  },
  {
    id: 'print-brackets',
    match: (e) => e.type === 'SyntaxError' && has(e, /Missing parentheses in call to 'print'/),
    build: () => ({
      message: '`print` needs brackets around what you want to print.',
      tip: 'Write it like this: `print("hello")`.',
    }),
  },
  {
    id: 'missing-colon',
    match: (e) => e.type === 'SyntaxError' && has(e, "expected ':'"),
    build: () => ({
      message: 'Lines that start with `for`, `if`, `while` or `def` need a colon `:` at the end.',
      tip: 'Add a `:` at the end of the line, then press Run.',
    }),
  },
  {
    id: 'unclosed-string',
    match: (e) => e.type === 'SyntaxError' && has(e, /unterminated (triple-quoted )?string/),
    build: () => ({
      message: 'A piece of text is missing its closing quote.',
      tip: 'Text needs a quote at the start and at the end, like `"hello"`. Add the missing `"`.',
    }),
  },
  {
    id: 'unclosed-bracket',
    match: (e) => e.type === 'SyntaxError' && has(e, /was never closed/),
    build: (e) => ({
      message: `A bracket \`${e.message.match(/'(.)'/)?.[1] ?? '('}\` is opened but never closed.`,
      tip: 'Every `(` needs a `)` to match. Count the brackets on this line and add the missing one.',
    }),
  },
  {
    id: 'format-string-syntax',
    match: (e) => e.type === 'SyntaxError' && has(e, /f-string: /),
    build: () => ({
      message: 'Something inside your f-string `f"..."` is out of place.',
      tip: 'Check the curly brackets `{ }` inside your f-string. Make sure variable names are inside them.',
    }),
  },
  {
    id: 'extra-bracket',
    match: (e) => e.type === 'SyntaxError' && has(e, /unmatched '.'|does not match opening parenthesis/),
    build: () => ({
      message: 'There\'s a closing bracket with no opening bracket to match it.',
      tip: 'Count the `(` and `)` on this line. Remove the extra one, or add the missing `(`.',
    }),
  },
  {
    id: 'equals-in-condition',
    match: (e) => e.type === 'SyntaxError' && has(e, "Maybe you meant '==' or ':=' instead of '='"),
    build: () => ({
      message: 'One `=` puts a value in a box. Two `==` check if two things are the same.',
      tip: 'Inside an `if`, use `==` to compare, like `if score == 10:`.',
    }),
  },
  {
    id: 'cannot-assign-to-literal',
    match: (e) => e.type === 'SyntaxError' && has(e, /cannot assign to (literal|expression|operator)/),
    build: () => ({
      message: 'The variable name must be on the left side of `=`, and the value on the right.',
      tip: 'Swap them around, like `score = 10`, not `10 = score`.',
    }),
  },
  {
    id: 'break-outside-loop',
    match: (e) => e.type === 'SyntaxError' && has(e, "'break' outside loop"),
    build: () => ({
      message: '`break` can only be used inside a `for` or `while` loop to stop it early.',
      tip: 'Make sure the line with `break` is pushed in with 4 spaces inside a loop.',
    }),
  },
  {
    id: 'continue-outside-loop',
    match: (e) => e.type === 'SyntaxError' && has(e, "'continue' outside loop"),
    build: () => ({
      message: '`continue` can only be used inside a loop to skip to the next round.',
      tip: 'Make sure the line with `continue` is indented inside a `for` or `while` loop.',
    }),
  },
  {
    id: 'return-outside-function',
    match: (e) => e.type === 'SyntaxError' && has(e, "'return' outside function"),
    build: () => ({
      message: '`return` can only send a value back from inside a function made with `def`.',
      tip: 'Make sure `return` is inside a `def function_name():` block, indented with 4 spaces.',
    }),
  },
  {
    id: 'duplicate-keyword-arg',
    match: (e) => e.type === 'SyntaxError' && has(e, 'keyword argument repeated'),
    build: () => ({
      message: 'A named setting was given twice to the same command.',
      tip: 'Look inside the brackets and make sure each setting name (like `color=`) only appears once.',
    }),
  },
  {
    id: 'missing-comma',
    match: (e) => e.type === 'SyntaxError' && has(e, 'Perhaps you forgot a comma'),
    build: () => ({
      message: 'Python thinks a comma is missing between two things.',
      tip: 'Items inside brackets need commas between them, like `stage.circle(100, 200, 40)`.',
    }),
  },
  {
    id: 'expected-indent',
    match: (e) => e.type === 'IndentationError' && has(e, 'expected an indented block'),
    build: () => ({
      message: 'The line after a `for`, `if` or `def` needs to be pushed in with 4 spaces.',
      tip: 'Put 4 spaces (or press Tab) at the start of the lines that belong inside.',
    }),
  },
  {
    id: 'unexpected-indent',
    match: (e) => e.type === 'IndentationError' && has(e, 'unexpected indent'),
    build: () => ({
      message: 'This line is pushed in with spaces, but it isn\'t inside a loop or `if`.',
      tip: 'Delete the spaces at the start of this line so it lines up with the lines around it.',
    }),
  },
  {
    id: 'mixed-indent',
    match: (e) => (e.type === 'IndentationError' || e.type === 'TabError') && has(e, /unindent does not match|inconsistent use of tabs/),
    build: () => ({
      message: 'The spaces at the start of this line don\'t line up with the lines above it.',
      tip: 'Make lines inside the same loop start at exactly the same place (4 spaces each).',
    }),
  },
  {
    id: 'syntax-generic',
    match: (e) => e.type === 'SyntaxError' || e.type === 'IndentationError',
    build: () => ({
      message: 'Python couldn\'t read this line. Something small is out of place.',
      tip: 'Check for missing quotes, brackets, colons or commas. Compare it with the example in the step.',
    }),
  },
  // ---------- Modules & Imports ----------
  {
    id: 'module-not-found',
    match: (e) => e.type === 'ModuleNotFoundError' || (e.type === 'ImportError' && has(e, 'No module named')),
    build: () => ({
      message: 'Python couldn\'t find a library with that name.',
      tip: 'Check the spelling after `import`. Available libraries include `stage`, `turtle`, `rover`, `random`, `math`, and `time`.',
    }),
  },
  {
    id: 'import-name-error',
    match: (e) => e.type === 'ImportError' && has(e, 'cannot import name'),
    build: () => ({
      message: 'Python couldn\'t find that command inside the imported library.',
      tip: 'Check the spelling of the command name after `import`.',
    }),
  },
  // ---------- Collections & Subscripting ----------
  {
    id: 'key-error',
    match: (e) => e.type === 'KeyError',
    build: (e) => ({
      message: `Python looked for the key ${e.message} in a dictionary, but couldn't find it.`,
      tip: 'Check the spelling of the key inside `[ ]`, or check what keys were added to the dictionary.',
    }),
  },
  {
    id: 'string-index-range',
    match: (e) => e.type === 'IndexError' && has(e, 'string index out of range'),
    build: () => ({
      message: 'Python tried to pick a letter past the end of the text. Counting starts at 0.',
      tip: 'Check the number inside `[ ]`. For a word with 4 letters, the last letter is at index `3`.',
    }),
  },
  {
    id: 'empty-sequence-choice',
    match: (e) => e.type === 'IndexError' && has(e, 'Cannot choose from an empty sequence'),
    build: () => ({
      message: '`random.choice()` tried to pick an item from an empty list.',
      tip: 'Make sure your list has at least one item inside `[ ]` before picking from it.',
    }),
  },
  {
    id: 'index-out-of-range',
    match: (e) => e.type === 'IndexError',
    build: () => ({
      message: 'Python tried to get an item that isn\'t there. Counting starts at 0, so the last item of 5 is number 4.',
      tip: 'Check the number inside the square brackets `[ ]`.',
    }),
  },
  {
    id: 'list-indices-type',
    match: (e) => e.type === 'TypeError' && has(e, /list indices must be integers or slices/),
    build: () => ({
      message: 'A list index inside `[ ]` must be a whole number like `0` or `1`, not text or a decimal.',
      tip: 'Check what\'s inside the square brackets. Make sure it\'s a whole number, like `items[0]`.',
    }),
  },
  {
    id: 'not-subscriptable',
    match: (e) => e.type === 'TypeError' && has(e, 'object is not subscriptable'),
    build: () => ({
      message: 'Python tried to use square brackets `[ ]` on something that isn\'t a list, dictionary or text (like a number).',
      tip: 'Only lists, text and dictionaries have items you can pick out with `[ ]`. Check the variable before the brackets.',
    }),
  },
  {
    id: 'not-iterable',
    match: (e) => e.type === 'TypeError' && has(e, 'object is not iterable'),
    build: () => ({
      message: 'Python tried to loop over a single value that can\'t be stepped through (like a plain number).',
      tip: 'To count up with a loop, use `range()`, like `for i in range(5):`.',
    }),
  },
  // ---------- Types, Operations & Maths ----------
  {
    id: 'add-text-number',
    match: (e) => e.type === 'TypeError' && has(e, /can only concatenate str|unsupported operand type\(s\) for \+: ('(int|float)' and 'str'|'str' and '(int|float)')/),
    build: () => ({
      message: 'Python can\'t use `+` to join words and numbers together.',
      tip: 'In `print`, use a comma instead: `print("Score:", score)`. Or turn the number into text with `str(score)`.',
    }),
  },
  {
    id: 'unsupported-operand-minus',
    match: (e) => e.type === 'TypeError' && has(e, /unsupported operand type\(s\) for -:/),
    build: () => ({
      message: 'Python can\'t use `-` to subtract words or text.',
      tip: 'Check the values on both sides of `-`. Make sure both are numbers.',
    }),
  },
  {
    id: 'unsupported-operand-multiply',
    match: (e) => e.type === 'TypeError' && has(e, /can't multiply sequence by non-int|unsupported operand type\(s\) for \*:/),
    build: () => ({
      message: 'Python can only multiply numbers, or repeat a word by multiplying it with a whole number.',
      tip: 'Check the values around `*`. If one is text, the other must be a whole number, like `"★" * 5`.',
    }),
  },
  {
    id: 'modulo-zero',
    match: (e) => e.type === 'ZeroDivisionError' && has(e, 'integer modulo by zero'),
    build: () => ({
      message: 'Python can\'t find the remainder with `% 0`. You can never divide by zero.',
      tip: 'Change the number after `%` to a number greater than 0, like `score % 2`.',
    }),
  },
  {
    id: 'divide-by-zero',
    match: (e) => e.type === 'ZeroDivisionError',
    build: () => ({
      message: 'Nothing can be divided by zero, not even by Python.',
      tip: 'Check the number after `/` on this line. Make sure it can never be 0.',
    }),
  },
  {
    id: 'math-domain-error',
    match: (e) => e.type === 'ValueError' && has(e, 'math domain error'),
    build: () => ({
      message: 'A maths command got a number that isn\'t possible (like the square root of a negative number).',
      tip: 'Check the number inside the maths command and make sure it is 0 or greater.',
    }),
  },
  {
    id: 'range-float-error',
    match: (e) => e.type === 'TypeError' && has(e, /'float' object cannot be interpreted as an integer/),
    build: () => ({
      message: '`range()` needs whole numbers to count steps, but it got a decimal number.',
      tip: 'Use whole numbers inside `range()`, like `range(5)` instead of `range(5.5)`.',
    }),
  },
  {
    id: 'range-step-zero',
    match: (e) => e.type === 'ValueError' && has(e, 'range() arg 3 must not be zero'),
    build: () => ({
      message: 'The step size in `range(start, stop, step)` cannot be 0, or Python will never move forward.',
      tip: 'Change the third number in `range()` to `1`, `2`, or `-1`.',
    }),
  },
  {
    id: 'wrong-arg-count',
    match: (e) => e.type === 'TypeError' && has(e, /missing \d+ required positional argument|takes \d+ positional arguments? but \d+ (were|was) given|got an unexpected keyword argument/),
    build: () => ({
      message: 'This command got the wrong number of things inside its brackets.',
      tip: 'Check how many values the command needs, and that commas separate them.',
    }),
  },
  {
    id: 'not-callable',
    match: (e) => e.type === 'TypeError' && has(e, 'object is not callable'),
    build: () => ({
      message: 'Python tried to use something like a command, but it\'s a value. Maybe a variable has the same name as a command (like `print`)?',
      tip: 'Check for a variable named like a command, and rename it.',
    }),
  },
  {
    id: 'int-from-text',
    match: (e) => e.type === 'ValueError' && has(e, 'invalid literal for int()'),
    build: () => ({
      message: '`int()` can only turn digits like `"42"` into a number. It got some text that isn\'t a number.',
      tip: 'When you run it, type a number only, like `7`.',
    }),
  },
  {
    id: 'too-deep',
    match: (e) => e.type === 'RecursionError',
    build: () => ({
      message: 'A function kept calling itself and never stopped.',
      tip: 'Make sure the function has a way to stop, using an `if`.',
    }),
  },
];

export function translateError(e: PythonErrorInfo, code: string): KidError {
  const lineText = e.line !== null ? (code.split('\n')[e.line - 1] ?? '') : '';
  const rule = RULES.find((r) => r.match(e, lineText));
  const titlePrefix = e.fromStage ? 'The stage got confused' : 'Python got confused';
  if (rule) {
    const { message, tip, title } = rule.build(e, lineText);
    return { id: rule.id, title: `${title ?? titlePrefix}${at(e)}`, message, tip, line: e.line };
  }
  return {
    id: 'unknown',
    title: `${titlePrefix}${at(e)}`,
    message: `Python says: ${e.type}: ${e.message}`,
    tip: 'Read the line carefully, then try a hint if you\'re stuck.',
    line: e.line,
  };
}

export const ERROR_RULE_COUNT = RULES.length;
