import { patchRenderer } from './patch.mjs';
export async function interceptResponse(cdp,event,profile,log) {
  const id=event.requestId;
  let fulfilled=false;
  try {
    const url=new URL(event.request.url);
    if(url.pathname.split('/').at(-1)!==profile.asset||event.responseStatusCode!==200) return;
    const body=await cdp.send('Fetch.getResponseBody',{requestId:id});
    const source=body.base64Encoded?Buffer.from(body.body,'base64').toString('utf8'):body.body;
    const patched=patchRenderer(source,profile);
    const headers=(event.responseHeaders??[]).filter(h=>!['content-length','content-encoding','etag','content-md5','digest'].includes(h.name.toLowerCase()));
    await cdp.send('Fetch.fulfillRequest',{requestId:id,responseCode:200,responseHeaders:headers,body:Buffer.from(patched).toString('base64')});
    fulfilled=true;
    log({status:'renderer-patched',appVersion:profile.appVersion});
  } catch(error) {log({status:'not-applied',reason:error.message});}
  finally {if(!fulfilled)await cdp.send('Fetch.continueRequest',{requestId:id});}
}
