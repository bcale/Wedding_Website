import os
import secrets
from datetime import datetime
from flask import Flask, render_template, request, jsonify, abort
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

DATABASE_URL    = os.environ.get("DATABASE_URL")
SENDGRID_API_KEY = os.environ.get("SENDGRID_API_KEY")
SENDER_EMAIL    = os.environ.get("SENDER_EMAIL", "karanpreetandcaleb@gmail.com")


# ── DB helpers ────────────────────────────────────────────────────────────────

def get_db():
    if DATABASE_URL:
        import psycopg2, psycopg2.extras
        conn = psycopg2.connect(DATABASE_URL)
        conn.cursor_factory = psycopg2.extras.RealDictCursor
        return conn, "pg"
    else:
        import sqlite3
        conn = sqlite3.connect(
            os.path.join(os.path.dirname(__file__), "rsvp.db")
        )
        conn.row_factory = sqlite3.Row
        return conn, "sqlite"


def execute(sql, params=(), fetchone=False, fetchall=False):
    conn, kind = get_db()
    if kind == "pg":
        sql = sql.replace("?", "%s")
    try:
        cur = conn.cursor()
        cur.execute(sql, params)
        result = None
        if fetchone:
            result = cur.fetchone()
        elif fetchall:
            result = cur.fetchall()
        conn.commit()
        return result
    finally:
        conn.close()


def init_db():
    serial = "SERIAL" if DATABASE_URL else "INTEGER"
    execute(f"""
        CREATE TABLE IF NOT EXISTS guests (
            id    {serial} PRIMARY KEY,
            name  TEXT NOT NULL,
            token TEXT NOT NULL UNIQUE
        )
    """)
    execute(f"""
        CREATE TABLE IF NOT EXISTS rsvps (
            id           {serial} PRIMARY KEY,
            token        TEXT NOT NULL,
            name         TEXT NOT NULL,
            email        TEXT,
            attending    INTEGER NOT NULL,
            guest_count  INTEGER DEFAULT 1,
            message      TEXT,
            submitted_at TEXT NOT NULL
        )
    """)


init_db()


# ── Email ─────────────────────────────────────────────────────────────────────

def send_rsvp_email(to_email, name, attending, guest_count):
    if not SENDGRID_API_KEY or not to_email:
        return

    from sendgrid import SendGridAPIClient
    from sendgrid.helpers.mail import Mail

    first = name.split()[0]

    if attending:
        subject = "We can't wait to celebrate with you!"
        body = f"""Dear {first},

Thank you for your RSVP — we're so excited to celebrate with you!

Here are the details:
  Date:   Saturday, June 14th, 2026
  Time:   Ceremony at 4:00 PM
  Venue:  The Garden at Whitmore Estate, Hudson, NY

We've noted {guest_count} guest(s) in your party.

With love,
Karanpreet & Caleb
"""
    else:
        subject = "We'll miss you!"
        body = f"""Dear {first},

Thank you for letting us know. We're sorry you won't be able to make it,
but we're grateful you took the time to respond.

We hope to celebrate with you another time soon.

With love,
Karanpreet & Caleb
"""

    message = Mail(
        from_email=SENDER_EMAIL,
        to_emails=to_email,
        subject=subject,
        plain_text_content=body
    )

    try:
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        sg.send(message)
    except Exception as e:
        print(f"Email error for {to_email}: {e}")


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html", guest_name=None, token=None)


@app.route("/i/<token>")
def invite(token):
    guest = execute(
        "SELECT name FROM guests WHERE token = ?",
        (token,), fetchone=True
    )
    if not guest:
        abort(404)
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

    execute(
        """INSERT INTO rsvps
           (token, name, email, attending, guest_count, message, submitted_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (token, name, email, attending, guest_count, message,
         datetime.utcnow().isoformat())
    )

    send_rsvp_email(email, name, attending, guest_count)

    return jsonify({"ok": True})


@app.route("/admin/responses")
def admin_responses():
    rows = execute("SELECT * FROM rsvps ORDER BY submitted_at DESC", fetchall=True)
    return render_template("admin.html", rows=rows or [])


@app.route("/admin/seed-guests")
def seed_guests():
    secret = request.args.get("secret")
    if secret != os.environ.get("SEED_SECRET"):
        abort(403)

    guests = [
        "Mom",
        "Dad",
        "Noah",
        "Sam",
        "Naomi & Lucas",
        "Josiah & Emma",
        "Lilyanna",
        "Maryrose",
        "Uncle Russell & Aunt Priscilla",
        "Jefferson",
        "Nathan & Family",
        "Laura & Family",
        "Uncle Steven & Aunt Lancy",
        "Uncle David & Family",
        "Uncle Mark & Family",
        "Uncle George & Family",
        "Aunty Becky",
        "Gavin",
        "Spencer",
        "Madeline",
        "Hunter",
        "Alberino Family",
        "Violento Family",
        "Aunt Julia & Family",
        "Rich",
        "Brandon",
        "Angelo",
        "Eric & Family",
        "Harry",
        "Bryce & Family",
        "Evan & Family",
        "Mimi",
        "Papa"
        ""
    ]

    results = []
    for name in guests:
        existing = execute(
            "SELECT token FROM guests WHERE name = ?",
            (name,), fetchone=True
        )
        if existing:
            token = existing["token"]
        else:
            token = secrets.token_urlsafe(8)
            execute(
                "INSERT INTO guests (name, token) VALUES (?, ?)",
                (name, token)
            )
        results.append({"name": name, "token": token})

    return jsonify(results)


# ── Local dev entry point ─────────────────────────────────────────────────────

if __name__ == "__main__":
    app.run(debug=True)