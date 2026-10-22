# Beltloop

A custom harness for my local models running in an ollama container.

This is still very much under construction. Right now, it includes:
* A FastAPI Python server with endpoints to get models and post a message with a response stream, managed sessions, compaction, tools, memory, and context files backed by an SQLite database
* A React frontend built with Vite that can select a model, send, receive messages in a session, manage sessions, context files, and tool configurations

Coming up:
* more tools / integrations
* cron jobs
* containerization

### Is it vibe coded?

No. I could very easily use AI to vibe my way through this, but I myself want the experience of interfacing more deeply with AI and building with Python. I'm still leaning on Claude Code for ideation, creating phases with milestones, specific Python syntax questions, and reviews.

### Why build this?

I tried adding more "agentic" features to my Callback Worker, but the decisioning parts of those features were better left as deterministic; the AI parts of the worker are a few prompts with matching evals that run based on decisions made by code. There are no tools, no routing, and no decisions beyond summarization made by the AI there.

Thus, I figured I would build this for my own edification to dive deeper into how agents tick.

## Running this locally

If your ollama container is not on your development machine, tunnel into the machine with ollama running on it in a separate terminal:
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

### My hardware
I have a desktop PC with an RTX 3070 (8GB VRAM) that fits a 7B model. I might be able to squeeze a 9B model into 8GB, but that's it. This imposes some limitations, but I've made do so far. I have Ollama configured for a max context size of 4096.

## How it all works

#### Messages
They are sent to Ollama along with the targeted model. The response is streamed back to the client. Once the response is done, the backend will save the message to the database. Streaming allows the user to see the response chunks as soon as they are ready.

#### Sessions
They group messages into threads. So the model knows to respond to the whole thread, ALL messages from the session's history are sent to the model. Beltloop allows users to create, rename, and delete sessions. Deleting a session will delete all messages within. All messages must belong to a session.

#### Compaction
Continually piling the entire chat history into the model prompt is problematic for longer conversations and smaller context windows. When the context fills up, I send the history to the model for summary. The generated summary message replaces all the messages that came before it. The messages are still persisted in the session, so change is visible to the user. They are flagged with `is_compacted`, so I can skip sending those with the history context to the model. Progress for this is shown to the user, so they know there's an extra wait for this turn.

#### Context files
I have a persona.md and a user.md that are both editable within Beltloop. They are prepended to every history context so the model gets them on every turn. They are never compacted. They are only editable by the user.

#### Tools
They are defined in code with a `SCHEMA` for usage instructions by the model, a `CONFIG_SCHEMA` so the user can change some settings, and a `handler` that actually runs the code within the Python backend. The arguments passed by the model are merged with the user's configs, and can even override them. For example, for the weather tool, the user can specify a default lat/long for the forecast, but the model can override that, which is useful if the user asks for weather somewhere else. The user configs are stored in the db, unless they are secrets, like in the case of Google Calendar. Then, the config is used to locate the token file instead of storing the tokens in the db. Existing tools are Current Time, Weather, Memory, and Google Calendar.

#### Memory
I made this a tool with remember (write), recall (read), and forget (delete) functionality. Since my context space is limited, and to make recalling actually a worthwhile tool call, the entirety of memory is not added to the history context on every turn. Instead, when the model chooses to remember something, it generates a key that describes the content while having a low probability to collide with other keys. The keys are all appended to context. Then, if the model wishes to recall, it does so by key. Remembering always completely overwrites what was there before. Just like context files, these are shared across sessions. 
