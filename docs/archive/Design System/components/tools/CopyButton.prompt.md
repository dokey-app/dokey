Intentional addition — copy is the terminal action of nearly every ToolBox tool, so it is a component, not an ad-hoc button.

\`\`\`jsx
<CopyButton value={decoded} />
\`\`\`

Label swaps to "Скопировано" with a check icon for 1.6s, then reverts. Do not also fire a toast for the same copy.
