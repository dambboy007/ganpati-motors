/**
 * GANPATI MOTORS — app.js
 * Handles: car loading, search, filters, sorting, modals, favorites, stats counter
 */

// ══════════════════════════════════
// CONFIG
// ══════════════════════════════════
const WHATSAPP_NUMBER = "918178965391"; // Replace with real number (no + or spaces)
const WHATSAPP_GROUP   = "https://chat.whatsapp.com/BuQL3Yd1GM4KoMpsHbJLYF"; // Replace with real group link

// ══════════════════════════════════
// STATE
// ══════════════════════════════════
let allCars      = [];
let filteredCars = [];
let favorites    = JSON.parse(localStorage.getItem("gm_favorites") || "[]");
let recentlyViewed = JSON.parse(localStorage.getItem("gm_recent") || "[]");
let activeFilters = {};

// ══════════════════════════════════
// WAIT FOR FIREBASE
// ══════════════════════════════════
let appInitialized = false;

window.addEventListener("firebase-ready", initApp);

// Fallback: if Firebase config is not set up yet, use demo data
window.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    if (allCars.length === 0 && document.getElementById("loadingState")?.style.display !== "none") {
      console.warn("Firebase not configured — using demo data.");
      loadDemoData();
    }
  }, 3000);
});

async function initApp() {
  if (appInitialized) return;
  if (!window._db || !window._firestoreModules) return;

  appInitialized = true;

  try {
    const { collection, getDocs, query, orderBy, where } = window._firestoreModules;
    const db = window._db;

    showLoading(true);
    const q = query(collection(db, "cars"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    allCars = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                          .filter(car => car.status !== "delisted");

    if (allCars.length === 0) {
      loadDemoData();
      return;
    }

    filteredCars = [...allCars];
    renderCars();
    showLoading(false);
  } catch (err) {
    console.error("Firebase error:", err);
    loadDemoData();
  }
}

if (window._db && window._firestoreModules) {
  initApp();
}

// ══════════════════════════════════
// DEMO DATA (used when Firebase is not configured)
// ══════════════════════════════════
function loadDemoData() {
  allCars = [
  ];

  filteredCars = [...allCars];
  renderCars();
  showLoading(false);
}

// ══════════════════════════════════
// RENDER CARS
// ══════════════════════════════════
function renderCars() {
  const grid = document.getElementById("carsGrid");
  const empty = document.getElementById("emptyState");
  const resultsInfo = document.getElementById("resultsInfo");

  grid.innerHTML = "";

  if (filteredCars.length === 0) {
    empty.style.display = "block";
    resultsInfo.textContent = "";
    return;
  }

  empty.style.display = "none";
  resultsInfo.textContent = `Showing ${filteredCars.length} of ${allCars.length} cars`;

  filteredCars.forEach((car, index) => {
    const card = createCarCard(car, index);
    grid.appendChild(card);
  });

  // Reveal animation
  observeCards();
}

function createCarCard(car, index) {
  const card = document.createElement("div");
  card.className = "car-card";
  card.style.animationDelay = `${index * 0.05}s`;

  const isFav = favorites.includes(car.id);
  const isNew = isNewCar(car);
  const images = car.images || [];

  card.innerHTML = `
    <div class="card-slider" id="slider-${car.id}">
      <div class="card-slider-track" id="track-${car.id}">
        ${images.length > 0
          ? images.map(url => `<img src="${url}" alt="${car.name}" loading="lazy" />`).join("")
          : `<div class="no-img"><span>🚗</span><p>Photos Coming Soon</p></div>`
        }
      </div>
      ${images.length > 1 ? `
        <button class="slider-btn slider-prev" onclick="slideCard(event,'${car.id}',-1)">‹</button>
        <button class="slider-btn slider-next" onclick="slideCard(event,'${car.id}',1)">›</button>
        <div class="slider-dots" id="dots-${car.id}">
          ${images.map((_, i) => `<div class="slider-dot ${i===0?'active':''}" onclick="goSlide(event,'${car.id}',${i})"></div>`).join("")}
        </div>
      ` : ""}
      <div class="card-badges">
        <span class="badge badge-fuel">${fuelEmoji(car.fuel)} ${capitalize(car.fuel)}</span>
        ${isNew ? `<span class="badge badge-new">New</span>` : ""}
      </div>
      <button class="fav-btn ${isFav ? 'active' : ''}" onclick="toggleFav(event,'${car.id}')" title="Save">
        ${isFav ? "❤️" : "🤍"}
      </button>
    </div>
    <div class="card-body">
      <div class="car-name">${car.name}</div>
      <div class="car-location">📍 ${car.location || "Kota"}</div>
      <div class="car-price">₹${formatPrice(car.price)} <span>onwards</span></div>
      <div class="car-specs">
        <div class="spec-chip">📅 ${car.year}</div>
        <div class="spec-chip">🛣 ${formatKm(car.km)} km</div>
        <div class="spec-chip">⚙️ ${car.transmission || "Manual"}</div>
        ${car.owners ? `<div class="spec-chip">👤 ${car.owners} Owner</div>` : ""}
      </div>
      <div class="card-actions">
        <button class="btn-card-wa" onclick="openWhatsApp('car','${car.id}','${car.name}')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          WhatsApp
        </button>
        <button class="btn-card-view" onclick="openCarModal('${car.id}')">
          View Details →
        </button>
      </div>
    </div>
  `;

  return card;
}

// ══════════════════════════════════
// IMAGE SLIDER (CARD)
// ══════════════════════════════════
const sliderIndexes = {};

function slideCard(e, carId, dir) {
  e.stopPropagation();
  const car = allCars.find(c => c.id === carId);
  if (!car || !car.images || car.images.length <= 1) return;

  sliderIndexes[carId] = sliderIndexes[carId] || 0;
  const total = car.images.length;
  sliderIndexes[carId] = (sliderIndexes[carId] + dir + total) % total;
  updateSlider(carId);
}

function goSlide(e, carId, idx) {
  e.stopPropagation();
  sliderIndexes[carId] = idx;
  updateSlider(carId);
}

function updateSlider(carId) {
  const track = document.getElementById("track-" + carId);
  const dotsEl = document.getElementById("dots-" + carId);
  if (!track) return;

  const idx = sliderIndexes[carId] || 0;
  track.style.transform = `translateX(-${idx * 100}%)`;

  if (dotsEl) {
    dotsEl.querySelectorAll(".slider-dot").forEach((d, i) => {
      d.classList.toggle("active", i === idx);
    });
  }
}

// ══════════════════════════════════
// SEARCH + FILTER LOGIC
// ══════════════════════════════════
const searchInput  = document.getElementById("searchInput");
const searchClear  = document.getElementById("searchClear");
const filterFuel   = document.getElementById("filterFuel");
const filterLoc    = document.getElementById("filterLocation");
const filterYear   = document.getElementById("filterYear");
const filterPrice  = document.getElementById("filterPrice");
const sortBy       = document.getElementById("sortBy");
const resetBtn     = document.getElementById("resetFilters");

if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    activeFilters.search = e.target.value.trim();
    searchClear.classList.toggle("visible", !!activeFilters.search);
    applyFilters();
  });
}
if (searchClear) {
  searchClear.addEventListener("click", () => {
    searchInput.value = "";
    delete activeFilters.search;
    searchClear.classList.remove("visible");
    applyFilters();
  });
}
if (filterFuel)  filterFuel.addEventListener("change",  () => { activeFilters.fuel  = filterFuel.value;  applyFilters(); });
if (filterLoc)   filterLoc.addEventListener("change",   () => { activeFilters.loc   = filterLoc.value;   applyFilters(); });
if (filterYear)  filterYear.addEventListener("change",  () => { activeFilters.year  = filterYear.value;  applyFilters(); });
if (filterPrice) filterPrice.addEventListener("change", () => { activeFilters.price = filterPrice.value; applyFilters(); });
if (sortBy)      sortBy.addEventListener("change",      () => applyFilters());
if (resetBtn)    resetBtn.addEventListener("click",     resetAllFilters);

