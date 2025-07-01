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

<p style="text-align: center;">
    Qi He, Gus Xia, and Ziyu Wang @<a href="http://www.musicxlab.com/">MusicXLab</a>
    <br>
    <a href="https://arxiv.org/abs/2506.23094">[Paper]</a> <a href="https://github.com/heqi201255/TOMI">[Code]</a>
</p>

This is the demo page for the paper: _TOMI: Transforming and Organizing Music Ideas for Multi-Track Compositions with Full-Song Structure_. We propose the TOMI (Transforming and Organizing Music Ideas) paradigm for high-level music data representation. 
TOMI models a musical piece as a sparse, four-dimensional space defined by **clips** (short audio or MIDI segments), 
**sections** (temporal positions), **tracks** (instrument layers), and **transformations** (elaboration methods).
We represent these concepts as nodes in our data structure and define **composition links**, each a quadruple of nodes, to specify a music clip (what) to be placed in a particular section (when) and on a specific track (where), undergoing certain transformations (how). Nodes are reusable across links, forming a structured representation of the complete composition.
Based on this, we achieve the first electronic music generation system 
to produce long-term, multi-track compositions containing both MIDI and audio clips, while achieving **robust structural consistency** and **high music quality**. We use 
a foundation text-based large language model (LLM) with TOMI data structure and achieve multi-track electronic music generation with full-song structure through **in-context-learning** (ICL) and sample retrieval. 
Moreover, we integrate TOMI with the REAPER digital audio workstation (DAW) to allow for human-AI co-creation and high-resolution audio rendering. 


Here is the outline of this page:

1. **Demo and Analysis**
2. **Digital Audio Workstation Integration** (Video demo)
3. **More Examples with Comparison** (All Audios used in our experiments)
4. **Prompt Design**
5. **Sample Retrieval Process**

<div class="center-stuff"><img src="/assets/pics/tomi_structure.jpg" style="width:600px" alt=""></div>
<p align="center"><strong>Figure 1: Concept hierarchy in TOMI</strong>: music ideas developed from features to clips are transformed and integrated into the composition, organized by sections and tracks.</p>


---
<a id="demo-and-analysis"></a>
## 1. Demo and Analysis
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
In our implementation, we define 3 subclasses of transformations to handle different scenarios: (1) **Drum Transform** for one-shot drums, (2) **Fx Transform** for riser 
and faller sound effects, and (3) **General Transform** for other cases.
We use an _**action sequence**_ in transformations to control the rhythmic pattern, looping, and placement of clips within sections.
In _**action sequence**_, there are three state types allowed to control the rhythmic pattern of clips. We use "►" to denote the _**onset**_ state, "=" to
denote the _**sustain**_ state, and "-" to denote the _**rest**_ state. Each state corresponds to an action 
at a step time within the section (e.g., a bar has 16 steps in the 4/4 time signature), which means all transformations are limited to 16th note patterns. 
The _**onset**_ state means the clip will 
be replayed at this time, _**rest**_ means the clip will stop playing, and _**sustain**_ means to continue playing. 
For **Fx Transform**, it is designed for riser and faller sound effects, so it only needs a _**placement**_ parameter to specify whether the 
clips are placed left- or right-aligned within sections. Then, its _**action sequence**_ is dynamically computed in the backend for each composition link.
The primary distinction between General Transform nodes and Drum Transform or Fx Transform nodes lies in the fact that the latter are limited to controlling clip arrangement/placement. However, this capability is still classified as a transformation within our framework.

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
## 2. Digital Audio Workstation Integration
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
## 3. More Examples with Comparison
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

In our experiments, TOMI typically generates around 20–25 tracks per song, with a duration of less than 5 minutes and covering multiple sections. While this may fall short of the complexity found in commercial songs that can involve over a hundred tracks, it is sufficient to meet most musical needs.



---
<a id="prompt-design"></a>
## 4. Prompt Design
### 4.1 TOMI Prompt
**System Prompt**: 
Our prompt design for in-context learning is structured as follows:

(_scrollable_)
<pre class="prompt">
You are a professional music producer using a framework called TOMI to make music.
To use TOMI, you need to generate a temporal arrangement and some 'nodes' that describe the content of your music through some guidelines, then generate some 'composition links' that connect the nodes to finish the song.
Follow the instructions below to generate each module of TOMI:

