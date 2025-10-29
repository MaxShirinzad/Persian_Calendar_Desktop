const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,  // عرض پنجره
    height: 800,  // ارتفاع پنجره
    minWidth: 1000,  // حداقل عرض
    minHeight: 700,  // حداقل ارتفاع
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false
    },
    center: true,  // نمایش پنجره در وسط صفحه
    show: true,   // ابتدا پنجره نشان داده نشود تا زمانی که آماده شود
    // icon: path.join(__dirname, 'assets/icon.png') // آیکون برنامه (اختیاری)
  });

  //win.loadURL('http://localhost:5173'); // Vite dev server
  win.loadFile(path.join(__dirname, 'dist/index.html'));
}

app.whenReady().then(createWindow);
