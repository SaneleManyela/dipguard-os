# DipGuard OS Security Audit & Threat Modeling Report

## 1. Executive Summary

A zero-trust Static Application Security Testing (SAST) and threat modeling assessment was performed on the **DipGuard OS** Node.js API gateway and orchestration layer. The audit targeted the newly implemented `backend/` services, specifically the Express server configuration, scanner routes, and the `quant_orchestrator.ts` Python bridge.

The architectural posture reveals significant foundational risks typical of early-stage scaffolding. The absence of input sanitization at the API boundary, coupled with unauthenticated endpoints and unsafe theoretical process execution patterns, creates critical vulnerabilities. If deployed to production, these flaws could lead to unauthenticated remote code execution (RCE), denial of service (DoS), and severe data integrity compromises.

## 2. Vulnerability Ledger Matrix

| ID | Vulnerability Title | Severity Rating | OWASP / CWE Mapping |
| :--- | :--- | :--- | :--- |
| **SEC-01** | Missing Input Validation & Sanitization on `/scan` | **Critical** | OWASP A03:2021 (Injection) / CWE-20 |
| **SEC-02** | Unauthenticated API Endpoints | **High** | OWASP A01:2021 (Broken Access Control) / CWE-285 |
| **SEC-03** | Potential Command Injection via `quant_orchestrator` | **Critical** | OWASP A03:2021 (Injection) / CWE-77 |
| **SEC-04** | Overly Permissive CORS Configuration | **Medium** | OWASP A05:2021 (Security Misconfiguration) / CWE-346 |
| **SEC-05** | Lack of Rate Limiting & DoS Protection | **Medium** | OWASP A04:2021 (Insecure Design) / CWE-770 |

---

## 3. Detailed Vulnerability Breakdowns

### SEC-01: Missing Input Validation & Sanitization on `/scan`
**Description & Root Cause:**
The `/api/scan` endpoint in `backend/routes/scanner.ts` destructures `ticker` directly from `req.body` without any schema validation or type checking. It trusts the client payload implicitly, violating the Zero-Trust Input Pillar.

**The Exploit Scenario & Edge Case Vector:**
An attacker sends a crafted payload with a massive string, a deeply nested JSON object, or NoSQL injection operators (e.g., `{"ticker": {"$ne": null}}`). Because `ticker` is passed directly to the orchestrator and downstream Python agents, unexpected types could crash the Python parsing engine or cause unhandled exceptions in the Node process (failing open or causing DoS).

**Remediation Code Blueprint:**
Implement strict Zod schema validation at the route boundary.

*Before:*
```typescript
router.post('/scan', async (req, res) => {
    const { ticker } = req.body;
    // ...
});
```
*After:*
```typescript
import { z } from 'zod';

const ScanRequestSchema = z.object({
    ticker: z.string().min(1).max(10).regex(/^[A-Z0-9]+$/)
});

router.post('/scan', async (req, res) => {
    const parseResult = ScanRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
        return res.status(400).json({ success: false, error: "Invalid payload parameters" });
    }
    const { ticker } = parseResult.data;
    // ...
});
```

### SEC-02: Unauthenticated API Endpoints
**Description & Root Cause:**
The Express server initializes routes without any authentication middleware. Any internet-facing request can hit `/api/scan` and trigger expensive LLM API calls and local python processes.

**The Exploit Scenario & Edge Case Vector:**
An automated botnet discovers the endpoint and blasts `/api/scan` requests. Not only does this exhaust API rate limits (Gemini API), resulting in a financial denial of service (FinDoS), but it also starves the server's thread pool.

**Remediation Code Blueprint:**
Enforce IAM / Bearer token validation on all routes.

*Before:*
```typescript
app.use('/api', scannerRouter);
```
*After:*
```typescript
import { requireAuth } from '../middleware/auth';
// Zero-trust enforcement on API boundary
app.use('/api', requireAuth, scannerRouter);
```

### SEC-03: Potential Command Injection via `quant_orchestrator`
**Description & Root Cause:**
In `backend/services/quant_orchestrator.ts`, the `exec` module from `child_process` is imported. While currently stubbed, if `exec` is implemented by passing the `ticker` argument directly into a shell string (e.g., `exec('python agent.py ' + args.ticker)`), it creates a catastrophic OS command injection vector.

**The Exploit Scenario & Edge Case Vector:**
An attacker passes `{"ticker": "NVDA; rm -rf /"}`. The shell evaluates the semicolon and executes the destructive payload under the Node.js user's privileges.

**Remediation Code Blueprint:**
Never use `exec` with untrusted input. Use `spawn` with an array of arguments to bypass shell evaluation entirely.

*Before (Theoretical Vulnerable State):*
```typescript
import { exec } from 'child_process';
exec(`python agent.py ${args.ticker}`, (err, stdout) => { ... });
```
*After:*
```typescript
import { spawn } from 'child_process';
// Arguments are passed securely bypassing shell evaluation
const child = spawn('python', ['agent.py', args.ticker]);
```

### SEC-04: Overly Permissive CORS Configuration
**Description & Root Cause:**
`backend/server.ts` uses `app.use(cors())` with no arguments. This sets `Access-Control-Allow-Origin: *`, allowing any malicious website to force a victim's browser to send requests to the API.

**The Exploit Scenario & Edge Case Vector:**
While currently unauthenticated, if session cookies or internal tokens are later added, an attacker site could perform Cross-Site Request Forgery (CSRF) via XHR, reading sensitive financial scans or triggering malicious capital allocation jobs on behalf of the victim.

**Remediation Code Blueprint:**
Restrict CORS strictly to the frontend production and local dev URLs.

*Before:*
```typescript
app.use(cors());
```
*After:*
```typescript
app.use(cors({
    origin: ['http://localhost:5173', 'https://dipguard.production.com'],
    methods: ['GET', 'POST'],
    credentials: true
}));
```

---

## 4. Secure Architecture Recommendations

To mature this platform in alignment with the **Google Cloud Architecture Framework (Security Pillar)** and **NIST SP 800-144**:

1. **Defense-in-Depth for LLM Integrations**: The Gemini LLM responses must be treated as **untrusted user input**. If LLM outputs are fed into the Python quant engine (e.g., for parsing thesis states), or rendered in React, strict validation (JSON schemas for the LLM) and output encoding (DOMPurify in React) must be applied to prevent LLM Prompt Injection and Stored XSS.
2. **Secret Lifecycle Management**: The `.env` file path `../.env` relies on local filesystem structures. In GCP Cloud Run, rely exclusively on **Google Cloud Secret Manager**. Mount secrets directly into memory as environment variables at runtime rather than relying on `.env` files which risk supply-chain leakage.
3. **Fail-Closed Resilience**: Implement strict timeouts on the Python Orchestrator using `AbortController`. If Python hangs during a market crash, the Node API must fail explicitly with a 503 rather than holding open connections and exhausting the Event Loop.
4. **Least Privilege Microservices**: When containerized (Docker), the Node.js server and Python engine must run as unprivileged, non-root users (`USER node`). The network boundary between Node and Python should be restricted via VPC Serverless Connector rules if split into microservices.