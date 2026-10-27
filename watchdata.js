/* ===== Sioux Watch Café — shared watch-data helpers =====
   Used by /watchrate/, /watchrate/report.html, /powerreserve/ and /collection/.
   Device label: 'siouxWatchDevice' in localStorage, only stored when the user
   changes it; otherwise derived from the browser. Last backup: see
   backupStatus below. */
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
      (w.log||[]).forEach(function(e){if(e.id==null)e.id="l"+e.t+"_"+e.type;});
    });
  }

  // log = logbook entries from the Collection (purchase, service, event ...)
  var LISTS=[["measurements","t"],["timegrapher","t"],["powerReserve","start"],["log","t"]];

  /* Merge an incoming backup into the local state. Everything new is added,
     everything only present locally is kept, and deletions on either side win.
     A watch's name and details (w.info) and its logbook entries can be edited
     in the Collection; their "edited" field holds the time of that edit, and
     the most recent edit wins.
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
      var added=0,removed=0,updated=false;
      if(iw&&(+iw.edited||0)>(+w.edited||0)){
        w.name=iw.name;w.edited=iw.edited;
        if(iw.info)w.info=iw.info;else delete w.info;
        updated=true;
      }
      LISTS.forEach(function(L){
        var key=L[0],have={},theirs={};
        ((iw&&iw[key])||[]).forEach(function(x){theirs[x.id]=x;});
        var mine=(w[key]||[]).filter(function(x){
          if(gone(x.id)){removed++;return false;}
          have[x.id]=1;return true;
        }).map(function(x){
          var o=theirs[x.id];
          if(o&&(+o.edited||0)>(+x.edited||0)){updated=true;return o;}
          return x;
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
      rows.push({name:w.name,status:!iw?"localOnly":(added||removed||updated)?"changed":"same",added:added,removed:removed,updated:updated});
    });

    (inc.watches||[]).forEach(function(w){
      if(!incById[w.id]||gone(w.id))return;
      LISTS.forEach(function(L){if(w[L[0]])w[L[0]]=w[L[0]].filter(function(x){return !gone(x.id);});});
      if(w.prCurrent&&gone("pr:"+w.prCurrent.start))delete w.prCurrent;
      out.push(w);
      rows.push({name:w.name,status:"new",added:(w.measurements||[]).length+(w.timegrapher||[]).length+(w.powerReserve||[]).length+(w.log||[]).length});
    });

    loc.watches=out;
    loc.deleted=deleted;
    delete loc.exportedFrom;
    if(!out.some(function(w){return w.id===loc.activeWatch;}))loc.activeWatch=out[0]?out[0].id:null;
    return {state:loc,rows:rows};
  }

  /* ----- backup status -----
     'siouxWatchLastBackup' = {at, file}: when this device last saved or shared
     a backup. A download can't be confirmed, so the click counts. */
  var BKEY="siouxWatchLastBackup",DAY=864e5;
  var DUE_DAYS=14,DUE_ITEMS=10;
  function lastBackup(){
    try{var b=JSON.parse(localStorage.getItem(BKEY));return b&&b.at?b:null;}catch(e){return null;}
  }
  function markBackedUp(file,ms){
    try{localStorage.setItem(BKEY,JSON.stringify({at:ms||Date.now(),file:file||""}));}catch(e){}
  }
  // Creation time of an id made by uid() (base-36 Date.now + random), or 0 for
  // ids derived from content (sample data, items from before ids existed).
  function idTime(id){
    if(typeof id!=="string"||!/^[0-9a-z]{9,13}$/.test(id))return 0;
    var ms=parseInt(id.slice(0,8),36);
    return ms>1577836800000&&ms<Date.now()+DAY?ms:0;
  }
  /* {level:"idle"|"ok"|"due", last, count, own}
     own = items made on a device (not samples); count = those created since
     the last backup. Due when something is new and there was never a backup,
     it is DUE_DAYS old, or DUE_ITEMS have piled up. */
  function backupStatus(state,now){
    now=now||Date.now();
    var last=lastBackup(),since=last?last.at:0,own=0,count=0;
    ((state&&state.watches)||[]).forEach(function(w){
      LISTS.forEach(function(L){
        (w[L[0]]||[]).forEach(function(x){
          var ms=idTime(x.id);if(!ms)return;
          own++;if(ms>since)count++;
        });
      });
    });
    var level=!last&&!own?"idle"
      :count&&(!last||now-last.at>=DUE_DAYS*DAY||count>=DUE_ITEMS)?"due":"ok";
    return {level:level,last:last,count:count,own:own};
  }
  // Age of a backup in calendar days (0 = today) plus its time as "14:32"
  function backupAge(ms){
    var d=new Date(ms),today=new Date();today.setHours(0,0,0,0);
    return {days:Math.max(0,Math.round((today-new Date(d.getFullYear(),d.getMonth(),d.getDate()))/DAY)),
      hm:pad(d.getHours())+":"+pad(d.getMinutes())};
  }
  // Save a backup file of state and remember it; returns the file name.
  function downloadBackup(state){
    var now=Date.now(),name=backupName(now);
    var blob=new Blob([JSON.stringify(backupData(state,now),null,2)],{type:"application/json"});
    var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click();
    setTimeout(function(){URL.revokeObjectURL(a.href);},1000);
    markBackedUp(name,now);
    return name;
  }

  /* ----- rate -----
     Sessions start at measurements flagged newStart; the current rate is the
     least-squares slope of the last session, in s/day (same as the Rate Meter). */
  function lastSession(w){
    var pts=((w&&w.measurements)||[]).slice().sort(function(a,b){return a.t-b.t;}),cur=[];
    pts.forEach(function(p){if(p.newStart&&cur.length)cur=[];cur.push(p);});
    return cur;
  }
  function currentRate(w){
    var pts=lastSession(w),n=pts.length;if(n<2)return null;
    var sT=0,sO=0,sTT=0,sTO=0;
    pts.forEach(function(p){sT+=p.t;sO+=p.offset;sTT+=p.t*p.t;sTO+=p.t*p.offset;});
    var den=n*sTT-sT*sT;if(den===0)return null;
    return {rate:(n*sTO-sT*sO)/den*DAY,n:n,span:pts[n-1].t-pts[0].t};
  }

  return {getDevice:getDevice,setDevice:setDevice,guessDevice:guessDevice,
    backupName:backupName,backupData:backupData,
    lastBackup:lastBackup,markBackedUp:markBackedUp,backupStatus:backupStatus,backupAge:backupAge,downloadBackup:downloadBackup,
    markDeleted:markDeleted,markWatchDeleted:markWatchDeleted,ensureIds:ensureIds,merge:merge,
    currentRate:currentRate};
})();
