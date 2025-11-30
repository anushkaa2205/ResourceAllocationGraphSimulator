FROM python:3.11-slim

WORKDIR /app

COPY backend/ /app/backend/

RUN pip install --no-cache-dir flask flask-cors networkx matplotlib reportlab pillow

EXPOSE 5000

CMD ["python", "/app/backend/backend.py"]
