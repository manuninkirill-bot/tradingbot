from flask import Flask, render_template, send_from_directory
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

TEMPLATES_DIR = os.path.join(BASE_DIR, "MEXCTraderBot", "templates")
STATIC_DIR = os.path.join(BASE_DIR, "MEXCTraderBot", "static")

app = Flask(
    __name__,
    template_folder=TEMPLATES_DIR,
    static_folder=STATIC_DIR
)

# -------------------------------
# ROUTES
# -------------------------------

@app.route("/")
def index():
    return render_template("dashboard.html")

@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")

@app.route("/webapp")
def webapp():
    return render_template("webapp.html")

# static fallback
@app.route("/static/<path:path>")
def send_static(path):
    return send_from_directory(STATIC_DIR, path)

# -------------------------------
# LOCAL RUN
# -------------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
