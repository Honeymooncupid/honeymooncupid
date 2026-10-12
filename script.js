  const backdrop = document.getElementById('backdrop');
  const titleCard = document.getElementById('titleCard');
  const scene = document.getElementById('scene');
  const music = document.getElementById('music');
  const musicTab = document.getElementById('musicTab');
  const playBtn = document.getElementById('playBtn');
  const muteBtn = document.getElementById('muteBtn');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const musicBar = document.getElementById('musicBar');
  const musicFill = document.getElementById('musicFill');
  const musicTitle = document.getElementById('musicTitle');
  const musicArtist = document.getElementById('musicArtist');
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
    musicTitle.textContent = t.title;
    musicArtist.textContent = t.artist;
    musicFill.style.width = '0%';
  }

  function setPlayingUI(isPlaying){
    playing = isPlaying;
    playBtn.textContent = isPlaying ? '❚❚' : '▶';
    playBtn.setAttribute('aria-label', isPlaying ? 'Pause music' : 'Play music');
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
    musicFill.style.width = (e.relativePosition * 100).toFixed(1) + '%';
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
    prevBtn.hidden = false;
    nextBtn.hidden = false;
  }
  showTrack();

  function reveal(){
    if (revealed) return;
    revealed = true;

    backdrop.classList.add('hidden');
    body.classList.add('entered');
    music.classList.add('visible');

    wantsToPlay = true;
    if (scReady) scWidget.play();

    setTimeout(() => titleCard.classList.add('visible'), 300);
    setTimeout(() => {
      sceneReady = true;
      if (view === 'home') scene.classList.add('visible');
    }, 300 + 3000);
  }

  musicTab.addEventListener('click', () => {
    const open = music.classList.toggle('open');
    musicTab.setAttribute('aria-expanded', String(open));
    musicTab.setAttribute('aria-label', open ? 'Close music player' : 'Open music player');
  });

  playBtn.addEventListener('click', () => {
    wantsToPlay = !playing;
    if (playing) scWidget.pause(); else scWidget.play();
  });

  muteBtn.addEventListener('click', () => {
    muted = !muted;
    scWidget.setVolume(muted ? 0 : 100);
    muteBtn.textContent = muted ? '🔇' : '🔊';
    muteBtn.setAttribute('aria-pressed', String(muted));
    muteBtn.setAttribute('aria-label', muted ? 'Unmute music' : 'Mute music');
  });

  prevBtn.addEventListener('click', () => loadTrack(current - 1, true));
  nextBtn.addEventListener('click', () => loadTrack(current + 1, true));

  musicBar.addEventListener('click', (e) => {
    const r = musicBar.getBoundingClientRect();
    const pct = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1);
    scWidget.getDuration((ms) => scWidget.seekTo(ms * pct));
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


  // ---------- letters ----------
  // edit these! one object per letter card.
  //   name: what's written on the front   |  date: optional, bottom-right of the front
  //   text: the letter. leave a blank line (\n\n) between paragraphs
  //   to / from: optional greeting and sign-off
  // these three are just placeholders - replace them with your real letters
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
    }
  ];

  const lettersView = document.getElementById('letters');
  const lettersGrid = document.getElementById('lettersGrid');

  function makeLetterCard(l){
    const el = document.createElement('div');
    el.className = 'card letter';
    el.tabIndex = 0;
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

    const flip = () => {
      const flipped = el.classList.toggle('flipped');
      el.setAttribute('aria-pressed', String(flipped));
      el.setAttribute('aria-label', (flipped ? 'Close letter: ' : 'Open letter: ') + l.name);
      if (flipped) body.scrollTop = 0;
    };
    el.addEventListener('click', flip);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' '){
        e.preventDefault();
        flip();
      }
    });
    return el;
  }

  LETTERS.forEach(l => lettersGrid.appendChild(makeLetterCard(l)));

  // switch between home (photo card) and letters
  function showView(name){
    if (!revealed) return;
    view = name;
    scene.classList.toggle('visible', name === 'home' && sceneReady);
    lettersView.classList.toggle('visible', name === 'letters');
    lettersView.setAttribute('aria-hidden', String(name !== 'letters'));
    if (name === 'letters') lettersView.scrollTop = 0;
  }

  document.querySelectorAll('#menuPanel a[data-view]').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      showView(a.dataset.view);
    });
  });

  // floating background symbols
  (function(){
    const box = document.getElementById('floaties');
    const symbols = ['<3', ';)', ':3', ':)', '♡', 'xo', '^_^', '<3', ':3', ';)', '౨ৎ', '𐙚', '౨ৎ', '𐙚'];
    const colors = ['#46603C', '#46603C', '#384E30', '#D9A94E'];
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
  })();

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
