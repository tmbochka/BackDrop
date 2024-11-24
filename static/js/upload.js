document.addEventListener('DOMContentLoaded', function() {
    const uploadForm = document.getElementById('uploadForm');
    const applyModelButton = document.getElementById('applyModel');
    const processedImageContainer = document.getElementById('processedImageContainer');
    const saveToComputerButton = document.getElementById('saveToComputer');
    const saveToPortfolioButton = document.getElementById('saveToPortfolio');
    const saveToArchivesButton = document.getElementById('saveToArchives');

    let processedImage = null;

    applyModelButton.addEventListener('click', async function() {
        const fileInput = document.getElementById('file');
        const modelSelect = document.getElementById('model');

        if (fileInput.files.length === 0) {
            alert('Пожалуйста, выберите файл.');
            return;
        }

        const file = fileInput.files[0];
        const model = modelSelect.value;

        // Здесь должна быть логика для обработки изображения с использованием выбранной модели
        // Для примера, просто отобразим загруженное изображение
        const reader = new FileReader();
        reader.onload = function(event) {
            processedImage = event.target.result;
            processedImageContainer.innerHTML = `<img src="${processedImage}" alt="Обработанное изображение">`;
        };
        reader.readAsDataURL(file);
    });

    saveToComputerButton.addEventListener('click', function() {
        if (!processedImage) {
            alert('Сначала обработайте изображение.');
            return;
        }

        const link = document.createElement('a');
        link.href = processedImage;
        link.download = document.getElementById('newName').value || 'processed_image.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    saveToPortfolioButton.addEventListener('click', function() {
        if (!processedImage) {
            alert('Сначала обработайте изображение.');
            return;
        }

        // Здесь должна быть логика для сохранения изображения в портфолио
        alert('Изображение сохранено в портфолио.');
    });

    saveToArchivesButton.addEventListener('click', function() {
        if (!processedImage) {
            alert('Сначала обработайте изображение.');
            return;
        }

        // Здесь должна быть логика для сохранения изображения в архивы
        alert('Изображение сохранено в архивы.');
    });
});