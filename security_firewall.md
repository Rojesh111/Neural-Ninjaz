# 🛡️ BureacyBuster: Prompt Injection Firewall Architecture

BureacyBuster employs a sophisticated, multi-stage defense system designed to neutralize adversarial attacks, prompt injections, and roleplay-based jailbreaks. This ensures that the AI Agent remains within its legal bounds and never leaks sensitive data.

---

## 🏗️ The Two-Layer Defense Pipeline

The firewall operates as a "Zero-Trust Gateway" before any user query reaches the Inference Core.

### 🌓 Layer 1: Random Forest Probability Analysis
The first line of defense is a high-speed, local **Random Forest Classifier**.
- **The Mechanism**: Every incoming prompt is vectorized and passed through a pre-trained Random Forest model.
- **Probability Scoring**: The model predicts the probability of the prompt being `MALICIOUS` or `SAFE`.
- **Latency-First**: This layer runs in milliseconds on the local server, filtering out 90% of common injection patterns (e.g., "Ignore previous instructions", "System override").
- **Verdict**: If the probability of being malicious exceeds the threshold, the prompt is either dropped immediately or escalated to the next layer for a deeper audit.

### 🌔 Layer 2: Specialized Guard AI Audit
For prompts that are ambiguous or "suspicious," BureacyBuster escalates the query to a **Specialized Guard AI Model** (a "Tiny Gemma" or Guard-tuned LLM).
- **Deep Intent Analysis**: Unlike the first layer, this specialized model analyzes the *linguistic intent* of the user. It looks for cognitive manipulation, social engineering, and recursive roleplay attempts.
- **Strict Guardrails**: This model is explicitly designed *only* for security audits. It doesn't answer the user's question; it strictly returns a `SAFE/UNSAFE` verdict and a reasoning string.
- **Bypass Resistance**: By using a separate model for security, we decouple the "Answering Intelligence" from the "Security Audit," making it nearly impossible for a single prompt to bypass both.

---

## 🚫 The "Drop & Block" Protocol

When a prompt is identified as vulnerable or malicious by either layer:

1. **Immediate Severance**: The backend rejects the request before it ever reaches the Document Retrieval tools or the main LLM.
2. **Session Persistence**: The firewall sends a specific `error` signal to the frontend, which displays a **Red Security Alert** to the user.
3. **Zero-Turn Policy**: No "Thinking" or "Reasoning" chunks are generated for malicious prompts, preventing any information leakage through side-channel analysis.

### **In BureacyBuster, security isn't just a system prompt—it's a verifiable, multi-model infrastructure.** 🛡️🚀