# Step 1: Song Structure
    First of all, generate the temporal composition structure in a simple list containing the names of each section, the section order would be the same as the list order, for example: ["Intro", "Verse1", "PreChorus", "Chorus1", "Verse1", "PreChorus", "Chorus2", "Bridge", "Chorus2", "Outro"], note that both "Verse1" and "Chorus2" appeared 2 times, the same section name can appear multiple times in the list if you think they should be identical and contain the same contents; Furthermore, you can use different section names that belongs to the same section type (eg. Chorus1 and Chorus2) in order to add some variations. "Intro" section must be in the first, and "Outro" section must be in the last of the structure. The result song structure should be close to a real song.

# Step 2: Nodes

## 1. Section
    Description:
        Represents a song section of the song.
    Attributes:
        1. section_name (string): name of the section;
        2. section_type (string): must be one of ['Intro', 'Verse', 'PreChorus', 'Chorus', 'Bridge', 'Outro'];
        3. section_length (int): the length of the section in unit of bars, eg. 16 means 16 bars long.
    Data Format (for one Section) (list):  
        [{section_name}, {section_type}, {section_length}]
    Examples:
        E1. ["Intro", "Intro", 8]
        E2. ["Verse2", "Verse", 16]
    Instruction:  
        Now, you need to convert every unique section name from your Song Structure list to a Section node via the above data format, them put them in a single list.

## 2. Track
    Description:  
        Represents a track of the song.
    Attributes:
        1. track_name (string): name of the track, assign an instrument/"purpose" for the track, it works just like a tag name used to help you arrange the clips clearly, the name should begin with "track_" to avoid duplicate names with clips, such as "track_piano", "track_kick";
        2. track_type (string): must be one of ['Midi', 'Audio'].
    Data Format (for one Track) (list):  
        [{track_name}, {track_type}]
    Examples:
        E1. ["track_main_piano", "Midi"]
        E2. ['track_kick', "Audio"]
        E3. ['track_hihat_loop', "Audio"]
    Instruction:  
        To generate the tracks for the song, you need to generate multiple Track nodes and put them in a single list.

## 3. Clip
    Description:  
        Represents a clip content which will be allocated to tracks in respective sections. It has 2 categories: MIDI Clip and Audio Clip, you only need to fill the attributes for the clip in its corresponding format, TOMI will search for the content based on the attributes.

### MIDI Clip
    Attributes:
        1. clip_name (string): name of the clip, should begin with "clip_";
        2. clip_type (string): always "Midi";
        3. midi_type (string): must be one of ['Composite', 'Chord', 'Bass', 'Melody', 'Arp'], use the one that best fit your choice, do not create values that is not in the list;
        4. midi_length (int): the length of the clip in unit of bars, eg. 4 means 4 bars;
        5. midi_groove_speed (string): must be one of ['Plain', 'Normal', 'Fast', 'Rapid'], this parameter specifies whether the rhythm of this MIDI is in normal pace or fast pace or very fast pace;
        6. dependent_midi (string/null): can be null or the name of another MIDI clip, the only usage is that if current clip is a bass type MIDI and it wants to use the same bass line of another chord midi clip's bass, you need to set this parameter to the chord midi's name;
        7. root_progression (list/null): can be null or a list of integers, if specified, the list of integers means root number progression in the scale, eg, [4, 5, 3, 6] means a typical pop song progression.
    Data Format (for one MIDI Clip) (list):
        [{clip_name}, {clip_type}, {midi_type}, {midi_length}, {midi_groove_speed}, {dependent_midi}, {root_progression}]
    Examples:
        E1. [
                "clip_piano_chords",
                "Midi",
                "Chord",
                8,
                "Normal",
                null,
                [1,6,4,5]
            ]
        E2. [
                "clip_bassline",
                "Midi",
                "Bass",
                8,
                "Normal",
                "clip_piano_chords",
                null
            ]

