const sectionPatterns = {
    pattern1: [
        ["i", "Intro", 8],
        ["v1", "Verse", 16],
        ["p", "PreChorus", 8],
        ["c1", "Chorus", 16],
        ["v2", "Verse", 16],
        ["p", "PreChorus", 8],
        ["c2", "Chorus", 16],
        ["b", "Bridge", 8],
        ["c3", "Chorus", 16],
        ["o", "Outro", 8]
    ],
    pattern2: [
        ["i", "Intro", 8],
        ["v1", "Verse", 16],
        ["c1", "Chorus", 8],
        ["v2", "Verse", 16],
        ["c2", "Chorus", 8],
        ["b", "Bridge", 8],
        ["c3", "Chorus", 8],
        ["o", "Outro", 8]
    ],
    pattern3: [
        ["i", "Intro", 8],
        ["v1", "Verse", 16],
        ["p1", "PreChorus", 8],
        ["c1", "Chorus", 16],
        ["v2", "Verse", 16],
        ["p2", "PreChorus", 8],
        ["c2", "Chorus", 16],
        ["b", "Bridge", 8],
        ["c3", "Chorus", 16],
        ["o", "Outro", 8]
    ],
    pattern4: [
        ["i", "Intro", 8],
        ["c", "Chorus", 8],
        ["v", "Verse", 16],
        ["p", "PreChorus", 4],
        ["c", "Chorus", 8],
        ["v", "Verse", 16],
        ["p", "PreChorus", 4],
        ["c", "Chorus", 8],
        ["o", "Outro", 8]
    ],
    pattern3_special: [
        ["Intro", "Intro", 8],
        ["Verse1", "Verse", 16],
        ["PreChorus1", "PreChorus", 8],
        ["Chorus1", "Chorus", 16],
        ["Verse2", "Verse", 16],
        ["PreChorus2", "PreChorus", 8],
        ["Chorus2", "Chorus", 16],
        ["Bridge", "Bridge", 8],
        ["Chorus3", "Chorus", 16],
        ["Outro", "Outro", 8]
    ],
};

const random = (min, max) => Math.random() * (max - min) + min
const randomColors = {
    "Intro": `rgba(${random(0, 255)}, ${random(0, 255)}, ${random(0, 255)}, 1)`,
    "Verse": `rgba(${random(0, 255)}, ${random(0, 255)}, ${random(0, 255)}, 1)`,
    "PreChorus": `rgba(${random(0, 255)}, ${random(0, 255)}, ${random(0, 255)}, 1)`,
    "Chorus": `rgba(${random(0, 255)}, ${random(0, 255)}, ${random(0, 255)}, 1)`,
    "Bridge": `rgba(${random(0, 255)}, ${random(0, 255)}, ${random(0, 255)}, 1)`,
    "Outro": `rgba(${random(0, 255)}, ${random(0, 255)}, ${random(0, 255)}, 1)`
}

function bars2sec(bars, bpm = 120, ppq = 96) {
    const totalTicks = bars * 16 * 24;
    return totalTicks * (60 / (bpm * ppq));
}

let currentPlayingAudio = null;
let currentPlayingBtn = null;

function stopPlaying() {
    if (currentPlayingAudio !== null) {
        currentPlayingAudio.pause();
        currentPlayingBtn.textContent = '▶'
    }
    currentPlayingAudio = null;
    currentPlayingBtn = null;
}

