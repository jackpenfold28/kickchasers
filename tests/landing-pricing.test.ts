import assert from 'node:assert/strict'
import test from 'node:test'
import { pricing, comparisonRows } from '../src/components/landing/pricing-plans.ts'

// Published commercial terms verified on kickchasers.com, 10 October 2026.
test('landing retains all four published monthly and yearly plan prices', () => {
 assert.deepEqual(pricing.map(({id,monthlyPrice,yearlyPrice}) => [id,monthlyPrice,yearlyPrice]), [
  ['free','$0','$0'], ['member','$5','$39.95'], ['player','$15','$84.95'], ['club','$99.95','$999.95'],
 ])
})

test('every plan retains its inclusions and a corresponding comparison column', () => {
 assert.deepEqual(pricing.map(plan=>plan.features.length),[4,2,4,4])
 for(const row of comparisonRows) assert.equal(row.values.length,pricing.length)
 assert.equal(new Set(pricing.map(plan=>plan.id)).size,4)
 assert.equal(pricing.filter(plan=>plan.highlight).length,1)
})
