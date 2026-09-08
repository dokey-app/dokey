Text field. Use `mono` whenever the value is machine data (a token, key, URL, hex colour).

\`\`\`jsx
<Input label="Secret" mono placeholder="your-256-bit-secret" hint="HMAC ключ хранится только в браузере" />
\`\`\`

Focus = accent border + `--ring-focus`. Passing `error` replaces the hint and turns the ring red.
