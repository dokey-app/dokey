const { Icon, Card, Badge, Button, Tabs, Textarea, Checkbox, Breadcrumbs, CodePane, CopyButton, Switch } = window.ToolBoxDesignSystem_88556c;

function Base64Screen() {
  const [mode, setMode] = React.useState("encode");
  const [text, setText] = React.useState("Дизайн-система ToolBox");
  const encoded = (() => { try { return btoa(unescape(encodeURIComponent(text))); } catch (e) { return ""; } })();
  const decoded = (() => { try { return decodeURIComponent(escape(atob(text))); } catch (e) { return "Некорректная base64-строка"; } })();
  const out = mode === "encode" ? encoded : decoded;
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"var(--space-5)" }}>
      <Breadcrumbs items={[{ label:"Инструменты", href:"#" }, { label:"Кодирование", href:"#" }, "Base64"]} />
      <div style={{ display:"flex", alignItems:"flex-start", gap:16 }}>
        <div style={{ flex:1 }}>
          <h1 style={{ margin:0, font:"var(--type-h1)", letterSpacing:"var(--tracking-tight)", color:"var(--text-strong)" }}>Base64</h1>
          <p style={{ margin:"6px 0 0", font:"var(--type-body)", color:"var(--text-muted)" }}>Кодирование и декодирование текста и файлов, UTF-8 и URL-safe алфавит.</p>
        </div>
        <Tabs variant="segmented" items={[{ value:"encode", label:"Кодировать" }, { value:"decode", label:"Декодировать" }]} value={mode} onChange={setMode} />
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"var(--space-4)", alignItems:"start" }}>
        <Card padding="var(--space-4)" header={<><span>Ввод</span><Badge mono>{text.length} симв.</Badge></>}>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <Textarea rows={9} value={text} onChange={(e)=>setText(e.target.value)} />
            <div style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
              <Checkbox label="URL-safe алфавит" description="Заменяет + / на - _" />
              <Switch label="Живой предпросмотр" defaultChecked />
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <Button variant="secondary" size="sm" iconLeft={<Icon name="upload" size={14} />}>Загрузить файл</Button>
              <Button variant="ghost" size="sm" iconLeft={<Icon name="eraser" size={14} />} onClick={()=>setText("")}>Очистить</Button>
            </div>
          </div>
        </Card>
        <Card padding="var(--space-4)" header={<><span>Результат</span><div style={{ display:"flex", gap:8, alignItems:"center" }}><Badge mono>{out.length} симв.</Badge><CopyButton value={out} /></div></>}>
          <CodePane language="text" code={out} height="248px" />
        </Card>
      </div>
    </div>
  );
}
Object.assign(window, { Base64Screen });
