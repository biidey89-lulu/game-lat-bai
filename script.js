// ==========================================================
// 1. CẤU HÌNH & KHỞI TẠO
// ==========================================================
const firebaseConfig = {
    apiKey: "AIzaSyAXaqggnNMsPk6h0q5d_eYyrsFJq7-CQBQ",
    authDomain: "game-lat-bai.firebaseapp.com",
    projectId: "game-lat-bai",
    storageBucket: "game-lat-bai.firebasestorage.app",
    messagingSenderId: "378476148831",
    appId: "1:378476148831:web:070a9380199df047d5c3ea",
    measurementId: "G-FL7FEDQNE3"
};
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();

const cardWrapper = document.getElementById('cardWrapper');
const resetBtn = document.getElementById('resetBtn');
const popup = document.getElementById('popupOverlay');
const ssrPopup = document.getElementById('ssrPopup'); // Đảm bảo ID trong HTML là 'ssrPopup'
const popupTitle = document.getElementById('popupTitle');
const popupText = document.getElementById('popupText');
const closeSSRBtn = document.getElementById('closeSSRBtn'); // Nút X
const closeBtn = document.getElementById('closeBtn');
const inventoryList = document.getElementById('inventoryList');
const logoutBtn = document.getElementById('logoutBtn');
const authOverlay = document.getElementById('authOverlay');
const menuOverlay = document.getElementById('menuOverlay');
const cardGame = document.getElementById('cardGame');
const authUsernameInput = document.getElementById('authUsername');
const authPasswordInput = document.getElementById('authPassword');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const authError = document.getElementById('authError');
const openPackBtn = document.getElementById('openPackBtn');
const backBtn = document.getElementById('backBtn');
const resultLog = document.getElementById('resultLog');
const resultList = document.getElementById('resultList');
const openPack10Btn = document.getElementById('openPack10Btn');

let inventoryData = {}, currentPlayer = "", originalUsername = "", flippedCount = 0;
let isX10 = false; // Biến đánh dấu chế độ X10
let currentBatch = 0; // Đếm số lượt lật (cho chế độ X10)
let currentLog = {};
let isProcessing = false; // Biến khóa toàn cục
let resetTimer = null; // Khai báo biến timer

console.log("Logout Button:", logoutBtn);

const poolItems = [
    { name: 'Vũ Khí Tối Thượng', tier: 'ssr', icon: 'https://cdn-icons-png.flaticon.com/512/11105/11105151.png' },
    { name: 'Phượng Hoàng Lửa', tier: 'ssr', icon: 'https://cdn-icons-png.flaticon.com/512/1814/1814674.png' },
    { name: 'Giáp Hoàng Kim', tier: 'sr', icon: 'https://cdn-icons-png.flaticon.com/512/8112/8112461.png' },
    { name: 'Nhẫn Ma Thuật', tier: 'sr', icon: 'https://cdn-icons-png.flaticon.com/512/3012/3012431.png' },
    { name: 'Bình Máu Siêu Cấp', tier: 'r', icon: 'https://cdn-icons-png.flaticon.com/512/867/867926.png' },
    { name: 'Đá Cường Hóa', tier: 'r', icon: 'https://cdn-icons-png.flaticon.com/512/2620/2620857.png' },
    { name: 'Túi Vàng Nhỏ', tier: 'r', icon: 'https://cdn-icons-png.flaticon.com/512/9028/9028043.png' }
];

// ==========================================================
// Đảm bảo nút quay lại ẩn ngay khi trang web vừa tải xong
document.addEventListener('DOMContentLoaded', () => {
    const backBtn = document.getElementById('backBtn');
    if (backBtn) backBtn.style.display = 'none';
});
// 2. CÁC HÀM AUTH & UI CƠ BẢN
// ==========================================================
function getFakeEmail(u) { return `${u.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_").toLowerCase()}@game.com`; }
function loginSuccess() { authOverlay.style.display = 'none'; menuOverlay.style.display = 'flex'; cardGame.style.display = 'none'; }
function showAuthMessage(msg, isSuccess = false) { 
    authError.textContent = msg; 
    authError.style.color = isSuccess ? "#2ecc71" : "#ff4757"; 
    setTimeout(() => authError.textContent = "", 5000); 
}
function updatePlayerUI() { if(document.getElementById('playerNameDisplay')) document.getElementById('playerNameDisplay').textContent = originalUsername; }
function renderWalletUI(wallet) {
    const coinEl = document.getElementById('coinCount');
    const diamondEl = document.getElementById('diamondCount');
    if (coinEl) coinEl.textContent = wallet.coins || 0;
    if (diamondEl) diamondEl.textContent = wallet.diamonds || 0;
}

