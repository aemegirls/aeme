/*
  AEME ABOUT — fluid background (v2)
  ----------------------------------
  Antes: un shader de "ruido" (fbm/value-noise) que dibujaba manchas con
  bordes definidos por smoothstep. Eso es lo que se veía "cristalizado":
  el ruido de alta frecuencia crea facetas, no líquido.

  Ahora: una simulación real de fluidos (el método "stable fluids" de
  Jos Stam, el mismo tipo de técnica detrás de herramientas como la del
  vídeo de referencia). Hay un campo de velocidad que se advecta a sí
  mismo, se le resta la presión para mantenerlo incompresible, y encima
  se advecta un campo de "tinta" (dye) de color. El resultado es
  continuo por construcción: no hay ruido, no hay bordes.

  Si el navegador no soporta WebGL2 + texturas float, se usa el mismo
  fondo de repuesto en CSS (los tres blobs) que ya existía.
*/
(() => {
  const canvas = document.getElementById("aboutFluid");
  if (!canvas) return;

  // ---------- fondo de repuesto en CSS (siempre presente por si acaso) ----------
  const fallbackLayer = document.createElement("div");
  fallbackLayer.className = "aboutFluidFallback";
  fallbackLayer.innerHTML = '<div class="fluidBlob one"></div><div class="fluidBlob two"></div><div class="fluidBlob three"></div>';
  canvas.parentNode.insertBefore(fallbackLayer, canvas);

  const fallbackBlobs = [...fallbackLayer.querySelectorAll(".fluidBlob")];
  const fallbackState = { x: innerWidth * .52, y: innerHeight * .48, tx: innerWidth * .52, ty: innerHeight * .48, vx: 0, vy: 0 };

  addEventListener("pointermove", e => {
    const dx = e.clientX - fallbackState.tx;
    const dy = e.clientY - fallbackState.ty;
    fallbackState.vx = fallbackState.vx * .7 + dx * .3;
    fallbackState.vy = fallbackState.vy * .7 + dy * .3;
    fallbackState.tx = e.clientX;
    fallbackState.ty = e.clientY;
  });

  function animateFallback(ms) {
    fallbackState.x += (fallbackState.tx - fallbackState.x) * .055;
    fallbackState.y += (fallbackState.ty - fallbackState.y) * .055;
    const t = ms * .001;
    const vw = innerWidth, vh = innerHeight;
    const drift = [
      [Math.sin(t * .21) * vw * .16, Math.cos(t * .17) * vh * .14],
      [Math.cos(t * .15) * vw * .18, Math.sin(t * .19) * vh * .13],
      [Math.sin(t * .13 + .8) * vw * .14, Math.cos(t * .11 + .5) * vh * .18]
    ];
    const base = [[.30, .48], [.62, .38], [.78, .68]];
    fallbackBlobs.forEach((b, i) => {
      const follow = (i === 0 ? .24 : i === 1 ? .16 : .20);
      const x = base[i][0] * vw + drift[i][0] + (fallbackState.x - vw * .5) * follow;
      const y = base[i][1] * vh + drift[i][1] + (fallbackState.y - vh * .5) * follow;
      const stretchX = 1.0 + Math.min(Math.abs(fallbackState.vx) * .0018, .24);
      const stretchY = 1.0 + Math.min(Math.abs(fallbackState.vy) * .0018, .24);
      const rot = Math.sin(t * (.12 + i * .04)) * 18 + Math.atan2(fallbackState.vy, fallbackState.vx) * 8;
      b.style.transform = `translate3d(${x}px,${y}px,0) rotate(${rot}deg) scale(${stretchX},${stretchY})`;
    });
    requestAnimationFrame(animateFallback);
  }
  requestAnimationFrame(animateFallback);

  function useFallbackOnly() {
    canvas.style.display = "none";
  }

  // ---------- WebGL2 setup ----------
  const gl = canvas.getContext("webgl2", { alpha: false, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false });
  if (!gl) { useFallbackOnly(); return; }

  const floatExt = gl.getExtension("EXT_color_buffer_float");
  const linearExt = gl.getExtension("OES_texture_float_linear");
  if (!floatExt) { useFallbackOnly(); return; }

  const HALF_FLOAT = gl.HALF_FLOAT;
  const filtering = linearExt ? gl.LINEAR : gl.NEAREST;

  // ---------- shader helpers ----------
  function compileShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn(gl.getShaderInfoLog(shader));
      return null;
    }
    return shader;
  }

  function createProgram(vsSource, fsSource) {
    const vs = compileShader(gl.VERTEX_SHADER, vsSource);
    const fs = compileShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return null;
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn(gl.getProgramInfoLog(program));
      return null;
    }
    const uniforms = {};
    const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < count; i++) {
      const info = gl.getActiveUniform(program, i);
      uniforms[info.name] = gl.getUniformLocation(program, info.name);
    }
    return { program, uniforms };
  }

  const baseVertex = `#version 300 es
    precision highp float;
    in vec2 aPos;
    out vec2 vUv;
    out vec2 vL, vR, vT, vB;
    uniform vec2 texelSize;
    void main () {
      vUv = aPos * 0.5 + 0.5;
      vL = vUv - vec2(texelSize.x, 0.0);
      vR = vUv + vec2(texelSize.x, 0.0);
      vT = vUv + vec2(0.0, texelSize.y);
      vB = vUv - vec2(0.0, texelSize.y);
      gl_Position = vec4(aPos, 0.0, 1.0);
    }`;

  const frag = body => `#version 300 es
    precision highp float;
    precision highp sampler2D;
    in vec2 vUv;
    in vec2 vL, vR, vT, vB;
    out vec4 outColor;
    ${body}`;

  const advectionShader = frag(`
    uniform sampler2D uVelocity;
    uniform sampler2D uSource;
    uniform vec2 texelSize;
    uniform float dt;
    uniform float dissipation;
    void main () {
      vec2 coord = vUv - dt * texture(uVelocity, vUv).xy * texelSize;
      vec4 result = texture(uSource, coord);
      float decay = 1.0 + dissipation * dt;
      outColor = result / decay;
    }`);

  const divergenceShader = frag(`
    uniform sampler2D uVelocity;
    void main () {
      float L = texture(uVelocity, vL).x;
      float R = texture(uVelocity, vR).x;
      float T = texture(uVelocity, vT).y;
      float B = texture(uVelocity, vB).y;
      float div = 0.5 * (R - L + T - B);
      outColor = vec4(div, 0.0, 0.0, 1.0);
    }`);

  const curlShader = frag(`
    uniform sampler2D uVelocity;
    void main () {
      float L = texture(uVelocity, vL).y;
      float R = texture(uVelocity, vR).y;
      float T = texture(uVelocity, vT).x;
      float B = texture(uVelocity, vB).x;
      float vort = R - L - T + B;
      outColor = vec4(0.5 * vort, 0.0, 0.0, 1.0);
    }`);

  const vorticityShader = frag(`
    uniform sampler2D uVelocity;
    uniform sampler2D uCurl;
    uniform float curlStrength;
    uniform float dt;
    void main () {
      float L = texture(uCurl, vL).x;
      float R = texture(uCurl, vR).x;
      float T = texture(uCurl, vT).x;
      float B = texture(uCurl, vB).x;
      float C = texture(uCurl, vUv).x;
      vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
      force /= length(force) + 0.0001;
      force *= curlStrength * C;
      force.y *= -1.0;
      vec2 vel = texture(uVelocity, vUv).xy;
      vel += force * dt;
      vel = clamp(vel, -1000.0, 1000.0);
      outColor = vec4(vel, 0.0, 1.0);
    }`);

  const pressureShader = frag(`
    uniform sampler2D uPressure;
    uniform sampler2D uDivergence;
    void main () {
      float L = texture(uPressure, vL).x;
      float R = texture(uPressure, vR).x;
      float T = texture(uPressure, vT).x;
      float B = texture(uPressure, vB).x;
      float div = texture(uDivergence, vUv).x;
      float pressure = (L + R + T + B - div) * 0.25;
      outColor = vec4(pressure, 0.0, 0.0, 1.0);
    }`);

  const gradientSubtractShader = frag(`
    uniform sampler2D uPressure;
    uniform sampler2D uVelocity;
    void main () {
      float L = texture(uPressure, vL).x;
      float R = texture(uPressure, vR).x;
      float T = texture(uPressure, vT).x;
      float B = texture(uPressure, vB).x;
      vec2 vel = texture(uVelocity, vUv).xy;
      vel -= vec2(R - L, T - B);
      outColor = vec4(vel, 0.0, 1.0);
    }`);

  const clearShader = frag(`
    uniform sampler2D uTexture;
    uniform float value;
    void main () {
      outColor = value * texture(uTexture, vUv);
    }`);

  const splatShader = frag(`
    uniform sampler2D uTarget;
    uniform float aspectRatio;
    uniform vec3 color;
    uniform vec2 point;
    uniform float radius;
    void main () {
      vec2 p = vUv - point.xy;
      p.x *= aspectRatio;
      vec3 splat = exp(-dot(p, p) / radius) * color;
      vec3 base = texture(uTarget, vUv).xyz;
      outColor = vec4(base + splat, 1.0);
    }`);

  const displayShader = frag(`
    uniform sampler2D uTexture;
    void main () {
      vec3 c = texture(uTexture, vUv).rgb;
      c = 1.0 - exp(-c * 1.35);
      c = pow(c, vec3(0.92));
      outColor = vec4(c, 1.0);
    }`);

  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);

  function blit(target) {
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    if (target == null) {
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    } else {
      gl.viewport(0, 0, target.width, target.height);
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
    }
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  }

  function createFBO(w, h, internalFormat, format, type, param) {
    gl.activeTexture(gl.TEXTURE0);
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.viewport(0, 0, w, h);
    gl.clear(gl.COLOR_BUFFER_BIT);

    return { texture, fbo, width: w, height: h, attach(id) { gl.activeTexture(gl.TEXTURE0 + id); gl.bindTexture(gl.TEXTURE_2D, texture); return id; } };
  }

  function createDoubleFBO(w, h, internalFormat, format, type, param) {
    let fbo1 = createFBO(w, h, internalFormat, format, type, param);
    let fbo2 = createFBO(w, h, internalFormat, format, type, param);
    return {
      width: w, height: h,
      get read() { return fbo1; },
      set read(v) { fbo1 = v; },
      get write() { return fbo2; },
      set write(v) { fbo2 = v; },
      swap() { const tmp = fbo1; fbo1 = fbo2; fbo2 = tmp; }
    };
  }

  function getResolution(resolution) {
    let aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
    if (aspect < 1) aspect = 1.0 / aspect;
    const min = Math.round(resolution);
    const max = Math.round(resolution * aspect);
    return gl.drawingBufferWidth > gl.drawingBufferHeight ? { width: max, height: min } : { width: min, height: max };
  }

  // ---------- programs ----------
  const advectionProgram = createProgram(baseVertex, advectionShader);
  const divergenceProgram = createProgram(baseVertex, divergenceShader);
  const curlProgram = createProgram(baseVertex, curlShader);
  const vorticityProgram = createProgram(baseVertex, vorticityShader);
  const pressureProgram = createProgram(baseVertex, pressureShader);
  const gradientSubtractProgram = createProgram(baseVertex, gradientSubtractShader);
  const clearProgram = createProgram(baseVertex, clearShader);
  const splatProgram = createProgram(baseVertex, splatShader);
  const displayProgram = createProgram(baseVertex, displayShader);

  if (!advectionProgram || !divergenceProgram || !curlProgram || !vorticityProgram ||
      !pressureProgram || !gradientSubtractProgram || !clearProgram || !splatProgram || !displayProgram) {
    useFallbackOnly();
    return;
  }

  function useProgram(p) { gl.useProgram(p.program); return p.uniforms; }

  // A partir de aquí el shader real está listo: oculta el fondo de
  // repuesto en CSS para que no se vean los dos superpuestos.
  fallbackLayer.style.display = "none";


  // ---------- config ----------
  const config = {
    SIM_RESOLUTION: 128,
    DYE_RESOLUTION: Math.max(innerWidth, innerHeight) > 1600 ? 640 : 768,
    DENSITY_DISSIPATION: 0.9,
    VELOCITY_DISSIPATION: 0.18,
    PRESSURE_ITERATIONS: 20,
    CURL: 22,
    SPLAT_RADIUS: 0.28,
    SPLAT_FORCE: 5200
  };

  let simRes = getResolution(config.SIM_RESOLUTION);
  let dyeRes = getResolution(config.DYE_RESOLUTION);

  let dye = createDoubleFBO(dyeRes.width, dyeRes.height, gl.RGBA16F, gl.RGBA, HALF_FLOAT, filtering);
  let velocity = createDoubleFBO(simRes.width, simRes.height, gl.RG16F, gl.RG, HALF_FLOAT, filtering);
  let divergence = createFBO(simRes.width, simRes.height, gl.R16F, gl.RED, HALF_FLOAT, gl.NEAREST);
  let curl = createFBO(simRes.width, simRes.height, gl.R16F, gl.RED, HALF_FLOAT, gl.NEAREST);
  let pressure = createDoubleFBO(simRes.width, simRes.height, gl.R16F, gl.RED, HALF_FLOAT, gl.NEAREST);

  function resizeCanvas() {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    const w = Math.max(1, Math.floor(innerWidth * dpr));
    const h = Math.max(1, Math.floor(innerHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      simRes = getResolution(config.SIM_RESOLUTION);
      dyeRes = getResolution(config.DYE_RESOLUTION);
      dye = createDoubleFBO(dyeRes.width, dyeRes.height, gl.RGBA16F, gl.RGBA, HALF_FLOAT, filtering);
      velocity = createDoubleFBO(simRes.width, simRes.height, gl.RG16F, gl.RG, HALF_FLOAT, filtering);
      divergence = createFBO(simRes.width, simRes.height, gl.R16F, gl.RED, HALF_FLOAT, gl.NEAREST);
      curl = createFBO(simRes.width, simRes.height, gl.R16F, gl.RED, HALF_FLOAT, gl.NEAREST);
      pressure = createDoubleFBO(simRes.width, simRes.height, gl.R16F, gl.RED, HALF_FLOAT, gl.NEAREST);
    }
  }
  addEventListener("resize", resizeCanvas);
  resizeCanvas();

  // ---------- pointer + splats ----------
  // Paleta de marca: violeta -> magenta -> rojo -> naranja (mismo espíritu que el vídeo de referencia)
  const palette = [
    [0.30, 0.02, 0.85],
    [0.85, 0.02, 0.55],
    [1.00, 0.05, 0.10],
    [1.00, 0.42, 0.02]
  ];
  function pickColor(t) {
    const scaled = ((t % 1) + 1) % 1 * palette.length;
    const i = Math.floor(scaled) % palette.length;
    const j = (i + 1) % palette.length;
    const f = scaled - Math.floor(scaled);
    const a = palette[i], b = palette[j];
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  }

  const pointer = { x: 0.5, y: 0.5, dx: 0, dy: 0, moved: false, hue: Math.random() };

  // Deriva muy sutil del texto de presentación, como si la corriente
  // del líquido lo empujara ligeramente. Se guarda como variables CSS
  // en <html>, y about.css ya las usa en .aboutCopy.
  const copyTarget = { x: 0, y: 0 };
  const copyCurrent = { x: 0, y: 0 };
  const MAX_DRIFT = 10; // px — deliberadamente pequeño, es un matiz, no un parallax fuerte

  function updatePointer(clientX, clientY) {
    const x = clientX / innerWidth;
    const y = 1.0 - clientY / innerHeight;
    pointer.dx = (x - pointer.x) * 6.0;
    pointer.dy = (y - pointer.y) * 6.0;
    pointer.x = x;
    pointer.y = y;
    pointer.moved = true;

    copyTarget.x = (x - 0.5) * MAX_DRIFT * 2;
    copyTarget.y = (y - 0.5) * -MAX_DRIFT * 2;
  }
  addEventListener("pointermove", e => updatePointer(e.clientX, e.clientY));
  addEventListener("pointerdown", e => {
    pointer.hue = Math.random();
    splat(pointer.x, pointer.y, (Math.random() - 0.5) * 800, (Math.random() - 0.5) * 800, pickColor(pointer.hue));
  });

  function splat(x, y, dx, dy, color) {
    let uniforms = useProgram(splatProgram);
    gl.viewport(0, 0, velocity.width, velocity.height);
    gl.bindFramebuffer(gl.FRAMEBUFFER, velocity.write.fbo);
    gl.uniform1i(uniforms.uTarget, velocity.read.attach(0));
    gl.uniform1f(uniforms.aspectRatio, canvas.width / canvas.height);
    gl.uniform2f(uniforms.point, x, y);
    gl.uniform3f(uniforms.color, dx, dy, 0.0);
    gl.uniform1f(uniforms.radius, config.SPLAT_RADIUS / 100.0);
    blit(velocity.write);
    velocity.swap();

    gl.viewport(0, 0, dye.width, dye.height);
    gl.bindFramebuffer(gl.FRAMEBUFFER, dye.write.fbo);
    gl.uniform1i(uniforms.uTarget, dye.read.attach(0));
    gl.uniform3f(uniforms.color, color[0], color[1], color[2]);
    blit(dye.write);
    dye.swap();
  }

  // pequeños toques automáticos para que el fondo respire aunque no haya cursor encima
  let idleTimer = 0;
  function idleSplat(dtMs) {
    idleTimer += dtMs;
    if (idleTimer > 2600) {
      idleTimer = 0;
      const x = 0.15 + Math.random() * 0.7;
      const y = 0.15 + Math.random() * 0.7;
      const angle = Math.random() * Math.PI * 2;
      const force = 300 + Math.random() * 300;
      splat(x, y, Math.cos(angle) * force, Math.sin(angle) * force, pickColor(Math.random()));
    }
  }

  // ---------- simulation step ----------
  let lastTime = performance.now();

  function step(dt) {
    gl.disable(gl.BLEND);

    let uniforms = useProgram(curlProgram);
    gl.uniform2f(uniforms.texelSize, 1.0 / simRes.width, 1.0 / simRes.height);
    gl.uniform1i(uniforms.uVelocity, velocity.read.attach(0));
    blit(curl);

    uniforms = useProgram(vorticityProgram);
    gl.uniform2f(uniforms.texelSize, 1.0 / simRes.width, 1.0 / simRes.height);
    gl.uniform1i(uniforms.uVelocity, velocity.read.attach(0));
    gl.uniform1i(uniforms.uCurl, curl.attach(1));
    gl.uniform1f(uniforms.curlStrength, config.CURL);
    gl.uniform1f(uniforms.dt, dt);
    gl.bindFramebuffer(gl.FRAMEBUFFER, velocity.write.fbo);
    gl.viewport(0, 0, simRes.width, simRes.height);
    blit(velocity.write);
    velocity.swap();

    uniforms = useProgram(divergenceProgram);
    gl.uniform2f(uniforms.texelSize, 1.0 / simRes.width, 1.0 / simRes.height);
    gl.uniform1i(uniforms.uVelocity, velocity.read.attach(0));
    blit(divergence);

    uniforms = useProgram(clearProgram);
    gl.uniform1i(uniforms.uTexture, pressure.read.attach(0));
    gl.uniform1f(uniforms.value, 0.78);
    gl.bindFramebuffer(gl.FRAMEBUFFER, pressure.write.fbo);
    gl.viewport(0, 0, simRes.width, simRes.height);
    blit(pressure.write);
    pressure.swap();

    uniforms = useProgram(pressureProgram);
    gl.uniform2f(uniforms.texelSize, 1.0 / simRes.width, 1.0 / simRes.height);
    gl.uniform1i(uniforms.uDivergence, divergence.attach(0));
    for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
      gl.uniform1i(uniforms.uPressure, pressure.read.attach(1));
      gl.bindFramebuffer(gl.FRAMEBUFFER, pressure.write.fbo);
      gl.viewport(0, 0, simRes.width, simRes.height);
      blit(pressure.write);
      pressure.swap();
    }

    uniforms = useProgram(gradientSubtractProgram);
    gl.uniform2f(uniforms.texelSize, 1.0 / simRes.width, 1.0 / simRes.height);
    gl.uniform1i(uniforms.uPressure, pressure.read.attach(0));
    gl.uniform1i(uniforms.uVelocity, velocity.read.attach(1));
    gl.bindFramebuffer(gl.FRAMEBUFFER, velocity.write.fbo);
    gl.viewport(0, 0, simRes.width, simRes.height);
    blit(velocity.write);
    velocity.swap();

    uniforms = useProgram(advectionProgram);
    gl.uniform2f(uniforms.texelSize, 1.0 / simRes.width, 1.0 / simRes.height);
    gl.uniform1i(uniforms.uVelocity, velocity.read.attach(0));
    gl.uniform1i(uniforms.uSource, velocity.read.attach(0));
    gl.uniform1f(uniforms.dt, dt);
    gl.uniform1f(uniforms.dissipation, config.VELOCITY_DISSIPATION);
    gl.bindFramebuffer(gl.FRAMEBUFFER, velocity.write.fbo);
    gl.viewport(0, 0, simRes.width, simRes.height);
    blit(velocity.write);
    velocity.swap();

    gl.uniform2f(uniforms.texelSize, 1.0 / dyeRes.width, 1.0 / dyeRes.height);
    gl.uniform1i(uniforms.uVelocity, velocity.read.attach(0));
    gl.uniform1i(uniforms.uSource, dye.read.attach(1));
    gl.uniform1f(uniforms.dissipation, config.DENSITY_DISSIPATION);
    gl.bindFramebuffer(gl.FRAMEBUFFER, dye.write.fbo);
    gl.viewport(0, 0, dyeRes.width, dyeRes.height);
    blit(dye.write);
    dye.swap();
  }

  function render() {
    gl.disable(gl.BLEND);
    const uniforms = useProgram(displayProgram);
    gl.uniform1i(uniforms.uTexture, dye.read.attach(0));
    blit(null);
  }

  function frame(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.0166);
    lastTime = now;

    if (pointer.moved) {
      splat(pointer.x, pointer.y, pointer.dx * config.SPLAT_FORCE, pointer.dy * config.SPLAT_FORCE, pickColor(pointer.hue + now * 0.00004));
      pointer.moved = false;
    }
    idleSplat(dt * 1000);

    // Suaviza la deriva del texto (lerp) y la aplica como variables CSS.
    copyCurrent.x += (copyTarget.x - copyCurrent.x) * 0.02;
    copyCurrent.y += (copyTarget.y - copyCurrent.y) * 0.02;
    document.documentElement.style.setProperty("--copy-x", `${copyCurrent.x.toFixed(2)}px`);
    document.documentElement.style.setProperty("--copy-y", `${copyCurrent.y.toFixed(2)}px`);

    step(dt);
    render();
    requestAnimationFrame(frame);
  }

  // primer impulso para que no arranque completamente vacío/negro
  splat(0.5, 0.5, 0, 0, pickColor(0.05));
  splat(0.35, 0.62, 200, -150, pickColor(0.4));
  splat(0.68, 0.4, -180, 160, pickColor(0.75));

  requestAnimationFrame(frame);
})();
