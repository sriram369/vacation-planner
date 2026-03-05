"use client";

import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Vibe = "beach" | "adventure" | "culture" | "city" | "nature" | "relaxation" | "balanced";

interface FlightOffer {
  price: string;
  duration: string;
  departs: string;
  arrives: string;
  stops: number;
  carrier: string;
  origin: string;
  destination: string;
}

interface BudgetTier {
  flight: string;
  hotel_per_night: string;
  airbnb_per_night: string;
  food_per_day: string;
  activities: string;
  total_estimate: string;
  notes: string;
}

interface Stay { name: string; type: string; price_range: string; why: string; }
interface Eat  { name: string; cuisine: string; price: string; must_try: string; }
interface DayPlan { day: number; title: string; morning: string; afternoon: string; evening: string; tip: string; }

interface Plan {
  destination: string;
  tagline: string;
  overview: string;
  best_time: string;
  itinerary: DayPlan[];
  budget: { currency: string; per_person: boolean; budget: BudgetTier; mid_range: BudgetTier; luxury: BudgetTier; };
  top_stays: Stay[];
  top_eats: Eat[];
  must_do: string[];
  travel_tips: { visa: string; currency: string; transport: string; weather: string; language: string; };
  flights_found: FlightOffer[];
}

const VIBES: { key: Vibe; emoji: string; label: string }[] = [
  { key: "beach",      emoji: "🏖️", label: "Beach" },
  { key: "adventure",  emoji: "🧗", label: "Adventure" },
  { key: "culture",    emoji: "🏛️", label: "Culture" },
  { key: "city",       emoji: "🏙️", label: "City" },
  { key: "nature",     emoji: "🌿", label: "Nature" },
  { key: "relaxation", emoji: "🧘", label: "Relax" },
  { key: "balanced",   emoji: "✨", label: "Balanced" },
];

// ─── helpers ────────────────────────────────────────────
function today() {
  return new Date().toISOString().split("T")[0];
}
function daysLater(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ─── sub-components ─────────────────────────────────────

function BudgetCard({ tier, data, label, color }: { tier: string; data: BudgetTier; label: string; color: string }) {
  const emoji = tier === "budget" ? "🟢" : tier === "mid_range" ? "🟡" : "🔴";
  const cls = tier === "budget" ? "budget-tier" : tier === "mid_range" ? "mid-tier" : "luxury-tier";
  return (
    <div className={`budget-card ${cls}`} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: "1.1rem" }}>{emoji}</span>
        <span style={{ fontWeight: 600, color: "var(--ink)", fontSize: "0.95rem" }}>{label}</span>
      </div>
      {[
        ["✈️ Flight", data.flight],
        ["🏨 Hotel/night", data.hotel_per_night],
        ["🏠 Airbnb/night", data.airbnb_per_night],
        ["🍽️ Food/day", data.food_per_day],
        ["🎟️ Activities", data.activities],
      ].map(([k, v]) => (
        <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--ink-2)" }}>
          <span>{k}</span>
          <span style={{ fontWeight: 500, color: "var(--ink)" }}>{v}</span>
        </div>
      ))}
      <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--border)", fontSize: "0.85rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: "var(--ink)" }}>
          <span>Total estimate</span>
          <span style={{ color }}>{data.total_estimate}</span>
        </div>
        {data.notes && (
          <div style={{ marginTop: 4, fontSize: "0.78rem", color: "var(--ink-3)", fontStyle: "italic" }}>
            {data.notes}
          </div>
        )}
      </div>
    </div>
  );
}

