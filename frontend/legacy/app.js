const fileInput = document.getElementById('file-input');
const dropZone = document.getElementById('drop-zone');
const previewContainer = document.getElementById('preview-container');
const filenameSpan = document.getElementById('filename');
const uploadBtn = document.getElementById('upload-btn');
const statusContainer = document.getElementById('status-container');
const resultContainer = document.getElementById('result-container');
const resDocId = document.getElementById('res-doc-id');
const fileList = document.getElementById('file-list');
const btnPersonal = document.getElementById('btn-personal');
const btnLegal = document.getElementById('btn-legal');
const uploadTitle = document.getElementById('upload-title');
const uploadDesc = document.getElementById('upload-desc');
const nameInput = document.getElementById('name-input');

let currentMode = 'personal'; // 'personal' or 'legal'

// Mode Toggle
btnPersonal.addEventListener('click', () => {
    currentMode = 'personal';
    btnPersonal.classList.add('active');
    btnLegal.classList.remove('active');
    fileInput.multiple = false;
    fileInput.accept = "image/*";
    uploadTitle.textContent = "Drag & Drop Image";
    uploadDesc.textContent = "Support for JPG, PNG";
    nameInput.placeholder = "Enter Document Name...";
    resetUI();
});

btnLegal.addEventListener('click', () => {
    currentMode = 'legal';
    btnLegal.classList.add('active');
    btnPersonal.classList.remove('active');
    fileInput.multiple = true;
    fileInput.accept = "image/*,application/pdf";
    uploadTitle.textContent = "Drag & Drop Batch";
    uploadDesc.textContent = "Support for JPG, PNG, PDF";
    nameInput.placeholder = "Enter Batch Name...";
    resetUI();
});

fileInput.addEventListener('change', handleFileSelect);

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
        showPreview(files);
    }
}

function showPreview(files) {
    fileList.innerHTML = '';
    if (currentMode === 'personal') {
        filenameSpan.textContent = files[0].name;
    } else {
        filenameSpan.textContent = `${files.length} files selected`;
        files.forEach(f => {
            const div = document.createElement('div');
            div.className = 'file-item';
            div.innerHTML = `<span>${f.name}</span> <span class="badge">${f.type.split('/')[1].toUpperCase()}</span>`;
            fileList.appendChild(div);
        });
    }
    previewContainer.classList.remove('hidden');
    dropZone.classList.add('hidden');
}

uploadBtn.addEventListener('click', async () => {
    const files = Array.from(fileInput.files);
    const docName = nameInput.value.trim();

    if (files.length === 0) {
        alert("Please select files first.");
        return;
    }
    if (!docName) {
        alert(`Please enter a ${currentMode === 'personal' ? 'Document' : 'Batch'} Name.`);
        return;
    }

    // Show loading
    previewContainer.classList.add('hidden');
    statusContainer.classList.remove('hidden');

    const formData = new FormData();
    const endpoint = currentMode === 'personal'
        ? 'http://127.0.0.1:8000/api/upload/personal'
        : 'http://127.0.0.1:8000/api/upload/legal';

    if (currentMode === 'personal') {
        formData.append('file', files[0]);
        formData.append('document_name', docName);
    } else {
        files.forEach(f => formData.append('files', f));
        formData.append('batch_name', docName);
    }

    try {
        console.log(`Sending ${currentMode} upload request to backend...`);
        const response = await fetch(endpoint, {
            method: 'POST',
            body: formData
        });

        console.log("Response received:", response.status);
        const result = await response.json();

        if (response.ok) {
            console.log("Upload success:", result);
            showResult(result);
        } else {
            console.error("Upload failed server-side:", result);
            alert('Upload failed: ' + (result.detail || 'Unknown error'));
            resetUI();
        }
    } catch (error) {
        console.error("Network or Fetch error:", error);
        alert('Error connecting to backend: ' + error.message);
        resetUI();
    }
});

function showResult(data) {
    statusContainer.classList.add('hidden');
    resultContainer.classList.remove('hidden');
    resDocId.textContent = currentMode === 'personal' ? data.doc_id : data.batch_id;
}

function resetUI() {
    statusContainer.classList.add('hidden');
    dropZone.classList.remove('hidden');
    fileInput.value = '';
}

// Drag & Drop
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '#bb86fc';
});

dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = 'rgba(255, 255, 255, 0.1)';
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        fileInput.files = e.dataTransfer.files;
        showPreview(file);
    } else {
        alert('Please drop an image file.');
    }
});
