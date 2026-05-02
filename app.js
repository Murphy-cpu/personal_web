// ===== 配置 =====
const CONFIG = {
    grid: {
        size: 40,           // 网格大小
        color: '#222222',   // 网格颜色
        lineWidth: 1
    },
    graph: {
        nodeRadius: 30,
        nodeColor: '#ffffff',
        nodeHoverColor: '#888888',
        linkColor: '#444444',
        linkHoverColor: '#ffffff',
        linkWidth: 1
    }
};

// ===== 节点数据 =====
// 你可以在这里修改你的项目信息
const nodes = [
    { id: 'center', label: 'Murphy-cpu', x: 0, y: 0, radius: 50, isCenter: true, desc: '开发者 · 创造者 · 思考者', links: [] },
    { id: 'project1', label: 'OC Creator', x: -200, y: -150, desc: 'Gradio 演示应用，包含多个交互功能', links: ['https://github.com/Murphy-cpu/oc_creater'] },
    { id: 'project2', label: 'Portfolio', x: 200, y: -150, desc: '个人网站项目，展示技能与作品', links: [] },
    { id: 'skill1', label: 'Python', x: -250, y: 100, desc: '主要编程语言，用于数据分析与AI开发', links: [] },
    { id: 'skill2', label: 'Web Dev', x: 250, y: 100, desc: '前端开发技能，HTML/CSS/JavaScript', links: [] },
    { id: 'skill3', label: 'AI/ML', x: 0, y: 200, desc: '人工智能与机器学习研究', links: [] },
    { id: 'edu', label: 'Waterloo', x: -150, y: -250, desc: '滑铁卢大学计算机科学', links: ['https://uwaterloo.ca'] },
    { id: 'interest', label: 'Creative', x: 150, y: -250, desc: '创意设计 · 交互体验 · 视觉艺术', links: [] }
];

// ===== 连接关系 =====
const links = [
    { source: 'center', target: 'project1' },
    { source: 'center', target: 'project2' },
    { source: 'center', target: 'skill1' },
    { source: 'center', target: 'skill2' },
    { source: 'center', target: 'skill3' },
    { source: 'center', target: 'edu' },
    { source: 'center', target: 'interest' },
    { source: 'project1', target: 'skill1' },
    { source: 'project2', target: 'skill2' },
    { source: 'skill1', target: 'skill3' },
    { source: 'skill2', target: 'interest' },
    { source: 'edu', target: 'skill1' },
    { source: 'edu', target: 'skill3' }
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

// ===== 初始化 =====
function init() {
    resize();
    window.addEventListener('resize', resize);

    // 鼠标事件
    graphCanvas.addEventListener('mousemove', onMouseMove);
    graphCanvas.addEventListener('mousedown', onMouseDown);
    graphCanvas.addEventListener('mouseup', onMouseUp);
    graphCanvas.addEventListener('wheel', onWheel);
    graphCanvas.addEventListener('click', onClick);

    // 初始化节点位置到屏幕中心
    nodes.forEach(node => {
        node.originalX = node.x;
        node.originalY = node.y;
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

    // 重置偏移到屏幕中心
    if (!isDragging && !dragNode) {
        offsetX = width / 2;
        offsetY = height / 2;
    }
}

// ===== 网格绘制 =====
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
        gridCtx.moveTo(x, 0);
        gridCtx.lineTo(x, height);
        gridCtx.stroke();
    }

    // 绘制水平线
    for (let y = startY; y < height; y += gridSize) {
        gridCtx.beginPath();
        gridCtx.moveTo(0, y);
        gridCtx.lineTo(width, y);
        gridCtx.stroke();
    }
}

// ===== 知识图谱绘制 =====
function drawGraph() {
    graphCtx.clearRect(0, 0, width, height);

    // 绘制连线
    links.forEach(link => {
        const source = nodes.find(n => n.id === link.source);
        const target = nodes.find(n => n.id === link.target);

        if (source && target) {
            const sx = source.x * scale + offsetX;
            const sy = source.y * scale + offsetY;
            const tx = target.x * scale + offsetX;
            const ty = target.y * scale + offsetY;

            // 检查是否有节点被悬停或选中
            const isActive = hoveredNode && (hoveredNode.id === source.id || hoveredNode.id === target.id);
            const isSelected = selectedNode && (selectedNode.id === source.id || selectedNode.id === target.id);

            graphCtx.beginPath();
            graphCtx.moveTo(sx, sy);
            graphCtx.lineTo(tx, ty);
            graphCtx.strokeStyle = isActive || isSelected ? CONFIG.graph.linkHoverColor : CONFIG.graph.linkColor;
            graphCtx.lineWidth = isActive || isSelected ? 2 : CONFIG.graph.linkWidth;
            graphCtx.stroke();
        }
    });

    // 绘制节点
    nodes.forEach(node => {
        const x = node.x * scale + offsetX;
        const y = node.y * scale + offsetY;
        const radius = (node.radius || CONFIG.graph.nodeRadius) * scale;

        const isHovered = hoveredNode && hoveredNode.id === node.id;
        const isSelected = selectedNode && selectedNode.id === node.id;

        // 节点圆圈
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

        // 节点边框
        graphCtx.strokeStyle = isHovered || isSelected ? '#ffffff' : '#666666';
        graphCtx.lineWidth = isHovered || isSelected ? 2 : 1;
        graphCtx.stroke();

        // 节点文字
        graphCtx.fillStyle = node.isCenter ? '#000000' : '#ffffff';
        graphCtx.font = `${(node.isCenter ? 14 : 12) * scale}px "Helvetica Neue", Arial`;
        graphCtx.textAlign = 'center';
        graphCtx.textBaseline = 'middle';
        graphCtx.fillText(node.label, x, y);
    });
}

// ===== 动画循环 =====
function animate() {
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
        const x = node.x * scale + offsetX;
        const y = node.y * scale + offsetY;
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
        // 拖拽节点
        dragNode.x = (mouseX - offsetX) / scale;
        dragNode.y = (mouseY - offsetY) / scale;
    } else if (isDragging) {
        // 拖拽整个画布
        offsetX += e.movementX;
        offsetY += e.movementY;
    } else {
        // 检测悬停
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
    scale = Math.max(0.3, Math.min(3, scale)); // 限制缩放范围
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