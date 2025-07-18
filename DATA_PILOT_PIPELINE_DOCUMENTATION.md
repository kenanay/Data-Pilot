# Data Pilot Pipeline – Complete Developer & UX/UI Documentation

> **One file to rule them all** – Every requirement, component, API, test and flow distilled into a single, copy-paste-ready `.md`.

---

## 0. TL;DR

- **File storage** → only backend (`/upload`, `/files/{file_id}`).  
- **Frontend** → React (Vite) + Tailwind + Shadcn/UI.  
- **Backend** → FastAPI + Pydantic + SQLModel (SQLite in dev, Postgres in prod).  
- **State** → in-memory `PipelineContext` (session-scoped) + snapshots on disk.  
- **Logs** → WebSocket `SSE /ws/logs`.  
- **Security** → JWT (`Authorization: Bearer <token>`) on every route.  
- **AI prompt chain** → `/api/interpret` endpoint turns natural language into a sequence of pipeline calls.  
- **Test pyramid** → pytest (unit) + FastAPI TestClient (integration) + Storybook (UI).

---

## 1. High-Level Architecture

```
┌────────────────────────────┐        ┌────────────────────────┐
│       React Dashboard      │  WS    │      FastAPI           │
│  (Stepper, Cards, Logs)    │◄──────►│  /api/*                │
└────────────────────────────┘        └──────────┬───────────┘
                                                 │
                                                 ▼
┌────────────────────────────────┐
│   Local / S3 / MinIO storage  │
│   snapshots/   uploads/       │
└────────────────────────────────┘
```

---

## 2. Pipeline Steps & API Surface

| Step            | Endpoint                   | Method | Payload / Query                     | Returns                       |
|-----------------|----------------------------|--------|-------------------------------------|-------------------------------|
| 1. Upload       | `/api/upload`              | POST   | multipart/form-data file            | `{file_id}`                   |
| 2. Preview      | `/api/preview`             | GET    | `?file_id=`                         | `{head: [], summary: {}}`     |
| 3. Clean        | `/api/clean`               | POST   | `{file_id, actions:[{col,op,arg}]}` | `{snapshot_id}`               |
| 4. Analyze      | `/api/analyze`             | POST   | `{file_id, type, params}`           | `{result}`                    |
| 5. Visualize    | `/api/visualize`           | POST   | `{file_id, chart_type, cols}`       | PNG bytes (inline)            |
| 6. Model        | `/api/model`               | POST   | `{file_id, algo, target, feats}`    | `{metrics, model_id}`         |
| 7. Report       | `/api/report`              | POST   | `{file_id, sections[]}`             | PDF download URL              |
| 8. Convert      | `/api/convert`             | POST   | `{file_id, to_format}`              | `{download_url}`              |
| 9. Schema       | `/api/schema-validate`     | POST   | `{file_id, schema_json}`            | `{valid:bool, errors:[]}`     |
| Undo/Redo       | `/api/rollback`            | POST   | `{snapshot_id}`                     | `{new_state}`                 |
| Live Logs       | `/ws/logs/{session_id}`    | WS     | —                                   | SSE events                    |
| AI Chain        | `/api/interpret`           | POST   | `{prompt}`                          | `{steps:[...]}`               |

---

## 3. Pipeline State Schema

`GET /api/state?session_id=xyz`

```json
{
  "session_id": "xyz",
  "current_file_id": "abc123",
  "steps": [
    {
      "step": "upload",
      "status": "completed",
      "timestamp": "2025-07-19T09:00:00Z"
    },
    {
      "step": "clean",
      "status": "completed",
      "action": "fillna",
      "params": {"columns": ["age"], "method": "mean"},
      "snapshot_id": "snp456"
    }
  ],
  "undo_stack": ["snp123"],
  "redo_stack": [],
  "logs": [
    {
      "event": "clean_executed",
      "detail": "Filled NaN in age with mean",
      "time": "2025-07-19T09:01:00Z"
    }
  ]
}
```

