import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseCliArgs } from '../src/args.js';

describe('parseCliArgs', () => {
  it('parses --target flag', () => {
    const result = parseCliArgs(['--target', 'de', 'Hello']);
    assert.equal(result.target, 'de');
  });

  it('parses -t short flag', () => {
    const result = parseCliArgs(['-t', 'de', 'Hello']);
    assert.equal(result.target, 'de');
  });

  it('parses --source flag', () => {
    const result = parseCliArgs(['-t', 'de', '--source', 'en', 'Hello']);
    assert.equal(result.source, 'en');
  });

  it('parses -s short flag', () => {
    const result = parseCliArgs(['-t', 'de', '-s', 'en', 'Hello']);
    assert.equal(result.source, 'en');
  });

  it('defaults source to null when not specified', () => {
    const result = parseCliArgs(['-t', 'de', 'Hello']);
    assert.equal(result.source, null);
  });

  it('parses --context flag', () => {
    const result = parseCliArgs([
      '-t',
      'de',
      '--context',
      'Email greeting',
      'Hello',
    ]);
    assert.equal(result.context, 'Email greeting');
  });

  it('parses -c short flag', () => {
    const result = parseCliArgs(['-t', 'de', '-c', 'Email greeting', 'Hello']);
    assert.equal(result.context, 'Email greeting');
  });

  it('parses --formality flag', () => {
    const result = parseCliArgs(['-t', 'de', '--formality', 'more', 'Hello']);
    assert.equal(result.formality, 'more');
  });

  it('parses -f short flag', () => {
    const result = parseCliArgs(['-t', 'de', '-f', 'less', 'Hello']);
    assert.equal(result.formality, 'less');
  });

  it('accepts all valid formality values', () => {
    for (const val of [
      'less',
      'more',
      'default',
      'prefer_less',
      'prefer_more',
    ]) {
      const result = parseCliArgs(['-t', 'de', '-f', val, 'Hello']);
      assert.equal(result.formality, val);
    }
  });

  it('throws on invalid formality value', () => {
    assert.throws(
      () => parseCliArgs(['-t', 'de', '-f', 'invalid', 'Hello']),
      (err: Error) => {
        assert.match(err.message, /Invalid formality value/);
        assert.match(err.message, /invalid/);
        return true;
      },
    );
  });

  it('parses --verbose flag', () => {
    const result = parseCliArgs(['-t', 'de', '--verbose', 'Hello']);
    assert.equal(result.verbose, true);
  });

  it('parses -v short flag', () => {
    const result = parseCliArgs(['-t', 'de', '-v', 'Hello']);
    assert.equal(result.verbose, true);
  });

  it('defaults verbose to false', () => {
    const result = parseCliArgs(['-t', 'de', 'Hello']);
    assert.equal(result.verbose, false);
  });

  it('captures positional text argument', () => {
    const result = parseCliArgs(['-t', 'de', 'Hello, world!']);
    assert.equal(result.text, 'Hello, world!');
  });

  it('joins multiple positional arguments with space', () => {
    const result = parseCliArgs(['-t', 'de', 'Hello,', 'world!']);
    assert.equal(result.text, 'Hello, world!');
  });

  it('text is undefined when no positional argument provided', () => {
    const result = parseCliArgs(['-t', 'de']);
    assert.equal(result.text, undefined);
  });

  it('throws when --target is missing', () => {
    assert.throws(
      () => parseCliArgs(['Hello']),
      (err: Error) => {
        assert.match(err.message, /--target/);
        return true;
      },
    );
  });

  it('parses --help flag', () => {
    const result = parseCliArgs(['--help']);
    assert.equal(result.help, true);
  });

  it('parses -h short flag', () => {
    const result = parseCliArgs(['-h']);
    assert.equal(result.help, true);
  });

  it('--help does not require --target', () => {
    const result = parseCliArgs(['--help']);
    assert.equal(result.help, true);
    assert.equal(result.target, '');
  });

  it('parses --version flag', () => {
    const result = parseCliArgs(['--version']);
    assert.equal(result.version, true);
  });

  it('--version does not require --target', () => {
    const result = parseCliArgs(['--version']);
    assert.equal(result.version, true);
    assert.equal(result.target, '');
  });

  it('shows help when called with no arguments', () => {
    const result = parseCliArgs([]);
    assert.equal(result.help, true);
  });

  it('parses all flags together', () => {
    const result = parseCliArgs([
      '-t',
      'de',
      '-s',
      'en',
      '-c',
      'context text',
      '-f',
      'more',
      '-v',
      'Translate this',
    ]);
    assert.equal(result.target, 'de');
    assert.equal(result.source, 'en');
    assert.equal(result.context, 'context text');
    assert.equal(result.formality, 'more');
    assert.equal(result.verbose, true);
    assert.equal(result.text, 'Translate this');
  });
});
