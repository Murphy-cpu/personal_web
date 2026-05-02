// ===== 配置 =====
const CONFIG = {
    grid: {
        size: 40,
        color: '#222222',
        lineWidth: 1
    },
    graph: {
        nodeRadius: 30,
        nodeColor: '#ffffff',
        nodeHoverColor: '#888888',
        linkColor: '#444444',
        linkHoverColor: '#ffffff',
        linkWidth: 1
    },
    // 鼠标特效配置
    mouseEffect: {
        radius: 200,        // 影响范围
        glowColor: 'rgba(255, 255, 255, 0.1)',
        lineGlow: 'rgba(255, 255, 255, 0.3)',
        nodePush: 50        // 节点被推开的力度
    }
};

// ===== 节点数据 =====
// 你可以在这里修改你的项目信息
const nodes = [
    { id: 'center', label: 'Murphy-cpu', x: 0, y: 0, radius: 50, isCenter: true, desc: '开发者 · 创造者 · 思考者', links: [] },
    { id: 'project2', label: 'Portfolio', x: 200, y: -150, desc: '个人网站项目，展示技能与作品', links: [] },
    { id: 'skill2', label: 'Web Dev', x: 250, y: 100, desc: '前端开发技能，HTML/CSS/JavaScript', links: [] },
    { id: 'skill3', label: 'AI/ML', x: 0, y: 200, desc: '人工智能与机器学习研究', links: [] },
    { id: 'interest', label: 'Creative', x: 150, y: -250, desc: '创意设计 · 交互体验 · 视觉艺术', links: [] }
];

// ===== 连接关系 =====
const links = [
    { source: 'center', target: 'project2' },
    { source: 'center', target: 'skill2' },
    { source: 'center', target: 'skill3' },
    { source: 'center', target: 'interest' },
    { source: 'project2', target: 'skill2' },
    { source: 'skill2', target: 'interest' }
];

// ===== Canvas 设置 =====
const gridCanvas = document.getElementById('gridCanvas');
const graphCanvas = document.getElementById('graphCanvas');
const gridCtx = gridCanvas.getContext('2d');
const graphCtx = graphCanvas.getContext('2d');

let width, height;
let offsetX = 0, offsetY = 0;
let scale = 1;
let isDragging = false;
let dragNode = null;
let hoveredNode = null;
let selectedNode = null;
let mouseX = 0, mouseY = 0;

// 鼠标特效相关
let mouseGlowCanvas, mouseGlowCtx;

// ===== 初始化 =====
function init() {
    // 创建鼠标光晕 Canvas
    mouseGlowCanvas = document.createElement('canvas');
    mouseGlowCtx = mouseGlowCanvas.getContext('2d');
    mouseGlowCanvas.style.position = 'fixed';
    mouseGlowCanvas.style.top = '0';
    mouseGlowCanvas.style.left = '0';
    mouseGlowCanvas.style.pointerEvents = 'none';
    mouseGlowCanvas.style.zIndex = '0';
    document.body.appendChild(mouseGlowCanvas);

    resize();
    window.addEventListener('resize', resize);

    graphCanvas.addEventListener('mousemove', onMouseMove);
    graphCanvas.addEventListener('mousedown', onMouseDown);
    graphCanvas.addEventListener('mouseup', onMouseUp);
    graphCanvas.addEventListener('wheel', onWheel);
    graphCanvas.addEventListener('click', onClick);

    nodes.forEach(node => {
        node.originalX = node.x;
        node.originalY = node.y;
        node.currentX = node.x;
        node.currentY = node.y;
    });

    animate();
}

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    gridCanvas.width = width;
    gridCanvas.height = height;
    graphCanvas.width = width;
    graphCanvas.height = height;
    mouseGlowCanvas.width = width;
    mouseGlowCanvas.height = height;

    if (!isDragging && !dragNode) {
        offsetX = width / 2;
        offsetY = height / 2;
    }
}

