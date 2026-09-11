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

/* ══ Fotoanfrage ══
   Handybilder sind 4–8 MB. Drei davon sprengen jeden Formularversand,
   deshalb werden sie hier im Browser verkleinert, bevor sie rausgehen. */
var Fotos = (function(){
  var MAX = 3, KANTE = 1600, QUALITAET = .72;

  function verkleinern(file){
    return new Promise(function(fertig, fehler){
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function(){
        URL.revokeObjectURL(url);
        var f = Math.min(1, KANTE / Math.max(img.width, img.height));
        var w = Math.max(1, Math.round(img.width * f));
        var h = Math.max(1, Math.round(img.height * f));
        var c = document.createElement('canvas');
        c.width = w; c.height = h;
        var ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        c.toBlob(function(blob){ blob ? fertig(blob) : fehler(new Error('leer')); },
                 'image/jpeg', QUALITAET);
      };
      img.onerror = function(){ URL.revokeObjectURL(url); fehler(new Error('kein Bild')); };
      img.src = url;
    });
  }

  function aufbauen(box){
    var eingabe = box.querySelector('[data-photo-input]'),
        oeffnen = box.querySelector('[data-photo-open]'),
        liste   = box.querySelector('[data-photo-list]'),
        hinweis = box.querySelector('[data-photo-note]'),
        bilder  = [];

    function melden(text, warnen){
      hinweis.textContent = text || '';
      hinweis.hidden = !text;
      hinweis.classList.toggle('warn', !!warnen);
    }

    function zeichnen(){
      liste.textContent = '';
      bilder.forEach(function(b, i){
        var t = document.createElement('div');
        t.className = 'thumb';

        var img = document.createElement('img');
        img.src = b.vorschau;
        img.alt = 'Foto ' + (i + 1);

        var kb = document.createElement('span');
        kb.className = 'kb';
        kb.textContent = Math.round(b.blob.size / 1024) + ' KB';

        var weg = document.createElement('button');
        weg.type = 'button';
        weg.setAttribute('aria-label', 'Foto ' + (i + 1) + ' entfernen');
        weg.innerHTML = '<svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2.5 2.5l7 7M9.5 2.5l-7 7"/></svg>';
        weg.addEventListener('click', function(){
          URL.revokeObjectURL(b.vorschau);
          bilder.splice(i, 1);
          zeichnen();
          melden(bilder.length ? bilder.length + ' von ' + MAX + ' Fotos' : '');
        });

        t.append(img, kb, weg);
        liste.appendChild(t);
      });
      oeffnen.hidden = bilder.length >= MAX;
    }

    function annehmen(dateien){
      var neue = Array.prototype.slice.call(dateien)
                   .filter(function(f){ return /^image\//.test(f.type); });
      if (!neue.length) { melden('Bitte Bilddateien auswählen.', true); return; }

      var platz = MAX - bilder.length;
      var zuviel = neue.length > platz;
      neue = neue.slice(0, platz);
      melden('Fotos werden vorbereitet …');

      Promise.all(neue.map(function(f){
        return verkleinern(f).then(
          function(blob){ return { blob: blob, vorschau: URL.createObjectURL(blob) }; },
          function(){ return null; }
        );
      })).then(function(ergebnis){
        var ok = ergebnis.filter(Boolean);
        bilder = bilder.concat(ok);
        zeichnen();
        if (ok.length < ergebnis.length) melden('Ein Bild konnte nicht gelesen werden.', true);
        else if (zuviel) melden('Es sind maximal ' + MAX + ' Fotos möglich.', true);
        else melden(bilder.length + ' von ' + MAX + ' Fotos');
      });
    }

    oeffnen.addEventListener('click', function(){ eingabe.click(); });
    eingabe.addEventListener('change', function(){
      annehmen(eingabe.files);
      eingabe.value = '';
    });

    ['dragenter','dragover'].forEach(function(e){
      box.addEventListener(e, function(ev){ ev.preventDefault(); box.classList.add('is-over'); });
    });
    ['dragleave','drop'].forEach(function(e){
      box.addEventListener(e, function(ev){ ev.preventDefault(); box.classList.remove('is-over'); });
    });
    box.addEventListener('drop', function(ev){
      if (ev.dataTransfer && ev.dataTransfer.files) annehmen(ev.dataTransfer.files);
    });

    return {
      anhaengen: function(fd){
        bilder.forEach(function(b, i){ fd.append('foto' + (i + 1), b.blob, 'foto' + (i + 1) + '.jpg'); });
        return bilder.length;
      },
      leeren: function(){
        bilder.forEach(function(b){ URL.revokeObjectURL(b.vorschau); });
        bilder = []; zeichnen(); melden('');
      }
    };
  }

  var register = new WeakMap();
  document.querySelectorAll('[data-photos]').forEach(function(box){
    register.set(box.closest('form') || box, aufbauen(box));
  });
  return {
    zu: function(form){ return register.get(form) || null; }
  };
})();

/* ══ Formulare ══ */
(function(){
  var KEY  = 'c3737ff3-c4ec-4c76-b89a-51eb8528af97';
  var LIVE = location.hostname.indexOf('entruempelung') !== -1;

  document.querySelectorAll('#kontakt1, #kontakt2').forEach(function(form){
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]'), alt = btn.textContent;
      var fotos = Fotos.zu(form);
      btn.disabled = true;
      btn.textContent = 'Wird gesendet…';

      // Multipart statt JSON – nur so reisen die Fotos mit.
      var fd = new FormData(form);
      fd.append('access_key', KEY);
      fd.append('subject', 'Neue Anfrage – Entrümpelung Thüringen');
      fd.append('seite', location.href);
      fd.append('datum', new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' }));
      var anzahl = fotos ? fotos.anhaengen(fd) : 0;
      fd.append('fotos', String(anzahl));

      if (!LIVE) {
        btn.textContent = 'Gesendet';
        var p = document.createElement('p');
        p.className = 'ok';
        p.textContent = 'Design-Vorschau – auf der Live-Seite geht diese Anfrage an Ihr Postfach'
          + (anzahl ? ', samt ' + anzahl + ' Foto' + (anzahl > 1 ? 's' : '') : '') + '.';
        btn.insertAdjacentElement('afterend', p);
        return;
      }

      fetch('https://api.web3forms.com/submit', { method: 'POST', body: fd })
        .then(function(r){ return r.json(); })
        .then(function(d){
          if (!d.success) throw new Error(d.message);
          location.href = '/danke.html';
        })
        .catch(function(){
          btn.disabled = false;
          btn.textContent = alt;
          alert('Fehler beim Senden. Bitte rufen Sie uns direkt an: 01573 0064205');
        });
    });
  });

  /* Stadtseiten-Formular: bringt seine Felder als versteckte Eingaben selbst mit */
  var stadt = document.getElementById('contact-form');
  if (!stadt) return;
  stadt.addEventListener('submit', function(e){
    e.preventDefault();
    var btn = stadt.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Wird gesendet …';
    function daneben(){ btn.textContent = 'Fehler – bitte WhatsApp nutzen'; btn.disabled = false; }
    var fd = new FormData(stadt);
    var fotos = Fotos.zu(stadt);
    if (fotos) fd.append('fotos', String(fotos.anhaengen(fd)));
    fetch('https://api.web3forms.com/submit', { method: 'POST', body: fd })
      .then(function(r){ return r.json(); })
      .then(function(d){ d.success ? location.href = '/danke' : daneben(); })
      .catch(daneben);
  });
})();

