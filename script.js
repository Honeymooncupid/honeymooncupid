  const backdrop = document.getElementById('backdrop');
  const titleCard = document.getElementById('titleCard');
  const scene = document.getElementById('scene');

  // two music widgets (angel's bottom right, Jai's bottom left) share one player
  const players = Array.from(document.querySelectorAll('.music')).map(root => {
    const get = (role) => root.querySelector('[data-role="' + role + '"]');
    return {
      root, tab: get('tab'), title: get('title'), artist: get('artist'), bar: get('bar'),
      fill: get('fill'), prev: get('prev'), play: get('play'), next: get('next'), mute: get('mute')
    };
  });
  const scIframe = document.getElementById('scPlayer');
  const body = document.body;

  // only the songs you pick live here. add more links to grow the playlist
  // titles marked auto get filled in from SoundCloud once the song loads
  const PLAYLIST = [
    { url: 'https://soundcloud.com/mattalexanderreilly/yes-to-heaven-say-yes-to', title: 'Say Yes to Heaven', artist: 'Lana Del Rey' },
    { url: 'https://soundcloud.com/7nariq/angelsforeverforeverangels', title: 'Angels Forever', artist: 'Lana Del Rey' },
    { url: 'https://soundcloud.com/user-503161897/bbm-baby-lana-del-rey', title: 'BBM Baby', artist: 'Lana Del Rey' },
    { url: 'https://soundcloud.com/megan-budnick/prom-song-gone-wrong', title: 'Prom Song Gone Wrong', artist: '', auto: true }
  ];
  let current = 0;

  let revealed = false;
  let sceneReady = false;
  let view = 'home';
  let muted = false;
  let playing = false;
  let scReady = false;
  let wantsToPlay = false;

  // if SoundCloud is blocked or slow to load, the rest of the page still works
  const noop = () => {};
  let scWidget = { bind: noop, play: noop, pause: noop, setVolume: noop, load: noop, seekTo: noop, getDuration: noop, getCurrentSound: noop };
  try {
    if (window.SC && SC.Widget) scWidget = SC.Widget(scIframe);
  } catch (err) {
    console.warn('SoundCloud player unavailable', err);
  }

  function showTrack(){
    const t = PLAYLIST[current];
    players.forEach(p => {
      p.title.textContent = t.title;
      p.artist.textContent = t.artist;
      p.fill.style.width = '0%';
    });
  }

  function setPlayingUI(isPlaying){
    playing = isPlaying;
    players.forEach(p => {
      p.play.textContent = isPlaying ? '❚❚' : '▶';
      p.play.setAttribute('aria-label', isPlaying ? 'Pause music' : 'Play music');
    });
  }

  function fillFromSoundCloud(){
    const t = PLAYLIST[current];
    if (!t.auto) return;
    scWidget.getCurrentSound((snd) => {
      if (!snd || PLAYLIST[current] !== t) return;
      t.title = snd.title || t.title;
      t.artist = (snd.user && snd.user.username) || t.artist;
      showTrack();
    });
  }

  function loadTrack(i, autoplay){
    current = (i + PLAYLIST.length) % PLAYLIST.length;
    showTrack();
    scWidget.load(PLAYLIST[current].url, {
      auto_play: autoplay,
      hide_related: true,
      show_comments: false,
      show_user: false,
      show_reposts: false,
      show_teaser: false,
      visual: false
    });
  }

  scWidget.bind(SC.Widget.Events.READY, () => {
    scReady = true;
    scWidget.setVolume(muted ? 0 : 100);
    fillFromSoundCloud();
    if (wantsToPlay) scWidget.play();
  });
  scWidget.bind(SC.Widget.Events.PLAY, () => setPlayingUI(true));
  scWidget.bind(SC.Widget.Events.PAUSE, () => setPlayingUI(false));
  scWidget.bind(SC.Widget.Events.PLAY_PROGRESS, (e) => {
    players.forEach(p => { p.fill.style.width = (e.relativePosition * 100).toFixed(1) + '%'; });
  });
  scWidget.bind(SC.Widget.Events.FINISH, () => {
    if (PLAYLIST.length > 1){
      loadTrack(current + 1, true);
    } else {
      scWidget.seekTo(0);
      scWidget.play();
    }
  });

  if (PLAYLIST.length > 1){
    players.forEach(p => { p.prev.hidden = false; p.next.hidden = false; });
  }
  showTrack();

  function reveal(){
    if (revealed) return;
    revealed = true;

    backdrop.classList.add('hidden');
    body.classList.add('entered');
    players.forEach(p => p.root.classList.add('visible'));

    wantsToPlay = true;
    if (scReady) scWidget.play();

    setTimeout(() => titleCard.classList.add('visible'), 300);
    setTimeout(() => {
      sceneReady = true;
      if (view === 'home') scene.classList.add('visible');
    }, 300 + 3000);
  }

  players.forEach(pl => {
    pl.tab.addEventListener('click', () => {
      const open = pl.root.classList.toggle('open');
      pl.tab.setAttribute('aria-expanded', String(open));
      pl.tab.setAttribute('aria-label', open ? 'Close music player' : 'Open music player');
    });

    pl.play.addEventListener('click', () => {
      wantsToPlay = !playing;
      if (playing) scWidget.pause(); else scWidget.play();
    });

    pl.mute.addEventListener('click', () => {
      muted = !muted;
      scWidget.setVolume(muted ? 0 : 100);
      players.forEach(q => {
        q.mute.textContent = muted ? '🔇' : '🔊';
        q.mute.setAttribute('aria-pressed', String(muted));
        q.mute.setAttribute('aria-label', muted ? 'Unmute music' : 'Mute music');
      });
    });

    pl.prev.addEventListener('click', () => loadTrack(current - 1, true));
    pl.next.addEventListener('click', () => loadTrack(current + 1, true));

    pl.bar.addEventListener('click', (e) => {
      const r = pl.bar.getBoundingClientRect();
      const pct = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1);
      scWidget.getDuration((ms) => scWidget.seekTo(ms * pct));
    });
  });

  document.getElementById('btnOk').addEventListener('click', reveal);

  // flip the photo card
  const card = document.getElementById('card');

  function flipCard(){
    const flipped = card.classList.toggle('flipped');
    card.setAttribute('aria-pressed', String(flipped));
  }

  card.addEventListener('click', flipCard);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' '){
      e.preventDefault();
      flipCard();
    }
  });


  // ---------- letters (carousel) ----------
  // edit these! one object per letter card.
  //   name: what's written on the front   |  date: optional, bottom-right of the front
  //   text: the letter. leave a blank line (\n\n) between paragraphs
  //   to / from: optional greeting and sign-off
  // these are just placeholders - replace them with your real letters

  // angel's side (pink cards)
  const LETTERS = [
    {
         name: 'open when you miss me',
         date: '',
         to: 'Jai,',
         text: 'Kung miss mo ko, mas miss kita tanga.',
         from: '— Angel'
       },
       {
         name: 'Open when ur sad',
         date: '',
         to: 'Jai,',
         text: 'Call mo ko dali.',
         from: '— Angel'
       },
       {
         name: 'Wala lang',
         date: '',
         to: 'Jai,',
         text: 'Sakin ka lang. haha.',
         from: '— Angel'
       },
       {
         name: 'If galit ka',
         date: '13/10/2026',
         to: 'Jai,',
         text: 'Wag ka na magalit. UwU',
         from: '— Angel'
       }
  ];

  // Jai's side (green cards)
  const JAI_LETTERS = [
    {
      name: 'open when you miss me',
      date: '',
      to: 'Angel,',
      text: '',
      from: '— Jai'
    },
    {
      name: 'open when you need a smile',
      date: '',
      to: 'Angel,',
      text: '',
      from: '— Jai'
    },
    {
      name: 'just because',
      date: '',
      to: 'Angel,',
      text: '',
      from: '— Jai'
    }
  ];

  let world = 'angel';   // which side is showing: 'angel' or 'jai'
  let jaiView = 'home';  // which page is open on Jai's side

  // builds one carousel from a list of letters. used for both sides
  function createLetterCarousel(letters, ids){
    const viewport = document.getElementById(ids.viewport);
    const track = document.getElementById(ids.track);
    const dotsBox = document.getElementById(ids.dots);
    const prevLetter = document.getElementById(ids.prev);
    const nextLetter = document.getElementById(ids.next);

    const slides = [];
    const cards = [];
    const dots = [];
    let slideIndex = 0;
    let dragStartX = null;
    let dragDX = 0;
    let dragMoved = false;

    function setFlipped(i, flipped){
      const el = cards[i];
      if (!el) return;
      el.classList.toggle('flipped', flipped);
      el.setAttribute('aria-pressed', String(flipped));
      el.setAttribute('aria-label', (flipped ? 'Close letter: ' : 'Open letter: ') + letters[i].name);
      if (flipped) el.querySelector('.letter__body').scrollTop = 0;
    }

    function makeLetterCard(l, i){
      const el = document.createElement('div');
      el.className = 'card letter';
      el.setAttribute('role', 'button');
      el.setAttribute('aria-pressed', 'false');
      el.setAttribute('aria-label', 'Open letter: ' + l.name);

      const inner = document.createElement('div');
      inner.className = 'card__inner';

      const front = document.createElement('div');
      front.className = 'card__face card__front';
      const seal = document.createElement('div');
      seal.className = 'letter__seal';
      seal.setAttribute('aria-hidden', 'true');
      seal.textContent = '♡';
      const name = document.createElement('p');
      name.className = 'letter__name';
      name.textContent = l.name;
      front.append(seal, name);
      if (l.date){
        const d = document.createElement('p');
        d.className = 'letter__date';
        d.textContent = l.date;
        front.appendChild(d);
      }

      const back = document.createElement('div');
      back.className = 'card__face card__back';
      const body = document.createElement('div');
      body.className = 'letter__body';
      if (l.to){
        const p = document.createElement('p');
        p.className = 'letter__to';
        p.textContent = l.to;
        body.appendChild(p);
      }
      String(l.text || '').split(/\n\s*\n/).forEach(para => {
        const p = document.createElement('p');
        p.textContent = para.trim();
        body.appendChild(p);
      });
      if (l.from){
        const p = document.createElement('p');
        p.className = 'letter__sig';
        p.textContent = l.from;
        body.appendChild(p);
      }
      back.appendChild(body);

      inner.append(front, back);
      el.appendChild(inner);

      // tapping a side card brings it to the middle; tapping the middle card flips it
      el.addEventListener('click', () => {
        if (i !== slideIndex) goTo(i);
        else setFlipped(i, !el.classList.contains('flipped'));
      });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' '){
          e.preventDefault();
          el.click();
        }
      });
      return el;
    }

    // slide the track so the active card sits in the middle of the screen
    function layout(){
      const s = slides[slideIndex];
      if (!s) return;
      const x = viewport.clientWidth / 2 - (s.offsetLeft + s.offsetWidth / 2) + dragDX;
      track.style.transform = 'translateX(' + x.toFixed(1) + 'px)';
    }

    function goTo(i){
      i = Math.max(0, Math.min(letters.length - 1, i));
      if (i !== slideIndex) setFlipped(slideIndex, false); // close the letter we're leaving
      slideIndex = i;
      slides.forEach((s, k) => {
        const on = k === i;
        s.classList.toggle('active', on);
        s.setAttribute('aria-hidden', String(!on));
        cards[k].tabIndex = on ? 0 : -1;
        dots[k].classList.toggle('is-active', on);
        if (on) dots[k].setAttribute('aria-current', 'true');
        else dots[k].removeAttribute('aria-current');
      });
      prevLetter.disabled = nextLetter.disabled = letters.length < 2;
      layout();
    }

    // move one letter forward (+1) or back (-1); wraps around at the ends
    function step(dir){
      if (!letters.length) return;
      goTo((slideIndex + dir + letters.length) % letters.length);
    }

    letters.forEach((l, i) => {
      const slide = document.createElement('div');
      slide.className = 'carousel__slide';
      const card = makeLetterCard(l, i);
      cards.push(card);
      slide.appendChild(card);
      track.appendChild(slide);
      slides.push(slide);

      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carousel__dot';
      dot.setAttribute('aria-label', 'Go to letter ' + (i + 1));
      dot.addEventListener('click', () => goTo(i));
      dotsBox.appendChild(dot);
      dots.push(dot);
    });

    prevLetter.addEventListener('click', () => step(-1));
    nextLetter.addEventListener('click', () => step(1));
    window.addEventListener('resize', layout);

    // swipe / drag
    viewport.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      dragStartX = e.clientX;
      dragDX = 0;
      dragMoved = false;
    });

    window.addEventListener('pointermove', (e) => {
      if (dragStartX === null) return;
      const dx = e.clientX - dragStartX;
      if (!dragMoved && Math.abs(dx) < 10) return;
      dragMoved = true;
      track.classList.add('dragging');
      dragDX = dx;
      layout();
    });

    function endDrag(cancelled){
      if (dragStartX === null) return;
      const dx = dragDX;
      dragStartX = null;
      dragDX = 0;
      track.classList.remove('dragging');
      if (dragMoved && !cancelled && Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
      else layout();
      setTimeout(() => { dragMoved = false; }, 60);
    }

    window.addEventListener('pointerup', () => endDrag(false));
    window.addEventListener('pointercancel', () => endDrag(true));

    // a swipe shouldn't also count as a tap that flips a card
    viewport.addEventListener('click', (e) => {
      if (dragMoved){
        e.stopPropagation();
        e.preventDefault();
      }
    }, true);

    // left / right arrow keys (only while this carousel is the one on screen)
    document.addEventListener('keydown', (e) => {
      if (!ids.isActive()) return;
      if (document.getElementById(ids.menu).classList.contains('open')) return;
      if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
    });

    goTo(0);

    return { layout, close: () => setFlipped(slideIndex, false) };
  }

  const angelCarousel = createLetterCarousel(LETTERS, {
    viewport: 'carouselViewport', track: 'carouselTrack', dots: 'carouselDots',
    prev: 'prevLetter', next: 'nextLetter', menu: 'menu',
    isActive: () => view === 'letters' && revealed && world === 'angel'
  });

  const jaiCarousel = createLetterCarousel(JAI_LETTERS, {
    viewport: 'carouselViewportJai', track: 'carouselTrackJai', dots: 'carouselDotsJai',
    prev: 'prevLetterJai', next: 'nextLetterJai', menu: 'menuJai',
    isActive: () => jaiView === 'letters' && world === 'jai'
  });

  // angel's side: switch between home (photo card) and letters
  const lettersView = document.getElementById('letters');

  function showView(name){
    if (!revealed) return;
    if (view === 'letters' && name !== 'letters') angelCarousel.close();
    view = name;
    scene.classList.toggle('visible', name === 'home' && sceneReady);
    lettersView.classList.toggle('visible', name === 'letters');
    lettersView.setAttribute('aria-hidden', String(name !== 'letters'));
    if (name === 'letters'){
      lettersView.scrollTop = 0;
      angelCarousel.layout();
    }
  }

  document.querySelectorAll('#menuPanel a[data-view]').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      showView(a.dataset.view);
    });
  });

  // Jai's side: same thing
  const sceneJai = document.getElementById('sceneJai');
  const lettersViewJai = document.getElementById('lettersJai');

  function showJaiView(name){
    if (jaiView === 'letters' && name !== 'letters') jaiCarousel.close();
    jaiView = name;
    sceneJai.classList.toggle('visible', name === 'home');
    lettersViewJai.classList.toggle('visible', name === 'letters');
    lettersViewJai.setAttribute('aria-hidden', String(name !== 'letters'));
    if (name === 'letters'){
      lettersViewJai.scrollTop = 0;
      jaiCarousel.layout();
    }
  }

  // floating background symbols
  function spawnFloaties(box, colors){
    const symbols = ['<3', ';)', ':3', ':)', '♡', 'xo', '^_^', '<3', ':3', ';)', '౨ৎ', '𐙚', '౨ৎ', '𐙚'];
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const count = window.innerWidth < 600 ? 18 : 32;
    const rand = (a, b) => a + Math.random() * (b - a);

    for (let i = 0; i < count; i++){
      const el = document.createElement('span');
      el.className = 'float';
      el.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      const dur = rand(14, 30);
      el.style.left = rand(0, 96) + '%';
      el.style.fontSize = rand(1.1, 2.6).toFixed(2) + 'rem';
      el.style.color = colors[Math.floor(Math.random() * colors.length)];
      el.style.setProperty('--dur', dur.toFixed(1) + 's');
      el.style.setProperty('--delay', (-rand(0, dur)).toFixed(1) + 's');
      el.style.setProperty('--dx', rand(-60, 60).toFixed(0) + 'px');
      el.style.setProperty('--r0', rand(-25, 0).toFixed(0) + 'deg');
      el.style.setProperty('--r1', rand(0, 25).toFixed(0) + 'deg');
      el.style.setProperty('--o', rand(0.18, 0.38).toFixed(2));
      if (reduce) el.style.transform = 'translateY(' + rand(10, 90).toFixed(0) + 'vh)';
      box.appendChild(el);
    }
  }

  spawnFloaties(document.getElementById('floaties'), ['#46603C', '#46603C', '#384E30', '#D9A94E']);
  spawnFloaties(document.getElementById('floatiesJai'), ['#AB5A72', '#D98CA3', '#8A4A5C', '#E3A0B3']);

  // hamburger menu
  const menu = document.getElementById('menu');
  const menuBtn = document.getElementById('menuBtn');

  function setMenu(open){
    menu.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  menuBtn.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  document.getElementById('menuScrim').addEventListener('click', () => setMenu(false));
  document.querySelectorAll('#menuPanel a').forEach(a => a.addEventListener('click', () => setMenu(false)));

  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target)) setMenu(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setMenu(false);
  });


  // ---------- Jai's corner (placeholder) ----------
  const jaiCard = document.getElementById('cardJai');

  function flipJaiCard(){
    const flipped = jaiCard.classList.toggle('flipped');
    jaiCard.setAttribute('aria-pressed', String(flipped));
  }

  jaiCard.addEventListener('click', flipJaiCard);
  jaiCard.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' '){
      e.preventDefault();
      flipJaiCard();
    }
  });

  const jaiMenu = document.getElementById('menuJai');
  const jaiMenuBtn = document.getElementById('menuBtnJai');

  function setJaiMenu(open){
    jaiMenu.classList.toggle('open', open);
    jaiMenuBtn.setAttribute('aria-expanded', String(open));
    jaiMenuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  jaiMenuBtn.addEventListener('click', () => setJaiMenu(!jaiMenu.classList.contains('open')));
  document.getElementById('menuScrimJai').addEventListener('click', () => setJaiMenu(false));
  document.querySelectorAll('#menuPanelJai a').forEach(a => a.addEventListener('click', (e) => {
    e.preventDefault();
    if (a.dataset.view) showJaiView(a.dataset.view);   // memories / our songs are still placeholders
    setJaiMenu(false);
  }));
  document.addEventListener('click', (e) => {
    if (!jaiMenu.contains(e.target)) setJaiMenu(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setJaiMenu(false);
  });

  // ---------- slide between angel's corner and Jai's corner ----------
  const worldAngel = document.getElementById('worldAngel');
  const worldJai = document.getElementById('worldJai');
  const worldToggle = document.getElementById('worldToggle');

  function setWorld(name){
    world = name;
    const jai = name === 'jai';
    body.classList.toggle('jai-mode', jai);

    // the world that's off-screen can't be tabbed into or read out
    worldAngel.inert = jai;
    worldJai.inert = !jai;
    worldAngel.setAttribute('aria-hidden', String(jai));
    worldJai.setAttribute('aria-hidden', String(!jai));

    const label = jai ? "Go to Angel's corner" : "Go to Jai's corner";
    worldToggle.setAttribute('aria-pressed', String(jai));
    worldToggle.setAttribute('aria-label', label);
    worldToggle.title = label;
    document.title = jai ? "Jai's corner" : "angel's corner";

    setMenu(false);
    setJaiMenu(false);
  }

  worldToggle.addEventListener('click', () => setWorld(world === 'angel' ? 'jai' : 'angel'));
