// Vertex shader source code
const vertexShaderSource = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0, 1);
    gl_PointSize = 5.0;
  }
`;

// Fragment shader source code
const fragmentShaderSource = `
  precision mediump float;
  uniform vec3 u_color;
  void main() {
    gl_FragColor = vec4(u_color, 1.0);
  }
`;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Error compiling shader:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
  }
  
  return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Error linking program:', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
  }
  
  return program;
}

// Algoritmo de Bresenham para círculos
function bresenhamCircle(centerX, centerY, radius) {
    const points = [];
    let x = 0;
    let y = radius;
    let d = 3 - 2 * radius;

    // Função para adicionar pontos simétricos nos 8 octantes
    const addPoints = (cx, cy, x, y) => {
        points.push(cx + x, cy + y);
        points.push(cx - x, cy + y);
        points.push(cx + x, cy - y);
        points.push(cx - x, cy - y);
        points.push(cx + y, cy + x);
        points.push(cx - y, cy + x);
        points.push(cx + y, cy - x);
        points.push(cx - y, cy - x);
    };

    addPoints(centerX, centerY, x, y);

    while (y >= x) {
        x++;
        
        if (d > 0) {
            y--;
            d = d + 4 * (x - y) + 10;
        } else {
            d = d + 4 * x + 6;
        }
        
        addPoints(centerX, centerY, x, y);
    }

    return points;
}

let gl, program, vertexBuffer, positionLocation, colorUniformLocation;
let colorVector = [0.0, 0.0, 1.0];
let circleRadius = 50;
let clickCount = 0;
let allCircles = [];

function main() {
    const canvas = document.getElementById('glCanvas');
    gl = canvas.getContext('webgl');
    
    if (!gl) {
        console.error('WebGL not supported');
        return;
    }
    
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    program = createProgram(gl, vertexShader, fragmentShader);
    gl.useProgram(program);

    vertexBuffer = gl.createBuffer();
    positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    
    colorUniformLocation = gl.getUniformLocation(program, 'u_color');
    gl.uniform3fv(colorUniformLocation, colorVector);

    canvas.addEventListener("mousedown", mouseClick, false);
    
    const bodyElement = document.querySelector("body");
    bodyElement.addEventListener("keydown", keyDown, false);

    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    // Inicializar contador de cliques
    updateClickCount();
}

function mouseClick(event) {
    const canvas = document.getElementById('glCanvas');
    
    // Converter coordenadas do mouse para coordenadas WebGL (-1 a 1)
    let x = (2 / canvas.width * event.offsetX) - 1;
    let y = (-2 / canvas.height * event.offsetY) + 1;
    
    console.log(`Clique em: (${x.toFixed(3)}, ${y.toFixed(3)})`);
    
    // Converter raio para coordenadas WebGL
    const radiusNormalized = (circleRadius / canvas.width) * 2;
    
    // Gerar pontos do círculo usando Bresenham
    const circlePoints = bresenhamCircle(x, y, radiusNormalized);
    
    // Armazenar o círculo para redesenho
    allCircles.push({
        points: circlePoints,
        color: [...colorVector] // Copiar a cor atual
    });
    
    clickCount++;
    updateClickCount();
    drawAllCircles();
}

function keyDown(event) {
    switch(event.key.toLowerCase()) {
        case 'c':
            // Mudar cor aleatória
            colorVector = [Math.random(), Math.random(), Math.random()];
            console.log(`Nova cor: RGB(${colorVector[0].toFixed(2)}, ${colorVector[1].toFixed(2)}, ${colorVector[2].toFixed(2)})`);
            break;
        case 'r':
            clearCanvas();
            break;
    }
    gl.uniform3fv(colorUniformLocation, colorVector);
}

function drawAllCircles() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    allCircles.forEach(circle => {
        gl.uniform3fv(colorUniformLocation, circle.color);
        
        // Desenhar os pontos do círculo
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(circle.points), gl.STATIC_DRAW);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.POINTS, 0, circle.points.length / 2);
    });
    
    gl.uniform3fv(colorUniformLocation, colorVector);
}

function updateRadius() {
    const radiusInput = document.getElementById('radius');
    const newRadius = parseInt(radiusInput.value);
    
    if (newRadius >= 10 && newRadius <= 200) {
        circleRadius = newRadius;
        console.log(`Raio atualizado para: ${circleRadius}`);
        // Redesenhar todos os círculos com o novo raio
        redrawAllCirclesWithNewRadius();
    } else {
        alert('Raio deve estar entre 10 e 200');
    }
}

function redrawAllCirclesWithNewRadius() {
    const canvas = document.getElementById('glCanvas');
    const radiusNormalized = (circleRadius / canvas.width) * 2;
    
    allCircles = allCircles.map(circle => {
        // Recalcular pontos com novo raio (mantendo o centro)
        const centerX = circle.points[0]; // Primeiro ponto X
        const centerY = circle.points[1]; // Primeiro ponto Y
        const newPoints = bresenhamCircle(centerX, centerY, radiusNormalized);
        
        return {
            points: newPoints,
            color: circle.color
        };
    });
    
    drawAllCircles();
}

function clearCanvas() {
    allCircles = [];
    clickCount = 0;
    updateClickCount();
    gl.clear(gl.CLOR_BUFFER_BIT);
    gl.clear(gl.COLOR_BUFFER_BIT);
    console.log('Canvas limpo');
}

function updateClickCount() {
    const clickCountElement = document.getElementById('clickCount');
    if (clickCountElement) {
        clickCountElement.textContent = clickCount;
    }
}

window.onload = main;