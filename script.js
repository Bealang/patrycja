let isEnvelopeActive = true; // Zmienna stanu dla koperty startowej

document.addEventListener('DOMContentLoaded', () => {
    initHearts();
    initGestureListeners();
    initImagePreloader();
});

function initImagePreloader() {
    const images = document.querySelectorAll('img');
    const totalImages = images.length;
    const loadingScreen = document.getElementById('loading-screen');
    const loadingBar = document.getElementById('loading-bar');
    const loadingPercentage = document.getElementById('loading-percentage');
    const cursor = document.getElementById('envelope-cursor');
    
    if (totalImages === 0) {
        hideLoader();
        return;
    }
    
    let loadedCount = 0;
    
    function imageLoaded() {
        loadedCount++;
        const percentage = Math.round((loadedCount / totalImages) * 100);
        
        if (loadingBar) loadingBar.style.width = percentage + '%';
        if (loadingPercentage) loadingPercentage.textContent = percentage + '%';
        
        if (loadedCount >= totalImages) {
            setTimeout(hideLoader, 300);
        }
    }
    
    images.forEach(img => {
        if (img.complete) {
            imageLoaded();
        } else {
            img.addEventListener('load', imageLoaded);
            img.addEventListener('error', imageLoaded);
        }
    });
    
    function hideLoader() {
        if (loadingScreen) {
            loadingScreen.classList.add('fade-out');
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                if (cursor) {
                    cursor.classList.add('flying');
                }
            }, 600);
        } else {
            if (cursor) {
                cursor.classList.add('flying');
            }
        }
    }
}

let currentScreenIndex = 0;
let currentPhotoIndex = 0; // Śledzenie aktywnego zdjęcia w suwakach
let hasClickedFAB = false; // Flag dla pokazania podpowiedzi "Kliknij tutaj!"
let isTransitioning = false; // Blokada dla przejść, by zapobiec spomowaniu triggerów
const screens = document.querySelectorAll('.screen');
const totalScreens = screens.length;

// Cele czasowe dla poszczególnych dat (indeksy odpowiadają indeksom ekranów w index.html)
const targetDates = [
    null, // Ekran 0: Powitanie
    new Date('2026-01-30T20:00:00+01:00').getTime(), // Ekran 1: 30 stycznia (Indeks 1)
    null, // Ekran 2: Slider 1 (Indeks 2)
    new Date('2026-02-09T18:00:00+01:00').getTime(), // Ekran 3: 9 lutego (Indeks 3)
    null, // Ekran 4: Slider 2 (Indeks 4)
    new Date('2026-03-21T21:11:00+01:00').getTime(), // Ekran 5: 21 marca (Indeks 5, Związek)
    null, // Ekran 6: Slider 3 (Indeks 6)
    new Date('2026-04-25T19:00:00+01:00').getTime(), // Ekran 7: 25 kwietnia (Indeks 7)
    null, // Ekran 8: Slider 4 (Indeks 8)
    new Date('2026-06-20T22:00:00+01:00').getTime(), // Ekran 9: 20 czerwca (Indeks 9, Kocham Cię)
    null, // Ekran 10: Slider 5 (Indeks 10)
    null  // Ekran 11: Finał (Indeks 11)
];

