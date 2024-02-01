#!/bin/bash


# Ask the user for the project name (root folder name)
read -p "Pls, Enter Commit Message Here: " COMMIT_MESSAGE

# Set the commit message
COMMIT_MESSAGE="$COMMIT_MESSAGE_$(date +%d-%m-%Y_%H-%M-%S)"

# Change to your local repository directory
# cd /path/to/your/local/repository

# Add all changes to the staging area
git add .

# Commit the changes with the specified message
git commit -m "$COMMIT_MESSAGE"

# Push the changes to the GitHub repository
git push origin master  # Change 'master' to your branch name if different