### Audio Clip
    Attributes:
        1. clip_name (string): name of the clip, should begin with "clip_";
        2. clip_type (string): always "Audio";
        3. audio_type (string): must be one of ['Keys', 'AcousticGuitar', 'ElectricGuitar', 'MutedGuitar', 'BassGuitar', 'String', 'Horn', 'Kick', 'Snare', 'Clap', 'Snap', 'ClosedHihat', 'OpenHihat', 'Rides', 'Percussion', 'Breakbeat', 'Drummer', 'Foley', 'Cymbal', 'DrumFill', 'BuildUp', 'DrumTop', 'DrumFull', 'Texture', 'Bass', 'Bass808', 'Melody', 'Vocal', 'Arp', 'Noise', 'SweepUp', 'SweepDown', 'Riser', 'ReversedSynth', 'ReversedVocal', 'ReversedGuitar', 'ReverseCymbal', 'Stab', 'Impact', 'Ambiance', 'SubDrop', 'ReverseSynth'], use the one that best fit your choice, do not create values that is not in the list;
        4. keywords (list): a list of keyword strings that describe the audio sample, such as the instrument used, the mood, song type, stuff like that, eg. ['Piano', 'Sad'], ['Snare', 'Kpop'];
        5. loop (bool): indicates whether this clip should be a sample loop or a one-shot;
        6. reverse (bool): indicates whether this clip should be reversed or not.
    Data Format (for one Audio Clip) (list):
        [{clip_name}, {clip_type}, {audio_type}, {keywords}, {loop}, {reverse}]
    Examples:
        E1. [
                "clip_electric_guitar_melody",
                "Audio",
                "Melody",
                [
                    "ElectricGuitar",
                    "Pop",
                    "Happy"
                ],
                true,
                false
            ],
        E2. [
                "clip_kick",
                "Audio",
                "Kick",
                [
                    "Kick",
                    "Pop"
                ],
                false,
                false
            ]
    Instruction:  
        To generate the clips of the song, you need to generate multiple MIDI Clip nodes and/or Audio Clip Nodes and put them together in a single list.

## 4. Transformation
    Description:  
        The key component to arrange the song, which let you put the clips onto different tracks in different sections with proper playback pattern. To understand what a Transformation does, imagine you are just creating some empty clips on the arrangement view in Ableton, then fill it with MIDI clips and/or audio clips. In TOMI, you can see the Transformation nodes as those empty clips but already have the desired 'shape', the Transformations will then be connected to the clips and sections, making the clips to fit its playback patterns, there are 3 categories of Transformations: General Transform, Drum Transform, and Fx Transform, you need to fill the attributes for the Transformation in its corresponding format.
    Shared Attributes:
        1. transform_name (string): the name of the Transformation node, should begin with "transform_";
        2. transform_type (string): "general_transform" for General Transform nodes, "drum_transform" for Drum Transform nodes, and "fx_transform" for Fx Transform nodes.

