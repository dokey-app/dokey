function PhoneFrame({ theme, label, children }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10, alignItems:"center" }}>
      <div data-theme={theme === "dark" ? "dark" : undefined}
        style={{ width:390, height:700, borderRadius:34, overflow:"hidden", position:"relative",
          background:"var(--surface-page)", color:"var(--text-body)",
          border:"1px solid var(--border-default)", boxShadow:"var(--shadow-lg)", display:"flex", flexDirection:"column" }}>
        <div style={{ height:34, flex:"0 0 34px", display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"0 20px", font:"var(--type-code-sm)", color:"var(--text-muted)", background:"var(--surface-card)" }}>
          <span>9:41</span><span style={{ display:"flex", gap:6 }}><span>LTE</span><span>100%</span></span>
        </div>
        {children}
      </div>
      <span style={{ font:"var(--type-caption)", color:"var(--text-muted)" }}>{label}</span>
    </div>
  );
}
Object.assign(window, { PhoneFrame });
