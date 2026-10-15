# Student Attendance Management System

A simple browser-based Student Attendance Management System built with HTML, CSS and JavaScript.

## Features
- Add students with roll number, name, class and section
- Search students
- Mark attendance as Present, Absent or Late for a selected date
- View attendance records and summary statistics
- Filter records by date and class
- Export attendance records to CSV
- Data is saved in this browser using localStorage

## Run locally
No installation or internet connection is required.

1. Open the `dist` folder.
2. Double-click `index.html` to open it in your browser.

Optional local server:
```bash
node server.cjs
```
Then open `http://localhost:4173`.

## Deploy
For static hosting (GitHub Pages, Netlify, etc.), publish **the contents of the `dist` folder**.

## Important limitations
- This is a frontend demo. Records are stored in the browser where you use the app.
- Data is not shared between devices or browsers.
- Clearing browser site data can remove saved records.
- It does not include server-side login, cloud database or automatic backups.
- Attendance exports are CSV files, suitable for opening in Excel.

Use sample data for testing. Do not enter sensitive student information into a public demo.