// ==========================================================

// Hàm quay lại menu chính (đảm bảo nút luôn hiển thị khi ở menu game)
function openGame(id) { 
    menuOverlay.style.display = 'none'; 
    const gameElement = document.getElementById(id);
    if (gameElement) {
        gameElement.style.display = 'block';
        
        // HIỆN nút quay lại ngay khi vừa vào màn hình game
        const backBtn = document.getElementById('backBtn');
        if (backBtn) backBtn.style.display = 'block'; 
    }
}
// 3. FIREBASE & INVENTORY
// ==========================================================
function loadUserData() {
    if (!currentPlayer) return;
    database.ref('users/' + currentPlayer).once('value').then((snapshot) => {
        const data = snapshot.val();
        if (!data) return;
        if (data.profile?.avatar) document.getElementById('currentAvatar').src = data.profile.avatar;
        if (data.wallet) renderWalletUI(data.wallet);
        inventoryData = data.inventory || {};
        initCards();
    });
}

function saveToFirebase() {
    if (!currentPlayer) return;
    database.ref('users/' + currentPlayer).update({ inventory: inventoryData });
}

function renderInventory() {
    inventoryList.innerHTML = '';
    const keys = Object.keys(inventoryData);
    if (keys.length === 0) {
        inventoryList.innerHTML = '<p style="color:white; text-align:center;">Chưa có thẻ</p>';
        return;
    }
    keys.forEach(name => {
        const item = inventoryData[name];
        const div = document.createElement('div');
        // Thêm class tier để CSS tô màu viền nếu bạn đã có sẵn class tier-ssr, tier-sr...
        div.className = `inventory-item tier-${item.tier}`;
        div.innerHTML = `
            <img src="${item.icon}">
            <div class="inventory-info">${name}</div>
            <div class="inventory-count">x${item.count}</div>
        `;
        inventoryList.appendChild(div);
    });
}

function toggleInventory() {
    const p = document.getElementById('inventoryPopup');
    if (p.style.display === 'flex') {
        p.style.display = 'none';
    } else {
        p.style.display = 'flex';
        renderInventory();
    }
}
function openPack() {
    if (isProcessing) return; // Nếu đang xử lý thì chặn click
    
    isProcessing = true; // Khóa lại
    // ... code mở bài của bạn ...
    
    // Khi kết thúc lượt mở (ví dụ trong hàm resetGameToStart)
    // thì đặt lại isProcessing = false;
}
// ... (các hàm UI phía trên)

function openPackAction(isTen) {
    // 1. CHẶN NẾU ĐANG TRONG QUÁ TRÌNH RESET
    if (isProcessing) return; 
    
    // 2. KHÓA NGAY LẬP TỨC để tránh click đúp vào nút Mở Gói
    isProcessing = true; 
    
    isX10 = isTen;
    currentBatch = 0;
    
    // 3. UI
    openPackBtn.style.display = 'none';
    const openPack10Btn = document.getElementById('openPack10Btn');
    if (openPack10Btn) openPack10Btn.style.display = 'none';
    const backBtn = document.getElementById('backBtn');
    if (backBtn) backBtn.style.display = 'none';
    
    cardWrapper.style.display = 'flex';
    setTimeout(() => cardWrapper.classList.add('show'), 10);
    
    // 4. KHỞI TẠO BÀI
    initCards();
    
    // 5. MỞ KHÓA sau khi đã khởi tạo xong để người chơi có thể click lật bài
    // Dùng setTimeout nhỏ để đảm bảo UI kịp render xong trước khi cho phép click
    setTimeout(() => {
        isProcessing = false;
    }, 200); 
}

// ==========================================================
// 4. LOGIC GAME
// ==========================================================
function getRandomItem() {
    const rand = Math.random() * 100;
    let tier = 'r';
    if (rand < 5) tier = 'ssr';
    else if (rand < 30) tier = 'sr';

    const itemsInTier = poolItems.filter(i => i.tier === tier);
    // Chọn ngẫu nhiên 1 trong số các item thuộc tier đó
    return itemsInTier[Math.floor(Math.random() * itemsInTier.length)];
}
function addToInventory(item) {
    inventoryData[item.name] = inventoryData[item.name] 
        ? { ...inventoryData[item.name], count: inventoryData[item.name].count + 1 } 
        : { count: 1, tier: item.tier, icon: item.icon };
    saveToFirebase();
}

