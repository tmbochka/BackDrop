// СУПЕР КЛАССНАЯ АПИШКА С РАНДОМНЫМИ ФОТО СОБАК НА СТРАНИЦЕ "СВЯЗАТЬСЯ С НАМИ"

document.addEventListener('DOMContentLoaded', function() {
    // Функция для загрузки случайной картинки собаки
    function loadRandomDogImage() {
        fetch('https://random.dog/woof.json')
            .then(response => response.json())
            .then(data => {
                const dogImageUrl = data.url;
                const dogImageElement = document.querySelector('.about-us__image img');

                // Проверяем, является ли файл изображением
                if (dogImageUrl.match(/\.(jpeg|jpg|png|gif)$/)) {
                    dogImageElement.src = dogImageUrl;
                } else {
                    // Если файл не является изображением, повторяем запрос
                    loadRandomDogImage();
                }
            })
            .catch(error => {
                console.error('Ошибка при загрузке картинки собаки:', error);
                // Загружаем резервную картинку
                const dogImageElement = document.querySelector('.about-us__image img');
                dogImageElement.src = './static/img/photo.jpg';
            });
    }

    // Загружаем случайную картинку при загрузке страницы
    loadRandomDogImage();
});

