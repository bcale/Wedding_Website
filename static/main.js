/* ── Nav hamburger ── */
const navToggle = document.getElementById("navToggle");
const navLinks  = document.getElementById("navLinks");

if (navToggle) {
  navToggle.addEventListener("click", () => {
    navLinks.classList.toggle("open");
  });
}

/* ── Scroll reveal ───────────────────────────────────────────────────────── */
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        observer.unobserve(e.target);
      }
    });
  },
  { threshold: 0.15 }
);

document.querySelectorAll(".reveal").forEach((el) => {
  if (el.closest(".hero")) {
    setTimeout(() => el.classList.add("visible"), 800);
  } else {
    observer.observe(el);
  }
});

document.querySelectorAll(".photo").forEach((el) => observer.observe(el));


/* ── Attending toggle logic ────────────────────────────────────────────────────── */
// Changing to allow for tiered logic. Adding ability to differentiate between ceremony events and reception
let attending_cer = true;
let attending_rec = true;

const btnYesCer     = document.getElementById("btnYesCer");
const btnNoCer      = document.getElementById("btnNoCer");
const btnYesRec     = document.getElementById("btnYesRec");
const btnNoRec      = document.getElementById("btnNoRec");
const guestField = document.getElementById("guestField");

// This function gets called if either the ceremony or reception toggle is true
function showGuestField() {

    if (attending_cer || attending_rec) {
        guestField.style.display = "";
    } else {
        guestField.style.display = "none";
    }
}

// Ceremony toggle button
btnYesCer.addEventListener("click", () => {
  attending_cer = true;
  btnYesCer.classList.add("active");
  btnNoCer.classList.remove("active");
  showGuestField();
});

btnNoCer.addEventListener("click", () => {
  attending_cer = false;
  btnNoCer.classList.add("active");
  btnYesCer.classList.remove("active");
  showGuestField();
});

// Reception toggle button
btnYesRec.addEventListener("click", () => {
  attending_rec = true;
  btnYesRec.classList.add("active");
  btnNoRec.classList.remove("active");
  showGuestField();
});

btnNoRec.addEventListener("click", () => {
  attending_rec = false;
  btnNoRec.classList.add("active");
  btnYesRec.classList.remove("active");
  showGuestField();
});

/* ── Modal ───────────────────────────────────────────────────────────────── */
const modalOverlay = document.getElementById("modalOverlay");
const modalTitle   = document.getElementById("modalTitle");
const modalBody    = document.getElementById("modalBody");
const modalClose   = document.getElementById("modalClose");
 
function showModal(title, body) {
  modalTitle.textContent = title;
  modalBody.textContent  = body;
  modalOverlay.hidden    = false;
  // Small delay lets the browser register display before animating opacity
  requestAnimationFrame(() => {
    requestAnimationFrame(() => modalOverlay.classList.add("visible"));
  });
  document.body.style.overflow = "hidden"; // prevent background scroll
}
 
function closeModal() {
  modalOverlay.classList.remove("visible");
  modalOverlay.addEventListener("transitionend", () => {
    modalOverlay.hidden = true;
    document.body.style.overflow = "";
  }, { once: true });
}
 
modalClose.addEventListener("click", closeModal);
 
// Also close if user taps the dark backdrop
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeModal();
});
 
// Close on Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modalOverlay.hidden) closeModal();
});


/* ── RSVP form submit ────────────────────────────────────────────────────── */
const form      = document.getElementById("rsvpForm");
const formError = document.getElementById("formError");
 
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  formError.textContent = "";
 
  const token       = document.getElementById("guestToken").value;
  const name        = document.getElementById("name").value.trim();
  const email       = document.getElementById("email").value.trim();
  const guest_count = parseInt(document.getElementById("guest_count").value, 10);
  const message     = document.getElementById("message").value.trim();
 
  if (!name) {
    formError.textContent = "Please enter your name.";
    return;
  }
 
  const submitBtn = form.querySelector(".submit-btn");
  submitBtn.textContent = "Sending…";
  submitBtn.disabled = true;
 
  try {
    const res = await fetch("/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, name, email, attending_cer, attending_rec, guest_count, message }),
    });
 
    const data = await res.json();
 
    if (data.ok) {
      submitBtn.textContent = "Send My RSVP";
      submitBtn.disabled = false;
 
      if (attending_cer && !attending_rec) {
        showModal(
          `We can't wait to celebrate with you at the Anand Karaj, ${name}!`,
          "Your RSVP has been received. We'll see you on September 18."
        );
      } 
      else if (attending_rec && !attending_cer) {
        showModal(
          `We can't wait to celebrate with you at the Wedding Reception, ${name}!`,
          "Your RSVP has been received. We'll see you on September 19."
        );
      }
      else if (attending_cer && attending_rec) {
        showModal(
          `We can't wait to celebrate with you, ${name}!`,
          "Your RSVP has been received. We'll see you on September 18 and 19."
        )
      }
      
      else {
        showModal(
          `We're sorry you can't make it, ${name}.`,
          "We'll miss you and hope to celebrate with you another time."
        );
      }
 
    } else {
      formError.textContent = data.error || "Something went wrong. Please try again.";
      submitBtn.textContent = "Send My RSVP";
      submitBtn.disabled = false;
    }
  } catch {
    formError.textContent = "Network error. Please try again.";
    submitBtn.textContent = "Send My RSVP";
    submitBtn.disabled = false;
  }
});

