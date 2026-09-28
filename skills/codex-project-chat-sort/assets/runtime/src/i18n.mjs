export function cpsLabels(locale = globalThis.document?.documentElement?.lang || globalThis.navigator?.language || 'en') {
  const en={updated_at:'Recently updated',created_at:'Date created',name:'Name',manual:'Manual',asc:'Ascending',desc:'Descending',arrange:'Adjust manual order…',reset:'Restore app default sorting',sort:'Sort chats by',heading:'Arrange chats manually',note:'Drag items or use Move up / Move down. Only currently loaded chats are shown.',untitled:'Untitled chat',up:'Move up',down:'Move down',save:'Save',cancel:'Cancel'};
  const zh={updated_at:'最近更新',created_at:'创建日期',name:'名称',manual:'手动',asc:'升序',desc:'降序',arrange:'手动调整顺序…',reset:'恢复应用默认排序',sort:'排序方式',heading:'手动调整聊天顺序',note:'拖动条目，或使用上移/下移按钮。这里只显示当前已加载的聊天。',untitled:'未命名聊天',up:'上移',down:'下移',save:'保存',cancel:'取消'};
  return /^zh(?:-|_|$)/i.test(locale)?zh:en;
}
