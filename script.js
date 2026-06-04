// ==========================================================
// 1. ĐIỀN THÔNG TIN KẾT NỐI DATABASE FIREBASE CỦA BẠN VÀO ĐÂY
// ==========================================================
const firebaseConfig = {
    // HÃY THAY THÔNG TIN CONFIG CỦA BẠN VÀO KHOẢNG DƯỚI NÀY:
  apiKey: "AIzaSyAXaqggnNMsPk6h0q5d_eYyrsFJq7-CQBQ",
  authDomain: "game-lat-bai.firebaseapp.com",
  projectId: "game-lat-bai",
  storageBucket: "game-lat-bai.firebasestorage.app",
  messagingSenderId: "378476148831",
  appId: "1:378476148831:web:070a9380199df047d5c3ea",
  measurementId: "G-FL7FEDQNE3"
};

// Khởi tạo Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();


// ==========================================================
// 2. KHAI BÁO BIẾN GIAO DIỆN
// ==========================================================
const cardWrapper = document.getElementById('cardWrapper');
const resetBtn = document.getElementById('resetBtn');
const popup = document.getElementById('popupOverlay');
const popupText = document.getElementById('popupText');
const popupTitle = document.getElementById('popupTitle');
const closeBtn = document.getElementById('closeBtn');
const inventoryList = document.getElementById('inventoryList');
const logoutBtn = document.getElementById('logoutBtn');
// Các nút bấm điều khiển form tài khoản
const authOverlay = document.getElementById('authOverlay');
const authUsernameInput = document.getElementById('authUsername');
const authPasswordInput = document.getElementById('authPassword');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const authError = document.getElementById('authError');

const poolItems = [
    { name: 'Vũ Khí Tối Thượng', tier: 'ssr', icon: 'https://cdn-icons-png.flaticon.com/512/11105/11105151.png' },
    { name: 'Phượng Hoàng Lửa', tier: 'ssr', icon: 'https://cdn-icons-png.flaticon.com/512/1814/1814674.png' },
    { name: 'Giáp Hoàng Kim', tier: 'sr', icon: 'https://cdn-icons-png.flaticon.com/512/8112/8112461.png' },
    { name: 'Nhẫn Ma Thuật', tier: 'sr', icon: 'https://cdn-icons-png.flaticon.com/512/3012/3012431.png' },
    { name: 'Bình Máu Siêu Cấp', tier: 'r', icon: 'https://cdn-icons-png.flaticon.com/512/867/867926.png' },
    { name: 'Đá Cường Hóa', tier: 'r', icon: 'https://cdn-icons-png.flaticon.com/512/2620/2620857.png' },
    { name: 'Túi Vàng Nhỏ', tier: 'r', icon: 'https://cdn-icons-png.flaticon.com/512/9028/9028043.png' }
];

let flippedCount = 0;
let inventoryData = {};
let currentPlayer = "";

// ==========================================================
// 3. LOGIC HỆ THỐNG TÀI KHOẢN VÀ MẬT KHẨU (AUTH)
// ==========================================================

// Hàm chuyển đổi Tên tài khoản thường thành đuôi Email hợp lệ cho Firebase
function getFakeEmail(username) {
    const cleanName = username.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_");
    return `${cleanName.toLowerCase()}@game.com`;
}

// Xử lý sự kiện bấm nút ĐĂNG KÝ
registerBtn.addEventListener('click', () => {
    const username = authUsernameInput.value.trim();
    const password = authPasswordInput.value;
    authError.textContent = "";

    if (!username || !password) {
        authError.textContent = "Vui lòng nhập đầy đủ tên và mật khẩu!";
        return;
    }
    if (password.length < 6) {
        authError.textContent = "Mật khẩu phải từ 6 ký tự trở lên!";
        return;
    }

    const email = getFakeEmail(username);

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            alert("Đăng ký tài khoản thành công! Bạn có thể đăng nhập ngay.");
        })
        .catch((error) => {
            if (error.code === "auth/email-already-in-use") {
                authError.textContent = "Tên tài khoản này đã có người đăng ký!";
            } else {
                authError.textContent = error.message;
            }
        });
});

// Xử lý sự kiện bấm nút ĐĂNG NHẬP
loginBtn.addEventListener('click', () => {
    const username = authUsernameInput.value.trim();
    const password = authPasswordInput.value;
    authError.textContent = "";

    if (!username || !password) {
        authError.textContent = "Vui lòng nhập tên và mật khẩu!";
        return;
    }

    const email = getFakeEmail(username);

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Đăng nhập đúng thông tin -> Lấy tên làm ID dữ liệu
            currentPlayer = username.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_");
            document.querySelector('h1').textContent = `Thẻ Bài May Mắn - [ ${username} ]`;
            
            // Ẩn bảng đăng nhập để vào chơi game
            authOverlay.classList.add('hidden');

            // Tải dữ liệu kho đồ từ Realtime Database về máy
            loadUserData();
        })
        .catch((error) => {
            authError.textContent = "Sai tên tài khoản hoặc mật khẩu!";
            console.error(error);
        });
});

