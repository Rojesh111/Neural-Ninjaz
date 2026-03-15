# BureacyBuster System Workflow

This document illustrates the end-to-end operational flow of the BureacyBuster system, detailing how users, documents, and AI interact within our Zero-Trust architecture.

---

## 🏗️ 1. The Ingestion Pipeline (Legal Mode)
When a user uploads a batch of legal documents, the system follows this workflow:

1. **Upload Trigger**: Frontend sends files to `/api/upload/legal`.
2. **Batch Encapsulation**: Backend group files into a unique batch ID and stores them on disk.
3. **Async Indexing**:
    - An background process iterates through every page.
    - **Vision Extraction**: `GPT-4o (Vision)` analyzes the image and extracts the heading structure, subheadings, and paragraphs.
    - **Master Ledger**: A master JSON is generated, acting as a "Map" for the document (Vectorless Search).
4. **Progress Feedback**: The system updates the `processed_pages` count in MongoDB, which the Frontend polls to show the full-page progress bar.

---

## 🛡️ 2. The Inbound Security Flow (Hybrid Firewall)
Every query sent over WebSocket is scrutinized before reaching the Inference Core:

1. **Query Entry**: User sends a query (e.g., *"How can I open a firm?"*).
2. **Layer 1 (Sentinel ML)**:
    - A local classifier (Random Forest) checks for common injection patterns.
    - If confidence is high and marked "Safe", it proceeds immediately.
3. **Layer 2 (Guard AI Audit)**:
    - If Layer 1 is suspicious, the query is escalated to the **Guard LLM**.
    - The Guard LLM analyzes the query's *intent* to determine if it is a prompt injection or a roleplay attempt.
4. **Hard Block**: If either layer confirms a threat, the WebSocket sends a Red Security Alert and terminates the query.

---

## 🔎 3. Agentic Search & Intelligence Cycle
Once a query is deemed safe, the Agent takes over:

1. **Map Exploration**: The agent receives the top-level headings from the Document Ledger.
2. **Drill-Down Loop**:
    - **Decision**: AI chooses which section to explore based on the query.
    - **Action**: Calls `get_subheadings(section_title)`.
    - **Refinement**: If the answer isn't there, it calls `get_paragraph(subheading)`.
3. **Synthesis**: The AI gathers all required fragments to construct a professional legal answer.

---

## 🔒 4. Secure Personal Retrieval (Consent Protocol)
If the query requires data from personal identity documents:

1. **Need Identification**: AI realizes it needs personal details (e.g., *"I need your passport number to fill this form"*).
2. **Handshake Protocol**:
    - AI **MUST** ask the user: *"May I access your Passport from your secure vault?"*
3. **User Consent**: The user must explicitly reply with permission.
4. **Vault Access**:
    - AI calls `get_personal_document`.
    - System performs a fuzzy search in MongoDB.
    - Image is retrieved and processed by Vision LLM on-the-fly.
    - Results are returned to the AI *without* being stored in a permanent vector db.

---

## 📤 5. Sanitized Output Flow
The final step before delivery to the user:

1. **Reasoning Isolation**: AI generates its reasoning inside `[THOUGHTS]` tags and the answer inside `[ANSWER]`.
2. **Real-time Filtering**: The Backend stream-parser watches for the `[ANSWER]` tag.
3. **UI Delivery**: Only the content after `[ANSWER]` is streamed to the user's screen.
4. **Leakage Protection**: If the AI attempts to start a new reasoning block after the answer, the stream is instantly severed.
