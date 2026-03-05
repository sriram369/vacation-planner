"use client";

import { useState, useRef, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface FlightOffer {
  price: string; duration: string; departs: string; arrives: string;
  stops: number; carrier: string; origin: string; destination: string;
}
interface BudgetTier {
  flight: string; hotel_per_night: string; airbnb_per_night: string;
  food_per_day: string; activities: string; total_estimate: string; notes: string;
}
interface Stay { name: string; type: string; price_range: string; why: string; }
interface Eat  { name: string; cuisine: string; price: string; must_try: string; }
interface DayPlan {
  day: number; title: string; morning: string; afternoon: string; evening: string; tip: string;
}
interface Plan {
  destination: string; tagline: string; overview: string; best_time: string;
  itinerary: DayPlan[];
  budget: { currency: string; budget: BudgetTier; mid_range: BudgetTier; luxury: BudgetTier; };
  top_stays: Stay[]; top_eats: Eat[]; must_do: string[];
  travel_tips: { visa: string; currency: string; transport: string; weather: string; language: string; };
  flights_found: FlightOffer[];
}

type ChatEntry =
  | { role: "user"; text: string }
  | { role: "assistant"; text: string }
  | { role: "plan"; plan: Plan };

const SUGGESTIONS = [
  "I want to go to Bali for a week in July with my girlfriend 🌴",
  "Plan a 10-day Europe trip for 2 people, budget-friendly 🏛️",
  "Surprise me with an adventure trip for 5 days in September 🧗",
  "Tokyo for 7 days, mid-range budget, culture and food vibes 🍜",
];

// ─── Budget Card ──────────────────────────────────────────────
function BudgetCard({ tier, data, label }: { tier: string; data: BudgetTier; label: string }) {
  const colors = {
    budget:    { accent: "var(--green)",  bg: "var(--green-bg)",  emoji: "🟢" },
    mid_range: { accent: "var(--gold)",   bg: "var(--gold-bg)",   emoji: "🟡" },
    luxury:    { accent: "var(--coral)",  bg: "var(--coral-bg)",  emoji: "🔴" },
  }[tier] || { accent: "var(--ocean)", bg: "var(--ocean-bg)", emoji: "⭐" };

  return (
    <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 12, padding: "18px", flex: 1, minWidth: 180, borderTop: `3px solid ${colors.accent}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
        <span>{colors.emoji}</span>
        <span style={{ fontWeight: 600, color: "var(--ink)", fontSize: "0.93rem" }}>{label}</span>
      </div>
      {[
        ["✈️ Flight", data.flight],
        ["🏨 Hotel/night", data.hotel_per_night],
        ["🏠 Airbnb/night", data.airbnb_per_night],
        ["🍽️ Food/day", data.food_per_day],
        ["🎟️ Activities", data.activities],
      ].map(([k, v]) => v && (
        <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", color: "var(--ink-2)", marginBottom: 5 }}>
          <span>{k}</span>
          <span style={{ fontWeight: 500, color: "var(--ink)" }}>{v}</span>
        </div>
      ))}
      <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
          <span style={{ fontSize: "0.85rem" }}>Total</span>
          <span style={{ color: colors.accent }}>{data.total_estimate}</span>
        </div>
        {data.notes && <div style={{ fontSize: "0.75rem", color: "var(--ink-3)", fontStyle: "italic", marginTop: 4 }}>{data.notes}</div>}
      </div>
    </div>
  );
}

// ─── Plan View ────────────────────────────────────────────────
function PlanView({ plan }: { plan: Plan }) {
  const [tab, setTab] = useState<"itinerary" | "budget" | "stays" | "tips">("itinerary");

  return (
    <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)", marginTop: 4 }}>
      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, var(--ocean) 0%, #0d4a6b 100%)", color: "#fff", padding: "28px 32px" }}>
        <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.7, marginBottom: 6 }}>Your Trip Plan</div>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "2.3rem", marginBottom: 6 }}>{plan.destination}</h2>
        {plan.tagline && <p style={{ opacity: 0.85, fontSize: "1rem", maxWidth: 500 }}>{plan.tagline}</p>}
        {plan.best_time && (
          <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.12)", padding: "3px 12px", borderRadius: 20, fontSize: "0.78rem" }}>
            🗓️ {plan.best_time}
          </div>
        )}
      </div>

      {/* Overview */}
      {plan.overview && (
        <div style={{ background: "var(--ocean-bg)", padding: "14px 32px", borderBottom: "1px solid var(--border)" }}>
          <p style={{ color: "var(--ink-2)", fontSize: "0.97rem", lineHeight: 1.75 }}>{plan.overview}</p>
        </div>
      )}

      {/* Flights */}
      {plan.flights_found?.length > 0 && (
        <div style={{ background: "var(--white)", padding: "16px 32px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 10 }}>
            ✈️ Real Flights Found (Google Flights)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {plan.flights_found.map((f, i) => (
              <div key={i} style={{ background: "var(--ocean-bg)", border: "1px solid rgba(26,107,138,0.18)", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <span style={{ fontWeight: 700, color: "var(--ocean)", fontSize: "0.9rem", minWidth: 50 }}>{f.carrier}</span>
                <span style={{ fontWeight: 600, color: "var(--ink)", fontSize: "0.88rem" }}>{f.origin} → {f.destination}</span>
                <span style={{ fontSize: "0.78rem", color: "var(--ink-3)" }}>{f.duration} · {f.stops === 0 ? "Nonstop" : `${f.stops} stop${f.stops > 1 ? "s" : ""}`}</span>
                <span style={{ marginLeft: "auto", fontWeight: 700, color: "var(--coral)" }}>{f.price}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Must Do */}
      {plan.must_do?.length > 0 && (
        <div style={{ background: "var(--sand-dark)", padding: "14px 32px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 8 }}>⭐ Must Do</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {plan.must_do.map((item, i) => (
              <span key={i} style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 20, padding: "4px 12px", fontSize: "0.82rem", color: "var(--ink-2)" }}>
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ background: "var(--white)", display: "flex", borderBottom: "1px solid var(--border)" }}>
        {(["itinerary", "budget", "stays", "tips"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "14px 22px", fontSize: "0.95rem",
            fontWeight: tab === t ? 600 : 400,
            color: tab === t ? "var(--ocean)" : "var(--ink-3)",
            background: "none", border: "none",
            borderBottom: tab === t ? "2px solid var(--ocean)" : "2px solid transparent",
            cursor: "pointer", transition: "all 0.15s", textTransform: "capitalize",
          }}>{t === "stays" ? "Stays & Eats" : t === "tips" ? "Travel Tips" : t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ background: "var(--white)", padding: "24px 32px", minHeight: 200 }}>
        {/* ITINERARY */}
        {tab === "itinerary" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {plan.itinerary?.map((day, i) => (
              <div key={i} style={{ background: "var(--sand)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ background: "var(--ocean)", color: "#fff", borderRadius: "50%", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.78rem", fontWeight: 700, flexShrink: 0 }}>
                    {day.day}
                  </div>
                  <span style={{ fontFamily: "var(--font-serif)", fontSize: "1rem", color: "var(--ink)" }}>{day.title}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingLeft: 36 }}>
                  {[["🌅 Morning", day.morning], ["☀️ Afternoon", day.afternoon], ["🌙 Evening", day.evening]].map(([label, text]) => text && (
                    <div key={String(label)} style={{ display: "flex", gap: 8 }}>
                      <span style={{ fontSize: "0.74rem", fontWeight: 600, color: "var(--ink-3)", whiteSpace: "nowrap", paddingTop: 2, minWidth: 78 }}>{label}</span>
                      <span style={{ fontSize: "0.93rem", color: "var(--ink-2)", lineHeight: 1.65 }}>{text}</span>
                    </div>
                  ))}
                  {day.tip && (
                    <div style={{ marginTop: 4, background: "var(--gold-bg)", border: "1px solid rgba(196,150,10,0.2)", borderRadius: 6, padding: "5px 10px", fontSize: "0.78rem", color: "var(--gold)", display: "flex", gap: 5 }}>
                      <span>💡</span><span>{day.tip}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* BUDGET */}
        {tab === "budget" && plan.budget && (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {plan.budget.budget    && <BudgetCard tier="budget"    data={plan.budget.budget}    label="Budget" />}
            {plan.budget.mid_range && <BudgetCard tier="mid_range" data={plan.budget.mid_range} label="Mid-Range" />}
            {plan.budget.luxury    && <BudgetCard tier="luxury"    data={plan.budget.luxury}    label="Luxury" />}
          </div>
        )}

        {/* STAYS & EATS */}
        {tab === "stays" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {plan.top_stays?.length > 0 && (
              <div>
                <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 10 }}>🏠 Where to Stay</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {plan.top_stays.map((s, i) => (
                    <div key={i} style={{ background: "var(--sand)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", display: "flex", gap: 12 }}>
                      <span style={{ background: "var(--ocean-bg)", color: "var(--ocean)", borderRadius: 6, padding: "4px 8px", fontSize: "0.72rem", fontWeight: 600, whiteSpace: "nowrap", alignSelf: "flex-start" }}>{s.type}</span>
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--ink)", fontSize: "0.88rem" }}>{s.name}</div>
                        <div style={{ fontSize: "0.78rem", color: "var(--ink-3)", marginTop: 2 }}>{s.price_range}/night · {s.why}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {plan.top_eats?.length > 0 && (
              <div>
                <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 10 }}>🍽️ Where to Eat</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
                  {plan.top_eats.map((e, i) => (
                    <div key={i} style={{ background: "var(--sand)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px" }}>
                      <div style={{ fontWeight: 600, color: "var(--ink)", fontSize: "0.87rem" }}>{e.name}</div>
                      <div style={{ fontSize: "0.76rem", color: "var(--ink-3)", marginTop: 2 }}>{e.cuisine} · {e.price}</div>
                      {e.must_try && <div style={{ fontSize: "0.75rem", color: "var(--coral)", marginTop: 4 }}>Try: {e.must_try}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TIPS */}
        {tab === "tips" && plan.travel_tips && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
            {[
              { icon: "🛂", label: "Visa", text: plan.travel_tips.visa },
              { icon: "💵", label: "Currency", text: plan.travel_tips.currency },
              { icon: "🚌", label: "Transport", text: plan.travel_tips.transport },
              { icon: "🌤️", label: "Weather", text: plan.travel_tips.weather },
              { icon: "🗣️", label: "Language", text: plan.travel_tips.language },
            ].filter(t => t.text).map(({ icon, label, text }) => (
              <div key={label} style={{ background: "var(--sand)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px" }}>
                <div style={{ fontWeight: 600, color: "var(--ink)", fontSize: "0.85rem", marginBottom: 5 }}>{icon} {label}</div>
                <p style={{ fontSize: "0.82rem", color: "var(--ink-2)", lineHeight: 1.6 }}>{text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function Home() {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<ChatEntry[]>([]);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const hasStarted = history.length > 0 || loading;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const msg = text.trim();
    setInput("");
    setLoading(true);

    setHistory(h => [...h, { role: "user", text: msg }]);

    try {
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          history: history.filter(e => e.role !== "plan").map(e => ({
            role: e.role,
            content: e.role === "user" ? e.text : (e as {role:"assistant";text:string}).text,
          })),
          existing_plan: currentPlan || null,
        }),
      });

      const data = await res.json();

      if (data.type === "plan") {
        setCurrentPlan(data.plan);
        setHistory(h => [...h, { role: "plan", plan: data.plan }]);
      } else {
        setHistory(h => [...h, { role: "assistant", text: data.text || "Let me know more about your trip!" }]);
      }
    } catch {
      setHistory(h => [...h, { role: "assistant", text: "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{ padding: "20px 40px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ fontFamily: "var(--font-serif)", fontSize: "1.9rem", color: "var(--ink)" }}>Wandr</span>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ocean)", background: "var(--ocean-bg)", padding: "3px 10px", borderRadius: 20 }}>
            AI Planner
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {hasStarted && (
            <button onClick={() => { setHistory([]); setCurrentPlan(null); setInput(""); }}
              style={{ fontSize: "0.8rem", color: "var(--ink-3)", background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>
              New trip
            </button>
          )}
          <a href="https://github.com/sriram369/vacation-planner" target="_blank" rel="noopener noreferrer"
            style={{ fontSize: "0.8rem", color: "var(--ink-3)", textDecoration: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 12px" }}>
            GitHub ↗
          </a>
        </div>
      </header>

      {/* Chat area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 40px" }}>
        {/* Landing state */}
        {!hasStarted && (
          <div style={{ maxWidth: 680, margin: "0 auto", paddingTop: 60, paddingBottom: 20 }}>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(2.2rem, 5vw, 3.2rem)", color: "var(--ink)", textAlign: "center", marginBottom: 14 }}>
              Where do you want to go?
            </h1>
            <p style={{ color: "var(--ink-3)", fontSize: "1.05rem", textAlign: "center", marginBottom: 36 }}>
              Just tell me. One message → full itinerary, real flights, budget breakdown.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => send(s)}
                  style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 18px", textAlign: "left", fontSize: "0.95rem", color: "var(--ink-2)", cursor: "pointer", transition: "all 0.15s", lineHeight: 1.55 }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--ocean)")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat history */}
        {hasStarted && (
          <div style={{ maxWidth: 780, margin: "0 auto", paddingTop: 28, paddingBottom: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            {history.map((entry, i) => {
              if (entry.role === "user") return (
                <div key={i} style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div style={{ background: "var(--ocean)", color: "#fff", borderRadius: "18px 18px 4px 18px", padding: "12px 18px", maxWidth: "75%", fontSize: "1rem", lineHeight: 1.65 }}>
                    {entry.text}
                  </div>
                </div>
              );
              if (entry.role === "assistant") return (
                <div key={i} style={{ display: "flex", justifyContent: "flex-start" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start", maxWidth: "75%" }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--ocean-bg)", border: "1px solid rgba(26,107,138,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", flexShrink: 0 }}>
                      ✈️
                    </div>
                    <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "18px 18px 18px 4px", padding: "12px 18px", fontSize: "1rem", lineHeight: 1.65, color: "var(--ink)" }}>
                      {entry.text}
                    </div>
                  </div>
                </div>
              );
              if (entry.role === "plan") return (
                <div key={i} className="animate-fade-up">
                  <PlanView plan={entry.plan} />
                  <div style={{ marginTop: 10, fontSize: "0.8rem", color: "var(--ink-3)", textAlign: "center" }}>
                    💬 Ask to refine — "make it cheaper", "swap Tokyo for Kyoto", "add more beach days"
                  </div>
                </div>
              );
              return null;
            })}

            {loading && (
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--ocean-bg)", border: "1px solid rgba(26,107,138,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}>
                  ✈️
                </div>
                <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "18px 18px 18px 4px", padding: "12px 18px", display: "flex", gap: 6, alignItems: "center" }}>
                  <div className="spinner" />
                  <span style={{ fontSize: "0.95rem", color: "var(--ink-3)" }} className="pulse">
                    {currentPlan ? "Refining your plan…" : "Searching flights, accommodation, building your plan…"}
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input bar — always visible at bottom */}
      <div style={{ padding: "16px 40px 24px", borderTop: hasStarted ? "1px solid var(--border)" : "none", background: "var(--sand)", flexShrink: 0 }}>
        <div style={{ maxWidth: 780, margin: "0 auto", position: "relative" }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={currentPlan ? "Refine your plan — make it cheaper, change destination, add days…" : "Tell me about your dream trip…"}
            disabled={loading}
            style={{
              width: "100%", padding: "14px 52px 14px 18px",
              borderRadius: 14, border: "1.5px solid var(--border-dark)",
              background: "var(--white)", fontSize: "1.05rem", color: "var(--ink)",
              outline: "none", resize: "none", lineHeight: 1.5,
              fontFamily: "var(--font-sans)",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            }}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            style={{
              position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
              width: 34, height: 34, borderRadius: 10, border: "none",
              background: !input.trim() || loading ? "var(--border)" : "var(--ocean)",
              color: !input.trim() || loading ? "var(--ink-3)" : "#fff",
              cursor: !input.trim() || loading ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1rem", transition: "all 0.15s",
            }}
          >
            →
          </button>
        </div>
        {!hasStarted && (
          <div style={{ textAlign: "center", marginTop: 10, fontSize: "0.76rem", color: "var(--ink-3)" }}>
            Press Enter to send · Real flights via Google Flights · Powered by Claude
          </div>
        )}
      </div>
    </div>
  );
}
