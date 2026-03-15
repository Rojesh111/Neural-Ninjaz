# Zero-Trust Document Organizer API Documentation

Welcome to the detailed API documentation for the **Zero-Trust Document Organizer**. This system utilizes a hybrid storage approach (Filesystem for binary data, MongoDB for metadata) and features dual-layer AI processing.

## Base URL
`http://127.0.0.1:8000`

---

## 1. Document Uploads

### 1.1 Upload Personal Document
Uploads a single image as a personal document with a custom identifying name.

- **Endpoint:** `POST /api/upload/personal`
- **Content-Type:** `multipart/form-data`
- **Request Parameters:**
    | Parameter | Type | Required | Description |
    | :--- | :--- | :--- | :--- |
    | `document_name` | `string` | Yes | A human-readable name for the document (e.g., "My Passport"). |
    | `file` | `file` | Yes | The image file to upload. Restricted to image types only. |

- **Internal logic:**
    1. Validates that the file is an image (`image/*`).
    2. Generates a unique UUID for the filename while preserving the original extension.
    3. Saves the file to `media/personal/`.
    4. Creates a `PersonalDocument` record in the MongoDB `personal_document` collection.

- **Success Response (201 Created):**
    ```json
    {
      "message": "Personal document uploaded successfully",
      "doc_id": "64f1x2c...",
      "data": {
        "document_name": "My Passport",
        "original_filename": "passport_photo.png",
        "saved_filepath": "/path/to/media/personal/uuid.png",
        "upload_timestamp": "2026-03-16T12:00:00Z",
        "doc_type": "personal",
        "status": "uploaded"
      }
    }
    ```

---

### 1.2 Upload Legal Documents (Batch)
Uploads multiple files as a single named batch, preserving their original order and triggering AI Vision indexing.

- **Endpoint:** `POST /api/upload/legal`
- **Content-Type:** `multipart/form-data`
- **Request Parameters:**
    | Parameter | Type | Required | Description |
    | :--- | :--- | :--- | :--- |
    | `batch_name` | `string` | Yes | Name of the collection (e.g., "Property Contract 2026"). |
    | `files` | `file[]` | Yes | One or more files (JPG, PNG, or PDF). |

- **Internal logic:**
    1. Validates that all files are allowed types (Image or PDF).
    2. Sanitizes the `batch_name` for use in the filesystem.
    3. Creates a dedicated batch directory at `media/legal/{sanitized_batch}/`.
    4. Save files with a zero-padded index prefix (e.g., `01_page.pdf`, `02_signature.png`) to ensure physical order preservation.
    5. Creates a consolidated `LegalBatch` record in the MongoDB `legal_batch` collection.
    6. **AI Hook:** Automatically triggers `IndexService` in the background to analyze images via Azure OpenAI Vision.

- **Success Response (200 OK):**
    ```json
    {
      "message": "Legal batch uploaded successfully. AI Indexing started.",
      "batch_id": "67a9b3f...",
      "data": {
        "batch_name": "Property_Contract",
        "pages": [
          { "page_number": 1, "filepath": ".../01_intro.pdf" },
          { "page_number": 2, "filepath": ".../02_clause.png" }
        ],
        "status": "uploaded"
      }
    }
    ```

---

## 2. AI Processing Details

### 2.1 Autonomous Page Indexing
When a legal batch is uploaded, the system automatically runs the hierarchical indexing service.

- **Model:** `Azure OpenAI GPT-5.4`
- **Input:** Base64 encoded images of the uploaded documents.
- **Output:** A strict JSON hierarchy following the schema:
    ```json
    {
      "page_number": 1,
      "document_title": "...",
      "content_tree": [
        {
          "node_type": "heading",
          "title": "...",
          "children": [{ "node_type": "subheading", "title": "...", "paragraph_text": "..." }]
        }
      ]
    }
    ```
- **Storage:** The final compiled analysis for the entire batch is saved at `media/json/{batch_name}.json`.

---

## 3. Real-Time Interactions (WebSockets)

### 3.1 Chat Endpoint
Allows real-time interaction with the AI firewall.

- **Endpoint:** `WS /ws/chat`
- **Protocol:** WebSocket
- **Request Format:** Plain text string.
- **Internal Logic:** Messages are intercepted by the `firewall_service` (under development) to ensure zero-trust policy compliance before reaching the AI.
- **Response Format:** Plain text string.

---

## 4. Administrative Interface
A visual dashboard for managing uploaded documents and viewing AI logs.

- **URL:** `/admin`
- **Library:** `Starlette-Admin`
- **Features:** 
    - List/Search documents.
    - View raw metadata.
    - Expand `LegalBatch` nested page structures via the `JSONField` viewer.
