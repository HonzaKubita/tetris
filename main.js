const version = "Version: 1";
document.getElementById("versionNumber").innerHTML = version;

function create2DArr(width, height, defaultValue) {
  return Array.from({ length: width }, () => Array.from({ length: height }, () => defaultValue));
}

// Dimensions of the board
const boardHeight = 24;
const boardWidth = 10;

// The maximum height of stacked pieces
const deadHeight = 20;

// Variable to store all the shapes
const shapes = {
  i: [[true, true, true, true]],
  j: [[true, true, true], [true, false, false]],
  l: [[true, true, true], [false, false, true]],
  o: [[true, true], [true, true]],
  s: [[true, true, false], [false, true, true]],
  t: [[true, true, true], [false, true, false]],
  z: [[false, true, true], [true, true, false]],
}

// Variable to store which pixels are lit and which aren't (2D array)
let boardPixels = create2DArr(boardHeight, boardWidth, false);

// Variable to store the current piece that's falling
let currPiece = {
  x: 4,
  y: 5,
  rotation: 0,
  shape: shapes.l,
  falling: true,
};

// True if player haven't reached the top of the board
let alive = true;
// If the game is paused
let paused = false;

// Variable to store currently pressed keys
let pressedKeys = [];

// Variable to store players score
let score = 0;
let highScore = localStorage.getItem("highScore")?? 0;

// Reference to the main container
const htmlBoardContainer = document.getElementById("gameBoard");
// Reference to the gameOver screen
const htmlGameOver = document.getElementById("gameOver");
// Reference to the play again button
const htmlPlayAgainBtn = document.getElementById("playAgainBtn");
// Reference to the pauseScreen
const htmlPauseScreen = document.getElementById("pauseScreen");
// Reference to the resume button
const htmlResumeBtn = document.getElementById("resumeBtn");

async function addScore(toAdd) {
  for (let i = 0; i < toAdd / 10; i++) {
    setTimeout(() => {
      score += 10;
    }, i*100);
  }
}

// Register callback for play again button
htmlPlayAgainBtn.addEventListener("click", () => {
  alive = true;
  score = 0;
  boardPixels = create2DArr(boardHeight, boardWidth, false);
  htmlGameOver.classList.add("hidden");
  generateNewPiece();
  mainLoop();
});

// Register callback for resume button
htmlResumeBtn.addEventListener("click", () => {
  console.log("Resuming");
  htmlPauseScreen.classList.add("hidden");
  paused = false;
});

function initPcInput() {
  document.onkeydown = ({key}) => { 
    if (!pressedKeys.includes(key))
      pressedKeys.push(key);
    if (key == 'Escape') {
      console.log("Pause");
      htmlPauseScreen.classList.toggle('hidden');
      paused = !paused;
    }
  }
  document.onkeyup = ({key}) => { 
    pressedKeys.splice(pressedKeys.indexOf(key), 1);
  }
}

function getInput() {
  return {
    left: pressedKeys.includes("ArrowLeft") || pressedKeys.includes("a"),
    right: pressedKeys.includes("ArrowRight") || pressedKeys.includes("d"),
    up: pressedKeys.includes("ArrowUp") || pressedKeys.includes("w"),
    down: pressedKeys.includes("ArrowDown") || pressedKeys.includes("s"),
    rotate: pressedKeys.includes("c"),
  };
}

function renderHtmlText(id, text) {
  document.getElementById(id).innerHTML = text;
}

function renderHtml() {
  renderHtmlText("gameScore", score);
  renderHtmlText("gameHighScore", highScore);
  renderHtmlText("gameLevel", level);
}

function createGrid(width, height, parent) { // This function creates the html elements and inserts them into the DOM

  for (let i = 0; i < height; i++) { // For each row in grid

    const htmlRow = document.createElement("div");
    htmlRow.classList.add("game-row");

    for(let j = 0; j < width; j++) { // For each pixel in row in grid
      const htmlPixel = document.createElement("div");
      htmlPixel.classList.add("game-pixel");
      
      htmlRow.appendChild(htmlPixel);
    }

    parent.appendChild(htmlRow);
  }
}

function boardWithMovingShape() {
  let tempBoard = boardPixels.map((item) => item.slice());
  for (let i = 0; i < currPiece.shape.length; i++) { // For each row of shape
    for (let j = 0; j < currPiece.shape[i].length; j++) { // For each pixel in row of shape
      if(currPiece.shape[i][j]) {
        tempBoard[currPiece.y + i][currPiece.x + j] = true;
      }
    }
  }
  return tempBoard;
}

function renderBoard() { // This function reads the values of the board variable and changes classes of pixels to match the stored values
  const htmlRows = document.getElementById("gameBoard").children;
  const currPixels = boardWithMovingShape();

  for (let i = 0; i < boardHeight; i++) { // For each row

    const htmlPixels = htmlRows[boardHeight - i - 1].children; // The html collection is oriented top to bottom but board is saved bottom to top

    for(let j = 0; j < boardWidth; j++) { // For each pixel in row
      if (currPixels[i][j]) {
        htmlPixels[j].classList.add("game-pixel-lit");
      } else {
        htmlPixels[j].classList.remove("game-pixel-lit");
      }
    }

  }
}

