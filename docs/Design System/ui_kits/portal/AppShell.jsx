const { Icon, IconButton, Input, Kbd, Tooltip, Badge } = window.ToolBoxDesignSystem_88556c;

function Wordmark({ dark }) {
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:8 }}>
      <span style={{ width:26, height:26, borderRadius:"var(--radius-md)", background:"var(--accent-500)", color:"#fff", font:"var(--type-ui)", fontWeight:800, fontSize:14, display:"inline-flex", alignItems:"center", justifyContent:"center" }}>T</span>
      <span style={{ fontFamily:"var(--font-sans)", fontWeight:800, fontSize:17, letterSpacing:"-0.03em", color:"var(--text-strong)" }}>Tool<span style={{ color:"var(--accent-500)" }}>Box</span></span>
    </span>
  );
}

function SidebarItem({ icon, label, active, badge, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button onClick={onClick} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{ display:"flex", alignItems:"center", gap:10, width:"100%", height:32, padding:"0 10px",
        border:"none", borderRadius:"var(--radius-md)", cursor:"pointer", textAlign:"left",
        font:"var(--type-ui)", transition:"var(--transition-control)",
        background: active ? "var(--surface-accent-soft)" : hover ? "var(--surface-hover)" : "transparent",
        color: active ? "var(--text-accent)" : "var(--text-body)" }}>
      <Icon name={icon} size={16} />
      <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{label}</span>
      {badge && <span style={{ font:"var(--type-code-sm)", color:"var(--text-subtle)" }}>{badge}</span>}
    </button>
  );
}

function AppShell({ theme, onTheme, current, onNavigate, recent = [], children }) {
  return (
    <div data-theme={theme === "dark" ? "dark" : undefined} style={{ minHeight:"100vh", background:"var(--surface-page)", color:"var(--text-body)" }}>
      <header style={{ position:"sticky", top:0, zIndex:20, height:"var(--topbar-height)", display:"flex", alignItems:"center", gap:16,
        padding:"0 var(--page-gutter)", background:"color-mix(in srgb, var(--surface-card) 88%, transparent)",
        backdropFilter:"saturate(180%) blur(8px)", borderBottom:"1px solid var(--border-subtle)" }}>
        <a href="#" onClick={(e)=>{e.preventDefault();onNavigate("catalog");}}><Wordmark /></a>
        <div style={{ flex:1, maxWidth:440 }}>
          <Input size="sm" placeholder="Поиск инструмента" prefix={<Icon name="search" size={14} />} suffix={<span style={{ display:"flex", gap:3 }}><Kbd>⌘</Kbd><Kbd>K</Kbd></span>} />
        </div>
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:6 }}>
          <Tooltip content="Всё работает офлайн"><Badge tone="success" dot>Офлайн-режим</Badge></Tooltip>
          <Tooltip content={theme === "dark" ? "Светлая тема" : "Тёмная тема"}>
            <IconButton label="Тема" onClick={onTheme}><Icon name={theme === "dark" ? "sun" : "moon"} /></IconButton>
          </Tooltip>
          <Tooltip content="GitHub"><IconButton label="GitHub"><Icon name="github" /></IconButton></Tooltip>
          <span style={{ width:28, height:28, borderRadius:"999px", background:"var(--surface-sunken)", border:"1px solid var(--border-subtle)", display:"inline-flex", alignItems:"center", justifyContent:"center", font:"var(--type-label)", color:"var(--text-muted)" }}>АЛ</span>
        </div>
      </header>
      <div style={{ display:"grid", gridTemplateColumns:"var(--sidebar-width) 1fr", alignItems:"start" }}>
        <aside style={{ position:"sticky", top:"var(--topbar-height)", height:"calc(100vh - var(--topbar-height))", overflow:"auto",
          padding:"var(--space-4) var(--space-3)", borderRight:"1px solid var(--border-subtle)", display:"flex", flexDirection:"column", gap:18 }}>
          <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
            <SidebarItem icon="layout-grid" label="Все инструменты" active={current === "catalog"} onClick={()=>onNavigate("catalog")} badge={TOOLS.length} />
            <SidebarItem icon="star" label="Избранное" badge="3" />
            <SidebarItem icon="history" label="История" />
          </div>
          <div>
            <div style={{ padding:"0 10px 6px", font:"var(--type-label)", color:"var(--text-subtle)", letterSpacing:"var(--tracking-caps)", textTransform:"uppercase" }}>Недавние</div>
            <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
              {recent.map((t) => <SidebarItem key={t.id} icon={t.icon} label={t.title} active={current === t.id} onClick={()=>onNavigate(t.id)} />)}
            </div>
          </div>
          <div style={{ marginTop:"auto", padding:"10px", borderRadius:"var(--radius-lg)", background:"var(--surface-sunken)", border:"1px solid var(--border-subtle)" }}>
            <div style={{ font:"var(--type-ui)", color:"var(--text-strong)" }}>Установить приложение</div>
            <div style={{ marginTop:4, font:"var(--type-caption)", color:"var(--text-muted)" }}>PWA работает офлайн и открывается из дока.</div>
          </div>
        </aside>
        <main style={{ padding:"var(--space-8) var(--page-gutter) var(--space-16)", minWidth:0 }}>
          <div style={{ maxWidth:"var(--page-max)", margin:"0 auto" }}>{children}</div>
        </main>
      </div>
    </div>
  );
}
Object.assign(window, { AppShell, Wordmark, SidebarItem });
