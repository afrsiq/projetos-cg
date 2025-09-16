const canvas = document.getElementById("glcanvas");
const gl = canvas.getContext("webgl");

if (!gl){alert("Seu navegador não suporta WebGL");}

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

const vertexShader = compileShader(vsSource, gl.VERTEX_SHADER);
const fragmentShader = compileShader(fsSource, gl.FRAGMENT_SHADER);

const shaderProgram = gl.createProgram();
gl.attachShader(shaderProgram, vertexShader);
gl.attachShader(shaderProgram, fragmentShader);
gl.linkProgram(shaderProgram);

gl.useProgram(shaderProgram);

const aPosition = gl.getAttribLocation(shaderProgram, "aPosition");
const uTranslation = gl.getUniformLocation(shaderProgram, "uTranslation");
const uScale = gl.getUniformLocation(shaderProgram, "uScale");
const uColor = gl.getUniformLocation(shaderProgram, "uColor");

function createCircleVertices(segments){
  const vertices = [0, 0];
  for (let i = 0; i <= segments; i++){
    const angle = (i / segments) * 2 * Math.PI;
    vertices.push(Math.cos(angle), Math.sin(angle));
  }
  return new Float32Array(vertices);
}

const circleVertices = createCircleVertices(50);
const circleBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, circleBuffer);
gl.bufferData(gl.ARRAY_BUFFER, circleVertices, gl.STATIC_DRAW);

gl.enableVertexAttribArray(aPosition);
gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

function drawCircle(x, y, scale, color){
  gl.uniform2f(uTranslation, x, y);
  gl.uniform1f(uScale, scale);
  gl.uniform3fv(uColor, color);
  gl.drawArrays(gl.TRIANGLE_FAN, 0, circleVertices.length/2);
}

function render(){
  gl.clearColor(0.9, 0.9, 1.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  drawCircle(0, 0, 0.2, [1, 1, 0]);

  const numPetals = 8;
  for (let i = 0; i < numPetals; i++){
    const angle = (i / numPetals) * 2 * Math.PI;
    const x = Math.cos(angle) * 0.5;
    const y = Math.sin(angle) * 0.5;
    drawCircle(x, y, 0.2, [1, 0, 0]);
  }
}

render();
