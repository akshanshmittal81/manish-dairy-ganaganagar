import Icon from "./Icon";

export default function Navbar({ view, setView, onLogout }) {
  const nav = [
    { id: "billing",   label: "Billing",    icon: "cart" },
    { id: "products",  label: "Products",   icon: "products" },
    { id: "sales",     label: "Sales",      icon: "profit" },
    { id: "analytics", label: "Analytics",  icon: "analytics" },
    { id: "customers", label: "Customers",  icon: "customers" },
  ];

  return (
    <div style={{ background: "#1a1310", position: "sticky", top: 0, zIndex: 99, display: "flex", alignItems: "center", padding: "0 24px", gap: 8, boxShadow: "0 2px 12px rgba(0,0,0,0.18)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 16, padding: "14px 0" }}>
        <span style={{ fontSize: 22 }}>🥛</span>
        <div>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#f59e0b", letterSpacing: 1, lineHeight: 1 }}>MANISH</div>
          <div style={{ fontSize: 9, color: "#8a7e6e", letterSpacing: 2, fontWeight: 700, lineHeight: 1 }}>DAIRY · GANGANAGAR</div>
        </div>
      </div>
      <div style={{ width: 1, height: 32, background: "#2d2420", marginRight: 8 }} />
      <nav style={{ display: "flex", gap: 4, flex: 1 }}>
        {nav.map((n) => (
          <button
            key={n.id}
            onClick={() => setView(n.id)}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: view === n.id ? 800 : 500, transition: "all 0.15s", background: view === n.id ? "#f59e0b" : "transparent", color: view === n.id ? "#1a1310" : "#c9b9a8" }}
          >
            <Icon name={n.icon} size={15} />
            {n.label}
          </button>
        ))}
      </nav>
      <div style={{ fontSize: 12, color: "#8a7e6e", flexShrink: 0 }}>
        {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
      </div>
      <button
        onClick={onLogout}
        style={{ marginLeft: 12, padding: "8px 16px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer" }}
      >
        Logout
      </button>
    </div>
  );
}