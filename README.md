# Automate Accounts Assignment

This is an Express-based Node.js server application that provides OCR-powered receipt processing functionality. It uses SQLite as the database and Prisma as the ORM.

---

## 🚀 Getting Started

### ✅ Prerequisites

- Node.js (latest version recommended)
- npm (comes with Node.js)
- Git

---

## ⚙️ Project Setup

1. **Install Node.js**

   Download and install the latest version from [https://nodejs.org](https://nodejs.org)

2. **Clone the Repository**

   ```bash
   git clone https://github.com/ab11op/automate-accounts-assignment.git
   ```

3. **Navigate to the Project Directory**

   ```bash
   cd automate-accounts-assignment
   ```

4. **Install Dependencies**

   ```bash
   npm install
   ```

5. **Set up Environment Variables**

   - Copy `.env-example` and rename it to `.env`
   - Add/update required environment variables

6. **Database Setup**

   - Delete the existing `prisma/receipts.db` (optional but recommended for fresh start)
   - Run the following to apply migrations:

     ```bash
     npx prisma migrate dev
     ```

---

## 🏃 Running the Project

```bash
npm run dev
```

If you face issues with `nodemon`, install it globally:

```bash
npm install -g nodemon
```

---

## 🗃️ Database

- **Database**: SQLite
- **ORM**: Prisma

Sample database file available in `prisma/receipts.db`

---

## 📁 API Endpoints

### `POST /upload`

- **Description**: Uploads a PDF receipt file.
- **Input**: `multipart/form-data` with a file.
- **Action**: Saves file in `uploads/` and metadata in `receipt_file` table.

---

### `GET /validate/:id`

- **Description**: Validates a file by ID.
- **Response**:

```json
{
  "success": true,
  "message": "Receipt validation complete",
  "invalid_reason": "Valid PDF"
}
```

---

### `GET /receipts/:id`

- **Description**: Get receipt metadata by file ID.
- **Response**:

```json
{
  "message": "receipt fetched",
  "success": true,
  "data": {
    "id": 4,
    "file_name": "beer.pdf",
    "file_path": "uploads/beer.pdf",
    "mime_type": "application/pdf",
    "invalid_reason": null,
    "is_valid": true,
    "is_processed": true,
    "createdAt": "2025-06-29T07:37:48.262Z",
    "updatedAt": "2025-06-29T07:39:00.855Z",
    "is_validated": true
  }
}
```

---

### `GET /receipt?skip=0&limit=5`

- **Description**: Fetch all receipt entries (supports pagination).
- **Response**: Returns an array of receipt file metadata.

---

### `POST /process/:id`

- **Description**: Converts the uploaded PDF to images and uses OCR (Tesseract.js) to extract meaningful data.
- **Returns**: Extracted structured data.

```json
{
  "success": true,
  "info": {
    "merchant": "Check: 985278 Table: 1",
    "date": "11/30/2018",
    "time": "20:05",
    "transactionId": "985278",
    "storeId": "98",
    "cashierId": "Sam (C)",
    "items": [
      {
        "name": "Wing Basket 1200",
        "price": 12,
        "quantity": 1,
        "modifiers": ["BBQ", "Blue Cheese"]
      }
    ],
    "total": 41.14,
    "payment": {
      "method": "MASTERCARD",
      "amount": 41.14
    }
  }
}
```

---

### `GET /processed`

- **Description**: Returns all processed receipts.
- **Response**: Array of processed receipt entries with extracted data.

---

## 🛠️ Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: SQLite
- **ORM**: Prisma
- **OCR**: Tesseract.js
- **PDF to Image**: pdf-to-img
- **Hot Reload**: nodemon

---

## 🧪 Sample Receipts

You can upload sample `.pdf` receipt files for processing. The processing logic handles dynamic layouts and tries to extract data intelligently.

---

## 🧾 Notes

- Ensure uploaded files are PDFs.
- Use Postman or any API client to test endpoints.
- OCR and data extraction accuracy depends on file clarity.

---

## 📬 Contact

For any issues, feel free to open an issue or raise a pull request in the [GitHub repo](https://github.com/ab11op/automate-accounts-assignment).
