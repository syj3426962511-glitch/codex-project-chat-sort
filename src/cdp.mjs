import { EventEmitter } from 'node:events';
export class CDP extends EventEmitter {
  constructor(socket) {
    super(); this.socket=socket;this.next=1;this.pending=new Map();
    socket.addEventListener('message',event=>{
      let m;try{m=JSON.parse(event.data);}catch{return;}
      if(m.id){const p=this.pending.get(m.id);if(!p)return;clearTimeout(p.timer);this.pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}
      else if(m.method)this.emit(m.method,m.params);
    });
    socket.addEventListener('close',()=>{for(const p of this.pending.values()){clearTimeout(p.timer);p.reject(Error('CDP disconnected'));}this.pending.clear();this.emit('disconnected');});
  }
  static async connect(url) {
    const parsed=new URL(url);
    if(parsed.protocol!=='ws:'||!['127.0.0.1','localhost','[::1]'].includes(parsed.hostname))throw Error('Only local debugging endpoints are accepted.');
    const socket=new WebSocket(url);
    await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{socket.close();reject(Error('CDP connection timed out'));},10000);
      socket.addEventListener('open',()=>{clearTimeout(timer);resolve();},{once:true});
      socket.addEventListener('error',()=>{clearTimeout(timer);reject(Error('CDP connection failed'));},{once:true});
    });
    return new CDP(socket);
  }
  send(method,params={}) {
    const id=this.next++;
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{this.pending.delete(id);reject(Error(`CDP ${method} timed out`));},15000);
      this.pending.set(id,{resolve,reject,timer});
      try{this.socket.send(JSON.stringify({id,method,params}));}catch(e){clearTimeout(timer);this.pending.delete(id);reject(e);}
    });
  }
  close(){this.socket.close();}
}
