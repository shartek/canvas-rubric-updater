# canvas-rubric-updater

A Tampermonkey userscript that updates Canvas rubric rating titles to the EarlyEdU standard.

👉 **Install the script:**  
https://github.com/shartek/canvas-rubric-updater/raw/main/rubric-updater.user.js

This tool is designed for instructors and course designers who maintain multiple rubrics across Canvas courses and want a fast, safe way to update legacy rating labels (Accomplished, Satisfactory, Excellent, etc.) to the current EarlyEdU feedback-forward standard:

**Expected · Acceptable · Developing · Beginning**

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

EarlyEdU rubrics have evolved over time, and many older courses still contain rating labels such as:

- Accomplished  
- Satisfactory  
- Excellent  
- Complete  
- Incomplete  

These labels no longer match the current feedback-forward model.

Updating them manually is tedious and error-prone — especially across dozens of rubrics.

This script automates the repetitive part while keeping you in control of each rubric.  
You still open the rubric and verify the update, but you no longer have to click-click-paste-click-click for every criterion.

---

## 🚀 Installation (Tampermonkey)

1. Install the Tampermonkey browser extension (Chrome, Edge, Firefox).
2. Click **Add new script**.
3. Paste the contents of `rubric-updater.user.js` into the editor.
4. Save.
5. Navigate to any Canvas rubric page:
6. Look for the **Update Titles** button under the Edit/Delete buttons.

---

## 🔧 Customizing Rating Titles

Inside the script, you’ll find:

```javascript
var ratingTitles = ['Expected', 'Acceptable', 'Developing', 'Beginning'];

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

### **v1.0.0 — Initial Release**
- Added Tampermonkey userscript for updating Canvas rubric rating titles.  
- Introduced **Update Titles** button on rubric pages.  
- Implemented safe API-based rubric fetching and updating.  
- Added automatic skipping of Outcome-linked criteria.  
- Included customizable `ratingTitles` array for future terminology changes.  
- Supported domains: `uwoms.instructure.com` and `earlyedu.instructure.com`.  
