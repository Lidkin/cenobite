const { canvasSketch } = require('canvas-sketch');
const { mapRange } = require('canvas-sketch-util/math');
const { rangeFloor } = require('canvas-sketch-util/random');

const settings = {
    dimensions: [1080, 1080],
    animate: true,
};

let audio, manager;
let audioContext, audioData, sourceNode, analyserNode, bufferLength;
let imgA, maxDb, minDb, bin;
let dotIndex;

const faceTorns = [], pictures = [], bins = [];
const faceHeight = 270;
const faceWidght = 200;
const cellHeight = 61;
const cellWidth = 50;
const numRows = faceHeight / cellHeight;
const numCols = faceWidght / cellWidth;
let baseRadius = 5;

const sketch = ({ context, width, height }) => {
    let centerX = width * 0.5 - 15;
    let centerY = height * 0.5 + 10;
    let xm = 1;
    let ym = 1;

    let x, y, picture;
    const cell = Math.floor(width / 128);
    const cols = Math.floor(width / cell);
    const rows = Math.floor(height / cell);
    const numCells = cols * rows;

    const imgACanvas = document.createElement('canvas');
    const imgAContext = imgACanvas.getContext('2d');

    imgAContext.width = imgA.width;
    imgAContext.height = imgA.height;

    imgAContext.drawImage(imgA, 0, 0);
    const imgAData = imgAContext.getImageData(0, 0, imgA.width, imgA.height).data;

    //-----------audioData-------------------//
    for (let i = 0; i < numCells; i++) {
        bin = rangeFloor(4, 128);
        bins.push(bin);
    }

    //-------------------face--------------------//    
    for (let i = 0; i < numCells; i++) {
        let col = i % cols;
        let row = Math.floor(i / cols);
        let ix, iy, idx, r, g, b, colA;

        ix = Math.floor(x / width * imgA.width);
        iy = Math.floor(y / height * imgA.height);
        idx = (iy * imgA.width + ix) * 4;

        r = imgAData[idx + 0];
        g = imgAData[idx + 1];
        b = imgAData[idx + 2];
        colA = `rgb(${r}, ${g}, ${b})`;

        x = col * cell;
        y = row * cell;

        picture = new Picture({ x, y, cell, colA });
        pictures.push(picture);
    }

    //---------------------torns map-----------------------//

    for (let i = 0; i < 4; i++) {
        if (i == 1) { xm = -1; ym = 1; }
        if (i == 2) { xm = 1; ym = -1; }
        if (i == 3) { xm = -1; ym = -1; }

        for (let i = 0; i < numCols; i++) {
            let baseX = cellWidth * i + cellWidth * (1 - i * i * 0.5 / 10);
            if (i == 0) baseX = cellWidth * 0.7;
            for (let j = 0; j < numRows; j++) {
                let baseY = cellHeight * j + cellHeight * 0.6 * (1 - i * i * 0.8 / 10);
                if (j == 0) baseY = cellHeight * j + cellHeight * 0.6 * (1 - i * i * 0.3 / 10);

                const y = baseY * ym + centerY;
                const x = baseX * xm + centerX;

                const color = tornColor(x, y, centerX);

                let dd = Math.hypot(centerX - x, centerY - y);


                let maxTorn = y > centerY * 0.7 && y < centerY * 1.5 &&
                    x > centerX * 0.85 && x < centerX * 1.15 ? 50 : 150;

                let maxLength = mapRange(dd, 0, 310, 0, maxTorn);

                if (y > centerY + 50 && y < 650) {
                    if (x > centerX - 50 && x < centerX + 50) continue;
                }

                if (y > 750 && y < 800) {
                    if (x > centerX - 50 && x < centerX + 50) continue;
                }

                if (y > 800 && i == numCols - 1) {
                    if (x < 350 || x > 700) continue;
                }

                if (y > 290 && y < 300) {
                    if (x < 350 || x > 700) continue;
                }

                let faceTorn = new Torns({ x, y, color, maxLength });
                faceTorns.push(faceTorn);

            }
        }
    }

    for (let i = 0; i < 4; i++) { // face perimeter
        let minTorn, maxTorn;
        xm = 1; ym = 1;
        if (i == 1) { xm = 1; ym = -1; centerY += -30; }
        if (i == 2) { xm = 1; ym = -1; centerY; }
        if (i == 3) { xm = 1; ym = -1; centerY += 40; }
        for (let i = 0; i < (numCols + numRows); i++) {

            const slice = Math.PI * 0.5 / (numCols + numRows);
            const angle = slice * i + 47.5 * Math.PI / 180;

            const yr = Math.sin(angle) * 350; //height of face
            const y = yr * ym + centerY;

            const xr = y > centerY ? Math.cos(angle) * 285 : Math.cos(angle) * 295;
            const x = xr * xm + centerX;

            const color = tornColor(x, y, centerX);

            let dd = Math.hypot(centerX - x, centerY - y);

            if (x > centerX) {
                minTorn = y > centerY ? 175 : 160;
                maxTorn = y > centerY ? 125 : 110;
            } else {
                minTorn = y > centerY ? 170 : 155;
                maxTorn = y > centerY ? 120 : 105;
            }
            let maxLength = mapRange(dd, 300, 350, minTorn, maxTorn);

            if (y > centerY && y < 800) continue;

            let faceTorn = new Torns({ x, y, color, maxLength });
            faceTorns.push(faceTorn);

        }
    }

    for (let i = 0; i < 2; i++) { //face perimeter vertical
        let maxTorn, minTorn;
        xm = -1; ym = 1;
        if (i == 1) { xm = 1; ym = -1; }
    
        for (let i = 0; i < (numCols + numRows); i++) {
            const slice = Math.PI * 0.4 / (numCols + numRows);
            const angle = slice * i - 33.95 * Math.PI / 180;

            const xr = Math.cos(angle) * 230; //width of face
            const yr = Math.sin(angle) * 490;

            const x = xr * xm + centerX;
            const y = yr * ym + centerY;

            const color = tornColor(x, y, centerX);

            let dd = Math.hypot(centerX - x, centerY - y);
            if (x > centerX) {
                minTorn = y < centerY ? 150 : 130;
                maxTorn = y < centerY ? 75 : 25;
            } else {
                minTorn = y < centerY ? 140 : 110;
                maxTorn = y < centerY ? 70 : 20;
            }
            let maxLength = mapRange(dd, 200, 400, minTorn, maxTorn);

            let faceTorn = new Torns({ x, y, color, maxLength });
            faceTorns.push(faceTorn);
        }
    }

    faceTorns.sort(function (a, b) {
        if (a.y < centerY) {
            if (a.y < b.y) return -1;

            if (a.y > b.y) return 1;

            if (a.x < b.x) return -1;

            if (a.x > b.x) return 1;

            return 0;
        } else {
            if (a.y > b.y) return -1;

            if (a.y < b.y) return 1;

            if (a.x < b.x) return -1;

            if (a.x > b.x) return 1;

            return 0;
        }
    });

    //------------------------------------------------------------// 
    return ({ context, width, height }) => {
        context.fillStyle = 'black';
        context.fillRect(0, 0, width, height);

        context.drawImage(imgA, 0, 0);
        if (!audioContext) return;

        analyserNode.getFloatFrequencyData(audioData);

        dotIndex = 0;
        faceTorns.forEach(torn => {
            torn.update(centerX, centerY, audioData);
            torn.draw(context);
            dotIndex++;
        });

    };
};