function rotatePiece(piece) {
  let newShape = create2DArr(piece.shape[0].length, piece.shape.length, false);

  for (let i = 0; i < piece.shape[0].length; i++) { // For each column
    for (let j = 0; j < piece.shape.length; j++) { // For each pixel in row in old piece
      newShape[i][j] = piece.shape[j][i];
    }
  }

  piece.shape = newShape.reverse();
}

function collidesWithPixels(piece) {
  if (piece.y == -1 || piece.x < 0 || piece.x + piece.shape[0].length > boardWidth) return true;
  for (let i = 0; i < piece.shape.length; i++) { // For each row in shape
    for (let j = 0; j < piece.shape[i].length; j++) { // For each pixel in row
      if (piece.shape[i][j] && boardPixels[piece.y + i][piece.x + j]) return true;
    }
  }
  return false;
}

function placePieceOnBoard(piece) {
  for (let i = 0; i < piece.shape.length; i++) { // For each row of board
    for (let j = 0; j < piece.shape[i].length; j++) { // For each pixel of row of board
      if(piece.shape[i][j]) {
        boardPixels[piece.y + i][piece.x + j] = true;
      }
    }
  }
}

function generateNewPiece() {
  const shapeNames = Object.keys(shapes); // Get the names of all the shapes
  const randomShapeName = shapeNames[Math.floor(Math.random() * shapeNames.length)]; // Select a random shape name
  const randomShape = shapes[randomShapeName]; // Get the shape object corresponding to the random name
  currPiece.shape = randomShape;

  currPiece.x = Math.floor((boardWidth - currPiece.shape[0].length) / 2);
  currPiece.y = boardHeight - currPiece.shape.length;
  currPiece.falling = true;
}

const baseFallDelay = 600;
let level = 1;
let piecesPlacedInLevel = 0;
let fallDelay = 0;
let inputDelay = 33;
let timeFromLastFall = 0;
let timeFromLastInput = 0;

// Main game loop
function mainLoop() {

  if (paused) {
    requestAnimationFrame(mainLoop);
    return;
  }

  // Move to sides and rotate (Input)
  let currInput = getInput();

  if (timeFromLastInput > inputDelay) {
    timeFromLastInput = 0;
    if (currInput.left) {
      if (!collidesWithPixels({ x: currPiece.x - 1, y: currPiece.y, shape: currPiece.shape}) && currPiece.x > 0) {
        currPiece.x--;
      }
    } else if (currInput.right) {
      if (!collidesWithPixels({ x: currPiece.x + 1, y: currPiece.y, shape: currPiece.shape}) && currPiece.x + currPiece.shape[0].length < boardWidth) {
        currPiece.x++;
      }
    }
  
    if (currInput.rotate) {
      rotatePiece(currPiece);
    }
  }
  timeFromLastInput += 33;

  // Move down or place (Time)

  if (baseFallDelay - level * 10 > 0) {
    fallDelay = baseFallDelay - level * 10;
  } else {
    fallDelay = 0;
  }

  // Speed up

  if (currInput.down) {
    fallDelay = 20;
  }

  // Detect if piece should be falling and has falling set to false
  if (currPiece.falling && !collidesWithPixels({x: currPiece.x, y: currPiece.y - 1, shape: currPiece.shape})) {
    currPiece.falling = true;
  }

  if (timeFromLastFall > fallDelay) { // Move down or set falling false or fix
    if (currPiece.falling) { // Move or set falling false
      if (collidesWithPixels({x: currPiece.x, y: currPiece.y - 1, shape: currPiece.shape})) { // Move if future position doesn't collide with pixels
        currPiece.falling = false;
      } else {
        currPiece.y--;
      }
      timeFromLastFall = 0;
    } else {
      placePieceOnBoard(currPiece);
      piecesPlacedInLevel++;

      generateNewPiece();
    }
  }
  timeFromLastFall += 33;

  // Remove completed rows
  let completedRows = 0;

  for (let i = 0; i < boardHeight - 1; i++) { // For each row
    if (boardPixels[i].every(pixel => pixel == true)) { // If every pixel in row is lit
      boardPixels.splice(i, 1); // Remove row
      boardPixels.push(new Array(boardWidth - 1).fill(false)); // Add new row on top

      completedRows++;
    }
  }

  // Give points for cleared rows
  for (let i = 0; i < completedRows; i++) {
    addScore(100 * level * completedRows);
  }

  // Raise level for placed pieces
  if (piecesPlacedInLevel == level * 10) {
    level++;
    piecesPlacedInLevel = 0;
  }

  // If there is a lit pixel => placed piece in the dead height end the game
  if (boardPixels[deadHeight].find(pixel => pixel)) alive = false;

  // Render

  renderBoard();
  renderHtml();

  // Loop or end
  if (alive) {
    setTimeout(() => {
      requestAnimationFrame(mainLoop);
    }, 33);
  } else {
    console.log("DEAD");
    htmlGameOver.classList.remove("hidden");
    if (score > highScore) {
      localStorage.setItem("highScore", score);
      highScore = score;
    }
  }
}


createGrid(boardWidth, boardHeight, htmlBoardContainer); // Create grid for the game board
initPcInput();
mainLoop();