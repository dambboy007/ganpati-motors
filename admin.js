/**
 * GANPATI MOTORS - admin.js
 * Handles: Firebase Auth, CRUD operations, image upload
 */

let allAdminCars = [];
let selectedImages = []; // File objects for new upload
let existingImages = []; // URLs for images already in Firestore (during edit)

const CLOUDINARY_UPLOAD_URL = "https://api.cloudinary.com/v1_1/dw2klgkqa/image/upload";
const CLOUDINARY_UPLOAD_PRESET = "ganpati_uploads";

// Wait for Firebase
let adminInitialized = false;

window.addEventListener("firebase-ready", initAdmin);

function initAdmin() {
  if (adminInitialized) return;
  if (!window._auth || !window._fbModules) return;

  adminInitialized = true;

  const { onAuthStateChanged } = window._fbModules;
  const auth = window._auth;

  onAuthStateChanged(auth, user => {
    if (user) {
      document.getElementById("loginScreen").style.display = "none";
      document.getElementById("adminDashboard").style.display = "block";
      document.getElementById("adminEmail").textContent = user.email;
      loadAllCars();
      setupImageUpload();
    } else {
      document.getElementById("loginScreen").style.display = "flex";
      document.getElementById("adminDashboard").style.display = "none";
    }
  });

  // Login button
  document.getElementById("loginBtn")?.addEventListener("click", handleLogin);
  document.getElementById("loginPassword")?.addEventListener("keydown", e => {
    if (e.key === "Enter") handleLogin();
  });

  // Logout button
  document.getElementById("logoutBtn")?.addEventListener("click", async () => {
    const { signOut } = window._fbModules;
    await signOut(window._auth);
    showToast("Logged out successfully");
  });
}

if (window._auth && window._fbModules) {
  initAdmin();
}

// ==================================
// AUTH
// ==================================
async function handleLogin() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const errEl = document.getElementById("loginError");
  const btn = document.getElementById("loginBtn");

  if (!email || !password) {
    errEl.textContent = "Please enter email and password.";
    errEl.style.display = "block";
    return;
  }

  btn.textContent = "Signing in…";
  btn.disabled = true;
  errEl.style.display = "none";

  try {
    const { signInWithEmailAndPassword } = window._fbModules;
    await signInWithEmailAndPassword(window._auth, email, password);
  } catch (err) {
    const messages = {
      "auth/invalid-credential": "Invalid email or password.",
      "auth/user-not-found": "No account found with this email.",
      "auth/wrong-password": "Incorrect password.",
      "auth/too-many-requests": "Too many attempts. Please try again later.",
    };
    errEl.textContent = messages[err.code] || "Login failed. Please try again.";
    errEl.style.display = "block";
    btn.textContent = "Sign In →";
    btn.disabled = false;
  }
}

