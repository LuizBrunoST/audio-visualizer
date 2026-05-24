
const canvas=document.getElementById('scene');
const ctx=canvas.getContext('2d');
const fileInput=document.getElementById('audioFile');

let analyser=null;
let recorder=null;
let chunks=[];
let logoScale=1;

function resize(){
 canvas.width=window.innerWidth;
 canvas.height=window.innerHeight;
}
resize();
window.addEventListener('resize',resize);

const particles=[];
for(let i=0;i<150;i++){
 particles.push({
   x:Math.random()*window.innerWidth,
   y:Math.random()*window.innerHeight,
   vx:(Math.random()-0.5)*0.5,
   vy:(Math.random()-0.5)*0.5,
   r:Math.random()*2+1
 });
}

function drawBackground(){
 const g=ctx.createLinearGradient(0,0,0,canvas.height);
 g.addColorStop(0,'#111');
 g.addColorStop(1,'#000');
 ctx.fillStyle=g;
 ctx.fillRect(0,0,canvas.width,canvas.height);
}

function drawParticles(){
 ctx.fillStyle='rgba(255,255,255,.7)';
 for(const p of particles){
   p.x+=p.vx;
   p.y+=p.vy;

   if(p.x<0)p.x=canvas.width;
   if(p.x>canvas.width)p.x=0;
   if(p.y<0)p.y=canvas.height;
   if(p.y>canvas.height)p.y=0;

   ctx.beginPath();
   ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
   ctx.fill();
 }
}

function drawLogo(bass){
 const cx=canvas.width/2;
 const cy=canvas.height/2;

 logoScale=1+bass*0.15;

 ctx.save();
 ctx.translate(cx,cy);
 ctx.scale(logoScale,logoScale);

 ctx.shadowBlur=30;
 ctx.shadowColor='white';

 ctx.beginPath();
 ctx.arc(0,0,150,0,Math.PI*2);
 ctx.fillStyle='#222';
 ctx.fill();

 ctx.lineWidth=12;
 ctx.strokeStyle='white';
 ctx.stroke();

 ctx.fillStyle='white';
 ctx.font='bold 28px Arial';
 ctx.textAlign='center';
 ctx.fillText('THE',0,-15);
 ctx.fillText('TAPEJARA',0,25);

 ctx.restore();
}

function drawVisualizer(data){
 const cx=canvas.width/2;
 const cy=canvas.height/2;
 const radius=170;

 for(let i=0;i<data.length;i++){
   const mag=data[i]/255;
   const angle=(i/data.length)*Math.PI*2;

   const x1=cx+Math.cos(angle)*radius;
   const y1=cy+Math.sin(angle)*radius;

   const x2=cx+Math.cos(angle)*(radius+mag*120);
   const y2=cy+Math.sin(angle)*(radius+mag*120);

   ctx.strokeStyle=`hsl(${i*3},100%,50%)`;
   ctx.lineWidth=4;
   ctx.beginPath();
   ctx.moveTo(x1,y1);
   ctx.lineTo(x2,y2);
   ctx.stroke();
 }
}

function animate(){
 requestAnimationFrame(animate);

 drawBackground();
 drawParticles();

 if(analyser){
   const data=new Uint8Array(analyser.frequencyBinCount);
   analyser.getByteFrequencyData(data);

   let bass=(data[0]+data[1]+data[2])/765;

   drawVisualizer(data);
   drawLogo(bass);
 }else{
   drawLogo(0);
 }
}
animate();

function startRecording(source,audioCtx){
 const dest=audioCtx.createMediaStreamDestination();
 source.connect(dest);

 const stream=canvas.captureStream(60);
 dest.stream.getAudioTracks().forEach(t=>stream.addTrack(t));

 recorder=new MediaRecorder(stream);
 chunks=[];

 recorder.ondataavailable=e=>{
   if(e.data.size) chunks.push(e.data);
 };

 recorder.onstop=()=>{
   const blob=new Blob(chunks,{type:'video/webm'});
   const url=URL.createObjectURL(blob);

   const a=document.createElement('a');
   a.href=url;
   a.download='tapejara_visualizer.webm';
   a.click();
 };
 recorder.start();
}

fileInput.addEventListener('change',()=>{
 const file=fileInput.files[0];
 if(!file) return;

 const audio=new Audio(URL.createObjectURL(file));
 const audioCtx=new (window.AudioContext||window.webkitAudioContext)();

 const source=audioCtx.createMediaElementSource(audio);

 analyser=audioCtx.createAnalyser();
 analyser.fftSize=256;

 source.connect(analyser);
 source.connect(audioCtx.destination);

 startRecording(source,audioCtx);

 audio.play();

 audio.onended=()=>{
   if(recorder && recorder.state==='recording'){
      recorder.stop();
   }
 };
});
