import { parseArgs } from 'node:util';
import type { Formality } from 'deepl-node';

const VALID_FORMALITY_VALUES = [
  'less',
  'more',
  'default',
  'prefer_less',
  'prefer_more',
] as const;

export const HELP_TEXT = `Usage: deepl-cli [options] [text]

Translate text using the DeepL API.

Arguments:
  text                      Text to translate (or pipe via stdin)

Options:
  -t, --target <lang>       Target language code (required, e.g. "de", "en-US")
  -s, --source <lang>       Source language code (default: auto-detect)
  -c, --context <text>      Additional context for translation (not translated, not billed)
  -f, --formality <level>   Formality: less, more, default, prefer_less, prefer_more
  -v, --verbose             Show metadata (detected source lang, billed characters)
  -h, --help                Show this help
  --version                 Show version

Examples:
  deepl-cli -t de "Hello, world!"
  deepl-cli -t de -c "Email greeting" "Hello"
  echo "Hello" | deepl-cli -t de
  deepl-cli -t de -f more "How are you?"`;

export interface ParsedArgs {
  target: string;
  source: string | null;
  context: string | undefined;
  formality: Formality | undefined;
  verbose: boolean;
  help: boolean;
  version: boolean;
  text: string | undefined;
}

export function parseCliArgs(args: string[]): ParsedArgs {
  // Show help when called with no arguments
  if (args.length === 0) {
    return {
      target: '',
      source: null,
      context: undefined,
      formality: undefined,
      verbose: false,
      help: true,
      version: false,
      text: undefined,
    };
  }

  const { values, positionals } = parseArgs({
    args,
    options: {
      target: { type: 'string', short: 't' },
      source: { type: 'string', short: 's' },
      context: { type: 'string', short: 'c' },
      formality: { type: 'string', short: 'f' },
      verbose: { type: 'boolean', short: 'v', default: false },
      help: { type: 'boolean', short: 'h', default: false },
      version: { type: 'boolean', default: false },
    },
    allowPositionals: true,
  });

  if (values.help) {
    return {
      target: '',
      source: null,
      context: undefined,
      formality: undefined,
      verbose: false,
      help: true,
      version: false,
      text: undefined,
    };
  }

  if (values.version) {
    return {
      target: '',
      source: null,
      context: undefined,
      formality: undefined,
      verbose: false,
      help: false,
      version: true,
      text: undefined,
    };
  }

  if (!values.target) {
    throw new Error(
      'Missing required option: --target (-t)\nUse --help for usage information.',
    );
  }

  if (
    values.formality &&
    !VALID_FORMALITY_VALUES.includes(
      values.formality as (typeof VALID_FORMALITY_VALUES)[number],
    )
  ) {
    throw new Error(
      `Invalid formality value: "${values.formality}"\nValid values: ${VALID_FORMALITY_VALUES.join(', ')}`,
    );
  }

  return {
    target: values.target,
    source: (values.source as string) || null,
    context: values.context as string | undefined,
    formality: values.formality as Formality | undefined,
    verbose: values.verbose ?? false,
    help: false,
    version: false,
    text: positionals.length > 0 ? positionals.join(' ') : undefined,
  };
}
