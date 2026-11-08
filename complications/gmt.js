/* ===== watchcafe.eu — GMT tab of Complications =====
   Pick three places on the world map (home on the GMT hand, where you are on
   the hour hand, an optional third zone on the bezel) and get the steps for a
   flyer or caller GMT. Time zones come from the browser (Intl), so offsets and
   clock changes are always current. Only the choices are stored, per device,
   in 'siouxWatchGmt'. Needs worldmap.js (window.WorldMap) loaded first.
   The page script calls GMT.show() when the tab opens and GMT.sub() for the
   subtitle; DOM access happens only from show(). */
(function(){
  var LKEY="siouxWatchRateMeterLang", SKEY="siouxWatchGmt", DKEY="siouxWatchRateMeter";
  // [time zone, English name, Dutch name, lon, lat]
  var CITIES=[
    ["Pacific/Honolulu","Honolulu","",-157.86,21.31],["America/Anchorage","Anchorage","",-149.9,61.22],
    ["America/Los_Angeles","Los Angeles","",-118.24,34.05],["America/Denver","Denver","",-104.99,39.74],
    ["America/Chicago","Chicago","",-87.63,41.88],["America/Mexico_City","Mexico City","Mexico-Stad",-99.13,19.43],
    ["America/New_York","New York","",-74,40.71],["America/Bogota","Bogotá","",-74.07,4.71],
    ["America/Lima","Lima","",-77.04,-12.05],["America/Caracas","Caracas","",-66.9,10.48],
    ["America/Santiago","Santiago","",-70.67,-33.45],["America/Sao_Paulo","São Paulo","",-46.63,-23.55],
    ["America/Argentina/Buenos_Aires","Buenos Aires","",-58.38,-34.6],["Atlantic/Reykjavik","Reykjavík","",-21.94,64.15],
    ["Europe/London","London","Londen",-0.13,51.51],["Europe/Lisbon","Lisbon","Lissabon",-9.14,38.72],
    ["Africa/Lagos","Lagos","",3.38,6.52],["Europe/Amsterdam","Amsterdam","",4.9,52.37],
    ["Europe/Zurich","Geneva","Genève",6.14,46.2],["Europe/Madrid","Madrid","",-3.7,40.42],
    ["Europe/Rome","Rome","",12.5,41.9],["Europe/Athens","Athens","Athene",23.73,37.98],
    ["Europe/Helsinki","Helsinki","",24.94,60.17],["Africa/Cairo","Cairo","Caïro",31.24,30.04],
    ["Africa/Johannesburg","Johannesburg","",28.05,-26.2],["Europe/Istanbul","Istanbul","",28.98,41.01],
    ["Europe/Moscow","Moscow","Moskou",37.62,55.75],["Africa/Nairobi","Nairobi","",36.82,-1.29],
    ["Asia/Riyadh","Riyadh","Riyad",46.68,24.71],["Asia/Tehran","Tehran","Teheran",51.39,35.69],
    ["Asia/Dubai","Dubai","",55.27,25.2],["Asia/Karachi","Karachi","",67,24.86],
    ["Asia/Kolkata","Mumbai","",72.88,19.08],["Asia/Kathmandu","Kathmandu","",85.32,27.72],
    ["Asia/Dhaka","Dhaka","",90.41,23.81],["Asia/Bangkok","Bangkok","",100.5,13.76],
    ["Asia/Jakarta","Jakarta","",106.85,-6.21],["Asia/Singapore","Singapore","",103.82,1.35],
    ["Asia/Hong_Kong","Hong Kong","",114.17,22.32],["Asia/Shanghai","Shanghai","",121.47,31.23],
    ["Australia/Perth","Perth","",115.86,-31.95],["Asia/Tokyo","Tokyo","",139.69,35.69],
    ["Asia/Seoul","Seoul","",126.98,37.57],["Australia/Adelaide","Adelaide","",138.6,-34.93],
    ["Australia/Sydney","Sydney","",151.21,-33.87],["Pacific/Auckland","Auckland","",174.76,-36.85]
  ];
  var SLOTS=[{k:"home",c:"#e2483d",m:"H"},{k:"loc",c:"#e9e7e2",m:"L"},{k:"third",c:"#5b9bff",m:"3"}];
  var T={
    en:{
      sub:"Set a second time zone on your watch",
      home:"Home", loc:"Where you are", third:"Third zone", none:"none", noneV:"None",
      homeT:"GMT hand", locT:"Hour hand", thirdT:"Bezel",
      typeLbl:"GMT type", anyWatch:"Any GMT watch",
      flyerHint:"Flyer (“true GMT”): the local hour hand jumps in hour steps and takes the date with it; the GMT hand stays on home time.",
      callerHint:"Caller (“office GMT”): the GMT hand jumps in hour steps on its own; you set the watch itself as usual.",
      fly1:"Crown fully out: set the watch to home time, <b>{t}</b> ({home}). The GMT hand moves along and should point at <b>{h}</b> on the 24-hour scale. Already right? Skip this step.",
      fly2:"Crown to position 2: jump the hour hand <b>{n} {steps} {dir}</b>. The watch keeps running; {date}.",
      flySame:"Same hour where you are and at home: the hour hand stays where it is.",
      call1:"Crown fully out: set the watch to local time, <b>{t}</b> ({loc}).",
      call2:"Crown to position 2: move the GMT hand in hour steps until it points at <b>{h}</b> on the 24-hour scale ({home}, {t}).",
      call3:"Set the date to <b>{d}</b> if needed. On many callers that's also in position 2, turning the other way; check your manual.",
      bezel:"Bezel: turn it <b>{n} {hours} {dir}</b>. The GMT hand then reads {third} on the bezel ({t}).",
      bezelSame:"Bezel: leave 24 at the top; {third} has the same hour as home.",
      step:"step", steps:"steps", hour:"hour", hours:"hours", fwd:"forward", back:"back", ccw:"anticlockwise", cw:"clockwise",
      dateStays:"the date stays", dateFwd:"the date jumps forward to <b>{d}</b>", dateBack:"the date goes back to <b>{d}</b>",
      half:"{list} {is} on {off}. A GMT hand and bezel only step in whole hours, so they can't show this exactly.", isOne:"is", isMany:"are",
      dst:"Next clock change", dstNone:"No clock changes in the coming year for these places.",
      dstItem:"{city}: {d} ({sign}1 h, {hand})", dstLoc:"hour hand", dstHome:"GMT hand", dstBoth:"both hands",
      swipe:"← swipe the map →", map:"World map: tap a city",
      gTitle:"How it works",
      gIntro:"A GMT watch shows a second time zone with an extra hand that goes round once in 24 hours, often with a turning 24-hour bezel for a third zone.",
      g1:"Tap <b>Home</b>, <b>Where you are</b> or <b>Third zone</b>, then a city on the map. Home goes on the GMT hand, where you are on the hour hand, the third zone on the bezel.",
      g2:"Choose your type of GMT. Gave a watch a GMT setting in its details in your Collection? Then you can pick the watch.",
      g3:"Follow the steps. The dial shows how your watch should look now.",
      locale:"en-GB"
    },
    nl:{
      sub:"Zet een tweede tijdzone op je horloge",
      home:"Thuis", loc:"Waar je bent", third:"Derde zone", none:"geen", noneV:"Geen",
      homeT:"GMT-wijzer", locT:"Uurwijzer", thirdT:"Draaibare rand",
      typeLbl:"Soort GMT", anyWatch:"Elk GMT-horloge",
      flyerHint:"Flyer (“echte GMT”): de lokale uurwijzer springt per uur en neemt de datum mee; de GMT-wijzer blijft op thuistijd.",
      callerHint:"Caller (“office GMT”): de GMT-wijzer springt los per uur; het horloge zelf zet je zoals altijd.",
      fly1:"Kroon helemaal uit: zet het horloge op thuistijd, <b>{t}</b> ({home}). De GMT-wijzer loopt mee en moet op <b>{h}</b> van de 24-uursschaal staan. Klopt het al? Sla deze stap over.",
      fly2:"Kroon in stand 2: laat de uurwijzer <b>{n} {steps} {dir}</b> springen. Het horloge blijft lopen; {date}.",
      flySame:"Waar je bent is het hetzelfde uur als thuis: de uurwijzer blijft staan.",
      call1:"Kroon helemaal uit: zet het horloge op lokale tijd, <b>{t}</b> ({loc}).",
      call2:"Kroon in stand 2: zet de GMT-wijzer per uur door tot hij op <b>{h}</b> van de 24-uursschaal staat ({home}, {t}).",
      call3:"Zet zo nodig de datum op <b>{d}</b>. Bij veel callers kan dat ook in stand 2, de andere kant op; kijk in je handleiding.",
      bezel:"Draaibare rand: draai hem <b>{n} {hours} {dir}</b>. De GMT-wijzer wijst dan op de rand de tijd in {third} aan ({t}).",
      bezelSame:"Draaibare rand: laat de 24 bovenaan; in {third} is het hetzelfde uur als thuis.",
      step:"stap", steps:"stappen", hour:"uur", hours:"uur", fwd:"vooruit", back:"terug", ccw:"tegen de klok in", cw:"met de klok mee",
      dateStays:"de datum blijft staan", dateFwd:"de datum springt vooruit naar <b>{d}</b>", dateBack:"de datum gaat terug naar <b>{d}</b>",
      half:"{list} {is} op {off}. Een GMT-wijzer en draaibare rand gaan alleen per heel uur, dus dit kunnen ze niet precies tonen.", isOne:"zit", isMany:"zitten",
      dst:"Volgende tijdwissel", dstNone:"Geen tijdwissel in het komende jaar voor deze plaatsen.",
      dstItem:"{city}: {d} ({sign}1 u, {hand})", dstLoc:"uurwijzer", dstHome:"GMT-wijzer", dstBoth:"beide wijzers",
      swipe:"← veeg over de kaart →", map:"Wereldkaart: tik op een stad",
      gTitle:"Zo werkt het",
      gIntro:"Een GMT-horloge toont een tweede tijdzone met een extra wijzer die in 24 uur één keer rond gaat, vaak met een draaibare 24-uursrand voor een derde zone.",
      g1:"Tik op <b>Thuis</b>, <b>Waar je bent</b> of <b>Derde zone</b> en dan op een stad op de kaart. Thuis komt op de GMT-wijzer, waar je bent op de uurwijzer, de derde zone op de rand.",
      g2:"Kies je soort GMT. Heb je bij een horloge in je Collection bij de gegevens een GMT-soort ingevuld? Dan kun je het horloge kiezen.",
      g3:"Volg de stappen. De wijzerplaat laat zien hoe je horloge er nu uit hoort te zien.",
      locale:"nl-NL"
    }
  };
  function lang(){try{return localStorage.getItem(LKEY)==="nl"?"nl":"en";}catch(e){return "en";}}
  function tr(k,v){var s=T[lang()][k];if(v)for(var p in v)s=s.split("{"+p+"}").join(v[p]);return s;}
  function $(id){return document.getElementById(id);}
  function city(tz){for(var i=0;i<CITIES.length;i++)if(CITIES[i][0]===tz)return CITIES[i];return null;}
  function name(tz){var c=city(tz);return c?(lang()==="nl"&&c[2]||c[1]):tz;}

  /* ===== time zones (all from Intl) ===== */
  // current UTC offset of a zone in hours, e.g. 5.5
  function off(tz,d){
    try{
      var p=new Intl.DateTimeFormat("en",{timeZone:tz,timeZoneName:"longOffset"}).formatToParts(d)
        .filter(function(x){return x.type==="timeZoneName";})[0].value;
      var m=p.match(/([+-])(\d\d):?(\d\d)?/);
      return m?(m[1]==="-"?-1:1)*(+m[2]+(+m[3]||0)/60):0;
    }catch(e){return 0;}
  }
  // a Date whose UTC fields show the wall time in tz
  function at(tz,d){return new Date(d.getTime()+off(tz,d)*36e5);}
  function hm(t){return String(t.getUTCHours()).padStart(2,"0")+":"+String(t.getUTCMinutes()).padStart(2,"0");}
  function fo(o){if(!o)return "UTC";var a=Math.abs(o),h=Math.floor(a),m=Math.round((a-h)*60);return "UTC"+(o<0?"−":"+")+h+(m?":"+String(m).padStart(2,"0"):"");}
  // next change of the UTC offset within ~13 months, to the hour
  function nextChange(tz,d){
    var o=off(tz,d),t=d.getTime();
    for(var i=0;i<400;i++){
      t+=864e5;
      if(off(tz,new Date(t))!==o){
        var lo=t-864e5,hi=t;
        while(hi-lo>36e5){var mid=(lo+hi)/2;if(off(tz,new Date(mid))===o)lo=mid;else hi=mid;}
        return {at:hi,d:off(tz,new Date(hi))-o};
      }
    }
    return null;
  }
  // the city that matches this device: its own zone, else one with the same offset now
  function deviceCity(){
    var tz="";try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone;}catch(e){}
    if(city(tz))return tz;
    var now=new Date(),o=off(tz,now),pre=tz.split("/")[0];
    var same=CITIES.filter(function(c){return off(c[0],now)===o;});
    var reg=same.filter(function(c){return c[0].split("/")[0]===pre;});
    return (reg[0]||same[0]||city("Europe/London"))[0];
  }

  /* ===== state ===== */
  var st=null, act="home";
  function load(){
    var s={};try{s=JSON.parse(localStorage.getItem(SKEY))||{};}catch(e){}
    var dev=deviceCity();
    st={home:city(s.home)?s.home:dev,loc:city(s.loc)?s.loc:dev,third:city(s.third)?s.third:"",
        type:s.type==="caller"?"caller":"flyer",watch:s.watch||""};
  }
  // from a watch card in the Collection: /complications/?watch=<id>#gmt picks that watch once
  function fromLink(){
    var id=null;try{id=new URLSearchParams(location.search).get("watch");}catch(e){}
    if(id===null)return;
    var w=gmtWatches().filter(function(x){return x.id===id;})[0];
    if(w){st.watch=w.id;st.type=w.info.gmt;save();}
    try{history.replaceState(null,"",location.pathname+location.hash);}catch(e){}
  }
  function save(){try{localStorage.setItem(SKEY,JSON.stringify(st));}catch(e){}}
  // watches with a GMT type in their Collection details
  function gmtWatches(){
    var d={};try{d=JSON.parse(localStorage.getItem(DKEY))||{};}catch(e){}
    return (d.watches||[]).filter(function(w){return w.info&&(w.info.gmt==="flyer"||w.info.gmt==="caller");});
  }

  /* ===== map: fixed land path from worldmap.js, Natural Earth I projection ===== */
  var WM=window.WorldMap||{w:640,h:273,top:80,land:""};
  var K=WM.w/(2*0.8707*Math.PI);
  function ne(lon,lat){
    var l=lon*Math.PI/180,p=lat*Math.PI/180,p2=p*p,p4=p2*p2;
    return [l*(0.8707-0.131979*p2+p4*(-0.013791+p4*(0.003971*p2-0.001529*p4))),
            p*(1.007226+p2*(0.015085+p4*(-0.044475+0.028874*p2-0.005916*p4)))];
  }
  var Y0=ne(0,WM.top)[1];
  function px(lon,lat){var q=ne(lon,lat);return [WM.w/2+K*q[0],K*(Y0-q[1])];}
  // night side: where the sun is below the horizon (declination and hour angle,
  // no equation of time, so within a few degrees)
  function nightPath(now){
    var y0=Date.UTC(now.getUTCFullYear(),0,0),doy=(now.getTime()-y0)/864e5;
    var dec=-23.44*Math.cos(2*Math.PI*(doy+10)/365);
    if(Math.abs(dec)<0.1)dec=dec<0?-0.1:0.1;
    var u=now.getUTCHours()+now.getUTCMinutes()/60,sunLon=(12-u)*15,td=Math.tan(dec*Math.PI/180),pts=[];
    for(var lon=-180;lon<=180;lon+=3){
      var lat=Math.atan(-Math.cos((lon-sunLon)*Math.PI/180)/td)*180/Math.PI;
      pts.push(px(lon,lat));
    }
    var pole=dec>0?-90:90;
    pts.push(px(180,pole));pts.push(px(-180,pole));
    return "M"+pts.map(function(p){return p[0].toFixed(1)+" "+p[1].toFixed(1);}).join("L")+"Z";
  }
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
  function drawMap(now){
    var s='<rect width="'+WM.w+'" height="'+WM.h+'" fill="#141418"/><path d="'+WM.land+'" fill="#3b3b46"/>'
      +'<path d="'+nightPath(now)+'" fill="#000" fill-opacity=".32"/>';
    var sel={};
    SLOTS.forEach(function(q){if(st[q.k])(sel[st[q.k]]=sel[st[q.k]]||[]).push(q);});
    CITIES.forEach(function(c){
      if(sel[c[0]])return;
      var p=px(c[3],c[4]);
      s+='<g class="dot" data-z="'+c[0]+'"><title>'+esc(name(c[0])+" · "+fo(off(c[0],now)))+'</title>'
        +'<circle class="hit" cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="9"/>'
        +'<circle class="v" cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="3.5" fill="#8b8894"/></g>';
    });
    // chosen cities last, so their labels are on top
    Object.keys(sel).forEach(function(z){
      var c=city(z),p=px(c[3],c[4]),qs=sel[z],lab=name(z)+" "+hm(at(z,now)),w=lab.length*6.3+14;
      var lx=Math.min(Math.max(p[0]-w/2,4),WM.w-4-w),ly=p[1]-30<2?p[1]+12:p[1]-30;
      s+='<g class="dot" data-z="'+z+'"><title>'+esc(name(z)+" · "+fo(off(z,now)))+'</title>'
        +qs.map(function(q,i){var x=(p[0]+i*13).toFixed(1);
          return '<circle cx="'+x+'" cy="'+p[1].toFixed(1)+'" r="7.5" fill="'+q.c+'" stroke="#141418" stroke-width="1.5"/>'
            +'<text x="'+x+'" y="'+p[1].toFixed(1)+'" font-size="9" font-weight="700" fill="#15151a" text-anchor="middle" dominant-baseline="central">'+q.m+'</text>';}).join("")
        +'<rect x="'+lx.toFixed(1)+'" y="'+ly.toFixed(1)+'" width="'+w.toFixed(1)+'" height="18" rx="9" fill="#1c1c21" stroke="#3a3a44"/>'
        +'<text x="'+(lx+w/2).toFixed(1)+'" y="'+(ly+9).toFixed(1)+'" font-size="11.5" fill="#e9e7e2" text-anchor="middle" dominant-baseline="central">'+esc(lab)+'</text></g>';
    });
    $("gMap").innerHTML=s;
  }
  // on a narrow screen the map scrolls sideways: bring a city into view when its pill is tapped
  function reveal(tz,smooth){
    var w=$("gMapW"),c=city(tz);if(!c||w.scrollWidth<=w.clientWidth)return;
    var x=px(c[3],c[4])[0]/WM.w*w.scrollWidth,m=40;
    if(x<w.scrollLeft+m||x>w.scrollLeft+w.clientWidth-m)
      w.scrollTo({left:x-w.clientWidth/2,behavior:smooth?"smooth":"auto"});
  }

  /* ===== dial: 12-hour dial, GMT hand on a turning 24-hour bezel ===== */
  function dial(L,H,k){
    var c=110;
    function P(a,r){return [c+r*Math.sin(a*Math.PI/180),c-r*Math.cos(a*Math.PI/180)];}
    function f(n){return n.toFixed(1);}
    var s='<circle cx="110" cy="110" r="104" fill="#26262c" stroke="#3a3a44"/><circle cx="110" cy="110" r="82" fill="#15151a" stroke="#3a3a44"/>';
    for(var n=0;n<24;n++){
      var a=(n-k)*15,q=P(a,93);
      if(n%2===0)s+='<text x="'+f(q[0])+'" y="'+f(q[1])+'" fill="'+(n>=6&&n<18?"#e9e7e2":"#8b8894")+'" font-size="10" font-weight="700" text-anchor="middle" dominant-baseline="central" transform="rotate('+a+' '+f(q[0])+' '+f(q[1])+')">'+n+'</text>';
      else{var q1=P(a,96),q2=P(a,90);s+='<line x1="'+f(q1[0])+'" y1="'+f(q1[1])+'" x2="'+f(q2[0])+'" y2="'+f(q2[1])+'" stroke="#8b8894" stroke-width="1.5"/>';}
    }
    for(var i=0;i<12;i++){var r1=P(i*30,78),r2=P(i*30,i%3?70:64);s+='<line x1="'+f(r1[0])+'" y1="'+f(r1[1])+'" x2="'+f(r2[0])+'" y2="'+f(r2[1])+'" stroke="#e9e7e2" stroke-width="'+(i%3?2:4)+'"/>';}
    function hand(a,r,w,col){var e=P(a,r),b=P(a+180,12);return '<line x1="'+f(b[0])+'" y1="'+f(b[1])+'" x2="'+f(e[0])+'" y2="'+f(e[1])+'" stroke="'+col+'" stroke-width="'+w+'" stroke-linecap="round"/>';}
    var lh=L.getUTCHours(),lm=L.getUTCMinutes(),ga=(H.getUTCHours()+H.getUTCMinutes()/60)*15,tp=P(ga,82),t1=P(ga-5,70),t2=P(ga+5,70);
    s+=hand(ga,72,1.6,"#e2483d")+'<polygon points="'+f(tp[0])+','+f(tp[1])+' '+f(t1[0])+','+f(t1[1])+' '+f(t2[0])+','+f(t2[1])+'" fill="#e2483d"/>';
    s+=hand(((lh%12)+lm/60)*30,46,5,"#e9e7e2")+hand(lm*6,68,3,"#e9e7e2")+'<circle cx="110" cy="110" r="4" fill="#e2483d"/>';
    var dp=P(90,52);
    return s+'<rect x="'+f(dp[0]-9)+'" y="'+f(dp[1]-8)+'" width="18" height="16" rx="2" fill="#e9e7e2"/><text x="'+f(dp[0])+'" y="'+f(dp[1])+'" font-size="11" font-weight="700" fill="#15151a" text-anchor="middle" dominant-baseline="central">'+L.getUTCDate()+'</text>';
  }

  /* ===== render ===== */
  function renderPills(now){
    $("gPills").innerHTML=SLOTS.map(function(q){
      var v=st[q.k];
      return '<button class="pill'+(act===q.k?" on":"")+'" data-k="'+q.k+'" title="'+esc(tr(q.k+"T"))+'"><span class="k" style="background:'+q.c+'">'+q.m+'</span>'
        +esc(tr(q.k))+' <b>'+esc(v?name(v):tr("noneV"))+'</b>'
        +(q.k==="third"&&v?'<span class="x" data-none="1">'+esc(tr("none"))+'</span>':'')+'</button>';
    }).join("");
  }
  function renderWatch(){
    var ws=gmtWatches(),sel=$("gWatch");
    sel.hidden=!ws.length;
    if(!ws.length)return;
    if(st.watch&&!ws.some(function(w){return w.id===st.watch;}))st.watch="";
    sel.innerHTML='<option value="">'+esc(tr("anyWatch"))+'</option>'+ws.map(function(w){
      return '<option value="'+esc(w.id)+'"'+(w.id===st.watch?" selected":"")+'>'+esc(w.name)+'</option>';}).join("");
  }
  function render(){
    if(!st||$("paneGmt").hidden)return;
    var now=new Date(),h=st.home,l=st.loc,t=st.third;
    renderPills(now);drawMap(now);
    var ho=off(h,now),lo=off(l,now),H=at(h,now),L=at(l,now),d=lo-ho,k=0,TT=null;
    if(t){TT=at(t,now);k=Math.round(off(t,now)-ho);}
    $("gDial").innerHTML=dial(L,H,k);
    $("gRows").innerHTML='<div>'+esc(tr("locT"))+' · '+esc(name(l))+'<b>'+hm(L)+'</b></div>'
      +'<div>'+esc(tr("homeT"))+' · '+esc(name(h))+'<b>'+hm(H)+'</b></div>'
      +(TT?'<div>'+esc(tr("thirdT"))+' · '+esc(name(t))+'<b>'+hm(TT)+'</b></div>':'');
    document.querySelectorAll("#gSeg button").forEach(function(b){b.classList.toggle("on",b.dataset.t===st.type);});
    $("gTHint").textContent=tr(st.type==="flyer"?"flyerHint":"callerHint");
    var dd=Math.round((Date.UTC(L.getUTCFullYear(),L.getUTCMonth(),L.getUTCDate())-Date.UTC(H.getUTCFullYear(),H.getUTCMonth(),H.getUTCDate()))/864e5);
    var date=dd===0?tr("dateStays"):tr(dd>0?"dateFwd":"dateBack",{d:L.getUTCDate()});
    var n=Math.trunc(Math.abs(d)),steps=[],nm={home:esc(name(h)),loc:esc(name(l)),third:t?esc(name(t)):""};
    if(st.type==="flyer"){
      steps.push(tr("fly1",{t:hm(H),home:nm.home,h:H.getUTCHours()}));
      steps.push(n===0?tr("flySame"):tr("fly2",{n:n,steps:tr(n===1?"step":"steps"),dir:tr(d>0?"fwd":"back"),date:date}));
    }else{
      steps.push(tr("call1",{t:hm(L),loc:nm.loc}));
      steps.push(tr("call2",{h:H.getUTCHours(),home:nm.home,t:hm(H)}));
      steps.push(tr("call3",{d:L.getUTCDate()}));
    }
    if(t)steps.push(k===0?tr("bezelSame",{third:nm.third}):tr("bezel",{n:Math.abs(k),hours:tr(Math.abs(k)===1?"hour":"hours"),dir:tr(k>0?"ccw":"cw"),third:nm.third,t:hm(TT)}));
    $("gSteps").innerHTML=steps.map(function(x){return "<li>"+x+"</li>";}).join("");
    var half=[l,h,t].filter(function(z,i,a){return z&&a.indexOf(z)===i&&off(z,now)%1!==0;});
    $("gWarn").hidden=!half.length;
    if(half.length)$("gWarn").textContent=tr("half",{list:half.map(name).join(", "),is:tr(half.length>1?"isMany":"isOne"),off:half.map(function(z){return fo(off(z,now));}).join(", ")});
    var ch=[h,l].filter(function(z,i,a){return a.indexOf(z)===i;}).map(function(z){
      var c=nextChange(z,now);if(!c)return null;
      return tr("dstItem",{city:esc(name(z)),d:new Date(c.at).toLocaleDateString(tr("locale"),{day:"numeric",month:"short"}),sign:c.d>0?"+":"−",hand:tr(h===l?"dstBoth":z===l?"dstLoc":"dstHome")});
    }).filter(Boolean);
    $("gDst").innerHTML=ch.length?esc(tr("dst"))+" · "+ch.join(" · "):esc(tr("dstNone"));
  }
  function applyStatic(){
    $("gTypeLbl").textContent=tr("typeLbl");
    $("gSwipe").textContent=tr("swipe");
    $("gMap").setAttribute("aria-label",tr("map"));
    $("gGuideTitle").textContent=tr("gTitle");$("gGuideIntro").textContent=tr("gIntro");
    ["g1","g2","g3"].forEach(function(id,i){$("gG"+(i+1)).innerHTML=tr(id);});
    renderWatch();
  }

  /* ===== events (bound once, on the first show) ===== */
  var bound=false,timer=null;
  function bind(){
    bound=true;
    $("gMap").setAttribute("viewBox","0 0 "+WM.w+" "+WM.h);
    $("gPills").onclick=function(e){
      if(e.target.closest("[data-none]")){st.third="";if(act==="third")act="home";save();render();return;}
      var b=e.target.closest(".pill");if(!b)return;
      act=b.dataset.k;render();if(st[act])reveal(st[act],true);
    };
    $("gMap").onclick=function(e){var g=e.target.closest(".dot");if(!g)return;st[act]=g.dataset.z;save();render();};
    $("gSeg").onclick=function(e){var b=e.target.closest("[data-t]");if(!b)return;st.type=b.dataset.t;st.watch="";$("gWatch").value="";save();render();};
    $("gWatch").onchange=function(){
      st.watch=this.value;
      var w=gmtWatches().filter(function(x){return x.id===st.watch;})[0];
      if(w)st.type=w.info.gmt;
      save();render();
    };
    $("gGuideClose").onclick=function(){$("gGuide").hidden=true;};
    window.addEventListener("swclang",function(){applyStatic();render();});
    // back/forward cache: read the choices and watches again
    window.addEventListener("pageshow",function(e){if(e.persisted){load();applyStatic();render();}});
  }
  window.GMT={
    sub:function(){return tr("sub");},
    show:function(){
      if(!st){load();fromLink();}
      if(!bound)bind();
      applyStatic();render();
      reveal(st[act]||st.home,false);
      if(!timer)timer=setInterval(render,30000);
    }
  };
})();
