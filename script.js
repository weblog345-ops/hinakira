// キャンバスとコンテキストの取得
const canvas = document.getElementById('logoCanvas');
const ctx = canvas.getContext('2d');

// 図形の管理
let shapes = [];

// ロゴのプロパティ
let logoProps = {
    text: 'ロゴ',
    fontSize: 48,
    fontFamily: 'Arial',
    textColor: '#000000',
    textX: 400,
    textY: 300,
    bgColor: '#ffffff',
    transparentBg: false,
    shapeColor: '#ff0000'
};

// 初期描画
function drawLogo() {
    // 背景のクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 背景色の設定
    if (!logoProps.transparentBg) {
        ctx.fillStyle = logoProps.bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 図形の描画
    shapes.forEach(shape => {
        ctx.fillStyle = shape.color;
        ctx.beginPath();

        if (shape.type === 'circle') {
            ctx.arc(shape.x, shape.y, shape.radius, 0, Math.PI * 2);
        } else if (shape.type === 'rectangle') {
            ctx.rect(shape.x - shape.width / 2, shape.y - shape.height / 2, shape.width, shape.height);
        }

        ctx.fill();
    });

    // テキストの描画
    ctx.fillStyle = logoProps.textColor;
    ctx.font = `${logoProps.fontSize}px ${logoProps.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(logoProps.text, logoProps.textX, logoProps.textY);
}

// イベントリスナーの設定
document.getElementById('logoText').addEventListener('input', (e) => {
    logoProps.text = e.target.value;
    drawLogo();
});

document.getElementById('fontSize').addEventListener('input', (e) => {
    logoProps.fontSize = parseInt(e.target.value);
    document.getElementById('fontSizeValue').textContent = `${logoProps.fontSize}px`;
    drawLogo();
});

document.getElementById('fontFamily').addEventListener('change', (e) => {
    logoProps.fontFamily = e.target.value;
    drawLogo();
});

document.getElementById('textColor').addEventListener('input', (e) => {
    logoProps.textColor = e.target.value;
    drawLogo();
});

document.getElementById('textX').addEventListener('input', (e) => {
    logoProps.textX = parseInt(e.target.value);
    drawLogo();
});

document.getElementById('textY').addEventListener('input', (e) => {
    logoProps.textY = parseInt(e.target.value);
    drawLogo();
});

document.getElementById('bgColor').addEventListener('input', (e) => {
    logoProps.bgColor = e.target.value;
    drawLogo();
});

document.getElementById('transparentBg').addEventListener('change', (e) => {
    logoProps.transparentBg = e.target.checked;
    drawLogo();
});

document.getElementById('shapeColor').addEventListener('input', (e) => {
    logoProps.shapeColor = e.target.value;
});

// 円を追加
document.getElementById('addCircle').addEventListener('click', () => {
    shapes.push({
        type: 'circle',
        x: Math.random() * (canvas.width - 200) + 100,
        y: Math.random() * (canvas.height - 200) + 100,
        radius: 50,
        color: logoProps.shapeColor
    });
    drawLogo();
});

// 四角を追加
document.getElementById('addRectangle').addEventListener('click', () => {
    shapes.push({
        type: 'rectangle',
        x: Math.random() * (canvas.width - 200) + 100,
        y: Math.random() * (canvas.height - 200) + 100,
        width: 100,
        height: 100,
        color: logoProps.shapeColor
    });
    drawLogo();
});

// キャンバスをクリア
document.getElementById('clearCanvas').addEventListener('click', () => {
    shapes = [];
    logoProps.text = 'ロゴ';
    document.getElementById('logoText').value = 'ロゴ';
    drawLogo();
});

// PNGとしてダウンロード
document.getElementById('downloadPNG').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'logo.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
});

// キャンバスでのドラッグ機能
let isDragging = false;
let dragTarget = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // テキストがクリックされたかチェック
    ctx.font = `${logoProps.fontSize}px ${logoProps.fontFamily}`;
    const textWidth = ctx.measureText(logoProps.text).width;
    const textHeight = logoProps.fontSize;

    if (mouseX >= logoProps.textX - textWidth / 2 &&
        mouseX <= logoProps.textX + textWidth / 2 &&
        mouseY >= logoProps.textY - textHeight / 2 &&
        mouseY <= logoProps.textY + textHeight / 2) {
        isDragging = true;
        dragTarget = 'text';
        dragOffsetX = mouseX - logoProps.textX;
        dragOffsetY = mouseY - logoProps.textY;
        return;
    }

    // 図形がクリックされたかチェック（後ろから前へ）
    for (let i = shapes.length - 1; i >= 0; i--) {
        const shape = shapes[i];
        let isInside = false;

        if (shape.type === 'circle') {
            const distance = Math.sqrt(Math.pow(mouseX - shape.x, 2) + Math.pow(mouseY - shape.y, 2));
            isInside = distance <= shape.radius;
        } else if (shape.type === 'rectangle') {
            isInside = mouseX >= shape.x - shape.width / 2 &&
                      mouseX <= shape.x + shape.width / 2 &&
                      mouseY >= shape.y - shape.height / 2 &&
                      mouseY <= shape.y + shape.height / 2;
        }

        if (isInside) {
            isDragging = true;
            dragTarget = i;
            dragOffsetX = mouseX - shape.x;
            dragOffsetY = mouseY - shape.y;
            break;
        }
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (dragTarget === 'text') {
        logoProps.textX = mouseX - dragOffsetX;
        logoProps.textY = mouseY - dragOffsetY;

        // スライダーも更新
        document.getElementById('textX').value = logoProps.textX;
        document.getElementById('textY').value = logoProps.textY;
    } else if (typeof dragTarget === 'number') {
        shapes[dragTarget].x = mouseX - dragOffsetX;
        shapes[dragTarget].y = mouseY - dragOffsetY;
    }

    drawLogo();
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
    dragTarget = null;
});

canvas.addEventListener('mouseleave', () => {
    isDragging = false;
    dragTarget = null;
});

// 初期描画
drawLogo();
