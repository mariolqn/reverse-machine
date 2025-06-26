function splitStringByLength(inputString, chunkSize) {
  var chunks = [];
  var stringLength = e.length;
  var currentIndex = 0;
  for (; currentIndex < stringLength; currentIndex += chunkSize) {
    if (currentIndex + chunkSize < stringLength) {
      n.push(e.substring(currentIndex, currentIndex + chunkSize));
    } else {
      n.push(e.substring(currentIndex, stringLength));
    }
  }
  return chunks;
}
