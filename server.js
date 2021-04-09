// Setup basic express server
let express = require("express");
let app = express();
let server = require("http").createServer(app);
let io = require("socket.io")(server)


let port = process.env.PORT || 3000;


var fs = require('fs');

let activePlayer = "";
let activeAway = true;

server.listen(port, function() {
  console.log("Server listening at port %d", port);
});

// Routing
app.use(express.static("public"));

app.get("/wakeup", function(request, response) {
  console.log("i'm awake");
  response.send("i'm awake");
});

io.on("connection", function(socket) {
  let makeActive = false;
  if(activeAway || activePlayer == socket.id || io.engine.clientsCount === 1) {
    activePlayer = socket.id;
    makeActive = true;
    activeAway = false;
  }
  
  socket.on("get meta", function() {
    if(socket.id == activePlayer && activeAway) {
      console.log("returning first player, loading last Grid");
      spectate(socket, true);
    } else if(socket.id == activePlayer) {
      console.log("first player, loading Grid")
      storedMeta();
    } else if(activeAway) {
      console.log("new player, load last Grid")
      spectate(socket, true); // see previous game
    } else {
      console.log("active player, watching Grid")
      spectate(socket, false); // watching
    }
  });
    
  socket.on("save meta", function(chunk) {
    saveMeta(chunk);
  });
  
  socket.on("disconnect", function() {
    if(socket.id == activePlayer) {
      console.log("active user disconnected");
      if(io.engine.clientsCount >= 1 && activeAway){
        console.log("clients", io.engine.clientsCount)
        activePlayer = "";
      } else {
        activeAway = true;
      }
      socket.broadcast.emit("spectate", { 
        grid: spectGrid, 
        nextNumbers: spectNext, 
        score: spectScore, 
        undoCharges: spectUndo, 
        stats: stats(metaMap),
        playerCol: spectCol, 
        playerRow: spectRow, 
        hasLeft: true});    
      }
  });
  
  socket.on("send grid", function(data) {
    // console.log("sending to spectators");
    spectGrid = data.grid;
    spectNext = data.nextNumbers;
    spectScore = data.score;
    spectUndo = data.undoCharges;
    spectCol = data.playerCol;
    spectRow = data.playerRow;
    io.emit("spectate", data);
  });
  
  socket.on("take over", function(data) {
    // console.log("sending to spectators");
    if(activeAway) {
      activePlayer = socket.id;
      socket.emit("make active");
    }
  });
});

// ----------------------------------------------------------------------------

function newCell(row,col) {
  let cell = {
    "value": Math.floor(Math.random()*3)+1,
    "selected": false,
    "color": 0,
    "row": row,
    "col": col,
    "preview": 0, // 0 means no preview
    isNeighborOf: function(row, col) {
      if( (col+1 == this.col || col-1 == this.col) && row == this.row ) {
        return true;
      } else if( (row+1 == this.row || row-1 == this.row) && col == this.col) {
        return true;
      } else {
        return false;
      }
    },
    select: function() {
      this.color = 1;
      this.selected = true;
    },
    deselect: function() {
      this.color = 0;
      this.selected = false;
      this.preview = 0;
    },
    newValue: function() {
      this.value = generateNext();
    }
  }
  return cell;
}
function createGrid(cols, rows) {
  let newGrid = {
    "cols": cols,
    "rows": rows,
    "map": [],
  }
  for(let row = 0; row < newGrid.rows; row++){
    let rowTemp = [];
    for(let col = 0; col < newGrid.cols; col++){
      rowTemp.push(newCell(row,col));
    }
    newGrid.map.push(rowTemp);
  }
  return newGrid;
}
function createMeta(metaR, metaC) {
  let newMeta = {
    "metaR": metaR,
    "metaC": metaC,
    "generation": 0,
    "map": []
  }
  for(let row = 0; row < newMeta.metaR; row++){
    let rowTemp = [];
    for(let col = 0; col < newMeta.metaC; col++){
      rowTemp.push(newCell(row,col));
    }
    newMeta.map.push(rowTemp);
  }
  return newMeta;
}

// ----------------------------------------------------------------------------

let spectGrid = [];
let spectNext = [0, 0, 0, 0, 0];
let spectScore = 0;
let spectUndo = 0;
let spectLevel = 0;
let spectCol = 0;
let spectRow = 0;
function spectate(socket, hasLeft) {
  socket.emit("spectate", { 
    grid: spectGrid, 
    nextNumbers: spectNext, 
    score: spectScore, 
    level: spectLevel, 
    playerCol: spectCol, 
    playerRow: spectRow, 
    stats: stats(metaMap),
    hasLeft: hasLeft
  });
}

function stats(meta) {
  var notDivThree = function (array) {
    let notDivThree = [];
    for (let i = 0; i < array.length; i++) {
      if ( array[i] % 48 != 0 && array[i] != 12 && array[i] != 24 && array[i] > 6) {
        notDivThree.push(array[i]);
      }
    }
    return notDivThree;
  }
  
  let totalV = 0;
  let allValues = new Set();
  for(let i = 0; i < meta.metaR; i++){
    for(let j = 0; j < meta.metaC; j++){
      totalV += meta.map[i][j].value;
      allValues.add(meta.map[i][j].value);
    }
  }
  allValues = Array.from(allValues);
  allValues.sort((a, b) => a < b ? 1 : a > b ? -1 : 0);
  let weirdValues = notDivThree(allValues).slice(0, 5);
  allValues = allValues.slice(0, 5);
  let statValues = {
    total: totalV,
    top5: allValues,
    weird: weirdValues
  }
  return statValues;
}
 
