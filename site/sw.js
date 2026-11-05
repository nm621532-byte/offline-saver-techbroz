// Offline Saver service worker: app shell cache + Android share target
importScripts('db.js?v=3');
var V='os-v3';
var SHELL=['./','app.css?v=3','app.js?v=3','db.js?v=3','font.woff2','manifest.webmanifest?v=3','icon-192.png','icon-512.png'];
self.addEventListener('install',function(e){ e.waitUntil(caches.open(V).then(function(c){ return c.addAll(SHELL); }).then(function(){ return self.skipWaiting(); })); });
self.addEventListener('activate',function(e){ e.waitUntil(caches.keys().then(function(ks){ return Promise.all(ks.filter(function(k){return k!==V;}).map(function(k){return caches.delete(k);})); }).then(function(){ return self.clients.claim(); })); });

function readable(html,url){
  // service workers have no DOMParser; a light tag strip is enough for a share
  var t=(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)||[])[1]||url;
  var body=html.replace(/<(script|style|noscript|svg|nav|header|footer|aside|form)[\s\S]*?<\/\1>/gi,' ')
    .replace(/<\/(p|div|h[1-6]|li|br|tr|section|article)>/gi,'\n').replace(/<br\s*\/?>/gi,'\n').replace(/<[^>]+>/g,' ')
    .replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'")
    .replace(/[ \t]+/g,' ').replace(/\n\s*\n+/g,'\n\n').trim();
  return {title:t.trim(),text:body};
}

async function handleShare(req){
  var saved=0, note='';
  try{
    var fd=await req.formData();
    var files=fd.getAll('files').filter(function(f){ return f && typeof f!=='string' && f.size>0; });
    for(var i=0;i<files.length;i++){ await OSDB.addFile(files[i]); saved++; }
    var title=(fd.get('title')||'').toString(), text=(fd.get('text')||'').toString(), url=(fd.get('url')||'').toString();
    if(!url){ var m=text.match(/https?:\/\/\S+/); if(m && text.trim()===m[0]) { url=m[0]; text=''; } }
    if(url && !files.length){
      try{
        var r=await fetch(url,{mode:'cors'}); if(!r.ok) throw new Error(r.status);
        var p=readable(await r.text(),url);
        if(p.text.length<80) throw new Error('empty');
        await OSDB.addText(title||p.title,p.text,url,'page'); saved++; note='page';
      }catch(err){ await OSDB.addText(title||url,(text?text+'\n\n':'')+url,url,'link'); saved++; note='linkonly'; }
    } else if(text && !files.length){ await OSDB.addText(title,text,url,'text'); saved++; }
  }catch(err){ note='error'; }
  return Response.redirect('./?shared='+saved+(note?'&note='+note:''),303);
}

self.addEventListener('fetch',function(e){
  var req=e.request, u=new URL(req.url);
  if(req.method==='POST' && u.origin===location.origin && u.pathname.endsWith('/share')){ e.respondWith(handleShare(req)); return; }
  if(req.method!=='GET' || u.origin!==location.origin) return;
  if(req.mode==='navigate'){
    // cache first: on weak "net khatam" signal the app still opens instantly; refresh the copy in the background
    var net=fetch(req).then(function(r){ if(r.ok && !r.redirected){ var c=r.clone(); caches.open(V).then(function(k){k.put('./',c);}); } return r; });
    e.respondWith(caches.match('./').then(function(hit){ if(hit){ net.catch(function(){}); return hit; } return net; }));
    return;
  }
  e.respondWith(caches.match(req,{ignoreSearch:true}).then(function(hit){ return hit || fetch(req).then(function(r){ if(r.ok){ var c=r.clone(); caches.open(V).then(function(k){k.put(req,c);}); } return r; }); }));
});
