import { shops } from './data/index.js';

function getDislikedIds() {
  try {
    const data = JSON.parse(localStorage.getItem('food-marks') || '{}');
    return data.disliked || [];
  } catch {
    return [];
  }
}

export function isOpenNow(shop) {
  const now = new Date();
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const day = days[now.getDay()];
  const periods = shop.openingHours[day];

  if (!periods || periods.length === 0) return false;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return periods.some(period => {
    const [startStr, endStr] = period.split('-');
    const [startH, startM] = startStr.split(':').map(Number);
    const [endH, endM] = endStr.split(':').map(Number);

    const start = startH * 60 + startM;
    let end = endH * 60 + endM;

    if (end < start) {
      return currentMinutes >= start || currentMinutes <= end;
    }
    return currentMinutes >= start && currentMinutes <= end;
  });
}

/**
 * 取得符合條件的店家數量（給 UI 顯示用）
 */
export function getCandidateCount(location, filters = {}, excludeId = null) {
  const disliked = getDislikedIds();

  let candidates = shops.filter(shop => 
    shop.location === location && 
    isOpenNow(shop) &&
    !disliked.includes(shop.id)
  );

  if (filters.priceLevel && filters.priceLevel !== 'all') {
    const level = Number(filters.priceLevel);
    candidates = candidates.filter(shop => shop.priceLevel === level);
  }

  if (filters.type && filters.type !== 'all') {
    candidates = candidates.filter(shop => shop.types.includes(filters.type));
  }

  // 排除上一間（如果還有其他選擇）
  if (excludeId && candidates.length > 1) {
    candidates = candidates.filter(shop => shop.id !== excludeId);
  }

  return candidates.length;
}

/**
 * 隨機推薦
 */
export function randomRecommend(location, filters = {}, excludeId = null) {
  const disliked = getDislikedIds();

  let candidates = shops.filter(shop => 
    shop.location === location && 
    isOpenNow(shop) &&
    !disliked.includes(shop.id)
  );

  if (filters.priceLevel && filters.priceLevel !== 'all') {
    const level = Number(filters.priceLevel);
    candidates = candidates.filter(shop => shop.priceLevel === level);
  }

  if (filters.type && filters.type !== 'all') {
    candidates = candidates.filter(shop => shop.types.includes(filters.type));
  }

  // 排除上一間（如果還有其他選擇）
  if (excludeId && candidates.length > 1) {
    candidates = candidates.filter(shop => shop.id !== excludeId);
  }

  if (candidates.length === 0) return null;

  // 評分較高的優先
  const sorted = [...candidates].sort((a, b) => b.rating - a.rating);
  const pool = sorted.slice(0, Math.min(8, sorted.length));
  const index = Math.floor(Math.random() * pool.length);
  
  return pool[index];
}