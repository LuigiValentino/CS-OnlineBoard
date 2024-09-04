const svgObject = document.getElementById('map-svg');
const colorButtons = document.querySelectorAll('.color-btn');
const addCTButton = document.getElementById('add-ct');
const addTTButton = document.getElementById('add-tt');
const exportButton = document.getElementById('export');
const clearButton = document.getElementById('clear');
const mapSelect = document.getElementById('map-select');

let drawingLines = [];
let undoStack = [];
let currentLine = null;
let isDrawing = false;
let currentColor = '#ffffff';
let draggingIcon = null;
let offsetX = 0;
let offsetY = 0;

svgObject.addEventListener('load', function () {
    const svgDoc = svgObject.contentDocument;
    const svgMap = svgDoc.querySelector('svg');

    svgMap.addEventListener('mousedown', (e) => {
        if (!draggingIcon) {
            isDrawing = true;
            const point = getSvgCoords(e, svgMap);
            currentLine = { color: currentColor, points: [point] };
            drawingLines.push(currentLine);
        }
    });

    svgMap.addEventListener('mousemove', (e) => {
        if (draggingIcon) {
            const coords = getSvgCoords(e, svgMap);
            draggingIcon.setAttribute('x', coords.x - offsetX);
            draggingIcon.setAttribute('y', coords.y - offsetY);
        } else if (isDrawing && currentLine) {
            const point = getSvgCoords(e, svgMap);
            currentLine.points.push(point);
            drawLines(svgMap);
        }
    });

    svgMap.addEventListener('mouseup', () => {
        if (isDrawing) {
            undoStack.push([...drawingLines]);
            currentLine = null;
            isDrawing = false;
        }
        draggingIcon = null;
    });

    svgMap.addEventListener('mouseleave', () => {
        isDrawing = false;
        draggingIcon = null;
    });
});

function getSvgCoords(evt, svgElement) {
    const pt = svgElement.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    return pt.matrixTransform(svgElement.getScreenCTM().inverse());
}

function drawLines(svgElement) {
    svgElement.querySelectorAll('line').forEach(line => line.remove());
    drawingLines.forEach(line => {
        for (let i = 0; i < line.points.length - 1; i++) {
            const svgLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            svgLine.setAttribute('x1', line.points[i].x);
            svgLine.setAttribute('y1', line.points[i].y);
            svgLine.setAttribute('x2', line.points[i + 1].x);
            svgLine.setAttribute('y2', line.points[i + 1].y);
            svgLine.setAttribute('stroke', line.color);
            svgLine.setAttribute('stroke-width', '2');
            svgElement.appendChild(svgLine);
        }
    });
}

colorButtons.forEach(button => {
    button.addEventListener('click', () => {
        const colorName = button.textContent.toLowerCase();
        currentColor = colorName.includes('blanco') ? '#ffffff' :
                       colorName.includes('azul') ? '#4c6b89' :
                       colorName.includes('amarillo') ? '#c9b08e' : '#ffff00';
    });
});

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        clearAll();
    }
});

clearButton.addEventListener('click', clearAll);

function clearAll() {
    const svgDoc = svgObject.contentDocument;
    const svgMap = svgDoc.querySelector('svg');
    drawingLines = [];
    if (svgMap) {
        svgMap.querySelectorAll('line, image').forEach(el => el.remove());
    }
    undoStack = [];
}

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'z' && !e.repeat) {
        e.preventDefault();
        undoLastAction();
    }
});

function undoLastAction() {
    const svgDoc = svgObject.contentDocument;
    const svgMap = svgDoc.querySelector('svg');

    if (undoStack.length > 0) {
        drawingLines = undoStack.pop();
        drawLines(svgMap);
    }
}

addCTButton.addEventListener('click', () => addIcon('ct_icon'));
addTTButton.addEventListener('click', () => addIcon('tt_icon'));

function addIcon(type) {
    const svgDoc = svgObject.contentDocument;
    const svgMap = svgDoc.querySelector('svg');

    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    icon.setAttributeNS('http://www.w3.org/1999/xlink', 'href', type === 'ct_icon' ? '../img/ct_icon.webp' : '../img/tt_icon.webp');

    icon.setAttribute('x', Math.random() * 600);
    icon.setAttribute('y', Math.random() * 400);
    icon.setAttribute('width', 30);
    icon.setAttribute('height', 30);
    svgMap.appendChild(icon);

    icon.addEventListener('mousedown', (e) => {
        draggingIcon = icon;
        const coords = getSvgCoords(e, svgMap);
        offsetX = coords.x - parseFloat(icon.getAttribute('x'));
        offsetY = coords.y - parseFloat(icon.getAttribute('y'));
    });
}

exportButton.addEventListener('click', () => {
    const svgDoc = svgObject.contentDocument.querySelector('svg');
    const serializer = new XMLSerializer();
    const svgData = serializer.serializeToString(svgDoc);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const svgBounds = svgDoc.getBoundingClientRect();
    canvas.width = svgBounds.width;
    canvas.height = svgBounds.height;

    img.onload = function () {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imgURL = canvas.toDataURL('image/png');

        const dlLink = document.createElement('a');
        dlLink.download = 'estrategia.png';
        dlLink.href = imgURL;
        dlLink.dataset.downloadurl = ['image/png', dlLink.download, dlLink.href].join(':');
        dlLink.click();
    };

    img.src = url;
});

mapSelect.addEventListener('change', function () {
    const selectedMap = mapSelect.value;
    svgObject.setAttribute('data', `maps/${selectedMap}`);
    clearAll();
});
