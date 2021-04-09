
 function loadMeta() {
  let size = 5;
  let spots = [0, 4, 7, 11];
  let matches = 0;
  let metaChunk = {};
  let rowTemp, colStart, rowStart;
  while(matches <= 3) {
    colStart = spots[Math.floor(Math.random()*spots.length)];
    rowStart = spots[Math.floor(Math.random()*spots.length)];
    metaChunk = {
      "rows": size,
      "cols": size,
      "rowStart": rowStart,
      "colStart": colStart,
      "generation": metaMap.generation,
      "map": []
    }
    console.log("loading meta subset", metaMap.metaC)

    for(let i = 0; i < size; i++){
      rowTemp = [];
      for(let j = 0; j < size; j++){
         rowTemp.push(metaMap.map[rowStart+i][colStart+j]);
         rowTemp[j].row = i;
         rowTemp[j].col = j;
         rowTemp[j].color = 0;
         // console.log(rowStart+i, colStart+j);
      }
      metaChunk.map.push(rowTemp);
    }

    matches = 0;
    for (let i = 0; i < metaChunk.cols; i++) {
      for (let j = 0; j < metaChunk.rows - 1; j++) {
        if (metaChunk.map[i][j].value == metaChunk.map[i][j + 1].value) {
          matches++;
        }
      }
    }
    for (let i = 0; i < metaChunk.rows; i++) {
      for (let j = 0; j < metaChunk.cols - 1; j++) {
        if (metaChunk.map[j][i].value == metaChunk.map[j + 1][i].value) {
          matches++;
        }
      }
    }
    for(let i=0; i<2; i++) {
      let rCol = Math.floor(Math.random()*7);
      let rRow = Math.floor(Math.random()*7);
      metaMap = shrinkMeta(metaMap, rCol, rRow, 2);
    }
  }
  io.emit("set grid", {
    grid: metaChunk,
    stats: stats(metaMap)
  });
}