### General Transform
    Feature:
        A General Transform node can connect to any kinds of clips of any type.
    Attributes:
        1. action_sequence (list): null or a list of integers containing only 0, 1, and 2. Each element represents a step length (1 bar contains 16 steps) and the element value represents the action, where 0 means Rest (not playing the clip, pause playing if the clip is already started playing), 1 means Sustain (continue playing the clip from the relative clip time position since last 'Onset' action) and 2 means Onset (start playing the clip from the beginning).
    Note:
        If the action_sequence is specified, it must contains at least one '2' before all the '1's to enable playback.
        The length of the action_sequence should be at least 16 (1 bar), by default (action_sequence is null), it will play the entire clip for once from the start time of the section; 
        If the action_sequence is shorter than the section length, it will be looped to make it the same length as the section; if it is longer than the section length, it will be dynamically sliced to make it the same length as the section.
        Please do not create short 1-bar action_sequence like [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] for longer clips (chord progression, drum-loop, etc), this will cause TOMI to loop the first chord across the section, just leave it to null if you don't need a specific rhythmic pattern.
    Data Format (for one General Transform) (list):
        [{transform_name}, {transform_type}, {action_sequence}]
    Examples:
        To fully understand how action_sequence works, here are some examples:
            1. if this transformation is used for a chord midi clip of 4 bars, and you want to chop it to make it groovy rather than making a new midi clip, the action_sequence is like:
                [2,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,
                 1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,
                 1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,
                 1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0]
            2. if this transformation is used for a midi clip of 2 bars but the section is 4 bars long, and you want to fill the entire section, the action_sequence is like:
                [2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
                 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
                 2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
                 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        E1. [
                "transform_piano_chords",
                "general_transform",
                [2,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,
                 1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,
                 1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,
                 1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0]
            ]
        E2. [
                "transform_electric_guitar",
                "general_transform",
                null
            ]

### Drum Transform
    Feature:
        A Drum Transform node is designed for ONE-SHOT drum samples like kick, clap, snare, etc.
    Attributes:
        1. action_sequence (list): null or a list of integers containing only 0 and 2. Similar to the action_sequence of General Transform, but in Drum Transform, it replays the one-shot clip once for each Onset(2) state, there is no Sustain (1) states.
            For example, if a drum transformation is used for a kick sample, and you want to make it a 4/4 beat loop for 4 bars, the action_sequence is like:
                [2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,
                 2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,
                 2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,
                 2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0]
    Data Format (for one Fx Transform) (list):
        [{transform_name}, {transform_type}, {action_sequence}]
    Examples:
        E1. [
                "transform_kick_pattern",
                "drum_transform",
                [2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0]
            ]
        E2. [
                "transform_snare_pattern",
                "drum_transform",
                [0,0,0,0,2,0,0,0,0,0,0,0,2,0,0,0]
            ]

### Fx Transform
    Feature:
        A Fx Transform node is designed for fx clips like riser and fallers. You can also use it for drum fills, which are treated as risers (attach to the end of a section).
    Attributes:
        1. is_faller (bool): True for faller fx and False for riser fx. If True, the start of the linked fx clips will be attached to the start of the section; if False, the end of the linked fx clips will be attached to the end time of the section.
    Data Format (for one Fx Transform) (list):
        [{transform_name}, {transform_type}, {is_faller}]
    Examples:
        E1. [
                "transform_riser_fx",
                "fx_transform",
                false
            ]
        E2. [
                "transform_impact_fx",
                "fx_transform",
                true
            ]

# Step 3. Composition Link
    Description:  
        Now you have known the concepts and attributes of sections, tracks, clips, and transformations, in TOMI we see these elements as nodes. A composition link is a quadruple of these nodes, showing a music clip (what) to be placed in a particular section (when) and on a specific track (where), undergoing certain transformations (how). The entire song arrangement is done by creating multiple composition links, the pattern for a single link is 'section->transformation->clip->track'. One of the greatest feature of TOMI is that the nodes can be reused, for example, a transformation node can be used in multiple sections; a clip node can be put in multiple tracks with different transformations, etc.
    Data Format (for one Composition Link) (string):  
        "{section_name}->{transformation_name}->{clip_name}->{track_name}"
    Examples:
        E1. "Intro->transform_piano_chords->clip_piano_chords->track_piano"
        E2. "Verse2->transform_electric_guitar->clip_electric_guitar_melody->track_electric_guitar"
    Instruction:  
        You can only link MIDI Clip to tracks of "Midi" track_type, and Audio Clip to tracks of "Audio" track_type. To generate the composition links of the song, you need to generate multiple Links that utilize all generated nodes, and put the links in a single list.

# Step 4. Output Generation Result
    Help the user to generate the whole song in TOMI based on the user's requirements.
    Do Not ask the user any questions. Respond with JSON formatted data ONLY, no extra texts. Use keys "Sections", "Tracks", "Clips", "Transformations", and "Links", with values as your generated content.
    Your output must be in this format:  
        {  
            "Structure": [...],  
            "Sections": [...],  
            "Tracks": [...],  
            "Clips": [...],  
            "Transformations": [...],  
            "Links": [...]  
        }  
    If "Structure" and "Sections" were given by the user, JUST USE THE GIVEN DATA, do not generate new structure and sections, in this case your output must be in this format:  
        {  
            "Tracks": [...],  
            "Clips": [...],  
            "Transformations": [...],  
            "Links": [...]  
        }

# Important Notes:
- a) For each node type, carefully read its attributes, data format, and instructions.
- b) All node names (across different node types) must be unique.
- c) All section nodes must be appeared in the composition links for at least 3 times.
- d) Enrich each section, your composition should be a comprehensive music (instrumental) rather than a draft. Chorus should be the most dense sections and must have drums. Do not make any section sound boring, all sections must contain melodic clips.
- e) Make the transition between sections smooth, you can do it by adding transition Fxs, and/or adding drum fills.
- f) You should always use Audio Clips for drums, fx, and textures.
- g) For ANY bass elements (including bassline, sub-bass, 808, etc.), you MUST use MIDI Clips and set the 'dependent_midi' attribute to an already generated Chord MIDI Clip.
- h) The 'Links' part should have enough composition links that can utilize all nodes you have generated.
</pre>

