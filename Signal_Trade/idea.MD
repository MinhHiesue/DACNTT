# SPECIFICATION DOCUMENT: XAU/USD PATTERN-MATCHING SIGNAL BOT (M5)

## 1. TỔNG QUAN HỆ THỐNG (SYSTEM OVERVIEW)
* **Tài sản giao dịch:** Vàng giao ngay (XAU/USD).
* **Khung thời gian chính (Primary Timeframe):** M5 (5 phút / nến).
* **Triết lý cốt lõi:** **Memory-Based Pattern Matching (So khớp mẫu hình dựa trên ký ức thị trường)**. Hệ thống không dự đoán ngẫu nhiên mà số hóa trạng thái thị trường hiện tại thành Vector đặc trưng (Feature Vector), sau đó so khớp độ tương đồng (Cosine Similarity) với cơ sở dữ liệu các mẫu hình từng thắng lớn trong lịch sử.
* **Mục tiêu triển khai:** Xây dựng luồng xử lý tự động từ việc thu thập dữ liệu, trích xuất đặc trưng, lọc khối lượng, so khớp mẫu hình đến bắn tín hiệu/vào lệnh tự động.

---

## 2. KIẾN TRÚC KỸ THUẬT (SYSTEM ARCHITECTURE)
[Dữ liệu M5 Realtime]
│
▼
[Module 1: Volume Regime Filter] ──(Không đạt ngưỡng)──► [Bỏ qua nến]
│ (Đạt ngưỡng 20% - 85%)
▼
[Module 2: Feature Engineering & Normalization]
└── Trích xuất cửa sổ 15 nến gần nhất thành Vector đặc trưng
│
▼
[Module 3: Similarity Engine (k-NN / Vector Search)]
└── So khớp với "Winning Pattern Database" (Offline pre-computed)
│
▼
[Module 4: Decision & Risk Management Engine]
├── Kiểm tra số lượng mẫu khớp (k >= 10, Cosine Similarity >= 0.85)
├── Tính toán Entry, SL (Swing Low/High), TP kỳ vọng
└── Kiểm tra điều kiện R:R >= 1.5
│ (Thỏa mãn)
▼
[Module 5: Execution / Notification]
└── Gửi Webhook / Telegram Bot Alert / MetaTrader 5 API
---

## 3. ĐẶC TẢ CHI TIẾT CÁC MODULE

### Module 1: Bộ lọc trạng thái khối lượng (Volume Regime Filter)
Mục đích: Loại bỏ các giai đoạn thị trường đóng băng (spread giãn) hoặc biến động cực đoan do tin tức kinh tế (quét râu, trượt giá).

* **Input:** Cột `Volume` (hoặc `Tick_Volume`) của 100 nến M5 gần nhất.
* **Logic tính toán:**
  1. Xác định phân vị 20% ($P_{20}$) và phân vị 85% ($P_{85}$) của mảng 100 giá trị volume gần nhất.
  2. Lấy $Volume_{t}$ của nến M5 vừa đóng cửa.
* **Điều kiện kích hoạt:**
  $$\text{Pass Filter} = \text{True} \iff P_{20} \le Volume_{t} \le P_{85}$$
* **Hành vi:** Nếu trả về `False`, bỏ qua nến này và chờ nến tiếp theo.

---

### Module 2: Trích xuất đặc trưng & Chuẩn hóa (Feature Engineering)
Mục đích: Biến đổi chuỗi 15 nến M5 gần nhất thành một Vector số học độc lập với mức giá tuyệt đối của Vàng.

