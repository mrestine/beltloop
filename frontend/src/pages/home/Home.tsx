import Card from '@beltloop/components/Card/Card';

function Home() {
  return (
    <Card>
      <h2>Home</h2>
      <p>(cool imagery goes here)</p>
      <p>
        This is my scratch build AI harness. It runs locally and is powered by models hosted by an
        Ollama container.
      </p>
      <p>
        It is TypeScript/React on the frontend and Python and SQLite on the backend. I have been
        using this frontend tech for many years, but this is my first foray into Python.
      </p>
      <p>
        Currently, it can manage chat sessions, provide context files, tools access, memory
        capabilities, and compact threads as needed.
      </p>
      <p>
        Soon, it will have more tool access, containerization, other integrations, and cron jobs.
      </p>
    </Card>
  );
}

export default Home;
