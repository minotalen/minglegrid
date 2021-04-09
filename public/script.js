let w, h;
let cw, ch; //column width, height
let rw, rh; // row width, height
let d;
let x, y;
let b;
let offset = 85;
let score = 0;
let fuelUsed = 0;
let scores = [];
let scoreShow = false;
let path = [];
let rowPreview = false;
let colPreview = false;
let activeItem = 0;
let unequal = false; // for sum items
let activePlayer = false;

let firstUndo = true;
let timesUndone = 0;
let justUndone = false;
let restartConfirm = false;

let Bag = newBag();
let nextNumbers = [0, 0, 0, 0];

let gameState; // main, choice, dead

let playerRow = 2;
let playerCol = 2;
let playerNum = 0;
let Grid;

//undo storage
let backup = [];
loadMeta();

window.addEventListener("keydown", function(e) {
    if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
        e.preventDefault();
    }
}, false);

function setup() {
  let square = 0;
  if(windowHeight > windowWidth) {
    square = windowWidth;
  } else {
    square = windowHeight;
  }
  createCanvas(square, square);
  generateNext(5);
  textFont("Fredoka One");
  textAlign(CENTER, CENTER);
  gameState = "loading";
  drawCharges();
  itemDraw();
}

function windowResized() {
  let square = 0;
  if(windowHeight > windowWidth) {
    square = windowWidth;
  } else {
    square = windowHeight;
  }
  createCanvas(square, square);
}

function draw() {
  let scoreDiv = document.getElementById("score") ;
  scoreDiv.innerHTML = score

  background(220);

  if (gameState != "loading") {
    cw = (width - offset - 20) / Grid.cols;
    ch = height;
    rw = width;
    rh = (width - offset - 20) / Grid.rows;
    // grid coloring
    for (cn = 0; cn < Grid.cols; cn++) {
      for (rn = 0; rn < Grid.rows; rn++) {
        switch (Grid.map[cn][rn].color) {
          case 0:
            switch (Grid.map[cn][rn].value) {
              case 1:
                fill("#80BD68");
                break;
              case 2:
                fill("#69BA75");
                break;
              case 3:
                fill("#53B683");
                break;
              case 4:
                fill("#3FB290");
                break;
              case 5:
              case 6:
                fill("#31AC9C");
                break;
              case 8:
              case 12:
                fill("#2EA6A5");
                break;
              case 16:
              case 24:
                fill("#399FAC");
                break;
              case 48:
                fill("#4B97AF");
                break;
              case 96:
                fill("#5D8FAF");
                break;
              case 192:
                fill("#6F85AC");
                break;
              case 384:
                fill("#7F7CA5");
                break;
              case 768:
                fill("#8C729B");
                break;
              case 1536:
                fill("#96698E");
                break;
              case 3072:
                fill("#9D6180");
                break;
              default:
                fill("#A05971");
                break;
            }
            break;
          case 1:
            fill(255, 204, 0);
            break;
          case 2:
            fill(206, 149, 0);
            break;
          case 3: // col, row
            fill("#aaf99a");
            break;
          case "turn": // turn
            fill(185, 142, 204);
            break;
          case "swap": // swap
          case "comboBreak": // swap
            fill(171, 236, 106);
            break;
          case "player": // swap
            fill(255, 153, 102);
            break;
        }
        let x = cn * cw;
        let y = rn * rh;
        strokeWeight(5);
        rect(x + 15, y + offset, cw, rh);
        fill(0, 0, 0);
        const fontSizes = [76, 65, 56, 49]
        if (Grid.map[cn][rn].preview == 0) {
          // different text sizes for different digits
          if (Grid.map[cn][rn].value >= 1000) {
            textSize(fontSizes[3]);
          } else if (Grid.map[cn][rn].value >= 100) {
            textSize(fontSizes[2]);
          } else if (Grid.map[cn][rn].value >= 10) {
            textSize(fontSizes[1]);
          } else {
            textSize(fontSizes[0]);
          }
          strokeWeight(0);
          text(
            Grid.map[cn][rn].value,
            x + cw / 2 + 15,
            y + rh / 2 + offset + 4
          );
        } else {
          if (Grid.map[cn][rn].preview >= 1000) {
            textSize(fontSizes[3]);
          } else if (Grid.map[cn][rn].preview >= 100) {
            textSize(fontSizes[2]);
          } else if (Grid.map[cn][rn].preview >= 10) {
            textSize(fontSizes[1]);
          } else {
            textSize(fontSizes[0]);
          }
          strokeWeight(0);
          text(
            Grid.map[cn][rn].preview,
            x + cw / 2 + 15,
            y + rh / 2 + offset + 4
          );
        }
      }
    }


    textSize(80);
    strokeWeight(1);
    // game states
    if (!restartConfirm && gameState == "main") {
      if (checkAllSame() && path.length != 0) {
        for (let i = path.length; i <= nextNumbers.length; i++) {
          // display next number preview
          text(nextNumbers[i - 1], (i - 1) * cw + 15 + cw, 0 + offset / 2);
        }
      } else {
        if (score != 0) {
          for (let i = 0; i < nextNumbers.length; i++) {
            text(nextNumbers[i], i * cw + 15 + cw, 0 + offset / 2);
          }
        }
      }
    } else if (gameState == "level") {
      text("reached " + levelVal[level], offset + cw, 0 + offset / 2);
    } else if (gameState == "dead") {
      fill(0);
      textAlign(LEFT, CENTER);
      textSize(42);
      text(usedItems, offset, 0 + offset / 2);
      fill(155, 155, 155, 144);
      rect(
        offset + (width - offset * 2) / 4,
        offset + (height - offset * 2) / 4,
        (width - offset * 2) / 2,
        (height - offset * 2) / 2
      );
      textAlign(CENTER, CENTER);
      textSize(74);
      fill(0);
      text(
        "Game",
        offset + ((width - offset * 2) * 2.15) / 5,
        offset + ((height - offset * 2) * 2.15) / 5
      );
      text(
        "Over",
        offset + ((width - offset * 2) * 2.85) / 5,
        offset + ((height - offset * 2) * 2.85) / 5
      );
    }
    textAlign(RIGHT, CENTER);
  }
  textAlign(CENTER, CENTER);
  if (gameState == "level") {
    itemDialog(selection);
  }
  drawCharges();

}

