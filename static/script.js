alse;
let squatActive = false;
let kneeActive = false;

async function startCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;

    const pose = new Pose({
        locateFile: (file) => https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}
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

    // 開合跳：手舉高 + 腳張開 → 動作開始；手放下 + 腳合起來 → 動作結束
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

    // 深蹲：臀部下降到膝蓋高度 → 動作開始；站起來 → 動作結束
    const squatDown = landmarks[23].y > landmarks[25].y && landmarks[24].y > landmarks[26].y;
    if (squatDown) {
        if (!squatActive) squatActive = true;
    } else {
        if (squatActive) {
            squatActive = false;
            addAction("squat");
        }
    }

    // 高抬腿：膝蓋抬到腰部以上 → 動作開始；放下 → 動作結束
    const kneeUp = landmarks[25].y < landmarks[23].y || landmarks[26].y < landmarks[24].y;
    if (kneeUp) {
        if (!kneeActive) kneeActive = true;
    } else {
        if (kneeActive) {
            kneeActive = false;
            addAction("knee");
        }
    }

    // 平板撐：身體保持水平 (持續時間)
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
        // 更新各動作次數
        document.getElementById("jump").textContent = data.counter.jump;
        document.getElementById("squat").textContent = data.counter.squat;
        document.getElementById("knee").textContent = data.counter.knee;
        document.getElementById("plank").textContent = data.counter.plank;

        // 更新卡路里與碗飯
        document.getElementById("calories").textContent = data.calories;
        document.getElementById("rice").textContent = data.rice;
    });
}
