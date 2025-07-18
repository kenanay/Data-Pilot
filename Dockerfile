FROM python:3.12-slim

# Çalışma dizini oluşturuluyor
WORKDIR /app

# Gerekli dosyalar kopyalanıyor
COPY pyproject.toml poetry.lock* /app/

# Poetry kurulumu
RUN pip install --upgrade pip &&     pip install poetry &&     poetry config virtualenvs.create false &&     poetry install --no-root

# Uygulama dosyaları kopyalanıyor
COPY . /app

# Giriş komutu
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
