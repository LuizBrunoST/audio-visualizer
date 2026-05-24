const canvas=document.getElementById('scene');
const ctx=canvas.getContext('2d');
const fileInput=document.getElementById('audioFile');
const btn=document.getElementById('downloadBtn');

let audio, audioCtx, analyser, recorder;
let chunks=[];

function resize(){
 canvas.width=innerWidth;
 canvas.height=innerHeight;
}
resize();
addEventListener('resize',resize);

function draw(){
 requestAnimationFrame(draw);
 if(!analyser) return;

 const data=new Uint8Array(analyser.frequencyBinCount);
 analyser.getByteFrequencyData(data);

 ctx.fillStyle='black';
 ctx.fillRect(0,0,canvas.width,canvas.height);

 const cx=canvas.width/2;
 const cy=canvas.height/2;
 const radius=140;

 ctx.beginPath();
 ctx.arc(cx,cy,120,0,Math.PI*2);
 ctx.fillStyle='white';
 ctx.fill();

 for(let i=0;i<data.length;i++){
   const v=data[i]/255;
   const angle=(i/data.length)*Math.PI*2;
   const x1=cx+Math.cos(angle)*radius;
   const y1=cy+Math.sin(angle)*radius;
   const x2=cx+Math.cos(angle)*(radius+v*180);
   const y2=cy+Math.sin(angle)*(radius+v*180);

   ctx.strokeStyle=`hsl(${i*3},100%,50%)`;
   ctx.lineWidth=3;
   ctx.beginPath();
   ctx.moveTo(x1,y1);
   ctx.lineTo(x2,y2);
   ctx.stroke();
 }
}
draw();

function startRecording(source){
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
   a.download='visualizer.webm';
   a.click();

   btn.disabled=false;
   btn.textContent='Vídeo pronto';
 };
 recorder.start();
}

fileInput.onchange=()=>{
 const file=fileInput.files[0];
 if(!file) return;

 audio=new Audio(URL.createObjectURL(file));
 audio.crossOrigin='anonymous';

 audioCtx=new (window.AudioContext||window.webkitAudioContext)();
 const source=audioCtx.createMediaElementSource(audio);

 analyser=audioCtx.createAnalyser();
 analyser.fftSize=256;

 source.connect(analyser);
 source.connect(audioCtx.destination);

 startRecording(source);

 audio.play();

 audio.onended=()=>{
   if(recorder && recorder.state==='recording'){
      recorder.stop();
   }
 };
};
