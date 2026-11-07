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
  /* state.restored = { <id>: <ms> }: a deleted watch brought back from a backup.
     An id counts as deleted while its deletion is newer than its restore, so the
     restore carries over to other devices and a later delete still wins. */
  function deletedAt(state,id){
    var d=state&&state.deleted&&+state.deleted[String(id)]||0,r=state&&state.restored&&+state.restored[String(id)]||0;
    return d>r?d:0;
  }
  function markRestored(state,w){
    if(!state.restored||typeof state.restored!=="object")state.restored={};
    var now=Date.now();
    state.restored[String(w.id)]=now;
    if(w.prCurrent&&w.prCurrent.start)state.restored["pr:"+w.prCurrent.start]=now;
  }

  // Items saved before ids existed (e.g. sample data) get an id derived from
  // their content, so the same item matches on every device.
  function ensureIds(watches){
    (watches||[]).forEach(function(w){
      (w.measurements||[]).forEach(function(m){if(m.id==null)m.id="m"+m.t+"_"+m.offset;});
      (w.timegrapher||[]).forEach(function(s){if(s.id==null)s.id="g"+s.t;});
      (w.powerReserve||[]).forEach(function(p){if(p.id==null)p.id="p"+p.start;});
      (w.log||[]).forEach(function(e){if(e.id==null)e.id="l"+e.t+"_"+e.type;});
      (w.worn||[]).forEach(function(x){if(x.id==null)x.id="n"+x.t;});
    });
  }

  // log = logbook entries from the Collection (purchase, service, event ...);
  // worn = days the watch was worn ({id, t} with t = the day at 00:00 UTC)
  var LISTS=[["measurements","t"],["timegrapher","t"],["powerReserve","start"],["log","t"],["worn","t"]];

  /* Merge an incoming backup into the local state. Everything new is added,
     everything only present locally is kept, and deletions on either side win.
     A watch's name and details (w.info) and its logbook entries can be edited
     in the Collection; their "edited" field holds the time of that edit, and
     the most recent edit wins.
     Returns {state, rows}: one row per watch for the import dialog, with
     status "new" | "changed" | "same" | "localOnly" | "removed" and the watch id. */
  function merge(local,incoming){
    var inc=JSON.parse(JSON.stringify(incoming));
    var loc=JSON.parse(JSON.stringify(local));
    ensureIds(loc.watches);ensureIds(inc.watches);
    var deleted={},restored={},k;
    [[loc.deleted,deleted],[inc.deleted,deleted],[loc.restored,restored],[inc.restored,restored]].forEach(function(p){
      var d=p[0];if(d&&typeof d==="object")for(k in d)p[1][k]=Math.max(p[1][k]||0,+d[k]||0);
    });
    function gone(id){return id!=null&&deleted.hasOwnProperty(String(id))&&deleted[id]>(restored[id]||0);}
    var incById={};
    (inc.watches||[]).forEach(function(w){incById[w.id]=w;});
    var out=[],rows=[];

    (loc.watches||[]).forEach(function(w){
      var iw=incById[w.id];delete incById[w.id];
      if(gone(w.id)){rows.push({id:w.id,name:w.name,status:"removed"});return;}
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
      // "End session" flag: the latest change wins
      if(iw&&iw.rateEnd&&(+iw.rateEnd.edited||0)>(+(w.rateEnd&&w.rateEnd.edited)||0)){w.rateEnd=iw.rateEnd;updated=true;}
      // running power-reserve measurement: the newest one that wasn't finished or discarded
      var runs=[w.prCurrent,iw&&iw.prCurrent].filter(function(p){return p&&p.start&&!gone("pr:"+p.start);});
      var run=runs.sort(function(a,b){return b.start-a.start;})[0];
      if(w.prCurrent&&!run){removed++;delete w.prCurrent;}
      else if(run&&run!==w.prCurrent){added++;w.prCurrent=run;}
      out.push(w);
      rows.push({id:w.id,name:w.name,status:!iw?"localOnly":(added||removed||updated)?"changed":"same",added:added,removed:removed,updated:updated});
    });

    (inc.watches||[]).forEach(function(w){
      if(!incById[w.id]||gone(w.id))return;
      LISTS.forEach(function(L){if(w[L[0]])w[L[0]]=w[L[0]].filter(function(x){return !gone(x.id);});});
      if(w.prCurrent&&gone("pr:"+w.prCurrent.start))delete w.prCurrent;
      out.push(w);
      rows.push({id:w.id,name:w.name,status:"new",added:(w.measurements||[]).length+(w.timegrapher||[]).length+(w.powerReserve||[]).length+(w.log||[]).length+(w.worn||[]).length});
    });

    loc.watches=out;
    loc.deleted=deleted;
    if(Object.keys(restored).length)loc.restored=restored;
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
     least-squares slope of the last session, in s/day (same as the Rate Meter).
     previousRate is the rate of the latest earlier session that has one, for
     while a new session has only its first measurement.
     A measurement flagged restart ("Reset, same session") keeps the session but
     lets the offset jump: the watch was set or had stopped. The session then
     falls into pieces, each with its own intercept, and the rate is one common
     slope over all pieces (pooled least squares). Without restarts this is the
     plain regression. */
  function sessions(w){
    var pts=((w&&w.measurements)||[]).slice().sort(function(a,b){return a.t-b.t;}),segs=[],cur=[];
    pts.forEach(function(p){if(p.newStart&&cur.length){segs.push(cur);cur=[];}cur.push(p);});
    if(cur.length)segs.push(cur);
    return segs;
  }
  function lastSession(w){var s=sessions(w);return s.length?s[s.length-1]:[];}
  function currentRate(w){return rateOf(lastSession(w));}
  function previousRate(w){
    var s=sessions(w);
    for(var i=s.length-2;i>=0;i--){var r=rateOf(s[i]);if(r){r.end=s[i][s[i].length-1].t;return r;}}
    return null;
  }
  // split time-sorted measurements at restart flags
  function pieces(pts){
    var out=[],cur=[];
    pts.forEach(function(p){if(p.restart&&cur.length){out.push(cur);cur=[];}cur.push(p);});
    if(cur.length)out.push(cur);
    return out;
  }
  // pooled fit over pieces of {t, offset}: rate in s/day, r2, and a fitted line per piece
  function fitPieces(ps){
    var n=0,sxx=0,sxy=0,syy=0,t0=Infinity,t1=-Infinity,ms=[];
    ps.forEach(function(p){
      var k=p.length,mt=0,mo=0;if(!k)return;
      p.forEach(function(q){mt+=q.t;mo+=q.offset;t0=Math.min(t0,q.t);t1=Math.max(t1,q.t);});
      mt/=k;mo/=k;n+=k;ms.push({p:p,mt:mt,mo:mo});
      p.forEach(function(q){var x=q.t-mt,y=q.offset-mo;sxx+=x*x;sxy+=x*y;syy+=y*y;});
    });
    if(n<2||!sxx)return null;
    var b=sxy/sxx,lines=ms.filter(function(m){return m.p.length>1;}).map(function(m){
      var a=m.p[0].t,z=m.p[m.p.length-1].t;
      return {t0:a,t1:z,o0:m.mo+b*(a-m.mt),o1:m.mo+b*(z-m.mt)};});
    // spread: residual standard deviation (s); margin: ~95% interval on the rate (s/day).
    // Degrees of freedom: one intercept per piece plus the shared slope.
    // The residual sd never counts below the rounding noise of whole-second readings (1/sqrt(12) s).
    var sse=Math.max(syy-b*sxy,0),dof=n-ms.length-1,spread=null,margin=null;
    if(dof>0){
      spread=Math.sqrt(sse/dof);
      margin=tCrit(dof)*Math.max(spread,ROUND_SD)/Math.sqrt(sxx)*DAY;
    }
    return {rate:b*DAY,n:n,span:t1-t0,r2:syy>0?1-sse/syy:null,spread:spread,margin:margin,dof:dof,lines:lines};
  }
  var ROUND_SD=1/Math.sqrt(12);
  // two-sided 95% Student-t critical value
  function tCrit(dof){
    var T=[0,12.71,4.30,3.18,2.78,2.57,2.45,2.36,2.31,2.26,2.23,2.20,2.18,2.16,2.14,2.13,2.12,2.11,2.10,2.09,2.09];
    return dof<T.length?T[dof]:dof<30?2.06:dof<60?2.02:1.98;
  }
  function rateOf(pts){return fitPieces(pieces(pts));}

  /* ----- positions -----
     Colours on a dark background (Rate Meter, Viewer); the report keeps its own
     darker set for paper. Worn has the chart green: it is the most common
     position, and a timegrapher can't measure it. */
  var POS_COLOR={dial_up:"#f0a03a",dial_down:"#cf7f35",crown_up:"#35c2b1",crown_down:"#5b93cf",
    crown_left:"#a98bd4",crown_right:"#e0678a",worn:"#3be35b"},NO_POS="#8a8a8a";
  var POS_ORDER=["worn","dial_up","dial_down","crown_up","crown_down","crown_left","crown_right"];
  function posColor(c){return POS_COLOR[c]||NO_POS;}
  var MIN_RATE_GAP=6*3600000;
  /* Rate points of time-sorted measurements: per piece between resets, one point
     per interval of at least 6 hours, placed at its end. pos = the position all
     measurements of that interval share ("" = none given), or null when they
     differ: then the interval can't be put down to one position. */
  function ratePoints(pts){
    return pieces(pts).map(function(pc){
      var out=[],from=0;
      for(var i=1;i<pc.length;i++){
        var a=pc[from],b=pc[i],dt=b.t-a.t;
        if(dt<MIN_RATE_GAP)continue;
        var ps={};for(var j=from;j<=i;j++)ps[pc[j].position||""]=1;
        var k=Object.keys(ps);
        out.push({t:b.t,from:a.t,v:(b.offset-a.offset)/dt*DAY,pos:k.length===1?k[0]:null,
          path:k.length===1?null:pc.slice(from,i+1).map(function(m){return m.position||"";})});
        from=i;
      }
      return out;
    }).filter(function(s){return s.length;});
  }
  /* Rate per position: each unbroken run of one position (within a piece) gets
     its own intercept, with one shared slope, so the drift while the watch lay
     otherwise never counts. Returns [{code, n, rate, fit}] in POS_ORDER, then
     other codes; "" (no position given) last. */
  function positionRates(pts){
    var runs={},n={};
    pieces(pts).forEach(function(pc){
      var cur=null,code=null;
      pc.forEach(function(m){
        var c=m.position||"";n[c]=(n[c]||0)+1;
        if(c!==code){code=c;cur=[];(runs[c]=runs[c]||[]).push(cur);}
        cur.push(m);
      });
    });
    return Object.keys(n).sort(function(a,b){
      var ia=a===""?99:POS_ORDER.indexOf(a),ib=b===""?99:POS_ORDER.indexOf(b);
      return (ia<0?50:ia)-(ib<0?50:ib)||a.localeCompare(b);
    }).map(function(c){var f=fitPieces(runs[c]);return {code:c,n:n[c],rate:f?f.rate:null,fit:f};});
  }
  /* Timegrapher readings per position over the given sessions:
     {code: {rate, amp, n, list:[{t, rate, amp, beat}]}}; rate and amp are averages. */
  function tgByPosition(sessions){
    var o={};
    (sessions||[]).forEach(function(s){(s.readings||[]).forEach(function(r){
      var c=r.position||"",x=o[c]=o[c]||{list:[]};
      x.list.push({t:s.t,rate:+r.rate,amp:r.amplitude!=null&&r.amplitude!==""?+r.amplitude:null,beat:r.beatError!=null&&r.beatError!==""?+r.beatError:null});
    });});
    Object.keys(o).forEach(function(c){
      var l=o[c].list,a=l.filter(function(x){return x.amp!=null&&isFinite(x.amp);});
      o[c].n=l.length;
      o[c].rate=l.reduce(function(s,x){return s+x.rate;},0)/l.length;
      o[c].amp=a.length?a.reduce(function(s,x){return s+x.amp;},0)/a.length:null;
    });
    return o;
  }

  /* ----- session state -----
     w.rateEnd = {at, edited}: "End session" in the Rate Meter. at = when it was
     ended (null after Undo), edited = time of that change, so the latest wins
     when merging. A measurement after `at` starts a new session, so the flag
     only ends the session it was set on.
     rateSession(w) = {start, last, n, gap, ended, quiet} for the last session,
     or null without measurements. gap = median time between its measurements
     (at least a day); quiet = no measurement for 3 gaps, so a quartz watch
     measured monthly stays active for months. Quiet is a hint only: nothing
     in the data changes. */
  function ended(w){
    var e=w&&w.rateEnd,pts=lastSession(w);
    return !!(e&&e.at&&pts.length&&pts[pts.length-1].t<=e.at);
  }
  function rateSession(w,now){
    var pts=lastSession(w),n=pts.length;if(!n)return null;
    now=now||Date.now();
    var gaps=[];for(var i=1;i<n;i++)gaps.push(pts[i].t-pts[i-1].t);
    gaps.sort(function(a,b){return a-b;});
    var gap=gaps.length?Math.max(DAY,gaps[gaps.length>>1]):DAY,last=pts[n-1].t;
    return {start:pts[0].t,last:last,n:n,gap:gap,ended:ended(w),quiet:n>=3&&now-last>3*gap};
  }

  /* Order for watch lists you pick from (Wearing today chips, report): current
     watches first, most worn over the past year on top, then by name; sold or
     gifted watches last. Days are counted up to yesterday, so a chip does not
     jump while you tap it today. Returns a sorted copy. */
  function lastLogOf(w,types){
    return (w.log||[]).slice().sort(function(a,b){return b.t-a.t;}).find(function(e){return types.indexOf(e.type)>-1;})||null;
  }
  function isFormer(w){var e=lastLogOf(w,["purchase","sold"]);return !!(e&&e.type==="sold");}
  function wornCount(w,now){
    var d=new Date(now||Date.now()),today=Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()),from=today-365*DAY,o={};
    (w.worn||[]).forEach(function(x){if(x.t>=from&&x.t<today)o[x.t]=1;});
    return Object.keys(o).length;
  }
  function wearOrder(list,now){
    return list.map(function(w){return {w:w,f:isFormer(w),n:wornCount(w,now)};}).sort(function(a,b){
      return a.f-b.f||b.n-a.n||String(a.w.name||"").localeCompare(String(b.w.name||""));
    }).map(function(r){return r.w;});
  }

  return {getDevice:getDevice,setDevice:setDevice,guessDevice:guessDevice,
    backupName:backupName,backupData:backupData,
    lastBackup:lastBackup,markBackedUp:markBackedUp,backupStatus:backupStatus,backupAge:backupAge,downloadBackup:downloadBackup,
    markDeleted:markDeleted,markWatchDeleted:markWatchDeleted,deletedAt:deletedAt,markRestored:markRestored,idTime:idTime,ensureIds:ensureIds,merge:merge,
    currentRate:currentRate,previousRate:previousRate,pieces:pieces,fitPieces:fitPieces,rateOf:rateOf,rateSession:rateSession,
    POS_ORDER:POS_ORDER,posColor:posColor,ratePoints:ratePoints,positionRates:positionRates,tgByPosition:tgByPosition,
    wornCount:wornCount,wearOrder:wearOrder};
})();
