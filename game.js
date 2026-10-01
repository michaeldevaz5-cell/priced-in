// Load the puzzles file, then show the first card
fetch("puzzles.json")
  .then(response => response.json())
  .then(puzzles => {
    const puzzle = puzzles[0];
    console.log(puzzle);
    showCard(puzzle);
  });

// Put a puzzle's text into the page
function showCard(puzzle) {
  document.getElementById("when").textContent = puzzle.when;
  document.getElementById("disguise").textContent = puzzle.disguise;
  document.getElementById("mood").textContent = puzzle.mood;
  document.getElementById("other-news").textContent = puzzle.otherNews;
  showRows(puzzle.rows);
}

// Build the expected-vs-actual table from a list of rows
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