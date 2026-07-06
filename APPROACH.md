# Biz LogicX portal approach

## Goal
Build a real, multi-user shipment portal that replaces the browser-only prototype with a secure web application.

## What changed
- Added a Node.js + Express backend.
- Added user authentication with login and registration.
- Stored shipment records in MongoDB instead of localStorage.
- Each user only sees their own shipments.
- Kept the New Shipment workflow as the first fully working end-to-end feature.

## Architecture
- Frontend: static HTML/CSS/JavaScript served from the Node app.
- Backend: REST API with auth and shipment endpoints.
- Database: MongoDB, using MongoDB Atlas in production and an in-memory MongoDB instance for local development.

## Deployment plan
1. Push the project to GitHub.
2. Create a MongoDB Atlas cluster and copy the connection string.
3. Deploy the app to Render or Railway.
4. Set environment variables: JWT_SECRET, MONGODB_URI, PORT.

## Current status
The local version is running and supports:
- user registration and login
- secure shipment creation
- per-user shipment listing
