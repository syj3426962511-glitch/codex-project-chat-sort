// Integration module only: this does not modify the installed Codex client.
export const MODES = Object.freeze(['updated_at', 'created_at', 'name', 'manual']);
const collator = new Intl.Collator('zh-CN', { numeric: true, sensitivity: 'base' });
const defaults = () => ({ mode: 'updated_at', direction: 'desc', manualIds: [] });
function validate(value) {
  if (!value || !MODES.includes(value.mode) || !['asc', 'desc'].includes(value.direction)
    || !Array.isArray(value.manualIds) || value.manualIds.some(id => typeof id !== 'string')
    || new Set(value.manualIds).size !== value.manualIds.length) throw new TypeError('Invalid sort preference');
  return { mode: value.mode, direction: value.direction, manualIds: [...value.manualIds] };
}
function checkThreads(threads) {
  const ids = threads.map(t => t.id);
  if (ids.some(id => typeof id !== 'string' || !id) || new Set(ids).size !== ids.length)
    throw new TypeError('Expected unique, nonempty thread IDs');
}
// Adapter contract: timestamps are milliseconds since Unix epoch, or null.
// Convert seconds explicitly at the data boundary; do not infer units here.
function time(value) { return typeof value === 'number' && Number.isFinite(value) ? value : null; }
function identity(a, b) { return a.id < b.id ? -1 : a.id > b.id ? 1 : 0; }
export function sortThreads(threads, preference) {
  checkThreads(threads);
  const p = validate(preference);
  const sign = p.direction === 'asc' ? 1 : -1;
  const rank = new Map(p.manualIds.map((id, i) => [id, i]));
  return [...threads].sort((a, b) => {
    if (p.mode === 'manual') {
      const ar = rank.get(a.id), br = rank.get(b.id);
      if (ar !== undefined || br !== undefined) {
        if (ar === undefined) return 1;
        if (br === undefined) return -1;
        return ar - br;
      }
      // New chats appear at the end, oldest first, until their order is saved.
      const at = time(a.createdAt), bt = time(b.createdAt);
      if (at === null && bt !== null) return 1;
      if (bt === null && at !== null) return -1;
      return (at !== null && bt !== null ? at - bt : 0) || identity(a, b);
    }
    if (p.mode === 'name') return sign * collator.compare(a.title ?? '', b.title ?? '') || identity(a, b);
    const field = p.mode === 'created_at' ? 'createdAt' : 'updatedAt';
    const at = time(a[field]), bt = time(b[field]);
    // Missing dates stay last in both directions.
    if (at === null && bt !== null) return 1;
    if (bt === null && at !== null) return -1;
    return (at !== null && bt !== null ? sign * (at - bt) : 0) || identity(a, b);
  });
}
export function selectMode(threads, current, mode) {
  if (!MODES.includes(mode)) throw new TypeError('Unknown sort mode');
  return validate({ ...current, mode, direction: mode === 'name' ? 'asc' : 'desc',
    manualIds: mode === 'manual' ? sortThreads(threads, current).map(t => t.id) : current.manualIds });
}
export function reorder(threads, current, orderedIds) {
  checkThreads(threads);
  if (orderedIds.length !== threads.length || new Set(orderedIds).size !== threads.length
    || orderedIds.some(id => !threads.some(t => t.id === id))) throw new TypeError('Order must contain every visible thread exactly once');
  return validate({ ...current, mode: 'manual', manualIds: [...orderedIds] });
}
export function createPreferenceStore(storage, scope) {
  // Include account, source, host, and stable project ID to prevent collisions.
  for (const key of ['accountId', 'source', 'hostId', 'projectId'])
    if (typeof scope[key] !== 'string' || !scope[key]) throw new TypeError(`Missing ${key}`);
  const key = 'project-chat-sort:v1:' + JSON.stringify([scope.accountId, scope.source, scope.hostId, scope.projectId]);
  return {
    load() {
      const raw = storage.getItem(key); // Storage errors must reach the UI.
      if (raw === null) return { preference: defaults(), warning: null };
      try {
        const data = JSON.parse(raw);
        if (data.version !== 1) throw new TypeError('Unsupported version');
        return { preference: validate(data.preference), warning: null };
      } catch {
        // Do not silently overwrite a corrupted or newer record.
        return { preference: defaults(), warning: '排序设置无法读取；使用默认排序，原记录未覆盖。' };
      }
    },
    save(preference) { storage.setItem(key, JSON.stringify({ version: 1, preference: validate(preference) })); },
  };
}
