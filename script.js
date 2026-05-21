const board = document.getElementById("board");
const statusText = document.getElementById("status");
const backButton = document.getElementById("back-button");
const modeScreen = document.querySelector(".mode-screen");
const botModeScreen = document.querySelector(".bot-mode-screen");
const gameContainer = document.querySelector(".game-container");
const resetButton = document.getElementById("reset");

let boardState = Array(9).fill("");
let currentPlayer = "X";
let gameActive = true;
let botDifficulty = "easy";
let inBotMode = false;

// 🌙 Dark Mode Toggle
const darkModeToggle = document.getElementById("dark-mode-toggle");
darkModeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  localStorage.setItem("darkMode", document.body.classList.contains("dark-mode"));
});

if (localStorage.getItem("darkMode") === "true") {
  document.body.classList.add("dark-mode");
}

// 🏆 Mode Selection
document.getElementById("play-friend").addEventListener("click", () => startGame(false));
document.getElementById("play-bot").addEventListener("click", () => switchScreen(modeScreen, botModeScreen));
document.getElementById("back-to-mode").addEventListener("click", () => switchScreen(botModeScreen, modeScreen));

document.getElementById("easy-mode").addEventListener("click", () => startGame(true, "easy"));
document.getElementById("medium-mode").addEventListener("click", () => startGame(true, "normal"));
document.getElementById("hard-mode").addEventListener("click", () => startGame(true, "hard"));

resetButton.addEventListener("click", restartGame);
backButton.addEventListener("click", () => switchScreen(gameContainer, inBotMode ? botModeScreen : modeScreen));

// Close Terms Modal
document.getElementById("close-terms").addEventListener("click", function() {
  document.getElementById("terms-modal").style.display = "none";
  document.querySelector(".mode-screen").style.display = "flex";  // Show the mode selection screen
  document.querySelector(".game-container").style.display = "none"; // Hide the game screen
  document.querySelector(".bot-mode-screen").style.display = "none"; // Hide bot difficulty screen if it's visible
  backButton.style.display = "none"; // Hide back button
});

// Close modal if clicked outside
window.addEventListener("click", function(event) {
  if (event.target == document.getElementById("terms-modal")) {
    document.getElementById("terms-modal").style.display = "none";
    document.querySelector(".mode-screen").style.display = "flex";  // Show the mode selection screen
    document.querySelector(".game-container").style.display = "none"; // Hide the game screen
    document.querySelector(".bot-mode-screen").style.display = "none"; // Hide bot difficulty screen if it's visible
    backButton.style.display = "none"; // Hide back button
  }
});

function switchScreen(from, to) {
  from.style.opacity = "0";
  setTimeout(() => {
    from.style.display = "none";
    to.style.display = "flex";
    setTimeout(() => to.style.opacity = "1", 100);
  }, 300);
}

function startGame(isBot = false, difficulty = "none") {
  boardState.fill("");
  gameActive = true;
  currentPlayer = "X";
  statusText.innerText = "Player X's turn ⏳";
  createBoard();
  switchScreen(modeScreen, gameContainer);
  botModeScreen.style.display = "none";
  backButton.style.display = "block";
  inBotMode = isBot;
  botDifficulty = difficulty;
}

function restartGame() {
  startGame(inBotMode, botDifficulty);
}

function createBoard() {
  board.innerHTML = "";
  boardState.forEach((cell, index) => {
    const cellElement = document.createElement("div");
    cellElement.classList.add("cell");
    cellElement.dataset.index = index;
    cellElement.innerText = cell;

    if (cell === "X") cellElement.classList.add("x");
    if (cell === "O") cellElement.classList.add("o");

    cellElement.addEventListener("click", () => handleCellClick(index), { once: true });
    board.appendChild(cellElement);
  });
}

function handleCellClick(index) {
  if (!gameActive || boardState[index] !== "" || (inBotMode && currentPlayer === "O")) return;

  boardState[index] = currentPlayer;
  createBoard();

  if (checkWinner()) return;

  currentPlayer = currentPlayer === "X" ? "O" : "X";
  statusText.innerText = `${currentPlayer}'s turn ⏳`;

  if (inBotMode && currentPlayer === "O") {
    setTimeout(botMove, 500);
  }
}

function checkWinner() {
  const winCombos = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  for (let combo of winCombos) {
    const [a, b, c] = combo;
    if (boardState[a] && boardState[a] === boardState[b] && boardState[a] === boardState[c]) {
      statusText.innerText = `${currentPlayer} Wins! 🎉🏆`;
      gameActive = false;
      highlightWinningCells(combo);
      return true;
    }
  }

  if (!boardState.includes("")) {
    statusText.innerText = "It's a Tie! 🤝";
    gameActive = false;
    return true;
  }

  return false;
}

function highlightWinningCells(combo) {
  document.querySelectorAll(".cell").forEach((cell, index) => {
    if (combo.includes(index)) {
      cell.classList.add("winner");
    }
  });
}

// 🏆 AI Bot Move (Fixed) with **500ms delay**
function botMove() {
  if (!gameActive) return;

  let availableMoves = boardState
    .map((cell, index) => (cell === "" ? index : null))
    .filter((index) => index !== null);

  if (availableMoves.length === 0) return;

  let bestMove;

  if (botDifficulty === "easy") {
    bestMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
  } else if (botDifficulty === "normal") {
    bestMove = Math.random() < 0.5 ? 
      availableMoves[Math.floor(Math.random() * availableMoves.length)] : 
      minimax([...boardState], "O").index;
  } else {
    bestMove = minimax([...boardState], "O").index;
  }

  if (bestMove !== undefined) {
    setTimeout(() => { // ⏳ **Bot move delay added**
      boardState[bestMove] = "O";
      createBoard();

      if (!checkWinner()) {
        currentPlayer = "X";
        statusText.innerText = "Player X's turn ⏳";
      }
    }, 500);  // **500ms delay**
  }
}

// ✅ Minimax Algorithm (Fixed)
function minimax(newBoard, player) {
  let emptyCells = newBoard
    .map((cell, index) => (cell === "" ? index : null))
    .filter((index) => index !== null);

  if (checkWin(newBoard, "X")) return { score: -10 };
  if (checkWin(newBoard, "O")) return { score: 10 };
  if (emptyCells.length === 0) return { score: 0 };

  let moves = [];
  for (let i of emptyCells) {
    let move = { index: i };
    newBoard[i] = player;
    let result = minimax(newBoard, player === "O" ? "X" : "O");
    move.score = result.score;
    newBoard[i] = "";
    moves.push(move);
  }

  let bestMove = 0;
  let bestScore = player === "O" ? -Infinity : Infinity;

  moves.forEach((move, i) => {
    if ((player === "O" && move.score > bestScore) || (player === "X" && move.score < bestScore)) {
      bestScore = move.score;
      bestMove = i;
    }
  });

  return moves[bestMove];
}

// ✅ Fix: Minimax ke liye correct `checkWin()` function
function checkWin(board, player) {
  return [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ].some(combo => combo.every(index => board[index] === player));
}
