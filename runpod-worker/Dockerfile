# Base image for RunPod
FROM runpod/base:0.4.0-cuda11.8.0

# Install dependencies
RUN python3 -m pip install --upgrade pip
RUN python3 -m pip install runpod pandas

# Create app directory
WORKDIR /app

# Copy code
COPY handler.py /app/handler.py

# Copy historical data from data-pond (ensure context is correct during build)
COPY data/historical_offer_success.csv /app/data/historical_offer_success.csv

# Start the worker
CMD [ "python3", "-u", "/app/handler.py" ]
