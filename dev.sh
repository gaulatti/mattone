#!/bin/bash

SESSION_NAME="mattone-dev"

tmux has-session -t $SESSION_NAME 2>/dev/null

if [ $? != 0 ]; then
  # Create new session
  tmux new-session -d -s $SESSION_NAME -n "backend"
  
  # Backend window
  tmux send-keys -t $SESSION_NAME:backend "cd backend" C-m
  tmux send-keys -t $SESSION_NAME:backend "pnpm start:dev" C-m

  # Frontend window
  tmux new-window -t $SESSION_NAME -n "frontend"
  tmux send-keys -t $SESSION_NAME:frontend "cd frontend" C-m
  tmux send-keys -t $SESSION_NAME:frontend "pnpm dev" C-m
  
  # Select backend window
  tmux select-window -t $SESSION_NAME:backend
fi

tmux attach-session -t $SESSION_NAME
