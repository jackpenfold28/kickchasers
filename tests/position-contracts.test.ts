import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  PLAYER_POSITIONS,
  canonicalizeOptionalPlayerPosition,
  getPlayerPositionLabel,
  isPlayerPosition,
  normalizePlayerPosition,
  resolvePlayerPosition,
} from '../src/lib/canonical/positions.ts'
import {
  resolveBenchmarkGroup,
  resolveThresholdBenchmarkGroup,
} from '../src/lib/canonical/position-benchmark.ts'

const CANONICAL_POSITIONS = ['FWD', 'MID', 'RUC', 'DEF'] as const

test('every canonical position validates', () => {
  for (const position of CANONICAL_POSITIONS) assert.equal(isPlayerPosition(position), true)
})

test('RUC is a canonical position', () => {
  assert.equal(isPlayerPosition('RUC'), true)
})

test('arbitrary values fail canonical validation', () => {
  assert.equal(isPlayerPosition('Utility'), false)
  assert.equal(isPlayerPosition('Bench'), false)
})

test('canonical labels match the current mobile wording', () => {
  assert.deepEqual(CANONICAL_POSITIONS.map(getPlayerPositionLabel), [
    'Forward',
    'Midfield',
    'Ruck',
    'Defender',
  ])
})

test('current mobile legacy aliases normalize safely', () => {
  assert.deepEqual(
    ['Forward', 'Forwards', 'Midfield', 'Midfielder', 'Ruck', 'Defender', 'Defence', 'Defense'].map(
      normalizePlayerPosition,
    ),
    ['FWD', 'FWD', 'MID', 'MID', 'RUC', 'DEF', 'DEF', 'DEF'],
  )
})

test('unknown and ambiguous aliases do not normalize', () => {
  for (const value of ['Utility', 'Bench', 'Key Forward', 'Key Defender', 'Wing']) {
    assert.equal(normalizePlayerPosition(value), null)
  }
})

test('canonical option registry exposes all four positions once in mobile order', () => {
  assert.deepEqual(PLAYER_POSITIONS.map(({ code }) => code), CANONICAL_POSITIONS)
})

test('the Ruck option stores RUC', () => {
  assert.equal(PLAYER_POSITIONS.find(({ label }) => label === 'Ruck')?.code, 'RUC')
})

test('existing RUC hydrates to the same canonical value', () => {
  assert.equal(normalizePlayerPosition('RUC'), 'RUC')
})

test('all other displayed options submit canonical values', () => {
  for (const option of PLAYER_POSITIONS) assert.equal(canonicalizeOptionalPlayerPosition(option.code), option.code)
})

test('existing RUC displays as Ruck', () => {
  assert.equal(getPlayerPositionLabel('RUC'), 'Ruck')
})

test('changing a friendly Ruck value canonicalizes to RUC at a mutation boundary', () => {
  assert.equal(canonicalizeOptionalPlayerPosition('Ruck'), 'RUC')
})

test('changing away from Ruck submits the selected canonical value', () => {
  assert.equal(canonicalizeOptionalPlayerPosition('Defender'), 'DEF')
})

test('optional and empty positions preserve null semantics', () => {
  assert.equal(canonicalizeOptionalPlayerPosition(null), null)
  assert.equal(canonicalizeOptionalPlayerPosition(undefined), null)
  assert.equal(canonicalizeOptionalPlayerPosition('  '), null)
})

test('roster options use the canonical registry', async () => {
  const source = await readFile(new URL('../src/routes/portal/SquadDetailPage.tsx', import.meta.url), 'utf8')
  assert.match(source, /PLAYER_POSITIONS\.map/)
  assert.doesNotMatch(source, /\['Forward', 'Midfield', 'Defence', 'Ruck', 'Utility', 'Bench'\]/)
})

test('Ruck can be assigned to a roster member as its code', () => {
  const ruck = PLAYER_POSITIONS.find(({ code }) => code === 'RUC')
  assert.equal(canonicalizeOptionalPlayerPosition(ruck?.code), 'RUC')
})

test('unsupported roster display labels throw before persistence', () => {
  assert.throws(() => canonicalizeOptionalPlayerPosition('Utility'), /valid player position/)
  assert.throws(() => canonicalizeOptionalPlayerPosition('Bench'), /valid player position/)
})

test('existing canonical roster positions round-trip unchanged', () => {
  for (const position of CANONICAL_POSITIONS) {
    assert.equal(canonicalizeOptionalPlayerPosition(position), position)
  }
})

test('RUC form values resolve to the Ruck Impact 7 path', () => {
  assert.equal(resolveBenchmarkGroup(canonicalizeOptionalPlayerPosition('RUC')), 'Ruck')
  assert.equal(resolveThresholdBenchmarkGroup('RUC'), 'Ruck')
})

test('other form values resolve to their canonical calculation groups', () => {
  assert.deepEqual(CANONICAL_POSITIONS.map(resolveBenchmarkGroup), [
    'Forward',
    'Mid',
    'Ruck',
    'Defender',
  ])
})

test('the first supported source wins during non-destructive read normalization', () => {
  assert.equal(resolvePlayerPosition('unknown', null, 'Ruck', 'FWD'), 'RUC')
})

test('strict type guard does not treat aliases as stored canonical values', () => {
  assert.equal(isPlayerPosition('Ruck'), false)
  assert.equal(isPlayerPosition('ruc'), false)
})

test('historical benchmark-only composite groups retain Stage 0 behaviour', () => {
  assert.equal(resolveBenchmarkGroup('FWD/MID'), 'Forward')
  assert.equal(resolveBenchmarkGroup('MID/DEF'), 'Defender')
})

test('onboarding hydrates through the canonical normalizer and renders registry labels', async () => {
  const source = await readFile(new URL('../src/routes/Onboarding.tsx', import.meta.url), 'utf8')
  assert.match(source, /setPlayerPosition\(normalizePlayerPosition\(profile\.player_position\)\)/)
  assert.match(source, /title=\{`\$\{position\.label\} \(\$\{position\.shortLabel\}\)`\}/)
  assert.match(source, /setPlayerPosition\(position\.code\)/)
})

test('onboarding validates the canonical value again at the repository boundary', async () => {
  const source = await readFile(new URL('../src/lib/onboarding.ts', import.meta.url), 'utf8')
  assert.match(source, /canonicalizeOptionalPlayerPosition\(playerPosition\)/)
  assert.match(source, /player_position: canonicalPlayerPosition/)
})

test('profile editing returns to profile so its existing loader refetches saved state', async () => {
  const source = await readFile(new URL('../src/routes/portal/ProfilePage.tsx', import.meta.url), 'utf8')
  assert.match(source, /onboarding\?mode=edit&returnTo=%2Fprofile/)
})

test('roster persistence canonicalizes before updating squad_members', async () => {
  const source = await readFile(new URL('../src/lib/squads.ts', import.meta.url), 'utf8')
  assert.match(source, /canonicalPosition = canonicalizeOptionalPlayerPosition\(position\)/)
  assert.match(source, /update\(\{ position: canonicalPosition \}\)/)
})
