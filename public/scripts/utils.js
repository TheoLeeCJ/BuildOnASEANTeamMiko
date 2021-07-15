const separateThousands = (num, separator = ",") => {
  const numStr = num.toString();
  let numStrFormatted = "";
  for (let i = numStr.length - 1; i >= 0; i--) {
    numStrFormatted = numStr[i] + numStrFormatted;
    if (i !== 0 && (numStr.length - i) % 3 === 0) {
      numStrFormatted = separator + numStrFormatted;
    }
  }
  return numStrFormatted;
};

const mouseEventIsWithinDOMRect = ({ clientX: eventX, clientY: eventY }, domRect) =>
  domRect.left <= eventX && eventX <= domRect.right &&
  domRect.top <= eventY && eventY <= domRect.bottom;
