# EATOMO Admin AI Chatbot

Muc tieu cua module nay:
- Tao dataset train tu du lieu that hien co (MongoDB) + du lieu gia lap co logic nghiep vu.
- Train baseline ML model cho bai toan admin (cancel risk + delay risk).
- Phuc vu prediction qua API cho chatbot admin.

## Cau truc

- data/raw: ban sao du lieu that trich tu DB.
- data/synthetic: du lieu don hang gia lap.
- data/processed: dataset train dau ra (JSONL + CSV).
- data/exports: thong ke va metadata dataset.
- models: file model da train.
- scripts/build_dataset.js: tao dataset train.
- scripts/train_baseline.js: train baseline logistic regression theo target.
- src/api/server.js: API prediction don gian.

## Dieu kien truoc khi chay

1. Backend EATOMO da co du lieu (da seed).
2. MongoDB dang chay.
3. File backend/.env co MONGO_URI hop le.

## Lenh chay nhanh

Tu thu muc backend/admin-ai-chatbot:

1. Tao dataset

   npm run dataset:build

2. Train model

  npm run train:all

3. Chay API model

   npm run serve:model

## Dau ra

- Dataset:
  - data/processed/orders_training_dataset.jsonl
  - data/processed/orders_training_dataset.csv
- Bao cao dataset:
  - data/exports/dataset_report.json
- Model:
  - models/cancel_risk_baseline.json
  - models/delay_risk_baseline.json

## Ghi chu logic gia lap

- Phan phoi status, payment method, voucher usage duoc suy ra tu du lieu that.
- Gia tri subtotal/tax/shipping/discount tuan thu logic backend hien tai.
- Don moi gan hien tai co xac suat cao hon o trang thai pending/preparing.
- Labels chinh:
  - label_cancelled
  - label_delay_risk
  - label_payment_unpaid

## API hien co

- POST /predict/cancel-risk
- POST /predict/delay-risk
- POST /chat/admin
