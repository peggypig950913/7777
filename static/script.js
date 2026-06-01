const video = document.getElementById("video");

async function startCamera(){

 const stream =
 await navigator.mediaDevices.getUserMedia({
  video:true
 });

 video.srcObject = stream;
}
