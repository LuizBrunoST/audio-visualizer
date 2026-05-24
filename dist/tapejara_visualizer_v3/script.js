
const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d');

const audioInput = document.getElementById('audioFile');
const photoInput = document.getElementById('photoFile');

/*
const logo = new Image();
logo.src = "logo2.png";
*/
let analyser = null;
let recorder = null;
let chunks = [];
let userImage = null;

function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
}
resize();
addEventListener('resize', resize);

const particles = [];
for (let i = 0; i < 250; i++) {
    particles.push({
        x: Math.random() * innerWidth,
        y: Math.random() * innerHeight,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        r: Math.random() * 2 + 1
    });
}

photoInput.onchange = e => {
    const f = e.target.files[0];
    if (!f) return;
    const img = new Image();
    img.onload = () => userImage = img;
    img.src = URL.createObjectURL(f);
};

function background() {
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, "#1b1b2f");
    g.addColorStop(1, "#000");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawParticles() {
    ctx.fillStyle = "rgba(255,255,255,.7)";
    for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawCenter(bass) {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const scale = 1 + bass * 0.18;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    ctx.shadowBlur = 40 + bass * 40;
    ctx.shadowColor = "white";

    ctx.beginPath();
    ctx.arc(0, 0, 160, 0, Math.PI * 2);
    ctx.fillStyle = "#111";
    ctx.fill();

    if (userImage) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, 145, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(userImage, -145, -145, 290, 290);
        ctx.restore();
    }

    ctx.lineWidth = 14;
    ctx.strokeStyle = "white";
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, 178, 0, Math.PI * 2);
    ctx.stroke();

    if (!userImage) {
        ctx.fillStyle = "white";
        ctx.font = "bold 34px Arial";
        ctx.textAlign = "center";
        ctx.fillText("THE", 0, -10);
        ctx.fillText("TAPEJARA", 0, 35);
    }

    ctx.restore();
}

function visualizer(data) {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = 190;

    for (let i = 0; i < data.length; i++) {
        const mag = data[i] / 255;
        const a = (i / data.length) * Math.PI * 2;

        const x1 = cx + Math.cos(a) * radius;
        const y1 = cy + Math.sin(a) * radius;

        const x2 = cx + Math.cos(a) * (radius + mag * 160);
        const y2 = cy + Math.sin(a) * (radius + mag * 160);

        ctx.strokeStyle = `hsl(${i * 3},100%,60%)`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
}

function loop() {
    requestAnimationFrame(loop);

    background();
    drawParticles();

    let bass = 0;

    if (analyser) {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);

        bass = (data[0] + data[1] + data[2]) / 765;

        visualizer(data);
    }

    drawCenter(bass);
}
loop();

function startRecording(source, audioCtx) {
    const dest = audioCtx.createMediaStreamDestination();
    source.connect(dest);

    const stream = canvas.captureStream(60);
    dest.stream.getAudioTracks().forEach(t => stream.addTrack(t));

    recorder = new MediaRecorder(stream);
    chunks = [];

    recorder.ondataavailable = e => {
        if (e.data.size) chunks.push(e.data);
    };

    recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'tapejara_v3.webm';
        a.click();
    };
    recorder.start();
}

audioInput.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;

    const audio = new Audio(URL.createObjectURL(file));
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    const source = audioCtx.createMediaElementSource(audio);

    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;

    source.connect(analyser);
    source.connect(audioCtx.destination);

    startRecording(source, audioCtx);

    audio.play();

    audio.onended = () => {
        if (recorder && recorder.state === "recording") {
            recorder.stop();
        }
    };
};
