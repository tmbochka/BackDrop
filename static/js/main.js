gsap.registerPlugin(ScrollTrigger);

let bodyScrollBar;

const select = (e) => document.querySelector(e);
const selectAll = (e) => document.querySelectorAll(e);

const sections = selectAll('.rg__column');

// для блока Удаление полностью, замена на цвет и оставшиеся
const allLinks = gsap.utils.toArray('.portfolio__categories a');
const pageBackground = select('.fill-background');
const largeImage = select('.portfolio__image--l');
const smallImage = select('.portfolio__image--s');
const lInside = select('.portfolio__image--l .image_inside');
const sInside = select('.portfolio__image--s .image_inside');

// для окошка "Добро пожаловать"
const loader = select('.loader');
const loaderInner = select('.loader .inner');
const progressBar = select('.loader .progress');
const loaderMask = select('.loader__mask');

// ЭТА ЧАСТЬ СКРЫТА, ЧЕСТНО, С НЕЙ НЕ РАБОТАЕТ, ЧТО ПЕЧАЛЬНО. нЕ ПОМНЮ УЖЕ ПОЧЕМУ ОНО ПЕРЕСТАЛО РАБОТАТЬ, НО ПЕРЕД ЗАХОДОМ НА КАЖДУЮ СТРАНИЦУ ВЫЕЗЖАЛ КВАДРАТ С НАДПИСЬЮ

// function init() {
//     gsap.set(loader, { autoAlpha: 1 });
//     gsap.set(loaderInner, { scaleY: 0.005, transformOrigin: 'bottom' }); // место с которого начинает выезжать синий квадрат при приветствии
//     const progressTween = gsap.to(progressBar, { paused: true, scaleX: 0, ease: 'none', transformOrigin: 'right' });
//     let loadedImageCount = 0, imageCount;
//     const container = select('#main');
//     const imgLoad = imagesLoaded(container);
//     imageCount = imgLoad.images.length;
//     updateProgress(0);
//     imgLoad.on('progress', function () {
//         loadedImageCount++;
//         updateProgress(loadedImageCount);
//     });
//     function updateProgress(value) {
//         gsap.to(progressTween, { progress: value / imageCount, duration: 0.3, ease: 'power1.out' })
//     }
//     imgLoad.on('done', function (instance) {
//         gsap.set(progressBar, { autoAlpha: 0, onComplete: initPageTransitions });
//     });

// }

// init();

function pageTransitionIn({ container }) {
    const tl = gsap.timeline({
        defaults: {
            duration: 0.8,
            ease: 'power1.inOut'
        }
    });
    tl
        .set(loaderInner, { autoAlpha: 0 })
        .fromTo(loader, { yPercent: -100 }, { yPercent: 0 })
        .fromTo(loaderMask, { yPercent: 80 }, { yPercent: 0 }, 0)
        .to(container, { y: 150 }, 0);
    return tl;
}

function pageTransitionOut({ container }) {
    const tl = gsap.timeline({
        defaults: {
            duration: 0.8,
            ease: 'power1.inOut'
        },
        onComplete: () => initContent()
    });
    tl
        .to(loader, { yPercent: 100 })
        .to(loaderMask, { yPercent: -80 }, 0)
        .from(container, { y: -150 }, 0);
    return tl;
}

// переход между страничками
function initPageTransitions() {
    barba.hooks.before(() => {
        select('html').classList.add('is-transitioning');
    });
    barba.hooks.after(() => {
        select('html').classList.remove('is-transitioning');
    });
    barba.hooks.enter(() => {
        window.scrollTo(0, 0);
    });
    barba.init({
        transitions: [{
            once() {
                initLoader();
            },
            async leave({ current }) {
                await pageTransitionIn(current);
            },
            enter({ next }) {
                pageTransitionOut(next);
            }
        }]
    });
}


