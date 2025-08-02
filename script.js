const wordDisplay = document.getElementById("wordDisplay");
const wrongLettersDisplay = document.getElementById("wrongLetters");
const hintText = document.getElementById("hint");
const message = document.getElementById("message");
const popup = document.getElementById("popup");
const winOverlay = document.getElementById("winOverlay");
const correctWordSpan = document.getElementById("correctWord");
const keyboard = document.getElementById("keyboard");
const canvas = document.getElementById("hangmanCanvas");
const ctx = canvas.getContext("2d");

// Button references
const resetButton = document.getElementById("reset");
const newGameButton = document.getElementById("newGame");
const resetWinButton = document.getElementById("resetWin");
const newGameWinButton = document.getElementById("newGameWin");

let selectedWord = "";
let correctLetters = [];
let wrongLetters = [];

// 🔹 Hangman body parts drawing
function drawGallows() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;

  // Base
  ctx.beginPath();
  ctx.moveTo(10, 240);
  ctx.lineTo(190, 240);
  ctx.stroke();

  // Pole
  ctx.beginPath();
  ctx.moveTo(50, 240);
  ctx.lineTo(50, 20);
  ctx.stroke();

  // Beam
  ctx.beginPath();
  ctx.moveTo(50, 20);
  ctx.lineTo(150, 20);
  ctx.stroke();

  // Rope
  ctx.beginPath();
  ctx.moveTo(150, 20);
  ctx.lineTo(150, 50);
  ctx.stroke();
}

function drawHead() {
  ctx.beginPath();
  ctx.arc(150, 70, 20, 0, Math.PI * 2);
  ctx.stroke();
}
function drawBody() {
  ctx.beginPath();
  ctx.moveTo(150, 90);
  ctx.lineTo(150, 150);
  ctx.stroke();
}
function drawLeftArm() {
  ctx.beginPath();
  ctx.moveTo(150, 100);
  ctx.lineTo(120, 130);
  ctx.stroke();
}
function drawRightArm() {
  ctx.beginPath();
  ctx.moveTo(150, 100);
  ctx.lineTo(180, 130);
  ctx.stroke();
}
function drawLeftLeg() {
  ctx.beginPath();
  ctx.moveTo(150, 150);
  ctx.lineTo(120, 190);
  ctx.stroke();
}
function drawRightLeg() {
  ctx.beginPath();
  ctx.moveTo(150, 150);
  ctx.lineTo(180, 190);
  ctx.stroke();
}

const drawParts = [
  drawHead,
  drawBody,
  drawLeftArm,
  drawRightArm,
  drawLeftLeg,
  drawRightLeg
];

// 🔹 Word list with hints (fallback and primary)
const wordList = [
  { word: 'javascript', hint: 'Popular programming language for web development' },
  { word: 'computer', hint: 'Electronic device for processing data' },
  { word: 'elephant', hint: 'Large mammal with a trunk and big ears' },
  { word: 'rainbow', hint: 'Colorful arc in the sky after rain' },
  { word: 'guitar', hint: 'Musical instrument with strings' },
  { word: 'ocean', hint: 'Large body of salt water' },
  { word: 'butterfly', hint: 'Colorful flying insect with wings' },
  { word: 'mountain', hint: 'High elevation landform' },
  { word: 'library', hint: 'Place where books are kept and borrowed' },
  { word: 'pizza', hint: 'Popular Italian dish with toppings' },
  { word: 'camera', hint: 'Device used to take photographs' },
  { word: 'bicycle', hint: 'Two-wheeled vehicle powered by pedaling' },
  { word: 'diamond', hint: 'Precious gemstone, hardest natural substance' },
  { word: 'volcano', hint: 'Mountain that can erupt with lava' },
  { word: 'astronaut', hint: 'Person who travels to space' },
  { word: 'telephone', hint: 'Device used for voice communication' },
  { word: 'umbrella', hint: 'Portable shelter from rain or sun' },
  { word: 'chocolate', hint: 'Sweet treat made from cocoa beans' },
  { word: 'keyboard', hint: 'Computer input device with keys' },
  { word: 'sandwich', hint: 'Food with filling between bread slices' },
  { word: 'fireworks', hint: 'Explosive devices that create colorful displays' },
  { word: 'telescope', hint: 'Instrument for observing distant objects' },
  { word: 'penguin', hint: 'Flightless bird that lives in cold regions' },
  { word: 'treasure', hint: 'Valuable items or wealth that is hidden' },
  { word: 'dragon', hint: 'Mythical creature that breathes fire' }
];

