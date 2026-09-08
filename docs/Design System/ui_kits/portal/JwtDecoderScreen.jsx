const { Icon, Card, Badge, Button, Tabs, Textarea, Input, Select, Breadcrumbs, CodePane, CopyButton, Toast, Switch } = window.ToolBoxDesignSystem_88556c;

const SAMPLE_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkYSBMb3ZlbGFjZSIsImFkbWluIjp0cnVlLCJpYXQiOjE3MzU2ODk2MDAsImV4cCI6MTc2NzIyNTYwMH0.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
const HEADER_JSON = '{\n  "alg": "HS256",\n  "typ": "JWT"\n}';
const PAYLOAD_JSON = '{\n  "sub": "1234567890",\n  "name": "Ada Lovelace",\n  "admin": true,\n  "iat": 1735689600,\n  "exp": 1767225600\n}';

function SegmentedToken({ value }) {
  const [h, p, s] = value.split(".");
  const seg = (t, color) => <span style={{ color, wordBreak:"break-all" }}>{t}</span>;
  return (
    <div style={{ font:"var(--type-code)", background:"var(--surface-code)", borderRadius:"var(--radius-md)", padding:"12px 14px", lineHeight:1.6 }}>
      {seg(h, "var(--code-key)")}<span style={{ color:"var(--code-punct)" }}>.</span>
      {seg(p, "var(--code-string)")}<span style={{ color:"var(--code-punct)" }}>.</span>
      {seg(s, "var(--code-number)")}
    </div>
  );
}

function ClaimRow({ k, v, note }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"120px 1fr", gap:12, padding:"8px 0", borderBottom:"1px solid var(--border-subtle)" }}>
      <span style={{ font:"var(--type-code-sm)", color:"var(--text-muted)" }}>{k}</span>
      <span style={{ font:"var(--type-ui)", color:"var(--text-strong)" }}>{v}{note && <span style={{ marginLeft:8, font:"var(--type-caption)", color:"var(--text-subtle)" }}>{note}</span>}</span>
    </div>
  );
}

function JwtDecoderScreen({ onBack }) {
  const [token, setToken] = React.useState(SAMPLE_JWT);
  const [tab, setTab] = React.useState("payload");
  const [toast, setToast] = React.useState(false);
  const valid = token.split(".").length === 3;
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"var(--space-5)" }}>
      <Breadcrumbs items={[{ label:"Инструменты", href:"#" }, { label:"Безопасность", href:"#" }, "JWT decoder"]} />
      <div style={{ display:"flex", alignItems:"flex-start", gap:16, flexWrap:"wrap" }}>
        <div style={{ flex:1, minWidth:280 }}>
          <h1 style={{ margin:0, font:"var(--type-h1)", letterSpacing:"var(--tracking-tight)", color:"var(--text-strong)" }}>JWT decoder</h1>
          <p style={{ margin:"6px 0 0", font:"var(--type-body)", color:"var(--text-muted)" }}>Разбор заголовка и payload, проверка HMAC-подписи. Токен не покидает вкладку.</p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Button variant="ghost" size="sm" iconLeft={<Icon name="rotate-ccw" size={14} />} onClick={()=>setToken(SAMPLE_JWT)}>Пример</Button>
          <Button variant="secondary" size="sm" iconLeft={<Icon name="share-2" size={14} />}>Поделиться</Button>
          <Button size="sm" iconLeft={<Icon name="star" size={14} />}>В избранное</Button>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"var(--space-4)", alignItems:"start" }}>
        <Card padding="var(--space-4)" header={<><span>Токен</span><Badge mono>{token.length} симв.</Badge></>}>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <Textarea rows={6} value={token} onChange={(e)=>setToken(e.target.value)} resize="vertical" />
            <SegmentedToken value={token} />
            <div style={{ display:"flex", alignItems:"center", gap:14, font:"var(--type-caption)", color:"var(--text-muted)" }}>
              <span style={{ display:"inline-flex", alignItems:"center", gap:6 }}><span style={{ width:8, height:8, borderRadius:2, background:"var(--code-key)" }} />header</span>
              <span style={{ display:"inline-flex", alignItems:"center", gap:6 }}><span style={{ width:8, height:8, borderRadius:2, background:"var(--code-string)" }} />payload</span>
              <span style={{ display:"inline-flex", alignItems:"center", gap:6 }}><span style={{ width:8, height:8, borderRadius:2, background:"var(--code-number)" }} />signature</span>
            </div>
          </div>
        </Card>

        <div style={{ display:"flex", flexDirection:"column", gap:"var(--space-4)" }}>
          <Card padding="var(--space-4)" header={<><span>Результат</span>{valid ? <Badge tone="success" dot>Подпись верна</Badge> : <Badge tone="danger" dot>Некорректный токен</Badge>}</>}>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
                <Tabs variant="segmented" items={[{ value:"payload", label:"Payload" }, { value:"header", label:"Header" }, { value:"claims", label:"Claims" }]} value={tab} onChange={setTab} />
                <CopyButton value={tab === "header" ? HEADER_JSON : PAYLOAD_JSON} />
              </div>
              {tab === "claims" ? (
                <div>
                  <ClaimRow k="sub" v="1234567890" />
                  <ClaimRow k="name" v="Ada Lovelace" />
                  <ClaimRow k="admin" v="true" />
                  <ClaimRow k="iat" v="1 января 2025, 03:00" note="1735689600" />
                  <ClaimRow k="exp" v="1 января 2026, 03:00" note="через 4 месяца" />
                </div>
              ) : (
                <CodePane code={tab === "header" ? HEADER_JSON : PAYLOAD_JSON} lineNumbers />
              )}
            </div>
          </Card>

          <Card padding="var(--space-4)" header={<><span>Проверка подписи</span><Badge mono>HS256</Badge></>}>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div style={{ display:"grid", gridTemplateColumns:"140px 1fr", gap:12, alignItems:"end" }}>
                <Select label="Алгоритм" options={["HS256","HS384","HS512","RS256"]} />
                <Input label="Secret" mono defaultValue="your-256-bit-secret" suffix={<Icon name="eye" size={14} />} />
              </div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
                <Switch label="Secret в base64" />
                <Button size="sm" variant="secondary" iconLeft={<Icon name="shield-check" size={14} />} onClick={()=>setToast(true)}>Проверить</Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {toast && (
        <div style={{ position:"fixed", right:24, bottom:24, zIndex:40 }}>
          <Toast tone="success" icon={<Icon name="shield-check" size={16} />} title="Подпись верна" description="HMAC SHA-256 совпал с секретом" onClose={()=>setToast(false)} />
        </div>
      )}
    </div>
  );
}
Object.assign(window, { JwtDecoderScreen });
