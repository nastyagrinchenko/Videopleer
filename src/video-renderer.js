const { ipcRenderer } = require('electron');

let duration;

window.addEventListener('DOMContentLoaded', () => {
    ipcRenderer.send('pathRequested');

    document.getElementById('progress').value = 0;
    setInterval(() => {
        document.getElementById('progress').value = document.getElementById('video').currentTime / duration * 100;
    }, 500);

    document.getElementById('video').addEventListener('loadedmetadata', e => {
        ipcRenderer.invoke('metaLoaded', { metaWidth: e.target.videoWidth, metaHeight: e.target.videoHeight });
        duration = e.target.duration;
    });

    document.getElementById('hover-block').addEventListener('mouseenter', e => {
        if (document.getElementById('control').hidden) {
            setTimeout(() => {
                document.getElementById('control').hidden = false;
            }, 50);
        }
    });

    document.getElementById('hover-block').addEventListener('mouseleave', e => {
        if (!document.getElementById('control').hidden) {
            setTimeout(() => {
                document.getElementById('control').hidden = true;
            }, 2000);
        }
    });

    document.getElementById('play').addEventListener('click', e => {
        document.getElementById('video').play();
    });

    document.getElementById('pause').addEventListener('click', e => {
        document.getElementById('video').pause();
    });

    document.getElementById('mute').addEventListener('click', e => {
        document.getElementById('video').muted = !document.getElementById('video').muted;
        document.getElementById('volume').value = document.getElementById('video').muted ? 0 : 30;
        document.getElementById('video').volume = document.getElementById('video').muted ? 0 : 30 / 100;
    });

    document.getElementById('fs').addEventListener('click', e => {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            document.getElementById('video').requestFullscreen();
        }
    });

    document.addEventListener('fullscreenchange', e => {
        if (!document.fullscreenElement) {
            ipcRenderer.invoke('leavedFS');
        }
    });

    document.getElementById('volume').addEventListener('change', e => {
        document.getElementById('video').volume = e.target.value / 100;
    });

    document.getElementById('progress').addEventListener('change', e => {
        document.getElementById('video').currentTime = e.target.value * duration / 100;
    });

    document.getElementById('video').addEventListener('click', e => {
        e.target.paused ? e.target.play() : e.target.pause();
    });
    document.getElementById('video').addEventListener('dblclick', e => {
        document.fullscreenElement ? document.exitFullscreen() : e.target.requestFullscreen();
    });
});

ipcRenderer.on('pathGiven', (e, path) => {
    video = document.getElementById('video')
    video.src = path;
    document.title = path;
});

document.onkeydown = function(e) {
    video = document.getElementById('video');
    console.log(e.keyCode);
    switch (e.keyCode) {
        case 32:
            video.paused ? video.play() : video.pause();
            break;
        case 77:
            console.log(e.keyCode);
            document.getElementById('mute').dispatchEvent(new Event('click'));
            break;
        case 70:
            document.getElementById('fs').dispatchEvent(new Event('click'));
            break;
        case 37:
            console.log(e.keyCode);
            document.getElementById('video').currentTime -= 5;
            break;
        case 39:
                document.getElementById('video').currentTime += 5;
            break;
        case 27:
            ipcRenderer.invoke('quitVideo');
            break;
        default:
            break;
    }
};