let metaMap = 0;
function storedMeta() {
  const createNew = false;
  if(createNew) {
    console.log("creating new meta")
    metaMap = createMeta(16, 16);
    loadMeta();
  } else {
    console.log("loading stored meta")
    let rawMeta = fs.readFileSync('public/metamap.json');
    fs.readFile('public/metamap.json', (err, data) => {
      if (err) throw err;
      metaMap = JSON.parse(data);
      // console.log(data);
      loadMeta();
    });
  }
}

function loadMeta() {
  for(let i=0; i<1; i++) {
    let rCol = Math.floor(Math.random()*7);
    let rRow = Math.floor(Math.random()*7);
    metaMap = shrinkMeta(metaMap, rCol, rRow, 2);
  }
  
  console.log("loading meta subset")
  let size = 5;
  let spots = [0, 4, 7, 11];
  let colStart = spots[Math.floor(Math.random()*spots.length)];
  let rowStart = spots[Math.floor(Math.random()*spots.length)];
  let metaChunk = {
    "rows": size,
    "cols": size,
    "rowStart": rowStart,
    "colStart": colStart,
    "map": []
  }
  for(let i = 0; i < size; i++){
    let rowTemp = [];
    for(let j = 0; j < size; j++){
       rowTemp.push(metaMap.map[rowStart+i][colStart+j]);
       rowTemp[j].row = i;
       rowTemp[j].col = j;
       rowTemp[j].color = 0;
    }
    metaChunk.map.push(rowTemp);
  }
  
  io.emit("set grid", {
    grid: metaChunk,
    stats: stats(metaMap)
  });
}


function saveMeta(chunk) {
  // console.log(chunk)
  let updatedMeta = metaMap;
  for(let i = 0; i < chunk.rows; i++){
    for(let j = 0; j < chunk.cols; j++){
       updatedMeta.map[chunk.rowStart+i][chunk.colStart+j] = chunk.map[i][j];
       // console.log("saving" + chunk.rowStart+i, chunk.colStart+j);
    }
  }
  metaMap = updatedMeta;
  for(let j=0; j<10; j++) {
    let rCol = Math.floor(Math.random()*15);
    let rRow = Math.floor(Math.random()*15);
    metaMap = shrinkMeta(metaMap, rCol, rRow, 2);
  }

  metaMap.generation = metaMap.generation+1;
  fs.writeFile('public/metamap.json', JSON.stringify(metaMap), (err) => {
    if (err) throw err;
    console.log('Data written to file');
    io.emit("saved");
  });
}

function shrinkMeta(meta, rowStart, colStart, size) {
  let highestNum = 0;
  let highestRow = 0;
  let highestCol = 0;
  let hi2Num = 0;
  let hi2NumRow = 0;
  let hi2NumCol = 0;
  // console.log(meta.metaR, rowStart+size, meta.metaC, colStart+size);
  if(meta.metaR > rowStart+size && meta.metaC > colStart+size) {
    for(let i = 0; i <= size; i++){
      // let rowTemp = [];
      for(let j = 0; j <= size; j++){
         if(meta.map[rowStart+i][colStart+j].value>highestNum){
           hi2Num = highestNum;
           hi2NumRow = highestRow;
           hi2NumCol = highestCol;
           highestNum = meta.map[rowStart+i][colStart+j].value;
           highestRow = rowStart+i;
           highestCol = colStart+j;
         }
      }
    }
    if(meta.map[hi2NumRow][hi2NumCol].value > 3) {
      console.log("2ndHi: shrinking " + meta.map[hi2NumRow][hi2NumCol].value + " becomes " +  Math.floor(meta.map[hi2NumRow][hi2NumCol].value/2 +.5));
      meta.map[hi2NumRow][hi2NumCol].value = Math.max( 1, Math.floor(meta.map[hi2NumRow][hi2NumCol].value/2 +.5) );
    } else if(meta.map[highestRow][highestCol].value > 3 ) {
      if(meta.map[hi2NumRow][hi2NumCol].value > 3) {
        console.log("highest: shrinking " + meta.map[highestRow][highestCol].value + " becomes " +  meta.map[hi2NumRow][hi2NumCol].value);
        meta.map[highestRow][highestCol].value = meta.map[hi2NumRow][hi2NumCol].value;
      } else {
        console.log("highest: shrinking " + meta.map[highestRow][highestCol].value + " becomes " +  Math.floor(meta.map[highestRow][highestCol].value/2 +.5));
        meta.map[highestRow][highestCol].value = Math.floor(meta.map[highestRow][highestCol].value/2 +.5);
      }
    } else {
      // console.log("-1", Math.max(1, meta.map[highestRow][highestCol].value-1))
      meta.map[highestRow][highestCol].value == Math.max(1, meta.map[highestRow][highestCol].value-1);
    }
  }
  return meta;
}