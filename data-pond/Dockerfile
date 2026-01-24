FROM python:3.11-slim

WORKDIR /data-pond

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies for data operations
RUN pip install --no-cache-dir \
    pandas \
    openpyxl \
    requests \
    uuid

# Keep the container running
CMD ["tail", "-f", "/dev/null"]