// ===== 鼠标光晕绘制 =====
function drawMouseGlow() {
    mouseGlowCtx.clearRect(0, 0, width, height);

    if (mouseX > 0 && mouseY > 0 && !isDragging) {
        // 绘制光晕
        const gradient = mouseGlowCtx.createRadialGradient(
            mouseX, mouseY, 0,
            mouseX, mouseY, CONFIG.mouseEffect.radius
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.03)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        mouseGlowCtx.fillStyle = gradient;
        mouseGlowCtx.beginPath();
        mouseGlowCtx.arc(mouseX, mouseY, CONFIG.mouseEffect.radius, 0, Math.PI * 2);
        mouseGlowCtx.fill();
    }
}

// ===== 网格绘制（带鼠标特效） =====
function drawGrid() {
    gridCtx.clearRect(0, 0, width, height);
    gridCtx.strokeStyle = CONFIG.grid.color;
    gridCtx.lineWidth = CONFIG.grid.lineWidth;

    const gridSize = CONFIG.grid.size * scale;
    const startX = offsetX % gridSize;
    const startY = offsetY % gridSize;

    // 绘制垂直线
    for (let x = startX; x < width; x += gridSize) {
        gridCtx.beginPath();

        // 检查线条是否靠近鼠标
        const distToMouse = Math.abs(x - mouseX);
        if (distToMouse < CONFIG.mouseEffect.radius && !isDragging) {
            const intensity = 1 - distToMouse / CONFIG.mouseEffect.radius;
            gridCtx.strokeStyle = `rgba(255, 255, 255, ${0.15 + intensity * 0.2})`;
            gridCtx.lineWidth = 1 + intensity * 2;
        } else {
            gridCtx.strokeStyle = CONFIG.grid.color;
            gridCtx.lineWidth = CONFIG.grid.lineWidth;
        }

        gridCtx.moveTo(x, 0);
        gridCtx.lineTo(x, height);
        gridCtx.stroke();
    }

    // 绘制水平线
    for (let y = startY; y < height; y += gridSize) {
        gridCtx.beginPath();

        const distToMouse = Math.abs(y - mouseY);
        if (distToMouse < CONFIG.mouseEffect.radius && !isDragging) {
            const intensity = 1 - distToMouse / CONFIG.mouseEffect.radius;
            gridCtx.strokeStyle = `rgba(255, 255, 255, ${0.15 + intensity * 0.2})`;
            gridCtx.lineWidth = 1 + intensity * 2;
        } else {
            gridCtx.strokeStyle = CONFIG.grid.color;
            gridCtx.lineWidth = CONFIG.grid.lineWidth;
        }

        gridCtx.moveTo(0, y);
        gridCtx.lineTo(width, y);
        gridCtx.stroke();
    }

    // 绘制网格交叉点光点
    for (let x = startX; x < width; x += gridSize) {
        for (let y = startY; y < height; y += gridSize) {
            const distToMouse = Math.sqrt((x - mouseX) ** 2 + (y - mouseY) ** 2);
            if (distToMouse < CONFIG.mouseEffect.radius && !isDragging) {
                const intensity = 1 - distToMouse / CONFIG.mouseEffect.radius;
                const dotSize = 2 + intensity * 3;

                gridCtx.beginPath();
                gridCtx.arc(x, y, dotSize, 0, Math.PI * 2);
                gridCtx.fillStyle = `rgba(255, 255, 255, ${intensity * 0.5})`;
                gridCtx.fill();
            }
        }
    }
}