## 4. UI Components (React + Tailwind)

### 4.1 Stepper

```tsx
// components/PipelineStepper.tsx
import { CheckCircle, Circle } from 'lucide-react';

const steps = ["Upload","Preview","Clean","Analyze","Visualize","Model","Report","Convert","Schema"];

export default function PipelineStepper({ current }: {current:number}) {
  return (
    <nav className="flex items-center space-x-3">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center">
          {i <= current ? 
            <CheckCircle className="w-6 h-6 text-green-600" /> :
            <Circle className="w-6 h-6 text-gray-400" />
          }
          <span className="ml-2 text-sm">{s}</span>
          {i < steps.length-1 && <span className="mx-2 text-gray-300">›</span>}
        </div>
      ))}
    </nav>
  );
}
```

### 4.2 Pipeline Card

```tsx
// components/PipelineCard.tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PipelineCard({title, status, details, onRollback, onLog}) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{details}</p>
        <div className="flex space-x-2 mt-2">
          <Button size="sm" variant="outline" onClick={onRollback}>↶ Undo</Button>
          <Button size="sm" variant="ghost" onClick={onLog}>Log</Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 4.3 Live Log Panel (WebSocket)

```tsx
// hooks/useLogs.ts
import { useEffect, useState } from 'react';

export default function useLogs(sessionId:string) {
  const [logs, setLogs] = useState<any[]>([]);
  
  useEffect(() => {
    const ws = new WebSocket(`/ws/logs/${sessionId}`);
    ws.onmessage = (e) => setLogs(prev => [...prev, JSON.parse(e.data)]);
    return () => ws.close();
  }, [sessionId]);
  
  return logs;
}
```

## 5. Backend Snippets (FastAPI)

### 5.1 Upload & Snapshot

```python
# routers/upload.py
from fastapi import APIRouter, UploadFile, File, Depends
from services.storage import save_file, create_snapshot
from schemas import UploadResponse

router = APIRouter(prefix="/api")

@router.post("/upload", response_model=UploadResponse)
async def upload(file: UploadFile = File(...), user=Depends(get_current_user)):
    file_id = await save_file(file)
    await create_snapshot(file_id, step="upload")
    return {"file_id": file_id}
```

### 5.2 Clean & Rollback

```python
# routers/clean.py
@router.post("/clean")
async def clean(req: CleanRequest, user=Depends(get_current_user)):
    df = await load_df(req.file_id)
    df = df.fillna({col: req.params.get("method") for col in req.columns})
    snapshot_id = await create_snapshot(req.file_id, step="clean", df=df)
    return {"snapshot_id": snapshot_id}
```

## 6. Storybook Stories

```tsx
// stories/PipelineStepper.stories.tsx
import PipelineStepper from '@/components/PipelineStepper';

export default { component: PipelineStepper, title: 'Pipeline/Stepper' };

export const Step3 = { args: { current: 2 } };
```

```bash
npm i -D @storybook/react-vite
npx storybook dev
```

## 7. Test Examples

### 7.1 Pytest (Backend)

```python
# tests/test_upload.py
def test_upload_csv(client):
    with open("tests/fixtures/test.csv", "rb") as f:
        resp = client.post("/api/upload", files={"file": ("test.csv", f, "text/csv")})
    assert resp.status_code == 200
    assert "file_id" in resp.json()
