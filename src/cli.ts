#!/usr/bin/env node

import { createReadStream } from 'node:fs';
import { loadConfig, resolveApiKey } from './config.js';
import { createClient, translate } from './translate.js';
import { parseCliArgs, HELP_TEXT } from './args.js';

function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    const stream = createReadStream('/dev/stdin', { encoding: 'utf-8' });

    const timeout = setTimeout(() => {
      stream.destroy();
      reject(
        new Error(
          'No input provided. Pass text as an argument or pipe via stdin.',
        ),
      );
    }, 100);

    stream.on('data', (chunk) => {
      clearTimeout(timeout);
      data += chunk;
    });

    stream.on('end', () => {
      clearTimeout(timeout);
      resolve(data.trim());
    });

    stream.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

function getVersion(): string {
  return '0.1.0';
}

async function main(): Promise<void> {
  let parsed;
  try {
    parsed = parseCliArgs(process.argv.slice(2));
  } catch (err) {
    process.stderr.write(`Error: ${(err as Error).message}\n`);
    process.exit(1);
  }

  if (parsed.help) {
    process.stdout.write(HELP_TEXT + '\n');
    process.exit(0);
  }

  if (parsed.version) {
    process.stdout.write(getVersion() + '\n');
    process.exit(0);
  }

  // Get text from argument or stdin
  let text = parsed.text;
  if (!text) {
    if (process.stdin.isTTY) {
      process.stderr.write(
        'Error: No text provided. Pass text as an argument or pipe via stdin.\n' +
          'Use --help for usage information.\n',
      );
      process.exit(1);
    }
    try {
      text = await readStdin();
    } catch {
      process.stderr.write(
        'Error: No text provided. Pass text as an argument or pipe via stdin.\n' +
          'Use --help for usage information.\n',
      );
      process.exit(1);
    }
  }

  if (!text) {
    process.stderr.write(
      'Error: Empty text provided.\nUse --help for usage information.\n',
    );
    process.exit(1);
  }

  // Load config and resolve API key
  let apiKey: string;
  try {
    const config = loadConfig();
    apiKey = resolveApiKey(config);
  } catch (err) {
    process.stderr.write(`Error: ${(err as Error).message}\n`);
    process.exit(1);
  }

  // Translate
  try {
    const client = createClient(apiKey);
    const result = await translate(client, {
      text,
      sourceLang: parsed.source as Parameters<typeof translate>[1]['sourceLang'],
      targetLang: parsed.target as Parameters<typeof translate>[1]['targetLang'],
      context: parsed.context,
      formality: parsed.formality,
    });

    process.stdout.write(result.text + '\n');

    if (parsed.verbose) {
      process.stderr.write(
        `Detected source language: ${result.detectedSourceLang}\n`,
      );
      process.stderr.write(`Billed characters: ${result.billedCharacters}\n`);
    }
  } catch (err) {
    process.stderr.write(`Error: ${(err as Error).message}\n`);
    process.exit(1);
  }
}

main();
