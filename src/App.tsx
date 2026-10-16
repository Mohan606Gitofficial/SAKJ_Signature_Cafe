import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import { formatPrice } from "./lib/format";
import { menuCategories, starterMenu } from "./lib/menu";
import type { MenuItem } from "./lib/menu";
import { isSupabaseConfigured, supabase } from "./lib/supabase";

type Cart = Record<string, number>;
type OrderStatus = "new" | "preparing" | "ready" | "completed" | "cancelled";

interface Order {
  id: string;
  customer_name: string;
  phone: string;
  items: Array<{ id: string; name: string; quantity: number; price: number }>;
  total: number;
  notes: string | null;
  status: OrderStatus;
  created_at: string;
}

function App() {
  const [menu, setMenu] = useState<MenuItem[]>(starterMenu);
  const [cart, setCart] = useState<Cart>({});
  const [activeCategory, setActiveCategory] =
    useState<(typeof menuCategories)[number]>("All");
  const [orderOpen, setOrderOpen] = useState(false);
  const [orderMessage, setOrderMessage] = useState("");
  const [orderBusy, setOrderBusy] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    void supabase
      .from("menu_items")
      .select("id,name,description,price,category,image_url,available")
      .eq("available", true)
      .order("sort_order")
      .then(({ data, error }) => {
        if (error) {
          console.error("Could not load the café menu:", error.message);
          return;
        }
        if (data?.length) setMenu(data as MenuItem[]);
      });
  }, []);

  const visibleMenu = useMemo(
    () =>
      menu.filter(
        (item) =>
          item.available &&
          (activeCategory === "All" || item.category === activeCategory),
      ),
    [activeCategory, menu],
  );

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, quantity]) => {
          const item = menu.find((entry) => entry.id === id);
          return item ? { ...item, quantity } : null;
        })
        .filter((item): item is MenuItem & { quantity: number } => item !== null),
    [cart, menu],
  );
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  function changeQuantity(id: string, amount: number) {
    setCart((current) => {
      const nextQuantity = Math.min(20, (current[id] ?? 0) + amount);
      const next = { ...current };
      if (nextQuantity <= 0) delete next[id];
      else next[id] = nextQuantity;
      return next;
    });
  }

  async function placeOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOrderMessage("");
    if (!supabase) {
      setOrderMessage(
        "Online ordering is not connected yet. Please call the café to order.",
      );
      return;
    }
    if (!cartItems.length) {
      setOrderMessage("Add an item to your order first.");
      return;
    }
    const formData = new FormData(event.currentTarget);
    const customerName = String(formData.get("customer_name") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim();
    if (customerName.length < 2 || phone.length < 7) {
      setOrderMessage("Enter your name and a valid phone number.");
      return;
    }

    setOrderBusy(true);
    const orderForm = event.currentTarget;
    const orderItems = cartItems.map(({ id, name, price, quantity }) => ({
      id,
      name,
      price,
      quantity,
    }));
    try {
      const { error } = await supabase.rpc("create_order", {
        p_customer_name: customerName,
        p_phone: phone,
        p_items: orderItems,
        p_notes: notes || null,
      });
      if (error) {
        console.error("Could not place the order:", error.message);
        setOrderMessage(
          "We couldn't send your order. Please try again or call the café.",
        );
        return;
      }
    } catch (error) {
      console.error("Could not reach the order service:", error);
      setOrderMessage(
        "We couldn't send your order. Please try again or call the café.",
      );
      return;
    } finally {
      setOrderBusy(false);
    }
    setCart({});
    setOrderMessage("Order received! The café will contact you shortly.");
    orderForm.reset();
  }

  return (
    <Routes>
      <Route
        path="/"
        element={renderHomePage()}
      />
      <Route
        path="/admin/login"
        element={
          <AdminLoginPage
            isConfigured={isSupabaseConfigured()}
          />
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  function renderHomePage() {
    return (
      <>
        <header className="site-header">
          <a className="wordmark" href="#" aria-label="SAKJ Signature Café home">
            <img className="wordmark-logo" src="/sakj-signature-cafe-logo.png" alt="" />
            <span>
              <strong>SAKJ</strong>
              <small>SIGNATURE CAFÉ</small>
            </span>
          </a>
          <nav className="main-nav" aria-label="Main navigation">
            <a href="#story">Our story</a>
            <a href="#menu">The menu</a>
            <a href="#visit">Find us</a>
          </nav>
          <a className="header-cta" href="#menu">
            Order something lovely <span aria-hidden="true">↗</span>
          </a>
        </header>

        <main>
          <section className="hero">
            <div className="hero-copy">
              <p className="eyebrow"><span /> YOUR EVERYDAY LITTLE ESCAPE</p>
              <h1>Coffee made<br />a little more <em>personal.</em></h1>
              <p className="hero-description">
                Thoughtful pours, oven-warm bakes, and the kind of welcome that
                makes you want to stay a little longer.
              </p>
              <div className="hero-actions">
                <a className="button button-dark" href="#menu">Explore the menu <span>↓</span></a>
                <span className="hero-note"><span className="star">✳</span> Made fresh, made with love</span>
              </div>
              <div className="hero-stamp" aria-hidden="true">
                <span>GOOD<br />THINGS<br />BREWING</span>
                <span className="stamp-star">✳</span>
              </div>
            </div>
            <div className="hero-image-wrap">
              <img
                className="hero-image"
                src="https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=1400&q=90"
                alt="A warmly lit café counter ready to welcome you"
              />
              <div className="image-caption"><span>01 / 03</span><span>A good day starts here.</span></div>
              <div className="hero-badge"><span>✳</span><small>BREWED WITH<br />HEART IN EVERY<br />LITTLE DETAIL</small></div>
            </div>
          </section>

          <section className="ticker" aria-label="Café motto">
            <div>GOOD COFFEE, GOOD COMPANY <span>✳</span> A LITTLE MOMENT FOR YOU <span>✳</span> GOOD COFFEE, GOOD COMPANY <span>✳</span> A LITTLE MOMENT FOR YOU <span>✳</span></div>
          </section>

          <section className="story-section section-wrap" id="story">
            <div className="story-image">
              <img src="https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1000&q=85" alt="Freshly brewed coffee on a café table" />
              <div className="story-image-note">A pause, poured just for you.</div>
            </div>
            <div className="story-copy">
              <p className="eyebrow">A TABLE WITH YOUR NAME ON IT</p>
              <h2>Not just a coffee.<br />A <em>feeling.</em></h2>
              <p>
                SAKJ Signature Café is your neighbourhood corner for unhurried
                mornings and one-more-cup afternoons. We believe the little
                things—a carefully pulled shot, a warm hello, a pastry still
                warm from the oven—make a day feel different.
              </p>
              <a className="text-link" href="#visit">Come say hello <span>↗</span></a>
            </div>
          </section>

          <section className="menu-section" id="menu">
            <div className="section-wrap">
              <div className="section-heading">
                <div><p className="eyebrow">GOOD THINGS, ON THE MENU</p><h2>Your next <em>favourite.</em></h2></div>
                <p>Small-batch, made fresh, and always worth the little detour.</p>
              </div>
              <div className="category-tabs" role="tablist" aria-label="Menu categories">
                {menuCategories.map((item) => (
                  <button
                    className={activeCategory === item ? "category-tab active" : "category-tab"}
                    key={item}
                    onClick={() => setActiveCategory(item)}
                    role="tab"
                    aria-selected={activeCategory === item}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <div className="menu-grid">
                {visibleMenu.map((item) => (
                  <article className="menu-card" key={item.id}>
                    <div className="menu-card-image">
                      <img src={item.image_url} alt={item.name} loading="lazy" />
                      <span className="menu-category">{item.category}</span>
                    </div>
                    <div className="menu-card-content">
                      <div className="menu-card-title"><h3>{item.name}</h3><span>{formatPrice(item.price)}</span></div>
                      <p>{item.description}</p>
                      <button className="add-button" onClick={() => changeQuantity(item.id, 1)}>
                        Add to order <span>+</span>
                      </button>
                    </div>
                  </article>
                ))}
                {!visibleMenu.length && <p className="empty-menu">More good things are on their way.</p>}
              </div>
              <div className="menu-footnote"><span>✳</span> Have an allergy or a special request? Let us know when you order.</div>
            </div>
          </section>

          <section className="visit-section section-wrap" id="visit">
            <div className="visit-copy">
              <p className="eyebrow">YOUR SEAT IS WAITING</p>
              <h2>Drop by for<br />a <em>little lovely.</em></h2>
              <p>We'd love to be part of your day. Come on in, find your favourite corner, and let us make you something good.</p>
              <div className="visit-details">
                <div><span className="detail-icon">⌖</span><span><strong>Find our café</strong><small>Add your café address here before launch</small></span></div>
                <div><span className="detail-icon">◷</span><span><strong>Come by</strong><small>Add your opening hours here before launch</small></span></div>
              </div>
            </div>
            <div className="visit-image">
              <img src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1100&q=85" alt="Cosy café seating in a sunlit room" loading="lazy" />
              <span className="visit-image-label">YOUR NEIGHBOURHOOD, YOUR CAFÉ.</span>
            </div>
          </section>
        </main>

        <footer className="site-footer">
          <a className="wordmark footer-wordmark" href="#">
            <img className="wordmark-logo" src="/sakj-signature-cafe-logo.png" alt="" />
            <span><strong>SAKJ</strong><small>SIGNATURE CAFÉ</small></span>
          </a>
          <p>A little coffee, a lot of heart.</p>
          <span className="footer-copy">© {new Date().getFullYear()} SAKJ Signature Café</span>
          <Link className="admin-link" to="/admin/login">Staff sign in</Link>
        </footer>

        {cartCount > 0 && (
          <button className="cart-button" onClick={() => {
            setOrderMessage("");
            setOrderOpen(true);
          }}>
            <span className="cart-icon">▣</span>
            <span>Your order <small>{cartCount} {cartCount === 1 ? "item" : "items"}</small></span>
            <strong>{formatPrice(cartTotal)} <span>→</span></strong>
          </button>
        )}
        {orderOpen && (
          <div className="modal-backdrop" onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOrderOpen(false);
          }}>
            <section className="order-modal" role="dialog" aria-modal="true" aria-labelledby="order-title">
              <button className="modal-close" onClick={() => setOrderOpen(false)} aria-label="Close order form">×</button>
              <p className="eyebrow">A LITTLE SOMETHING FOR YOU</p>
              <h2 id="order-title">Your <em>order.</em></h2>
              <div className="order-lines">
                {cartItems.map((item) => (
                  <div className="order-line" key={item.id}>
                    <span>{item.name}<small>{formatPrice(item.price)} each</small></span>
                    <div className="quantity-control">
                      <button onClick={() => changeQuantity(item.id, -1)} aria-label={`Remove one ${item.name}`}>−</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => changeQuantity(item.id, 1)} aria-label={`Add one ${item.name}`}>+</button>
                    </div>
                    <strong>{formatPrice(item.price * item.quantity)}</strong>
                  </div>
                ))}
                {!cartItems.length && <p>Your order is empty. Close this window and pick something from the menu.</p>}
              </div>
              <div className="order-total"><span>Total</span><strong>{formatPrice(cartTotal)}</strong></div>
              <form className="order-form" onSubmit={placeOrder}>
                <label>Your name<input name="customer_name" required minLength={2} autoComplete="name" placeholder="How should we call you?" /></label>
                <label>Phone number<input name="phone" type="tel" required minLength={7} autoComplete="tel" placeholder="So we can confirm your order" /></label>
                <label>Anything else? <span className="optional">(optional)</span><textarea name="notes" rows={2} maxLength={500} placeholder="Pickup time, milk preference, or a little note..." /></label>
                {!isSupabaseConfigured() && <p className="setup-notice">Online ordering is not connected yet. Configure Supabase before accepting live orders.</p>}
                {orderMessage && <p className={orderMessage.startsWith("Order received") ? "success-message" : "error-message"} role="status">{orderMessage}</p>}
                <button className="button button-dark order-submit" type="submit" disabled={!cartItems.length || orderBusy}>
                  {orderBusy ? "Sending your order..." : "Send order"} <span>→</span>
                </button>
              </form>
            </section>
          </div>
        )}
      </>
    );
  }
}

function AdminLoginPage({ isConfigured }: { isConfigured: boolean }) {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let active = true;
    void client.auth.getSession().then(async ({ data, error }) => {
      if (error) {
        console.error("Could not check admin session:", error.message);
        if (active) setMessage("Could not check your sign-in. Please try again.");
        return;
      }
      if (!data.session) return;
      const { data: admin, error: adminError } = await client
        .from("admins")
        .select("user_id")
        .eq("user_id", data.session.user.id)
        .maybeSingle();
      if (adminError) {
        console.error("Could not verify admin access:", adminError.message);
        if (active) setMessage("Could not verify admin access. Please try again.");
      } else if (admin && active) {
        navigate("/admin", { replace: true });
      } else if (active) {
        setMessage("This account is not authorized to access the café dashboard.");
      }
    });
    return () => {
      active = false;
    };
  }, [navigate]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const client = supabase;
    if (!client) {
      setMessage("Supabase is not configured. Set the VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.");
      return;
    }
    const data = new FormData(event.currentTarget);
    setBusy(true);
    const { error } = await client.auth.signInWithPassword({
      email: String(data.get("email")),
      password: String(data.get("password")),
    });
    setBusy(false);
    if (error) {
      setMessage("Sign-in failed. Check your email and password, then try again.");
      return;
    }
    navigate("/admin", { replace: true });
  }

  return (
    <main className="admin-page">
      <Link className="wordmark admin-wordmark" to="/">
        <img className="wordmark-logo" src="/sakj-signature-cafe-logo.png" alt="" /><span><strong>SAKJ</strong><small>SIGNATURE CAFÉ</small></span>
      </Link>
      <section className="admin-card">
        <p className="eyebrow">SAKJ SIGNATURE CAFÉ</p>
        <h1>Good to have<br />you <em>back.</em></h1>
        <p className="admin-intro">Sign in to see your café dashboard and new orders.</p>
        {!isConfigured && <p className="setup-notice">Connect your Supabase project using the environment variables to enable admin sign-in.</p>}
        <form className="admin-form" onSubmit={signIn}>
          <label>Email address<input name="email" type="email" required autoComplete="username" placeholder="you@yourcafe.com" /></label>
          <label>Password<input name="password" type="password" required autoComplete="current-password" placeholder="Your password" /></label>
          {message && <p className="error-message" role="alert">{message}</p>}
          <button className="button button-dark" type="submit" disabled={busy}>{busy ? "Signing in..." : "Sign in"} <span>→</span></button>
        </form>
        <Link className="back-home" to="/">← Back to the café</Link>
      </section>
      <span className="admin-page-note">A good day starts with a good cup.</span>
    </main>
  );
}

