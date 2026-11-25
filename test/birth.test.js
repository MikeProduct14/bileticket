import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatBirthInput, validationMessage } from '../src/passengers.js';

test('formats compact and pasted birth dates as day, month and year', () => {
  assert.deepEqual(formatBirthInput('1404'), { value: '14.04', caret: 5 });
  assert.deepEqual(formatBirthInput('14041988'), { value: '14.04.1988', caret: 10 });
  assert.deepEqual(formatBirthInput(' 14/04/1988 '), { value: '14.04.1988', caret: 10 });
});

test('keeps the caret at the edited part of the birth date', () => {
  assert.deepEqual(formatBirthInput('14.0.1988', 4), { value: '14.01.988', caret: 4 });
  assert.deepEqual(formatBirthInput('14.4.1988', 3), { value: '14.41.988', caret: 3 });
});

test('still checks the calendar date and the passenger’s age on the travel date', () => {
  const message = value => validationMessage('birth', formatBirthInput(value).value, {}, '2026-12-10');
  assert.equal(message('29022000'), '');
  assert.match(message('29021999'), /действительную дату/);
  assert.equal(message('10122008'), '');
  assert.match(message('11122008'), /18 лет/);
});
