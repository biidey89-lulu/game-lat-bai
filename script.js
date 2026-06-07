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
const topBar = document.getElementById('topBar');
const bottomNav = document.getElementById('bottomNav');

let inventoryData = {}, currentPlayer = "", originalUsername = "", flippedCount = 0;
let isX10 = false; // Biến đánh dấu chế độ X10
let currentBatch = 0; // Đếm số lượt lật (cho chế độ X10)
let currentLog = {};
let isProcessing = false; // Biến khóa toàn cục
let resetTimer = null; // Khai báo biến timer
let itemToDelete = null;


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
function loginSuccess() { 
    authOverlay.style.display = 'none'; 
    menuOverlay.style.display = 'flex'; 
    cardGame.style.display = 'none'; 
    topBar.style.display = 'flex';
    bottomNav.style.display = 'flex';
}

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
function showGameUI() {
    // Hiện thanh công cụ
    document.getElementById('topBar').style.display = 'flex';
    document.getElementById('bottomNav').style.display = 'flex';
    
    // Ẩn màn hình đăng nhập
    document.getElementById('authOverlay').style.display = 'none';
    
    document.getElementById('gameBoxScreen').style.display = 'none';
    // Hiện menu chính
    document.getElementById('menuOverlay').style.display = 'block';
}
// Hàm quay lại menu chính (đảm bảo nút luôn hiển thị khi ở menu game)
function openGame(id) { 
    console.log("Đang mở game:", id);
    
    // 1. Ẩn tất cả màn hình có class 'screen'
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById('menuOverlay').style.display = 'none';
    document.getElementById('gameBoxScreen').style.display = 'none';

    // 2. Tìm và hiện màn hình game đích
    const gameElement = document.getElementById(id);
    if (gameElement) {
        gameElement.style.display = 'block'; // Hiện game
        
        // Hiện nút Back
        const backBtn = document.getElementById('backBtn');
        if (backBtn) backBtn.style.display = 'block';
        
        console.log("Đã mở thành công:", id);
    } else {
        console.error("Không tìm thấy màn hình game có ID:", id);
    }
}

function logout() {
    // Ẩn thanh công cụ
    document.getElementById('topBar').style.display = 'none';
    document.getElementById('bottomNav').style.display = 'none';
    
    // Hiện lại màn hình đăng nhập
    document.getElementById('authOverlay').style.display = 'block';
    document.getElementById('menuOverlay').style.display = 'none';
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
        
        // Gán dữ liệu vào biến toàn cục
        inventoryData = data.inventory || {};
        
        // ĐẢM BẢO CHỈ RENDER SAU KHI DỮ LIỆU ĐÃ TẢI XONG
        renderInventory(); 
    });
}

function saveToFirebase() {
    if (!currentPlayer) return;
    database.ref('users/' + currentPlayer).update({ inventory: inventoryData });
}

// --- SỬA LẠI HÀM RENDER ĐỂ ĐẢM BẢO CLASS CHÍNH XÁC ---
function renderInventory() {
    const list = document.getElementById('inventoryList');
    list.innerHTML = '';
    
    Object.keys(inventoryData).forEach(name => {
        const item = inventoryData[name];
        const div = document.createElement('div');
        div.className = `inventory-item tier-${item.tier}`;
        // Thêm pointer-events: none vào các thành phần con để click xuyên thấu
        div.innerHTML = `
            <img src="${item.icon}" style="pointer-events: none;">
            <div class="inventory-info" style="pointer-events: none;">${name}</div>
            <div class="inventory-count" style="pointer-events: none;">x${item.count}</div>
            <button class="delete-btn" data-name="${name}">×</button>
        `;
        list.appendChild(div);
    });
}

document.getElementById('inventoryList').addEventListener('click', function(e) {
    if (e.target.classList.contains('delete-btn')) {
        const itemName = e.target.getAttribute('data-name');
        deleteItem(itemName);
    }
});

function deleteItem(itemName) {
    const item = inventoryData[itemName];
    if (!item) return;

    // Lưu tên item vào biến tạm
    itemToDelete = itemName;
    
    // Cập nhật nội dung popup
    document.getElementById('deletePopupMsg').textContent = `Bạn đang có ${item.count} ${itemName}. Nhập số lượng:`;
    document.getElementById('deleteAmount').max = item.count;
    document.getElementById('deleteAmount').value = 1;

    // Hiển thị popup
    document.getElementById('deletePopup').classList.add('active');
}
function confirmDelete() {
    const amount = parseInt(document.getElementById('deleteAmount').value);
    const item = inventoryData[itemToDelete];

    if (isNaN(amount) || amount <= 0 || amount > item.count) {
        alert("Số lượng không hợp lệ!");
        return;
    }

    // Xử lý logic xóa
    item.count -= amount;
    if (item.count <= 0) {
        delete inventoryData[itemToDelete];
    }

    saveToFirebase();
    renderInventory();
    closeDeletePopup();
}

