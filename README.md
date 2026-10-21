## Beltloop

A custom harness for my local models running in an ollama container.

This is still very much under construction. Right now, it includes
* A FastAPI Python server with endpoints to get models and post a message with a response stream, managed sessions, compaction, tools, memory, and context files
* A React frontend built with Vite that can select a model, send, receive messages in a session, and update context files persona.md and user.md.

Coming up:
* more tools / integrations
* cron jobs
* containerization

A note on how memory works: it does not use an .md file. Instead, it uses the database. It's instructed to create readable keys for each memory. all the memory keys are prepended to the chat history along with the context files. This keeps smaller models from potentially making a mess of the file. It also means I add to the context as minimally as possible, which is more beneficial for smaller windows. The model can decide to recall based on a key that it chose. 

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