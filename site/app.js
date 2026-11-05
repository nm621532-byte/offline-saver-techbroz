(function(){
var $=function(s){return document.querySelector(s);}, kind='all', items=[], urls=[];
function fmt(b){ if(b<1024) return b+' B'; var u=['KB','MB','GB','TB'],i=-1; do{b/=1024;i++;}while(b>=1024&&i<3); return (b<10?b.toFixed(1):Math.round(b))+' '+u[i]; }
function when(t){ var d=new Date(t); return d.toLocaleDateString(undefined,{day:'numeric',month:'short'})+', '+d.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'}); }
function toast(m){ var t=$('#toast'); t.textContent=m; t.classList.add('show'); clearTimeout(toast.h); toast.h=setTimeout(function(){t.classList.remove('show');},3200); }
function el(tag,cls,txt){ var e=document.createElement(tag); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; return e; }

// tabs
function show(t){ document.querySelectorAll('.nav button').forEach(function(b){b.classList.toggle('on',b.dataset.t===t);}); $('#tab-save').hidden=t!=='save'; $('#tab-lib').hidden=t!=='lib'; if(t==='lib') render(); window.scrollTo(0,0); }
document.querySelectorAll('.nav button').forEach(function(b){ b.onclick=function(){show(b.dataset.t);}; });

// network status
function net(){ var n=$('#net'); if(navigator.onLine){ n.textContent='Online — save now'; n.className='net on'; } else { n.textContent='Offline — library works'; n.className='net off'; } }
addEventListener('online',net); addEventListener('offline',net); net();

// storage
var persisted=false;
function askPersist(){ if(persisted||!navigator.storage||!navigator.storage.persist) return Promise.resolve(); return navigator.storage.persist().then(function(p){persisted=p; meter();}); }
function meter(){
  var used=items.reduce(function(a,i){return a+(i.size||0);},0);
  $('#usedBig').textContent=fmt(used);
  $('#count').textContent=items.length?'('+items.length+')':'';
  var p=navigator.storage&&navigator.storage.estimate?navigator.storage.estimate():Promise.resolve(null);
  p.then(function(e){
    if(e&&e.quota){ var free=Math.max(0,e.quota-e.usage); $('#meterSub').textContent=fmt(free)+' more can be saved on this phone'; $('#barFill').style.width=Math.min(100,Math.max(1,e.usage/e.quota*100))+'%'; }
    else $('#meterSub').textContent='Storage size not shown by this browser';
  });
  var ps=navigator.storage&&navigator.storage.persisted?navigator.storage.persisted():Promise.resolve(false);
  ps.then(function(x){ persisted=x; $('#persistLine').textContent=x?'Protected: the phone won’t auto-delete your saves.':'Tip: install the app so the phone keeps your saves safe.'; });
}
function load(){ return OSDB.all().then(function(a){ items=a.sort(function(x,y){return y.date-x.date;}); meter(); if(!$('#tab-lib').hidden) render(); }); }

// save files
$('#filePick').onchange=function(e){
  var fs=[].slice.call(e.target.files||[]); if(!fs.length) return;
  askPersist();
  var n=0, bad=0;
  fs.reduce(function(p,f){ return p.then(function(){ toast('Saving '+f.name+'…'); return OSDB.addFile(f).then(function(){n++;},function(){bad++;}); }); },Promise.resolve())
  .then(function(){ e.target.value=''; toast(bad?('Saved '+n+', '+bad+' failed (phone storage full?)'):('Saved '+n+' file'+(n>1?'s':'')+' ✓ — works offline now')); load(); });
};

// note
$('#noteForm').onsubmit=function(e){ e.preventDefault(); var t=$('#noteText').value.trim(); if(!t) return; askPersist();
  OSDB.addText($('#noteTitle').value.trim(),t,'','text').then(function(){ $('#noteText').value=''; $('#noteTitle').value=''; toast('Note saved ✓'); load(); }); };

// link: direct fetch only (no server in between) — honest about sites that block it
function extract(html,url){
  var doc=new DOMParser().parseFromString(html,'text/html');
  doc.querySelectorAll('script,style,noscript,svg,nav,header,footer,aside,form,iframe').forEach(function(n){n.remove();});
  var root=doc.querySelector('article')||doc.querySelector('main')||doc.body;
  var parts=[]; (root?root.querySelectorAll('h1,h2,h3,h4,p,li,pre,blockquote'):[]).forEach(function(n){ var t=n.textContent.replace(/\s+/g,' ').trim(); if(t.length>1) parts.push(/^H/.test(n.tagName)?'## '+t:t); });
  var text=parts.join('\n\n'); if(text.length<80&&root) text=root.textContent.replace(/[ \t]+/g,' ').replace(/\n\s*\n+/g,'\n\n').trim();
  var first=(parts[0]||text.split('\n')[0]||'').replace(/^#+\s*/,'').slice(0,80);
  return {title:((doc.title||'').trim()||first||url),text:text};
}
$('#linkForm').onsubmit=function(e){ e.preventDefault(); var url=$('#linkIn').value.trim(), m=$('#linkMsg');
  if(!/^https?:\/\//i.test(url)) url='https://'+url;
  if(!navigator.onLine){ m.className='msg bad'; m.textContent='You are offline. Connect to save a page.'; return; }
  m.className='msg'; m.textContent='Fetching page…'; askPersist();
  fetch(url,{mode:'cors'}).then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.text(); })
  .then(function(h){ var p=extract(h,url); if(p.text.length<80) throw new Error('empty'); return OSDB.addText(p.title,p.text,url,'page').then(function(){ m.className='msg good'; m.textContent='Saved “'+p.title.slice(0,60)+'” ✓ readable offline'; $('#linkIn').value=''; load(); }); })
  .catch(function(){ m.className='msg bad'; m.textContent='This site doesn’t allow apps to save it. Open the page, copy the text, and paste it in the box below. (For videos: download them in their own app first, then use “Pick from phone”.)'; });
};

// install prompt
var deferred=null;
addEventListener('beforeinstallprompt',function(e){ e.preventDefault(); deferred=e; $('#installBtn').hidden=false; });
$('#installBtn').onclick=function(){ if(!deferred) return; deferred.prompt(); deferred.userChoice.then(function(){ deferred=null; $('#installBtn').hidden=true; }); };
if(matchMedia('(display-mode: standalone)').matches){ $('#shareHint').textContent='Installed ✓ In Gallery, Files or Chrome tap Share → Offline Saver to save straight here.'; }

// library
$('#q').oninput=render;
document.querySelectorAll('#chips button').forEach(function(b){ b.onclick=function(){ kind=b.dataset.k; document.querySelectorAll('#chips button').forEach(function(x){x.classList.toggle('on',x===b);}); render(); }; });
function freeUrls(){ urls.forEach(function(u){URL.revokeObjectURL(u);}); urls=[]; }
function objUrl(b){ var u=URL.createObjectURL(b); urls.push(u); return u; }
var LABEL={video:'VIDEO',audio:'AUDIO',pdf:'PDF',image:'',text:'NOTE',page:'PAGE',link:'LINK',other:'FILE'};
function render(){
  freeUrls();
  var q=$('#q').value.trim().toLowerCase(), list=$('#list'); list.textContent='';
  var shown=items.filter(function(i){ var k=(i.kind==='page'||i.kind==='link')?'text':i.kind; return (kind==='all'||k===kind) && (!q||(i.name||'').toLowerCase().indexOf(q)>=0||(i.text||'').toLowerCase().indexOf(q)>=0); });
  var tot=shown.reduce(function(a,i){return a+(i.size||0);},0);
  $('#libSum').textContent=items.length?(shown.length+' item'+(shown.length===1?'':'s')+' · '+fmt(tot)):'';
  $('#empty').hidden=items.length>0;
  shown.forEach(function(i){
    var li=el('li','item'), th=el('div','thumb t-'+(i.kind==='page'?'text':i.kind),LABEL[i.kind]);
    if(i.kind==='image'&&i.blob){ th.textContent=''; var im=el('img'); im.alt=''; im.loading='lazy'; im.onerror=function(){ th.textContent='PHOTO'; }; im.src=objUrl(i.blob); th.appendChild(im); }
    var m=el('div','meta'); m.appendChild(el('b',null,i.name)); m.appendChild(el('small',null,fmt(i.size||0)+' · '+when(i.date)+(i.kind==='link'?' · link only, page not saved':'')));
    var o=el('button','open','Open'); o.onclick=function(){open(i.id);};
    var d=el('button','del','Delete'); d.setAttribute('aria-label','Delete '+i.name);
    d.onclick=function(){ if(confirm('Delete “'+i.name+'”?')) OSDB.del(i.id).then(function(){toast('Deleted');load();}); };
    li.appendChild(th); li.appendChild(m); li.appendChild(o); li.appendChild(d); list.appendChild(li);
  });
}

// viewer
var vurl=null;
function hideV(){ $('#viewer').hidden=true; $('#vBody').textContent=''; $('#vBody').className='vbody'; if(vurl){URL.revokeObjectURL(vurl);vurl=null;} }
function closeV(){ if(location.hash==='#v') history.back(); else hideV(); }
$('#vClose').onclick=closeV;
addEventListener('popstate',function(){ if(!$('#viewer').hidden && location.hash!=='#v') hideV(); });
function open(id){
  OSDB.get(id).then(function(i){ if(!i) return;
    var b=$('#vBody'); b.textContent=''; b.className='vbody'; $('#vTitle').textContent=i.name;
    var acts=el('div','acts');
    if(i.blob){
      vurl=URL.createObjectURL(i.blob);
      if(i.kind==='video'){ var v=el('video'); v.controls=true; v.playsInline=true; v.src=vurl; v.autoplay=true; b.appendChild(v); }
      else if(i.kind==='audio'){ var a=el('audio'); a.controls=true; a.src=vurl; a.autoplay=true; b.appendChild(el('div',null,'🎧')).style.fontSize='64px'; b.appendChild(a); }
      else if(i.kind==='image'){ var im=el('img'); im.src=vurl; im.alt=i.name; b.appendChild(im); }
      else { b.appendChild(el('p',null,i.kind==='pdf'?'Opens in your phone’s PDF viewer.':'Open this file with an app on your phone.')); var op=el('a',null,'Open '+(i.kind==='pdf'?'PDF':'file')); op.href=vurl; op.target='_blank'; op.rel='noopener'; acts.appendChild(op); }
      var dl=el('a',null,'Save copy to phone'); dl.href=vurl; dl.download=i.name; acts.appendChild(dl);
    } else {
      b.classList.add('reader'); var ar=el('article',null,i.text||'');
      if(i.url){ var src=el('p'); var la=el('a',null,'Source: '+i.url); la.href=i.url; la.target='_blank'; la.rel='noopener'; src.appendChild(la); b.appendChild(src); }
      b.appendChild(ar);
      var cp=el('button',null,'Copy text'); cp.onclick=function(){ (navigator.clipboard?navigator.clipboard.writeText(i.text):Promise.reject()).then(function(){toast('Copied');},function(){toast('Copy not allowed here');}); }; acts.appendChild(cp);
    }
    b.appendChild(acts); $('#viewer').hidden=false; history.pushState(null,'','#v');
  });
}

// shared from other apps (Android share target lands here)
var sp=new URLSearchParams(location.search);
if(sp.has('shared')){ var n=+sp.get('shared'), note=sp.get('note');
  setTimeout(function(){ toast(note==='linkonly'?'Link saved — that site blocks page saving, so only the link is kept.':note==='error'?'Could not save that share.':n?('Saved '+n+' from share ✓'):'Nothing to save in that share'); },300);
  history.replaceState(null,'',location.pathname); show('lib'); }

if('serviceWorker' in navigator){ navigator.serviceWorker.register('sw.js?v=3'); }
load();
})();
