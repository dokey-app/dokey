const { Icon, Card, Badge, Button, Tag, Tabs, Textarea, CodePane, CopyButton, IconButton, Input } = window.ToolBoxDesignSystem_88556c;

const M_TOOLS = [
  { id:"jwt", icon:"key-round", title:"JWT decoder", category:"Безопасность" },
  { id:"base64", icon:"binary", title:"Base64", category:"Кодирование" },
  { id:"qr", icon:"qr-code", title:"QR-генератор", category:"Генераторы" },
  { id:"diff", icon:"file-diff", title:"Сравнение текстов", category:"Текст" },
  { id:"json", icon:"braces", title:"JSON formatter", category:"Кодирование" },
  { id:"hash", icon:"hash", title:"Хэши", category:"Безопасность" }
];

function TopBar({ title, onBack, action }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, height:52, flex:"0 0 52px", padding:"0 12px",
      borderBottom:"1px solid var(--border-subtle)", background:"var(--surface-card)" }}>
      {onBack
        ? <IconButton label="Назад" onClick={onBack}><Icon name="chevron-left" size={18} /></IconButton>
        : <span style={{ width:26, height:26, borderRadius:"var(--radius-md)", background:"var(--accent-500)", color:"#fff", font:"var(--type-ui)", fontWeight:800, fontSize:14, display:"inline-flex", alignItems:"center", justifyContent:"center" }}>T</span>}
      <span style={{ font:"var(--type-ui)", fontSize:"var(--text-md)", fontWeight:700, letterSpacing:"var(--tracking-snug)", color:"var(--text-strong)" }}>{title}</span>
      <span style={{ marginLeft:"auto", display:"flex", gap:4 }}>{action}</span>
    </div>
  );
}

function TabBar({ current, onChange }) {
  const items = [["home","Инструменты","layout-grid"],["fav","Избранное","star"],["history","История","history"],["more","Ещё","menu"]];
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", flex:"0 0 62px", paddingBottom:6,
      borderTop:"1px solid var(--border-subtle)", background:"var(--surface-card)" }}>
      {items.map(([id,label,icon]) => (
        <button key={id} onClick={()=>onChange(id)} style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:3,
          minHeight:56, background:"none", border:"none", cursor:"pointer",
          color: current === id ? "var(--text-accent)" : "var(--text-muted)" }}>
          <Icon name={icon} size={20} />
          <span style={{ font:"var(--type-caption)", fontSize:11 }}>{label}</span>
        </button>
      ))}
    </div>
  );
}

function MobileList({ onOpen }) {
  const [tab, setTab] = React.useState("home");
  return (
    <React.Fragment>
      <TopBar title="ToolBox" action={<IconButton label="Профиль"><Icon name="user-round" size={18} /></IconButton>} />
      <div style={{ flex:1, overflow:"auto", padding:"14px 14px 20px", display:"flex", flexDirection:"column", gap:14 }}>
        <Input size="md" placeholder="Поиск инструмента" prefix={<Icon name="search" size={15} />} />
        <div style={{ display:"flex", gap:6, overflow:"auto", paddingBottom:2 }}>
          {["Все","Безопасность","Кодирование","Текст","Генераторы"].map((c,i) => <Tag key={c} interactive selected={i===0}>{c}</Tag>)}
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {M_TOOLS.map((t) => (
            <Card key={t.id} interactive padding="12px 14px" onClick={()=>onOpen(t.id)}>
              <div style={{ display:"flex", alignItems:"center", gap:12, minHeight:44 }}>
                <span style={{ width:36, height:36, flex:"0 0 36px", borderRadius:"var(--radius-md)", background:"var(--surface-accent-soft)", color:"var(--text-accent)", display:"inline-flex", alignItems:"center", justifyContent:"center" }}>
                  <Icon name={t.icon} size={19} />
                </span>
                <span style={{ flex:1 }}>
                  <span style={{ display:"block", font:"var(--type-ui)", fontSize:"var(--text-base)", fontWeight:600, color:"var(--text-strong)" }}>{t.title}</span>
                  <span style={{ display:"block", marginTop:2, font:"var(--type-caption)", color:"var(--text-subtle)" }}>{t.category}</span>
                </span>
                <Icon name="chevron-right" size={16} />
              </div>
            </Card>
          ))}
        </div>
        <Card padding="14px" style={{ background:"var(--surface-sunken)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <Icon name="download" size={20} />
            <span style={{ flex:1 }}>
              <span style={{ display:"block", font:"var(--type-ui)", color:"var(--text-strong)" }}>Установить ToolBox</span>
              <span style={{ display:"block", marginTop:2, font:"var(--type-caption)", color:"var(--text-muted)" }}>Работает офлайн, открывается с домашнего экрана</span>
            </span>
            <Button size="sm">Установить</Button>
          </div>
        </Card>
      </div>
      <TabBar current={tab} onChange={setTab} />
    </React.Fragment>
  );
}

function MobileTool({ onBack }) {
  const [tab, setTab] = React.useState("payload");
  const HEADER = '{\n  "alg": "HS256",\n  "typ": "JWT"\n}';
  const PAYLOAD = '{\n  "sub": "1234567890",\n  "name": "Ada Lovelace",\n  "admin": true,\n  "exp": 1767225600\n}';
  return (
    <React.Fragment>
      <TopBar title="JWT decoder" onBack={onBack} action={<IconButton label="Поделиться"><Icon name="share-2" size={18} /></IconButton>} />
      <div style={{ flex:1, overflow:"auto", padding:"14px 14px 20px", display:"flex", flexDirection:"column", gap:12 }}>
        <Textarea rows={4} label="Токен" defaultValue="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dBjftJeZ4CVP" />
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Badge tone="success" dot>Подпись верна</Badge><Badge mono>HS256</Badge>
          <span style={{ marginLeft:"auto" }}><CopyButton value={PAYLOAD} label="Копировать" /></span>
        </div>
        <Tabs variant="segmented" items={[{ value:"payload", label:"Payload" }, { value:"header", label:"Header" }]} value={tab} onChange={setTab} style={{ width:"100%" }} />
        <CodePane code={tab === "payload" ? PAYLOAD : HEADER} />
        <Button fullWidth iconLeft={<Icon name="shield-check" size={15} />}>Проверить подпись</Button>
      </div>
    </React.Fragment>
  );
}

function MobileApp() {
  const [screen, setScreen] = React.useState("list");
  return (
    <div style={{ display:"flex", gap:28, justifyContent:"center", flexWrap:"wrap" }}>
      <PhoneFrame theme="light" label="Каталог — светлая тема">
        {screen === "list" ? <MobileList onOpen={()=>setScreen("tool")} /> : <MobileTool onBack={()=>setScreen("list")} />}
      </PhoneFrame>
      <PhoneFrame theme="dark" label="Инструмент — тёмная тема">
        <MobileTool onBack={()=>{}} />
      </PhoneFrame>
    </div>
  );
}
ReactDOM.createRoot(document.getElementById("root")).render(<MobileApp />);
