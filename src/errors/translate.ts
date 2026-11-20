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
  build(e: PythonErrorInfo, lineText: string): { message: string; tip: string };
}

const at = (e: PythonErrorInfo) => (e.line !== null ? ` on line ${e.line}` : '');
const has = (e: PythonErrorInfo, s: string | RegExp) =>
  typeof s === 'string' ? e.message.includes(s) : s.test(e.message);
const quoteChars = /[“”‘’]/;

const RULES: Rule[] = [
  // ---------- Blanks left in fill-in steps ----------
  {
    id: 'blank-left',
    match: (e) => e.type === 'NameError' && /^_+$/.test(e.name ?? ''),
    build: () => ({
      message: 'There\'s still a blank `___` in your code.',
      tip: 'Replace the `___` with your answer, then press Run again.',
    }),
  },
  // ---------- Names ----------
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
    id: 'name-unknown',
    match: (e) => e.type === 'NameError',
    build: (e) => ({
      message: `Python doesn't know what \`${e.name ?? 'that name'}\` is yet.`,
      tip: 'Check the spelling. If it\'s a variable, make sure it gets a value (with `=`) on a line above this one. If it\'s text, put quotes around it.',
    }),
  },
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
    id: 'attribute',
    match: (e) => e.type === 'AttributeError',
    build: (e) => ({
      message: e.suggestion ? `That doesn't have \`${e.name}\`. Did you mean \`${e.suggestion}\`?` : e.message,
      tip: 'Check the spelling of the word after the dot.',
    }),
  },
  // ---------- Errors raised by the stage library (already in kid language) ----------
  {
    id: 'stage-argument',
    match: (e) => !!e.fromStage && (e.type === 'ValueError' || e.type === 'TypeError'),
    build: (e) => ({
      message: e.message,
      tip: 'Look at the stage command on this line and check what\'s inside the brackets.',
    }),
  },
  // ---------- Syntax ----------
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
  // ---------- Types and values ----------
  {
    id: 'add-text-number',
    match: (e) => e.type === 'TypeError' && has(e, /can only concatenate str|unsupported operand type\(s\) for \+: '(int|float)' and 'str'|'str' and '(int|float)'/),
    build: () => ({
      message: 'Python can\'t use `+` to join words and numbers together.',
      tip: 'In `print`, use a comma instead: `print("Score:", score)`. Or turn the number into text with `str(score)`.',
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
    id: 'divide-by-zero',
    match: (e) => e.type === 'ZeroDivisionError',
    build: () => ({
      message: 'Nothing can be divided by zero, not even by Python.',
      tip: 'Check the number after `/` on this line. Make sure it can never be 0.',
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
    const { message, tip } = rule.build(e, lineText);
    return { id: rule.id, title: `${titlePrefix}${at(e)}`, message, tip, line: e.line };
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
