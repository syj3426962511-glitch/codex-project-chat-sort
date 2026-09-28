// This file is appended inside the fingerprinted module's lexical scope.
// Bindings below were inspected only in Codex app 26.924.22138.
var __cpsInstance;
var __cpsPreferenceAtom;
function __cpsGet() {
  if (__cpsInstance) return __cpsInstance;
  const atom = () => __cpsPreferenceAtom ??= ss('community-project-chat-sort-v1', {});
  __cpsInstance = __CPS_FACTORY__({
    supportsGroup: (get,group) => ['local','remote'].includes(group.projectKind) && !(Vp(get,Zp.PINNED_PROJECT_IDS)??[]).includes(group.projectId),
    account: get => get(tr),
    read: get => get(atom()),
    write: (scope,key,value) => scope.set(atom(), old => {
      const next = { ...old };
      if(value === null) delete next[key]; else next[key] = value;
      return next;
    }),
    thread: (get,key) => {
      const row = get(RA,key);
      if(row?.kind === 'local') {
        const c = row.conversation;
        return { title:c?.title ?? '', createdAt:c?.createdAt ?? null, updatedAt:c?.updatedAt ?? null };
      }
      if(row?.kind === 'remote') {
        const t = row.task;
        return { title:t?.title ?? '', createdAt:typeof t?.created_at==='number'?t.created_at*1000:null, updatedAt:typeof t?.updated_at==='number'?t.updated_at*1000:null };
      }
      throw Error('Unsupported thread metadata shape; native ordering retained.');
    },
    arrange: (rows,onSave) => __CPS_ARRANGE__(rows,onSave),
    currentGroup: (scope,group) => scope.get(DM,'codex').projectGroups.find(g=>g.projectId===group.projectId),
    report: error => console.warn('[codex-project-chat-sort]', error.message)
  });
  return __cpsInstance;
}
