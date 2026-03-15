# 📖 BureacyBuster User Manual

Welcome to **BureacyBuster**, your specialized AI-powered legal document organizer. This manual will guide you through the initial setup, document indexing, and secure querying of your legal and personal data.

---

## 🛠️ Getting Started

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 18+**
- **MongoDB** (Running locally on default port 27017)
- **Azure OpenAI API Access** (Vision-enabled model deployment)

### 2. Installation
Clone the repository and install dependencies for both the backend and frontend:

**Backend Setup:**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python scripts/train_firewall.py  # Critical: Pre-trains the local security model
```

**Frontend Setup:**
```bash
cd frontend
npm install
```

---

## 📂 Module 1: The Upload Matrix
The **Upload Matrix** is where you ingest documents into Buster's secure, vectorless index.

### 🛡️ Personal Mode (Identity Vault)
- **Purpose**: Use this for high-stakes identity documents (Passport, Citizenship Card).
- **Process**:
    1. Enter a clear **Document Name** (e.g., "Citizenship Card").
    2. Click the upload box or drag an image of the card.
    3. Click **Index Document**.
- **Security**: These documents are stored in an isolated vault and are **only** accessible by the AI if you explicitly grant permission during chat.

### ⚖️ Legal Mode (Batch Processing)
- **Purpose**: Use this for multi-page legal documents (Contracts, Deeds, Bylaws).
- **Process**:
    1. Enter a **Batch Name** (e.g., "Company Bylaws 2026").
    2. Upload multiple pages.
    3. **Interactive Reordering**: Drag and drop the page thumbnails to ensure the logical flow (Page 1, Page 2, etc.).
    4. Click **Commit to Secure Index**.
- **The Progress Overlay**: A full-page progress screen will appear. Do not close this until Buster completes the AI transcription (100%).

---

## 🤖 Module 2: Agentic Chat Interface
The **Agentic Chat** is where you query your indexed documents.

### 1. Starting a Session
- Select your document batch from the dropdown menu in the header.
- Click **Start Session**.
- A status badge will show **"Secure session established"** with a green checkmark ✅.

### 2. Querying the Index
- Type your question in the input bar (e.g., *"What is the minimum capital requirement in these bylaws?"*).
- **Status Indicators**:
    - **🔄 Blue Spinner**: AI is actively searching through document sections or extracting data.
    - **🛡️ Red Shield**: The **Hybrid Firewall** has detected a suspicious prompt. Your request is being audited for security.
    - **🔥 Security Alert**: A prompt injection was detected and blocked.

### 3. Interpreting Output
- Buster uses a **Stream Filtering System**. You will only see the final professional answer. 
- Internal reasoning (Thinking) is hidden to provide a clean, legal-professional experience.

---

## 🔒 Module 3: The Consent Handshake
Buster follows a **Zero-Trust Access** policy for your Personal Vault.

1. **Permission Request**: If you ask a question like *"Fill this form with my citizenship details"*, Buster will pause and ask:
   > *"May I access your Citizenship Card from the secure vault to retrieve this information?"*
2. **Granting Access**: You must explicitly say *"Yes"* or *"You have permission"*.
3. **Automated Extraction**: Buster will then use **Azure Vision** to read your card in real-time, retrieve the data, and provide the answer. It will never look at your vault without this handshake.

---

## 🛡️ Module 4: Security Best Practices
- **Local Firewall**: Buster trains a local ML model on your machine. Always run `python scripts/train_firewall.py` if you update the codebase or find the firewall isn't catching specific roleplay attempts.
- **Sanitization**: All filenames are sanitized automatically. Avoid naming documents with special characters (like `!`, `@`, `#`) for maximum compatibility.

---

## ❓ Troubleshooting

| Issue | Solution |
| :--- | :--- |
| **"Address already in use"** | Your server is already running. Run `fuser -k 8000/tcp` to clear the port. |
| **"Secure Session Terminated"** | The connection was lost. Ensure the Backend (FastAPI) is still running. |
| **Indexing Progress Stalled** | Check the terminal for Azure OpenAI rate limits or API key errors. |
| **Chat shows [THOUGHTS]** | The model is deviating from its formatting instructions. Try refreshing the session. |

---

Developed by **Neural Ninjaz** for the 2026 Bureaucracy Buster Hackathon. 🚀
