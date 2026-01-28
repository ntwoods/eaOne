import React, { useEffect, useMemo, useRef, useState } from "react";

const DASH_KEY = "EA_DASH_KEY_CHANGE_ME"; // <-- same key you set in Apps Script CONFIG.DASH_KEY
const USER_NAME = "EA01";

const TILES = [
  {
    id: "approve-stagging",
    title: "Approve Stagging List",
    url: "https://ntwoods.github.io/approveStaggingList/",
    api:
      "https://script.google.com/macros/s/AKfycbxqABSJlzRSLLqCaaakAWgoaJgm5Jhbc8Y2bYLAJXubxu7ewajemUmM9dqWPvyOqjQX/exec?action=COUNT_ELIGIBLE&key=" +
      DASH_KEY,
    desc: "Approve eligible stagging list entries quickly and safely.",
    icon: "check"
  },
  {
    id: "lr-rm",
    title: "Marking on LR",
    url: "https://ntwoods.github.io/rmOnLR/",
    api:
      "https://script.google.com/macros/s/AKfycbxxvU0fjC3f5LV3Z6nHtn9Y0d9xuW9m9a3eXSC9_jVlNAcK3cVV9xYRhTt728Lub1ljnQ/exec?action=COUNT_ELIGIBLE&key=" +
      DASH_KEY,
    desc: "See LR/RM pending list and complete marking workflow.",
    icon: "truck"
  }
];

const SUGGESTIONS_URL = "https://ntwoods.github.io/srt/";

