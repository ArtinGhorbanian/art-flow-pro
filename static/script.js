/* ============================================================================
 * Art Flow Pro — script.js
 * Async-first studio engine. Single source of truth = #app[data-*] + State.
 *
 * Modules
 *   01 · Utilities
 *   02 · DOM cache
 *   03 · State
 *   04 · Toasts
 *   05 · Theme
 *   06 · View router
 *   07 · Chat surface states
 *   08 · Settings modal
 *   09 · Canvas model + factories
 *   10 · Canvas renderer (2D)
 *   11 · Overlay renderer (SVG selection + handles)
 *   12 · Hit testing
 *   13 · Pointer interaction (create / select / move / resize)
 *   14 · Floating contextual toolbar
 *   15 · Properties + background + presets
 *   16 · Layers
 *   17 · Zoom
 *   18 · History (undo / redo)
 *   19 · afp-actions dispatcher
 *   20 · Image generation (/api/image)
 *   21 · Streaming Copilot (/api/chat)
 *   22 · Resume builder (/api/parse-resume, /api/ai/*, /api/resume/save)
 *   23 · WebSocket (/ws)
 *   24 · Keyboard
 *   25 · Boot
 * ========================================================================== */
(function () {
  "use strict";

  /* ── 01 · Utilities ─────────────────────────────────────────────────────── */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const byId = (id) => document.getElementById(id);
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  const round = (n) => Math.round(n);
  const uid = () => "o" + Math.random().toString(36).slice(2, 9);
  const SVGNS = "http://www.w3.org/2000/svg";

  function debounce(fn, wait) {
    let t;
    return function (...a) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, a), wait);
    };
  }
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function fmtLite(t) {
    let s = escapeHtml(t);
    s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/\n/g, "<br>");
    return s;
  }
  function normalizeHex(v, fallback) {
    if (typeof v !== "string") return fallback;
    let h = v.trim();
    if (/^#?[0-9a-f]{6}$/i.test(h)) return (h[0] === "#" ? h : "#" + h).toLowerCase();
    if (/^#?[0-9a-f]{3}$/i.test(h)) {
      h = h.replace("#", "");
      return ("#" + h[0] + h[0] + h[1] + h[1] + h[2] + h[2]).toLowerCase();
    }
    return fallback;
  }
  function svgEl(name, attrs) {
    const el = document.createElementNS(SVGNS, name);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }
  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("image load failed"));
      img.src = src;
    });
  }
  function setInert(node, on) {
    if (!node) return;
    node.inert = Boolean(on);
    node.setAttribute("aria-hidden", String(Boolean(on)));
  }
  function safeSameOriginUrl(value) {
    if (typeof value !== "string" || !value.trim()) return null;
    try {
      const url = new URL(value.trim(), location.origin);
      if ((url.protocol === "http:" || url.protocol === "https:") && url.origin === location.origin && !url.username && !url.password) {
        return url.href;
      }
    } catch (_) { /* invalid URL */ }
    return null;
  }
  function safeAssetUrl(value) {
    if (typeof value !== "string" || !value.trim()) return null;
    const raw = value.trim();
    if (raw.startsWith("blob:")) return raw;
    if (/^data:image\/(?:png|jpe?g|webp|gif);base64,/i.test(raw) && raw.length <= 12_000_000) return raw;
    return safeSameOriginUrl(raw);
  }
  function boundedNumber(value, fallback, min, max) {
    const n = Number(value);
    return Number.isFinite(n) ? clamp(n, min, max) : fallback;
  }

  /* ── 02 · DOM cache ─────────────────────────────────────────────────────── */
  const el = {
    app: byId("app"),
    rail: byId("afp-rail"),
    stage: byId("afp-stage"),
    dockLeft: byId("afp-dock-left"),
    dockRight: byId("afp-dock-right"),
    dockScrim: byId("afp-dock-scrim"),
    mobilePanelBar: byId("afp-mobile-panel-bar"),
    toggleLeft: byId("afp-toggle-left"),
    toggleRight: byId("afp-toggle-right"),
    toggleLeftLabel: byId("afp-toggle-left-label"),
    toggleRightLabel: byId("afp-toggle-right-label"),
    mobileUndo: byId("afp-mobile-undo"),
    mobileRedo: byId("afp-mobile-redo"),
    // topbar
    docTitle: byId("afp-doc-title"),
    docSize: byId("afp-doc-size"),
    saveStatus: byId("afp-save-status"),
    exportLabel: byId("afp-export-label"),
    saveLabel: byId("afp-save-label"),
    zoom: byId("afp-zoom"),
    zoomValue: byId("afp-zoom-value"),
    undo: byId("afp-undo"),
    redo: byId("afp-redo"),
    themeToggle: byId("afp-theme-toggle"),
    exportBtn: byId("afp-export"),
    saveBtn: byId("afp-save"),
    openSettings: byId("afp-open-settings"),
    railSettings: byId("afp-rail-settings"),
    help: byId("afp-help"),
    // tools
    tools: byId("afp-tools"),
    imagePrompt: byId("afp-image-prompt"),
    generateImage: byId("afp-generate-image"),
    // canvas
    canvasWrap: byId("afp-canvas-wrap"),
    canvasFrame: byId("afp-canvas-frame"),
    canvas: byId("afp-canvas"),
    overlay: byId("afp-overlay"),
    floatbar: byId("afp-floatbar"),
    floatSwatch: byId("afp-float-swatch"),
    // properties
    bgColor: byId("afp-bg-color"),
    bgHex: byId("afp-bg-hex"),
    props: byId("afp-props"),
    propX: byId("afp-prop-x"),
    propY: byId("afp-prop-y"),
    propW: byId("afp-prop-w"),
    propH: byId("afp-prop-h"),
    propFill: byId("afp-prop-fill"),
    propFillHex: byId("afp-prop-fill-hex"),
    propOpacity: byId("afp-prop-opacity"),
    layers: byId("afp-layers"),
    // chat
    chat: byId("afp-chat"),
    chatLog: byId("afp-chat-log"),
    chatForm: byId("afp-chat-form"),
    chatInput: byId("afp-chat-input"),
    chatExpand: byId("afp-chat-expand"),
    chatCollapse: byId("afp-chat-collapse"),
    chatLauncher: byId("afp-chat-launcher"),
    // resume
    rRaw: byId("afp-resume-raw"),
    rParse: byId("afp-resume-parse"),
    rEditor: byId("afp-resume-editor"),
    rName: byId("afp-r-name"),
    rTitle: byId("afp-r-title"),
    rEmail: byId("afp-r-email"),
    rPhone: byId("afp-r-phone"),
    rLocation: byId("afp-r-location"),
    rSummary: byId("afp-r-summary"),
    rExperience: byId("afp-r-experience"),
    rEducation: byId("afp-r-education"),
    rSkills: byId("afp-r-skills"),
    rTarget: byId("afp-r-target"),
    rAddExp: byId("afp-r-add-exp"),
    rAddEdu: byId("afp-r-add-edu"),
    aiSummary: byId("afp-ai-summary"),
    aiBullets: byId("afp-ai-bullets"),
    aiKeywords: byId("afp-ai-keywords"),
    aiTone: byId("afp-ai-tone"),
    rPublish: byId("afp-resume-publish"),
    rLink: byId("afp-resume-link"),
    rLiveUrl: byId("afp-resume-live-url"),
    rExpiry: byId("afp-resume-expiry"),
    rRevoke: byId("afp-resume-revoke"),
    rPreview: byId("afp-resume-preview"),
    // shell
    settings: byId("afp-settings"),
    closeSettings: byId("afp-close-settings"),
    settingsDone: byId("afp-settings-done"),
    helpModal: byId("afp-help-modal"),
    closeHelp: byId("afp-close-help"),
    helpDone: byId("afp-help-done"),
    reduceMotion: byId("afp-reduce-motion"),
    publishConfirm: byId("afp-publish-confirm"),
    publishClose: byId("afp-publish-close"),
    publishCancel: byId("afp-publish-cancel"),
    publishAction: byId("afp-publish-confirm-action"),
    toasts: byId("afp-toasts"),
    // home / projects
    home: byId("afp-home"),
    projects: byId("afp-projects"),
    projectsLoading: byId("afp-projects-loading"),
    projectsError: byId("afp-projects-error"),
    projectsRetry: byId("afp-projects-retry"),
    projectsEmpty: byId("afp-projects-empty"),
    newProjectBtn: byId("afp-new-project"),
    emptyNewBtn: byId("afp-empty-new"),
    backHome: byId("afp-back-home"),
    npModal: byId("afp-new-project-modal"),
    npName: byId("afp-np-name"),
    npTypes: byId("afp-np-types"),
    npClose: byId("afp-np-close"),
    npCancel: byId("afp-np-cancel"),
    npCreate: byId("afp-np-create"),
  };

  const ctx = el.canvas.getContext("2d");

  /* ── 03 · State ─────────────────────────────────────────────────────────── */
   const State = {
    view: el.app.dataset.view || "design",
    projectName: (el.docTitle.textContent || "Untitled project").trim(),
    projectId: null,
    projectType: null,
    dirty: false,
    revision: 0,
    saveState: "saved",
    theme: document.documentElement.dataset.theme === "light" ? "light" : "dark",
    tool: "select",
    shapeKind: "rect",
    imageAs: "background",
    imageGenerating: false,
    tone: "professional",
    exportFmt: "png",
    zoom: 1,
    chatState: window.matchMedia("(max-width: 720px), (max-width: 900px) and (max-height: 520px)").matches
      ? 0
      : ([0, 1, 2].includes(Number(el.chat.dataset.state)) ? Number(el.chat.dataset.state) : 1),
    bg: normalizeHex(el.bgColor.value, "#0b0e11"),
    bgImage: null,
    bgImageSrc: null,
    bgAssetId: null,
    canvas: { w: el.canvas.width, h: el.canvas.height },
    objects: [],
    selected: -1,
    chat: { messages: [], streaming: false },
    published: { id: null, revokeUrl: null, expiresAt: null },
    openDock: null,
    ws: null,
    history: { past: [], future: [], present: null },
  };

  const imageCache = new Map(); // src -> HTMLImageElement
  const PRESETS = {
    "16:9": [1920, 1080], square: [1080, 1080], story: [1080, 1920], "4k": [3840, 2160],
  };
  const DEFAULT_DESIGN = Object.freeze({ bg: "#0b0e11", w: 1920, h: 1080 });
  const MAX_OBJECTS = 500;
  // Standard laptop widths use on-demand drawers so the editor stays readable.
  const responsivePanels = window.matchMedia("(max-width: 1366px)");

  function blankDesignData() {
    return { bg: DEFAULT_DESIGN.bg, bgSrc: null, bgAssetId: null, w: DEFAULT_DESIGN.w, h: DEFAULT_DESIGN.h, objects: [] };
  }
  function blankResumeData() {
    return {
      name: "", title: "", contact: { email: "", phone: "", location: "", links: [] },
      summary: "", experience: [], education: [], skills: [],
    };
  }

  /* ── 04 · Toasts ────────────────────────────────────────────────────────── */
  function toast(message, type = "ok", timeout = 3400) {
    const node = document.createElement("div");
    node.className = "toast" + (type === "error" ? " toast--error" : type === "ok" ? " toast--ok" : "");
    if (type === "ok") {
      node.innerHTML = '<svg class="ico"><use href="#i-spark"/></svg>';
    } else if (type === "error") {
      node.innerHTML = '<svg class="ico"><use href="#i-close"/></svg>';
    }
    node.appendChild(document.createTextNode(message));
    el.toasts.appendChild(node);
    setTimeout(() => {
      node.style.transition = "opacity .25s, transform .25s";
      node.style.opacity = "0";
      node.style.transform = "translateY(8px)";
      setTimeout(() => node.remove(), 260);
    }, timeout);
  }

  function activeDocumentType() {
    if (State.view === "resume") return "resume";
    if (State.view === "design") return "design";
    return State.projectType === "resume" ? "resume" : "design";
  }
  function setSaveState(state, message) {
    const labels = { saved: "Saved", dirty: "Unsaved", saving: "Saving…", error: "Save failed" };
    State.saveState = state;
    el.saveStatus.dataset.state = state;
    el.saveStatus.textContent = message || labels[state] || "";
    el.saveBtn.disabled = state === "saving";
    el.saveBtn.setAttribute("aria-busy", String(state === "saving"));
  }
  function markDirty() {
    State.dirty = true;
    State.revision += 1;
    if (State.saveState !== "saving") setSaveState("dirty");
  }
  function markSaved() {
    State.dirty = false;
    setSaveState("saved");
  }
  function updateContextActions() {
    const type = activeDocumentType();
    const isDesign = State.view === "design";
    const isCopilot = State.view === "copilot";
    $$('[data-canvas-action]').forEach((node) => { node.hidden = !isDesign; });
    el.exportBtn.hidden = isCopilot;
    el.exportLabel.textContent = type === "resume" ? "Print resume" : "Export design";
    el.exportBtn.setAttribute("aria-label", type === "resume" ? "Print resume" : "Export design");
    el.saveLabel.textContent = type === "resume" ? "Save resume" : "Save design";
    el.saveBtn.setAttribute("aria-label", type === "resume" ? "Save resume" : "Save design");
    el.mobilePanelBar.hidden = isCopilot;
    el.toggleLeftLabel.textContent = type === "resume" ? "Source" : "Tools";
    el.toggleRightLabel.textContent = type === "resume" ? "AI tools" : "Properties";
    el.toggleLeft.setAttribute("aria-label", `Open ${el.toggleLeftLabel.textContent}`);
    el.toggleRight.setAttribute("aria-label", `Open ${el.toggleRightLabel.textContent}`);
  }

  /* ── 05 · Theme ─────────────────────────────────────────────────────────── */
  async function persistTheme(theme) {
    try {
      await fetch("/api/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme }),
      });
    } catch (_) { /* cookie persistence is best-effort */ }
  }
  function applyTheme(theme, persist = true) {
    State.theme = theme === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = State.theme;
    el.themeToggle.setAttribute("aria-pressed", String(State.theme === "light"));
    $$(".seg [data-set-theme]").forEach((b) => setSegActive(b, b.dataset.setTheme === State.theme));
    if (persist) persistTheme(State.theme);
  }
  function toggleTheme() {
    applyTheme(State.theme === "dark" ? "light" : "dark");
  }

  /* ── 06 · View router ───────────────────────────────────────────────────── */
  function setView(view) {
    if (!["design", "resume", "copilot"].includes(view)) return;
    const prev = State.view;
    closeResponsiveDocks(false);
    State.view = view;
    el.app.dataset.view = view;
    $$("#afp-rail [data-view]").forEach((b) => {
      const on = b.dataset.view === view;
      b.classList.toggle("is-active", on);
      if (on) b.setAttribute("aria-current", "page");
      else b.removeAttribute("aria-current");
    });
    if (view === "copilot") setChatState(2);
    else if (prev === "copilot" && State.chatState === 2) setChatState(1);
    updateContextActions();
    updateResponsivePanels();
    // Layout shifts change canvas rect → realign selection chrome.
    requestAnimationFrame(() => { renderOverlay(); positionFloatbar(); });
  }

  let lastDockTrigger = null;
  function updateResponsivePanels() {
    const compact = responsivePanels.matches;
    const isCopilot = State.view === "copilot";
    if (!compact || isCopilot) State.openDock = null;
    [el.dockLeft, el.dockRight].forEach((dock) => {
      const side = dock === el.dockLeft ? "left" : "right";
      const open = compact && !isCopilot && State.openDock === side;
      dock.classList.toggle("is-open", open);
      setInert(dock, compact ? !open : isCopilot);
    });
    const anyOpen = compact && !isCopilot && Boolean(State.openDock);
    el.dockScrim.hidden = !anyOpen;
    el.toggleLeft.setAttribute("aria-expanded", String(State.openDock === "left"));
    el.toggleRight.setAttribute("aria-expanded", String(State.openDock === "right"));
  }
  function closeResponsiveDocks(restoreFocus = true) {
    const trigger = lastDockTrigger;
    State.openDock = null;
    updateResponsivePanels();
    if (restoreFocus && trigger && document.contains(trigger)) requestAnimationFrame(() => trigger.focus());
    lastDockTrigger = null;
  }
  function toggleResponsiveDock(side) {
    if (!responsivePanels.matches || State.view === "copilot") return;
    const trigger = side === "left" ? el.toggleLeft : el.toggleRight;
    if (State.openDock === side) { closeResponsiveDocks(true); return; }
    lastDockTrigger = trigger;
    State.openDock = side;
    updateResponsivePanels();
    const dock = side === "left" ? el.dockLeft : el.dockRight;
    const panel = $(`[data-panel="${State.view}"]`, dock);
    const focusable = panel && $("button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])", panel);
    if (focusable) requestAnimationFrame(() => focusable.focus());
  }

  /* ── 07 · Chat surface states ───────────────────────────────────────────── */
  function setChatState(s, { focus = false } = {}) {
    State.chatState = [0, 1, 2].includes(Number(s)) ? Number(s) : 1;
    el.chat.dataset.state = String(State.chatState);
    el.chatLauncher.hidden = State.chatState !== 0;
    el.chat.setAttribute("aria-hidden", String(State.chatState === 0));
    el.chatExpand.setAttribute("aria-expanded", String(State.chatState === 2));
    el.chatExpand.setAttribute("aria-label", State.chatState === 2 ? "Restore compact Art Flow AI" : "Expand Art Flow AI");
    el.chatLauncher.setAttribute("aria-expanded", String(State.chatState !== 0));
    if (focus) {
      const target = State.chatState === 0 ? el.chatLauncher : el.chatInput;
      requestAnimationFrame(() => target.focus());
    }
  }

  /* ── 08 · Settings modal ────────────────────────────────────────────────── */
  function openSettings() {
    if (typeof el.settings.showModal === "function") el.settings.showModal();
    else el.settings.setAttribute("open", "");
  }
  function closeSettings() {
    if (typeof el.settings.close === "function") el.settings.close();
    else el.settings.removeAttribute("open");
  }
  function openHelp() {
    if (typeof el.helpModal.showModal === "function") el.helpModal.showModal();
    else el.helpModal.setAttribute("open", "");
  }
  function closeHelp() {
    if (typeof el.helpModal.close === "function") el.helpModal.close();
    else el.helpModal.removeAttribute("open");
  }
  function renameProject() {
    const current = (State.projectName || el.docTitle.textContent || "").trim();
    const next = window.prompt("Project name", current);
    if (next == null) return;
    const name = next.trim().slice(0, 120) || "Untitled project";
    State.projectName = name;
    el.docTitle.textContent = name;
    document.title = name + " — Art Flow Pro";
    markDirty();
    toast("Project renamed.", "ok");
    if (State.projectId) saveProject();
  }

  /* ── 08b · Projects dashboard (backend-persisted) ────────────────────────── */
  let npType = "design";

  function fmtDate(ts) {
    if (!ts) return "";
    return new Date(ts * 1000).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  function showHome(options = {}) {
    const force = options === true || options.force === true;
    if (State.dirty && !force && !window.confirm("You have unsaved changes. Leave this project and discard them?")) {
      return false;
    }
    closeResponsiveDocks(false);
    State.dirty = false;
    State.projectId = null;
    State.projectType = null;
    el.home.hidden = false;
    setInert(el.home, false);
    setInert(el.app, true);
    el.backHome.hidden = true;
    document.title = "Art Flow Pro";
    setSaveState("saved");
    loadProjects();
    requestAnimationFrame(() => el.newProjectBtn.focus());
    return true;
  }

  async function loadProjects() {
    el.projectsLoading.hidden = false;
    el.projectsError.hidden = true;
    el.projects.hidden = true;
    el.projectsEmpty.hidden = true;
    try {
      const r = await fetch("/api/projects");
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !Array.isArray(data.projects)) throw new Error(data.error || "Projects unavailable");
      renderProjects(data.projects);
      el.projectsLoading.hidden = true;
      el.projectsError.hidden = true;
    } catch (_) {
      el.projectsLoading.hidden = true;
      el.projects.hidden = true;
      el.projectsEmpty.hidden = true;
      el.projectsError.hidden = false;
    }
  }

  function renderProjects(list) {
    el.projects.replaceChildren();
    el.projectsEmpty.hidden = list.length > 0;
    el.projects.hidden = list.length === 0;
    for (const p of list) {
      const card = document.createElement("article");
      card.className = "project-card";
      card.dataset.id = p.id;
      const open = document.createElement("button");
      open.type = "button";
      open.className = "project-card__open";
      open.setAttribute("aria-label", `Open ${p.name || "Untitled project"}`);
      const icon = p.type === "resume" ? "#i-resume" : "#i-design";
      const label = p.type === "resume" ? "Resume" : "Design";
      open.innerHTML =
        '<span class="project-card__thumb"><svg class="ico"><use href="' + icon + '"/></svg></span>' +
        '<span class="project-card__meta">' +
          '<span class="project-card__name"></span>' +
          '<span class="project-card__row">' +
            '<span class="project-card__badge">' + label + '</span>' +
            '<span class="project-card__date">' + fmtDate(p.updated_at) + '</span>' +
          '</span>' +
        '</span>';
      open.querySelector(".project-card__name").textContent = p.name || "Untitled project";
      open.addEventListener("click", () => openProject(p.id));
      const del = document.createElement("button");
      del.type = "button";
      del.className = "project-card__del";
      del.setAttribute("aria-label", `Delete ${p.name || "Untitled project"}`);
      del.title = "Delete project";
      del.innerHTML = '<svg class="ico" aria-hidden="true"><use href="#i-trash"/></svg>';
      del.addEventListener("click", () => deleteProject(p.id, p.name));
      card.append(open, del);
      el.projects.appendChild(card);
    }
  }

  function openNewProject() {
    el.npName.value = "";
    setNpType("design");
    if (typeof el.npModal.showModal === "function") el.npModal.showModal();
    else el.npModal.setAttribute("open", "");
    setTimeout(() => el.npName.focus(), 30);
  }
  function closeNewProject() {
    if (typeof el.npModal.close === "function") el.npModal.close();
    else el.npModal.removeAttribute("open");
  }
  function setNpType(type) {
    npType = type === "resume" ? "resume" : "design";
    $$("#afp-np-types .np-type").forEach((b) => {
      const on = b.dataset.type === npType;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-checked", String(on));
    });
  }

  function resetPublishedState() {
    State.published = { id: null, revokeUrl: null, expiresAt: null };
    el.rLink.hidden = true;
    el.rLiveUrl.removeAttribute("href");
    el.rLiveUrl.textContent = "";
    el.rExpiry.textContent = "";
    el.rRevoke.hidden = true;
  }
  function releaseLegacyBlobUrls() {
    const urls = new Set();
    if (typeof State.bgImageSrc === "string" && State.bgImageSrc.startsWith("blob:")) urls.add(State.bgImageSrc);
    State.objects.forEach((o) => {
      if (o && typeof o.src === "string" && o.src.startsWith("blob:")) urls.add(o.src);
    });
    urls.forEach((url) => URL.revokeObjectURL(url));
  }
  function resetDesignState() {
    releaseLegacyBlobUrls();
    restore(JSON.stringify(blankDesignData()));
    State.bgAssetId = null;
    State.history = { past: [], future: [], present: null };
    commit({ dirty: false });
    applyZoom(1);
    $$("#afp-dock-right [data-preset]").forEach((b) => setSegActive(b, b.dataset.preset === "16:9"));
  }
  function resetResumeState() {
    el.rRaw.value = "";
    el.rTarget.value = "";
    fillResume(blankResumeData());
    resetPublishedState();
  }
  function resetWorkspace() {
    resetDesignState();
    resetResumeState();
  }

  function enterEditor(view) {
    el.home.hidden = true;
    setInert(el.home, true);
    setInert(el.app, false);
    el.backHome.hidden = false;
    setView(view === "resume" ? "resume" : "design");
    requestAnimationFrame(() => el.stage.focus());
  }
  function applyProjectName(name) {
    const clean = String(name || "Untitled project").trim().slice(0, 120) || "Untitled project";
    State.projectName = clean;
    el.docTitle.textContent = clean;
    document.title = clean + " — Art Flow Pro";
  }

  async function createProject() {
    const name = String(el.npName.value || "Untitled project").trim().slice(0, 120) || "Untitled project";
    const type = npType;
    el.npCreate.disabled = true;
    try {
      const payload = { name, type, data: type === "resume" ? blankResumeData() : blankDesignData() };
      const r = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.project) throw new Error(data.error || "Couldn't create the project.");
      State.projectId = data.project.id;
      State.projectType = type;
      applyProjectName(data.project.name || name);
      resetWorkspace();
      closeNewProject();
      enterEditor(type);
      markSaved();
      toast("Project created.", "ok");
    } catch (err) {
      toast(err.message || "Couldn't create the project.", "error");
    } finally {
      el.npCreate.disabled = false;
    }
  }

  async function openProject(id) {
    try {
      const r = await fetch("/api/projects/" + encodeURIComponent(id));
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.project) throw new Error(data.error || "Couldn't open the project.");
      const p = data.project;
      State.projectId = p.id;
      State.projectType = p.type === "resume" ? "resume" : "design";
      applyProjectName(p.name);
      resetWorkspace();
      if (State.projectType === "resume") {
        fillResume(p.data || {});
      } else if (p.data && Array.isArray(p.data.objects)) {
        restore(JSON.stringify(p.data));
        State.history = { past: [], future: [], present: null };
        commit({ dirty: false });
      }
      enterEditor(State.projectType);
      markSaved();
    } catch (err) {
      toast(err.message || "Couldn't open the project.", "error");
    }
  }

  async function saveProject() {
    if (State.saveState === "saving") return false;
    if (!State.projectId) { openNewProject(); return; }
    const type = activeDocumentType();
    const isResume = type === "resume";
    const payload = {
      id: State.projectId,
      name: State.projectName || "Untitled project",
      type,
      data: isResume ? collectResume() : JSON.parse(serialize()),
    };
    const savingRevision = State.revision;
    setSaveState("saving");
    try {
      const r = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.project) throw new Error(data.error || "Couldn't save the project.");
      State.projectType = type;
      if (data.project.name) applyProjectName(data.project.name);
      if (State.revision === savingRevision) {
        markSaved();
        toast("Project saved.", "ok");
      } else {
        State.dirty = true;
        setSaveState("dirty", "Unsaved");
        toast("Earlier changes saved; newer edits are still unsaved.", "ok");
      }
      return true;
    } catch (err) {
      State.dirty = true;
      setSaveState("error");
      toast(err.message || "Couldn't save the project.", "error");
      return false;
    }
  }

  async function deleteProject(id, name) {
    if (!window.confirm("Delete “" + (name || "this project") + "”? This can't be undone.")) return;
    try {
      const r = await fetch("/api/projects/" + encodeURIComponent(id), { method: "DELETE" });
      if (!r.ok) throw new Error("delete failed");
      toast("Project deleted.", "ok");
    } catch (_) {
      toast("Couldn't delete the project.", "error");
    }
    loadProjects();
  }

  /* ── 09 · Canvas model + factories ──────────────────────────────────────── */
  function makeText(text, x, y, opts = {}) {
    const o = {
      id: uid(), type: "text", text: String(text || "Text").slice(0, 5000),
      x: round(boundedNumber(x, 0, -State.canvas.w * 2, State.canvas.w * 2)),
      y: round(boundedNumber(y, 0, -State.canvas.h * 2, State.canvas.h * 2)), w: 0, h: 0,
      size: round(boundedNumber(opts.size, 120, 8, 4000)),
      weight: round(boundedNumber(opts.weight, 600, 100, 900)),
      fill: normalizeHex(opts.color, "#eaf1f4"), opacity: boundedNumber(opts.opacity, 1, 0, 1), visible: true,
    };
    measureText(o);
    return o;
  }
  function makeShape(kind, x, y, w, h, color) {
    return {
      id: uid(), type: kind === "circle" ? "circle" : "rect",
      x: round(boundedNumber(x, 0, -State.canvas.w * 2, State.canvas.w * 2)),
      y: round(boundedNumber(y, 0, -State.canvas.h * 2, State.canvas.h * 2)),
      w: round(boundedNumber(w, 100, 1, 8192)), h: round(boundedNumber(h, 100, 1, 8192)),
      fill: normalizeHex(color, "#7fd5e8"), opacity: 1, visible: true,
    };
  }
  function makeImage(src, img, x, y, w, h, assetId = null) {
    const o = {
      id: uid(), type: "image", src,
      x: round(boundedNumber(x, 0, -State.canvas.w * 2, State.canvas.w * 2)),
      y: round(boundedNumber(y, 0, -State.canvas.h * 2, State.canvas.h * 2)),
      w: round(boundedNumber(w, img.width || 100, 1, 8192)),
      h: round(boundedNumber(h, img.height || 100, 1, 8192)),
      opacity: 1, visible: true, assetId: typeof assetId === "string" ? assetId.slice(0, 160) : null,
    };
    o._img = img;
    imageCache.set(src, img);
    return o;
  }
  function measureText(o) {
    ctx.save();
    ctx.font = `${o.weight} ${o.size}px "Hanken Grotesk", system-ui, sans-serif`;
    const lines = String(o.text).split("\n");
    let max = 0;
    for (const ln of lines) max = Math.max(max, ctx.measureText(ln).width);
    ctx.restore();
    o.w = round(max);
    o.h = round(lines.length * o.size * 1.2);
  }
  function selectedObject() {
    return State.selected >= 0 ? State.objects[State.selected] : null;
  }

  /* ── 10 · Canvas renderer (2D) ──────────────────────────────────────────── */
  function render() {
    const { w, h } = State.canvas;
    ctx.clearRect(0, 0, w, h);
    // Background
    if (State.bgImage) {
      drawCover(State.bgImage, 0, 0, w, h);
    } else {
      ctx.fillStyle = State.bg;
      ctx.fillRect(0, 0, w, h);
    }
    // Objects (array order = z-index; first = back)
    for (const o of State.objects) {
      if (!o.visible) continue;
      ctx.save();
      ctx.globalAlpha = clamp(o.opacity ?? 1, 0, 1);
      if (o.type === "rect") {
        ctx.fillStyle = o.fill;
        ctx.fillRect(o.x, o.y, o.w, o.h);
      } else if (o.type === "circle") {
        ctx.fillStyle = o.fill;
        ctx.beginPath();
        ctx.ellipse(o.x + o.w / 2, o.y + o.h / 2, Math.abs(o.w / 2), Math.abs(o.h / 2), 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (o.type === "text") {
        ctx.fillStyle = o.fill;
        ctx.textBaseline = "top";
        ctx.font = `${o.weight} ${o.size}px "Hanken Grotesk", system-ui, sans-serif`;
        const lh = o.size * 1.2;
        String(o.text).split("\n").forEach((ln, i) => ctx.fillText(ln, o.x, o.y + i * lh));
      } else if (o.type === "image" && o._img) {
        ctx.drawImage(o._img, o.x, o.y, o.w, o.h);
      }
      ctx.restore();
    }
  }
  function drawCover(img, dx, dy, dw, dh) {
    const ir = img.width / img.height;
    const dr = dw / dh;
    let sx = 0, sy = 0, sw = img.width, sh = img.height;
    if (ir > dr) { sw = img.height * dr; sx = (img.width - sw) / 2; }
    else { sh = img.width / dr; sy = (img.height - sh) / 2; }
    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
  }

  /* ── 11 · Overlay renderer (SVG selection + handles) ────────────────────── */
  const HANDLE_DIRS = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
  function logicalPerScreenPx() {
    const r = el.canvas.getBoundingClientRect();
    return r.width ? State.canvas.w / r.width : 1;
  }
  function renderOverlay() {
    while (el.overlay.firstChild) el.overlay.removeChild(el.overlay.firstChild);
    const o = selectedObject();
    if (!o) return;
    const unit = logicalPerScreenPx();
    const stroke = clamp(1.5 * unit, 0.5, 40);
    const hs = clamp(8 * unit, 4, 160); // handle size (logical)

    const box = svgEl("rect", {
      x: o.x, y: o.y, width: Math.abs(o.w), height: Math.abs(o.h),
      fill: "none", stroke: "var(--accent)", "stroke-width": stroke,
      "stroke-dasharray": `${4 * unit} ${3 * unit}`, "pointer-events": "none",
    });
    el.overlay.appendChild(box);

    HANDLE_DIRS.forEach((dir) => {
      const p = handlePoint(o, dir);
      const rect = svgEl("rect", {
        x: p.x - hs / 2, y: p.y - hs / 2, width: hs, height: hs, rx: hs * 0.25,
        fill: "var(--bg-1)", stroke: "var(--accent)", "stroke-width": stroke,
        "pointer-events": "all", style: "cursor:" + handleCursor(dir),
      });
      rect.dataset.handle = dir;
      rect.addEventListener("pointerdown", (e) => beginResize(e, dir));
      el.overlay.appendChild(rect);
    });
  }
  function handlePoint(o, dir) {
    const x = o.x, y = o.y, w = o.w, h = o.h;
    const mx = x + w / 2, my = y + h / 2;
    switch (dir) {
      case "nw": return { x, y };
      case "n": return { x: mx, y };
      case "ne": return { x: x + w, y };
      case "e": return { x: x + w, y: my };
      case "se": return { x: x + w, y: y + h };
      case "s": return { x: mx, y: y + h };
      case "sw": return { x, y: y + h };
      case "w": return { x, y: my };
    }
  }
  function handleCursor(dir) {
    return { n: "ns-resize", s: "ns-resize", e: "ew-resize", w: "ew-resize",
      nw: "nwse-resize", se: "nwse-resize", ne: "nesw-resize", sw: "nesw-resize" }[dir];
  }

  /* ── 12 · Hit testing ───────────────────────────────────────────────────── */
  function clientToCanvas(clientX, clientY) {
    const r = el.canvas.getBoundingClientRect();
    return {
      x: ((clientX - r.left) / r.width) * State.canvas.w,
      y: ((clientY - r.top) / r.height) * State.canvas.h,
    };
  }
  function hitTest(px, py) {
    for (let i = State.objects.length - 1; i >= 0; i--) {
      const o = State.objects[i];
      if (!o.visible) continue;
      const x = Math.min(o.x, o.x + o.w), y = Math.min(o.y, o.y + o.h);
      const w = Math.abs(o.w), h = Math.abs(o.h);
      if (o.type === "circle") {
        const rx = w / 2, ry = h / 2, cx = x + rx, cy = y + ry;
        if (rx > 0 && ry > 0 && ((px - cx) ** 2) / (rx * rx) + ((py - cy) ** 2) / (ry * ry) <= 1) return i;
      } else if (px >= x && px <= x + w && py >= y && py <= y + h) {
        return i;
      }
    }
    return -1;
  }

  /* ── 13 · Pointer interaction ───────────────────────────────────────────── */
  let drag = null; // { mode, startPointer, startBox, dir }

  function selectIndex(i, { sync = true } = {}) {
    State.selected = i;
    renderOverlay();
    positionFloatbar();
    if (sync) { syncProps(); renderLayers(); }
  }

  function onCanvasPointerDown(e) {
    const p = clientToCanvas(e.clientX, e.clientY);
    if (State.tool === "text") {
      const text = window.prompt("Text", "Studio");
      if (text != null && text.trim()) {
        const o = makeText(text.trim(), p.x, p.y, { size: Math.round(State.canvas.h / 9) });
        const added = addObject(o);
        setTool("select");
        if (added) selectIndex(State.objects.length - 1);
      }
      return;
    }
    if (State.tool === "shape") {
      const base = Math.round(State.canvas.h / 3);
      const w = State.shapeKind === "circle" ? base : Math.round(base * 1.4);
      const h = base;
      const o = makeShape(State.shapeKind, p.x - w / 2, p.y - h / 2, w, h, "#7fd5e8");
      const added = addObject(o);
      setTool("select");
      if (added) selectIndex(State.objects.length - 1);
      return;
    }
    if (State.tool === "image") {
      setView("design");
      el.imagePrompt.focus();
      return;
    }
    // select tool: hit test → select + begin move
    const i = hitTest(p.x, p.y);
    selectIndex(i);
    if (i >= 0) {
      const o = State.objects[i];
      drag = { mode: "move", startPointer: p, startBox: { x: o.x, y: o.y } };
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp, { once: true });
      window.addEventListener("pointercancel", onPointerUp, { once: true });
    }
  }

  function beginResize(e, dir) {
    e.stopPropagation();
    e.preventDefault();
    const o = selectedObject();
    if (!o) return;
    const p = clientToCanvas(e.clientX, e.clientY);
    drag = {
      mode: "resize", dir, startPointer: p,
      startBox: { x: o.x, y: o.y, w: o.w, h: o.h, size: o.size || 0 },
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp, { once: true });
    window.addEventListener("pointercancel", onPointerUp, { once: true });
  }

  function onPointerMove(e) {
    if (!drag) return;
    const o = selectedObject();
    if (!o) return;
    const p = clientToCanvas(e.clientX, e.clientY);
    const dx = p.x - drag.startPointer.x;
    const dy = p.y - drag.startPointer.y;

    if (drag.mode === "move") {
      o.x = round(drag.startBox.x + dx);
      o.y = round(drag.startBox.y + dy);
    } else if (drag.mode === "resize") {
      let { x, y, w, h } = drag.startBox;
      const d = drag.dir;
      if (d.includes("e")) w = drag.startBox.w + dx;
      if (d.includes("s")) h = drag.startBox.h + dy;
      if (d.includes("w")) { w = drag.startBox.w - dx; x = drag.startBox.x + dx; }
      if (d.includes("n")) { h = drag.startBox.h - dy; y = drag.startBox.y + dy; }
      const MIN = 8;
      if (w < MIN) { w = MIN; if (d.includes("w")) x = drag.startBox.x + drag.startBox.w - MIN; }
      if (h < MIN) { h = MIN; if (d.includes("n")) y = drag.startBox.y + drag.startBox.h - MIN; }
      o.x = round(x); o.y = round(y);
      if (o.type === "text") {
        const ratio = h / Math.max(1, drag.startBox.h);
        o.size = clamp(round(drag.startBox.size * ratio), 8, 4000);
        measureText(o);
      } else {
        o.w = round(w); o.h = round(h);
      }
    }
    render();
    renderOverlay();
    positionFloatbar();
    syncProps();
  }
  function onPointerUp() {
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerUp);
    if (drag) { drag = null; commit(); renderLayers(); }
  }

  function addObject(o) {
    if (!o || State.objects.length >= MAX_OBJECTS) {
      toast(`A design can contain up to ${MAX_OBJECTS} objects.`, "error");
      return false;
    }
    State.objects.push(o);
    render();
    commit();
    renderLayers();
    return true;
  }
  function deleteSelected() {
    if (State.selected < 0) return;
    State.objects.splice(State.selected, 1);
    selectIndex(-1, { sync: false });
    render();
    commit();
    syncProps();
    renderLayers();
  }
  function duplicateSelected() {
    const o = selectedObject();
    if (!o) return;
    if (State.objects.length >= MAX_OBJECTS) { toast(`A design can contain up to ${MAX_OBJECTS} objects.`, "error"); return; }
    const copy = JSON.parse(JSON.stringify({ ...o, _img: undefined }));
    copy.id = uid();
    copy.x += 40; copy.y += 40;
    if (o.type === "image") copy._img = o._img;
    State.objects.push(copy);
    render();
    commit();
    selectIndex(State.objects.length - 1);
  }
  function bringToFront() {
    const o = selectedObject();
    if (!o) return;
    State.objects.splice(State.selected, 1);
    State.objects.push(o);
    selectIndex(State.objects.length - 1, { sync: false });
    render();
    commit();
    renderLayers();
  }

  /* ── 14 · Floating contextual toolbar ───────────────────────────────────── */
  function positionFloatbar() {
    const o = selectedObject();
    if (!o || State.view !== "design") { el.floatbar.hidden = true; return; }
    el.floatbar.hidden = false;
    if (o.type !== "image") {
      el.floatSwatch.style.background = o.fill || "var(--accent)";
    } else {
      el.floatSwatch.style.background = "var(--accent)";
    }
    const cRect = el.canvas.getBoundingClientRect();
    const wRect = el.canvasWrap.getBoundingClientRect();
    const sx = (Math.min(o.x, o.x + o.w) / State.canvas.w) * cRect.width;
    const sy = (Math.min(o.y, o.y + o.h) / State.canvas.h) * cRect.height;
    const sw = (Math.abs(o.w) / State.canvas.w) * cRect.width;
    const baseLeft = cRect.left - wRect.left + el.canvasWrap.scrollLeft + sx;
    const baseTop = cRect.top - wRect.top + el.canvasWrap.scrollTop + sy;
    const fbW = el.floatbar.offsetWidth || 180;
    const fbH = el.floatbar.offsetHeight || 44;
    let left = baseLeft + sw / 2 - fbW / 2;
    let top = baseTop - fbH - 12;
    if (top < 4) top = baseTop + ((Math.abs(o.h) / State.canvas.h) * cRect.height) + 12;
    left = clamp(left, 4, el.canvasWrap.scrollWidth - fbW - 4);
    el.floatbar.style.left = left + "px";
    el.floatbar.style.top = top + "px";
  }

  /* ── 15 · Properties + background + presets ─────────────────────────────── */
  function syncProps() {
    const o = selectedObject();
    const emptyHint = $('[data-when="empty"]', el.props);
    const grid = $('[data-when="object"]', el.props);
    if (!o) {
      el.props.dataset.empty = "true";
      if (emptyHint) emptyHint.hidden = false;
      if (grid) grid.hidden = true;
      return;
    }
    el.props.dataset.empty = "false";
    if (emptyHint) emptyHint.hidden = true;
    if (grid) grid.hidden = false;
    el.propX.value = round(o.x);
    el.propY.value = round(o.y);
    el.propW.value = round(Math.abs(o.w));
    el.propH.value = round(Math.abs(o.h));
    const fill = o.type === "image" ? "#7fd5e8" : o.fill;
    el.propFill.value = normalizeHex(fill, "#7fd5e8");
    el.propFillHex.textContent = normalizeHex(fill, "#7fd5e8").toUpperCase();
    el.propFill.disabled = o.type === "image";
    el.propOpacity.value = round((o.opacity ?? 1) * 100);
  }
  function applyPropFromInputs(commitNow) {
    const o = selectedObject();
    if (!o) return;
    o.x = round(parseFloat(el.propX.value) || 0);
    o.y = round(parseFloat(el.propY.value) || 0);
    const w = round(parseFloat(el.propW.value) || 0);
    const h = round(parseFloat(el.propH.value) || 0);
    if (o.type === "text") {
      if (h > 0 && o.h > 0) { o.size = clamp(round(o.size * (h / o.h)), 8, 4000); measureText(o); }
    } else {
      o.w = Math.max(1, w); o.h = Math.max(1, h);
    }
    render(); renderOverlay(); positionFloatbar();
    if (commitNow) { commit(); renderLayers(); }
  }
  function setBackgroundColor(hex, commitNow = true) {
    State.bg = normalizeHex(hex, State.bg);
    State.bgImage = null;
    State.bgImageSrc = null;
    State.bgAssetId = null;
    el.bgColor.value = State.bg;
    el.bgHex.textContent = State.bg.toUpperCase();
    render();
    if (commitNow) commit();
  }
  function setCanvasSize(w, h, commitNow = true) {
    w = round(boundedNumber(w, State.canvas.w, 16, 8192));
    h = round(boundedNumber(h, State.canvas.h, 16, 8192));
    State.canvas = { w, h };
    el.canvas.width = w;
    el.canvas.height = h;
    el.overlay.setAttribute("viewBox", `0 0 ${w} ${h}`);
    el.docSize.textContent = `${w} × ${h}`;
    render(); renderOverlay(); positionFloatbar();
    if (commitNow) commit();
  }
  function applyPreset(name) {
    const p = PRESETS[name];
    if (!p) return;
    setCanvasSize(p[0], p[1]);
    $$("#afp-dock-right [data-preset]").forEach((b) => setSegActive(b, b.dataset.preset === name));
  }
  function clearCanvas(commitNow = true) {
    State.objects = [];
    State.bgImage = null;
    State.bgImageSrc = null;
    State.bgAssetId = null;
    selectIndex(-1, { sync: false });
    render(); syncProps(); renderLayers();
    if (commitNow) commit();
  }

  /* ── 16 · Layers ────────────────────────────────────────────────────────── */
  function layerLabel(o) {
    if (o.type === "text") return "Text · " + String(o.text).slice(0, 18);
    if (o.type === "rect") return "Rectangle";
    if (o.type === "circle") return "Circle";
    if (o.type === "image") return "Image";
    return "Layer";
  }
  function layerIcon(o) {
    return o.type === "text" ? "#i-type" : o.type === "image" ? "#i-image" : "#i-shape";
  }
  function renderLayers() {
    el.layers.innerHTML = "";
    for (let i = State.objects.length - 1; i >= 0; i--) {
      const o = State.objects[i];
      const li = document.createElement("li");
      li.className = "layer" + (i === State.selected ? " is-selected" : "");
      li.innerHTML =
        `<svg class="ico"><use href="${layerIcon(o)}"/></svg>` +
        `<span class="layer__name">${escapeHtml(layerLabel(o))}</span>` +
        `<button class="layer__vis" type="button" aria-label="Toggle visibility">` +
        `<svg class="ico"><use href="${o.visible ? "#i-design" : "#i-close"}"/></svg></button>`;
      li.addEventListener("click", (e) => {
        if (e.target.closest(".layer__vis")) return;
        selectIndex(i);
      });
      li.querySelector(".layer__vis").addEventListener("click", (e) => {
        e.stopPropagation();
        o.visible = !o.visible;
        render(); renderLayers(); commit();
      });
      el.layers.appendChild(li);
    }
  }

  /* ── 17 · Zoom ──────────────────────────────────────────────────────────── */
  function applyZoom(z) {
    State.zoom = clamp(z, 0.1, 4);
    el.canvasFrame.style.transform = `scale(${State.zoom})`;
    el.canvasFrame.style.transformOrigin = "center center";
    el.zoomValue.textContent = Math.round(State.zoom * 100) + "%";
    renderOverlay();
    positionFloatbar();
  }

  /* ── 18 · History (undo / redo) ─────────────────────────────────────────── */
  function serialize() {
    return JSON.stringify({
      bg: State.bg,
      bgSrc: State.bgImageSrc,
      bgAssetId: State.bgAssetId,
      w: State.canvas.w,
      h: State.canvas.h,
      objects: State.objects.map((o) => ({ ...o, _img: undefined })),
    });
  }
  function commit({ dirty = true } = {}) {
    const snap = serialize();
    if (snap === State.history.present) { updateHistoryButtons(); return; }
    if (State.history.present !== null) State.history.past.push(State.history.present);
    if (State.history.past.length > 60) State.history.past.shift();
    State.history.present = snap;
    State.history.future = [];
    updateHistoryButtons();
    if (dirty) markDirty();
  }
  function sanitizeCanvasObject(raw, canvas) {
    if (!raw || typeof raw !== "object" || !["text", "rect", "circle", "image"].includes(raw.type)) return null;
    const common = {
      id: typeof raw.id === "string" && raw.id.length <= 80 ? raw.id : uid(),
      type: raw.type,
      x: round(boundedNumber(raw.x, 0, -canvas.w * 2, canvas.w * 2)),
      y: round(boundedNumber(raw.y, 0, -canvas.h * 2, canvas.h * 2)),
      opacity: boundedNumber(raw.opacity, 1, 0, 1),
      visible: raw.visible !== false,
    };
    if (raw.type === "text") {
      const obj = {
        ...common,
        text: String(raw.text || "Text").slice(0, 5000),
        size: round(boundedNumber(raw.size, 120, 8, 4000)),
        weight: round(boundedNumber(raw.weight, 600, 100, 900)),
        fill: normalizeHex(raw.fill, "#eaf1f4"),
      };
      measureText(obj);
      return obj;
    }
    const w = round(boundedNumber(raw.w, 100, 1, 8192));
    const h = round(boundedNumber(raw.h, 100, 1, 8192));
    if (raw.type === "image") {
      const src = safeAssetUrl(raw.src);
      if (!src) return null;
      return {
        ...common, w, h, src,
        assetId: typeof raw.assetId === "string" ? raw.assetId.slice(0, 160) : null,
      };
    }
    return { ...common, w, h, fill: normalizeHex(raw.fill, "#7fd5e8") };
  }
  function restore(snapStr, { notify = true } = {}) {
    let raw;
    try { raw = typeof snapStr === "string" ? JSON.parse(snapStr) : snapStr; }
    catch (_) { raw = null; }
    const valid = raw && typeof raw === "object";
    const source = valid ? raw : blankDesignData();
    const w = round(boundedNumber(source.w, DEFAULT_DESIGN.w, 16, 8192));
    const h = round(boundedNumber(source.h, DEFAULT_DESIGN.h, 16, 8192));
    const canvas = { w, h };
    State.bg = normalizeHex(source.bg, DEFAULT_DESIGN.bg);
    State.canvas = canvas;
    el.canvas.width = w; el.canvas.height = h;
    el.overlay.setAttribute("viewBox", `0 0 ${w} ${h}`);
    el.docSize.textContent = `${w} × ${h}`;
    el.bgColor.value = State.bg;
    el.bgHex.textContent = State.bg.toUpperCase();

    const rawObjects = Array.isArray(source.objects) ? source.objects.slice(0, MAX_OBJECTS) : [];
    State.objects = rawObjects.map((o) => sanitizeCanvasObject(o, canvas)).filter(Boolean);
    let imageWarningShown = false;
    State.objects.forEach((obj) => {
      if (obj.type !== "image") return;
      const cached = imageCache.get(obj.src);
      if (cached) obj._img = cached;
      else loadImage(obj.src).then((img) => {
        imageCache.set(obj.src, img); obj._img = img; render();
      }).catch(() => {
        if (!imageWarningShown) toast("One or more saved images could not be restored.", "error", 5000);
        imageWarningShown = true;
      });
    });

    State.bgImageSrc = safeAssetUrl(source.bgSrc);
    State.bgAssetId = typeof source.bgAssetId === "string" ? source.bgAssetId.slice(0, 160) : null;
    State.bgImage = null;
    if (State.bgImageSrc) {
      const cached = imageCache.get(State.bgImageSrc);
      if (cached) State.bgImage = cached;
      else loadImage(State.bgImageSrc).then((img) => {
        imageCache.set(State.bgImageSrc, img); State.bgImage = img; render();
      }).catch(() => toast("The saved background image could not be restored.", "error", 5000));
    }
    State.selected = -1;
    render(); renderOverlay(); positionFloatbar(); syncProps(); renderLayers();
    if (!valid && notify) toast("This project contained invalid design data and was opened as a blank canvas.", "error", 5000);
    return valid;
  }
  function undo() {
    if (!State.history.past.length) return;
    State.history.future.push(State.history.present);
    State.history.present = State.history.past.pop();
    restore(State.history.present);
    updateHistoryButtons();
    markDirty();
  }
  function redo() {
    if (!State.history.future.length) return;
    State.history.past.push(State.history.present);
    State.history.present = State.history.future.pop();
    restore(State.history.present);
    updateHistoryButtons();
    markDirty();
  }
  function updateHistoryButtons() {
    el.undo.disabled = State.history.past.length === 0;
    el.redo.disabled = State.history.future.length === 0;
    el.mobileUndo.disabled = el.undo.disabled;
    el.mobileRedo.disabled = el.redo.disabled;
  }

  /* ── 19 · afp-actions dispatcher ────────────────────────────────────────── */
  function setTool(tool) {
    if (!["select", "text", "shape", "image"].includes(tool)) return;
    State.tool = tool;
    $$("#afp-tools [data-tool]").forEach((b) => {
      const on = b.dataset.tool === tool;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    $$("[data-toolopts]").forEach((s) => { s.hidden = s.dataset.toolopts !== tool; });
    el.canvas.style.cursor = tool === "select" ? "default" : "crosshair";
  }

  function dispatchActions(actions) {
    if (!Array.isArray(actions)) return;
    for (const a of actions.slice(0, 100)) {
      if (!a || typeof a !== "object") continue;
      try {
        switch (a.type) {
          case "setBackground":
            setBackgroundColor(a.color || State.bg);
            break;
          case "setCanvasSize":
            if (a.preset && PRESETS[a.preset]) applyPreset(a.preset);
            else if (a.width && a.height) setCanvasSize(a.width, a.height);
            break;
          case "addText": {
            const o = makeText(a.text || "Text", a.x ?? State.canvas.w / 2, a.y ?? State.canvas.h / 2,
              { size: a.size, weight: a.weight, color: a.color });
            addObject(o);
            break;
          }
          case "addShape": {
            const w = a.w || 400, h = a.h || 300;
            const x = a.x ?? (State.canvas.w / 2 - w / 2);
            const y = a.y ?? (State.canvas.h / 2 - h / 2);
            addObject(makeShape(a.shape, x, y, w, h, a.color));
            break;
          }
          case "setTool":
            setTool(a.tool);
            break;
          case "setTheme":
            applyTheme(a.theme);
            break;
          case "clearCanvas":
            if (window.confirm("Art Flow AI wants to clear the canvas. Continue? You can still use Undo afterward.")) clearCanvas();
            else toast("Clear canvas action skipped.", "ok");
            break;
          case "generateImage":
            if (window.confirm("Art Flow AI wants to generate an image using the configured image service. Continue?")) {
              generateImageFlow(a.prompt, a.as || "background", { x: a.x, y: a.y, w: a.w, h: a.h });
            } else toast("Image generation action skipped.", "ok");
            break;
          default:
            break;
        }
      } catch (err) {
        console.warn("Art Flow AI action failed", a && a.type, err && err.name);
      }
    }
  }

  /* ── 20 · Image generation (/api/image) ─────────────────────────────────── */
  function imageDims(asKind, opts = {}) {
    if (asKind === "background") {
      const ratio = State.canvas.w / State.canvas.h;
      let w = Math.min(1024, State.canvas.w);
      let h = round(w / ratio);
      if (h > 1024) { h = 1024; w = round(h * ratio); }
      return [clamp(w, 64, 1024), clamp(h, 64, 1024)];
    }
    return [
      round(boundedNumber(opts.w, 512, 64, 1024)),
      round(boundedNumber(opts.h, 512, 64, 1024)),
    ];
  }
  async function generateImageFlow(prompt, asKind, opts = {}) {
    prompt = String(prompt || "").trim().slice(0, 2000);
    if (!prompt) { toast("Add a description for the image first.", "error"); return; }
    if (State.imageGenerating) { toast("An image is already being generated.", "ok"); return; }
    if (asKind !== "background" && State.objects.length >= MAX_OBJECTS) {
      toast(`A design can contain up to ${MAX_OBJECTS} objects.`, "error"); return;
    }
    const [w, h] = imageDims(asKind, opts);
    State.imageGenerating = true;
    el.generateImage.disabled = true;
    el.generateImage.setAttribute("aria-busy", "true");
    toast("Generating image…", "ok", 2200);
    try {
      const r = await fetch("/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, width: w, height: h }),
      });
      const ct = (r.headers.get("content-type") || "").toLowerCase();
      let url;
      let assetId = null;
      if (ct.includes("application/json")) {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error || `Image failed (${r.status})`);
        url = safeSameOriginUrl(data.url);
        assetId = typeof data.asset_id === "string" ? data.asset_id.slice(0, 160) : null;
        if (!url || !assetId) throw new Error("The image service returned an invalid asset reference.");
      } else if (r.ok && ct.startsWith("image/")) {
        // Compatibility path for older servers. Blob URLs last only for this tab.
        const blob = await r.blob();
        url = URL.createObjectURL(blob);
      } else {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.error || `Image failed (${r.status})`);
      }
      const img = await loadImage(url);
      imageCache.set(url, img);
      if (asKind === "background") {
        State.bgImage = img;
        State.bgImageSrc = url;
        State.bgAssetId = assetId;
        render(); commit();
        toast("Background updated.", "ok");
      } else {
        const ow = boundedNumber(opts.w, img.width, 1, 8192);
        const oh = boundedNumber(opts.h, img.height, 1, 8192);
        const x = opts.x ?? (State.canvas.w / 2 - ow / 2);
        const y = opts.y ?? (State.canvas.h / 2 - oh / 2);
        const o = makeImage(url, img, x, y, ow, oh, assetId);
        if (addObject(o)) {
          selectIndex(State.objects.length - 1);
          toast("Image added.", "ok");
        }
      }
    } catch (err) {
      toast(err.message || "Image generation failed.", "error", 5000);
    } finally {
      State.imageGenerating = false;
      el.generateImage.disabled = false;
      el.generateImage.removeAttribute("aria-busy");
    }
  }

  /* ── 21 · Streaming Copilot (/api/chat) ─────────────────────────────────── */
  function clearChatIntro() {
    const intro = $(".chat__intro", el.chatLog);
    if (intro) intro.remove();
  }
  function addMessage(role, text) {
    clearChatIntro();
    const msg = document.createElement("div");
    msg.className = "msg msg--" + (role === "user" ? "user" : "ai");
    const body = document.createElement("div");
    body.className = "msg__body";
    body.innerHTML = role === "user" ? fmtLite(text) : fmtLite(text || "");
    msg.appendChild(body);
    el.chatLog.appendChild(msg);
    el.chatLog.scrollTop = el.chatLog.scrollHeight;
    return { msg, body };
  }
  function visibleChat(buffer) {
    // Hide the machine-readable tail while streaming.
    return buffer.split(/```afp-actions/i)[0].replace(/\s+$/, "");
  }
  function parseActionsFromText(buffer) {
    const m = buffer.match(/```afp-actions\s*([\s\S]*?)```/i);
    let jsonStr = null;
    if (m) jsonStr = m[1];
    else if (/```afp-actions/i.test(buffer)) {
      const after = buffer.split(/```afp-actions/i)[1] || "";
      const a = after.indexOf("["), b = after.lastIndexOf("]");
      if (a !== -1 && b !== -1 && b > a) jsonStr = after.slice(a, b + 1);
    }
    if (!jsonStr) return [];
    try {
      const arr = JSON.parse(jsonStr.trim());
      return Array.isArray(arr) ? arr : [];
    } catch (_) {
      return [];
    }
  }
  async function sendChat(text) {
    text = String(text || "").trim().slice(0, 8000);
    if (!text || State.chat.streaming) return;
    addMessage("user", text);
    State.chat.messages.push({ role: "user", content: text });
    if (State.chat.messages.length > 24) State.chat.messages = State.chat.messages.slice(-24);

    const { msg, body } = addMessage("assistant", "");
    msg.classList.add("is-streaming");
    State.chat.streaming = true;
    el.chatInput.value = "";
    autoGrow(el.chatInput);

    let buffer = "";
    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: State.chat.messages }),
      });
      if (!resp.ok || !resp.body) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error || `Chat failed (${resp.status})`);
      }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let carry = "";
      let streamErr = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        carry += decoder.decode(value, { stream: true });
        const lines = carry.split("\n");
        carry = lines.pop() || "";
        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith("data:")) continue;
          const payload = t.slice(5).trim();
          if (payload === "[DONE]") continue;
          try {
            const obj = JSON.parse(payload);
            if (obj.delta) {
              buffer = (buffer + String(obj.delta)).slice(0, 100000);
              body.innerHTML = fmtLite(visibleChat(buffer));
              el.chatLog.scrollTop = el.chatLog.scrollHeight;
            } else if (obj.error) {
              streamErr = obj.error;
            }
          } catch (_) { /* ignore partial frame */ }
        }
      }
      if (streamErr) throw new Error(typeof streamErr === "string" ? streamErr : "Model error");

      const actions = parseActionsFromText(buffer);
      const shown = visibleChat(buffer).trim();
      body.innerHTML = fmtLite(shown || (actions.length ? "Done." : ""));
      State.chat.messages.push({ role: "assistant", content: (shown || "(actions executed)").slice(0, 8000) });
      if (actions.length) dispatchActions(actions);
    } catch (err) {
      body.innerHTML = fmtLite("⚠ " + (err.message || "Something went wrong."));
      msg.classList.add("msg--error");
    } finally {
      msg.classList.remove("is-streaming");
      State.chat.streaming = false;
      el.chatLog.scrollTop = el.chatLog.scrollHeight;
    }
  }

  /* ── 22 · Resume builder ────────────────────────────────────────────────── */
  function expCard(data = {}) {
    const wrap = document.createElement("div");
    wrap.className = "rcard";
    wrap.dataset.kind = "experience";
    wrap.innerHTML =
      `<button class="rcard__del" type="button" aria-label="Remove role"><svg class="ico"><use href="#i-trash"/></svg></button>` +
      `<div class="rcard__row">` +
      `<label class="rcard__field"><span>Role</span><input class="field" data-f="role" type="text" maxlength="300" autocomplete="organization-title" value="${escapeHtml(data.role || "")}" /></label>` +
      `<label class="rcard__field"><span>Company</span><input class="field" data-f="company" type="text" maxlength="300" autocomplete="organization" value="${escapeHtml(data.company || "")}" /></label>` +
      `</div>` +
      `<div class="rcard__row">` +
      `<label class="rcard__field"><span>Start</span><input class="field" data-f="start" type="text" maxlength="100" placeholder="2021" value="${escapeHtml(data.start || "")}" /></label>` +
      `<label class="rcard__field"><span>End</span><input class="field" data-f="end" type="text" maxlength="100" placeholder="Present" value="${escapeHtml(data.end || "")}" /></label>` +
      `</div>` +
      `<label class="rcard__field"><span>Achievements</span><textarea class="field field--area" data-f="bullets" rows="3" maxlength="12000" placeholder="One achievement per line">${escapeHtml((data.bullets || []).join("\n"))}</textarea></label>`;
    wrap.querySelector(".rcard__del").addEventListener("click", () => { wrap.remove(); markDirty(); renderResumePreview(); });
    wrap.addEventListener("input", resumeChanged);
    return wrap;
  }
  function eduCard(data = {}) {
    const wrap = document.createElement("div");
    wrap.className = "rcard";
    wrap.dataset.kind = "education";
    wrap.innerHTML =
      `<button class="rcard__del" type="button" aria-label="Remove school"><svg class="ico"><use href="#i-trash"/></svg></button>` +
      `<div class="rcard__row">` +
      `<label class="rcard__field"><span>Degree</span><input class="field" data-f="degree" type="text" maxlength="300" autocomplete="off" value="${escapeHtml(data.degree || "")}" /></label>` +
      `<label class="rcard__field"><span>School</span><input class="field" data-f="school" type="text" maxlength="300" autocomplete="organization" value="${escapeHtml(data.school || "")}" /></label>` +
      `</div>` +
      `<div class="rcard__row">` +
      `<label class="rcard__field"><span>Start</span><input class="field" data-f="start" type="text" maxlength="100" value="${escapeHtml(data.start || "")}" /></label>` +
      `<label class="rcard__field"><span>End</span><input class="field" data-f="end" type="text" maxlength="100" value="${escapeHtml(data.end || "")}" /></label>` +
      `</div>`;
    wrap.querySelector(".rcard__del").addEventListener("click", () => { wrap.remove(); markDirty(); renderResumePreview(); });
    wrap.addEventListener("input", resumeChanged);
    return wrap;
  }
  function readCard(wrap) {
    const obj = {};
    $$("[data-f]", wrap).forEach((f) => {
      if (f.dataset.f === "bullets") {
        obj.bullets = f.value.split("\n").map((s) => s.trim()).filter(Boolean);
      } else {
        obj[f.dataset.f] = f.value.trim();
      }
    });
    return obj;
  }
  function collectResume() {
    return sanitizeResumeData({
      name: el.rName.value.trim(),
      title: el.rTitle.value.trim(),
      contact: {
        email: el.rEmail.value.trim(),
        phone: el.rPhone.value.trim(),
        location: el.rLocation.value.trim(),
        links: [],
      },
      summary: el.rSummary.value.trim(),
      experience: $$(".rcard", el.rExperience).map(readCard),
      education: $$(".rcard", el.rEducation).map(readCard),
      skills: el.rSkills.value.split(",").map((s) => s.trim()).filter(Boolean),
    });
  }
  function sanitizeResumeData(data) {
    const source = data && typeof data === "object" ? data : {};
    const clean = (value, max = 2000) => String(value || "").slice(0, max);
    const contact = source.contact && typeof source.contact === "object" ? source.contact : {};
    const experience = Array.isArray(source.experience) ? source.experience.slice(0, 30) : [];
    const education = Array.isArray(source.education) ? source.education.slice(0, 20) : [];
    return {
      name: clean(source.name, 200),
      title: clean(source.title, 300),
      contact: {
        email: clean(contact.email, 320), phone: clean(contact.phone, 100),
        location: clean(contact.location, 300), links: [],
      },
      summary: clean(source.summary, 8000),
      experience: experience.map((item) => {
        const x = item && typeof item === "object" ? item : {};
        return {
          role: clean(x.role, 300), company: clean(x.company, 300),
          start: clean(x.start, 80), end: clean(x.end, 80),
          bullets: (Array.isArray(x.bullets) ? x.bullets : []).slice(0, 30).map((b) => clean(b, 1000)),
        };
      }),
      education: education.map((item) => {
        const x = item && typeof item === "object" ? item : {};
        return {
          degree: clean(x.degree, 300), school: clean(x.school, 300),
          start: clean(x.start, 80), end: clean(x.end, 80),
        };
      }),
      skills: (Array.isArray(source.skills) ? source.skills : []).slice(0, 100).map((s) => clean(s, 200)),
    };
  }
  function fillResume(data) {
    data = sanitizeResumeData(data);
    el.rName.value = data.name || "";
    el.rTitle.value = data.title || "";
    const c = data.contact || {};
    el.rEmail.value = c.email || "";
    el.rPhone.value = c.phone || "";
    el.rLocation.value = c.location || "";
    el.rSummary.value = data.summary || "";
    el.rExperience.innerHTML = "";
    (data.experience || []).forEach((x) => el.rExperience.appendChild(expCard(x)));
    el.rEducation.innerHTML = "";
    (data.education || []).forEach((x) => el.rEducation.appendChild(eduCard(x)));
    el.rSkills.value = (data.skills || []).join(", ");
    renderResumePreview();
  }
  function renderResumePreview() {
    const r = collectResume();
    if (!r.name && !r.summary && !r.experience.length && !r.skills.length) {
      el.rPreview.innerHTML =
        `<div class="resume__preview-empty"><svg class="ico ico--xl"><use href="#i-resume"/></svg>` +
        `<p>Your live preview renders here as you edit.</p></div>`;
      return;
    }
    const contactBits = [r.contact.email, r.contact.phone, r.contact.location].filter(Boolean);
    let html = `<article class="rp">`;
    html += `<h1 class="rp__name">${escapeHtml(r.name || "Your name")}</h1>`;
    if (r.title) html += `<p class="rp__title">${escapeHtml(r.title)}</p>`;
    if (contactBits.length) html += `<p class="rp__contact">${contactBits.map(escapeHtml).join(" · ")}</p>`;
    if (r.summary) html += `<p class="rp__summary">${escapeHtml(r.summary)}</p>`;
    if (r.experience.length) {
      html += `<h2 class="rp__h">Experience</h2>`;
      r.experience.forEach((x) => {
        const when = [x.start, x.end].filter(Boolean).join(" – ");
        html += `<div class="rp__item"><div class="rp__item-top"><strong>${escapeHtml(x.role || "")}</strong>` +
          `<span class="rp__when">${escapeHtml(when)}</span></div>` +
          (x.company ? `<div class="rp__company">${escapeHtml(x.company)}</div>` : "");
        if (x.bullets && x.bullets.length) {
          html += `<ul class="rp__bullets">${x.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>`;
        }
        html += `</div>`;
      });
    }
    if (r.education.length) {
      html += `<h2 class="rp__h">Education</h2>`;
      r.education.forEach((x) => {
        const when = [x.start, x.end].filter(Boolean).join(" – ");
        html += `<div class="rp__item"><div class="rp__item-top"><strong>${escapeHtml(x.degree || "")}</strong>` +
          `<span class="rp__when">${escapeHtml(when)}</span></div>` +
          (x.school ? `<div class="rp__company">${escapeHtml(x.school)}</div>` : "") + `</div>`;
      });
    }
    if (r.skills.length) {
      html += `<h2 class="rp__h">Skills</h2><div class="rp__skills">` +
        r.skills.map((s) => `<span class="chip">${escapeHtml(s)}</span>`).join("") + `</div>`;
    }
    html += `</article>`;
    el.rPreview.innerHTML = html;
  }
  const debouncedPreview = debounce(renderResumePreview, 220);
  function resumeChanged() {
    markDirty();
    debouncedPreview();
  }

  function withBusy(button, label, fn) {
    const original = button.innerHTML;
    button.disabled = true;
    button.dataset.busy = "1";
    button.setAttribute("aria-busy", "true");
    button.innerHTML = `<svg class="ico"><use href="#i-spark"/></svg><span>${label}</span>`;
    return Promise.resolve()
      .then(fn)
      .catch((err) => toast(err.message || "Request failed.", "error", 5000))
      .finally(() => {
        button.disabled = false;
        delete button.dataset.busy;
        button.removeAttribute("aria-busy");
        button.innerHTML = original;
      });
  }
  async function apiJSON(url, body) {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || `Request failed (${r.status})`);
    return data;
  }

  async function parseResume() {
    const text = el.rRaw.value.trim().slice(0, 20000);
    if (!text) { toast("Paste some resume text first.", "error"); return; }
    return withBusy(el.rParse, "Parsing…", async () => {
      const data = await apiJSON("/api/parse-resume", { text });
      fillResume(data.resume || {});
      markDirty();
      toast("Resume parsed.", "ok");
    });
  }
  async function aiSummary() {
    const summary = el.rSummary.value.trim().slice(0, 8000);
    if (!summary) { toast("Write a summary to polish.", "error"); return; }
    return withBusy(el.aiSummary, "Polishing…", async () => {
      const data = await apiJSON("/api/ai/summary", { summary, role: el.rTarget.value.trim().slice(0, 200) || undefined });
      if (data.text) { el.rSummary.value = data.text; markDirty(); renderResumePreview(); toast("Summary polished.", "ok"); }
    });
  }
  async function aiBullets() {
    const experience = collectResume().experience;
    if (!experience.length) { toast("Add a role with bullets first.", "error"); return; }
    return withBusy(el.aiBullets, "Tightening…", async () => {
      const data = await apiJSON("/api/ai/bullets", { experience });
      const out = data.experience || [];
      const cards = $$(".rcard", el.rExperience);
      out.forEach((item, i) => {
        if (cards[i] && Array.isArray(item.bullets)) {
          const ta = cards[i].querySelector('[data-f="bullets"]');
          if (ta) ta.value = item.bullets.join("\n");
        }
      });
      markDirty();
      renderResumePreview();
      toast("Bullets tightened.", "ok");
    });
  }
  async function aiKeywords() {
    const r = collectResume();
    const text = [
      r.title, r.summary,
      r.experience.map((x) => `${x.role} ${x.company} ${(x.bullets || []).join(" ")}`).join(" "),
      r.skills.join(" "),
    ].join("\n").trim().slice(0, 30000);
    if (!text) { toast("Fill in the resume first.", "error"); return; }
    return withBusy(el.aiKeywords, "Scanning…", async () => {
      const data = await apiJSON("/api/ai/keywords", { text, role: el.rTarget.value.trim().slice(0, 200) || undefined });
      const kws = data.keywords || [];
      if (!kws.length) { toast("No new keywords found.", "ok"); return; }
      const existing = el.rSkills.value.split(",").map((s) => s.trim()).filter(Boolean);
      const lower = new Set(existing.map((s) => s.toLowerCase()));
      kws.forEach((k) => { if (!lower.has(String(k).toLowerCase())) { existing.push(k); lower.add(String(k).toLowerCase()); } });
      el.rSkills.value = existing.join(", ");
      markDirty();
      renderResumePreview();
      toast(`Added ${kws.length} keyword${kws.length > 1 ? "s" : ""}.`, "ok");
    });
  }
  async function aiTone() {
    const text = el.rSummary.value.trim().slice(0, 8000);
    if (!text) { toast("Write a summary to re-tone.", "error"); return; }
    return withBusy(el.aiTone, "Adjusting…", async () => {
      const data = await apiJSON("/api/ai/tone", { text, tone: State.tone });
      if (data.text) { el.rSummary.value = data.text; markDirty(); renderResumePreview(); toast(`Tone set to ${State.tone}.`, "ok"); }
    });
  }
  function openPublishConfirm() {
    const resume = collectResume();
    if (!resume.name) { toast("Add at least a name before publishing.", "error"); return; }
    if (typeof el.publishConfirm.showModal === "function") el.publishConfirm.showModal();
    else el.publishConfirm.setAttribute("open", "");
  }
  function closePublishConfirm() {
    if (typeof el.publishConfirm.close === "function") el.publishConfirm.close();
    else el.publishConfirm.removeAttribute("open");
  }
  function formatExpiry(expiresAt, expiresIn) {
    let date = null;
    if (typeof expiresAt === "number") date = new Date(expiresAt > 1e12 ? expiresAt : expiresAt * 1000);
    else if (typeof expiresAt === "string" && expiresAt) date = new Date(expiresAt);
    else if (Number.isFinite(Number(expiresIn))) date = new Date(Date.now() + Number(expiresIn) * 1000);
    return date && !Number.isNaN(date.getTime())
      ? `Expires ${date.toLocaleString()}.`
      : "This public link has a server-managed expiry.";
  }
  async function publishResume() {
    const resume = collectResume();
    if (!resume.name) { closePublishConfirm(); toast("Add at least a name before publishing.", "error"); return; }
    return withBusy(el.publishAction, "Publishing…", async () => {
      const data = await apiJSON("/api/resume/save", { resume });
      if (!data.id) throw new Error("No id returned.");
      const url = new URL(`/resume/${encodeURIComponent(String(data.id))}`, location.origin).href;
      const revokeUrl = safeSameOriginUrl(data.revoke_url);
      State.published = {
        id: String(data.id),
        revokeUrl,
        expiresAt: data.expires_at || null,
      };
      el.rLink.hidden = false;
      el.rLiveUrl.href = url;
      el.rLiveUrl.textContent = url;
      el.rExpiry.textContent = formatExpiry(data.expires_at, data.expires_in);
      el.rRevoke.hidden = !revokeUrl;
      closePublishConfirm();
      try { await navigator.clipboard.writeText(url); toast("Published — link copied.", "ok"); }
      catch (_) { toast("Published.", "ok"); }
    });
  }
  async function revokePublishedResume() {
    const url = State.published.revokeUrl;
    if (!url || !window.confirm("Revoke this public resume link now? Anyone using it will lose access.")) return;
    return withBusy(el.rRevoke, "Revoking…", async () => {
      const r = await fetch(url, { method: "DELETE" });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || `Revoke failed (${r.status})`);
      resetPublishedState();
      toast("Public resume link revoked.", "ok");
    });
  }

  /* ── 23 · WebSocket (/ws) ───────────────────────────────────────────────── */
  let wsRetry = 0;
  function connectWS() {
    const proto = location.protocol === "https:" ? "wss" : "ws";
    let socket;
    try {
      socket = new WebSocket(`${proto}://${location.host}/ws`);
    } catch (err) {
      console.warn("ws init failed", err);
      return;
    }
    State.ws = socket;
    socket.addEventListener("open", () => { wsRetry = 0; console.info("[afp] ws open"); });
    socket.addEventListener("message", () => { /* Never log payloads; they may contain private project data. */ });
    socket.addEventListener("error", (ev) => { console.warn("[afp] ws error", ev); });
    socket.addEventListener("close", () => {
      State.ws = null;
      wsRetry = Math.min(wsRetry + 1, 6);
      const delay = Math.min(1000 * 2 ** wsRetry, 30000);
      console.info(`[afp] ws closed — retrying in ${delay}ms`);
      setTimeout(connectWS, delay);
    });
  }

  /* ── 24 · Keyboard ──────────────────────────────────────────────────────── */
  function isTyping(t) {
    return t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
  }
  function onKeyDown(e) {
    const mod = e.ctrlKey || e.metaKey;
    if (e.key === "Escape" && State.openDock) {
      e.preventDefault();
      closeResponsiveDocks(true);
      return;
    }
    if (mod && e.key.toLowerCase() === "s") {
      e.preventDefault();
      saveProject();
      return;
    }
    if (isTyping(e.target)) return;
    if (State.view === "design" && mod && e.key.toLowerCase() === "z") {
      e.preventDefault();
      if (e.shiftKey) redo(); else undo();
      return;
    }
    if (State.view === "design" && mod && e.key.toLowerCase() === "y") { e.preventDefault(); redo(); return; }
    if ((e.key === "Delete" || e.key === "Backspace") && State.selected >= 0) {
      e.preventDefault(); deleteSelected(); return;
    }
    if (mod && e.key.toLowerCase() === "d" && State.selected >= 0) {
      e.preventDefault(); duplicateSelected(); return;
    }
    if (e.key === "Escape") { selectIndex(-1); return; }
    if (State.view === "design") {
      if (e.key === "v") setTool("select");
      else if (e.key === "t") setTool("text");
      else if (e.key === "s") setTool("shape");
      else if (e.key === "i") setTool("image");
    }
  }

  /* ── helpers: segmented controls + textarea autogrow ────────────────────── */
  function setSegActive(btn, on) {
    btn.classList.toggle("is-active", on);
    if (btn.getAttribute("role") === "radio") btn.setAttribute("aria-checked", String(on));
  }
  function activateSeg(btn) {
    const group = btn.closest(".seg");
    if (!group) return;
    $$(".seg__opt", group).forEach((b) => setSegActive(b, b === btn));
  }
  function autoGrow(ta) {
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
  }

  /* ── 25 · Boot ──────────────────────────────────────────────────────────── */
  function bindEvents() {
    // Rail / views
    el.rail.addEventListener("click", (e) => {
      const b = e.target.closest("[data-view]");
      if (b) setView(b.dataset.view);
    });
    el.help.addEventListener("click", openHelp);
    el.closeHelp.addEventListener("click", closeHelp);
    el.helpDone.addEventListener("click", closeHelp);
    el.helpModal.addEventListener("click", (e) => { if (e.target === el.helpModal) closeHelp(); });

    // Rename project (topbar title)
    el.docTitle.addEventListener("click", renameProject);

    // Theme
    el.themeToggle.addEventListener("click", toggleTheme);

    // Compact editor panels
    el.toggleLeft.addEventListener("click", () => toggleResponsiveDock("left"));
    el.toggleRight.addEventListener("click", () => toggleResponsiveDock("right"));
    el.dockScrim.addEventListener("click", () => closeResponsiveDocks(true));
    el.mobileUndo.addEventListener("click", undo);
    el.mobileRedo.addEventListener("click", redo);

    // Tools
    el.tools.addEventListener("click", (e) => {
      const b = e.target.closest("[data-tool]");
      if (b) setTool(b.dataset.tool);
    });
    $$('[data-toolopts="shape"] [data-shape]').forEach((b) =>
      b.addEventListener("click", () => { State.shapeKind = b.dataset.shape; activateSeg(b); }));
    $$('[data-toolopts="image"] [data-imgas]').forEach((b) =>
      b.addEventListener("click", () => { State.imageAs = b.dataset.imgas; activateSeg(b); }));
    el.generateImage.addEventListener("click", () =>
      generateImageFlow(el.imagePrompt.value, State.imageAs));

    // Canvas pointer
    el.canvas.addEventListener("pointerdown", onCanvasPointerDown);
    el.canvas.addEventListener("dblclick", (e) => {
      const p = clientToCanvas(e.clientX, e.clientY);
      const i = hitTest(p.x, p.y);
      if (i >= 0 && State.objects[i].type === "text") {
        const next = window.prompt("Edit text", State.objects[i].text);
        if (next != null) { State.objects[i].text = next; measureText(State.objects[i]); render(); renderOverlay(); commit(); renderLayers(); }
      }
    });

    // Floatbar actions
    el.floatbar.addEventListener("click", (e) => {
      const b = e.target.closest("[data-act]");
      if (!b) return;
      const act = b.dataset.act;
      if (act === "delete") deleteSelected();
      else if (act === "duplicate") duplicateSelected();
      else if (act === "front") bringToFront();
      else if (act === "fill") el.propFill.click();
    });

    // Properties
    [el.propX, el.propY, el.propW, el.propH].forEach((inp) => {
      inp.addEventListener("input", () => applyPropFromInputs(false));
      inp.addEventListener("change", () => applyPropFromInputs(true));
    });
    el.propFill.addEventListener("input", () => {
      const o = selectedObject();
      if (!o || o.type === "image") return;
      o.fill = normalizeHex(el.propFill.value, o.fill);
      el.propFillHex.textContent = o.fill.toUpperCase();
      render(); positionFloatbar();
    });
    el.propFill.addEventListener("change", () => commit());
    el.propOpacity.addEventListener("input", () => {
      const o = selectedObject();
      if (!o) return;
      o.opacity = clamp(parseInt(el.propOpacity.value, 10) / 100, 0, 1);
      render();
    });
    el.propOpacity.addEventListener("change", () => commit());

    // Background + presets
    el.bgColor.addEventListener("input", () => setBackgroundColor(el.bgColor.value, false));
    el.bgColor.addEventListener("change", () => setBackgroundColor(el.bgColor.value, true));
    $$("#afp-dock-right [data-preset]").forEach((b) =>
      b.addEventListener("click", () => applyPreset(b.dataset.preset)));

    // History
    el.undo.addEventListener("click", undo);
    el.redo.addEventListener("click", redo);

    // Zoom
    el.zoom.addEventListener("click", (e) => {
      const b = e.target.closest("[data-zoom]");
      if (!b) return;
      applyZoom(b.dataset.zoom === "in" ? State.zoom * 1.25 : State.zoom * 0.8);
    });
    el.canvasWrap.addEventListener("wheel", (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      applyZoom(State.zoom * (e.deltaY < 0 ? 1.1 : 0.9));
    }, { passive: false });
    el.canvasWrap.addEventListener("scroll", () => positionFloatbar(), { passive: true });

    // Export / Save (canvas)
    el.exportBtn.addEventListener("click", exportActiveDocument);
    el.saveBtn.addEventListener("click", saveProject);

    // Chat
    el.chatForm.addEventListener("submit", (e) => { e.preventDefault(); sendChat(el.chatInput.value); });
    el.chatInput.addEventListener("input", () => autoGrow(el.chatInput));
    el.chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(el.chatInput.value); }
    });
    el.chatLog.addEventListener("click", (e) => {
      const chip = e.target.closest("[data-suggest]");
      if (chip) sendChat(chip.dataset.suggest);
    });
    el.chatExpand.addEventListener("click", () =>
      setChatState(State.chatState === 2 ? 1 : 2, { focus: true }));
    el.chatCollapse.addEventListener("click", () => {
      if (State.view === "copilot") { setView("design"); setChatState(1); }
      else setChatState(0, { focus: true });
    });
    el.chatLauncher.addEventListener("click", () => setChatState(1, { focus: true }));

    // Settings
    el.openSettings.addEventListener("click", openSettings);
    el.railSettings.addEventListener("click", openSettings);
    el.closeSettings.addEventListener("click", closeSettings);
    el.settingsDone.addEventListener("click", closeSettings);
    el.settings.addEventListener("click", (e) => { if (e.target === el.settings) closeSettings(); });
    $$(".seg [data-set-theme]").forEach((b) =>
      b.addEventListener("click", () => { activateSeg(b); applyTheme(b.dataset.setTheme); }));
    $$(".seg [data-export]").forEach((b) =>
      b.addEventListener("click", () => { State.exportFmt = b.dataset.export; activateSeg(b); }));
    el.reduceMotion.addEventListener("change", () =>
      document.body.classList.toggle("reduce-motion", el.reduceMotion.checked));

    // Resume tools
    el.rEditor.addEventListener("submit", (e) => e.preventDefault());
    el.rParse.addEventListener("click", parseResume);
    el.rAddExp.addEventListener("click", () => {
      const card = expCard(); el.rExperience.appendChild(card); markDirty(); renderResumePreview();
      card.querySelector("input").focus();
    });
    el.rAddEdu.addEventListener("click", () => {
      const card = eduCard(); el.rEducation.appendChild(card); markDirty(); renderResumePreview();
      card.querySelector("input").focus();
    });
    el.aiSummary.addEventListener("click", aiSummary);
    el.aiBullets.addEventListener("click", aiBullets);
    el.aiKeywords.addEventListener("click", aiKeywords);
    el.aiTone.addEventListener("click", aiTone);
    el.rPublish.addEventListener("click", openPublishConfirm);
    el.publishClose.addEventListener("click", closePublishConfirm);
    el.publishCancel.addEventListener("click", closePublishConfirm);
    el.publishAction.addEventListener("click", publishResume);
    el.publishConfirm.addEventListener("click", (e) => { if (e.target === el.publishConfirm) closePublishConfirm(); });
    el.rRevoke.addEventListener("click", revokePublishedResume);
    $$(".seg [data-tone]").forEach((b) =>
      b.addEventListener("click", () => { State.tone = b.dataset.tone; activateSeg(b); }));
    [el.rName, el.rTitle, el.rEmail, el.rPhone, el.rLocation, el.rSummary, el.rSkills]
      .forEach((inp) => inp.addEventListener("input", resumeChanged));

    // Projects dashboard
    el.newProjectBtn.addEventListener("click", openNewProject);
    el.emptyNewBtn.addEventListener("click", openNewProject);
    el.projectsRetry.addEventListener("click", loadProjects);
    el.backHome.addEventListener("click", showHome);
    el.npClose.addEventListener("click", closeNewProject);
    el.npCancel.addEventListener("click", closeNewProject);
    el.npCreate.addEventListener("click", createProject);
    el.npModal.addEventListener("click", (e) => { if (e.target === el.npModal) closeNewProject(); });
    el.npTypes.addEventListener("click", (e) => {
      const b = e.target.closest(".np-type");
      if (b) setNpType(b.dataset.type);
    });

    // Window resize → realign selection chrome
    window.addEventListener("resize", debounce(() => { renderOverlay(); positionFloatbar(); }, 120));
    if (typeof responsivePanels.addEventListener === "function") {
      responsivePanels.addEventListener("change", updateResponsivePanels);
    } else if (typeof responsivePanels.addListener === "function") {
      responsivePanels.addListener(updateResponsivePanels);
    }
    window.addEventListener("beforeunload", (e) => {
      if (!State.dirty) return;
      e.preventDefault();
      e.returnValue = "";
    });
    document.addEventListener("keydown", onKeyDown);
  }

  function exportActiveDocument() {
    if (activeDocumentType() === "resume") printResume();
    else exportCanvas();
  }
  function printResume() {
    if (!collectResume().name) { toast("Add resume details before printing.", "error"); return; }
    document.body.classList.add("print-resume");
    const cleanup = () => document.body.classList.remove("print-resume");
    window.addEventListener("afterprint", cleanup, { once: true });
    window.print();
    setTimeout(cleanup, 1200);
  }

  function exportCanvas() {
    const fmt = State.exportFmt;
    if (fmt === "pdf") {
      // Lightweight single-page PDF embedding the canvas raster (no deps).
      try { exportPDF(); } catch (err) { toast("PDF export failed.", "error"); }
      return;
    }
    el.canvas.toBlob((blob) => {
      if (!blob) { toast("Export failed.", "error"); return; }
      downloadBlob(blob, "artflow.png");
      toast("Exported PNG.", "ok");
    }, "image/png");
  }
  function exportPDF() {
    const dataURL = el.canvas.toDataURL("image/jpeg", 0.92);
    const bin = atob(dataURL.split(",")[1]);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const W = State.canvas.w, H = State.canvas.h;
    const objs = [];
    objs.push("<< /Type /Catalog /Pages 2 0 R >>");
    objs.push("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
    objs.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>`);
    const stream = `q\n${W} 0 0 ${H} 0 0 cm\n/Im0 Do\nQ`;
    objs.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    const head = `<< /Type /XObject /Subtype /Image /Width ${img2(W)} /Height ${img2(H)} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>`;

    // Build PDF byte string with xref.
    let pdf = "%PDF-1.4\n";
    const offsets = [];
    function add(str) { offsets.push(pdf.length); pdf += str; }
    add(`1 0 obj\n${objs[0]}\nendobj\n`);
    add(`2 0 obj\n${objs[1]}\nendobj\n`);
    add(`3 0 obj\n${objs[2]}\nendobj\n`);
    add(`4 0 obj\n${objs[3]}\nendobj\n`);
    offsets.push(pdf.length);
    pdf += `5 0 obj\n${head}\nstream\n`;
    // Append binary image bytes.
    let binStr = "";
    for (let i = 0; i < bytes.length; i++) binStr += String.fromCharCode(bytes[i]);
    pdf += binStr + "\nendstream\nendobj\n";
    const xrefPos = pdf.length;
    pdf += `xref\n0 6\n0000000000 65535 f \n`;
    for (let i = 0; i < 5; i++) pdf += String(offsets[i]).padStart(10, "0") + " 00000 n \n";
    pdf += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;

    const out = new Uint8Array(pdf.length);
    for (let i = 0; i < pdf.length; i++) out[i] = pdf.charCodeAt(i) & 0xff;
    downloadBlob(new Blob([out], { type: "application/pdf" }), "artflow.pdf");
    toast("Exported PDF.", "ok");
  }
  function img2(n) { return n; } // dimensions are integers already
  function downloadBlob(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  function init() {
    // Sync controls to initial state.
    applyTheme(State.theme, false);
    setTool("select");
    el.bgHex.textContent = State.bg.toUpperCase();
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.reduceMotion.checked = true;
      document.body.classList.add("reduce-motion");
    }
    bindEvents();
    render();
    renderOverlay();
    syncProps();
    renderLayers();
    renderResumePreview();
    applyZoom(1);
    commit({ dirty: false }); // baseline snapshot
    setChatState(State.chatState);
    updateContextActions();
    updateResponsivePanels();
    markSaved();
    connectWS();
    showHome({ force: true }); // start on the projects dashboard
    // Re-measure text once webfonts are ready (canvas metrics depend on them).
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        State.objects.forEach((o) => { if (o.type === "text") measureText(o); });
        render(); renderOverlay();
      });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
