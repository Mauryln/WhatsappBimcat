const EXTENSION_WINDOW_TYPE = "popup";
const EXTENSION_WINDOW_WIDTH = 480;
const EXTENSION_WINDOW_HEIGHT = 700;
let extensionWindowId = null;

chrome.action.onClicked.addListener(async () => {
  // Buscar si ya hay una ventana de la extensión abierta
  if (extensionWindowId !== null) {
    try {
      const win = await chrome.windows.get(extensionWindowId);
      if (win) {
        chrome.windows.update(extensionWindowId, { focused: true });
        return;
      }
    } catch (e) {
      extensionWindowId = null;
    }
  }

  // Si no hay ventana, abre una nueva y guarda su ID
  chrome.windows.create({
    url: chrome.runtime.getURL("popup.html"),
    type: EXTENSION_WINDOW_TYPE,
    width: EXTENSION_WINDOW_WIDTH,
    height: EXTENSION_WINDOW_HEIGHT,
    focused: true
  }, (win) => {
    extensionWindowId = win.id;
  });
});

chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === extensionWindowId) {
    extensionWindowId = null;
  }
});