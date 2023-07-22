import { describe, it, expect } from 'vitest';
import { parse } from './parse';

import PUPPETEER_REPLAY_JSON from './test-data/puppeteer-replay.json';
import USER_FLOW_REPLAY_JSON from './test-data/userflow-replay.json';

describe('puppeteer replay user-flow json parser', () => {

  it('should parse original replay script without changes', () => {

    const TITLE_AND_STEPS_SCRIPT = { title: '', steps: [] };
    expect(parse(TITLE_AND_STEPS_SCRIPT)).toEqual(TITLE_AND_STEPS_SCRIPT);

    expect(PUPPETEER_REPLAY_JSON['steps']).toBeDefined();
    expect(parse(PUPPETEER_REPLAY_JSON)).toEqual(PUPPETEER_REPLAY_JSON);
  });

  it('should parse user-flow enriched replay script without changes', () => {
    expect(USER_FLOW_REPLAY_JSON['steps']).toBeDefined();
    expect(parse(USER_FLOW_REPLAY_JSON)).toEqual(USER_FLOW_REPLAY_JSON);
  });

  it('should parse to throw if given an invalid replay script', () => {

    const EMPTY_SCRIPT = {};
    expect(() => parse(EMPTY_SCRIPT)).toThrowError("Recording is missing `title`");

    const STEPS_ONLY_SCRIPT = { steps: [] };
    expect(() => parse(STEPS_ONLY_SCRIPT)).toThrowError("Recording is missing `title`");

    const TITLE_ONLY_SCRIPT = { title: '' };
    expect(() => parse(TITLE_ONLY_SCRIPT)).toThrowError("Recording is missing `steps`");
  })

});
