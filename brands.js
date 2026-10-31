/* ===== watchcafe.eu — brand marks =====
   Reads /brands.txt and draws two vector marks in the theme accent colour:
     Brands.badge(b, size)       dial with 12 ticks and the brand monogram;
                                 a dial at 10:10 when the brand is unknown
     Brands.wordmark(b, raw)     brand name in the brand's type style;
                                 muted plain caps for an unknown brand (raw)
   Brands.forWatch(w) returns { brand, raw }: w.info.brand looked up in the
   list, or else the brand the watch name starts with ("Omega Speedmaster").
   Before the list has loaded, Brands.loaded is false; the "swcbrands" event
   fires on window once it has.
   Use: <script src="/brands.js?v=1"></script> */
(function(){
  var list=[],idx={};
  function key(s){
    return String(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase()
      .replace(/&/g," and ").replace(/[^a-z0-9Ѐ-ӿ]+/g," ").trim();
  }
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}

  function parse(txt){
    list=[];idx={};
    txt.split("\n").forEach(function(l){
      if(!l.trim()||l.trim().charAt(0)==="#")return;
      var p=l.split("|").map(function(s){return s.trim();});
      var b={name:p[0],aliases:p[1]?p[1].split(";").map(function(s){return s.trim();}).filter(Boolean):[],style:p[2]||"roman",mono:p[3]||""};
      list.push(b);
      [b.name].concat(b.aliases).forEach(function(n){idx[key(n).replace(/ /g,"")]=b;});
    });
  }
  function find(name){return idx[key(name).replace(/ /g,"")]||null;}

  // brand the name starts with, on whole words, longest match first ("Grand Seiko" before "Seiko")
  function fromName(name){
    var words=key(name).split(" ");
    for(var n=Math.min(4,words.length);n>0;n--){var b=idx[words.slice(0,n).join("")];if(b)return b;}
    return null;
  }
  function forWatch(w){
    var raw=(w&&w.info&&w.info.brand||"").trim();
    if(raw)return {brand:find(raw),raw:raw};
    return {brand:fromName(w&&w.name),raw:""};
  }

  var SERIF="Times New Roman,Georgia,serif",SANS="Helvetica Neue,Helvetica,Arial,sans-serif";
  function badge(b,size){
    var t="";
    for(var i=0;i<12;i++){
      var a=i*Math.PI/6,r1=i%3?16.2:15;
      t+='<line x1="'+(20+r1*Math.sin(a)).toFixed(2)+'" y1="'+(20-r1*Math.cos(a)).toFixed(2)
        +'" x2="'+(20+18*Math.sin(a)).toFixed(2)+'" y2="'+(20-18*Math.cos(a)).toFixed(2)+'"/>';
    }
    var mid;
    if(b&&b.mono){
      var m=b.mono,serif=b.style!=="grotesk"&&b.style!=="wide";
      mid='<text x="20" y="20" dy=".36em" text-anchor="middle" font-size="'+(m.length===1?15:m.length===2?11.5:9)
        +'" fill="currentColor" stroke="none" font-weight="'+(serif?400:700)+'" font-family="'+(serif?SERIF:SANS)+'"'
        +(b.style==="italic"?' font-style="italic"':'')+(m.length>1?' letter-spacing=".5"':'')+'>'+esc(m)+'</text>';
    }else{
      mid='<line x1="20" y1="20" x2="13.5" y2="16.2" stroke-width="2"/><line x1="20" y1="20" x2="28.5" y2="13" stroke-width="1.6"/>'
        +'<circle cx="20" cy="20" r="1.6" fill="currentColor" stroke="none"/>';
    }
    return '<svg class="bbadge" width="'+size+'" height="'+size+'" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" aria-hidden="true">'
      +'<circle cx="20" cy="20" r="19"/>'+t+mid+'</svg>';
  }
  function wordmark(b,raw){
    if(b)return '<span class="bword '+esc(b.style)+'">'+esc(b.name)+'</span>';
    return raw?'<span class="bword plain">'+esc(raw)+'</span>':'';
  }

  var css=document.createElement("style");
  css.textContent='.bbadge{color:var(--accent);flex:none;display:block}'
    +'.bword{display:block;color:var(--accent);line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:12px}'
    +'.bword.roman{font-family:"Times New Roman",Georgia,serif;letter-spacing:.22em;text-transform:uppercase}'
    +'.bword.didone{font-family:Didot,"Bodoni 72","Bodoni MT","Times New Roman",serif;letter-spacing:.14em;text-transform:uppercase;font-weight:700}'
    +'.bword.grotesk{font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase;font-weight:800}'
    +'.bword.wide{font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;letter-spacing:.34em;text-transform:uppercase;font-weight:300}'
    +'.bword.italic{font-family:Georgia,"Times New Roman",serif;font-style:italic;letter-spacing:.04em;font-size:14px}'
    +'.bword.plain{letter-spacing:.12em;text-transform:uppercase;font-weight:600;color:var(--muted)}';
  document.head.appendChild(css);

  window.Brands={loaded:false,find:find,forWatch:forWatch,badge:badge,wordmark:wordmark,list:function(){return list.slice();}};
  fetch("/brands.txt",{cache:"no-store"}).then(function(r){return r.ok?r.text():"";}).catch(function(){return "";})
    .then(function(txt){parse(txt);Brands.loaded=true;window.dispatchEvent(new Event("swcbrands"));});
})();