// ==================================
// LOAD CARS
// ==================================
async function loadAllCars() {
  try {
    const { collection, getDocs, query, orderBy } = window._fbModules;
    const db = window._db;

    const q = query(collection(db, "cars"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    allAdminCars = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    renderAdminInventory();
    renderDelistedCars();
    updateStats();
  } catch (err) {
    console.error("Error loading cars:", err);
    showToast("Error loading cars: " + err.message, "error");
  }
}

function updateStats() {
  const active = allAdminCars.filter(c => c.status !== "delisted");
  const delisted = allAdminCars.filter(c => c.status === "delisted");
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const thisWeek = allAdminCars.filter(c => {
    const date = c.createdAt?.toDate ? c.createdAt.toDate() : new Date(0);
    return date.getTime() > oneWeekAgo;
  });

  document.getElementById("statTotal").textContent = allAdminCars.length;
  document.getElementById("statActive").textContent = active.length;
  document.getElementById("statDelisted").textContent = delisted.length;
  document.getElementById("statWeek").textContent = thisWeek.length;
}

function renderAdminInventory() {
  const list = document.getElementById("adminCarsList");
  const active = allAdminCars.filter(c => c.status !== "delisted");

  if (active.length === 0) {
    list.innerHTML = `<p style="color:var(--text2);padding:20px;">No active listings. <a href="#" onclick="switchTab('add')" style="color:var(--accent);">Add your first car -></a></p>`;
    return;
  }

  list.innerHTML = active.map(car => `
    <div class="admin-car-item" id="admin-item-${car.id}">
      ${car.images?.length > 0
        ? `<img class="admin-car-thumb" src="${car.images[0]}" alt="${car.name}" />`
        : `<div class="admin-car-thumb" style="display:flex;align-items:center;justify-content:center;font-size:2rem;">Car</div>`
      }
      <div class="admin-car-info">
        <h4>${car.name}</h4>
        <p>Rs.${formatAdminPrice(car.price)} • ${car.year} • ${car.fuel} • ${formatAdminKm(car.km)} km • ${car.location}</p>
        <p style="margin-top:4px;font-size:0.75rem;color:var(--text3);">Added: ${formatDate(car.createdAt)}</p>
      </div>
      <div>
        <span class="status-badge status-active">Active</span>
      </div>
      <div class="admin-car-actions">
        <button class="btn-edit" onclick="editCar('${car.id}')">✏️ Edit</button>
        <button class="btn-delist" onclick="delistCar('${car.id}')">📦 Delist</button>
        <button class="btn-delete" onclick="deleteCar('${car.id}')">🗑 Delete</button>
      </div>
    </div>
  `).join("");
}

function renderDelistedCars() {
  const list = document.getElementById("delistedCarsList");
  const delisted = allAdminCars.filter(c => c.status === "delisted");

  if (delisted.length === 0) {
    list.innerHTML = `<p style="color:var(--text2);padding:20px;">No delisted cars.</p>`;
    return;
  }

  list.innerHTML = delisted.map(car => `
    <div class="admin-car-item" id="admin-item-del-${car.id}">
      ${car.images?.length > 0
        ? `<img class="admin-car-thumb" src="${car.images[0]}" alt="${car.name}" />`
        : `<div class="admin-car-thumb" style="display:flex;align-items:center;justify-content:center;font-size:2rem;">Car</div>`
      }
      <div class="admin-car-info">
        <h4>${car.name}</h4>
        <p>Rs.${formatAdminPrice(car.price)} • ${car.year} • ${car.fuel} • ${formatAdminKm(car.km)} km</p>
      </div>
      <div>
        <span class="status-badge status-delisted">Delisted</span>
      </div>
      <div class="admin-car-actions">
        <button class="btn-edit" onclick="relistCar('${car.id}')">✅ Relist</button>
        <button class="btn-delete" onclick="deleteCar('${car.id}')">🗑 Delete</button>
      </div>
    </div>
  `).join("");
}

// ==================================
// IMAGE UPLOAD SETUP
// ==================================
function setupImageUpload() {
  const input = document.getElementById("imageInput");
  const zone = document.getElementById("uploadZone");

  if (!input || !zone) return;
  if (input.dataset.bound === "true") return;

  input.dataset.bound = "true";

  input.addEventListener("change", e => handleImageFiles(e.target.files));

  zone.addEventListener("dragover", e => {
    e.preventDefault();
    zone.classList.add("dragover");
  });
  zone.addEventListener("dragleave", () => zone.classList.remove("dragover"));
  zone.addEventListener("drop", e => {
    e.preventDefault();
    zone.classList.remove("dragover");
    handleImageFiles(e.dataTransfer.files);
  });
}

function handleImageFiles(files) {
  const previews = document.getElementById("imagePreviews");

  Array.from(files).forEach(file => {
    if (!file.type.startsWith("image/")) return;
    if (selectedImages.length >= 10) {
      showToast("Maximum 10 images allowed", "error");
      return;
    }

    const idx = selectedImages.length;
    selectedImages.push(file);

    const reader = new FileReader();
    reader.onload = e => {
      const wrap = document.createElement("div");
      wrap.className = "img-preview-wrap";
      wrap.id = `preview-new-${idx}`;
      wrap.innerHTML = `
        <img src="${e.target.result}" alt="Preview" />
        <button class="img-remove" onclick="removeNewImage(${idx})">✕</button>
      `;
      previews.appendChild(wrap);
    };
    reader.readAsDataURL(file);
  });
}

function removeNewImage(idx) {
  selectedImages.splice(idx, 1);
  renderImagePreviews();
}

function removeExistingImage(idx) {
  existingImages.splice(idx, 1);
  renderImagePreviews();
}

function renderImagePreviews() {
  const previews = document.getElementById("imagePreviews");
  previews.innerHTML = "";

  existingImages.forEach((url, i) => {
    const wrap = document.createElement("div");
    wrap.className = "img-preview-wrap";
    wrap.innerHTML = `
      <img src="${url}" alt="Existing" />
      <button class="img-remove" onclick="removeExistingImage(${i})">✕</button>
    `;
    previews.appendChild(wrap);
  });

  selectedImages.forEach((file, i) => {
    const reader = new FileReader();
    reader.onload = e => {
      const wrap = document.createElement("div");
      wrap.className = "img-preview-wrap";
      wrap.innerHTML = `
        <img src="${e.target.result}" alt="New" />
        <button class="img-remove" onclick="removeNewImage(${i})">✕</button>
      `;
      previews.appendChild(wrap);
    };
    reader.readAsDataURL(file);
  });
}

// ==================================
// UPLOAD IMAGES TO CLOUDINARY
// ==================================
async function uploadToCloudinary(file) {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  try {
    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: "POST",
      body: formData
    });
    const data = await response.json();

    if (!response.ok || !data.secure_url) {
      const message = data?.error?.message || "Cloudinary upload failed.";
      throw new Error(message);
    }

    return data.secure_url;
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    throw err;
  }
}

