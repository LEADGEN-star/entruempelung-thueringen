/* ══ Vorher/Nachher — ziehen ══ */
(function(){
  var PAIRS=[
    {v:"/img-vorher-1.jpg",n:"/img-nachher-1.jpg",
     va:"Vollgestellter Keller vor der Entrümpelung (Beispielbild)",
     na:"Geräumter, besenreiner Raum nach der Entrümpelung (Beispielbild)",
     vt:"Vollgestellt & überfüllt",vs:"Jahrzehnte angesammelter Hausrat, alte Möbel, Kisten",
     nt:"Leer & besenrein",ns:"Vollständig geräumt, sauber übergeben"},
    {v:"/img-vorher-2.jpg",n:"/img-nachher-2.jpg",
     va:"Vollgestellter Raum vor der Wohnungsauflösung (Beispielbild)",
     na:"Leerer, besenreiner Wohnraum nach der Wohnungsauflösung (Beispielbild)",
     vt:"Wohnungsauflösung",vs:"Möbel, Kartons, persönliche Gegenstände – alles muss raus",
     nt:"Besenrein übergeben",ns:"Bereit für Übergabe an Vermieter oder Neubezug"},
    {v:"/img-vorher-3.jpg",n:"/img-nachher-3.jpg",
     va:"Vollgestellter Dachboden vor der Entrümpelung (Beispielbild)",
     na:"Leerer, geräumter Raum nach der Dachbodenentrümpelung (Beispielbild)",
     vt:"Dachboden voller Altlasten",vs:"Jahrzehnte altes Gerümpel, Möbel und Kisten",
     nt:"Freier Dachboden",ns:"Neuer nutzbarer Raum – für Ausbau oder Lagerung"}
  ];
  // Nur auf der Startseite vorhanden – sonst still aussteigen
  if(!document.getElementById('slider'))return;
  var el=document.getElementById('slider'),knob=document.getElementById('knob'),
      hint=document.getElementById('hint'),
      imgV=document.getElementById('imgV'),imgN=document.getElementById('imgN'),
      pos=55,dragging=false;

  function set(p,touched){
    pos=Math.max(0,Math.min(100,p));
    el.style.setProperty('--pos',pos+'%');
    knob.setAttribute('aria-valuenow',Math.round(pos));
    if(touched)el.classList.add('touched');
  }
  function fromX(x){
    var r=el.getBoundingClientRect();
    set((x-r.left)/r.width*100,true);
  }
  function stop(){
    if(!dragging)return;
    dragging=false;el.classList.remove('dragging');
  }
  el.addEventListener('pointerdown',function(e){
    e.preventDefault();
    dragging=true;el.classList.add('dragging');
    fromX(e.clientX);
  });
  // Auf Fensterebene verfolgen: der Griff bleibt am Finger, auch ausserhalb des Bildes
  window.addEventListener('pointermove',function(e){
    if(!dragging)return;
    e.preventDefault();
    fromX(e.clientX);
  },{passive:false});
  window.addEventListener('pointerup',stop);
  window.addEventListener('pointercancel',stop);

  knob.addEventListener('keydown',function(e){
    var d=e.key==='ArrowLeft'?-4:e.key==='ArrowRight'?4:e.key==='Home'?-100:e.key==='End'?100:0;
    if(!d)return;
    e.preventDefault();set(pos+d,true);
  });

  function load(i){
    var p=PAIRS[i];
    imgV.src=p.v;imgV.alt=p.va;
    imgN.src=p.n;imgN.alt=p.na;
    document.getElementById('capVt').textContent=p.vt;
    document.getElementById('capVs').textContent=p.vs;
    document.getElementById('capNt').textContent=p.nt;
    document.getElementById('capNs').textContent=p.ns;
  }
  document.querySelectorAll('.seg button').forEach(function(b){
    b.addEventListener('click',function(){
      document.querySelectorAll('.seg button').forEach(function(x){x.setAttribute('aria-selected','false');});
      b.setAttribute('aria-selected','true');
      load(+b.dataset.i);
    });
  });
  // Ruhezustand: sichtbar, nichts wartet auf Scrollen
  set(55,false);
  setTimeout(function(){ if(!el.classList.contains('touched'))el.classList.add('touched'); },7000);
})();

