import { describe, expect, it } from 'vitest';
import { ERROR_RULE_COUNT, translateError } from './translate';
import type { PythonErrorInfo } from '../runtime/protocol';

const err = (type: string, message: string, extra: Partial<PythonErrorInfo> = {}): PythonErrorInfo => ({
  type,
  message,
  line: 2,
  traceback: '',
  ...extra,
});

// Messages are the real ones from CPython 3.13/3.14.
const cases: [string, PythonErrorInfo, string, string][] = [
  ['blank-left', err('NameError', "name '___' is not defined", { name: '___' }), '', 'blank'],
  ['name-typo', err('NameError', "name 'scroe' is not defined", { name: 'scroe', suggestion: 'score' }), 'print(scroe)', 'Did you mean `score`'],
  ['name-missing-quotes', err('NameError', "name 'Meera' is not defined", { name: 'Meera' }), 'name = Meera', 'quotes'],
  ['name-unknown', err('NameError', "name 'zz' is not defined", { name: 'zz' }), 'print(zz)', "doesn't know"],
  ['stage-attribute', err('AttributeError', "module 'stage' has no attribute 'circel'", { name: 'circel', suggestion: 'circle' }), '', 'stage.circle'],
  ['stage-argument', err('ValueError', 'The stage doesn\'t know the colour "purpel".', { fromStage: true }), '', 'purpel'],
  ['curly-quotes', err('SyntaxError', "invalid character '“' (U+201C)"), 'print(“hi”)', 'curly quotes'],
  ['print-brackets', err('SyntaxError', "Missing parentheses in call to 'print'. Did you mean print(...)?"), '', 'brackets'],
  ['missing-colon', err('SyntaxError', "expected ':'"), '', 'colon'],
  ['unclosed-string', err('SyntaxError', 'unterminated string literal (detected at line 1)'), '', 'closing quote'],
  ['unclosed-bracket', err('SyntaxError', "'(' was never closed"), '', 'never closed'],
  ['extra-bracket', err('SyntaxError', "unmatched ')'"), '', 'closing bracket'],
  ['equals-in-condition', err('SyntaxError', "invalid syntax. Maybe you meant '==' or ':=' instead of '='?"), '', '`==`'],
  ['missing-comma', err('SyntaxError', 'invalid syntax. Perhaps you forgot a comma?'), '', 'comma'],
  ['expected-indent', err('IndentationError', "expected an indented block after 'for' statement on line 1"), '', '4 spaces'],
  ['unexpected-indent', err('IndentationError', 'unexpected indent'), '', 'Delete the spaces'],
  ['mixed-indent', err('IndentationError', 'unindent does not match any outer indentation level'), '', 'line up'],
  ['syntax-generic', err('SyntaxError', 'invalid syntax'), '', "couldn't read"],
  ['add-text-number', err('TypeError', 'can only concatenate str (not "int") to str'), '', 'words and numbers'],
  ['add-text-number', err('TypeError', "unsupported operand type(s) for +: 'int' and 'str'"), '', 'words and numbers'],
  ['wrong-arg-count', err('TypeError', "f() missing 1 required positional argument: 'a'"), '', 'number of things'],
  ['wrong-arg-count', err('TypeError', 'f() takes 1 positional argument but 2 were given'), '', 'number of things'],
  ['not-callable', err('TypeError', "'int' object is not callable"), '', 'command'],
  ['int-from-text', err('ValueError', "invalid literal for int() with base 10: 'abc'"), '', 'type a number'],
  ['divide-by-zero', err('ZeroDivisionError', 'division by zero'), '', 'divided by zero'],
  ['index-out-of-range', err('IndexError', 'list index out of range'), '', 'starts at 0'],
];

describe('translateError', () => {
  it('has at least 20 patterns', () => {
    expect(ERROR_RULE_COUNT).toBeGreaterThanOrEqual(20);
  });

  for (const [id, info, line, expected] of cases) {
    it(`${id}: ${info.message.slice(0, 50)}`, () => {
      const code = `x = 1\n${line}\n`;
      const kid = translateError(info, code);
      expect(kid.id).toBe(id);
      expect(`${kid.message} ${kid.tip}`).toContain(expected);
      expect(kid.title).toMatch(/got confused on line 2/);
    });
  }

  it('never blames the child', () => {
    for (const [, info, line] of cases) {
      const kid = translateError(info, `x = 1\n${line}\n`);
      expect(`${kid.title} ${kid.message} ${kid.tip}`.toLowerCase()).not.toMatch(/you made a mistake|wrong!|you failed/);
    }
  });

  it('falls back to Python\'s own words for unknown errors', () => {
    const kid = translateError(err('KeyError', "'x'"), '');
    expect(kid.id).toBe('unknown');
    expect(kid.message).toContain('KeyError');
  });
});