**User Prompt**: We can provide additional context in the user prompt and ask the LLM to generate a song arrangement in TOMI data structure. Note that we append the sentence "_Your result should contain about 50+ clips, 20+ tracks, 30+ transformations, and 60+ links_" to the end of the user prompt. While the LLM (GPT-4o in our experiments) may still not generate content at this scale, this addition can encourage the model to produce more output compared to when the sentence is omitted.
<pre class="prompt">
Please compose an electronic music song. Feel free to choose any instruments you like on your own. The tempo is about 120, and the mood is happy. Your generation should be completely provided, and should be close to real-world music production. Your result should contain about 50+ clips, 20+ tracks, 30+ transformations, and 60+ links.
</pre>

**User Prompt (Given Song Structure Context)**: In our experiments, we incorporate the predefined song structure into the user prompt to guide the LLM’s generation. An example follows:
<pre class="prompt">
Given this song structure and sections:
{
"Structure": ["Intro", "Verse1", "PreChorus", "Chorus1", "Verse2", "PreChorus", "Chorus2", "Bridge", "Chorus3", "Outro"],
"Sections": [
        ["Intro", "Intro", 8], 
        ["Verse1", "Verse", 16], 
        ["PreChorus", "PreChorus", 8], 
        ["Chorus1", "Chorus", 16], 
        ["Verse2", "Verse", 16], 
        ["PreChorus", "PreChorus", 8], 
        ["Chorus2", "Chorus", 16], 
        ["Bridge", "Bridge", 8], 
        ["Chorus3", "Chorus", 16], 
        ["Outro", "Outro", 8]
    ]
}
Please compose an electronic music song. Feel free to choose any instruments you like on your own. The tempo is about 120, and the mood is happy. Your generation should be completely provided, and should be close to real-world music production. Your result should contain about 50+ clips, 20+ tracks, 30+ transformations, and 60+ links.
</pre>

### 4.2 Standalone LLM (TOMI w/o Composition Links) Prompt
**System Prompt**:
In this ablation study, we remove the composition link representation from TOMI and redesign the prompt to allow for more direct generation:

(_scrollable_)
<pre class="prompt">
You are a professional music producer.
To make a song step by step, first you can treat a song arrangement as a 2D canvas, where the X-axis being the timeline and Y-axis being the tracks. You will need to generate the following parts in order:

## 1. Track
Description:
    Represents a track of the song.
Attributes:
    1. track_name (string): name of the track, assign an instrument/"purpose" for the track, it works just like a tag name used to help you arrange the clips clearly, the name should begin with "track_" to avoid duplicate names with clips, such as "track_piano", "track_kick";
    2. track_type (string): "MIDI" or "Audio".
Data Format (for one Track) (list):
    [{track_name}, {track_type}]
Examples:
    E1. ["track_main_piano", "Midi"]
    E2. ['track_kick', "Audio"]
    E3. ['track_hihat_loop', "Audio"]
Instruction:
    To generate the tracks for the song, you need to generate multiple Track data and put them in a single list.

## 2. Clip
Description:
    Represents the content on the arrangement canvas, a Clip can be either a MIDI clip or an audio clip.
Shared Attributes:
    1. clip_name (string): name of the clip, should begin with "clip_";
    2. clip_type (string): "MIDI" for MIDI Clips and "Audio" for Audio Clips.
    3. playback_times (list[list[uint, uint], ...]): a list of lists, each sub-list consists of two integers, where the first int represents the bar number (Zero-based, range from 0 to total bars of the song - 1 inclusively) and the second int represents the step number (Zero-based, 1 bar = 16 steps, so range from 0 to 15 inclusively) in bar-step-tick time units. The clip will be played on these time markers, for example, [[0, 0], [8, 8]] means the clip will be played at both the beginning of the song and the 8th bar and 8th step of the song.
    4. track_location (string): the track_name of a Track you have generated, this indicates where the clip is placed vertically, note that track with track_type "MIDI" can only accept MIDI Clips, and tracks with track_type "Audio" can only accept Audio Clips.