// Logika przejścia DO PRZODU
function nextScreen() {
    if (isEnvelopeActive) return; // Blokada nawigacji gdy koperta jest aktywna
    if (isTransitioning) return;

    // Ukrywamy podpowiedź natychmiast po jakimkolwiek kliknięciu nawigacji
    hasClickedFAB = true;
    hideHint();

    const currentScreen = screens[currentScreenIndex];
    
    // Sprawdzamy czy na obecnym ekranie jest suwak zdjęć i czy możemy przewinąć dalej
    const slider = currentScreen.querySelector('.slider-container');
    if (slider) {
        const slides = slider.querySelectorAll('.slide');
        const maxPhotoIndex = slides.length - 1;
        if (currentPhotoIndex < maxPhotoIndex) {
            isTransitioning = true;
            currentPhotoIndex++;
            const slideWidth = slides[0].offsetWidth;
            slider.scrollTo({
                left: currentPhotoIndex * slideWidth,
                behavior: 'smooth'
            });
            setTimeout(() => {
                isTransitioning = false;
            }, 500); // Blokada na 500ms dla płynnego scrollowania zdjęcia
            return;
        }
    }

    // Przejście do kolejnego ekranu (SPA slide)
    if (currentScreenIndex < totalScreens - 1) {
        isTransitioning = true;
        const nextScreen = screens[currentScreenIndex + 1];

        // Wyjście aktualnego ekranu
        currentScreen.classList.remove('active');
        currentScreen.classList.add('exiting');

        // Wejście kolejnego ekranu
        nextScreen.classList.remove('exiting-down');
        nextScreen.classList.add('active');

        // Resetowanie suwaków na nowym ekranie
        const nextSlider = nextScreen.querySelector('.slider-container');
        if (nextSlider) {
            currentPhotoIndex = 0;
            nextSlider.scrollLeft = 0;
        }

        setTimeout(() => {
            currentScreen.classList.remove('exiting');
            isTransitioning = false;
        }, 800); // 800ms odpowiada czasowi transition-time w CSS

        currentScreenIndex++;
        updateFABs();
    }
}

// Logika przejścia DO TYŁU
function prevScreen() {
    if (isEnvelopeActive) return; // Blokada nawigacji gdy koperta jest aktywna
    if (isTransitioning) return;
    hasClickedFAB = true;
    hideHint();

    const currentScreen = screens[currentScreenIndex];
    
    // Sprawdzamy czy na obecnym ekranie jest suwak zdjęć i możemy cofnąć zdjęcie
    const slider = currentScreen.querySelector('.slider-container');
    if (slider) {
        if (currentPhotoIndex > 0) {
            isTransitioning = true;
            currentPhotoIndex--;
            const slides = slider.querySelectorAll('.slide');
            const slideWidth = slides[0].offsetWidth;
            slider.scrollTo({
                left: currentPhotoIndex * slideWidth,
                behavior: 'smooth'
            });
            setTimeout(() => {
                isTransitioning = false;
            }, 500);
            return;
        }
    }

    // Cofnięcie do poprzedniego ekranu
    if (currentScreenIndex > 0) {
        isTransitioning = true;
        const prevScreen = screens[currentScreenIndex - 1];

        // Wyjście aktualnego ekranu w dół
        currentScreen.classList.remove('active');
        currentScreen.classList.add('exiting-down');

        // Przygotowanie poprzedniego ekranu: wchodzi z pozycji wyjściowej
        prevScreen.classList.add('exiting');
        prevScreen.classList.remove('exiting-down');
        
        // Wymuszenie reflow dla wyrenderowania stanu początkowego animacji wstecznej
        prevScreen.offsetHeight;

        // Płynne wjechanie poprzedniego ekranu na scenę
        prevScreen.classList.remove('exiting');
        prevScreen.classList.add('active');

        // Inicjalizacja suwaków na poprzednim ekranie (od ostatniego zdjęcia)
        const prevSlider = prevScreen.querySelector('.slider-container');
        if (prevSlider) {
            const slides = prevSlider.querySelectorAll('.slide');
            currentPhotoIndex = slides.length - 1;
            const slideWidth = slides[0].offsetWidth;
            prevSlider.scrollLeft = currentPhotoIndex * slideWidth;
        } else {
            currentPhotoIndex = 0;
        }

        setTimeout(() => {
            currentScreen.classList.remove('exiting-down');
            isTransitioning = false;
        }, 800);

        currentScreenIndex--;
        updateFABs();
    }
}

