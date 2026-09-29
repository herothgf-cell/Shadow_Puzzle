/* Storage migration only: never changes puzzle rules or deletes legacy saves. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ShadowProgress=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const KEY='shadow-morph-campaign40-v8';
 const LEGACY_IDS=["rebuild-01", "rebuild-02", "rebuild-03", "rebuild-04", "rebuild-05", "rebuild-06", "rebuild-07", "rebuild-08", "rebuild-09", "rebuild-10", "rebuild-11", "rebuild-12", "rebuild-13", "rebuild-14", "platform-15", "platform-16", "platform-17", "platform-18", "platform-19"];
 function normalize(raw){
  raw=raw&&typeof raw==='object'?raw:{};
  const source=Array.isArray(raw.completedIds)?raw.completedIds:(Array.isArray(raw.completed)?raw.completed:[]).filter(i=>Number.isInteger(i)&&i>=0&&i<LEGACY_IDS.length).map(i=>LEGACY_IDS[i]);
  return {game:raw.game||null,fine:!!raw.fine,completedIds:[...new Set(source.filter(id=>typeof id==='string'&&id.length>0&&id.length<100))]};
 }
 function read(storage){
  for(const key of [KEY,'shadow-morph-v7-platforms','shadow-morph-v6-rebuild']){
   const text=storage.getItem(key);if(!text)continue;
   try{const raw=JSON.parse(text);if(raw&&typeof raw==='object')return normalize(raw);}catch(_){}
  }
  return normalize(null);
 }
 return {KEY,LEGACY_IDS,normalize,read};
});