* **Cửa sổ trích xuất:** $W = 15$ nến M5 liên tiếp ($t-14$ đến $t$).
* **Thành phần của Feature Vector:**
  1. **Normalized Price Curve (Chuỗi giá tương đối):**
     * Chuẩn hóa giá đóng cửa so với nến đầu chuỗi:
       $$\Delta Close_i = Close_i - Close_{t-14} \quad (\text{với } i \in [t-14, t])$$
     * Chuẩn hóa High/Low tương tự: $\Delta High_i = High_i - Close_{t-14}$, $\Delta Low_i = Low_i - Close_{t-14}$.
  2. **Micro Indicators (Các chỉ báo vi mô đi kèm):**
     * **VWAP Distance:** $(Close_t - VWAP_t) / ATR_{14}(t)$ (Đo độ lệch chuẩn hóa theo biên độ dao động).
     * **RSI(7):** Động lượng ngắn hạn tại nến $t$.
     * **Body-to-Wick Ratio:** Tỷ lệ $\vert{}Close_t - Open_t\vert{} / (High_t - Low_t + \epsilon)$ để đo mức độ dứt khoát của phe chi phối.
     * **Normalized Volume Z-Score:** $(Volume_t - \mu_{Vol}) / \sigma_{Vol}$ (Tính trên 20 nến gần nhất).
* **Output:** Một vector 1 chiều có chiều dài cố định $D$ đại diện cho trạng thái thị trường tại thời điểm $t$:
  $$V_t = [\Delta Close_{t-14:t}, \Delta High_{t-14:t}, \Delta Low_{t-14:t}, \text{VWAP\_Dist}, \text{RSI}_7, \text{Body\_Ratio}, \text{Vol\_ZScore}]$$

---

### Module 3: Khai thác mẫu hình lịch sử (Offline Pattern Mining)
Mục đích: Tạo sẵn cơ sở dữ liệu các pha giao dịch thành công trong quá khứ để làm "ký ức" cho bot.

* **Dữ liệu đầu vào:** Lịch sử nến M5 của Vàng (tối thiểu 1 - 2 năm).
* **Quy tắc gán nhãn thành công (Labeling - Triple Barrier):**
  * Tại mỗi nến $T$ thỏa mãn Module 1:
    * Xét trong $H = 12$ nến M5 tiếp theo (1 giờ tới):
      * **Mẫu hình LONG thắng:** Nếu giá tăng chạm $+k \times ATR$ (Take Profit) TRƯỚC KHI chạm đáy thấp nhất của 15 nến trước đó (Stop Loss).
      * **Mẫu hình SHORT thắng:** Nếu giá giảm chạm $-k \times ATR$ (Take Profit) TRƯỚC KHI chạm đỉnh cao nhất của 15 nến trước đó (Stop Loss).
* **Lưu trữ:**
  * Trích xuất Vector đặc trưng của chuỗi 15 nến đứng trước điểm $T$.
  * Lưu vào database (`winning_patterns.parquet` hoặc Vector DB như FAISS / ChromaDB) gồm:
    * `vector`: Vector đặc trưng kích thước $D$.
    * `direction`: 1 (LONG) hoặc -1 (SHORT).
    * `max_favorable_move`: Số giá tối đa đạt được trước khi bị hồi quy.

---

### Module 4: Động cơ so khớp & Ra quyết định (Inference Engine)
Mục đích: Chạy realtime khi có nến mới, đối chiếu vector hiện tại với tập mẫu hình lịch sử.

* **Thuật toán so khớp:** Cosine Similarity giữa vector hiện tại $V_{\text{curr}}$ và toàn bộ $V_{\text{hist}}$ trong kho dữ liệu:
  $$\text{Cosine Similarity}(A, B) = \frac{A \cdot B}{\Vert{}A\Vert{} \Vert{}B\Vert{}}$$
* **Điều kiện kích hoạt tín hiệu:**
  1. Lọc ra danh sách các mẫu trong kho có $\text{Similarity} \ge 0.85$.
  2. Số lượng mẫu tương đồng cùng hướng ($k_{\text{neighbors}}$) phải $\ge 10$.
  3. Tỷ lệ đồng thuận hướng đi (Confidence):
     $$\frac{\text{Count}(\text{LONG})}{\text{Count}(\text{Total Matches})} \ge 0.8 \implies \text{Quyết định: LONG}$$
     (Tương tự với SHORT).

---

