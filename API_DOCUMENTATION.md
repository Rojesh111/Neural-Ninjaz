# BureacyBuster API Documentation

This document provides a comprehensive technical reference for the BureacyBuster backend API.

## Core Architecture
- **Framework**: FastAPI (Python 3.10+)
- **Database**: MongoDB (ODMantic)
- **AI Infrastructure**: Azure OpenAI (GPT-4o Vision & Text)
- **Security**: Double-Layer Hybrid Firewall (ML + LLM Guard Audit)

---

## 📂 Document Upload API

### 1. Upload Personal Document
Ingests identity documents (ID cards, passports) into the secure vault.
- **Endpoint**: `POST /api/upload/personal`
- **Method**: `multipart/form-data`
- **Parameters**:
  - `document_name`: (string) Human-readable name (e.g., "Citizenship Card").
  - `file`: (File) Image file (JPEG/PNG).
- **Behavior**:
  - Sanitizes filename to prevent injection.
  - Stores file in specialized `PERSONAL_STORAGE`.
  - Creates a `PersonalDocument` record in MongoDB.

### 2. Upload Legal Batch
Initiates the vectorless indexing process for a collection of documents.
- **Endpoint**: `POST /api/upload/legal`
- **Method**: `multipart/form-data`
- **Parameters**:
  - `batch_name`: (string) Name for the collection (e.g., "Firm Registration").
  - `files`: (List[File]) Multiple images/PDFs.
- **Behavior**:
  - Groups files into a sanitized directory.
  - Creates a `LegalBatch` record.
  - Triggers an **asynchronous background task** for AI Vision indexing.

### 3. Check Indexing Progress
Retrieves live status for an active legal batch indexing task.
- **Endpoint**: `GET /api/upload/progress/{batch_name}`
- **Response**:
```json
{
  "batch_name": "Firm_Registration",
  "status": "indexing", 
  "total_pages": 5,
  "processed_pages": 2,
  "percentage": 40.0
}
```

---

## 🤖 Agentic Chat API (WebSocket)

The core interaction layer for querying the document index.
- **Endpoint**: `/ws/chat`
- **Protocol**: WebSocket

### Message Lifecycle
1. **Request**: `{ "query": "string", "batch_name": "string" }`
2. **Firewall Scan (Inbound)**:
   - **Layer 1**: ML Classifier pre-scans for injection.
   - **Layer 2 (Escalation)**: Deep security audit via Guard LLM.
3. **Agentic Search**:
   - The AI identifies document headers.
   - Operates a tool-calling loop (`get_subheadings`, `get_paragraph`).
4. **Secure Retrieval**:
   - AI detects intent to access personal vault.
   - Enforces the **Consent Protocol** (must ask user permission).
   - Uses `get_personal_document` with Vision extraction.
5. **Streaming Response (Outbound)**:
   - Filters internal `[THOUGHTS]` reasoning.
   - Delivers finalized `[ANSWER]` in real-time.

---

## 🔍 Discovery API

### 1. List Available Batches
Returns a list of all successfully indexed document batches.
- **Endpoint**: `GET /api/batches`
- **Response**: `{ "batches": ["Firm_Opening", "Property_Deed"] }`

---

## 🛡️ Security Protocols

### Hybrid Firewall Verdicts
| Verdict | Action | UI Response |
| :--- | :--- | :--- |
| **SAFE** | Proceed to Inference | Normal Chat Flow |
| **SUSPICIOUS** | Escalate to Guard AI | "Deep security audit in progress..." |
| **MALICIOUS** | Terminate Session | Red "Security Alert" with Reasoning |

### Zero-Trust Access
- **Vectorless Indexing**: No data is stored in vulnerable vector embeddings; retrieval is directly from structured JSON extracts.
- **Permissioned Tools**: The `get_personal_document` tool is locked behind a strict linguistic consent-check in the Agent's system prompt.
