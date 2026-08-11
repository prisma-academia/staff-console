# Admission Letter Editor — Client Implementation Guide

**Scope: the browser only.** This documents the text-editing and preview-rendering mechanism behind `/admission/letter-settings` — which libraries are used, how the editor is wired, what markup it produces, and how the live A4 preview works.

The server side (sanitising, variable resolution, block expansion, PDF generation) is **out of scope**; it appears here only as the request/response contract in §4 and §11.

Written so another AI agent or engineer can rebuild this in a different codebase. The reference stack is React 18 + MUI 5 + TipTap 3, but §13 maps every piece onto alternatives.

---

## Contents

1. [What the page is](#1-what-the-page-is)
2. [Library stack](#2-library-stack)
3. [File map](#3-file-map)
4. [The markup the editor produces](#4-the-markup-the-editor-produces)
5. [Editor instantiation](#5-editor-instantiation)
6. [Custom extension — variable chip](#6-custom-extension--variable-chip)
7. [Custom extension — dynamic block](#7-custom-extension--dynamic-block)
8. [Custom extension — optional mark](#8-custom-extension--optional-mark)
9. [Custom extension — class preservation](#9-custom-extension--class-preservation)
10. [The `{{` suggestion menu](#10-the--suggestion-menu)
11. [Toolbar](#11-toolbar)
12. [Editor styling — mirroring the printed page](#12-editor-styling--mirroring-the-printed-page)
13. [The preview pane](#13-the-preview-pane)
14. [State, data fetching and the preview loop](#14-state-data-fetching-and-the-preview-loop)
15. [Author-facing validation and guards](#15-author-facing-validation-and-guards)
16. [Porting to other editors and frameworks](#16-porting-to-other-editors-and-frameworks)
17. [Client-side pitfalls](#17-client-side-pitfalls)

---

## 1. What the page is

A split-pane letter designer.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Admission Letter   [Unsaved changes]        [Design & data] [Reset] [Save]   │
│ Write the letter exactly as it should print. Type {{ to insert a variable.   │
├───────────────────────────────────┬──────────────────────────────────────────┤
│ [toolbar: styles · marks · lists  │ [Preview with ▾] [65% ▾] [↻] [🖨]        │
│  align · link img table rule ·    │──────────────────────────────────────────│
│  Optional · Variable · Block]     │  ┌────────────────────────────────────┐  │
│───────────────────────────────────│  │                                    │  │
│  ┌─────────────────────────────┐  │  │   iframe: server-rendered letter   │  │
│  │  A4-width writing surface   │  │  │   laid out at true A4, CSS-scaled  │  │
│  │  (178mm, Arial 10.5pt)      │  │  │                                    │  │
│  │                             │  │  │                                    │  │
│  │  [Applicant name] chips     │  │  └────────────────────────────────────┘  │
│  │  ▭ Programme details block  │  │                                          │
│  └─────────────────────────────┘  │                                          │
└───────────────────────────────────┴──────────────────────────────────────────┘
                                        + right-hand drawer: branding, institution,
                                          signatory, documents/notes lists, currency
```

**The central design decision: the client does not render the letter.** The preview pane shows HTML produced by the server's real letter pipeline — the same code path that generates the PDF. The client's job is to (a) author a constrained HTML document, and (b) display the server's render at true page size. There is no client-side renderer to drift from production output.

---

## 2. Library stack

Exact versions from `package.json` at time of writing.

### Editor core

| Package | Version | Role |
|---|---|---|
| `@tiptap/react` | `^3.29.2` | React bindings: `useEditor`, `EditorContent`, `ReactRenderer`, `ReactNodeViewRenderer`, `NodeViewWrapper` |
| `@tiptap/core` | `^3.29.2` | `Node.create`, `Mark.create`, `Extension.create`, `mergeAttributes` — used to build all four custom extensions |
| `@tiptap/pm` | `^3.29.2` | ProseMirror peer bundle (required; TipTap re-exports pm modules from here) |
| `@tiptap/starter-kit` | `^3.29.2` | Paragraph, heading, bold/italic/strike, lists, blockquote, hr, link, history, undo/redo |
| `@tiptap/suggestion` | `^3.29.2` | The `{{`-triggered inline autocomplete plugin |
| `@tiptap/extension-text-style` | `^3.29.2` | `TextStyle` + `Color` (text colour) |
| `@tiptap/extension-highlight` | `^3.29.2` | Highlight mark |
| `@tiptap/extension-text-align` | `^3.29.2` | Paragraph/heading alignment |
| `@tiptap/extension-image` | `^3.29.2` | Inline images, `allowBase64: true` |
| `@tiptap/extension-table` | `^3.29.2` | `TableKit` — resizable tables |

> **Why TipTap/ProseMirror and not a simpler editor.** Three hard requirements rule out most alternatives: (1) *custom atomic nodes* — a variable must select and delete as one unit; (2) *attribute preservation* — `class` and `data-*` must survive a load→save round trip byte-identically; (3) a *suggestion/trigger* mechanism for the insert menu. ProseMirror's schema system gives all three. Quill's Blots and Draft.js entities make custom atoms with arbitrary attributes painful; a bare `contenteditable` is not viable.

### Everything else on this page

| Package | Version | Role |
|---|---|---|
| `@mui/material` | `^5.15.21` | All UI chrome: toolbar, menus, drawer, dialogs, alerts, chips |
| `@mui/lab` | `^5.0.0-alpha.147` | `LoadingButton` for save/reset |
| `@iconify/react` | `^4.1.1` | Toolbar icons (`eva:*`, `ph:*` sets) via a local `Iconify` wrapper |
| `@tanstack/react-query` | `^5.28.9` | Settings + variable-catalogue queries; save/reset/preview mutations |
| `formik` | `^2.4.6` | The whole settings form, including `letter.bodyHtml` as a single field |
| `yup` | `^1.4.0` | Validation schema |
| `notistack` | `^3.0.1` | Save/reset toasts |
| `prop-types` | `^15.8.1` | Component prop validation (project convention; no TypeScript here) |

**No PDF library, no HTML sanitiser, and no templating library on the client.** Sanitising is the server's responsibility (the client never renders authored HTML into its own DOM — see §13); PDF generation is server-side; token substitution is server-side.

---

## 3. File map

```
src/pages/admission-letter-settings.jsx              route wrapper (Helmet + view)
src/routes/sections.jsx                              lazy route: /admission/letter-settings
src/layouts/dashboard/config-navigation.jsx          nav entry

src/sections/admission-letter-settings/
├── view/
│   ├── admission-letter-settings-view.jsx   378 L   orchestration: queries, formik,
│   │                                                debounced preview, guards, layout
│   └── index.js
├── editor/
│   ├── letter-editor.jsx                    183 L   TipTap instance + writing-surface CSS
│   ├── letter-toolbar.jsx                   389 L   formatting controls + insert menus
│   ├── variable-node.jsx                    121 L   inline atom  → <span data-var>
│   ├── block-node.jsx                       170 L   block atom   → <div data-block>
│   ├── optional-mark.js                      45 L   mark         → <span data-optional>
│   ├── preserved-class.js                    44 L   keeps class attributes on save
│   └── variable-suggestion.jsx              199 L   the `{{` autocomplete popup
├── preview/
│   └── letter-preview.jsx                   222 L   iframe A4 preview + zoom + print
└── settings/
    ├── letter-settings-drawer.jsx           286 L   branding/institution/signatory panels
    └── list-editor.jsx                      101 L   reorderable string-list editor
                                                     (documents, notes)

src/api/adminApplicationApi.js                       getLetterSettings, updateLetterSettings,
                                                     resetLetterSettings, getLetterVariables,
                                                     previewLetterSettings
```

Component tree:

```
AdmissionLetterSettingsView
├── header (dirty chip, Design & data, Reset, Save)
├── Alert  — form errors
├── Alert  — unknown variables
├── Card (2-col grid, collapses to 1 col below lg)
│   ├── LetterEditor
│   │   ├── LetterToolbar          (+ Colour / Block / Variable menus)
│   │   └── EditorContent
│   │       ├── VariableChip       node view, one per variable
│   │       └── BlockCard          node view, one per block
│   │   └── (portal) VariableList  the `{{` popup, appended to document.body
│   └── LetterPreview
│       └── iframe srcDoc={html}
├── LetterSettingsDrawer
└── Reset confirmation Dialog
```

---

## 4. The markup the editor produces

The editor's *only* output is a string of HTML in `formik.values.letter.bodyHtml`, obtained from `editor.getHTML()`. That string is the contract with the server.

Ordinary semantic HTML — `p`, `h1`–`h3`, `strong`, `em`, `u`, `s`, `mark`, `ul`/`ol`/`li`, `blockquote`, `hr`, `a`, `img`, `table` — plus **three custom constructs**:

| Construct | Serialised form | Meaning to the server |
|---|---|---|
| **Variable** | `<span data-var="applicantName">{{applicantName}}</span>` | Replace with the recipient's value, HTML-escaped. Empty if unresolvable. |
| **Block** | `<div data-block="details"></div>` | Replace the whole element with generated per-recipient markup. |
| **Optional** | `<span data-optional="true">, for {{sessionName}} session</span>` | Drop the whole span if any variable inside resolves empty; otherwise unwrap it. |

Three client-side properties worth understanding:

1. **The variable's inner text is the literal `{{key}}`.** Redundant with `data-var`, deliberately: if the span is ever stripped, the server's plain-text token pass still resolves it. The document degrades instead of losing data.
2. **Blocks are always empty elements.** The editor never puts content inside them.
3. **Class names are part of the payload.** `letter-title`, `block-heading`, `closing`, `enclosure`, `documents`, `roman`, `details` are styled by the server's print stylesheet. §9 exists solely to stop the editor discarding them.

Example of what a saved body looks like:

```html
<div data-block="meta"></div>
<h2 class="letter-title">ADMISSION LETTER</h2>
<p>We are pleased to inform you that you have been offered provisional admission into the
   <span data-var="programmeTitle">{{programmeTitle}}</span><span data-optional="true">,
   for <span data-var="sessionName">{{sessionName}}</span> Academic Session</span>.</p>
<p class="block-heading">1. Program Details:</p>
<div data-block="details"></div>
<div data-block="signature"></div>
```

---

## 5. Editor instantiation

`editor/letter-editor.jsx`. Props: `value` (HTML string), `variables` (catalogue array), `disabled`, `onChange(html)`.

```jsx
export default function LetterEditor({ value, variables, disabled, onChange }) {
  // The catalogue arrives from the API AFTER the editor is created. Read it
  // through a ref so the suggestion plugin sees the latest list on every
  // keystroke without the extension array having to change.
  const variablesRef = useRef(variables);
  variablesRef.current = variables;

  const extensions = useMemo(() => [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      link: { openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer' } },
    }),
    TextStyle,
    Color,
    Highlight,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Image.configure({ inline: false, allowBase64: true }),
    TableKit.configure({ table: { resizable: true } }),
    VariableNode.configure({ variables: variablesRef.current }),
    BlockNode,
    OptionalMark,
    PreservedClass,
    createVariableSuggestions(() => variablesRef.current),
  ],
  // Intentionally built once: rebuilding extensions tears down the editor and
  // loses the caret. Variable data is read through the ref instead.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  []);

  const editor = useEditor({
    extensions,
    content: value || '',
    editable: !disabled,
    onUpdate: ({ editor: instance }) => onChange(instance.getHTML()),
  });
  ...
}
```

### 5.1 The three sync effects

**(a) Incoming value → editor.** The parent owns the value (formik), so an external change (initial load, reset) must reach the editor. Guard it, or every keystroke round-trips back in and resets the caret to the start of the letter:

```jsx
useEffect(() => {
  if (!editor) return;
  const incoming = value || '';
  if (incoming !== editor.getHTML()) {
    editor.commands.setContent(incoming, { emitUpdate: false });
  }
}, [editor, value]);
```

`emitUpdate: false` stops the programmatic set from firing `onUpdate` and marking the form dirty.

**(b) Disabled toggle.**

```jsx
useEffect(() => { if (editor) editor.setEditable(!disabled); }, [editor, disabled]);
```

**(c) Catalogue repaint.** Chips render *through* the catalogue (to show label + known/unknown state), so already-rendered chips must repaint when it loads. Mutate the extension's options in place and dispatch an empty transaction:

```jsx
useEffect(() => {
  if (!editor) return;
  editor.extensionManager.extensions
    .filter((extension) => extension.name === 'letterVariable')
    .forEach((extension) => { extension.options.variables = variables; });
  editor.view.dispatch(editor.state.tr.setMeta('addToHistory', false));
}, [editor, variables]);
```

`addToHistory: false` keeps this repaint out of the undo stack.

### 5.2 Wiring the suggestion plugin

A thin `Extension` rather than `addProseMirrorPlugins` on the variable node itself, so the suggestion config can read a fresh catalogue without recreating the node type:

```jsx
const createVariableSuggestions = (getVariables) =>
  Extension.create({
    name: 'letterVariableSuggestion',
    addProseMirrorPlugins() {
      return [Suggestion({ editor: this.editor, ...variableSuggestion(getVariables) })];
    },
  });
```

---

## 6. Custom extension — variable chip

`editor/variable-node.jsx`. An **inline atom**.

```jsx
const VariableNode = Node.create({
  name: 'letterVariable',
  group: 'inline',
  inline: true,
  atom: true,          // ← the whole point
  selectable: true,

  addOptions() { return { variables: [] }; },

  addAttributes() {
    return {
      name: {
        default: null,
        parseHTML:  (element) => element.getAttribute('data-var'),
        renderHTML: (attributes) => (attributes.name ? { 'data-var': attributes.name } : {}),
      },
    };
  },

  parseHTML()  { return [{ tag: 'span[data-var]' }]; },
  renderHTML({ node, HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes), `{{${node.attrs.name}}}`];
  },
  renderText({ node }) { return `{{${node.attrs.name}}}`; },

  addNodeView() { return ReactNodeViewRenderer(VariableChip); },

  addCommands() {
    return {
      insertVariable: (name) => ({ chain }) =>
        chain().focus().insertContent([
          { type: this.name, attrs: { name } },
          // A trailing space keeps typing natural — without it the caret sits
          // flush against the chip and the next word looks like part of the token.
          { type: 'text', text: ' ' },
        ]).run(),
    };
  },
});
```

**Why `atom: true` matters.** An atom is indivisible: arrow keys step over it, backspace deletes the whole chip, and the caret can never land inside it. This is what makes it *impossible* for an author to leave a half-token like `{{applican` behind — the exact failure mode the plain-`<textarea>` version invited.

**The node view** renders a MUI `Chip` and looks the key up in the catalogue:

```jsx
function VariableChip({ node, extension }) {
  const { name } = node.attrs;
  const variable = (extension.options.variables || []).find((item) => item.key === name);
  const known = Boolean(variable);

  return (
    <NodeViewWrapper as="span" style={{ display: 'inline' }}>
      <Tooltip title={known
        ? `${variable.description} e.g. "${variable.sample}"`
        : `Unknown variable — {{${name}}} will print as nothing`}>
        <Chip
          component="span"
          size="small"
          label={known ? variable.label : name}
          color={known ? 'primary' : 'error'}
          variant={known ? 'filled' : 'outlined'}
          sx={{ height: 20, fontSize: 12, fontWeight: 600, mx: '1px',
                verticalAlign: 'baseline', cursor: 'default', userSelect: 'none',
                '& .MuiChip-label': { px: 0.75 } }}
        />
      </Tooltip>
    </NodeViewWrapper>
  );
}
```

An unknown variable is **red and outlined** — visible at a glance rather than silently printing nothing in the finished letter. `NodeViewWrapper as="span"` with `display: inline` is required; the default `div` breaks the line.

---

## 7. Custom extension — dynamic block

`editor/block-node.jsx`. A **block atom**, draggable.

```jsx
const BlockNode = Node.create({
  name: 'letterBlock',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return { name: {
      default: null,
      parseHTML:  (element) => element.getAttribute('data-block'),
      renderHTML: (attributes) => (attributes.name ? { 'data-block': attributes.name } : {}),
    }};
  },

  parseHTML()  { return [{ tag: 'div[data-block]' }]; },
  renderHTML({ HTMLAttributes }) { return ['div', mergeAttributes(HTMLAttributes)]; },

  addNodeView() { return ReactNodeViewRenderer(BlockCard); },

  addCommands() {
    return { insertLetterBlock: (name) => ({ chain }) =>
      chain().focus().insertContent({ type: this.name, attrs: { name } }).run() };
  },
});
```

**Blocks render as labelled placeholder cards, never as live content.** What a block prints changes per recipient; rendering one recipient's data inside the editor would misrepresent the template. The preview pane is where real content is seen.

The card is a dashed-border MUI `Box` with `contentEditable={false}`, an icon, the block label and its description, highlighted when `selected`. An unrecognised name draws a red card: *"Unknown block '…' — it will print nothing."*

The client-side descriptor list (presentation only — the server's switch statement is authoritative for what each actually renders):

```jsx
export const LETTER_BLOCKS = [
  { name: 'meta',      label: 'Recipient header',   icon: 'eva:person-outline',
    description: 'Name, application ID, admission number and date.' },
  { name: 'details',   label: 'Programme details',  icon: 'eva:list-outline',
    description: 'Duration, session, set, mode of study and the registration dates. Rows with no value are left out.' },
  { name: 'documents', label: 'Required documents', icon: 'eva:file-text-outline',
    description: 'The documents list below — or the student’s own requirements when the offer set them.' },
  { name: 'notes',     label: 'Important notes',    icon: 'eva:alert-circle-outline',
    description: 'The notes list from the Content panel, numbered.' },
  { name: 'signature', label: 'Signature block',    icon: 'eva:edit-2-outline',
    description: 'Signature image, name, honorifics and title from the Signatory panel.' },
  { name: 'pagebreak', label: 'Page break',         icon: 'eva:scissors-outline',
    description: 'Everything after this starts on a new sheet.' },
];
```

---

## 8. Custom extension — optional mark

`editor/optional-mark.js`. A **mark**, not a node — so it can wrap part of a sentence and still allow bold/italic and variable chips inside it.

```js
const OptionalMark = Mark.create({
  name: 'letterOptional',

  parseHTML()  { return [{ tag: 'span[data-optional]' }]; },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-optional': 'true' }), 0];
  },

  addCommands() {
    return {
      setOptional:    () => ({ commands }) => commands.setMark(this.name),
      unsetOptional:  () => ({ commands }) => commands.unsetMark(this.name),
      toggleOptional: () => ({ commands }) => commands.toggleMark(this.name),
    };
  },
});
```

The `0` in `renderHTML` is ProseMirror's content hole — where the wrapped content goes.

Because an optional segment is **invisible in print**, the editor must show the author what may vanish. Styled in the writing surface (§12) as a dashed warning underline with a faint amber tint:

```js
'& .tiptap [data-optional]': {
  borderBottom: '1px dashed',
  borderColor: 'warning.main',
  backgroundColor: 'rgba(255,171,0,.08)',
},
```

The toolbar exposes it as a labelled toggle button reflecting `editor.isActive('letterOptional')`, tooltipped *"Drop this text when a variable inside it is empty"*.

---

## 9. Custom extension — class preservation

`editor/preserved-class.js`. Small, and the least obvious of the four.

**ProseMirror discards any attribute a node type has not declared.** Without this, the classes the server's print stylesheet hangs off (`letter-title`, `block-heading`, `closing`, `enclosure`) survive being *loaded* into the editor but vanish the moment the author saves — quietly restyling a letter nobody edited.

```js
const TARGET_TYPES = ['paragraph','heading','bulletList','orderedList','listItem',
                      'blockquote','image','table'];

const PreservedClass = Extension.create({
  name: 'preservedClass',
  addGlobalAttributes() {
    return [{
      types: TARGET_TYPES,
      attributes: {
        class: {
          default: null,
          parseHTML:  (element) => element.getAttribute('class') || null,
          renderHTML: (attributes) => (attributes.class ? { class: attributes.class } : {}),
        },
      },
    }];
  },
});
```

> **Regression test worth having in any port:** load a known document, save without editing, assert byte-identical output. This catches attribute loss in whichever editor you choose, and it is the failure that hurts most because it is invisible until someone prints a letter.

---

## 10. The `{{` suggestion menu

`editor/variable-suggestion.jsx`. Built on `@tiptap/suggestion`.

```js
export default function variableSuggestion(getVariables) {
  return {
    char: '{{',
    allowSpaces: false,     // don't pop open inside a URL or code-ish string
    startOfLine: false,

    items: ({ query }) => filterVariables(getVariables() || [], query),

    command: ({ editor, range, props }) => {
      editor.chain().focus()
        .deleteRange(range)          // remove the typed "{{query"
        .insertVariable(props.key)   // insert the atom + trailing space
        .run();
    },

    render: () => ({ onStart, onUpdate, onKeyDown, onExit }),
  };
}
```

**`getVariables` is a callback, not an array.** The catalogue is fetched asynchronously and arrives after the editor is created; a captured array would stay empty forever.

**Filtering** matches key + label + group concatenated, so typing `reg` finds the registration dates:

```js
const MAX_RESULTS = 12;
const filterVariables = (variables, query) => {
  const needle = String(query || '').trim().toLowerCase();
  const matches = !needle ? variables : variables.filter((v) =>
    `${v.key} ${v.label} ${v.group}`.toLowerCase().includes(needle));
  return matches.slice(0, MAX_RESULTS);
};
```

**Rendering the popup** uses `ReactRenderer` into a hand-positioned `position: fixed` div appended to `document.body`. No popper/tippy dependency — TipTap hands you a `clientRect` on every update, and pulling in a positioning library for one floating box is not worth it:

```js
const place = (clientRect) => {
  if (!element || !clientRect) return;
  const rect = clientRect();
  if (!rect) return;

  // Flip above the caret when there's no room below, so the menu is never
  // clipped by the bottom of the viewport.
  const spaceBelow = window.innerHeight - rect.bottom;
  const height = element.offsetHeight || 320;
  const top = spaceBelow < height + 16 ? rect.top - height - 6 : rect.bottom + 6;

  element.style.left = `${Math.min(rect.left, window.innerWidth - 340)}px`;
  element.style.top  = `${Math.max(8, top)}px`;
};

return {
  onStart: (props) => {
    component = new ReactRenderer(VariableList, { props, editor: props.editor });
    element = document.createElement('div');
    element.style.position = 'fixed';
    element.style.zIndex = '1400';       // above MUI's modal layer
    element.appendChild(component.element);
    document.body.appendChild(element);
    place(props.clientRect);
  },
  onUpdate: (props) => { component?.updateProps(props); place(props.clientRect); },
  onKeyDown: (props) => {
    if (props.event.key === 'Escape') { element?.remove(); return true; }
    return component?.ref?.onKeyDown(props) ?? false;
  },
  onExit: () => { element?.remove(); component?.destroy(); element = null; component = null; },
};
```

**Keyboard handling** lives in the list component, exposed through `useImperativeHandle` so the plugin can delegate to it. Returning `true` tells TipTap the key was consumed:

```jsx
useImperativeHandle(ref, () => ({
  onKeyDown: ({ event }) => {
    if (event.key === 'ArrowUp')   { setSelected((c) => (c + items.length - 1) % items.length); return true; }
    if (event.key === 'ArrowDown') { setSelected((c) => (c + 1) % items.length); return true; }
    if (event.key === 'Enter' || event.key === 'Tab') { select(selected); return true; }
    return false;
  },
}));
```

Arrow keys wrap around; `useEffect(() => setSelected(0), [items])` resets the highlight whenever the filter changes.

**Group subheaders are emitted inline** as the group changes rather than by nesting, so the flat keyboard index stays in step with what is on screen:

```jsx
let lastGroup = null;
items.map((item, index) => {
  const showGroup = item.group !== lastGroup;
  lastGroup = item.group;
  return [
    showGroup ? <ListSubheader key={`${item.group}-header`}>{item.group}</ListSubheader> : null,
    <MenuItem key={item.key} selected={index === selected}
              onMouseEnter={() => setSelected(index)} onClick={() => select(index)}>
      <Typography variant="body2" fontWeight={600} noWrap>{item.label}</Typography>
      <Typography variant="caption" color="text.secondary" noWrap display="block">
        {`{{${item.key}}} — ${item.sample}`}
      </Typography>
    </MenuItem>,
  ];
})
```

---

## 11. Toolbar

`editor/letter-toolbar.jsx`. A flat MUI `Stack` of `ToggleButton`s / `IconButton`s that call editor commands.

**Deliberately narrow.** This produces a printed A4 document, so anything that would not survive the PDF — font families, arbitrary sizes, floats — is left out rather than offered and then quietly ignored by the renderer.

| Group | Controls | Command |
|---|---|---|
| Block style | Body text, Heading 1–3 (`TextField select`) | `setParagraph()` / `setHeading({ level })` |
| Marks | Bold, Italic, Underline, Strikethrough, Highlight | `toggleBold()` etc. |
| Colour | 7-swatch menu (Default, Primary, Heading, Body, Red, Green, Blue) | `setColor(hex)` / `unsetColor()` |
| Lists | Bulleted, Numbered, Quote | `toggleBulletList()` etc. |
| Align | left / center / right / justify | `setTextAlign(align)` |
| Insert | Link, Image, Table 3×2, Horizontal rule | `setLink`, `setImage`, `insertTable`, `setHorizontalRule` |
| **Optional** | labelled toggle | `toggleOptional()` |
| **Variable** | searchable grouped menu | `insertVariable(key)` |
| **Block** | menu of `LETTER_BLOCKS` with descriptions | `insertLetterBlock(name)` |

Active state comes straight from the editor (`editor.isActive('bold')`, `editor.isActive('heading', { level: 2 })`), so the toolbar reflects the caret with no local state.

Two details worth copying:

- The **variable menu opens focused on its search box** (`TransitionProps={{ onEntered: () => searchRef.current?.focus() }}`) — the list is long and the author usually already knows the name. `onKeyDown={(e) => e.stopPropagation()}` on the search field stops MUI's menu typeahead stealing the keystrokes.
- Guard `if (!editor) return null;` at the top — `useEditor` returns `null` on the first render.

Link and image currently use `window.prompt`. Fine for an admin tool; replace with a dialog if you want polish.

---

## 12. Editor styling — mirroring the printed page

The writing surface is styled to match the print output, so line breaks and paragraph rhythm read roughly as they will in the PDF. **The preview is still the authority on exact output** — say so in the UI.

```js
'& .tiptap': {
  // 210mm A4 less the server template's 16mm side margins — the same measure the
  // printed letter uses, so a line that wraps here wraps there.
  maxWidth: '178mm',
  minHeight: '60vh',
  mx: 'auto',
  p: '12mm 10mm',
  bgcolor: 'common.white',
  color: '#555',
  borderRadius: 1,
  boxShadow: (theme) => theme.customShadows?.z8 || '0 2px 12px rgba(0,0,0,.08)',
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontSize: '10.5pt',
  lineHeight: 1.45,
  outline: 'none',
},
'& .tiptap p': { margin: '0 0 3mm', textAlign: 'justify' },
'& .tiptap h1, & .tiptap h2, & .tiptap h3': { margin: '0 0 3mm', color: '#333', lineHeight: 1.3 },
'& .tiptap h1': { fontSize: '15pt' },
'& .tiptap h2': { fontSize: '13pt' },
'& .tiptap h3': { fontSize: '11.5pt' },
'& .tiptap ul, & .tiptap ol': { margin: '0 0 3mm', paddingLeft: 24 },
'& .tiptap li': { margin: '0 0 1.5mm' },
// The editor wraps list-item content in a paragraph; without this the paragraph's
// bottom margin double-spaces every bullet.
'& .tiptap li > p': { margin: 0 },

// Class names the server's stylesheet also defines
'& .tiptap .letter-title': { textAlign: 'center', fontSize: '14pt', fontWeight: 'bold',
                             letterSpacing: 1.5, textTransform: 'uppercase', color: '#333' },
'& .tiptap .block-heading': { fontWeight: 'bold', color: '#333', textAlign: 'left' },
'& .tiptap .block-heading .num': { display: 'inline-block', minWidth: 22 },

'& .tiptap img': { maxWidth: '100%', height: 'auto' },
'& .tiptap table': { width: '100%', borderCollapse: 'collapse', margin: '0 0 3mm' },
'& .tiptap th, & .tiptap td': { border: '1px solid #ddd', padding: '1.5mm 2mm', textAlign: 'left' },
'& .tiptap th': { background: '#f5f5f5' },
'& .tiptap hr': { border: 0, borderTop: '1px solid #ddd', margin: '4mm 0' },

// Editing affordances — these have no print equivalent
'& .tiptap [data-optional]': { borderBottom: '1px dashed', borderColor: 'warning.main',
                               backgroundColor: 'rgba(255,171,0,.08)' },
'& .tiptap .ProseMirror-selectednode': { outline: '2px solid', outlineColor: 'primary.main' },
```

Using `mm` units in the browser works because CSS millimetres are defined against the 96dpi reference resolution — the same basis the print stylesheet uses.

The surface sits on `background.neutral` with padding, so it reads as a sheet of paper on a desk.

---

## 13. The preview pane

`preview/letter-preview.jsx`. Props: `html`, `isPending`, `isError`, `error`, `admissionId`, `onAdmissionChange`, `onRefresh`.

### 13.1 Always an iframe

```jsx
<Box component="iframe" title="Admission letter preview" srcDoc={html} ref={iframeRef} />
```

Three reasons, all load-bearing:

1. **Style isolation both ways.** The letter carries `@page` print CSS, absolute sizing and its own font stack. Inlined, it would fight with — and be overridden by — the console's MUI styles.
2. **Safety.** The server-rendered HTML is never injected into the console's own DOM (no `dangerouslySetInnerHTML`). It is sanitised server-side, but the iframe means the client is not relying on that.
3. **Printing for free.** `iframeRef.current.contentWindow.print()` prints exactly the previewed document.

### 13.2 True A4, then scale

```jsx
const A4_WIDTH_PX  = 794;    // 210mm at 96dpi
const A4_HEIGHT_PX = 1123;   // 297mm at 96dpi
const ZOOM_STEPS = [0.5, 0.65, 0.8, 1];   // default 0.65

<Box sx={{ width: A4_WIDTH_PX * zoom, height: A4_HEIGHT_PX * zoom,
           flexShrink: 0, alignSelf: 'flex-start' }}>
  <Box component="iframe" srcDoc={html}
       sx={{ width: A4_WIDTH_PX, height: A4_HEIGHT_PX, border: 0,
             bgcolor: 'common.white',
             boxShadow: (t) => t.customShadows?.z16 || '0 4px 24px rgba(0,0,0,.12)',
             transform: `scale(${zoom})`, transformOrigin: 'top left' }} />
</Box>
```

**The iframe is laid out at full A4 and CSS-scaled down.** A width-based preview would reflow at each zoom level and **lie about page breaks**. The outer `Box` is sized to the *scaled* dimensions because `transform` does not affect layout — without it the container reserves full A4 and leaves a large gap.

### 13.3 Preview chrome

- **Record picker** — MUI `Autocomplete` over the admissions list (`listAdmissions({ limit: 50 })`, `staleTime: 5min`), placeholder *"Sample applicant"*. Passing no id makes the server render with sample data.
- **Zoom select** — the four steps above.
- **Refresh** and **Print** icon buttons.
- **A 2 px `LinearProgress` strip, not a blanked pane** — the previous letter stays readable while the next render is in flight. Small detail; large difference to how the page feels while typing.
- **Sample-data chip** when no record is selected.
- **Error `Alert` with a Retry action**, showing the server message; the last good preview stays visible.
- **Empty state** — icon + *"The preview will appear here."*

---

## 14. State, data fetching and the preview loop

`view/admission-letter-settings-view.jsx`.

### 14.1 Queries and mutations

```jsx
const { data: result, isLoading } = useQuery({
  queryKey: ['letter-settings'],
  queryFn: () => getLetterSettings(),
});

const { data: variableResult } = useQuery({
  queryKey: ['letter-variables'],
  queryFn: () => getLetterVariables(),
  staleTime: Infinity,        // the catalogue changes only on deploy
});

const updateMutation  = useMutation({ mutationFn: (v) => updateLetterSettings(v), onSuccess: invalidate + toast });
const resetMutation   = useMutation({ mutationFn: () => resetLetterSettings(),    onSuccess: invalidate + toast });
const previewMutation = useMutation({ mutationFn: (p) => previewLetterSettings(p),
                                      onSuccess: (r) => setPreviewHtml(r?.data?.html || '') });
```

**The variable catalogue is fetched, never hard-coded.** The server owns the list of what the renderer can resolve; a client-side copy would drift silently.

Preview is a **mutation, not a query**, because it is a POST whose body is the entire unsaved draft — there is no stable cache key worth having.

### 14.2 Formik holds everything, including the document

The whole settings object is one form, with `letter.bodyHtml` as an ordinary field:

```jsx
const formik = useFormik({
  enableReinitialize: true,
  initialValues: {
    branding:    { logoUrl, letterheadUrl, watermarkUrl, signatureImageUrl,
                   showLetterhead, showWatermark, watermarkOpacity, watermarkWidth,
                   logoHeight, primaryColor, headingColor, bodyColor, borderAccentColor },
    institution: { name, shortName, address, location, phone, email, website },
    signatory:   { name, honorifics, subtitle, title },
    letter: {
      // An install that predates the editor has no body yet; the API sends a
      // document composed from its existing structured wording so the author
      // starts from their current letter rather than a blank page.
      bodyHtml: settings?.letter?.bodyHtml || result?.starterBodyHtml || '',
      title, documents: [], notes: [], labels: { … },
    },
    currency: { code: 'NGN', symbol: '₦' },
    fileNameTemplate: '',
  },
  validationSchema,
  onSubmit: (values) => updateMutation.mutate(values),
});
```

The editor is wired with:

```jsx
<LetterEditor
  value={values.letter.bodyHtml}
  variables={variables}
  disabled={busy}
  onChange={(html) => formik.setFieldValue('letter.bodyHtml', html)}
/>
```

Yup schema is light — numeric bounds on branding, required institution name, required non-empty body:

```js
Yup.object({
  branding: Yup.object({
    watermarkOpacity: Yup.number().min(0, 'Must be 0 or more').max(1, 'Must be 1 or less'),
    watermarkWidth:   Yup.number().positive('Must be positive'),
    logoHeight:       Yup.number().positive('Must be positive'),
  }),
  institution: Yup.object({ name: Yup.string().required('Institution name is required') }),
  letter:      Yup.object({ bodyHtml: Yup.string().required('The letter cannot be empty') }),
});
```

### 14.3 The debounced preview loop

This is the part most worth copying exactly.

```jsx
const PREVIEW_DEBOUNCE_MS = 600;

// Values are read through a ref so the debounce timer never fires with a stale
// draft, and the effect keys off a serialised copy so it re-arms on any change —
// body text, branding or the chosen admission alike.
const valuesRef  = useRef(values);                 valuesRef.current  = values;
const previewRef = useRef(previewMutation.mutate); previewRef.current = previewMutation.mutate;

const previewKey = useMemo(() => JSON.stringify(values), [values]);

const refreshPreview = useCallback(() => {
  previewRef.current({ settings: valuesRef.current, admissionId });
}, [admissionId]);

useEffect(() => {
  if (isLoading) return undefined;
  const timer = setTimeout(refreshPreview, PREVIEW_DEBOUNCE_MS);
  return () => clearTimeout(timer);
}, [previewKey, admissionId, isLoading, refreshPreview]);
```

Three things going on:

- **`JSON.stringify(values)` as the effect key.** Formik's `values` is a new object every render, so depending on it directly would re-arm the timer on every render, not every change. Serialising gives a value-identity key that covers *every* setting — change the watermark opacity in the drawer and the preview refreshes too.
- **Refs for `values` and `mutate`.** The timer closes over whatever was current when it was armed; reading through refs at fire time guarantees the freshest draft and avoids re-creating the callback.
- **600 ms.** Long enough that ordinary typing produces one request per pause, short enough to feel live. The request is a full server render, so do not drop this much below ~400 ms.

---

## 15. Author-facing validation and guards

### Unknown-variable warning

The client mirrors the server's key-collection logic so it can warn *before* saving:

```jsx
/**
 * Every variable the body refers to, whether inserted as a chip or typed by hand.
 * Mirrors `collectVariableKeys` on the server.
 */
const collectVariableKeys = (html) => {
  const keys = new Set();
  String(html || '').replace(/data-var=["']([\w.]+)["']/g, (_m, key) => keys.add(key));
  String(html || '').replace(/\{\{\s*([\w.]+)\s*\}\}/g,   (_m, key) => keys.add(key));
  return Array.from(keys);
};

const unknownVariables = useMemo(
  () => collectVariableKeys(values.letter.bodyHtml)
          .filter((key) => !variables.some((item) => item.key === key)),
  [values.letter.bodyHtml, variables]
);
```

Rendered as a warning `Alert` listing each unresolvable token as a chip: *"These variables cannot be resolved and will print as nothing."* This is duplicated logic by design — the server enforces, the client explains.

### Unsaved-work guards

```jsx
// The router here is a plain BrowserRouter, so there is no data-router blocker to
// hook into; this catches the tab-close case and the header shows an explicit
// unsaved badge for in-app navigation.
useEffect(() => {
  if (!dirty) return undefined;
  const warn = (event) => { event.preventDefault(); event.returnValue = ''; };
  window.addEventListener('beforeunload', warn);
  return () => window.removeEventListener('beforeunload', warn);
}, [dirty]);
```

Plus an `<Chip color="warning" label="Unsaved changes" />` in the header while `formik.dirty`.

### Reset confirmation

A `Dialog` — *"This replaces the letter and every setting with the defaults. Anything you have written here is lost."* — with a `LoadingButton color="error"`.

### Permission gating

The editor and the Save/Reset buttons are wrapped in the app's `<Can do={PERMISSIONS.EDIT_ADMISSION}>` component. The editor's fallback is the **same component with `disabled`**, so viewers get a faithful read-only rendering rather than raw HTML or nothing:

```jsx
<Can
  do={PERMISSIONS.EDIT_ADMISSION}
  fallback={<LetterEditor value={values.letter.bodyHtml} variables={variables} disabled onChange={() => {}} />}
>
  <LetterEditor … />
</Can>
```

Client gating is UX only; the API enforces independently.

---

## 16. Porting to other editors and frameworks

### Editor

| Editor | Custom atoms | Attribute preservation | Suggestion menu | Verdict |
|---|---|---|---|---|
| **TipTap / ProseMirror** | `Node.create({ atom: true })` | `addGlobalAttributes` | `@tiptap/suggestion` | Reference; best fit |
| **ProseMirror direct** | Native schema nodes | Native `attrs` + `toDOM`/`parseDOM` | Hand-rolled plugin | Same power, more code |
| **Lexical** | `DecoratorNode` | `exportDOM` / `importDOM` | `LexicalTypeaheadMenuPlugin` | Good; strong React story |
| **CKEditor 5** | Widgets (`toWidget`) | Schema + upcast/downcast converters | Mentions plugin | Capable, heavier, licensing |
| **Slate** | `isVoid` + `isInline` elements | Custom serialiser | Build it | Workable, most assembly |
| **Quill** | Embed Blots — awkward with arbitrary attributes | Manual | Manual | Avoid for this |

Whatever you pick, the four capabilities you must reproduce are:

1. An **inline atomic node** with an attribute, serialising to `<span data-var="k">{{k}}</span>`.
2. A **block atomic node** serialising to `<div data-block="n"></div>`, rendered as a placeholder card.
3. A **mark** serialising to `<span data-optional="true">…</span>`.
4. **Class-attribute preservation** on paragraphs, headings, lists, quotes, images and tables.

And the round-trip test from §9.

### Framework

Nothing here is React-specific except the node views. In Vue, use TipTap's `VueNodeViewRenderer` and `VueRenderer`; in Svelte/Angular, TipTap ships equivalents or you can use plain-DOM node views (`addNodeView` returning `{ dom, contentDOM }`) and skip the framework binding entirely.

State: swap Formik/Yup for React Hook Form + Zod, or plain `useState` — the only requirement is a value-identity key for the debounce effect (§14.3). Swap React Query for SWR or hand-rolled fetching; the only thing that matters is that preview is debounced and that the catalogue is fetched, not hard-coded.

MUI is purely cosmetic. The one non-cosmetic dependency is that the suggestion popup needs a `z-index` above your modal layer.

---

## 17. Client-side pitfalls

Every one of these was a real defect here.

1. **Rebuilding the extension array tears down the editor and loses the caret.** Build it once with `useMemo(…, [])`; read async-arriving data (the variable catalogue) through a ref.
2. **Naively syncing `value` into the editor resets the cursor to the start of the letter on every keystroke.** Compare against `editor.getHTML()` first and pass `{ emitUpdate: false }`.
3. **ProseMirror silently drops undeclared attributes.** Classes survive loading and vanish on save — quietly restyling a letter nobody edited. §9.
4. **Chips rendered before the catalogue loads stay stale.** Mutate the extension options and dispatch an empty transaction with `addToHistory: false`.
5. **A suggestion plugin that captured the variable array stays empty forever.** Pass a getter.
6. **`NodeViewWrapper` defaults to a `div`** — an inline chip needs `as="span"` with `display: inline`, or it breaks the line.
7. **A width-scaled preview reflows and lies about page breaks.** Lay the iframe out at true A4 and `transform: scale()`; size the wrapper to the scaled dimensions or you get a large empty gap.
8. **`dangerouslySetInnerHTML` for the preview** leaks `@page` CSS into the console and vice-versa. Always an iframe.
9. **Rich text editors wrap list-item content in `<p>`**, whose bottom margin double-spaces every bullet. `li > p { margin: 0 }` — needed in the editor CSS *and* the print CSS.
10. **Depending on Formik's `values` object directly in the debounce effect** re-arms the timer on every render. Serialise it.
11. **The debounce timer fires with a stale draft** unless values are read through a ref at fire time.
12. **MUI's menu typeahead swallows keystrokes** in the variable search field. `onKeyDown={(e) => e.stopPropagation()}`.
13. **`useEditor` returns `null` on first render.** Guard every consumer (`if (!editor) return null`).
14. **`{{` fires inside URLs.** `allowSpaces: false`, and consider a word-boundary check.
15. **Blanking the preview pane while re-rendering** makes typing feel broken. Keep the last render visible under a thin progress strip.
