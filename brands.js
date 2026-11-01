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
   Style "led" draws 14-segment LED characters as SVG instead of text. Unlit
   segments are drawn too but hidden; a container with class "led-dim" shows
   them faintly. Use that only where the letters are at least ~20 px high:
   smaller, they blur into a grey haze. Names with characters the segments
   cannot show (Ω, Cyrillic) fall back to grotesk.
   Use: <script src="/brands.js?v=2"></script> */
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

  // 14-segment cell, 6 x 10 units: a top, b/c right, d bottom, e/f left, g1/g2 middle,
  // h/j upper diagonals, i/l centre verticals, k/m lower diagonals
  var X0=.5,X1=3,X2=5.5,Y0=.5,Y1=5,Y2=9.5,G=.65,ADV=7.4,SPACE=4;
  var SEG={
    a:[X0+G,Y0,X2-G,Y0],b:[X2,Y0+G,X2,Y1-G],c:[X2,Y1+G,X2,Y2-G],d:[X0+G,Y2,X2-G,Y2],
    e:[X0,Y1+G,X0,Y2-G],f:[X0,Y0+G,X0,Y1-G],g1:[X0+G,Y1,X1-G*.6,Y1],g2:[X1+G*.6,Y1,X2-G,Y1],
    h:[X0+G*1.2,Y0+G*1.2,X1-G*.7,Y1-G*1.1],i:[X1,Y0+G,X1,Y1-G],j:[X2-G*1.2,Y0+G*1.2,X1+G*.7,Y1-G*1.1],
    k:[X1-G*.7,Y1+G*1.1,X0+G*1.2,Y2-G*1.2],l:[X1,Y1+G,X1,Y2-G],m:[X1+G*.7,Y1+G*1.1,X2-G*1.2,Y2-G*1.2]
  };
  var SEGS="a b c d e f g1 g2 h i j k l m".split(" ");
  var LED={A:"a b c e f g1 g2",B:"a b c d g2 i l",C:"a d e f",D:"a b c d i l",E:"a d e f g1",F:"a e f g1",G:"a c d e f g2",
    H:"b c e f g1 g2",I:"a d i l",J:"b c d e",K:"e f g1 j m",L:"d e f",M:"b c e f h j",N:"b c e f h m",O:"a b c d e f",
    P:"a b e f g1 g2",Q:"a b c d e f m",R:"a b e f g1 g2 m",S:"a c d f g1 g2",T:"a i l",U:"b c d e f",V:"e f k j",W:"b c e f k m",
    X:"h j k m",Y:"h j l",Z:"a d j k","0":"a b c d e f j k","1":"b c j","2":"a b d e g1 g2","3":"a b c d g2","4":"b c f g1 g2",
    "5":"a c d f g1 g2","6":"a c d e f g1 g2","7":"a b c","8":"a b c d e f g1 g2","9":"a b c d f g1 g2","-":"g1 g2","&":"g1 g2 i l"};
  // cells for a text: null = space, "." = dot, array = lit segments; false if a letter can't be shown
  function ledCells(txt){
    var out=[],ok=true;
    String(txt).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase().split("").forEach(function(ch){
      if(ch===" ")out.push(null);
      else if(ch===".")out.push(".");
      else if(LED[ch])out.push(LED[ch].split(" "));
      else if(/[\p{L}\p{N}]/u.test(ch))ok=false; // other punctuation is left out
    });
    return ok&&out.some(Array.isArray)?out:false;
  }
  // segment lines, starting at x=0; returns { svg, w } in cell units
  function ledBody(cells){
    var x=0,t="";
    cells.forEach(function(c){
      if(c===null){x+=SPACE;return;}
      if(c==="."){t+='<circle cx="'+(x+.4).toFixed(2)+'" cy="'+Y2+'" r=".7" fill="currentColor" stroke="none"/>';x+=2.4;return;}
      SEGS.forEach(function(s){
        var p=SEG[s];
        t+='<line'+(c.indexOf(s)<0?' class="off"':'')+' x1="'+(x+p[0]).toFixed(2)+'" y1="'+p[1]+'" x2="'+(x+p[2]).toFixed(2)+'" y2="'+p[3]+'"/>';
      });
      x+=ADV;
    });
    return {svg:t,w:x-(ADV-6)};
  }

  var SERIF="Times New Roman,Georgia,serif",SANS="Helvetica Neue,Helvetica,Arial,sans-serif";
  function badge(b,size){
    var t="";
    for(var i=0;i<12;i++){
      var a=i*Math.PI/6,r1=i%3?16.2:15;
      t+='<line x1="'+(20+r1*Math.sin(a)).toFixed(2)+'" y1="'+(20-r1*Math.cos(a)).toFixed(2)
        +'" x2="'+(20+18*Math.sin(a)).toFixed(2)+'" y2="'+(20-18*Math.cos(a)).toFixed(2)+'"/>';
    }
    var mid,cells=b&&b.mono&&b.style==="led"&&ledCells(b.mono);
    if(cells){
      // fit the monogram in the dial; unlit segments only where the letters reach ~20 px
      var body=ledBody(cells),sc=Math.min(1.25,17/body.w);
      mid='<g transform="translate('+(20-body.w*sc/2).toFixed(2)+' '+(20-5*sc).toFixed(2)+') scale('+sc.toFixed(3)+')" stroke-width="1.15"'
        +(10*sc*size/40>=20?' class="lit"':'')+'>'+body.svg+'</g>';
    }else if(b&&b.mono){
      var m=b.mono,serif=b.style!=="grotesk"&&b.style!=="wide"&&b.style!=="led";
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
    var cells=b&&b.style==="led"&&ledCells(b.name);
    if(cells){
      var body=ledBody(cells),vw=body.w+1.6;
      return '<span class="bword led"><svg role="img" aria-label="'+esc(b.name)+'" viewBox="-.8 -.8 '+vw.toFixed(2)+' 11.6"'
        +' style="width:'+(vw/11.6*1.06).toFixed(3)+'em" fill="none" stroke="currentColor" stroke-width="1.15" stroke-linecap="round">'
        +body.svg+'</svg></span>';
    }
    if(b)return '<span class="bword '+esc(b.style==="led"?"grotesk":b.style)+'">'+esc(b.name)+'</span>';
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
    +'.bword.led svg{display:block;height:1.06em;overflow:visible}'
    +'.bword.led .off,.bbadge .off{opacity:0}'
    +'.led-dim .bword.led .off,.bbadge .lit .off{opacity:.18}'
    +'.bword.plain{letter-spacing:.12em;text-transform:uppercase;font-weight:600;color:var(--muted)}';
  document.head.appendChild(css);

  window.Brands={loaded:false,find:find,forWatch:forWatch,badge:badge,wordmark:wordmark,list:function(){return list.slice();}};
  fetch("/brands.txt",{cache:"no-store"}).then(function(r){return r.ok?r.text():"";}).catch(function(){return "";})
    .then(function(txt){parse(txt);Brands.loaded=true;window.dispatchEvent(new Event("swcbrands"));});
})();
