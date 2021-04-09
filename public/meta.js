var socket = io();

function displayStats(stats) {
  let total = document.getElementById("total");
  total.innerHTML = stats.total;
  
  let top5 = document.getElementById("top5");
  stats.top5 = stats.top5.toString()
  stats.top5 = stats.top5.split(',');
  stats.top5 = stats.top5.join(" <br> ");
  top5.innerHTML = stats.top5;
  
  let weird = document.getElementById("weird");
  stats.weird = stats.weird.toString()
  stats.weird = stats.weird.split(',');
  stats.weird = stats.weird.join(" <br> ");
  weird.innerHTML = stats.weird;
  
  // console.log(stats);
}

function loadMeta() {
  console.log("loading meta");
  socket.emit("get meta");
}

socket.on("spectate", function(data) {
  if(!activePlayer) {
    console.log("receiving grid", data )
    Grid = data.grid;
    nextNumbers = data.nextNumbers;
    score = data.score;
    undoCharges = data.undoCharges;
    playerCol = data.playerCol;
    playerRow = data.playerRow;
    displayStats(data.stats);
    gameState = "main";
  }

  let specWarn = document.getElementById("occupied") ;
  if(data.hasLeft == true) {
    console.log("player has left");
    specWarn.style.visibility = "visible" ;
    specWarn.innerHTML = "<button onClick='takeOver()'> take over </button><br/> <br/>" ;
  } else if (!activePlayer) {
    console.log("still here")
    specWarn.style.visibility = "visible" ;
    specWarn.innerHTML = "<b> Someone is playing right now. </b> <br/> <br/>" ;
  }
});

socket.on("saved", function(data) {
  console.log("meta has been saved");
  gameState = "dead";
});

socket.on("set grid", function(data) {
  console.log("receiving grid", data.grid);
  Grid = data.grid;
  displayStats(data.stats);
  for(let row = 0; row < Grid.rows; row++){
    for(let col = 0; col < Grid.cols; col++){
      Grid.map[row][col].isNeighborOf = function(row, col) {
        if( (col+1 == this.col || col-1 == this.col) && row == this.row ) {
          return true;
        } else if( (row+1 == this.row || row-1 == this.row) && col == this.col) {
          return true;
        } else {
          return false;
        }
      }
      Grid.map[row][col].select = function() {
        this.color = 1;
        this.selected = true;
      }
      Grid.map[row][col].deselect = function() {
        this.color = 0;
        this.selected = false;
        this.preview = 0;
      }
      Grid.map[row][col].newValue = function() {
        this.value = generateNext();
      }
    }
    activePlayer = true;
  }
  
  metaSynced = true;
  gameState = "main";
  move('0');
  backup.push(addToUndo(Grid, nextNumbers, Bag, score, playerCol, playerRow));
});

function saveMeta(chunk) {
  console.log("saving meta", chunk);
  gameState = "saving";
  socket.emit("save meta", chunk);
}

function takeOver() {
  console.log("taking over");
  socket.emit("take over");
}

socket.on("make active", function() {
  document.getElementById("occupied").style.visibility = "hidden";
  
  for(let row = 0; row < Grid.rows; row++){
    for(let col = 0; col < Grid.cols; col++){
      Grid.map[row][col].isNeighborOf = function(row, col) {
        if( (col+1 == this.col || col-1 == this.col) && row == this.row ) {
          return true;
        } else if( (row+1 == this.row || row-1 == this.row) && col == this.col) {
          return true;
        } else {
          return false;
        }
      }
      Grid.map[row][col].select = function() {
        this.color = 1;
        this.selected = true;
      }
      Grid.map[row][col].deselect = function() {
        this.color = 0;
        this.selected = false;
        this.preview = 0;
      }
      Grid.map[row][col].newValue = function() {
        this.value = generateNext();
      }
    }
    activePlayer = true;
  }
  activePlayer = true;
});