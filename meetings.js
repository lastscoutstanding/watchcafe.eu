/* ===== Sioux Watch Café — countdown naar de volgende meeting =====
   Datums staan in /meetings.txt (één per regel, YYYY-MM-DD HH:MM, Amsterdamse tijd).
   Gebruik op een pagina:
     <span data-countdown-date></span>  -> "Fri 31 Jul 2026, 16:30"
     <span data-countdown></span>       -> "25d 03:12:44" (tikt per seconde)
   Vergeet niet: <script src="/meetings.js" defer></script> */
(function(){
  var dateEls  = document.querySelectorAll('[data-countdown-date]');
  var countEls = document.querySelectorAll('[data-countdown]');
  if(!dateEls.length && !countEls.length) return;

  // interpreteer Y-M-D H:M als Europe/Amsterdam en geef epoch-ms terug
  function amsUTC(y,mo,d,h,mi){
    var t = Date.UTC(y, mo-1, d, h, mi);
    for(var i=0;i<2;i++){
      var f = new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Amsterdam',
        year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false});
      var p = {}; f.formatToParts(new Date(t)).forEach(function(x){p[x.type]=x.value;});
      var shown = Date.UTC(+p.year, +p.month-1, +p.day, (+p.hour)%24, +p.minute);
      var want  = Date.UTC(y, mo-1, d, h, mi);
      if(shown === want) break;
      t += want - shown;
    }
    return t;
  }

  function parse(txt){
    var out = [];
    txt.split(/\r?\n/).forEach(function(line){
      line = line.trim();
      if(!line || line.charAt(0) === '#') return;
      var m = line.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})$/);
      if(m) out.push(amsUTC(+m[1], +m[2], +m[3], +m[4], +m[5]));
    });
    return out.sort(function(a,b){return a-b;});
  }

  function fmtDate(t){
    return new Intl.DateTimeFormat('en-GB',{
      weekday:'short',day:'numeric',month:'short',year:'numeric',
      hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(t));
  }
  function pad(n){return (n<10?'0':'')+n;}
  function fmtLeft(ms){
    var s = Math.max(0, Math.floor(ms/1000));
    var d = Math.floor(s/86400); s -= d*86400;
    var h = Math.floor(s/3600);  s -= h*3600;
    var m = Math.floor(s/60);    s -= m*60;
    return (d>0 ? d + 'd ' : '') + pad(h) + ':' + pad(m) + ':' + pad(s);
  }
  function setAll(els, txt){ els.forEach ? els.forEach(f) : [].forEach.call(els, f); function f(e){ e.textContent = txt; } }

  fetch('/meetings.txt', {cache:'no-store'}).then(function(r){
    if(!r.ok) throw 0;
    return r.text();
  }).then(function(txt){
    var dates = parse(txt);
    function tick(){
      var now = Date.now();
      while(dates.length && dates[0] <= now) dates.shift();   // verstreken datums overslaan
      if(!dates.length){
        setAll(dateEls, 'date to be announced');
        setAll(countEls, '');
        return; // stoppen met tikken
      }
      setAll(dateEls, fmtDate(dates[0]));
      setAll(countEls, fmtLeft(dates[0] - now));
      setTimeout(tick, 1000);
    }
    tick();
  }).catch(function(){
    setAll(dateEls, 'see announcement');
    setAll(countEls, '');
  });
})();