//---------------------functions-----------------------//

const tornColor = (x, y, centerX) => {
    let radiusR = Math.hypot((centerX + 100) - x, centerX - y);
    let r = x < (centerX - 100) ? mapRange(radiusR, 0, 500, 250, 0) : mapRange(radiusR, 20, 400, 250, 50);

    return `rgb(${r}, 0, 0)`;
}

const addListeners = () => {
    window.addEventListener('mouseup', () => {
        if (!audioContext) createAudio();

        if (audio.paused) {
            audio.play();
            manager.play();
        } else {
            audio.pause();
            manager.pause();
        }
    });
};

const createAudio = () => {
    audio = document.createElement('audio');
    audio.crossOrigin = 'anonymous';
    audio.src = 'https://cdn.pixabay.com/download/audio/2022/07/23/audio_eec2f9db1e.mp3?filename=dramatic-horror-cinematic-epic-trailer-action-intro-opener-115496.mp3';
   
    audioContext = new AudioContext();

    sourceNode = audioContext.createMediaElementSource(audio);
    sourceNode.connect(audioContext.destination);

    analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize = 512;
    analyserNode.smoothingTimeConstant = 0.85;
    sourceNode.connect(analyserNode);

    minDb = analyserNode.minDecibels;
    maxDb = analyserNode.maxDecibels;
    bufferLength = analyserNode.frequencyBinCount;

    audioData = new Float32Array(bufferLength);

};

const loadImage = async (url) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject();
        img.src = url;
    });
};

const start = async () => {
    imgA = await loadImage('./bwFace1.png');
    manager = await canvasSketch(sketch, settings);
    addListeners();
    manager.pause();
};

