/* Jomouh hero: live marble surface (raw WebGL, no dependencies) */
(function () {
  function init(hero) {
    const canvas = hero.querySelector('canvas');
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false });
    if (!gl) return;
    const vs = 'attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }';
    const fs = `
      precision highp float;
      uniform vec2 u_res; uniform float u_t; uniform vec2 u_m;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p){
        vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f);
        return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
      }
      float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 6; i++){ v += a*noise(p); p = p*2.03 + 17.1; a *= 0.5; } return v; }
      void main(){
        vec2 uv = gl_FragCoord.xy / u_res;
        vec2 p = uv * vec2(u_res.x/u_res.y, 1.0) * 1.6;
        p += (u_m - 0.5) * 0.06;
        float t = u_t * 0.015;
        vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3 - t)));
        vec2 r = vec2(fbm(p + 3.0*q + vec2(1.7, 9.2) + t), fbm(p + 3.0*q + vec2(8.3, 2.8)));
        float n = fbm(p + 2.6*r);
        float v1 = abs(sin((p.x*0.9 + p.y*0.45 + n*3.4) * 2.6));
        float vein = pow(1.0 - v1, 26.0);
        float v2 = abs(sin((p.x*0.3 - p.y*1.1 + r.x*4.0) * 4.2));
        float vein2 = pow(1.0 - v2, 60.0) * 0.55;
        vec3 base = mix(vec3(0.955, 0.950, 0.940), vec3(0.905, 0.898, 0.885), smoothstep(0.35, 0.75, n));
        base = mix(base, vec3(0.93, 0.925, 0.915), r.y * 0.5);
        vec3 col = base;
        col = mix(col, vec3(0.52, 0.50, 0.47), vein * 0.75);
        col = mix(col, vec3(0.62, 0.57, 0.48), vein2);
        col *= 0.97 + 0.05 * uv.y;
        float spec = pow(max(0.0, 1.0 - length(uv - vec2(0.7 + (u_m.x-0.5)*0.2, 0.75))), 3.0) * 0.06;
        col += spec;
        float calm = smoothstep(0.55, 0.0, uv.y) * smoothstep(1.0, 0.25, uv.x);
        col = mix(col, vec3(0.955, 0.950, 0.942), calm * 0.55);
        gl_FragColor = vec4(col, 1.0);
      }`;
    const mk = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram();
    gl.attachShader(prog, mk(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, mk(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, 'u_res');
    const uT = gl.getUniformLocation(prog, 'u_t');
    const uM = gl.getUniformLocation(prog, 'u_m');
    const small = () => hero.offsetWidth < 700;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, small() ? 1.5 : 2);
      canvas.width = Math.round(hero.offsetWidth * dpr);
      canvas.height = Math.round(hero.offsetHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };
    resize();
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(hero); else window.addEventListener('resize', resize);
    const mouse = [0.5, 0.5], target = [0.5, 0.5];
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      target[0] = (e.clientX - r.left) / r.width; target[1] = 1 - (e.clientY - r.top) / r.height;
    });
    let visible = true;
    if ('IntersectionObserver' in window) new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(hero);
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t0 = performance.now();
    const frame = (t) => {
      if (visible || reduce) {
        mouse[0] += (target[0] - mouse[0]) * 0.04; mouse[1] += (target[1] - mouse[1]) * 0.04;
        gl.uniform1f(uT, reduce ? 20.0 : (t - t0) * 0.001 + 20.0);
        gl.uniform2f(uM, mouse[0], mouse[1]);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
      if (!reduce) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
  const boot = () => document.querySelectorAll('[data-marble]').forEach(init);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