// ===== 知识图谱绘制（带鼠标推开效果） =====
function drawGraph() {
    graphCtx.clearRect(0, 0, width, height);

    // 更新节点位置（鼠标推开效果）
    nodes.forEach(node => {
        if (!dragNode || dragNode.id !== node.id) {
            const screenX = node.originalX * scale + offsetX;
            const screenY = node.originalY * scale + offsetY;
            const distToMouse = Math.sqrt((screenX - mouseX) ** 2 + (screenY - mouseY) ** 2);

            if (distToMouse < CONFIG.mouseEffect.radius && !isDragging && !node.isCenter) {
                const pushStrength = (1 - distToMouse / CONFIG.mouseEffect.radius) * CONFIG.mouseEffect.nodePush;
                const angle = Math.atan2(screenY - mouseY, screenX - mouseX);
                node.currentX = node.originalX + Math.cos(angle) * pushStrength / scale;
                node.currentY = node.originalY + Math.sin(angle) * pushStrength / scale;
            } else {
                // 缓慢恢复原位
                node.currentX += (node.originalX - node.currentX) * 0.1;
                node.currentY += (node.originalY - node.currentY) * 0.1;
            }
        }
    });

    // 绘制连线
    links.forEach(link => {
        const source = nodes.find(n => n.id === link.source);
        const target = nodes.find(n => n.id === link.target);

        if (source && target) {
            const sx = (dragNode && dragNode.id === source.id ? source.x : source.currentX) * scale + offsetX;
            const sy = (dragNode && dragNode.id === source.id ? source.y : source.currentY) * scale + offsetY;
            const tx = (dragNode && dragNode.id === target.id ? target.x : target.currentX) * scale + offsetX;
            const ty = (dragNode && dragNode.id === target.id ? target.y : target.currentY) * scale + offsetY;

            const isActive = hoveredNode && (hoveredNode.id === source.id || hoveredNode.id === target.id);
            const isSelected = selectedNode && (selectedNode.id === source.id || selectedNode.id === target.id);

            // 线条靠近鼠标时发光
            const midX = (sx + tx) / 2;
            const midY = (sy + ty) / 2;
            const distToMouse = Math.sqrt((midX - mouseX) ** 2 + (midY - mouseY) ** 2);

            if (distToMouse < CONFIG.mouseEffect.radius && !isDragging) {
                const intensity = 1 - distToMouse / CONFIG.mouseEffect.radius;
                graphCtx.strokeStyle = isActive || isSelected ? '#ffffff' : `rgba(255, 255, 255, ${0.3 + intensity * 0.4})`;
                graphCtx.lineWidth = (isActive || isSelected ? 2 : 1) + intensity * 2;
            } else {
                graphCtx.strokeStyle = isActive || isSelected ? CONFIG.graph.linkHoverColor : CONFIG.graph.linkColor;
                graphCtx.lineWidth = isActive || isSelected ? 2 : CONFIG.graph.linkWidth;
            }

            graphCtx.beginPath();
            graphCtx.moveTo(sx, sy);
            graphCtx.lineTo(tx, ty);
            graphCtx.stroke();
        }
    });

    // 绘制节点
    nodes.forEach(node => {
        const x = (dragNode && dragNode.id === node.id ? node.x : node.currentX) * scale + offsetX;
        const y = (dragNode && dragNode.id === node.id ? node.y : node.currentY) * scale + offsetY;
        const radius = (node.radius || CONFIG.graph.nodeRadius) * scale;

        const isHovered = hoveredNode && hoveredNode.id === node.id;
        const isSelected = selectedNode && selectedNode.id === node.id;

        // 鼠标靠近节点时发光
        const distToMouse = Math.sqrt((x - mouseX) ** 2 + (y - mouseY) ** 2);
        if (distToMouse < CONFIG.mouseEffect.radius && !isDragging) {
            const intensity = 1 - distToMouse / CONFIG.mouseEffect.radius;
            const glowRadius = radius + 10 * intensity;

            graphCtx.beginPath();
            graphCtx.arc(x, y, glowRadius, 0, Math.PI * 2);
            graphCtx.fillStyle = `rgba(255, 255, 255, ${intensity * 0.15})`;
            graphCtx.fill();
        }

        graphCtx.beginPath();
        graphCtx.arc(x, y, radius, 0, Math.PI * 2);

        if (node.isCenter) {
            graphCtx.fillStyle = '#ffffff';
        } else if (isHovered || isSelected) {
            graphCtx.fillStyle = '#cccccc';
        } else {
            graphCtx.fillStyle = '#333333';
        }
        graphCtx.fill();

        graphCtx.strokeStyle = isHovered || isSelected ? '#ffffff' : '#666666';
        graphCtx.lineWidth = isHovered || isSelected ? 2 : 1;
        graphCtx.stroke();

        graphCtx.fillStyle = node.isCenter ? '#000000' : '#ffffff';
        graphCtx.font = `${(node.isCenter ? 14 : 12) * scale}px "Helvetica Neue", Arial`;
        graphCtx.textAlign = 'center';
        graphCtx.textBaseline = 'middle';
        graphCtx.fillText(node.label, x, y);
    });
}

