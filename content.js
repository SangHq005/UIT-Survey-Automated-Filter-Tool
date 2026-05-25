let autoClickTimeout = null;
let countdownInterval = null;

// Initialize on page load
chrome.storage.local.get(["isAutofillActive", "ratingMode", "comments", "autoNext", "delayTime"], (result) => {
  if (result.isAutofillActive && document.getElementById("limesurvey")) {
    const config = {
      ratingMode: result.ratingMode || "natural",
      comments: result.comments || "",
      autoNext: result.autoNext !== undefined ? result.autoNext : true,
      delayTime: result.delayTime !== undefined ? result.delayTime : 1.0
    };
    executeAutofill(config);
  }
});

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startAutofill") {
    // Save active state to storage
    chrome.storage.local.set({ isAutofillActive: true }, () => {
      executeAutofill(request.config);
      sendResponse({ status: "started" });
    });
    return true; // Keep message channel open for async response
  }
});

function executeAutofill(config) {
  // Clear any existing timeouts or intervals
  clearPendingAutomation();

  const form = document.getElementById("limesurvey");
  if (!form) {
    showToast("Không tìm thấy form khảo sát trên trang này.", 3000);
    chrome.storage.local.set({ isAutofillActive: false });
    return;
  }

  // Create or update Floating Control Panel
  createControlPanel(config);

  // 1. Process Radio Buttons
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
      targetIndex = len - 1; // Highest rating 
    } else if (config.ratingMode === "good") {
      targetIndex = Math.max(0, len - 2); // Agree
    } else if (config.ratingMode === "average") {
      targetIndex = Math.floor(len / 2); // Neutral
    } else if (config.ratingMode === "natural") {
      // 80% Max, 20% Good
      targetIndex = Math.random() < 0.8 ? (len - 1) : Math.max(0, len - 2);
    } else {
      targetIndex = len - 1;
    }

    if (group[targetIndex]) {
      group[targetIndex].checked = true;
      // Dispatch events to trigger LimeSurvey's internal dynamic logic
      group[targetIndex].dispatchEvent(new Event("click", { bubbles: true }));
      group[targetIndex].dispatchEvent(new Event("change", { bubbles: true }));
      filledCount++;
    }
  });

  // 2. Process Textareas (Comments)
  const textareas = form.querySelectorAll("textarea");
  const commentLines = config.comments
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0);

  textareas.forEach(textarea => {
    if (commentLines.length > 0) {
      // Pick a random comment from the user's list
      const randomComment = commentLines[Math.floor(Math.random() * commentLines.length)];
      textarea.value = randomComment;
    } else {
      textarea.value = "Giảng viên nhiệt tình, dạy dễ hiểu, hỗ trợ sinh viên tốt.";
    }
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    textarea.dispatchEvent(new Event("change", { bubbles: true }));
    filledCount++;
  });

  showToast(`Đã tự động điền ${filledCount} trường dữ liệu!`, 2500);

  // 3. Auto Next Action
  if (config.autoNext) {
    const nextButton = getNextButton();
    if (nextButton) {
      let remainingTime = config.delayTime;
      const intervalMs = 100;
      
      const panelTimerText = document.getElementById("uit-timer-text");
      if (panelTimerText) {
        panelTimerText.textContent = `Tiếp theo sau ${remainingTime.toFixed(1)}s`;
      }

      countdownInterval = setInterval(() => {
        remainingTime -= intervalMs / 1000;
        if (remainingTime <= 0) {
          remainingTime = 0;
          clearInterval(countdownInterval);
        }
        if (panelTimerText) {
          panelTimerText.textContent = `Tiếp theo sau ${remainingTime.toFixed(1)}s`;
        }
      }, intervalMs);

      autoClickTimeout = setTimeout(() => {
        // Double check if still active
        chrome.storage.local.get("isAutofillActive", (res) => {
          if (res.isAutofillActive) {
            // Click and submit
            nextButton.click();
          }
        });
      }, config.delayTime * 1000);
    } else {
      // No next button found, maybe survey is completed
      showToast("Không tìm thấy nút tiếp theo. Có thể đã hoàn thành khảo sát!", 4000);
      chrome.storage.local.set({ isAutofillActive: false });
      removeControlPanel();
    }
  } else {
    // If auto next is disabled, don't trigger submit but keep control panel so they can see they are in manual mode
    const panelTimerText = document.getElementById("uit-timer-text");
    if (panelTimerText) {
      panelTimerText.textContent = "Chế độ thủ công (Hãy click Tiếp theo)";
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

function clearPendingAutomation() {
  if (autoClickTimeout) {
    clearTimeout(autoClickTimeout);
    autoClickTimeout = null;
  }
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
}

function createControlPanel(config) {
  let panel = document.getElementById("uit-survey-control-panel");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "uit-survey-control-panel";
    panel.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(21, 15, 42, 0.9);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(0, 242, 254, 0.4);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 15px rgba(0, 242, 254, 0.25);
      border-radius: 12px;
      padding: 12px 18px;
      z-index: 100000;
      font-family: 'Outfit', 'Inter', sans-serif;
      color: #ffffff;
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 220px;
      pointer-events: auto;
      transition: all 0.3s ease;
    `;
    
    // Add Outfit font to page if not present
    if (!document.querySelector('link[href*="fonts.googleapis.com/css2?family=Outfit"]')) {
      const linkNode = document.createElement("link");
      linkNode.rel = "stylesheet";
      linkNode.href = "https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap";
      document.head.appendChild(linkNode);
    }

    document.body.appendChild(panel);
  }

  panel.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 6px;">
      <span style="font-weight: 700; font-size: 13px; color: #00f2fe; display: flex; align-items: center; gap: 6px;">
        <span style="animation: pulse 1.5s infinite;">🤖</span> UIT Survey Auto
      </span>
      <button id="uit-btn-stop" style="
        background: rgba(244, 67, 54, 0.15);
        border: 1px solid rgba(244, 67, 54, 0.4);
        color: #ff8a80;
        border-radius: 4px;
        padding: 2px 8px;
        font-size: 10px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      ">DỪNG</button>
    </div>
    <div style="font-size: 11px; color: #e0e0e0; display: flex; flex-direction: column; gap: 2px;">
      <div>Chế độ: <strong style="color: #4facfe;">${translateRatingMode(config.ratingMode)}</strong></div>
      <div id="uit-timer-text" style="font-weight: 600; color: #00f2fe;">Đang tính toán...</div>
    </div>
    <style>
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.15); }
        100% { transform: scale(1); }
      }
      #uit-btn-stop:hover {
        background: rgba(244, 67, 54, 0.3) !important;
        box-shadow: 0 0 6px rgba(244, 67, 54, 0.3);
      }
    </style>
  `;

  document.getElementById("uit-btn-stop").addEventListener("click", () => {
    chrome.storage.local.set({ isAutofillActive: false }, () => {
      clearPendingAutomation();
      removeControlPanel();
      showToast("Đã dừng tự động điền phiếu khảo sát.", 3000);
    });
  });
}

function removeControlPanel() {
  const panel = document.getElementById("uit-survey-control-panel");
  if (panel) {
    panel.style.opacity = "0";
    panel.style.transform = "translateY(-10px)";
    setTimeout(() => panel.remove(), 300);
  }
}

function translateRatingMode(mode) {
  switch (mode) {
    case "max": return "Tối đa (5/5)";
    case "good": return "Tốt (4/5)";
    case "average": return "Trung bình (3/5)";
    case "natural": return "Tự nhiên (80% Max, 20% Tốt)";
    default: return mode;
  }
}

function showToast(message, duration = 3000) {
  let toast = document.getElementById("uit-survey-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "uit-survey-toast";
    toast.style.cssText = `
      position: fixed;
      bottom: 25px;
      right: 25px;
      background: rgba(15, 12, 30, 0.95);
      border: 1px solid rgba(0, 242, 254, 0.4);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 10px rgba(0, 242, 254, 0.2);
      color: #ffffff;
      padding: 10px 18px;
      border-radius: 8px;
      font-family: 'Outfit', sans-serif;
      font-size: 12px;
      z-index: 100001;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      display: flex;
      align-items: center;
      gap: 8px;
      opacity: 0;
      transform: translateY(20px);
    `;
    document.body.appendChild(toast);
  }

  toast.innerHTML = `<span style="color: #00f2fe; font-size: 14px;">🚀</span> ${message}`;
  
  // Trigger reflow to apply transition
  toast.offsetHeight;
  
  toast.style.opacity = "1";
  toast.style.transform = "translateY(0)";

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";
  }, duration);
}
