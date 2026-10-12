import { useQuery } from '@tanstack/react-query';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import { studioApi } from 'src/api/docStudioApi';

// ----------------------------------------------------------------------

const AUTOSAVE_MS = 1200;

const serialize = (content) => JSON.stringify(content || null);

/**
 * One template's editing session: loads it, keeps the author's working copy,
 * autosaves it as a DRAFT (never live), and tracks revision for conflict
 * detection. Publishing, discarding and restoring go through here too so the
 * revision never drifts.
 *
 * The working copy is never replaced by the server's echo after a save — the
 * server normalises HTML slightly, and swapping it in while the author types
 * would jump the caret.
 */
export function useStudioTemplate(service, key) {
  const api = useMemo(() => studioApi(service), [service]);
  const query = useQuery({
    queryKey: ['doc-studio', 'type', service, key],
    queryFn: () => api.getType(key),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const [content, setContent] = useState(null);
  const [revision, setRevision] = useState(0);
  const [status, setStatus] = useState('default');
  const [template, setTemplate] = useState(null);
  const [saveState, setSaveState] = useState('idle');
  const [savedAt, setSavedAt] = useState(null);
  const [issues, setIssues] = useState([]);

  const revisionRef = useRef(0);
  const contentRef = useRef(null);
  const lastSaved = useRef(null);
  const inflight = useRef(null);
  contentRef.current = content;

  const load = useCallback((data) => {
    const t = data.template || {};
    const working = t.draft?.content || t.published?.content || data.defaultContent;
    setContent(working);
    lastSaved.current = serialize(working);
    revisionRef.current = t.revision || 0;
    setRevision(t.revision || 0);
    setStatus(data.status);
    setTemplate(t);
    setSaveState('idle');
  }, []);

  // First load only; later refetches (e.g. after a conflict) are applied explicitly.
  const loadedFor = useRef(null);
  useEffect(() => {
    if (query.data && loadedFor.current !== `${service}:${key}`) {
      loadedFor.current = `${service}:${key}`;
      load(query.data);
    }
  }, [query.data, service, key, load]);

  /** Applies a lifecycle response ({ revision, status, template }) from the server. */
  const applyServer = useCallback((res, { replaceContent = false } = {}) => {
    if (!res) return;
    if (res.revision != null) {
      revisionRef.current = res.revision;
      setRevision(res.revision);
    }
    if (res.status) setStatus(res.status);
    if (res.template) setTemplate(res.template);
    if (res.issues) setIssues(res.issues);
    if (replaceContent && res.template) {
      const working = res.template.draft?.content || res.template.published?.content || query.data?.defaultContent;
      setContent(working);
      lastSaved.current = serialize(working);
    }
  }, [query.data]);

  const save = useCallback(async () => {
    const snapshot = contentRef.current;
    const json = serialize(snapshot);
    if (!snapshot || json === lastSaved.current) return true;
    if (inflight.current) return inflight.current;
    setSaveState('saving');
    const run = (async () => {
      try {
        const res = await api.saveDraft(key, { content: snapshot, baseRevision: revisionRef.current });
        lastSaved.current = json;
        applyServer(res);
        setSavedAt(Date.now());
        setSaveState(serialize(contentRef.current) === json ? 'saved' : 'dirty');
        return true;
      } catch (error) {
        setSaveState(error.status === 409 ? 'conflict' : 'error');
        return false;
      } finally {
        inflight.current = null;
      }
    })();
    inflight.current = run;
    return run;
  }, [api, key, applyServer]);

  // Autosave after a pause in typing.
  useEffect(() => {
    if (!content || saveState === 'conflict') return undefined;
    if (serialize(content) === lastSaved.current) return undefined;
    setSaveState((current) => (current === 'saving' ? current : 'dirty'));
    const timer = setTimeout(save, AUTOSAVE_MS);
    return () => clearTimeout(timer);
  }, [content, save, saveState]);

  // Leaving with unsaved edits.
  useEffect(() => {
    const warn = (event) => {
      if (serialize(contentRef.current) !== lastSaved.current) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  const update = useCallback((patch) => {
    setContent((current) => {
      if (!current) return current;
      const next = typeof patch === 'function' ? patch(current) : { ...current, ...patch };
      return next;
    });
  }, []);

  const setBody = useCallback((field, html) => update((current) => ({ ...current, body: { ...current.body, [field]: html } })), [update]);

  /**
   * The editor's re-serialisation of what was loaded: becomes the clean
   * baseline (no draft) as long as there were no unsaved edits before it.
   */
  const adoptBody = useCallback((field, html) => {
    setContent((current) => {
      if (!current || current.body?.[field] === html) return current;
      const next = { ...current, body: { ...current.body, [field]: html } };
      if (serialize(current) === lastSaved.current) lastSaved.current = serialize(next);
      return next;
    });
  }, []);
  const setLayout = useCallback((layout) => update((current) => ({ ...current, layout: { ...current.layout, ...layout } })), [update]);

  /** Reloads the server copy, discarding local edits (conflict resolution). */
  const reload = useCallback(async () => {
    const data = await query.refetch();
    if (data.data) load(data.data);
  }, [query, load]);

  /** Keeps local edits but rebases them on the latest server revision. */
  const overwrite = useCallback(async () => {
    const data = await query.refetch();
    if (data.data) {
      revisionRef.current = data.data.template?.revision || 0;
      setRevision(revisionRef.current);
      lastSaved.current = null;
      setSaveState('dirty');
    }
  }, [query]);

  const withFlush = useCallback(async (fn) => {
    const ok = await save();
    if (!ok) throw new Error('Your latest changes could not be saved yet.');
    return fn(revisionRef.current);
  }, [save]);

  const actions = useMemo(() => ({
    save,
    publish: (body) => withFlush(async (baseRevision) => {
      const res = await api.publish(key, { ...body, baseRevision });
      applyServer(res);
      setSaveState('idle');
      return res;
    }),
    discardDraft: async () => {
      const res = await api.discardDraft(key, revisionRef.current);
      applyServer(res, { replaceContent: true });
      return res;
    },
    resetToDefault: async () => {
      const res = await api.resetToDefault(key, { baseRevision: revisionRef.current });
      applyServer(res, { replaceContent: true });
      return res;
    },
    unpublish: () => withFlush(async (baseRevision) => {
      const res = await api.unpublish(key, { baseRevision });
      applyServer(res);
      return res;
    }),
    restore: (version) => withFlush(async (baseRevision) => {
      const res = await api.restore(key, version, { baseRevision });
      applyServer(res, { replaceContent: true });
      return res;
    }),
  }), [api, key, save, withFlush, applyServer]);

  return {
    api,
    query,
    data: query.data,
    content,
    revision,
    status,
    template,
    saveState,
    savedAt,
    issues,
    setIssues,
    update,
    setBody,
    adoptBody,
    setLayout,
    reload,
    overwrite,
    actions,
  };
}

// ----------------------------------------------------------------------

/**
 * Server-rendered live preview of the working copy. Debounced, keeps the last
 * render on screen while the next is in flight, and drops responses that
 * arrive out of order.
 */
export function useLivePreview({ api, typeKey, content, recordId, brand, delay = 600, enabled = true }) {
  const [state, setState] = useState({ result: null, pending: false, error: null });
  const seq = useRef(0);
  const json = useMemo(() => JSON.stringify({ content, recordId, brand }), [content, recordId, brand]);

  const run = useCallback(async () => {
    if (!content || !enabled) return;
    seq.current += 1;
    const mine = seq.current;
    setState((current) => ({ ...current, pending: true }));
    try {
      const result = await api.preview({ key: typeKey, content, recordId: recordId || undefined, brand: brand || undefined });
      if (mine === seq.current) setState({ result, pending: false, error: null });
    } catch (error) {
      if (mine === seq.current) setState((current) => ({ ...current, pending: false, error }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, typeKey, json, enabled]);

  useEffect(() => {
    const timer = setTimeout(run, delay);
    return () => clearTimeout(timer);
  }, [run, delay]);

  return { ...state, refresh: run };
}

// ----------------------------------------------------------------------

/** Keyboard shortcuts for the editor screen. Handlers receive nothing. */
export function useShortcuts(map) {
  const mapRef = useRef(map);
  mapRef.current = map;
  useEffect(() => {
    const onKey = (event) => {
      const mod = event.ctrlKey || event.metaKey;
      if (!mod) return;
      const keyName = `${event.shiftKey ? 'shift+' : ''}${event.key.toLowerCase()}`;
      const handler = mapRef.current[keyName];
      if (handler) {
        event.preventDefault();
        handler();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

// ----------------------------------------------------------------------

/** "just now", "12s ago", "4 min ago". */
export function useRelativeTime(timestamp) {
  const [, tick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => tick((n) => n + 1), 10000);
    return () => clearInterval(timer);
  }, []);
  if (!timestamp) return '';
  const seconds = Math.round((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return new Date(timestamp).toLocaleDateString();
}

export function timeAgo(timestamp) {
  if (!timestamp) return '';
  const seconds = Math.round((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} d ago`;
  return new Date(timestamp).toLocaleDateString();
}

/** Every {{key}} referenced by a fragment: chips and typed tokens. */
export function collectKeys(html) {
  const keys = new Set();
  String(html || '').replace(/data-var=["']([\w.]+)["']/g, (_m, k) => keys.add(k));
  String(html || '').replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_m, k) => keys.add(k));
  return Array.from(keys);
}

export function countUses(html, key) {
  const source = String(html || '');
  return (source.match(new RegExp(`data-var=["']${key.replace('.', '\\.')}["']`, 'g')) || []).length;
}

export function countBlocks(html, name) {
  return (String(html || '').match(new RegExp(`data-block=["']${name}["']`, 'g')) || []).length;
}
