function splitStringIntoChunks(inputString, chunkSize) {
  var chunksArray = [];
  var inputLength = inputString.length;
  var currentIndex = 0;
  for (; currentIndex < inputLength; currentIndex += chunkSize) {
    if (currentIndex + chunkSize < inputLength) {
      chunksArray.push(
        inputString.substring(currentIndex, currentIndex + chunkSize),
      );
    } else {
      chunksArray.push(inputString.substring(currentIndex, inputLength));
    }
  }
  return chunksArray;
}
