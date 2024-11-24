document.getElementById('applyModel').addEventListener('click', function() {
    const fileInput = document.getElementById('file');
    const modelSelect = document.getElementById('model');
    const backgroundOption = document.getElementById('backgroundOption').value;
    const processedImageContainer = document.getElementById('processedImageContainer');

    if (fileInput.files.length === 0) {
        alert('Пожалуйста, выберите файл.');
        return;
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('model', modelSelect.value);
    formData.append('backgroundOption', backgroundOption);
    formData.append('filename', fileInput.files[0].name);

    let url = '/process_image_tracer';

    fetch(url, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const imgAlpha = document.createElement('img');
            imgAlpha.src = '/uploads/' + data.result_alpha_filename;
            const imgColor = document.createElement('img');
            imgColor.src = '/uploads/' + data.result_color_filename;
            processedImageContainer.innerHTML = '';
            processedImageContainer.appendChild(imgAlpha);
            processedImageContainer.appendChild(imgColor);
        } else {
            alert(data.message);
        }
    })
    .catch(error => {
        alert('Ошибка: ' + error.message);
    });
});

document.getElementById('saveToComputer').addEventListener('click', function() {
    const processedImageContainer = document.getElementById('processedImageContainer');
    const img = processedImageContainer.querySelector('img');

    if (!img) {
        alert('Сначала обработайте изображение.');
        return;
    }

    const a = document.createElement('a');
    a.href = img.src;
    a.download = 'processed_image.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
});

document.getElementById('saveToPortfolio').addEventListener('click', function() {
    const processedImageContainer = document.getElementById('processedImageContainer');
    const img = processedImageContainer.querySelector('img');

    if (!img) {
        alert('Сначала обработайте изображение.');
        return;
    }

    const newName = document.getElementById('newName').value;
    if (!newName) {
        alert('Пожалуйста, введите название нового изображения.');
        return;
    }

    const formData = new FormData();
    formData.append('processed_filename', img.src.split('/').pop());
    formData.append('new_name', newName);

    fetch('/save_to_portfolio', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(data.message);
        } else {
            alert(data.message);
        }
    })
    .catch(error => {
        alert('Ошибка: ' + error.message);
    });
});

document.getElementById('saveToArchives').addEventListener('click', function() {
    const processedImageContainer = document.getElementById('processedImageContainer');
    const img = processedImageContainer.querySelector('img');

    if (!img) {
        alert('Сначала обработайте изображение.');
        return;
    }

    const newName = document.getElementById('newName').value;
    if (!newName) {
        alert('Пожалуйста, введите название нового изображения.');
        return;
    }

    const formData = new FormData();
    formData.append('processed_filename', img.src.split('/').pop());
    formData.append('new_name', newName);

    fetch('/save_to_archives', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(data.message);
        } else {
            alert(data.message);
        }
    })
    .catch(error => {
        alert('Ошибка: ' + error.message);
    });
});