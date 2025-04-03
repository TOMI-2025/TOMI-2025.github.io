---
# Feel free to add content and custom Front Matter to this file.
# To modify the layout, see https://jekyllrb.com/docs/themes/#overriding-theme-defaults

layout: home
---

<head>
    <link rel="stylesheet" href="styles.css">
    <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
    <script src="https://unpkg.com/wavesurfer.js@7"></script>
    <script src="https://unpkg.com/wavesurfer.js@7/dist/plugins/regions.min.js"></script>
    <script src="https://unpkg.com/wavesurfer.js@7/dist/plugins/hover.min.js"></script>
    <script src="https://cdn.jsdelivr.net/combine/npm/tone@14.7.58,npm/@magenta/music@1.23.1/es6/core.js,npm/focus-visible@5,npm/html-midi-player@1.5.0"></script>
    <script src="{{ '/assets/js/audio_playback.js' | relative_url }}"></script>
</head>

This is the demo page for the paper: _TOMI: Transforming and Organizing Music Ideas for Multi-Track Compositions with Full-Song Structure_. We propose the TOMI (Transforming and Organizing Music Ideas) paradigm for high-level music data representation. 
TOMI models a musical piece as a sparse, four-dimensional space defined by **clips** (short audio or MIDI segments), 
**sections** (temporal positions), **tracks** (instrument layers), and **transformations** (elaboration methods). 
Based on this, we achieve the first electronic music generation system 
to produce long-term, multi-track compositions containing both MIDI and audio clips, while achieving **robust structural consistency** and **high music quality**. We use 
a foundation text-based large language model (LLM) with TOMI data structure and achieve multi-track electronic music generation with full-song structure through **in-context-learning** (ICL) and sample retrieval. 
Moreover, we integrate
TOMI with the REAPER digital audio workstation (DAW) to provide an interactive workflow and exports audio of high-resolution. 


Here is the outline of this page:

