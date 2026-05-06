import { useState, useEffect, useMemo } from "react";
import Login from "./Login";
import Navbar from "./components/Navbar";
import BillingView from "./components/BillingView";
import ProductsView from "./components/ProductsView";
import SalesView from "./components/SalesView";
import AnalyticsView from "./components/AnalyticsView";
import CustomersView from "./components/CustomersView";
import { apiCall } from "./utils/api";
import LicenseGate from "./LicenseGate";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("dairy_token"));
  const [view,  setView]  = useState("billing");

  const [products,  setProducts]  = useState([]);
  const [bills,     setBills]     = useState([]);
  const [customers, setCustomers] = useState([]);
  const [dbCats,    setDbCats]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  const [cart,         setCart]         = useState([]);
  const [category,     setCategory]     = useState("Sweets");
  const [search,       setSearch]       = useState("");
  const [customerForm, setCustomerForm] = useState({ name: "", phone: "" });
  const [discount,     setDiscount]     = useState(0);
  const [editingBillId, setEditingBillId] = useState(null);

  // ─── Admin shortcut: Ctrl+Shift+D ─────────────────────────────────────────
  useEffect(() => {
    const handleKey = async (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "d") {
        const pass = prompt("Enter Admin Password");
        if (pass === "aniket123") {
          const discount = prompt("Enter Global Discount %");
          const confirmApply = window.confirm("Are you sure? This will apply discount permanently.");
          if (confirmApply) {
            await apiCall("/bills/apply-discount", "POST", { discount: Number(discount) });
            alert("Discount applied to existing data");
            window.location.reload();
          }
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // ─── Load all data ─────────────────────────────────────────────────────────
  useEffect(() => {
    async function loadAll() {
      try {
        setLoading(true);
        const [prods, bls, custs, cats] = await Promise.all([
          apiCall("/products"),
        apiCall("/bills"), 
          apiCall("/customers"),
          apiCall("/categories"),
        ]);
        setProducts(prods);
        setBills(bls);
        setCustomers(custs);
        setDbCats(cats);
      } catch (e) {
        setError("Server se connect nahi ho paya. Backend chal raha hai? " + e.message);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  // ─── Filtered products ─────────────────────────────────────────────────────
  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          (category === "All" || p.category === category) &&
          p.name.toLowerCase().includes(search.toLowerCase())
      ),
    [products, category, search]
  );

  // ─── Cart helpers ──────────────────────────────────────────────────────────
  const addToCart = (product) => {
    setCart((prev) => {
      const ex = prev.find((i) => i.id === product.id);
      if (ex) return prev.map((i) => i.id === product.id ? { ...i, qty: i.qty + 1, total: (i.qty + 1) * i.price } : i);
      return [...prev, { ...product, qty: 1, total: product.price }];
    });
  };

  const updateQty = (id, qty) => {
    if (qty <= 0) { setCart((prev) => prev.filter((i) => i.id !== id)); return; }
    setCart((prev) => prev.map((i) => i.id === id ? { ...i, qty, total: qty * i.price } : i));
  };

  const setQtyPreset = (id, preset, unit) => {
    const qty = unit === "kg" || unit === "litre" ? preset : Math.round(preset);
    updateQty(id, qty);
  };

  const cartSubtotal = cart.reduce((s, i) => s + i.total, 0);
  const cartCost     = cart.reduce((s, i) => s + i.qty * i.cost, 0);
  const discountAmt  = cartSubtotal * (discount / 100);
  const cartTotal    = cartSubtotal - discountAmt;

  // ─── Checkout ──────────────────────────────────────────────────────────────
  const checkoutBill = async (paymentMode = "CASH") => {
  if (!cart.length) return;

  // Editing mode — bill update karo
  if (editingBillId) {
    const ok = await handleEditBill(editingBillId, cart, discount);
    if (ok) {
      setCart([]);
      setCustomerForm({ name: "", phone: "" });
      setDiscount(0);
      setCategory("Milk");
      setEditingBillId(null);
      setView("sales");
    }
    return;
  }
    const { printBill } = await import("./utils/printBill");
    const bill = {
      id: "MD" + String(Date.now()).slice(-5),
      date: new Date().toISOString(),
      items: cart,
      subtotal: Math.round(cartSubtotal),
      discountPct: discount,
      discountAmt: Math.round(discountAmt),
      total: Math.round(cartTotal),
      cost: Math.round(cartCost),
      profit: Math.round(cartTotal) - Math.round(cartCost),
      customer: customerForm.name || customerForm.phone ? { ...customerForm } : null,
      paymentMode,
    };
    try {
      const saved = await apiCall("/bills", "POST", bill);
      setBills((prev) => [saved, ...prev]);
      if (customerForm.phone) {
        const updatedCustomers = await apiCall("/customers");
        setCustomers(updatedCustomers);
      }
      printBill(bill);
      setCart([]);
      setCustomerForm({ name: "", phone: "" });
      setDiscount(0);
      setCategory("Milk");
    } catch (e) {
      alert("Bill save karne mein error: " + e.message);
    }
  };

  // ─── Product CRUD ──────────────────────────────────────────────────────────
  const handleSaveProduct = async (formData, editingId) => {
    try {
      if (editingId) {
        const updated = await apiCall(`/products/${editingId}`, "PUT", {
          ...formData, price: +formData.price, cost: +formData.cost,
          hasVariation: formData.hasVariation,
          halfPrice: +formData.halfPrice || 0,
          fullPrice: +formData.fullPrice || 0,
        });
        setProducts((prev) => prev.map((p) => p.id === editingId ? updated : p));
      } else {
        const created = await apiCall("/products", "POST", {
          ...formData, price: +formData.price, cost: +formData.cost,
          hasVariation: formData.hasVariation,
          halfPrice: +formData.halfPrice || 0,
          fullPrice: +formData.fullPrice || 0,
        });
        setProducts((prev) => [...prev, created]);
      }
      return true;
    } catch (e) {
      alert("Product save karne mein error: " + e.message);
      return false;
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      await apiCall(`/products/${id}`, "DELETE");
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      alert("Product delete karne mein error: " + e.message);
    }
  };

const handleDeleteBill = async (id) => {
  // Pehle UI se hata do (optimistic)
  setBills((prev) => prev.filter((b) => b.id !== id));
  try {
    await apiCall(`/bills/${id}`, "DELETE");
  } catch (e) {
    // Agar error aaye toh wapas add karo
    const bls = await apiCall("/bills");
    setBills(bls);
    alert("Bill delete karne mein error: " + e.message);
  }
};

  const handleDeleteAllBills = async () => {
    try {
      await apiCall("/bills/all", "DELETE");
      setBills([]);
    } catch (e) {
      alert("Saari bills delete karne mein error: " + e.message);
    }
  };

  const fetchBillsForFilter = async (filterType, customDate) => {
  try {
    let url = "/bills";
    const todayStr = new Date().toISOString().slice(0, 10);
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    if (filterType === "today") {
      url = `/bills?date=${todayStr}`;
    } else if (filterType === "yesterday") {
      url = `/bills?date=${yesterdayStr}`;
    } else if (filterType === "month") {
      const m = new Date().toISOString().slice(0, 7);
      url = `/bills?month=${m}`;
    } else if (filterType === "all") {
      url = `/bills`;
    }
    // custom ke liye kuch mat karo — frontend filter karega

    const bls = await apiCall(url);
    setBills(bls);
  } catch (e) {
    alert("Bills load karne mein error: " + e.message);
  }
};
  const handleEditBill = async (billId, updatedItems, updatedDiscountPct) => {
    try {
      const updated = await apiCall(`/bills/${billId}`, "PUT", {
        items: updatedItems,
        discountPct: updatedDiscountPct,
      });
      setBills((prev) => prev.map((b) => b.id === billId ? updated : b));
      return true;
    } catch (e) {
      alert("Bill edit karne mein error: " + e.message);
      return false;
    }
  };
  // ─── Load bill into cart for editing ──────────────────────────────────────
const loadBillIntoCart = (bill) => {
  setCart(bill.items.map(i => ({ ...i })));
  setCustomerForm({ name: bill.customer?.name || "", phone: bill.customer?.phone || "" });
  setDiscount(bill.discountPct || 0);
  setEditingBillId(bill.id);
  setView("billing");
};

  // ─── Auth / Loading / Error screens ───────────────────────────────────────
  if (!token) return <Login onLogin={(t) => setToken(t)} />;

  if (loading)
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f8f5f0", flexDirection: "column", gap: 16 }}>
        <div style={{ fontSize: 48 }}>🥛</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: "#1a1310" }}>MANISH DAIRY</div>
        <div style={{ fontSize: 14, color: "#8a7e6e" }}>Data load ho raha hai...</div>
      </div>
    );

  if (error)
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f8f5f0", flexDirection: "column", gap: 16, padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 48 }}>❌</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#ef4444" }}>{error}</div>
        <button onClick={() => window.location.reload()} style={{ padding: "10px 24px", background: "#1a1310", color: "#f59e0b", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>
          Dobara Try Karo
        </button>
      </div>
    );


  // ─── Main Layout ───────────────────────────────────────────────────────────
  return (
    <LicenseGate>
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#f8f5f0", fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ backgroundColor: "#1a1310", color: "#f5f0eb", textAlign: "center", padding: "14px", fontSize: "13px" }}>
        Developed by <strong style={{ color: "#f59e0b" }}>Aniket Kansal</strong> &amp; <strong style={{ color: "#f59e0b" }}>Akshansh Mittal</strong>
        &nbsp;|&nbsp; 📞 +91-8126700718 &amp; +91-8766392706
      </div>

      <Navbar view={view} setView={setView} onLogout={() => { localStorage.clear(); setToken(null); }} />

      <div style={{ padding: "24px", maxWidth: 1400, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        {view === "billing" && (
  <BillingView
    products={products} filtered={filtered} bills={bills}
    editingBillId={editingBillId}
    onCancelEdit={() => { setEditingBillId(null); setCart([]); setView("sales"); }}
            category={category} setCategory={setCategory}
            search={search} setSearch={setSearch}
            cart={cart} setCart={setCart}
            addToCart={addToCart} updateQty={updateQty} setQtyPreset={setQtyPreset}
            cartTotal={cartTotal} cartSubtotal={cartSubtotal}
            discountAmt={discountAmt} discount={discount} setDiscount={setDiscount}
            customerForm={customerForm} setCustomerForm={setCustomerForm}
            checkoutBill={checkoutBill} dbCats={dbCats}
          />
        )}
        {view === "products" && (
          <ProductsView
            products={products} onSave={handleSaveProduct} onDelete={handleDeleteProduct}
            dbCats={dbCats} setDbCats={setDbCats}
          />
        )}
       {view === "sales" && (
  <SalesView
    bills={bills} onDelete={handleDeleteBill} onDeleteAll={handleDeleteAllBills}
    onEdit={handleEditBill} products={products}
    onFilterChange={fetchBillsForFilter}
    onLoadEdit={loadBillIntoCart}
  />
)}
        {view === "analytics" && <AnalyticsView bills={bills} />}
        {view === "customers" && (
          <CustomersView customers={customers} bills={bills} setCart={setCart} setView={setView} />
        )}
      </div>
    </div>
    </LicenseGate>
  );
}