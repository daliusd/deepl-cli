import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { homedir } from 'node:os';

export interface Config {
  api_key?: string;
  api_key_command?: string;
}

const DEFAULT_CONFIG_DIR = join(homedir(), '.config', 'deepl-cli');
const DEFAULT_CONFIG_PATH = join(DEFAULT_CONFIG_DIR, 'config.json');

export function loadConfig(configPath: string = DEFAULT_CONFIG_PATH): Config {
  if (!existsSync(configPath)) {
    throw new Error(
      `Config file not found: ${configPath}\n` +
        `Create it with:\n` +
        `  mkdir -p ~/.config/deepl-cli\n` +
        `  echo '{"api_key": "your-deepl-api-key"}' > ~/.config/deepl-cli/config.json\n` +
        `\n` +
        `Or use api_key_command to retrieve the key from a password manager:\n` +
        `  echo '{"api_key_command": "pass show deepl-api-key"}' > ~/.config/deepl-cli/config.json`,
    );
  }

  let raw: string;
  try {
    raw = readFileSync(configPath, 'utf-8');
  } catch (err) {
    throw new Error(`Failed to read config file: ${configPath}: ${err}`);
  }

  let config: Config;
  try {
    config = JSON.parse(raw);
  } catch {
    throw new Error(`Invalid JSON in config file: ${configPath}`);
  }

  if (!config.api_key && !config.api_key_command) {
    throw new Error(
      `Config must contain "api_key" or "api_key_command".\n` +
        `  api_key: your DeepL API key as a string\n` +
        `  api_key_command: a shell command that outputs your API key (e.g. "pass show deepl-api-key")`,
    );
  }

  return config;
}

export function resolveApiKey(config: Config): string {
  if (config.api_key_command) {
    try {
      return execSync(config.api_key_command, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      }).trim();
    } catch (err) {
      throw new Error(
        `Failed to execute api_key_command: ${config.api_key_command}\n${err}`,
      );
    }
  }

  if (config.api_key) {
    return config.api_key;
  }

  throw new Error(
    'No API key available. Set "api_key" or "api_key_command" in config.',
  );
}
