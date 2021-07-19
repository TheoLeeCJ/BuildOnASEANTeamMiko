const NUM_STEPS = 4
// let currentStep = 1;

const progressMarkersDiv = document.getElementById("progress-markers");
for (let i = 0; i < NUM_STEPS; i++) {
  const progressMarker = document.createElement("div");
  progressMarker.classList.add("progress-marker");
  if (i == 0) {
    progressMarker.classList.add("progress-marker-complete");
  }
  progressMarkersDiv.append(progressMarker);
}

const showStep = (stepNum) => {
  for (const stepElem of document.getElementsByClassName("sell-procedure-step")) {
    stepElem.style.display = "none";
  }
  document.getElementById(`sell-procedure-step-${stepNum}`).style.display =
      "flex";
      
  const progressBarFiller = document.getElementById("progress-bar-filler");
  progressBarFiller.style.width = `${(currentStep - 1) / (NUM_STEPS - 1) * 100}%`

  const progressMarkers = document.getElementsByClassName("progress-marker");
  for (let i = 0; i < progressMarkers.length; i++) {
    if (i < stepNum) {
      // delay turning red by 800ms
      setTimeout(() => {
        progressMarkers[i].classList.add("progress-marker-complete");
      }, 800);
    } else {
      progressMarkers[i].classList.remove("progress-marker-complete");
    }
  }
};

const priceInput = document.querySelector("#price-input-wrapper > input[type='text']");
priceInput.addEventListener("keypress", (event) => {
  if (event.key !== "." && (event.key < "0" || event.key > "9")) {
    event.preventDefault();
  }
});
priceInput.addEventListener("change", () => {
  const [integralPart, decimalPart] = priceInput.value.split(".");
  if (typeof decimalPart !== "undefined") {
    priceInput.value = `${integralPart}.${decimalPart.padEnd(2, "0").substring(0, 2)}`;
  }
});

let numAdditionalFields = 0;

const removeAdditionalField = (removeFieldButton) => {
  removeFieldButton.closest(".additional-field").remove();
  numAdditionalFields--;

  // re-number remaining fields
  let fieldNum = 1;
  for (const additionalFieldTitle of document.querySelectorAll(".additional-field > h2 > span")) {
    additionalFieldTitle.textContent = `Additional field ${fieldNum}`;
    fieldNum++;
  }
};

const addFieldButton = document.getElementById("add-field-button");
addFieldButton.addEventListener("click", () => {
  numAdditionalFields++;
  addFieldButton.insertAdjacentHTML("beforebegin", `        
    <div class="additional-field">
      <h2>
        <span>Additional field ${numAdditionalFields}</span>
        <button onclick="removeAdditionalField(this)" title="Delete this field" class="remove-field material-icons">delete_outline</button>
      </h2>
      <h3>Field title</h3>
      <input type="text" class="additional-field-title" placeholder="Name of the field you want to specify">
      <h3>Field value</h3>
      <input type="text" class="additional-field-text" placeholder="Value of the field you want to specify">
      <div class="attach-photos">
        <span class="material-icons-outlined"></span>
      </div>
    </div>
  `);
});

let currentStep = 3;
showStep(currentStep);

document.getElementById("back-button").addEventListener("click", () => {
  if (currentStep > 1) {
    currentStep--;
    showStep(currentStep);
  }
});

document.getElementById("next-button").addEventListener("click", () => {
  if (currentStep < NUM_STEPS) {
    currentStep++;
    showStep(currentStep);
  }
});
