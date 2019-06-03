'use strict';(function(){function e(b){requestAnimationFrame(e);f||(console.log("render"),c.u_time=.001*b,twgl.setUniforms(d,c),twgl.drawBufferInfo(a,g))}function h(){twgl.resizeCanvasToDisplaySize(a.canvas,700>(window.innerWidth||document.documentElement.clientWidth||document.body.clientWidth)?window.devicePixelRatio:1);a.viewport(0,0,a.canvas.width,a.canvas.height);c.u_resolution=[a.canvas.width,a.canvas.height]}function k(a){f=(document.body.scrollTop||document.documentElement.scrollTop)>(window.innerHeight||
document.documentElement.clientHeight||document.body.clientHeight)}let f=!1,a=document.getElementById("c").getContext("webgl"),d=twgl.createProgramInfo(a,["\nattribute vec4 position;\n\nvoid main() {\n  gl_Position = position;\n}\n","\n// Author: Tobias Toft\n// Title: Mountain ridges for Quarter Studio, v. 0.0.1\n// Heavily inspired by and based on the 'noise holes' shader found here: https://www.shadertoy.com/view/XdyXz3\n\n#ifdef GL_ES\nprecision mediump float;\n#endif\n\nuniform vec2 u_resolution;\nuniform vec2 u_mouse;\nuniform float u_time;\nuniform sampler2D u_texture;\nuniform sampler2D u_ashima1;\nuniform sampler2D u_ashima2;\n\n// Generic random\nfloat random(vec2 st) {\n  float a = 12.9898;\n  float b = 78.233;\n  float c = 43758.5453;\n  float dt= dot(st.xy ,vec2(a,b));\n  float sn= mod(dt,3.14);\n  return fract(sin(sn) * c);\n}\n\nfloat whiteNoise(in vec2 p){\n  vec2 tv = p * vec2(u_resolution.x/256., u_resolution.y/256.); // * vec2(1.,float(u_resolution.y/u_resolution.x));\n  return (texture2D(u_texture, tv).r);\n}\n\n// Perlin noise\nfloat snoise(in vec2 p){\n  vec2 tv = p * vec2(u_resolution.x/2048., u_resolution.y/2048.); // * vec2(1.,float(u_resolution.y/u_resolution.x));\n  vec4 tex = texture2D(u_ashima1, tv);\n  //float val = (tex.r + tex.g + tex.b)/3.;\n  return tex.r;\n}\n\n// Perlin noise with two octaves\nfloat snoise2(in vec2 p){\n  vec2 tv = p * vec2(u_resolution.x/2048., u_resolution.y/2048.); // * vec2(1.,float(u_resolution.y/u_resolution.x));\n  vec4 tex = texture2D(u_ashima2, tv);\n  //float val = (tex.r + tex.g + tex.b)/3.;\n  return tex.r;\n}\n\n//--\n\nconst float STEPS = 4.;\nconst float LINE_WIDTH = 0.002;\nconst float CUTOFF = 0.5;\nfloat posX = u_mouse.x * 0.1;\nfloat posY = u_mouse.y * 0.1;\nvec2 mouseUV = u_mouse / u_resolution;\n\n\nvec3 hsv2rgb(vec3 c){\n  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);\n  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);\n  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);\n}\n\nmat2 rotate2d(float a){\n  return mat2(\n      cos(a), -sin(a),\n      sin(a), cos(a)\n  );\n}\n\nfloat getNoise(vec2 uv, float t){\n  //given a uv coord and time - return a noise val in range 0 - 1\n  //using baked ashima noise\n\n  //octave 1\n  const float SCALEX = 1.;\n  const float SCALEY = 1.;\n  //float noise = snoise( vec2(uv.x * SCALEX + posX + t, (uv.y * SCALEY + t)));\n  float noise = snoise( rotate2d(sin(t*0.1) + posY * 2.) * vec2(uv.x * SCALEX + posX + t, uv.y * SCALEY + posY + t));\n\n  //octave 2\n  // NOTE: Disabling mixing two noise textures for now until I find a higher res/bitdepth way of doing it\n  //noise += snoise2( vec2(uv.x * SCALEX + t, uv.y * SCALEY + t)) * 0.2 ;\n\n  //move noise into 0 - 1 range\n  //noise = (noise/2. + 0.5);\n\n  return noise;\n}\n\nfloat getDepth(float n){\n  //remap remaining non-cutoff region to 0 - 1\n  //float cutoff = posY + 0.5;\n  float d = (n - CUTOFF) / (1. - CUTOFF);\n\n  //step\n  d = floor(d*STEPS)/STEPS;\n\n  return d;\n}\n\nvoid main(){\n  float t = u_time * 0.01;\n  vec2 uv = gl_FragCoord.xy / u_resolution;\n  vec3 col = vec3(0);\n\n  float noise = getNoise(uv, t);\n  float d = getDepth(noise);\n\n  //calc HSV color\n  float h = 0.5;// + (d * 0.3); //= d + 0.2; //rainbow hue\n  float s = 0.;\n  float v = 0.; //deeper is darker\n\n  // //get depth at offset position (needed for outlining)\n  // float noiseOffY = getNoise(uv + vec2(0, LINE_WIDTH), t);\n  // float noiseOffX = getNoise(uv + vec2(LINE_WIDTH, 0), t);\n  // float dOffY = getDepth(noiseOffY);\n  // float dOffX = getDepth(noiseOffX);\n\n  float WIDEN = 1. + (sin(t)+1.)/2. * 1.5;\n  const int STEPS = 16;\n  for (int j=0; j<STEPS; j++){\n    vec2 dOffset = vec2(\n      getDepth(getNoise(uv + vec2(0, LINE_WIDTH) * WIDEN * pow(float(j), 1.25), t)),\n      getDepth(getNoise(uv + vec2(0, -LINE_WIDTH) * WIDEN * pow(float(j), 1.25), t))\n    );\n\n\n    // // Save for later\n    // vec4 dOffset = vec4(\n    //   getDepth(getNoise(uv + vec2(LINE_WIDTH, 0) * WIDEN * pow(float(j), 1.25), t)),\n    //   getDepth(getNoise(uv + vec2(0, LINE_WIDTH) * WIDEN * pow(float(j), 1.25), t)),\n    //   getDepth(getNoise(uv + vec2(-LINE_WIDTH, 0) * WIDEN * pow(float(j), 1.25), t)),\n    //   getDepth(getNoise(uv + vec2(0, -LINE_WIDTH) * WIDEN * pow(float(j), 1.25), t))\n    // );\n\n\n    if (d != dOffset.x || d != dOffset.y){\n    //if (d != dOffset.x || d != dOffset.y || d != dOffset.z || d != dOffset.w){ // Save for later\n      h = 0.; //(uv.x * 0.1) + 0.5;\n      s = 0.;\n      v += .0625 * floor( whiteNoise(uv*2.) + 0.2 * float(STEPS)/float(j+1)); // + (0.2 * float(STEPS)/float(j+1)) );\n      if (d != dOffset.x){\n        v *= 0.75;\n      }\n    }\n  }\n\n  // // // Outline ridges\n  // if (d != dOffX || d != dOffY){\n  //   h = (d * 0.1) + (sin(t) + 1.)/2.;\n  //   s = .3;\n  //   v = (sin(t)+1.)/2. + d + 0.5;\n  //   //v *= 0.25;\n  // }\n\n  col = hsv2rgb(vec3(h,s,v));\n\n  //add vertical gradient\n  col *= 0.2 + (gl_FragCoord.y/u_resolution.y) * 0.8;\n\n  //add noise texture\n  //col += 0.1 * whiteNoise(uv + random(vec2(u_time, 0)));\n\n  gl_FragColor = vec4(col, 1.0);\n  //gl_FragColor = vec4(noise, noise, noise, 1.0);\n}\n"]),
g=twgl.createBufferInfoFromArrays(a,{position:[-1,-1,0,1,-1,0,-1,1,0,-1,1,0,1,-1,0,1,1,0]}),b=twgl.createTextures(a,{noise:{src:"/images/noise.png",mag:a.NEAREST},ashima1:{src:"/images/ashima1.png"},ashima2:{src:"/images/ashima2.png"}}),c={u_mouse:[0,0],u_texture:b.noise,u_ashima1:b.ashima1,u_ashima2:b.ashima2};a.useProgram(d.program);twgl.setBuffersAndAttributes(a,d,g);requestAnimationFrame(e);window.addEventListener("mousemove",function(a){});window.addEventListener("resize",h);window.addEventListener("scroll",
k);h();k()})();
//# sourceMappingURL=main.js.map
