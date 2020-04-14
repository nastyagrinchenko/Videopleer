// Modules to control application life and create native browser window
const { app, BrowserWindow, BrowserView, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let video;
let currentCSS;
let style = 'style';
let factor = 16/9;
let barSize = 0;
let videoFormats = new Array('mp4', 'webm', 'avi', 'mkv', 'MOV');
let widthReduce = Math.round(barSize*9/16);
let HBounds = {minW: 700, minH: Math.round(700*1/factor), maxW: 1520 - widthReduce, maxH: Math.round(1520*1/factor) + barSize};
let VBounds = {minW: Math.round(500*1/factor), minH: 500, maxW: Math.round(1020*1/factor) - widthReduce, maxH: 1020};

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 250,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
    },
  });
  mainWindow.loadFile('index.html');
  mainWindow.setMenuBarVisibility(false);
  mainWindow.webContents.on('did-finish-load', e => {
    fs.readFile(__dirname + '/public/css/style.css', 'utf8', async (err, data) => {
      currentCSS = await mainWindow.webContents.insertCSS(data);
    });
  });

  mainWindow.on('resize', e => {
    bounds = mainWindow.getBounds();
    if (!mainWindow.isMaximized() && !mainWindow.isFullScreen()) {
      setTimeout(() => mainWindow.setBounds({height: Math.round(1/factor*bounds.width) + barSize}), 100);
    }
  });

  mainWindow.on('enter-full-screen', e => {
    mainWindow.maximize();
  });
  // and load the index.html of the app.
  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

ipcMain.on('fileUpload', e => {
  dialog.showOpenDialog(mainWindow, { filters: { name: 'Movies', extensions: ['mkv', 'avi', 'mp4'] }, properties: ['openFile'] })
    .then(result => {
      if (validateVideo(result.filePaths[0])) {
        openVideo(result.filePaths[0]);
      } else {
        throw new Error('Invaild file format');
      }
    })
    .catch(err => console.log(err));
});

ipcMain.on('pathRequested', e => {
  e.reply('pathGiven', video);
});

ipcMain.handle('metaLoaded', (e, data) => {
    factor = data.metaWidth/data.metaHeight;
    factor > 1 ? mainWindow.setBounds({width: HBounds.minW, height: HBounds.minH + barSize}) : mainWindow.setBounds({width: VBounds.minW, height: VBounds.minH});
    factor > 1 ? mainWindow.setMinimumSize(HBounds.minW, HBounds.minH) : mainWindow.setMinimumSize(VBounds.minW, VBounds.minH);
    factor > 1 ? mainWindow.setMaximumSize(HBounds.maxW, HBounds.maxH) : mainWindow.setMaximumSize(VBounds.maxW, VBounds.maxH);
    if (factor > 1) {
      fs.readFile(__dirname + '/public/css/horizontal.css', 'utf8', (err, data) => mainWindow.webContents.insertCSS(data))
    } else {
      fs.readFile(__dirname + '/public/css/vertical.css', 'utf8', (err, data) => mainWindow.webContents.insertCSS(data));
    }
});

ipcMain.handle('leavedFS', e => {
  mainWindow.unmaximize();
  mainWindow.setMenuBarVisibility(false);
});

ipcMain.handle('styleChanged', e => {
  style == 'style' ? style = 'style-min' : style = 'style';
  mainWindow.webContents.removeInsertedCSS(currentCSS);
  fs.readFile(__dirname + '/public/css/' + style + '.css', 'utf8', async (err, html) => {
    currentCSS = await mainWindow.webContents.insertCSS(html);
  });
});

ipcMain.handle('quitVideo', e => {
  mainWindow.loadFile('index.html');
  style = 'style';
});

function validateVideo(videoPath) {
  pathArray = videoPath.split('.');
  return videoFormats.includes(pathArray[pathArray.length - 1]);
}

function openVideo(videoPath) {
  video = videoPath;
  mainWindow.webContents.loadURL('file://' + __dirname + '/src/player.html').then(e => {
    style == 'style-min'
    ? mainWindow.webContents.insertCSS('#mute {display:none;} #fs {display:none;}')
    : mainWindow.webContents.insertCSS('#mute {display:block;} #fs {display:block;}');
  });
}


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow).catch(error => {
  console.log(error);
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit()
});

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
});
