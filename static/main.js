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
  { threshold: 0.12 }
);

document.querySelectorAll(".reveal").forEach((el) => {
  if (el.closest(".hero")) {
    setTimeout(() => el.classList.add("visible"), 800);
  } else {
    observer.observe(el);
  }
});

document.querySelectorAll(".photo").forEach((el) => observer.observe(el));


/* ── Attending toggle ────────────────────────────────────────────────────── */
let attending = true;

const btnYes     = document.getElementById("btnYes");
const btnNo      = document.getElementById("btnNo");
const guestField = document.getElementById("guestField");

btnYes.addEventListener("click", () => {
  attending = true;
  btnYes.classList.add("active");
  btnNo.classList.remove("active");
  guestField.style.display = "";
});

btnNo.addEventListener("click", () => {
  attending = false;
  btnNo.classList.add("active");
  btnYes.classList.remove("active");
  guestField.style.display = "none";
});


/* ── RSVP form submit ────────────────────────────────────────────────────── */
const form       = document.getElementById("rsvpForm");
const formError  = document.getElementById("formError");
const successBox = document.getElementById("rsvpSuccess");

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
      body: JSON.stringify({ token, name, email, attending, guest_count, message }),
    });

    const data = await res.json();

    if (data.ok) {
      form.hidden = true;
      successBox.hidden = false;
      successBox.scrollIntoView({ behavior: "smooth", block: "center" });
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

/* ── Squiggly text animation ── */
const wavePath = document.getElementById("wave");
if (wavePath) {
  const flat = "M10,55 C30,30 50,80 70,55 C90,30 110,80 130,55 C150,30 170,80 190,55 C210,30 230,80 250,55 C270,30 290,80 310,55 C330,30 350,80 370,55 C390,30 410,80 430,55 C450,30 470,80 490,55";
  const flip = "M10,55 C30,75 50,30 70,55 C90,75 110,30 130,55 C150,75 170,30 190,55 C210,75 230,30 250,55 C270,75 290,30 310,55 C330,75 350,30 370,55 C390,75 410,30 430,55 C450,75 470,30 490,55";
  let start = null;
  const duration = 6000;

  function lerp(a, b, t) {
    const an = a.match(/-?[\d.]+/g).map(Number);
    const bn = b.match(/-?[\d.]+/g).map(Number);
    const parts = a.split(/-?[\d.]+/g);
    return parts.map((p, i) => p + (i < an.length ? (an[i] + (bn[i] - an[i]) * t).toFixed(2) : "")).join("");
  }

  function animateWave(ts) {
    if (!start) start = ts;
    const elapsed = (ts - start) % (duration * 2);
    const half = elapsed < duration;
    const t = half
      ? elapsed / duration
      : 1 - (elapsed - duration) / duration;
    const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    wavePath.setAttribute("d", lerp(flat, flip, ease));
    requestAnimationFrame(animateWave);
  }

  requestAnimationFrame(animateWave);
}
