#!/bin/bash

# UpRez RunPod Worker Manager
# Automates Build -> Test -> Push cycle

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | xargs)
fi

# Configuration
DOCKER_USER=${DOCKER_USER:-"dpitcock"}
IMAGE_NAME="up-rez-worker"
TAG="latest"
FULL_IMAGE="${DOCKER_USER}/${IMAGE_NAME}:${TAG}"
REGION=${RUNPOD_DATA_CENTER:-"US-East-1"}

case "$1" in
    build)
        echo "🏗️  Preparing build context for Region: ${REGION}..."
        chmod +x scripts/prepare_runpod_build.sh
        ./scripts/prepare_runpod_build.sh
        
        echo "🐳 Building Docker Image: ${FULL_IMAGE}..."
        docker build -t ${FULL_IMAGE} ./runpod-worker
        echo "✅ Build Complete."
        ;;
        
    test)
        echo "🧪 Running Local Integration Test..."
        # Runs the container in the background
        CONTAINER_ID=$(docker run -d ${FULL_IMAGE} python3 /app/handler.py --test_input '{"input": {"guest": {"is_luxury_loyalty": true}, "property": {"current_adr": 500}}}')
        
        echo "⏳ Waiting for worker output (3s)..."
        sleep 3
        
        echo "📋 Worker Logs:"
        docker logs ${CONTAINER_ID}
        
        echo "🛑 Cleaning up test container..."
        docker stop ${CONTAINER_ID} && docker rm ${CONTAINER_ID}
        echo "✅ Local Test Sequence Finished."
        ;;
        
    push)
        echo "🚀 Pushing ${FULL_IMAGE} to Docker Hub..."
        docker push ${FULL_IMAGE}
        echo "🎉 Image is live! Update your RunPod Endpoint with this tag."
        ;;
        
    *)
        echo "Usage: $0 {build|test|push}"
        echo "Ensure DOCKER_USER and RUNPOD_DATA_CENTER are set in .env"
        exit 1
        ;;
esac
