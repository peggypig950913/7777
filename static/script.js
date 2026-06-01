const video = document.getElementById("video");

async function startCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;

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
    if (!results.poseLandmarks) return;
    const landmarks = results.poseLandmarks;

    // 開合跳：手舉高 + 腳張開
    if (landmarks[15].y < 0.3 && landmarks[16].y < 0.3) {
        addAction("jump");
    }

    // 深蹲：臀部下降到膝蓋高度
    if (landmarks[23].y > landmarks[25].y && landmarks[24].y > landmarks[26].y) {
        addAction("squat");
    }

    // 高抬腿：膝蓋抬高到腰部以上
    if (landmarks[25].y < landmarks[23].y || landmarks[26].y < landmarks[24].y) {
        addAction("knee");
    }

    // 平板撐：肩膀、臀部、腳踝在同一水平線
    const shoulderY = (landmarks[11].y + landmarks[12].y) / 2;
    const hipY = (landmarks[23].y + landmarks[24].y) / 2;
    const ankleY = (landmarks[27].y + landmarks[28].y) / 2;
    if (Math.abs(shoulderY - hipY) < 0.05 && Math.abs(hipY - ankleY) < 0.05) {
        addAction("plank");
    }
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
