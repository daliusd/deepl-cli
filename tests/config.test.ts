import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { loadConfig, resolveApiKey } from '../src/config.js';

function createTempDir(): string {
  const dir = join(tmpdir(), `deepl-cli-test-${randomUUID()}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function writeConfig(dir: string, content: string): string {
  const path = join(dir, 'config.json');
  writeFileSync(path, content, 'utf-8');
  return path;
}

describe('loadConfig', () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const dir of tempDirs) {
      rmSync(dir, { recursive: true, force: true });
    }
    tempDirs.length = 0;
  });

  it('loads config with api_key', () => {
    const dir = createTempDir();
    tempDirs.push(dir);
    const configPath = writeConfig(dir, '{"api_key": "test-key-123"}');

    const config = loadConfig(configPath);
    assert.equal(config.api_key, 'test-key-123');
  });

  it('loads config with api_key_command', () => {
    const dir = createTempDir();
    tempDirs.push(dir);
    const configPath = writeConfig(
      dir,
      '{"api_key_command": "echo test-key"}',
    );

    const config = loadConfig(configPath);
    assert.equal(config.api_key_command, 'echo test-key');
  });

  it('loads config with both api_key and api_key_command', () => {
    const dir = createTempDir();
    tempDirs.push(dir);
    const configPath = writeConfig(
      dir,
      '{"api_key": "static-key", "api_key_command": "echo dynamic-key"}',
    );

    const config = loadConfig(configPath);
    assert.equal(config.api_key, 'static-key');
    assert.equal(config.api_key_command, 'echo dynamic-key');
  });

  it('throws when config file does not exist', () => {
    assert.throws(
      () => loadConfig('/nonexistent/path/config.json'),
      (err: Error) => {
        assert.match(err.message, /Config file not found/);
        assert.match(err.message, /mkdir -p/);
        return true;
      },
    );
  });

  it('throws on malformed JSON', () => {
    const dir = createTempDir();
    tempDirs.push(dir);
    const configPath = writeConfig(dir, '{ invalid json }');

    assert.throws(
      () => loadConfig(configPath),
      (err: Error) => {
        assert.match(err.message, /Invalid JSON/);
        return true;
      },
    );
  });

  it('throws when neither api_key nor api_key_command is provided', () => {
    const dir = createTempDir();
    tempDirs.push(dir);
    const configPath = writeConfig(dir, '{}');

    assert.throws(
      () => loadConfig(configPath),
      (err: Error) => {
        assert.match(err.message, /api_key/);
        assert.match(err.message, /api_key_command/);
        return true;
      },
    );
  });

  it('throws when config has empty strings for both keys', () => {
    const dir = createTempDir();
    tempDirs.push(dir);
    const configPath = writeConfig(
      dir,
      '{"api_key": "", "api_key_command": ""}',
    );

    assert.throws(
      () => loadConfig(configPath),
      (err: Error) => {
        assert.match(err.message, /api_key/);
        return true;
      },
    );
  });
});

describe('resolveApiKey', () => {
  it('resolves api_key directly', () => {
    const key = resolveApiKey({ api_key: 'my-direct-key' });
    assert.equal(key, 'my-direct-key');
  });

  it('resolves api_key_command by executing the command', () => {
    const key = resolveApiKey({ api_key_command: 'echo command-key' });
    assert.equal(key, 'command-key');
  });

  it('trims whitespace from api_key_command output', () => {
    const key = resolveApiKey({
      api_key_command: 'echo "  padded-key  "',
    });
    assert.equal(key, 'padded-key');
  });

  it('api_key_command takes precedence over api_key', () => {
    const key = resolveApiKey({
      api_key: 'static-key',
      api_key_command: 'echo dynamic-key',
    });
    assert.equal(key, 'dynamic-key');
  });

  it('throws when api_key_command fails', () => {
    assert.throws(
      () => resolveApiKey({ api_key_command: 'false' }),
      (err: Error) => {
        assert.match(err.message, /Failed to execute api_key_command/);
        return true;
      },
    );
  });

  it('throws when no key is available', () => {
    assert.throws(
      () => resolveApiKey({}),
      (err: Error) => {
        assert.match(err.message, /No API key available/);
        return true;
      },
    );
  });
});