```

### 7.2 Playwright (E2E)

```typescript
// e2e/pipeline.spec.ts
test('full flow', async ({ page }) => {
  await page.goto('/');
  await page.setInputFiles('input[type="file"]', 'test.csv');
  await page.getByRole('button', { name: /upload/i }).click();
  await expect(page.locator('text=Preview')).toBeVisible();
  await page.getByRole('button', { name: /undo/i }).click();
  await expect(page.locator('text=rolled back')).toBeVisible();
});
```

## 8. AI Prompt Chain Example

**User prompt:**
```
upload test.csv, fill missing age with median, plot age vs income, export pdf
```

**Backend /api/interpret:**
```json
{
  "steps": [
    {"endpoint":"/api/upload","files":["test.csv"]},
    {"endpoint":"/api/clean","body":{"columns":["age"],"method":"median"}},
    {"endpoint":"/api/visualize","body":{"chart":"scatter","x":"age","y":"income"}},
    {"endpoint":"/api/report","body":{"format":"pdf"}}
  ]
}
```

## 9. Wireframes

Use any of these tools and embed the PNG/SVG exports inside this repo under `/docs/wireframes/`:

- **Excalidraw** – quick free-hand sketches.
- **Penpot** – reusable design-system components.
- **Draw.io** – flowcharts & architecture diagrams.

## 10. Project Bootstrap Commands

```bash
# backend
python -m venv venv && source venv/bin/activate
pip install fastapi[all] sqlmodel pandas scikit-learn
uvicorn main:app --reload

# frontend
npm create vite@latest data-pilot --template react-ts
cd data-pilot && npm i tailwindcss postcss autoprefixer @radix-ui/react-* lucide-react
npm run dev
```

## 11. Deployment Checklist

- [ ] Dockerfile for backend (python:3.11-slim) + multi-stage build.
- [ ] docker-compose.yml (backend, postgres, nginx).
- [ ] GitHub Actions → pytest + playwright + storybook build.
- [ ] S3 / MinIO for file storage in prod.
- [ ] JWT secret via environment variable JWT_SECRET.

## 12. Final One-Page Cheat-Sheet

| What | Where / How |
|------|-------------|
| Upload file | POST /api/upload (multipart) |
| Preview | GET /api/preview?file_id= |
| Clean NA | POST /api/clean {columns:["age"],method} |
| Undo | POST /api/rollback {snapshot_id} |
| Live logs | WebSocket /ws/logs/{session_id} |
| AI chain | POST /api/interpret {prompt} |
| Storybook | npm run storybook |
| Tests | pytest + npx playwright test |
| UI components | src/components/* |
| State shape | /api/state JSON |

---

## Ekstra: Gelişmiş Pipeline, Rollback, AI Asistan ve Canlı Log

### Pipeline Yönetimi ve State Takibi
- Her işlem, pipeline context'ine step olarak kaydedilir.
- İşlem geçmişi, kullanıcıya stepper/progress bar ile gösterilir.
- Adım atlama, ileri/geri alma (undo/redo) mümkündür.

### Rollback (Undo/Redo) Özelliği
- Her kritik işlemden sonra otomatik snapshot alınır.
- Kullanıcı "Son işlemi geri al" dediğinde, bir önceki snapshot'a dönülür.
- Tüm rollback/redo olayları loglanır.

### AI Asistan Prompt Zinciri
- Her adım prompt ile tetiklenebilir.
- "Dosya yükle → önizle → temizle → analiz → görselleştir → raporla" gibi zincirli istekler otomatik context'e dönüştürülür.
- Prompt chain, UI veya API aracılığıyla yönetilebilir.

### Canlı Log & Telemetri
- Her işlem ve hata, canlı log sistemine kaydedilir.
- Kullanıcıya gerçek zamanlı log paneli sunulur.
- Tüm loglar telemetri panelinde analiz edilir, iyileştirme fırsatları belirlenir.

#### Örnek Canlı Log Paneli
```
[20:10:00] Dosya yüklendi (test.csv)
[20:10:02] Önizleme tamamlandı
[20:10:07] Temizlik yapıldı (fillna-age-mean)
[20:10:09] Rollback: Son adım geri alındı
[20:10:12] Korelasyon analizi yapıldı
[20:10:15] PDF rapor hazır
```

---

**© 2025 Kenan AY - Data Pilot Pipeline Documentation**
**All Rights Reserved - Proprietary Software**