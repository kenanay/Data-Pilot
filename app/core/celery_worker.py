# app/core/celery_worker.py

import os
from dotenv import load_dotenv
from celery import Celery

# .env dosyasını yükle (mutlaka üstte olmalı)
load_dotenv()

# Redis URL'si .env dosyasından alınır
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery("worker", broker=REDIS_URL, backend=REDIS_URL)

# Görevlerin bulunduğu modüller
celery_app.autodiscover_tasks(["app.tasks"])