function initLoader() {
    const tlLoaderIn = gsap.timeline({
        id: 'tlLoaderIn',
        defaults: {
            duration: 1.1, // насколько долго появляется синий квадрат и надпись
            ease: 'power2.out'
        },
        onComplete: () => initContent()
    });

    const image = select('.loader__image img');
    const mask = select('.loader__image--mask');
    const line1 = select('.loader__title--mask:nth-child(1) span');
    const line2 = select('.loader__title--mask:nth-child(2) span');
    const lines = selectAll('.loader__title--mask');
    const loaderContent = select('.loader__content');

    tlLoaderIn
        .set(loaderContent, { autoAlpha: 1 })
        .to(loaderInner, {
            scaleY: 1,
            transformOrigin: 'bottom',
            ease: 'power1.inOut'
        })
        .addLabel('revealImage')
        .from(mask, { yPercent: 100 }, 'revealImage-=0.6')
        .from(image, { yPercent: -80 }, 'revealImage-=0.6')
        .from([line1, line2], { yPercent: 100, stagger: 0.1 }, 'revealImage-=0.4');

    const tlLoaderOut = gsap.timeline({
        id: 'tlLoaderOut',
        defaults: {
            duration: 1.1, // насколько долго исчезает надпись
            ease: 'power2.inOut'
        },
        delay: 1
    });

    tlLoaderOut
        .to(lines, { yPercent: -500, stagger: 0.2 }, 0)
        .to([loader, loaderContent], { yPercent: -100 }, 0.2)
        .from('#main', { y: 150 }, 0.2);

    const tlLoader = gsap.timeline();
    tlLoader
        .add(tlLoaderIn)
        .add(tlLoaderOut);

}

// музыка
let currentAudio = null; // проигрывается ли сейчас музыка

// обновляем текущее состояние: играет музыка или нет
function updateMusicControlButton() {
    const musicControlButton = document.getElementById('musicControlButton');
    if (currentAudio && !currentAudio.paused) {
        musicControlButton.classList.add('playing');
    } else {
        musicControlButton.classList.remove('playing');
    }
}

// событие при клике
function initAudioControls() {
    const musicItems = document.querySelectorAll('.music-item');
    let currentAudio = null;

    musicItems.forEach(item => {
        item.addEventListener('click', () => {
            const audioId = item.dataset.audio;
            const audio = document.getElementById(audioId);

            if (currentAudio && currentAudio !== audio) {
                currentAudio.pause();
                currentAudio.parentElement.classList.remove('playing');
                console.log(`Paused audio: ${currentAudio.id}`);
            }

            if (audio.paused) {
                audio.play();
                currentAudio = audio;
                item.classList.add('playing');
                console.log(`Playing audio: ${audio.id}`);

                // Логирование завершения проигрывания
                audio.addEventListener('ended', () => {
                    console.log(`Audio ended: ${audio.id}`);
                    currentAudio = null;
                    item.classList.remove('playing');
                });
            } else {
                audio.pause();
                currentAudio = null;
                item.classList.remove('playing');
                console.log(`Paused audio: ${audio.id}`);
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const musicItems = document.querySelectorAll('.music-item');

    musicItems.forEach(item => {
        const backgroundUrl = item.getAttribute('data-background');
        item.style.backgroundImage = `url(${backgroundUrl})`;
    });

    initContent();
    initAudioControls();

    // Добавляем обработчик для вкладок
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');

            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            tabContents.forEach(content => {
                if (content.id === targetTab) {
                    content.style.display = 'block';
                } else {
                    content.style.display = 'none';
                }
            });
        });
    });
});

function initBackgroundChange() {
    const backgroundItems = document.querySelectorAll('.background-item');
    let currentBackground = null;

    backgroundItems.forEach(item => {
        const backgroundUrl = item.dataset.background;
        const img = new Image();
        img.src = backgroundUrl;

        img.onload = () => {
            item.style.backgroundImage = `url(${backgroundUrl})`;
        };

        item.addEventListener('mouseenter', () => {
            if (currentBackground !== backgroundUrl) {
                document.body.style.backgroundImage = `url(${backgroundUrl})`;
                currentBackground = backgroundUrl;
            }
        });

        item.addEventListener('mouseleave', () => {
            if (currentBackground) {
                document.body.style.backgroundImage = '';
                currentBackground = null;
            }
        });
    });
}

function initContent() {
    select('body').classList.remove('is-loading');
    initSmoothScrollbar();
    initNavigation();
    initHeaderTilt();
    initHoverReveal();
    initPortfolioHover();
    initImageParallax();
    initPinSteps();
    initScrollTo();
    initAudioControls();
    initBackgroundChange();
}

const updateBodyColor = (color) => {
    document.documentElement.style.setProperty('--bcg-fill-color', color);
}
const getTextHeight = (textCopy) => {
    return textCopy.clientHeight;
}

