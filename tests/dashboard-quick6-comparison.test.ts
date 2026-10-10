import assert from 'node:assert/strict'
import test from 'node:test'
import { quick6Delta } from '../src/lib/canonical/quick6-comparison.ts'
const stat = (value: number | null, available = true) => ({ value, available })
test('Quick 6 gain and loss compare current scope against the labelled reference', () => {
  assert.equal(quick6Delta(stat(20), stat(14.7)), 5.3)
  assert.equal(quick6Delta(stat(14.7), stat(20)), -5.3)
})
test('equal and display-rounded equal values have no trend glow', () => {
  assert.equal(quick6Delta(stat(14.7), stat(14.7)), 0)
  assert.equal(quick6Delta(stat(14.71), stat(14.74)), 0)
})
test('missing or unavailable reference is neutral, not a loss', () => {
  assert.equal(quick6Delta(stat(10), stat(null)), null)
  assert.equal(quick6Delta(stat(10), stat(0, false)), null)
  assert.equal(quick6Delta(stat(null), stat(10)), null)
  assert.equal(quick6Delta(stat(NaN), stat(10)), null)
})
