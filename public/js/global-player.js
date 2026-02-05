/**
 * Global "About You" by The 1975 - top right corner, loops when playing
 */
(function () {
  var VIDEO_ID = 'tGv7CUutzqU';
  var YOUTUBE_LOOP = 'https://www.youtube.com/embed/' + VIDEO_ID + '?autoplay=1&loop=1&playlist=' + VIDEO_ID + '&controls=0&start=40';

  var wrap = document.createElement('div');
  wrap.id = 'global-music-player';
  wrap.className = 'global-music-player';
  wrap.innerHTML = '<button type="button" class="global-music-btn" id="globalMusicBtn" aria-label="Play About You by The 1975" title="About You – The 1975">' +
    '<span class="global-music-icon">♪</span>' +
    '<span class="global-music-label">About You</span>' +
    '</button>' +
    '<iframe id="globalMusicEmbed" class="global-music-embed" src="" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope" allowfullscreen title="About You - The 1975"></iframe>';

  document.body.appendChild(wrap);

  var btn = document.getElementById('globalMusicBtn');
  var embed = document.getElementById('globalMusicEmbed');
  var isPlaying = false;

  function play() {
    embed.src = YOUTUBE_LOOP;
    isPlaying = true;
    btn.classList.add('playing');
    btn.setAttribute('aria-label', 'Pause About You by The 1975');
  }

  function stop() {
    embed.src = '';
    isPlaying = false;
    btn.classList.remove('playing');
    btn.setAttribute('aria-label', 'Play About You by The 1975');
  }

  btn.addEventListener('click', function () {
    if (isPlaying) stop();
    else play();
  });
})();