function initSmoothScrollbar() {
    bodyScrollBar = Scrollbar.init(select('#viewport'), { damping: 0.07 });
    bodyScrollBar.track.xAxis.element.remove();
    ScrollTrigger.scrollerProxy(document.body, {
        scrollTop(value) {
            if (arguments.length) {
                bodyScrollBar.scrollTop = value;
            }
            return bodyScrollBar.scrollTop;
        }
    });
    bodyScrollBar.addListener(ScrollTrigger.update);
}


function initNavigation() {
    const mainNavLinks = gsap.utils.toArray('.main-nav a');
    const mainNavLinksRev = gsap.utils.toArray('.main-nav a').reverse();

    mainNavLinks.forEach(link => {
        link.addEventListener('mouseleave', e => {
            link.classList.add('animate-out');
        });
        link.ontransitionend = function () {
            link.classList.remove('animate-out');
        }
    });

    function navAnimation(direction) {
        const scrollingDown = direction === 1;
        const links = scrollingDown ? mainNavLinks : mainNavLinksRev;
        return gsap.to(links, {
            duration: 0.3,
            stagger: 0.05,
            autoAlpha: () => scrollingDown ? 0 : 1,
            y: () => scrollingDown ? 20 : 0,
            ease: 'power4.out'
        });
    }

    ScrollTrigger.create({
        trigger: '#main',
        start: 'top top-=100',
        end: 'bottom bottom-=200',
        toggleClass: {
            targets: 'body',
            className: 'has-scrolled'
        },
        onEnter: ({ direction }) => navAnimation(direction),
        onLeaveBack: ({ direction }) => navAnimation(direction),
    });
}

// это для "попробуй все возможности фона"
function initHeaderTilt() {
    select('header').addEventListener('mousemove', moveImages);
}

// а это для паралакса картинок
function moveImages(e) {
    const { offsetX, offsetY, target } = e;
    const { clientWidth, clientHeight } = target;
    const xPos = (offsetX / clientWidth) - 0.5;
    const yPos = (offsetY / clientHeight) - 0.5;
    const leftImages = gsap.utils.toArray('.hg__left .hg__image');
    const rightImages = gsap.utils.toArray('.hg__right .hg__image');
    const modifier = (index) => index * 1.2 + 0.5;
    // левые
    leftImages.forEach((image, index) => {
        gsap.to(image, {
            duration: 1.2,
            x: xPos * 20 * modifier(index),
            y: yPos * 30 * modifier(index),
            rotationY: xPos * 40,
            rotationX: yPos * 10,
            ease: 'power3.out'
        });
    });
    // правые
    rightImages.forEach((image, index) => {
        gsap.to(image, {
            duration: 1.2,
            x: xPos * 20 * modifier(index),
            y: -yPos * 30 * modifier(index),
            rotationY: xPos * 40,
            rotationX: yPos * 10,
            ease: 'power3.out'
        });
    });

    gsap.to('.decor__circle', {
        duration: 1.7,
        x: 100 * xPos,
        y: 120 * yPos,
        ease: 'power4.out'
    });

}

// эффекты каждого блока главной страницы
function initHoverReveal() {
    sections.forEach(section => {
        section.imageBlock = section.querySelector('.rg__image');
        section.image = section.querySelector('.rg__image img');
        section.mask = section.querySelector('.rg__image--mask');
        section.text = section.querySelector('.rg__text');
        section.textCopy = section.querySelector('.rg__text--copy');
        section.textMask = section.querySelector('.rg__text--mask');
        section.textP = section.querySelector('.rg__text--copy p');

        gsap.set([section.imageBlock, section.textMask], { yPercent: -101 });
        gsap.set([section.mask, section.textP], { yPercent: 100 });
        gsap.set(section.image, { scale: 1.2 });

        section.addEventListener('mouseenter', createHoverReveal);
        section.addEventListener('mouseleave', createHoverReveal);

    });
}

