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
  
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)){
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

// Função para desenhar todas as arestas de um triângulo usando Bresenham
function bresenhamTriangle(x0, y0, x1, y1, x2, y2){
    const points = new Set(); // Usar Set para evitar pontos duplicados
    
    // Desenhar as três arestas do triângulo
    const edges = [
        bresenhamLine(x0, y0, x1, y1),
        bresenhamLine(x1, y1, x2, y2),
        bresenhamLine(x2, y2, x0, y0)
    ];
    
    // Combinar todos os pontos das três arestas
    edges.forEach(edge =>{
        for (let i = 0; i < edge.length; i += 2){
            const pointKey = `${edge[i]},${edge[i+1]}`;
            points.add(pointKey);
        }
    });
    
    // Converter Set de volta para array
    const result = [];
    points.forEach(pointKey =>{
        const [x, y] = pointKey.split(',').map(Number);
        result.push(x, y);
    });
    
    return result;
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
    const modeIndicator = document.getElementById('modeIndicator');
    
    if (!gl) {
        console.error('WebGL not supported');
        return;
    }
    
    const vertexShader = createShader1(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader1(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    const program = createProgram1(gl, vertexShader, fragmentShader);
    
    gl.useProgram(program);

    // Buffer para os vértices
    const vertexBuffer = gl.createBuffer();
    
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    
    let currentColor = colorPalette[1]; // Cor inicial: Azul
    let points = []; // Array para armazenar pontos
    let clickCount = 0; // Contador de cliques
    let clickedPoints = []; // Array para armazenar pontos clicados
    let currentMode = 'line'; // 'line' ou 'triangle'

    const colorUniformLocation = gl.getUniformLocation(program, 'u_color');
    gl.uniform3fv(colorUniformLocation, currentColor);

    function updateModeIndicator(){
        if (currentMode === 'line'){
            modeIndicator.textContent = 'Modo Atual: LINHAS (R) - Clique para definir pontos da linha (2 cliques)';
            modeIndicator.className = 'mode-indicator line-mode';
        } else {
            modeIndicator.textContent = 'Modo Atual: TRIÂNGULOS (T) - Clique para definir vértices do triângulo (3 cliques)';
            modeIndicator.className = 'mode-indicator triangle-mode';
        }
    }

    canvas.addEventListener("mousedown", mouseClick, false);
  
    function mouseClick(event){
        if (event.button !== 0) return; // Apenas botão esquerdo
        
        // Converter coordenadas do mouse para coordenadas WebGL (-1 a 1)
        let x = (2 / canvas.width * event.offsetX) - 1;
        let y = (-2 / canvas.height * event.offsetY) + 1;
        
        console.log(`Clique ${clickCount + 1} no modo ${currentMode}: (${x.toFixed(3)}, ${y.toFixed(3)})`);
        
        // Adicionar ponto à lista de pontos clicados
        clickedPoints.push({ x, y });
        clickCount++;
        
        if (currentMode === 'line' && clickCount === 2){
            // Modo linha: 2 cliques para desenhar a linha
            drawLineFromPoints();
            clickCount = 0;
            clickedPoints = [];
        } else if (currentMode === 'triangle' && clickCount === 3){
            // Modo triângulo: 3 cliques para desenhar o triângulo
            drawTriangleFromPoints();
            clickCount = 0;
            clickedPoints = [];
        }
    }
    
    function drawLineFromPoints(){
        const [p1, p2] = clickedPoints;
        
        // Gerar pontos usando algoritmo de Bresenham
        points = bresenhamLine(
            Math.round(p1.x * canvas.width / 2 + canvas.width / 2),
            Math.round(-p1.y * canvas.height / 2 + canvas.height / 2),
            Math.round(p2.x * canvas.width / 2 + canvas.width / 2),
            Math.round(-p2.y * canvas.height / 2 + canvas.height / 2)
        );
        
        // Converter pontos de volta para coordenadas WebGL
        const webglPoints = [];
        for (let i = 0; i < points.length; i += 2){
            const webglX = (points[i] - canvas.width / 2) * 2 / canvas.width;
            const webglY = -(points[i + 1] - canvas.height / 2) * 2 / canvas.height;
            webglPoints.push(webglX, webglY);
        }
        
        // Atualizar buffer com os pontos
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(webglPoints), gl.STATIC_DRAW);
        
        drawScene();
    }
    
    function drawTriangleFromPoints(){
        const [p1, p2, p3] = clickedPoints;
        
        // Gerar pontos do triângulo usando Bresenham nas arestas
        points = bresenhamTriangle(
            Math.round(p1.x * canvas.width / 2 + canvas.width / 2),
            Math.round(-p1.y * canvas.height / 2 + canvas.height / 2),
            Math.round(p2.x * canvas.width / 2 + canvas.width / 2),
            Math.round(-p2.y * canvas.height / 2 + canvas.height / 2),
            Math.round(p3.x * canvas.width / 2 + canvas.width / 2),
            Math.round(-p3.y * canvas.height / 2 + canvas.height / 2)
        );
        
        // Converter pontos de volta para coordenadas WebGL
        const webglPoints = [];
        for (let i = 0; i < points.length; i += 2){
            const webglX = (points[i] - canvas.width / 2) * 2 / canvas.width;
            const webglY = -(points[i + 1] - canvas.height / 2) * 2 / canvas.height;
            webglPoints.push(webglX, webglY);
        }
        
        // Atualizar buffer com os pontos
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(webglPoints), gl.STATIC_DRAW);
        
        drawScene();
    }
  
    const bodyElement = document.querySelector("body");
    bodyElement.addEventListener("keydown", keyDown, false);
  
    function keyDown(event) {
        const key = event.key.toLowerCase();
        
        if (key >= '0' && key <= '9'){
            // Mudar cor
            const colorIndex = parseInt(key);
            currentColor = colorPalette[colorIndex];
            console.log(`Cor alterada para índice ${colorIndex}`);
            
            gl.uniform3fv(colorUniformLocation, currentColor);
            
            // Redesenhar se existir algo na tela
            if (points.length > 0){
                drawScene();
            }
        } else if (key === 'r'){
            // Mudar para modo linha
            currentMode = 'line';
            clickCount = 0;
            clickedPoints = [];
            updateModeIndicator();
            console.log('Modo alterado para: LINHAS');
        } else if (key === 't'){
            // Mudar para modo triângulo
            currentMode = 'triangle';
            clickCount = 0;
            clickedPoints = [];
            updateModeIndicator();
            console.log('Modo alterado para: TRIÂNGULOS');
        } else if (key === 'c'){
            // Limpar tela
            points = [];
            clickedPoints = [];
            clickCount = 0;
            gl.clear(gl.COLOR_BUFFER_BIT);
            console.log('Tela limpa');
        }
    }

    function drawScene(){
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        if (points.length > 0){
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.POINTS, 0, points.length / 2);
        }
    }

    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    updateModeIndicator();
}

main();