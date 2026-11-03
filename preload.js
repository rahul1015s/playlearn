const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('api', {
  list: () => ipcRenderer.invoke('courses:list'),
  get: (id) => ipcRenderer.invoke('courses:get', id),
  save: (c) => ipcRenderer.invoke('courses:save', c),
  remove: (id) => ipcRenderer.invoke('courses:delete', id),
  importPlaylist: (url) => ipcRenderer.invoke('courses:import', url),
  playerOp: (op, arg) => ipcRenderer.invoke('player:op', op, arg),
  dnd: (on) => ipcRenderer.invoke('dnd:set', on),
  openExternal: (u) => ipcRenderer.invoke('open-external', u),
  onStatus: (cb) => ipcRenderer.on('import-status', (_e, m) => cb(m)),
  onIncomingUrl: (cb) => ipcRenderer.on('incoming-url', (_e, u) => cb(u)),
});