function createSampleWaveSurferCell(parent, audioUrl, desc) {
    // console.log(audioUrl)
    let audio_identifier = audioUrl.split('/')[2].split('.')[0]
    const waveId = `waveform_${audio_identifier}`;
    const btnId = `play_btn_${audio_identifier}`;

    parent.innerHTML = `
        ${desc}
        <div class="audio_wrapper">
            <button id="${btnId}" class="play_btn">▶</button>
            <div id="${waveId}" class="waveform"></div>
        </div>
    `;

    const wavesurfer = WaveSurfer.create({
        container: `#${waveId}`,
        waveColor: '#B1B1B1',
        progressColor: '#F6B094',
        barWidth: 2,
        interact: true,
        pixelRatio: 1,
        height: 40,
        cursorWidth: 2,
        cursorColor: "red",
        url: audioUrl,
        plugins: [
            WaveSurfer.Hover.create({
                lineColor: '#ff0000',
                lineWidth: 2,
                labelBackground: '#555',
                labelColor: '#fff',
                labelSize: '11px',
            }),
        ],
    });
    wavesurfer.on('finish', () => {
        if (currentPlayingAudio !== null) {
            currentPlayingBtn.textContent = '▶'
        }
        currentPlayingAudio = null;
        currentPlayingBtn = null;
    })
    let btnEle = document.getElementById(btnId)

    btnEle.addEventListener("click", function () {
        if (btnEle.textContent === "▶") {
            stopPlaying();
            btnEle.textContent = '◼';
            wavesurfer.play();
            currentPlayingAudio = wavesurfer;
            currentPlayingBtn = btnEle;
        } else {
            stopPlaying();
        }
    });
    return wavesurfer;
}

function createWaveSurferCell(parent, audioUrl, pattern) {
    let audio_seg = audioUrl.split("/")
    let name_seg = audio_seg[3].split(".")[0].split("_")
    let audio_identifier = audio_seg[1] + name_seg[0] + name_seg[1][0] + name_seg[2]
    const waveId = `waveform_${audio_identifier}`;
    const btnId = `play_btn_${audio_identifier}`;

    parent.innerHTML = `
        <div class="audio_wrapper">
            <button id="${btnId}" class="play_btn">▶</button>
            <div id="${waveId}" class="waveform"></div>
        </div>
    `;
    const regions = WaveSurfer.Regions.create()

    const wavesurfer = WaveSurfer.create({
        container: `#${waveId}`,
        waveColor: '#B1B1B1',
        progressColor: '#F6B094',
        barWidth: 2,
        interact: true,
        pixelRatio: 1,
        height: 40,
        cursorWidth: 2,
        cursorColor: "red",
        url: audioUrl,
        plugins: [
            WaveSurfer.Hover.create({
                lineColor: '#ff0000',
                lineWidth: 2,
                labelBackground: '#555',
                labelColor: '#fff',
                labelSize: '11px',
            }),
            regions
        ],
    });
    wavesurfer.on('decode', () => {
        let r_start = 0
        sectionPatterns[pattern].forEach(section => {
            regions.addRegion({
                start: r_start,
                // end: r_start + bars2sec(section[2]),
                content: section[0],
                color: randomColors[section[1]],
            })
            r_start += bars2sec(section[2])
        });
    })
    wavesurfer.on('finish', () => {
        if (currentPlayingAudio !== null) {
            currentPlayingBtn.textContent = '▶'
        }
        currentPlayingAudio = null;
        currentPlayingBtn = null;
    })
    let btnEle = document.getElementById(btnId)

    btnEle.addEventListener("click", function () {
        if (btnEle.textContent === "▶") {
            stopPlaying();
            btnEle.textContent = '◼';
            wavesurfer.play();
            currentPlayingAudio = wavesurfer;
            currentPlayingBtn = btnEle;
        } else {
            stopPlaying();
        }
    });
    return wavesurfer;
}

