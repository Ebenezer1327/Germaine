// Wordle Game Logic

// 24 words (one for each week) - user will provide later
// For now, using placeholder words
const WORDS = [
  'HEART', 'LOVE', 'SWEET', 'DREAM', 'HAPPY', 'PEACE', 'JOY', 'SMILE',
  'HOPE', 'KIND', 'WARM', 'SOFT', 'GENTLE', 'CUTE', 'PINK', 'ROSE',
  'PEARL', 'STAR', 'MOON', 'SUN', 'SKY', 'CLOUD', 'RAIN', 'SNOW'
].map(w => w.padEnd(5).substring(0, 5).toUpperCase());

// Get the current week's word based on mystery box schedule
// Starting from March 9, 2026 (week 0)
function getCurrentWord() {
  const startDate = new Date('2026-03-09T01:00:00Z'); // March 9, 2026, 9 AM SGT
  const now = new Date();
  const diffTime = now - startDate;
  const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
  
  // Clamp to valid range (0-23)
  const weekIndex = Math.max(0, Math.min(23, diffWeeks));
  return WORDS[weekIndex];
}

class WordleGame {
  constructor() {
    this.targetWord = getCurrentWord();
    this.currentRow = 0;
    this.currentCol = 0;
    this.maxRows = 6;
    this.maxCols = 5;
    this.gameOver = false;
    this.won = false;
    
    this.initGrid();
    this.initKeyboard();
    this.setupEventListeners();
    
    console.log('Target word:', this.targetWord); // For debugging (remove in production)
  }

  initGrid() {
    const grid = document.getElementById('wordle-grid');
    grid.innerHTML = '';
    
    for (let row = 0; row < this.maxRows; row++) {
      for (let col = 0; col < this.maxCols; col++) {
        const cell = document.createElement('div');
        cell.className = 'wordle-cell';
        cell.dataset.row = row;
        cell.dataset.col = col;
        grid.appendChild(cell);
      }
    }
  }

  initKeyboard() {
    const keys = document.querySelectorAll('.key');
    keys.forEach(key => {
      key.addEventListener('click', () => {
        const keyValue = key.dataset.key;
        this.handleKeyPress(keyValue);
      });
    });
  }

  setupEventListeners() {
    document.addEventListener('keydown', (e) => {
      if (this.gameOver) return;
      
      const key = e.key.toUpperCase();
      if (key === 'ENTER') {
        this.handleKeyPress('Enter');
      } else if (key === 'BACKSPACE') {
        this.handleKeyPress('Backspace');
      } else if (key.length === 1 && /[A-Z]/.test(key)) {
        this.handleKeyPress(key);
      }
    });
  }

  handleKeyPress(key) {
    if (this.gameOver) return;

    if (key === 'Enter') {
      this.submitGuess();
    } else if (key === 'Backspace') {
      this.deleteLetter();
    } else if (/[A-Z]/.test(key) && this.currentCol < this.maxCols) {
      this.addLetter(key);
    }
  }

  addLetter(letter) {
    if (this.currentCol >= this.maxCols) return;
    
    const cell = this.getCell(this.currentRow, this.currentCol);
    cell.textContent = letter;
    cell.dataset.letter = letter;
    this.currentCol++;
  }

  deleteLetter() {
    if (this.currentCol <= 0) return;
    
    this.currentCol--;
    const cell = this.getCell(this.currentRow, this.currentCol);
    cell.textContent = '';
    delete cell.dataset.letter;
  }

  submitGuess() {
    if (this.currentCol !== this.maxCols) {
      this.showMessage('Not enough letters!', 'error');
      return;
    }

    const guess = this.getCurrentGuess();
    if (!this.isValidWord(guess)) {
      this.showMessage('Not a valid word!', 'error');
      return;
    }

    this.evaluateGuess(guess);
    this.currentRow++;
    this.currentCol = 0;

    if (this.won || this.currentRow >= this.maxRows) {
      this.gameOver = true;
      if (this.won) {
        this.showMessage(`🎉 Amazing! You got it in ${this.currentRow} tries!`, 'success');
      } else {
        this.showMessage(`The word was: ${this.targetWord}`, 'error');
      }
    }
  }

  getCurrentGuess() {
    let guess = '';
    for (let col = 0; col < this.maxCols; col++) {
      const cell = this.getCell(this.currentRow, col);
      guess += cell.textContent || '';
    }
    return guess;
  }

  isValidWord(word) {
    // For now, accept any 5-letter word
    // You can add a dictionary check later
    return word.length === 5 && /^[A-Z]{5}$/.test(word);
  }

  evaluateGuess(guess) {
    const target = this.targetWord.split('');
    const guessArr = guess.split('');
    const result = new Array(5).fill('absent');
    const targetCounts = {};
    const guessCounts = {};

    // Count letters in target word
    target.forEach(letter => {
      targetCounts[letter] = (targetCounts[letter] || 0) + 1;
    });

    // First pass: mark correct positions (green)
    guessArr.forEach((letter, i) => {
      if (letter === target[i]) {
        result[i] = 'correct';
        guessCounts[letter] = (guessCounts[letter] || 0) + 1;
      }
    });

    // Second pass: mark present but wrong position (yellow)
    guessArr.forEach((letter, i) => {
      if (result[i] === 'correct') return;
      
      const correctCount = targetCounts[letter] || 0;
      const usedCount = guessCounts[letter] || 0;
      
      if (correctCount > usedCount) {
        result[i] = 'present';
        guessCounts[letter] = (guessCounts[letter] || 0) + 1;
      }
    });

    // Update cell colors and keyboard
    guessArr.forEach((letter, i) => {
      const cell = this.getCell(this.currentRow, i);
      cell.classList.add(result[i]);
      
      // Update keyboard key color
      const key = document.querySelector(`.key[data-key="${letter}"]`);
      if (key) {
        if (result[i] === 'correct') {
          key.classList.add('key--correct');
        } else if (result[i] === 'present' && !key.classList.contains('key--correct')) {
          key.classList.add('key--present');
        } else if (result[i] === 'absent' && !key.classList.contains('key--correct') && !key.classList.contains('key--present')) {
          key.classList.add('key--absent');
        }
      }
    });

    // Check if won
    if (result.every(r => r === 'correct')) {
      this.won = true;
    }
  }

  getCell(row, col) {
    return document.querySelector(`.wordle-cell[data-row="${row}"][data-col="${col}"]`);
  }

  showMessage(text, type = 'info') {
    const messageEl = document.getElementById('wordle-message');
    messageEl.textContent = text;
    messageEl.className = `wordle-message wordle-message--${type}`;
    messageEl.style.display = 'block';
    
    setTimeout(() => {
      messageEl.style.display = 'none';
    }, 3000);
  }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
  new WordleGame();
});
