/* ===== Sioux Watch Café — shared watch-data helpers =====
   Used by /watchrate/, /watchrate/viewer.html and /powerreserve/.
   Device label: 'siouxWatchDevice' in localStorage, only stored when the user
   changes it; otherwise derived from the browser. */
var WatchData=(function(){
  var DKEY="siouxWatchDevice";

  function guessDevice(){
    var ua=navigator.userAgent||"";
    if(/iPad/.test(ua)||(/Macintosh/.test(ua)&&navigator.maxTouchPoints>1))return "iPad";
    if(/iPhone|iPod/.test(ua))return "iPhone";
    if(/Android/.test(ua))return /Mobile/.test(ua)?"Android phone":"Android tablet";
    if(/CrOS/.test(ua))return "Chromebook";
    if(/Macintosh|Mac OS X/.test(ua))return "Mac";
    if(/Windows/.test(ua))return "Windows";
    if(/Linux/.test(ua))return "Linux";
    return "Browser";
  }
  function getDevice(){
    try{return localStorage.getItem(DKEY)||guessDevice();}catch(e){return guessDevice();}
  }
  function setDevice(name){
    name=(name||"").replace(/\s+/g," ").trim().slice(0,40);
    try{
      if(name&&name!==guessDevice())localStorage.setItem(DKEY,name);
      else localStorage.removeItem(DKEY);
    }catch(e){}
    return getDevice();
  }

  function pad(n){return ("0"+n).slice(-2);}
  function slug(s){return s.replace(/[^A-Za-z0-9]+/g,"-").replace(/^-|-$/g,"")||"device";}
  function backupName(ms){
    var d=new Date(ms||Date.now());
    return "watchrate-"+slug(getDevice())+"-"+d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())
      +"-"+pad(d.getHours())+pad(d.getMinutes())+".json";
  }
  // Copy of the state with an origin stamp; the stamp survives renamed files.
  function backupData(state,ms){
    var out={};
    for(var k in state)if(k!=="exportedFrom")out[k]=state[k];
    out.exportedFrom={device:getDevice(),at:ms||Date.now()};
    return out;
  }

  /* ----- deletions -----
     state.deleted = { <id>: <ms> } remembers what was removed, so merging an
     older backup doesn't bring it back. Ids are unique across watches,
     measurements, timegrapher sessions and power-reserve entries. A running
     power-reserve measurement has no id and is recorded as "pr:<start>". */
  function markDeleted(state,id){
    if(id==null)return;
    if(!state.deleted||typeof state.deleted!=="object")state.deleted={};
    state.deleted[String(id)]=Date.now();
  }
  function markWatchDeleted(state,w){
    markDeleted(state,w.id);
    if(w.prCurrent&&w.prCurrent.start)markDeleted(state,"pr:"+w.prCurrent.start);
  }

  // Items saved before ids existed (e.g. sample data) get an id derived from
  // their content, so the same item matches on every device.
  function ensureIds(watches){
    (watches||[]).forEach(function(w){
      (w.measurements||[]).forEach(function(m){if(m.id==null)m.id="m"+m.t+"_"+m.offset;});
      (w.timegrapher||[]).forEach(function(s){if(s.id==null)s.id="g"+s.t;});
      (w.powerReserve||[]).forEach(function(p){if(p.id==null)p.id="p"+p.start;});
    });
  }

  var LISTS=[["measurements","t"],["timegrapher","t"],["powerReserve","start"]];

  /* Merge an incoming backup into the local state. Everything new is added,
     everything only present locally is kept, and deletions on either side win.
     Returns {state, rows}: one row per watch for the import dialog, with
     status "new" | "changed" | "same" | "localOnly" | "removed". */
  function merge(local,incoming){
    var inc=JSON.parse(JSON.stringify(incoming));
    var loc=JSON.parse(JSON.stringify(local));
    ensureIds(loc.watches);ensureIds(inc.watches);
    var deleted={},k;
    [loc.deleted,inc.deleted].forEach(function(d){
      if(d&&typeof d==="object")for(k in d)deleted[k]=Math.max(deleted[k]||0,+d[k]||0);
    });
    function gone(id){return id!=null&&deleted.hasOwnProperty(String(id));}
    var incById={};
    (inc.watches||[]).forEach(function(w){incById[w.id]=w;});
    var out=[],rows=[];

    (loc.watches||[]).forEach(function(w){
      var iw=incById[w.id];delete incById[w.id];
      if(gone(w.id)){rows.push({name:w.name,status:"removed"});return;}
      var added=0,removed=0;
      LISTS.forEach(function(L){
        var key=L[0],have={};
        var mine=(w[key]||[]).filter(function(x){
          if(gone(x.id)){removed++;return false;}
          have[x.id]=1;return true;
        });
        ((iw&&iw[key])||[]).forEach(function(x){
          if(!have[x.id]&&!gone(x.id)){mine.push(x);have[x.id]=1;added++;}
        });
        mine.sort(function(a,b){return a[L[1]]-b[L[1]];});
        if(mine.length||w[key])w[key]=mine;
      });
      // running power-reserve measurement: the newest one that wasn't finished or discarded
      var runs=[w.prCurrent,iw&&iw.prCurrent].filter(function(p){return p&&p.start&&!gone("pr:"+p.start);});
      var run=runs.sort(function(a,b){return b.start-a.start;})[0];
      if(w.prCurrent&&!run){removed++;delete w.prCurrent;}
      else if(run&&run!==w.prCurrent){added++;w.prCurrent=run;}
      out.push(w);
      rows.push({name:w.name,status:!iw?"localOnly":(added||removed)?"changed":"same",added:added,removed:removed});
    });

    (inc.watches||[]).forEach(function(w){
      if(!incById[w.id]||gone(w.id))return;
      LISTS.forEach(function(L){if(w[L[0]])w[L[0]]=w[L[0]].filter(function(x){return !gone(x.id);});});
      if(w.prCurrent&&gone("pr:"+w.prCurrent.start))delete w.prCurrent;
      out.push(w);
      rows.push({name:w.name,status:"new",added:(w.measurements||[]).length+(w.timegrapher||[]).length+(w.powerReserve||[]).length});
    });

    loc.watches=out;
    loc.deleted=deleted;
    delete loc.exportedFrom;
    if(!out.some(function(w){return w.id===loc.activeWatch;}))loc.activeWatch=out[0]?out[0].id:null;
    return {state:loc,rows:rows};
  }

  return {getDevice:getDevice,setDevice:setDevice,guessDevice:guessDevice,
    backupName:backupName,backupData:backupData,
    markDeleted:markDeleted,markWatchDeleted:markWatchDeleted,ensureIds:ensureIds,merge:merge};
})();