function closeDeletePopup() {
    document.getElementById('deletePopup').classList.remove('active');
    itemToDelete = null;
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

function toggleGameBox() {
    // 1. Ẩn menu chính
    document.getElementById('menuOverlay').style.display = 'none';
    
    // 2. Hiện màn hình GameBox
    const gameBox = document.getElementById('gameBoxScreen');
    if (gameBox) {
        gameBox.style.display = 'block'; // Thay vì flex, hãy dùng block (đúng với CSS .screen của bạn)
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

function switchTab(tabName) {
    // 1. Reset trạng thái nút
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-${tabName}`).classList.add('active');

    // 2. Ẩn tất cả nội dung
    document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');

    // 3. Hiện nội dung tương ứng
    document.getElementById(`${tabName}Content`).style.display = 'block';
}

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
        // Gán class màu sắc dựa trên tier (ssr, sr, r)
        li.className = `tier-${data.tier}-text`;
        li.innerHTML = `${name}${countDisplay}`;
        resultList.appendChild(li);
    }
    
    resultLog.style.display = 'block';
}
function checkGameState() {
    // Chỉ reset nếu chưa có timer đang chạy (tránh reset chồng chéo)
    if (resetTimer) clearTimeout(resetTimer); 
    
    resetTimer = setTimeout(() => {
        // Chỉ reset khi popup đã tắt
        const isPopupActive = document.querySelector('.popup-overlay.active');
        if (!isPopupActive) {
            resetGameToStart();
        } else {
            // Nếu popup vẫn mở, đợi thêm 1 giây nữa rồi kiểm tra lại
            checkGameState(); 
        }
    }, 1000); // Đã tăng lên 4 giây
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
    }, 5000 + (i * 500));

card.addEventListener('click', function() {
    // 1. NGĂN CHẶN CLICK TRÙNG LẶP hoặc khi đang khóa vì popup SSR
    if (this.classList.contains('flipped') || isProcessing) return; 

    clearTimeout(autoFlipTimeout);
    this.classList.add('flipped');
    
    // 2. Thêm vào kho đồ & nhật ký
    addToInventory(item);
    addResultToLog(item); 
    
    // 3. Xử lý logic SSR
    if (item.tier === 'ssr') { 
        // Đánh dấu isProcessing = true để KHÓA các lá bài khác
        isProcessing = true; 
        
        const title = document.querySelector('#popupTitle');
        const text = document.querySelector('#popupText');
        if (title) title.textContent = "Chúc Mừng";
        if (text) text.textContent = `Bạn đã nhận được: ${item.name}!`; 
        
        const ssrPopup = document.getElementById('ssrPopup');
        if (ssrPopup) ssrPopup.classList.add('active');
        
        setTimeout(() => {
            // Kiểm tra xem popup còn active không thì mới đóng
            if (ssrPopup.classList.contains('active')) {
                // Gọi trực tiếp sự kiện click của nút X để tái sử dụng logic reset
                const closeBtn = document.getElementById('closeSSRBtn');
                if (closeBtn) closeBtn.click();
            }
        }, 5000); // 5000ms = 5 giây

        // DỪNG LẠI TẠI ĐÂY (không tăng flippedCount hoặc kiểm tra kết thúc lượt)
        return; 
    }
    
    // 4. Nếu không phải SSR mới tiếp tục đếm
    flippedCount++; 

    // 5. Kiểm tra kết thúc lượt (chỉ chạy khi không phải SSR)
    if (flippedCount === 5) {
        isProcessing = true; 
        if (isX10 && currentBatch === 0) {
            currentBatch = 1;
            setTimeout(() => {
                isProcessing = false;
                initCards(); 
            }, 1000); 
        } else {
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

function openInventory() {
    document.getElementById('menuOverlay').style.display = 'none'; // Ẩn menu chính
    document.getElementById('inventoryScreen').style.display = 'block'; // Hiện màn hình mới
    
    // Gọi hàm render danh sách thẻ ở đây
    renderInventory(); 
}

function backToMenu() {
    document.getElementById('cardGame').style.display = 'none';
    document.getElementById('inventoryScreen').style.display = 'none';
    document.getElementById('gameBoxScreen').style.display = 'none';
    document.getElementById('menuOverlay').style.display = 'flex';

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

// 5. SỰ KIỆN NÚT BẤM
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

// Sự kiện Đăng xuất
logoutBtn.addEventListener('click', () => {
    auth.signOut().then(() => {
        // ẨN TẤT CẢ CÁC SCREEN
        document.getElementById('menuOverlay').style.display = 'none';
        document.getElementById('inventoryScreen').style.display = 'none';
        
        // HIỆN MÀN HÌNH ĐĂNG NHẬP
        document.querySelector('.auth-overlay').style.display = 'flex';
        
        // Xóa sạch dữ liệu cục bộ (nếu có)
        document.getElementById('inventoryList').innerHTML = '';

        topBar.style.display = 'none';
        bottomNav.style.display = 'none';
        
        console.log("Đã đăng xuất thành công");
    }).catch((error) => {
        console.error("Lỗi đăng xuất:", error);
    });
});

// Gom các sự kiện Popup vào một khối DOMContentLoaded duy nhất
document.addEventListener('DOMContentLoaded', () => {
    // Popup SSR
    const closeSSRBtn = document.getElementById('closeSSRBtn');
    if (closeSSRBtn) {
        closeSSRBtn.addEventListener('click', () => {
            // 1. Tắt popup
            ssrPopup.classList.remove('active');
            
            // 2. Mở khóa trạng thái để có thể click tiếp
            isProcessing = false;

            // 3. Tăng tiến trình (SSR tính là 1 lá)
            flippedCount++;

            // 4. Tự động lật các lá bài còn lại sau khi tắt popup
            const remainingCards = document.querySelectorAll('.card:not(.flipped)');
            remainingCards.forEach((card, index) => {
                setTimeout(() => {
                    // Kiểm tra isProcessing để không lật nếu người chơi lại vừa trúng 1 lá SSR khác
                    if (!card.classList.contains('flipped') && !isProcessing) {
                        card.click();
                    }
                }, 500 + (index * 300)); 
            });

            // 5. Kiểm tra kết thúc lượt
            if (flippedCount >= 5) {
                console.log("Đã lật đủ 5 lá, chuẩn bị reset sau 2 giây...");
                setTimeout(() => {
                    resetGameToStart();
                }, 2000); 
            }
        });
    }

    // Popup thông báo chung
    if (closeBtn) {
        closeBtn.addEventListener('click', () => popup.classList.remove('active'));
    }
});