function createVideoDemoAudio(parent, audioUrl, pattern) {
    const waveId = `waveform_tomi_video_demo_audio`;
    const btnId = `play_btn_tomi_video_demo_audio`;

    parent.innerHTML = `
        <div class="audio_wrapper">
            <button id="${btnId}" class="play_btn">▶</button>
            <div id="${waveId}" class="waveform"></div>
        </div>
    `;
    const regions = WaveSurfer.Regions.create()

    const wavesurfer = WaveSurfer.create({
        container: `#${waveId}`,
        waveColor: '#B1B1B1',
        progressColor: '#F6B094',
        barWidth: 2,
        interact: true,
        pixelRatio: 1,
        height: 40,
        cursorWidth: 2,
        cursorColor: "red",
        url: audioUrl,
        plugins: [
            WaveSurfer.Hover.create({
                lineColor: '#ff0000',
                lineWidth: 2,
                labelBackground: '#555',
                labelColor: '#fff',
                labelSize: '11px',
            }),
            regions
        ],
    });
    wavesurfer.on('decode', () => {
        let r_start = 0
        sectionPatterns[pattern].forEach(section => {
            regions.addRegion({
                start: r_start,
                // end: r_start + bars2sec(section[2]),
                content: section[0],
                color: randomColors[section[1]],
            })
            r_start += bars2sec(section[2])
        });
    })
    wavesurfer.on('finish', () => {
        if (currentPlayingAudio !== null) {
            currentPlayingBtn.textContent = '▶'
        }
        currentPlayingAudio = null;
        currentPlayingBtn = null;
    })

    let btnEle = document.getElementById(btnId)

    btnEle.addEventListener("click", function () {
        if (btnEle.textContent === "▶") {
            stopPlaying();
            btnEle.textContent = '◼';
            wavesurfer.play();
            currentPlayingAudio = wavesurfer;
            currentPlayingBtn = btnEle;
        } else {
            stopPlaying();
        }
    });
    return wavesurfer;
}

function syncVisualizerWidth() {
    const players = document.querySelectorAll("midi-player");
    players.forEach(player => {
        const visualizer = document.querySelector(`#${player.getAttribute("visualizer").replace("#", "")}`);
        if (visualizer) {
            visualizer.style.width = `${player.clientWidth}px`;
        }
    });
}

window.addEventListener("load", syncVisualizerWidth);
window.addEventListener("resize", syncVisualizerWidth);

document.addEventListener("DOMContentLoaded", function () {
    const demo = document.getElementById("demo_table")
    const video_demo = document.getElementById("tomi_vda")
    const p1 = document.getElementById("table_pattern1");
    const p2 = document.getElementById("table_pattern2");
    const p3 = document.getElementById("table_pattern3");
    const p4 = document.getElementById("table_pattern4");
    const audioUrl = video_demo.getAttribute("data-audio-src");
    const pattern = video_demo.getAttribute("data-pattern");
    createVideoDemoAudio(video_demo, audioUrl, pattern);
    demo.querySelectorAll("td[data-audio-src]").forEach((cell) => {
        const audioUrl = cell.getAttribute("data-audio-src");
        const desc = cell.getAttribute('desc')
        createSampleWaveSurferCell(cell, audioUrl, desc);
    });
    p1.querySelectorAll("td[data-audio-src]").forEach((cell) => {
        const audioUrl = cell.getAttribute("data-audio-src");
        const pattern = cell.getAttribute("data-pattern");
        createWaveSurferCell(cell, audioUrl, pattern);
    });
    p2.querySelectorAll("td[data-audio-src]").forEach((cell) => {
        const audioUrl = cell.getAttribute("data-audio-src");
        const pattern = cell.getAttribute("data-pattern");
        createWaveSurferCell(cell, audioUrl, pattern);
    });
    p3.querySelectorAll("td[data-audio-src]").forEach((cell) => {
        const audioUrl = cell.getAttribute("data-audio-src");
        const pattern = cell.getAttribute("data-pattern");
        createWaveSurferCell(cell, audioUrl, pattern);
    });
    p4.querySelectorAll("td[data-audio-src]").forEach((cell) => {
        const audioUrl = cell.getAttribute("data-audio-src");
        const pattern = cell.getAttribute("data-pattern");
        createWaveSurferCell(cell, audioUrl, pattern);
    });
});
