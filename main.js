'use strict';
const {app, BrowserWindow} = require('electron');

const path = require('path')
const url = require('url')
const pug = require('electron-pug')({pretty: true}, {});


let mainWindow


function createWindow () {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 500,
    resizable: true,
    minHeight: 300,
    minWidth: 600,
    frame: true
  });

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.pug'),
    protocol: 'file:',
    slashes: true
  }))

  // mainWindow.webContents.openDevTools()

  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

app.on('browser-window-created',function(e,window) {
  window.setMenu(null);
});

app.on('ready', createWindow)

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
})
