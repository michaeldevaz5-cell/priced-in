// Remember the current card and the player's choice
let currentPuzzle;
let pickedDir;

// Load the puzzles file, then show the first card
fetch("puzzles.json")
  .then(response => response.json())
  .then(puzzles => {
    currentPuzzle = puzzles[0];
    console.log(currentPuzzle);
    showCard(currentPuzzle);
  });

// Put a puzzle's text into the page
function showCard(puzzle) {
  document.getElementById("when").textContent = puzzle.when;
  document.getElementById("disguise").textContent = puzzle.disguise;
  document.getElementById("mood").textContent = puzzle.mood;
  document.getElementById("other-news").textContent = puzzle.otherNews;
  showRows(puzzle.rows);
}

/// Build the expected-vs-actual table from a list of rows
function showRows(rows) {
  const table = document.getElementById("rows");
  table.innerHTML = "<tr><th></th><th>Expected</th><th>Actual</th><th></th></tr>";

  rows.forEach(row => {
    let result;
    if (row.actual > row.expected) {
      result = "Beat";
    } else if (row.actual < row.expected) {
      result = "Miss";
    } else {
      result = "In line";
    }

    const line = document.createElement("tr");
    line.innerHTML = `<td>${row.label}</td><td>${row.expected}</td><td>${row.actual}</td><td>${result}</td>`;
    table.appendChild(line);
  });
}

// When Up or Down is clicked, remember it and move on to the size question
document.getElementById("btn-up").addEventListener("click", () => pickDirection("up"));
document.getElementById("btn-down").addEventListener("click", () => pickDirection("down"));

function pickDirection(dir) {
  pickedDir = dir;
  console.log("Picked:", pickedDir);
  document.getElementById("dir-buttons").hidden = true;
  document.getElementById("size-buttons").hidden = false;
}