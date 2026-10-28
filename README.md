# Jobfolio – Job Tracker

A simple, private job application tracker for your iPhone. It works in Safari and you can add it to your home screen like a normal app.

- Add jobs with title, company, location, dates, advert link, cover letter, contact and notes
- Statuses: Applied, Heard back, Interview, Offer, Rejected, No response
- Jobs closing within 7 days are flagged, and so are applications with no reply after 7 days
- The list is sorted by urgency and has a search box
- Everything is saved on your phone. There are no accounts and nothing to pay for
- Export a spreadsheet backup (.csv) and restore from it later

---

## Putting it online for free with GitHub Pages

The app's code is already in this repository. You only need to switch on GitHub Pages once.

1. On a computer or your phone, go to **github.com** and open this repository (`job-tracker`).
2. Tap **Settings** (the gear icon along the top. On a phone you may need to scroll that row sideways).
3. In the left-hand menu, tap **Pages**.
4. Under **Build and deployment** → **Source**, choose **Deploy from a branch**.
5. Under **Branch**, choose **main**, leave the folder as **/ (root)** and tap **Save**.
6. Wait 1–2 minutes and refresh the page. A box appears saying **"Your site is live at …"**. That link is your app. It will look like:
   `https://YOUR-GITHUB-USERNAME.github.io/job-tracker/`

> GitHub Pages is free for **public** repositories. If your repository is private, it will ask you to make it public first (Settings → General → Danger Zone → Change visibility). That only makes the *code* public. Your job list stays on your phone and is never uploaded.

## Adding it to your iPhone home screen

1. Open the link from step 6 in **Safari**.
2. Tap the **Share** button (the square with an arrow pointing up).
3. Scroll down and tap **Add to Home Screen**, then tap **Add**.
4. The purple **Jobfolio** icon is now on your home screen. Open it from there and it runs full-screen, like a normal app.

**Important:** the home screen app and the Safari tab keep **separate** lists. iPhones work this way. Choose one and stick with it. The home screen app is the better choice.

## Backing up

Tap the **•••** button at the top right → **Export spreadsheet**. Your phone's share sheet opens so you can **Save to Files**, email it to yourself, and so on. The file opens in Excel, Numbers or Google Sheets.

If you change phones or lose your data, tap **•••** → **Restore from backup** and pick that file.

## Making changes later

If you edit the files in this repository, GitHub Pages republishes the site automatically within a minute or two. Your saved jobs are not affected.

## What's in this folder

| File | What it does |
|---|---|
| `index.html` | The page layout |
| `styles.css` | Colours, spacing, dark mode and animations |
| `app.js` | How the app works: saving, sorting, reminders and export |
| `manifest.webmanifest`, `icons/` | App name and icon for the home screen |
| `sw.js` | Lets the app open even without internet |