/* ══ Preisrechner ══ */
(function(){
  var sel={},
   prices={
    keller:{s:[120,200],m:[180,320],l:[280,500],xl:[400,700]},
    wohnung:{s:[200,380],m:[350,650],l:[550,950],xl:[800,1400]},
    haus:{s:[500,900],m:[800,1400],l:[1200,2000],xl:[1600,2800]},
    dachboden:{s:[150,280],m:[250,450],l:[380,700],xl:[600,1100]},
    gewerbe:{s:[250,500],m:[450,850],l:[700,1300],xl:[1100,2000]},
    ferienhaus:{s:[200,400],m:[350,650],l:[550,950],xl:[800,1500]}
   },
   faktor={wenig:.85,mittel:1,viel:1.25},
   steps=document.querySelectorAll('.cstep'),dots=document.querySelectorAll('.dot-i'),
   again=document.querySelector('.again'),
   reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Der Rechner steht nur auf der Startseite
  if(!steps.length||!again)return;

  function go(n){
    steps.forEach(function(s){s.classList.remove('on');});
    dots.forEach(function(d,k){d.classList.toggle('on',k<n-1||n>3);});
    var t=n>3?document.querySelector('[data-c="result"]'):document.querySelector('[data-c="'+n+'"]');
    if(t)t.classList.add('on');
  }
  function active(){var a=document.querySelector('.cstep.on');return a?a.dataset.c:'1';}

  function countTo(lo,hi){
    var out=document.getElementById('resp');
    if(reduce){out.textContent=lo+' – '+hi+' €';return;}
    var t0=performance.now(),dur=520;
    (function tick(t){
      var k=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-k,3);
      out.textContent=Math.round(lo*e/10)*10+' – '+Math.round(hi*e/10)*10+' €';
      if(k<1)requestAnimationFrame(tick);else out.textContent=lo+' – '+hi+' €';
    })(t0);
  }
  function result(){
    var w=sel.was?sel.was.v:'keller',g=sel.groesse?sel.groesse.v:'m',
        f=sel.fuellstand?sel.fuellstand.v:'mittel',
        base=(prices[w]&&prices[w][g])||[150,300],ff=faktor[f]||1,
        lo=Math.round(base[0]*ff/10)*10,hi=Math.round(base[1]*ff/10)*10;
    document.getElementById('ressub').textContent=
      (sel.was?sel.was.l:'')+' · '+(sel.groesse?sel.groesse.l:'')+' · '+(sel.fuellstand?sel.fuellstand.l:'');
    go(4);countTo(lo,hi);
  }
  document.querySelectorAll('.opt').forEach(function(b){
    b.addEventListener('click',function(){
      var step=active(),key=b.closest('.opts').dataset.key;
      b.closest('.opts').querySelectorAll('.opt').forEach(function(x){x.classList.remove('on');});
      b.classList.add('on');
      sel[key]={v:b.dataset.v,l:b.dataset.l};
      setTimeout(function(){
        if(step==='1')go(2);else if(step==='2')go(3);else if(step==='3')result();
      },165);
    });
  });
  again.addEventListener('click',function(){
    sel={};document.querySelectorAll('.opt').forEach(function(x){x.classList.remove('on');});go(1);
  });
})();

/* ══ Formulare ══ */
(function(){
  var KEY='c3737ff3-c4ec-4c76-b89a-51eb8528af97';
  var LIVE=location.hostname.indexOf('entruempelung')!==-1;
  document.querySelectorAll('#kontakt1, #kontakt2').forEach(function(form){
    form.addEventListener('submit',async function(e){
      e.preventDefault();
      var btn=form.querySelector('button[type="submit"]'),old=btn.textContent;
      btn.disabled=true;btn.textContent='Wird gesendet…';
      if(!LIVE){
        btn.textContent='Gesendet';
        var p=document.createElement('p');p.className='ok';
        p.textContent='Design-Vorschau – auf der Live-Seite geht diese Anfrage an Ihr Postfach.';
        btn.insertAdjacentElement('afterend',p);
        return;
      }
      var data={};new FormData(form).forEach(function(v,k){data[k]=v;});
      data.access_key=KEY;
      data.subject='Neue Anfrage – Entrümpelung Thüringen';
      data.seite=location.href;
      data.datum=new Date().toLocaleString('de-DE',{timeZone:'Europe/Berlin'});
      try{
        var res=await fetch('https://api.web3forms.com/submit',{method:'POST',
          headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
        var json=await res.json();
        if(!json.success)throw new Error(json.message);
      }catch(err){
        btn.disabled=false;btn.textContent=old;
        alert('Fehler beim Senden. Bitte rufen Sie uns direkt an: 01573 0064205');
        return;
      }
      location.href='/danke.html';
    });
  });

  /* Stadtseiten-Formular: bringt seine Felder als versteckte Eingaben selbst mit */
  var stadt=document.getElementById('contact-form');
  if(!stadt)return;
  stadt.addEventListener('submit',function(e){
    e.preventDefault();
    var btn=stadt.querySelector('button[type="submit"]'),old=btn.textContent;
    btn.disabled=true;btn.textContent='Wird gesendet …';
    function fail(){btn.textContent='Fehler – bitte WhatsApp nutzen';btn.disabled=false;}
    fetch('https://api.web3forms.com/submit',{method:'POST',body:new FormData(stadt)})
      .then(function(r){return r.json();})
      .then(function(d){ if(d.success){location.href='/danke';} else {fail();} })
      .catch(fail);
  });
})();
