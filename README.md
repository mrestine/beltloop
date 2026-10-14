## Beltloop

A custom harness for my local models running in an ollama container.

This is still very much under construction. Right now, it's just
* A FastAPI Python server with endpoints to get models and post a message with a response stream, manage sessions, and context files
* A React frontend built with Vite that can select a model, send, receive messages in a session, and update context files persona.md and user.md.

Coming up:
* theme and styles
* session size management
* agent-editable memory.md
* tools / integrations
* cron jobs
* containerization

I could very easily use AI to vibe my way through this, but I myself want the experience of interfacing more deeply with AI and building with Python. 

I tried adding more "agentic" features to the Callback worker, but the decisioning parts of those features were better left as deterministic; the AI parts of the worker are a few prompts with matching evals that run based on decisions made by code. There are no tools, no routing, and no decisions beyond summarization made by the AI there.

Instead, I am still using a coding assistance agent to plan the project, break it down into steps with milestones, and provide some help when I get stuck. I'm consciously stopping short of letting it write code for me.

Thus, I figured I would build this for my own edification.

Running this locally:

Tunnel into the machine with ollama running on it in a separate terminal (if your ollama container is not on your development machine):
```
ssh -N -L 11434:localhost:11434 you@container-host-box
```

Run the API server:
```
cd backend
uv run uvicorn beltloop.app:app --reload --port 8000
```

Testing the endpoint:
```
curl -N -X POST localhost:8000/chat -d '{"message":"ping"}' -H 'content-type: application/json'
```

Running the frontend in dev mode:
```
cd frontend
npm run dev
```