function restart() {
    isTransitioning = false;
    isEnvelopeActive = true;
    
    // Zresetowanie koperty do stanu początkowego
    const overlay = document.getElementById('envelope-overlay');
    if (overlay) {
        overlay.style.display = 'flex';
        // Wymuszenie reflow dla resetu przejść
        overlay.offsetHeight;
        overlay.classList.remove('fade-out');
        const envelope = overlay.querySelector('.envelope');
        if (envelope) {
            envelope.classList.remove('open');
        }
        const cursor = document.getElementById('envelope-cursor');
        if (cursor) {
            cursor.style.opacity = '1';
            cursor.classList.add('flying');
        }
    }
    
    // Reset wszystkich ekranów
    screens.forEach((screen, index) => {
        screen.classList.remove('active', 'exiting', 'exiting-down');
        if (index === 0) {
            screen.classList.add('active');
        }
    });
    currentScreenIndex = 0;
    currentPhotoIndex = 0;
    hasClickedFAB = false;
    updateFABs();
}

// Funkcja sterująca widocznością przycisków nawigacji FAB i podpowiedzi
function updateFABs() {
    const nextFab = document.getElementById('next-fab');
    const prevFab = document.getElementById('prev-fab');
    const hint = document.getElementById('click-here-hint');
    
    // FAB Dalej: widoczny od ekranu 1 do przedostatniego (od 1 do 10)
    if (nextFab) {
        if (currentScreenIndex > 0 && currentScreenIndex < totalScreens - 1) {
            nextFab.classList.add('visible');
        } else {
            nextFab.classList.remove('visible');
        }
    }
    
    // FAB Wstecz: widoczny od ekranu 1 do samego końca (od 1 do 11)
    if (prevFab) {
        if (currentScreenIndex > 0) {
            prevFab.classList.add('visible');
        } else {
            prevFab.classList.remove('visible');
        }
    }

    // Wyświetlenie podpowiedzi "Kliknij tutaj!" na pierwszym ekranie daty, jeśli jeszcze nie kliknięto FAB
    if (hint) {
        if (currentScreenIndex === 1 && !hasClickedFAB) {
            hint.classList.add('visible');
        } else {
            hint.classList.remove('visible');
        }
    }
}

function hideHint() {
    const hint = document.getElementById('click-here-hint');
    if (hint) {
        hint.classList.remove('visible');
    }
}

// Inicjalizacja gestów scrollowania i swipowania
function initGestureListeners() {
    let touchStartY = 0;
    let touchStartX = 0;

    // Przeciąganie palcem (swipe) na telefonie
    window.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
        touchStartX = e.touches[0].clientX;
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
        if (isEnvelopeActive) return; // Blokada swipowania
        if (isTransitioning) return;

        const touchEndY = e.changedTouches[0].clientY;
        const touchEndX = e.changedTouches[0].clientX;

        const diffY = touchStartY - touchEndY;
        const diffX = touchStartX - touchEndX;

        // Reaguj tylko na gesty głównie pionowe i o długości przynajmniej 45px
        if (Math.abs(diffY) > 45 && Math.abs(diffY) > Math.abs(diffX)) {
            const currentScreen = screens[currentScreenIndex];
            
            // Sprawdzenie, czy użytkownik jest na samej górze/dole scrollowanego kontenera (dla długich opisów)
            const isAtBottom = currentScreen.scrollTop + currentScreen.clientHeight >= currentScreen.scrollHeight - 15;
            const isAtTop = currentScreen.scrollTop <= 15;

            if (diffY > 0) {
                // Swipe w górę (przewijanie w dół) -> przechodzimy do przodu
                if (isAtBottom) {
                    nextScreen();
                }
            } else {
                // Swipe w dół (przewijanie w górę) -> cofamy się
                if (isAtTop) {
                    prevScreen();
                }
            }
        }
    }, { passive: true });

    // Obsługa scrollowania myszką/trackpadem (wheel) na PC
    window.addEventListener('wheel', (e) => {
        if (isEnvelopeActive) return; // Blokada scrollowania
        if (isTransitioning) return;

        const currentScreen = screens[currentScreenIndex];
        const isAtBottom = currentScreen.scrollTop + currentScreen.clientHeight >= currentScreen.scrollHeight - 15;
        const isAtTop = currentScreen.scrollTop <= 15;

        if (Math.abs(e.deltaY) > 20) {
            if (e.deltaY > 0) {
                if (isAtBottom) {
                    nextScreen();
                }
            } else {
                if (isAtTop) {
                    prevScreen();
                }
            }
        }
    }, { passive: true });
}

