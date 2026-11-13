import './style.css';
import { randomRecommend, getCandidateCount } from './recommend.js';
import { shops } from './data/index.js';

const app = document.querySelector('#app');
let lastShopId = null; // 記錄上一間抽到的店


app.innerHTML = `
  <div class="container">
    <h1 class="title">今天吃什麼？</h1>
    
    <div class="meal-period" id="mealPeriod"></div>

    <div class="control">
      <label for="location">地點</label>
      <select id="location">
        <optgroup label="新北市">
          <option value="板橋區">板橋區</option>
        </optgroup>
        <optgroup label="台北市">
          <option value="中正區">中正區（台北車站）</option>
          <option value="萬華區">萬華區（西門）</option>
          <option value="中山區">中山區</option>
          <option value="大安區">大安區（公館）</option>
          <option value="大安森林公園">大安區（大安森林公園）</option>
        </optgroup>
      </select>
    </div>

    <div class="filters">
      <div class="filter-group">
        <span class="filter-label">預算</span>
        <div class="chips" id="priceChips">
          <button class="chip" data-value="all">不限</button>
          <button class="chip" data-value="1">便宜</button>
          <button class="chip" data-value="2">中等</button>
          <button class="chip" data-value="3">稍貴</button>
        </div>
      </div>

      <div class="filter-group">
        <span class="filter-label">類型</span>
        <div class="chips" id="typeChips">
          <button class="chip" data-value="all">不限</button>
          <button class="chip" data-value="台式">台式</button>
          <button class="chip" data-value="日式">日式</button>
          <button class="chip" data-value="麵食">麵食</button>
          <button class="chip" data-value="小吃">小吃</button>
        </div>
      </div>
    </div>

    <div class="candidate-count" id="candidateCount">目前有 0 間符合條件</div>
          <button id="btn" class="btn-primary">隨機推薦</button>
          <button id="listBtn" class="btn-list">我的清單</button>

    <div id="result" class="result-card" style="display: none;"></div>

    <!-- 我的清單 Modal -->
    <div id="listModal" class="modal" style="display: none;">
      <div class="modal-content">
        <div class="modal-header">
          <h2>我的清單</h2>
          <button id="closeModal" class="close-btn">✕</button>
        </div>
        <div class="modal-tabs">
          <button class="tab active" data-tab="favorites">喜愛</button>
          <button class="tab" data-tab="visited">吃過</button>
          <button class="tab" data-tab="disliked">不推</button>
        </div>
        <div id="listContent" class="list-content"></div>
      </div>
    </div>
  </div>
`;

const btn = document.getElementById('btn');
const listBtn = document.getElementById('listBtn');
const resultDiv = document.getElementById('result');
const locationSelect = document.getElementById('location');
const listModal = document.getElementById('listModal');
const listContent = document.getElementById('listContent');
const closeModal = document.getElementById('closeModal');

// 目前選中的篩選條件
let currentFilters = {
  priceLevel: 'all',
  type: 'all'
};

// ===== 記憶功能 =====
const STORAGE_KEY = 'food-random-settings';

function saveSettings() {
  const settings = {
    location: locationSelect.value,
    priceLevel: currentFilters.priceLevel,
    type: currentFilters.type
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function loadSettings() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;

  try {
    const settings = JSON.parse(saved);
    if (settings.location) locationSelect.value = settings.location;
    if (settings.priceLevel) {
      currentFilters.priceLevel = settings.priceLevel;
      setActiveChip('priceChips', settings.priceLevel);
    }
    if (settings.type) {
      currentFilters.type = settings.type;
      setActiveChip('typeChips', settings.type);
    }
  } catch (e) {
    console.log('讀取設定失敗', e);
  }
}

function updateCandidateCount() {
  const location = locationSelect.value;
  const count = getCandidateCount(location, currentFilters, lastShopId);
  const el = document.getElementById('candidateCount');
  if (el) {
    el.textContent = count > 0 
      ? `目前有 ${count} 間符合條件` 
      : `目前沒有符合條件的店家`;
  }
}

function setActiveChip(containerId, value) {
  const container = document.getElementById(containerId);
  container.querySelectorAll('.chip').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.value === value);
  });
}

// ===== chips =====
function setupChips(containerId, filterKey) {
  const container = document.getElementById(containerId);
  container.addEventListener('click', (e) => {
    if (!e.target.classList.contains('chip')) return;
    container.querySelectorAll('.chip').forEach(chip => chip.classList.remove('active'));
    e.target.classList.add('active');
    currentFilters[filterKey] = e.target.dataset.value;
    saveSettings();
    updateCandidateCount();
  });
}

setupChips('priceChips', 'priceLevel');
setupChips('typeChips', 'type');
locationSelect.addEventListener('change', () => {
  saveSettings();
  updateCandidateCount();
});

// ===== 時段 =====
function getCurrentMealPeriod() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 10) return { text: '早餐時段', emoji: '🌅' };
  if (hour >= 10 && hour < 14) return { text: '午餐時段', emoji: '☀️' };
  if (hour >= 14 && hour < 17) return { text: '下午茶時段', emoji: '☕' };
  if (hour >= 17 && hour < 21) return { text: '晚餐時段', emoji: '🌙' };
  return { text: '宵夜時段', emoji: '🌃' };
}

function updateMealPeriod() {
  const period = getCurrentMealPeriod();
  const el = document.getElementById('mealPeriod');
  if (el) el.innerHTML = `${period.emoji} 現在是 <strong>${period.text}</strong>`;
}

// ===== 標記功能 =====
const MARKS_KEY = 'food-marks';

function getMarks() {
  try {
    return JSON.parse(localStorage.getItem(MARKS_KEY) || '{"favorites":[],"visited":[],"disliked":[]}');
  } catch {
    return { favorites: [], visited: [], disliked: [] };
  }
}