function keyPressed() {
  if(activePlayer) {
    if (key == "w" || keyCode === UP_ARROW) {
      move("w");
    }
    if (key == "a" || keyCode == LEFT_ARROW) {
      move("a");
    }
    if (key == "s" || keyCode === DOWN_ARROW) {
      move("s");
    }
    if (key == "d" || keyCode === RIGHT_ARROW) {
      move("d");
    }
    if (key == "r") {
      restart5();
    }
    if (key == "5") {
      restart5();
    }
    // if (key == 'x') {
    //   scores = [];
    // }
    if (key == "$") {
      scoreShow = !scoreShow;
    }
    if (key == "u") {
      undo();
    }
    if (key == "i") {
      alert(usedItems);
    }
    // if (key == 'f') {
    //   alert(metaMap.fuel);
    // }
    if (key == "1") {
      itemSelect(1)
    } else if (key == "2") {
      itemSelect(2)
    } else if (key == "3") {
      itemSelect(3)
    }

    socket.emit("send grid", { grid: Grid , nextNumbers: nextNumbers, score: score, undoCharges: undoCharges, level: level, playerCol: playerCol, playerRow: playerRow} );
    itemDraw();
  }
}

function itemSelect(key) {
  if (key == 0) {
      activeItem = 0;
  }
  if (key == 1 && Items[0].charge > 0) {
    if (activeItem != 1) {
      itemMode = Items[0].type;
      activeItem = 1;
    } else {
      itemMode = 0;
      activeItem = 0;
    }
  }
  if (key == 2 && Items[1].charge > 0) {
    if (activeItem != 2) {
      itemMode = Items[1].type;
      activeItem = 2;
    } else {
      itemMode = 0;
      activeItem = 0;
    }
  }
  if (key == 3 && Items[2].charge > 0) {
    if (activeItem != 3) {
      itemMode = Items[2].type;
      activeItem = 3;
    } else {
      itemMode = 0;
      activeItem = 0;
    }
  }
  move("0");
  itemDraw();
}

function move(dir) {
  if (gameState != "main") return;

  let nextPlayerRow = playerRow;
  let nextPlayerCol = playerCol;
  switch (dir) {
    case "w":
      if (playerRow > 0) {
        nextPlayerRow = playerRow - 1;
      }
      break;
    case "s":
      if (playerRow < 4) {
        nextPlayerRow = playerRow + 1;
      }
      break;
    case "a":
      if (playerCol > 0) {
        nextPlayerCol = playerCol - 1;
      }
      break;
    case "d":
      if (playerCol < 4) {
        nextPlayerCol = playerCol + 1;
      }
      break;
    case "0":
      nextPlayerCol = playerCol;
      nextPlayerRow = playerRow;
      break;
  }
  firstUndo = true;

  Grid.map[playerCol][playerRow].color = 0;
  playerCol = nextPlayerCol;
  playerRow = nextPlayerRow;
  Grid.map[playerCol][playerRow].color = "player";
  if (playerNum == 0 || playerNum == Grid.map[playerCol][playerRow].value || itemMode != 0) {
    // dragging code
    if (path.length > 0 && Grid.map[playerCol][playerRow].isNeighborOf(path[path.length - 1][0],path[path.length - 1][1])) {
      path.push([playerCol, playerRow]);
      dragCross(playerCol, playerRow);
      Grid.map[playerCol][playerRow].select();
      if (itemMode == 0) {
          if (path.length - 2 >= 0) {
            Grid.map[path[path.length - 2][0]][
              path[path.length - 2][1]
            ].color = 2;
            Grid.map[path[path.length - 2][0]][
              path[path.length - 2][1]
            ].preview = 0;
          }
          if (checkAllSame()) {
            // preview combined number
            Grid.map[playerCol][playerRow].preview =
              Grid.map[playerCol][playerRow].value * path.length;
            // preview next numbers
            drawPreview();
          } else {
            for (let i = 0; i < path.length - 1; i++) {
              Grid.map[path[i][0]][path[i][1]].preview = 0;
          }
        }
      }
      if (itemMode) itemDrag();
    } else if (path.length == 0) {
      // start chain
      path.push([playerCol, playerRow]);
      itemClick();
      Grid.map[playerCol][playerRow].select();
    }
    playerNum = Grid.map[playerCol][playerRow].value;
    // console.log(path, playerNum);
  } else {
    if (path.length > 1) {
      combineNumbers(path);
    } else {
      removeCharge();
    }
    path = [];
    for (let row in Grid.map) {
      for (let col in Grid.map[row]) {
        Grid.map[playerCol][playerRow].color = 0;
        Grid.map[col][row].deselect();
      }
    }
    Grid.map[playerCol][playerRow].color = "player";
    Grid.map[playerCol][playerRow].select();
    playerNum = Grid.map[playerCol][playerRow].value;
    path.push([playerCol, playerRow]);
    backup.push(addToUndo(Grid, nextNumbers, Bag, score, playerCol, playerRow));
  }

  if (gameOver()) {
    gameState = "dead";
  }
}

function mousePressed() {
  // pressed();
}
function mouseDragged() {
  // dragged();
}
function mouseReleased() {
  // release();
}

function touchStarted() {
  // pressed();
}
function touchMoved() {
  // dragged();
  return false;
}
function touchEnded() {
  // release();
}

