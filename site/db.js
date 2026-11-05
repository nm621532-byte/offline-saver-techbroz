// Offline Saver — tiny IndexedDB layer shared by the page and the service worker
var OSDB = (function(){
  var NAME='offline-saver', STORE='items', dbp;
  function open(){
    if(dbp) return dbp;
    dbp = new Promise(function(res,rej){
      var r = indexedDB.open(NAME,1);
      r.onupgradeneeded = function(){ var s=r.result.createObjectStore(STORE,{keyPath:'id'}); s.createIndex('date','date'); };
      r.onsuccess = function(){ res(r.result); };
      r.onerror = function(){ rej(r.error); };
    });
    return dbp;
  }
  function tx(mode, fn){
    return open().then(function(db){ return new Promise(function(res,rej){
      var t=db.transaction(STORE,mode), s=t.objectStore(STORE), out=fn(s);
      t.oncomplete=function(){ res(out && 'result' in out ? out.result : out); };
      t.onerror=function(){ rej(t.error); }; t.onabort=function(){ rej(t.error||new Error('aborted')); };
    });});
  }
  function kindOf(type,name){
    type=(type||'').toLowerCase(); name=(name||'').toLowerCase();
    if(type.indexOf('video/')===0||/\.(mp4|webm|mkv|3gp|mov)$/.test(name)) return 'video';
    if(type.indexOf('audio/')===0||/\.(mp3|m4a|aac|ogg|opus|wav|amr)$/.test(name)) return 'audio';
    if(type==='application/pdf'||/\.pdf$/.test(name)) return 'pdf';
    if(type.indexOf('image/')===0||/\.(jpe?g|png|gif|webp|heic)$/.test(name)) return 'image';
    if(type.indexOf('text/')===0||/\.(txt|md|html?)$/.test(name)) return 'text';
    return 'other';
  }
  function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,8); }
  return {
    kindOf:kindOf,
    addFile:function(file){
      var it={id:uid(),kind:kindOf(file.type,file.name),name:file.name||'file',type:file.type||'application/octet-stream',size:file.size,date:Date.now(),blob:file};
      return tx('readwrite',function(s){ s.put(it); }).then(function(){ return it; });
    },
    addText:function(title,text,url,kind){
      var it={id:uid(),kind:kind||'text',name:title||(text||url||'Note').slice(0,60),type:'text/plain',size:new Blob([text||'']).size,date:Date.now(),text:text||'',url:url||''};
      return tx('readwrite',function(s){ s.put(it); }).then(function(){ return it; });
    },
    all:function(){ return tx('readonly',function(s){ return s.getAll(); }); },
    get:function(id){ return tx('readonly',function(s){ return s.get(id); }); },
    del:function(id){ return tx('readwrite',function(s){ s.delete(id); }); }
  };
})();
