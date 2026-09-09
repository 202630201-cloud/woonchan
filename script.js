let assessments = JSON.parse(localStorage.getItem("assessments") || "[]");

function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  if (tabId === 'register-tab') {
    document.getElementById('tab-register-btn').classList.add('active');
  } else {
    document.getElementById('tab-list-btn').classList.add('active');
    renderList();
  }
}

function updateConfidenceText(val) {
  const badge = document.getElementById('confidenceVal');
  let label = val <= 3 ? "취약 (매우 자신없음)" : val <= 6 ? "보통 (복습 필요)" : "우수 (자신있음)";
  badge.innerText = `${val}점 (${label})`;
}

document.getElementById('assessmentForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const newItem = {
    id: Date.now(),
    subject: document.getElementById('subject').value.trim(),
    title: document.getElementById('title').value.trim(),
    date: document.getElementById('date').value,
    period: document.getElementById('period').value,
    supplies: document.getElementById('supplies').value.trim(),
    confidence: parseInt(document.getElementById('confidence').value),
    notified3Days: false,
    notified1Day: false
  };

  assessments.push(newItem);
  saveData();
  alert("✅ 수행평가가 성공적으로 등록되었습니다!");
  this.reset();
  updateConfidenceText(5);
  switchTab('list-tab');
});

function saveData() {
  localStorage.setItem("assessments", JSON.stringify(assessments));
}

function deleteItem(id) {
  if (confirm("정말 이 수행평가 일정을 삭제하시겠습니까?")) {
    assessments = assessments.filter(item => item.id !== id);
    saveData();
    renderList();
  }
}

// 스마트 우선순위 정렬 알고리즘 (④ 요구사항)
function calculatePriorityScore(item) {
  const now = new Date();
  const targetDate = new Date(`${item.date}T09:00:00`);
  const diffHours = (targetDate - now) / (1000 * 60 * 60);
  const confidenceFactor = (11 - item.confidence) * 10; // 점수 낮을수록 가중치 UP
  let timeFactor = diffHours > 0 ? Math.max(0, 500 - diffHours) : -9999;
  return timeFactor + confidenceFactor;
}

function renderList() {
  const listContainer = document.getElementById('assessmentList');
  const sortBy = document.getElementById('sortBy').value;

  if (assessments.length === 0) {
    listContainer.innerHTML = `<div class="empty-state"><p>등록된 수행평가가 없습니다.</p></div>`;
    return;
  }

  let sortedList = [...assessments];
  if (sortBy === 'priority') {
    sortedList.sort((a, b) => calculatePriorityScore(b) - calculatePriorityScore(a));
  } else if (sortBy === 'date') {
    sortedList.sort((a, b) => new Date(a.date) - new Date(b.date));
  } else if (sortBy === 'confidence') {
    sortedList.sort((a, b) => a.confidence - b.confidence);
  }

  listContainer.innerHTML = "";
  sortedList.forEach(item => {
    const card = document.createElement('div');
    const targetDate = new Date(`${item.date}T09:00:00`);
    const diffDays = Math.ceil((targetDate - new Date()) / (1000 * 60 * 60 * 24));
    
    card.className = `item-card ${diffDays <= 1 ? 'urgent' : diffDays <= 3 ? 'warning' : ''}`;
    card.innerHTML = `
      <div class="item-info">
        <div class="item-badges">
          <span class="tag-badge tag-confidence">${item.confidence <= 3 ? '🔥 취약과목' : '⭐ 자신감'} (${item.confidence}점)</span>
        </div>
        <div class="item-title">[${item.subject}] ${item.title}</div>
        <div class="item-meta">
          <div>📅 <b>일정:</b> ${item.date} (${item.period})</div>
          <div>🎒 <b>준비물:</b> ${item.supplies}</div>
        </div>
      </div>
      <div class="item-right">
        <div class="timer-box ${diffDays <= 1 ? 'urgent' : ''}" id="timer-${item.id}">계산 중...</div>
        <button class="btn-delete" onclick="deleteItem(${item.id})">삭제</button>
      </div>
    `;
    listContainer.appendChild(card);
  });

  updateTimers();
}

function updateTimers() {
  const now = new Date();
  assessments.forEach(item => {
    const timerEl = document.getElementById(`timer-${item.id}`);
    if (!timerEl) return;
    const diff = new Date(`${item.date}T09:00:00`) - now;

    if (diff <= 0) {
      timerEl.innerText = "제출/평가 종료";
    } else {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      const secs = Math.floor((diff / 1000) % 60);
      timerEl.innerText = `⏳ ${days}일 ${hours}시간 ${mins}분 ${secs}초`;

      checkNotification(item, days, hours);
    }
  });
}

function checkNotification(item, daysLeft, hoursLeft) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  if (daysLeft === 3 && hoursLeft === 0 && !item.notified3Days) {
    new Notification(`[D-3 수행평가 알림] ${item.subject}`, {
      body: `'${item.title}' 수행평가가 3일 남았습니다!\n🎒 준비물: ${item.supplies}`
    });
    item.notified3Days = true;
    saveData();
  }
  if (daysLeft === 1 && hoursLeft === 0 && !item.notified1Day) {
    new Notification(`[D-1 내일 수행평가!] ${item.subject}`, {
      body: `내일 ${item.period} '${item.title}' 수행평가!\n🎒 준비물: ${item.supplies}`
    });
    item.notified1Day = true;
    saveData();
  }
}

function requestNotificationPermission() {
  if ("Notification" in window) {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") alert("🔔 브라우저 알림이 설정되었습니다!");
    });
  }
}

setInterval(updateTimers, 1000);