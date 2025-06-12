document.addEventListener('DOMContentLoaded', function () {
    // === Переключение вкладок ===
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tab = button.dataset.tab;

            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.style.display = 'none');

            button.classList.add('active');
            document.getElementById(tab).style.display = 'block';
        });
    });

    // === Вкладка "Изображение" ===
    const fileInput = document.getElementById('file');
    const applyBtn = document.getElementById('applyModel');
    const previewContainer = document.getElementById('processedImageContainer');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const saveComputerBtn = document.getElementById('saveToComputer');
    const savePortfolioBtn = document.getElementById('saveToPortfolio');

    let currentResultFilename = '';
    let originalFileName = '';

    // Предпросмотр изображения
    fileInput.addEventListener('change', function () {
        if (!fileInput.files[0]) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            previewContainer.innerHTML = `
                <img src="${e.target.result}" class="preview-image">
                <p class="image-info">Загруженное изображение</p>
            `;
        };
        reader.readAsDataURL(fileInput.files[0]);
    });

    // Обработка изображения
    applyBtn.addEventListener('click', async function () {
        if (!fileInput.files[0]) {
            alert('Пожалуйста, выберите файл!');
            return;
        }

        progressContainer.style.display = 'block';
        progressBar.value = 0;
        progressText.textContent = '0%';

        const formData = new FormData();
        const file = fileInput.files[0];
        formData.append('file', file);

        try {
            const interval = setInterval(() => {
                if (progressBar.value < 90) {
                    progressBar.value += 10;
                    progressText.textContent = `${progressBar.value}%`;
                }
            }, 300);

            const response = await fetch('/process_image', {
                method: 'POST',
                body: formData
            });

            clearInterval(interval);
            const result = await response.json();

            if (result.success) {
                progressBar.value = 100;
                progressText.textContent = '100%';

                currentResultFilename = result.filename;
                originalFileName = file.name;
                const resultUrl = result.result_url + '?t=' + Date.now();

                previewContainer.innerHTML = `
                    <img src="${resultUrl}" class="processed-image">
                    <p class="success-message">${result.message}</p>
                `;
                saveComputerBtn.disabled = false;
                savePortfolioBtn.disabled = false;
            } else {
                throw new Error(result.message || 'Ошибка обработки');
            }
        } catch (error) {
            previewContainer.innerHTML += `<p class="error-message">Ошибка: ${error.message}</p>`;
        } finally {
            setTimeout(() => {
                progressContainer.style.display = 'none';
            }, 1000);
        }
    });

    // Скачивание файла
    saveComputerBtn.addEventListener('click', function () {
        if (!currentResultFilename) return;

        const downloadUrl = `/static/results/${currentResultFilename}`;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `no_bg_${originalFileName.replace(/\.[^/.]+$/, '')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // Сохранить в портфолио
    savePortfolioBtn.addEventListener('click', async function () {
        const previewImg = document.querySelector('#processedImageContainer img');
        if (!previewImg) {
            alert('Нет изображения для сохранения.');
            return;
        }

        const response = await fetch(previewImg.src);
        const blob = await response.blob();

        const formData = new FormData();
        formData.append('file', blob, currentResultFilename || 'processed.png');

        const res = await fetch('/save_to_portfolio', {
            method: 'POST',
            body: formData
        });

        const data = await res.json();
        if (data.success) {
            alert('Сохранено в портфолио!');
        } else {
            alert('Ошибка при сохранении');
        }
    });


    // === Вкладка "Архив" ===
    const zipInput = document.getElementById('zipUpload');
    const thumbnailsContainer = document.querySelector('.thumbnails-container');
    const applyAllBtn = document.getElementById('applyModelAll');
    const batchProgressBar = document.querySelector('.batch-progress-bar');
    const batchProgressText = document.querySelector('.batch-progress-text');
    const saveBatchBtn = document.getElementById('saveBatchToComputer');
    const savePortfolioArchiveBtn = document.getElementById('saveToPortfolio');

    let uploadedFiles = [];

    // Загрузка ZIP и показ содержимого
    zipInput.addEventListener('change', async function () {
        const file = zipInput.files[0];
        if (!file || !file.name.endsWith('.zip')) {
            alert('Пожалуйста, загрузите корректный ZIP-файл.');
            return;
        }

        thumbnailsContainer.innerHTML = '<p>Загрузка архива...</p>';

        const reader = new FileReader();
        reader.onload = async function (e) {
            try {
                const zip = new JSZip();
                const content = await zip.loadAsync(e.target.result);

                thumbnailsContainer.innerHTML = '';
                uploadedFiles = [];

                for (const filename in content.files) {
                    const fileEntry = content.files[filename];

                    if (fileEntry.dir) continue;

                    const ext = filename.split('.').pop().toLowerCase();
                    if (!['jpg', 'jpeg', 'png'].includes(ext)) continue;

                    const blob = await fileEntry.async("blob");
                    const url = URL.createObjectURL(blob);

                    const thumb = document.createElement('div');
                    thumb.className = 'thumbnail-wrapper';
                    thumb.innerHTML = `
                        <img src="${url}" alt="${filename}" class="thumbnail-img">
                        <button class="delete-btn" data-index="${uploadedFiles.length}">✖</button>
                    `;
                    thumbnailsContainer.appendChild(thumb);

                    uploadedFiles.push(filename);
                }

                if (uploadedFiles.length === 0) {
                    thumbnailsContainer.innerHTML = '<p>ZIP не содержит изображений.</p>';
                }

            } catch (err) {
                console.error("Ошибка чтения ZIP:", err);
                thumbnailsContainer.innerHTML = '<p>Ошибка чтения архива.</p>';
            }
        };

        reader.onerror = function (e) {
            console.error("Ошибка чтения файла:", e);
            thumbnailsContainer.innerHTML = '<p>Не удалось прочитать файл.</p>';
        };

        reader.readAsArrayBuffer(file);
    });

    // Удаление изображений
    thumbnailsContainer.addEventListener('click', function (e) {
        if (e.target.classList.contains('delete-btn')) {
            const index = parseInt(e.target.dataset.index);
            uploadedFiles.splice(index, 1);
            e.target.parentElement.remove();
        }
    });

    // Обработка всех изображений
    applyAllBtn.addEventListener('click', async function () {
        if (!uploadedFiles.length) {
            alert('Нет изображений для обработки.');
            return;
        }

        batchProgressBar.value = 0;
        batchProgressText.textContent = '0%';

        const formData = new FormData();

        const imageElements = thumbnailsContainer.querySelectorAll('img');
        for (let i = 0; i < imageElements.length; i++) {
            const img = imageElements[i];
            const response = await fetch(img.src);
            const blob = await response.blob();
            const file = new File([blob], img.alt, { type: 'image/png' });
            formData.append('files', file);
        }

        try {
            const interval = setInterval(() => {
                if (batchProgressBar.value < 90) {
                    batchProgressBar.value += 10;
                    batchProgressText.textContent = `${batchProgressBar.value}%`;
                }
            }, 300);

            const response = await fetch('/process_images_in_archive', {
                method: 'POST',
                body: formData
            });

            clearInterval(interval);
            const result = await response.json();

            if (result.success) {
                batchProgressBar.value = 100;
                batchProgressText.textContent = '100%';
                saveBatchBtn.disabled = false;

                thumbnailsContainer.querySelectorAll('img').forEach(img => {
                    img.src = `/static/results/${result.filenames[img.alt]}`;
                });
            } else {
                throw new Error(result.message || 'Ошибка массовой обработки');
            }
        } catch (error) {
            console.error("Ошибка:", error);
            alert(`Ошибка: ${error.message}`);
        } finally {
            setTimeout(() => {
                batchProgressText.textContent = '0%';
                batchProgressBar.value = 0;
            }, 1000);
        }
    });

    // Скачивание архива с обработанными изображениями
    saveBatchBtn.addEventListener('click', function () {
        window.location.href = '/download_processed_archive';
    });

    // Сохранить весь архив в портфолио
    savePortfolioArchiveBtn.addEventListener('click', async function () {
        const archiveName = sessionStorage.getItem('batch_archive');
        if (!archiveName) {
            alert('Нет обработанного архива для сохранения.');
            return;
        }

        const formData = new FormData();
        const response = await fetch(`/static/results/${archiveName}`);
        const blob = await response.blob();
        formData.append('file', blob, archiveName);

        const res = await fetch('/save_to_portfolio', {
            method: 'POST',
            body: formData
        });

        const data = await res.json();
        if (data.success) {
            alert('Архив сохранён в портфолио!');
        } else {
            alert('Ошибка при сохранении архива');
        }
    });
});