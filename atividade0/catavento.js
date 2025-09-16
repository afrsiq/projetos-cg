const canvas = document.getElementById("glcanvas");
const gl = canvas.getContext("webgl");

if (!gl){alert("Seu navegador não suporta WebGL");}

const vsSource = `
  attribute vec2 aPosition;
  uniform vec2 uTranslation;
  uniform float uRotation;
  uniform float uScale;
  void main() {
    float cosR = cos(uRotation);
    float sinR = sin(uRotation);
    mat2 rotation = mat2(cosR, -sinR, sinR, cosR);
    vec2 pos = (rotation * (aPosition * uScale)) + uTranslation;
    gl_Position = vec4(pos, 0.0, 1.0);
  }
`;

const fsSource = `
  precision mediump float;
  uniform vec3 uColor;
  void main() {
    gl_FragColor = vec4(uColor, 1.0);
  }
`;

function compileShader(source, type){
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
    console.error("Erro no shader:", gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}

const vs = compileShader(vsSource, gl.VERTEX_SHADER);
const fs = compileShader(fsSource, gl.FRAGMENT_SHADER);

const program = gl.createProgram();
gl.attachShader(program, vs);
gl.attachShader(program, fs);
gl.linkProgram(program);
gl.useProgram(program);

//Atributos e uniforms
const aPosition = gl.getAttribLocation(program, "aPosition");
const uColor = gl.getUniformLocation(program, "uColor");
const uTranslation = gl.getUniformLocation(program, "uTranslation");
const uRotation = gl.getUniformLocation(program, "uRotation");
const uScale = gl.getUniformLocation(program, "uScale");

const petalVertices = new Float32Array([
  0.0, 0.0,   
  0.4, 0.1,   
  0.1, 0.4   
]);

const petalBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, petalBuffer);
gl.bufferData(gl.ARRAY_BUFFER, petalVertices, gl.STATIC_DRAW);

gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(aPosition);

function drawPetal(color, rotation){
  gl.uniform3fv(uColor, color);
  gl.uniform2fv(uTranslation, [0.0, 0.0]);
  gl.uniform1f(uRotation, rotation);
  gl.uniform1f(uScale, 1.0);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

// Criar círculo no meio
function createCircleVertices(radius, segments){
  const verts = [0.0, 0.0];
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * 2 * Math.PI;
    verts.push(Math.cos(angle) * radius, Math.sin(angle) * radius);
  }
  return new Float32Array(verts);
}

// Buffer do círculo
const circleVertices = createCircleVertices(0.1, 40);
const circleBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, circleBuffer);
gl.bufferData(gl.ARRAY_BUFFER, circleVertices, gl.STATIC_DRAW);

//Buffer do palito
const stickVertices = new Float32Array([
  -0.05, -1.0,
   0.05, -1.0,
   0.05, -0.2,
  -0.05, -1.0,
   0.05, -0.2,
  -0.05, -0.2
]);
const stickBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, stickBuffer);
gl.bufferData(gl.ARRAY_BUFFER, stickVertices, gl.STATIC_DRAW);

//Renderização
gl.clearColor(1.0, 1.0, 1.0, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);

// Palito
gl.bindBuffer(gl.ARRAY_BUFFER, stickBuffer);
gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(aPosition);
gl.uniform3fv(uColor, [0.9, 0.7, 0.5]); // cor bege
gl.uniform2fv(uTranslation, [0.0, 0.0]);
gl.uniform1f(uRotation, 0.0);
gl.uniform1f(uScale, 1.0);
gl.drawArrays(gl.TRIANGLES, 0, 6);

gl.bindBuffer(gl.ARRAY_BUFFER, petalBuffer);
gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

const colors = [
  [1.0, 0.0, 0.0], // vermelho
  [0.0, 1.0, 0.0], // verde
  [0.0, 0.0, 1.0], // azul
  [1.0, 1.0, 0.0]  // amarelo
];

for (let i = 0; i < 4; i++) {
  drawPetal(colors[i], i * Math.PI / 2);
}

gl.bindBuffer(gl.ARRAY_BUFFER, circleBuffer);
gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(aPosition);

gl.uniform3fv(uColor, [0.8, 0.8, 0.8]);
gl.uniform2fv(uTranslation, [0.0, 0.0]);
gl.uniform1f(uRotation, 0.0);
gl.uniform1f(uScale, 1.0);

gl.drawArrays(gl.TRIANGLE_FAN, 0, circleVertices.length/2);