function applyFilters() {
  let cars = [...allCars];
  const { search, fuel, loc, year, price } = activeFilters;

  if (search) {
    const q = search.toLowerCase();
    cars = cars.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.fuel?.toLowerCase().includes(q) ||
      c.location?.toLowerCase().includes(q) ||
      String(c.year).includes(q) ||
      c.description?.toLowerCase().includes(q)
    );
  }
  if (fuel)  cars = cars.filter(c => c.fuel?.toLowerCase() === fuel.toLowerCase());
  if (loc)   cars = cars.filter(c => c.location?.toLowerCase().includes(loc.toLowerCase()));
  if (year) {
    const y = parseInt(year);
    const now = new Date().getFullYear();
    if (year === "2022") cars = cars.filter(c => c.year >= 2022);
    else if (year === "2020") cars = cars.filter(c => c.year >= 2020 && c.year < 2022);
    else if (year === "2018") cars = cars.filter(c => c.year >= 2018 && c.year < 2020);
    else if (year === "2015") cars = cars.filter(c => c.year >= 2015 && c.year < 2018);
    else if (year === "old")  cars = cars.filter(c => c.year < 2015);
  }
  if (price) {
    const p = parseFloat(price);
    if (price === "3")   cars = cars.filter(c => c.price < 300000);
    else if (price === "5")  cars = cars.filter(c => c.price >= 300000 && c.price < 500000);
    else if (price === "10") cars = cars.filter(c => c.price >= 500000 && c.price < 1000000);
    else if (price === "15") cars = cars.filter(c => c.price >= 1000000 && c.price < 1500000);
    else if (price === "999") cars = cars.filter(c => c.price >= 1500000);
  }

  // Sort
  const sort = sortBy?.value || "newest";
  if (sort === "price-low")  cars.sort((a, b) => a.price - b.price);
  else if (sort === "price-high") cars.sort((a, b) => b.price - a.price);
  else if (sort === "km-low") cars.sort((a, b) => a.km - b.km);
  else cars.sort((a, b) => {
    const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
    const db_ = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
    return db_ - da;
  });

  filteredCars = cars;
  renderCars();
  updateFilterChips();
}

