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
