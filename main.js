'use strict';
const electron = require("electron");
const { app, BrowserWindow, Tray, globalShortcut, dialog, clipboard, Menu } = electron;
const pug = require('electron-pug')({ pretty: true }, {});
const constants = require("./constants.js")();
const firebase = require("./firebaseFunctions")();
const path = require('path');
const url = require('url');
var events = require('events');
let menubar = new events.EventEmitter();
var fs = require('fs');
const Positioner = require('electron-positioner');
const extend = require('extend');

let opts;
let screen;
let mainWindow;
let supportsTrayHighlightState;
let definition = null;

menubar.app = app;

app.on('browser-window-created', function (e, window) {
  window.setMenu(null);
});

app.on('ready', function () {
  screen = electron.screen;
  initOpts();
  initMenuBar();
  globalShortcut.register(constants.globalHotKeyCombo, function () {
    showWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
});

app.on('activate', function () {

});

menubar.setOption = function (opt, val) {
  opts[opt] = val;
}

menubar.getOption = function (opt) {
  return opts[opt];
}

function initMenuBar() {
  initOpts();

  var iconPath = opts.icon || path.join(opts.dir, 'IconTemplate.png');
  var cachedBounds // cachedBounds are needed for double-clicked event
  var defaultClickEvent = opts.showOnRightClick ? 'right-click' : 'click';

  menubar.tray = new Tray(iconPath);
  menubar.tray.setContextMenu(new Menu.buildFromTemplate([
    {
      label: "quit",
      role: "quit"
    }
  ]));
  menubar.tray.on(defaultClickEvent, clicked);
  menubar.tray.on('double-click', clicked);
  menubar.tray.setToolTip(opts.tooltip);

  var supportsTrayHighlightState = false
  try {
    menubar.tray.setHighlightMode('never');
    supportsTrayHighlightState = true;
  } catch (e) {
    console.log(e);
  }

  function clicked(e, bounds) {
    if (e.altKey || e.shiftKey || e.ctrlKey || e.metaKey || (mainWindow && mainWindow.isVisible())) {
      return hideWindow();
    }
    cachedBounds = bounds || cachedBounds;
    showWindow(cachedBounds);
  }
}

function initOpts() {
  if (typeof opts === 'undefined') {
    opts = {
      dir: app.getAppPath()
    };
  } else if (typeof opts === 'string') {
    opts = {
      dir: opts
    };
  } else if (!opts.dir) {
    opts.dir = app.getAppPath();
  } else if (!(path.isAbsolute(opts.dir))) {
    opts.dir = path.resolve(opts.dir);
  }

  if (!opts.windowPosition) {
    opts.windowPosition = (process.platform === 'win32') ? 'trayBottomCenter' : 'trayCenter';
  }
  if (typeof opts.showDockIcon === 'undefined') {
    opts.showDockIcon = false;
  }

  // set width/height on opts to be usable before the window is created
  opts.width = opts.width || 800
  opts.height = opts.height || 500
  opts.tooltip = opts.tooltip || ''
  if (app.dock && !opts.showDockIcon) {
    app.dock.hide();
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: constants.width,
    height: constants.height,
    resizable: false,
    frame: false
  });

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.pug'),
    protocol: 'file:',
    slashes: true
  }));

  mainWindow.on('closed', function () {
    mainWindow = null;
  });

  menubar.positioner = new Positioner(mainWindow)

  mainWindow.on('blur', function () {
    hideWindow();
  })

}

function toggleWindow() {
  if (mainWindow && mainWindow.isVisible()) {
    hideWindow();
  } else {
    getData();
  }
}

function getData() {
  let jargon = clipboard.readText().toLowerCase().trim().replace(/[\/\.\#\$\[\] ]/g, 's');//invalid firebase key chars
  if(jargon === "") {
    definition = null;
    showWindow();
  } else {
    dialog.showErrorBox("", jargon);
    firebase.ref(`${constants.firebase.key}/${jargon}`)
    .once('value')
    .then(function (data) {
      definition = data.val();
      showWindow();
    })
    .catch(function (error) {
      dialog.showErrorBox(constants.errors.errorDailogTitle, constants.errors.connectionErrorMessage);
    });
  }
  
}

function showWindow() {
  if (supportsTrayHighlightState) {
    menubar.tray.setHighlightMode('always');
  }
  if (!mainWindow) {
    createWindow();
  }

  menubar.emit('show');
  mainWindow.show();
  menubar.emit('after-show');
  return;
}

function hideWindow() {
  if (supportsTrayHighlightState) {
    menubar.tray.setHighlightMode('never');
  }
  if (!mainWindow) {
    return;
  }
  mainWindow.hide();  
}

function windowClear() {
  mainWindow = null;
}
