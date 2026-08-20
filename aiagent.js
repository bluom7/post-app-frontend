const { useState, useRef, useEffect, useCallback } = React;

/**
 * AI Agent screen for POST app — v2
 * - Streams replies live (SSE) from /api/ai/chat/stream, falls back to /api/ai/chat
 * - "+" opens an attach sheet (Camera / Photos), matching the rest of the app's pattern
 * - Lightweight markdown rendering: **bold**, `code`, line breaks
 * - Auto-growing input, timestamps, distinct "thinking" signature animation
 *
 * Usage: <AIAgentScreen apiBaseUrl="https://post-app-backend-nl35.onrender.com" userId={currentUser.id} />
 */

const BRAND = {
  yellow: "#FFC53D",
  green: "#22C55E",
  red: "#EF4444",
  blue: "#3B82F6",
  ink: "#111827",
  sub: "#6B7280",
  line: "#E7E9EE",
  bg: "#F7F8FA",
};

const WELCOME = "Hi! Ask me anything, or send a photo — I'll identify and explain it.";

// Key used across the POST app to store the JWT in localStorage.
// Change this if your login flow saves it under a different key.
const TOKEN_KEY = "token";

// ---- SVG icon set (stroke-based, matches X/Facebook style) ----
const Icon = {
  Plus: (p) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  Send: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M4 12l16-8-6 8 6 8-16-8z"
        fill="currentColor"
      />
    </svg>
  ),
  Camera: (p) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13.5" r="3.2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  Image: (p) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" {...p}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="8.5" cy="9.5" r="1.6" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M4.5 16.5l4.5-4.5a1.5 1.5 0 0 1 2.1 0l2.4 2.4M14 13.5l1.6-1.6a1.5 1.5 0 0 1 2.1 0l2.3 2.3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Close: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  ),
  Search: (p) => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  Speaker: (p) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M4 9.5v5h3.5L13 19V5L7.5 9.5H4z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M16 8.5a5 5 0 0 1 0 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M18.5 6a9 9 0 0 1 0 12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  ),
  SpeakerOff: (p) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M4 9.5v5h3.5L13 19V5L7.5 9.5H4z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M16.5 9.5l4 4M20.5 9.5l-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  ArrowUp: (p) => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M12 19V5M6 11l6-6 6 6" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Menu: (p) => (
    <svg width="20" height="16" viewBox="0 0 24 18" fill="none" {...p}>
      <path d="M3 4h18M3 14h18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  ),
  Trash: (p) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  ArrowLeft: (p) => (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  At: (p) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-4 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  Phone: (p) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M6 3h3l1.5 4.5L8.5 9a11 11 0 0 0 6.5 6.5l1.5-2 4.5 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4 6.2 2 2 0 0 1 6 3z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Mail: (p) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...p}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4.5 7l7.5 6 7.5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Globe: (p) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.5 12h17M12 3.5c2.5 2.4 3.8 5.4 3.8 8.5s-1.3 6.1-3.8 8.5c-2.5-2.4-3.8-5.4-3.8-8.5S9.5 5.9 12 3.5z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  Mask: (p) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M3 6c3 2 5 2 9 0s6-2 9 0c0 8-4 12-9 12S3 14 3 6z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="8.5" cy="10" r="1" fill="currentColor" />
      <circle cx="15.5" cy="10" r="1" fill="currentColor" />
    </svg>
  ),
  Logout: (p) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 16l4-4-4-4M19 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  ChevronRight: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Dots: (p) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="5" cy="12" r="1.8" fill="currentColor" />
      <circle cx="12" cy="12" r="1.8" fill="currentColor" />
      <circle cx="19" cy="12" r="1.8" fill="currentColor" />
    </svg>
  ),
  Album: (p) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...p}>
      <rect x="3.5" y="5.5" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="8" cy="10" r="1.4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5 16l3.5-3.5a1.2 1.2 0 0 1 1.7 0L13.5 15.5M12.5 14.5l1-1a1.2 1.2 0 0 1 1.7 0L17.5 15.7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20.5 8.5v9a2 2 0 0 1-2 2h-9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  LibraryIcon: (p) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M4 4.5h6.5v15H4a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M13.5 5l6 1.4-3 14.1-6-1.4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  ),
  Folder: (p) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M3.5 6.5A1.5 1.5 0 0 1 5 5h4l2 2h8a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5v-11z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  ),
  Doc: (p) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M9 8l-3 4 3 4M15 8l3 4-3 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Upload: (p) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M12 15V4M8 8l4-4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  NewFolder: (p) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M3.5 6.5A1.5 1.5 0 0 1 5 5h4l2 2h8a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5v-11z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 10.5v5M9.5 13h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  Grid: (p) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...p}>
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.4" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13" y="3.5" width="7.5" height="7.5" rx="1.4" stroke="currentColor" strokeWidth="1.8" />
      <rect x="3.5" y="13" width="7.5" height="7.5" rx="1.4" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13" y="13" width="7.5" height="7.5" rx="1.4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  List: (p) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="4.5" cy="6" r="1.3" fill="currentColor" />
      <circle cx="4.5" cy="12" r="1.3" fill="currentColor" />
      <circle cx="4.5" cy="18" r="1.3" fill="currentColor" />
      <path d="M9 6h11M9 12h11M9 18h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  CheckCircle: (p) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8.5 12.3l2.3 2.3 4.7-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Check: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M4 12l6 6L20 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

