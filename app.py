from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

counter = {"jump": 0, "squat": 0, "knee": 0, "plank": 0}

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/update", methods=["POST"])
def update():
    action = request.json.get("action")
    if action in counter:
        counter[action] += 1
    return jsonify(counter)

if __name__ == "__main__":
    app.run(debug=True)