function pressed() {
  if (mouseX >= width - offset && !justUndone) undo();
  if (gameState == "main") {
    if (
      !(
        mouseX <= offset ||
        mouseY <= offset ||
        mouseX >= width - offset ||
        mouseY >= height - offset
      )
    ) {
      let col = Math.floor((mouseX - offset) / cw);
      let row = Math.floor((mouseY - offset) / rh);
      Grid.map[col][row].select();
      restartConfirm = false;
      path.push([col, row]);
    }
    if (mouseButton === RIGHT) {
      path = [];
    }
    itemClick();
    itemPressed();
  } else if (gameState == "level") {
    levelPress(mouseX, mouseY);
  }
}
function dragged() {
  // mouse oputside of grid
  if (bounds()) {
    maxLength(0);
  } else {
    // get mouse position as grid coordinates
    let col = Math.floor((mouseX - offset) / cw);
    let row = Math.floor((mouseY - offset) / rh);

    // check if the drag crosses itself
    dragCross(col, row);

    // adding a cell to the array
    if (
      path.length > 0 &&
      Grid.map[col][row].isNeighborOf(
        path[path.length - 1][0],
        path[path.length - 1][1]
      )
    ) {
      Grid.map[col][row].select();
      path.push([col, row]);
      if (itemMode == 0) {
        if (path.length - 2 >= 0) {
          Grid.map[path[path.length - 2][0]][
            path[path.length - 2][1]
          ].color = 2;
          Grid.map[path[path.length - 2][0]][
            path[path.length - 2][1]
          ].preview = 0;
        }
        if (checkAllSame()) {
          // preview combined number
          Grid.map[col][row].preview = Grid.map[col][row].value * path.length;
          // preview next numbers
          drawPreview();
        } else {
          for (let i = 0; i < path.length - 1; i++) {
            Grid.map[path[i][0]][path[i][1]].preview = 0;
          }
        }
      }
    }
    if (itemMode) itemDrag();
  }
}
function release() {
  if (mouseY <= offset) {
    if (score != 0 && restartConfirm) {
      restartConfirm = false;
      restart();
    } else if (score != 0) {
      // restartConfirm = true;
    } else if (score == 0) restart();
  }
  for (let row in Grid.map) {
    for (let col in Grid.map[row]) {
      Grid.map[col][row].deselect();
    }
  }
  // add the last move to the undo stack
  justUndone = false;

  if (path.length > 1 && !unequal) {
    console.log("combining...");
    backup.push(addToUndo(Grid, nextNumbers, Bag, score, playerCol, playerRow));
    combineNumbers(path);
  }
  //execute Item abilities
  itemFinal();
  path = [];
}

