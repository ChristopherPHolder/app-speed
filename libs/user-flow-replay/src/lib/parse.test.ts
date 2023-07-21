import { describe, it, expect } from 'vitest';
import { parse } from './parse';
import puppeteerReplay from './test-data/puppeteer-replay.json';
import userFlowReplay from './test-data/userflow-replay.json';
describe('replay', () => {

  it('should parse original replay script without changes', () => {
    expect(puppeteerReplay['steps']).toBeDefined();

    expect(parse(puppeteerReplay)).toEqual(puppeteerReplay);
  });

  it('should parse user-flow enriched replay script without changes', () => {
    expect(userFlowReplay['steps']).toBeDefined();

    expect(parse(userFlowReplay)).toEqual(userFlowReplay);
  });

});
