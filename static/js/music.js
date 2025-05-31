document.addEventListener('DOMContentLoaded', function () {
    const items = document.querySelectorAll('.music-item');

    items.forEach(item => {
        const audio = item.querySelector('audio');
        if (!audio) return;

        // При клике на блок — воспроизводим/пауза
        item.addEventListener('click', function () {
            if (audio.paused) {
                // Останавливаем все другие треки
                document.querySelectorAll('audio').forEach(a => a.pause());
                // Воспроизводим этот
                audio.currentTime = 0;
                audio.play();
                // Активируем стиль "играет"
                item.classList.add('playing');
            } else {
                // Пауза
                audio.pause();
                item.classList.remove('playing');
            }
        });
    });
});