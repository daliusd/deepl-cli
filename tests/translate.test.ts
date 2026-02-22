import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { translate } from '../src/translate.js';
import type { DeepLClient } from 'deepl-node';

function createMockClient(
  response: {
    text: string;
    detectedSourceLang: string;
    billedCharacters: number;
  } = {
    text: 'Hallo, Welt!',
    detectedSourceLang: 'en',
    billedCharacters: 13,
  },
): DeepLClient {
  const translateText = mock.fn(async () => response);
  return { translateText } as unknown as DeepLClient;
}

function createFailingMockClient(error: Error): DeepLClient {
  const translateText = mock.fn(async () => {
    throw error;
  });
  return { translateText } as unknown as DeepLClient;
}

describe('translate', () => {
  it('calls translateText with correct arguments', async () => {
    const client = createMockClient();
    await translate(client, {
      text: 'Hello, world!',
      sourceLang: 'en',
      targetLang: 'de',
    });

    const calls = (client.translateText as ReturnType<typeof mock.fn>).mock
      .calls;
    assert.equal(calls.length, 1);
    assert.equal(calls[0].arguments[0], 'Hello, world!');
    assert.equal(calls[0].arguments[1], 'en');
    assert.equal(calls[0].arguments[2], 'de');
  });

  it('passes null source language for auto-detection', async () => {
    const client = createMockClient();
    await translate(client, {
      text: 'Hello',
      sourceLang: null,
      targetLang: 'de',
    });

    const calls = (client.translateText as ReturnType<typeof mock.fn>).mock
      .calls;
    assert.equal(calls[0].arguments[1], null);
  });

  it('returns translated text', async () => {
    const client = createMockClient({
      text: 'Bonjour le monde!',
      detectedSourceLang: 'en',
      billedCharacters: 12,
    });
    const result = await translate(client, {
      text: 'Hello world!',
      sourceLang: null,
      targetLang: 'fr',
    });

    assert.equal(result.text, 'Bonjour le monde!');
  });

  it('returns detected source language', async () => {
    const client = createMockClient({
      text: 'Hallo',
      detectedSourceLang: 'en',
      billedCharacters: 5,
    });
    const result = await translate(client, {
      text: 'Hello',
      sourceLang: null,
      targetLang: 'de',
    });

    assert.equal(result.detectedSourceLang, 'en');
  });

  it('returns billed characters count', async () => {
    const client = createMockClient({
      text: 'Hallo',
      detectedSourceLang: 'en',
      billedCharacters: 5,
    });
    const result = await translate(client, {
      text: 'Hello',
      sourceLang: null,
      targetLang: 'de',
    });

    assert.equal(result.billedCharacters, 5);
  });

  it('passes context option when provided', async () => {
    const client = createMockClient();
    await translate(client, {
      text: 'Hello',
      sourceLang: null,
      targetLang: 'de',
      context: 'Email greeting',
    });

    const calls = (client.translateText as ReturnType<typeof mock.fn>).mock
      .calls;
    const options = calls[0].arguments[3];
    assert.equal(options.context, 'Email greeting');
  });

  it('does not pass context when not provided', async () => {
    const client = createMockClient();
    await translate(client, {
      text: 'Hello',
      sourceLang: null,
      targetLang: 'de',
    });

    const calls = (client.translateText as ReturnType<typeof mock.fn>).mock
      .calls;
    const options = calls[0].arguments[3];
    assert.equal(options.context, undefined);
  });

  it('passes formality option when provided', async () => {
    const client = createMockClient();
    await translate(client, {
      text: 'How are you?',
      sourceLang: null,
      targetLang: 'de',
      formality: 'more',
    });

    const calls = (client.translateText as ReturnType<typeof mock.fn>).mock
      .calls;
    const options = calls[0].arguments[3];
    assert.equal(options.formality, 'more');
  });

  it('does not pass formality when not provided', async () => {
    const client = createMockClient();
    await translate(client, {
      text: 'Hello',
      sourceLang: null,
      targetLang: 'de',
    });

    const calls = (client.translateText as ReturnType<typeof mock.fn>).mock
      .calls;
    const options = calls[0].arguments[3];
    assert.equal(options.formality, undefined);
  });

  it('propagates DeepL API errors', async () => {
    const client = createFailingMockClient(
      new Error('Authorization failure, check auth_key'),
    );

    await assert.rejects(
      () =>
        translate(client, {
          text: 'Hello',
          sourceLang: null,
          targetLang: 'de',
        }),
      (err: Error) => {
        assert.match(err.message, /Authorization failure/);
        return true;
      },
    );
  });

  it('handles array response from translateText', async () => {
    // deepl-node returns a single TextResult for a single string input,
    // but our code handles array form defensively
    const arrayResponse = [
      {
        text: 'Hallo',
        detectedSourceLang: 'en',
        billedCharacters: 5,
      },
    ];
    const translateText = mock.fn(async () => arrayResponse);
    const client = { translateText } as unknown as DeepLClient;

    const result = await translate(client, {
      text: 'Hello',
      sourceLang: null,
      targetLang: 'de',
    });

    assert.equal(result.text, 'Hallo');
    assert.equal(result.detectedSourceLang, 'en');
    assert.equal(result.billedCharacters, 5);
  });
});