// 🔹 Fetch word and hint (with fallback)
async function getRandomWord() {
  try {
    // Try to get random word from API
    const wordRes = await fetch("https://random-word-api.herokuapp.com/word?number=1");
    const wordData = await wordRes.json();
    const word = wordData[0].toLowerCase();

    // Try to get hint from dictionary API
    const hintRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    const hintData = await hintRes.json();

    let hint = null;
    if (Array.isArray(hintData) && hintData[0]?.meanings?.[0]?.definitions?.[0]?.definition) {
      hint = hintData[0].meanings[0].definitions[0].definition;
      
      // Clean up the hint if it's too long
      if (hint.length > 100) {
        hint = hint.substring(0, 100) + "...";
      }
      
      return { word, hint };
    }
    
    // If API hint failed, fall back to local word list
    throw new Error("No hint from API");
    
  } catch (err) {
    console.log("Using fallback word list");
    // Use local word list as fallback
    const randomIndex = Math.floor(Math.random() * wordList.length);
    return wordList[randomIndex];
  }
}

// 🔹 Create confetti animation
function createConfetti() {
  const colors = ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b'];
  
  for (let i = 0; i < 50; i++) {
    setTimeout(() => {
      const confetti = document.createElement('div');
      confetti.className = 'win-confetti';
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDelay = Math.random() * 3 + 's';
      winOverlay.appendChild(confetti);
      
      // Remove confetti after animation
      setTimeout(() => {
        confetti.remove();
      }, 3000);
    }, i * 50);
  }
}

function updateWordDisplay() {
  wordDisplay.textContent = selectedWord
    .split("")
    .map(letter => (correctLetters.includes(letter) ? letter : "_"))
    .join(" ");
}

function updateWrongLetters() {
  wrongLettersDisplay.textContent = wrongLetters.length
    ? "Wrong: " + wrongLetters.join(", ")
    : "";

  if (wrongLetters.length <= drawParts.length) {
    drawParts[wrongLetters.length - 1]?.();
  }
}

function disableKeyboard() {
  document.querySelectorAll(".key").forEach(btn => (btn.disabled = true));
}

function enableKeyboard() {
  document.querySelectorAll(".key").forEach(btn => (btn.disabled = false));
}

function hideAllPopups() {
  popup.classList.remove('show');
  winOverlay.classList.remove('show');
  popup.style.display = 'none';
}

function checkGameStatus() {
  const won = selectedWord.split("").every(l => correctLetters.includes(l));
  const lost = wrongLetters.length >= drawParts.length;

  if (won) {
    // Show win overlay with celebration
    winOverlay.classList.add('show');
    createConfetti();
    disableKeyboard();
  } else if (lost) {
    // Show lose popup
    correctWordSpan.textContent = selectedWord.toUpperCase();
    popup.classList.add('show');
    popup.style.display = 'flex';
    disableKeyboard();
  }
}

function handleGuess(letter) {
  const btn = document.getElementById(`key-${letter}`);
  btn.disabled = true;

  if (selectedWord.includes(letter)) {
    correctLetters.push(letter);
    btn.style.background = 'linear-gradient(145deg, #27ae60, #2ecc71)';
  } else {
    wrongLetters.push(letter);
    btn.style.background = 'linear-gradient(145deg, #e74c3c, #c0392b)';
  }

  updateWordDisplay();
  updateWrongLetters();
  checkGameStatus();
}

function createKeyboard() {
  const letters = "abcdefghijklmnopqrstuvwxyz".split("");
  keyboard.innerHTML = "";
  letters.forEach(letter => {
    const btn = document.createElement("button");
    btn.textContent = letter;
    btn.id = `key-${letter}`;
    btn.className = "key";
    btn.addEventListener("click", () => handleGuess(letter));
    keyboard.appendChild(btn);
  });
}

async function startGame() {
  hideAllPopups();
  correctLetters = [];
  wrongLetters = [];
  drawGallows();

  const { word, hint } = await getRandomWord();
  selectedWord = word;
  hintText.textContent = "Hint: " + hint;

  updateWordDisplay();
  updateWrongLetters();
  createKeyboard();
  enableKeyboard();
}

async function resetGame() {
  // Same word, reset progress
  hideAllPopups();
  correctLetters = [];
  wrongLetters = [];
  drawGallows();
  
  updateWordDisplay();
  updateWrongLetters();
  createKeyboard();
  enableKeyboard();
}

// Event listeners for all buttons
resetButton?.addEventListener("click", resetGame);
newGameButton?.addEventListener("click", startGame);
resetWinButton?.addEventListener("click", resetGame);
newGameWinButton?.addEventListener("click", startGame);

// Keyboard support
document.addEventListener('keydown', (e) => {
  const letter = e.key.toLowerCase();
  if (letter >= 'a' && letter <= 'z') {
    const btn = document.getElementById(`key-${letter}`);
    if (btn && !btn.disabled) {
      handleGuess(letter);
    }
  }
});

// Start the game
startGame();