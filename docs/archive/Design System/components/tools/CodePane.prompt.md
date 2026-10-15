Intentional addition — output rendering is the core job of the portal, so the code surface is a primitive.

\`\`\`jsx
<CodePane code={JSON.stringify(payload, null, 2)} lineNumbers height="240px" />
\`\`\`

Dark tone even in light mode: code panes stay `--surface-code` so results read as machine output. Colours come from the `--code-*` tokens.
