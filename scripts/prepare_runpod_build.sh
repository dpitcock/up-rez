#!/bin/bash

# Preparation script for RunPod Custom Worker build
# This script syncs the necessary historical data from the data-pond 
# into the runpod-worker folder so Docker can bundle it.

# 1. Create data directory if not exists
mkdir -p runpod-worker/data

# 2. Copy historical success data
echo "📊 Syncing historical data from data-pond..."
cp data-pond/sources/historical_offer_success.csv runpod-worker/data/

# 3. Inform user
echo "✅ Data synced to runpod-worker/data/"
echo "🚀 You can now run: docker build -t youruser/up-rez-worker ./runpod-worker"
