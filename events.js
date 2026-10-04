/* ===== Sioux Watch Café — list of other watch events =====
   Events live in /events.txt, one per line:
     YYYY-MM-DD[..YYYY-MM-DD] | name | place | link (optional)
   Past events are dropped automatically. Fills #evList; #evMore toggles the rest.
   The whole section (#evSec) stays hidden when there is nothing upcoming.
   Use: <script src="/events.js" defer></script> */
(function(){
  var listEl = document.getElementById('evList');
  if(!listEl) return;
  var SHOW = 4;
  var T = {
    en:{more:function(n){return "Show " + n + " more";}, less:"Show less",
        today:"today", tomorrow:"tomorrow", inN:function(n){return "in " + n + " days";}},
    nl:{more:function(n){return "Nog " + n + " tonen";}, less:"Minder tonen",
        today:"vandaag", tomorrow:"morgen", inN:function(n){return "over " + n + " dagen";}}
  };
  var lang, ev = [], open = false;

  function day(s){ var p = s.split('-'); return new Date(+p[0], p[1]-1, +p[2]); }
  function today(){ var d = new Date(); d.setHours(0,0,0,0); return d; }
  function esc(t){ return t.replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }

  function parse(txt){
    var out = [];
    txt.split(/\r?\n/).forEach(function(line){
      line = line.trim();
      if(!line || line.charAt(0) === '#') return;
      var f = line.split('|').map(function(x){ return x.trim(); });
      var r = f[0].split('..').map(function(x){ return x.trim(); });
      if(!/^\d{4}-\d{2}-\d{2}$/.test(r[0]) || (r[1] && !/^\d{4}-\d{2}-\d{2}$/.test(r[1])) || !f[1]) return;
      var url = f[3] || '';
      if(url && !/^https?:\/\//i.test(url)) url = '';
      out.push({ a: day(r[0]), b: day(r[1] || r[0]), name: f[1], place: f[2] || '', url: url });
    });
    return out.sort(function(x, y){ return x.a - y.a; });
  }

  function render(){
    var t = T[lang] || T.en, loc = lang === 'nl' ? 'nl-NL' : 'en-GB', now = today();
    function fmt(d, o){ return new Intl.DateTimeFormat(loc, o).format(d).replace('.', ''); }
    var up = ev.filter(function(e){ return e.b >= now; });
    var sec = document.getElementById('evSec');
    if(sec) sec.style.display = up.length ? '' : 'none';

    var year = now.getFullYear();
    listEl.innerHTML = (open ? up : up.slice(0, SHOW)).map(function(e){
      // year divider before the first event of each later year
      var y = e.a.getFullYear(), sep = y !== year ? '<li class="ev-y">' + y + '</li>' : '';
      year = y;
      var multi = +e.a !== +e.b;
      var days = Math.round((e.a - now) / 864e5);
      var dd = !multi ? e.a.getDate()
             : e.a.getMonth() === e.b.getMonth() ? e.a.getDate() + '–' + e.b.getDate()
             : e.a.getDate() + '–';
      var when = e.a <= now ? t.today : days === 1 ? t.tomorrow : days <= 14 ? t.inN(days) : '';
      var wd = fmt(e.a, {weekday:'short'}) +
               (multi ? '–' + fmt(e.b, {weekday:'short'}) + (e.a.getMonth() !== e.b.getMonth() ? ' ' + e.b.getDate() + ' ' + fmt(e.b, {month:'short'}) : '') : '');
      var nm = e.url
        ? '<a class="ev-n" href="' + esc(e.url) + '" target="_blank" rel="noopener">' + esc(e.name) + '</a>'
        : '<span class="ev-n">' + esc(e.name) + '</span>';
      return sep + '<li class="ev"><div class="ev-d"><span class="m">' + fmt(e.a, {month:'short'}) + '</span>' +
             '<span class="d' + (multi ? ' r' : '') + '">' + dd + '</span></div>' +
             '<div class="ev-b">' + nm + '<div class="ev-p">' + (e.place ? esc(e.place) + ' · ' : '') + wd +
             (when ? ' · <span class="ev-soon">' + when + '</span>' : '') + '</div></div></li>';
    }).join('');

    var b = document.getElementById('evMore');
    if(b){
      b.style.display = up.length > SHOW ? '' : 'none';
      b.textContent = open ? t.less : t.more(up.length - SHOW);
    }
  }

  var more = document.getElementById('evMore');
  if(more) more.addEventListener('click', function(){ open = !open; render(); });
  try{ lang = localStorage.getItem('siouxWatchRateMeterLang') || 'en'; }catch(e){ lang = 'en'; }
  window.addEventListener('swclang', function(e){ lang = e.detail; render(); });

  fetch('/events.txt', {cache:'no-store'}).then(function(r){
    if(!r.ok) throw 0;
    return r.text();
  }).then(function(txt){
    ev = parse(txt);
    render();
  }).catch(function(){ /* no events file: section stays hidden */ });
})();