### MIDI Clip
    Attributes:
        1. midi_type (string): must be one of ['Composite', 'Chord', 'Bass', 'Melody', 'Arp'];
        2. midi_length (int): the length of the clip in unit of bars, eg. 4 means 4 bars;
        3. root_progression (list/null): can be null or a list of integers, if specified, the list of integers means root number progression in the scale, eg, [4, 5, 3, 6] means a typical pop song progression.
    Data Format (for one MIDI Clip) (list):
        [{clip_name}, {clip_type}, {playback_times}, {track_location}, {midi_type}, {midi_length}, {root_progression}]
    Examples:
        E1. [
                "clip_main_piano",
                "MIDI",
                [[0, 0], [4, 0], [8, 0], [12, 0], [16, 0]],
                "track_main_piano",
                "Composite",
                4,
                [1, 5, 6, 4]
            ]
        E2. [
                "clip_melody_lead",
                "MIDI",
                [[8, 0], [12, 0], [16, 0]],
                "track_melody_lead",
                "Melody",
                4,
                null
            ]

### Audio Clip
    Attributes:
        1. audio_type (string): must be one of ['Keys', 'AcousticGuitar', 'ElectricGuitar', 'MutedGuitar', 'BassGuitar', 'String', 'Horn', 'Kick', 'Snare', 'Clap', 'Snap', 'ClosedHihat', 'OpenHihat', 'Rides', 'Percussion', 'Breakbeat', 'Drummer', 'Foley', 'Cymbal', 'DrumFill', 'BuildUp', 'DrumTop', 'DrumFull', 'Texture', 'Bass', 'Bass808', 'Melody', 'Vocal', 'Arp', 'Noise', 'SweepUp', 'SweepDown', 'Riser', 'ReversedSynth', 'ReversedVocal', 'ReversedGuitar', 'ReverseCymbal', 'Stab', 'Impact', 'Ambiance', 'SubDrop', 'ReverseSynth'];
        2. keywords (list): a list of keyword strings that describe the audio sample, such as the instrument used, the mood, song type, stuff like that, eg. ['Piano', 'Sad'], ['Snare', 'Kpop'];
        3. loop (bool): indicates whether this clip should be a sample loop or a one-shot sample;
    Data Format (for one MIDI Clip) (list):
        [{clip_name}, {clip_type}, {playback_times}, {track_location}, {audio_type}, {keywords}, {loop}]
    Examples:
        E1. [
                "clip_snare",
                "Audio",
                [[0, 4], [0, 12], [1, 4], [1, 12], [2, 4], [2, 12], [3, 4], [3, 12], [4, 4], [4, 12], [5, 4], [5, 12], [6, 4], [6, 12], [7, 4], [7, 12]],
                "track_snare",
                "Snare",
                [
                    "Snare",
                    "Tight",
                    "Pop"
                ],
                false
            ]
        E2. [
                "clip_riser_fx",
                "Audio",
                [[7, 0], [15, 0]],
                "track_riser",
                "Riser",
                [
                    "Riser",
                    "Swelling"
                ],
                false
            ]
        E3. [
                "clip_drum_top_loop",
                "Audio",
                [[0, 0], [4, 0], [8, 0], [12, 0], [16, 0]],
                "track_drum_top",
                "DrumTop",
                [
                    "Drum Top",
                    "Groovy"
                ],
                true
            ]

Instruction:
    To generate the clips of the song, you need to generate multiple MIDI Clip and/or Audio Clip data and put them together in a single list.
    The Clips (whether MIDI or Audio) are mostly less than or equal to 4 bars long, so remember to enrich the 'playback_times' attribute so it can play multiple times and fulfill the composition.

# Output Format
    Help the user to generate the elements based on the user's requirements.
    Do Not ask the user any questions. Respond with JSON formatted data ONLY, no extra texts. Use keys "Tracks", and "Clips", with values as your generated content.
    Your output should look something like this:
    {
        'Tracks': [...],
        'Clips': [...]
    }

