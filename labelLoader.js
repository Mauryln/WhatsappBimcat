// Variable para trackear si ya verificamos que no hay etiquetas disponibles
let labelsUnavailable = false;
let allLabelsData = [];

async function checkSessionAndLoadLabels() {
  const userId = window.whatsappSession.getUserId();
  if (!userId) return;

  try {
    const response = await fetch(`${API_URL}/session-status/${userId}`);
    const data = await response.json();
    
    if (data.success && data.status === 'ready') {
      // Siempre intentar cargar etiquetas y sus números cuando la sesión esté lista
      await loadLabelsAndNumbers();
    } else {
      labelSelector.innerHTML = '<option value="">Conecta WhatsApp primero</option>';
      labelSelector.disabled = true;
      labelsUnavailable = false; // Reset cuando la sesión no está lista
    }
  } catch (error) {
    console.error("Error verificando estado de sesión:", error);
    if (labelSelector.disabled || labelSelector.options.length <= 1) {
      labelSelector.innerHTML = '<option value="">Error al verificar estado</option>';
      labelSelector.disabled = true;
    }
  }
}

async function loadLabelsAndNumbers() {
  const userId = window.whatsappSession.getUserId();
  try {
    // Guardar la selección actual
    const currentSelection = labelSelector.value;
    labelSelector.innerHTML = '<option value="">Cargando etiquetas...</option>';
    labelSelector.disabled = true;
    allLabelsData = [];
    // Obtener todas las etiquetas y sus números de una sola vez
    const res = await fetch(`${API_URL}/labels/${userId}/all-chats`);
    const data = await res.json();
    if (data.success && data.labels && data.labels.length > 0) {
      labelSelector.innerHTML = '<option value="">Selecciona una etiqueta</option>';
      allLabelsData = data.labels;
      data.labels.forEach(label => {
        const opt = document.createElement("option");
        opt.value = label.id;
        opt.textContent = label.name;
        labelSelector.appendChild(opt);
      });
      // Restaurar la selección si existe
      if (currentSelection) {
        labelSelector.value = currentSelection;
      }
      labelSelector.disabled = false;
      labelsUnavailable = false;
    } else {
      const errorMsg = data.message || 'No hay etiquetas disponibles';
      labelSelector.innerHTML = `<option value="">${errorMsg}</option>`;
      labelSelector.disabled = true;
    }
  } catch (err) {
    console.error("Error cargando etiquetas y números:", err);
    labelSelector.innerHTML = '<option value="">Error al cargar etiquetas</option>';
    labelSelector.disabled = true;
  }
}

function showNumbersForSelectedLabel() {
  const labelId = labelSelector.value;
  const numberList = document.getElementById("numberList");
  const labelInfo = document.getElementById("label-info");
  if (!labelId) {
    numberList.innerHTML = '';
    labelInfo.textContent = '';
    return;
  }
  // Buscar los números ya descargados
  const labelData = allLabelsData.find(l => l.id === labelId);
  if (!labelData) {
    numberList.innerHTML = '';
    labelInfo.textContent = 'No se encontraron números para esta etiqueta.';
    return;
  }
  // Mostrar mensaje de carga si hay muchos números
  if (labelData.numbers.length > 100) {
    numberList.innerHTML = '<div class="loading-message">Cargando muchos números...</div>';
  } else {
    numberList.innerHTML = '';
  }
  // Añadir a la lista de checkboxes usando fragment para optimizar
  const fragment = document.createDocumentFragment();
  labelData.numbers.forEach(num => {
    const formattedNumber = `+${num.replace(/\D/g, '')}`;
    const checkboxDiv = document.createElement("div");
    checkboxDiv.className = "checkbox-item";
    checkboxDiv.innerHTML = `
      <input type="checkbox" class="number-checkbox" checked value="${formattedNumber}">
      <label>${formattedNumber}</label>
    `;
    fragment.appendChild(checkboxDiv);
  });
  numberList.innerHTML = '';
  numberList.appendChild(fragment);
  labelInfo.textContent = `${labelData.numbers.length} números cargados de la etiqueta seleccionada.`;
  updateCountDisplay();
  // Guardar automáticamente en chrome.storage.local usando la función de numberManager.js
  if (typeof window.saveNumbers === 'function') {
    window.saveNumbers();
  } else {
    const toSave = labelData.numbers.map(num => ({ number: `+${num.replace(/\D/g, '')}`, checked: true }));
    if (chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ savedNumbers: toSave });
    }
  }
}

function updateCountDisplay() {
  const all = document.querySelectorAll(".number-checkbox").length;
  const selected = document.querySelectorAll(".number-checkbox:checked").length;
  document.getElementById("selected-count").textContent = selected;
  document.getElementById("total-count").textContent = all;
}

// Verificar el estado inicial de la sesión
checkSessionAndLoadLabels();

// Escuchar cambios en el estado de la sesión
document.addEventListener("whatsappSessionStatusChanged", (e) => {
  if (e.detail.status === "ready") {
    labelsUnavailable = false; // Reset cuando la sesión cambia
    checkSessionAndLoadLabels();
  } else if (e.detail.status === "no_session") {
    labelSelector.innerHTML = '<option value="">Conecta WhatsApp primero</option>';
    labelSelector.disabled = true;
    labelsUnavailable = false; // Reset cuando no hay sesión
  }
});

// Verificar el estado de la sesión periódicamente (solo si no hemos determinado que no hay etiquetas)
setInterval(() => {
  if (!labelsUnavailable) {
    checkSessionAndLoadLabels();
  }
}, 10000); // Aumentado a 10 segundos para reducir requests

// Cambiar evento del botón para mostrar los números ya descargados
loadLabelBtn.addEventListener("click", showNumbersForSelectedLabel);

// También mostrar automáticamente los números al cambiar de etiqueta
labelSelector.addEventListener("change", () => {
  // Opcional: puedes mostrar los números automáticamente al cambiar la selección
  // showNumbersForSelectedLabel();
});
