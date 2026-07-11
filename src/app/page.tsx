"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Channel = "whatsapp" | "instagram" | "facebook";
type ConvStatus = "New" | "Open" | "Resolved";

type Message = { from: "me" | "them"; text: string };

type Conversation = {
  id: number;
  name: string;
  channel: Channel;
  time: string;
  unread: number;
  priority: boolean;
  social: boolean;
  status: ConvStatus;
  notes: string;
  messages: Message[];
};

function buildMask(innerSvg: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>${innerSvg}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const CHANNEL_META: Record<
  Channel,
  { label: string; accent: string; avatarBg: string; iconMask: string; desc: string }
> = {
  whatsapp: {
    label: "WhatsApp",
    accent: "#25D366",
    avatarBg: "#25D366",
    desc: "Chats and customer messages",
    iconMask: buildMask(
      "<path d='M4 4h16a2 2 0 012 2v9a2 2 0 01-2 2H10l-5 4v-4H4a2 2 0 01-2-2V6a2 2 0 012-2z'/>"
    ),
  },
  instagram: {
    label: "Instagram",
    accent: "#E1306C",
    avatarBg: "linear-gradient(135deg, #F58529 0%, #DD2A7B 55%, #8134AF 100%)",
    desc: "Direct messages and comments",
    iconMask: buildMask(
      "<path fill-rule='evenodd' clip-rule='evenodd' d='M3 6a2 2 0 012-2h3l1-1h6l1 1h3a2 2 0 012 2v13a2 2 0 01-2 2H5a2 2 0 01-2-2V6zm9 3a4 4 0 100 8 4 4 0 000-8zm0 2a2 2 0 110 4 2 2 0 010-4z'/>"
    ),
  },
  facebook: {
    label: "Facebook",
    accent: "#1877F2",
    avatarBg: "#1877F2",
    desc: "Page messages and inbox",
    iconMask: buildMask(
      "<path d='M12 4a4 4 0 110 8 4 4 0 010-8zm0 10c4.4 0 8 2.2 8 6v1H4v-1c0-3.8 3.6-6 8-6z'/>"
    ),
  },
};

const STATUS_COLOR: Record<ConvStatus, string> = {
  New: "#E1306C",
  Open: "#25D366",
  Resolved: "rgba(235,235,245,0.45)",
};

const QUICK_REPLIES = [
  "Thanks for reaching out! How can we help?",
  "Our team will get back to you shortly.",
  "Here's more info about our services.",
];

const INITIAL_CONVERSATIONS: Conversation[] = [];

export default function Home() {
  const [view, setView] = useState<"splash" | "app">("splash");
  const [tab, setTab] = useState<"inbox" | "dashboard" | "channels">("inbox");
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [expandedSection, setExpandedSection] = useState<string | null>("priority");
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [typingConvId, setTypingConvId] = useState<number | null>(null);
  const [channelsConnected, setChannelsConnected] = useState({
    whatsapp: true,
    instagram: true,
    facebook: true,
  });
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);

  const splashTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const replyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    splashTimer.current = setTimeout(() => setView("app"), 1700);
    return () => {
      clearTimeout(splashTimer.current);
      clearTimeout(replyTimer.current);
      clearTimeout(toastTimer.current);
    };
  }, []);

  const goToTab = useCallback((t: "inbox" | "dashboard" | "channels") => {
    setTab(t);
    setActiveConvId(null);
    setSearchQuery("");
    setChannelFilter("all");
  }, []);

  const openConversation = useCallback((id: number) => {
    setActiveConvId(id);
    setStatusMenuOpen(false);
    setDraft("");
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c))
    );
  }, []);

  const closeConversation = useCallback(() => {
    setActiveConvId(null);
    setStatusMenuOpen(false);
  }, []);

  const updateConv = useCallback((id: number, updater: (c: Conversation) => Conversation) => {
    setConversations((prev) => prev.map((c) => (c.id === id ? updater(c) : c)));
  }, []);

  const sendText = useCallback(
    (text: string) => {
      if (!activeConvId || !text.trim()) return;
      updateConv(activeConvId, (c) => ({
        ...c,
        messages: [...c.messages, { from: "me" as const, text: text.trim() }],
        unread: 0,
      }));
      setDraft("");
      setTypingConvId(activeConvId);
      clearTimeout(replyTimer.current);
      replyTimer.current = setTimeout(() => {
        updateConv(activeConvId, (c) => ({
          ...c,
          messages: [
            ...c.messages,
            { from: "them" as const, text: "Thanks for the quick reply, appreciate it!" },
          ],
        }));
        setTypingConvId((prev) => (prev === activeConvId ? null : prev));
      }, 1400);
    },
    [activeConvId, updateConv]
  );

  const sendDraft = useCallback(() => sendText(draft), [draft, sendText]);

  const setStatus = useCallback(
    (status: ConvStatus) => {
      if (!activeConvId) return;
      updateConv(activeConvId, (c) => ({ ...c, status }));
      setStatusMenuOpen(false);
    },
    [activeConvId, updateConv]
  );

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2000);
  }, []);

  const toggleChannel = useCallback((key: Channel) => {
    setChannelsConnected((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const toggleSection = useCallback((key: string) => {
    setExpandedSection((prev) => (prev === key ? null : key));
  }, []);

  // Derived data
  const enriched = conversations.map((c) => {
    const m = CHANNEL_META[c.channel];
    return {
      ...c,
      channelLabel: m.label,
      channelAccent: m.accent,
      avatarBg: m.avatarBg,
      iconMask: m.iconMask,
      statusColor: STATUS_COLOR[c.status],
      lastMessageText: c.messages[c.messages.length - 1].text,
    };
  });

  const searchLower = searchQuery.trim().toLowerCase();
  const inboxList = enriched.filter((c) => {
    const matchFilter = channelFilter === "all" || c.channel === channelFilter;
    const matchSearch =
      !searchLower ||
      c.name.toLowerCase().includes(searchLower) ||
      c.lastMessageText.toLowerCase().includes(searchLower);
    return matchFilter && matchSearch;
  });

  const priorityList = enriched.filter((c) => c.priority);
  const unreadList = enriched.filter((c) => c.unread > 0 && !c.social);
  const socialList = enriched.filter((c) => c.social);
  const totalUnread = enriched.reduce((sum, c) => sum + c.unread, 0);
  const openCount = enriched.filter((c) => c.status === "Open").length;

  const currentConv = activeConvId ? enriched.find((c) => c.id === activeConvId) ?? null : null;

  const channelsList = (["whatsapp", "instagram", "facebook"] as Channel[]).map((key) => {
    const m = CHANNEL_META[key];
    const connected = channelsConnected[key];
    return {
      key,
      label: m.label,
      desc: m.desc,
      avatarBg: m.avatarBg,
      iconMask: m.iconMask,
      accent: m.accent,
      connected,
      trackBg: connected ? m.accent : "rgba(255,255,255,0.12)",
      knobX: connected ? "translateX(19px)" : "translateX(1px)",
    };
  });
  const channelsConnectedCount = channelsList.filter((c) => c.connected).length;

  const filterChips = [
    { key: "all", label: "All", active: channelFilter === "all", accent: undefined },
    { key: "whatsapp", label: "WhatsApp", active: channelFilter === "whatsapp", accent: "#25D366" },
    { key: "instagram", label: "Instagram", active: channelFilter === "instagram", accent: "#E1306C" },
    { key: "facebook", label: "Facebook", active: channelFilter === "facebook", accent: "#1877F2" },
  ].map((chip) => ({
    ...chip,
    bg: chip.active ? (chip.accent ?? "rgba(235,235,245,0.9)") : "rgba(255,255,255,0.05)",
    color: chip.active ? (chip.key === "all" ? "#05060A" : "#FFFFFF") : "rgba(235,235,245,0.75)",
    border: chip.active ? "transparent" : "rgba(255,255,255,0.08)",
  }));

  const activeTabColor = "#1877F2";
  const inactiveTabColor = "rgba(235,235,245,0.4)";
  const inboxTabColor = view === "app" && !currentConv && tab === "inbox" ? activeTabColor : inactiveTabColor;
  const dashboardTabColor = view === "app" && !currentConv && tab === "dashboard" ? activeTabColor : inactiveTabColor;
  const channelsTabColor = view === "app" && !currentConv && tab === "channels" ? activeTabColor : inactiveTabColor;

  const bg: React.CSSProperties = {
    height: "100dvh",
    width: "100%",
    position: "relative",
    background: "linear-gradient(180deg, #121620 0%, #0A0D12 55%)",
    overflow: "hidden",
    fontFamily: "'Nunito', -apple-system, system-ui, sans-serif",
  };

  // ── SPLASH ──────────────────────────────────────────────────────────────────
  if (view === "splash") {
    return (
      <div
        style={{
          ...bg,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: 32,
          textAlign: "center",
          background:
            "radial-gradient(circle at 18% 18%, rgba(225,48,108,0.35) 0%, transparent 42%), " +
            "radial-gradient(circle at 88% 22%, rgba(37,211,102,0.3) 0%, transparent 42%), " +
            "radial-gradient(circle at 50% 92%, rgba(24,119,242,0.3) 0%, transparent 50%), #05070B",
          animation: "sp-fade-in 0.3s ease both",
        }}
      >
        <div
          style={{
            width: 104,
            height: 104,
            borderRadius: 32,
            background: "#1a1d2e",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 20px 44px rgba(0,0,0,0.55)",
            fontSize: 48,
          }}
        >
          📨
        </div>
        <div
          style={{
            fontFamily: "'Quicksand', sans-serif",
            fontWeight: 800,
            fontSize: 30,
            letterSpacing: "-0.5px",
            marginTop: 6,
          }}
        >
          <span style={{ color: "#F5F6F8" }}>Single</span>
          <span style={{ color: "#1877F2" }}>Panel</span>
        </div>
        <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 15, color: "rgba(235,235,245,0.55)" }}>
          All messages. One panel.
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 36 }}>
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#E1306C",
              animation: "sp-pulse 1.2s ease-in-out infinite",
            }}
          />
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#25D366",
              animation: "sp-pulse 1.2s ease-in-out infinite 0.15s",
            }}
          />
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#1877F2",
              animation: "sp-pulse 1.2s ease-in-out infinite 0.3s",
            }}
          />
        </div>
      </div>
    );
  }

  // ── CONVERSATION VIEW ────────────────────────────────────────────────────────
  if (currentConv) {
    return (
      <div style={{ ...bg, display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "54px 16px 14px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            flexShrink: 0,
          }}
        >
          <button
            onClick={closeConversation}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.07)",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <svg width="10" height="16" viewBox="0 0 10 16">
              <path d="M9 1L2 8l7 7" stroke="#F5F6F8" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: currentConv.avatarBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
            }}
          >
            <div
              style={{
                width: 19,
                height: 19,
                background: "#fff",
                maskImage: currentConv.iconMask,
                WebkitMaskImage: currentConv.iconMask,
                maskSize: "contain",
                WebkitMaskSize: "contain",
                maskRepeat: "no-repeat",
                WebkitMaskRepeat: "no-repeat",
                maskPosition: "center",
                WebkitMaskPosition: "center",
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#F5F6F8" }}>{currentConv.name}</div>
            <div style={{ fontSize: 12, color: currentConv.channelAccent }}>{currentConv.channelLabel}</div>
          </div>
          <div
            style={{
              padding: "4px 10px",
              borderRadius: 100,
              background: "rgba(255,255,255,0.07)",
              flexShrink: 0,
            }}
          >
            <span style={{ fontWeight: 600, fontSize: 11, color: currentConv.statusColor }}>
              {currentConv.status}
            </span>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflow: "auto", padding: "18px 16px 0" }} className="no-scrollbar">
          {currentConv.messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: msg.from === "me" ? "flex-end" : "flex-start",
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  maxWidth: "75%",
                  padding: "11px 14px",
                  borderRadius: 22,
                  background: msg.from === "me" ? currentConv.channelAccent : "#1B212B",
                  color: msg.from === "me" ? "#FFFFFF" : "#F1F2F5",
                  fontSize: 14.5,
                  lineHeight: 1.4,
                }}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {typingConvId === currentConv.id && (
            <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 10 }}>
              <div
                style={{
                  display: "flex",
                  gap: 4,
                  padding: "13px 16px",
                  borderRadius: 22,
                  background: "#1B212B",
                }}
              >
                {[0, 0.15, 0.3].map((delay, i) => (
                  <div
                    key={i}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "rgba(235,235,245,0.6)",
                      animation: `sp-dot 1s ease-in-out infinite ${delay}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {currentConv.notes ? (
            <div
              style={{
                margin: "10px 0 14px",
                padding: "14px 16px",
                background: "#141922",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: 22,
                borderLeft: "3px solid #25D366",
                boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 13, color: "#F5F6F8", marginBottom: 4 }}>Notes</div>
              <div style={{ fontSize: 13, color: "rgba(235,235,245,0.6)", lineHeight: 1.4 }}>{currentConv.notes}</div>
            </div>
          ) : null}

          {/* Status card */}
          <div
            style={{
              margin: "0 0 14px",
              padding: "14px 16px",
              background: "#141922",
              border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: 22,
              borderLeft: "3px solid #1877F2",
              boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
            }}
          >
            <button
              onClick={() => setStatusMenuOpen((v) => !v)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                width: "100%",
                background: "none",
                border: "none",
                padding: 0,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 13, color: "#F5F6F8" }}>Status</div>
              <svg width="8" height="14" viewBox="0 0 8 14">
                <path d="M1 1l6 6-6 6" stroke="rgba(235,235,245,0.4)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div style={{ marginTop: 8, fontWeight: 600, fontSize: 14, color: currentConv.statusColor }}>
              {currentConv.status}
            </div>
            {statusMenuOpen && (
              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                {(["New", "Open", "Resolved"] as ConvStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 16,
                      background: "rgba(255,255,255,0.05)",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 13.5,
                      color: "#F5F6F8",
                      textAlign: "left",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Replies */}
          <div
            style={{
              margin: "0 0 120px",
              padding: "14px 16px",
              background: "#141922",
              border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: 22,
              borderLeft: "3px solid #E1306C",
              boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 13, color: "#F5F6F8", marginBottom: 8 }}>Quick Replies</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {QUICK_REPLIES.map((text, i) => (
                <button
                  key={i}
                  onClick={() => sendText(text)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 16,
                    background: "rgba(255,255,255,0.05)",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13.5,
                    color: "rgba(235,235,245,0.85)",
                    textAlign: "left",
                  }}
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Input */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "10px 16px 34px",
            display: "flex",
            gap: 10,
            alignItems: "center",
            background: "linear-gradient(180deg, rgba(10,13,18,0) 0%, #0A0D12 35%)",
          }}
        >
          <input
            type="text"
            placeholder="Type a reply..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); sendDraft(); } }}
            style={{
              flex: 1,
              background: "#141922",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 22,
              padding: "12px 16px",
              color: "#F5F6F8",
              fontSize: 15,
              outline: "none",
            }}
          />
          <button
            onClick={sendDraft}
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: currentConv.channelAccent,
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
              boxShadow: "0 6px 16px rgba(0,0,0,0.35)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <polygon points="6,4 20,12 6,20" fill="#fff" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // ── MAIN APP (TABS) ──────────────────────────────────────────────────────────
  return (
    <div style={{ ...bg, display: "flex", flexDirection: "column" }}>
      {/* Tab content */}
      <div style={{ flex: 1, overflow: "auto", paddingBottom: 106 }} className="no-scrollbar">

        {/* ── INBOX TAB ── */}
        {tab === "inbox" && (
          <>
            <div style={{ padding: "54px 20px 6px" }}>
              <div style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 800, fontSize: 30, color: "#F5F6F8" }}>
                Inbox
              </div>
              <div style={{ fontSize: 14, color: "rgba(235,235,245,0.5)", marginTop: 2 }}>
                {totalUnread} unread across all channels
              </div>
            </div>

            <div style={{ padding: "10px 20px" }}>
              <input
                type="text"
                placeholder="Search conversations"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  background: "#141922",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 20,
                  padding: "12px 14px",
                  color: "#F5F6F8",
                  fontSize: 15,
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 8, padding: "2px 20px 16px", overflowX: "auto" }} className="no-scrollbar">
              {filterChips.map((chip) => (
                <button
                  key={chip.key}
                  onClick={() => setChannelFilter(chip.key)}
                  style={{
                    flexShrink: 0,
                    padding: "8px 16px",
                    borderRadius: 100,
                    background: chip.bg,
                    border: `1px solid ${chip.border}`,
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 13,
                    color: chip.color,
                    whiteSpace: "nowrap",
                  }}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {inboxList.length === 0 && (
              <div style={{ padding: "60px 32px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 40, opacity: 0.3 }}>📭</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(235,235,245,0.5)" }}>
                  {searchQuery || channelFilter !== "all" ? "No conversations found" : "No messages yet"}
                </div>
                <div style={{ fontSize: 13, color: "rgba(235,235,245,0.3)", lineHeight: 1.5 }}>
                  {searchQuery || channelFilter !== "all"
                    ? "Try a different filter or search term"
                    : "Messages from WhatsApp, Instagram and Facebook will appear here"}
                </div>
              </div>
            )}

            <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 10 }}>
              {inboxList.map((item) => (
                <button
                  key={item.id}
                  onClick={() => openConversation(item.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: 14,
                    background: "#141922",
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: 22,
                    cursor: "pointer",
                    boxShadow: "0 6px 16px rgba(0,0,0,0.22)",
                    textAlign: "left",
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: "50%",
                      background: item.avatarBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        background: "#fff",
                        maskImage: item.iconMask,
                        WebkitMaskImage: item.iconMask,
                        maskSize: "contain",
                        WebkitMaskSize: "contain",
                        maskRepeat: "no-repeat",
                        WebkitMaskRepeat: "no-repeat",
                        maskPosition: "center",
                        WebkitMaskPosition: "center",
                      }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 15.5, color: "#F5F6F8" }}>{item.name}</span>
                      <span style={{ fontSize: 12, color: "rgba(235,235,245,0.4)", flexShrink: 0 }}>{item.time}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 2 }}>
                      <span
                        style={{
                          fontSize: 13.5,
                          color: "rgba(235,235,245,0.55)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.lastMessageText}
                      </span>
                      {item.unread > 0 && (
                        <span
                          style={{
                            flexShrink: 0,
                            minWidth: 18,
                            height: 18,
                            padding: "0 5px",
                            borderRadius: 14,
                            background: item.channelAccent,
                            color: "#fff",
                            fontWeight: 700,
                            fontSize: 11,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {item.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── DASHBOARD TAB ── */}
        {tab === "dashboard" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "54px 20px 4px" }}>
              <div style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 800, fontSize: 26, color: "#F5F6F8" }}>
                Dashboard
              </div>
            </div>
            <div style={{ padding: "0 20px 18px", fontSize: 14, color: "rgba(235,235,245,0.5)" }}>
              Today's overview
            </div>

            {/* Stats row */}
            <div style={{ display: "flex", gap: 10, padding: "0 20px 18px" }}>
              {[
                { val: totalUnread, color: "#E1306C", label: "New messages" },
                { val: openCount, color: "#25D366", label: "Open replies" },
                { val: channelsConnectedCount, color: "#1877F2", label: "Channels" },
              ].map((stat, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    background: "#141922",
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: 22,
                    padding: "14px 10px",
                    textAlign: "center",
                    boxShadow: "0 6px 16px rgba(0,0,0,0.22)",
                  }}
                >
                  <div style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 800, fontSize: 22, color: stat.color }}>
                    {stat.val}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(235,235,245,0.5)", marginTop: 2 }}>{stat.label}</div>
                </div>
              ))}
            </div>

            <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Priority */}
              <DashSection
                icon={<span style={{ fontFamily: "'Quicksand',sans-serif", fontWeight: 800, fontSize: 15, color: "#E1306C" }}>!</span>}
                iconBg="rgba(225,48,108,0.18)"
                title="Priority"
                subtitle="Urgent and important messages"
                count={priorityList.length}
                countColor="#E1306C"
                isOpen={expandedSection === "priority"}
                onToggle={() => toggleSection("priority")}
              >
                {priorityList.map((item) => (
                  <DashItem key={item.id} item={item} onClick={() => openConversation(item.id)} />
                ))}
              </DashSection>

              {/* Unread */}
              <DashSection
                icon={<div style={{ width: 9, height: 9, borderRadius: "50%", background: "#25D366" }} />}
                iconBg="rgba(37,211,102,0.18)"
                title="Unread"
                subtitle="All unread messages"
                count={unreadList.length}
                countColor="#25D366"
                isOpen={expandedSection === "unread"}
                onToggle={() => toggleSection("unread")}
              >
                {unreadList.map((item) => (
                  <DashItem key={item.id} item={item} onClick={() => openConversation(item.id)} />
                ))}
              </DashSection>

              {/* Social */}
              <DashSection
                icon={<div style={{ width: 9, height: 9, borderRadius: "50%", background: "#1877F2" }} />}
                iconBg="rgba(24,119,242,0.18)"
                title="Social"
                subtitle="Social media messages"
                count={socialList.length}
                countColor="#1877F2"
                isOpen={expandedSection === "social"}
                onToggle={() => toggleSection("social")}
              >
                {socialList.map((item) => (
                  <DashItem key={item.id} item={item} onClick={() => openConversation(item.id)} />
                ))}
              </DashSection>

              {/* Archive */}
              <DashSection
                icon={
                  <div style={{ width: 16, height: 11, border: "1.5px solid rgba(235,235,245,0.5)", borderRadius: 2 }} />
                }
                iconBg="rgba(255,255,255,0.06)"
                title="Archive"
                subtitle="Archived conversations"
                count={12}
                countColor="rgba(235,235,245,0.5)"
                isOpen={expandedSection === "archive"}
                onToggle={() => toggleSection("archive")}
              >
                <div style={{ padding: "0 16px 16px", fontSize: 13, color: "rgba(235,235,245,0.5)", lineHeight: 1.5 }}>
                  Archived conversations are hidden from your inbox but stay fully searchable anytime.
                </div>
              </DashSection>
            </div>
          </>
        )}

        {/* ── CHANNELS TAB ── */}
        {tab === "channels" && (
          <>
            <div style={{ padding: "54px 20px 4px" }}>
              <div style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 800, fontSize: 30, color: "#F5F6F8" }}>
                Channels
              </div>
            </div>
            <div style={{ padding: "0 20px 18px", fontSize: 14, color: "rgba(235,235,245,0.5)" }}>
              Manage your connected accounts
            </div>

            <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 10 }}>
              {channelsList.map((ch) => (
                <div
                  key={ch.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: 14,
                    background: "#141922",
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: 22,
                    boxShadow: "0 6px 16px rgba(0,0,0,0.22)",
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background: ch.avatarBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: 21,
                        height: 21,
                        background: "#fff",
                        maskImage: ch.iconMask,
                        WebkitMaskImage: ch.iconMask,
                        maskSize: "contain",
                        WebkitMaskSize: "contain",
                        maskRepeat: "no-repeat",
                        WebkitMaskRepeat: "no-repeat",
                        maskPosition: "center",
                        WebkitMaskPosition: "center",
                      }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15.5, color: "#F5F6F8" }}>{ch.label}</div>
                    <div style={{ fontSize: 12.5, color: "rgba(235,235,245,0.45)" }}>{ch.desc}</div>
                  </div>
                  <button
                    onClick={() => toggleChannel(ch.key as Channel)}
                    style={{
                      width: 46,
                      height: 28,
                      borderRadius: 20,
                      background: ch.trackBg,
                      position: "relative",
                      cursor: "pointer",
                      flexShrink: 0,
                      border: "none",
                      transition: "background 0.2s ease",
                    }}
                  >
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: "#F5F6F8",
                        position: "absolute",
                        top: 3,
                        transform: ch.knobX,
                        boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                        transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1)",
                      }}
                    />
                  </button>
                </div>
              ))}
            </div>

            <div style={{ padding: "16px 20px 0" }}>
              <button
                onClick={() => showToast("More channels coming soon")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: 14,
                  borderRadius: 22,
                  border: "1.5px dashed rgba(235,235,245,0.2)",
                  background: "none",
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                <span style={{ fontFamily: "'Quicksand',sans-serif", fontWeight: 700, fontSize: 16, color: "rgba(235,235,245,0.6)" }}>+</span>
                <span style={{ fontWeight: 600, fontSize: 14, color: "rgba(235,235,245,0.6)" }}>Add another channel</span>
              </button>
            </div>

            <div
              style={{
                margin: "20px 20px 0",
                padding: "14px 16px",
                background: "#141922",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: 22,
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                boxShadow: "0 6px 16px rgba(0,0,0,0.22)",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 14,
                  background: "rgba(37,211,102,0.18)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24">
                  <path d="M5 12l5 5L20 7" stroke="#25D366" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#F5F6F8", marginBottom: 2 }}>Your data is secure</div>
                <div style={{ fontSize: 12.5, color: "rgba(235,235,245,0.45)", lineHeight: 1.4 }}>
                  We use industry-standard encryption to keep your data safe and private.
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "absolute",
            bottom: 106,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "10px 18px",
            background: "rgba(30,32,38,0.95)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 100,
            animation: "sp-fade-in 0.2s ease both",
          }}
        >
          <span style={{ fontSize: 13, color: "#F5F6F8", whiteSpace: "nowrap" }}>{toast}</span>
        </div>
      )}

      {/* Bottom Tab Bar */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          display: "flex",
          padding: "10px 12px 30px",
          background: "rgba(12,15,20,0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <TabBtn
          onClick={() => goToTab("inbox")}
          color={inboxTabColor}
          label="Inbox"
          icon={
            <svg width="22" height="22" viewBox="0 0 22 22">
              <rect x="2" y="4" width="18" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <path d="M2 6l9 6 9-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />
        <TabBtn
          onClick={() => goToTab("dashboard")}
          color={dashboardTabColor}
          label="Dashboard"
          icon={
            <svg width="22" height="22" viewBox="0 0 22 22">
              <rect x="2" y="2" width="8" height="8" rx="2" fill="currentColor" />
              <rect x="12" y="2" width="8" height="8" rx="2" fill="currentColor" opacity="0.5" />
              <rect x="2" y="12" width="8" height="8" rx="2" fill="currentColor" opacity="0.5" />
              <rect x="12" y="12" width="8" height="8" rx="2" fill="currentColor" />
            </svg>
          }
        />
        <TabBtn
          onClick={() => goToTab("channels")}
          color={channelsTabColor}
          label="Channels"
          icon={
            <svg width="22" height="22" viewBox="0 0 22 22">
              <circle cx="7" cy="8" r="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <circle cx="15" cy="8" r="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <circle cx="11" cy="15" r="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          }
        />
      </div>
    </div>
  );
}

function TabBtn({
  onClick,
  color,
  label,
  icon,
}: {
  onClick: () => void;
  color: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        cursor: "pointer",
        color,
        background: "none",
        border: "none",
        padding: 0,
        transition: "color 0.15s ease",
      }}
    >
      {icon}
      <span style={{ fontWeight: 600, fontSize: 11 }}>{label}</span>
    </button>
  );
}

function DashSection({
  icon,
  iconBg,
  title,
  subtitle,
  count,
  countColor,
  isOpen,
  onToggle,
  children,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  count: number;
  countColor: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "#141922",
        border: "1px solid rgba(255,255,255,0.05)",
        borderRadius: 26,
        overflow: "hidden",
        boxShadow: "0 6px 16px rgba(0,0,0,0.22)",
      }}
    >
      <button
        onClick={onToggle}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: 16,
          cursor: "pointer",
          width: "100%",
          background: "none",
          border: "none",
          textAlign: "left",
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 16,
            background: iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#F5F6F8" }}>{title}</div>
          <div style={{ fontSize: 12, color: "rgba(235,235,245,0.45)" }}>{subtitle}</div>
        </div>
        <span style={{ fontWeight: 700, fontSize: 13, color: countColor, marginRight: 6 }}>{count}</span>
        <svg
          width="8"
          height="14"
          viewBox="0 0 8 14"
          style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s ease", flexShrink: 0 }}
        >
          <path d="M1 1l6 6-6 6" stroke="rgba(235,235,245,0.4)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {isOpen && <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 12px 12px" }}>{children}</div>}
    </div>
  );
}

type EnrichedConv = Conversation & {
  channelLabel: string;
  channelAccent: string;
  avatarBg: string;
  iconMask: string;
  statusColor: string;
  lastMessageText: string;
};

function DashItem({
  item,
  onClick,
}: {
  item: EnrichedConv;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: 10,
        background: "rgba(255,255,255,0.03)",
        borderRadius: 18,
        cursor: "pointer",
        border: "none",
        width: "100%",
        textAlign: "left",
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          background: item.avatarBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 16,
            height: 16,
            background: "#fff",
            maskImage: item.iconMask,
            WebkitMaskImage: item.iconMask,
            maskSize: "contain",
            WebkitMaskSize: "contain",
            maskRepeat: "no-repeat",
            WebkitMaskRepeat: "no-repeat",
            maskPosition: "center",
            WebkitMaskPosition: "center",
          }}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: "#F5F6F8" }}>{item.name}</div>
        <div
          style={{
            fontSize: 12,
            color: "rgba(235,235,245,0.5)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {item.lastMessageText}
        </div>
      </div>
      <span style={{ fontSize: 11, color: "rgba(235,235,245,0.4)", flexShrink: 0 }}>{item.time}</span>
    </button>
  );
}

