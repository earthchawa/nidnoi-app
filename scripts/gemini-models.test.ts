import { describe, expect, it } from 'vitest';
import { parseModelList, pickFallbackModels } from './gemini-models.ts';

const m = (id: string, methods = ['generateContent']) => ({ name: `models/${id}`, supportedGenerationMethods: methods });

describe('pickFallbackModels', () => {
  const list = [
    m('gemini-3.8-flash'),
    m('gemini-3.8-flash-lite'),
    m('gemini-3.5-flash'),
    m('gemini-3.9-flash-preview'),
    m('gemini-3.8-flash-tts'),
    m('gemini-3.8-pro'),
    m('gemini-2.5-flash-001'),
    m('gemini-embedding-001', ['embedContent']),
    m('gemini-3.0-flash', ['countTokens'])
  ];

  it('picks newest stable Flash models, full Flash before Lite, without the primary', () => {
    expect(pickFallbackModels(list, 'gemini-3.8-flash')).toEqual(['gemini-3.8-flash-lite', 'gemini-3.5-flash']);
    expect(pickFallbackModels(list, 'gemini-3.8-flash', 5)).toEqual(['gemini-3.8-flash-lite', 'gemini-3.5-flash']);
    expect(pickFallbackModels(list, 'gemini-3.5-flash')).toEqual(['gemini-3.8-flash', 'gemini-3.8-flash-lite']);
  });

  it('returns nothing when no model fits', () => {
    expect(pickFallbackModels([m('gemini-3.8-pro')], 'gemini-3.8-flash')).toEqual([]);
  });
});

describe('parseModelList', () => {
  it('splits and trims', () => {
    expect(parseModelList(' a, b ,,c ')).toEqual(['a', 'b', 'c']);
    expect(parseModelList(undefined)).toEqual([]);
  });
});
