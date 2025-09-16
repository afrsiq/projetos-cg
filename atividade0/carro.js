const canvas = document.getElementById("glcanvas");
const gl = canvas.getContext("webgl");

if (!gl){ alert("Seu navegador não suporta WebGL");}

const vsSource = `
  attribute vec2 aPosition;
  uniform vec2 uTranslation;
  uniform float uScale;
  void main() {
    gl_Position = vec4((aPosition * uScale) + uTranslation, 0.0, 1.0);
  }
`;

const fsSource = `
  precision mediump float;
  uniform vec3 uColor;
  void main() {
    gl_FragColor = vec4(uColor, 1.0);
  }
`;

function createShader(gl, type, source){
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

function createProgram(gl, vsSource, fsSource){
  const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  return program;
}

const program = createProgram(gl, vsSource, fsSource);
gl.useProgram(program);

const aPosition = gl.getAttribLocation(program, "aPosition");
const uTranslation = gl.getUniformLocation(program, "uTranslation");
const uScale = gl.getUniformLocation(program, "uScale");
const uColor = gl.getUniformLocation(program, "uColor");

function desenharQuadrado(x1, y1, x2, y2, cor){
  const vertices = [x1, y1, x2, y1, x2, y2, x1, y2];
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(aPosition);
  gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

  gl.uniform2fv(uTranslation, [0, 0]);
  gl.uniform1f(uScale, 1);
  gl.uniform3fv(uColor, cor);

  gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

gl.clearColor(1, 1, 1, 1);
gl.clear(gl.COLOR_BUFFER_BIT);

desenharQuadrado(-0.3, -0.2, 0.3, 0.2, [0.2, 0.6, 0.9]);

desenharQuadrado(-0.5, -0.15, -0.3, 0.15, [0.2, 0.6, 0.9]);
desenharQuadrado(0.3, -0.15, 0.5, 0.15, [0.2, 0.6, 0.9]);

desenharQuadrado(-0.45, -0.25, -0.35, -0.15, [0.1, 0.1, 0.1]);
desenharQuadrado(0.35, -0.25, 0.45, -0.15, [0.1, 0.1, 0.1]);


desenharQuadrado(-0.25, 0, -0.05, 0.15, [0.8, 0.9, 1]);
desenharQuadrado(0.05, 0, 0.25, 0.15, [0.8, 0.9, 1]);

desenharQuadrado(-0.5, -0.05, -0.45, 0.05, [1, 1, 0.3]);
desenharQuadrado(0.45, -0.05, 0.5, 0.05, [1, 1, 0.3]);