function itemClick() {
  console.log("item click");
  switch (itemMode) {
    // case "row":
    //   rowPreview = true;
    //   if (path.length != 0) {
    //     Grid.map[0][path[0][1]].color = 3;
    //     Grid.map[1][path[0][1]].color = 3;
    //     Grid.map[2][path[0][1]].color = 3;
    //     Grid.map[3][path[0][1]].color = 3;
    //   }
    //   break;
    // case "col":
    //   colPreview = true;
    //   if (path.length != 0) {
    //     Grid.map[path[0][0]][0].color = 3;
    //     Grid.map[path[0][0]][1].color = 3;
    //     Grid.map[path[0][0]][2].color = 3;
    //     Grid.map[path[0][0]][3].color = 3;
    //   }
    //   break;
    case "swap":
      if (path.length != 0) Grid.map[path[0][0]][path[0][1]].color = "swap";
      break;
    case "sum":
      unequal = true;
      break;
    case "sum4":
      unequal = true;
      break;
    case "sum6":
      unequal = true;
      break;
    case "grow":
      Grid.map[path[0][0]][path[0][1]].preview =
        Grid.map[path[0][0]][path[0][1]].value + 1;
      break;
    case "turn":
      if (path.length == 1) Grid.map[path[0][0]][path[0][1]].color = "swap";
      // unequal = true;
      break;
    case "pick":
      let temp = nextNumbers.pop();
      nextNumbers.unshift([Grid.map[path[0][0]][path[0][1]].value]);
      Grid.map[path[0][0]][path[0][1]].value = temp[0];
      itemDeplete();
      break;
    case "shift":
      // Items[0].type = "shift"
      let temp2 = nextNumbers.shift();
      nextNumbers.push(temp2);
      itemDeplete();
      break;
  }
}
function itemDrag() {
  console.log("dragging item", itemMode);
  switch (itemMode) {
    case "swap":
      if (path.length == 2) {
        Grid.map[path[0][0]][path[0][1]].color = "swap";
        Grid.map[path[1][0]][path[1][1]].color = "swap";
        Grid.map[path[0][0]][path[0][1]].preview = Grid.map[path[1][0]][path[1][1]].value;
        Grid.map[path[1][0]][path[1][1]].preview = Grid.map[path[0][0]][path[0][1]].value;
      }
      if (path.length == 3) {
        itemFinal();
      }
      maxLength(3);
      break;
    case "sum":
      if (path.length >= 2) {
        unequal = true;
        Grid.map[path[1][0]][path[1][1]].preview = Grid.map[path[0][0]][path[0][1]].value +  Grid.map[path[1][0]][path[1][1]].value;
        Grid.map[path[0][0]][path[0][1]].preview = nextNumbers[0][0];
      }
      if (path.length >= 3) {
        itemFinal();
      }
      break;
    case "sum4":
      if (path.length == 3) {
        //smaller than 4 means preview
        if (
          Grid.map[path[0][0]][path[0][1]].value +
            Grid.map[path[1][0]][path[1][1]].value +
            Grid.map[path[2][0]][path[2][1]].value <=
          4
        ) {
          unequal = true;
          Grid.map[path[2][0]][path[2][1]].preview =
            Grid.map[path[0][0]][path[0][1]].value +
            Grid.map[path[1][0]][path[1][1]].value +
            Grid.map[path[2][0]][path[2][1]].value;
          Grid.map[path[0][0]][path[0][1]].preview = nextNumbers[0];
          Grid.map[path[1][0]][path[1][1]].preview = nextNumbers[1];
        }
        // bigger than 4 means shorten
        if (
          Grid.map[path[0][0]][path[0][1]].value +
            Grid.map[path[1][0]][path[1][1]].value +
            Grid.map[path[2][0]][path[2][1]].value >
          4
        ) {
          maxLength(2);
        }
      }
      if (path.length == 2) {
        if (
          Grid.map[path[0][0]][path[0][1]].value +
            Grid.map[path[1][0]][path[1][1]].value >
          4
        ) {
          maxLength(1);
          break;
        }
        if (
          Grid.map[path[0][0]][path[0][1]].value +
            Grid.map[path[1][0]][path[1][1]].value <=
          4
        ) {
          unequal = true;
          Grid.map[path[1][0]][path[1][1]].preview =
            Grid.map[path[0][0]][path[0][1]].value +
            Grid.map[path[1][0]][path[1][1]].value;
          Grid.map[path[0][0]][path[0][1]].preview = nextNumbers[0];
        }
      }
      break;
    case "sum6":
      if (path.length == 4) {
        //exactly 6 means preview
        if (
          Grid.map[path[0][0]][path[0][1]].value +
            Grid.map[path[1][0]][path[1][1]].value +
            Grid.map[path[2][0]][path[2][1]].value +
            Grid.map[path[3][0]][path[3][1]].value ==
          6
        ) {
          unequal = true;
          Grid.map[path[3][0]][path[3][1]].preview = 6;
          Grid.map[path[2][0]][path[2][1]].preview = nextNumbers[2];
          Grid.map[path[1][0]][path[1][1]].preview = nextNumbers[1];
          Grid.map[path[0][0]][path[0][1]].preview = nextNumbers[0];
        } else {
          maxLength(3);
        }
      }
      if (path.length == 3) {
        if (
          Grid.map[path[0][0]][path[0][1]].value +
            Grid.map[path[1][0]][path[1][1]].value +
            Grid.map[path[2][0]][path[2][1]].value ==
          6
        ) {
          unequal = true;
          Grid.map[path[2][0]][path[2][1]].preview = 6;
          Grid.map[path[1][0]][path[1][1]].preview = nextNumbers[1];
          Grid.map[path[0][0]][path[0][1]].preview = nextNumbers[0];
        }
      }
      if (path.length == 2) {
        if (
          Grid.map[path[0][0]][path[0][1]].value +
            Grid.map[path[1][0]][path[1][1]].value ==
          6
        ) {
          unequal = true;
          Grid.map[path[1][0]][path[1][1]].preview = 6;
          Grid.map[path[0][0]][path[0][1]].preview = nextNumbers[0];
        }
      }
      break;
    case "grow":
      if (path.length > 1) maxLength(0);
      break;
    case "sort":
      if (path.length > 4) maxLength(4);
      let toSort = [];
      for (elem in path) {
        toSort.push(Grid.map[path[elem][0]][path[elem][1]].value);
      }
      console.log(toSort);
      toSort.sort(function(a, b) {
        return a - b;
      });
      for (elem in path) {
        Grid.map[path[elem][0]][path[elem][1]].preview = toSort[elem];
      }
      break;
    case "turn":
      if (path.length >= 1 && path.length <= 2) {
        Grid.map[path[0][0]][path[0][1]].color = "swap";
        Grid.map[path[0][0]][path[0][1]].preview =
          Grid.map[path[0][0]][path[0][1]].value;
      }
      if (path.length == 2) {
        Grid.map[path[1][0]][path[1][1]].color = "swap";
        Grid.map[path[1][0]][path[1][1]].preview =
          Grid.map[path[1][0]][path[1][1]].value;
      }
      if (path.length > 2) {
        for (let i = 0; i < path.length; i++) {
          Grid.map[path[i][0]][path[i][1]].color = "turn";
          console.log(Grid.map[path[i][0]][path[i][1]].color);
          Grid.map[path[0][0]][path[0][1]].preview =
            Grid.map[path[0][0]][path[0][1]].value;
          Grid.map[path[1][0]][path[1][1]].preview =
            Grid.map[path[1][0]][path[1][1]].value;
        }
      }
      if (path.length > 4) maxLength(4);
      if (path.length == 4) {
        Grid.map[path[0][0]][path[0][1]].preview =
          Grid.map[path[1][0]][path[1][1]].value;
        Grid.map[path[1][0]][path[1][1]].preview =
          Grid.map[path[2][0]][path[2][1]].value;
        Grid.map[path[2][0]][path[2][1]].preview =
          Grid.map[path[3][0]][path[3][1]].value;
        Grid.map[path[3][0]][path[3][1]].preview =
          Grid.map[path[0][0]][path[0][1]].value;
      } else if (path.length == 3) {
        Grid.map[path[0][0]][path[0][1]].preview =
          Grid.map[path[1][0]][path[1][1]].value;
        Grid.map[path[1][0]][path[1][1]].preview =
          Grid.map[path[2][0]][path[2][1]].value;
        Grid.map[path[2][0]][path[2][1]].preview =
          Grid.map[path[0][0]][path[0][1]].value;
      }
      break;
    case "shift":
      // Items[0].type = "shift"
      let temp2 = nextNumbers.shift();
      nextNumbers.push(temp2);
      itemDeplete();
      break;
    case "shrink":
      if ( path.length == 2 && Grid.map[path[0][0]][path[0][1]].value > Grid.map[path[1][0]][path[1][1]].value ) {
        Grid.map[path[0][0]][path[0][1]].preview = Math.floor(Grid.map[path[0][0]][path[0][1]].value/2 + 0.5);
      } else if ( Grid.map[path[0][0]][path[0][1]].value <= Grid.map[path[1][0]][path[1][1]].value) {
        maxLength(1);
      } else if(path.length >= 3 ) {
        itemFinal();
      }
      break;
  }
  move("0");
}
function itemFinal() {
  console.log("item final");
  switch (itemMode) {
    // case "row":
    //   if (path.length > 1) {
    //     if (!(path[0][0] == path[1][0] + 1 || path[0][0] == path[1][0] - 1)) {
    //       maxLength(1);
    //     } else if (path[0][0] == path[1][0] + 1) {
    //       let placeHold = Grid.map[3][path[0][1]].value;
    //       Grid.map[3][path[0][1]].value = Grid.map[0][path[0][1]].value;
    //       Grid.map[0][path[0][1]].value = Grid.map[1][path[0][1]].value;
    //       Grid.map[1][path[0][1]].value = Grid.map[2][path[0][1]].value;
    //       Grid.map[2][path[0][1]].value = placeHold;
    //       maxLength(0);
    //       itemDeplete();
    //     } else if (path[0][0] == path[1][0] - 1) {
    //       let placeHold = Grid.map[3][path[0][1]].value;
    //       Grid.map[3][path[0][1]].value = Grid.map[2][path[0][1]].value;
    //       Grid.map[2][path[0][1]].value = Grid.map[1][path[0][1]].value;
    //       Grid.map[1][path[0][1]].value = Grid.map[0][path[0][1]].value;
    //       Grid.map[0][path[0][1]].value = placeHold;
    //       maxLength(0);
    //       itemDeplete();
    //     }
    //   }
    //   break;
    // case "col":
    //   if (path.length > 1) {
    //     if (!(path[0][1] == path[1][1] + 1 || path[0][1] == path[1][1] - 1)) {
    //       maxLength(1);
    //     } else if (path[0][1] == path[1][1] + 1) {
    //       let placeHold = Grid.map[path[0][0]][3].value;
    //       Grid.map[path[0][0]][3].value = Grid.map[path[0][0]][0].value;
    //       Grid.map[path[0][0]][0].value = Grid.map[path[0][0]][1].value;
    //       Grid.map[path[0][0]][1].value = Grid.map[path[0][0]][2].value;
    //       Grid.map[path[0][0]][2].value = placeHold;
    //       maxLength(0);
    //       itemDeplete();
    //     } else if (path[0][1] == path[1][1] - 1) {
    //       let placeHold = Grid.map[path[0][0]][3].value;
    //       Grid.map[path[0][0]][3].value = Grid.map[path[0][0]][2].value;
    //       Grid.map[path[0][0]][2].value = Grid.map[path[0][0]][1].value;
    //       Grid.map[path[0][0]][1].value = Grid.map[path[0][0]][0].value;
    //       Grid.map[path[0][0]][0].value = placeHold;
    //       maxLength(0);
    //       itemDeplete();
    //     }
    //   }
    //   break;
    case "swap":
      if (
        path.length >= 2 &&
        Grid.map[path[0][0]][path[0][1]].value !=
          Grid.map[path[1][0]][path[1][1]].value
      ) {
        Grid.map[path[0][0]][path[0][1]].color = 0;
        Grid.map[path[1][0]][path[1][1]].color = 0;
        let swap = Grid.map[path[0][0]][path[0][1]].value;
        Grid.map[path[0][0]][path[0][1]].value = Grid.map[path[1][0]][path[1][1]].value;
        Grid.map[path[1][0]][path[1][1]].value = swap;
        itemDeplete();
      }
      path = [];
      break;
    case "sum":
      if (path.length >= 2) {
        Grid.map[path[0][0]][path[0][1]].color = 0;
        Grid.map[path[1][0]][path[1][1]].color = 0;
        Grid.map[path[1][0]][path[1][1]].value = Grid.map[path[0][0]][path[0][1]].value + Grid.map[path[1][0]][path[1][1]].value;
        Grid.map[path[0][0]][path[0][1]].value = generateNext(1);
        itemDeplete();
      }
      break;
    case "sum4":
      if (path.length == 3) {
        console.log(Grid.map[path[2][0]][path[2][1]].value);
        //smaller than 4 means preview
        if (
          Grid.map[path[0][0]][path[0][1]].value +
            Grid.map[path[1][0]][path[1][1]].value +
            Grid.map[path[2][0]][path[2][1]].value <=
          4
        ) {
          Grid.map[path[2][0]][path[2][1]].value =
            Grid.map[path[0][0]][path[0][1]].value +
            Grid.map[path[1][0]][path[1][1]].value +
            Grid.map[path[2][0]][path[2][1]].value;
          Grid.map[path[0][0]][path[0][1]].value = nextNumbers[0][0];
          Grid.map[path[1][0]][path[1][1]].value = nextNumbers[1][0];
        }
        itemDeplete();
      }
      if (path.length == 2) {
        if (
          Grid.map[path[0][0]][path[0][1]].value +
            Grid.map[path[1][0]][path[1][1]].value <=
          4
        ) {
          Grid.map[path[1][0]][path[1][1]].value =
            Grid.map[path[0][0]][path[0][1]].value +
            Grid.map[path[1][0]][path[1][1]].value;
          Grid.map[path[0][0]][path[0][1]].value = nextNumbers[0][0];
        }
        itemDeplete();
      }
      break;
    case "sum6":
      if (path.length == 4) {
        console.log(Grid.map[path[2][0]][path[2][1]].value);
        //exactly 6 means preview
        if (
          Grid.map[path[0][0]][path[0][1]].value +
            Grid.map[path[1][0]][path[1][1]].value +
            Grid.map[path[2][0]][path[2][1]].value +
            Grid.map[path[3][0]][path[3][1]].value ==
          6
        ) {
          Grid.map[path[3][0]][path[3][1]].value = 6;
          Grid.map[path[2][0]][path[2][1]].value = generateNext(0);
          Grid.map[path[1][0]][path[1][1]].value = generateNext(0);
          Grid.map[path[0][0]][path[0][1]].value = generateNext(0);
          itemDeplete();
        }
      }
      if (path.length == 3) {
        if (
          Grid.map[path[0][0]][path[0][1]].value +
            Grid.map[path[1][0]][path[1][1]].value +
            Grid.map[path[2][0]][path[2][1]].value ==
          6
        ) {
          Grid.map[path[2][0]][path[2][1]].value = 6;
          Grid.map[path[1][0]][path[1][1]].value = generateNext(0);
          Grid.map[path[0][0]][path[0][1]].value = generateNext(0);
          itemDeplete();
        }
      }
      if (path.length == 2) {
        if (
          Grid.map[path[0][0]][path[0][1]].value +
            Grid.map[path[1][0]][path[1][1]].value ==
          6
        ) {
          Grid.map[path[1][0]][path[1][1]].value = 6;
          Grid.map[path[0][0]][path[0][1]].value = nextNumbers[0][0];
          itemDeplete();
        }
      }
      break;
    case "grow":
      if (path.length == 1) {
        Grid.map[path[0][0]][path[0][1]].value =
          Grid.map[path[0][0]][path[0][1]].value + 1;
        itemDeplete();
      } else if (!bounds()) {
        maxLength(0);
      }
      break;
    case "turn":
      if (path.length > 4) maxLength(4);
      let temp;
      if (path.length == 4) {
        temp = Grid.map[path[0][0]][path[0][1]].value;
        Grid.map[path[0][0]][path[0][1]].value =
          Grid.map[path[1][0]][path[1][1]].value;
        Grid.map[path[1][0]][path[1][1]].value =
          Grid.map[path[2][0]][path[2][1]].value;
        Grid.map[path[2][0]][path[2][1]].value =
          Grid.map[path[3][0]][path[3][1]].value;
        Grid.map[path[3][0]][path[3][1]].value = temp;
        itemDeplete();
      } else if (path.length == 3) {
        path;
        temp = Grid.map[path[0][0]][path[0][1]].value;
        Grid.map[path[0][0]][path[0][1]].value =
          Grid.map[path[1][0]][path[1][1]].value;
        Grid.map[path[1][0]][path[1][1]].value =
          Grid.map[path[2][0]][path[2][1]].value;
        Grid.map[path[2][0]][path[2][1]].value = temp;
        itemDeplete();
      }
      break;
    case "sort":
      if (path.length >= 3) {
        let toSort = [];
        for (elem in path) {
          toSort.push(Grid.map[path[elem][0]][path[elem][1]].value);
        }
        console.log(toSort);
        toSort.sort(function(a, b) {
          return a - b;
        });
        for (elem in path) {
          Grid.map[path[elem][0]][path[elem][1]].value = toSort[elem];
        }
        itemDeplete();
      }
      break;
    case "shrink":
      if ( Grid.map[path[0][0]][path[0][1]].value > Grid.map[path[1][0]][path[1][1]].value ) {
        score -=  Grid.map[path[0][0]][path[0][1]].value -  Grid.map[path[1][0]][path[1][1]].value;
        console.log(
          "score decreased by" +
            Grid.map[path[0][0]][path[0][1]].value -
            Math.floor(Grid.map[path[0][0]][path[0][1]].value/2 + 0.5)
        );
        Grid.map[path[0][0]][path[0][1]].value =
          Math.floor(Grid.map[path[0][0]][path[0][1]].value/2 + 0.5)
        itemDeplete();
      }
      break;
  }
  move("0");
}
// returns the icon for the item type
function itemIcon(type) {
  let toShow = " ";
  switch (type) {
    case "grow":
      toShow = "1";
      break;
    case "swap":
      toShow = "x";
      break;
    case "col":
      toShow = "|";
      break;
    case "row":
      toShow = "-";
      break;
    case "shift":
      toShow = "<";
      break;
    case "pick":
      toShow = ">";
      break;
    case "sum":
      toShow = "+";
      break;
    case "sum4":
      toShow = "4";
      break;
    case "sum6":
      toShow = "6";
      break;
    case "turn":
      toShow = "O";
      break;
    case "sort":
      toShow = "V";
      break;
    case "shuffle":
      toShow = "~";
      break;
    case "shrink":
      toShow = "*";
      break;
  }
  return toShow;
}
// reduce item charge by 1
function itemDeplete() {
  console.log("depleting item");
  Items[activeItem - 1].charge--;
  if (Items[activeItem - 1].charge <= 0) {
    Items[activeItem - 1].depleted = true;
  }
  backup = [];
  itemMode = 0;
  itemSelect(0);
  unequal = false;
  path = [];
  maxLength(0);
  move("0");
}
// item side display
function itemDraw() {
  let itemButtons = ""
  for (let i = 0; i < Items.length; i++) {
    if (Items[i] != 0) {
      if(i == activeItem-1) {
        itemButtons += "<button class='item selected' onClick='itemSelect(" + (i+1) + ")'>" + itemIcon(Items[i].type) + "<div class='name'>" + Items[i].type + "</div> <div class='charge'>" + Items[i].charge +  "</div> </button> <br>";
      } else {
        itemButtons += "<button class='item' onClick='itemSelect(" + (i+1) + ")'>" + itemIcon(Items[i].type) + "<div class='name'>" + Items[i].type + "</div> <div class='charge'>" + Items[i].charge +  "</div> </button> <br>";
      }
    }
  }
  // console.log(itemButtons);
  document.getElementById("items").innerHTML = itemButtons;
  fill(0);
}
// item selection dialog draw
function itemDialog(selection) {
  // console.log(selection);
  for (let item = 0; item <= selection.length - 1; item++) {
    let extraOff = 30;
    let xOffset = (width - (offset + extraOff) * 2) / selection.length;
    let xShift =
      offset +
      extraOff +
      (width - (offset + extraOff) * 2) / selection.length / 2;
    fill("#32cd60");
    rectMode(CORNER);
    strokeWeight(10);
    rect(offset + extraOff + xOffset * item, height / 3, xOffset, height / 3);
    if (selection[item].hasOwnProperty("type")) {
      strokeWeight(25);
      stroke("#0e5e07");
      textSize(166);
      textAlign(CENTER, CENTER);
      fill("#070707");
      text(
        itemIcon(selection[item].type),
        xOffset * item + xShift,
        (height * 1.5) / 3 + 20
      );
      strokeWeight(0);
      textSize(72);
      fill("#092717");
      textAlign(LEFT, CENTER);
      text(
        selection[item].type,
        xOffset * item + offset + extraOff * 2,
        (height * 1.5) / 3 - 130
      );
      fill("#123420");
      textAlign(RIGHT, CENTER);
      text(
        "x" + selection[item].charge,
        xOffset * item +
          offset +
          extraOff +
          ((width - (offset + extraOff) * 2) / selection.length) * 0.9,
        (height * 1.5) / 3 + 122
      );
    } else {
      strokeWeight(0);
      textSize(72);
      textAlign(LEFT, CENTER);
      fill("#092717");
      text(
        "chg",
        xOffset * item + offset + extraOff * 2,
        (height * 1.5) / 3 - 130
      );
      fill("#123420");
      textAlign(RIGHT, CENTER);
      text(
        "+" + selection[item],
        xOffset * item +
          offset +
          extraOff +
          ((width - (offset + extraOff) * 2) / selection.length) * 0.9,
        (height * 1.5) / 3 + 122
      );
    }
    stroke(0);
    textAlign(CENTER, CENTER);
  }
}
function levelPress(x, y) {
  // console.log(offset+extraOff+xOffset*item, x, );
  let extraOff = 30;
  let xOffset = (width - (offset + extraOff) * 2) / selection.length;
  let xShift =
    offset +
    extraOff +
    (width - (offset + extraOff) * 2) / selection.length / 2;
  for (let item = 0; item <= selection.length - 1; item++) {
    if (
      x > offset + extraOff + xOffset * item &&
      x < offset + extraOff + xOffset * (item + 1)
    ) {
      // selection[item] is the selected item
      if (selection[item].hasOwnProperty("type")) {
        // duplicate prevention
        for (itm in Items) {
          if (
            Items[itm].hasOwnProperty("type") &&
            Items[itm].hasOwnProperty("charge")
          ) {
            if (
              Items[itm].type == selection[item].type &&
              !Items[itm].type.depleted
            ) {
              console.log("type match ", selection[item].type);
              let gain = selection[item].charge;
              Items[itm].charge += gain;
              usedItems.push(itemIcon(Items[itm].type) + ";" + gain);
              selection = 0;
              break;
            }
          }
        }
        // find first empty slot
        if (selection != 0) {
          for (itm in Items) {
            if (Items[itm] == 0 || Items[itm].depleted == true) {
              usedItems.push(
                itemIcon(selection[item].type) + " " + selection[item].charge
              );
              Items[itm] = selection[item];
              selection = 0;
              break;
            }
          }
        }
      } else {
        // add charges
        let randChoice;
        randChoice = Math.floor(Math.random() * Items.length);
        while (Items[randChoice] == 0)
          randChoice = Math.floor(Math.random() * Items.length); //todo infinite
        Items[randChoice].charge += selection[item];
        usedItems.push(
          itemIcon(Items[randChoice].type) + ":" + selection[item]
        );
        selection = 0;
      }
    }
  }
  if (x > offset + extraOff && x < width - (offset + extraOff)) {
    level++;
    gameState = "main";
    isLeveled(lastComboVal);
  }
}
// clicking on a sidebar item activates it
function itemPressed() {
  let itemHeight = (width - offset * 2) / 3;
  if (score != 0) {
    if (
      0 < mouseX &&
      mouseX < offset &&
      offset < mouseY &&
      mouseY < offset + itemHeight
    ) {
      console.log(1);
      if (Items[0].charge > 0) {
        if (activeItem != 1) {
          itemMode = Items[0].type;
          activeItem = 1;
        } else {
          itemMode = 0;
          activeItem = 0;
          unequal = false;
        }
      }
    } else if (
      0 < mouseX &&
      mouseX < offset &&
      offset + itemHeight < mouseY &&
      mouseY < offset + itemHeight * 2
    ) {
      if (Items[1].charge > 0) {
        if (activeItem != 2) {
          itemMode = Items[1].type;
          activeItem = 2;
        } else {
          itemMode = 0;
          activeItem = 0;
          unequal = false;
        }
      }
    } else if (
      0 < mouseX &&
      mouseX < offset &&
      offset + itemHeight * 2 < mouseY &&
      mouseY < offset + itemHeight * 3
    ) {
      if (Items[2].charge > 0) {
        if (activeItem != 3) {
          itemMode = Items[2].type;
          activeItem = 3;
        } else {
          itemMode = 0;
          activeItem = 0;
          unequal = false;
        }
      }
    }
  }
}