function saveMarks(marks) {
  localStorage.setItem(MARKS_KEY, JSON.stringify(marks));
}

function toggleMark(shopId, type) {
  const marks = getMarks();
  const list = marks[type];

  if (list.includes(shopId)) {
    marks[type] = list.filter(id => id !== shopId);
  } else {
    marks.favorites = marks.favorites.filter(id => id !== shopId);
    marks.visited = marks.visited.filter(id => id !== shopId);
    marks.disliked = marks.disliked.filter(id => id !== shopId);
    marks[type].push(shopId);
  }

  saveMarks(marks);
  return marks;
}

function getShopMarks(shopId) {
  const marks = getMarks();
  return {
    isFavorite: marks.favorites.includes(shopId),
    isVisited: marks.visited.includes(shopId),
    isDisliked: marks.disliked.includes(shopId)
  };
}

function getShopById(id) {
  return shops.find(s => s.id === id);
}

// ===== 我的清單 =====
let currentTab = 'favorites';

function renderList(tab) {
  currentTab = tab;
  const marks = getMarks();
  const ids = marks[tab] || [];

  // 更新 tab 狀態
  document.querySelectorAll('.tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tab);
  });

  if (ids.length === 0) {
    listContent.innerHTML = `<p class="empty-list">目前沒有資料</p>`;
    return;
  }

  listContent.innerHTML = ids.map(id => {
    const shop = getShopById(id);
    if (!shop) return '';
    return `
      <div class="list-item">
        <div class="list-item-info">
          <div class="list-item-name">${shop.name}</div>
          <div class="list-item-meta">${shop.location} · ${shop.types.slice(0, 2).join('、')}</div>
        </div>
        <div class="list-item-actions">
          <a href="${shop.googleMapsUrl}" target="_blank" class="list-map">地圖</a>
          <button class="list-remove" data-id="${id}" data-type="${tab}">移除</button>
        </div>
      </div>
    `;
  }).join('');

  // 綁定移除
  listContent.querySelectorAll('.list-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const type = btn.dataset.type;
      toggleMark(id, type);
      renderList(currentTab);
    });
  });
}

listBtn.addEventListener('click', () => {
  listModal.style.display = 'flex';
  renderList(currentTab);
});

closeModal.addEventListener('click', () => {
  listModal.style.display = 'none';
});

listModal.addEventListener('click', (e) => {
  if (e.target === listModal) listModal.style.display = 'none';
});

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    renderList(tab.dataset.tab);
  });
});

// ===== 其他 =====
function getPriceText(level) {
  if (level === 1) return '便宜';
  if (level === 2) return '中等';
  if (level === 3) return '稍貴';
  return '未知';
}

function getCurrentTimeText() {
  const now = new Date();
  return now.toLocaleString('zh-TW', {
    month: 'numeric', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false
  });
}

function showResult(shop) {
  if (!shop) {
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `
      <p class="empty-text">目前這個條件下沒有營業中的店家<br>可以試著放寬篩選條件</p>
    `;
    return;
  }

  const marks = getShopMarks(shop.id);

  resultDiv.style.display = 'block';
  resultDiv.innerHTML = `
    <div class="time">${getCurrentTimeText()}</div>
    <h2 class="shop-name">${shop.name}</h2>
    
    <div class="status">
      <span class="badge">目前營業中</span>
    </div>

    <div class="info">
      <div class="info-row">
        <span class="label">評分</span>
        <span class="value">${shop.rating}</span>
      </div>
      <div class="info-row">
        <span class="label">價位</span>
        <span class="value">${getPriceText(shop.priceLevel)}</span>
      </div>
      <div class="info-row">
        <span class="label">類型</span>
        <span class="value">${shop.types.join('、')}</span>
      </div>
      <div class="info-row">
        <span class="label">地址</span>
        <span class="value">${shop.address || '暫無地址'}</span>
      </div>
    </div>

    <div class="mark-buttons">
      <button class="mark-btn ${marks.isFavorite ? 'active' : ''}" data-type="favorites" data-id="${shop.id}">
        ${marks.isFavorite ? '★ 已喜愛' : '☆ 喜愛'}
      </button>
      <button class="mark-btn ${marks.isVisited ? 'active' : ''}" data-type="visited" data-id="${shop.id}">
        ${marks.isVisited ? '✓ 吃過' : '○ 吃過'}
      </button>
      <button class="mark-btn dislike ${marks.isDisliked ? 'active' : ''}" data-type="disliked" data-id="${shop.id}">
        ${marks.isDisliked ? '✕ 不推' : '✕ 不推'}
      </button>
    </div>

    <a href="${shop.googleMapsUrl}" target="_blank" class="map-link">開啟 Google 地圖導航</a>
    <button id="againBtn" class="btn-secondary">再抽一次</button>
  `;

  resultDiv.querySelectorAll('.mark-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.type;
      const id = btn.dataset.id;
      toggleMark(id, type);
      showResult(shop);
    });
  });

  document.getElementById('againBtn').addEventListener('click', () => {
    const location = locationSelect.value;
    const newShop = randomRecommend(location, currentFilters, lastShopId);
    if (newShop) {
        lastShopId = newShop.id;
      }
    showResult(newShop);
    updateCandidateCount();
  });

}

btn.addEventListener('click', () => {
  const location = locationSelect.value;
  const shop = randomRecommend(location, currentFilters, lastShopId);
  if (shop) {
    lastShopId = shop.id;
  }
  showResult(shop);
  updateCandidateCount();
});


// ===== 初始化 =====
updateMealPeriod();
loadSettings();
updateCandidateCount(); // 新增這行