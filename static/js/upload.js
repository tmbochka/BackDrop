document.addEventListener('DOMContentLoaded', function () {
    const fileInput = document.getElementById('file');
    const applyBtn = document.getElementById('applyModel');
    const previewContainer = document.getElementById('processedImageContainer');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const saveComputerBtn = document.getElementById('saveToComputer');

    let currentResultFilename = '';

    if (!applyBtn) {
        console.error("Кнопка 'applyModel' не найдена!");
        return;
    }

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
        formData.append('file', fileInput.files[0]);

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
                const resultUrl = result.result_url + '?t=' + Date.now();

                previewContainer.innerHTML = `
                    <img src="${resultUrl}" class="processed-image">
                    <p class="success-message">${result.message}</p>
                `;
                saveComputerBtn.disabled = false;
            } else {
                throw new Error(result.message || 'Ошибка обработки');
            }
        } catch (error) {
            previewContainer.innerHTML += `
                <p class="error-message">Ошибка: ${error.message}</p>
            `;
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
        link.download = `no_bg_${fileInput.files[0].name.replace(/\.[^/.]+$/, '')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
});
