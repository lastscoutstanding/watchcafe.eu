/* ===== Sioux Watch Café — next meeting block =====
   Dates live in /meetings.txt, one per line, Amsterdam time:
     YYYY-MM-DD HH:MM
     YYYY-MM-DD HH:MM | English theme | Nederlands thema
   Separate several topics with ";" to show them as a list. NL is optional
   (falls back to EN). Past dates are skipped automatically.
   Fills these elements on the page (all optional):
     #nxM #nxD #nxW   date tile (month, day, weekday)
     #nxWhen          "Friday 30 October · 16:30"
     #nxLeft          "26 days to go"
     #nxTheme         theme box (hidden without a theme), with #nxTl label and #nxTt text
   Use: <script src="/meetings.js" defer></script> */
(function(){
  if(!document.getElementById('nxWhen')) return;
  var TZ = 'Europe/Amsterdam';
  var T = {
    en:{today:"Today", tomorrow:"Tomorrow", left:function(n){return n + " days to go";},
        tba:"Date to be announced", theme:"Theme", topics:"On the table"},
    nl:{today:"Vandaag", tomorrow:"Morgen", left:function(n){return "Nog " + n + " dagen";},
        tba:"Datum volgt", theme:"Thema", topics:"Op tafel"}
  };
  var lang, list = null;

  // interpret Y-M-D H:M as Europe/Amsterdam and return epoch-ms
  function amsUTC(y,mo,d,h,mi){
    var t = Date.UTC(y, mo-1, d, h, mi);
    for(var i=0;i<2;i++){
      var p = parts(t);
      var shown = Date.UTC(+p.year, +p.month-1, +p.day, (+p.hour)%24, +p.minute);
      var want  = Date.UTC(y, mo-1, d, h, mi);
      if(shown === want) break;
      t += want - shown;
    }
    return t;
  }
  function parts(t){
    var f = new Intl.DateTimeFormat('en-GB',{timeZone:TZ,
      year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false});
    var p = {}; f.formatToParts(new Date(t)).forEach(function(x){p[x.type]=x.value;});
    return p;
  }
  // calendar day number in Amsterdam, for "days to go"
  function dayNo(t){ var p = parts(t); return Date.UTC(+p.year, +p.month-1, +p.day) / 864e5; }

  function parse(txt){
    var out = [];
    txt.split(/\r?\n/).forEach(function(line){
      line = line.trim();
      if(!line || line.charAt(0) === '#') return;
      var f = line.split('|').map(function(x){ return x.trim(); });
      var m = f[0].match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})$/);
      if(!m) return;
      out.push({ t: amsUTC(+m[1], +m[2], +m[3], +m[4], +m[5]),
                 en: f[1] || '', nl: f[2] || f[1] || '' });
    });
    return out.sort(function(a,b){ return a.t - b.t; });
  }

  function el(id){ return document.getElementById(id); }
  function set(id, v){ var e = el(id); if(e) e.textContent = v; }
  function fmt(t, o){
    o.timeZone = TZ;
    return new Intl.DateTimeFormat(lang === 'nl' ? 'nl-NL' : 'en-GB', o).format(new Date(t)).replace('.', '');
  }

  function render(){
    var t = T[lang] || T.en, now = Date.now();
    if(!list) return;
    while(list.length && list[0].t <= now) list.shift();
    var box = el('nxTheme');
    if(!list.length){
      set('nxM', ''); set('nxD', '?'); set('nxW', '');
      set('nxWhen', t.tba); set('nxLeft', '');
      if(box) box.style.display = 'none';
      return;
    }
    var n = list[0];
    set('nxM', fmt(n.t, {month:'short'}));
    set('nxD', fmt(n.t, {day:'numeric'}));
    set('nxW', fmt(n.t, {weekday:'short'}));
    var when = fmt(n.t, {weekday:'long', day:'numeric', month:'long'});
    set('nxWhen', when.charAt(0).toUpperCase() + when.slice(1) + ' · ' +
                  fmt(n.t, {hour:'2-digit', minute:'2-digit', hour12:false}));
    var days = dayNo(n.t) - dayNo(now);
    set('nxLeft', days <= 0 ? t.today : days === 1 ? t.tomorrow : t.left(days));

    var txt = lang === 'nl' ? n.nl : n.en;
    var items = txt.split(';').map(function(x){ return x.trim(); }).filter(Boolean);
    if(box){
      box.style.display = items.length ? '' : 'none';
      set('nxTl', items.length > 1 ? t.topics : t.theme);
      var tt = el('nxTt');
      if(tt){
        tt.textContent = '';
        if(items.length > 1){
          var ul = document.createElement('ul');
          items.forEach(function(x){ var li = document.createElement('li'); li.textContent = x; ul.appendChild(li); });
          tt.appendChild(ul);
        } else if(items.length){ tt.textContent = items[0]; }
      }
    }
  }

  try{ lang = localStorage.getItem('siouxWatchRateMeterLang') || 'en'; }catch(e){ lang = 'en'; }
  window.addEventListener('swclang', function(e){ lang = e.detail; render(); });

  fetch('/meetings.txt', {cache:'no-store'}).then(function(r){
    if(!r.ok) throw 0;
    return r.text();
  }).then(function(txt){
    list = parse(txt);
    render();
    // roll over to the next meeting once this one starts, and keep "days to go" fresh past midnight
    setInterval(render, 60000);
  }).catch(function(){
    list = [];
    render();
  });
})();
