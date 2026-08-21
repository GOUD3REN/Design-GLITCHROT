// API Configuration
const API_BASE_URL = "http://localhost:8000"; // Change on deploy
const ANALYZE_ENDPOINT = `${API_BASE_URL}/api/v1/analyze`;

// DOM Elements
const dropZone = document.querySelector(".drop-zone");
const analyzeBtn = document.querySelector(".analyze-btn");
const statusBlock = document.querySelector(".status-block strong");
const statusNote = document.querySelector(".status-block span");
const probabilityBlock = document.querySelector(".probability strong");
const probabilityMeter = document.querySelector(".meter span");
const anomaliesBlock = document.querySelectorAll(".report-block")[2]; // Third block
const metaBlock = document.querySelectorAll(".report-block")[3]; // Fourth block
const threatBlock = document.querySelectorAll(".report-block")[4]; // Fifth block
const reportFooter = document.querySelector(".report-footer");

let selectedFile = null;

// ---- Upload Handling ----
dropZone.addEventListener("click", () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = (e) => handleFileSelect(e.target.files[0]);
  input.click();
});

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("is-armed");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("is-armed");
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("is-armed");
  handleFileSelect(e.dataTransfer.files[0]);
});

function handleFileSelect(file) {
  if (!file) return;
  
  selectedFile = file;
  dropZone.classList.add("is-armed");
  statusBlock.textContent = "IMAGE QUEUED";
  statusNote.textContent = "Synthetic trace scan ready";
}

// ---- Analysis ----
analyzeBtn.addEventListener("click", async () => {
  if (!selectedFile) {
    alert("Please select an image first");
    return;
  }

  // Show loading state
  statusBlock.textContent = "SCANNING";
  statusNote.textContent = "Bio-forensic engine active";
  analyzeBtn.disabled = true;
  document.body.classList.add("analysis-pulse");

  try {
    // Create FormData
    const formData = new FormData();
    formData.append("file", selectedFile);

    // Send to API
    const response = await fetch(ANALYZE_ENDPOINT, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    
    // Update UI with results
    updateReport(result);

  } catch (error) {
    console.error("Analysis error:", error);
    statusBlock.textContent = "ERROR";
    statusNote.textContent = `Failed: ${error.message}`;
  } finally {
    analyzeBtn.disabled = false;
    document.body.classList.remove("analysis-pulse");
  }
});

// ---- Update Report Panel ----
function updateReport(data) {
  // Status
  statusBlock.textContent = "COMPLETE";
  statusNote.textContent = "Analysis finished";

  // AI Probability
  const probability = Math.round(data.probability * 100);
  const classification = data.classification;
  
  probabilityBlock.textContent = `${probability}%`;
  probabilityMeter.style.width = `${probability}%`;
  
  // Color based on classification
  if (probability > 70) {
    probabilityBlock.style.color = "#ff0000"; // Red for Fake
  } else {
    probabilityBlock.style.color = "#00ff00"; // Green for Real
  }

  // Anomalies
  anomaliesBlock.querySelector("strong").textContent = "--"; // Placeholder
  anomaliesBlock.querySelector(".report-lines").innerHTML = 
    `<i></i><i></i><i></i>`;

  // Meta Analysis
  metaBlock.querySelector("strong").textContent = "--";
  metaBlock.querySelector(".report-lines").innerHTML = 
    `<i></i><i></i>`;

  // Threat Assessment
  threatBlock.querySelector("strong").textContent = classification;
  threatBlock.querySelector(".report-lines").innerHTML = 
    `<i></i><i></i><i></i>`;

  // Footer
  const timestamp = new Date().toLocaleTimeString();
  reportFooter.innerHTML = `
    <span>REPORT ID: ${Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
    <span>TIME: ${timestamp}</span>
  `;
}
