import { useState, useEffect, useMemo } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "./firebase/config";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./Screens/login";
import Signup from "./Screens/signup";
import Home from "./Screens/home";
import About from "./Screens/about";
import Navbar from "./Components/Navbar";
import Footer from "./Components/footer";
import MiniProducts from "./Screens/minproducts";
import Products from "./Screens/products";
import Manage from "./Screens/AdminProductManager";
import Billing from "./Screens/billing";

type Screen = "login" | "signup" | "home";

interface SearchableContent {
  id: string;
  title: string;
  content: string;
  section: string;
  category?: string;
  tags?: string[];
  url?: string;
}

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("login");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [, setGlobalSearchResults] = useState<SearchableContent[]>([]);
  const [, setIsSearching] = useState(false);
  const ADMIN_EMAIL = "autonexuscarsolutions@gmail.com";

  const searchableContent: SearchableContent[] = useMemo(
    () => [
      {
        id: "home-hero",
        title: "Auto Parts & Car Accessories",
        content:
          "Premium auto parts, car accessories, engine components, brake systems, filters, oils, maintenance supplies",
        section: "home",
        category: "overview",
        tags: ["auto", "parts", "accessories", "car", "vehicle"]
      },
      {
        id: "home-services",
        title: "Our Services",
        content:
          "Professional installation, maintenance, repair services, diagnostic, consultation, warranty support",
        section: "home",
        category: "services",
        tags: ["services", "installation", "maintenance", "repair"]
      },
      {
        id: "home-quality",
        title: "Quality Assurance",
        content:
          "High-quality genuine parts, OEM specifications, certified products, tested components",
        section: "home",
        category: "quality",
        tags: ["quality", "genuine", "OEM", "certified", "tested"]
      },
      {
        id: "about-company",
        title: "Company History",
        content:
          "Established automotive parts supplier, years of experience, trusted by customers, expert team",
        section: "about",
        category: "company",
        tags: ["history", "experience", "trusted", "expert", "team"]
      },
      {
        id: "about-mission",
        title: "Our Mission",
        content:
          "Providing reliable auto parts, customer satisfaction, quality products, affordable prices, excellent service",
        section: "about",
        category: "mission",
        tags: ["mission", "reliable", "satisfaction", "quality", "affordable"]
      },
      {
        id: "about-values",
        title: "Core Values",
        content:
          "Integrity, quality, customer focus, innovation, reliability, transparency, professional service",
        section: "about",
        category: "values",
        tags: [
          "values",
          "integrity",
          "innovation",
          "reliability",
          "transparency"
        ]
      },
      {
        id: "products-engine",
        title: "Engine Components",
        content:
          "Engine parts, pistons, valves, gaskets, timing belts, spark plugs, filters, oil pumps",
        section: "miniproducts",
        category: "engine",
        tags: [
          "engine",
          "pistons",
          "valves",
          "gaskets",
          "timing",
          "spark plugs"
        ]
      },
      {
        id: "products-brake",
        title: "Brake Systems",
        content:
          "Brake pads, brake discs, brake fluid, brake lines, calipers, brake shoes, ABS components",
        section: "miniproducts",
        category: "brakes",
        tags: ["brake", "pads", "discs", "fluid", "calipers", "ABS"]
      },
      {
        id: "products-suspension",
        title: "Suspension Parts",
        content:
          "Shocks, struts, springs, ball joints, tie rods, bushings, sway bars, control arms",
        section: "miniproducts",
        category: "suspension",
        tags: [
          "suspension",
          "shocks",
          "struts",
          "springs",
          "joints",
          "bushings"
        ]
      },
      {
        id: "products-electrical",
        title: "Electrical Components",
        content:
          "Batteries, alternators, starters, lights, fuses, relays, wiring, sensors, ECU",
        section: "miniproducts",
        category: "electrical",
        tags: [
          "electrical",
          "battery",
          "alternator",
          "lights",
          "fuses",
          "sensors"
        ]
      },
      {
        id: "products-filters",
        title: "Filters & Fluids",
        content:
          "Air filters, oil filters, fuel filters, cabin filters, engine oil, transmission fluid, coolant",
        section: "miniproducts",
        category: "filters",
        tags: ["filters", "air", "oil", "fuel", "cabin", "fluids", "coolant"]
      },
      {
        id: "billing-invoices",
        title: "Invoice Management",
        content:
          "View invoices, payment history, billing statements, invoice downloads, payment tracking",
        section: "billing",
        category: "invoices",
        tags: ["invoices", "billing", "payment", "history", "statements"]
      },
      {
        id: "billing-payment",
        title: "Payment Methods",
        content:
          "Credit card payments, bank transfers, payment options, secure transactions, payment setup",
        section: "billing",
        category: "payment",
        tags: ["payment", "credit card", "bank", "secure", "transactions"]
      },
      {
        id: "billing-subscription",
        title: "Subscription & Plans",
        content:
          "Membership plans, subscription billing, plan upgrades, recurring payments, billing cycles",
        section: "billing",
        category: "subscription",
        tags: ["subscription", "plans", "membership", "recurring", "billing"]
      },
      {
        id: "billing-support",
        title: "Billing Support",
        content:
          "Payment assistance, billing inquiries, dispute resolution, refund requests, customer support",
        section: "billing",
        category: "support",
        tags: ["support", "assistance", "disputes", "refunds", "help"]
      },
      {
        id: "manage-inventory",
        title: "Inventory Management",
        content:
          "Stock control, product catalog, pricing, supplier management, order processing",
        section: "manage",
        category: "inventory",
        tags: ["inventory", "stock", "catalog", "pricing", "suppliers"]
      },
      {
        id: "manage-orders",
        title: "Order Management",
        content:
          "Order tracking, fulfillment, shipping, customer orders, payment processing",
        section: "manage",
        category: "orders",
        tags: ["orders", "tracking", "fulfillment", "shipping", "payment"]
      }
    ],
    []
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      if (!firebaseUser) setCurrentScreen("login");
    });
    return () => unsubscribe();
  }, []);

  const performGlobalSearch = (query: string) => {
    if (!query.trim()) {
      setGlobalSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    const filteredContent = searchableContent.filter((item) => {
      if (
        (item.section === "manage" || item.section === "billing") &&
        user?.email !== ADMIN_EMAIL
      ) {
        return false;
      }

      const searchTerms = query
        .toLowerCase()
        .split(" ")
        .filter((term) => term.length > 0);
      const searchableText = `${item.title} ${item.content} ${
        item.category || ""
      } ${(item.tags || []).join(" ")}`.toLowerCase();

      return searchTerms.some((term) => searchableText.includes(term));
    });

    const sortedResults = filteredContent.sort((a, b) => {
      const queryLower = query.toLowerCase();
      const aTitleMatch = a.title.toLowerCase().includes(queryLower);
      const bTitleMatch = b.title.toLowerCase().includes(queryLower);

      if (aTitleMatch && !bTitleMatch) return -1;
      if (!aTitleMatch && bTitleMatch) return 1;

      const sectionPriority = {
        home: 0,
        miniproducts: 1,
        about: 2,
        billing: 3,
        manage: 4
      };
      return (
        (sectionPriority[a.section as keyof typeof sectionPriority] || 99) -
        (sectionPriority[b.section as keyof typeof sectionPriority] || 99)
      );
    });

    setGlobalSearchResults(sortedResults);
    setIsSearching(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Auto<span className="text-red-600">Nexus</span>
          </h2>
          <p className="text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div>
        {currentScreen === "login" && (
          <Login onNavigate={(screen: Screen) => setCurrentScreen(screen)} />
        )}
        {currentScreen === "signup" && (
          <Signup onNavigate={(screen: Screen) => setCurrentScreen(screen)} />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar
        onNavigate={(screen: Screen) => setCurrentScreen(screen)}
        user={user}
        searchQuery={searchQuery}
        onSearchChange={(value: string) => setSearchQuery(value)}
        onGlobalSearch={performGlobalSearch}
      />
      <Routes>
        <Route
          path="/"
          element={
            <div>
              <div data-section="home">
                <Home user={user} searchQuery={searchQuery} />
              </div>
              <div data-section="about">
                <About />
              </div>
              <div data-section="miniproducts">
                <MiniProducts />
              </div>

              {/* Admin only: Billing */}
              {user.email === ADMIN_EMAIL && (
                <div data-section="billing">
                  <Billing />
                </div>
              )}

              {/* Admin only: Manage */}
              {user.email === ADMIN_EMAIL && (
                <div data-section="manage">
                  <Manage user={user} />
                </div>
              )}
            </div>
          }
        />

        <Route path="/products" element={<Products />} />

        {/* Admin only: Billing page */}
        <Route
          path="/billing"
          element={
            user.email === ADMIN_EMAIL ? (
              <Billing />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </div>
  );
}

export default App;
