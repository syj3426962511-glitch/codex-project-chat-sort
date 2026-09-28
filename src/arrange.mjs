// Accessible, text-only manual order editor. It never renders titles as HTML.
export function arrangeDialog(rows, onSave, doc = document) {
  const dialog = doc.createElement('dialog');
  dialog.setAttribute('aria-label','手动调整聊天顺序');
  Object.assign(dialog.style,{width:'min(560px,90vw)',maxHeight:'80vh',border:'1px solid #bbb',borderRadius:'14px',padding:'20px',background:'Canvas',color:'CanvasText',font:'14px system-ui'});
  const heading=doc.createElement('h2'); heading.textContent='手动调整聊天顺序';
  const note=doc.createElement('p'); note.textContent='拖动条目，或使用上移/下移按钮。这里只显示当前已加载的聊天。';
  const list=doc.createElement('ol'); Object.assign(list.style,{maxHeight:'50vh',overflow:'auto',padding:'0',listStyle:'none'});
  const error=doc.createElement('p'); error.setAttribute('role','alert');
  const order=rows.map(t=>t.id), byId=new Map(rows.map(t=>[t.id,t]));
  let dragging=null;
  const button=(label,handler)=>{const el=doc.createElement('button');el.type='button';el.textContent=label;el.onclick=handler;return el;};
  function move(id,to) { const from=order.indexOf(id); if(from<0||to<0||to>=order.length)return; order.splice(from,1);order.splice(to,0,id);render(); list.children[to]?.querySelector('button')?.focus(); }
  function render(){
    list.replaceChildren();
    order.forEach((id,i)=>{
      const li=doc.createElement('li');li.draggable=true;Object.assign(li.style,{display:'flex',gap:'8px',alignItems:'center',padding:'8px',borderBottom:'1px solid #ddd'});
      const title=doc.createElement('span');title.textContent=byId.get(id).title||'未命名聊天';title.style.flex='1';
      const up=button('上移',()=>move(id,i-1)), down=button('下移',()=>move(id,i+1));up.disabled=i===0;down.disabled=i===order.length-1;
      up.setAttribute('aria-label',`上移 ${title.textContent}`);down.setAttribute('aria-label',`下移 ${title.textContent}`);
      li.ondragstart=e=>{dragging=id;e.dataTransfer?.setData('text/plain',id);};
      li.ondragover=e=>e.preventDefault();li.ondrop=e=>{e.preventDefault();if(dragging!==null)move(dragging,i);dragging=null;};li.ondragend=()=>{dragging=null;};
      li.append(title,up,down);list.append(li);
    });
  }
  const previous=doc.activeElement;
  const close=()=>{dialog.close();dialog.remove();previous?.focus?.();};
  dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  const save=button('保存',()=>{try{onSave([...order]);close();}catch(e){error.textContent=e.message;}});
  dialog.append(heading,note,list,error,save,button('取消',close));doc.body.append(dialog);render();dialog.showModal();save.focus();
  return { dialog, close };
}