function updateFilterChips() {
  const chips = document.getElementById("filterChips");
  if (!chips) return;
  chips.innerHTML = "";
  const labels = { fuel: "Fuel", loc: "Location", year: "Year", price: "Price", search: "Search" };
  Object.entries(activeFilters).forEach(([key, val]) => {
    if (!val) return;
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.innerHTML = `${labels[key]}: <strong>${val}</strong> <button onclick="removeFilter('${key}')">✕</button>`;
    chips.appendChild(chip);
  });
}

function removeFilter(key) {
  delete activeFilters[key];
  if (key === "fuel")  { filterFuel.value = ""; }
  if (key === "loc")   { filterLoc.value  = ""; }
  if (key === "year")  { filterYear.value = ""; }
  if (key === "price") { filterPrice.value = ""; }
  if (key === "search") { searchInput.value = ""; searchClear.classList.remove("visible"); }
  applyFilters();
}

function resetAllFilters() {
  activeFilters = {};
  if (searchInput)  searchInput.value = "";
  if (filterFuel)   filterFuel.value  = "";
  if (filterLoc)    filterLoc.value   = "";
  if (filterYear)   filterYear.value  = "";
  if (filterPrice)  filterPrice.value = "";
  if (sortBy)       sortBy.value = "newest";
  if (searchClear)  searchClear.classList.remove("visible");
  applyFilters();
}

// Quick filter from footer links
function quickFilter(type, value) {
  if (type === "fuel") {
    filterFuel.value = value;
    activeFilters.fuel = value;
    applyFilters();
    document.getElementById("inventory").scrollIntoView({ behavior: "smooth" });
  }
}

// ══════════════════════════════════
// CAR DETAIL MODAL
// ══════════════════════════════════
let currentModalCar = null;
let modalImgIndex   = 0;

