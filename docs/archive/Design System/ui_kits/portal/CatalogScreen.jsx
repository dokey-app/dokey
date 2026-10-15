const { Icon, Tag, ToolCard, Button, EmptyState } = window.ToolBoxDesignSystem_88556c;

function CatalogScreen({ onOpen }) {
  const [cat, setCat] = React.useState("Все");
  const list = cat === "Все" ? TOOLS : TOOLS.filter((t) => t.category === cat);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"var(--space-6)" }}>
      <div>
        <h1 style={{ margin:0, font:"var(--type-h1)", fontSize:"var(--text-4xl)", letterSpacing:"var(--tracking-tight)", color:"var(--text-strong)" }}>Инструменты разработчика</h1>
        <p style={{ margin:"8px 0 0", font:"var(--type-body)", color:"var(--text-muted)", maxWidth:620 }}>
          {TOOLS.length} утилит в одном месте. Всё считается в браузере — данные никуда не отправляются.
        </p>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
        {CATEGORIES.map((c) => <Tag key={c} interactive selected={c === cat} onClick={()=>setCat(c)}>{c}</Tag>)}
        <span style={{ marginLeft:"auto", font:"var(--type-caption)", color:"var(--text-subtle)" }}>{list.length} из {TOOLS.length}</span>
      </div>
      {list.length === 0 ? (
        <EmptyState icon={<Icon name="search-x" size={22} />} title="Ничего не найдено" description="Попробуйте другую категорию." action={<Button variant="secondary" size="sm" onClick={()=>setCat("Все")}>Сбросить фильтр</Button>} />
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(238px, 1fr))", gap:"var(--space-4)" }}>
          {list.map((t) => (
            <ToolCard key={t.id} icon={<Icon name={t.icon} size={22} />} title={t.title} description={t.description}
              category={t.category} shortcut={t.shortcut} isNew={t.isNew} onClick={()=>onOpen(t.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
Object.assign(window, { CatalogScreen });
