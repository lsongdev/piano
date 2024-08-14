import 'https://lsong.org/scripts/components/piano-keyboard.js';
import 'https://lsong.org/scripts/components/spectrum-analyzer.js';
import { createAudioContext, playNote, stopNote } from 'https://lsong.org/scripts/audio.js';

let audioContext, analyser;
let currentOscillator = null;
let isRecording = false;
let recordedNotes = [];
let startTime;

const recordBtn = document.getElementById('recordBtn');
const playBtn = document.getElementById('playBtn');
const stopBtn = document.getElementById('stopBtn');
const lessonSelect = document.getElementById('lessonSelect');
const showNotesCheckbox = document.getElementById('showNotesCheckbox');
const keyboard = document.querySelector('piano-keyboard');
const spectrumAnalyzer = document.querySelector('spectrum-analyzer');

function initAudio() {
  audioContext = createAudioContext();
  analyser = audioContext.createAnalyser();
  analyser.connect(audioContext.destination);

  recordBtn.disabled = false;
  lessonSelect.disabled = false;

  spectrumAnalyzer.setAnalyser(analyser);
}

function startNote(note) {
  keyboard.activateKey(note);
  currentOscillator = playNote(audioContext, analyser, note);
  if (isRecording) {
    recordedNotes.push({ note, time: Date.now() - startTime });
  }
}

function endNote() {
  stopNote(currentOscillator);
  currentOscillator = null;
}

keyboard.addEventListener('notestart', (e) => startNote(e.detail.note));
keyboard.addEventListener('noteend', endNote);

recordBtn.addEventListener('click', () => {
  if (!isRecording) {
    isRecording = true;
    recordedNotes = [];
    startTime = Date.now();
    recordBtn.textContent = 'Stop';
    playBtn.disabled = true;
  } else {
    isRecording = false;
    recordBtn.textContent = 'Record';
    playBtn.disabled = false;
  }
});

playBtn.addEventListener('click', () => {
  recordBtn.disabled = true;
  playBtn.disabled = true;
  stopBtn.disabled = false;

  const startPlayTime = audioContext.currentTime;
  recordedNotes.forEach(({ note, time }) => {
    setTimeout(() => {
      const osc = playNote(audioContext, analyser, note);
      keyboard.activateKey(note);
      setTimeout(() => stopNote(osc), 100);
    }, time);
  });

  setTimeout(() => {
    recordBtn.disabled = false;
    playBtn.disabled = false;
    stopBtn.disabled = true;
  }, recordedNotes[recordedNotes.length - 1].time);
});

stopBtn.addEventListener('click', () => {
  if (audioContext) {
    audioContext.close().then(() => {
      audioContext = null;
      analyser = null;
      recordBtn.disabled = true;
      playBtn.disabled = true;
      stopBtn.disabled = true;
      lessonSelect.disabled = true;
    });
  }
});

const lessons = {
  twinkle: ['C4', 'C4', 'G4', 'G4', 'A4', 'A4', 'G4'],
  happy: ['C4', 'C4', 'D4', 'C4', 'F4', 'E4'],
  lullaby: ['G4', 'E4', 'E4', 'D4', 'C4', 'D4', 'E4', 'D4', 'D4', 'C4']
};

for (const name in lessons) {
  const option = document.createElement('option');
  option.value = name;
  option.textContent = name;
  lessonSelect.appendChild(option);
}

lessonSelect.addEventListener('change', () => {
  const lesson = lessons[lessonSelect.value];
  if (lesson) {
    let index = 0;
    const interval = setInterval(() => {
      if (index < lesson.length) {
        startNote(lesson[index]);
        setTimeout(endNote, 500);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 1000);
  }
});

showNotesCheckbox.addEventListener('change', (e) => {
  if (e.target.checked) {
    keyboard.setAttribute('show-notes', '');
  } else {
    keyboard.removeAttribute('show-notes');
  }
});

// 键盘按键绑定
const keyBindings = {
  'a': 'C4', 'w': 'C#4', 's': 'D4', 'e': 'D#4', 'd': 'E4', 'f': 'F4',
  't': 'F#4', 'g': 'G4', 'y': 'G#4', 'h': 'A4', 'u': 'A#4', 'j': 'B4', 'k': 'C5'
};

document.addEventListener('keydown', (e) => {
  if (!audioContext) return;  // 如果音频上下文未初始化，不响应键盘事件
  const note = keyBindings[e.key];
  if (note && !e.repeat) {
    startNote(note);
  }
});

document.addEventListener('keyup', (e) => {
  if (!audioContext) return;
  const note = keyBindings[e.key];
  if (note) {
    endNote();
  }
});

initAudio();