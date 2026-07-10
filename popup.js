// Bắt sự kiện bấm nút Chạy Tool
document.getElementById('btn-run').addEventListener('click', async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab.url && tab.url.includes("quizlet.com")) {
        // Đổi trạng thái hiển thị
        document.querySelector('.dot').style.backgroundColor = '#f39c12';
        document.getElementById('status-text').innerText = 'Đang chạy tự động...';

        // Gọi script vào trang
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: autoFillQuizletImages
        });
    } else {
        alert("Vui lòng mở trang chỉnh sửa từ vựng Quizlet để chạy tool nhé!");
    }
});

// Bắt sự kiện bấm nút Reset
document.getElementById('btn-reset').addEventListener('click', async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.reload(tab.id); // Load lại trang web
});

// Toàn bộ logic lõi của tool được đặt tại đây để Inject
async function autoFillQuizletImages() {
    console.log("[+] Bắt đầu quét các nút bấm...");

    const getAddImageBtns = () => {
        const allElements = document.querySelectorAll('button, div[role="button"], span[role="button"]');
        return Array.from(allElements).filter(el => {
            const text = (el.textContent || '').toLowerCase();
            const aria = (el.getAttribute('aria-label') || '').toLowerCase();
            const isImageBtn = text.includes('image') || text.includes('hình ảnh') || aria.includes('image') || aria.includes('hình ảnh');
            const isNotReportBtn = !text.includes('report') && !aria.includes('report');
            return isImageBtn && isNotReportBtn;
        });
    };

    let imageButtons = getAddImageBtns();
    if (imageButtons.length === 0) {
        alert("Không tìm thấy nút 'Image'. Bạn hãy thử cuộn trang xuống một chút để load UI nhé!");
        return;
    }

    for (let i = 0; i < imageButtons.length; i++) {
        let btn = imageButtons[i];
        try {
            btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await new Promise(r => setTimeout(r, 800));
            btn.click();
            
            let foundImage = false;
            for (let attempt = 0; attempt < 10; attempt++) {
                await new Promise(r => setTimeout(r, 500));
                let images = Array.from(document.querySelectorAll('img')).filter(img => 
                    img.width > 50 && img.height > 50 && !img.src.includes('avatar') && !img.src.includes('icon')
                );

                if (images.length > 0) {
                    let targetToClick = images[0].closest('button') || images[0].closest('div[role="button"]') || images[0];
                    targetToClick.click();
                    foundImage = true;
                    break;
                }
            }

            if (!foundImage) {
                document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
            }
            await new Promise(r => setTimeout(r, 1200));

        } catch (error) {
            console.error(`[!] Lỗi ở từ vựng ${i + 1}:`, error);
        }
    }
    alert(`Hoàn tất! Đã xử lý ${imageButtons.length} từ vựng.`);
}