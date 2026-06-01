let jumpActive = false;
let squatActive = false;
let kneeActive = false;
let plankTimer = null;

async function startCamera() {
    const video = document.getElementById("video");
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

    // 開合跳
    const handsUp = landmarks[15].y < 0.3 && landmarks[16].y < 0.3;
    const feetOpen = landmarks[27].x < 0.45 && landmarks[28].x > 0.55;
    if (handsUp && feetOpen) {
        if (!jumpActive) jumpActive = true;
    } else {
        if (jumpActive) {
            jumpActive = false;
            addAction("jump");
        }
    }

    // 深蹲
    const squatDown = landmarks[23].y > landmarks[25].y && landmarks[24].y > landmarks[26].y;
    if (squatDown) {
        if (!squatActive) squatActive = true;
    } else {
        if (squatActive) {
            squatActive = false;
            addAction("squat");
        }
    }

    // 高抬腿
    const kneeUp = landmarks[25].y < landmarks[23].y || landmarks[26].y < landmarks[24].y;
    if (kneeUp) {
        if (!kneeActive) kneeActive = true;
    } else {
        if (kneeActive) {
            kneeActive = false;
            addAction("knee");
        }
    }

    // 平板撐：持續時間計算
    const shoulderY = (landmarks[11].y + landmarks[12].y) / 2;
    const hipY = (landmarks[23].y + landmarks[24].y) / 2;
    const ankleY = (landmarks[27].y + landmarks[28].y) / 2;
    const plankPose = Math.abs(shoulderY - hipY) < 0.05 && Math.abs(hipY - ankleY) < 0.05;

    if (plankPose) {
        if (!plankTimer) {
            plankTimer = setInterval(() => addAction("plank"), 1000); // 每秒加一次
        }
    } else {
        if (plankTimer) {
            clearInterval(plankTimer);
            plankTimer = null;
        }
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
        document.getElementById("jump").textContent = data.counter.jump;
        document.getElementById("squat").textContent = data.counter.squat;
        document.getElementById("knee").textContent = data.counter.knee;
        document.getElementById("plank").textContent = data.counter.plank;
        document.getElementById("calories").textContent = data.calories;
        document.getElementById("rice").textContent = data.rice;
    });
}

