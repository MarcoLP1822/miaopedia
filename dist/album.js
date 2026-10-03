(function(root){
  'use strict';
  function createAlbum(storage, ids, key='miaopedia.album.v1') {
    const allowed=new Set(ids);
    const clean=value=>new Set(Array.isArray(value)?value.filter(id=>allowed.has(id)):[]);
    let saved={};
    let persistent=Boolean(storage);
    let raw='{}';
    try { raw=storage?.getItem(key)||'{}'; } catch { persistent=false; }
    try { saved=JSON.parse(raw)||{}; } catch { saved={}; }
    const favorites=clean(saved.favorites), seen=clean(saved.seen);
    function persist(){
      try { if(!storage)throw new Error('No storage');storage.setItem(key,JSON.stringify({favorites:[...favorites],seen:[...seen]})); }
      catch { persistent=false; }
    }
    return {
      favorites, seen,
      get persistent(){return persistent;},
      visit(id){if(!allowed.has(id)||seen.has(id))return false;seen.add(id);persist();return true;},
      toggle(id){if(!allowed.has(id))return false;favorites.has(id)?favorites.delete(id):favorites.add(id);persist();return favorites.has(id);},
      clear(){favorites.clear();seen.clear();persist();}
    };
  }
  if(typeof module==='object'&&module.exports)module.exports={createAlbum};
  else root.MiaoAlbum={createAlbum};
})(typeof window==='object'?window:globalThis);