/* ══ Reaktionsschicht ══
   Die Seite soll antworten, nicht zappeln: Licht folgt dem Zeiger,
   Inhalte setzen sich beim Scrollen. Alles rein additiv – ohne
   JavaScript bleibt die Seite vollstaendig sichtbar. */
(function(){
  var ruhig = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (ruhig) return;

  /* 1. Licht im Kopfbereich */
  var hero = document.querySelector('.hero');
  if (hero && matchMedia('(pointer:fine)').matches) {
    var zielX = 72, zielX2 = 72, zielY = 0, zielY2 = 0, laeuft = false;
    function schritt(){
      zielX2 += (zielX - zielX2) * .06;
      zielY2 += (zielY - zielY2) * .06;
      hero.style.setProperty('--lx', zielX2.toFixed(2) + '%');
      hero.style.setProperty('--ly', zielY2.toFixed(2) + '%');
      if (Math.abs(zielX - zielX2) > .1 || Math.abs(zielY - zielY2) > .1) requestAnimationFrame(schritt);
      else laeuft = false;
    }
    window.addEventListener('pointermove', function(e){
      var r = hero.getBoundingClientRect();
      if (e.clientY > r.bottom + 200) return;
      zielX = (e.clientX / window.innerWidth) * 100;
      zielY = Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100));
      if (!laeuft) { laeuft = true; requestAnimationFrame(schritt); }
    }, { passive: true });
  }

  /* 2. Schimmer auf dem Foto-Vergleich */
  var slider = document.getElementById('slider');
  if (slider && matchMedia('(pointer:fine)').matches) {
    slider.addEventListener('pointermove', function(e){
      var r = slider.getBoundingClientRect();
      slider.style.setProperty('--sx', ((e.clientX - r.left) / r.width * 100) + '%');
      slider.style.setProperty('--sy', ((e.clientY - r.top) / r.height * 100) + '%');
      slider.classList.add('lit');
    }, { passive: true });
    slider.addEventListener('pointerleave', function(){ slider.classList.remove('lit'); });
  }

  /* 3. Inhalte setzen sich */
  if (!('IntersectionObserver' in window)) return;
  var ziele = [];
  document.querySelectorAll('.sec, .basin, .strip').forEach(function(abschnitt){
    var kinder = abschnitt.querySelectorAll(
      ':scope > .wrap > .shead, :scope > .wrap > .seg, :scope > .wrap > .slider,'
      + ' :scope > .wrap > .bacap, :scope > .wrap > .steps > .step,'
      + ' :scope > .wrap > .infos > .info, :scope > .wrap > .svcs > .svc,'
      + ' :scope > .wrap > .rgrid > *, :scope > .wrap > .towns > .town,'
      + ' :scope > .wrap > .faq > details, :scope > .wrap > .cgrid > *,'
      + ' :scope > .wrap > .rhead, :scope > .wrap > .bgrid > *,'
      + ' :scope > .wrap.cgrid > *, :scope > .wrap.bgrid > *');
    kinder.forEach(function(k){ ziele.push(k); });
  });
  if (!ziele.length) return;

  ziele.forEach(function(k){ k.classList.add('rise'); });
  var beobachter = new IntersectionObserver(function(eintraege){
    eintraege.forEach(function(e){
      if (!e.isIntersecting) return;
      var i = ziele.indexOf(e.target) % 6;
      e.target.style.transitionDelay = (i * 55) + 'ms';
      e.target.classList.add('here');
      beobachter.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
  ziele.forEach(function(k){ beobachter.observe(k); });
})();
