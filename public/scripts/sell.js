const NUM_STEPS = 4
// let currentStep = 1;

const showStep = (stepNum) => {
  for (const stepElem of document.getElementsByClassName("sell-procedure-step")) {
    stepElem.style.display = "none";
  }
  document.getElementById(`sell-procedure-step-${stepNum}`).style.display =
      "flex";
      
  const progressBarFiller = document.getElementById("progress-bar-filler");
  progressBarFiller.style.width = `${(currentStep - 1) / (NUM_STEPS - 1) * 100}%`
};

let currentStep = 2;
showStep(currentStep);

document.getElementById("back-button").addEventListener("click", () => {
  if (currentStep > 1) {
    showStep(--currentStep);
  }
});

document.getElementById("next-button").addEventListener("click", () => {
  if (currentStep < NUM_STEPS) {
    showStep(++currentStep);
  }
});
