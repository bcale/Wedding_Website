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
      body: JSON.stringify({ token, name, email, attending, guest_count, message }),
    });
 
    const data = await res.json();
 
    if (data.ok) {
      submitBtn.textContent = "Send My RSVP";
      submitBtn.disabled = false;
 
      const firstName = name.split(" ")[0];
 
      if (attending) {
        showModal(
          `We can't wait to celebrate with you, ${firstName}!`,
          "Your RSVP has been received. We'll see you on June 14th!"
        );
      } else {
        showModal(
          `We're sorry you can't make it, ${firstName}.`,
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
 