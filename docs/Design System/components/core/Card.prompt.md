Base surface. Every panel in a tool workbench is a Card with a `header`.

\`\`\`jsx
<Card header={<><span>Payload</span><Badge mono>JSON</Badge></>} padding="0">…</Card>
\`\`\`

Radius `--radius-xl` (14px), 1px subtle border, shadow-xs at rest. Pass `padding="0"` when the body is a code pane or a list that manages its own insets.
