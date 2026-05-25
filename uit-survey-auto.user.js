// ==UserScript==
// @name         UIT Survey Auto-Filler
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Tự động điền nhanh phiếu khảo sát giảng viên UIT với giao diện đẹp mắt và nhiều chế độ lựa chọn.
// @match        https://survey.uit.edu.vn/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
  'use strict';

  // Default config values
  const DEFAULT_COMMENTS = [
    "Giảng viên dạy nhiệt tình, bài giảng dễ hiểu và sinh động.",
    "Nội dung môn học bổ ích, giảng viên truyền đạt kiến thức rất tốt.",
    "Giảng viên hỗ trợ sinh viên nhiệt tình cả trong và ngoài giờ học.",
    "Phương pháp giảng dạy hay, tạo được hứng thú học tập cho sinh viên.",
    "Tài liệu học tập đầy đủ, giảng viên giải đáp thắc mắc rõ ràng.",
    "Giảng viên lên lớp đúng giờ, chuẩn bị bài giảng rất chu đáo."
  ].join("\n");

  // Load configs from LocalStorage
  let config = {
    active: localStorage.getItem('uit_auto_active') === 'true',
    ratingMode: localStorage.getItem('uit_auto_rating_mode') || 'natural',
    comments: localStorage.getItem('uit_auto_comments') !== null ? localStorage.getItem('uit_auto_comments') : DEFAULT_COMMENTS,
    autoNext: localStorage.getItem('uit_auto_next') !== null ? localStorage.getItem('uit_auto_next') === 'true' : true,
    delayTime: parseFloat(localStorage.getItem('uit_auto_delay') || '1.0'),
    minimized: localStorage.getItem('uit_auto_minimized') === 'true'
  };

  let autoClickTimeout = null;
  let countdownInterval = null;

  // Append Google Fonts (Outfit)
  if (!document.querySelector('link[href*="fonts.googleapis.com/css2?family=Outfit"]')) {
    const fontLink = document.createElement("link");
    fontLink.rel = "stylesheet";
    fontLink.href = "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap";
    document.head.appendChild(fontLink);
  }

  // Inject Styles for the Floating Panel & Toast
  const styleNode = document.createElement('style');
  styleNode.textContent = `
    #uit-widget-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 999999;
      font-family: 'Outfit', sans-serif;
      color: #ffffff;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .uit-panel {
      width: 320px;
      background: rgba(21, 15, 42, 0.95);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 15px rgba(0, 242, 254, 0.1);
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .uit-panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 8px;
    }
    .uit-panel-title {
      font-weight: 700;
      font-size: 14px;
      background: linear-gradient(90deg, #00f2fe 0%, #4facfe 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .uit-btn-icon {
      background: none;
      border: none;
      color: #9d9aa6;
      cursor: pointer;
      font-size: 14px;
      transition: color 0.2s;
    }
    .uit-btn-icon:hover {
      color: #ffffff;
    }
    .uit-form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .uit-label {
      font-size: 11px;
      font-weight: 600;
      color: #9d9aa6;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .uit-select, .uit-textarea {
      width: 100%;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 6px;
      color: #ffffff;
      padding: 6px 10px;
      font-family: inherit;
      font-size: 12px;
    }
    .uit-select:focus, .uit-textarea:focus {
      outline: none;
      border-color: #00f2fe;
    }
    .uit-textarea {
      height: 60px;
      resize: none;
    }
    .uit-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .uit-switch-label {
      font-size: 12px;
      font-weight: 600;
    }
    .uit-switch {
      position: relative;
      display: inline-block;
      width: 36px;
      height: 20px;
    }
    .uit-switch input { opacity: 0; width: 0; height: 0; }
    .uit-slider {
      position: absolute;
      cursor: pointer;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 34px;
      transition: .3s;
    }
    .uit-slider:before {
      position: absolute;
      content: "";
      height: 14px;
      width: 14px;
      left: 3px;
      bottom: 3px;
      background-color: #9d9aa6;
      border-radius: 50%;
      transition: .3s;
    }
    .uit-switch input:checked + .uit-slider {
      background-color: rgba(0, 242, 254, 0.15);
      border: 1px solid #00f2fe;
    }
    .uit-switch input:checked + .uit-slider:before {
      transform: translateX(16px);
      background-color: #00f2fe;
      box-shadow: 0 0 6px #00f2fe;
    }
    .uit-range {
      -webkit-appearance: none;
      width: 100%;
      height: 4px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 2px;
      outline: none;
    }
    .uit-range::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #00f2fe;
      cursor: pointer;
      box-shadow: 0 0 6px #00f2fe;
    }
    .uit-btn-primary {
      background: linear-gradient(90deg, #00f2fe 0%, #4facfe 100%);
      color: #05030a;
      border: none;
      border-radius: 6px;
      padding: 10px;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      font-size: 13px;
      transition: all 0.2s;
    }
    .uit-btn-primary:hover {
      box-shadow: 0 0 12px rgba(0, 242, 254, 0.3);
    }
    .uit-btn-danger {
      background: rgba(244, 67, 54, 0.15);
      border: 1px solid rgba(244, 67, 54, 0.4);
      color: #ff8a80;
      border-radius: 6px;
      padding: 10px;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      font-size: 13px;
      transition: all 0.2s;
    }
    .uit-btn-danger:hover {
      background: rgba(244, 67, 54, 0.3);
    }
    /* Minimized bubble state */
    .uit-bubble {
      width: 44px;
      height: 44px;
      background: rgba(21, 15, 42, 0.95);
      border: 1px solid #00f2fe;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 18px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4), 0 0 10px rgba(0, 242, 254, 0.2);
      transition: all 0.2s;
    }
    .uit-bubble:hover {
      transform: scale(1.08);
      box-shadow: 0 4px 20px rgba(0,0,0,0.5), 0 0 15px rgba(0, 242, 254, 0.4);
    }
    /* Running status panel style */
    .uit-running-info {
      font-size: 11px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      padding-top: 6px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    
    /* Toast Alert */
    #uit-toast {
      position: fixed;
      bottom: 25px;
      right: 25px;
      background: rgba(15, 12, 30, 0.95);
      border: 1px solid rgba(0, 242, 254, 0.4);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 10px rgba(0, 242, 254, 0.2);
      color: #ffffff;
      padding: 10px 18px;
      border-radius: 8px;
      font-size: 12px;
      z-index: 1000000;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      display: flex;
      align-items: center;
      gap: 8px;
      opacity: 0;
      transform: translateY(20px);
      pointer-events: none;
    }
  `;
  document.head.appendChild(styleNode);

  // HTML Element for Toast
  const toastEl = document.createElement('div');
  toastEl.id = 'uit-toast';
  document.body.appendChild(toastEl);

  function showToast(message, duration = 3000) {
    toastEl.innerHTML = `<span style="color: #00f2fe; font-size: 14px;">🚀</span> ${message}`;
    toastEl.offsetHeight; // force reflow
    toastEl.style.opacity = "1";
    toastEl.style.transform = "translateY(0)";
    setTimeout(() => {
      toastEl.style.opacity = "0";
      toastEl.style.transform = "translateY(20px)";
    }, duration);
  }

  // Create Float widget Container
  const widgetContainer = document.createElement('div');
  widgetContainer.id = 'uit-widget-container';
  document.body.appendChild(widgetContainer);

  renderWidget();

  // If active, run autofill automatically on load
  if (config.active && document.getElementById("limesurvey")) {
    runAutofill();
  }

  function renderWidget() {
    if (config.minimized) {
      widgetContainer.innerHTML = `<div class="uit-bubble" title="Mở bảng điều khiển tự động khảo sát UIT">🚀</div>`;
      widgetContainer.querySelector('.uit-bubble').addEventListener('click', () => {
        config.minimized = false;
        localStorage.setItem('uit_auto_minimized', 'false');
        renderWidget();
      });
    } else {
      widgetContainer.innerHTML = `
        <div class="uit-panel">
          <div class="uit-panel-header">
            <span class="uit-panel-title">🤖 UIT Survey Auto</span>
            <button class="uit-btn-icon" id="uit-btn-minimize" title="Thu nhỏ">➖</button>
          </div>
          
          <div class="uit-form-group">
            <label class="uit-label">Mức độ đánh giá</label>
            <select class="uit-select" id="uit-opt-rating">
              <option value="max" ${config.ratingMode === 'max' ? 'selected' : ''}>Tối đa (5/5)</option>
              <option value="natural" ${config.ratingMode === 'natural' ? 'selected' : ''}>Tự nhiên (80% Max, 20% Tốt)</option>
              <option value="good" ${config.ratingMode === 'good' ? 'selected' : ''}>Tốt / Khá (4/5)</option>
              <option value="average" ${config.ratingMode === 'average' ? 'selected' : ''}>Trung bình (3/5)</option>
            </select>
          </div>

          <div class="uit-form-group">
            <label class="uit-label">Ý kiến đóng góp (Random theo dòng)</label>
            <textarea class="uit-textarea" id="uit-txt-comments" placeholder="Mỗi dòng là một ý kiến...">${config.comments}</textarea>
          </div>

          <div class="uit-row">
            <span class="uit-switch-label">Tự động qua trang</span>
            <label class="uit-switch">
              <input type="checkbox" id="uit-chk-next" ${config.autoNext ? 'checked' : ''}>
              <span class="uit-slider"></span>
            </label>
          </div>

          <div class="uit-form-group" id="uit-delay-group" style="${config.autoNext ? '' : 'opacity:0.4; pointer-events:none;'}">
            <div class="uit-row">
              <label class="uit-label">Thời gian trễ</label>
              <span id="uit-delay-val" style="font-size: 11px; font-weight: 600; color: #00f2fe;">${config.delayTime}s</span>
            </div>
            <input type="range" class="uit-range" id="uit-val-delay" min="0.3" max="3.0" step="0.1" value="${config.delayTime}">
          </div>

          <button id="uit-btn-trigger" class="${config.active ? 'uit-btn-danger' : 'uit-btn-primary'}">
            ${config.active ? 'DỪNG TỰ ĐỘNG ĐIỀN' : 'BẮT ĐẦU TỰ ĐỘNG ĐIỀN'}
          </button>

          ${config.active ? `
            <div class="uit-running-info">
              <div>Trạng thái: <strong style="color: #4caf50; animation: pulse 1.5s infinite;">ĐANG CHẠY</strong></div>
              <div id="uit-status-timer" style="color: #00f2fe; font-weight: 600;">Đang chuẩn bị...</div>
            </div>
          ` : ''}
        </div>
      `;

      // Bind events
      document.getElementById('uit-btn-minimize').addEventListener('click', () => {
        config.minimized = true;
        localStorage.setItem('uit_auto_minimized', 'true');
        renderWidget();
      });

      const optRating = document.getElementById('uit-opt-rating');
      const txtComments = document.getElementById('uit-txt-comments');
      const chkNext = document.getElementById('uit-chk-next');
      const valDelay = document.getElementById('uit-val-delay');
      const delayValText = document.getElementById('uit-delay-val');
      const btnTrigger = document.getElementById('uit-btn-trigger');

      optRating.addEventListener('change', (e) => {
        config.ratingMode = e.target.value;
        localStorage.setItem('uit_auto_rating_mode', config.ratingMode);
      });

      txtComments.addEventListener('input', (e) => {
        config.comments = e.target.value;
        localStorage.setItem('uit_auto_comments', config.comments);
      });

      chkNext.addEventListener('change', (e) => {
        config.autoNext = e.target.checked;
        localStorage.setItem('uit_auto_next', config.autoNext ? 'true' : 'false');
        document.getElementById('uit-delay-group').style.cssText = config.autoNext ? '' : 'opacity:0.4; pointer-events:none;';
      });

      valDelay.addEventListener('input', (e) => {
        config.delayTime = parseFloat(e.target.value);
        delayValText.textContent = `${config.delayTime}s`;
        localStorage.setItem('uit_auto_delay', config.delayTime.toString());
      });

      btnTrigger.addEventListener('click', () => {
        if (config.active) {
          // Stop
          stopAutofill();
        } else {
          // Start
          startAutofill();
        }
      });
    }
  }

  function startAutofill() {
    const form = document.getElementById("limesurvey");
    if (!form) {
      showToast("Không phát hiện form khảo sát trên trang hiện tại.", 3000);
      return;
    }
    config.active = true;
    localStorage.setItem('uit_auto_active', 'true');
    renderWidget();
    runAutofill();
  }

  function stopAutofill() {
    config.active = false;
    localStorage.setItem('uit_auto_active', 'false');
    if (autoClickTimeout) clearTimeout(autoClickTimeout);
    if (countdownInterval) clearInterval(countdownInterval);
    renderWidget();
    showToast("Đã dừng tự động điền khảo sát.", 3000);
  }

  function runAutofill() {
    const form = document.getElementById("limesurvey");
    if (!form) {
      localStorage.setItem('uit_auto_active', 'false');
      config.active = false;
      renderWidget();
      showToast("Không tìm thấy form khảo sát. Dừng tự động.", 3000);
      return;
    }

    const radios = form.querySelectorAll('input[type="radio"]');
    const radioGroups = {};
    radios.forEach(radio => {
      if (!radioGroups[radio.name]) {
        radioGroups[radio.name] = [];
      }
      radioGroups[radio.name].push(radio);
    });

    let filledCount = 0;
    Object.values(radioGroups).forEach(group => {
      const len = group.length;
      if (len === 0) return;

      let targetIndex;
      if (config.ratingMode === "max") {
        targetIndex = len - 1;
      } else if (config.ratingMode === "good") {
        targetIndex = Math.max(0, len - 2);
      } else if (config.ratingMode === "average") {
        targetIndex = Math.floor(len / 2);
      } else if (config.ratingMode === "natural") {
        targetIndex = Math.random() < 0.8 ? (len - 1) : Math.max(0, len - 2);
      } else {
        targetIndex = len - 1;
      }

      if (group[targetIndex]) {
        group[targetIndex].checked = true;
        group[targetIndex].dispatchEvent(new Event("click", { bubbles: true }));
        group[targetIndex].dispatchEvent(new Event("change", { bubbles: true }));
        filledCount++;
      }
    });

    const textareas = form.querySelectorAll("textarea");
    const commentLines = config.comments
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0);

    textareas.forEach(textarea => {
      if (commentLines.length > 0) {
        const randomComment = commentLines[Math.floor(Math.random() * commentLines.length)];
        textarea.value = randomComment;
      } else {
        textarea.value = "Giảng viên nhiệt tình, dạy dễ hiểu, hỗ trợ sinh viên tốt.";
      }
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
      textarea.dispatchEvent(new Event("change", { bubbles: true }));
      filledCount++;
    });

    showToast(`Tự động điền thành công ${filledCount} ô!`, 2500);

    if (config.autoNext) {
      const nextButton = getNextButton();
      if (nextButton) {
        let remainingTime = config.delayTime;
        const intervalMs = 100;
        
        const statusTimerEl = document.getElementById("uit-status-timer");
        if (statusTimerEl) {
          statusTimerEl.textContent = `Tiếp theo sau ${remainingTime.toFixed(1)}s`;
        }

        countdownInterval = setInterval(() => {
          remainingTime -= intervalMs / 1000;
          if (remainingTime <= 0) {
            remainingTime = 0;
            clearInterval(countdownInterval);
          }
          if (statusTimerEl) {
            statusTimerEl.textContent = `Tiếp theo sau ${remainingTime.toFixed(1)}s`;
          }
        }, intervalMs);

        autoClickTimeout = setTimeout(() => {
          if (localStorage.getItem('uit_auto_active') === 'true') {
            nextButton.click();
          }
        }, config.delayTime * 1000);
      } else {
        showToast("Đã đến trang cuối hoặc không tìm thấy nút chuyển trang.", 4000);
        localStorage.setItem('uit_auto_active', 'false');
        config.active = false;
        renderWidget();
      }
    } else {
      const statusTimerEl = document.getElementById("uit-status-timer");
      if (statusTimerEl) {
        statusTimerEl.textContent = "Chế độ thủ công (Hãy click Tiếp theo)";
      }
    }
  }

  function getNextButton() {
    return (
      document.getElementById("movenextbtn") ||
      document.getElementById("movesubmitbtn") ||
      document.querySelector("button.submit") ||
      document.querySelector('input[type="submit"].submit') ||
      document.querySelector(".navigator-table button") ||
      document.querySelector('button[name="move2"]') ||
      document.querySelector('input[name="move2"]')
    );
  }
})();
