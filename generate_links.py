"""
generate_links.py — run once to populate guests and print invite URLs.

Usage:
    python generate_links.py

Edit the GUESTS list below, then run the script.
It prints one ready-to-text URL per guest.
"""

import sqlite3, secrets, os


DB_PATH = os.path.join(os.path.dirname(__file__), "rsvp.db")

# ── Your guest list ───────────────────────────────────────────────────────────
# Each entry is the name that will appear on the invite page.

GUESTS = [
    "Mom",
    "Dad",
    "Naomi & Lucas",
    "Noah",
    "Sam",
    "Josiah",
    "Lilyanna",
    "Maryrose",
    "Angelo",
    "Gavin",
    "Gerard Family",
    "Brandon",
    "Alberino",
]

BASE_URL = "https://karanpreetandcaleb.us/i"   # domain


# ── Seed database ─────────────────────────────────────────────────────────────

def main():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    # Make sure the table exists (mirrors init_db in app.py)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS guests (
            id    INTEGER PRIMARY KEY AUTOINCREMENT,
            name  TEXT NOT NULL,
            token TEXT NOT NULL UNIQUE
        )
    """)

    print(f"\n{'Name':<30} {'Link'}")
    print("-" * 80)

    for name in GUESTS:
        # Check if a token already exists for this exact name
        existing = conn.execute(
            "SELECT token FROM guests WHERE name = ?", (name,)
        ).fetchone()

        if existing:
            token = existing["token"]
        else:
            token = secrets.token_urlsafe(8)   # e.g. "aB3x9kQz"
            conn.execute(
                "INSERT INTO guests (name, token) VALUES (?, ?)", (name, token)
            )

        print(f"{name:<30} {BASE_URL}/{token}")

    conn.commit()
    conn.close()
    print()


if __name__ == "__main__":
    main()
