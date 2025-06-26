function splitStringIntoChunks(inputString, chunkSize) {
  var chunksArray = [];
  var inputStringLength = inputString.length;
  var currentIndex = 0;
  for (; currentIndex < inputStringLength; currentIndex += chunkSize) {
    if (currentIndex + chunkSize < inputStringLength) {
      chunksArray.push(
        inputString.substring(currentIndex, currentIndex + chunkSize),
      );
    } else {
      chunksArray.push(inputString.substring(currentIndex, inputStringLength));
    }
  }
  return chunksArray;
}