//-start-//
start();

//--------------------classes-------------------------//

class Torns {
    constructor({ x, y, color, maxLength }) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.baseColor = color;
        this.maxColor = color;
        this.coeffGrd = 0.8;
        this.maxLength = maxLength;

        this.radius = 0;
        this.lenght = 0;
        this.angle = 0;

        this.x1 = 0;
        this.x2 = 0;
        this.y1 = 0;
        this.y2 = 0;
        this.tornX = 0;
        this.tornY = 0;

    }

    update(cx, cy, dataAudio) {
        let dx = this.x - cx;
        let dy = this.y - cy;
        let dd = Math.hypot(dx, dy);

        let a, ky, k, min = minDb - 50, max = maxDb + 10;
        let faceRadius = 400, dotRadius;

        let maxRadius = this.y > cy * 0.8 && this.y < cy * 1.5
            && this.x > cx * 0.7 && this.x < cx * 1.3 ? baseRadius * 0.8 : baseRadius * 0.5;
        dotRadius = mapRange(dd, 0, faceRadius, baseRadius * 1.3, maxRadius, true);
        console.log(dd, dotRadius)

        let dotAudio = dataAudio[dotIndex];
        if (dotAudio <= min) dotAudio = min;
        if (dotAudio >= max) dotAudio = max;

        let mapped = mapRange(dotAudio, min, max, 0, 1, true);

        if (this.x < cx && this.y < cy) { a = Math.PI; ky = -1; k = 1; }
        if (this.x < cx && this.y > cy) { a = Math.PI; ky = -1; k = 1; }
        if (this.x > cx && this.y < cy) { a = 0; ky = 1; k = -1; }
        if (this.x > cx && this.y > cy) { a = 0; ky = 1; k = -1; }

        this.angle = Math.asin(dy / dd);
        this.lenght = this.maxLength * mapped;
        this.radius = mapRange(this.lenght, 0, this.maxLength, 0, dotRadius, true);

        const match = this.color.match(/\(([^,\s]+)/);

        let baseColor = match[1] - 25 < 0 ? 0 : match[1] - 25;
        let maxColor = match[1] + 150 > 255 ? 255 : match[1] + 150;

        if (this.lenght >= this.maxLength * 0.7) {
            this.coeffGrd = 0.3;
            if (maxColor <= 150) maxColor = mapRange(maxColor, 0, 150, 200, 255, true);
        }

        baseColor != 0 ? this.baseColor = this.baseColor.replace(/\(([^,\s]+),/, `(${baseColor},`) : this.baseColor = 'Maroon';
        maxColor != 255 ? this.maxColor = this.maxColor.replace(/\(([^,\s]+),/, `(${maxColor},`) : this.maxColor = 'MistyRose';

        this.x1 = this.x - Math.cos(k * this.angle + 0.5 * Math.PI) * this.radius;
        this.y1 = this.y + Math.sin(k * this.angle + 0.5 * Math.PI) * this.radius;
        this.x2 = this.x + Math.cos(k * this.angle + 0.5 * Math.PI) * this.radius;
        this.y2 = this.y - Math.sin(k * this.angle + 0.5 * Math.PI) * this.radius;

        this.tornX = this.x + Math.cos(this.angle + a) * this.lenght;
        this.tornY = this.y + ky * Math.sin(this.angle + a) * this.lenght;

    }

    draw(context) {
        let grd = context.createLinearGradient(this.x, this.y, this.tornX, this.tornY);
        context.save();
        grd.addColorStop(0, this.baseColor);
        grd.addColorStop(this.coeffGrd, this.color);
        grd.addColorStop(1, this.maxColor);
        context.fillStyle = grd;
        context.beginPath();
        context.moveTo(this.x1, this.y1);
        context.lineTo(this.tornX, this.tornY);
        context.lineTo(this.x2, this.y2);
        context.closePath();
        context.fill();
        context.arc(this.x, this.y, this.radius, this.angle, Math.PI * 2 + this.angle);
        context.fill();
        context.restore();
    }
}

class Picture {
    constructor({ x, y, cell, colA }) {
        this.x = x;
        this.y = y;
        this.cell = cell;
        this.color = colA;
        this.radius = this.cell * 0.4;
    }

    faceDraw(context) {
        context.save();
        context.translate(this.x + this.cell * 0.5, this.y + this.cell * 0.5);
        context.fillStyle = this.color;

        context.beginPath();
        context.arc(0, 0, this.radius, 0, Math.PI * 2);
        context.fill();
        context.restore();
    }
}