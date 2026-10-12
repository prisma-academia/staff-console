/**
 * Word-level diff for "what changed" views. Small LCS over word tokens —
 * templates are a few hundred words, so the quadratic table is fine; very long
 * inputs fall back to a coarse whole-text comparison.
 */

export function htmlToPlain(html) {
  return String(html || '')
    .replace(/<div[^>]*data-block=["']([\w-]+)["'][^>]*><\/div>/gi, ' [$1 block] ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|h[1-6]|li|tr|div|blockquote)>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}

const tokenize = (text) => String(text || '').match(/\s+|[^\s]+/g) || [];

/** Returns [{ type: 'same'|'added'|'removed', text }]. */
export function diffWords(before, after) {
  const a = tokenize(before);
  const b = tokenize(after);
  if (a.length * b.length > 4000000) {
    return before === after ? [{ type: 'same', text: after }] : [{ type: 'removed', text: before }, { type: 'added', text: after }];
  }
  const rows = a.length + 1;
  const cols = b.length + 1;
  const table = new Uint32Array(rows * cols);
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      table[i * cols + j] = a[i] === b[j] ? table[(i + 1) * cols + j + 1] + 1 : Math.max(table[(i + 1) * cols + j], table[i * cols + j + 1]);
    }
  }
  const out = [];
  const push = (type, text) => {
    const last = out[out.length - 1];
    if (last && last.type === type) last.text += text;
    else out.push({ type, text });
  };
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      push('same', a[i]);
      i += 1;
      j += 1;
    } else if (table[(i + 1) * cols + j] >= table[i * cols + j + 1]) {
      push('removed', a[i]);
      i += 1;
    } else {
      push('added', b[j]);
      j += 1;
    }
  }
  while (i < a.length) push('removed', a[i++]); // eslint-disable-line no-plusplus
  while (j < b.length) push('added', b[j++]); // eslint-disable-line no-plusplus
  return out;
}

export function contentText(content) {
  if (!content) return '';
  const body = content.body || {};
  return [body.subject && `Subject: ${htmlToPlain(body.subject)}`, body.preheader && `Preview text: ${htmlToPlain(body.preheader)}`, htmlToPlain(body.html)]
    .filter(Boolean)
    .join('\n');
}
