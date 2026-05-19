# 🚗 Ganpati Motors — Website Setup Guide

A complete, production-ready used-car dealership website built with HTML, CSS, JavaScript + Firebase.

---

## 📁 Project Structure

```
ganpati-motors/
│
├── index.html          ← Main homepage (what customers see)
├── admin.html          ← Admin panel (only for owner)
│
├── css/
│   └── style.css       ← All styling (dark luxury theme)
│
├── js/
│   ├── app.js          ← Homepage logic (cars, search, filters)
│   └── admin.js        ← Admin panel logic (add/edit/delete cars)
│
└── README.md           ← This file
```

---

## 🔥 Step 1: Create Firebase Project

1. Go to → **https://console.firebase.google.com**
2. Click **"Add Project"** → Name it **"ganpati-motors"**
3. Disable Google Analytics (optional) → Click **"Create Project"**
4. Wait for it to create → Click **"Continue"**

---

## 🔥 Step 2: Enable Firebase Services

### A. Firestore Database (stores car data)
1. In Firebase Console → Left menu → **"Firestore Database"**
2. Click **"Create Database"**
3. Choose **"Start in test mode"** (we'll secure it later)
4. Select location: **"asia-south1 (Mumbai)"** → Click **"Enable"**

### B. Firebase Storage (stores car photos)
1. Left menu → **"Storage"**
2. Click **"Get Started"** → **"Start in test mode"** → **"Next"** → **"Done"**

### C. Firebase Authentication (admin login)
1. Left menu → **"Authentication"** → **"Get Started"**
2. Click **"Email/Password"** → Toggle **"Enable"** → **"Save"**
3. Go to **"Users"** tab → **"Add User"**
   - Email: `admin@ganpatimotors.in` (your choice)
   - Password: Create a strong password
   - Click **"Add User"**

---

## 🔥 Step 3: Get Firebase Config

1. In Firebase Console → Click the ⚙️ gear icon → **"Project Settings"**
2. Scroll down to **"Your apps"** section
3. Click the **"</>"** (Web) button → Register app name: **"Ganpati Motors Web"**
4. Copy the `firebaseConfig` object (looks like this):

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXX",
  authDomain: "ganpati-motors.firebaseapp.com",
  projectId: "ganpati-motors",
  storageBucket: "ganpati-motors.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

---

## 🔥 Step 4: Add Config to Website

Open **both** `index.html` and `admin.html` — find this section near the bottom:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",           // ← Replace this
  authDomain: "YOUR_PROJECT.firebaseapp.com",  // ← Replace this
  projectId: "YOUR_PROJECT_ID",     // ← Replace this
  storageBucket: "YOUR_PROJECT.appspot.com",   // ← Replace this
  messagingSenderId: "YOUR_SENDER_ID",         // ← Replace this
  appId: "YOUR_APP_ID"              // ← Replace this
};
```

Paste your actual values from Step 3. Do this in **BOTH files**.

---

## 📱 Step 5: Customize Your Details

Open `js/app.js` and change:

```javascript
const WHATSAPP_NUMBER = "919999999999"; // Your WhatsApp number (91 + 10 digits)
const WHATSAPP_GROUP  = "https://chat.whatsapp.com/YOUR_GROUP_LINK"; // Your group link
```

---

## 🔐 Step 6: Secure Firestore Rules (Important!)

In Firebase Console → Firestore → **"Rules"** tab → Replace with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Anyone can READ cars (public)
    match /cars/{carId} {
      allow read: if true;
      // Only authenticated users (admin) can write
      allow write: if request.auth != null;
    }
  }
}
```

Click **"Publish"**.

For Storage rules → Storage → **"Rules"**:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /cars/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

---

## 🚀 Step 7: Deploy (Go Live)

### Option A: Firebase Hosting (FREE - Recommended)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Go to your project folder
cd ganpati-motors

# Initialize hosting
firebase init hosting
# Choose: Use existing project → ganpati-motors
# Public directory: . (just press Enter)
# Single-page app: No
# Overwrite index.html: No

# Deploy!
firebase deploy
```

Your site will be live at: `https://ganpati-motors.web.app`

### Option B: Netlify (Even Easier - FREE)
1. Go to → **https://netlify.com**
2. Sign up → Drag & drop your `ganpati-motors` folder onto the dashboard
3. Done! You'll get a live URL instantly

---

## 🎯 Step 8: Add Your First Car (Admin)

1. Open `yourdomain.com/admin.html`
2. Log in with the email/password you created in Firebase Authentication
3. Click **"➕ Add Car"** tab
4. Fill in all car details, upload photos
5. Click **"Add Car to Inventory"**
6. Check your homepage — the car appears instantly!

---

## 📋 Features Checklist

| Feature | Status |
|---------|--------|
| ✅ Car inventory with cards | Done |
| ✅ Image slider on cards | Done |
| ✅ Live search | Done |
| ✅ Filter by fuel, location, year, price | Done |
| ✅ Sort by price, km, newest | Done |
| ✅ Car detail modal with full specs | Done |
| ✅ WhatsApp enquiry button | Done |
| ✅ Admin login (Firebase Auth) | Done |
| ✅ Add/Edit/Delete cars | Done |
| ✅ Multiple image upload | Done |
| ✅ Delist/Relist cars | Done |
| ✅ Favorites (saved locally) | Done |
| ✅ Recently viewed | Done |
| ✅ Stats counter animation | Done |
| ✅ Testimonials section | Done |
| ✅ Google Maps embed | Done |
| ✅ Mobile responsive | Done |
| ✅ Dark mode (default) | Done |
| ✅ SEO meta tags | Done |
| ✅ Smooth animations | Done |
| ✅ Toast notifications | Done |

---

## 🗺️ Update Google Maps

In `index.html`, find the `<iframe>` tag with Google Maps.
Replace the `src` URL with your actual location embed:

1. Go to **maps.google.com**
2. Search **"Kansua Car Bazar, Kota"**
3. Click **"Share"** → **"Embed a map"** → Copy the `<iframe>` code
4. Replace the existing iframe in `index.html`

---

## 📞 Update Contact Info

In `index.html`, search for:
- `+91 99999 99999` → Replace with your real number
- `tel:+919999999999` → Replace with your real number
- `Kansua Car Bazar, Kota, Rajasthan – 324007` → Update if needed

---

## 🎨 Customization Tips

### Change accent color (orange → any color):
In `css/style.css`, line 10:
```css
--accent: #f97316;  /* Change this hex code */
```

### Add your logo image:
Replace the text logo in the navbar with:
```html
<img src="images/logo.png" alt="Ganpati Motors" height="40" />
```

### Add real car images without Firebase:
Just paste direct image URLs in the `images` array when using demo data in `js/app.js`.

---

## 🆘 Common Issues

**Q: Website shows demo cars, not my Firebase cars**
A: Check your Firebase config values are correct in both HTML files.

**Q: Admin login not working**
A: Make sure Authentication → Email/Password is enabled and you created a user.

**Q: Images not uploading**
A: Check Firebase Storage rules are published correctly.

**Q: WhatsApp button not working**
A: Update `WHATSAPP_NUMBER` in `js/app.js` with your real number.

---

## 📱 Mobile Testing

Open Chrome DevTools (F12) → Click phone icon → Test on iPhone 12, Samsung Galaxy sizes.

---

Built with ❤️ for Ganpati Motors, Kota
