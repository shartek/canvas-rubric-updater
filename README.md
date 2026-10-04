# canvas-rubric-updater

A Tampermonkey userscript that updates Canvas rubric rating titles to the EarlyEdU standard.

This tool is designed for instructors and course designers who maintain multiple rubrics across Canvas courses and want a fast, safe way to update legacy rating labels (Accomplished, Satisfactory, Excellent, etc.) to the current EarlyEdU feedback-forward standard:

**Expected · Acceptable · Developing · Beginning**

---

## 🚀 Installation (Tampermonkey)

1. Install Tampermonkey browser extension  
2. Click the link to install the script:  
  👉 [Install from GitHub](https://github.com/shartek/canvas-rubric-updater/raw/main/rubric-updater.user.js)  
3. Accept the Tampermonkey prompt to add the script


---

## ✨ What This Script Does

When viewing any Canvas rubric page, the script adds a new button:

**Update Titles**

Clicking this button:

- Fetches the rubric via the Canvas API  
- Skips any criteria linked to Outcomes  
- Replaces *all* rating titles in non-outcome criteria with the EarlyEdU standard  
- Saves the updated rubric  
- Reloads the page so you can verify the changes immediately  

This allows you to update rubrics quickly without manually editing each rating title.

---

## 🧠 Why This Exists

Manually updating rubic titles is tedious and error-prone — especially across dozens of rubrics.

This script automates the repetitive part while keeping you in control of each rubric.  
You still open the rubric and verify the update, but you no longer have to click-click-paste-click-click for every criterion.

---

## 🔧 Customizing Rating Titles

Inside the script, you’ll find:

```javascript
var ratingTitles = ['Expected', 'Acceptable', 'Developing', 'Beginning'];
```

## 🛡️ Safety Notes

- Outcome-linked criteria are **never modified**.  
- Mastery thresholds and outcome rating sets remain untouched.  
- Points and long descriptions are preserved.  
- Only the **rating.description** field is updated.  
- The script updates **only the rubric you are currently viewing**, ensuring full control and easy verification.  
- The script does not modify any Canvas Outcomes, Outcome mastery settings, or Outcome scoring logic.

---

## 📄 License

This project is licensed under the MIT License.  
You are free to use, modify, and distribute this script with attribution.

---

## 🧾 Changelog

### **v3.0.0 — Indexed‑Hash PUT Update**
- Updated rubric serialization to use Canvas’s required **indexed‑hash** format for criteria and ratings.
- Improved rubric extraction to support both standalone rubrics and assignment‑embedded rubric structures.
- Added stable **course‑level rubric_association** for PUT requests (no assignment ID needed).
- Cleaned composite criterion IDs (e.g., `"2590_5399"` → `"5399"`) for PUT compatibility.
- Added **minimal console logging** at key checkpoints (fetching rubric, updating titles, sending PUT).
- Script now reliably updates rubrics whether attached or unattached.

### **v1.0.0 — Initial Release**
- Added Tampermonkey userscript for updating Canvas rubric rating titles.  
- Introduced **Update Titles** button on rubric pages.  
- Implemented safe API-based rubric fetching and updating.  
- Added automatic skipping of Outcome-linked criteria.  
- Included customizable `ratingTitles` array for future terminology changes.  
- Supported domains: `uwoms.instructure.com` and `earlyedu.instructure.com`.  