// ---- tiny markdown-lite renderer (bold / inline code / line breaks) ----
function renderRich(text) {
  const lines = text.split("\n");
  return lines.map((line, li) => {
    const parts = [];
    const regex = /(\*\*(.+?)\*\*|`(.+?)`)/g;
    let last = 0;
    let m;
    let key = 0;
    while ((m = regex.exec(line))) {
      if (m.index > last) parts.push(line.slice(last, m.index));
      if (m[2] !== undefined) {
        parts.push(<strong key={key++}>{m[2]}</strong>);
      } else if (m[3] !== undefined) {
        parts.push(
          <code key={key++} style={styles.inlineCode}>
            {m[3]}
          </code>
        );
      }
      last = regex.lastIndex;
    }
    parts.push(line.slice(last));
    return (
      <React.Fragment key={li}>
        {parts}
        {li < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
}

function timeNow() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatIsoTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

// Strip markdown symbols before handing text to the speech synthesizer
function toSpeechText(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .trim();
}

function AIAgentScreen({ apiBaseUrl, userId = "anon", userName = "You", userAvatarUrl, onBack }) {
  const baseUrl = String(apiBaseUrl || (typeof window !== "undefined" && window.__POST_API_BASE__) || (typeof window !== "undefined" ? window.location.origin : "")).replace(/\/+$/, "");
  const [messages, setMessages] = useState([
    { role: "assistant", content: WELCOME, time: timeNow() },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null); // e.g. "Searching the web..."
  const [showAttach, setShowAttach] = useState(false);
  const [previewImage, setPreviewImage] = useState(null); // {file, url}
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [speechSupported] = useState(
    typeof window !== "undefined" && "speechSynthesis" in window
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [conversationsError, setConversationsError] = useState(null);

  // ---- Account information screen (real data via /api/auth/me) --------
  const [accountOpen, setAccountOpen] = useState(false);
  const [accountData, setAccountData] = useState(null);
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountError, setAccountError] = useState(null);

  // ---- Library / Album screen (real files via /api/library) -----------
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryTab, setLibraryTab] = useState("all"); // "all" | "images" | "files"
  const [libraryItems, setLibraryItems] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryError, setLibraryError] = useState(null);
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryView, setLibraryView] = useState("grid"); // "grid" | "list"
  const [libraryMenuOpen, setLibraryMenuOpen] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showDeleted, setShowDeleted] = useState(false);
  const libraryFileInputRef = useRef(null);

  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const abortRef = useRef(null);
  const autoSpeakRef = useRef(false);

  useEffect(() => {
    autoSpeakRef.current = autoSpeak;
    if (!autoSpeak && speechSupported) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
    }
  }, [autoSpeak, speechSupported]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, statusMsg]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, [input]);

  const canSend = (input.trim() || previewImage) && !loading;

  // ---- plain speak helper (used by auto-speak and manual toggle) -----
  const speak = useCallback(
    (text) => {
      if (!speechSupported || typeof SpeechSynthesisUtterance === "undefined" || !text) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(toSpeechText(text));
      utterance.rate = 1;
      utterance.onend = () => setSpeakingIndex(null);
      utterance.onerror = () => setSpeakingIndex(null);
      window.speechSynthesis.speak(utterance);
    },
    [speechSupported]
  );

  // ---- streaming text send -------------------------------------------
  const sendText = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const history = messages
      .filter((m) => !m.error)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, { role: "user", content: text, time: timeNow() }]);
    setInput("");
    setLoading(true);
    setStatusMsg(null);

    // placeholder assistant bubble we fill as chunks arrive
    setMessages((prev) => [...prev, { role: "assistant", content: "", time: timeNow(), streaming: true }]);

    const controller = typeof AbortController === "function" ? new AbortController() : { abort: () => {} };
    abortRef.current = controller;

    try {
      const res = await fetch(`${baseUrl}/api/ai/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history, user_id: userId, conversation_id: conversationId }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body || typeof res.body.getReader !== "function") throw new Error("stream unavailable");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop(); // keep incomplete chunk

        for (const evt of events) {
          const eventLine = evt.split("\n").find((l) => l.startsWith("event:"));
          const dataLine = evt.split("\n").find((l) => l.startsWith("data:"));
          if (!eventLine || !dataLine) continue;
          const eventType = eventLine.replace("event:", "").trim();
          const data = JSON.parse(dataLine.replace("data:", "").trim());

          if (eventType === "delta") {
            fullText += data.text;
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              next[next.length - 1] = { ...last, content: last.content + data.text };
              return next;
            });
          } else if (eventType === "status") {
            setStatusMsg(data.message);
          } else if (eventType === "done") {
            setStatusMsg(null);
            if (data.conversation_id && !conversationId) setConversationId(data.conversation_id);
            if (autoSpeakRef.current) speak(fullText);
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              next[next.length - 1] = { ...last, streaming: false, usedSearch: data.used_search };
              return next;
            });
          } else if (eventType === "error") {
            throw new Error(data.message || "stream error");
          }
        }
      }
    } catch (err) {
      // fall back to non-streaming endpoint once
      try {
        const res = await fetch(`${baseUrl}/api/ai/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, history, user_id: userId, conversation_id: conversationId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "request failed");
        if (data.conversation_id && !conversationId) setConversationId(data.conversation_id);
        if (autoSpeakRef.current) speak(data.reply);
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            role: "assistant",
            content: data.reply,
            time: timeNow(),
            usedSearch: data.used_search,
          };
          return next;
        });
      } catch (err2) {
        const providerMessage = err2?.message && !/^(request failed|fetch failed|failed to fetch)$/i.test(err2.message)
          ? err2.message
          : "Couldn't get a reply — check your connection and try again.";
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            role: "assistant",
            content: providerMessage,
            time: timeNow(),
            error: true,
          };
          return next;
        });
      }
    } finally {
      setLoading(false);
      setStatusMsg(null);
      abortRef.current = null;
    }
  }, [input, loading, messages, apiBaseUrl, userId, speak, conversationId]);

  // ---- image send -------------------------------------------------------
  const sendImage = async () => {
    if (!previewImage || loading) return;
    const { file, url } = previewImage;
    const caption = input.trim();

    setMessages((prev) => [
      ...prev,
      { role: "user", content: caption || "Photo", image: url, time: timeNow() },
    ]);
    setInput("");
    setPreviewImage(null);
    setLoading(true);

    try {
      const form = new FormData();
      form.append("image", file);
      form.append("message", caption);
      form.append("user_id", userId);
      if (conversationId) form.append("conversation_id", conversationId);

      const res = await fetch(`${baseUrl}/api/ai/chat-with-image`, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "request failed");

      if (data.conversation_id && !conversationId) setConversationId(data.conversation_id);
      if (autoSpeakRef.current) speak(data.reply);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply, time: timeNow(), usedSearch: data.used_search },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Couldn't process the image — try again.",
          time: timeNow(),
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    if (previewImage) sendImage();
    else sendText();
  };

  useEffect(() => () => {
    if (previewImage?.url && typeof URL !== "undefined" && URL.revokeObjectURL) URL.revokeObjectURL(previewImage.url);
  }, [previewImage?.url]);

  const handleFilePick = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = typeof URL !== "undefined" && URL.createObjectURL ? URL.createObjectURL(file) : "";
      setPreviewImage({ file, url });
    }
    e.target.value = "";
    setShowAttach(false);
  };

  // ---- conversation history (Recents sidebar) -------------------------
  const fetchConversations = useCallback(async () => {
    setLoadingConversations(true);
    setConversationsError(null);
    try {
      const res = await fetch(
        `${baseUrl}/api/ai/conversations?user_id=${encodeURIComponent(userId)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Couldn't load chat history.");
      setConversations(data);
    } catch (err) {
      setConversationsError(err.message || "Couldn't load chat history.");
    } finally {
      setLoadingConversations(false);
    }
  }, [baseUrl, userId]);

  useEffect(() => {
    if (sidebarOpen) fetchConversations();
  }, [sidebarOpen, fetchConversations]);

  const startNewChat = () => {
    setConversationId(null);
    setMessages([{ role: "assistant", content: WELCOME, time: timeNow() }]);
    setPreviewImage(null);
    setInput("");
    setSidebarOpen(false);
  };

  const openConversation = async (id) => {
    setSidebarOpen(false);
    setLoading(true);
    try {
      const res = await fetch(
        `${baseUrl}/api/ai/conversations/${id}?user_id=${encodeURIComponent(userId)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Couldn't open that chat.");
      setConversationId(id);
      setMessages(
        data.messages && data.messages.length
          ? data.messages.map((m) => ({
              role: m.role,
              content: m.content,
              time: m.time ? formatIsoTime(m.time) : timeNow(),
            }))
          : [{ role: "assistant", content: WELCOME, time: timeNow() }]
      );
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Couldn't open that chat — try again.", time: timeNow(), error: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const deleteConversation = async (id, e) => {
    e.stopPropagation();
    const prevList = conversations;
    setConversations((prev) => prev.filter((c) => c.id !== id));
    try {
      const res = await fetch(
        `${baseUrl}/api/ai/conversations/${id}?user_id=${encodeURIComponent(userId)}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("delete failed");
      if (conversationId === id) startNewChat();
    } catch (err) {
      setConversations(prevList); // roll back optimistic removal on failure
    }
  };

  // ---- Account info: fetch real user data from the backend ------------
  const fetchAccount = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
    if (!token) {
      setAccountError("Not logged in.");
      return;
    }
    setAccountLoading(true);
    setAccountError(null);
    try {
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        // token expired/invalid — force logout so the app doesn't get stuck
        localStorage.removeItem(TOKEN_KEY);
        setAccountError("Session expired, please log in again.");
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Couldn't load account info.");
      setAccountData(data);
    } catch (err) {
      setAccountError(err.message || "Couldn't load account info.");
    } finally {
      setAccountLoading(false);
    }
  }, [baseUrl]);

  const openAccountInfo = () => {
    setSidebarOpen(false);
    setAccountOpen(true);
    fetchAccount();
  };

  const handleLogout = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
    try {
      if (token) {
        await fetch(`${baseUrl}/api/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (err) {
      // even if the server call fails, still clear local session below
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      setAccountOpen(false);
      // send the user back to the login/auth screen
      window.location.href = "/login";
    }
  };

  // ---- Library / Album: real backend calls ------------------------------
  const fetchLibrary = useCallback(
    async (tab = libraryTab, search = librarySearch, deleted = showDeleted) => {
      const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
      setLibraryLoading(true);
      setLibraryError(null);
      try {
        const params = new URLSearchParams({ user_id: userId, tab, deleted: String(deleted) });
        if (search.trim()) params.set("search", search.trim());
        const res = await fetch(`${baseUrl}/api/library/items?${params.toString()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Couldn't load library.");
        setLibraryItems(data);
      } catch (err) {
        setLibraryError(err.message || "Couldn't load library.");
      } finally {
        setLibraryLoading(false);
      }
    },
    [baseUrl, userId, libraryTab, librarySearch, showDeleted]
  );

  const openLibrary = (tab = "all") => {
    setSidebarOpen(false);
    setLibraryTab(tab);
    setShowDeleted(false);
    setSelectMode(false);
    setSelectedIds([]);
    setLibraryOpen(true);
    fetchLibrary(tab, librarySearch, false);
  };

  const switchLibraryTab = (tab) => {
    setLibraryTab(tab);
    fetchLibrary(tab, librarySearch, showDeleted);
  };

  const handleLibrarySearch = (value) => {
    setLibrarySearch(value);
    fetchLibrary(libraryTab, value, showDeleted);
  };

  const handleUploadFiles = async (fileList) => {
    const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
    setLibraryMenuOpen(false);
    setLibraryLoading(true);
    try {
      for (const file of Array.from(fileList)) {
        const form = new FormData();
        form.append("file", file);
        form.append("user_id", userId);
        const res = await fetch(`${baseUrl}/api/library/upload`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: form,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.detail || "Upload failed.");
        }
      }
      await fetchLibrary();
    } catch (err) {
      setLibraryError(err.message || "Upload failed.");
    } finally {
      setLibraryLoading(false);
    }
  };

  const handleNewFolder = async () => {
    const name = typeof window !== "undefined" ? window.prompt("Folder name") : null;
    setLibraryMenuOpen(false);
    if (!name || !name.trim()) return;
    const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
    try {
      const form = new FormData();
      form.append("user_id", userId);
      form.append("name", name.trim());
      const res = await fetch(`${baseUrl}/api/library/folders`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Couldn't create folder.");
      }
      await fetchLibrary();
    } catch (err) {
      setLibraryError(err.message || "Couldn't create folder.");
    }
  };

  const toggleSelectItem = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSelectAll = () => {
    const ids = libraryItems.map((item) => item.id);
    const allSelected = selectMode && ids.length > 0 && selectedIds.length === ids.length;
    setSelectMode(!allSelected);
    setSelectedIds(allSelected ? [] : ids);
    setLibraryMenuOpen(false);
  };

  const handleDeleteSelected = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
    try {
      const responses = await Promise.all(
        selectedIds.map((id) =>
          fetch(`${baseUrl}/api/library/items/${id}?user_id=${encodeURIComponent(userId)}`, {
            method: "DELETE",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          })
        )
      );
      if (responses.some((response) => !response.ok)) throw new Error("Delete failed.");
      setLibraryMenuOpen(false);
      setSelectedIds([]);
      setSelectMode(false);
      await fetchLibrary();
    } catch (err) {
      setLibraryError("Couldn't delete selected items.");
    }
  };

  const openDeleted = () => {
    setLibraryMenuOpen(false);
    setShowDeleted(true);
    fetchLibrary(libraryTab, librarySearch, true);
  };

  const closeDeleted = () => {
    setShowDeleted(false);
    fetchLibrary(libraryTab, librarySearch, false);
  };

  const restoreItem = async (id) => {
    const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
    try {
      await fetch(`${baseUrl}/api/library/items/${id}/restore?user_id=${encodeURIComponent(userId)}`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      await fetchLibrary(libraryTab, librarySearch, true);
    } catch (err) {
      setLibraryError("Couldn't restore item.");
    }
  };

  // ---- speak / stop a message ----------------------------------------
  const toggleSpeak = (index, text) => {
    if (!speechSupported) return;

    // tapping the currently-speaking bubble stops it
    if (speakingIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }

    window.speechSynthesis.cancel(); // stop any other utterance first
    const utterance = new SpeechSynthesisUtterance(toSpeechText(text));
    utterance.rate = 1;
    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);
    setSpeakingIndex(index);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      if (speechSupported) window.speechSynthesis.cancel();
    };
  }, [speechSupported]);

  return (
    <div style={styles.container}>
      {/* Header */}
        <div style={styles.header}>
          <button
            style={styles.menuButton}
            onClick={() => (onBack ? onBack() : window.history.back())}
            title="Back"
            aria-label="Back"
          >
            <Icon.ArrowLeft />
          </button>
          <UserAvatar name={userName} avatarUrl={userAvatarUrl} size={30} />
          <div>
            <div style={styles.headerTitle}>{userName}</div>
            <div style={styles.headerSub}>
              {loading ? statusMsg || "AI Agent is typing…" : "AI Agent · Chat or send a photo"}
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <button
            style={styles.menuButton}
            onClick={() => setSidebarOpen(true)}
            title="Menu"
            aria-label="Menu"
          >
            <Icon.Menu />
          </button>
        </div>
          {/* Messages */}
      <div style={styles.chatArea} ref={scrollRef}>
        {messages.map((m, i) => (
          <div key={i} style={{ ...styles.bubbleRow, justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div
              style={{
                ...styles.bubble,
                ...(m.role === "user" ? styles.userBubble : styles.assistantBubble),
                ...(m.error ? styles.errorBubble : {}),
              }}
            >
              {m.image && <img src={m.image} alt="sent" style={styles.imagePreview} />}
              {m.streaming && <ThinkingIndicator />}
              {m.content ? renderRich(m.content) : null}
              <div style={{ ...styles.msgFooter, color: m.role === "user" ? "rgba(255,255,255,0.75)" : BRAND.sub }}>
                {m.usedSearch && (
                  <span style={styles.searchTag}>
                    <Icon.Search style={{ verticalAlign: "-1px" }} /> web search
                  </span>
                )}
                {m.role === "assistant" && m.content && !m.streaming && speechSupported && (
                  <button
                    style={styles.speakerBtn}
                    onClick={() => toggleSpeak(i, m.content)}
                    title={speakingIndex === i ? "Stop reading" : "Read aloud"}
                  >
                    {speakingIndex === i ? <Icon.SpeakerOff /> : <Icon.Speaker />}
                  </button>
                )}
                <span>{m.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Image preview above input */}
      {previewImage && (
        <div style={styles.previewBar}>
          <img src={previewImage.url} alt="preview" style={styles.previewThumb} />
          <span style={styles.previewLabel}>Photo attached</span>
          <button style={styles.previewRemove} onClick={() => setPreviewImage(null)}>
            <Icon.Close />
          </button>
        </div>
      )}

      {/* Input bar — single unified composer card */}
      <div style={styles.composerStrip}>
        <div style={styles.composer}>
          <textarea
          ref={textareaRef}
          rows={1}
          style={styles.textInput}
          value={input}
          placeholder={previewImage ? "Add a caption (optional)..." : "Reply to BluOm..."}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={loading}
        />

        <div style={styles.composerRow}>
          <button style={styles.iconButton} onClick={() => setShowAttach(true)} disabled={loading} title="Attach">
            <Icon.Plus />
          </button>

          <div style={styles.brandPill} title="BluOm AI Agent">
            <span style={{ ...styles.pillLetter, color: BRAND.yellow }}>P</span>
            <span style={{ ...styles.pillLetter, color: BRAND.green }}>O</span>
            <span style={{ ...styles.pillLetter, color: BRAND.red }}>S</span>
            <span style={{ ...styles.pillLetter, color: BRAND.blue }}>T</span>
          </div>

          <div style={{ flex: 1 }} />

          {speechSupported && (
            <button
              style={{ ...styles.iconButton, ...(autoSpeak ? styles.iconButtonActive : {}) }}
              onClick={() => setAutoSpeak((v) => !v)}
              title={autoSpeak ? "Auto-read replies: on" : "Auto-read replies: off"}
            >
              {autoSpeak ? <Icon.Speaker /> : <Icon.SpeakerOff />}
            </button>
          )}

          <button
            style={{ ...styles.sendButtonRound, background: canSend ? BRAND.ink : "#C7CBD4" }}
            onClick={handleSend}
            disabled={!canSend}
            title="Send"
          >
            <Icon.ArrowUp />
          </button>
        </div>
        </div>
      </div>

      {/* Attach sheet */}
      {showAttach && (
        <div style={styles.sheetOverlay} onClick={() => setShowAttach(false)}>
          <div style={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <div style={styles.sheetHandle} />
            <AttachRow icon={<Icon.Camera />} label="Camera" onClick={() => cameraInputRef.current?.click()} />
            <AttachRow icon={<Icon.Image />} label="Photos" onClick={() => fileInputRef.current?.click()} />
            <button style={styles.sheetCancel} onClick={() => setShowAttach(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Left sidebar — New chat + real chat history (Recents) */}
      {sidebarOpen && (
        <div style={styles.drawerOverlay} onClick={() => setSidebarOpen(false)}>
          <div style={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <div style={styles.drawerHeader}>
              <span style={styles.drawerTitle}>BluOm Agent</span>
              <button style={styles.iconButton} onClick={() => setSidebarOpen(false)} title="Close">
                <Icon.Close />
              </button>
            </div>

            <button style={styles.newChatRow} onClick={startNewChat}>
              <Icon.Plus />
              <span>New chat</span>
            </button>

            <button style={styles.newChatRow} onClick={() => openLibrary("images")}>
              <Icon.Album />
              <span>Album</span>
            </button>

            <button style={styles.newChatRow} onClick={() => openLibrary("all")}>
              <Icon.LibraryIcon />
              <span>Library</span>
            </button>

            <div style={styles.recentsLabel}>Recents</div>

            <div style={styles.recentsList}>
              {loadingConversations && <div style={styles.recentsEmpty}>Loading…</div>}
              {!loadingConversations && conversationsError && (
                <div style={styles.recentsEmpty}>{conversationsError}</div>
              )}
              {!loadingConversations && !conversationsError && conversations.length === 0 && (
                <div style={styles.recentsEmpty}>No chats yet</div>
              )}
              {conversations.map((c) => (
                <button
                  key={c.id}
                  style={{
                    ...styles.recentRow,
                    ...(c.id === conversationId ? styles.recentRowActive : {}),
                  }}
                  onClick={() => openConversation(c.id)}
                >
                  <span style={styles.recentTitle}>{c.title}</span>
                  <span style={styles.recentTrash} onClick={(e) => deleteConversation(c.id, e)} title="Delete">
                    <Icon.Trash />
                  </span>
                </button>
              ))}
            </div>

            <div style={styles.drawerFooter}>
              <button style={styles.footerChatBtn} onClick={startNewChat}>
                <Icon.Plus />
                <span>Chat</span>
              </button>
              <button style={styles.avatarButton} onClick={openAccountInfo} title="Account information">
                <UserAvatar name={userName} avatarUrl={userAvatarUrl} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Library / Album — real files from /api/library, real upload/folder/delete */}
      {libraryOpen && (
        <div style={styles.accountScreen}>
          <div style={styles.libraryHeader}>
            <button style={styles.menuButton} onClick={() => (showDeleted ? closeDeleted() : setLibraryOpen(false))} title="Back">
              <Icon.ArrowLeft />
            </button>
            <div style={styles.libraryTitle}>{showDeleted ? "Deleted" : "Post"}</div>
            <div style={{ flex: 1 }} />
            {selectMode && selectedIds.length > 0 && !showDeleted && (
              <button style={styles.libraryDeleteBtn} onClick={handleDeleteSelected}>
                Delete ({selectedIds.length})
              </button>
            )}
            {!showDeleted && (
              <button style={styles.menuButton} onClick={() => setLibraryMenuOpen(true)} title="More">
                <Icon.Dots />
              </button>
            )}
          </div>

          {!showDeleted && (
            <div style={styles.libraryTabs}>
              {[
                { key: "all", label: "All" },
                { key: "images", label: "Images" },
                { key: "files", label: "Files" },
              ].map((t) => (
                <button
                  key={t.key}
                  style={{ ...styles.libraryTab, ...(libraryTab === t.key ? styles.libraryTabActive : {}) }}
                  onClick={() => switchLibraryTab(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

          <div style={styles.libraryBody}>
            {libraryLoading && <div style={styles.accountLoading}>Loading…</div>}

            {!libraryLoading && libraryError && (
              <div style={styles.accountErrorBox}>
                {libraryError}
               <button style={styles.libraryMenuRow} onClick={handleSelectAll}>
              <Icon.CheckCircle />
              <span>{selectMode && selectedIds.length === libraryItems.length && libraryItems.length > 0 ? "Clear selection" : "Select all"}</span>
            </button>
            <button style={styles.libraryMenuRow} onClick={() => libraryFileInputRef.current?.click()}>
              <Icon.Upload />
              <span>Upload files</span>
            </button>
            <button style={styles.libraryMenuRow} onClick={handleNewFolder}>
              <Icon.NewFolder />
              <span>New folder</span>
            </button>
            <div style={styles.libraryMenuDivider} />
            <button
              style={styles.libraryMenuRow}
              onClick={() => {
                setLibraryView("grid");
                setLibraryMenuOpen(false);
              }}
            >
              <Icon.Grid />
              <span style={{ flex: 1 }}>Grid</span>
              {libraryView === "grid" && <Icon.Check />}
            </button>
            <button
              style={styles.libraryMenuRow}
              onClick={() => {
                setLibraryView("list");
                setLibraryMenuOpen(false);
              }}
            >
              <Icon.List />
              <span style={{ flex: 1 }}>List</span>
              {libraryView === "list" && <Icon.Check />}
            </button>
            <div style={styles.libraryMenuDivider} />
            {selectMode && selectedIds.length > 0 && (
              <>
                <div style={styles.libraryMenuDivider} />
                <button style={styles.libraryMenuRow} onClick={handleDeleteSelected}>
                  <Icon.Trash />
                  <span>Delete selected ({selectedIds.length})</span>
                </button>
              </>
            )}
            <div style={styles.libraryMenuDivider} />
            <button style={styles.libraryMenuRow} onClick={openDeleted}>
              <Icon.Trash />
              <span>Deleted</span>
            </button>
          </div>
        </div>
      )}

      {/* Account information — real data from /api/auth/me, real logout */}
      {accountOpen && (
        <div style={styles.accountScreen}>
          <div style={styles.accountHeader}>
            <button style={styles.menuButton} onClick={() => setAccountOpen(false)} title="Back">
              <Icon.ArrowLeft />
            </button>
            <div>
              <div style={styles.accountTitle}>Account information</div>
              <div style={styles.accountSub}>
                {accountData?.username ? `@${accountData.username}` : userName ? `@${userName}` : ""}
              </div>
            </div>
          </div>

          <div style={styles.accountBody}>
            {accountLoading && <div style={styles.accountLoading}>Loading…</div>}

            {!accountLoading && accountError && (
              <div style={styles.accountErrorBox}>
                {accountError}
                <button style={styles.retryBtn} onClick={fetchAccount}>
                  Retry
                </button>
              </div>
            )}

            {!accountLoading && !accountError && accountData && (
              <>
                <AccountRow
                  icon={<Icon.At />}
                  label="Username"
                  value={accountData.username ? `@${accountData.username}` : "—"}
                />
                <AccountRow
                  icon={<Icon.Phone />}
                  label="Phone"
                  value={accountData.phone || "Add"}
                />
                <AccountRow
                  icon={<Icon.Mail />}
                  label="Email"
                  value={accountData.email || "Add"}
                />
                <AccountRow
                  icon={<Icon.Globe />}
                  label="Country"
                  value={accountData.country || "Select"}
                  note="Select the country you live in."
                />
                <AccountRow
                  icon={<Icon.Mask />}
                  label="Profile Label"
                  value={accountData.profile_label || "Add"}
                />

                <button style={styles.logoutRow} onClick={handleLogout}>
                  <span style={styles.logoutIcon}>
                    <Icon.Logout />
                  </span>
                  <span style={styles.logoutLabel}>Log out</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFilePick} />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={handleFilePick}
      />
    </div>
  );
}

function UserAvatar({ name, avatarUrl, size }) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  // Deterministic brand color per name so initials avatars aren't all the same color
  const palette = [BRAND.yellow, BRAND.green, BRAND.red, BRAND.blue];
  const colorIndex = (name || "").charCodeAt(0) % palette.length || 0;
  const bg = palette[colorIndex];

  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} style={{ ...styles.avatarImg, ...(size ? { width: size, height: size } : {}) }} />;
  }
  return (
    <div style={{ ...styles.avatarFallback, ...(size ? { width: size, height: size } : {}), background: bg }}>
      <span style={styles.avatarInitial}>{initial}</span>
    </div>
  );
}

function AttachRow({ icon, label, onClick }) {
  return (
    <button style={styles.attachRow} onClick={onClick}>
      <span style={styles.attachIcon}>{icon}</span>
      <span style={styles.attachLabel}>{label}</span>
    </button>
  );
}

function LibraryCard({ item, view, apiBaseUrl, selectMode, selected, onToggleSelect, showDeleted, onRestore }) {
  const isImage = item.type === "image";
  const isFolder = item.type === "folder";
  const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
  const thumbUrl =
    isImage && item.file_id
      ? `${baseUrl}/api/library/files/${item.file_id}${token ? `?token=${encodeURIComponent(token)}` : ""}`
      : null;

  const cardStyle = view === "grid" ? styles.libCardGrid : styles.libCardList;

  return (
    <button
      style={{ ...cardStyle, ...(selected ? styles.libCardSelected : {}) }}
      onClick={() => (selectMode ? onToggleSelect() : showDeleted ? onRestore() : null)}
    >
      {selectMode && (
        <span style={styles.libSelectDot}>
          {selected ? <Icon.CheckCircle style={{ color: BRAND.blue }} /> : <span style={styles.libSelectEmpty} />}
        </span>
      )}

      {thumbUrl ? (
        <img src={thumbUrl} alt={item.name} style={view === "grid" ? styles.libThumbGrid : styles.libThumbList} />
      ) : (
        <span style={styles.libIcon}>
          {isFolder ? <Icon.Folder /> : item.mime_type === "application/pdf" ? "📄" : <Icon.Doc />}
        </span>
      )}

      <span style={styles.libName}>{item.name}</span>

      {showDeleted && (
        <span style={styles.libRestoreBtn} onClick={(e) => { e.stopPropagation(); onRestore(); }}>
          Restore
        </span>
      )}
    </button>
  );
}

function AccountRow({ icon, label, value, note }) {
  return (
    <div style={styles.accountRow}>
      <span style={styles.accountRowIcon}>{icon}</span>
      <div style={styles.accountRowText}>
        <div style={styles.accountRowLabel}>{label}</div>
        <div style={styles.accountRowValue}>{value}</div>
        {note && <div style={styles.accountRowNote}>{note}</div>}
      </div>
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <span style={styles.thinkingIndicator} aria-label="POST AI is preparing a reply">
      <span style={styles.thinkingAiText}>AI</span>
      <svg
        style={styles.thinkingSpinner}
        width="22"
        height="22"
        viewBox="0 0 22 22"
        fill="none"
        role="status"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8.5" stroke={BRAND.line} strokeWidth="2.5" />
        <path
          d="M11 2.5a8.5 8.5 0 0 1 8.5 8.5"
          stroke={BRAND.blue}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      <style>{`
        @keyframes postai-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </span>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100dvh",
    minHeight: "100vh",
    background: BRAND.bg,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 16px",
    background: "#fff",
    borderBottom: `1px solid ${BRAND.line}`,
  },
  menuButton: {
    border: "none",
    background: "transparent",
    color: BRAND.ink,
    width: 30,
    height: 30,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
    marginRight: -2,
  },
  drawerOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    display: "flex",
    zIndex: 70,
  },
  drawer: {
    width: "78%",
    maxWidth: 320,
    height: "100%",
    background: "#fff",
    display: "flex",
    flexDirection: "column",
    boxShadow: "2px 0 16px rgba(0,0,0,0.12)",
  },
  drawerHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 14px 12px 18px",
    borderBottom: `1px solid ${BRAND.line}`,
  },
  drawerTitle: { fontWeight: 800, fontSize: 18, color: BRAND.ink },
  newChatRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "14px 18px",
    border: "none",
    background: "transparent",
    textAlign: "left",
    cursor: "pointer",
    color: BRAND.ink,
    fontSize: 15,
    fontWeight: 600,
  },
  recentsLabel: {
    padding: "6px 18px 4px",
    fontSize: 11.5,
    fontWeight: 700,
    color: BRAND.sub,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  recentsList: { flex: 1, overflowY: "auto", padding: "0 10px 10px" },
  recentsEmpty: { padding: "12px 8px", fontSize: 13, color: BRAND.sub },
  recentRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: "10px 8px",
    border: "none",
    background: "transparent",
    borderRadius: 10,
    cursor: "pointer",
    textAlign: "left",
  },
  recentRowActive: { background: BRAND.bg },
  recentTitle: {
    fontSize: 14,
    color: BRAND.ink,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flex: 1,
    marginRight: 8,
  },
  recentTrash: { color: BRAND.sub, display: "flex", padding: 4, flexShrink: 0 },
  drawerFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 18px",
    borderTop: `1px solid ${BRAND.line}`,
  },
  footerChatBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 16px",
    borderRadius: 18,
    border: "none",
    background: BRAND.blue,
    color: "#fff",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
  },
  avatarImg: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    objectFit: "cover",
    flexShrink: 0,
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarInitial: { color: "#fff", fontWeight: 700, fontSize: 16 },
  headerTitle: { fontWeight: 700, fontSize: 17, color: BRAND.ink, lineHeight: 1.2 },
  headerSub: { fontSize: 12, color: BRAND.sub, marginTop: 1 },
  chatArea: { flex: 1, overflowY: "auto", padding: "14px 12px", display: "flex", flexDirection: "column", gap: 8 },
  bubbleRow: { display: "flex", width: "100%" },
  bubble: {
    maxWidth: "80%",
    padding: "9px 13px",
    borderRadius: 18,
    fontSize: 15,
    lineHeight: 1.45,
    border: "1px solid transparent",
    wordBreak: "break-word",
  },
  userBubble: { background: BRAND.blue, color: "#fff", borderBottomRightRadius: 4 },
  assistantBubble: { background: "#fff", color: BRAND.ink, border: `1px solid ${BRAND.line}`, borderBottomLeftRadius: 4 },
  errorBubble: { borderColor: BRAND.red, color: BRAND.red },
  inlineCode: {
    background: "rgba(0,0,0,0.06)",
    padding: "1px 5px",
    borderRadius: 4,
    fontSize: 13,
    fontFamily: "ui-monospace, monospace",
  },
  imagePreview: { width: "100%", borderRadius: 12, marginBottom: 6, display: "block" },
  msgFooter: { display: "flex", justifyContent: "flex-end", gap: 8, fontSize: 10.5, marginTop: 4 },
  searchTag: { opacity: 0.9, display: "inline-flex", alignItems: "center", gap: 3 },
  speakerBtn: {
    border: "none",
    background: "transparent",
    color: "inherit",
    padding: 0,
    display: "inline-flex",
    alignItems: "center",
    cursor: "pointer",
    opacity: 0.75,
  },
  previewBar: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 14px",
    background: "#fff",
    borderTop: `1px solid ${BRAND.line}`,
  },
  previewThumb: { width: 36, height: 36, borderRadius: 8, objectFit: "cover" },
  previewLabel: { fontSize: 13, color: BRAND.sub, flex: 1 },
  previewRemove: {
    border: "none",
    background: "transparent",
    color: BRAND.sub,
    cursor: "pointer",
    width: 22,
    height: 22,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  composerStrip: {
    background: "#fff",
    borderTop: `1px solid ${BRAND.line}`,
    paddingTop: 10,
  },
  composer: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    margin: "0 10px 10px",
    padding: "10px 12px 8px",
    background: "#fff",
    border: `1px solid ${BRAND.line}`,
    borderRadius: 22,
  },
  composerRow: { display: "flex", alignItems: "center", gap: 8 },
  iconButton: {
    border: "none",
    background: "transparent",
    color: BRAND.sub,
    width: 34,
    height: 34,
    borderRadius: "50%",
    cursor: "pointer",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonActive: { color: BRAND.blue, background: "rgba(59,130,246,0.1)" },
  textInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: "6px 4px",
    border: "none",
    outline: "none",
    fontSize: 15.5,
    resize: "none",
    fontFamily: "inherit",
    maxHeight: 120,
    background: "transparent",
  },
  brandPill: {
    display: "flex",
    alignItems: "center",
    gap: 1,
    padding: "6px 10px",
    borderRadius: 18,
    background: BRAND.bg,
    flexShrink: 0,
  },
  pillLetter: { fontSize: 14, fontWeight: 800, letterSpacing: 0.3 },
  sendButtonRound: {
    border: "none",
    color: "#fff",
    width: 34,
    height: 34,
    borderRadius: "50%",
    cursor: "pointer",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "flex-end", zIndex: 50 },
  sheet: { width: "100%", background: "#fff", borderRadius: "20px 20px 0 0", padding: "10px 16px 20px" },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, background: BRAND.line, margin: "4px auto 12px" },
  attachRow: { display: "flex", alignItems: "center", gap: 14, width: "100%", padding: "12px 4px", border: "none", background: "transparent", textAlign: "left", cursor: "pointer" },
  attachIcon: { width: 32, display: "flex", justifyContent: "center", color: BRAND.ink },
  attachLabel: { fontSize: 16, color: BRAND.ink },
  sheetCancel: { width: "100%", marginTop: 6, padding: "12px 0", border: "none", background: BRAND.bg, borderRadius: 12, fontSize: 15, color: BRAND.sub, cursor: "pointer" },
  thinkingIndicator: { display: "inline-flex", alignItems: "center", gap: 9, padding: "2px 0" },
  thinkingBrand: { display: "inline-flex", alignItems: "center", gap: 1, padding: "5px 8px", borderRadius: 8, background: "linear-gradient(135deg, #fff 0%, #f8f8ff 42%, #f1eaff 100%)", boxShadow: "0 2px 8px rgba(102, 78, 190, 0.12)", border: "1px solid rgba(102, 78, 190, 0.10)" },
  thinkingAiText: { marginLeft: 4, padding: "2px 4px", borderRadius: 4, background: "linear-gradient(135deg, #13a7d8, #9c35cc)", color: "#fff", fontSize: 11, fontWeight: 800, letterSpacing: 0.2 },
  thinkingSpinner: { display: "block", animation: "postai-spin 0.8s linear infinite" },

  avatarButton: { border: "none", background: "transparent", padding: 0, cursor: "pointer", display: "flex" },

  // ---- Account information screen ----
  accountScreen: {
    position: "fixed",
    inset: 0,
    background: "#fff",
    zIndex: 90,
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
  },
  accountHeader: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "16px 16px 18px",
    borderBottom: `1px solid ${BRAND.line}`,
  },
  accountTitle: { fontWeight: 800, fontSize: 22, color: BRAND.ink, lineHeight: 1.2 },
  accountSub: { fontSize: 14, color: BRAND.sub, marginTop: 2 },
  accountBody: { padding: "8px 16px 40px" },
  accountLoading: { padding: "24px 4px", color: BRAND.sub, fontSize: 14 },
  accountErrorBox: {
    padding: "16px 4px",
    color: BRAND.red,
    fontSize: 14,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    alignItems: "flex-start",
  },
  retryBtn: {
    border: `1px solid ${BRAND.red}`,
    background: "transparent",
    color: BRAND.red,
    borderRadius: 8,
    padding: "6px 14px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  accountRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 18,
    padding: "22px 4px",
    borderBottom: `1px solid ${BRAND.line}`,
  },
  accountRowIcon: { color: BRAND.ink, marginTop: 3, flexShrink: 0 },
  accountRowText: { flex: 1 },
  accountRowLabel: { fontWeight: 700, fontSize: 19, color: BRAND.ink, marginBottom: 4 },
  accountRowValue: { fontSize: 16, color: BRAND.ink },
  accountRowNote: { fontSize: 13.5, color: BRAND.sub, marginTop: 6 },
  logoutRow: {
    display: "flex",
    alignItems: "center",
    gap: 18,
    padding: "22px 4px",
    width: "100%",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    textAlign: "left",
  },
  logoutIcon: { color: BRAND.red, flexShrink: 0 },
  logoutLabel: { fontWeight: 700, fontSize: 19, color: BRAND.red },

  // ---- Library / Album screen ----
  libraryHeader: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "14px 12px",
    borderBottom: `1px solid ${BRAND.line}`,
  },
  libraryTitle: { position: "absolute", left: "50%", transform: "translateX(-50%)", fontWeight: 800, fontSize: 19, color: BRAND.ink, pointerEvents: "none" },
  libraryDeleteBtn: {
    border: "none",
    background: BRAND.red,
    color: "#fff",
    fontWeight: 600,
    fontSize: 13,
    padding: "7px 12px",
    borderRadius: 16,
    cursor: "pointer",
    marginRight: 4,
  },
  libraryTabs: { display: "flex", gap: 8, padding: "10px 14px 4px" },
  libraryTab: {
    border: "none",
    background: BRAND.bg,
    color: BRAND.sub,
    fontWeight: 600,
    fontSize: 13.5,
    padding: "7px 16px",
    borderRadius: 16,
    cursor: "pointer",
  },
  libraryTabActive: { background: BRAND.ink, color: "#fff" },
  libraryBody: { flex: 1, overflowY: "auto", padding: "12px 14px 90px" },
  libraryGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  libraryList: { display: "flex", flexDirection: "column", gap: 8 },
  libCardGrid: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "flex-end",
    height: 150,
    padding: 12,
    border: `1px solid ${BRAND.line}`,
    borderRadius: 16,
    background: "#fff",
    cursor: "pointer",
    overflow: "hidden",
    textAlign: "left",
  },
  libCardList: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 12px",
    border: `1px solid ${BRAND.line}`,
    borderRadius: 12,
    background: "#fff",
    cursor: "pointer",
    textAlign: "left",
    width: "100%",
  },
  libCardSelected: { borderColor: BRAND.blue, boxShadow: `0 0 0 2px ${BRAND.blue}33` },
  libThumbGrid: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" },
  libThumbList: { width: 40, height: 40, borderRadius: 8, objectFit: "cover", flexShrink: 0 },
  libIcon: { color: BRAND.ink, fontSize: 20, marginBottom: 8 },
  libName: {
    position: "relative",
    fontSize: 13.5,
    fontWeight: 600,
    color: BRAND.ink,
    zIndex: 1,
    background: "inherit",
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  libSelectDot: { position: "absolute", top: 8, right: 8, zIndex: 2, display: "flex" },
  libSelectEmpty: { width: 20, height: 20, borderRadius: "50%", border: `2px solid ${BRAND.sub}`, background: "rgba(255,255,255,0.8)" },
  libRestoreBtn: {
    marginLeft: "auto",
    fontSize: 12.5,
    fontWeight: 700,
    color: BRAND.blue,
    padding: "4px 10px",
  },
  librarySearchBar: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#fff",
    border: `1px solid ${BRAND.line}`,
    borderRadius: 22,
    padding: "10px 16px",
    boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
  },
  librarySearchIcon: { color: BRAND.sub, display: "flex" },
  librarySearchInput: { flex: 1, border: "none", outline: "none", fontSize: 14.5, background: "transparent" },
  libraryMenuSheet: { width: "100%", background: "#fff", borderRadius: "20px 20px 0 0", padding: "10px 8px 24px" },
  libraryMenuRow: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    width: "100%",
    padding: "13px 16px",
    border: "none",
    background: "transparent",
    textAlign: "left",
    cursor: "pointer",
    color: BRAND.ink,
    fontSize: 15.5,
  },
  libraryMenuDivider: { height: 1, background: BRAND.line, margin: "6px 8px" },
};


window.AIAgentScreen = AIAgentScreen;
window.dispatchEvent(new Event("post-ai-agent-ready"));
