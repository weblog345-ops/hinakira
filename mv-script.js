// 自律型MVジェネレーター - メインスクリプト

class MVGenerator {
    constructor() {
        // Canvas setup
        this.canvas = document.getElementById('mvCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.overlay = document.getElementById('canvasOverlay');

        // Audio context
        this.audioContext = null;
        this.analyser = null;
        this.audioSource = null;
        this.audioBuffer = null;
        this.audioElement = null;
        this.isPlaying = false;

        // Frequency data
        this.frequencyData = null;
        this.timeData = null;

        // Particles
        this.particles = [];
        this.maxParticles = 200;

        // Recording
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.isRecording = false;

        // Animation
        this.animationId = null;
        this.time = 0;

        // Settings
        this.settings = {
            visualStyle: 'particles',
            colorTheme: 'neon',
            sensitivity: 5,
            particleCount: 200,
            titleText: '',
            artistText: '',
            showTitle: true,
            textAnimation: 'pulse',
            bgColor: '#0a0a0a',
            mirrorMode: false,
            trailEffect: true,
            blurAmount: 5,
            resolution: 1080,
            framerate: 30
        };

        // Color themes
        this.colorThemes = {
            neon: ['#ff00ff', '#00ffff', '#ff00aa', '#00ff88', '#ffff00'],
            sunset: ['#ff6b6b', '#feca57', '#ff9ff3', '#ff6b35', '#f8a5c2'],
            ocean: ['#0077be', '#00a8cc', '#005f99', '#00d4aa', '#4834d4'],
            fire: ['#ff4500', '#ff6600', '#ff8c00', '#ffa500', '#ffcc00'],
            monochrome: ['#ffffff', '#cccccc', '#999999', '#666666', '#333333']
        };

        this.init();
    }

    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.initParticles();
        this.animate();
    }

    setupCanvas() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();

        // Set display size
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';