### Module 5: Quản trị rủi ro & Định dạng lệnh (Execution Rules)

Khi tín hiệu thỏa mãn Module 4:

* **Entry:** Giá đóng cửa của nến M5 hiện tại ($Close_t$).
* **Stop Loss (SL):**
  * Đối với lệnh LONG: $\min(Low_{t-14:t}) - 0.5 \text{ USD}$ (Đáy của 15 nến setup trừ đi vùng đệm).
  * Đối với lệnh SHORT: $\max(High_{t-14:t}) + 0.5 \text{ USD}$ (Đỉnh của 15 nến setup cộng thêm vùng đệm).
* **Take Profit (TP):**
  * Tính bằng mức chốt lời trung bình của 10 mẫu hình lịch sử khớp nhất, HOẶC cố định theo:
    $$TP = Entry \pm (1.5 \times \vert{}Entry - SL\vert{})$$
* **Bộ lọc R:R tối thiểu (Risk-to-Reward Filter):**
  * Tính toán khoảng cách: $\Delta SL = \vert{}Entry - SL\vert{}$, $\Delta TP = \vert{}Entry - TP\vert{}$.
  * **Điều kiện:** $\frac{\Delta TP}{\Delta SL} \ge 1.5$. Nếu không đạt, hủy tín hiệu ngay lập tức.

---

## 4. STACK CÔNG NGHỆ KHUYẾN NGHỊ

* **Ngôn ngữ:** Python 3.10+
* **Xử lý dữ liệu:** `pandas`, `numpy`, `scipy`
* **Tính toán chỉ báo:** `ta` hoặc `pandas-ta`
* **Vector Search / Machine Learning:** `scikit-learn` (tiện ích cosine_similarity / NearestNeighbors) hoặc `faiss-cpu` (nếu tập dữ liệu mẫu hình > 100,000 vectors).
* **Kết nối & Thực thi:**
  * MetaTrader 5: Thư viện `MetaTrader5` (Python package chính thức của MetaQuotes).
  * Bắn thông báo: `python-telegram-bot` hoặc gửi Webhook Discord.

---

## 5. KẾ HOẠCH TRIỂN KHAI CHO CODING AGENT (STEP-BY-STEP ROADMAP)

### Bước 1: Data Pipeline & Preprocessing
* Viết script tải dữ liệu XAU/USD M5 (Open, High, Low, Close, Volume) tối thiểu 1 năm từ sàn hoặc file CSV.
* Viết class `VolumeFilter` để tính rolling quantile 20% và 85% trên cửa sổ 100 nến.

### Bước 2: Feature Engineering Class
* Viết module nhận vào Dataframe 15 dòng (nến M5), trả về một numpy array 1D chứa các đặc trưng đã chuẩn hóa: chuỗi giá trừ mốc đầu, VWAP distance, RSI(7), Volume Z-Score, Body-to-Wick ratio.

### Bước 3: Pattern Mining Script (Offline)
* Chạy qua toàn bộ dữ liệu lịch sử.
* Tìm các setup đạt TP trước SL theo tỷ lệ R:R $\ge 1.5$.
* Xuất các feature vector kèm nhãn ra file `pattern_memory_bank.pkl` hoặc `.parquet`.

### Bước 4: Realtime Engine & Matching Logic
* Viết script nhận tick/bar realtime từ MetaTrader 5.
* Khi nến M5 đóng:
  1. Kiểm tra Volume Filter.
  2. Trích xuất Feature Vector.
  3. Query vào `pattern_memory_bank` bằng Cosine Similarity.
  4. Nếu $\ge 10$ neighbors có similarity $\ge 0.85$, tính SL, TP và kiểm tra R:R $\ge 1.5$.
  5. In log hoặc gửi lệnh/thông báo Telegram.

### Bước 5: Backtest & Logging
* Chạy backtest trên 3 tháng dữ liệu ngoài tập train (Out-of-sample data) có tính kèm spread Vàng cố định 0.3 USD.
* Đo lường Winrate, Profit Factor, và Max Drawdown.