function addResultToLog(item) {
    // 1. Cập nhật dữ liệu logic
    if (flippedCount > 5) return;
    if (currentLog[item.name]) {
        currentLog[item.name].count += 1;
    } else {
        currentLog[item.name] = { count: 1, tier: item.tier };
    }

    // 2. Vẽ lại danh sách
    resultList.innerHTML = '';
    for (const [name, data] of Object.entries(currentLog)) {
        const li = document.createElement('li');
        const countDisplay = data.count > 1 ? ` (x${data.count})` : '';
        li.innerHTML = `<span style="color: ${data.tier === 'ssr' ? '#f1c40f' : 'white'}">${name}${countDisplay}</span>`;
        resultList.appendChild(li);
    }
    
    resultLog.style.display = 'block';
}
function checkGameState() {
    // Chỉ reset nếu chưa có timer đang chạy (tránh reset chồng chéo)
    if (resetTimer) clearTimeout(resetTimer); 
    
    resetTimer = setTimeout(() => {
        // Chỉ reset khi popup đã tắt
        const ssrPopup = document.getElementById('ssrPopup');
        if (!ssrPopup || !ssrPopup.classList.contains('active')) {
            resetGameToStart();
            isProcessing = false; // Mở khóa cho lượt sau
        } else {
            // Nếu popup vẫn mở, đợi thêm 1 giây nữa rồi kiểm tra lại
            checkGameState(); 
        }
    }, 4000); // Đã tăng lên 4 giây
}
function initCards() {
    cardWrapper.innerHTML = ''; 
    flippedCount = 0; 
    
    for(let i = 0; i < 5; i++) {
        const item = getRandomItem();
        const card = document.createElement('div');
        card.classList.add('card');
        
        card.innerHTML = `<div class="card-face card-back"></div>`;
        const front = document.createElement('div');
        front.className = `card-face card-front tier-${item.tier}`;
        front.innerHTML = `
            <span class="item-tier tier-${item.tier}">${item.tier}</span>
            <img src="${item.icon}">
            <div class="item-name">${item.name}</div>
        `;
        card.appendChild(front);
        
        const autoFlipTimeout = setTimeout(() => {
            if (!card.classList.contains('flipped')) card.click();
        }, 5000); 

card.addEventListener('click', function() {
    // 1. NGĂN CHẶN CLICK TRÙNG LẶP
    if (this.classList.contains('flipped') || isProcessing) return; 

    clearTimeout(autoFlipTimeout);
    this.classList.add('flipped');
    
    // 2. CHỈ THÊM VÀO KHO ĐỒ KHI LẬT
    addToInventory(item);
    addResultToLog(item); 
    
    // 3. Xử lý logic SSR
    if (item.tier === 'ssr') { 
        const title = document.querySelector('#popupTitle');
        const text = document.querySelector('#popupText');
        if (title) title.textContent = "Chúc Mừng";
        if (text) text.textContent = `Bạn đã nhận được: ${item.name}!`; 
        const ssrPopup = document.getElementById('ssrPopup');
        if (ssrPopup) ssrPopup.classList.add('active');
    }
    
    flippedCount++; 

    // 4. KIỂM TRA ĐIỀU KIỆN KẾT THÚC LƯỢT
    if (flippedCount === 5) {
        // Đánh dấu đang xử lý để chặn mọi click khác
        isProcessing = true; 
        
        if (isX10 && currentBatch === 0) {
            currentBatch = 1;
            setTimeout(() => {
                isProcessing = false; // Mở lại cho batch 2
                initCards(); 
            }, 1000); 
        } else {
            // Dùng hàm checkGameState để xử lý reset
            checkGameState();
        }
    }
});
        cardWrapper.appendChild(card);
    }
}

