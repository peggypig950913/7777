const video = document.getElementById("video");

async function startCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;

    // Mediapipe Pose 偵測
    const pose = new Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });

    pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    pose.onResults(onResults);

    const camera = new Camera(video, {
        onFrame: async () => {
            await pose.send({ image: video });
        },
        width: 640,
        height: 480
    });
    camera.start();
}

function onResults(results) {
    // 這裡可以根據關鍵點判斷是否做了開合跳
    // 先用簡單測試：每次有結果就加一次
    addAction("jump");
}

function addAction(action) {
    fetch("/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: action })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById("jump").textContent = data.jump;
        document.getElementById("squat").textContent = data.squat;
        document.getElementById("knee").textContent = data.knee;
        document.getElementById("plank").textContent = data.plank;
    });
}