// Funkcja aktualizująca liczniki w czasie rzeczywistym z uwzględnieniem miesięcy
function updateLiveCounters() {
    const targetDate = targetDates[currentScreenIndex];
    if (!targetDate) return;

    const now = Date.now();
    const diff = now - targetDate;

    if (diff < 0) return;

    // Kalkulacja miesięcy i pozostałych części czasu
    const startDate = new Date(targetDate);
    const endDate = new Date(now);

    let months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
    if (endDate.getDate() < startDate.getDate()) {
        months--;
    }

    const tempDate = new Date(startDate);
    tempDate.setMonth(tempDate.getMonth() + months);
    const diffMs = endDate.getTime() - tempDate.getTime();

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
    const seconds = Math.floor((diffMs / 1000) % 60);

    // Pobranie elementów DOM dla aktualnie wyświetlanego ekranu
    const monthsEl = document.getElementById(`months-${currentScreenIndex}`);
    const daysEl = document.getElementById(`days-${currentScreenIndex}`);
    const hoursEl = document.getElementById(`hours-${currentScreenIndex}`);
    const minsEl = document.getElementById(`mins-${currentScreenIndex}`);
    const secsEl = document.getElementById(`secs-${currentScreenIndex}`);

    if (monthsEl) monthsEl.textContent = months;
    if (daysEl) daysEl.textContent = days;
    if (hoursEl) hoursEl.textContent = hours;
    if (minsEl) minsEl.textContent = minutes;
    if (secsEl) secsEl.textContent = seconds;
}

// Pętla animacji liczników
function tick() {
    updateLiveCounters();
    requestAnimationFrame(tick);
}

// Funkcja tworząca pływające serduszka w tle
function initHearts() {
    const container = document.getElementById('hearts-container');
    const heartCount = 15;

    for (let i = 0; i < heartCount; i++) {
        createHeart(container);
    }
}

function createHeart(container) {
    const heart = document.createElement('div');
    heart.className = 'heart-particle';
    heart.innerText = '❤️';
    
    const size = Math.random() * 20 + 10;
    const left = Math.random() * 100;
    const duration = Math.random() * 10 + 15;
    const delay = Math.random() * 20;

    heart.style.fontSize = `${size}px`;
    heart.style.left = `${left}%`;
    heart.style.animationDuration = `${duration}s`;
    heart.style.animationDelay = `-${delay}s`;

    container.appendChild(heart);
}

// Rozpoczęcie działania liczników
tick();

// Funkcja otwierania koperty startowej
function openEnvelope() {
    if (!isEnvelopeActive) return;
    
    const overlay = document.getElementById('envelope-overlay');
    const envelope = overlay.querySelector('.envelope');
    const cursor = document.getElementById('envelope-cursor');
    
    // Ukrywamy kursor pomocniczy i wyłączamy jego lot
    if (cursor) {
        cursor.style.opacity = '0';
        setTimeout(() => {
            cursor.classList.remove('flying');
        }, 400);
    }
    
    // Dodajemy klasę, która uruchamia animację otwarcia klapy 3D i wysunięcia listu
    if (envelope) {
        envelope.classList.add('open');
    }
    
    // Wygaszamy cały overlay po wysunięciu listu
    setTimeout(() => {
        if (overlay) {
            overlay.classList.add('fade-out');
        }
        
        // Ukrywamy kontener całkowicie i odblokowujemy nawigację po zakończeniu transition
        setTimeout(() => {
            if (overlay) {
                overlay.style.display = 'none';
            }
            isEnvelopeActive = false;
        }, 800);
    }, 1400);
}

// Globale dla przycisków w HTML
window.nextScreen = nextScreen;
window.prevScreen = prevScreen;
window.restart = restart;
window.openEnvelope = openEnvelope;
