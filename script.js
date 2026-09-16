// 수행평가 데이터 저장 배열
let assessments = [];

// DOM 요소
const form = document.getElementById('assessment-form');
const notificationList = document.getElementById('notification-list');
const assessmentList = document.getElementById('assessment-list');

// 오늘 날짜 구하기 (시/분/초 제거한 YYYY-MM-DD 객체)
function getTodayDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// 폼 제출 이벤트
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const newItem = {
    id: Date.now(),
    subject: document.getElementById('subject').value,
    title: document.getElementById('title').value,
    period: document.getElementById('period').value,
    confidence: document.getElementById('confidence').value,
    supplies: document.getElementById('supplies').value,
    dateStr: document.getElementById('date').value
  };

  assessments.push(newItem);
  form.reset();

  renderAll();
});

// 화면 전체 업데이트 (목록 및 알림)
function renderAll() {
  renderNotifications();
  renderList();
}

// D-3 / D-1 알림 판별 및 출력 함수
function renderNotifications() {
  notificationList.innerHTML = '';
  const today = getTodayDate();
  let alertCount = 0;

  assessments.forEach(item => {
    const targetDate = new Date(item.dateStr);
    // 자정 기준 일수 차이 계산
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 3 || diffDays === 1) {
      alertCount++;
      const alertDiv = document.createElement('div');
      alertDiv.className = `alert-card d-${diffDays}`;

      const guideText = diffDays === 3 
        ? '💡 <b>D-3 안내:</b> 아직 여유가 있어요. 준비물을 확인하고 원고/개념을 가볍게 읽어보세요.' 
        : '🔥 <b>D-1 안내:</b> 내일이 시험입니다! 가방에 준비물을 미리 넣고 일찍 자물에 들어요.';

      alertDiv.innerHTML = `
        <span class="alert-badge">D-${diffDays} 알림</span>
        <div><b>[${item.subject}] ${item.title}</b></div>
        <div class="item-details">
          • 날짜/교시: ${item.dateStr} (${item.period})<br>
          • 챙길 준비물: ${item.supplies}<br>
          • 나의 자신감: ${item.confidence}
        </div>
        <p style="margin-top: 6px; font-size: 0.85rem; color: #444;">${guideText}</p>
      `;
      notificationList.appendChild(alertDiv);
    }
  });

  if (alertCount === 0) {
    notificationList.innerHTML = '<p class="empty-msg">오늘 기준으로 D-3 또는 D-1에 해당하는 수행평가가 없습니다. ☕</p>';
  }
}

// 전체 수행평가 목록 출력 함수
function renderList() {
  assessmentList.innerHTML = '';

  if (assessments.length === 0) {
    assessmentList.innerHTML = '<p class="empty-msg">등록된 수행평가가 없습니다.</p>';
    return;
  }

  // 날짜 오름차순 정렬
  assessments.sort((a, b) => new Date(a.dateStr) - new Date(b.dateStr));

  assessments.forEach(item => {
    const card = document.createElement('div');
    card.className = 'item-card';

    card.innerHTML = `
      <div class="item-header">
        <span>${item.subject} - ${item.title}</span>
        <span style="font-size: 0.9rem; color: #007bff;">${item.dateStr}</span>
      </div>
      <div class="item-details">
        • 교시: ${item.period} | 자신감: ${item.confidence}<br>
        • 준비물: ${item.supplies}
      </div>
    `;
    assessmentList.appendChild(card);
  });
}

// 최초 실행 시 초기화
renderAll();