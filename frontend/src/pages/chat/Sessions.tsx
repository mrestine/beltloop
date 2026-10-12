import { useState } from 'react';
import { useEffectOnce } from 'react-use';
import { type Session } from '@reinstorm/types';

interface SessionsProps {
  selectedSession: number | null;
  handleSessionSelect: (id: number) => void;
}

interface SessionRowProps {
  session?: Session;
  isSelected: boolean;
  handleSessionDelete: (id: number) => void;
  handleSessionSave: (session: Partial<Session>) => void;
  handleSessionSelect: (id: number) => void;
}

function SessionRow({
  session,
  isSelected,
  handleSessionDelete,
  handleSessionSave,
  handleSessionSelect,
}: SessionRowProps) {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>(session?.title || '');

  function handleSave() {
    handleSessionSave({ ...session, title: inputValue });
    setIsEditing(false);
    if (!session) {
      setInputValue('');
    }
  }

  return (
    <div>
      {!session && !isEditing ? (
        <>
          <button onClick={() => setIsEditing(true)}>+</button>
        </>
      ) : isEditing ? (
        <>
          <input value={inputValue} onChange={(ev) => setInputValue(ev.target.value)} />
          <button onClick={() => handleSave()}>save</button>
          <button onClick={() => setIsEditing(false)}>back</button>
        </>
      ) : (
        <>
          <span
            onClick={() => handleSessionSelect(session!.id)}
            style={{ color: isSelected ? 'darkred' : '' }}
          >
            {session!.title}
          </span>
          <button onClick={() => setIsEditing(true)}>e</button>
          <button onClick={() => handleSessionDelete(session!.id)}>x</button>
        </>
      )}
    </div>
  );
}

function Sessions({ selectedSession, handleSessionSelect }: SessionsProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  function fetchSessions() {
    fetch('http://localhost:8000/sessions')
      .then((res) => res.json())
      .then((data) => {
        setSessions(data);
        // TODO: Change this to persist across nav (local storage?)
        if (data.length && selectedSession === null) {
          handleSessionSelect(data[data.length - 1].id);
        }
        setLoading(false);
      });
  }

  function handleSessionCreate(title: string) {
    fetch('http://localhost:8000/sessions', {
      method: 'post',
      body: JSON.stringify({
        title: title,
      }),
      headers: { 'Content-Type': 'Application/JSON' },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data) {
          alert('could not create session');
        }
        fetchSessions();
      });
  }
  function handleSessionUpdate(session: Partial<Session>) {
    fetch(`http://localhost:8000/sessions/${session.id}`, {
      method: 'put',
      body: JSON.stringify({
        title: session.title,
      }),
      headers: { 'Content-Type': 'Application/JSON' },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data) {
          alert('could not update session');
        }
        fetchSessions();
      });
  }
  function handleSessionSave(session: Partial<Session>) {
    if (session.id) {
      handleSessionUpdate(session);
    } else {
      handleSessionCreate(session.title!);
    }
  }

  function handleSessionDelete(sessionId: number) {
    fetch(`http://localhost:8000/sessions/${sessionId}`, {
      method: 'delete',
    }).then(fetchSessions);
  }

  useEffectOnce(() => {
    fetchSessions();
  });

  return loading ? (
    <div>sessions loading...</div>
  ) : (
    <>
      {sessions.map((s) => (
        <SessionRow
          key={s.id}
          session={s}
          isSelected={s.id === selectedSession}
          handleSessionDelete={handleSessionDelete}
          handleSessionSave={handleSessionSave}
          handleSessionSelect={handleSessionSelect}
        />
      ))}
      <SessionRow
        isSelected={false}
        handleSessionDelete={handleSessionDelete}
        handleSessionSave={handleSessionSave}
        handleSessionSelect={handleSessionSelect}
      />
    </>
  );
}

export default Sessions;