// ===== 动画循环 =====
function animate() {
    drawMouseGlow();
    drawGrid();
    drawGraph();
    requestAnimationFrame(animate);
}

// ===== 鼠标事件处理 =====
function getMousePos(e) {
    const rect = graphCanvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

function getNodeAtPos(mx, my) {
    for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i];
        const x = (node.currentX || node.x) * scale + offsetX;
        const y = (node.currentY || node.y) * scale + offsetY;
        const radius = (node.radius || CONFIG.graph.nodeRadius) * scale;

        const dist = Math.sqrt((mx - x) ** 2 + (my - y) ** 2);
        if (dist <= radius) {
            return node;
        }
    }
    return null;
}

function onMouseMove(e) {
    const pos = getMousePos(e);
    mouseX = pos.x;
    mouseY = pos.y;

    if (dragNode) {
        dragNode.x = (mouseX - offsetX) / scale;
        dragNode.y = (mouseY - offsetY) / scale;
        dragNode.currentX = dragNode.x;
        dragNode.currentY = dragNode.y;
    } else if (isDragging) {
        offsetX += e.movementX;
        offsetY += e.movementY;
    } else {
        hoveredNode = getNodeAtPos(mouseX, mouseY);
        graphCanvas.style.cursor = hoveredNode ? 'pointer' : 'default';
    }
}

function onMouseDown(e) {
    const pos = getMousePos(e);
    const node = getNodeAtPos(pos.x, pos.y);

    if (node) {
        dragNode = node;
    } else {
        isDragging = true;
        graphCanvas.style.cursor = 'grabbing';
    }
}

function onMouseUp(e) {
    isDragging = false;
    dragNode = null;
    graphCanvas.style.cursor = hoveredNode ? 'pointer' : 'default';
}

function onWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    scale *= delta;
    scale = Math.max(0.3, Math.min(3, scale));
}

function onClick(e) {
    const pos = getMousePos(e);
    const node = getNodeAtPos(pos.x, pos.y);

    if (node && !dragNode) {
        selectedNode = node;
        showInfoPanel(node);
    } else if (!node) {
        selectedNode = null;
        hideInfoPanel();
    }
}

// ===== 信息面板 =====
function showInfoPanel(node) {
    const panel = document.getElementById('infoPanel');
    const title = document.getElementById('panelTitle');
    const desc = document.getElementById('panelDesc');
    const linksDiv = document.getElementById('panelLinks');

    title.textContent = node.label;
    desc.textContent = node.desc || '暂无描述';

    linksDiv.innerHTML = '';
    if (node.links && node.links.length > 0) {
        node.links.forEach(link => {
            const a = document.createElement('a');
            a.href = link;
            a.textContent = link;
            a.target = '_blank';
            linksDiv.appendChild(a);
        });
    }

    panel.classList.remove('hidden');
}

function hideInfoPanel() {
    const panel = document.getElementById('infoPanel');
    panel.classList.add('hidden');
}

// ===== 启动 =====
init();