//check if a drag selection crosses itself
function dragCross(col, row) {
  for (let element = 0; element < path.length - 1; element++) {
    if (path[element][0] == col && path[element][1] == row) {
      // remove all objects after intersection
      maxLength(element + 1);

      if (checkAllSame()) {
        Grid.map[col][row].preview = Grid.map[col][row].value * path.length;
        // preview next numbers
        drawPreview();
      }
    }
  }
}
// reduces the length of the path array
function maxLength(length) {
  if (colPreview && length <= 1) {
    Grid.map[path[0][0]][0].deselect;
    Grid.map[path[0][0]][1].deselect;
    Grid.map[path[0][0]][2].deselect;
    Grid.map[path[0][0]][3].deselect;
    Grid.map[path[0][0]][0].preview = Grid.map[path[0][0]][0].value;
    Grid.map[path[0][0]][1].preview = Grid.map[path[0][0]][1].value;
    Grid.map[path[0][0]][2].preview = Grid.map[path[0][0]][2].value;
    Grid.map[path[0][0]][3].preview = Grid.map[path[0][0]][3].value;
    console.log("wiping col preview");
    colPreview = false;
  }
  if (rowPreview && length == 1) {
    Grid.map[0][path[0][0]].deselect;
    Grid.map[1][path[0][0]].deselect;
    Grid.map[2][path[0][0]].deselect;
    Grid.map[3][path[0][0]].deselect;
    Grid.map[0][path[0][0]].preview = Grid.map[0][path[0][0]].value;
    Grid.map[1][path[0][0]].preview = Grid.map[1][path[0][0]].value;
    Grid.map[2][path[0][0]].preview = Grid.map[2][path[0][0]].value;
    Grid.map[3][path[0][0]].preview = Grid.map[3][path[0][0]].value;
    console.log("wiping row preview");
    rowPreview = false;
  }

  while (path.length > length) {
    Grid.map[path[path.length - 1][0]][path[path.length - 1][1]].deselect();
    path.splice(path.length - 1);
  }
  move("0");
}
// draws the on grid piece previews
function drawPreview() {
  for (let i = 1; i < path.length; i++) {
    let prevCol = path[path.length - 1 - i][0];
    let prevRow = path[path.length - 1 - i][1];
    if (path.length - i - 1 >= nextNumbers.length) {
      Grid.map[prevCol][prevRow].preview = "?";
    } else {
      Grid.map[prevCol][prevRow].preview = nextNumbers[path.length - i - 1];
    }
  }
}
// checks if all numbers are equal and color after break
function checkAllSame() {
  let notSame = false;
  let firstBreak = -1;
  if (itemMode == 0) {
    for (let element = 0; element < path.length - 1; element++) {
      if (
        Grid.map[path[element][0]][path[element][1]].value !=
          Grid.map[path[element + 1][0]][path[element + 1][1]].value &&
        notSame == false
      ) {
        notSame = true;
        firstBreak = element;
      }
    }
    // change preview color if numbers are not equal
    if (notSame) {
      for (firstBreak++; firstBreak < path.length - 1; firstBreak++) {
        Grid.map[path[firstBreak][0]][path[firstBreak][1]].color = "comboBreak";
        console.log("2");
      }
      return false;
    }
  }
  return true;
}
// combine function takes an array of positions and combines to the last position
function combineNumbers(combine) {
  if (itemMode == 0) {
    // compare positions with grid values and check if numbers match
    for (let position = 0; position < combine.length - 1; position++) {
      if (
        Grid.map[combine[position][0]][combine[position][1]].value !=
        Grid.map[combine[position + 1][0]][combine[position + 1][1]].value
      ) {
        console.log("numbers not equal");
        return false;
      }
    }
    for (tile in path) {
      if (tile != 0) addCharge();
      if (tile != 3) addCharge();
    }

    // multiply last with amount of equal cells
    Grid.map[combine[combine.length - 1][0]][
      combine[combine.length - 1][1]
    ].value *= combine.length;
    isLeveled(
      Grid.map[combine[combine.length - 1][0]][combine[combine.length - 1][1]]
        .value
    );
    score +=
      Grid.map[combine[combine.length - 1][0]][combine[combine.length - 1][1]]
        .value;
    addCharge();
    // metaMap.fuel--;
    fuelUsed++;
    // // generate new numbers for all other slots
    for (let position in combine) {
      if (position != combine.length - 1) {
        Grid.map[combine[position][0]][combine[position][1]].newValue();
      }
      // increase score if preview length reached
      let bonus =
        Grid.map[combine[combine.length - 1][0]][combine[combine.length - 1][1]]
          .value;
      if (position > nextNumbers.length) {
        score += bonus;
        backup = [];
      }
    }
    firstUndo = true;
  }
}
// get the average score
function average(average) {
  let sum = 0;
  for (let i = 0; i < average.length; i++) sum += average[i];
  return Math.floor(sum / average.length);
}
// check if the cursor is inside the grid
function bounds() {
  if (
    mouseX <= offset ||
    mouseY <= offset ||
    mouseX >= width - offset ||
    mouseY >= width - offset
  )
    return true;
  return false;
}
// restart the game
function restart() {
  gameState = "loading";
  socket.emit("get meta");
  if (score != 0) scores.push(score);
  level = 0;
  unequal = false; // for sum items
  backup = [];
  backup.push(addToUndo(Grid, nextNumbers, Bag, score, playerCol, playerRow));
  // backup.push(addToUndo(Grid, nextNumbers, Bag, score, playerCol, playerRow));
  score = 0;
  nextNumbers = [0, 0, 0];
  timesUndone = 0;
  firstUndo = true;
  undoCharges = 8;
  gameState = "main";
  itemMode = 0;
  usedItems = [];
  activeItem = 0;
  generateNext(5);
  Bag = newBag();
  Items = [0, 0, 0];
  // Items = initItem(Items);
  playerRow = 0;
  playerCol = 0;
  playerNum = 0;
  path = [];
  move("0");
}
function restart5() {
  if (gameState != "saving") {
    gameState = "loading";
    loadMeta();
    if (score != 0) scores.push(score);
    level = 0;
    backup = [];
    // backup.push(addToUndo(Grid, nextNumbers, Bag, score, playerCol, playerRow));
    unequal = false;
    // backup.push(addToUndo(Grid, nextNumbers, Bag, score, playerCol, playerRow));
    score = 0;
    nextNumbers = [0, 0, 0, 0];
    timesUndone = 0;
    undoCharges = 8;
    firstUndo = true;
    itemMode = 0;
    usedItems = [];
    generateNext(5);
    Bag = newBag();
    Items = [0, 0, 0];
    // Items = initItem(Items);
    playerRow = 2;
    playerCol = 2;
    playerNum = 0;
    path = [];
    move("0");
  }
}

