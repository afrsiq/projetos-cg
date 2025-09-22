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
    gl_FragColor = vec4(u_color,1.0);
  }
`;

function createShader1(gl, type, source){
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
      console.error('Error compiling shader:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
  }
  
  return shader;
}

function createProgram1(gl, vertexShader, fragmentShader){
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

// Algoritmo de Bresenham para desenhar linha
function bresenhamLine(x0, y0, x1, y1){
    const points = [];
    
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    
    const sx = (x0 < x1) ? 1 : -1;
    const sy = (y0 < y1) ? 1 : -1;
    
    let err = dx - dy;
    let x = x0;
    let y = y0;
    
    points.push(x, y);
    
    while (!(x === x1 && y === y1)){
        const e2 = 2 * err;
        
        if (e2 > -dy) {
            err -= dy;
            x += sx;
        }
        
        if (e2 < dx) {
            err += dx;
            y += sy;
        }
        
        points.push(x, y);
    }
    
    return points;
}

// Paleta de cores indexada (0-9)
const colorPalette = [
    [0.0, 0.0, 0.0],   // 0 - Preto
    [0.0, 0.0, 1.0],   // 1 - Azul
    [1.0, 0.0, 0.0],   // 2 - Vermelho
    [0.0, 1.0, 0.0],   // 3 - Verde
    [1.0, 1.0, 0.0],   // 4 - Amarelo
    [1.0, 0.0, 1.0],   // 5 - Magenta
    [0.0, 1.0, 1.0],   // 6 - Ciano
    [1.0, 0.5, 0.0],   // 7 - Laranja
    [0.5, 0.0, 0.5],   // 8 - Roxo
    [0.6, 0.3, 0.1]    // 9 - Marrom
];

function main(){
    const canvas = document.getElementById('glCanvas');
    const gl = canvas.getContext('webgl');
    
    if (!gl) {
        console.error('WebGL not supported');
        return;
    }
    
    const vertexShader = createShader1(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader1(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    const program = createProgram1(gl, vertexShader, fragmentShader);
    
    gl.useProgram(program);

    // Buffer para os vértices da linha
    const vertexBuffer = gl.createBuffer();
    
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    
    let currentColor = colorPalette[1]; // Cor inicial: Azul
    let points = []; // Array para armazenar pontos da linha
    let clickCount = 0; // Contador de cliques
    let startPoint = null; // Ponto inicial
    let endPoint = null; // Ponto final

    const colorUniformLocation = gl.getUniformLocation(program, 'u_color');
    gl.uniform3fv(colorUniformLocation, currentColor);

    canvas.addEventListener("mousedown", mouseClick, false);
  
    function mouseClick(event) {
        if (event.button !== 0) return; // Apenas botão esquerdo
        
        // Converter coordenadas do mouse para coordenadas WebGL (-1 a 1)
        let x = (2 / canvas.width * event.offsetX) - 1;
        let y = (-2 / canvas.height * event.offsetY) + 1;
        
        console.log(`Clique ${clickCount + 1}: (${x.toFixed(3)}, ${y.toFixed(3)})`);
        
        if (clickCount === 0) {
            // Primeiro clique - definir ponto inicial
            startPoint = { x, y };
            clickCount = 1;
        } else {
            // Segundo clique - definir ponto final e desenhar linha
            endPoint = { x, y };
            clickCount = 0;
            
            // Gerar pontos usando algoritmo de Bresenham
            points = bresenhamLine(
                Math.round(startPoint.x * canvas.width / 2 + canvas.width / 2),
                Math.round(-startPoint.y * canvas.height / 2 + canvas.height / 2),
                Math.round(endPoint.x * canvas.width / 2 + canvas.width / 2),
                Math.round(-endPoint.y * canvas.height / 2 + canvas.height / 2)
            );
            
            // Converter pontos de volta para coordenadas WebGL
            const webglPoints = [];
            for (let i = 0; i < points.length; i += 2) {
                const webglX = (points[i] - canvas.width / 2) * 2 / canvas.width;
                const webglY = -(points[i + 1] - canvas.height / 2) * 2 / canvas.height;
                webglPoints.push(webglX, webglY);
            }
            
            // Atualizar buffer com os pontos da linha
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(webglPoints), gl.STATIC_DRAW);
            
            drawLine();
        }
    }
  
    const bodyElement = document.querySelector("body");
    bodyElement.addEventListener("keydown", keyDown, false);
  
    function keyDown(event){
        const key = event.key;
        if (key >= '0' && key <= '9'){
            const colorIndex = parseInt(key);
            currentColor = colorPalette[colorIndex];
            console.log(`Cor alterada para índice ${colorIndex}`);
            
            gl.uniform3fv(colorUniformLocation, currentColor);
            
            if (points.length > 0){
                drawLine();
            }
        }
    }

    function drawLine(){
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        if (points.length > 0){
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.POINTS, 0, points.length / 2);
        }
    }

    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
}

main();