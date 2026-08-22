const dropZone = document.querySelector(".drop-zone");
const analyzeBtn = document.querySelector(".analyze-btn");
const statusBlock = document.querySelector(".status-block strong");
const statusNote = document.querySelector(".status-block span");
const probabilityBlock = document.querySelector(".probability strong");
const probabilityMeter = document.querySelector(".meter span");
const reportFooter = document.querySelector(".report-footer");

let selectedFile = null;

// Upload
dropZone.addEventListener("click", () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = (e) => {
    selectedFile = e.target.files[0];
    statusBlock.textContent = "IMAGE QUEUED";
    statusNote.textContent = "Synthetic trace scan ready";
  };
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
  if (e.dataTransfer.files[0]) {
    selectedFile = e.dataTransfer.files[0];
    statusBlock.textContent = "IMAGE QUEUED";
    statusNote.textContent = "Synthetic trace scan ready";
  }
});

// Analysis
analyzeBtn.addEventListener("click", async () => {
  if (!selectedFile) {
    alert("Select an image first");
    return;
  }

  statusBlock.textContent = "SCANNING";
  statusNote.textContent = "Bio-forensic engine active";
  analyzeBtn.disabled = true;

  try {
    const formData = new FormData();
    formData.append("file", selectedFile);
    
    const response = await fetch("http://localhost:8000/api/v1/analyze", {
      method: "POST",
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const result = await response.json();
    console.log("Result:", result);
    
    updateReport(result);
    
  } catch (error) {
    console.error("Error:", error);
    statusBlock.textContent = "ERROR";
    statusNote.textContent = `Failed: ${error.message}`;
  } finally {
    analyzeBtn.disabled = false;
  }
});

function updateReport(data) {
  statusBlock.textContent = "COMPLETE";
  statusNote.textContent = "Analysis finished";

  const probability = Math.round(data.probability * 100);
  probabilityBlock.textContent = `${probability}%`;
  probabilityMeter.style.width = `${probability}%`;
  
  if (data.classification === "Fake") {
    probabilityBlock.style.color = "#ff0000";
  } else {
    probabilityBlock.style.color = "#00ff00";
  }
  
  const now = new Date().toLocaleTimeString();
  const reportId = Math.random().toString(36).substr(2, 8).toUpperCase();
  reportFooter.innerHTML = `
    <span>REPORT ID: ${reportId}</span>
    <span>TIME: ${now}</span>
  `;
  
  console.log("Report displayed");
}