function openCarModal(carId) {
  const car = allCars.find(c => c.id === carId);
  if (!car) return;

  currentModalCar = car;
  modalImgIndex = 0;

  addToRecent(carId);

  const content = document.getElementById("modalContent");
  const images = car.images || [];

  content.innerHTML = `
    <div class="modal-gallery">
      ${images.length > 0
        ? `<img class="modal-main-img" id="modalMainImg" src="${images[0]}" alt="${car.name}" />
           ${images.length > 1 ? `
             <div class="modal-thumbs" id="modalThumbs">
               ${images.map((url, i) => `<img src="${url}" class="${i===0?'active':''}" onclick="switchModalImg(${i})" alt="View ${i+1}" />`).join("")}
             </div>
           ` : ""}
          `
        : `<div class="modal-main-img" style="display:flex;align-items:center;justify-content:center;font-size:5rem;">🚗</div>`
      }
    </div>
    <div class="modal-body">
      <div class="modal-top">
        <div>
          <div class="modal-title">${car.name}</div>
          <div style="color:var(--text2);font-size:0.9rem;margin-top:4px;">📍 ${car.location || "Kota"} • ${car.year} • ${capitalize(car.fuel)}</div>
        </div>
        <div class="modal-price">₹${formatPrice(car.price)}</div>
      </div>

      <div class="modal-specs-grid">
        <div class="modal-spec"><div class="modal-spec-label">Year</div><div class="modal-spec-value">📅 ${car.year}</div></div>
        <div class="modal-spec"><div class="modal-spec-label">KM Driven</div><div class="modal-spec-value">🛣 ${formatKm(car.km)} km</div></div>
        <div class="modal-spec"><div class="modal-spec-label">Fuel Type</div><div class="modal-spec-value">${fuelEmoji(car.fuel)} ${capitalize(car.fuel)}</div></div>
        <div class="modal-spec"><div class="modal-spec-label">Transmission</div><div class="modal-spec-value">⚙️ ${car.transmission || "Manual"}</div></div>
        <div class="modal-spec"><div class="modal-spec-label">Color</div><div class="modal-spec-value">🎨 ${car.color || "N/A"}</div></div>
        <div class="modal-spec"><div class="modal-spec-label">Owners</div><div class="modal-spec-value">👤 ${car.owners || 1} Owner</div></div>
        <div class="modal-spec"><div class="modal-spec-label">Insurance</div><div class="modal-spec-value">🛡 ${car.insurance || "N/A"}</div></div>
        <div class="modal-spec"><div class="modal-spec-label">Registration</div><div class="modal-spec-value">📋 ${car.registration || "N/A"}</div></div>
        <div class="modal-spec"><div class="modal-spec-label">Location</div><div class="modal-spec-value">📍 ${car.location || "Kota"}</div></div>
      </div>

      ${car.description ? `
        <div class="modal-section-title">Description</div>
        <div class="modal-desc">${car.description}</div>
      ` : ""}

      <div class="modal-actions">
        <button class="btn-primary" onclick="openWhatsApp('car','${car.id}','${car.name}')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          WhatsApp Enquiry
        </button>
        <a href="tel:+91${car.ownerPhone || WHATSAPP_NUMBER}" class="btn-outline">
          📞 Call Now
        </a>
      </div>
    </div>
  `;

  const overlay = document.getElementById("carModal");
  overlay.classList.add("open");
  document.body.style.overflow = "hidden";
}

function switchModalImg(idx) {
  const car = currentModalCar;
  if (!car || !car.images) return;
  modalImgIndex = idx;
  const main = document.getElementById("modalMainImg");
  if (main) main.src = car.images[idx];
  document.querySelectorAll("#modalThumbs img").forEach((img, i) => {
    img.classList.toggle("active", i === idx);
  });
}

function closeModal() {
  const overlay = document.getElementById("carModal");
  overlay.classList.remove("open");
  document.body.style.overflow = "";
}

