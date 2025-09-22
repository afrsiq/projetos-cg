// Vertex shader source code
const vertexShaderSource = `
  attribute vec2 a_position;
  uniform float u_pointSize;

  void main() {
    gl_Position = vec4(a_position, 0, 1);
    gl_PointSize = u_pointSize;
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
function bresenhamLine(x0, y0, x1, y1, thickness = 1){
    const points = [];
    
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    
    const sx = (x0 < x1) ? 1 : -1;
    const sy = (y0 < y1) ? 1 : -1;
    
    let err = dx - dy;
    let x = x0;
    let y = y0;
    
    // Adicionar ponto central
    addPointWithThickness(points, x, y, thickness);
    
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
        
        addPointWithThickness(points, x, y, thickness);
    }
    
    return points;
}

// Função para adicionar pontos com espessura
function addPointWithThickness(points, x, y, thickness){
    if (thickness === 1) {
        points.push(x, y);
        return;
    }
    
    const halfThickness = Math.floor(thickness / 2);
    
    // Adicionar pontos ao redor do ponto central para criar espessura
    for (let dx = -halfThickness; dx <= halfThickness; dx++) {
        for (let dy = -halfThickness; dy <= halfThickness; dy++){
            // Para espessuras pares, ajustar a distribuição
            if (thickness % 2 === 0) {
                points.push(x + dx + 0.5, y + dy + 0.5);
            } else {
                points.push(x + dx, y + dy);
            }
        }
    }
}

// Função para desenhar todas as arestas de um triângulo usando Bresenham
function bresenhamTriangle(x0, y0, x1, y1, x2, y2, thickness = 1){
    const points = new Set(); // Usar Set para evitar pontos duplicados
    
    // Desenhar as três arestas do triângulo
    const edges = [
        bresenhamLine(x0, y0, x1, y1, thickness),
        bresenhamLine(x1, y1, x2, y2, thickness),
        bresenhamLine(x2, y2, x0, y0, thickness)
    ];
    
    // Combinar todos os pontos das três arestas
    edges.forEach(edge => {
        for (let i = 0; i < edge.length; i += 2){
            const pointKey = `${edge[i]},${edge[i+1]}`;
            points.add(pointKey);
        }
    });
    
    // Converter Set de volta para array
    const result = [];
    points.forEach(pointKey => {
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

// Nomes das cores para exibição
const colorNames = [
    "Preto", "Azul", "Vermelho", "Verde", "Amarelo", 
    "Magenta", "Ciano", "Laranja", "Roxo", "Marrom"
];

function main(){
    const canvas = document.getElementById('glCanvas');
    const gl = canvas.getContext('webgl');
    const modeIndicator = document.getElementById('modeIndicator');
    const currentColorSpan = document.getElementById('currentColor');
    const currentThicknessSpan = document.getElementById('currentThickness');
    const currentFunctionSpan = document.getElementById('currentFunction');
    
    if (!gl){
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
    
    // Variáveis de estado
    let currentColor = colorPalette[1]; // Cor inicial: Azul
    let currentColorIndex = 1;
    let currentThickness = 1; // Espessura inicial: 1
    let currentDrawMode = 'line'; // 'line' ou 'triangle'
    let currentFunction = 'draw'; // 'draw', 'color', 'thickness'
    let points = []; // Array para armazenar pontos
    let clickCount = 0; // Contador de cliques
    let clickedPoints = []; // Array para armazenar pontos clicados

    // Localizações dos uniforms
    const colorUniformLocation = gl.getUniformLocation(program, 'u_color');
    const pointSizeUniformLocation = gl.getUniformLocation(program, 'u_pointSize');
    
    // Atualizar uniforms iniciais
    gl.uniform3fv(colorUniformLocation, currentColor);
    gl.uniform1f(pointSizeUniformLocation, currentThickness);

    function updateModeIndicator(){
        if (currentDrawMode === 'line'){
            modeIndicator.textContent = 'Modo Atual: LINHAS (R) - Clique para definir pontos da linha (2 cliques)';
            modeIndicator.className = 'mode-indicator line-mode';
        } else {
            modeIndicator.textContent = 'Modo Atual: TRIÂNGULOS (T) - Clique para definir vértices do triângulo (3 cliques)';
            modeIndicator.className = 'mode-indicator triangle-mode';
        }
    }

    function updateStatusBar(){
        currentColorSpan.textContent = colorNames[currentColorIndex];
        currentThicknessSpan.textContent = currentThickness.toString();
        
        switch(currentFunction){
            case 'draw':
                currentFunctionSpan.textContent = 'Desenho (R/T)';
                break;
            case 'color':
                currentFunctionSpan.textContent = 'Cor (K) - Use 0-9';
                break;
            case 'thickness':
                currentFunctionSpan.textContent = 'Espessura (E) - Use 1-9';
                break;
        }
        
        // Atualizar cor do indicador de função
        if (currentFunction === 'color'){
            modeIndicator.className = 'mode-indicator color-mode';
            modeIndicator.textContent = 'FUNÇÃO ATIVA: COR - Pressione teclas 0-9 para selecionar cor';
        } else if (currentFunction === 'thickness'){
            modeIndicator.className = 'mode-indicator thickness-mode';
            modeIndicator.textContent = 'FUNÇÃO ATIVA: ESPESSURA - Pressione teclas 1-9 para selecionar espessura';
        } else {
            updateModeIndicator();
        }
    }

    canvas.addEventListener("mousedown", mouseClick, false);
  
    function mouseClick(event){
        if (event.button !== 0 || currentFunction !== 'draw') return; // Apenas botão esquerdo e modo desenho
        
        // Converter coordenadas do mouse para coordenadas WebGL (-1 a 1)
        let x = (2 / canvas.width * event.offsetX) - 1;
        let y = (-2 / canvas.height * event.offsetY) + 1;
        
        console.log(`Clique ${clickCount + 1} no modo ${currentDrawMode}: (${x.toFixed(3)}, ${y.toFixed(3)})`);
        
        // Adicionar ponto à lista de pontos clicados
        clickedPoints.push({ x, y });
        clickCount++;
        
        if (currentDrawMode === 'line' && clickCount === 2){
            // Modo linha: 2 cliques para desenhar a linha
            drawLineFromPoints();
            clickCount = 0;
            clickedPoints = [];
        } else if (currentDrawMode === 'triangle' && clickCount === 3){
            // Modo triângulo: 3 cliques para desenhar o triângulo
            drawTriangleFromPoints();
            clickCount = 0;
            clickedPoints = [];
        }
    }
    
    function drawLineFromPoints(){
        const [p1, p2] = clickedPoints;
        
        // Gerar pontos usando algoritmo de Bresenham com espessura
        points = bresenhamLine(
            Math.round(p1.x * canvas.width / 2 + canvas.width / 2),
            Math.round(-p1.y * canvas.height / 2 + canvas.height / 2),
            Math.round(p2.x * canvas.width / 2 + canvas.width / 2),
            Math.round(-p2.y * canvas.height / 2 + canvas.height / 2),
            currentThickness
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
        
        // Gerar pontos do triângulo usando Bresenham nas arestas com espessura
        points = bresenhamTriangle(
            Math.round(p1.x * canvas.width / 2 + canvas.width / 2),
            Math.round(-p1.y * canvas.height / 2 + canvas.height / 2),
            Math.round(p2.x * canvas.width / 2 + canvas.width / 2),
            Math.round(-p2.y * canvas.height / 2 + canvas.height / 2),
            Math.round(p3.x * canvas.width / 2 + canvas.width / 2),
            Math.round(-p3.y * canvas.height / 2 + canvas.height / 2),
            currentThickness
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
        
        if (currentFunction === 'color' && key >= '0' && key <= '9'){
            // Mudar cor (modo cor ativo)
            const colorIndex = parseInt(key);
            currentColor = colorPalette[colorIndex];
            currentColorIndex = colorIndex;
            console.log(`Cor alterada para: ${colorNames[colorIndex]}`);
            
            gl.uniform3fv(colorUniformLocation, currentColor);
            updateStatusBar();
            
            // Redesenhar se existir algo na tela
            if (points.length > 0){
                drawScene();
            }
            
        } else if (currentFunction === 'thickness' && key >= '1' && key <= '9'){
            // Mudar espessura (modo espessura ativo)
            currentThickness = parseInt(key);
            console.log(`Espessura alterada para: ${currentThickness}`);
            
            gl.uniform1f(pointSizeUniformLocation, currentThickness);
            updateStatusBar();
            
            // Redesenhar se existir algo na tela
            if (points.length > 0){
                drawScene();
            }
            
        } else if (key === 'r'){
            // Mudar para modo linha
            currentDrawMode = 'line';
            currentFunction = 'draw';
            clickCount = 0;
            clickedPoints = [];
            updateStatusBar();
            console.log('Modo alterado para: LINHAS');
        } else if (key === 't'){
            // Mudar para modo triângulo
            currentDrawMode = 'triangle';
            currentFunction = 'draw';
            clickCount = 0;
            clickedPoints = [];
            updateStatusBar();
            console.log('Modo alterado para: TRIÂNGULOS');
        } else if (key === 'k'){
            // Ativar função de cor
            currentFunction = 'color';
            updateStatusBar();
            console.log('Função ativada: COR - Use teclas 0-9 para selecionar cor');
        } else if (key === 'e'){
            // Ativar função de espessura
            currentFunction = 'thickness';
            updateStatusBar();
            console.log('Função ativada: ESPESSURA - Use teclas 1-9 para selecionar espessura');
        } else if (key === 'c'){
            // Limpar tela
            points = [];
            clickedPoints = [];
            clickCount = 0;
            gl.clear(gl.COLOR_BUFFER_BIT);
            console.log('Tela limpa');
        } else if (key === 'd'){
            // Voltar para modo desenho
            currentFunction = 'draw';
            updateStatusBar();
            console.log('Função ativada: DESENHO');
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
    updateStatusBar();
}

main();