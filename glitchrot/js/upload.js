const dropZone = document.querySelector(".drop-zone");
const analyzeBtn = document.querySelector(".analyze-btn");
const statusBlock = document.querySelector(".status-block strong");
const statusNote = document.querySelector(".status-block span");
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

    const report = await response.json();
    console.log("ForensicReport:", report);
    
    updateReportWithLayers(report);
    
  } catch (error) {
    console.error("Error:", error);
    statusBlock.textContent = "ERROR";
    statusNote.textContent = `Failed: ${error.message}`;
    analyzeBtn.disabled = false;
  }
});

function updateReportWithLayers(report) {
  // Salvar report para página dedicada
  sessionStorage.setItem('forensicReport', JSON.stringify(report));
  sessionStorage.setItem('filename', selectedFile.name);
  
  console.log("Report saved to sessionStorage");
  console.log("Report ID:", report.report_id);
  console.log("Synthetic probability:", report.final_assessment.synthetic_probability);
  console.log("Redirecting to report.html...");
  
  // Redirecionar para página de report
  setTimeout(() => {
    window.location.href = 'report.html';
  }, 500);
}

function updateLayers(layers, syntheticProb, realProb) {
  /* Atualizar painel com dados de cada layer */
  
  // Encontrar blocos de report
  const reportBlocks = document.querySelectorAll(".report-block");
  
  if (reportBlocks.length < 5) {
    console.warn("Painel não tem blocos suficientes para layers");
    return;
  }

  // Layer 0: Neural
  if (layers[0]) {
    const neural = layers[0];
    updateBlockWithLayer(reportBlocks[0], neural.name, neural.anomalies_count, neural.confidence);
  }

  // Layer 1: FFT
  if (layers[1]) {
    const fft = layers[1];
    updateBlockWithLayer(reportBlocks[1], fft.name, fft.anomalies_count, fft.confidence);
  }

  // Layer 2: ELA
  if (layers[2]) {
    const ela = layers[2];
    updateBlockWithLayer(reportBlocks[2], ela.name, ela.anomalies_count, ela.confidence);
  }

  // Layer 3: PRNU
  if (layers[3]) {
    const prnu = layers[3];
    updateBlockWithLayer(reportBlocks[3], prnu.name, prnu.anomalies_count, prnu.confidence);
  }

  // Layer 4: Metadata
  if (layers[4]) {
    const metadata = layers[4];
    updateBlockWithLayer(reportBlocks[4], metadata.name, metadata.anomalies_count, metadata.confidence);
  }

  // Atualizar probabilidade final
  const probabilityBlock = document.querySelector(".probability strong");
  const probabilityMeter = document.querySelector(".meter span");
  
  if (probabilityBlock && probabilityMeter) {
    probabilityBlock.textContent = `${syntheticProb}%`;
    probabilityMeter.style.width = `${syntheticProb}%`;
    
    if (syntheticProb > 70) {
      probabilityBlock.style.color = "#ff0000";
    } else {
      probabilityBlock.style.color = "#00ff00";
    }
  }

  console.log("Layers:", layers);
  console.log(`Synthetic: ${syntheticProb}%, Real: ${realProb}%`);
}

function updateBlockWithLayer(block, layerName, anomalies, confidence) {
  /* Atualizar um bloco com dados de layer */
  
  const confPercent = Math.round(confidence * 100);
  
  // Atualizar título/nome
  const strong = block.querySelector("strong");
  if (strong) {
    strong.textContent = layerName;
  }
  
  // Atualizar descrição com anomalias e confiança
  const reportLines = block.querySelector(".report-lines");
  if (reportLines) {
    const anomalyBars = createAnomalyBars(anomalies);
    reportLines.innerHTML = `
      ${anomalyBars} ${confPercent}%
    `;
  }
  
  console.log(`${layerName}: confidence=${confPercent}%, anomalies=${anomalies}`);
}

function createAnomalyBars(count) {
  /* Criar representação visual de anomalias (█ preenchidas, ░ vazias) */
  const filled = "█".repeat(Math.min(count, 10));
  const empty = "░".repeat(Math.max(10 - count, 0));
  return filled + empty;
}