async function uploadImages() {
  if (selectedImages.length === 0) {
    return [...existingImages];
  }

  try {
    const uploadedUrls = await Promise.all(
      selectedImages.map(file => uploadToCloudinary(file))
    );

    return [...existingImages, ...uploadedUrls];
  } catch (err) {
    console.error("Image upload failed:", err);
    throw new Error("Image upload failed. Please try again.");
  }
}

// ==================================
// ADD / EDIT CAR
// ==================================
async function submitCar() {
  const editId = document.getElementById("editCarId").value;
  const btn = document.getElementById("submitCarBtn");
  const errEl = document.getElementById("formError");

  const name = document.getElementById("fName").value.trim();
  const price = parseFloat(document.getElementById("fPrice").value);
  const year = parseInt(document.getElementById("fYear").value, 10);
  const fuel = document.getElementById("fFuel").value;
  const km = parseInt(document.getElementById("fKm").value, 10);

  if (!name || !price || !year || !fuel || !km) {
    errEl.textContent = "Please fill all required fields (marked with *).";
    errEl.style.display = "block";
    return;
  }

  errEl.style.display = "none";
  btn.textContent = editId ? "Saving changes…" : "Adding car…";
  btn.disabled = true;

  try {
    const { collection, addDoc, updateDoc, doc, serverTimestamp } = window._fbModules;
    const db = window._db;

    let imageUrls = [];
    if (selectedImages.length > 0 || existingImages.length > 0) {
      imageUrls = await uploadImages();
    } else if (editId) {
      imageUrls = existingImages;
    }

    const carData = {
      name,
      price,
      year,
      fuel,
      km,
      transmission: document.getElementById("fTransmission").value,
      color: document.getElementById("fColor").value.trim(),
      owners: parseInt(document.getElementById("fOwners").value, 10),
      location: document.getElementById("fLocation").value.trim() || "Kota",
      ownerPhone: document.getElementById("fPhone").value.trim(),
      insurance: document.getElementById("fInsurance").value.trim(),
      registration: document.getElementById("fReg").value.trim(),
      description: document.getElementById("fDesc").value.trim(),
      images: imageUrls,
      status: "active",
    };

    if (editId) {
      await updateDoc(doc(db, "cars", editId), carData);
      showToast("✅ Car updated successfully!", "success");
    } else {
      carData.createdAt = serverTimestamp();
      await addDoc(collection(db, "cars"), carData);
      showToast("✅ Car added successfully!", "success");
    }

    resetForm();
    await loadAllCars();
    switchTab("inventory");
  } catch (err) {
    console.error("Submit error:", err);
    errEl.textContent = "Error: " + err.message;
    errEl.style.display = "block";
  } finally {
    btn.textContent = editId ? "Save Changes" : "➕ Add Car to Inventory";
    btn.disabled = false;
  }
}

