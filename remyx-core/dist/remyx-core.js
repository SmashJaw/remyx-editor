class Tt {
  constructor() {
    this._listeners = /* @__PURE__ */ new Map();
  }
  on(e, t) {
    return this._listeners.has(e) || this._listeners.set(e, /* @__PURE__ */ new Set()), this._listeners.get(e).add(t), () => this.off(e, t);
  }
  off(e, t) {
    const r = this._listeners.get(e);
    r && (r.delete(t), r.size === 0 && this._listeners.delete(e));
  }
  once(e, t) {
    const r = (...i) => {
      this.off(e, r), t(...i);
    };
    return this.on(e, r);
  }
  emit(e, t) {
    const r = this._listeners.get(e);
    r && r.forEach((i) => {
      try {
        i(t);
      } catch (s) {
        console.error(`EventBus error in "${e}" handler:`, s);
      }
    });
  }
  removeAllListeners(e) {
    e ? this._listeners.delete(e) : this._listeners.clear();
  }
}
const Et = /^h[1-6]$/, St = /* @__PURE__ */ new Set(["P", "H1", "H2", "H3", "H4", "H5", "H6", "DIV", "BLOCKQUOTE", "PRE", "LI", "TD", "TH"]);
class At {
  constructor(e) {
    this.editor = e;
  }
  getSelection() {
    return window.getSelection();
  }
  getRange() {
    const e = this.getSelection();
    if (!e || e.rangeCount === 0) return null;
    const t = e.getRangeAt(0);
    return this.isWithinEditor(t.commonAncestorContainer) ? t : null;
  }
  setRange(e) {
    const t = this.getSelection();
    t.removeAllRanges(), t.addRange(e);
  }
  isWithinEditor(e) {
    if (!e) return !1;
    const t = e.nodeType === Node.TEXT_NODE ? e.parentElement : e;
    return this.editor.contains(t);
  }
  isCollapsed() {
    const e = this.getSelection();
    return e ? e.isCollapsed : !0;
  }
  getSelectedText() {
    const e = this.getSelection();
    return e ? e.toString() : "";
  }
  getSelectedHTML() {
    const e = this.getRange();
    if (!e) return "";
    const t = e.cloneContents(), r = document.createElement("div");
    return r.appendChild(t), r.innerHTML;
  }
  save() {
    const e = this.getRange();
    if (!e) return null;
    const t = document.createRange();
    t.selectNodeContents(this.editor), t.setEnd(e.startContainer, e.startOffset);
    const r = t.toString().length;
    return {
      startOffset: r,
      endOffset: r + e.toString().length,
      collapsed: e.collapsed
    };
  }
  restore(e) {
    if (!e) return;
    const t = document.createTreeWalker(
      this.editor,
      NodeFilter.SHOW_TEXT,
      null
    );
    let r = 0, i = null, s = 0, o = null, a = 0;
    for (; t.nextNode(); ) {
      const l = t.currentNode, c = l.textContent.length, u = r + c;
      if (!i && u >= e.startOffset && (i = l, s = e.startOffset - r), !o && u >= e.endOffset) {
        o = l, a = e.endOffset - r;
        break;
      }
      r = u;
    }
    if (i) {
      const l = document.createRange();
      l.setStart(i, Math.min(s, i.textContent.length)), o ? l.setEnd(o, Math.min(a, o.textContent.length)) : l.collapse(!0), this.setRange(l);
    }
  }
  collapse(e = !1) {
    const t = this.getSelection();
    t && t.rangeCount > 0 && (e ? t.collapseToEnd() : t.collapseToStart());
  }
  getParentElement() {
    const e = this.getRange();
    if (!e) return null;
    const t = e.commonAncestorContainer;
    return t.nodeType === Node.TEXT_NODE ? t.parentElement : t;
  }
  getParentBlock() {
    let e = this.getParentElement();
    for (; e && e !== this.editor; ) {
      if (St.has(e.tagName)) return e;
      e = e.parentElement;
    }
    return null;
  }
  getClosestElement(e) {
    let t = this.getParentElement();
    const r = e.toUpperCase();
    for (; t && t !== this.editor; ) {
      if (t.tagName === r) return t;
      t = t.parentElement;
    }
    return null;
  }
  insertHTML(e) {
    document.execCommand("insertHTML", !1, e);
  }
  insertNode(e) {
    const t = this.getRange();
    t && (t.deleteContents(), t.insertNode(e), t.setStartAfter(e), t.collapse(!0), this.setRange(t));
  }
  wrapWith(e, t = {}) {
    const r = this.getRange();
    if (!r || r.collapsed) return null;
    const i = document.createElement(e);
    Object.entries(t).forEach(([s, o]) => {
      i.setAttribute(s, o);
    });
    try {
      r.surroundContents(i);
    } catch {
      const s = r.extractContents();
      i.appendChild(s), r.insertNode(i);
    }
    return this.setRange(r), i;
  }
  unwrap(e) {
    const t = this.getClosestElement(e);
    if (!t) return;
    const r = t.parentNode;
    for (; t.firstChild; )
      r.insertBefore(t.firstChild, t);
    r.removeChild(t);
  }
  getActiveFormats() {
    const e = {
      bold: !1,
      italic: !1,
      underline: !1,
      strikethrough: !1,
      subscript: !1,
      superscript: !1,
      heading: null,
      alignment: "left",
      orderedList: !1,
      unorderedList: !1,
      blockquote: !1,
      codeBlock: !1,
      link: null,
      fontFamily: null,
      fontSize: null,
      foreColor: null,
      backColor: null
    };
    try {
      e.bold = document.queryCommandState("bold"), e.italic = document.queryCommandState("italic"), e.underline = document.queryCommandState("underline"), e.strikethrough = document.queryCommandState("strikeThrough"), e.subscript = document.queryCommandState("subscript"), e.superscript = document.queryCommandState("superscript");
    } catch {
    }
    const t = this.getParentBlock();
    if (t) {
      const i = t.tagName.toLowerCase();
      Et.test(i) && (e.heading = i);
      const s = t.style.textAlign || window.getComputedStyle(t).textAlign;
      s && (e.alignment = s === "start" ? "left" : s === "end" ? "right" : s);
    }
    let r = this.getParentElement();
    for (; r && r !== this.editor; ) {
      const i = r.tagName;
      i === "OL" && (e.orderedList = !0), i === "UL" && (e.unorderedList = !0), i === "BLOCKQUOTE" && (e.blockquote = !0), i === "PRE" && (e.codeBlock = !0), i === "A" && (e.link = { href: r.href, text: r.textContent, target: r.target }), r = r.parentElement;
    }
    try {
      e.fontFamily = document.queryCommandValue("fontName") || null, e.fontSize = document.queryCommandValue("fontSize") || null, e.foreColor = document.queryCommandValue("foreColor") || null, e.backColor = document.queryCommandValue("backColor") || null;
    } catch {
    }
    return e;
  }
  getBoundingRect() {
    const e = this.getRange();
    return e ? e.getBoundingClientRect() : null;
  }
}
class _t {
  constructor(e) {
    this.engine = e, this._commands = /* @__PURE__ */ new Map();
  }
  register(e, t) {
    this._commands.set(e, {
      name: e,
      execute: t.execute,
      isActive: t.isActive || (() => !1),
      isEnabled: t.isEnabled || (() => !0),
      shortcut: t.shortcut || null,
      meta: t.meta || {}
    }), t.shortcut && this.engine.keyboard.register(t.shortcut, e);
  }
  execute(e, ...t) {
    const r = this._commands.get(e);
    if (!r)
      return console.warn(`Command "${e}" not found`), !1;
    if (!r.isEnabled(this.engine))
      return !1;
    this.engine.history.snapshot();
    const i = r.execute(this.engine, ...t);
    return this.engine.eventBus.emit("command:executed", { name: e, args: t, result: i }), this.engine.eventBus.emit("content:change"), i;
  }
  isActive(e) {
    const t = this._commands.get(e);
    return t ? t.isActive(this.engine) : !1;
  }
  isEnabled(e) {
    const t = this._commands.get(e);
    return t ? t.isEnabled(this.engine) : !1;
  }
  get(e) {
    return this._commands.get(e);
  }
  getAll() {
    return Array.from(this._commands.keys());
  }
  has(e) {
    return this._commands.has(e);
  }
}
class Lt {
  constructor(e, t = {}) {
    this.engine = e, this.maxSize = t.maxSize || 100, this.debounceMs = t.debounceMs || 300, this._undoStack = [], this._redoStack = [], this._observer = null, this._debounceTimer = null, this._isPerformingUndoRedo = !1, this._lastSnapshot = null;
  }
  init() {
    this._takeSnapshot(), this._observer = new MutationObserver(() => {
      this._isPerformingUndoRedo || this._debouncedSnapshot();
    }), this._observer.observe(this.engine.element, {
      childList: !0,
      characterData: !0,
      attributes: !0,
      subtree: !0
    });
  }
  destroy() {
    this._observer && (this._observer.disconnect(), this._observer = null), this._debounceTimer && (clearTimeout(this._debounceTimer), this._debounceTimer = null);
  }
  snapshot() {
    this._debounceTimer && (clearTimeout(this._debounceTimer), this._debounceTimer = null), this._takeSnapshot();
  }
  _debouncedSnapshot() {
    this._debounceTimer && clearTimeout(this._debounceTimer), this._debounceTimer = setTimeout(() => {
      this._takeSnapshot();
    }, this.debounceMs);
  }
  _takeSnapshot() {
    const e = this.engine.element.innerHTML;
    if (e === this._lastSnapshot) return;
    const t = this.engine.selection.save();
    this._undoStack.push({ html: e, bookmark: t }), this._undoStack.length > this.maxSize && this._undoStack.shift(), this._redoStack = [], this._lastSnapshot = e;
  }
  undo() {
    if (!this.canUndo()) return;
    this._isPerformingUndoRedo = !0;
    const e = this.engine.element.innerHTML, t = this.engine.selection.save();
    this._redoStack.push({ html: e, bookmark: t });
    const r = this._undoStack.pop(), i = this.engine.sanitizer.sanitize(r.html);
    this.engine.element.innerHTML = i, this._lastSnapshot = i, r.bookmark && this.engine.selection.restore(r.bookmark), this._isPerformingUndoRedo = !1, this.engine.eventBus.emit("history:undo"), this.engine.eventBus.emit("content:change");
  }
  redo() {
    if (!this.canRedo()) return;
    this._isPerformingUndoRedo = !0;
    const e = this.engine.element.innerHTML, t = this.engine.selection.save();
    this._undoStack.push({ html: e, bookmark: t });
    const r = this._redoStack.pop(), i = this.engine.sanitizer.sanitize(r.html);
    this.engine.element.innerHTML = i, this._lastSnapshot = i, r.bookmark && this.engine.selection.restore(r.bookmark), this._isPerformingUndoRedo = !1, this.engine.eventBus.emit("history:redo"), this.engine.eventBus.emit("content:change");
  }
  canUndo() {
    return this._undoStack.length > 0;
  }
  canRedo() {
    return this._redoStack.length > 0;
  }
  clear() {
    this._undoStack = [], this._redoStack = [], this._lastSnapshot = null;
  }
}
let te = null;
function S() {
  return te === null && (te = typeof navigator < "u" && /Mac|iPod|iPhone|iPad/.test(navigator.platform)), te;
}
function Jr() {
  return S() ? "⌘" : "Ctrl";
}
class Rt {
  constructor(e) {
    this.engine = e, this._shortcuts = /* @__PURE__ */ new Map(), this._handleKeyDown = this._handleKeyDown.bind(this);
  }
  init() {
    this.engine.element.addEventListener("keydown", this._handleKeyDown);
  }
  destroy() {
    this.engine.element.removeEventListener("keydown", this._handleKeyDown);
  }
  register(e, t) {
    const r = this._normalizeShortcut(e);
    this._shortcuts.set(r, t);
  }
  unregister(e) {
    const t = this._normalizeShortcut(e);
    this._shortcuts.delete(t);
  }
  getShortcutForCommand(e) {
    for (const [t, r] of this._shortcuts)
      if (r === e) return t;
    return null;
  }
  getShortcutLabel(e) {
    return e ? e.split("+").map((r) => r === "mod" ? S() ? "⌘" : "Ctrl" : r === "shift" ? S() ? "⇧" : "Shift" : r === "alt" ? S() ? "⌥" : "Alt" : r.toUpperCase()).join(S() ? "" : "+") : "";
  }
  _normalizeShortcut(e) {
    return e.toLowerCase().split("+").sort().join("+");
  }
  _handleKeyDown(e) {
    const t = [];
    (S() ? e.metaKey : e.ctrlKey) && t.push("mod"), e.shiftKey && t.push("shift"), e.altKey && t.push("alt");
    const r = e.key.toLowerCase();
    ["control", "meta", "shift", "alt"].includes(r) || t.push(r);
    const i = t.sort().join("+"), s = this._shortcuts.get(i);
    s && (e.preventDefault(), e.stopPropagation(), this.engine.commands.execute(s));
  }
}
const Bt = {
  p: ["class", "style"],
  h1: ["class"],
  h2: ["class"],
  h3: ["class"],
  h4: ["class"],
  h5: ["class"],
  h6: ["class"],
  strong: [],
  b: [],
  em: [],
  i: [],
  u: [],
  s: [],
  del: [],
  sub: [],
  sup: [],
  a: ["href", "target", "rel", "title", "class", "data-attachment", "data-filename", "data-filesize"],
  img: ["src", "alt", "width", "height", "style", "class"],
  ul: ["class"],
  ol: ["class", "start", "type"],
  li: ["class"],
  table: ["class"],
  thead: [],
  tbody: [],
  tr: [],
  th: ["colspan", "rowspan", "class", "style"],
  td: ["colspan", "rowspan", "class", "style"],
  blockquote: ["class"],
  pre: ["class"],
  code: ["class"],
  hr: [],
  br: [],
  div: ["class", "style", "data-embed-url"],
  span: ["style", "class"],
  input: ["type", "checked", "disabled", "class"],
  label: ["class"],
  mark: ["class"],
  iframe: ["src", "width", "height", "frameborder", "allowfullscreen", "allow", "class", "style"]
}, Mt = [
  "color",
  "background-color",
  "font-family",
  "font-size",
  "text-align",
  "text-decoration",
  "font-weight",
  "font-style",
  "width",
  "height",
  "max-width",
  "float",
  "margin",
  "margin-left",
  "margin-right",
  "display",
  "padding",
  "border"
], Nt = /^\s*javascript\s*:/i, $t = /expression\s*\(|@import|behavior\s*:|javascript\s*:/i, Dt = /* @__PURE__ */ new Set([
  "script",
  "style",
  "svg",
  "math",
  "form",
  "object",
  "embed",
  "applet",
  "template"
]);
class It {
  constructor(e = {}) {
    this.allowedTags = e.allowedTags || Bt, this.allowedStyles = e.allowedStyles || Mt;
  }
  sanitize(e) {
    if (!e) return "";
    const r = new DOMParser().parseFromString(`<body>${e}</body>`, "text/html");
    return this._cleanNode(r.body), r.body.innerHTML;
  }
  _cleanNode(e) {
    const t = Array.from(e.childNodes);
    for (const r of t) {
      if (r.nodeType === Node.TEXT_NODE) continue;
      if (r.nodeType === Node.COMMENT_NODE) {
        e.removeChild(r);
        continue;
      }
      if (r.nodeType !== Node.ELEMENT_NODE) {
        e.removeChild(r);
        continue;
      }
      const i = r.tagName.toLowerCase(), s = this.allowedTags[i];
      if (!s) {
        if (Dt.has(i))
          e.removeChild(r);
        else {
          for (; r.firstChild; )
            e.insertBefore(r.firstChild, r);
          e.removeChild(r);
        }
        continue;
      }
      const o = Array.from(r.attributes);
      for (const a of o) {
        if (a.name.startsWith("on")) {
          r.removeAttribute(a.name);
          continue;
        }
        a.name === "style" ? s.includes("style") ? this._cleanStyles(r) : r.removeAttribute("style") : s.includes(a.name) || r.removeAttribute(a.name);
      }
      if (r.hasAttribute("href")) {
        const a = r.getAttribute("href");
        a && Nt.test(a) && r.setAttribute("href", "#");
      }
      if (i === "input" && (r.getAttribute("type") || "").toLowerCase() !== "checkbox") {
        e.removeChild(r);
        continue;
      }
      this._cleanNode(r);
    }
  }
  _cleanStyles(e) {
    const t = e.style, r = [];
    for (const i of this.allowedStyles) {
      const s = t.getPropertyValue(i);
      if (s) {
        if ($t.test(s)) continue;
        r.push(`${i}: ${s}`);
      }
    }
    r.length > 0 ? e.setAttribute("style", r.join("; ")) : e.removeAttribute("style");
  }
}
const zt = /^[\s]*[·•●○◦▪▫–—-]\s*/, Ot = /^[\s]*\d+[.)]\s*/, Pt = /^[\s]*[a-zA-Z][.)]\s*/, Ht = /margin-left|padding-left|text-indent/i, Ft = /^[\s]*(?:[·•●○◦▪▫–—-]|\d+[.)]|[a-zA-Z][.)])\s*/;
function Pe(n) {
  if (!n) return "";
  let e = n;
  return e = e.replace(/<meta[^>]*>/gi, ""), e = e.replace(/<\/?html[^>]*>/gi, ""), e = e.replace(/<head[\s\S]*?<\/head>/gi, ""), e = e.replace(/<\/?body[^>]*>/gi, ""), e = e.replace(/<style[\s\S]*?<\/style>/gi, ""), e = e.replace(/<title[\s\S]*?<\/title>/gi, ""), e = e.replace(/<link[^>]*>/gi, ""), e = e.replace(/<!--\[if[\s\S]*?endif\]-->/gi, ""), e = e.replace(/<!--[\s\S]*?-->/g, ""), e = e.replace(/<o:p[\s\S]*?<\/o:p>/gi, ""), e = e.replace(/<w:[\s\S]*?<\/w:[\s\S]*?>/gi, ""), e = e.replace(/<m:[\s\S]*?<\/m:[\s\S]*?>/gi, ""), e = e.replace(/<\/?(xml|st1|v:|o:)[^>]*>/gi, ""), e = e.replace(/\s*mso-[^:]+:[^;"]+;?/gi, ""), e = e.replace(/\s*class="Mso[^"]*"/gi, ""), e = e.replace(/\s*lang="[^"]*"/gi, ""), e = e.replace(/<b\s+id="docs-internal[^"]*"[^>]*>([\s\S]*?)<\/b>/gi, "$1"), e = e.replace(/\s*id="docs-internal[^"]*"/gi, ""), e = e.replace(/\s*id="h\.[a-z0-9]+"/gi, ""), e = e.replace(/\s*class="c\d+"/gi, ""), e = e.replace(/\s*dir="ltr"/gi, ""), e = e.replace(/\s*role="presentation"/gi, ""), e = e.replace(
    /<span\s+style="[^"]*font-weight:\s*(700|bold)[^"]*">([\s\S]*?)<\/span>/gi,
    "<strong>$2</strong>"
  ), e = e.replace(
    /<span\s+style="[^"]*font-style:\s*italic[^"]*">([\s\S]*?)<\/span>/gi,
    "<em>$2</em>"
  ), e = e.replace(
    /<span\s+style="[^"]*text-decoration:\s*line-through[^"]*">([\s\S]*?)<\/span>/gi,
    "<s>$2</s>"
  ), e = e.replace(/<\/?(text|office|table|draw|style|number|fo|svg):[^>]*>/gi, ""), e = e.replace(/\s*class="P\d+"/gi, ""), e = e.replace(/\s*class="T\d+"/gi, ""), e = e.replace(/\s*class="Table\d+"/gi, ""), e = e.replace(/\s*class="(s|p)\d+"/gi, ""), e = e.replace(/<div\s+apple-content-edited="true"[^>]*>/gi, "<div>"), e = e.replace(/\s*style="\s*"/gi, ""), e = e.replace(/\s*class="\s*"/gi, ""), e = e.replace(/<span\s*>([\s\S]*?)<\/span>/gi, "$1"), e = e.replace(/<(\w+)\s+>/g, "<$1>"), e = e.replace(/<p[^>]*>\s*<\/p>/gi, ""), e = e.replace(/<div[^>]*>\s*<\/div>/gi, ""), e = e.replace(
    /<font\s+face="([^"]*)"[^>]*>([\s\S]*?)<\/font>/gi,
    '<span style="font-family: $1">$2</span>'
  ), e = e.replace(
    /<font\s+color="([^"]*)"[^>]*>([\s\S]*?)<\/font>/gi,
    '<span style="color: $1">$2</span>'
  ), e = e.replace(/<font\s+size="([^"]*)"[^>]*>([\s\S]*?)<\/font>/gi, "$2"), e = e.replace(/<\/?font[^>]*>/gi, ""), e = e.replace(/<b(\s|>)/gi, "<strong$1"), e = e.replace(/<\/b>/gi, "</strong>"), e = e.replace(/<i(\s|>)/gi, "<em$1"), e = e.replace(/<\/i>/gi, "</em>"), e = qt(e), e = e.replace(/(<br\s*\/?\s*>){3,}/gi, "<br><br>"), e.trim();
}
function qt(n) {
  const t = new DOMParser().parseFromString(`<body>${n}</body>`, "text/html"), r = t.querySelectorAll("p");
  let i = !1, s = null, o = null;
  for (const a of r) {
    const l = a.textContent.trim(), c = a.getAttribute("style") || "", u = Ht.test(c), d = zt.test(l), h = Ot.test(l) || Pt.test(l);
    if ((d || h) && u) {
      const p = d ? "ul" : "ol";
      (!i || s !== p) && (o = t.createElement(p), a.parentNode.insertBefore(o, a), i = !0, s = p);
      const m = t.createElement("li");
      m.innerHTML = a.innerHTML.replace(Ft, ""), o.appendChild(m), a.parentNode.removeChild(a);
    } else
      i = !1, s = null, o = null;
  }
  return t.body.innerHTML;
}
const Ut = /^#{1,6}\s+\S/, jt = /^[-*+]\s+\S/, Wt = /^\d+[.)]\s+\S/, Gt = /^[-*+]\s+\[[ xX]\]\s/, Zt = /^>\s/, Xt = /^([-*_])\1{2,}$/, Vt = /^```/, Kt = /\*\*[^*]+\*\*/, Qt = /__[^_]+__/, Yt = new RegExp("(?<!\\w)\\*[^*\\s][^*]*\\*(?!\\w)"), Jt = /\[.+\]\(.+\)/, en = /!\[.*\]\(.+\)/, tn = /^\|.+\|/, nn = /^\|[\s-:|]+\|$/, rn = /`[^`]+`/;
function He(n) {
  if (!n || n.length < 3) return !1;
  const e = n.split(`
`);
  let t = 0, r = 0;
  for (const s of e) {
    const o = s.trim();
    if (o) {
      if (r++, Ut.test(o)) {
        t += 2;
        continue;
      }
      if (jt.test(o)) {
        t++;
        continue;
      }
      if (Wt.test(o)) {
        t++;
        continue;
      }
      if (Gt.test(o)) {
        t += 2;
        continue;
      }
      if (Zt.test(o)) {
        t++;
        continue;
      }
      if (Xt.test(o)) {
        t++;
        continue;
      }
      if (Vt.test(o)) {
        t += 2;
        continue;
      }
      if (Kt.test(o) || Qt.test(o)) {
        t++;
        continue;
      }
      if (Yt.test(o)) {
        t++;
        continue;
      }
      if (Jt.test(o)) {
        t++;
        continue;
      }
      if (en.test(o)) {
        t += 2;
        continue;
      }
      if (tn.test(o)) {
        t++;
        continue;
      }
      if (nn.test(o)) {
        t++;
        continue;
      }
      if (rn.test(o)) {
        t++;
        continue;
      }
    }
  }
  return r === 0 ? !1 : t / r >= 0.3 || t >= 2;
}
function sn(n) {
  for (var e = 1; e < arguments.length; e++) {
    var t = arguments[e];
    for (var r in t)
      t.hasOwnProperty(r) && (n[r] = t[r]);
  }
  return n;
}
function se(n, e) {
  return Array(e + 1).join(n);
}
function Fe(n) {
  return n.replace(/^\n*/, "");
}
function qe(n) {
  for (var e = n.length; e > 0 && n[e - 1] === `
`; ) e--;
  return n.substring(0, e);
}
function Ue(n) {
  return qe(Fe(n));
}
var on = [
  "ADDRESS",
  "ARTICLE",
  "ASIDE",
  "AUDIO",
  "BLOCKQUOTE",
  "BODY",
  "CANVAS",
  "CENTER",
  "DD",
  "DIR",
  "DIV",
  "DL",
  "DT",
  "FIELDSET",
  "FIGCAPTION",
  "FIGURE",
  "FOOTER",
  "FORM",
  "FRAMESET",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "HEADER",
  "HGROUP",
  "HR",
  "HTML",
  "ISINDEX",
  "LI",
  "MAIN",
  "MENU",
  "NAV",
  "NOFRAMES",
  "NOSCRIPT",
  "OL",
  "OUTPUT",
  "P",
  "PRE",
  "SECTION",
  "TABLE",
  "TBODY",
  "TD",
  "TFOOT",
  "TH",
  "THEAD",
  "TR",
  "UL"
];
function de(n) {
  return he(n, on);
}
var je = [
  "AREA",
  "BASE",
  "BR",
  "COL",
  "COMMAND",
  "EMBED",
  "HR",
  "IMG",
  "INPUT",
  "KEYGEN",
  "LINK",
  "META",
  "PARAM",
  "SOURCE",
  "TRACK",
  "WBR"
];
function We(n) {
  return he(n, je);
}
function an(n) {
  return Ze(n, je);
}
var Ge = [
  "A",
  "TABLE",
  "THEAD",
  "TBODY",
  "TFOOT",
  "TH",
  "TD",
  "IFRAME",
  "SCRIPT",
  "AUDIO",
  "VIDEO"
];
function ln(n) {
  return he(n, Ge);
}
function cn(n) {
  return Ze(n, Ge);
}
function he(n, e) {
  return e.indexOf(n.nodeName) >= 0;
}
function Ze(n, e) {
  return n.getElementsByTagName && e.some(function(t) {
    return n.getElementsByTagName(t).length;
  });
}
var x = {};
x.paragraph = {
  filter: "p",
  replacement: function(n) {
    return `

` + n + `

`;
  }
};
x.lineBreak = {
  filter: "br",
  replacement: function(n, e, t) {
    return t.br + `
`;
  }
};
x.heading = {
  filter: ["h1", "h2", "h3", "h4", "h5", "h6"],
  replacement: function(n, e, t) {
    var r = Number(e.nodeName.charAt(1));
    if (t.headingStyle === "setext" && r < 3) {
      var i = se(r === 1 ? "=" : "-", n.length);
      return `

` + n + `
` + i + `

`;
    } else
      return `

` + se("#", r) + " " + n + `

`;
  }
};
x.blockquote = {
  filter: "blockquote",
  replacement: function(n) {
    return n = Ue(n).replace(/^/gm, "> "), `

` + n + `

`;
  }
};
x.list = {
  filter: ["ul", "ol"],
  replacement: function(n, e) {
    var t = e.parentNode;
    return t.nodeName === "LI" && t.lastElementChild === e ? `
` + n : `

` + n + `

`;
  }
};
x.listItem = {
  filter: "li",
  replacement: function(n, e, t) {
    var r = t.bulletListMarker + "   ", i = e.parentNode;
    if (i.nodeName === "OL") {
      var s = i.getAttribute("start"), o = Array.prototype.indexOf.call(i.children, e);
      r = (s ? Number(s) + o : o + 1) + ".  ";
    }
    var a = /\n$/.test(n);
    return n = Ue(n) + (a ? `
` : ""), n = n.replace(/\n/gm, `
` + " ".repeat(r.length)), r + n + (e.nextSibling ? `
` : "");
  }
};
x.indentedCodeBlock = {
  filter: function(n, e) {
    return e.codeBlockStyle === "indented" && n.nodeName === "PRE" && n.firstChild && n.firstChild.nodeName === "CODE";
  },
  replacement: function(n, e, t) {
    return `

    ` + e.firstChild.textContent.replace(/\n/g, `
    `) + `

`;
  }
};
x.fencedCodeBlock = {
  filter: function(n, e) {
    return e.codeBlockStyle === "fenced" && n.nodeName === "PRE" && n.firstChild && n.firstChild.nodeName === "CODE";
  },
  replacement: function(n, e, t) {
    for (var r = e.firstChild.getAttribute("class") || "", i = (r.match(/language-(\S+)/) || [null, ""])[1], s = e.firstChild.textContent, o = t.fence.charAt(0), a = 3, l = new RegExp("^" + o + "{3,}", "gm"), c; c = l.exec(s); )
      c[0].length >= a && (a = c[0].length + 1);
    var u = se(o, a);
    return `

` + u + i + `
` + s.replace(/\n$/, "") + `
` + u + `

`;
  }
};
x.horizontalRule = {
  filter: "hr",
  replacement: function(n, e, t) {
    return `

` + t.hr + `

`;
  }
};
x.inlineLink = {
  filter: function(n, e) {
    return e.linkStyle === "inlined" && n.nodeName === "A" && n.getAttribute("href");
  },
  replacement: function(n, e) {
    var t = e.getAttribute("href");
    t && (t = t.replace(/([()])/g, "\\$1"));
    var r = Z(e.getAttribute("title"));
    return r && (r = ' "' + r.replace(/"/g, '\\"') + '"'), "[" + n + "](" + t + r + ")";
  }
};
x.referenceLink = {
  filter: function(n, e) {
    return e.linkStyle === "referenced" && n.nodeName === "A" && n.getAttribute("href");
  },
  replacement: function(n, e, t) {
    var r = e.getAttribute("href"), i = Z(e.getAttribute("title"));
    i && (i = ' "' + i + '"');
    var s, o;
    switch (t.linkReferenceStyle) {
      case "collapsed":
        s = "[" + n + "][]", o = "[" + n + "]: " + r + i;
        break;
      case "shortcut":
        s = "[" + n + "]", o = "[" + n + "]: " + r + i;
        break;
      default:
        var a = this.references.length + 1;
        s = "[" + n + "][" + a + "]", o = "[" + a + "]: " + r + i;
    }
    return this.references.push(o), s;
  },
  references: [],
  append: function(n) {
    var e = "";
    return this.references.length && (e = `

` + this.references.join(`
`) + `

`, this.references = []), e;
  }
};
x.emphasis = {
  filter: ["em", "i"],
  replacement: function(n, e, t) {
    return n.trim() ? t.emDelimiter + n + t.emDelimiter : "";
  }
};
x.strong = {
  filter: ["strong", "b"],
  replacement: function(n, e, t) {
    return n.trim() ? t.strongDelimiter + n + t.strongDelimiter : "";
  }
};
x.code = {
  filter: function(n) {
    var e = n.previousSibling || n.nextSibling, t = n.parentNode.nodeName === "PRE" && !e;
    return n.nodeName === "CODE" && !t;
  },
  replacement: function(n) {
    if (!n) return "";
    n = n.replace(/\r?\n|\r/g, " ");
    for (var e = /^`|^ .*?[^ ].* $|`$/.test(n) ? " " : "", t = "`", r = n.match(/`+/gm) || []; r.indexOf(t) !== -1; ) t = t + "`";
    return t + e + n + e + t;
  }
};
x.image = {
  filter: "img",
  replacement: function(n, e) {
    var t = Z(e.getAttribute("alt")), r = e.getAttribute("src") || "", i = Z(e.getAttribute("title")), s = i ? ' "' + i + '"' : "";
    return r ? "![" + t + "](" + r + s + ")" : "";
  }
};
function Z(n) {
  return n ? n.replace(/(\n+\s*)+/g, `
`) : "";
}
function Xe(n) {
  this.options = n, this._keep = [], this._remove = [], this.blankRule = {
    replacement: n.blankReplacement
  }, this.keepReplacement = n.keepReplacement, this.defaultRule = {
    replacement: n.defaultReplacement
  }, this.array = [];
  for (var e in n.rules) this.array.push(n.rules[e]);
}
Xe.prototype = {
  add: function(n, e) {
    this.array.unshift(e);
  },
  keep: function(n) {
    this._keep.unshift({
      filter: n,
      replacement: this.keepReplacement
    });
  },
  remove: function(n) {
    this._remove.unshift({
      filter: n,
      replacement: function() {
        return "";
      }
    });
  },
  forNode: function(n) {
    if (n.isBlank) return this.blankRule;
    var e;
    return (e = ne(this.array, n, this.options)) || (e = ne(this._keep, n, this.options)) || (e = ne(this._remove, n, this.options)) ? e : this.defaultRule;
  },
  forEach: function(n) {
    for (var e = 0; e < this.array.length; e++) n(this.array[e], e);
  }
};
function ne(n, e, t) {
  for (var r = 0; r < n.length; r++) {
    var i = n[r];
    if (un(i, e, t)) return i;
  }
}
function un(n, e, t) {
  var r = n.filter;
  if (typeof r == "string") {
    if (r === e.nodeName.toLowerCase()) return !0;
  } else if (Array.isArray(r)) {
    if (r.indexOf(e.nodeName.toLowerCase()) > -1) return !0;
  } else if (typeof r == "function") {
    if (r.call(n, e, t)) return !0;
  } else
    throw new TypeError("`filter` needs to be a string, array, or function");
}
function dn(n) {
  var e = n.element, t = n.isBlock, r = n.isVoid, i = n.isPre || function(d) {
    return d.nodeName === "PRE";
  };
  if (!(!e.firstChild || i(e))) {
    for (var s = null, o = !1, a = null, l = Ee(a, e, i); l !== e; ) {
      if (l.nodeType === 3 || l.nodeType === 4) {
        var c = l.data.replace(/[ \r\n\t]+/g, " ");
        if ((!s || / $/.test(s.data)) && !o && c[0] === " " && (c = c.substr(1)), !c) {
          l = re(l);
          continue;
        }
        l.data = c, s = l;
      } else if (l.nodeType === 1)
        t(l) || l.nodeName === "BR" ? (s && (s.data = s.data.replace(/ $/, "")), s = null, o = !1) : r(l) || i(l) ? (s = null, o = !0) : s && (o = !1);
      else {
        l = re(l);
        continue;
      }
      var u = Ee(a, l, i);
      a = l, l = u;
    }
    s && (s.data = s.data.replace(/ $/, ""), s.data || re(s));
  }
}
function re(n) {
  var e = n.nextSibling || n.parentNode;
  return n.parentNode.removeChild(n), e;
}
function Ee(n, e, t) {
  return n && n.parentNode === e || t(e) ? e.nextSibling || e.parentNode : e.firstChild || e.nextSibling || e.parentNode;
}
var me = typeof window < "u" ? window : {};
function hn() {
  var n = me.DOMParser, e = !1;
  try {
    new n().parseFromString("", "text/html") && (e = !0);
  } catch {
  }
  return e;
}
function mn() {
  var n = function() {
  };
  return pn() ? n.prototype.parseFromString = function(e) {
    var t = new window.ActiveXObject("htmlfile");
    return t.designMode = "on", t.open(), t.write(e), t.close(), t;
  } : n.prototype.parseFromString = function(e) {
    var t = document.implementation.createHTMLDocument("");
    return t.open(), t.write(e), t.close(), t;
  }, n;
}
function pn() {
  var n = !1;
  try {
    document.implementation.createHTMLDocument("").open();
  } catch {
    me.ActiveXObject && (n = !0);
  }
  return n;
}
var fn = hn() ? me.DOMParser : mn();
function gn(n, e) {
  var t;
  if (typeof n == "string") {
    var r = bn().parseFromString(
      // DOM parsers arrange elements in the <head> and <body>.
      // Wrapping in a custom element ensures elements are reliably arranged in
      // a single element.
      '<x-turndown id="turndown-root">' + n + "</x-turndown>",
      "text/html"
    );
    t = r.getElementById("turndown-root");
  } else
    t = n.cloneNode(!0);
  return dn({
    element: t,
    isBlock: de,
    isVoid: We,
    isPre: e.preformattedCode ? xn : null
  }), t;
}
var ie;
function bn() {
  return ie = ie || new fn(), ie;
}
function xn(n) {
  return n.nodeName === "PRE" || n.nodeName === "CODE";
}
function kn(n, e) {
  return n.isBlock = de(n), n.isCode = n.nodeName === "CODE" || n.parentNode.isCode, n.isBlank = vn(n), n.flankingWhitespace = yn(n, e), n;
}
function vn(n) {
  return !We(n) && !ln(n) && /^\s*$/i.test(n.textContent) && !an(n) && !cn(n);
}
function yn(n, e) {
  if (n.isBlock || e.preformattedCode && n.isCode)
    return { leading: "", trailing: "" };
  var t = wn(n.textContent);
  return t.leadingAscii && Se("left", n, e) && (t.leading = t.leadingNonAscii), t.trailingAscii && Se("right", n, e) && (t.trailing = t.trailingNonAscii), { leading: t.leading, trailing: t.trailing };
}
function wn(n) {
  var e = n.match(/^(([ \t\r\n]*)(\s*))(?:(?=\S)[\s\S]*\S)?((\s*?)([ \t\r\n]*))$/);
  return {
    leading: e[1],
    // whole string for whitespace-only strings
    leadingAscii: e[2],
    leadingNonAscii: e[3],
    trailing: e[4],
    // empty for whitespace-only strings
    trailingNonAscii: e[5],
    trailingAscii: e[6]
  };
}
function Se(n, e, t) {
  var r, i, s;
  return n === "left" ? (r = e.previousSibling, i = / $/) : (r = e.nextSibling, i = /^ /), r && (r.nodeType === 3 ? s = i.test(r.nodeValue) : t.preformattedCode && r.nodeName === "CODE" ? s = !1 : r.nodeType === 1 && !de(r) && (s = i.test(r.textContent))), s;
}
var Cn = Array.prototype.reduce, Tn = [
  [/\\/g, "\\\\"],
  [/\*/g, "\\*"],
  [/^-/g, "\\-"],
  [/^\+ /g, "\\+ "],
  [/^(=+)/g, "\\$1"],
  [/^(#{1,6}) /g, "\\$1 "],
  [/`/g, "\\`"],
  [/^~~~/g, "\\~~~"],
  [/\[/g, "\\["],
  [/\]/g, "\\]"],
  [/^>/g, "\\>"],
  [/_/g, "\\_"],
  [/^(\d+)\. /g, "$1\\. "]
];
function X(n) {
  if (!(this instanceof X)) return new X(n);
  var e = {
    rules: x,
    headingStyle: "setext",
    hr: "* * *",
    bulletListMarker: "*",
    codeBlockStyle: "indented",
    fence: "```",
    emDelimiter: "_",
    strongDelimiter: "**",
    linkStyle: "inlined",
    linkReferenceStyle: "full",
    br: "  ",
    preformattedCode: !1,
    blankReplacement: function(t, r) {
      return r.isBlock ? `

` : "";
    },
    keepReplacement: function(t, r) {
      return r.isBlock ? `

` + r.outerHTML + `

` : r.outerHTML;
    },
    defaultReplacement: function(t, r) {
      return r.isBlock ? `

` + t + `

` : t;
    }
  };
  this.options = sn({}, e, n), this.rules = new Xe(this.options);
}
X.prototype = {
  /**
   * The entry point for converting a string or DOM node to Markdown
   * @public
   * @param {String|HTMLElement} input The string or DOM node to convert
   * @returns A Markdown representation of the input
   * @type String
   */
  turndown: function(n) {
    if (!An(n))
      throw new TypeError(
        n + " is not a string, or an element/document/fragment node."
      );
    if (n === "") return "";
    var e = Ve.call(this, new gn(n, this.options));
    return En.call(this, e);
  },
  /**
   * Add one or more plugins
   * @public
   * @param {Function|Array} plugin The plugin or array of plugins to add
   * @returns The Turndown instance for chaining
   * @type Object
   */
  use: function(n) {
    if (Array.isArray(n))
      for (var e = 0; e < n.length; e++) this.use(n[e]);
    else if (typeof n == "function")
      n(this);
    else
      throw new TypeError("plugin must be a Function or an Array of Functions");
    return this;
  },
  /**
   * Adds a rule
   * @public
   * @param {String} key The unique key of the rule
   * @param {Object} rule The rule
   * @returns The Turndown instance for chaining
   * @type Object
   */
  addRule: function(n, e) {
    return this.rules.add(n, e), this;
  },
  /**
   * Keep a node (as HTML) that matches the filter
   * @public
   * @param {String|Array|Function} filter The unique key of the rule
   * @returns The Turndown instance for chaining
   * @type Object
   */
  keep: function(n) {
    return this.rules.keep(n), this;
  },
  /**
   * Remove a node that matches the filter
   * @public
   * @param {String|Array|Function} filter The unique key of the rule
   * @returns The Turndown instance for chaining
   * @type Object
   */
  remove: function(n) {
    return this.rules.remove(n), this;
  },
  /**
   * Escapes Markdown syntax
   * @public
   * @param {String} string The string to escape
   * @returns A string with Markdown syntax escaped
   * @type String
   */
  escape: function(n) {
    return Tn.reduce(function(e, t) {
      return e.replace(t[0], t[1]);
    }, n);
  }
};
function Ve(n) {
  var e = this;
  return Cn.call(n.childNodes, function(t, r) {
    r = new kn(r, e.options);
    var i = "";
    return r.nodeType === 3 ? i = r.isCode ? r.nodeValue : e.escape(r.nodeValue) : r.nodeType === 1 && (i = Sn.call(e, r)), Ke(t, i);
  }, "");
}
function En(n) {
  var e = this;
  return this.rules.forEach(function(t) {
    typeof t.append == "function" && (n = Ke(n, t.append(e.options)));
  }), n.replace(/^[\t\r\n]+/, "").replace(/[\t\r\n\s]+$/, "");
}
function Sn(n) {
  var e = this.rules.forNode(n), t = Ve.call(this, n), r = n.flankingWhitespace;
  return (r.leading || r.trailing) && (t = t.trim()), r.leading + e.replacement(t, n, this.options) + r.trailing;
}
function Ke(n, e) {
  var t = qe(n), r = Fe(e), i = Math.max(n.length - t.length, e.length - r.length), s = `

`.substring(0, i);
  return t + s + r;
}
function An(n) {
  return n != null && (typeof n == "string" || n.nodeType && (n.nodeType === 1 || n.nodeType === 9 || n.nodeType === 11));
}
var Ae = /highlight-(?:text|source)-([a-z0-9]+)/;
function _n(n) {
  n.addRule("highlightedCodeBlock", {
    filter: function(e) {
      var t = e.firstChild;
      return e.nodeName === "DIV" && Ae.test(e.className) && t && t.nodeName === "PRE";
    },
    replacement: function(e, t, r) {
      var i = t.className || "", s = (i.match(Ae) || [null, ""])[1];
      return `

` + r.fence + s + `
` + t.firstChild.textContent + `
` + r.fence + `

`;
    }
  });
}
function Ln(n) {
  n.addRule("strikethrough", {
    filter: ["del", "s", "strike"],
    replacement: function(e) {
      return "~" + e + "~";
    }
  });
}
var Rn = Array.prototype.indexOf, Bn = Array.prototype.every, M = {};
M.tableCell = {
  filter: ["th", "td"],
  replacement: function(n, e) {
    return Qe(n, e);
  }
};
M.tableRow = {
  filter: "tr",
  replacement: function(n, e) {
    var t = "", r = { left: ":--", right: "--:", center: ":-:" };
    if (pe(e))
      for (var i = 0; i < e.childNodes.length; i++) {
        var s = "---", o = (e.childNodes[i].getAttribute("align") || "").toLowerCase();
        o && (s = r[o] || s), t += Qe(s, e.childNodes[i]);
      }
    return `
` + n + (t ? `
` + t : "");
  }
};
M.table = {
  // Only convert tables with a heading row.
  // Tables with no heading row are kept using `keep` (see below).
  filter: function(n) {
    return n.nodeName === "TABLE" && pe(n.rows[0]);
  },
  replacement: function(n) {
    return n = n.replace(`

`, `
`), `

` + n + `

`;
  }
};
M.tableSection = {
  filter: ["thead", "tbody", "tfoot"],
  replacement: function(n) {
    return n;
  }
};
function pe(n) {
  var e = n.parentNode;
  return e.nodeName === "THEAD" || e.firstChild === n && (e.nodeName === "TABLE" || Mn(e)) && Bn.call(n.childNodes, function(t) {
    return t.nodeName === "TH";
  });
}
function Mn(n) {
  var e = n.previousSibling;
  return n.nodeName === "TBODY" && (!e || e.nodeName === "THEAD" && /^\s*$/i.test(e.textContent));
}
function Qe(n, e) {
  var t = Rn.call(e.parentNode.childNodes, e), r = " ";
  return t === 0 && (r = "| "), r + n + " |";
}
function Nn(n) {
  n.keep(function(t) {
    return t.nodeName === "TABLE" && !pe(t.rows[0]);
  });
  for (var e in M) n.addRule(e, M[e]);
}
function $n(n) {
  n.addRule("taskListItems", {
    filter: function(e) {
      return e.type === "checkbox" && e.parentNode.nodeName === "LI";
    },
    replacement: function(e, t) {
      return (t.checked ? "[x]" : "[ ]") + " ";
    }
  });
}
function Dn(n) {
  n.use([
    _n,
    Ln,
    Nn,
    $n
  ]);
}
function fe() {
  return {
    async: !1,
    breaks: !1,
    extensions: null,
    gfm: !0,
    hooks: null,
    pedantic: !1,
    renderer: null,
    silent: !1,
    tokenizer: null,
    walkTokens: null
  };
}
var _ = fe();
function Ye(n) {
  _ = n;
}
var O = { exec: () => null };
function g(n, e = "") {
  let t = typeof n == "string" ? n : n.source;
  const r = {
    replace: (i, s) => {
      let o = typeof s == "string" ? s : s.source;
      return o = o.replace(k.caret, "$1"), t = t.replace(i, o), r;
    },
    getRegex: () => new RegExp(t, e)
  };
  return r;
}
var k = {
  codeRemoveIndent: /^(?: {1,4}| {0,3}\t)/gm,
  outputLinkReplace: /\\([\[\]])/g,
  indentCodeCompensation: /^(\s+)(?:```)/,
  beginningSpace: /^\s+/,
  endingHash: /#$/,
  startingSpaceChar: /^ /,
  endingSpaceChar: / $/,
  nonSpaceChar: /[^ ]/,
  newLineCharGlobal: /\n/g,
  tabCharGlobal: /\t/g,
  multipleSpaceGlobal: /\s+/g,
  blankLine: /^[ \t]*$/,
  doubleBlankLine: /\n[ \t]*\n[ \t]*$/,
  blockquoteStart: /^ {0,3}>/,
  blockquoteSetextReplace: /\n {0,3}((?:=+|-+) *)(?=\n|$)/g,
  blockquoteSetextReplace2: /^ {0,3}>[ \t]?/gm,
  listReplaceTabs: /^\t+/,
  listReplaceNesting: /^ {1,4}(?=( {4})*[^ ])/g,
  listIsTask: /^\[[ xX]\] /,
  listReplaceTask: /^\[[ xX]\] +/,
  anyLine: /\n.*\n/,
  hrefBrackets: /^<(.*)>$/,
  tableDelimiter: /[:|]/,
  tableAlignChars: /^\||\| *$/g,
  tableRowBlankLine: /\n[ \t]*$/,
  tableAlignRight: /^ *-+: *$/,
  tableAlignCenter: /^ *:-+: *$/,
  tableAlignLeft: /^ *:-+ *$/,
  startATag: /^<a /i,
  endATag: /^<\/a>/i,
  startPreScriptTag: /^<(pre|code|kbd|script)(\s|>)/i,
  endPreScriptTag: /^<\/(pre|code|kbd|script)(\s|>)/i,
  startAngleBracket: /^</,
  endAngleBracket: />$/,
  pedanticHrefTitle: /^([^'"]*[^\s])\s+(['"])(.*)\2/,
  unicodeAlphaNumeric: /[\p{L}\p{N}]/u,
  escapeTest: /[&<>"']/,
  escapeReplace: /[&<>"']/g,
  escapeTestNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/,
  escapeReplaceNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,
  unescapeTest: /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig,
  caret: /(^|[^\[])\^/g,
  percentDecode: /%25/g,
  findPipe: /\|/g,
  splitPipe: / \|/,
  slashPipe: /\\\|/g,
  carriageReturn: /\r\n|\r/g,
  spaceLine: /^ +$/gm,
  notSpaceStart: /^\S*/,
  endingNewline: /\n$/,
  listItemRegex: (n) => new RegExp(`^( {0,3}${n})((?:[	 ][^\\n]*)?(?:\\n|$))`),
  nextBulletRegex: (n) => new RegExp(`^ {0,${Math.min(3, n - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`),
  hrRegex: (n) => new RegExp(`^ {0,${Math.min(3, n - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`),
  fencesBeginRegex: (n) => new RegExp(`^ {0,${Math.min(3, n - 1)}}(?:\`\`\`|~~~)`),
  headingBeginRegex: (n) => new RegExp(`^ {0,${Math.min(3, n - 1)}}#`),
  htmlBeginRegex: (n) => new RegExp(`^ {0,${Math.min(3, n - 1)}}<(?:[a-z].*>|!--)`, "i")
}, In = /^(?:[ \t]*(?:\n|$))+/, zn = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/, On = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/, H = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/, Pn = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/, ge = /(?:[*+-]|\d{1,9}[.)])/, Je = /^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/, et = g(Je).replace(/bull/g, ge).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/\|table/g, "").getRegex(), Hn = g(Je).replace(/bull/g, ge).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/table/g, / {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex(), be = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/, Fn = /^[^\n]+/, xe = /(?!\s*\])(?:\\.|[^\[\]\\])+/, qn = g(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label", xe).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(), Un = g(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, ge).getRegex(), Y = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul", ke = /<!--(?:-?>|[\s\S]*?(?:-->|$))/, jn = g(
  "^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))",
  "i"
).replace("comment", ke).replace("tag", Y).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(), tt = g(be).replace("hr", H).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Y).getRegex(), Wn = g(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", tt).getRegex(), ve = {
  blockquote: Wn,
  code: zn,
  def: qn,
  fences: On,
  heading: Pn,
  hr: H,
  html: jn,
  lheading: et,
  list: Un,
  newline: In,
  paragraph: tt,
  table: O,
  text: Fn
}, _e = g(
  "^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)"
).replace("hr", H).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", "(?: {4}| {0,3}	)[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Y).getRegex(), Gn = {
  ...ve,
  lheading: Hn,
  table: _e,
  paragraph: g(be).replace("hr", H).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", _e).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Y).getRegex()
}, Zn = {
  ...ve,
  html: g(
    `^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`
  ).replace("comment", ke).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
  heading: /^(#{1,6})(.*)(?:\n+|$)/,
  fences: O,
  // fences not supported
  lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
  paragraph: g(be).replace("hr", H).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", et).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex()
}, Xn = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/, Vn = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/, nt = /^( {2,}|\\)\n(?!\s*$)/, Kn = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/, J = /[\p{P}\p{S}]/u, ye = /[\s\p{P}\p{S}]/u, rt = /[^\s\p{P}\p{S}]/u, Qn = g(/^((?![*_])punctSpace)/, "u").replace(/punctSpace/g, ye).getRegex(), it = /(?!~)[\p{P}\p{S}]/u, Yn = /(?!~)[\s\p{P}\p{S}]/u, Jn = /(?:[^\s\p{P}\p{S}]|~)/u, er = /\[[^[\]]*?\]\((?:\\.|[^\\\(\)]|\((?:\\.|[^\\\(\)])*\))*\)|`[^`]*?`|<[^<>]*?>/g, st = /^(?:\*+(?:((?!\*)punct)|[^\s*]))|^_+(?:((?!_)punct)|([^\s_]))/, tr = g(st, "u").replace(/punct/g, J).getRegex(), nr = g(st, "u").replace(/punct/g, it).getRegex(), ot = "^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)", rr = g(ot, "gu").replace(/notPunctSpace/g, rt).replace(/punctSpace/g, ye).replace(/punct/g, J).getRegex(), ir = g(ot, "gu").replace(/notPunctSpace/g, Jn).replace(/punctSpace/g, Yn).replace(/punct/g, it).getRegex(), sr = g(
  "^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)",
  "gu"
).replace(/notPunctSpace/g, rt).replace(/punctSpace/g, ye).replace(/punct/g, J).getRegex(), or = g(/\\(punct)/, "gu").replace(/punct/g, J).getRegex(), ar = g(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(), lr = g(ke).replace("(?:-->|$)", "-->").getRegex(), cr = g(
  "^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>"
).replace("comment", lr).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(), V = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/, ur = g(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]*(?:\n[ \t]*)?)(title))?\s*\)/).replace("label", V).replace("href", /<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(), at = g(/^!?\[(label)\]\[(ref)\]/).replace("label", V).replace("ref", xe).getRegex(), lt = g(/^!?\[(ref)\](?:\[\])?/).replace("ref", xe).getRegex(), dr = g("reflink|nolink(?!\\()", "g").replace("reflink", at).replace("nolink", lt).getRegex(), we = {
  _backpedal: O,
  // only used for GFM url
  anyPunctuation: or,
  autolink: ar,
  blockSkip: er,
  br: nt,
  code: Vn,
  del: O,
  emStrongLDelim: tr,
  emStrongRDelimAst: rr,
  emStrongRDelimUnd: sr,
  escape: Xn,
  link: ur,
  nolink: lt,
  punctuation: Qn,
  reflink: at,
  reflinkSearch: dr,
  tag: cr,
  text: Kn,
  url: O
}, hr = {
  ...we,
  link: g(/^!?\[(label)\]\((.*?)\)/).replace("label", V).getRegex(),
  reflink: g(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", V).getRegex()
}, oe = {
  ...we,
  emStrongRDelimAst: ir,
  emStrongLDelim: nr,
  url: g(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/, "i").replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),
  _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
  del: /^(~~?)(?=[^\s~])((?:\\.|[^\\])*?(?:\\.|[^\s~\\]))\1(?=[^~]|$)/,
  text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
}, mr = {
  ...oe,
  br: g(nt).replace("{2,}", "*").getRegex(),
  text: g(oe.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
}, U = {
  normal: ve,
  gfm: Gn,
  pedantic: Zn
}, D = {
  normal: we,
  gfm: oe,
  breaks: mr,
  pedantic: hr
}, pr = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}, Le = (n) => pr[n];
function v(n, e) {
  if (e) {
    if (k.escapeTest.test(n))
      return n.replace(k.escapeReplace, Le);
  } else if (k.escapeTestNoEncode.test(n))
    return n.replace(k.escapeReplaceNoEncode, Le);
  return n;
}
function Re(n) {
  try {
    n = encodeURI(n).replace(k.percentDecode, "%");
  } catch {
    return null;
  }
  return n;
}
function Be(n, e) {
  const t = n.replace(k.findPipe, (s, o, a) => {
    let l = !1, c = o;
    for (; --c >= 0 && a[c] === "\\"; ) l = !l;
    return l ? "|" : " |";
  }), r = t.split(k.splitPipe);
  let i = 0;
  if (r[0].trim() || r.shift(), r.length > 0 && !r.at(-1)?.trim() && r.pop(), e)
    if (r.length > e)
      r.splice(e);
    else
      for (; r.length < e; ) r.push("");
  for (; i < r.length; i++)
    r[i] = r[i].trim().replace(k.slashPipe, "|");
  return r;
}
function I(n, e, t) {
  const r = n.length;
  if (r === 0)
    return "";
  let i = 0;
  for (; i < r && n.charAt(r - i - 1) === e; )
    i++;
  return n.slice(0, r - i);
}
function fr(n, e) {
  if (n.indexOf(e[1]) === -1)
    return -1;
  let t = 0;
  for (let r = 0; r < n.length; r++)
    if (n[r] === "\\")
      r++;
    else if (n[r] === e[0])
      t++;
    else if (n[r] === e[1] && (t--, t < 0))
      return r;
  return t > 0 ? -2 : -1;
}
function Me(n, e, t, r, i) {
  const s = e.href, o = e.title || null, a = n[1].replace(i.other.outputLinkReplace, "$1");
  r.state.inLink = !0;
  const l = {
    type: n[0].charAt(0) === "!" ? "image" : "link",
    raw: t,
    href: s,
    title: o,
    text: a,
    tokens: r.inlineTokens(a)
  };
  return r.state.inLink = !1, l;
}
function gr(n, e, t) {
  const r = n.match(t.other.indentCodeCompensation);
  if (r === null)
    return e;
  const i = r[1];
  return e.split(`
`).map((s) => {
    const o = s.match(t.other.beginningSpace);
    if (o === null)
      return s;
    const [a] = o;
    return a.length >= i.length ? s.slice(i.length) : s;
  }).join(`
`);
}
var K = class {
  options;
  rules;
  // set by the lexer
  lexer;
  // set by the lexer
  constructor(n) {
    this.options = n || _;
  }
  space(n) {
    const e = this.rules.block.newline.exec(n);
    if (e && e[0].length > 0)
      return {
        type: "space",
        raw: e[0]
      };
  }
  code(n) {
    const e = this.rules.block.code.exec(n);
    if (e) {
      const t = e[0].replace(this.rules.other.codeRemoveIndent, "");
      return {
        type: "code",
        raw: e[0],
        codeBlockStyle: "indented",
        text: this.options.pedantic ? t : I(t, `
`)
      };
    }
  }
  fences(n) {
    const e = this.rules.block.fences.exec(n);
    if (e) {
      const t = e[0], r = gr(t, e[3] || "", this.rules);
      return {
        type: "code",
        raw: t,
        lang: e[2] ? e[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : e[2],
        text: r
      };
    }
  }
  heading(n) {
    const e = this.rules.block.heading.exec(n);
    if (e) {
      let t = e[2].trim();
      if (this.rules.other.endingHash.test(t)) {
        const r = I(t, "#");
        (this.options.pedantic || !r || this.rules.other.endingSpaceChar.test(r)) && (t = r.trim());
      }
      return {
        type: "heading",
        raw: e[0],
        depth: e[1].length,
        text: t,
        tokens: this.lexer.inline(t)
      };
    }
  }
  hr(n) {
    const e = this.rules.block.hr.exec(n);
    if (e)
      return {
        type: "hr",
        raw: I(e[0], `
`)
      };
  }
  blockquote(n) {
    const e = this.rules.block.blockquote.exec(n);
    if (e) {
      let t = I(e[0], `
`).split(`
`), r = "", i = "";
      const s = [];
      for (; t.length > 0; ) {
        let o = !1;
        const a = [];
        let l;
        for (l = 0; l < t.length; l++)
          if (this.rules.other.blockquoteStart.test(t[l]))
            a.push(t[l]), o = !0;
          else if (!o)
            a.push(t[l]);
          else
            break;
        t = t.slice(l);
        const c = a.join(`
`), u = c.replace(this.rules.other.blockquoteSetextReplace, `
    $1`).replace(this.rules.other.blockquoteSetextReplace2, "");
        r = r ? `${r}
${c}` : c, i = i ? `${i}
${u}` : u;
        const d = this.lexer.state.top;
        if (this.lexer.state.top = !0, this.lexer.blockTokens(u, s, !0), this.lexer.state.top = d, t.length === 0)
          break;
        const h = s.at(-1);
        if (h?.type === "code")
          break;
        if (h?.type === "blockquote") {
          const p = h, m = p.raw + `
` + t.join(`
`), b = this.blockquote(m);
          s[s.length - 1] = b, r = r.substring(0, r.length - p.raw.length) + b.raw, i = i.substring(0, i.length - p.text.length) + b.text;
          break;
        } else if (h?.type === "list") {
          const p = h, m = p.raw + `
` + t.join(`
`), b = this.list(m);
          s[s.length - 1] = b, r = r.substring(0, r.length - h.raw.length) + b.raw, i = i.substring(0, i.length - p.raw.length) + b.raw, t = m.substring(s.at(-1).raw.length).split(`
`);
          continue;
        }
      }
      return {
        type: "blockquote",
        raw: r,
        tokens: s,
        text: i
      };
    }
  }
  list(n) {
    let e = this.rules.block.list.exec(n);
    if (e) {
      let t = e[1].trim();
      const r = t.length > 1, i = {
        type: "list",
        raw: "",
        ordered: r,
        start: r ? +t.slice(0, -1) : "",
        loose: !1,
        items: []
      };
      t = r ? `\\d{1,9}\\${t.slice(-1)}` : `\\${t}`, this.options.pedantic && (t = r ? t : "[*+-]");
      const s = this.rules.other.listItemRegex(t);
      let o = !1;
      for (; n; ) {
        let l = !1, c = "", u = "";
        if (!(e = s.exec(n)) || this.rules.block.hr.test(n))
          break;
        c = e[0], n = n.substring(c.length);
        let d = e[2].split(`
`, 1)[0].replace(this.rules.other.listReplaceTabs, (C) => " ".repeat(3 * C.length)), h = n.split(`
`, 1)[0], p = !d.trim(), m = 0;
        if (this.options.pedantic ? (m = 2, u = d.trimStart()) : p ? m = e[1].length + 1 : (m = e[2].search(this.rules.other.nonSpaceChar), m = m > 4 ? 1 : m, u = d.slice(m), m += e[1].length), p && this.rules.other.blankLine.test(h) && (c += h + `
`, n = n.substring(h.length + 1), l = !0), !l) {
          const C = this.rules.other.nextBulletRegex(m), L = this.rules.other.hrRegex(m), R = this.rules.other.fencesBeginRegex(m), B = this.rules.other.headingBeginRegex(m), N = this.rules.other.htmlBeginRegex(m);
          for (; n; ) {
            const T = n.split(`
`, 1)[0];
            let $;
            if (h = T, this.options.pedantic ? (h = h.replace(this.rules.other.listReplaceNesting, "  "), $ = h) : $ = h.replace(this.rules.other.tabCharGlobal, "    "), R.test(h) || B.test(h) || N.test(h) || C.test(h) || L.test(h))
              break;
            if ($.search(this.rules.other.nonSpaceChar) >= m || !h.trim())
              u += `
` + $.slice(m);
            else {
              if (p || d.replace(this.rules.other.tabCharGlobal, "    ").search(this.rules.other.nonSpaceChar) >= 4 || R.test(d) || B.test(d) || L.test(d))
                break;
              u += `
` + h;
            }
            !p && !h.trim() && (p = !0), c += T + `
`, n = n.substring(T.length + 1), d = $.slice(m);
          }
        }
        i.loose || (o ? i.loose = !0 : this.rules.other.doubleBlankLine.test(c) && (o = !0));
        let b = null, q;
        this.options.gfm && (b = this.rules.other.listIsTask.exec(u), b && (q = b[0] !== "[ ] ", u = u.replace(this.rules.other.listReplaceTask, ""))), i.items.push({
          type: "list_item",
          raw: c,
          task: !!b,
          checked: q,
          loose: !1,
          text: u,
          tokens: []
        }), i.raw += c;
      }
      const a = i.items.at(-1);
      if (a)
        a.raw = a.raw.trimEnd(), a.text = a.text.trimEnd();
      else
        return;
      i.raw = i.raw.trimEnd();
      for (let l = 0; l < i.items.length; l++)
        if (this.lexer.state.top = !1, i.items[l].tokens = this.lexer.blockTokens(i.items[l].text, []), !i.loose) {
          const c = i.items[l].tokens.filter((d) => d.type === "space"), u = c.length > 0 && c.some((d) => this.rules.other.anyLine.test(d.raw));
          i.loose = u;
        }
      if (i.loose)
        for (let l = 0; l < i.items.length; l++)
          i.items[l].loose = !0;
      return i;
    }
  }
  html(n) {
    const e = this.rules.block.html.exec(n);
    if (e)
      return {
        type: "html",
        block: !0,
        raw: e[0],
        pre: e[1] === "pre" || e[1] === "script" || e[1] === "style",
        text: e[0]
      };
  }
  def(n) {
    const e = this.rules.block.def.exec(n);
    if (e) {
      const t = e[1].toLowerCase().replace(this.rules.other.multipleSpaceGlobal, " "), r = e[2] ? e[2].replace(this.rules.other.hrefBrackets, "$1").replace(this.rules.inline.anyPunctuation, "$1") : "", i = e[3] ? e[3].substring(1, e[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1") : e[3];
      return {
        type: "def",
        tag: t,
        raw: e[0],
        href: r,
        title: i
      };
    }
  }
  table(n) {
    const e = this.rules.block.table.exec(n);
    if (!e || !this.rules.other.tableDelimiter.test(e[2]))
      return;
    const t = Be(e[1]), r = e[2].replace(this.rules.other.tableAlignChars, "").split("|"), i = e[3]?.trim() ? e[3].replace(this.rules.other.tableRowBlankLine, "").split(`
`) : [], s = {
      type: "table",
      raw: e[0],
      header: [],
      align: [],
      rows: []
    };
    if (t.length === r.length) {
      for (const o of r)
        this.rules.other.tableAlignRight.test(o) ? s.align.push("right") : this.rules.other.tableAlignCenter.test(o) ? s.align.push("center") : this.rules.other.tableAlignLeft.test(o) ? s.align.push("left") : s.align.push(null);
      for (let o = 0; o < t.length; o++)
        s.header.push({
          text: t[o],
          tokens: this.lexer.inline(t[o]),
          header: !0,
          align: s.align[o]
        });
      for (const o of i)
        s.rows.push(Be(o, s.header.length).map((a, l) => ({
          text: a,
          tokens: this.lexer.inline(a),
          header: !1,
          align: s.align[l]
        })));
      return s;
    }
  }
  lheading(n) {
    const e = this.rules.block.lheading.exec(n);
    if (e)
      return {
        type: "heading",
        raw: e[0],
        depth: e[2].charAt(0) === "=" ? 1 : 2,
        text: e[1],
        tokens: this.lexer.inline(e[1])
      };
  }
  paragraph(n) {
    const e = this.rules.block.paragraph.exec(n);
    if (e) {
      const t = e[1].charAt(e[1].length - 1) === `
` ? e[1].slice(0, -1) : e[1];
      return {
        type: "paragraph",
        raw: e[0],
        text: t,
        tokens: this.lexer.inline(t)
      };
    }
  }
  text(n) {
    const e = this.rules.block.text.exec(n);
    if (e)
      return {
        type: "text",
        raw: e[0],
        text: e[0],
        tokens: this.lexer.inline(e[0])
      };
  }
  escape(n) {
    const e = this.rules.inline.escape.exec(n);
    if (e)
      return {
        type: "escape",
        raw: e[0],
        text: e[1]
      };
  }
  tag(n) {
    const e = this.rules.inline.tag.exec(n);
    if (e)
      return !this.lexer.state.inLink && this.rules.other.startATag.test(e[0]) ? this.lexer.state.inLink = !0 : this.lexer.state.inLink && this.rules.other.endATag.test(e[0]) && (this.lexer.state.inLink = !1), !this.lexer.state.inRawBlock && this.rules.other.startPreScriptTag.test(e[0]) ? this.lexer.state.inRawBlock = !0 : this.lexer.state.inRawBlock && this.rules.other.endPreScriptTag.test(e[0]) && (this.lexer.state.inRawBlock = !1), {
        type: "html",
        raw: e[0],
        inLink: this.lexer.state.inLink,
        inRawBlock: this.lexer.state.inRawBlock,
        block: !1,
        text: e[0]
      };
  }
  link(n) {
    const e = this.rules.inline.link.exec(n);
    if (e) {
      const t = e[2].trim();
      if (!this.options.pedantic && this.rules.other.startAngleBracket.test(t)) {
        if (!this.rules.other.endAngleBracket.test(t))
          return;
        const s = I(t.slice(0, -1), "\\");
        if ((t.length - s.length) % 2 === 0)
          return;
      } else {
        const s = fr(e[2], "()");
        if (s === -2)
          return;
        if (s > -1) {
          const a = (e[0].indexOf("!") === 0 ? 5 : 4) + e[1].length + s;
          e[2] = e[2].substring(0, s), e[0] = e[0].substring(0, a).trim(), e[3] = "";
        }
      }
      let r = e[2], i = "";
      if (this.options.pedantic) {
        const s = this.rules.other.pedanticHrefTitle.exec(r);
        s && (r = s[1], i = s[3]);
      } else
        i = e[3] ? e[3].slice(1, -1) : "";
      return r = r.trim(), this.rules.other.startAngleBracket.test(r) && (this.options.pedantic && !this.rules.other.endAngleBracket.test(t) ? r = r.slice(1) : r = r.slice(1, -1)), Me(e, {
        href: r && r.replace(this.rules.inline.anyPunctuation, "$1"),
        title: i && i.replace(this.rules.inline.anyPunctuation, "$1")
      }, e[0], this.lexer, this.rules);
    }
  }
  reflink(n, e) {
    let t;
    if ((t = this.rules.inline.reflink.exec(n)) || (t = this.rules.inline.nolink.exec(n))) {
      const r = (t[2] || t[1]).replace(this.rules.other.multipleSpaceGlobal, " "), i = e[r.toLowerCase()];
      if (!i) {
        const s = t[0].charAt(0);
        return {
          type: "text",
          raw: s,
          text: s
        };
      }
      return Me(t, i, t[0], this.lexer, this.rules);
    }
  }
  emStrong(n, e, t = "") {
    let r = this.rules.inline.emStrongLDelim.exec(n);
    if (!r || r[3] && t.match(this.rules.other.unicodeAlphaNumeric)) return;
    if (!(r[1] || r[2] || "") || !t || this.rules.inline.punctuation.exec(t)) {
      const s = [...r[0]].length - 1;
      let o, a, l = s, c = 0;
      const u = r[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
      for (u.lastIndex = 0, e = e.slice(-1 * n.length + s); (r = u.exec(e)) != null; ) {
        if (o = r[1] || r[2] || r[3] || r[4] || r[5] || r[6], !o) continue;
        if (a = [...o].length, r[3] || r[4]) {
          l += a;
          continue;
        } else if ((r[5] || r[6]) && s % 3 && !((s + a) % 3)) {
          c += a;
          continue;
        }
        if (l -= a, l > 0) continue;
        a = Math.min(a, a + l + c);
        const d = [...r[0]][0].length, h = n.slice(0, s + r.index + d + a);
        if (Math.min(s, a) % 2) {
          const m = h.slice(1, -1);
          return {
            type: "em",
            raw: h,
            text: m,
            tokens: this.lexer.inlineTokens(m)
          };
        }
        const p = h.slice(2, -2);
        return {
          type: "strong",
          raw: h,
          text: p,
          tokens: this.lexer.inlineTokens(p)
        };
      }
    }
  }
  codespan(n) {
    const e = this.rules.inline.code.exec(n);
    if (e) {
      let t = e[2].replace(this.rules.other.newLineCharGlobal, " ");
      const r = this.rules.other.nonSpaceChar.test(t), i = this.rules.other.startingSpaceChar.test(t) && this.rules.other.endingSpaceChar.test(t);
      return r && i && (t = t.substring(1, t.length - 1)), {
        type: "codespan",
        raw: e[0],
        text: t
      };
    }
  }
  br(n) {
    const e = this.rules.inline.br.exec(n);
    if (e)
      return {
        type: "br",
        raw: e[0]
      };
  }
  del(n) {
    const e = this.rules.inline.del.exec(n);
    if (e)
      return {
        type: "del",
        raw: e[0],
        text: e[2],
        tokens: this.lexer.inlineTokens(e[2])
      };
  }
  autolink(n) {
    const e = this.rules.inline.autolink.exec(n);
    if (e) {
      let t, r;
      return e[2] === "@" ? (t = e[1], r = "mailto:" + t) : (t = e[1], r = t), {
        type: "link",
        raw: e[0],
        text: t,
        href: r,
        tokens: [
          {
            type: "text",
            raw: t,
            text: t
          }
        ]
      };
    }
  }
  url(n) {
    let e;
    if (e = this.rules.inline.url.exec(n)) {
      let t, r;
      if (e[2] === "@")
        t = e[0], r = "mailto:" + t;
      else {
        let i;
        do
          i = e[0], e[0] = this.rules.inline._backpedal.exec(e[0])?.[0] ?? "";
        while (i !== e[0]);
        t = e[0], e[1] === "www." ? r = "http://" + e[0] : r = e[0];
      }
      return {
        type: "link",
        raw: e[0],
        text: t,
        href: r,
        tokens: [
          {
            type: "text",
            raw: t,
            text: t
          }
        ]
      };
    }
  }
  inlineText(n) {
    const e = this.rules.inline.text.exec(n);
    if (e) {
      const t = this.lexer.state.inRawBlock;
      return {
        type: "text",
        raw: e[0],
        text: e[0],
        escaped: t
      };
    }
  }
}, y = class ae {
  tokens;
  options;
  state;
  tokenizer;
  inlineQueue;
  constructor(e) {
    this.tokens = [], this.tokens.links = /* @__PURE__ */ Object.create(null), this.options = e || _, this.options.tokenizer = this.options.tokenizer || new K(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = {
      inLink: !1,
      inRawBlock: !1,
      top: !0
    };
    const t = {
      other: k,
      block: U.normal,
      inline: D.normal
    };
    this.options.pedantic ? (t.block = U.pedantic, t.inline = D.pedantic) : this.options.gfm && (t.block = U.gfm, this.options.breaks ? t.inline = D.breaks : t.inline = D.gfm), this.tokenizer.rules = t;
  }
  /**
   * Expose Rules
   */
  static get rules() {
    return {
      block: U,
      inline: D
    };
  }
  /**
   * Static Lex Method
   */
  static lex(e, t) {
    return new ae(t).lex(e);
  }
  /**
   * Static Lex Inline Method
   */
  static lexInline(e, t) {
    return new ae(t).inlineTokens(e);
  }
  /**
   * Preprocessing
   */
  lex(e) {
    e = e.replace(k.carriageReturn, `
`), this.blockTokens(e, this.tokens);
    for (let t = 0; t < this.inlineQueue.length; t++) {
      const r = this.inlineQueue[t];
      this.inlineTokens(r.src, r.tokens);
    }
    return this.inlineQueue = [], this.tokens;
  }
  blockTokens(e, t = [], r = !1) {
    for (this.options.pedantic && (e = e.replace(k.tabCharGlobal, "    ").replace(k.spaceLine, "")); e; ) {
      let i;
      if (this.options.extensions?.block?.some((o) => (i = o.call({ lexer: this }, e, t)) ? (e = e.substring(i.raw.length), t.push(i), !0) : !1))
        continue;
      if (i = this.tokenizer.space(e)) {
        e = e.substring(i.raw.length);
        const o = t.at(-1);
        i.raw.length === 1 && o !== void 0 ? o.raw += `
` : t.push(i);
        continue;
      }
      if (i = this.tokenizer.code(e)) {
        e = e.substring(i.raw.length);
        const o = t.at(-1);
        o?.type === "paragraph" || o?.type === "text" ? (o.raw += `
` + i.raw, o.text += `
` + i.text, this.inlineQueue.at(-1).src = o.text) : t.push(i);
        continue;
      }
      if (i = this.tokenizer.fences(e)) {
        e = e.substring(i.raw.length), t.push(i);
        continue;
      }
      if (i = this.tokenizer.heading(e)) {
        e = e.substring(i.raw.length), t.push(i);
        continue;
      }
      if (i = this.tokenizer.hr(e)) {
        e = e.substring(i.raw.length), t.push(i);
        continue;
      }
      if (i = this.tokenizer.blockquote(e)) {
        e = e.substring(i.raw.length), t.push(i);
        continue;
      }
      if (i = this.tokenizer.list(e)) {
        e = e.substring(i.raw.length), t.push(i);
        continue;
      }
      if (i = this.tokenizer.html(e)) {
        e = e.substring(i.raw.length), t.push(i);
        continue;
      }
      if (i = this.tokenizer.def(e)) {
        e = e.substring(i.raw.length);
        const o = t.at(-1);
        o?.type === "paragraph" || o?.type === "text" ? (o.raw += `
` + i.raw, o.text += `
` + i.raw, this.inlineQueue.at(-1).src = o.text) : this.tokens.links[i.tag] || (this.tokens.links[i.tag] = {
          href: i.href,
          title: i.title
        });
        continue;
      }
      if (i = this.tokenizer.table(e)) {
        e = e.substring(i.raw.length), t.push(i);
        continue;
      }
      if (i = this.tokenizer.lheading(e)) {
        e = e.substring(i.raw.length), t.push(i);
        continue;
      }
      let s = e;
      if (this.options.extensions?.startBlock) {
        let o = 1 / 0;
        const a = e.slice(1);
        let l;
        this.options.extensions.startBlock.forEach((c) => {
          l = c.call({ lexer: this }, a), typeof l == "number" && l >= 0 && (o = Math.min(o, l));
        }), o < 1 / 0 && o >= 0 && (s = e.substring(0, o + 1));
      }
      if (this.state.top && (i = this.tokenizer.paragraph(s))) {
        const o = t.at(-1);
        r && o?.type === "paragraph" ? (o.raw += `
` + i.raw, o.text += `
` + i.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = o.text) : t.push(i), r = s.length !== e.length, e = e.substring(i.raw.length);
        continue;
      }
      if (i = this.tokenizer.text(e)) {
        e = e.substring(i.raw.length);
        const o = t.at(-1);
        o?.type === "text" ? (o.raw += `
` + i.raw, o.text += `
` + i.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = o.text) : t.push(i);
        continue;
      }
      if (e) {
        const o = "Infinite loop on byte: " + e.charCodeAt(0);
        if (this.options.silent) {
          console.error(o);
          break;
        } else
          throw new Error(o);
      }
    }
    return this.state.top = !0, t;
  }
  inline(e, t = []) {
    return this.inlineQueue.push({ src: e, tokens: t }), t;
  }
  /**
   * Lexing/Compiling
   */
  inlineTokens(e, t = []) {
    let r = e, i = null;
    if (this.tokens.links) {
      const a = Object.keys(this.tokens.links);
      if (a.length > 0)
        for (; (i = this.tokenizer.rules.inline.reflinkSearch.exec(r)) != null; )
          a.includes(i[0].slice(i[0].lastIndexOf("[") + 1, -1)) && (r = r.slice(0, i.index) + "[" + "a".repeat(i[0].length - 2) + "]" + r.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex));
    }
    for (; (i = this.tokenizer.rules.inline.anyPunctuation.exec(r)) != null; )
      r = r.slice(0, i.index) + "++" + r.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
    for (; (i = this.tokenizer.rules.inline.blockSkip.exec(r)) != null; )
      r = r.slice(0, i.index) + "[" + "a".repeat(i[0].length - 2) + "]" + r.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
    let s = !1, o = "";
    for (; e; ) {
      s || (o = ""), s = !1;
      let a;
      if (this.options.extensions?.inline?.some((c) => (a = c.call({ lexer: this }, e, t)) ? (e = e.substring(a.raw.length), t.push(a), !0) : !1))
        continue;
      if (a = this.tokenizer.escape(e)) {
        e = e.substring(a.raw.length), t.push(a);
        continue;
      }
      if (a = this.tokenizer.tag(e)) {
        e = e.substring(a.raw.length), t.push(a);
        continue;
      }
      if (a = this.tokenizer.link(e)) {
        e = e.substring(a.raw.length), t.push(a);
        continue;
      }
      if (a = this.tokenizer.reflink(e, this.tokens.links)) {
        e = e.substring(a.raw.length);
        const c = t.at(-1);
        a.type === "text" && c?.type === "text" ? (c.raw += a.raw, c.text += a.text) : t.push(a);
        continue;
      }
      if (a = this.tokenizer.emStrong(e, r, o)) {
        e = e.substring(a.raw.length), t.push(a);
        continue;
      }
      if (a = this.tokenizer.codespan(e)) {
        e = e.substring(a.raw.length), t.push(a);
        continue;
      }
      if (a = this.tokenizer.br(e)) {
        e = e.substring(a.raw.length), t.push(a);
        continue;
      }
      if (a = this.tokenizer.del(e)) {
        e = e.substring(a.raw.length), t.push(a);
        continue;
      }
      if (a = this.tokenizer.autolink(e)) {
        e = e.substring(a.raw.length), t.push(a);
        continue;
      }
      if (!this.state.inLink && (a = this.tokenizer.url(e))) {
        e = e.substring(a.raw.length), t.push(a);
        continue;
      }
      let l = e;
      if (this.options.extensions?.startInline) {
        let c = 1 / 0;
        const u = e.slice(1);
        let d;
        this.options.extensions.startInline.forEach((h) => {
          d = h.call({ lexer: this }, u), typeof d == "number" && d >= 0 && (c = Math.min(c, d));
        }), c < 1 / 0 && c >= 0 && (l = e.substring(0, c + 1));
      }
      if (a = this.tokenizer.inlineText(l)) {
        e = e.substring(a.raw.length), a.raw.slice(-1) !== "_" && (o = a.raw.slice(-1)), s = !0;
        const c = t.at(-1);
        c?.type === "text" ? (c.raw += a.raw, c.text += a.text) : t.push(a);
        continue;
      }
      if (e) {
        const c = "Infinite loop on byte: " + e.charCodeAt(0);
        if (this.options.silent) {
          console.error(c);
          break;
        } else
          throw new Error(c);
      }
    }
    return t;
  }
}, Q = class {
  options;
  parser;
  // set by the parser
  constructor(n) {
    this.options = n || _;
  }
  space(n) {
    return "";
  }
  code({ text: n, lang: e, escaped: t }) {
    const r = (e || "").match(k.notSpaceStart)?.[0], i = n.replace(k.endingNewline, "") + `
`;
    return r ? '<pre><code class="language-' + v(r) + '">' + (t ? i : v(i, !0)) + `</code></pre>
` : "<pre><code>" + (t ? i : v(i, !0)) + `</code></pre>
`;
  }
  blockquote({ tokens: n }) {
    return `<blockquote>
${this.parser.parse(n)}</blockquote>
`;
  }
  html({ text: n }) {
    return n;
  }
  heading({ tokens: n, depth: e }) {
    return `<h${e}>${this.parser.parseInline(n)}</h${e}>
`;
  }
  hr(n) {
    return `<hr>
`;
  }
  list(n) {
    const e = n.ordered, t = n.start;
    let r = "";
    for (let o = 0; o < n.items.length; o++) {
      const a = n.items[o];
      r += this.listitem(a);
    }
    const i = e ? "ol" : "ul", s = e && t !== 1 ? ' start="' + t + '"' : "";
    return "<" + i + s + `>
` + r + "</" + i + `>
`;
  }
  listitem(n) {
    let e = "";
    if (n.task) {
      const t = this.checkbox({ checked: !!n.checked });
      n.loose ? n.tokens[0]?.type === "paragraph" ? (n.tokens[0].text = t + " " + n.tokens[0].text, n.tokens[0].tokens && n.tokens[0].tokens.length > 0 && n.tokens[0].tokens[0].type === "text" && (n.tokens[0].tokens[0].text = t + " " + v(n.tokens[0].tokens[0].text), n.tokens[0].tokens[0].escaped = !0)) : n.tokens.unshift({
        type: "text",
        raw: t + " ",
        text: t + " ",
        escaped: !0
      }) : e += t + " ";
    }
    return e += this.parser.parse(n.tokens, !!n.loose), `<li>${e}</li>
`;
  }
  checkbox({ checked: n }) {
    return "<input " + (n ? 'checked="" ' : "") + 'disabled="" type="checkbox">';
  }
  paragraph({ tokens: n }) {
    return `<p>${this.parser.parseInline(n)}</p>
`;
  }
  table(n) {
    let e = "", t = "";
    for (let i = 0; i < n.header.length; i++)
      t += this.tablecell(n.header[i]);
    e += this.tablerow({ text: t });
    let r = "";
    for (let i = 0; i < n.rows.length; i++) {
      const s = n.rows[i];
      t = "";
      for (let o = 0; o < s.length; o++)
        t += this.tablecell(s[o]);
      r += this.tablerow({ text: t });
    }
    return r && (r = `<tbody>${r}</tbody>`), `<table>
<thead>
` + e + `</thead>
` + r + `</table>
`;
  }
  tablerow({ text: n }) {
    return `<tr>
${n}</tr>
`;
  }
  tablecell(n) {
    const e = this.parser.parseInline(n.tokens), t = n.header ? "th" : "td";
    return (n.align ? `<${t} align="${n.align}">` : `<${t}>`) + e + `</${t}>
`;
  }
  /**
   * span level renderer
   */
  strong({ tokens: n }) {
    return `<strong>${this.parser.parseInline(n)}</strong>`;
  }
  em({ tokens: n }) {
    return `<em>${this.parser.parseInline(n)}</em>`;
  }
  codespan({ text: n }) {
    return `<code>${v(n, !0)}</code>`;
  }
  br(n) {
    return "<br>";
  }
  del({ tokens: n }) {
    return `<del>${this.parser.parseInline(n)}</del>`;
  }
  link({ href: n, title: e, tokens: t }) {
    const r = this.parser.parseInline(t), i = Re(n);
    if (i === null)
      return r;
    n = i;
    let s = '<a href="' + n + '"';
    return e && (s += ' title="' + v(e) + '"'), s += ">" + r + "</a>", s;
  }
  image({ href: n, title: e, text: t, tokens: r }) {
    r && (t = this.parser.parseInline(r, this.parser.textRenderer));
    const i = Re(n);
    if (i === null)
      return v(t);
    n = i;
    let s = `<img src="${n}" alt="${t}"`;
    return e && (s += ` title="${v(e)}"`), s += ">", s;
  }
  text(n) {
    return "tokens" in n && n.tokens ? this.parser.parseInline(n.tokens) : "escaped" in n && n.escaped ? n.text : v(n.text);
  }
}, Ce = class {
  // no need for block level renderers
  strong({ text: n }) {
    return n;
  }
  em({ text: n }) {
    return n;
  }
  codespan({ text: n }) {
    return n;
  }
  del({ text: n }) {
    return n;
  }
  html({ text: n }) {
    return n;
  }
  text({ text: n }) {
    return n;
  }
  link({ text: n }) {
    return "" + n;
  }
  image({ text: n }) {
    return "" + n;
  }
  br() {
    return "";
  }
}, w = class le {
  options;
  renderer;
  textRenderer;
  constructor(e) {
    this.options = e || _, this.options.renderer = this.options.renderer || new Q(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.renderer.parser = this, this.textRenderer = new Ce();
  }
  /**
   * Static Parse Method
   */
  static parse(e, t) {
    return new le(t).parse(e);
  }
  /**
   * Static Parse Inline Method
   */
  static parseInline(e, t) {
    return new le(t).parseInline(e);
  }
  /**
   * Parse Loop
   */
  parse(e, t = !0) {
    let r = "";
    for (let i = 0; i < e.length; i++) {
      const s = e[i];
      if (this.options.extensions?.renderers?.[s.type]) {
        const a = s, l = this.options.extensions.renderers[a.type].call({ parser: this }, a);
        if (l !== !1 || !["space", "hr", "heading", "code", "table", "blockquote", "list", "html", "paragraph", "text"].includes(a.type)) {
          r += l || "";
          continue;
        }
      }
      const o = s;
      switch (o.type) {
        case "space": {
          r += this.renderer.space(o);
          continue;
        }
        case "hr": {
          r += this.renderer.hr(o);
          continue;
        }
        case "heading": {
          r += this.renderer.heading(o);
          continue;
        }
        case "code": {
          r += this.renderer.code(o);
          continue;
        }
        case "table": {
          r += this.renderer.table(o);
          continue;
        }
        case "blockquote": {
          r += this.renderer.blockquote(o);
          continue;
        }
        case "list": {
          r += this.renderer.list(o);
          continue;
        }
        case "html": {
          r += this.renderer.html(o);
          continue;
        }
        case "paragraph": {
          r += this.renderer.paragraph(o);
          continue;
        }
        case "text": {
          let a = o, l = this.renderer.text(a);
          for (; i + 1 < e.length && e[i + 1].type === "text"; )
            a = e[++i], l += `
` + this.renderer.text(a);
          t ? r += this.renderer.paragraph({
            type: "paragraph",
            raw: l,
            text: l,
            tokens: [{ type: "text", raw: l, text: l, escaped: !0 }]
          }) : r += l;
          continue;
        }
        default: {
          const a = 'Token with "' + o.type + '" type was not found.';
          if (this.options.silent)
            return console.error(a), "";
          throw new Error(a);
        }
      }
    }
    return r;
  }
  /**
   * Parse Inline Tokens
   */
  parseInline(e, t = this.renderer) {
    let r = "";
    for (let i = 0; i < e.length; i++) {
      const s = e[i];
      if (this.options.extensions?.renderers?.[s.type]) {
        const a = this.options.extensions.renderers[s.type].call({ parser: this }, s);
        if (a !== !1 || !["escape", "html", "link", "image", "strong", "em", "codespan", "br", "del", "text"].includes(s.type)) {
          r += a || "";
          continue;
        }
      }
      const o = s;
      switch (o.type) {
        case "escape": {
          r += t.text(o);
          break;
        }
        case "html": {
          r += t.html(o);
          break;
        }
        case "link": {
          r += t.link(o);
          break;
        }
        case "image": {
          r += t.image(o);
          break;
        }
        case "strong": {
          r += t.strong(o);
          break;
        }
        case "em": {
          r += t.em(o);
          break;
        }
        case "codespan": {
          r += t.codespan(o);
          break;
        }
        case "br": {
          r += t.br(o);
          break;
        }
        case "del": {
          r += t.del(o);
          break;
        }
        case "text": {
          r += t.text(o);
          break;
        }
        default: {
          const a = 'Token with "' + o.type + '" type was not found.';
          if (this.options.silent)
            return console.error(a), "";
          throw new Error(a);
        }
      }
    }
    return r;
  }
}, G = class {
  options;
  block;
  constructor(n) {
    this.options = n || _;
  }
  static passThroughHooks = /* @__PURE__ */ new Set([
    "preprocess",
    "postprocess",
    "processAllTokens"
  ]);
  /**
   * Process markdown before marked
   */
  preprocess(n) {
    return n;
  }
  /**
   * Process HTML after marked is finished
   */
  postprocess(n) {
    return n;
  }
  /**
   * Process all tokens before walk tokens
   */
  processAllTokens(n) {
    return n;
  }
  /**
   * Provide function to tokenize markdown
   */
  provideLexer() {
    return this.block ? y.lex : y.lexInline;
  }
  /**
   * Provide function to parse tokens
   */
  provideParser() {
    return this.block ? w.parse : w.parseInline;
  }
}, br = class {
  defaults = fe();
  options = this.setOptions;
  parse = this.parseMarkdown(!0);
  parseInline = this.parseMarkdown(!1);
  Parser = w;
  Renderer = Q;
  TextRenderer = Ce;
  Lexer = y;
  Tokenizer = K;
  Hooks = G;
  constructor(...n) {
    this.use(...n);
  }
  /**
   * Run callback for every token
   */
  walkTokens(n, e) {
    let t = [];
    for (const r of n)
      switch (t = t.concat(e.call(this, r)), r.type) {
        case "table": {
          const i = r;
          for (const s of i.header)
            t = t.concat(this.walkTokens(s.tokens, e));
          for (const s of i.rows)
            for (const o of s)
              t = t.concat(this.walkTokens(o.tokens, e));
          break;
        }
        case "list": {
          const i = r;
          t = t.concat(this.walkTokens(i.items, e));
          break;
        }
        default: {
          const i = r;
          this.defaults.extensions?.childTokens?.[i.type] ? this.defaults.extensions.childTokens[i.type].forEach((s) => {
            const o = i[s].flat(1 / 0);
            t = t.concat(this.walkTokens(o, e));
          }) : i.tokens && (t = t.concat(this.walkTokens(i.tokens, e)));
        }
      }
    return t;
  }
  use(...n) {
    const e = this.defaults.extensions || { renderers: {}, childTokens: {} };
    return n.forEach((t) => {
      const r = { ...t };
      if (r.async = this.defaults.async || r.async || !1, t.extensions && (t.extensions.forEach((i) => {
        if (!i.name)
          throw new Error("extension name required");
        if ("renderer" in i) {
          const s = e.renderers[i.name];
          s ? e.renderers[i.name] = function(...o) {
            let a = i.renderer.apply(this, o);
            return a === !1 && (a = s.apply(this, o)), a;
          } : e.renderers[i.name] = i.renderer;
        }
        if ("tokenizer" in i) {
          if (!i.level || i.level !== "block" && i.level !== "inline")
            throw new Error("extension level must be 'block' or 'inline'");
          const s = e[i.level];
          s ? s.unshift(i.tokenizer) : e[i.level] = [i.tokenizer], i.start && (i.level === "block" ? e.startBlock ? e.startBlock.push(i.start) : e.startBlock = [i.start] : i.level === "inline" && (e.startInline ? e.startInline.push(i.start) : e.startInline = [i.start]));
        }
        "childTokens" in i && i.childTokens && (e.childTokens[i.name] = i.childTokens);
      }), r.extensions = e), t.renderer) {
        const i = this.defaults.renderer || new Q(this.defaults);
        for (const s in t.renderer) {
          if (!(s in i))
            throw new Error(`renderer '${s}' does not exist`);
          if (["options", "parser"].includes(s))
            continue;
          const o = s, a = t.renderer[o], l = i[o];
          i[o] = (...c) => {
            let u = a.apply(i, c);
            return u === !1 && (u = l.apply(i, c)), u || "";
          };
        }
        r.renderer = i;
      }
      if (t.tokenizer) {
        const i = this.defaults.tokenizer || new K(this.defaults);
        for (const s in t.tokenizer) {
          if (!(s in i))
            throw new Error(`tokenizer '${s}' does not exist`);
          if (["options", "rules", "lexer"].includes(s))
            continue;
          const o = s, a = t.tokenizer[o], l = i[o];
          i[o] = (...c) => {
            let u = a.apply(i, c);
            return u === !1 && (u = l.apply(i, c)), u;
          };
        }
        r.tokenizer = i;
      }
      if (t.hooks) {
        const i = this.defaults.hooks || new G();
        for (const s in t.hooks) {
          if (!(s in i))
            throw new Error(`hook '${s}' does not exist`);
          if (["options", "block"].includes(s))
            continue;
          const o = s, a = t.hooks[o], l = i[o];
          G.passThroughHooks.has(s) ? i[o] = (c) => {
            if (this.defaults.async)
              return Promise.resolve(a.call(i, c)).then((d) => l.call(i, d));
            const u = a.call(i, c);
            return l.call(i, u);
          } : i[o] = (...c) => {
            let u = a.apply(i, c);
            return u === !1 && (u = l.apply(i, c)), u;
          };
        }
        r.hooks = i;
      }
      if (t.walkTokens) {
        const i = this.defaults.walkTokens, s = t.walkTokens;
        r.walkTokens = function(o) {
          let a = [];
          return a.push(s.call(this, o)), i && (a = a.concat(i.call(this, o))), a;
        };
      }
      this.defaults = { ...this.defaults, ...r };
    }), this;
  }
  setOptions(n) {
    return this.defaults = { ...this.defaults, ...n }, this;
  }
  lexer(n, e) {
    return y.lex(n, e ?? this.defaults);
  }
  parser(n, e) {
    return w.parse(n, e ?? this.defaults);
  }
  parseMarkdown(n) {
    return (t, r) => {
      const i = { ...r }, s = { ...this.defaults, ...i }, o = this.onError(!!s.silent, !!s.async);
      if (this.defaults.async === !0 && i.async === !1)
        return o(new Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));
      if (typeof t > "u" || t === null)
        return o(new Error("marked(): input parameter is undefined or null"));
      if (typeof t != "string")
        return o(new Error("marked(): input parameter is of type " + Object.prototype.toString.call(t) + ", string expected"));
      s.hooks && (s.hooks.options = s, s.hooks.block = n);
      const a = s.hooks ? s.hooks.provideLexer() : n ? y.lex : y.lexInline, l = s.hooks ? s.hooks.provideParser() : n ? w.parse : w.parseInline;
      if (s.async)
        return Promise.resolve(s.hooks ? s.hooks.preprocess(t) : t).then((c) => a(c, s)).then((c) => s.hooks ? s.hooks.processAllTokens(c) : c).then((c) => s.walkTokens ? Promise.all(this.walkTokens(c, s.walkTokens)).then(() => c) : c).then((c) => l(c, s)).then((c) => s.hooks ? s.hooks.postprocess(c) : c).catch(o);
      try {
        s.hooks && (t = s.hooks.preprocess(t));
        let c = a(t, s);
        s.hooks && (c = s.hooks.processAllTokens(c)), s.walkTokens && this.walkTokens(c, s.walkTokens);
        let u = l(c, s);
        return s.hooks && (u = s.hooks.postprocess(u)), u;
      } catch (c) {
        return o(c);
      }
    };
  }
  onError(n, e) {
    return (t) => {
      if (t.message += `
Please report this to https://github.com/markedjs/marked.`, n) {
        const r = "<p>An error occurred:</p><pre>" + v(t.message + "", !0) + "</pre>";
        return e ? Promise.resolve(r) : r;
      }
      if (e)
        return Promise.reject(t);
      throw t;
    };
  }
}, A = new br();
function f(n, e) {
  return A.parse(n, e);
}
f.options = f.setOptions = function(n) {
  return A.setOptions(n), f.defaults = A.defaults, Ye(f.defaults), f;
};
f.getDefaults = fe;
f.defaults = _;
f.use = function(...n) {
  return A.use(...n), f.defaults = A.defaults, Ye(f.defaults), f;
};
f.walkTokens = function(n, e) {
  return A.walkTokens(n, e);
};
f.parseInline = A.parseInline;
f.Parser = w;
f.parser = w.parse;
f.Renderer = Q;
f.TextRenderer = Ce;
f.Lexer = y;
f.lexer = y.lex;
f.Tokenizer = K;
f.Hooks = G;
f.parse = f;
f.options;
f.setOptions;
f.use;
f.walkTokens;
f.parseInline;
w.parse;
y.lex;
let E = null, Ne = !1;
function xr() {
  return E || (E = new X({
    headingStyle: "atx",
    hr: "---",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    fence: "```",
    emDelimiter: "*",
    strongDelimiter: "**",
    linkStyle: "inlined"
  }), E.use(Dn), E.addRule("lineBreak", {
    filter: "br",
    replacement: () => `  
`
  }), E.addRule("taskCheckbox", {
    filter(n) {
      return n.nodeName === "INPUT" && n.type === "checkbox" && n.classList.contains("rmx-task-checkbox");
    },
    replacement(n, e) {
      return e.checked ? "[x] " : "[ ] ";
    }
  }), E.addRule("underline", {
    filter: ["u"],
    replacement(n) {
      return `<u>${n}</u>`;
    }
  })), E;
}
function kr() {
  Ne || (f.setOptions({
    gfm: !0,
    breaks: !1
  }), Ne = !0);
}
function ct(n) {
  return !n || n === "<p><br></p>" ? "" : xr().turndown(n);
}
function ee(n) {
  return n ? (kr(), f.parse(n)) : "";
}
const $e = {
  // DOCX
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  // PDF
  "application/pdf": "pdf",
  // Markdown
  "text/markdown": "markdown",
  "text/x-markdown": "markdown",
  // HTML
  "text/html": "html",
  // Plain text
  "text/plain": "text",
  // CSV
  "text/csv": "csv",
  "application/csv": "csv",
  // RTF
  "text/rtf": "rtf",
  "application/rtf": "rtf"
}, ut = {
  ".docx": "docx",
  ".pdf": "pdf",
  ".md": "markdown",
  ".markdown": "markdown",
  ".html": "html",
  ".htm": "html",
  ".txt": "text",
  ".csv": "csv",
  ".tsv": "csv",
  ".rtf": "rtf"
};
function dt(n) {
  const e = n.lastIndexOf(".");
  return e >= 0 ? n.slice(e).toLowerCase() : "";
}
function ht(n) {
  if (n.type && $e[n.type])
    return $e[n.type];
  const e = dt(n.name || "");
  return ut[e] || null;
}
function F(n) {
  return new Promise((e, t) => {
    const r = new FileReader();
    r.onload = (i) => e(i.target.result), r.onerror = () => t(new Error(`Failed to read file: ${n.name}`)), r.readAsText(n);
  });
}
function mt(n) {
  return new Promise((e, t) => {
    const r = new FileReader();
    r.onload = (i) => e(i.target.result), r.onerror = () => t(new Error(`Failed to read file: ${n.name}`)), r.readAsArrayBuffer(n);
  });
}
async function vr(n) {
  const e = await import("mammoth"), t = await mt(n);
  return (await e.convertToHtml({ arrayBuffer: t })).value;
}
async function yr(n) {
  const e = await import("pdfjs-dist");
  if (!e.GlobalWorkerOptions.workerSrc)
    try {
      const s = await import("./pdf.worker-CHSF_LV3.js");
      e.GlobalWorkerOptions.workerSrc = s.default || s;
    } catch {
      e.GlobalWorkerOptions.workerSrc = "";
    }
  const t = await mt(n), r = await e.getDocument({ data: t }).promise, i = [];
  for (let s = 1; s <= r.numPages; s++) {
    const a = await (await r.getPage(s)).getTextContent(), l = [];
    let c = [], u = null;
    for (const p of a.items) {
      if (p.str === void 0) continue;
      const m = Math.round(p.transform[5]);
      u !== null && Math.abs(m - u) > 2 && (c.length > 0 && l.push(c.join("")), c = []), c.push(p.str), u = m;
    }
    c.length > 0 && l.push(c.join(""));
    const d = [];
    let h = [];
    for (const p of l) {
      const m = p.trim();
      m === "" ? h.length > 0 && (d.push(h.join(" ")), h = []) : h.push(m);
    }
    h.length > 0 && d.push(h.join(" ")), d.length > 0 && (r.numPages > 1 && i.push(`<h3>Page ${s}</h3>`), i.push(d.map((p) => `<p>${P(p)}</p>`).join(`
`)));
  }
  return i.join(`
`);
}
async function wr(n) {
  const e = await F(n);
  return ee(e);
}
async function Cr(n) {
  return F(n);
}
async function Tr(n) {
  return (await F(n)).split(/\n\n+/).map((t) => {
    const r = P(t.trim());
    return r ? `<p>${r.replace(/\n/g, "<br>")}</p>` : "";
  }).filter(Boolean).join(`
`);
}
async function Er(n) {
  const e = await F(n), r = dt(n.name || "") === ".tsv" ? "	" : ",", i = Sr(e, r);
  if (i.length === 0) return "<p></p>";
  const s = i[0], o = i.slice(1);
  let a = `<table>
<thead>
<tr>`;
  for (const l of s)
    a += `<th>${P(l)}</th>`;
  a += `</tr>
</thead>
<tbody>
`;
  for (const l of o) {
    a += "<tr>";
    for (let c = 0; c < s.length; c++)
      a += `<td>${P(l[c] || "")}</td>`;
    a += `</tr>
`;
  }
  return a += `</tbody>
</table>`, a;
}
function Sr(n, e = ",") {
  const t = [];
  let r = [], i = "", s = !1;
  for (let o = 0; o < n.length; o++) {
    const a = n[o];
    s ? a === '"' ? n[o + 1] === '"' ? (i += '"', o++) : s = !1 : i += a : a === '"' ? s = !0 : a === e ? (r.push(i.trim()), i = "") : a === `
` || a === "\r" ? (a === "\r" && n[o + 1] === `
` && o++, r.push(i.trim()), r.some((l) => l !== "") && t.push(r), r = [], i = "") : i += a;
  }
  return r.push(i.trim()), r.some((o) => o !== "") && t.push(r), t;
}
async function Ar(n) {
  let t = (await F(n)).replace(/^\{\\rtf[\s\S]*?(?=\\pard|[^\\{])/i, "").replace(/\}$/g, "");
  t = t.replace(/\{\\fonttbl[\s\S]*?\}/g, ""), t = t.replace(/\{\\colortbl[\s\S]*?\}/g, ""), t = t.replace(/\{\\stylesheet[\s\S]*?\}/g, ""), t = t.replace(/\{\\info[\s\S]*?\}/g, ""), t = t.replace(/\{[^{}]*\}/g, ""), t = t.replace(/\\par\b/g, `

`), t = t.replace(/\\line\b/g, `
`), t = t.replace(/\\[a-z]+\d*\s?/gi, ""), t = t.replace(/[{}]/g, ""), t = t.replace(/\\u(\d+)\?/g, (i, s) => String.fromCharCode(parseInt(s)));
  const r = t.split(/\n\n+/).map((i) => i.trim()).filter(Boolean);
  return r.length === 0 ? "<p></p>" : r.map((i) => `<p>${P(i)}</p>`).join(`
`);
}
function P(n) {
  return n.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function pt(n) {
  return ht(n) !== null;
}
function ei() {
  return Object.keys(ut).join(",");
}
function ti() {
  return ["PDF", "DOCX", "Markdown", "HTML", "TXT", "CSV", "TSV", "RTF"];
}
async function ft(n) {
  const e = ht(n);
  if (!e)
    throw new Error(`Unsupported file format: ${n.name}`);
  switch (e) {
    case "docx":
      return vr(n);
    case "pdf":
      return yr(n);
    case "markdown":
      return wr(n);
    case "html":
      return Cr(n);
    case "text":
      return Tr(n);
    case "csv":
      return Er(n);
    case "rtf":
      return Ar(n);
    default:
      throw new Error(`Unsupported format: ${e}`);
  }
}
const _r = [
  ["undo", "redo"],
  ["headings", "fontFamily", "fontSize"],
  ["bold", "italic", "underline", "strikethrough"],
  ["foreColor", "backColor"],
  ["alignLeft", "alignCenter", "alignRight", "alignJustify"],
  ["orderedList", "unorderedList", "taskList"],
  ["outdent", "indent"],
  ["link", "image", "attachment", "importDocument", "table", "embedMedia", "blockquote", "codeBlock", "horizontalRule"],
  ["subscript", "superscript"],
  ["findReplace", "toggleMarkdown", "sourceMode", "export", "fullscreen"]
], ni = [
  "Arial",
  "Arial Black",
  "Courier New",
  "Georgia",
  "Helvetica",
  "Impact",
  "Lucida Console",
  "Palatino Linotype",
  "Tahoma",
  "Times New Roman",
  "Trebuchet MS",
  "Verdana",
  "Comic Sans MS",
  "Segoe UI",
  "Roboto",
  "Open Sans"
], ri = [
  { label: "8px", value: "8px" },
  { label: "10px", value: "10px" },
  { label: "12px", value: "12px" },
  { label: "14px", value: "14px" },
  { label: "16px", value: "16px" },
  { label: "18px", value: "18px" },
  { label: "20px", value: "20px" },
  { label: "24px", value: "24px" },
  { label: "28px", value: "28px" },
  { label: "32px", value: "32px" },
  { label: "36px", value: "36px" },
  { label: "48px", value: "48px" },
  { label: "64px", value: "64px" },
  { label: "72px", value: "72px" }
], ii = [
  "#000000",
  "#434343",
  "#666666",
  "#999999",
  "#b7b7b7",
  "#cccccc",
  "#d9d9d9",
  "#efefef",
  "#f3f3f3",
  "#ffffff",
  "#980000",
  "#ff0000",
  "#ff9900",
  "#ffff00",
  "#00ff00",
  "#00ffff",
  "#4a86e8",
  "#0000ff",
  "#9900ff",
  "#ff00ff",
  "#e6b8af",
  "#f4cccc",
  "#fce5cd",
  "#fff2cc",
  "#d9ead3",
  "#d0e0e3",
  "#c9daf8",
  "#cfe2f3",
  "#d9d2e9",
  "#ead1dc",
  "#dd7e6b",
  "#ea9999",
  "#f9cb9c",
  "#ffe599",
  "#b6d7a8",
  "#a2c4c9",
  "#a4c2f4",
  "#9fc5e8",
  "#b4a7d6",
  "#d5a6bd",
  "#cc4125",
  "#e06666",
  "#f6b26b",
  "#ffd966",
  "#93c47d",
  "#76a5af",
  "#6d9eeb",
  "#6fa8dc",
  "#8e7cc3",
  "#c27ba0",
  "#a61c00",
  "#cc0000",
  "#e69138",
  "#f1c232",
  "#6aa84f",
  "#45818e",
  "#3c78d8",
  "#3d85c6",
  "#674ea7",
  "#a64d79",
  "#85200c",
  "#990000",
  "#b45f06",
  "#bf9000",
  "#38761d",
  "#134f5c",
  "#1155cc",
  "#0b5394",
  "#351c75",
  "#741b47",
  "#5b0f00",
  "#660000",
  "#783f04",
  "#7f6000",
  "#274e13",
  "#0c343d",
  "#1c4587",
  "#073763",
  "#20124d",
  "#4c1130"
], si = [
  { label: "File", items: ["importDocument", "export"] },
  { label: "Edit", items: ["undo", "redo", "---", "findReplace"] },
  { label: "View", items: ["fullscreen", "toggleMarkdown", "sourceMode"] },
  { label: "Insert", items: ["link", "image", "table", "attachment", "embedMedia", "---", "blockquote", "codeBlock", "horizontalRule"] },
  { label: "Format", items: [
    "bold",
    "italic",
    "underline",
    "strikethrough",
    "---",
    "subscript",
    "superscript",
    "---",
    { label: "Alignment", items: ["alignLeft", "alignCenter", "alignRight", "alignJustify"] },
    "---",
    "orderedList",
    "unorderedList",
    "taskList",
    "---",
    "foreColor",
    "backColor"
  ] }
], gt = 10 * 1024 * 1024, oi = [
  { label: "Normal", value: "p", tag: "p" },
  { label: "Heading 1", value: "h1", tag: "h1" },
  { label: "Heading 2", value: "h2", tag: "h2" },
  { label: "Heading 3", value: "h3", tag: "h3" },
  { label: "Heading 4", value: "h4", tag: "h4" },
  { label: "Heading 5", value: "h5", tag: "h5" },
  { label: "Heading 6", value: "h6", tag: "h6" }
];
class Lr {
  constructor(e) {
    this.engine = e, this._handlePaste = this._handlePaste.bind(this), this._handleCopy = this._handleCopy.bind(this), this._handleCut = this._handleCut.bind(this);
  }
  init() {
    this.engine.element.addEventListener("paste", this._handlePaste), this.engine.element.addEventListener("copy", this._handleCopy), this.engine.element.addEventListener("cut", this._handleCut);
  }
  destroy() {
    this.engine.element.removeEventListener("paste", this._handlePaste), this.engine.element.removeEventListener("copy", this._handleCopy), this.engine.element.removeEventListener("cut", this._handleCut);
  }
  _handlePaste(e) {
    e.preventDefault(), this.engine.history.snapshot();
    const t = e.clipboardData || window.clipboardData;
    let r = t.getData("text/html");
    const i = t.getData("text/plain"), s = Array.from(t.files || []), o = s.find((c) => c.type.startsWith("image/"));
    if (o) {
      this._handleImagePaste(o);
      return;
    }
    const a = s.filter((c) => !c.type.startsWith("image/") && pt(c));
    if (a.length > 0) {
      a.filter((c) => !this._exceedsMaxFileSize(c)).forEach((c) => {
        ft(c).then((u) => {
          const d = this.engine.sanitizer.sanitize(u);
          this.engine.selection.insertHTML(d), this.engine.eventBus.emit("content:change");
        }).catch((u) => {
          console.warn("Document import failed on paste:", u.message);
        });
      });
      return;
    }
    const l = s.filter((c) => !c.type.startsWith("image/"));
    if (l.length > 0 && this.engine.options.uploadHandler) {
      l.forEach((c) => {
        this.engine.options.uploadHandler(c).then((u) => {
          this.engine.commands.execute("insertAttachment", {
            url: u,
            filename: c.name,
            filesize: c.size
          });
        });
      });
      return;
    }
    r ? (r = Pe(r), r = this.engine.sanitizer.sanitize(r), this.engine.selection.insertHTML(r)) : i && this._handleTextPaste(i), this.engine.eventBus.emit("paste", { html: r, text: i }), this.engine.eventBus.emit("content:change");
  }
  /**
   * Handle plain-text paste with smart format detection.
   * - In markdown mode: always parse as markdown
   * - In HTML mode: auto-detect markdown patterns and convert,
   *   otherwise treat as plain text with paragraph wrapping
   */
  _handleTextPaste(e) {
    if (this.engine.outputFormat === "markdown" || He(e)) {
      let t = ee(e);
      t = this.engine.sanitizer.sanitize(t), this.engine.selection.insertHTML(t);
    } else {
      const r = e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").split(/\n\n+/).map((i) => `<p>${i.replace(/\n/g, "<br>")}</p>`).join("");
      this.engine.selection.insertHTML(r || "<p><br></p>");
    }
  }
  _handleCopy(e) {
  }
  _handleCut(e) {
    setTimeout(() => {
      this.engine.eventBus.emit("content:change");
    }, 0);
  }
  /**
   * Check if a file exceeds the configured maximum size.
   * @param {File} file
   * @returns {boolean} true if the file is too large
   */
  _exceedsMaxFileSize(e) {
    const t = this.engine.options.maxFileSize ?? gt;
    if (t > 0 && e.size > t) {
      const r = (e.size / 1048576).toFixed(1), i = (t / (1024 * 1024)).toFixed(0);
      return console.warn(`[Remyx] File "${e.name}" (${r} MB) exceeds the ${i} MB limit.`), this.engine.eventBus.emit("file:too-large", { file: e, maxSize: t }), !0;
    }
    return !1;
  }
  _handleImagePaste(e) {
    if (!this._exceedsMaxFileSize(e))
      if (this.engine.options.uploadHandler)
        this.engine.options.uploadHandler(e).then((t) => {
          this.engine.commands.execute("insertImage", { src: t, alt: e.name });
        });
      else {
        const t = new FileReader();
        t.onload = (r) => {
          const i = r.target.result;
          this.engine.commands.execute("insertImage", { src: i, alt: e.name });
        }, t.readAsDataURL(e);
      }
  }
}
class Rr {
  constructor(e) {
    this.engine = e, this._handleDragOver = this._handleDragOver.bind(this), this._handleDrop = this._handleDrop.bind(this), this._handleDragEnter = this._handleDragEnter.bind(this), this._handleDragLeave = this._handleDragLeave.bind(this);
  }
  init() {
    const e = this.engine.element;
    e.addEventListener("dragover", this._handleDragOver), e.addEventListener("drop", this._handleDrop), e.addEventListener("dragenter", this._handleDragEnter), e.addEventListener("dragleave", this._handleDragLeave);
  }
  destroy() {
    const e = this.engine.element;
    e.removeEventListener("dragover", this._handleDragOver), e.removeEventListener("drop", this._handleDrop), e.removeEventListener("dragenter", this._handleDragEnter), e.removeEventListener("dragleave", this._handleDragLeave);
  }
  _handleDragOver(e) {
    e.preventDefault(), e.dataTransfer.dropEffect = "copy";
  }
  _handleDragEnter(e) {
    e.preventDefault(), this.engine.element.classList.add("rmx-drag-over");
  }
  _handleDragLeave(e) {
    this.engine.element.contains(e.relatedTarget) || this.engine.element.classList.remove("rmx-drag-over");
  }
  _handleDrop(e) {
    e.preventDefault(), this.engine.element.classList.remove("rmx-drag-over");
    const t = Array.from(e.dataTransfer.files), r = t.filter((a) => a.type.startsWith("image/"));
    if (r.length > 0) {
      this._handleImageDrop(e, r);
      return;
    }
    const i = t.filter((a) => !a.type.startsWith("image/") && pt(a));
    if (i.length > 0) {
      this._handleDocumentDrop(e, i);
      return;
    }
    const s = t.filter((a) => !a.type.startsWith("image/"));
    if (s.length > 0 && this.engine.options.uploadHandler) {
      this._handleFileDrop(e, s);
      return;
    }
    this._setCursorAtDropPoint(e), this.engine.history.snapshot();
    const o = e.dataTransfer.getData("text/html");
    if (o) {
      let a = Pe(o);
      a = this.engine.sanitizer.sanitize(a), this.engine.selection.insertHTML(a), this.engine.eventBus.emit("content:change");
    } else {
      const a = e.dataTransfer.getData("text/plain");
      a && (this._handleTextDrop(a), this.engine.eventBus.emit("content:change"));
    }
    this.engine.eventBus.emit("drop", { files: t, html: o });
  }
  /**
   * Check if a file exceeds the configured maximum size.
   * @param {File} file
   * @returns {boolean} true if the file is too large
   */
  _exceedsMaxFileSize(e) {
    const t = this.engine.options.maxFileSize ?? gt;
    if (t > 0 && e.size > t) {
      const r = (e.size / 1048576).toFixed(1), i = (t / (1024 * 1024)).toFixed(0);
      return console.warn(`[Remyx] File "${e.name}" (${r} MB) exceeds the ${i} MB limit.`), this.engine.eventBus.emit("file:too-large", { file: e, maxSize: t }), !0;
    }
    return !1;
  }
  _handleImageDrop(e, t) {
    this._setCursorAtDropPoint(e), this.engine.history.snapshot(), t.filter((r) => !this._exceedsMaxFileSize(r)).forEach((r) => {
      if (this.engine.options.uploadHandler)
        this.engine.options.uploadHandler(r).then((i) => {
          this.engine.commands.execute("insertImage", { src: i, alt: r.name });
        });
      else {
        const i = new FileReader();
        i.onload = (s) => {
          this.engine.commands.execute("insertImage", { src: s.target.result, alt: r.name });
        }, i.readAsDataURL(r);
      }
    });
  }
  _handleDocumentDrop(e, t) {
    this._setCursorAtDropPoint(e), this.engine.history.snapshot(), t.filter((r) => !this._exceedsMaxFileSize(r)).forEach((r) => {
      ft(r).then((i) => {
        const s = this.engine.sanitizer.sanitize(i);
        this.engine.selection.insertHTML(s), this.engine.eventBus.emit("content:change");
      }).catch((i) => {
        console.warn("Document import failed on drop:", i.message);
      });
    });
  }
  _handleFileDrop(e, t) {
    this._setCursorAtDropPoint(e), this.engine.history.snapshot(), t.forEach((r) => {
      this.engine.options.uploadHandler(r).then((i) => {
        this.engine.commands.execute("insertAttachment", {
          url: i,
          filename: r.name,
          filesize: r.size
        });
      });
    });
  }
  _setCursorAtDropPoint(e) {
    const t = document.caretRangeFromPoint ? document.caretRangeFromPoint(e.clientX, e.clientY) : null;
    if (t) {
      const r = window.getSelection();
      r.removeAllRanges(), r.addRange(t);
    }
  }
  /**
   * Handle dropped plain text with smart format detection.
   * Auto-detects markdown and converts to HTML for display.
   */
  _handleTextDrop(e) {
    if (this.engine.outputFormat === "markdown" || He(e)) {
      let t = ee(e);
      t = this.engine.sanitizer.sanitize(t), this.engine.selection.insertHTML(t);
    } else {
      const r = e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").split(/\n\n+/).map((i) => `<p>${i.replace(/\n/g, "<br>")}</p>`).join("");
      this.engine.selection.insertHTML(r || "<p><br></p>");
    }
  }
}
function Br(n) {
  return {
    /** The editor DOM element (read-only access) */
    get element() {
      return n.element;
    },
    /** Execute a registered command by name */
    executeCommand(e, ...t) {
      return n.commands.execute(e, ...t);
    },
    /** Subscribe to an editor event */
    on(e, t) {
      return n.eventBus.on(e, t);
    },
    /** Unsubscribe from an editor event */
    off(e, t) {
      n.eventBus.off(e, t);
    },
    /** Get the current selection range */
    getSelection() {
      return n.selection.getSelection();
    },
    /** Get the current selection range object */
    getRange() {
      return n.selection.getRange();
    },
    /** Get current active formats */
    getActiveFormats() {
      return n.selection.getActiveFormats();
    },
    /** Get sanitized HTML content */
    getHTML() {
      return n.getHTML();
    },
    /** Get plain text content */
    getText() {
      return n.getText();
    },
    /** Check if editor is empty */
    isEmpty() {
      return n.isEmpty();
    },
    /** Editor options (read-only copy) */
    get options() {
      return { ...n.options };
    }
  };
}
class Mr {
  constructor(e) {
    this.engine = e, this._plugins = /* @__PURE__ */ new Map(), this._pluginAPI = Br(e);
  }
  register(e) {
    if (!e || !e.name) {
      console.warn("Plugin must have a name");
      return;
    }
    if (this._plugins.has(e.name)) {
      console.warn(`Plugin "${e.name}" already registered`);
      return;
    }
    this._plugins.set(e.name, e), e.commands && e.commands.forEach((t) => {
      this.engine.commands.register(t.name, t);
    }), this.engine.eventBus.emit("plugin:registered", { name: e.name });
  }
  initAll() {
    this._plugins.forEach((e) => {
      try {
        if (e.init) {
          const t = e.requiresFullAccess ? this.engine : this._pluginAPI;
          e.init(t);
        }
      } catch (t) {
        console.error(`Error initializing plugin "${e.name}":`, t);
      }
    });
  }
  destroyAll() {
    this._plugins.forEach((e) => {
      try {
        if (e.destroy) {
          const t = e.requiresFullAccess ? this.engine : this._pluginAPI;
          e.destroy(t);
        }
      } catch (t) {
        console.error(`Error destroying plugin "${e.name}":`, t);
      }
    }), this._plugins.clear();
  }
  get(e) {
    return this._plugins.get(e);
  }
  getAll() {
    return Array.from(this._plugins.values());
  }
  has(e) {
    return this._plugins.has(e);
  }
}
class ai {
  constructor(e, t = {}) {
    this.element = e, this.options = t, this.outputFormat = t.outputFormat || "html", this.isSourceMode = !1, this.isMarkdownMode = !1, this._isDestroyed = !1, this.eventBus = new Tt(), this.selection = new At(e), this.keyboard = new Rt(this), this.commands = new _t(this), this.history = new Lt(this, t.history), this.sanitizer = new It(t.sanitize), this.clipboard = new Lr(this), this.dragDrop = new Rr(this), this.plugins = new Mr(this), this._handleInput = this._handleInput.bind(this), this._handleSelectionChange = this._handleSelectionChange.bind(this), this._handleFocus = this._handleFocus.bind(this), this._handleBlur = this._handleBlur.bind(this), this._handleClick = this._handleClick.bind(this);
  }
  init() {
    this.element.setAttribute("contenteditable", "true"), this.element.setAttribute("role", "textbox"), this.element.setAttribute("aria-multiline", "true"), this.element.setAttribute("spellcheck", "true"), this.element.innerHTML.trim() || (this.element.innerHTML = "<p><br></p>"), this.element.addEventListener("input", this._handleInput), this.element.addEventListener("focus", this._handleFocus), this.element.addEventListener("blur", this._handleBlur), this.element.addEventListener("click", this._handleClick), document.addEventListener("selectionchange", this._handleSelectionChange), this.keyboard.init(), this.history.init(), this.clipboard.init(), this.dragDrop.init(), this.plugins.initAll();
  }
  destroy() {
    this._isDestroyed || (this._isDestroyed = !0, this.element.removeEventListener("input", this._handleInput), this.element.removeEventListener("focus", this._handleFocus), this.element.removeEventListener("blur", this._handleBlur), this.element.removeEventListener("click", this._handleClick), document.removeEventListener("selectionchange", this._handleSelectionChange), this.keyboard.destroy(), this.history.destroy(), this.clipboard.destroy(), this.dragDrop.destroy(), this.plugins.destroyAll(), this.eventBus.removeAllListeners(), this.element.removeAttribute("contenteditable"));
  }
  getHTML() {
    return this.sanitizer.sanitize(this.element.innerHTML);
  }
  setHTML(e) {
    const t = this.sanitizer.sanitize(e);
    this.element.innerHTML = t || "<p><br></p>";
  }
  getText() {
    return this.element.textContent || "";
  }
  isEmpty() {
    const e = this.getText().trim();
    return e === "" || e === `
`;
  }
  focus() {
    this.element.focus();
  }
  blur() {
    this.element.blur();
  }
  executeCommand(e, ...t) {
    return this.commands.execute(e, ...t);
  }
  on(e, t) {
    return this.eventBus.on(e, t);
  }
  off(e, t) {
    this.eventBus.off(e, t);
  }
  getWordCount() {
    const e = this.getText().trim();
    return e ? e.split(/\s+/).length : 0;
  }
  getCharCount() {
    return this.getText().length;
  }
  _handleInput() {
    if (this.element.innerHTML === "" || this.element.innerHTML === "<br>") {
      this.element.innerHTML = "<p><br></p>";
      const e = document.createRange();
      e.setStart(this.element.firstChild, 0), e.collapse(!0), this.selection.setRange(e);
    }
    this.eventBus.emit("content:change");
  }
  _handleSelectionChange() {
    if (!this.selection.isWithinEditor(document.activeElement) || !this.selection.getRange()) return;
    const t = this.selection.getActiveFormats();
    this.eventBus.emit("selection:change", t);
  }
  _handleFocus() {
    this.eventBus.emit("focus");
  }
  _handleBlur() {
    this.eventBus.emit("blur");
  }
  _handleClick(e) {
    e.target.type === "checkbox" && e.target.classList.contains("rmx-task-checkbox") && (e.target.checked = !e.target.checked, this.eventBus.emit("content:change"));
  }
}
function li(n) {
  n.commands.register("bold", {
    execute() {
      document.execCommand("bold", !1, null);
    },
    isActive() {
      return document.queryCommandState("bold");
    },
    shortcut: "mod+b",
    meta: { icon: "bold", tooltip: "Bold" }
  }), n.commands.register("italic", {
    execute() {
      document.execCommand("italic", !1, null);
    },
    isActive() {
      return document.queryCommandState("italic");
    },
    shortcut: "mod+i",
    meta: { icon: "italic", tooltip: "Italic" }
  }), n.commands.register("underline", {
    execute() {
      document.execCommand("underline", !1, null);
    },
    isActive() {
      return document.queryCommandState("underline");
    },
    shortcut: "mod+u",
    meta: { icon: "underline", tooltip: "Underline" }
  }), n.commands.register("strikethrough", {
    execute() {
      document.execCommand("strikeThrough", !1, null);
    },
    isActive() {
      return document.queryCommandState("strikeThrough");
    },
    shortcut: "mod+shift+x",
    meta: { icon: "strikethrough", tooltip: "Strikethrough" }
  }), n.commands.register("subscript", {
    execute() {
      document.execCommand("subscript", !1, null);
    },
    isActive() {
      return document.queryCommandState("subscript");
    },
    shortcut: "mod+,",
    meta: { icon: "subscript", tooltip: "Subscript" }
  }), n.commands.register("superscript", {
    execute() {
      document.execCommand("superscript", !1, null);
    },
    isActive() {
      return document.queryCommandState("superscript");
    },
    shortcut: "mod+.",
    meta: { icon: "superscript", tooltip: "Superscript" }
  }), n.commands.register("removeFormat", {
    execute() {
      document.execCommand("removeFormat", !1, null);
    },
    meta: { icon: "removeFormat", tooltip: "Remove Formatting" }
  });
}
function ci(n) {
  n.commands.register("heading", {
    execute(e, t) {
      const r = t === "p" ? "p" : `h${t}`;
      document.execCommand("formatBlock", !1, `<${r}>`);
    },
    isActive(e) {
      const t = e.selection.getParentBlock();
      return t && /^H[1-6]$/.test(t.tagName) ? t.tagName.toLowerCase() : !1;
    },
    meta: { icon: "heading", tooltip: "Heading" }
  });
  for (let e = 1; e <= 6; e++)
    n.commands.register(`h${e}`, {
      execute() {
        document.execCommand("formatBlock", !1, `<h${e}>`);
      },
      isActive(t) {
        const r = t.selection.getParentBlock();
        return r && r.tagName === `H${e}`;
      },
      meta: { tooltip: `Heading ${e}` }
    });
  n.commands.register("paragraph", {
    execute() {
      document.execCommand("formatBlock", !1, "<p>");
    },
    isActive(e) {
      const t = e.selection.getParentBlock();
      return t && t.tagName === "P";
    },
    meta: { tooltip: "Normal text" }
  });
}
function ui(n) {
  n.commands.register("alignLeft", {
    execute() {
      document.execCommand("justifyLeft", !1, null);
    },
    isActive(e) {
      const t = e.selection.getParentBlock();
      if (!t) return !1;
      const r = t.style.textAlign || window.getComputedStyle(t).textAlign;
      return !r || r === "left" || r === "start";
    },
    meta: { icon: "alignLeft", tooltip: "Align Left" }
  }), n.commands.register("alignCenter", {
    execute() {
      document.execCommand("justifyCenter", !1, null);
    },
    isActive(e) {
      const t = e.selection.getParentBlock();
      return t ? (t.style.textAlign || window.getComputedStyle(t).textAlign) === "center" : !1;
    },
    meta: { icon: "alignCenter", tooltip: "Align Center" }
  }), n.commands.register("alignRight", {
    execute() {
      document.execCommand("justifyRight", !1, null);
    },
    isActive(e) {
      const t = e.selection.getParentBlock();
      if (!t) return !1;
      const r = t.style.textAlign || window.getComputedStyle(t).textAlign;
      return r === "right" || r === "end";
    },
    meta: { icon: "alignRight", tooltip: "Align Right" }
  }), n.commands.register("alignJustify", {
    execute() {
      document.execCommand("justifyFull", !1, null);
    },
    isActive(e) {
      const t = e.selection.getParentBlock();
      return t ? (t.style.textAlign || window.getComputedStyle(t).textAlign) === "justify" : !1;
    },
    meta: { icon: "alignJustify", tooltip: "Justify" }
  });
}
function di(n) {
  n.commands.register("orderedList", {
    execute() {
      document.execCommand("insertOrderedList", !1, null);
    },
    isActive(e) {
      return !!e.selection.getClosestElement("ol");
    },
    shortcut: "mod+shift+7",
    meta: { icon: "orderedList", tooltip: "Numbered List" }
  }), n.commands.register("unorderedList", {
    execute() {
      document.execCommand("insertUnorderedList", !1, null);
    },
    isActive(e) {
      const t = e.selection.getClosestElement("ul");
      return t ? !t.classList.contains("rmx-task-list") : !1;
    },
    shortcut: "mod+shift+8",
    meta: { icon: "unorderedList", tooltip: "Bulleted List" }
  }), n.commands.register("taskList", {
    execute(e) {
      const t = e.selection.getClosestElement("ul");
      if (t && t.classList.contains("rmx-task-list")) {
        t.classList.remove("rmx-task-list"), t.querySelectorAll(".rmx-task-checkbox").forEach((i) => i.remove());
        return;
      }
      t || document.execCommand("insertUnorderedList", !1, null);
      const r = e.selection.getClosestElement("ul");
      r && (r.classList.add("rmx-task-list"), r.querySelectorAll("li").forEach((i) => {
        if (!i.querySelector(".rmx-task-checkbox")) {
          const s = document.createElement("input");
          s.type = "checkbox", s.className = "rmx-task-checkbox", s.setAttribute("contenteditable", "false"), i.insertBefore(s, i.firstChild);
        }
      }));
    },
    isActive(e) {
      const t = e.selection.getClosestElement("ul");
      return t && t.classList.contains("rmx-task-list");
    },
    meta: { icon: "taskList", tooltip: "Task List" }
  }), n.commands.register("indent", {
    execute() {
      document.execCommand("indent", !1, null);
    },
    meta: { icon: "indent", tooltip: "Increase Indent" }
  }), n.commands.register("outdent", {
    execute() {
      document.execCommand("outdent", !1, null);
    },
    meta: { icon: "outdent", tooltip: "Decrease Indent" }
  });
}
function hi(n) {
  n.commands.register("insertLink", {
    execute(e, { href: t, text: r, target: i = "_blank" }) {
      if (!t) return;
      const s = e.selection, o = s.getSelectedText();
      if (o) {
        const a = s.wrapWith("a", {
          href: t,
          target: i,
          rel: i === "_blank" ? "noopener noreferrer" : void 0
        });
        a && r && r !== o && (a.textContent = r);
      } else {
        const a = r || t, l = `<a href="${De(t)}" target="${De(i)}"${i === "_blank" ? ' rel="noopener noreferrer"' : ""}>${Nr(a)}</a>`;
        s.insertHTML(l);
      }
    },
    shortcut: "mod+k",
    meta: { icon: "link", tooltip: "Insert Link" }
  }), n.commands.register("editLink", {
    execute(e, { href: t, text: r, target: i }) {
      const s = e.selection.getClosestElement("a");
      s && (t !== void 0 && (s.href = t), r !== void 0 && (s.textContent = r), i !== void 0 && (s.target = i, i === "_blank" ? s.rel = "noopener noreferrer" : s.removeAttribute("rel")));
    },
    meta: { tooltip: "Edit Link" }
  }), n.commands.register("removeLink", {
    execute(e) {
      e.selection.unwrap("a");
    },
    meta: { icon: "unlink", tooltip: "Remove Link" }
  });
}
function Nr(n) {
  return n.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function De(n) {
  return n.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function mi(n) {
  n.commands.register("insertImage", {
    execute(e, { src: t, alt: r = "", width: i, height: s }) {
      if (!t) return;
      if (e.element.focus(), !e.selection.getRange()) {
        const a = document.createRange();
        a.selectNodeContents(e.element), a.collapse(!1), e.selection.setRange(a);
      }
      const o = document.createElement("img");
      if (o.src = t, o.alt = r, i && (o.style.width = typeof i == "number" ? `${i}px` : i), s && (o.style.height = typeof s == "number" ? `${s}px` : s), o.style.maxWidth = "100%", o.className = "rmx-image", e.selection.insertNode(o), !o.nextSibling || o.parentElement === e.element) {
        const a = document.createElement("p");
        a.innerHTML = "<br>", o.parentElement.insertBefore(a, o.nextSibling);
      }
    },
    meta: { icon: "image", tooltip: "Insert Image" }
  }), n.commands.register("resizeImage", {
    execute(e, { element: t, width: r, height: i }) {
      !t || t.tagName !== "IMG" || (t.style.width = typeof r == "number" ? `${r}px` : r, i ? t.style.height = typeof i == "number" ? `${i}px` : i : t.style.height = "auto");
    },
    meta: { tooltip: "Resize Image" }
  }), n.commands.register("alignImage", {
    execute(e, { element: t, alignment: r }) {
      if (!(!t || t.tagName !== "IMG"))
        switch (t.style.float = "", t.style.margin = "", t.style.display = "", r) {
          case "left":
            t.style.float = "left", t.style.margin = "0 16px 16px 0";
            break;
          case "right":
            t.style.float = "right", t.style.margin = "0 0 16px 16px";
            break;
          case "center":
            t.style.display = "block", t.style.margin = "16px auto";
            break;
        }
    },
    meta: { tooltip: "Align Image" }
  }), n.commands.register("removeImage", {
    execute(e, { element: t }) {
      !t || t.tagName !== "IMG" || t.parentNode.removeChild(t);
    },
    meta: { tooltip: "Remove Image" }
  });
}
function pi(n) {
  n.commands.register("insertTable", {
    execute(e, { rows: t = 3, cols: r = 3 } = {}) {
      let i = '<table class="rmx-table"><tbody>';
      for (let s = 0; s < t; s++) {
        i += "<tr>";
        for (let o = 0; o < r; o++)
          i += "<td><br></td>";
        i += "</tr>";
      }
      i += "</tbody></table><p><br></p>", e.selection.insertHTML(i);
    },
    meta: { icon: "table", tooltip: "Insert Table" }
  }), n.commands.register("addRowBefore", {
    execute(e) {
      const t = e.selection.getClosestElement("td") || e.selection.getClosestElement("th");
      if (!t) return;
      const r = t.parentElement, i = ze(Ie(r));
      r.parentElement.insertBefore(i, r);
    },
    meta: { tooltip: "Insert Row Before" }
  }), n.commands.register("addRowAfter", {
    execute(e) {
      const t = e.selection.getClosestElement("td") || e.selection.getClosestElement("th");
      if (!t) return;
      const r = t.parentElement, i = ze(Ie(r));
      r.parentElement.insertBefore(i, r.nextSibling);
    },
    meta: { tooltip: "Insert Row After" }
  }), n.commands.register("addColBefore", {
    execute(e) {
      const t = e.selection.getClosestElement("td") || e.selection.getClosestElement("th");
      if (!t) return;
      const r = z(t), i = e.selection.getClosestElement("table");
      i && i.querySelectorAll("tr").forEach((s) => {
        const o = document.createElement(s.parentElement.tagName === "THEAD" ? "th" : "td");
        o.innerHTML = "<br>";
        const a = s.cells[r];
        s.insertBefore(o, a);
      });
    },
    meta: { tooltip: "Insert Column Before" }
  }), n.commands.register("addColAfter", {
    execute(e) {
      const t = e.selection.getClosestElement("td") || e.selection.getClosestElement("th");
      if (!t) return;
      const r = z(t), i = e.selection.getClosestElement("table");
      i && i.querySelectorAll("tr").forEach((s) => {
        const o = document.createElement(s.parentElement.tagName === "THEAD" ? "th" : "td");
        o.innerHTML = "<br>";
        const a = s.cells[r];
        s.insertBefore(o, a ? a.nextSibling : null);
      });
    },
    meta: { tooltip: "Insert Column After" }
  }), n.commands.register("deleteRow", {
    execute(e) {
      const t = e.selection.getClosestElement("td") || e.selection.getClosestElement("th");
      if (!t) return;
      const r = t.parentElement;
      if (r.parentElement.rows.length <= 1) {
        const s = e.selection.getClosestElement("table");
        if (s) {
          const o = document.createElement("p");
          o.innerHTML = "<br>", s.parentElement.replaceChild(o, s);
        }
      } else
        r.remove();
    },
    meta: { tooltip: "Delete Row" }
  }), n.commands.register("deleteCol", {
    execute(e) {
      const t = e.selection.getClosestElement("td") || e.selection.getClosestElement("th");
      if (!t) return;
      const r = z(t), i = e.selection.getClosestElement("table");
      if (!i) return;
      const s = i.querySelector("tr");
      if (s && s.cells.length <= 1) {
        const o = document.createElement("p");
        o.innerHTML = "<br>", i.parentElement.replaceChild(o, i);
      } else
        i.querySelectorAll("tr").forEach((o) => {
          o.cells[r] && o.cells[r].remove();
        });
    },
    meta: { tooltip: "Delete Column" }
  }), n.commands.register("deleteTable", {
    execute(e) {
      const t = e.selection.getClosestElement("table");
      if (!t) return;
      const r = document.createElement("p");
      r.innerHTML = "<br>", t.parentElement.replaceChild(r, t);
    },
    meta: { tooltip: "Delete Table" }
  }), n.commands.register("mergeCells", {
    execute(e, { cells: t }) {
      if (!t || t.length < 2) return;
      const r = t[0], i = /* @__PURE__ */ new Set(), s = /* @__PURE__ */ new Set();
      t.forEach((l) => {
        i.add(l.parentElement.rowIndex), s.add(z(l));
      });
      const o = i.size, a = s.size;
      t.slice(1).forEach((l) => {
        l.textContent.trim() && (r.innerHTML += "<br>" + l.innerHTML), l.remove();
      }), o > 1 && (r.rowSpan = o), a > 1 && (r.colSpan = a);
    },
    meta: { tooltip: "Merge Cells" }
  }), n.commands.register("splitCell", {
    execute(e) {
      const t = e.selection.getClosestElement("td") || e.selection.getClosestElement("th");
      if (!t) return;
      const r = t.colSpan || 1, i = t.rowSpan || 1;
      if (r <= 1 && i <= 1) return;
      t.colSpan = 1, t.rowSpan = 1;
      const s = t.parentElement;
      for (let o = 1; o < r; o++) {
        const a = document.createElement(t.tagName.toLowerCase());
        a.innerHTML = "<br>", s.insertBefore(a, t.nextSibling);
      }
      if (i > 1) {
        let o = s.nextElementSibling;
        for (let a = 1; a < i && o; a++) {
          for (let l = 0; l < r; l++) {
            const c = document.createElement("td");
            c.innerHTML = "<br>";
            const u = z(t), d = o.cells[u];
            o.insertBefore(c, d);
          }
          o = o.nextElementSibling;
        }
      }
    },
    meta: { tooltip: "Split Cell" }
  });
}
function Ie(n) {
  let e = 0;
  for (const t of n.cells)
    e += t.colSpan || 1;
  return e;
}
function z(n) {
  let e = 0, t = n.previousElementSibling;
  for (; t; )
    e += t.colSpan || 1, t = t.previousElementSibling;
  return e;
}
function ze(n) {
  const e = document.createElement("tr");
  for (let t = 0; t < n; t++) {
    const r = document.createElement("td");
    r.innerHTML = "<br>", e.appendChild(r);
  }
  return e;
}
function fi(n) {
  n.commands.register("blockquote", {
    execute(e) {
      const t = e.selection.getClosestElement("blockquote");
      if (t) {
        const r = t.parentNode;
        for (; t.firstChild; )
          r.insertBefore(t.firstChild, t);
        r.removeChild(t);
      } else
        document.execCommand("formatBlock", !1, "<blockquote>");
    },
    isActive(e) {
      return !!e.selection.getClosestElement("blockquote");
    },
    shortcut: "mod+shift+9",
    meta: { icon: "blockquote", tooltip: "Blockquote" }
  }), n.commands.register("codeBlock", {
    execute(e) {
      const t = e.selection.getClosestElement("pre");
      if (t) {
        const r = t.textContent, i = document.createElement("p");
        i.textContent = r, t.parentNode.replaceChild(i, t);
        const s = document.createRange();
        s.selectNodeContents(i), s.collapse(!1), e.selection.setRange(s);
      } else {
        const r = e.selection.getRange();
        if (!r) return;
        const i = r.collapsed ? `
` : r.toString(), s = document.createElement("pre"), o = document.createElement("code");
        if (o.textContent = i, s.appendChild(o), r.collapsed || r.deleteContents(), r.insertNode(s), !s.nextSibling) {
          const l = document.createElement("p");
          l.innerHTML = "<br>", s.parentNode.insertBefore(l, s.nextSibling);
        }
        const a = document.createRange();
        a.selectNodeContents(o), a.collapse(!1), e.selection.setRange(a);
      }
    },
    isActive(e) {
      return !!e.selection.getClosestElement("pre");
    },
    shortcut: "mod+shift+c",
    meta: { icon: "codeBlock", tooltip: "Code Block" }
  }), n.commands.register("horizontalRule", {
    execute() {
      document.execCommand("insertHorizontalRule", !1, null);
    },
    meta: { icon: "horizontalRule", tooltip: "Horizontal Rule" }
  });
}
function gi(n) {
  n.commands.register("fontFamily", {
    execute(e, t) {
      t && document.execCommand("fontName", !1, t);
    },
    isActive(e) {
      try {
        return document.queryCommandValue("fontName") || !1;
      } catch {
        return !1;
      }
    },
    meta: { icon: "fontFamily", tooltip: "Font Family" }
  }), n.commands.register("fontSize", {
    execute(e, t) {
      if (!t) return;
      const r = e.selection.getSelection();
      if (!r || r.rangeCount === 0) return;
      const i = r.getRangeAt(0);
      if (i.collapsed) return;
      const s = e.selection.getParentElement();
      if (s && s.tagName === "SPAN" && s.style.fontSize) {
        s.style.fontSize = t;
        return;
      }
      const o = document.createElement("span");
      o.style.fontSize = t;
      try {
        i.surroundContents(o);
      } catch {
        const a = i.extractContents();
        o.appendChild(a), i.insertNode(o);
      }
    },
    meta: { icon: "fontSize", tooltip: "Font Size" }
  }), n.commands.register("foreColor", {
    execute(e, t) {
      t && document.execCommand("foreColor", !1, t);
    },
    isActive(e) {
      try {
        return document.queryCommandValue("foreColor") || !1;
      } catch {
        return !1;
      }
    },
    meta: { icon: "foreColor", tooltip: "Text Color" }
  }), n.commands.register("backColor", {
    execute(e, t) {
      if (t)
        try {
          document.execCommand("hiliteColor", !1, t);
        } catch {
          document.execCommand("backColor", !1, t);
        }
    },
    isActive(e) {
      try {
        return document.queryCommandValue("backColor") || !1;
      } catch {
        return !1;
      }
    },
    meta: { icon: "backColor", tooltip: "Background Color" }
  });
}
function bi(n) {
  n.commands.register("embedMedia", {
    execute(e, { url: t }) {
      if (!t) return;
      const r = $r(t);
      if (!r) return;
      const i = document.createElement("div");
      i.className = "rmx-embed-wrapper", i.setAttribute("contenteditable", "false"), i.setAttribute("data-embed-url", t);
      const s = document.createElement("iframe");
      s.src = r, s.setAttribute("frameborder", "0"), s.setAttribute("allowfullscreen", "true"), s.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"), s.style.width = "100%", s.style.height = "100%", i.appendChild(s), e.selection.insertNode(i);
      const o = document.createElement("p");
      o.innerHTML = "<br>", i.parentNode.insertBefore(o, i.nextSibling);
    },
    meta: { icon: "embedMedia", tooltip: "Embed Media" }
  }), n.commands.register("removeEmbed", {
    execute(e, { element: t }) {
      if (!t) return;
      const r = t.closest(".rmx-embed-wrapper") || t, i = document.createElement("p");
      i.innerHTML = "<br>", r.parentNode.replaceChild(i, r);
    },
    meta: { tooltip: "Remove Embed" }
  });
}
function $r(n) {
  let e = n.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return e ? `https://www.youtube.com/embed/${e[1]}` : (e = n.match(/(?:vimeo\.com\/)(\d+)/), e ? `https://player.vimeo.com/video/${e[1]}` : (e = n.match(/dailymotion\.com\/video\/([a-zA-Z0-9]+)/), e ? `https://www.dailymotion.com/embed/video/${e[1]}` : null));
}
function xi(n) {
  let e = [], t = -1;
  function r(o) {
    o.querySelectorAll("mark.rmx-find-highlight").forEach((a) => {
      const l = a.parentNode;
      l.replaceChild(document.createTextNode(a.textContent), a), l.normalize();
    });
  }
  function i(o, a, l = !1) {
    if (r(o), !a) return [];
    const c = [], u = document.createTreeWalker(o, NodeFilter.SHOW_TEXT, null), d = [];
    for (; u.nextNode(); )
      d.push(u.currentNode);
    const h = l ? "g" : "gi", p = new RegExp(Dr(a), h);
    for (let m = d.length - 1; m >= 0; m--) {
      const b = d[m], q = b.textContent, C = [];
      let L;
      for (; (L = p.exec(q)) !== null; )
        C.push({ index: L.index, length: L[0].length });
      for (let R = C.length - 1; R >= 0; R--) {
        const B = C[R], N = document.createRange();
        N.setStart(b, B.index), N.setEnd(b, B.index + B.length);
        const T = document.createElement("mark");
        T.className = "rmx-find-highlight", N.surroundContents(T), c.unshift(T);
      }
    }
    return c;
  }
  n.commands.register("find", {
    execute(o, { text: a, caseSensitive: l }) {
      return e = i(o.element, a, l), t = e.length > 0 ? 0 : -1, t >= 0 && s(), o.eventBus.emit("find:results", {
        total: e.length,
        current: t + 1
      }), { total: e.length, current: t + 1 };
    },
    shortcut: "mod+f",
    meta: { icon: "findReplace", tooltip: "Find & Replace" }
  }), n.commands.register("findNext", {
    execute(o) {
      e.length !== 0 && (t = (t + 1) % e.length, s(), o.eventBus.emit("find:results", {
        total: e.length,
        current: t + 1
      }));
    },
    meta: { tooltip: "Find Next" }
  }), n.commands.register("findPrev", {
    execute(o) {
      e.length !== 0 && (t = (t - 1 + e.length) % e.length, s(), o.eventBus.emit("find:results", {
        total: e.length,
        current: t + 1
      }));
    },
    meta: { tooltip: "Find Previous" }
  }), n.commands.register("replace", {
    execute(o, { replaceText: a }) {
      if (t < 0 || t >= e.length) return;
      const l = e[t], c = document.createTextNode(a);
      l.parentNode.replaceChild(c, l), e.splice(t, 1), e.length > 0 ? (t = t % e.length, s()) : t = -1, o.eventBus.emit("find:results", {
        total: e.length,
        current: t + 1
      }), o.eventBus.emit("content:change");
    },
    meta: { tooltip: "Replace" }
  }), n.commands.register("replaceAll", {
    execute(o, { replaceText: a }) {
      e.forEach((c) => {
        const u = document.createTextNode(a);
        c.parentNode.replaceChild(u, c);
      });
      const l = e.length;
      return e = [], t = -1, o.eventBus.emit("find:results", { total: 0, current: 0 }), o.eventBus.emit("content:change"), l;
    },
    meta: { tooltip: "Replace All" }
  }), n.commands.register("clearFind", {
    execute(o) {
      r(o.element), e = [], t = -1;
    },
    meta: { tooltip: "Clear Find" }
  });
  function s() {
    e.forEach((o, a) => {
      o.className = a === t ? "rmx-find-highlight rmx-find-current" : "rmx-find-highlight";
    }), e[t] && e[t].scrollIntoView({ block: "center", behavior: "smooth" });
  }
}
function Dr(n) {
  return n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function ki(n) {
  n.commands.register("sourceMode", {
    execute(e) {
      e.isSourceMode = !e.isSourceMode, e.eventBus.emit("mode:change", { sourceMode: e.isSourceMode });
    },
    isActive(e) {
      return e.isSourceMode;
    },
    shortcut: "mod+shift+u",
    meta: { icon: "sourceMode", tooltip: "Source Code" }
  });
}
let j = 0;
function vi(n) {
  n.commands.register("fullscreen", {
    execute(e) {
      const t = e.element.closest(".rmx-editor");
      if (!t) return;
      const r = t.classList.contains("rmx-fullscreen");
      r ? (t.classList.remove("rmx-fullscreen"), j = Math.max(0, j - 1), j === 0 && (document.body.style.overflow = "")) : (t.classList.add("rmx-fullscreen"), j++, document.body.style.overflow = "hidden"), e.eventBus.emit("fullscreen:toggle", { fullscreen: !r });
    },
    isActive(e) {
      const t = e.element.closest(".rmx-editor");
      return t ? t.classList.contains("rmx-fullscreen") : !1;
    },
    shortcut: "mod+shift+f",
    meta: { icon: "fullscreen", tooltip: "Fullscreen" }
  });
}
function yi(n) {
  n.commands.register("toggleMarkdown", {
    execute(e) {
      if (e.history.snapshot(), e.isMarkdownMode) {
        const t = e.element.textContent, r = ee(t);
        e.setHTML(r), e.isMarkdownMode = !1;
      } else {
        const t = e.getHTML(), r = ct(t);
        e.element.textContent = r, e.isMarkdownMode = !0;
      }
      e.element.classList.toggle("rmx-markdown-mode", e.isMarkdownMode), e.eventBus.emit("mode:change:markdown", { markdownMode: e.isMarkdownMode }), e.eventBus.emit("content:change");
    },
    isActive(e) {
      return e.isMarkdownMode;
    },
    meta: { icon: "toggleMarkdown", tooltip: "Toggle Markdown" }
  });
}
function Ir(n) {
  if (!n || n === 0) return "";
  const e = ["B", "KB", "MB", "GB"];
  let t = n, r = 0;
  for (; t >= 1024 && r < e.length - 1; )
    t /= 1024, r++;
  return `${t % 1 === 0 ? t : t.toFixed(1)} ${e[r]}`;
}
function wi(n) {
  n.commands.register("insertAttachment", {
    execute(e, { url: t, filename: r = "file", filesize: i }) {
      if (!t) return;
      if (e.element.focus(), !e.selection.getRange()) {
        const a = document.createRange();
        a.selectNodeContents(e.element), a.collapse(!1), e.selection.setRange(a);
      }
      const s = document.createElement("a");
      s.href = t, s.className = "rmx-attachment", s.setAttribute("data-attachment", "true"), s.setAttribute("data-filename", r), i && s.setAttribute("data-filesize", String(i)), s.target = "_blank", s.rel = "noopener noreferrer";
      const o = i ? ` (${Ir(i)})` : "";
      if (s.textContent = `📎 ${r}${o}`, e.selection.insertNode(s), !s.nextSibling || s.parentElement === e.element) {
        const a = document.createElement("p");
        a.innerHTML = "<br>", s.parentElement.insertBefore(a, s.nextSibling);
      }
    },
    meta: { icon: "attachment", tooltip: "Insert Attachment" }
  }), n.commands.register("removeAttachment", {
    execute(e, { element: t }) {
      !t || !t.classList?.contains("rmx-attachment") || t.parentNode.removeChild(t);
    },
    meta: { tooltip: "Remove Attachment" }
  });
}
function Ci(n) {
  n.commands.register("importDocument", {
    execute(e, { html: t, mode: r = "insert" }) {
      if (t) {
        if (e.element.focus(), r === "replace")
          e.setHTML(t);
        else {
          if (!e.selection.getRange()) {
            const i = document.createRange();
            i.selectNodeContents(e.element), i.collapse(!1), e.selection.setRange(i);
          }
          e.selection.insertHTML(e.sanitizer.sanitize(t));
        }
        e.eventBus.emit("content:change");
      }
    },
    meta: { icon: "importDocument", tooltip: "Import Document" }
  });
}
function Te(n) {
  return {
    name: n.name,
    requiresFullAccess: n.requiresFullAccess || !1,
    init: n.init || (() => {
    }),
    destroy: n.destroy || (() => {
    }),
    commands: n.commands || [],
    toolbarItems: n.toolbarItems || [],
    statusBarItems: n.statusBarItems || [],
    contextMenuItems: n.contextMenuItems || []
  };
}
function Ti() {
  let n = null, e = null;
  return Te({
    name: "wordCount",
    requiresFullAccess: !0,
    // Writes to engine._wordCount
    init(t) {
      const r = () => {
        const s = t.getText().trim(), o = s ? s.split(/\s+/).length : 0, a = t.getText().length, l = { wordCount: o, charCount: a };
        t._wordCount = l, t.eventBus.emit("wordcount:update", l);
      }, i = () => {
        clearTimeout(e), e = setTimeout(r, 50);
      };
      t.eventBus.on("content:change", r), n = new MutationObserver(i), n.observe(t.element, {
        childList: !0,
        subtree: !0,
        characterData: !0
      }), r();
    },
    destroy() {
      clearTimeout(e), n && (n.disconnect(), n = null);
    }
  });
}
const zr = /https?:\/\/[^\s<]+[^\s<.,:;"')\]!?]/g, Or = /www\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+([/][^\s<]*[^\s<.,:;"')\]!?])?/g, Pr = new RegExp(`(?<![a-zA-Z0-9@/:.])([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\\.)+[a-zA-Z]{2,}([/][^\\s<]*[^\\s<.,:;"')\\]!?])?`, "g"), Hr = /https?:\/\/$/, Fr = /https?:\/\/[^\s]*$/, qr = /* @__PURE__ */ new Set([
  "com",
  "org",
  "net",
  "edu",
  "gov",
  "mil",
  "int",
  "io",
  "co",
  "us",
  "uk",
  "ca",
  "au",
  "de",
  "fr",
  "es",
  "it",
  "nl",
  "be",
  "at",
  "ch",
  "jp",
  "cn",
  "kr",
  "in",
  "br",
  "mx",
  "ru",
  "za",
  "nz",
  "se",
  "no",
  "fi",
  "dk",
  "pl",
  "dev",
  "app",
  "ai",
  "me",
  "tv",
  "cc",
  "info",
  "biz",
  "pro",
  "name",
  "museum",
  "xyz",
  "online",
  "site",
  "tech",
  "store",
  "blog",
  "cloud",
  "design",
  "agency"
]);
function Ur(n) {
  const t = n.split("/")[0].split(".");
  return t[t.length - 1].toLowerCase();
}
function Ei() {
  let n = null;
  return Te({
    name: "autolink",
    requiresFullAccess: !0,
    // Needs direct DOM event listener access
    init(e) {
      n = (t) => {
        if (t.key !== " " && t.key !== "Enter") return;
        const r = window.getSelection();
        if (!r || !r.focusNode) return;
        const i = r.focusNode;
        if (i.nodeType !== Node.TEXT_NODE || i.parentElement.closest("a")) return;
        const s = i.textContent, o = jr(s);
        if (!o) return;
        const { url: a, href: l, startIdx: c, endIdx: u } = o, d = r.focusOffset;
        if (u > d) return;
        const h = document.createRange();
        h.setStart(i, c), h.setEnd(i, u);
        const p = document.createElement("a");
        p.href = l, p.target = "_blank", p.rel = "noopener noreferrer", h.surroundContents(p);
        const m = document.createRange();
        m.setStartAfter(p), m.collapse(!0), r.removeAllRanges(), r.addRange(m);
      }, e.element.addEventListener("keydown", n);
    },
    destroy(e) {
      n && (e.element.removeEventListener("keydown", n), n = null);
    }
  });
}
function jr(n) {
  let e = null;
  for (const t of n.matchAll(zr)) {
    const r = t[0];
    e = { url: r, href: r, startIdx: t.index, endIdx: t.index + r.length };
  }
  for (const t of n.matchAll(Or)) {
    const r = t[0], i = { url: r, href: "https://" + r, startIdx: t.index, endIdx: t.index + r.length };
    if (!e || i.startIdx >= e.startIdx) {
      const s = n.slice(Math.max(0, t.index - 8), t.index);
      Hr.test(s) || (e = i);
    }
  }
  for (const t of n.matchAll(Pr)) {
    const r = t[0], i = Ur(r);
    if (!qr.has(i)) continue;
    const s = { url: r, href: "https://" + r, startIdx: t.index, endIdx: t.index + r.length };
    if (!e || s.startIdx >= e.startIdx) {
      const o = n.slice(Math.max(0, t.index - 12), t.index);
      !Fr.test(o) && !/www\.$/.test(o) && (e = s);
    }
  }
  return e;
}
function Si(n = "Start typing...") {
  return Te({
    name: "placeholder",
    requiresFullAccess: !0,
    // Needs direct eventBus and element access
    init(e) {
      const t = () => {
        e.isEmpty() ? (e.element.setAttribute("data-placeholder", n), e.element.classList.add("rmx-empty")) : e.element.classList.remove("rmx-empty");
      };
      e.eventBus.on("content:change", t), e.eventBus.on("focus", t), e.eventBus.on("blur", t), t();
    }
  });
}
function bt(n, e) {
  const t = URL.createObjectURL(n), r = document.createElement("a");
  r.href = t, r.download = e, document.body.appendChild(r), r.click(), document.body.removeChild(r), URL.revokeObjectURL(t);
}
function Ai(n, e = "document.md") {
  const t = ct(n), r = new Blob([t], { type: "text/markdown;charset=utf-8" });
  bt(r, e);
}
function _i(n, e = "Document") {
  const t = document.createElement("iframe");
  t.style.cssText = "position:fixed;left:-9999px;top:-9999px;width:0;height:0;", document.body.appendChild(t);
  const r = t.contentDocument || t.contentWindow.document;
  r.open(), r.write(`<!DOCTYPE html>
<html>
<head>
  <title>${e}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1, h2, h3, h4, h5, h6 { margin-top: 1.2em; margin-bottom: 0.4em; }
    img { max-width: 100%; height: auto; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
    pre { background: #f5f5f5; padding: 12px; border-radius: 4px; overflow-x: auto; }
    code { font-family: 'SFMono-Regular', Consolas, monospace; font-size: 0.9em; }
    blockquote { border-left: 3px solid #ccc; margin-left: 0; padding-left: 16px; color: #555; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>${n}</body>
</html>`), r.close(), t.contentWindow.onafterprint = () => {
    document.body.removeChild(t);
  };
  const i = setTimeout(() => {
    t.parentNode && document.body.removeChild(t);
  }, 6e4);
  t.onload = () => {
    t.contentWindow.focus(), t.contentWindow.print(), clearTimeout(i), setTimeout(() => {
      t.parentNode && document.body.removeChild(t);
    }, 1e3);
  };
}
function Li(n, e = "document.doc") {
  const t = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><style>
body { font-family: Calibri, sans-serif; line-height: 1.5; color: #1a1a1a; }
h1, h2, h3, h4, h5, h6 { margin-top: 1em; margin-bottom: 0.4em; }
table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid #999; padding: 6px 10px; }
pre { background: #f5f5f5; padding: 10px; font-family: Consolas, monospace; font-size: 0.9em; }
code { font-family: Consolas, monospace; font-size: 0.9em; }
blockquote { border-left: 3px solid #ccc; margin-left: 0; padding-left: 14px; color: #555; }
img { max-width: 100%; }
</style></head>
<body>${n}</body></html>`, r = new Blob(["\uFEFF", t], { type: "application/msword" });
  bt(r, e);
}
function Ri(n, e) {
  const t = new Set(e.map((r) => r.toLowerCase()));
  return n.filter((r) => !t.has(r.toLowerCase()));
}
function Bi(n, e, t = {}) {
  const r = new Set(n.map((s) => s.toLowerCase())), i = e.filter((s) => !r.has(s.toLowerCase()));
  return t.position === "start" ? [...i, ...n] : [...n, ...i];
}
function Mi(n) {
  if (!n || n.length === 0 || typeof document > "u") return null;
  const t = `https://fonts.googleapis.com/css2?${n.map((s) => s.includes(":") ? `family=${s.replace(/ /g, "+")}` : `family=${s.replace(/ /g, "+")}`).join("&")}&display=swap`, r = document.querySelector(`link[href="${t}"]`);
  if (r) return r;
  const i = document.createElement("link");
  return i.rel = "stylesheet", i.href = t, i.dataset.remyxFonts = "true", document.head.appendChild(i), i;
}
const xt = /* @__PURE__ */ new Set([
  "html",
  "head",
  "body",
  "div",
  "section",
  "article",
  "aside",
  "nav",
  "header",
  "footer",
  "main",
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "th",
  "td",
  "caption",
  "colgroup",
  "col",
  "blockquote",
  "pre",
  "figure",
  "figcaption",
  "form",
  "fieldset",
  "legend",
  "details",
  "summary",
  "hr",
  "br",
  "iframe",
  "video",
  "audio",
  "canvas"
]), kt = /* @__PURE__ */ new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr"
]), Wr = /* @__PURE__ */ new Set(["pre", "code", "script", "style", "textarea"]), Gr = /* @__PURE__ */ new Set([
  "a",
  "abbr",
  "b",
  "bdi",
  "bdo",
  "cite",
  "code",
  "data",
  "del",
  "dfn",
  "em",
  "i",
  "ins",
  "kbd",
  "mark",
  "q",
  "s",
  "samp",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "time",
  "u",
  "var",
  "wbr",
  "label",
  "input"
]);
function Ni(n) {
  if (!n || !n.trim()) return "";
  const e = "  ", i = new DOMParser().parseFromString(`<body>${n}</body>`, "text/html").body, s = [];
  return vt(i, 0, s, e), s.join(`
`).trim();
}
function vt(n, e, t, r) {
  const i = Array.from(n.childNodes);
  for (const s of i) {
    if (s.nodeType === Node.COMMENT_NODE) {
      t.push(`${r.repeat(Math.max(0, e))}<!--${s.textContent}-->`);
      continue;
    }
    if (s.nodeType === Node.TEXT_NODE) {
      const d = s.textContent;
      if (!d.trim()) continue;
      const h = d.replace(/\s+/g, " ").trim();
      h && t.push(`${r.repeat(Math.max(0, e))}${h}`);
      continue;
    }
    if (s.nodeType !== Node.ELEMENT_NODE) continue;
    const o = s.tagName.toLowerCase();
    if (Wr.has(o)) {
      t.push(`${r.repeat(Math.max(0, e))}${s.outerHTML}`);
      continue;
    }
    xt.has(o);
    const a = kt.has(o);
    Gr.has(o);
    const l = r.repeat(Math.max(0, e)), c = yt(s, o);
    if (a) {
      t.push(`${l}${c}`);
      continue;
    }
    if (wt(s)) {
      const d = Ct(s);
      t.push(`${l}${c}${d}</${o}>`);
    } else
      t.push(`${l}${c}`), vt(s, e + 1, t, r), t.push(`${l}</${o}>`);
  }
}
function yt(n, e) {
  const t = Array.from(n.attributes);
  if (t.length === 0) return `<${e}>`;
  const r = t.map((i) => i.value === "" ? i.name : `${i.name}="${Zr(i.value)}"`).join(" ");
  return `<${e} ${r}>`;
}
function wt(n) {
  for (const e of n.childNodes)
    if (e.nodeType !== Node.TEXT_NODE && e.nodeType === Node.ELEMENT_NODE) {
      const t = e.tagName.toLowerCase();
      if (xt.has(t) || !wt(e)) return !1;
    }
  return !0;
}
function Ct(n) {
  let e = "";
  for (const t of n.childNodes)
    if (t.nodeType === Node.TEXT_NODE)
      e += t.textContent.replace(/\s+/g, " ");
    else if (t.nodeType === Node.ELEMENT_NODE) {
      const r = t.tagName.toLowerCase(), i = yt(t, r);
      kt.has(r) ? e += i : e += `${i}${Ct(t)}</${r}>`;
    }
  return e;
}
function Zr(n) {
  return n.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function $i(n, e) {
  const t = ["P", "H1", "H2", "H3", "H4", "H5", "H6", "DIV", "BLOCKQUOTE", "PRE", "LI", "TD", "TH"];
  let r = n.nodeType === Node.TEXT_NODE ? n.parentElement : n;
  for (; r && r !== e; ) {
    if (t.includes(r.tagName)) return r;
    r = r.parentElement;
  }
  return null;
}
function Di(n, e, t) {
  const r = e.toUpperCase();
  let i = n.nodeType === Node.TEXT_NODE ? n.parentElement : n;
  for (; i && i !== t; ) {
    if (i.tagName === r) return i;
    i = i.parentElement;
  }
  return null;
}
function Ii(n, e, t = {}) {
  const r = document.createElement(e);
  Object.entries(t).forEach(([i, s]) => r.setAttribute(i, s));
  try {
    n.surroundContents(r);
  } catch {
    const i = n.extractContents();
    r.appendChild(i), n.insertNode(r);
  }
  return r;
}
function zi(n) {
  const e = n.parentNode;
  for (; n.firstChild; )
    e.insertBefore(n.firstChild, n);
  e.removeChild(n);
}
function Oi() {
  return "rmx-" + Math.random().toString(36).substr(2, 9);
}
function Pi(n) {
  return n ? n.textContent.trim() === "" && !n.querySelector("img, iframe, hr, input") : !0;
}
const Xr = {
  // Color Palette
  bg: { var: "--rmx-bg", description: "Editor background color" },
  text: { var: "--rmx-text", description: "Primary text color" },
  textSecondary: { var: "--rmx-text-secondary", description: "Secondary/muted text color" },
  border: { var: "--rmx-border", description: "Border color" },
  borderSubtle: { var: "--rmx-border-subtle", description: "Subtle/light border color" },
  // Toolbar
  toolbarBg: { var: "--rmx-toolbar-bg", description: "Toolbar background color" },
  toolbarBorder: { var: "--rmx-toolbar-border", description: "Toolbar border color" },
  toolbarButtonHover: { var: "--rmx-toolbar-button-hover", description: "Toolbar button hover background" },
  toolbarButtonActive: { var: "--rmx-toolbar-button-active", description: "Toolbar button active background" },
  toolbarIcon: { var: "--rmx-toolbar-icon", description: "Toolbar icon color" },
  toolbarIconActive: { var: "--rmx-toolbar-icon-active", description: "Toolbar icon active color" },
  // Accent / Primary
  primary: { var: "--rmx-primary", description: "Primary accent color" },
  primaryHover: { var: "--rmx-primary-hover", description: "Primary color on hover" },
  primaryLight: { var: "--rmx-primary-light", description: "Light variant of primary (backgrounds)" },
  focusRing: { var: "--rmx-focus-ring", description: "Focus ring outline color" },
  selection: { var: "--rmx-selection", description: "Text selection highlight color" },
  // Feedback
  danger: { var: "--rmx-danger", description: "Error/danger color" },
  dangerLight: { var: "--rmx-danger-light", description: "Light variant of danger" },
  // UI Elements
  placeholder: { var: "--rmx-placeholder", description: "Placeholder text color" },
  modalBg: { var: "--rmx-modal-bg", description: "Modal background color" },
  modalOverlay: { var: "--rmx-modal-overlay", description: "Modal overlay background" },
  statusbarBg: { var: "--rmx-statusbar-bg", description: "Status bar background" },
  statusbarText: { var: "--rmx-statusbar-text", description: "Status bar text color" },
  hoverBg: { var: "--rmx-hover-bg", description: "Generic hover background" },
  // Shadows
  shadowSm: { var: "--rmx-shadow-sm", description: "Small shadow" },
  shadowMd: { var: "--rmx-shadow-md", description: "Medium shadow" },
  shadowLg: { var: "--rmx-shadow-lg", description: "Large shadow" },
  shadowFloat: { var: "--rmx-shadow-float", description: "Floating element shadow" },
  // Typography
  fontFamily: { var: "--rmx-font-family", description: "UI font stack" },
  fontSize: { var: "--rmx-font-size", description: "UI font size" },
  contentFontSize: { var: "--rmx-content-font-size", description: "Content area font size" },
  contentLineHeight: { var: "--rmx-content-line-height", description: "Content area line height" },
  // Spacing & Shape
  radius: { var: "--rmx-radius", description: "Standard border radius" },
  radiusSm: { var: "--rmx-radius-sm", description: "Small border radius" },
  radiusInner: { var: "--rmx-radius-inner", description: "Inner element border radius" },
  spacingXs: { var: "--rmx-spacing-xs", description: "Extra small spacing (4px)" },
  spacingSm: { var: "--rmx-spacing-sm", description: "Small spacing (8px)" },
  spacingMd: { var: "--rmx-spacing-md", description: "Medium spacing (12px)" },
  // Transitions
  transitionFast: { var: "--rmx-transition-fast", description: "Fast transition duration" },
  transitionNormal: { var: "--rmx-transition-normal", description: "Normal transition duration" }
}, ce = {};
for (const [n, e] of Object.entries(Xr))
  ce[n] = e.var;
function W(n) {
  const e = {};
  for (const [t, r] of Object.entries(n))
    t.startsWith("--rmx-") ? e[t] = r : ce[t] ? e[ce[t]] = r : e[`--rmx-${t.replace(/([A-Z])/g, "-$1").toLowerCase()}`] = r;
  return e;
}
const Hi = {
  /** Deep blue ocean palette */
  ocean: W({
    bg: "#0f172a",
    text: "#e2e8f0",
    textSecondary: "#94a3b8",
    border: "#1e3a5f",
    borderSubtle: "#1e3a5f",
    toolbarBg: "#0c1426",
    toolbarBorder: "#1e3a5f",
    toolbarButtonHover: "#1e3a5f",
    toolbarButtonActive: "#1e4976",
    toolbarIcon: "#94a3b8",
    toolbarIconActive: "#38bdf8",
    primary: "#0ea5e9",
    primaryHover: "#0284c7",
    primaryLight: "rgba(14, 165, 233, 0.15)",
    focusRing: "#0ea5e9",
    selection: "#0c4a6e",
    placeholder: "#475569",
    modalBg: "#0c1426",
    modalOverlay: "rgba(0, 0, 0, 0.6)",
    statusbarBg: "#0c1426",
    statusbarText: "#64748b"
  }),
  /** Green earth-tone forest palette */
  forest: W({
    bg: "#14201a",
    text: "#d1e7dd",
    textSecondary: "#8fbc8f",
    border: "#2d4a3e",
    borderSubtle: "#2d4a3e",
    toolbarBg: "#0f1a14",
    toolbarBorder: "#2d4a3e",
    toolbarButtonHover: "#2d4a3e",
    toolbarButtonActive: "#1a5c3a",
    toolbarIcon: "#8fbc8f",
    toolbarIconActive: "#4ade80",
    primary: "#22c55e",
    primaryHover: "#16a34a",
    primaryLight: "rgba(34, 197, 94, 0.15)",
    focusRing: "#22c55e",
    selection: "#14532d",
    placeholder: "#4a7c5f",
    modalBg: "#0f1a14",
    modalOverlay: "rgba(0, 0, 0, 0.6)",
    statusbarBg: "#0f1a14",
    statusbarText: "#4a7c5f"
  }),
  /** Warm orange/amber sunset palette */
  sunset: W({
    bg: "#1c1210",
    text: "#fde8d0",
    textSecondary: "#d4a574",
    border: "#5c3a28",
    borderSubtle: "#5c3a28",
    toolbarBg: "#181010",
    toolbarBorder: "#5c3a28",
    toolbarButtonHover: "#5c3a28",
    toolbarButtonActive: "#7c4a2a",
    toolbarIcon: "#d4a574",
    toolbarIconActive: "#fb923c",
    primary: "#f97316",
    primaryHover: "#ea580c",
    primaryLight: "rgba(249, 115, 22, 0.15)",
    focusRing: "#f97316",
    selection: "#7c2d12",
    placeholder: "#8b6f47",
    modalBg: "#181010",
    modalOverlay: "rgba(0, 0, 0, 0.6)",
    statusbarBg: "#181010",
    statusbarText: "#8b6f47"
  }),
  /** Soft pink/rose palette */
  rose: W({
    bg: "#1c1018",
    text: "#fde2ee",
    textSecondary: "#d4809f",
    border: "#5c2848",
    borderSubtle: "#5c2848",
    toolbarBg: "#18101a",
    toolbarBorder: "#5c2848",
    toolbarButtonHover: "#5c2848",
    toolbarButtonActive: "#7c2858",
    toolbarIcon: "#d4809f",
    toolbarIconActive: "#fb7185",
    primary: "#f43f5e",
    primaryHover: "#e11d48",
    primaryLight: "rgba(244, 63, 94, 0.15)",
    focusRing: "#f43f5e",
    selection: "#881337",
    placeholder: "#8b4766",
    modalBg: "#18101a",
    modalOverlay: "rgba(0, 0, 0, 0.6)",
    statusbarBg: "#18101a",
    statusbarText: "#8b4766"
  })
}, Vr = {
  color: { var: "--rmx-tb-color", description: "Icon / text color" },
  background: { var: "--rmx-tb-bg", description: "Default background" },
  hoverColor: { var: "--rmx-tb-hover-color", description: "Color on hover" },
  hoverBackground: { var: "--rmx-tb-hover-bg", description: "Background on hover" },
  activeColor: { var: "--rmx-tb-active-color", description: "Color when active / pressed" },
  activeBackground: { var: "--rmx-tb-active-bg", description: "Background when active" },
  border: { var: "--rmx-tb-border", description: "Border shorthand" },
  borderRadius: { var: "--rmx-tb-radius", description: "Border radius" },
  size: { var: "--rmx-tb-size", description: "Button width & height" },
  iconSize: { var: "--rmx-tb-icon-size", description: "Icon size inside button" },
  padding: { var: "--rmx-tb-padding", description: "Button padding" },
  opacity: { var: "--rmx-tb-opacity", description: "Button opacity" }
}, ue = {};
for (const [n, e] of Object.entries(Vr))
  ue[n] = e.var;
const Oe = {
  color: "--rmx-tb-sep-color",
  width: "--rmx-tb-sep-width",
  height: "--rmx-tb-sep-height",
  margin: "--rmx-tb-sep-margin"
};
function Kr(n) {
  if (!n || typeof n != "object") return null;
  const e = {};
  let t = !1;
  for (const [r, i] of Object.entries(n))
    r.startsWith("--rmx-") ? (e[r] = i, t = !0) : ue[r] && (e[ue[r]] = i, t = !0);
  return t ? e : null;
}
function Qr(n) {
  if (!n || typeof n != "object") return null;
  const e = {};
  let t = !1;
  for (const [r, i] of Object.entries(n))
    r.startsWith("--rmx-") ? (e[r] = i, t = !0) : Oe[r] && (e[Oe[r]] = i, t = !0);
  return t ? e : null;
}
function Fi(n) {
  if (!n || typeof n != "object") return {};
  const e = {};
  for (const [t, r] of Object.entries(n))
    if (t === "_separator")
      e._separator = Qr(r);
    else {
      const i = Kr(r);
      i && (e[t] = i);
    }
  return e;
}
const qi = {
  /** All available toolbar items */
  full: _r,
  /** Standard editing toolbar without advanced features */
  standard: [
    ["undo", "redo"],
    ["headings", "fontFamily", "fontSize"],
    ["bold", "italic", "underline", "strikethrough"],
    ["foreColor", "backColor"],
    ["alignLeft", "alignCenter", "alignRight", "alignJustify"],
    ["orderedList", "unorderedList", "taskList"],
    ["outdent", "indent"],
    ["link", "image", "table", "blockquote", "codeBlock", "horizontalRule"],
    ["fullscreen"]
  ],
  /** Minimal toolbar for simple text editing */
  minimal: [
    ["headings"],
    ["bold", "italic", "underline"],
    ["orderedList", "unorderedList"],
    ["link", "image", "blockquote"]
  ],
  /** Bare-bones formatting only */
  bare: [
    ["bold", "italic", "underline"]
  ]
};
function Ui(n, e) {
  const t = new Set(e);
  return n.map((r) => r.filter((i) => !t.has(i))).filter((r) => r.length > 0);
}
function ji(n, e, t = {}) {
  const r = Array.isArray(e) ? e : [e], i = n.map((s) => [...s]);
  if (t.after || t.before) {
    const s = t.after || t.before;
    for (let o = 0; o < i.length; o++) {
      const a = i[o].indexOf(s);
      if (a !== -1) {
        const l = t.after ? a + 1 : a;
        return i[o].splice(l, 0, ...r), i;
      }
    }
  }
  if (t.group !== void 0) {
    const s = t.group < 0 ? i.length + t.group : t.group;
    if (s >= 0 && s < i.length)
      return i[s].push(...r), i;
  }
  return i.push(r), i;
}
function Wi(n) {
  const e = [
    { commands: ["undo", "redo"] },
    { commands: ["headings", "fontFamily", "fontSize"] },
    { commands: ["bold", "italic", "underline", "strikethrough"] },
    { commands: ["foreColor", "backColor"] },
    { commands: ["alignLeft", "alignCenter", "alignRight", "alignJustify"] },
    { commands: ["orderedList", "unorderedList", "taskList"] },
    { commands: ["outdent", "indent"] },
    { commands: ["link", "image", "attachment", "importDocument", "table", "embedMedia", "blockquote", "codeBlock", "horizontalRule"] },
    { commands: ["subscript", "superscript"] },
    { commands: ["findReplace", "toggleMarkdown", "sourceMode", "export", "fullscreen"] }
  ], t = new Set(n), r = [];
  for (const i of e) {
    const s = i.commands.filter((o) => t.has(o));
    s.length > 0 && (r.push(s), s.forEach((o) => t.delete(o)));
  }
  return t.size > 0 && r.push([...t]), r;
}
const Gi = {
  bold: "mod+b",
  italic: "mod+i",
  underline: "mod+u",
  strikethrough: "mod+shift+x",
  undo: "mod+z",
  redo: "mod+shift+z",
  selectAll: "mod+a",
  insertLink: "mod+k",
  findReplace: "mod+f",
  orderedList: "mod+shift+7",
  unorderedList: "mod+shift+8",
  blockquote: "mod+shift+9",
  codeBlock: "mod+shift+c",
  indent: "tab",
  outdent: "shift+tab",
  fullscreen: "mod+shift+f",
  sourceMode: "mod+shift+u",
  subscript: "mod+,",
  superscript: "mod+."
}, Zi = /* @__PURE__ */ new Set([
  "bold",
  "italic",
  "underline",
  "strikethrough",
  "subscript",
  "superscript",
  "alignLeft",
  "alignCenter",
  "alignRight",
  "alignJustify",
  "orderedList",
  "unorderedList",
  "taskList",
  "blockquote",
  "codeBlock",
  "horizontalRule",
  "undo",
  "redo",
  "removeFormat",
  "indent",
  "outdent",
  "fullscreen",
  "sourceMode",
  "toggleMarkdown"
]), Xi = {
  bold: "Bold",
  italic: "Italic",
  underline: "Underline",
  strikethrough: "Strikethrough",
  subscript: "Subscript",
  superscript: "Superscript",
  alignLeft: "Align Left",
  alignCenter: "Align Center",
  alignRight: "Align Right",
  alignJustify: "Justify",
  orderedList: "Numbered List",
  unorderedList: "Bulleted List",
  taskList: "Task List",
  blockquote: "Blockquote",
  codeBlock: "Code Block",
  horizontalRule: "Horizontal Rule",
  undo: "Undo",
  redo: "Redo",
  removeFormat: "Remove Formatting",
  indent: "Indent",
  outdent: "Outdent",
  link: "Insert Link",
  image: "Insert Image",
  attachment: "Attach File",
  table: "Insert Table",
  importDocument: "Import Document",
  embedMedia: "Embed Media",
  findReplace: "Find & Replace",
  fullscreen: "Fullscreen",
  sourceMode: "Source Code",
  toggleMarkdown: "Toggle Markdown",
  export: "Export Document",
  foreColor: "Text Color",
  backColor: "Background Color",
  headings: "Block Type",
  fontFamily: "Font Family",
  fontSize: "Font Size"
}, Yr = {
  bold: "mod+B",
  italic: "mod+I",
  underline: "mod+U",
  strikethrough: "mod+Shift+X",
  undo: "mod+Z",
  redo: "mod+Shift+Z",
  insertLink: "mod+K",
  findReplace: "mod+F",
  fullscreen: "mod+Shift+F",
  sourceMode: "mod+Shift+U"
}, Vi = {
  link: "link",
  image: "image",
  attachment: "attachment",
  importDocument: "importDocument",
  table: "table",
  embedMedia: "embed",
  findReplace: "findReplace",
  export: "export"
};
function Ki(n) {
  const e = Yr[n];
  return e ? e.replace(/mod/g, S() ? "⌘" : "Ctrl") : "";
}
function Qi(n, e, t) {
  switch (n) {
    case "bold":
      return e.bold;
    case "italic":
      return e.italic;
    case "underline":
      return e.underline;
    case "strikethrough":
      return e.strikethrough;
    case "subscript":
      return e.subscript;
    case "superscript":
      return e.superscript;
    case "alignLeft":
      return e.alignment === "left";
    case "alignCenter":
      return e.alignment === "center";
    case "alignRight":
      return e.alignment === "right";
    case "alignJustify":
      return e.alignment === "justify";
    case "orderedList":
      return e.orderedList;
    case "unorderedList":
      return e.unorderedList;
    case "blockquote":
      return e.blockquote;
    case "codeBlock":
      return e.codeBlock;
    case "sourceMode":
      return t?.isSourceMode;
    case "toggleMarkdown":
      return t?.isMarkdownMode;
    case "fullscreen":
      return t?.element?.closest(".rmx-editor")?.classList.contains("rmx-fullscreen");
    default:
      return !1;
  }
}
function Yi(n) {
  if (!n || typeof n != "object")
    throw new Error("defineConfig expects a configuration object");
  if (n.editors && typeof n.editors != "object")
    throw new Error('defineConfig: "editors" must be an object mapping names to editor configurations');
  return n;
}
export {
  Mt as ALLOWED_STYLES,
  Bt as ALLOWED_TAGS,
  Ei as AutolinkPlugin,
  Zi as BUTTON_COMMANDS,
  Lr as Clipboard,
  _t as CommandRegistry,
  ii as DEFAULT_COLORS,
  ni as DEFAULT_FONTS,
  ri as DEFAULT_FONT_SIZES,
  Gi as DEFAULT_KEYBINDINGS,
  si as DEFAULT_MENU_BAR,
  _r as DEFAULT_TOOLBAR,
  Rr as DragDrop,
  ai as EditorEngine,
  Tt as EventBus,
  oi as HEADING_OPTIONS,
  Lt as History,
  Rt as KeyboardManager,
  Vi as MODAL_COMMANDS,
  Si as PlaceholderPlugin,
  Mr as PluginManager,
  Yr as SHORTCUT_MAP,
  It as Sanitizer,
  At as Selection,
  Hi as THEME_PRESETS,
  Xr as THEME_VARIABLES,
  Vr as TOOLBAR_ITEM_STYLE_KEYS,
  qi as TOOLBAR_PRESETS,
  Xi as TOOLTIP_MAP,
  Ti as WordCountPlugin,
  Bi as addFonts,
  ji as addToolbarItems,
  Pe as cleanPastedHTML,
  $i as closestBlock,
  Di as closestTag,
  ft as convertDocument,
  Te as createPlugin,
  W as createTheme,
  Wi as createToolbar,
  Fi as createToolbarItemTheme,
  Yi as defineConfig,
  Li as exportAsDocx,
  Ai as exportAsMarkdown,
  _i as exportAsPDF,
  Ni as formatHTML,
  Oi as generateId,
  Qi as getCommandActiveState,
  Jr as getModKey,
  Ki as getShortcutLabel,
  ei as getSupportedExtensions,
  ti as getSupportedFormatNames,
  ct as htmlToMarkdown,
  Pi as isBlockEmpty,
  pt as isImportableFile,
  S as isMac,
  Mi as loadGoogleFonts,
  He as looksLikeMarkdown,
  ee as markdownToHtml,
  ui as registerAlignmentCommands,
  wi as registerAttachmentCommands,
  fi as registerBlockCommands,
  xi as registerFindReplaceCommands,
  gi as registerFontCommands,
  li as registerFormattingCommands,
  vi as registerFullscreenCommands,
  ci as registerHeadingCommands,
  mi as registerImageCommands,
  Ci as registerImportDocumentCommands,
  hi as registerLinkCommands,
  di as registerListCommands,
  yi as registerMarkdownToggleCommands,
  bi as registerMediaCommands,
  ki as registerSourceModeCommands,
  pi as registerTableCommands,
  Ri as removeFonts,
  Ui as removeToolbarItems,
  Qr as resolveSeparatorStyle,
  Kr as resolveToolbarItemStyle,
  zi as unwrapTag,
  Ii as wrapInTag
};
