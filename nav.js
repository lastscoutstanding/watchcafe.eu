/* ===== Sioux Watch Café — gedeelde navigatie + taalkeuze =====
   Nieuwe pagina toevoegen? Voeg één regel toe aan PAGES hieronder.
   Elke pagina laadt dit bestand met: <script src="/nav.js" defer></script>
   Taal: de cogwheel beheert de gedeelde sleutel 'siouxWatchRateMeterLang'.
   Pagina's kunnen luisteren naar window-event 'swclang' (e.detail = 'en'|'nl'). */
(function(){
  var PAGES = [
    { title: "Home",          url: "/" },
    { title: "Watch Café",    url: "/cafe/" },
    { title: "Rate Meter",    url: "/watchrate/" },
    { title: "Power Reserve", url: "/powerreserve/" },
    { title: "Glossary",      url: "/glossary/" },
    { title: "Guide",         url: "/guide/" }
  ];
  var LANGS = [ ["en","English"], ["nl","Nederlands"] ];
  var LKEY = "siouxWatchRateMeterLang";
  function getLang(){ try{ return localStorage.getItem(LKEY) || "en"; }catch(e){ return "en"; } }
  function setLang(l){
    try{ localStorage.setItem(LKEY, l); }catch(e){}
    try{ window.dispatchEvent(new CustomEvent("swclang", {detail:l})); }catch(e){}
  }

  var THEMES = [
    ["cafe","Watch Caf\u00e9"], ["pepsi","Pepsi"], ["snowflake","Snowflake"],
    ["speedy","Speedy"], ["monster","Monster"], ["kermit","Kermit"]
  ];
  var TKEY = "siouxWatchTheme";
  function getTheme(){ try{ return localStorage.getItem(TKEY) || "cafe"; }catch(e){ return "cafe"; } }
  function applyTheme(t){
    if(t==="cafe"){ document.documentElement.removeAttribute("data-theme"); }
    else{ document.documentElement.setAttribute("data-theme", t); }
  }
  function setTheme(t){
    try{ localStorage.setItem(TKEY, t); }catch(e){}
    applyTheme(t);
    try{ window.dispatchEvent(new CustomEvent("swctheme", {detail:t})); }catch(e){}
  }
  applyTheme(getTheme());

  var css = ''
  + '.swc-nav{position:fixed;top:0;left:0;right:0;z-index:1000;background:var(--nav-bg,#17171b);border-bottom:1px solid var(--nav-border,#2a2a31);'
  +   'font-family:"Segoe UI",Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}'
  + '.swc-in{max-width:980px;margin:0 auto;display:flex;align-items:center;gap:8px;padding:0 16px;height:52px}'
  + '.swc-brand{color:var(--ink,#e9e7e2);font-weight:700;font-size:15px;text-decoration:none;letter-spacing:.2px;'
  +   'display:flex;align-items:center;gap:8px;margin-right:auto}'
  + '.swc-brand .dot{width:9px;height:9px;border-radius:50%;background:var(--accent,#d96a41);box-shadow:0 0 8px var(--accent-glow,rgba(217,106,65,.7))}'
  + '.swc-links{display:flex;gap:2px}'
  + '.swc-links a{color:var(--muted,#a09da6);text-decoration:none;font-size:14px;padding:7px 12px;border-radius:8px}'
  + '.swc-links a:hover{color:var(--ink,#e9e7e2);background:var(--nav-hover,#22222a)}'
  + '.swc-links a.on{color:#fff;background:var(--accent,#d96a41)}'
  + '.swc-tools{display:flex;align-items:center;gap:6px}'
  + '.swc-gear{position:relative}'
  + '.swc-gearbtn{background:none;border:1px solid var(--border,#33333c);border-radius:8px;color:var(--muted,#c9c6cf);'
  +   'width:38px;height:34px;font-size:16px;line-height:1;cursor:pointer;padding:0;touch-action:manipulation;'
  +   'display:flex;align-items:center;justify-content:center}'
  + '.swc-gearbtn:hover{color:var(--ink,#fff);background:var(--nav-hover,#22222a)}'
  + '.swc-menu{display:none;position:absolute;right:0;top:40px;background:var(--card,#1c1c21);border:1px solid var(--border,#33333c);'
  +   'border-radius:10px;padding:6px;min-width:150px;box-shadow:0 10px 30px rgba(0,0,0,.5)}'
  + '.swc-menu.open{display:block}'
  + '.swc-menu .lbl{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#8f8c96;padding:6px 10px 4px}'
  + '.swc-menu button{display:flex;align-items:center;justify-content:space-between;width:100%;background:none;'
  +   'border:none;color:#c9c6cf;font-size:14px;text-align:left;padding:8px 10px;border-radius:7px;cursor:pointer}'
  + '.swc-menu button:hover{background:var(--nav-hover,#26262c);color:var(--ink,#fff)}'
  + '.swc-menu button .ck{color:var(--accent,#d96a41);font-weight:700;opacity:0}'
  + '.swc-menu button.sel .ck{opacity:1}'
  + '.swc-menu .mdiv{height:1px;background:var(--border,#33333c);margin:6px 4px}'
  + '.swc-burger{display:none;background:none;border:1px solid var(--border,#33333c);border-radius:8px;color:var(--ink,#e9e7e2);'
  +   'width:38px;height:34px;font-size:17px;line-height:1;cursor:pointer;padding:0;touch-action:manipulation}'
  + '@media(max-width:680px){'
  +   '.swc-links{display:none;position:absolute;top:52px;left:0;right:0;background:var(--nav-bg,#17171b);'
  +     'border-bottom:1px solid #2a2a31;flex-direction:column;padding:8px 12px 12px;gap:4px}'
  +   '.swc-links.open{display:flex}'
  +   '.swc-links a{padding:11px 12px;font-size:15px}'
  +   '.swc-burger{display:block}'
  + '}';

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  function norm(p){ p = p.replace(/\/index\.html$/, '/'); return p === '' ? '/' : p; }
  var here = norm(location.pathname);

  var nav = document.createElement('nav');
  nav.className = 'swc-nav';
  var links = PAGES.map(function(pg){
    var on = norm(pg.url) === here ? ' class="on"' : '';
    return '<a href="' + pg.url + '"' + on + '>' + pg.title + '</a>';
  }).join('');
  var langBtns = LANGS.map(function(l){
    return '<button data-lang="' + l[0] + '"><span>' + l[1] + '</span><span class="ck">\u2713</span></button>';
  }).join('');
  var themeBtns = THEMES.map(function(t){
    return '<button data-theme-opt="' + t[0] + '"><span>' + t[1] + '</span><span class="ck">\u2713</span></button>';
  }).join('');
  nav.innerHTML = '<div class="swc-in">'
    + '<a class="swc-brand" href="/"><span class="dot"></span>Sioux Watch Caf\u00e9</a>'
    + '<button class="swc-burger" aria-label="Menu" aria-expanded="false">\u2630</button>'
    + '<div class="swc-links">' + links + '</div>'
    + '<div class="swc-tools"><div class="swc-gear">'
    +   '<button class="swc-gearbtn" aria-label="Settings" aria-expanded="false">\u2699</button>'
    +   '<div class="swc-menu"><div class="lbl">Language</div>' + langBtns
    +     '<div class="mdiv"></div><div class="lbl">Theme</div>' + themeBtns + '</div>'
    + '</div></div>'
    + '</div>';
  var spacer = document.createElement('div');
  spacer.style.height = '52px';
  document.body.insertBefore(spacer, document.body.firstChild);
  document.body.insertBefore(nav, spacer);

  var burger = nav.querySelector('.swc-burger');
  var menu = nav.querySelector('.swc-links');
  burger.addEventListener('click', function(){
    var open = menu.classList.toggle('open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  var gearbtn = nav.querySelector('.swc-gearbtn');
  var gearmenu = nav.querySelector('.swc-menu');
  function markLang(){
    var cur = getLang();
    nav.querySelectorAll('.swc-menu button[data-lang]').forEach(function(b){
      b.classList.toggle('sel', b.getAttribute('data-lang') === cur);
    });
  }
  function markTheme(){
    var cur = getTheme();
    nav.querySelectorAll('.swc-menu button[data-theme-opt]').forEach(function(b){
      b.classList.toggle('sel', b.getAttribute('data-theme-opt') === cur);
    });
  }
  markLang(); markTheme();
  gearbtn.addEventListener('click', function(e){
    e.stopPropagation();
    var open = gearmenu.classList.toggle('open');
    gearbtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  nav.querySelectorAll('.swc-menu button[data-lang]').forEach(function(b){
    b.addEventListener('click', function(){
      setLang(b.getAttribute('data-lang'));
      markLang();
      gearmenu.classList.remove('open');
      gearbtn.setAttribute('aria-expanded','false');
    });
  });
  nav.querySelectorAll('.swc-menu button[data-theme-opt]').forEach(function(b){
    b.addEventListener('click', function(){
      setTheme(b.getAttribute('data-theme-opt'));
      markTheme();
      gearmenu.classList.remove('open');
      gearbtn.setAttribute('aria-expanded','false');
    });
  });
  document.addEventListener('click', function(e){
    if(!nav.contains(e.target)){
      menu.classList.remove('open'); burger.setAttribute('aria-expanded','false');
      gearmenu.classList.remove('open'); gearbtn.setAttribute('aria-expanded','false');
    }
  });
})();
