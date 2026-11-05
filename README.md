# Offline Saver 📥 — net khatam hone se pehle sab save kar lo

**Live app:** https://offline-saver.sites.tab.bot/

Data pack khatam hone wala hai? Is app mein videos, PDF, photos, audio aur articles **net rehte hue** save kar lo, aur baad mein **bina internet ke** dekho / padho. ✈️ Airplane mode mein bhi chalta hai.

> Note: Internet khud save nahi ho sakta (har second ka data tower se aata hai). Ye app sirf aapki **files aur pages** phone mein rakhta hai, taaki baad mein bina data ke khul jaayein.

## Kya kya kar sakte ho
- 📂 **Pick from phone** — videos (mp4), PDF, photos, audio, koi bhi file app ke andar save
- 🔗 **Save web page by link** — jo sites allow karti hain unka text offline padhne ke liye save (jo site block kare, app saaf bata deta hai — fake nahi)
- 📝 **Note / article paste** — text paste karo, offline padho
- 📤 **Share → Offline Saver** (Android, app install karne ke baad) — Gallery, Files ya Chrome se seedha share karo
- 📚 **Library** — search, filter (Videos/Audio/PDF/Photos/Notes), video-audio app ke andar hi chalao, photo dekho, PDF phone ke viewer mein kholo, delete karo
- 💾 Kitna save hua aur phone mein kitni jagah bachi hai — dono dikhata hai, aur phone se "persistent storage" maangta hai taaki aapka saved data khud delete na ho

## Install kaise kare (Android)
1. Chrome mein https://offline-saver.sites.tab.bot/ kholo
2. Menu ⋮ → **Install app** / **Add to Home screen**
3. Bas! Ab home screen se khulega — net ho ya na ho

## Privacy
Koi account nahi, koi server nahi. Sab kuch **sirf aapke phone** mein rehta hai (IndexedDB). Browser ka data clear karoge to saved files bhi chali jaayengi.

## Code kaise kaam karta hai
| File | Kaam |
|---|---|
| `site/index.html` | UI: Save tab + Library tab |
| `site/app.js` | Files save/list/search/play/delete, link save, storage meter |
| `site/db.js` | Chhota IndexedDB helper (page + service worker dono use karte hain) |
| `site/sw.js` | Service worker: app offline khule (cache) + Android share target (POST /share) |
| `site/manifest.webmanifest` | PWA install + `share_target` |

Pure HTML/CSS/JS — koi framework nahi, koi build step nahi. Apne computer pe chalane ke liye:
```
cd site
python3 -m http.server 8080
# phir http://localhost:8080 kholo
```

## Download
Release **v1.0** mein poora source zip hai: https://github.com/nm621532-byte/offline-saver-techbroz/releases/tag/v1.0

---
Bana hai **Tech Bro Z** ke liye 💻 — YouTube: [@techbrozdeveloper](https://www.youtube.com/@techbrozdeveloper) · Instagram: [@tech_bro_z_1](https://www.instagram.com/tech_bro_z_1/)

License: MIT
