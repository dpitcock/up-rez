#!/bin/bash

# Simple helper script to run commands inside the Docker container
# Usage: ./uprez [command]

SERVICE="frontend"

case "$1" in
  "build")
    echo "🏗️  Running Production Build Check..."
    docker-compose exec $SERVICE npm run build
    ;;
  "reset")
    echo "🧹 Resetting and Seeding Database..."
    docker-compose exec $SERVICE curl localhost:3030/api/demo/reset -X POST
    ;;
  "logs")
    docker-compose logs -f $SERVICE
    ;;
  "shell")
    docker-compose exec $SERVICE sh
    ;;
  "npx")
    shift
    docker-compose exec $SERVICE npx "$@"
    ;;
  "npm")
    shift
    docker-compose exec $SERVICE npm "$@"
    ;;
  *)
    echo "UpRez CLI Helper"
    echo "----------------"
    echo "Usage: ./uprez [command]"
    echo ""
    echo "Commands:"
    echo "  build   - Run production build check (TypeScript & Routing)"
    echo "  reset   - Reset database and seed initial data"
    echo "  logs    - Follow container logs"
    echo "  shell   - Open a shell inside the container"
    echo "  npm ... - Run any npm command inside the container"
    echo "  npx ... - Run any npx command inside the container"
    ;;
esac
