import { sortThreads, selectMode, reorder } from './core.mjs';
import { cpsLabels } from './i18n.mjs';

// Host callbacks are supplied by a fingerprinted renderer adapter, never guessed
// from project names or DOM positions. No network or filesystem access here.
export function createAddon(host) {
  const fallback = () => ({ mode: 'updated_at', direction: 'desc', manualIds: [] });
  const key = (get, group) => {
    const account = host.account(get);
    if (!account || !group.projectId) return null;
    return JSON.stringify([account, group.projectKind, group.hostId ?? 'local', group.projectId]);
  };
  function state(get, group) {
    const config = host.read(get); // Subscribe even when no project has an override.
    const id = key(get, group);
    const p = id ? config?.[id] : null;
    if (p) sortThreads([], p); // Validate stored preferences before using them.
    return { id, p };
  }
  function rows(get, group) {
    return group.threadKeys.map(id => ({ ...host.thread(get, id), id }));
  }
  function save(scope, group, p) {
    const id = key(scope.get, group);
    if (!id) throw Error('No active account or project; settings were not saved.');
    host.write(scope, id, p);
  }
  function apply(get, group) {
    try {
      const { p } = state(get, group);
      if (!p) return group;
      const next = sortThreads(rows(get, group), p).map(t => t.id);
      return next.every((id, i) => id === group.threadKeys[i]) ? group : { ...group, threadKeys: next };
    } catch (error) { host.report(error); return group; }
  }
  const message = (id, text) => ({ id: `cps.${id}`, defaultMessage: text });
  function menu(scope, group, original) {
    const labels=cpsLabels(host.locale?.());
    if (host.supportsGroup && !host.supportsGroup(scope.get,group)) return original;
    let stored;
    try { stored = state(scope.get, group); } catch (error) { host.report(error); return original; }
    if (!stored.id) return original;
    const { p } = stored;
    const run = fn => () => { try { fn(); } catch (error) { host.report(error); } };
    const currentRows = () => rows(scope.get, apply(scope.get, group));
    const choices = ['updated_at','created_at','name','manual'].map(mode=>[mode,labels[mode]]);
    const submenu = choices.map(([mode, label]) => ({
      id: `cps-${mode}`, type: 'radio', checked: p?.mode === mode,
      message: message(mode, label),
      onSelect: run(() => {
        const current = currentRows();
        // Manual entry snapshots the actual host display order, including priority.
        const next = mode === 'manual'
          ? { ...(p ?? fallback()), mode, manualIds: current.map(t => t.id) }
          : selectMode(current, p ?? fallback(), mode);
        save(scope, group, next);
      }),
    }));
    submenu.push({ id: 'cps-direction-separator', type: 'separator' });
    if (p && p.mode !== 'manual') for (const [direction, label] of [['asc',labels.asc],['desc',labels.desc]]) {
      submenu.push({ id: `cps-${direction}`, type:'radio', checked:p.direction===direction,
        message:message(direction,label), onSelect:run(()=>save(scope,group,{...p,direction})) });
    }
    submenu.push({ id:'cps-arrange', message:message('arrange',labels.arrange), onSelect:run(()=> {
      const current = currentRows();
      host.arrange(current, ordered => {
        try {
          // Refuse a stale dialog if membership changed while it was open.
          const fresh = host.currentGroup ? host.currentGroup(scope,group) : group;
          if (!fresh) throw Error('Project no longer exists; order was not saved.');
          const freshRows = rows(scope.get,fresh);
          const next = reorder(freshRows, p ?? fallback(), ordered);
          // Preserve absent/archived IDs so restoration need not forget them.
          const visible = new Set(group.threadKeys);
          const old = p?.manualIds ?? [];
          let i = 0;
          const merged = old.map(id => visible.has(id) ? ordered[i++] : id).filter(id=>id!==undefined);
          next.manualIds = [...new Set([...merged,...ordered.slice(i)])];
          save(scope,group,next);
        } catch(error) { host.report(error); throw error; }
      });
    }) });
    submenu.push({id:'cps-reset',message:message('reset',labels.reset),onSelect:run(()=>save(scope,group,null))});
    return [...original.slice(0,1), { id:'cps-sort',message:message('sort',labels.sort),submenu }, ...original.slice(1)];
  }
  return { sortGroups:(get,groups)=>groups.map(g=>apply(get,g)), menu };
}