// generate a bag of 3x123
function newBag(bag = []) {
  let addBag = [];
  for (let i = 1; i <= 3; i++) {
    for (let j = 0; j < 3; j++) {
      addBag.push(i);
      addBag = shuffle(addBag);
    }
  }
  for (num in addBag) bag.push(addBag[num]);
  return bag;
}
// draws and returns a number from the bag, possibly refill bag
function drawBag() {
  if (Bag.length <= 100) Bag = newBag(Bag);
  // Bag = shuffle(Bag);
  return Bag.splice(0, 1);
}
// shuffles an array
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
// draw from the bag to fill the preview
function generateNext(amount = 1) {
  let fiFo;
  for (let i = 0; i < amount; i++) {
    fiFo = nextNumbers.splice(0, 1);
    nextNumbers.push(drawBag());
  }
  if (amount == 1) {
    return parseInt(fiFo);
  }
}

function gameOver() {
  if (gameState == "dead") return true;
  if (gameState == "loading" || gameState == "saving") return false;
  let noMatch = true;
  for (let i = 0; i < Grid.cols && noMatch; i++) {
    for (let j = 0; j < Grid.rows - 1 && noMatch; j++) {
      if (Grid.map[i][j].value == Grid.map[i][j + 1].value) {
        noMatch = false;
        // console.log("match was found");
      }
    }
  }
  for (let i = 0; i < Grid.rows && noMatch; i++) {
    for (let j = 0; j < Grid.cols - 1 && noMatch; j++) {
      if (Grid.map[j][i].value == Grid.map[j + 1][i].value) {
        noMatch = false;
        // console.log("match was found");
      }
    }
  }
  if (noMatch || undoCharges < 0) {
    console.log("Game Over");
    Grid.map[playerCol][playerRow].color = 0;
    saveMeta(Grid);
    return true;
  }
  return false;
}
