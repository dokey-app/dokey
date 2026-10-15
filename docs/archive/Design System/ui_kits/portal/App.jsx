function App() {
  const [theme, setTheme] = React.useState("light");
  const [screen, setScreen] = React.useState("catalog");
  const recent = TOOLS.filter((t) => ["jwt","base64","qr","diff"].includes(t.id));
  return (
    <AppShell theme={theme} onTheme={()=>setTheme(theme === "dark" ? "light" : "dark")}
      current={screen} onNavigate={setScreen} recent={recent}>
      {screen === "jwt" ? <JwtDecoderScreen /> : screen === "base64" ? <Base64Screen /> : <CatalogScreen onOpen={(id)=>setScreen(["jwt","base64"].includes(id) ? id : "jwt")} />}
    </AppShell>
  );
}
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
