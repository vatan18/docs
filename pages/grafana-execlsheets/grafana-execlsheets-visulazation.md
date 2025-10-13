* Upload or sync any Excel file
* Automatically ingest it into a database
* Visualize it in Grafana instantly
* Deploy it anywhere with **a single `docker-compose up`**

No Ansible this time — just Docker, Python, and Grafana (with full automation).

---

## 🚀 Goal

> “A portable Grafana + PostgreSQL + Python pipeline that visualizes Excel files automatically.”

You’ll be able to:

1. Drop an Excel file into a folder.
2. Run `docker-compose up`.
3. Visit Grafana and see charts automatically populated.

---

## 🧱 Tech Stack

| Component                        | Purpose                 |
| -------------------------------- | ----------------------- |
| **Grafana**                      | Visualization UI        |
| **PostgreSQL**                   | Store Excel data        |
| **Python (Pandas + SQLAlchemy)** | Read Excel → Push to DB |
| **Docker Compose**               | One-command deployment  |

---

## 📁 Folder Structure

```
grafana-excel-visualizer/
├── docker-compose.yml
├── grafana/
│   ├── dashboards/
│   │   └── excel_dashboard.json
│   └── provisioning/
│       ├── datasources/datasource.yml
│       └── dashboards/dashboard.yml
├── python/
│   ├── requirements.txt
│   └── excel_to_db.py
├── data/
│   └── sample.xlsx
├── .env
└── README.md
```

---

## ⚙️ Step 1 — `docker-compose.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: grafana
      POSTGRES_PASSWORD: grafana
      POSTGRES_DB: excel_data
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  grafana:
    image: grafana/grafana:latest
    depends_on:
      - postgres
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    ports:
      - "3000:3000"
    volumes:
      - ./grafana/provisioning:/etc/grafana/provisioning
      - ./grafana/dashboards:/var/lib/grafana/dashboards

  loader:
    build: ./python
    volumes:
      - ./data:/data
    environment:
      - DB_URL=postgresql://grafana:grafana@postgres:5432/excel_data
      - EXCEL_FILE=/data/sample.xlsx
    depends_on:
      - postgres
    command: ["python", "excel_to_db.py"]

volumes:
  postgres_data:
```

---

## 🐍 Step 2 — `python/excel_to_db.py`

```python
import os
import pandas as pd
import sqlalchemy
import time

DB_URL = os.getenv("DB_URL")
EXCEL_FILE = os.getenv("EXCEL_FILE")
TABLE_NAME = "excel_data"

def wait_for_db(engine, retries=10, delay=5):
    for i in range(retries):
        try:
            with engine.connect():
                print("✅ Database is ready!")
                return True
        except Exception as e:
            print(f"⏳ Waiting for DB... {i+1}/{retries}")
            time.sleep(delay)
    raise RuntimeError("❌ Database connection failed!")

def main():
    engine = sqlalchemy.create_engine(DB_URL)
    wait_for_db(engine)
    df = pd.read_excel(EXCEL_FILE)
    df.to_sql(TABLE_NAME, engine, if_exists="replace", index=False)
    print(f"✅ {len(df)} rows loaded into '{TABLE_NAME}' table from {EXCEL_FILE}")

if __name__ == "__main__":
    main()
```

---

## 📦 Step 3 — `python/Dockerfile`

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY excel_to_db.py .
CMD ["python", "excel_to_db.py"]
```

---

## 📜 Step 4 — `python/requirements.txt`

```
pandas
sqlalchemy
psycopg2-binary
openpyxl
```

---

## 📊 Step 5 — Grafana Auto Provisioning

### `grafana/provisioning/datasources/datasource.yml`

```yaml
apiVersion: 1
datasources:
  - name: PostgreSQL
    type: postgres
    access: proxy
    url: postgres:5432
    database: excel_data
    user: grafana
    secureJsonData:
      password: grafana
    jsonData:
      sslmode: disable
```

### `grafana/provisioning/dashboards/dashboard.yml`

```yaml
apiVersion: 1
providers:
  - name: 'Excel Dashboards'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    options:
      path: /var/lib/grafana/dashboards
```

---

## 📈 Step 6 — Optional Sample Dashboard

You can export a dashboard from Grafana later,
but let’s keep a placeholder file:
`grafana/dashboards/excel_dashboard.json`

```json
{
  "id": null,
  "title": "Excel Data Visualization",
  "timezone": "browser",
  "panels": [],
  "schemaVersion": 36,
  "version": 1
}
```

---

## ⚡ Step 7 — `.env` (Optional)

```bash
POSTGRES_USER=grafana
POSTGRES_PASSWORD=grafana
POSTGRES_DB=excel_data
```

---

## 🚀 Run Everything

```bash
git clone https://github.com/<yourname>/grafana-excel-visualizer.git
cd grafana-excel-visualizer
docker-compose up -d --build
```

Then visit 👉 **[http://localhost:3000](http://localhost:3000)**

* **Username:** admin
* **Password:** admin

In Grafana, select the **PostgreSQL** data source → query your `excel_data` table → build charts instantly.

---

## 🔁 Update Workflow

Whenever your Excel file changes:

```bash
docker-compose run --rm loader
```

It’ll reload data into PostgreSQL automatically.

---

## 🧠 Future Enhancements

* Watcher service to auto-reload Excel on file change (using Watchdog).
* Add Grafana dashboard auto-refresh.
* Add Grafana API export/import via CI/CD.
* Store dashboards and data backups in S3.