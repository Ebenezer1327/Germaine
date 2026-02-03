(function () {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const count = 180;
  const particles = [];
  const colors = ['#ff9ec9', '#d1c0ff', '#ffe9f3', '#ff7eb8'];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createParticle() {
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      r: 2 + Math.random() * 2.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: 0.6 + Math.random() * 0.35
    };
  }

  function init() {
    resize();
    particles.length = 0;
    for (let i = 0; i < count; i++) {
      particles.push(createParticle());
    }
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', function () {
    resize();
    for (let i = 0; i < particles.length; i++) {
      particles[i].x = Math.random() * canvas.width;
      particles[i].y = Math.random() * canvas.height;
    }
  });

  init();
  animate();
})();