function AdminRoute({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const client = supabase;
    if (!client) {
      setLoading(false);
      return;
    }
    let active = true;
    const checkAdmin = async () => {
      const { data: sessionData, error: sessionError } =
        await client.auth.getSession();
      if (sessionError) {
        console.error("Could not check admin session:", sessionError.message);
      }
      if (!sessionData.session) {
        if (active) {
          setAuthorized(false);
          setLoading(false);
        }
        return;
      }
      const { data, error } = await client
        .from("admins")
        .select("user_id")
        .eq("user_id", sessionData.session.user.id)
        .maybeSingle();
      if (error) console.error("Could not verify admin access:", error.message);
      if (active) {
        setAuthorized(Boolean(data) && !error);
        setLoading(false);
      }
    };
    void checkAdmin();
    const { data } = client.auth.onAuthStateChange(() => {
      setLoading(true);
      void checkAdmin();
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  if (loading) return <div className="admin-loading">Preparing your café dashboard...</div>;
  if (!supabase || !authorized) return <Navigate to="/admin/login" replace />;
  return children;
}

function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"orders" | "menu">("orders");
  const [savingMenu, setSavingMenu] = useState("");
  const [menuMessage, setMenuMessage] = useState("");
  const navigate = useNavigate();

  const loadDashboard = useCallback(async () => {
    if (!supabase) return;
    setErrorMessage("");
    const [ordersResult, menuResult] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("menu_items").select("*").order("sort_order"),
    ]);
    if (ordersResult.error) {
      console.error("Could not load orders:", ordersResult.error.message);
      setErrorMessage("Orders could not be loaded. Check your Supabase setup and admin permissions.");
    } else setOrders(ordersResult.data as Order[]);
    if (menuResult.error) {
      console.error("Could not load menu:", menuResult.error.message);
      setErrorMessage("Menu could not be loaded. Check your Supabase setup and admin permissions.");
    } else setMenu(menuResult.data as MenuItem[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  async function updateStatus(orderId: string, status: OrderStatus) {
    if (!supabase) return;
    setErrorMessage("");
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    if (error) {
      console.error("Could not update order status:", error.message);
      setErrorMessage("The order status could not be updated. Please try again.");
      return;
    }
    setOrders((current) => current.map((order) => order.id === orderId ? { ...order, status } : order));
  }

  async function toggleAvailability(item: MenuItem) {
    if (!supabase) return;
    setSavingMenu(item.id);
    setMenuMessage("");
    const { error } = await supabase.from("menu_items").update({ available: !item.available }).eq("id", item.id);
    setSavingMenu("");
    if (error) {
      console.error("Could not update menu item:", error.message);
      setMenuMessage("The menu item could not be updated. Please try again.");
      return;
    }
    setMenu((current) => current.map((entry) => entry.id === item.id ? { ...entry, available: !entry.available } : entry));
  }

  async function signOut() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Could not sign out:", error.message);
      setErrorMessage("Sign out did not complete. Please try again.");
      return;
    }
    navigate("/admin/login", { replace: true });
  }

  const activeOrders = orders.filter((order) => ["new", "preparing", "ready"].includes(order.status));

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <Link className="wordmark" to="/"><img className="wordmark-logo" src="/sakj-signature-cafe-logo.png" alt="" /><span><strong>SAKJ</strong><small>SIGNATURE CAFÉ</small></span></Link>
        <div className="dashboard-header-right"><span className="dashboard-greeting">Your café, at a glance.</span><button className="signout-button" onClick={signOut}>Sign out ↗</button></div>
      </header>
      <div className="dashboard-content">
        <div className="dashboard-title-row">
          <div><p className="eyebrow">SAKJ SIGNATURE CAFÉ</p><h1>Good morning,<br /><em>let's get brewing.</em></h1></div>
          <button className="refresh-button" onClick={() => { setLoading(true); void loadDashboard(); }}>↻ <span>Refresh</span></button>
        </div>
        <div className="dashboard-stats">
          <div><span>OPEN ORDERS</span><strong>{activeOrders.length.toString().padStart(2, "0")}</strong><small>Ready for your attention</small></div>
          <div><span>TODAY'S ORDERS</span><strong>{orders.filter((order) => new Date(order.created_at).toDateString() === new Date().toDateString()).length.toString().padStart(2, "0")}</strong><small>Placed so far today</small></div>
          <div><span>MENU ITEMS</span><strong>{menu.filter((item) => item.available).length.toString().padStart(2, "0")}</strong><small>Currently available</small></div>
        </div>
        <div className="dashboard-tabs">
          <button className={activeTab === "orders" ? "dashboard-tab selected" : "dashboard-tab"} onClick={() => setActiveTab("orders")}>Orders <span>{activeOrders.length}</span></button>
          <button className={activeTab === "menu" ? "dashboard-tab selected" : "dashboard-tab"} onClick={() => setActiveTab("menu")}>Menu</button>
        </div>
        {errorMessage && <p className="error-message dashboard-message" role="alert">{errorMessage}</p>}
        {loading ? <p className="dashboard-empty">Loading your café...</p> : activeTab === "orders" ? (
          <section className="orders-list">
            {orders.length === 0 && <p className="dashboard-empty">No orders just yet. When the first one arrives, it will show up here.</p>}
            {orders.map((order) => (
              <article className="order-card" key={order.id}>
                <div className="order-card-heading"><div><span className="order-number">ORDER #{order.id.slice(0, 8).toUpperCase()}</span><h2>{order.customer_name}</h2><span className="order-time">{new Date(order.created_at).toLocaleString()}</span></div><span className={`status-pill status-${order.status}`}>{order.status}</span></div>
                <div className="order-items">{order.items.map((item) => <div key={item.id}><span>{item.quantity} × {item.name}</span><span>{formatPrice(item.quantity * item.price)}</span></div>)}</div>
                {order.notes && <p className="order-notes">Note: {order.notes}</p>}
                <div className="order-card-footer"><span className="customer-phone">{order.phone}</span><strong>{formatPrice(order.total)}</strong><select aria-label={`Set status for order ${order.id.slice(0, 8)}`} value={order.status} onChange={(event) => void updateStatus(order.id, event.target.value as OrderStatus)}><option value="new">New</option><option value="preparing">Preparing</option><option value="ready">Ready</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div>
              </article>
            ))}
          </section>
        ) : (
          <section className="dashboard-menu-list">
            {menuMessage && <p className="error-message" role="alert">{menuMessage}</p>}
            <p className="menu-admin-note">To add or change menu details, edit the <code>menu_items</code> table in your Supabase dashboard. You can toggle item availability here.</p>
            {menu.map((item) => (
              <article className="menu-admin-row" key={item.id}>
                <img src={item.image_url} alt="" />
                <div><strong>{item.name}</strong><span>{item.category} · {formatPrice(item.price)}</span></div>
                <button className={item.available ? "availability-toggle available" : "availability-toggle"} disabled={savingMenu === item.id} onClick={() => void toggleAvailability(item)}>{savingMenu === item.id ? "Saving..." : item.available ? "Available" : "Sold out"}</button>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

export default App;