// Xử lý sự kiện bấm nút ĐĂNG XUẤT
logoutBtn.addEventListener('click', () => {
    if (confirm("Bạn có chắc chắn muốn đăng xuất tài khoản không?")) {
        auth.signOut()
            .then(() => {
                // Xóa sạch dữ liệu tạm thời trên máy người chơi
                currentPlayer = "";
                inventoryData = {};
                
                // Xóa sạch các thẻ bài đang hiển thị trên màn hình
                cardWrapper.innerHTML = '';
                resetBtn.disabled = true;
                
                // Reset lại tiêu đề game
                document.querySelector('h1').textContent = `Vòng Quay Thẻ Bài May Mắn`;
                
                // Làm trống danh sách kho đồ hiển thị
                renderInventory();
                
                // Xóa dữ liệu trong các ô nhập liệu cũ của form
                authUsernameInput.value = "";
                authPasswordInput.value = "";
                authError.textContent = "";

                // Hiện lại bảng đăng nhập ban đầu
                authOverlay.classList.remove('hidden');
                
                alert("Đã đăng xuất thành công!");
            })
            .catch((error) => {
                console.error("Lỗi đăng xuất:", error);
                alert("Không thể đăng xuất, vui lòng thử lại!");
            });
    }
});
// Hàm lấy kho đồ sau khi đăng nhập thành công
function loadUserData() {
    database.ref('users/' + currentPlayer).once('value').then((snapshot) => {
        const data = snapshot.val();
        if (data && data.inventory) {
            inventoryData = data.inventory;
        } else {
            inventoryData = {};
        }
        renderInventory();
        initCards();
    }).catch(error => {
        console.error("Lỗi đồng bộ kho đồ:", error);
        initCards();
    });
}

function saveToFirebase() {
    if (currentPlayer === "") return;
    database.ref('users/' + currentPlayer).set({
        username: currentPlayer,
        inventory: inventoryData
    });
}

// ==========================================================
// 4. LOGIC QUAY GACHA VÀ LẬT MỞ THỎA THÍCH (Giữ nguyên)
// ==========================================================
function initCards() {
    cardWrapper.innerHTML = '';
    flippedCount = 0;
    resetBtn.disabled = true;

    const currentRoundItems = [];
    const ssrItems = poolItems.filter(i => i.tier === 'ssr');
    const srItems = poolItems.filter(i => i.tier === 'sr');
    const rItems = poolItems.filter(i => i.tier === 'r');

    for(let i = 0; i < 5; i++) {
        const rate = Math.floor(Math.random() * 100) + 1;
        let selectedItem;
        if (rate <= 3) { selectedItem = ssrItems[Math.floor(Math.random() * ssrItems.length)]; } 
        else if (rate <= 25) { selectedItem = srItems[Math.floor(Math.random() * srItems.length)]; } 
        else { selectedItem = rItems[Math.floor(Math.random() * rItems.length)]; }
        currentRoundItems.push(selectedItem);
    }

    currentRoundItems.forEach(item => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.innerHTML = `
            <div class="card-face card-back"></div>
            <div class="card-face card-front glow-${item.tier}">
                <span class="item-tier tier-${item.tier}">${item.tier}</span>
                <img src="${item.icon}" alt="${item.name}">
                <div class="item-name">${item.name}</div>
            </div>
        `;

        card.addEventListener('click', function() {
            if (this.classList.contains('flipped') || currentPlayer === "") return;
            this.classList.add('flipped');
            flippedCount++;
            addToInventory(item);

            if (item.tier === 'ssr') {
                setTimeout(() => {
                    popupTitle.textContent = "SIÊU CẤP QUÝ HIẾM! 🌟";
                    popupText.textContent = `Bạn đã mở ra siêu phẩm tối thượng: ${item.name}!`;
                    popup.classList.add('active');
                }, 500);
            }
            if (flippedCount >= 1) { resetBtn.disabled = false; }
        });
        cardWrapper.appendChild(card);
    });
}

function addToInventory(item) {
    if (inventoryData[item.name]) { inventoryData[item.name].count += 1; } 
    else { inventoryData[item.name] = { count: 1, tier: item.tier, icon: item.icon }; }
    renderInventory();
    saveToFirebase();
}

function renderInventory() {
    inventoryList.innerHTML = '';
    const keys = Object.keys(inventoryData);
    if (keys.length === 0) {
        inventoryList.innerHTML = '<div class="empty-inventory">Chưa mở được thẻ bài nào</div>';
        return;
    }
    keys.forEach(name => {
        const item = inventoryData[name];
        const div = document.createElement('div');
        div.className = `inventory-item tier-${item.tier}`;
        div.innerHTML = `
            <img src="${item.icon}" alt="${name}">
            <div class="inventory-info">
                <div class="inventory-name">${name}</div>
                <div class="inventory-badge" style="color: ${item.tier === 'ssr' ? '#ff4757' : item.tier === 'sr' ? '#ffa502' : '#1e90ff'}">${item.tier}</div>
            </div>
            <div class="inventory-count">x${item.count}</div>
        `;
        inventoryList.appendChild(div);
    });
}

closeBtn.addEventListener('click', () => { popup.classList.remove('active'); });
resetBtn.addEventListener('click', initCards);

// ==========================================================
// 5. HIỆU ỨNG HẠT BỤI TINH TÚ DI CHUYỂN PHÍA NỀN CANVAS (Giữ nguyên)
// ==========================================================
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');
let particlesArray = [];

function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = Math.random() * 0.4 - 0.2;
        this.speedY = Math.random() * -0.4 - 0.1;
        this.alpha = Math.random() * 0.5 + 0.2;
        this.glowSpeed = Math.random() * 0.01 + 0.005;
    }
    update() {
        this.x += this.speedX; this.y += this.speedY; this.alpha += this.glowSpeed;
        if (this.alpha > 0.8 || this.alpha < 0.2) this.glowSpeed = -this.glowSpeed;
        if (this.y < 0) { this.y = canvas.height; this.x = Math.random() * canvas.width; }
    }
    draw() {
        ctx.save(); ctx.globalAlpha = this.alpha; ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fillStyle = '#f1c40f'; ctx.fill(); ctx.restore();
    }
}
function initParticles() {
    particlesArray = [];
    for (let i = 0; i < 60; i++) { particlesArray.push(new Particle()); }
}
function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particlesArray.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animateParticles);
}

initParticles();
animateParticles();