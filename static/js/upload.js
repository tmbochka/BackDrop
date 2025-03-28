// Я УЖЕ ЗАПУТАЛАСЬ ЧТО ЗДЕСЬ ПРОИСХОДИТ, ТАК КАК ПРОМТЫ ПИСАТЬ ЭТО ЦЕЛОЕ ИСКУССТВО, А ДИПСИК НЕ ОЧЕНЬ ЗАХОТЕЛ МНЕ ПОМОГАТЬ 

document.addEventListener('DOMContentLoaded', function() {
    // Элементы интерфейса
    const applyBtn = document.getElementById('applyModel');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const saveButtons = [
        document.getElementById('saveToComputer'),
        document.getElementById('saveToPortfolio'),
        document.getElementById('saveToArchives')
    ];

    // Блокировка кнопок сохранения при загрузке
    saveButtons.forEach(btn => btn.disabled = true);

    // Обработка нажатия "Применить модель"
    applyBtn.addEventListener('click', async function() {
        const fileInput = document.getElementById('file');
        const backgroundOption = document.getElementById('backgroundOption').value;
        
        if (!fileInput.files[0]) {
            alert('Пожалуйста, выберите файл!');
            return;
        }

        // Показываем прогресс
        progressContainer.style.display = 'block';
        progressBar.value = 0;
        progressText.textContent = '0%';

        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        formData.append('backgroundOption', backgroundOption);

        try {
            const response = await fetch('/process_image', {
                method: 'POST',
                body: formData,
            });

            // Обновляем прогресс
            progressBar.value = 50;
            progressText.textContent = '50%';

            const result = await response.json();

            if (result.success) {
                // Показываем результат
                const container = document.getElementById('processedImageContainer');
                container.innerHTML = `
                    <img src="/uploads/${result.filename}" alt="Обработанное изображение" class="processed-image">
                    <p class="success-message">${result.message}</p>
                `;

                // Активируем кнопки сохранения
                saveButtons.forEach(btn => btn.disabled = false);

                // Завершаем прогресс
                progressBar.value = 100;
                progressText.textContent = '100%';
                setTimeout(() => {
                    progressContainer.style.display = 'none';
                }, 1000);
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            progressContainer.style.display = 'none';
            alert(`Ошибка: ${error.message}`);
        }
    });

    // Обработчик для кнопки "Сохранить на компьютер"
    document.getElementById('saveToComputer').addEventListener('click', function() {
        const img = document.querySelector('#processedImageContainer img');
        if (img) {
            const link = document.createElement('a');
            link.href = img.src;
            link.download = img.src.split('/').pop() || 'processed_image.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    });

    // ДЛЯ ДРУГИХ КНОПОК ПОКА НЕТ
});