1. [**Demo and Analysis**] (#demo-and-analysis)
2. [**Digital Audio Workstation Integration**] (#digital-audio-workstation-integration) (Video demo)
3. [**More Examples with Comparison**] (#more-examples-with-comparison) (All Audios used in our experiments)

<div class="center-stuff"><img src="/assets/pics/tomi_structure.jpg" style="width:600px" alt=""></div>
<p align="center"><strong>Concept hierarchy in TOMI</strong>: <em>music ideas</em>, which are developed from features into music clips, are transformed and integrated into the <em>final composition</em> organized by sections and tracks.</p>


---
<a id="demo-and-analysis"></a>
## Demo and Analysis
In this part, let's first see an example of music segment showing on a digital audio workstation (DAW) software:

<div class="center-stuff"><img src="/assets/pics/daw_representation.jpg" style="width:1000px" alt=""></div>

Through this representation, we can see the music is arranged on a canvas with the **timeline** as X-axis and **tracks** as Y-axis. Note that we put a 
marker _Section (8-bar)_ on the timeline to inform this part represents a section in music. There are 6 tracks, each track has a name representing 
the instrument or category of the clips on it. On the canvas, there are multiple **clips** classified as either **MIDI** (the top one) or **audio** clips (the others). Furthermore, 
there is a lot of duplications of clips, and they are placed onto the arrangement with **different patterns**. The kick audio is placed as a four-on-the-floor 
pattern, the clap is placed on the 2nd and 4th beats of every bar. By combining the kicks and the claps, we get a typical drum-loop pattern 
in _house_ music. The first and second tracks show a dancy MIDI chord progression and a guitar loop; the 5th track shows a audio sample-loop as a variation layer in the second-half of the section; and the 6th track shows two 
typical sound effects: a _riser_ and a _faller_ used for transitions between sections.

Let's have a listen to this section (8-bar) at 120BPM and 4/4 time signature:
<div class="audio_wrapper">
<button id="play_btn_full_demo" class="play_btn">▶</button>
<div id="waveform_full_demo" class="waveform"></div>
</div>

\\
Now, let's break down this piece and see how the data can be represented in TOMI data structure, we show the examples of applying transformations on raw clips in an **8-bar section**. 
In our implementation, we define 3 subclasses of transformations to handle different scenarios: (1) **Drum Transform** for one-shot drums, (2) **Fx Transform** for riser and faller sound effects, and (3) **General Transform** for other cases.
We use an _**action sequence**_ in transformations to control the rhythmic pattern, looping, and placement of clips within sections.
In _**action sequence**_ of **General Transform** and **Drum Transform**, we use "►" to denote the _**onset**_ state, "=" to 
denote the _**sustain**_ state, and "-" to denote the _**rest**_ state. Each state corresponds to an action 
at a step time within the section (eg. a bar has 16 steps in the 4/4 time signature). The _**onset**_ state means the clip will 
be replayed at this time, _**rest**_ means the clip will stop playing, and _**sustain**_ means to continue playing.
For **Fx Transform**, it is designed for riser and faller sound effects, so it only needs a _**placement**_ parameter to specify whether the 
clips are placed left- or right-aligned within sections. Then, its _**action sequence**_ is dynamically computed in the backend for each composition link.


Details are shown in the table below.

<div class="center-stuff">
    <table id="demo_table">
        <thead>
            <tr>
                <th class="table_col">Original Clip</th>
                <th class="table_col">Transformation</th>
                <th class="table_col">Result</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td class="audio_td" data-audio-src="audio/tomi_demos/raw_kick.mp3" desc="Audio - One-Shot Kick Drum"></td>
                <td class="audio_td" style="font-size: small">
                    Type: \(Drum\) \(Transform\), Length: 1-bar<br>
                    <pre>bar 1:    ►---►---►---►---</pre>
                    The Drum Transform  is designed for one-shot drum samples and it replays the clip once for each \(onset\) (►) state. In this example, the transformation firstly converts the drum sample to a 1-bar 4/4 kick pattern, then loop the pattern 8 times to match the 8-bar length of the section.
                </td>
                <td class="audio_td" data-audio-src="audio/tomi_demos/processed_kick.mp3" desc="Audio - 4/4 Beat Kick Loop (8-bar)"></td>
            </tr>
            <tr>
                <td class="audio_td" data-audio-src="audio/tomi_demos/raw_clap.mp3" desc="Audio - One-Shot Clap Drum"></td>
                <td class="audio_td" style="font-size: small">
                    Type: \(Drum\) \(Transform\), Length: 1-bar<br>
                    <pre>bar 1:    ----►-------►---</pre>
                    This transformation is similar to the previous example but creates a 2/4 beat pattern for the clap sample.
                </td>
                <td class="audio_td" data-audio-src="audio/tomi_demos/processed_clap.mp3" desc="Audio - 2/4 Beat Clap Loop (8-bar)"></td>
            </tr>
            <tr>
                <td class="audio_td" data-audio-src="audio/tomi_demos/raw_muted_guitar.mp3" desc="Audio - Muted Guitar Loop (4-bar)"></td>
                <td class="audio_td" style="font-size: small">
                    Type: \(General\) \(Transform\), Length: 1-bar<br>
                    <pre>bar 1:    ►===============</pre>
                    We want to play the clip in the entire section. This transformation firstly loop itself to match the length of the clip (4-bar), with the first \(onset\) state (►) in every segment after the first one being automatically converted to a \(sustain\) state (=). The action sequence then becomes: <br>
                    <pre>►=...= (63 x "=") -> 4 bars total</pre>
                    Next, since the transformation is still shorter than the section length (8-bar), it will loop again to match the section length, but this time the conversion from \(onset\) to \(sustain\) is not applied: <br>
                    <pre>►=...= (63 x "=")►=...= (63 x "=") -> 8 bars total</pre>
                    As a result, the 4-bar clip is played 2 times to fill the 8-bar section.
                </td>
                <td class="audio_td" data-audio-src="audio/tomi_demos/processed_muted_guitar.mp3" desc="Audio - Muted Guitar Loop (8-bar)"></td>
            </tr>
            <tr>
                <td class="audio_td" data-audio-src="audio/tomi_demos/raw_lofi_piano.mp3" desc="Audio - LoFi Piano Loop (8-bar)"></td>
                <td class="audio_td" style="font-size: small">
                    Type: \(General\) \(Transform\), Length: 8-bar<br>
                    <pre>bar 1:    ================<br>bar 2:    ================<br>bar 3:    ================<br>bar 4:    ================<br>bar 5:    ►===============<br>bar 6:    ================<br>bar 7:    ================<br>bar 8:    ================<br></pre>
                    We have an 8-bar clip but we want to play only the last 4 bars of it in the section. In this case, we can prepend the \(onset\) state with 4 bars of \(sustain\) states. If there is no \(onset\) state before a \(sustain\) state, the \(sustain\) also triggers the clip to start playing but muted, the clip will be unmuted until the first \(onset\) state.<br>(On the contrary, if there is a \(onset\) before the \(sustain\) states, a new \(onset\) state will cause the clip to be replayed.)
                </td>
                <td class="audio_td" data-audio-src="audio/tomi_demos/processed_lofi_piano.mp3" desc="Audio - LoFi Piano Loop (8-bar)"></td>
            </tr>
            <tr>
                <td class="audio_td">
                    <div class="midi_wrapper">
                        MIDI - Chord Progression (8-bar)
                        <midi-player src="/audio/tomi_demos/raw_midi.mid" sound-font visualizer="#raw_midi"> </midi-player>
                        <midi-visualizer src="/audio/tomi_demos/raw_midi.mid" type="piano-roll" id="raw_midi"> </midi-visualizer>
                    </div>
                </td>
                <td class="audio_td" style="font-size: small">
                    Type: \(General\) \(Transform\), Length: 4-bar<br>
                    <pre>bar 1:    ►=-=----==-=--=-<br>bar 2:    =-=--=--==-=--=-<br>bar 3:    ==-=----==-=----<br>bar 4:    ==-=--=-==-==-=-</pre>
                    We want to apply some complex chopping to the clip to make it rhythmic. The action sequence is dynamically looped to match the clip's length first (with the first \(onset\) state (►) in the second looped segment converted to a \(sustain\) state (=) as well):<br>
                    <pre>bar 1:    ►=-=----==-=--=-<br>bar 2:    =-=--=--==-=--=-<br>bar 3:    ==-=----==-=----<br>bar 4:    ==-=--=-==-==-=-<br>bar 5:    ==-=----==-=--=-<br>bar 6:    =-=--=--==-=--=-<br>bar 7:    ==-=----==-=----<br>bar 8:    ==-=--=-==-==-=-</pre>
                    We use multiple \(rest\) states to mute certain parts to make the clip sounds groovy.
                </td>
                <td class="audio_td">
                    <div class="midi_wrapper">
                        MIDI - Rhythmic Chord Progression (8-bar)
                        <midi-player src="/audio/tomi_demos/processed_midi.mid" sound-font visualizer="#processed_midi"> </midi-player>
                        <midi-visualizer src="/audio/tomi_demos/processed_midi.mid" type="piano-roll" id="processed_midi"> </midi-visualizer>
                    </div>
                </td>
            </tr>
            <tr>
                <td class="audio_td" data-audio-src="audio/tomi_demos/raw_downlifter.mp3" desc="Audio - Downlifter Fx"></td>
                <td class="audio_td" style="font-size: small">
                    Type: \(Fx\) \(Transform\)<br>
                    <pre>placement:    START</pre>
                    The \(Fx\) transformation is designed for sound effects like risers and fallers, these samples are placed in either the beginning or the end of the section, therefore the \(Fx\) transformation does not require an \(action\) \(sequence\) but a \(placement\) attribute to indicate the clip position. In this case, the faller sample is placed in the beginning of the section.
                </td>
                <td class="audio_td" data-audio-src="audio/tomi_demos/processed_downlifter.mp3" desc="Audio - Downlifter Fx (8-bar)"></td>
            </tr>
            <tr>
                <td class="audio_td" data-audio-src="audio/tomi_demos/raw_sweep.mp3" desc="Audio - SweepUp Fx"></td>
                <td class="audio_td" style="font-size: small">
                    Type: \(Fx\) \(Transform\)<br>
                    <pre>placement:    END</pre>
                    The riser clip SweepUp needs to be placed at the end of the section, which means the clip end should be aligned with the section end, we can simply use this transformation to dynamically calculate the correct start timing for each associated clip.
                </td>
                <td class="audio_td" data-audio-src="audio/tomi_demos/processed_sweep.mp3" desc="Audio - SweepUp Fx (8-bar)"></td>
            </tr>
        </tbody>
    </table>
    <script>
        const wavesurfer = WaveSurfer.create({
            container: `#waveform_full_demo`,
            waveColor: '#B1B1B1',
            progressColor: '#F6B094',
            barWidth: 2,
            interact: true,
            pixelRatio: 1,
            height: 40,
            cursorWidth: 2,
            cursorColor: "red",
            url: "/audio/tomi_demos/full_section.mp3",
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
            });
        let btnEle = document.getElementById("play_btn_full_demo");
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
    </script>
</div>

Thanks <a href="https://cifkao.github.io/html-midi-player/">html-midi-player</a> for the excellent MIDI visualization.

---
<a id="digital-audio-workstation-integration"></a>
## Digital Audio Workstation Integration
In this video, we demonstrate the process of translating a TOMI-based composition directly within the REAPER digital audio workstation, which offers comprehensive ReaScript APIs that allow for easy control through custom scripts.
Next, we demonstrate the user co-creation capability by manually adjusting virtual instruments and mixing parameters in REAPER. The full composition is played at the end of the video.

<div class="center-stuff">
    <video controls preload="metadata" width="800" src="tomi_demo.mp4"></video>
</div>

Here is the full music audio from the video:

<div id="tomi_vda" data-audio-src="audio/tomi_demos/tomi_pattern3_C.mp3" data-pattern="pattern3_special"></div>

<br>

---
<a id="more-examples-with-comparison"></a>
## More Examples with Comparison
We prepare a MIDI database and an audio database for clip sample retrieval and use GPT-4o to generate compositions in the TOMI schema.
We compare our method with a baseline method and two ablations in electronic music generation, including **MusicGen**, **Standalone LLM (TOMI w/o Composition Links)**, and **Random (TOMI w/o LLM)**, as discussed in our paper.
This section presents all 128 compositions used in our experiments, with 32 compositions for each of the 4 section sequences.
The prompt structures are provided at the end of this section.

##### <center> \( \textbf{Structure 1: } \) \( \text{intro(8b)} \) \( \rightarrow \) \( \text{verse 1(16b)} \) \( \rightarrow \) \( \text{pre-chorus(8b)} \) \( \rightarrow \) \( \text{chorus 1(16b)} \) \( \rightarrow \) \( \text{verse 2(16b)} \) \( \rightarrow \) \( \text{pre-chorus(8b)} \) \( \rightarrow \) \( \text{chorus 2(16b)} \) \( \rightarrow \) \( \text{bridge(8b)} \) \( \rightarrow \) \( \text{chorus 3(16b)} \) \( \rightarrow \) \( \text{outro(8b)} \)
<div class="center-stuff">
<table id="table_pattern1">
    <thead>
        <tr>
            <th class="slash-wrap">
                <span class="left">Key</span>
                <span class="slash"></span>
                <span class="right">Structure</span>
            </th>
            <th class="table_col">MusicGen</th>
            <th class="table_col">Standalone LLM</th>
            <th class="table_col">Random</th>
            <th class="table_col">TOMI</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td class="col-name" rowspan="2">C major<br>/<br>A minor</td>
            <td class="audio_td" data-audio-src="audio/musicgen/pattern1/pattern1_C_1.mp3" data-pattern="pattern1"></td>
            <td class="audio_td" data-audio-src="audio/llm/pattern1/pattern1_C_1.mp3" data-pattern="pattern1"></td>
            <td class="audio_td" data-audio-src="audio/random/pattern1/pattern1_C_1.mp3" data-pattern="pattern1"></td>
            <td class="audio_td" data-audio-src="audio/tomi/pattern1/pattern1_C_1.mp3" data-pattern="pattern1"></td>
        </tr>
        <tr>
            <td class="audio_td" data-audio-src="audio/musicgen/pattern1/pattern1_C_2.mp3" data-pattern="pattern1"></td>
            <td class="audio_td" data-audio-src="audio/llm/pattern1/pattern1_C_2.mp3" data-pattern="pattern1"></td>
            <td class="audio_td" data-audio-src="audio/random/pattern1/pattern1_C_2.mp3" data-pattern="pattern1"></td>
            <td class="audio_td" data-audio-src="audio/tomi/pattern1/pattern1_C_2.mp3" data-pattern="pattern1"></td>
        </tr>
        <tr>
            <td class="col-name" rowspan="2">F major<br>/<br>D minor</td>
            <td class="audio_td" data-audio-src="audio/musicgen/pattern1/pattern1_F_1.mp3" data-pattern="pattern1"></td>
            <td class="audio_td" data-audio-src="audio/llm/pattern1/pattern1_F_1.mp3" data-pattern="pattern1"></td>
            <td class="audio_td" data-audio-src="audio/random/pattern1/pattern1_F_1.mp3" data-pattern="pattern1"></td>
            <td class="audio_td" data-audio-src="audio/tomi/pattern1/pattern1_F_1.mp3" data-pattern="pattern1"></td>
        </tr>
        <tr>
            <td class="audio_td" data-audio-src="audio/musicgen/pattern1/pattern1_F_2.mp3" data-pattern="pattern1"></td>
            <td class="audio_td" data-audio-src="audio/llm/pattern1/pattern1_F_2.mp3" data-pattern="pattern1"></td>
            <td class="audio_td" data-audio-src="audio/random/pattern1/pattern1_F_2.mp3" data-pattern="pattern1"></td>
            <td class="audio_td" data-audio-src="audio/tomi/pattern1/pattern1_F_2.mp3" data-pattern="pattern1"></td>
        </tr>
        <tr>
            <td class="col-name" rowspan="2">G major<br>/<br>E minor</td>
            <td class="audio_td" data-audio-src="audio/musicgen/pattern1/pattern1_G_1.mp3" data-pattern="pattern1"></td>
            <td class="audio_td" data-audio-src="audio/llm/pattern1/pattern1_G_1.mp3" data-pattern="pattern1"></td>
            <td class="audio_td" data-audio-src="audio/random/pattern1/pattern1_G_1.mp3" data-pattern="pattern1"></td>
            <td class="audio_td" data-audio-src="audio/tomi/pattern1/pattern1_G_1.mp3" data-pattern="pattern1"></td>
        </tr>
        <tr>
            <td class="audio_td" data-audio-src="audio/musicgen/pattern1/pattern1_G_2.mp3" data-pattern="pattern1"></td>
            <td class="audio_td" data-audio-src="audio/llm/pattern1/pattern1_G_2.mp3" data-pattern="pattern1"></td>
            <td class="audio_td" data-audio-src="audio/random/pattern1/pattern1_G_2.mp3" data-pattern="pattern1"></td>
            <td class="audio_td" data-audio-src="audio/tomi/pattern1/pattern1_G_2.mp3" data-pattern="pattern1"></td>
        </tr>
        <tr>
            <td class="col-name" rowspan="2">B\( \flat \) major<br>/<br>G minor</td>
            <td class="audio_td" data-audio-src="audio/musicgen/pattern1/pattern1_A%23_1.mp3" data-pattern="pattern1"></td>
            <td class="audio_td" data-audio-src="audio/llm/pattern1/pattern1_A%23_1.mp3" data-pattern="pattern1"></td>
            <td class="audio_td" data-audio-src="audio/random/pattern1/pattern1_A%23_1.mp3" data-pattern="pattern1"></td>
            <td class="audio_td" data-audio-src="audio/tomi/pattern1/pattern1_A%23_1.mp3" data-pattern="pattern1"></td>
        </tr>
        <tr>
            <td class="audio_td" data-audio-src="audio/musicgen/pattern1/pattern1_A%23_2.mp3" data-pattern="pattern1"></td>
            <td class="audio_td" data-audio-src="audio/llm/pattern1/pattern1_A%23_2.mp3" data-pattern="pattern1"></td>
            <td class="audio_td" data-audio-src="audio/random/pattern1/pattern1_A%23_2.mp3" data-pattern="pattern1"></td>
            <td class="audio_td" data-audio-src="audio/tomi/pattern1/pattern1_A%23_2.mp3" data-pattern="pattern1"></td>
        </tr>
    </tbody>
</table>
</div>

##### <center> \( \textbf{Structure 2: } \) \( \text{intro(8b)} \) \( \rightarrow \) \( \text{verse 1(16b)} \) \( \rightarrow \) \( \text{chorus 1(8b)} \) \( \rightarrow \) \( \text{verse 2(16b)} \) \( \rightarrow \) \( \text{chorus 2(8b)} \) \( \rightarrow \) \( \text{bridge(8b)} \) \( \rightarrow \) \( \text{chorus 3(8b)} \) \( \rightarrow \) \( \text{outro(8b)} \)
<div class="center-stuff">
<table id="table_pattern2">
    <thead>
        <tr>
            <th class="slash-wrap">
                <span class="left">Key</span>
                <span class="slash"></span>
                <span class="right">Structure</span>
            </th>
            <th class="table_col">MusicGen</th>
            <th class="table_col">Standalone LLM</th>
            <th class="table_col">Random</th>
            <th class="table_col">TOMI</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td class="col-name" rowspan="2">C major<br>/<br>A minor</td>
            <td class="audio_td" data-audio-src="audio/musicgen/pattern2/pattern2_C_1.mp3" data-pattern="pattern2"></td>
            <td class="audio_td" data-audio-src="audio/llm/pattern2/pattern2_C_1.mp3" data-pattern="pattern2"></td>
            <td class="audio_td" data-audio-src="audio/random/pattern2/pattern2_C_1.mp3" data-pattern="pattern2"></td>
            <td class="audio_td" data-audio-src="audio/tomi/pattern2/pattern2_C_1.mp3" data-pattern="pattern2"></td>
        </tr>
        <tr>
            <td class="audio_td" data-audio-src="audio/musicgen/pattern2/pattern2_C_2.mp3" data-pattern="pattern2"></td>
            <td class="audio_td" data-audio-src="audio/llm/pattern2/pattern2_C_2.mp3" data-pattern="pattern2"></td>
            <td class="audio_td" data-audio-src="audio/random/pattern2/pattern2_C_2.mp3" data-pattern="pattern2"></td>
            <td class="audio_td" data-audio-src="audio/tomi/pattern2/pattern2_C_2.mp3" data-pattern="pattern2"></td>
        </tr>
        <tr>
            <td class="col-name" rowspan="2">F major<br>/<br>D minor</td>
            <td class="audio_td" data-audio-src="audio/musicgen/pattern2/pattern2_F_1.mp3" data-pattern="pattern2"></td>
            <td class="audio_td" data-audio-src="audio/llm/pattern2/pattern2_F_1.mp3" data-pattern="pattern2"></td>
            <td class="audio_td" data-audio-src="audio/random/pattern2/pattern2_F_1.mp3" data-pattern="pattern2"></td>
            <td class="audio_td" data-audio-src="audio/tomi/pattern2/pattern2_F_1.mp3" data-pattern="pattern2"></td>
        </tr>
        <tr>
            <td class="audio_td" data-audio-src="audio/musicgen/pattern2/pattern2_F_2.mp3" data-pattern="pattern2"></td>
            <td class="audio_td" data-audio-src="audio/llm/pattern2/pattern2_F_2.mp3" data-pattern="pattern2"></td>
            <td class="audio_td" data-audio-src="audio/random/pattern2/pattern2_F_2.mp3" data-pattern="pattern2"></td>
            <td class="audio_td" data-audio-src="audio/tomi/pattern2/pattern2_F_2.mp3" data-pattern="pattern2"></td>
        </tr>
        <tr>
            <td class="col-name" rowspan="2">G major<br>/<br>E minor</td>
            <td class="audio_td" data-audio-src="audio/musicgen/pattern2/pattern2_G_1.mp3" data-pattern="pattern2"></td>
            <td class="audio_td" data-audio-src="audio/llm/pattern2/pattern2_G_1.mp3" data-pattern="pattern2"></td>
            <td class="audio_td" data-audio-src="audio/random/pattern2/pattern2_G_1.mp3" data-pattern="pattern2"></td>
            <td class="audio_td" data-audio-src="audio/tomi/pattern2/pattern2_G_1.mp3" data-pattern="pattern2"></td>
        </tr>
        <tr>
            <td class="audio_td" data-audio-src="audio/musicgen/pattern2/pattern2_G_2.mp3" data-pattern="pattern2"></td>
            <td class="audio_td" data-audio-src="audio/llm/pattern2/pattern2_G_2.mp3" data-pattern="pattern2"></td>
            <td class="audio_td" data-audio-src="audio/random/pattern2/pattern2_G_2.mp3" data-pattern="pattern2"></td>
            <td class="audio_td" data-audio-src="audio/tomi/pattern2/pattern2_G_2.mp3" data-pattern="pattern2"></td>
        </tr>
        <tr>
            <td class="col-name" rowspan="2">B\( \flat \) major<br>/<br>G minor</td>
            <td class="audio_td" data-audio-src="audio/musicgen/pattern2/pattern2_A%23_1.mp3" data-pattern="pattern2"></td>
            <td class="audio_td" data-audio-src="audio/llm/pattern2/pattern2_A%23_1.mp3" data-pattern="pattern2"></td>
            <td class="audio_td" data-audio-src="audio/random/pattern2/pattern2_A%23_1.mp3" data-pattern="pattern2"></td>
            <td class="audio_td" data-audio-src="audio/tomi/pattern2/pattern2_A%23_1.mp3" data-pattern="pattern2"></td>
        </tr>
        <tr>
            <td class="audio_td" data-audio-src="audio/musicgen/pattern2/pattern2_A%23_2.mp3" data-pattern="pattern2"></td>
            <td class="audio_td" data-audio-src="audio/llm/pattern2/pattern2_A%23_2.mp3" data-pattern="pattern2"></td>
            <td class="audio_td" data-audio-src="audio/random/pattern2/pattern2_A%23_2.mp3" data-pattern="pattern2"></td>
            <td class="audio_td" data-audio-src="audio/tomi/pattern2/pattern2_A%23_2.mp3" data-pattern="pattern2"></td>
        </tr>
    </tbody>
</table>
</div>

##### <center> \( \textbf{Structure 3: } \) \( \text{intro(8b)} \) \( \rightarrow \) \( \text{verse 1(16b)} \) \( \rightarrow \) \( \text{pre-chorus 1(8b)} \) \( \rightarrow \) \( \text{chorus 1(16b)} \) \( \rightarrow \) \( \text{verse 2(16b)} \) \( \rightarrow \) \( \text{pre-chorus 2(8b)} \) \( \rightarrow \) \( \text{chorus 2(16b)} \) \( \rightarrow \) \( \text{bridge(8b)} \) \( \rightarrow \) \( \text{chorus 3(16b)} \) \( \rightarrow \) \( \text{outro(8b)} \)
<div class="center-stuff">
<table id="table_pattern3">
    <thead>
        <tr>
            <th class="slash-wrap">
                <span class="left">Key</span>
                <span class="slash"></span>
                <span class="right">Structure</span>
            </th>
            <th class="table_col">MusicGen</th>
            <th class="table_col">Standalone LLM</th>
            <th class="table_col">Random</th>
            <th class="table_col">TOMI</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td class="col-name" rowspan="2">C major<br>/<br>A minor</td>
            <td class="audio_td" data-audio-src="audio/musicgen/pattern3/pattern3_C_1.mp3" data-pattern="pattern3"></td>
            <td class="audio_td" data-audio-src="audio/llm/pattern3/pattern3_C_1.mp3" data-pattern="pattern3"></td>
            <td class="audio_td" data-audio-src="audio/random/pattern3/pattern3_C_1.mp3" data-pattern="pattern3"></td>
            <td class="audio_td" data-audio-src="audio/tomi/pattern3/pattern3_C_1.mp3" data-pattern="pattern3"></td>
        </tr>
        <tr>
            <td class="audio_td" data-audio-src="audio/musicgen/pattern3/pattern3_C_2.mp3" data-pattern="pattern3"></td>
            <td class="audio_td" data-audio-src="audio/llm/pattern3/pattern3_C_2.mp3" data-pattern="pattern3"></td>
            <td class="audio_td" data-audio-src="audio/random/pattern3/pattern3_C_2.mp3" data-pattern="pattern3"></td>
            <td class="audio_td" data-audio-src="audio/tomi/pattern3/pattern3_C_2.mp3" data-pattern="pattern3"></td>
        </tr>
        <tr>
            <td class="col-name" rowspan="2">F major<br>/<br>D minor</td>
            <td class="audio_td" data-audio-src="audio/musicgen/pattern3/pattern3_F_1.mp3" data-pattern="pattern3"></td>
            <td class="audio_td" data-audio-src="audio/llm/pattern3/pattern3_F_1.mp3" data-pattern="pattern3"></td>
            <td class="audio_td" data-audio-src="audio/random/pattern3/pattern3_F_1.mp3" data-pattern="pattern3"></td>
            <td class="audio_td" data-audio-src="audio/tomi/pattern3/pattern3_F_1.mp3" data-pattern="pattern3"></td>
        </tr>
        <tr>
            <td class="audio_td" data-audio-src="audio/musicgen/pattern3/pattern3_F_2.mp3" data-pattern="pattern3"></td>
            <td class="audio_td" data-audio-src="audio/llm/pattern3/pattern3_F_2.mp3" data-pattern="pattern3"></td>
            <td class="audio_td" data-audio-src="audio/random/pattern3/pattern3_F_2.mp3" data-pattern="pattern3"></td>
            <td class="audio_td" data-audio-src="audio/tomi/pattern3/pattern3_F_2.mp3" data-pattern="pattern3"></td>
        </tr>
        <tr>
            <td class="col-name" rowspan="2">G major<br>/<br>E minor</td>
            <td class="audio_td" data-audio-src="audio/musicgen/pattern3/pattern3_G_1.mp3" data-pattern="pattern3"></td>
            <td class="audio_td" data-audio-src="audio/llm/pattern3/pattern3_G_1.mp3" data-pattern="pattern3"></td>
            <td class="audio_td" data-audio-src="audio/random/pattern3/pattern3_G_1.mp3" data-pattern="pattern3"></td>
            <td class="audio_td" data-audio-src="audio/tomi/pattern3/pattern3_G_1.mp3" data-pattern="pattern3"></td>
        </tr>
        <tr>
            <td class="audio_td" data-audio-src="audio/musicgen/pattern3/pattern3_G_2.mp3" data-pattern="pattern3"></td>
            <td class="audio_td" data-audio-src="audio/llm/pattern3/pattern3_G_2.mp3" data-pattern="pattern3"></td>
            <td class="audio_td" data-audio-src="audio/random/pattern3/pattern3_G_2.mp3" data-pattern="pattern3"></td>
            <td class="audio_td" data-audio-src="audio/tomi/pattern3/pattern3_G_2.mp3" data-pattern="pattern3"></td>
        </tr>
        <tr>
            <td class="col-name" rowspan="2">B\( \flat \) major<br>/<br>G minor</td>
            <td class="audio_td" data-audio-src="audio/musicgen/pattern3/pattern3_A%23_1.mp3" data-pattern="pattern3"></td>
            <td class="audio_td" data-audio-src="audio/llm/pattern3/pattern3_A%23_1.mp3" data-pattern="pattern3"></td>
            <td class="audio_td" data-audio-src="audio/random/pattern3/pattern3_A%23_1.mp3" data-pattern="pattern3"></td>
            <td class="audio_td" data-audio-src="audio/tomi/pattern3/pattern3_A%23_1.mp3" data-pattern="pattern3"></td>
        </tr>
        <tr>
            <td class="audio_td" data-audio-src="audio/musicgen/pattern3/pattern3_A%23_2.mp3" data-pattern="pattern3"></td>
            <td class="audio_td" data-audio-src="audio/llm/pattern3/pattern3_A%23_2.mp3" data-pattern="pattern3"></td>
            <td class="audio_td" data-audio-src="audio/random/pattern3/pattern3_A%23_2.mp3" data-pattern="pattern3"></td>
            <td class="audio_td" data-audio-src="audio/tomi/pattern3/pattern3_A%23_2.mp3" data-pattern="pattern3"></td>
        </tr>
    </tbody>
</table>
</div>

##### <center> \( \textbf{Structure 4: } \) \( \text{intro(8b)} \) \( \rightarrow \) \( \text{chorus(8b)} \) \( \rightarrow \) \( \text{verse(16b)} \) \( \rightarrow \) \( \text{pre-chorus(4b)} \) \( \rightarrow \) \( \text{chorus(8b)} \) \( \rightarrow \) \( \text{verse(16b)} \) \( \rightarrow \) \( \text{pre-chorus(4b)} \) \( \rightarrow \) \( \text{chorus(8b)} \) \( \rightarrow \) \( \text{outro(8b)} \)
<div class="center-stuff">
<table id="table_pattern4">
    <thead>
        <tr>
            <th class="slash-wrap">
                <span class="left">Key</span>
                <span class="slash"></span>
                <span class="right">Structure</span>
            </th>
            <th class="table_col">MusicGen</th>
            <th class="table_col">Standalone LLM</th>
            <th class="table_col">Random</th>
            <th class="table_col">TOMI</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td class="col-name" rowspan="2">C major<br>/<br>A minor</td>
            <td class="audio_td" data-audio-src="audio/musicgen/pattern4/pattern4_C_1.mp3" data-pattern="pattern4"></td>
            <td class="audio_td" data-audio-src="audio/llm/pattern4/pattern4_C_1.mp3" data-pattern="pattern4"></td>
            <td class="audio_td" data-audio-src="audio/random/pattern4/pattern4_C_1.mp3" data-pattern="pattern4"></td>
            <td class="audio_td" data-audio-src="audio/tomi/pattern4/pattern4_C_1.mp3" data-pattern="pattern4"></td>
        </tr>
        <tr>
            <td class="audio_td" data-audio-src="audio/musicgen/pattern4/pattern4_C_2.mp3" data-pattern="pattern4"></td>
            <td class="audio_td" data-audio-src="audio/llm/pattern4/pattern4_C_2.mp3" data-pattern="pattern4"></td>
            <td class="audio_td" data-audio-src="audio/random/pattern4/pattern4_C_2.mp3" data-pattern="pattern4"></td>
            <td class="audio_td" data-audio-src="audio/tomi/pattern4/pattern4_C_2.mp3" data-pattern="pattern4"></td>
        </tr>
        <tr>
            <td class="col-name" rowspan="2">F major<br>/<br>D minor</td>
            <td class="audio_td" data-audio-src="audio/musicgen/pattern4/pattern4_F_1.mp3" data-pattern="pattern4"></td>
            <td class="audio_td" data-audio-src="audio/llm/pattern4/pattern4_F_1.mp3" data-pattern="pattern4"></td>
            <td class="audio_td" data-audio-src="audio/random/pattern4/pattern4_F_1.mp3" data-pattern="pattern4"></td>
            <td class="audio_td" data-audio-src="audio/tomi/pattern4/pattern4_F_1.mp3" data-pattern="pattern4"></td>
        </tr>
        <tr>
            <td class="audio_td" data-audio-src="audio/musicgen/pattern4/pattern4_F_2.mp3" data-pattern="pattern4"></td>
            <td class="audio_td" data-audio-src="audio/llm/pattern4/pattern4_F_2.mp3" data-pattern="pattern4"></td>
            <td class="audio_td" data-audio-src="audio/random/pattern4/pattern4_F_2.mp3" data-pattern="pattern4"></td>
            <td class="audio_td" data-audio-src="audio/tomi/pattern4/pattern4_F_2.mp3" data-pattern="pattern4"></td>
        </tr>
        <tr>
            <td class="col-name" rowspan="2">G major<br>/<br>E minor</td>
            <td class="audio_td" data-audio-src="audio/musicgen/pattern4/pattern4_G_1.mp3" data-pattern="pattern4"></td>
            <td class="audio_td" data-audio-src="audio/llm/pattern4/pattern4_G_1.mp3" data-pattern="pattern4"></td>
            <td class="audio_td" data-audio-src="audio/random/pattern4/pattern4_G_1.mp3" data-pattern="pattern4"></td>
            <td class="audio_td" data-audio-src="audio/tomi/pattern4/pattern4_G_1.mp3" data-pattern="pattern4"></td>
        </tr>
        <tr>
            <td class="audio_td" data-audio-src="audio/musicgen/pattern4/pattern4_G_2.mp3" data-pattern="pattern4"></td>
            <td class="audio_td" data-audio-src="audio/llm/pattern4/pattern4_G_2.mp3" data-pattern="pattern4"></td>
            <td class="audio_td" data-audio-src="audio/random/pattern4/pattern4_G_2.mp3" data-pattern="pattern4"></td>
            <td class="audio_td" data-audio-src="audio/tomi/pattern4/pattern4_G_2.mp3" data-pattern="pattern4"></td>
        </tr>
        <tr>
            <td class="col-name" rowspan="2">B\( \flat \) major<br>/<br>G minor</td>
            <td class="audio_td" data-audio-src="audio/musicgen/pattern4/pattern4_A%23_1.mp3" data-pattern="pattern4"></td>
            <td class="audio_td" data-audio-src="audio/llm/pattern4/pattern4_A%23_1.mp3" data-pattern="pattern4"></td>
            <td class="audio_td" data-audio-src="audio/random/pattern4/pattern4_A%23_1.mp3" data-pattern="pattern4"></td>
            <td class="audio_td" data-audio-src="audio/tomi/pattern4/pattern4_A%23_1.mp3" data-pattern="pattern4"></td>
        </tr>
        <tr>
            <td class="audio_td" data-audio-src="audio/musicgen/pattern4/pattern4_A%23_2.mp3" data-pattern="pattern4"></td>
            <td class="audio_td" data-audio-src="audio/llm/pattern4/pattern4_A%23_2.mp3" data-pattern="pattern4"></td>
            <td class="audio_td" data-audio-src="audio/random/pattern4/pattern4_A%23_2.mp3" data-pattern="pattern4"></td>
            <td class="audio_td" data-audio-src="audio/tomi/pattern4/pattern4_A%23_2.mp3" data-pattern="pattern4"></td>
        </tr>
    </tbody>
</table>
</div>

**TOMI Prompt Structure:**
In our implementation, we design our prompt for in-context-learning in the following structure:

> **Role Assignment:**  
> You are a professional music producer using a framework called TOMI to make music.
>
> **Detailed Explanation of TOMI Data Structure:**
>
>   1. **Sections**
>      - Explanation: ...
>      - Attributes: ...
>      - Examples: ...
>   2. **Tracks**
>      - Explanation: ...
>      - Attributes: ...
>      - Examples: ...
>   3. **Clips**
>      - Explanation: ...
>      - Attributes: ...
>      - Examples: ...
>   4. **Transformations**
>      - Explanation: ...
>      - Attributes: ...
>      - Examples: ...
>   5. **Composition Links**
>      - Explanation: ...
>      - Examples: ...
>
> **Instructions:**
>   - **a)** Generate a composition as JSON format with keys following the order: "Sections", "Tracks", "Clips", "Transformations", and "Composition Links".
>   - **b)** Do not generate duplicated nodes or composition links.
>   - **c)** Use only previously generated node names in your composition links.
>
> **Additional Context:**  
> Please compose an electronic music piece. Feel free to choose any instruments you like on your own. The tempo is about 120, and the mood is happy. Your generation should be completely provided, and should be close to real-world music production.


**MusicGen Prompt Structure:**
We use MusicGen-Large-3.3B model as the baseline, with prompts that specify tonality, tempo, and song structure. To enable structural awareness during generation, we modify the model's inference process by adding explicit structure context after the initial text prompt in each generation step, instructing the model to align its output with the given structure. The "_Structure Context_" part is replaced in each generation step. A prompt example is as follows:

>An example of a full prompt used in one generation step:\
>(1) **Initial Prompt**: Generate an electronic music track at 120 BPM in C major. Follow this structure: 8-bar intro, 16-bar verse, 8-bar pre-chorus, 16-bar chorus…\
>(2) **Structure Context**: For now, you are generating the segment between the 120th second and the 150th second, which corresponds to the the 60th bar and the 75th bar regarding the whole song, your generated segment includes 4 bars of PreChorus, 8 bars of Chorus, and 3 bars of Outro of the song structure.

<br>
