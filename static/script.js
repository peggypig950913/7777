function addAction(action) {
    fetch("/update", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
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