document.getElementById("modalClose")?.addEventListener("click", closeModal);
document.getElementById("carModal")?.addEventListener("click", (e) => {
  if (e.target === e.currentTarget) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

// ══════════════════════════════════
// FAVORITES
// ══════════════════════════════════
function toggleFav(e, carId) {
  e.stopPropagation();
  const idx = favorites.indexOf(carId);
  if (idx > -1) {
    favorites.splice(idx, 1);
    showToast("Removed from favourites", "info");
  } else {
    favorites.push(carId);
    showToast("❤️ Added to favourites!", "success");
  }
  localStorage.setItem("gm_favorites", JSON.stringify(favorites));

  // Update all fav buttons
  document.querySelectorAll(".fav-btn").forEach(btn => {
    const btnCarId = btn.getAttribute("onclick")?.match(/'([^']+)'\)$/)?.[1];
    if (btnCarId === carId) {
      btn.classList.toggle("active", favorites.includes(carId));
      btn.textContent = favorites.includes(carId) ? "❤️" : "🤍";
    }
  });
}

// ══════════════════════════════════
// RECENTLY VIEWED
// ══════════════════════════════════
function addToRecent(carId) {
  recentlyViewed = recentlyViewed.filter(id => id !== carId);
  recentlyViewed.unshift(carId);
  if (recentlyViewed.length > 5) recentlyViewed = recentlyViewed.slice(0, 5);
  localStorage.setItem("gm_recent", JSON.stringify(recentlyViewed));
}

// ══════════════════════════════════
// WHATSAPP
// ══════════════════════════════════
function openWhatsApp(type, carId, carName) {
  let url;
  if (type === "general") {
    const msg = encodeURIComponent("Hi! I'm interested in cars at Ganpati Motors. Please share available options.");
    url = `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
  } else if (type === "car") {
    const msg = encodeURIComponent(`Hi! I'm interested in the *${carName}* listed on Ganpati Motors. Please share more details and current price.`);
    url = `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
  } else if (type === "group") {
    url = WHATSAPP_GROUP;
  }
  window.open(url, "_blank");
}

// ══════════════════════════════════
// NAVBAR SCROLL
// ══════════════════════════════════
const navbar = document.getElementById("navbar");
window.addEventListener("scroll", () => {
  navbar?.classList.toggle("scrolled", window.scrollY > 40);
});

// ══════════════════════════════════
// HAMBURGER MENU
// ══════════════════════════════════
const hamburger = document.getElementById("hamburger");
const navLinks  = document.getElementById("navLinks");
hamburger?.addEventListener("click", () => {
  hamburger.classList.toggle("open");
  navLinks.classList.toggle("open");
});
navLinks?.querySelectorAll("a").forEach(a => {
  a.addEventListener("click", () => {
    hamburger.classList.remove("open");
    navLinks.classList.remove("open");
  });
});

// ══════════════════════════════════
// STATS COUNTER ANIMATION
// ══════════════════════════════════
function animateCounters() {
  document.querySelectorAll(".stat-card").forEach(card => {
    const target = parseInt(card.dataset.target || 0);
    const countEl = card.querySelector(".count");
    let current = 0;
    const step = Math.ceil(target / 60);
    const interval = setInterval(() => {
      current = Math.min(current + step, target);
      countEl.textContent = current;
      if (current >= target) clearInterval(interval);
    }, 25);
  });
}

// ══════════════════════════════════
// INTERSECTION OBSERVER
// ══════════════════════════════════
function observeCards() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => e.isIntersecting && e.target.classList.add("visible"));
  }, { threshold: 0.1 });
  document.querySelectorAll(".reveal").forEach(el => obs.observe(el));
}

const statsObs = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) {
    animateCounters();
    statsObs.disconnect();
  }
}, { threshold: 0.3 });
const statsSection = document.querySelector(".stats-section");
if (statsSection) statsObs.observe(statsSection);

// Add reveal class to sections
document.querySelectorAll(".why-card, .testimonial-card, .contact-card").forEach(el => {
  el.classList.add("reveal");
});
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(e => e.isIntersecting && e.target.classList.add("visible"));
}, { threshold: 0.1 });
document.querySelectorAll(".reveal").forEach(el => revealObs.observe(el));

// ══════════════════════════════════
// LOADING STATE
// ══════════════════════════════════
function showLoading(show) {
  const ls = document.getElementById("loadingState");
  const grid = document.getElementById("carsGrid");
  if (ls)   ls.style.display  = show ? "block" : "none";
  if (grid) grid.style.display = show ? "none"  : "grid";
}

// ══════════════════════════════════
// TOAST NOTIFICATIONS
// ══════════════════════════════════
let toastTimeout;
function showToast(msg, type = "info") {
  const toast = document.getElementById("toast");
  if (!toast) return;
  clearTimeout(toastTimeout);
  toast.textContent = msg;
  toast.className = `toast show ${type}`;
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 2500);
}

// ══════════════════════════════════
// UTILS
// ══════════════════════════════════
function formatPrice(p) {
  if (!p) return "Price on Request";
  if (p >= 100000) return (p / 100000).toFixed(p % 100000 === 0 ? 0 : 1) + " Lakh";
  return p.toLocaleString("en-IN");
}

function formatKm(km) {
  if (!km) return "0";
  if (km >= 1000) return (km / 1000).toFixed(km % 1000 === 0 ? 0 : 1) + "k";
  return km.toString();
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
}

function fuelEmoji(fuel) {
  const map = { petrol: "⛽", diesel: "🔵", cng: "🌿", electric: "⚡", hybrid: "♻️" };
  return map[fuel?.toLowerCase()] || "⛽";
}

function isNewCar(car) {
  if (!car.createdAt) return false;
  const date = car.createdAt.toDate ? car.createdAt.toDate() : new Date(car.createdAt);
  const diff = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
  return diff < 7;
}
