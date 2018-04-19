'use strict';
const { app, BrowserWindow } = require('electron');

const path = require('path')
const url = require('url')
const pug = require('electron-pug')({ pretty: true }, {});
var events = require('events');
var fs = require('fs');

let opts;
let mainWindow;

var menubar = new events.EventEmitter();
menubar.app = app;

app.on('browser-window-created', function (e, window) {
  window.setMenu(null);
});

if (app.isReady()) {
  createWindow()
} else {
  app.on('ready', createWindow)
}

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
});

menubar.setOption = function (opt, val) {
  opts[opt] = val;
}

menubar.getOption = function (opt) {
  return opts[opt];
}

function initMenuBar() {
  if (typeof opts === 'undefined') {
    opts = { dir: app.getAppPath() };
  } else if (typeof opts === 'string') {
    opts = { dir: opts }
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

  var iconPath = opts.icon || path.join(opts.dir, 'IconTemplate.png');
  var cachedBounds // cachedBounds are needed for double-clicked event
  var defaultClickEvent = opts.showOnRightClick ? 'right-click' : 'click';

  menubar.tray = opts.tray || new Tray(iconPath);
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

  function clicked (e, bounds) {
    if (e.altKey || e.shiftKey || e.ctrlKey || e.metaKey || (mainWindow && mainWindow.isVisible())) {
      return hideWindow();
    }
    cachedBounds = bounds || cachedBounds;
    showWindow(cachedBounds);
  }
}

function createWindow() {
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
  }));

  mainWindow.on('closed', function () {
    mainWindow = null
  });
}

function showWindow (trayPos) {
  if (supportsTrayHighlightState) {
    menubar.tray.setHighlightMode('always');
  }
  if (!menubar.window) {
    createWindow();
  }

  menubar.emit('show');

  if (trayPos && trayPos.x !== 0) {
    // Cache the bounds
    cachedBounds = trayPos;
  } else if (cachedBounds) {
    // Cached value will be used if showWindow is called without bounds data
    trayPos = cachedBounds;
  } else if (menubar.tray.getBounds) {
    // Get the current tray bounds
    trayPos = menubar.tray.getBounds();
  }

  // Default the window to the right if `trayPos` bounds are undefined or null.
  var noBoundsPosition = null;
  if ((trayPos === undefined || trayPos.x === 0) && opts.windowPosition.substr(0, 4) === 'tray') {
    noBoundsPosition = (process.platform === 'win32') ? 'bottomRight' : 'topRight';
  }

  var position = menubar.positioner.calculate(noBoundsPosition || opts.windowPosition, trayPos);

  var x = (opts.x !== undefined) ? opts.x : position.x;
  var y = (opts.y !== undefined) ? opts.y : position.y;

  mainWindow.setPosition(x, y)
  mainWindow.show();
  menubar.emit('after-show');
  return;
}

function hideWindow () {
  if (supportsTrayHighlightState) {
    menubar.tray.setHighlightMode('never');
  }
  if (!menubar.window) {
    return;
  }
  menubar.emit('hide')
  mainWindow.hide();
  menubar.emit('after-hide')
}

function windowClear () {
  delete menubar.window
  menubar.emit('after-close')
}

function emitBlur () {
  menubar.emit('focus-lost')
}
