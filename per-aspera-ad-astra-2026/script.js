const PHOTO_JSON = "../valentine/assets/photos/photos.json";
const PHOTO_BASE = "../valentine/assets/photos/";
const START_DATE = new Date("2023-10-17T00:00:00+08:00");
const FEATURED_PHOTOS = [
    { src: "assets/featured/ring.jpg", date: "戒指里的星光", alt: "戒指特写" },
    { src: "assets/featured/fireworks.jpg", date: "海边的烟花", alt: "海边烟花" },
    { src: "assets/featured/graduation.jpg", date: "毕业快乐", alt: "毕业照片" },
    { src: "assets/featured/seaside.jpg", date: "一起去看海", alt: "海边合照" },
    { src: "assets/featured/sunrise.jpg", date: "一起记录日出", alt: "日出照片" },
    { src: "assets/featured/ad-astra-card.jpg", date: "PER ASPERA", alt: "星光卡片" },
    { src: "assets/featured/ad-astra-dream.jpg", date: "AD ASTRA", alt: "星光画面" }
];

const railPositions = [
    ["2%", "6%", "-10deg"],
    ["38%", "0%", "8deg"],
    ["68%", "8%", "-5deg"],
    ["10%", "42%", "7deg"],
    ["54%", "44%", "-12deg"],
    ["78%", "48%", "10deg"],
    ["28%", "70%", "-4deg"]
];

const featuredPositions = [
    ["left", "8%", "-14deg"],
    ["right", "17%", "11deg"],
    ["left", "31%", "8deg"],
    ["right", "43%", "-10deg"],
    ["left", "57%", "-7deg"],
    ["right", "68%", "13deg"],
    ["left", "80%", "6deg"]
];

const canvas = document.getElementById("sky");
const ctx = canvas.getContext("2d");
let stars = [];
let pointer = { x: 0.5, y: 0.5 };

function resizeSky() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * ratio);
    canvas.height = Math.floor(window.innerHeight * ratio);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    const count = Math.max(80, Math.floor(window.innerWidth * window.innerHeight / 9000));
    stars = Array.from({ length: count }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 1.7 + 0.3,
        speed: Math.random() * 0.18 + 0.04,
        alpha: Math.random() * 0.65 + 0.2
    }));
}

