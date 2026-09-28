import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sortThreads, selectMode, reorder, createPreferenceStore } from '../src/core.mjs';
const p = { mode: 'updated_at', direction: 'desc', manualIds: [] };
const threads = [
  { id: 'a', title: '10-实验', createdAt: 1000, updatedAt: 3000 },
  { id: 'b', title: '02-实验', createdAt: 3000, updatedAt: 1000 },
  { id: 'c', title: '01-实验', createdAt: 2000, updatedAt: 2000 },
];
const ids = list => list.map(t => t.id);
test('creation and update sorting use different fields without mutating source', () => {
  assert.deepEqual(ids(sortThreads(threads, p)), ['a','c','b']);
  assert.deepEqual(ids(sortThreads(threads, {...p, mode: 'created_at'})), ['b','c','a']);
  assert.deepEqual(ids(threads), ['a','b','c']);
});
test('name uses natural number ordering and reversible direction', () => {
  const name = selectMode(threads, p, 'name');
  assert.deepEqual(ids(sortThreads(threads, name)), ['c','b','a']);
  assert.deepEqual(ids(sortThreads(threads, {...name, direction:'desc'})), ['a','b','c']);
});
test('manual captures visible order, ignores updates, appends new chats', () => {
  const manual = selectMode(threads, p, 'manual');
  const changed = threads.map(t => ({...t, updatedAt: t.id === 'b' ? 9000 : 0}));
  assert.deepEqual(ids(sortThreads([...changed, {id:'d',createdAt:4000}], manual)), ['a','c','b','d']);
  const moved = reorder(threads, manual, ['b','a','c']);
  assert.deepEqual(ids(sortThreads(changed, moved)), ['b','a','c']);
  assert.throws(() => reorder(threads, manual, ['a','a','c']));
});
test('missing dates stay last; timestamp ties are deterministic', () => {
  const rows = [{id:'z'}, {id:'b',updatedAt:0}, {id:'a',updatedAt:0}];
  for (const direction of ['asc','desc']) assert.deepEqual(ids(sortThreads(rows,{...p,direction})),['a','b','z']);
});
test('settings survive store recreation and remain isolated by project and account', () => {
  const data = new Map();
  const storage = {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
  const scope = {accountId:'user',source:'codex',hostId:'local',projectId:'one'};
  createPreferenceStore(storage,scope).save({...p,mode:'name'});
  assert.equal(createPreferenceStore(storage,scope).load().preference.mode,'name');
  assert.equal(createPreferenceStore(storage,{...scope,projectId:'two'}).load().preference.mode,'updated_at');
  assert.equal(createPreferenceStore(storage,{...scope,accountId:'other'}).load().preference.mode,'updated_at');
});
test('corrupted data is reported and preserved; failed writes propagate', () => {
  const scope = {accountId:'u',source:'codex',hostId:'local',projectId:'p'};
  let writes = 0;
  const store = createPreferenceStore({getItem:()=>'{bad',setItem:()=>{writes++;throw Error('disk full');}},scope);
  assert.ok(store.load().warning);
  assert.equal(writes,0);
  assert.throws(()=>store.save(p),/disk full/);
});
test('duplicate IDs and unsupported modes are rejected', () => {
  assert.throws(()=>sortThreads([{id:'a'},{id:'a'}],p));
  assert.throws(()=>selectMode(threads,p,'unknown'));
});
