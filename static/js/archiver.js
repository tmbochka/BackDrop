// archiver.js
document.getElementById('file-upload').addEventListener('change', function(event) {
    const uploadedPhotos = document.getElementById('uploaded-photos');
    uploadedPhotos.innerHTML = ''; // Очищаем предыдущие загруженные фотографии

    for (let file of event.target.files) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imgContainer = document.createElement('div');
            imgContainer.className = 'photo-container';

            const imgElement = document.createElement('img');
            imgElement.src = e.target.result;
            imgElement.className = 'uploaded-photo';

            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-button';
            deleteButton.innerHTML = '&#10006;'; // Символ крестика
            deleteButton.addEventListener('click', function() {
                imgContainer.remove();
            });

            imgContainer.appendChild(imgElement);
            imgContainer.appendChild(deleteButton);
            uploadedPhotos.appendChild(imgContainer);
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('upload-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const formData = new FormData(this);
    const statusDiv = document.getElementById('upload-status');

    // Проверка, что выбрана только одна опция сохранения
    const checkboxes = document.querySelectorAll('input[name="save_option"]:checked');
    if (checkboxes.length !== 1) {
        statusDiv.innerHTML = '<p style="color: red;">Выберите только одну опцию сохранения.</p>';
        return;
    }

    fetch('/upload_and_archive', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (response.headers.get('Content-Type') === 'application/json') {
            return response.json();
        } else {
            const contentDisposition = response.headers.get('Content-Disposition');
            if (!contentDisposition) {
                return response.json().then(data => {
                    throw new Error(data.message || 'Ошибка при загрузке файла');
                });
            }
            const filename = contentDisposition.split('filename=')[1].replace(/"/g, '');
            return response.blob().then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                return { success: true, message: 'Файлы успешно заархивированы и сохранены на вашем устройстве.' };
            });
        }
    })
    .then(data => {
        if (data.success) {
            statusDiv.innerHTML = `<p style="color: green;">${data.message}</p>`;
        } else {
            statusDiv.innerHTML = `<p style="color: red;">Ошибка: ${data.message}</p>`;
        }
    })
    .catch(error => {
        statusDiv.innerHTML = `<p style="color: red;">Ошибка: ${error.message}</p>`;
    });
});