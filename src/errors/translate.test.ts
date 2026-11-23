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
  ['key-error', err('KeyError', "'score'"), '', 'dictionary'],
  ['not-subscriptable', err('TypeError', "'int' object is not subscriptable"), '', 'square brackets'],
  ['list-indices-type', err('TypeError', 'list indices must be integers or slices, not str'), '', 'whole number'],
  ['not-iterable', err('TypeError', "'int' object is not iterable"), '', 'range()'],
  ['string-index-range', err('IndexError', 'string index out of range'), '', 'letter'],
  ['empty-sequence-choice', err('IndexError', 'Cannot choose from an empty sequence'), '', 'random.choice()'],
  ['str-has-no-append', err('AttributeError', "'str' object has no attribute 'append'"), '', 'append()'],
  ['list-has-no-split', err('AttributeError', "'list' object has no attribute 'split'"), '', '.split()'],
  ['unsupported-operand-minus', err('TypeError', "unsupported operand type(s) for -: 'str' and 'int'"), '', 'subtract words'],
  ['unsupported-operand-multiply', err('TypeError', "can't multiply sequence by non-int of type 'str'"), '', 'multiply'],
  ['modulo-zero', err('ZeroDivisionError', 'integer modulo by zero'), '', 'divide by zero'],
  ['math-domain-error', err('ValueError', 'math domain error'), '', 'maths command'],
  ['range-float-error', err('TypeError', "'float' object cannot be interpreted as an integer"), '', 'range()'],
  ['range-step-zero', err('ValueError', 'range() arg 3 must not be zero'), '', 'step size'],
  ['cannot-assign-to-literal', err('SyntaxError', 'cannot assign to literal here. Maybe you meant \'==\' instead of \'=\'?'), '', 'left side of `=`'],
  ['break-outside-loop', err('SyntaxError', "'break' outside loop"), '', '`break`'],
  ['continue-outside-loop', err('SyntaxError', "'continue' outside loop"), '', '`continue`'],
  ['return-outside-function', err('SyntaxError', "'return' outside function"), '', '`return`'],
  ['duplicate-keyword-arg', err('SyntaxError', 'keyword argument repeated: color'), '', 'twice'],
  ['format-string-syntax', err('SyntaxError', "f-string: unmatched '('"), '', 'f-string'],
  ['unbound-local', err('UnboundLocalError', "cannot access local variable 'count' where it is not associated with a value", { name: 'count' }), '', 'starting value'],
  ['module-not-found', err('ModuleNotFoundError', "No module named 'pygame'"), '', 'library'],
  ['import-name-error', err('ImportError', "cannot import name 'foo' from 'math'"), '', 'command inside'],
  ['turtle-attribute', err('AttributeError', "module 'turtle' has no attribute 'fd'", { name: 'fd', suggestion: 'forward' }), '', 'turtle.forward'],
  ['rover-attribute', err('AttributeError', "module 'rover' has no attribute 'forwrd'", { name: 'forwrd', suggestion: 'forward' }), '', 'rover.forward'],
  ['turtle-color-error', err('ValueError', 'bad color sequence: purp'), '', 'colour name'],
];

describe('translateError', () => {
  it('has at least 50 patterns (Phase 2)', () => {
    expect(ERROR_RULE_COUNT).toBeGreaterThanOrEqual(50);
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
    const kid = translateError(err('SystemError', 'unexpected platform condition'), '');
    expect(kid.id).toBe('unknown');
    expect(kid.message).toContain('SystemError');
  });
});
