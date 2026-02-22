# @daliusd/deepl-cli

CLI tool for translating text using the [DeepL API](https://www.deepl.com/docs-api). Pipe-friendly, configurable, supports context and formality options.

## Installation

```bash
npm install -g @daliusd/deepl-cli
```

Requires Node.js >= 18.

## Configuration

Create a config file at `~/.config/deepl-cli/config.json`:

```bash
mkdir -p ~/.config/deepl-cli
```

### Using a static API key

```json
{
  "api_key": "your-deepl-api-key"
}
```

### Using a command to retrieve the API key

This is useful with password managers like [pass](https://www.passwordstore.org/), 1Password CLI, etc.

```json
{
  "api_key_command": "pass show deepl-api-key"
}
```

If both `api_key` and `api_key_command` are present, `api_key_command` takes precedence.

You can get a DeepL API key by creating a [DeepL API account](https://www.deepl.com/pro#developer) (free tier: 500,000 characters/month).

## Usage

```
deepl-cli [options] [text]
```

### Options

| Option | Short | Description |
|--------|-------|-------------|
| `--target <lang>` | `-t` | Target language code (required, e.g. `de`, `en-US`, `fr`) |
| `--source <lang>` | `-s` | Source language code (default: auto-detect) |
| `--context <text>` | `-c` | Additional context to influence translation (not translated, not billed) |
| `--formality <level>` | `-f` | Formality: `less`, `more`, `default`, `prefer_less`, `prefer_more` |
| `--verbose` | `-v` | Show metadata (detected source language, billed characters) |
| `--help` | `-h` | Show help |
| `--version` | | Show version |

### Examples

Translate text to German:

```bash
deepl-cli -t de "Hello, world!"
```

Translate with context (context influences translation but is not translated or billed):

```bash
deepl-cli -t de -c "This is a greeting in a formal business email" "Hello"
```

Pipe text via stdin:

```bash
echo "Hello, world!" | deepl-cli -t de
```

Use formal language:

```bash
deepl-cli -t de -f more "How are you?"
```

Show translation metadata:

```bash
deepl-cli -t de -v "Hello, world!"
# stdout: Hallo, Welt!
# stderr: Detected source language: en
# stderr: Billed characters: 13
```

Specify source language explicitly:

```bash
deepl-cli -t de -s en "Hello"
```

### Piping

The translated text is printed to stdout with no extra formatting, making it easy to use in pipelines:

```bash
echo "Hello" | deepl-cli -t de | pbcopy
```

When `--verbose` is used, metadata is written to stderr so stdout remains clean for piping.

## Language codes

Language codes are case-insensitive and follow ISO 639-1, with some target languages including regional variants:

- Source: `en`, `de`, `fr`, `ja`, `es`, etc. (or omit for auto-detection)
- Target: `en-US`, `en-GB`, `pt-BR`, `pt-PT`, `de`, `fr`, etc.

See the [DeepL API documentation](https://www.deepl.com/docs-api/translating-text/) for the full list of supported languages.

## Development

```bash
git clone https://github.com/daliusd/deepl-cli.git
cd deepl-cli
npm install
npm run build
npm test
```

### Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript to `dist/` |
| `npm test` | Run unit tests (`node:test`) |

### Publishing

```bash
npm run build
npm publish --access public
```

## License

[MIT](LICENSE)
