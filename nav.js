/* ===== Sioux Watch Café — gedeelde navigatie =====
   Nieuwe pagina toevoegen? Voeg één regel toe aan PAGES hieronder.
   Elke pagina laadt dit bestand met: <script src="/nav.js" defer></script> */
(function(){
  var PAGES = [
    { title: "Home",          url: "/" },
    { title: "Live Clock",    url: "/clock/" },
    { title: "Rate Meter",    url: "/watchrate/" },
    { title: "Power Reserve", url: "/powerreserve/" },
    { title: "Backup Viewer", url: "/watchrate/viewer.html" },
    { title: "Glossary",      url: "/glossary/" }
  ];

  var css = ''
  + '.swc-nav{position:fixed;top:0;left:0;right:0;z-index:1000;background:#17171b;border-bottom:1px solid #2a2a31;'
  +   'font-family:"Segoe UI",Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}'
  + '.swc-in{max-width:980px;margin:0 auto;display:flex;align-items:center;gap:8px;padding:0 16px;height:52px}'
  + '.swc-brand{color:#e9e7e2;font-weight:700;font-size:15px;text-decoration:none;letter-spacing:.2px;'
  +   'display:flex;align-items:center;gap:8px;margin-right:auto}'
  + '.swc-brand .dot{width:9px;height:9px;border-radius:50%;background:#d96a41;box-shadow:0 0 8px rgba(217,106,65,.7)}'
  + '.swc-links{display:flex;gap:2px}'
  + '.swc-links a{color:#a09da6;text-decoration:none;font-size:14px;padding:7px 12px;border-radius:8px}'
  + '.swc-links a:hover{color:#e9e7e2;background:#22222a}'
  + '.swc-links a.on{color:#fff;background:#d96a41}'
  + '.swc-burger{display:none;background:none;border:1px solid #33333c;border-radius:8px;color:#e9e7e2;'
  +   'width:38px;height:34px;font-size:17px;line-height:1;cursor:pointer;padding:0;touch-action:manipulation}'
  + '@media(max-width:640px){'
  +   '.swc-links{display:none;position:absolute;top:52px;left:0;right:0;background:#17171b;'
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
  nav.innerHTML = '<div class="swc-in">'
    + '<a class="swc-brand" href="/"><span class="dot"></span>Sioux Watch Caf\u00e9</a>'
    + '<button class="swc-burger" aria-label="Menu" aria-expanded="false">\u2630</button>'
    + '<div class="swc-links">' + links + '</div>'
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
  document.addEventListener('click', function(e){
    if(!nav.contains(e.target)) { menu.classList.remove('open'); burger.setAttribute('aria-expanded','false'); }
  });
})();
