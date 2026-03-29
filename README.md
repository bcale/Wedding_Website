# Wedding Invitation Site

A custom wedding invitation website with animated background, squiggly hero text,
photo gallery, and an RSVP form backed by SQLite.

## Project structure

```
wedding/
├── app.py                  # Flask app + routes + DB setup
├── requirements.txt
├── rsvp.db                 # Auto-created on first run
├── templates/
│   ├── index.html          # Main invitation page
│   └── admin.html          # RSVP response viewer
└── static/
    ├── style.css           # Mobile-first styles + animations
    └── main.js             # Scroll reveal + RSVP form logic
```

## Local setup

```bash
# 1. Create & activate a virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run the dev server
python app.py
```

Then open http://localhost:5000 in your browser.

## View RSVP responses

Visit http://localhost:5000/admin/responses — no login required locally.
Add HTTP basic auth before deploying to production!

## Deploying to Render (free)

1. Push this folder to a GitHub repo
2. Create a new "Web Service" on render.com, connect your repo
3. Set build command:  `pip install -r requirements.txt`
4. Set start command:  `gunicorn app:app`
5. Add `gunicorn` to requirements.txt
6. For the database: create a free PostgreSQL instance on Render
   and swap SQLite for psycopg2 (see comments in app.py)

## Customise

- Names, date, venue → `templates/index.html`
- Colors            → `static/style.css` (CSS variables at top)
- Photos            → Replace `.photo-inner` divs with `<img>` tags
- RSVP deadline     → `templates/index.html` `.rsvp-note` paragraph