        // Set actual canvas resolution based on settings
        const scale = this.settings.resolution === 1080 ? 1 : 0.667;
        this.canvas.width = 1920 * scale;
        this.canvas.height = 1080 * scale;
    }

    setupEventListeners() {
        // Audio file input
        const audioFile = document.getElementById('audioFile');
        audioFile.addEventListener('change', (e) => this.loadAudio(e.target.files[0]));

        // Drag and drop
        this.canvas.parentElement.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.overlay.classList.add('drag-over');
        });

        this.canvas.parentElement.addEventListener('dragleave', () => {
            this.overlay.classList.remove('drag-over');
        });

        this.canvas.parentElement.addEventListener('drop', (e) => {
            e.preventDefault();
            this.overlay.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('audio/')) {
                this.loadAudio(file);
            }
        });

        // Play/Stop buttons
        document.getElementById('playBtn').addEventListener('click', () => this.togglePlay());
        document.getElementById('stopBtn').addEventListener('click', () => this.stop());

        // Visual settings
        document.getElementById('visualStyle').addEventListener('change', (e) => {
            this.settings.visualStyle = e.target.value;
        });

        document.getElementById('colorTheme').addEventListener('change', (e) => {
            this.settings.colorTheme = e.target.value;
            this.updateParticleColors();
        });

        document.getElementById('sensitivity').addEventListener('input', (e) => {
            this.settings.sensitivity = parseInt(e.target.value);
        });

        document.getElementById('particleCount').addEventListener('input', (e) => {
            this.settings.particleCount = parseInt(e.target.value);
            this.maxParticles = this.settings.particleCount;
            this.initParticles();
        });

        // Text settings
        document.getElementById('titleText').addEventListener('input', (e) => {
            this.settings.titleText = e.target.value;
        });

        document.getElementById('artistText').addEventListener('input', (e) => {
            this.settings.artistText = e.target.value;
        });

        document.getElementById('showTitle').addEventListener('change', (e) => {
            this.settings.showTitle = e.target.checked;
        });

        document.getElementById('textAnimation').addEventListener('change', (e) => {
            this.settings.textAnimation = e.target.value;
        });

        // Advanced settings
        document.getElementById('bgColor').addEventListener('input', (e) => {
            this.settings.bgColor = e.target.value;
        });

        document.getElementById('mirrorMode').addEventListener('change', (e) => {
            this.settings.mirrorMode = e.target.checked;
        });

        document.getElementById('trailEffect').addEventListener('change', (e) => {
            this.settings.trailEffect = e.target.checked;
        });

        document.getElementById('blurAmount').addEventListener('input', (e) => {
            this.settings.blurAmount = parseInt(e.target.value);
        });

        // Export settings
        document.getElementById('resolution').addEventListener('change', (e) => {
            this.settings.resolution = parseInt(e.target.value);
            this.resizeCanvas();
        });

        document.getElementById('framerate').addEventListener('change', (e) => {
            this.settings.framerate = parseInt(e.target.value);
        });

        // Recording
        document.getElementById('recordBtn').addEventListener('click', () => this.toggleRecording());
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadVideo());
    }

    async loadAudio(file) {
        if (!file) return;

        // Initialize audio context
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        // Setup analyser
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;
        this.analyser.smoothingTimeConstant = 0.8;

        const bufferLength = this.analyser.frequencyBinCount;
        this.frequencyData = new Uint8Array(bufferLength);
        this.timeData = new Uint8Array(bufferLength);

        // Create audio element for playback
        this.audioElement = new Audio();
        this.audioElement.src = URL.createObjectURL(file);

        // Connect audio element to analyser
        this.audioSource = this.audioContext.createMediaElementSource(this.audioElement);
        this.audioSource.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);

        // Update UI
        this.overlay.style.display = 'none';
        document.getElementById('playBtn').disabled = false;
        document.getElementById('stopBtn').disabled = false;
        document.getElementById('recordBtn').disabled = false;
        document.getElementById('audioInfo').textContent = `読み込み完了: ${file.name}`;

        // Auto-set title from filename
        const titleWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        document.getElementById('titleText').value = titleWithoutExt;
        this.settings.titleText = titleWithoutExt;
    }

    togglePlay() {
        if (this.isPlaying) {
            this.audioElement.pause();
            document.getElementById('playBtn').textContent = '▶ 再生';
        } else {
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            this.audioElement.play();
            document.getElementById('playBtn').textContent = '⏸ 一時停止';
        }
        this.isPlaying = !this.isPlaying;
    }

    stop() {
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement.currentTime = 0;
        }
        this.isPlaying = false;
        document.getElementById('playBtn').textContent = '▶ 再生';
    }

    initParticles() {
        this.particles = [];
        const colors = this.colorThemes[this.settings.colorTheme];

        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                size: Math.random() * 5 + 2,
                baseSize: Math.random() * 5 + 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                angle: Math.random() * Math.PI * 2,
                orbitRadius: Math.random() * 200 + 100,
                orbitSpeed: (Math.random() - 0.5) * 0.02
            });
        }
    }

    updateParticleColors() {
        const colors = this.colorThemes[this.settings.colorTheme];
        this.particles.forEach(p => {
            p.color = colors[Math.floor(Math.random() * colors.length)];
        });
    }

    getAudioData() {
        if (!this.analyser || !this.isPlaying) {
            return { bass: 0, mid: 0, treble: 0, average: 0 };
        }

        this.analyser.getByteFrequencyData(this.frequencyData);
        this.analyser.getByteTimeDomainData(this.timeData);

        const bufferLength = this.frequencyData.length;

        // Calculate frequency bands
        let bass = 0, mid = 0, treble = 0;
        const bassEnd = Math.floor(bufferLength * 0.1);
        const midEnd = Math.floor(bufferLength * 0.5);

        for (let i = 0; i < bufferLength; i++) {
            if (i < bassEnd) {
                bass += this.frequencyData[i];
            } else if (i < midEnd) {
                mid += this.frequencyData[i];
            } else {
                treble += this.frequencyData[i];
            }
        }

        bass = bass / bassEnd / 255;
        mid = mid / (midEnd - bassEnd) / 255;
        treble = treble / (bufferLength - midEnd) / 255;

        const average = (bass + mid + treble) / 3;

        return {
            bass: bass * this.settings.sensitivity,
            mid: mid * this.settings.sensitivity,
            treble: treble * this.settings.sensitivity,
            average: average * this.settings.sensitivity
        };
    }

    drawBackground() {
        if (this.settings.trailEffect) {
            this.ctx.fillStyle = this.settings.bgColor + 'dd';
        } else {
            this.ctx.fillStyle = this.settings.bgColor;
        }
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawParticles(audioData) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        this.particles.forEach((p, i) => {
            // Update particle based on audio
            const audioBoost = 1 + audioData.bass * 2;
            p.size = p.baseSize * audioBoost;

            // Movement
            if (this.settings.visualStyle === 'galaxy') {
                p.angle += p.orbitSpeed * (1 + audioData.average);
                p.x = centerX + Math.cos(p.angle) * p.orbitRadius * (1 + audioData.mid * 0.5);
                p.y = centerY + Math.sin(p.angle) * p.orbitRadius * (1 + audioData.mid * 0.5);
            } else {
                p.x += p.vx * (1 + audioData.treble * 3);
                p.y += p.vy * (1 + audioData.bass * 3);

                // Bounce off edges
                if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;
            }

            // Draw particle with glow
            this.ctx.save();
            this.ctx.beginPath();

            if (this.settings.blurAmount > 0) {
                this.ctx.shadowBlur = this.settings.blurAmount * audioBoost;
                this.ctx.shadowColor = p.color;
            }

            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.fill();
            this.ctx.restore();

            // Connect nearby particles
            if (this.settings.visualStyle === 'particles') {
                for (let j = i + 1; j < this.particles.length; j++) {
                    const p2 = this.particles[j];
                    const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
                    if (dist < 100 + audioData.average * 50) {
                        this.ctx.beginPath();
                        this.ctx.moveTo(p.x, p.y);
                        this.ctx.lineTo(p2.x, p2.y);
                        this.ctx.strokeStyle = p.color + '44';
                        this.ctx.lineWidth = 0.5;
                        this.ctx.stroke();
                    }
                }
            }
        });
    }

    drawWaveform(audioData) {
        if (!this.frequencyData) return;

        const colors = this.colorThemes[this.settings.colorTheme];
        const centerY = this.canvas.height / 2;
        const barWidth = this.canvas.width / this.frequencyData.length * 2.5;

        this.ctx.lineWidth = 2;

        for (let i = 0; i < this.frequencyData.length; i++) {
            const value = this.frequencyData[i] / 255;
            const height = value * this.canvas.height * 0.4 * this.settings.sensitivity;
            const x = i * barWidth;

            // Create gradient
            const gradient = this.ctx.createLinearGradient(x, centerY - height, x, centerY + height);
            gradient.addColorStop(0, colors[i % colors.length]);
            gradient.addColorStop(0.5, colors[(i + 1) % colors.length]);
            gradient.addColorStop(1, colors[i % colors.length]);

            if (this.settings.visualStyle === 'bars') {
                // Bar style
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(x, centerY - height, barWidth - 1, height * 2);
            } else if (this.settings.visualStyle === 'wave') {
                // Wave style
                if (i === 0) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(x, centerY + height);
                }
                this.ctx.lineTo(x, centerY + Math.sin(this.time + i * 0.1) * height);
            }
        }

        if (this.settings.visualStyle === 'wave') {
            this.ctx.strokeStyle = colors[0];
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = colors[0];
            this.ctx.stroke();

            // Mirror wave
            if (this.settings.mirrorMode) {
                this.ctx.beginPath();
                for (let i = 0; i < this.frequencyData.length; i++) {
                    const value = this.frequencyData[i] / 255;
                    const height = value * this.canvas.height * 0.4 * this.settings.sensitivity;
                    const x = i * barWidth;
                    this.ctx.lineTo(x, centerY - Math.sin(this.time + i * 0.1) * height);
                }
                this.ctx.strokeStyle = colors[1];
                this.ctx.shadowColor = colors[1];
                this.ctx.stroke();
            }
        }
    }

    drawCircular(audioData) {
        if (!this.frequencyData) return;

        const colors = this.colorThemes[this.settings.colorTheme];
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const baseRadius = 150 * (1 + audioData.bass);

        const sliceCount = 128;
        const sliceAngle = (Math.PI * 2) / sliceCount;

        for (let i = 0; i < sliceCount; i++) {
            const dataIndex = Math.floor((i / sliceCount) * this.frequencyData.length);
            const value = this.frequencyData[dataIndex] / 255;
            const barHeight = value * 200 * this.settings.sensitivity;

            const angle = i * sliceAngle - Math.PI / 2 + this.time * 0.5;
            const x1 = centerX + Math.cos(angle) * baseRadius;
            const y1 = centerY + Math.sin(angle) * baseRadius;
            const x2 = centerX + Math.cos(angle) * (baseRadius + barHeight);
            const y2 = centerY + Math.sin(angle) * (baseRadius + barHeight);

            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.strokeStyle = colors[i % colors.length];
            this.ctx.lineWidth = 3;
            this.ctx.shadowBlur = this.settings.blurAmount;
            this.ctx.shadowColor = colors[i % colors.length];
            this.ctx.stroke();
        }

        // Center circle
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, baseRadius * 0.8, 0, Math.PI * 2);
        this.ctx.fillStyle = this.settings.bgColor;
        this.ctx.fill();
        this.ctx.strokeStyle = colors[0];
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    drawText(audioData) {
        if (!this.settings.showTitle) return;

        const colors = this.colorThemes[this.settings.colorTheme];
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        // Title animation
        let titleScale = 1;
        let titleY = centerY;
        let glowIntensity = 20;

        switch (this.settings.textAnimation) {
            case 'pulse':
                titleScale = 1 + audioData.bass * 0.2;
                break;
            case 'wave':
                titleY = centerY + Math.sin(this.time * 2) * 20;
                break;
            case 'glow':
                glowIntensity = 20 + audioData.average * 50;
                break;
            case 'bounce':
                titleY = centerY - Math.abs(Math.sin(this.time * 3)) * 30 * (1 + audioData.bass);
                break;
        }

        this.ctx.save();
        this.ctx.translate(centerX, titleY);
        this.ctx.scale(titleScale, titleScale);

        // Draw title
        if (this.settings.titleText) {
            this.ctx.font = 'bold 72px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.shadowBlur = glowIntensity;
            this.ctx.shadowColor = colors[0];
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(this.settings.titleText, 0, -40);
        }

        // Draw artist
        if (this.settings.artistText) {
            this.ctx.font = '36px Arial';
            this.ctx.shadowBlur = glowIntensity * 0.5;
            this.ctx.shadowColor = colors[1];
            this.ctx.fillStyle = '#cccccc';
            this.ctx.fillText(this.settings.artistText, 0, 40);
        }

        this.ctx.restore();
    }

    animate() {
        this.time += 0.016;

        const audioData = this.getAudioData();

        // Draw background
        this.drawBackground();

        // Draw visuals based on style
        switch (this.settings.visualStyle) {
            case 'particles':
            case 'galaxy':
                this.drawParticles(audioData);
                break;
            case 'wave':
            case 'bars':
                this.drawWaveform(audioData);
                break;
            case 'circular':
                this.drawCircular(audioData);
                break;
        }

        // Always draw text on top
        this.drawText(audioData);

        // Mirror mode
        if (this.settings.mirrorMode && this.settings.visualStyle === 'particles') {
            this.ctx.save();
            this.ctx.scale(-1, 1);
            this.ctx.globalAlpha = 0.3;
            this.ctx.drawImage(this.canvas, -this.canvas.width, 0);
            this.ctx.restore();
        }

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    toggleRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }

    startRecording() {
        this.recordedChunks = [];

        const stream = this.canvas.captureStream(this.settings.framerate);

        // Add audio track if available
        if (this.audioContext && this.audioElement) {
            const audioDestination = this.audioContext.createMediaStreamDestination();
            this.audioSource.connect(audioDestination);
            stream.addTrack(audioDestination.stream.getAudioTracks()[0]);
        }

        this.mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp9',
            videoBitsPerSecond: 8000000
        });

        this.mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                this.recordedChunks.push(e.data);
            }
        };

        this.mediaRecorder.onstop = () => {
            document.getElementById('downloadBtn').disabled = false;
            document.getElementById('recordingStatus').textContent = '録画完了！';
        };

        this.mediaRecorder.start();
        this.isRecording = true;
        document.getElementById('recordBtn').textContent = '⏹ 録画停止';
        document.getElementById('recordingStatus').textContent = '🔴 録画中...';

        // Start audio playback if not playing
        if (!this.isPlaying && this.audioElement) {
            this.togglePlay();
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            document.getElementById('recordBtn').textContent = '🔴 録画開始';
        }
    }

    downloadVideo() {
        if (this.recordedChunks.length === 0) return;

        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mv-${this.settings.titleText || 'export'}-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.mvGenerator = new MVGenerator();
});
