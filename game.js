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
}