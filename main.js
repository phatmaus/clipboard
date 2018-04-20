'use strict';

const electron = require("electron");
const { app, BrowserWindow, Tray, globalShortcut, dialog, clipboard, Menu } = electron;
const constants = require("./constants.js")();
const fbFuncs = require("./firebaseFunctions");
const firebase = fbFuncs.firebaseInit();
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

global.pugData = {
  defNum: constants.ui.displayLimit,
  maxLength: constants.firebase.maxLength
};
const pug = require('electron-pug')({ pretty: true }, global.pugData);

menubar.app = app;

app.on('browser-window-created', function (e, window) {
  window.setMenu(null);
});

app.on('ready', function () {
  screen = electron.screen;
  initOpts();
  initMenuBar();
  globalShortcut.register(constants.globalHotKeyCombo, function () {
    toggleWindow();
  });
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
  let newMainWindow = new BrowserWindow({
    width: constants.width,
    height: constants.height,
    resizable: false,
    frame: false
  });

  newMainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.pug'),
    protocol: 'file:',
    slashes: true
  }));

  mainWindow = newMainWindow;
}

function toggleWindow() {
  if (mainWindow && mainWindow.isVisible()) {
    hideWindow();
  } else {
    getData();
  }
}

function getData() {
  let jargon = fbFuncs.getRef(clipboard.readText());
  if (jargon === "") {
    global.pugData.defData = constants.firebase.emptyDef;
    showWindow();
  } else {
    firebase.ref(`${constants.firebase.key}/${jargon}`)
      .once('value')
      .then(function (snapshot) {
        let defData = snapshot.val();
        global.pugData.defData = defData === null ? constants.firebase.emptyDef : defData;
        showWindow();
      })
      .catch(function (error) {
        dialog.showErrorBox(constants.errors.errorDailogTitle, constants.errors.connectionErrorMessage);
      });
  }
}

function showWindow() {
  let oldMainWindow = mainWindow;
  createWindow();
  oldMainWindow && oldMainWindow.close();
}

function hideWindow() {
  if (!mainWindow) {
    return;
  }
  mainWindow.hide();
}
