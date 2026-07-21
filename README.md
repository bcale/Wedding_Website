# Wedding Invitation Site  

This is a wedding invitation website that uses tokens to create personalized URLs for each guest. This project has a Flask and PostgreSQL backend, leveraging Render web services for deployment and Supabase for data storage. 

## Project structure

```
wedding/
├── app.py                  # Flask app; routes; DB setup; API calls.
├── requirements.txt
├── rsvp.db                 # Auto-created on first run. Not utilized afterwards.
├── templates/
│   ├── index.html          # Main invitation page.
│   └── admin.html          # RSVP response viewer. HTTP authentication to view. 
|   |__ base.html           # Includes navigation bar. Extends to other HTML files.
|   |__ itinerary.html      # Song search feature held here.
|   |__ locations.html      # Locations can launch in Google Maps.
|   |__ registry.html       # QR codes held here.
└── static/
    ├── style.css           # Mobile-first styles and animations.
    └── main.js             # Token persistence, song dropdown data handling, et al. 
```