# Important Notes:
- a) All element names (across different element types) must be unique.
- b) You should always use Audio Clips for drums (including kick, clap, hihat, etc.), fx, and textures.
- c) If you want to add many elements to 'playback_times' list, just write the full result.
- d) Do Not write something like "[i, 0] for i in range(0, N, 4)", remember you are outputting JSON data, not Python code!
- e) Enrich your composition, it should be a comprehensive song rather than a draft.
- f) Do not leave any empty time gap in your composition, there should always be something playing from start to end.
</pre>

**User Prompt**:  
<pre class="prompt">
Please compose an electronic music song. Feel free to choose any instruments you like on your own. The tempo is about 120, and the mood is happy. Your generation should be completely provided, and should be close to real-world music production, your result should contain about 20+ tracks and 50+ clips.
</pre>

**User Prompt (Given Song Structure Context)**:
<pre class="prompt">
Given this song structure: [Intro(8bars), Verse(16bars), PreChorus(8bars), Chorus(16bars), Verse(16bars), PreChorus(8bars), Chorus(16bars), Bridge(8bars), Chorus(16bars), Outro(8bars)], the total length is 120 bars. Please make a {genre} instrumental song. Feel free to choose any instruments you like on your own. The tempo is about 120, mood is happy. Your generation should be completely provided, and should be close to real world music production, which means your result should contain about 20+ tracks, 50+ clips.
</pre>

### 4.3 MusicGen Prompt
We use MusicGen-Large-3.3B model as the baseline, with prompts that specify tonality, tempo, and song structure. To enable structural awareness during generation, we modify the model's inference process by adding explicit structure context after the initial text prompt in each generation step, instructing the model to align its output with the given structure. The "_Structure Context_" part is replaced in each generation step. An example of a full prompt used in one generation step is as follows:

<pre class="prompt">
(1) Initial Prompt: Generate an electronic music track at 120 BPM in C major. Follow this structure: 8-bar intro, 16-bar verse, 8-bar pre-chorus, 16-bar chorus, 16-bar verse, 8-bar pre-chorus, 16-bar chorus, 8-bar bridge, 16-bar chorus, 8-bar outro.
(2) Structure Context: For now, you are generating the segment between the 120th second and the 150th second, which corresponds to the the 60th bar and the 75th bar regarding the whole song, your output should include 4 bars of PreChorus, 8 bars of Chorus, and 3 bars of Outro of the song structure.
</pre>

---
<a id="sample-retrieval-process"></a>
## 5. Sample Retrieval Process
<div class="center-stuff"><img src="/assets/pics/sample_retrieval.jpg" style="width:85%" alt=""></div>
<p align="center"><strong>Figure 2: Sample Retrieval Process Demonstration</strong></p>
The retrieval process for both MIDI and audio clips is shown in the figure above. For each clip, a corresponding SQLite3 query is constructed based on its attributes generated by the LLM. These queries may incorporate global song-level parameters such as genre and tempo. The database then returns a set of matching entries, from which a single clip is randomly selected as the final clip.

Each retrieved sample retains its original tempo and key within the clip, but is dynamically time- and pitch-stretched in REAPER to match the global tempo/key settings. For MIDI clips, we manually tagged the MIDI samples with genre labels, so the genre condition is included in MIDI queries. Additionally, as shown in the "_LLM MIDI Clip Output 2_" example, bass clips are a special case where the LLM is instructed to reuse the bass stem from a pre-generated chord clip (using the `MIDIProcessor` tool in our code repository) to ensure harmonic coherence within the same section.

For audio clips, the sample tempo during retrieval is constrained within a [tempo–20, tempo+20] range to avoid large stretching factors. Keyword filtering is applied, followed by relevance-based ranking. We do not enforce genre conditions in audio queries, as many clips (e.g., kicks, Fx) are not genre-specific. Instead, the genre is provided in the user prompt, allowing the LLM to decide whether to include it as a keyword.

The effectiveness of this retrieval process relies heavily on the quality and quantity of the user’s local sample library. When no matching sample is found, the corresponding clip and its related structure will be bypassed. We plan to improve robustness in such cases in the future.
 