// ==================================
// EDIT
// ==================================
function editCar(carId) {
  const car = allAdminCars.find(c => c.id === carId);
  if (!car) return;

  document.getElementById("editCarId").value = carId;
  document.getElementById("fName").value = car.name || "";
  document.getElementById("fPrice").value = car.price || "";
  document.getElementById("fYear").value = car.year || "";
  document.getElementById("fFuel").value = car.fuel || "";
  document.getElementById("fKm").value = car.km || "";
  document.getElementById("fTransmission").value = car.transmission || "Manual";
  document.getElementById("fColor").value = car.color || "";
  document.getElementById("fOwners").value = car.owners || "1";
  document.getElementById("fLocation").value = car.location || "Kota";
  document.getElementById("fPhone").value = car.ownerPhone || "";
  document.getElementById("fInsurance").value = car.insurance || "";
  document.getElementById("fReg").value = car.registration || "";
  document.getElementById("fDesc").value = car.description || "";

  existingImages = car.images ? [...car.images] : [];
  selectedImages = [];
  renderImagePreviews();

  document.getElementById("formTitle").textContent = "Edit Car";
  document.getElementById("submitCarBtn").textContent = "Save Changes";

  switchTab("add");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ==================================
// DELIST / RELIST
// ==================================
async function delistCar(carId) {
  if (!confirm("Delist this car? It will be hidden from the website but not deleted.")) return;
  try {
    const { doc, updateDoc } = window._fbModules;
    await updateDoc(doc(window._db, "cars", carId), { status: "delisted" });
    showToast("📦 Car delisted", "info");
    await loadAllCars();
  } catch (err) {
    showToast("Error: " + err.message, "error");
  }
}

async function relistCar(carId) {
  try {
    const { doc, updateDoc } = window._fbModules;
    await updateDoc(doc(window._db, "cars", carId), { status: "active" });
    showToast("✅ Car relisted!", "success");
    await loadAllCars();
  } catch (err) {
    showToast("Error: " + err.message, "error");
  }
}

// ==================================
// DELETE
// ==================================
async function deleteCar(carId) {
  if (!confirm("Permanently delete this car? This cannot be undone.")) return;
  try {
    const { doc, deleteDoc } = window._fbModules;
    await deleteDoc(doc(window._db, "cars", carId));
    showToast("🗑 Car deleted", "info");
    await loadAllCars();
  } catch (err) {
    showToast("Error: " + err.message, "error");
  }
}

// ==================================
// RESET FORM
// ==================================
function resetForm() {
  document.getElementById("editCarId").value = "";
  ["fName", "fPrice", "fYear", "fKm", "fColor", "fPhone", "fInsurance", "fReg", "fDesc"].forEach(id => {
    document.getElementById(id).value = "";
  });
  document.getElementById("fFuel").value = "";
  document.getElementById("fTransmission").value = "Manual";
  document.getElementById("fOwners").value = "1";
  document.getElementById("fLocation").value = "Kota";
  selectedImages = [];
  existingImages = [];
  document.getElementById("imagePreviews").innerHTML = "";
  document.getElementById("formTitle").textContent = "Add New Car";
  document.getElementById("submitCarBtn").textContent = "➕ Add Car to Inventory";
  document.getElementById("formError").style.display = "none";
  document.getElementById("imageInput").value = "";
}

// ==================================
// TABS
// ==================================
function switchTab(tabName) {
  document.querySelectorAll(".admin-tab").forEach((btn, i) => {
    const names = ["inventory", "add", "delisted"];
    btn.classList.toggle("active", names[i] === tabName);
  });
  document.querySelectorAll(".admin-tab-content").forEach(el => el.classList.remove("active"));
  document.getElementById("tab-" + tabName)?.classList.add("active");
}

// ==================================
// UTILS
// ==================================
function formatAdminPrice(p) {
  if (!p) return "-";
  if (p >= 100000) return (p / 100000).toFixed(1) + "L";
  return p.toLocaleString("en-IN");
}

function formatAdminKm(km) {
  if (!km) return "0";
  return km.toLocaleString("en-IN");
}

function formatDate(ts) {
  if (!ts) return "Unknown";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

let toastTimeout;
function showToast(msg, type = "info") {
  const toast = document.getElementById("toast");
  if (!toast) return;
  clearTimeout(toastTimeout);
  toast.textContent = msg;
  toast.className = `toast show ${type}`;
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 2800);
}
