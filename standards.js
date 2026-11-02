/* ===== watchcafe.eu — accuracy standards =====
   Reads /standards.txt (Label | Name | min | max | aliases).
     Standards.list()          the standards in file order: { id, label, name, lo, hi }
     Standards.spec(text)      a watch's spec (w.info.spec): a standard from the
                               list by label, name or alias, or a range of its own
                               ("-2/+4", "±2", "±15 s/month") as { id:"own", lo, hi };
                               null when it can't be read
     Standards.fmt(s)          "−4 / +6" or "±2"
   Before the list has loaded, Standards.loaded is false; the "swcstandards"
   event fires on window once it has.
   Use: <script src="/standards.js?v=1"></script> */
(function(){
  var list=[];
  function key(s){
    return String(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"");
  }
  function num(s){return parseFloat(String(s).replace(/−/g,"-").replace(",","."));}

  function parse(txt){
    list=[];
    String(txt||"").split(/\r?\n/).forEach(function(line){
      line=line.trim();if(!line||line.charAt(0)==="#")return;
      var p=line.split("|").map(function(x){return x.trim();});
      var lo=num(p[2]),hi=num(p[3]);
      if(!p[0]||!isFinite(lo)||!isFinite(hi))return;
      var keys=[p[0],p[1]].concat((p[4]||"").split(";")).map(key).filter(Boolean);
      list.push({id:key(p[0]),label:p[0],name:p[1]||p[0],lo:Math.min(lo,hi),hi:Math.max(lo,hi),keys:keys});
    });
  }

  function spec(text){
    var k=key(text);if(!k)return null;
    for(var i=0;i<list.length;i++)if(list[i].keys.indexOf(k)>-1)return list[i];
    // a range of its own; per month or year is converted to per day
    var t=String(text).replace(/−/g,"-").replace(/\+\s*\/\s*-|\+-/g,"±");
    var ns=(t.match(/[±+-]?\s*\d+(?:[.,]\d+)?/g)||[]).map(function(m){return m.replace(/\s/g,"");});
    if(!ns.length||ns.length>2)return null;
    var per=/month|maand|mnd/i.test(t)?30.44:/year|jaar/i.test(t)?365.25:1;
    var lo,hi;
    if(ns.length===1){var a=Math.abs(num(ns[0].replace("±","")));lo=-a;hi=a;}
    else{var x=num(ns[0].replace("±","")),y=num(ns[1].replace("±",""));lo=Math.min(x,y);hi=Math.max(x,y);}
    if(!isFinite(lo)||!isFinite(hi))return null;
    function r(v){return Math.round(v/per*10)/10;}
    return {id:"own",label:null,name:null,lo:r(lo),hi:r(hi)};
  }

  function sgn(v){return (v>0?"+":v<0?"−":"")+Math.abs(v);}
  function fmt(s){return s.lo===-s.hi?"±"+s.hi:sgn(s.lo)+" / "+sgn(s.hi);}

  window.Standards={loaded:false,list:function(){return list.slice();},spec:spec,fmt:fmt};
  fetch("/standards.txt",{cache:"no-store"}).then(function(r){return r.ok?r.text():"";}).catch(function(){return "";})
    .then(function(txt){parse(txt);Standards.loaded=true;window.dispatchEvent(new Event("swcstandards"));});
})();