function Icon({ name }) {
  const common = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none" };
  const s = { stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };

  if (name === "check") {
    return (
      <svg {...common}>
        <path {...s} d="M9 6h11" />
        <path {...s} d="M9 12h11" />
        <path {...s} d="M9 18h11" />
        <path {...s} d="M4 6l1 1 2-2" />
        <path {...s} d="M4 12l1 1 2-2" />
        <path {...s} d="M4 18l1 1 2-2" />
      </svg>
    );
  }
  if (name === "truck") {
    return (
      <svg {...common}>
        <path {...s} d="M3 7h11v10H3z" />
        <path {...s} d="M14 10h4l3 3v4h-7z" />
        <path {...s} d="M7 19a1.5 1.5 0 1 0 0 .01" />
        <path {...s} d="M18 19a1.5 1.5 0 1 0 0 .01" />
      </svg>
    );
  }
  if (name === "bulb") {
    return (
      <svg {...common}>
        <path {...s} d="M9 18h6" />
        <path {...s} d="M10 22h4" />
        <path {...s} d="M8 14a6 6 0 1 1 8 0c-1.2 1-2 2.2-2 3H10c0-.8-.8-2-2-3z" />
      </svg>
    );
  }
  if (name === "refresh") {
    return (
      <svg {...common}>
        <path {...s} d="M20 12a8 8 0 1 1-2.34-5.66" />
        <path {...s} d="M20 4v6h-6" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path {...s} d="M12 2v20" />
      <path {...s} d="M2 12h20" />
    </svg>
  );
}

function formatTime(d) {
  try {
    return new Date(d).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return "";
  }
}

async function fetchCount(url, { signal } = {}) {
  const res = await fetch(url, { method: "GET", cache: "no-store", signal });
  const json = await res.json();
  if (typeof json?.count === "number") return json.count;
  if (Array.isArray(json)) return json.length;
  if (Array.isArray(json?.data)) return json.data.length;
  if (Array.isArray(json?.items)) return json.items.length;
  return 0;
}

export default function App() {
  const [counts, setCounts] = useState(() => Object.fromEntries(TILES.map(t => [t.id, { status: "idle", count: 0, err: "" }])));
  const [lastUpdated, setLastUpdated] = useState(null);
  const ctrlRef = useRef(null);

  const totalPending = useMemo(() => Object.values(counts).reduce((a, v) => a + (v.count || 0), 0), [counts]);

  const load = async () => {
    if (ctrlRef.current) ctrlRef.current.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;

    setCounts(prev => {
      const next = { ...prev };
      for (const t of TILES) next[t.id] = { ...next[t.id], status: "loading", err: "" };
      return next;
    });

    const results = await Promise.allSettled(TILES.map(async t => {
      const c = await fetchCount(t.api, { signal: ctrl.signal });
      return { id: t.id, count: c };
    }));

    setCounts(prev => {
      const next = { ...prev };
      results.forEach((r, idx) => {
        const id = TILES[idx].id;
        if (r.status === "fulfilled") next[id] = { status: "ok", count: r.value.count, err: "" };
        else next[id] = { status: "error", count: prev[id]?.count ?? 0, err: r.reason?.message || "Fetch failed" };
      });
      return next;
    });

    setLastUpdated(new Date());
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 60000); // auto refresh every 60s
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="app">
      <aside className="sidebar" aria-label="EA Sidebar">
        <div className="brand">
          <div className="brand__logo" aria-hidden="true">EA</div>
          <div>
            <div className="brand__title">EA Portal</div>
            <div className="brand__sub">EA01 • Work Dashboard</div>
          </div>
        </div>

        <div className="navBox">
          <div className="navBox__label">Quick Link</div>
          <button
            className="navBtn"
            type="button"
            onClick={() => (window.location.href = SUGGESTIONS_URL)}
            title="Open Suggestions Preview"
          >
            <span className="navBtn__icon" aria-hidden="true"><Icon name="bulb" /></span>
            <span className="navBtn__text">Suggestions Preview</span>
          </button>

          <div className="navHint">
            Tip: Yeh dashboard sirf count dikhata hai. Tile open karke aap actual portal me kaam kar sakti ho.
            {/* Future: add more sidebar buttons here */}
          </div>
        </div>

        <div className="sidebarFooter">
          <span className="dot" aria-hidden="true"></span>
          <span className="sidebarFooter__txt">NT Woods • Internal</span>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div>
            <h1 className="h1">Welcome, EA01 👋</h1>
            <p className="subtitle">
              Aapke liye quick, clean aur super easy dashboard — pending counts live APIs se aa rahe hain.
            </p>

            <div className="welcome">
              <span className="chip">User: <strong>{USER_NAME}</strong></span>
              <span className="chip">Auto refresh: <strong>60s</strong></span>
              <button className="btn" type="button" onClick={load} title="Refresh counts now">
                <Icon name="refresh" /> Refresh
              </button>
            </div>
          </div>

          <div className="stats">
            <div className="stat">
              <div className="stat__label">Total Pending</div>
              <div className="stat__value">{totalPending}</div>
            </div>
          </div>
        </div>

        <div className="metaRow">
          <div>
            Last updated: <b>{lastUpdated ? formatTime(lastUpdated) : "Loading..."}</b>
          </div>
          <div>
            Theme: White + Blues • High visibility
          </div>
        </div>

        <section className="grid" aria-label="EA Tiles">
          {TILES.map(t => {
            const info = counts[t.id] || { status: "idle", count: 0 };
            const pending = info.count > 0;

            let pill = <span className="pill pill--info">Checking…</span>;
            if (info.status === "error") pill = <span className="pill pill--danger" title={info.err}>API Error</span>;
            else if (info.status === "ok") pill = pending
              ? <span className="pill pill--warn">Pending: {info.count}</span>
              : <span className="pill pill--ok">All Clear</span>;

            return (
              <button
                key={t.id}
                className="tile"
                type="button"
                onClick={() => (window.location.href = t.url)}
                title={`Open: ${t.title}`}
              >
                <div className="tileTop">
                  <div className="tileIcon" aria-hidden="true"><Icon name={t.icon} /></div>
                  <div style={{ flex: "1 1 auto" }}>
                    <div className="tileTitle">{t.title}</div>
                    <div className="tileDesc">{t.desc}</div>
                  </div>
                  <div>{pill}</div>
                </div>

                <div className="tileBottom">
                  <div className="tileUrl">{t.url.replace(/^https?:\/\//, "")}</div>
                  <div className="tileCta">Open →</div>
                </div>
              </button>
            );
          })}
        </section>
      </main>
    </div>
  );
}