function PlanView({ plan }: { plan: Plan }) {
  const [activeTab, setActiveTab] = useState<"itinerary" | "budget" | "stays" | "tips">("itinerary");
  const tabs = [
    { key: "itinerary" as const, label: "Itinerary" },
    { key: "budget"    as const, label: "Budget" },
    { key: "stays"     as const, label: "Stays & Eats" },
    { key: "tips"      as const, label: "Travel Tips" },
  ];

  return (
    <div className="animate-fade-up" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, var(--ocean) 0%, #0d4a6b 100%)", color: "#fff", padding: "36px 48px", borderRadius: "16px 16px 0 0" }}>
        <div style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.7, marginBottom: 8 }}>
          Your AI-Planned Trip
        </div>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "2.4rem", marginBottom: 6 }}>
          {plan.destination}
        </h1>
        {plan.tagline && (
          <p style={{ fontSize: "1rem", opacity: 0.85, maxWidth: 560 }}>{plan.tagline}</p>
        )}
        {plan.best_time && (
          <div style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.12)", padding: "4px 14px", borderRadius: 20, fontSize: "0.82rem" }}>
            🗓️ Best time: {plan.best_time}
          </div>
        )}
      </div>

      {/* Overview strip */}
      {plan.overview && (
        <div style={{ background: "var(--ocean-bg)", padding: "16px 48px", borderLeft: "1px solid var(--border)", borderRight: "1px solid var(--border)" }}>
          <p style={{ color: "var(--ink-2)", fontSize: "0.92rem", lineHeight: 1.7 }}>{plan.overview}</p>
        </div>
      )}

      {/* Flights */}
      {plan.flights_found && plan.flights_found.length > 0 && (
        <div style={{ background: "var(--white)", padding: "20px 48px", borderLeft: "1px solid var(--border)", borderRight: "1px solid var(--border)" }}>
          <div className="section-label">✈️ Real Flights Found (via Amadeus)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {plan.flights_found.map((f, i) => (
              <div key={i} className="flight-card">
                <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--ocean)", minWidth: 60 }}>
                  {f.carrier}
                </div>
                <div style={{ fontWeight: 600, color: "var(--ink)", fontSize: "0.95rem" }}>
                  {f.origin} → {f.destination}
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--ink-3)" }}>
                  {fmtDate(f.departs)} · {f.duration} · {f.stops === 0 ? "Nonstop" : `${f.stops} stop${f.stops > 1 ? "s" : ""}`}
                </div>
                <div style={{ marginLeft: "auto", fontWeight: 700, fontSize: "1rem", color: "var(--coral)" }}>
                  {f.price}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Must Do */}
      {plan.must_do && plan.must_do.length > 0 && (
        <div style={{ background: "var(--sand-dark)", padding: "16px 48px", borderLeft: "1px solid var(--border)", borderRight: "1px solid var(--border)" }}>
          <div className="section-label">⭐ Must Do</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {plan.must_do.map((item, i) => (
              <span key={i} className="pill" style={{ background: "var(--white)", border: "1px solid var(--border)", color: "var(--ink-2)" }}>
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tab nav */}
      <div style={{ background: "var(--white)", borderLeft: "1px solid var(--border)", borderRight: "1px solid var(--border)", borderBottom: "1px solid var(--border)", display: "flex" }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              padding: "14px 24px", fontSize: "0.9rem",
              fontWeight: activeTab === t.key ? 600 : 400,
              color: activeTab === t.key ? "var(--ocean)" : "var(--ink-3)",
              background: "none", border: "none",
              borderBottom: activeTab === t.key ? "2px solid var(--ocean)" : "2px solid transparent",
              cursor: "pointer", transition: "all 0.15s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ background: "var(--white)", borderLeft: "1px solid var(--border)", borderRight: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "28px 48px", borderRadius: "0 0 16px 16px", minHeight: 300 }}>

        {/* ITINERARY */}
        {activeTab === "itinerary" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {plan.itinerary.map((day, i) => (
              <div key={i} className="day-card animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 12 }}>
                  <div style={{ background: "var(--ocean)", color: "#fff", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700, flexShrink: 0 }}>
                    {day.day}
                  </div>
                  <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.1rem", color: "var(--ink)" }}>
                    {day.title}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingLeft: 38 }}>
                  {[
                    { label: "🌅 Morning", text: day.morning },
                    { label: "☀️ Afternoon", text: day.afternoon },
                    { label: "🌙 Evening", text: day.evening },
                  ].map(({ label, text }) => text && (
                    <div key={label} style={{ display: "flex", gap: 8 }}>
                      <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--ink-3)", whiteSpace: "nowrap", paddingTop: 2, minWidth: 80 }}>{label}</span>
                      <span style={{ fontSize: "0.88rem", color: "var(--ink-2)", lineHeight: 1.6 }}>{text}</span>
                    </div>
                  ))}
                  {day.tip && (
                    <div style={{ marginTop: 4, background: "var(--gold-bg)", border: "1px solid rgba(196,150,10,0.2)", borderRadius: 8, padding: "6px 12px", fontSize: "0.82rem", color: "var(--gold)", display: "flex", gap: 6 }}>
                      <span>💡</span>
                      <span>{day.tip}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* BUDGET */}
        {activeTab === "budget" && plan.budget && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: "0.82rem", color: "var(--ink-3)" }}>
              Per person estimates · {plan.budget.currency}
            </div>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              {plan.budget.budget   && <BudgetCard tier="budget"    data={plan.budget.budget}    label="Budget"    color="var(--green)" />}
              {plan.budget.mid_range && <BudgetCard tier="mid_range" data={plan.budget.mid_range} label="Mid-Range" color="var(--gold)" />}
              {plan.budget.luxury   && <BudgetCard tier="luxury"    data={plan.budget.luxury}    label="Luxury"    color="var(--coral)" />}
            </div>
          </div>
        )}

        {/* STAYS & EATS */}
        {activeTab === "stays" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {plan.top_stays && plan.top_stays.length > 0 && (
              <div>
                <div className="section-label">🏠 Where to Stay</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {plan.top_stays.map((s, i) => (
                    <div key={i} style={{ background: "var(--sand)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "flex-start", gap: 14 }}>
                      <div style={{ background: "var(--ocean-bg)", borderRadius: 8, padding: "6px 10px", fontSize: "0.72rem", fontWeight: 600, color: "var(--ocean)", whiteSpace: "nowrap" }}>
                        {s.type}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--ink)", fontSize: "0.92rem" }}>{s.name}</div>
                        <div style={{ fontSize: "0.82rem", color: "var(--ink-3)", marginTop: 1 }}>{s.price_range}/night · {s.why}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {plan.top_eats && plan.top_eats.length > 0 && (
              <div>
                <div className="section-label">🍽️ Where to Eat</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
                  {plan.top_eats.map((e, i) => (
                    <div key={i} style={{ background: "var(--sand)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px" }}>
                      <div style={{ fontWeight: 600, color: "var(--ink)", fontSize: "0.9rem" }}>{e.name}</div>
                      <div style={{ fontSize: "0.78rem", color: "var(--ink-3)", marginTop: 2 }}>{e.cuisine} · {e.price}</div>
                      {e.must_try && <div style={{ fontSize: "0.78rem", color: "var(--coral)", marginTop: 4 }}>Try: {e.must_try}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TRAVEL TIPS */}
        {activeTab === "tips" && plan.travel_tips && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
            {[
              { icon: "🛂", label: "Visa", text: plan.travel_tips.visa },
              { icon: "💵", label: "Currency", text: plan.travel_tips.currency },
              { icon: "🚌", label: "Transport", text: plan.travel_tips.transport },
              { icon: "🌤️", label: "Weather", text: plan.travel_tips.weather },
              { icon: "🗣️", label: "Language", text: plan.travel_tips.language },
            ].filter(t => t.text).map(({ icon, label, text }) => (
              <div key={label} style={{ background: "var(--sand)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, fontWeight: 600, color: "var(--ink)", fontSize: "0.88rem" }}>
                  <span>{icon}</span> {label}
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--ink-2)", lineHeight: 1.6 }}>{text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────

export default function Home() {
  const [destination, setDestination] = useState("");
  const [origin, setOrigin] = useState("New York");
  const [depDate, setDepDate] = useState(daysLater(30));
  const [retDate, setRetDate] = useState(daysLater(37));
  const [travelers, setTravelers] = useState(2);
  const [vibe, setVibe] = useState<Vibe>("balanced");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) return;
    setLoading(true);
    setPlan(null);
    setError("");

    try {
      const res = await fetch(`${API}/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: destination.trim(),
          origin: origin.trim() || "New York",
          departure_date: depDate,
          return_date: retDate,
          travelers,
          vibe,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to generate plan");
      }

      const data = await res.json();
      setPlan(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const tripDays = Math.max(0, Math.round((new Date(retDate).getTime() - new Date(depDate).getTime()) / 86400000));

  return (
    <div style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
      {/* Header */}
      <header style={{ padding: "24px 48px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span style={{ fontFamily: "var(--font-serif)", fontSize: "1.7rem", color: "var(--ink)" }}>Wandr</span>
          <span style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ocean)", background: "var(--ocean-bg)", padding: "3px 10px", borderRadius: 20 }}>
            AI Planner
          </span>
        </div>
        <a href="https://github.com/sriram369/vacation-planner" target="_blank" rel="noopener noreferrer"
          style={{ fontSize: "0.82rem", color: "var(--ink-3)", textDecoration: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "7px 14px" }}>
          GitHub ↗
        </a>
      </header>

      <main style={{ maxWidth: 1000, width: "100%", margin: "0 auto", padding: "40px 48px" }}>
        {/* Hero text */}
        {!plan && !loading && (
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(2rem, 5vw, 3rem)", color: "var(--ink)", marginBottom: 12 }}>
              Plan your perfect trip
            </h1>
            <p style={{ color: "var(--ink-3)", fontSize: "1rem", maxWidth: 500, margin: "0 auto" }}>
              Real flights via Amadeus · Airbnb & hotel prices · Day-by-day itinerary · 3-tier budget breakdown
            </p>
          </div>
        )}

        {/* Form */}
        {!plan && (
          <form onSubmit={handleSubmit} style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 16, padding: "32px", display: "flex", flexDirection: "column", gap: 24, marginBottom: 32 }}>
            {/* Destination + Origin row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  🌍 Destination
                </label>
                <input
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  placeholder="e.g. Bali, Tokyo, Paris…"
                  required
                  style={{ padding: "12px 14px", borderRadius: 10, border: "1px solid var(--border-dark)", background: "var(--sand)", fontSize: "1rem", color: "var(--ink)", outline: "none" }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  ✈️ Flying From
                </label>
                <input
                  value={origin}
                  onChange={e => setOrigin(e.target.value)}
                  placeholder="e.g. New York, London…"
                  style={{ padding: "12px 14px", borderRadius: 10, border: "1px solid var(--border-dark)", background: "var(--sand)", fontSize: "1rem", color: "var(--ink)", outline: "none" }}
                />
              </div>
            </div>

            {/* Dates + Travelers */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px", gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Departure</label>
                <input type="date" value={depDate} onChange={e => setDepDate(e.target.value)} min={today()}
                  style={{ padding: "12px 14px", borderRadius: 10, border: "1px solid var(--border-dark)", background: "var(--sand)", fontSize: "0.95rem", color: "var(--ink)", outline: "none" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Return</label>
                <input type="date" value={retDate} onChange={e => setRetDate(e.target.value)} min={depDate}
                  style={{ padding: "12px 14px", borderRadius: 10, border: "1px solid var(--border-dark)", background: "var(--sand)", fontSize: "0.95rem", color: "var(--ink)", outline: "none" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Travelers</label>
                <input type="number" value={travelers} onChange={e => setTravelers(Number(e.target.value))} min={1} max={10}
                  style={{ padding: "12px 14px", borderRadius: 10, border: "1px solid var(--border-dark)", background: "var(--sand)", fontSize: "0.95rem", color: "var(--ink)", outline: "none" }} />
              </div>
            </div>

            {/* Trip duration badge */}
            {tripDays > 0 && (
              <div style={{ fontSize: "0.82rem", color: "var(--ocean)", textAlign: "center", marginTop: -8 }}>
                {tripDays}-day trip
              </div>
            )}

            {/* Vibe */}
            <div>
              <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 10 }}>
                Trip Vibe
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {VIBES.map(v => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => setVibe(v.key)}
                    style={{
                      padding: "8px 16px", borderRadius: 24, fontSize: "0.88rem",
                      background: vibe === v.key ? "var(--ocean)" : "var(--sand)",
                      color: vibe === v.key ? "#fff" : "var(--ink-2)",
                      border: vibe === v.key ? "1px solid var(--ocean)" : "1px solid var(--border-dark)",
                      cursor: "pointer", transition: "all 0.15s",
                      display: "flex", alignItems: "center", gap: 6,
                    }}
                  >
                    {v.emoji} {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!destination.trim() || loading}
              style={{
                padding: "14px 28px", borderRadius: 12, border: "none",
                background: !destination.trim() ? "var(--border)" : "linear-gradient(135deg, var(--ocean) 0%, #0d4a6b 100%)",
                color: !destination.trim() ? "var(--ink-3)" : "#fff",
                fontSize: "1rem", fontWeight: 600, cursor: !destination.trim() ? "default" : "pointer",
                transition: "all 0.2s",
              }}
            >
              Plan My Trip →
            </button>
          </form>
        )}

        {/* Loading state */}
        {loading && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
              <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
            </div>
            <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", color: "var(--ink)", marginBottom: 8 }} className="pulse">
              Building your trip to {destination}…
            </p>
            <p style={{ fontSize: "0.88rem", color: "var(--ink-3)" }}>
              Searching real flights · Checking accommodation · Crafting your itinerary
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background: "var(--coral-bg)", border: "1px solid rgba(224,92,58,0.2)", borderRadius: 10, padding: "14px 18px", color: "var(--coral)", fontSize: "0.88rem", marginBottom: 20 }}>
            {error}
            <button onClick={() => setError("")} style={{ marginLeft: 12, background: "none", border: "none", color: "var(--coral)", cursor: "pointer", fontSize: "0.82rem", textDecoration: "underline" }}>
              Try again
            </button>
          </div>
        )}

        {/* Result */}
        {plan && (
          <div>
            <button
              onClick={() => { setPlan(null); setError(""); }}
              style={{ marginBottom: 20, background: "none", border: "1px solid var(--border-dark)", borderRadius: 8, padding: "8px 16px", fontSize: "0.85rem", color: "var(--ink-3)", cursor: "pointer" }}
            >
              ← Plan another trip
            </button>
            <PlanView plan={plan} />
          </div>
        )}
      </main>
    </div>
  );
}
