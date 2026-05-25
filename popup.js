// Default comments list
const DEFAULT_COMMENTS = [
  "Giảng viên dạy nhiệt tình, bài giảng dễ hiểu và sinh động.",
  "Nội dung môn học bổ ích, giảng viên truyền đạt kiến thức rất tốt.",
  "Giảng viên hỗ trợ sinh viên nhiệt tình cả trong và ngoài giờ học.",
  "Phương pháp giảng dạy hay, tạo được hứng thú học tập cho sinh viên.",
  "Tài liệu học tập đầy đủ, giảng viên giải đáp thắc mắc rõ ràng.",
  "Giảng viên lên lớp đúng giờ, chuẩn bị bài giảng rất chu đáo."
].join("\n");

document.addEventListener("DOMContentLoaded", () => {
  const ratingRadios = document.querySelectorAll('input[name="rating-mode"]');
  const commentsInput = document.getElementById("comments-input");
  const autoNextCheckbox = document.getElementById("auto-next");
  const delaySlider = document.getElementById("delay-time");
  const delayVal = document.getElementById("delay-val");
  const btnFill = document.getElementById("btn-fill");
  const statusMessage = document.getElementById("status-message");
  const statusIndicator = statusMessage.querySelector(".status-indicator");
  const statusText = statusMessage.querySelector(".status-text");
  const delayContainer = document.getElementById("delay-container");

  // Load saved configuration
  chrome.storage.local.get(["ratingMode", "comments", "autoNext", "delayTime"], (result) => {
    // Rating mode
    if (result.ratingMode) {
      const radioToSelect = document.querySelector(`input[name="rating-mode"][value="${result.ratingMode}"]`);
      if (radioToSelect) radioToSelect.checked = true;
    }

    // Comments
    commentsInput.value = result.comments !== undefined ? result.comments : DEFAULT_COMMENTS;

    // Auto next
    if (result.autoNext !== undefined) {
      autoNextCheckbox.checked = result.autoNext;
    }
    toggleDelayContainer(autoNextCheckbox.checked);

    // Delay time
    if (result.delayTime !== undefined) {
      delaySlider.value = result.delayTime;
      delayVal.textContent = `${result.delayTime} giây`;
    }
  });

  // Slider change event
  delaySlider.addEventListener("input", (e) => {
    delayVal.textContent = `${e.target.value} giây`;
  });

  // Auto next toggle event
  autoNextCheckbox.addEventListener("change", (e) => {
    toggleDelayContainer(e.target.checked);
  });

  function toggleDelayContainer(show) {
    delayContainer.style.opacity = show ? "1" : "0.4";
    delayContainer.style.pointerEvents = show ? "auto" : "none";
  }

  // Check active tab URL
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || tabs.length === 0) {
      updateStatus("error", "Không thể truy cập tab.");
      btnFill.disabled = true;
      return;
    }

    const activeTab = tabs[0];
    const url = activeTab.url || "";

    if (url.includes("survey.uit.edu.vn")) {
      updateStatus("success", "Sẵn sàng điền phiếu khảo sát UIT!");
      btnFill.disabled = false;
    } else {
      updateStatus("warning", "Vui lòng mở trang khảo sát UIT.");
      btnFill.disabled = true;
    }
  });

  // Handle Fill & Submit button click
  btnFill.addEventListener("click", () => {
    const selectedRadio = document.querySelector('input[name="rating-mode"]:checked');
    const ratingMode = selectedRadio ? selectedRadio.value : "max";
    const comments = commentsInput.value;
    const autoNext = autoNextCheckbox.checked;
    const delayTime = parseFloat(delaySlider.value);

    // Save configurations
    chrome.storage.local.set({ ratingMode, comments, autoNext, delayTime }, () => {
      // Send message to content script
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0]) {
          updateStatus("neutral", "Đang gửi lệnh tự động điền...");
          
          chrome.tabs.sendMessage(
            tabs[0].id,
            {
              action: "startAutofill",
              config: { ratingMode, comments, autoNext, delayTime }
            },
            (response) => {
              if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
                updateStatus("error", "Lỗi: Hãy load lại trang khảo sát UIT rồi thử lại.");
              } else if (response && response.status === "started") {
                updateStatus("success", "Đã bắt đầu tự động điền!");
              } else {
                updateStatus("error", "Không phản hồi từ trang khảo sát.");
              }
            }
          );
        }
      });
    });
  });

  function updateStatus(type, text) {
    statusMessage.className = ""; // clear all
    statusMessage.classList.add(`status-${type}`);
    statusText.textContent = text;
  }
});
