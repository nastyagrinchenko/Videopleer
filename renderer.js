const { ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {});

document.getElementById('upload').addEventListener('click', () => {
    ipcRenderer.send('fileUpload');
});

document.getElementById('switch').addEventListener('click', e => {
    ipcRenderer.invoke('styleChanged');
})
