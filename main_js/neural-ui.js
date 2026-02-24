/* ===============================
   NEURAL GLOBAL ENGINE
================================ */

export function initNeuralFX() {

  /* ===== Bruit ambiant spatial ===== */
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  function ambientNoise() {
    const bufferSize = 2 * audioCtx.sampleRate;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.02;
    }

    const whiteNoise = audioCtx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const gainNode = audioCtx.createGain();
    gainNode.gain.value = 0.015;

    whiteNoise.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    whiteNoise.start();
  }

  document.body.addEventListener("click", () => {
    ambientNoise();
  }, { once: true });

  /* ===== Scan vertical ===== */
  const scan = document.createElement("div");
  scan.style.position = "fixed";
  scan.style.top = "0";
  scan.style.left = "0";
  scan.style.width = "100%";
  scan.style.height = "2px";
  scan.style.background =
    "linear-gradient(90deg, transparent, #60a5fa, transparent)";
  scan.style.zIndex = "9999";
  scan.style.animation = "scanMove 4s linear infinite";

  document.body.appendChild(scan);

  const style = document.createElement("style");
  style.innerHTML = `
    @keyframes scanMove {
      0% { top:0%; opacity:.2 }
      50% { opacity:.8 }
      100% { top:100%; opacity:.2 }
    }
  `;
  document.head.appendChild(style);

}
