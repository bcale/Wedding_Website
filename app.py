from flask import Flask, render_template, request, jsonify, abort
import sqlite3, os
from datetime import datetime

app = Flask(__name__)
DB_PATH = os.path.join(os.path.dirname(__file__), "rsvp.db")


# ── Database ──────────────────────────────────────────────────────────────────

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_db() as conn:
        # Personalized guests — one row per invite link
        conn.execute("""
            CREATE TABLE IF NOT EXISTS guests (
                id      INTEGER PRIMARY KEY AUTOINCREMENT,
                name    TEXT NOT NULL,          -- "Priya", "The Smith Family", etc.
                token   TEXT NOT NULL UNIQUE    -- random slug used in the URL
            )
        """)
        # RSVP responses (unchanged, but now references guests.token)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS rsvps (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                token        TEXT NOT NULL,
                name         TEXT NOT NULL,
                email        TEXT,
                attending    INTEGER NOT NULL,
                guest_count  INTEGER DEFAULT 1,
                message      TEXT,
                submitted_at TEXT NOT NULL
            )
        """)
        conn.commit()


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    # Generic landing page (no personalisation) — useful as a fallback
    return render_template("index.html", guest_name=None)


@app.route("/i/<token>")
def invite(token):
    with get_db() as conn:
        guest = conn.execute(
            "SELECT name FROM guests WHERE token = ?", (token,)
        ).fetchone()

    if not guest:
        abort(404)   # Bad / expired token → 404

    return render_template("index.html", guest_name=guest["name"], token=token)


@app.route("/rsvp", methods=["POST"])
def rsvp():
    data        = request.get_json()
    token       = (data.get("token") or "").strip()
    name        = (data.get("name") or "").strip()
    email       = (data.get("email") or "").strip()
    attending   = 1 if data.get("attending") else 0
    guest_count = int(data.get("guest_count") or 1)
    message     = (data.get("message") or "").strip()

    if not name:
        return jsonify({"ok": False, "error": "Name is required."}), 400

    with get_db() as conn:
        conn.execute(
            """INSERT INTO rsvps
               (token, name, email, attending, guest_count, message, submitted_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (token, name, email, attending, guest_count, message,
             datetime.utcnow().isoformat())
        )
        conn.commit()

    return jsonify({"ok": True})


# ── Admin ─────────────────────────────────────────────────────────────────────

@app.route("/admin/responses")
def admin_responses():
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM rsvps ORDER BY submitted_at DESC"
        ).fetchall()
    return render_template("admin.html", rows=rows)


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    init_db()
    app.run(debug=True)