function drawSky() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    stars.forEach((star) => {
        star.y += star.speed;
        if (star.y > window.innerHeight + 8) {
            star.y = -8;
            star.x = Math.random() * window.innerWidth;
        }

        const dx = (pointer.x - 0.5) * star.size * 9;
        const dy = (pointer.y - 0.5) * star.size * 9;
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 248, 236, ${star.alpha})`;
        ctx.arc(star.x + dx, star.y + dy, star.size, 0, Math.PI * 2);
        ctx.fill();
    });

    requestAnimationFrame(drawSky);
}

function updateCounter() {
    const target = document.getElementById("daysTogether");
    const today = new Date();
    const days = Math.max(1, Math.floor((today - START_DATE) / 86400000) + 1);
    target.textContent = `我们一起走过的第 ${days} 天`;
}

function normalizePhotos(raw) {
    return Object.values(raw)
        .filter((item) => item && item.filename)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        .map((item) => ({
            src: `${PHOTO_BASE}${item.filename}`,
            date: item.displayDate || "",
            alt: item.displayDate ? `记忆照片，${item.displayDate}` : "记忆照片"
        }));
}

function makePhotoButton(photo) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.date = photo.date;

    const img = document.createElement("img");
    img.src = photo.src;
    img.alt = photo.alt;
    img.loading = "lazy";
    button.appendChild(img);
    button.addEventListener("click", () => openLightbox(photo));

    return button;
}

function makeFeaturedPhoto(photo, index) {
    const button = document.createElement("button");
    const [side, top, rotation] = featuredPositions[index % featuredPositions.length];
    button.type = "button";
    button.className = `featured-photo ${side}`;
    button.style.setProperty("--top", top);
    button.style.setProperty("--r", rotation);
    button.dataset.date = photo.date;

    const img = document.createElement("img");
    img.src = photo.src;
    img.alt = photo.alt;
    img.loading = "lazy";
    button.appendChild(img);
    button.addEventListener("click", () => openLightbox(photo));

    return button;
}

function renderRail(photos) {
    const rail = document.getElementById("photoRail");
    const selected = photos.slice(-7);
    rail.replaceChildren();

    selected.forEach((photo, index) => {
        const item = document.createElement("button");
        const [x, y, rotation] = railPositions[index % railPositions.length];
        item.type = "button";
        item.className = "memory-photo";
        item.style.setProperty("--x", x);
        item.style.setProperty("--y", y);
        item.style.setProperty("--r", rotation);
        item.dataset.date = photo.date;

        const img = document.createElement("img");
        img.src = photo.src;
        img.alt = photo.alt;
        img.loading = index < 3 ? "eager" : "lazy";
        item.appendChild(img);
        item.addEventListener("click", () => openLightbox(photo));
        rail.appendChild(item);
    });
}

function renderConstellation(photos) {
    const target = document.getElementById("constellation");
    const selected = photos.slice(-20).reverse();
    target.replaceChildren(...selected.map(makePhotoButton));
}

function renderFeaturedPhotos() {
    const target = document.getElementById("featuredPhotoField");
    target.replaceChildren(...FEATURED_PHOTOS.map(makeFeaturedPhoto));
}

async function loadPhotos() {
    try {
        const response = await fetch(PHOTO_JSON, { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const photos = normalizePhotos(await response.json());
        renderRail(photos);
        renderConstellation(photos);
    } catch (error) {
        console.warn("Unable to load memory photos:", error);
        document.getElementById("photoRail").hidden = true;
        document.getElementById("constellation").textContent = "记忆相册暂时没有加载出来，但这封信仍然在。";
    }
}

function openLightbox(photo) {
    const box = document.getElementById("lightbox");
    const card = box.querySelector(".lightbox-card");
    const img = box.querySelector("img");
    const caption = box.querySelector("p");

    img.src = photo.src;
    img.alt = photo.alt;
    caption.textContent = photo.date;
    card.style.transform = "";
    box.classList.add("is-open");
    box.setAttribute("aria-hidden", "false");
}

function closeLightbox() {
    const box = document.getElementById("lightbox");
    box.querySelector(".lightbox-card").style.transform = "";
    box.classList.remove("is-open");
    box.setAttribute("aria-hidden", "true");
}

function revealPanels() {
    const panels = document.querySelectorAll(".letter-panel");
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
            }
        });
    }, { threshold: 0.22 });

    panels.forEach((panel) => observer.observe(panel));
}

function updateScrollLine() {
    const fill = document.getElementById("scrollFill");
    const section = document.getElementById("letter");
    const rect = section.getBoundingClientRect();
    const travel = rect.height - window.innerHeight * 0.52;
    const progress = Math.min(1, Math.max(0, (window.innerHeight * 0.34 - rect.top) / travel));
    fill.style.height = `${progress * 100}%`;
}

function initInteractions() {
    document.addEventListener("pointermove", (event) => {
        pointer = {
            x: event.clientX / Math.max(window.innerWidth, 1),
            y: event.clientY / Math.max(window.innerHeight, 1)
        };
    }, { passive: true });

    document.getElementById("lightbox").addEventListener("click", (event) => {
        if (event.target.id === "lightbox") {
            closeLightbox();
        }
    });
    document.getElementById("lightbox").addEventListener("pointermove", (event) => {
        const card = event.currentTarget.querySelector(".lightbox-card");
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / Math.max(rect.width, 1) - 0.5;
        const y = (event.clientY - rect.top) / Math.max(rect.height, 1) - 0.5;
        card.style.transform = `rotateX(${-y * 8}deg) rotateY(${x * 10}deg)`;
    }, { passive: true });
    document.getElementById("lightbox").addEventListener("pointerleave", (event) => {
        event.currentTarget.querySelector(".lightbox-card").style.transform = "";
    });
    document.querySelector(".lightbox-close").addEventListener("click", closeLightbox);
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeLightbox();
        }
    });
    document.addEventListener("scroll", updateScrollLine, { passive: true });
}

window.addEventListener("resize", () => {
    resizeSky();
    updateScrollLine();
});

resizeSky();
drawSky();
updateCounter();
revealPanels();
initInteractions();
renderFeaturedPhotos();
loadPhotos();
updateScrollLine();
