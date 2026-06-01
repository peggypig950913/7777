from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# 原本的計數器
counter = {"jump": 0,"squat": 0, "knee": 0,"plank": 0}

# 每個動作的卡路里消耗 (簡單估算)
calories_per_action = {
    ”jump“: 0.5,   # 每次開合跳消耗 kcal
    ”squat“: 0.7,  # 每次深蹲消耗 kcal
    ”knee“: 0.4,   # 每次高抬腿消耗 kcal
    ”plank“: 0.05  # 每秒平板撐消耗 kcal
}

@app.route(”/“)
def home():
    return render_template(”index.html“)

@app.route(”/update“, methods=[”POST“])
def update():
    action = request.json.get(”action“)
    if action in counter:
        counter[action] += 1

    # 計算總消耗卡路里
    total_calories = sum(counter[a] * calories_per_action[a] for a in counter)
    rice_bowls = total_calories / 280  # 一碗白飯約 280 kcal

    # 回傳原本的 counter + 新增的卡路里資訊
    return jsonify({
        ”counter“: counter,
        ”calories“: round(total_calories, 1),
        ”rice“: round(rice_bowls, 2)
    })

if __name__ == ”__main__“:
    app.run(debug=True)
