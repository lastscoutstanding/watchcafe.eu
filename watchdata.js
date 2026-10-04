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

  return {getDevice:getDevice,setDevice:setDevice,guessDevice:guessDevice,
    backupName:backupName,backupData:backupData};
})();