function resetGameToStart() {
    const cardWrapper = document.getElementById('cardWrapper');
    const openPackBtn = document.getElementById('openPackBtn');
    const openPack10Btn = document.getElementById('openPack10Btn'); // Lấy sẵn ID
    const backBtn = document.getElementById('backBtn');
    const ssrPopup = document.getElementById('ssrPopup');

    currentLog = {}; // Xóa sạch dữ liệu lượt cũ
    resultLog.style.display = 'none';
    resultList.innerHTML = '';

    // 1. Đóng popup nếu nó đang mở
    if (ssrPopup) ssrPopup.classList.remove('active');

    // 2. Reset trạng thái
    isX10 = false;
    currentBatch = 0;
    flippedCount = 0; 
    cardWrapper.classList.remove('show');
    
    // 3. Xử lý hiển thị các nút và dọn thẻ
    setTimeout(() => {
        cardWrapper.style.display = 'none';
        cardWrapper.innerHTML = ''; 
        
        // Hiện lại các nút điều hướng
        if (openPackBtn) openPackBtn.style.display = 'block';
        if (openPack10Btn) openPack10Btn.style.display = 'block';
        if (backBtn) backBtn.style.display = 'block';
        
        console.log("Reset hoàn tất.");
        isProcessing = false; // MỞ KHÓA Ở ĐÂY để lượt sau có thể bấm tiếp
    }, 500);
}
function backToMenu() {
    // Ẩn giao diện game
    cardGame.style.display = 'none';
    
    // Hiện lại menu chính
    menuOverlay.style.display = 'flex';
    
    // Reset các trạng thái game để lần sau vào lại không bị lỗi
    cardWrapper.style.display = 'none';
    cardWrapper.innerHTML = '';

    openPackBtn.style.display = 'block';
    resetBtn.style.display = 'none';
    
    // Đóng popup nếu đang mở
    const ssrPopup = document.getElementById('ssrPopup');
    if (ssrPopup) ssrPopup.classList.remove('active');

    resultLog.style.display = 'none';
    resultList.innerHTML = '';

    console.log("Đã quay về menu chính!");
    
}
// ==========================================================
// ==========================================================
// 5. SỰ KIỆN NÚT BẤM
// ==========================================================

// 5. SỰ KIỆN NÚT BẤM (ĐÃ TỐI ƯU)
// ==========================================================

// Sự kiện cho nút Mở Gói (Thường & X10)
openPackBtn.addEventListener('click', () => openPackAction(false));
openPack10Btn.addEventListener('click', () => openPackAction(true));

// Sự kiện Đăng ký
registerBtn.addEventListener('click', () => {
    const u = authUsernameInput.value.trim();
    const p = authPasswordInput.value;
    if (!u || !p) return showAuthMessage("Nhập đủ thông tin!");
    
    const cleanU = u.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_");
    auth.createUserWithEmailAndPassword(getFakeEmail(u), p).then(() => {
        database.ref('users/' + cleanU).set({ 
            profile: { avatar: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" }, 
            wallet: { coins: 100, diamonds: 0 }, 
            inventory: {} 
        });
        showAuthMessage("Đăng ký thành công!", true);
    }).catch(e => showAuthMessage(e.message));
});

// Sự kiện Đăng nhập
loginBtn.addEventListener('click', () => {
    const u = authUsernameInput.value.trim();
    const p = authPasswordInput.value;
    if (!u || !p) return showAuthMessage("Nhập đủ thông tin!");
    
    auth.signInWithEmailAndPassword(getFakeEmail(u), p).then(() => {
        originalUsername = u;
        currentPlayer = u.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_");
        updatePlayerUI();
        loginSuccess();
        loadUserData();
    }).catch(() => showAuthMessage("Sai tài khoản hoặc mật khẩu!"));
});

// Sự kiện Đăng xuất (Đảm bảo chỉ có 1 khối này)
if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if(confirm("Bạn có chắc chắn muốn đăng xuất?")) {
            auth.signOut().then(() => {
                window.location.reload(); 
            }).catch((error) => {
                console.error("Lỗi đăng xuất: ", error);
                alert("Có lỗi xảy ra khi đăng xuất.");
            });
        }
    });
}

// Gom các sự kiện Popup vào một khối DOMContentLoaded duy nhất
document.addEventListener('DOMContentLoaded', () => {
    // Popup SSR
    const closeSSRBtn = document.getElementById('closeSSRBtn');
    if (closeSSRBtn) {
        closeSSRBtn.addEventListener('click', () => {
            ssrPopup.classList.remove('active');
            // Kiểm tra nếu đã lật đủ 5 lá mà popup chặn reset, đóng popup sẽ thực hiện reset
            if (flippedCount >= 5) resetGameToStart();
        });
    }

    // Popup thông báo chung
    if (closeBtn) {
        closeBtn.addEventListener('click', () => popup.classList.remove('active'));
    }
});