/* ── Song requests (itinerary page only) ─────────────────────────────────── */
const songSearch    = document.getElementById("songSearch");
const songResults   = document.getElementById("songResults");
const songSelected  = document.getElementById("songSelected");
const songSelectedText = document.getElementById("songSelectedText");
const songClear     = document.getElementById("songClear");
const songSubmit    = document.getElementById("songSubmit");
const songError     = document.getElementById("songError");
const songTableBody = document.getElementById("songTableBody");

if (songSearch) {
  let selectedSong = null;
  let searchTimer  = null;

  // Debounced search — waits 400ms after typing stops
  songSearch.addEventListener("input", () => {
    clearTimeout(searchTimer);
    const q = songSearch.value.trim();
    if (q.length < 2) { songResults.hidden = true; return; }
    searchTimer = setTimeout(() => fetchSongs(q), 400);
  });

  async function fetchSongs(q) {
    try {
      const res  = await fetch(`/api/search-songs?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      renderResults(data);
    } catch {
      songResults.hidden = true;
    }
  }

  function renderResults(songs) {
    songResults.innerHTML = "";
    if (!songs.length) { songResults.hidden = true; return; }
    songs.forEach(s => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span class="song-result-title">${s.title}</span>
        <span class="song-result-artist">${s.artist}</span>
      `;
      li.addEventListener("click", () => selectSong(s));
      songResults.appendChild(li);
    });
    songResults.hidden = false;
  }

  function selectSong(s) {
    selectedSong = s;
    songSelectedText.textContent = `${s.title} — ${s.artist}`;
    songSelected.hidden  = false;
    songResults.hidden   = true;
    songSearch.value     = "";
  }

  songClear.addEventListener("click", () => {
    selectedSong = null;
    songSelected.hidden = true;
    songSearch.value    = "";
  });

  // Hide results when clicking outside
  document.addEventListener("click", (e) => {
    if (!songSearch.contains(e.target) && !songResults.contains(e.target)) {
      songResults.hidden = true;
    }
  });

  songSubmit.addEventListener("click", async () => {
  if (songError) songError.textContent = "";
  const token     = document.getElementById("guestToken").value;
  const guestName = document.getElementById("songGuestName").value.trim();

  if (!guestName && !token) {
    songError.textContent = "Please enter your name.";
    return;
  }
  if (!selectedSong) {
    songError.textContent = "Please search and select a song.";
    return;
  }

  songSubmit.textContent = "Adding…";
  songSubmit.disabled = true;

  try {
    const res = await fetch("/api/request-song", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        guest_name: guestName,
        song_title: selectedSong.title,
        artist:     selectedSong.artist
      })
    });
    const data = await res.json();

    if (data.ok) {
      addRowToTable(data.guest_name, selectedSong.title, selectedSong.artist);
      selectedSong = null;
      songSelected.hidden = true;
      if (!token) document.getElementById("songGuestName").value = "";
      songSubmit.textContent = "Added ✓";
      setTimeout(() => {
        songSubmit.textContent = "Add to Playlist";
        songSubmit.disabled = false;
      }, 2000);
    } else {
      songError.textContent = data.error || "Something went wrong.";
      songSubmit.textContent = "Add to Playlist";
      songSubmit.disabled = false;
    }
  } catch {
    songError.textContent = "Network error. Please try again.";
    songSubmit.textContent = "Add to Playlist";
    songSubmit.disabled = false;
  }
});

  function addRowToTable(name, title, artist) {
    const empty = songTableBody.querySelector(".song-empty");
    if (empty) empty.parentElement.remove();
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${title}</td><td>${artist}</td><td>${name}</td>`;
    songTableBody.prepend(tr);
  }

  // Load existing requests on page load
  async function loadSongRequests() {
    try {
      const res  = await fetch("/api/song-requests");
      const data = await res.json();
      if (data.length) {
        songTableBody.innerHTML = "";
        data.forEach(r => addRowToTable(r.guest_name, r.song_title, r.artist));
      }
    } catch { /* silently skip */ }
  }

  loadSongRequests();
}
 