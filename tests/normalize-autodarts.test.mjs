import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

// Use the project's TypeScript compiler, without requiring a separate test runner
// or Node's newer experimental TypeScript loader.
const source = readFileSync(new URL('../src/utils/normalize-autodarts.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
});
const { normalizeAutodartsState: normalize } = await import(
    `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
);

const base = { connected: true, running: true, status: 'throw', event: 'throwDetected' };
const single = {
    bed: 'SingleOuter', segmentName: 'S20', segmentNumber: 20, multiplier: 1,
    coordsX: 0.02, coordsY: 0.66, bouncer: false, failed: false, method: 'UnanimousCam',
};
const miss = {
    bed: 'Outside', segmentName: 'Miss', segmentNumber: 0, multiplier: 0,
    coordsX: 0, coordsY: 0, bouncer: true, failed: true, method: 'Failed',
};

test('normalizes a Board Manager 2.1.0 turn into the game input format', () => {
    const state = normalize({ ...base, status: 'takeout', throws: [miss, single, single] });
    assert.equal(state.status, 'Takeout');
    assert.equal(state.event, 'Throw detected');
    assert.equal(state.numThrows, 3);
    assert.deepEqual(state.throws.map(t => t.segment.name), ['Miss', 'S20', 'S20']);
    assert.equal(state.throws.reduce((sum, t) => sum + t.segment.number * t.segment.multiplier, 0), 40);
    assert.deepEqual(state.throws[1].coords, { x: 0.02, y: 0.66 });
    assert.equal(state.connected, true);
    assert.equal(state.running, true);
});

test('preserves legacy and simulator payloads with nested segment and coords', () => {
    const state = {
        ...base, status: 'Throw', event: 'Throw detected', numThrows: 1,
        throws: [{ segment: { name: 'T20', number: 20, multiplier: 3, bed: 'Triple' }, coords: { x: 0, y: 0.5 } }],
    };
    assert.deepEqual(normalize(state), state);
});

test('normalizes takeout lifecycle and undo events used by the game components', () => {
    for (const [incoming, expected] of [
        ['throw', 'Throw'], ['takeout', 'Takeout'],
        ['takeoutInProgress', 'Takeout in progress'], ['takeoutFinished', 'Takeout finished'],
    ]) {
        assert.equal(normalize({ ...base, status: incoming, throws: [] }).status, expected);
    }
    for (const [incoming, expected] of [
        ['throwRemoved', 'Throw removed'], ['takeoutStarted', 'Takeout in progress'],
        ['takeoutFinished', 'Takeout finished'], ['reset', 'Reset'],
    ]) {
        assert.equal(normalize({ ...base, event: incoming, throws: [] }).event, expected);
    }
    const takeout = normalize({ ...base, event: 'takeoutFinished', throws: [] });
    assert.equal(takeout.numThrows, 0);
    assert.deepEqual(takeout.throws, []);
});

test('uses the throw array as the source of truth for the throw count', () => {
    assert.equal(normalize({ ...base, numThrows: 99, throws: [single] }).numThrows, 1);
});

test('keeps unknown status and event strings for forward compatibility', () => {
    const state = normalize({ ...base, status: 'newStatus', event: 'newEvent', throws: [] });
    assert.equal(state.status, 'newStatus');
    assert.equal(state.event, 'newEvent');
});

test('rejects malformed state and throws before they reach the UI', () => {
    for (const value of [null, [], {}, { throws: null }, { throws: [null] }, { throws: [{}] },
        { throws: [{ ...single, multiplier: NaN }] }, { throws: [{ ...single, segmentNumber: '20' }] }]) {
        assert.equal(normalize(value), null);
    }
});

test('defaults absent or non-finite coordinates without changing the score', () => {
    const state = normalize({ ...base, throws: [{ ...single, coordsX: NaN, coordsY: undefined }] });
    assert.deepEqual(state.throws[0].coords, { x: 0, y: 0 });
    assert.equal(state.throws[0].segment.number, 20);
});
