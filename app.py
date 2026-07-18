import os
import secrets
import requests as http_requests
from datetime import datetime
from functools import wraps
from flask import Flask, render_template, request, jsonify, abort, Response
from dotenv import load_dotenv


load_dotenv()

app = Flask(__name__)

DATABASE_URL    = os.environ.get("DATABASE_URL")
ADMIN_USER   = os.environ.get("ADMIN_USER", "caleb007")
ADMIN_PASS   = os.environ.get("ADMIN_PASS", "H@mb0rg3r!12")

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
            attending_cer    INTEGER NOT NULL DEFAULT 1,
            attending_rec    INTEGER NOT NULL DEFAULT 1,
            guest_count  INTEGER DEFAULT 1,
            message      TEXT,
            submitted_at TEXT NOT NULL
        )
    """)

    execute(f"""
    CREATE TABLE IF NOT EXISTS song_requests (
        id           {serial} PRIMARY KEY,
        guest_name   TEXT NOT NULL,
        song_title   TEXT NOT NULL,
        artist       TEXT NOT NULL,
        requested_att TEXT NOT NULL
    )
""")


init_db()

# ── Admin login ───────────────────────────────────────────────────────────────
 
def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.authorization
        if not auth or auth.username != ADMIN_USER or auth.password != ADMIN_PASS:
            return Response(
                "Login required.",
                401,
                {"WWW-Authenticate": 'Basic realm="Admin"'}
            )
        return f(*args, **kwargs)
    return decorated

# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html", guest_name=None, token=None, active_page="home")


@app.route("/i/<token>")
def invite(token):
    guest = execute(
        "SELECT name FROM guests WHERE token = ?",
        (token,), fetchone=True
    )
    if not guest:
        abort(404)
    return render_template("index.html", guest_name=guest["name"], token=token, active_page="home")


@app.route("/rsvp", methods=["POST"])
def rsvp():
    data        = request.get_json()
    token       = (data.get("token") or "").strip()
    name        = (data.get("name") or "").strip()
    email       = (data.get("email") or "").strip()
    attending_cer   = 1 if data.get("attending_cer") else 0
    attending_rec   = 1 if data.get("attending_rec") else 0
    guest_count = int(data.get("guest_count") or 1)
    message     = (data.get("message") or "").strip()

    if not name:
        return jsonify({"ok": False, "error": "Name is required."}), 400

    execute(
        """INSERT INTO rsvps
           (token, name, email, attending_cer, attending_rec, guest_count, message, submitted_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (token, name, email, attending_cer, attending_rec, guest_count, message,
         datetime.utcnow().isoformat())
    )

    return jsonify({"ok": True})


@app.route("/admin/responses")
@require_auth
def admin_responses():
    rows = execute("SELECT * FROM rsvps ORDER BY submitted_at DESC", fetchall=True)
    return render_template("admin.html", rows=rows or [])


# Itinerary route
@app.route("/itinerary")
def itinerary():
    return render_template("itinerary.html", active_page="itinerary", guest_name=None, token=None)

# Itinerary route with a token
@app.route("/itinerary<token>")
def itinerary_guest(token):
    guest = execute(
        "SELECT name FROM guests WHERE token = ?",
        (token,), fetchone=True
    )
    if not guest:
        abort(404)
    return render_template("itinerary.html",
                           active_page="itinerary",
                           guest_name=guest["name"],
                           token=token)

# Locations route
@app.route("/locations")
def locations():
    return render_template("locations.html", active_page="locations")

# Locations route with a token included
@app.route("/locations/<token>")
def locations_guest(token):
    guest = execute(
        "SELECT name FROM guests WHERE token = ?",
        (token,), fetchone=True
    )
    if not guest:
        abort(404)
    return render_template("locations.html",
                           active_page="locations",
                           guest_name=guest["name"],
                           token=token)

# Registry route
@app.route("/registry")
def registry():
    return render_template("registry.html", active_page="registry")

# Resitry with token route
@app.route("/registry/<token>")
def registry_guest(token):
    guest = execute(
        "SELECT name FROM guests WHERE token = ?",
        (token,), fetchone=True
    )
    if not guest:
        abort(404)
    return render_template("registry.html",
                           active_page="registry",
                           guest_name=guest["name"],
                           token=token)


@app.route("/admin/seed-guests")
@require_auth
def seed_guests():
    guests = [
        "Mom",
        "Dad",
        "Noah",
        "Sam",
        "Naomi & Lucas & Philip",
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
        "Gavin & Jovie",
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
        "Tyler",
        "Larry",
        "Bryce & Family",
        "Evan & Family",
        "Mimi",
        "Papa",
        "Mr. Singh & Ms. Kaur",
        "Isha",
        "Karanpreet <3",
        "David",
        "Tariq",
        "Watson",
        "Tim",
        "Jake"
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


# Adding routes for song search feature. API calls to musicbrainz.org are managed and parsed through these routes. 

@app.route("/api/search-songs")
def search_songs():
    query = request.args.get("q", "").strip()
    if not query or len(query) < 2:
        return jsonify([])

    try:
        resp = http_requests.get(
            "https://musicbrainz.org/ws/2/recording",
            params={
                "query": query,
                "limit": 8,
                "fmt": "json"
            },
            headers={"User-Agent": "KaranpreetAndCalebWedding/1.0 (karanpreetandcaleb@protonmail.com)"},
            timeout=5
        )
        data = resp.json()
        results = []
        for r in data.get("recordings", []):
            artist = r.get("artist-credit", [{}])[0].get("artist", {}).get("name", "Unknown")
            results.append({
                "title": r.get("title", ""),
                "artist": artist
            })
        return jsonify(results)
    except Exception as e:
        print(f"MusicBrainz error: {e}")
        return jsonify([])


@app.route("/api/request-song", methods=["POST"])
def request_song():
    data       = request.get_json()
    token      = (data.get("token") or "").strip()
    song_title = (data.get("song_title") or "").strip()
    artist     = (data.get("artist") or "").strip()

    # If token provided, look up guest name from DB
    if token:
        guest = execute(
            "SELECT name FROM guests WHERE token = ?",
            (token,), fetchone=True
        )
        if not guest:
            return jsonify({"ok": False, "error": "Invalid token."}), 403
        guest_name = guest["name"]
    else:
        guest_name = (data.get("guest_name") or "").strip()
        if not guest_name:
            return jsonify({"ok": False, "error": "Please enter your name."}), 400

    if not song_title or not artist:
        return jsonify({"ok": False, "error": "Please select a song."}), 400

    execute(
        """INSERT INTO song_requests (guest_name, song_title, artist, requested_at)
           VALUES (?, ?, ?, ?)""",
        (guest_name, song_title, artist, datetime.utcnow().isoformat())
    )
    return jsonify({"ok": True, "guest_name": guest_name})


@app.route("/api/song-requests")
def get_song_requests():
    rows = execute(
        "SELECT guest_name, song_title, artist, requested_at FROM song_requests ORDER BY requested_at DESC",
        fetchall=True
    )
    return jsonify([dict(r) for r in (rows or [])])

# ── Local dev entry point ─────────────────────────────────────────────────────

if __name__ == "__main__":
    app.run(debug=True)