// для блока Удаление полностью, замена на цвет и оставшиеся
function createHoverReveal(e) {
    const { imageBlock, mask, text, textCopy, textMask, textP, image, dataset } = e.target;
    const { color } = dataset;
    let tl = gsap.timeline({
        defaults: {
            duration: 1.8,
            ease: 'power4.out'
        }
    });

    if (e.type === 'mouseenter') {
        tl
            .to([mask, imageBlock, textMask, textP], {
                yPercent: 0,
                onStart: () => updateBodyColor(color)
            })
            .to(text, { y: () => -getTextHeight(textCopy) / 2 }, 0)
            .to(image, { duration: 1.1, scale: 1 }, 0);

    } else if (e.type === 'mouseleave') {
        tl
            .to([mask, textP], { yPercent: 100 })
            .to([imageBlock, textMask], { yPercent: -101 }, 0)
            .to(text, { y: 0 }, 0)
            .to(image, { scale: 1.2 }, 0);

    }
    return tl;
}

// всё еще тот же блок
function initPortfolioHover() {
    allLinks.forEach(link => {
        link.addEventListener('mouseenter', createPortfolioHover);
        link.addEventListener('mouseleave', createPortfolioHover);
        link.addEventListener('mousemove', createPortfolioMove);
    });
}

function createPortfolioHover(e) {
    if (e.type === 'mouseenter') {
        const { color, imagelarge, imagesmall } = e.target.dataset;
        const allSiblings = allLinks.filter(item => item !== e.target);
        const tl = gsap.timeline({
            onStart: () => updateBodyColor(color)
        });
        tl
            .set(lInside, { backgroundImage: `url(${imagelarge})` })
            .set(sInside, { backgroundImage: `url(${imagesmall})` })
            .to([largeImage, smallImage], { autoAlpha: 1 })
            .to(allSiblings, { color: '#fff', autoAlpha: 0.2 }, 0)
            .to(e.target, { color: '#fff', autoAlpha: 1 }, 0);

    } else if (e.type === 'mouseleave') {
        const tl = gsap.timeline({
            onStart: () => updateBodyColor('#ACB7AE')
        });
        tl
            .to([largeImage, smallImage], { autoAlpha: 0 })
            .to(allLinks, { color: '#000000', autoAlpha: 1 }, 0);
    }
}

function createPortfolioMove(e) {
    const { clientY } = e;
    // большие фото
    gsap.to(largeImage, {
        duration: 1.2,
        y: getPortfolioOffset(clientY) / 6,
        ease: 'power3.out'
    });

    // маленькие фото
    gsap.to(smallImage, {
        duration: 1.5,
        y: getPortfolioOffset(clientY) / 3,
        ease: 'power3.out'
    });

}

function getPortfolioOffset(clientY) {
    return -(select('.portfolio__categories').clientHeight - clientY);
}

// блок технологии (это где про модель и все такое)
function initImageParallax() {
    gsap.utils.toArray('.with-parallax').forEach(section => {
        const image = section.querySelector('img');
        gsap.to(image, {
            yPercent: 20,
            ease: 'none',
            scrollTrigger: {
                trigger: section,
                start: 'top bottom',
                scrub: true
            }
        });
    });
}

// чтобы навигаци в блоке Техонологии была закреплена
function initPinSteps() {
    ScrollTrigger.create({
        trigger: '.fixed-nav',
        start: 'top center',
        endTrigger: '#stage3',
        end: 'center center',
        pin: true,
        pinReparent: true
    });

    const getVh = () => {
        const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
        return vh;
    }
    gsap.utils.toArray('.stage').forEach((stage, index) => {
        const navLinks = gsap.utils.toArray('.fixed-nav li');
        ScrollTrigger.create({
            trigger: stage,
            start: 'top center',
            end: () => `+=${stage.clientHeight + getVh() / 10}`,
            toggleClass: {
                targets: navLinks[index],
                className: 'is-active'
            },
            onEnter: () => updateBodyColor(stage.dataset.color),
            onEnterBack: () => updateBodyColor(stage.dataset.color),
        });
    });

}

// а это чтобы делать прокрутку при нажатии на всё том же блоке Технологии + для последнего блока
function initScrollTo() {
    gsap.utils.toArray('.fixed-nav a').forEach(link => {
        const target = link.getAttribute('href');
        link.addEventListener('click', (e) => {
            e.preventDefault();
            bodyScrollBar.scrollIntoView(select(target), { damping: 0.07, offsetTop: 100 });
        });
    });

    // вот для "Связаться с нами"
    const contactLink = document.querySelector('a[href="#0"]');
    if (contactLink) {
        contactLink.addEventListener('click', (e) => {
            e.preventDefault();
            bodyScrollBar.scrollIntoView(document.getElementById('contact-us'), { damping: 0.07, offsetTop: 100 });
        });
    }
}
