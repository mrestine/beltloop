import { useState } from 'react';
import { useEffectOnce } from 'react-use';
import { type Session } from '@beltloop/types';
import IconButton from '@beltloop/components/IconButton';
import { Plus, Save, Edit, Delete, ChevronDown, ArrowLeft } from 'lucide-react';

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
    <div className="session-row">
      {!session && !isEditing ? (
        <>
          <IconButton
            type="secondary"
            icon={Plus}
            label="create session"
            onClick={() => setIsEditing(true)}
          />
        </>
      ) : isEditing ? (
        <>
          <input value={inputValue} onChange={(ev) => setInputValue(ev.target.value)} />
          <span className="session-actions">
            <IconButton type="secondary" icon={Save} onClick={() => handleSave()} label="save" />
            <IconButton
              type="secondary"
              icon={ArrowLeft}
              onClick={() => setIsEditing(false)}
              label="back"
            />
          </span>
        </>
      ) : (
        <>
          <span
            onClick={() => handleSessionSelect(session!.id)}
            className={`session ${isSelected ? 'selected' : ''}`}
          >
            {session!.title}
          </span>
          <span className="session-actions">
            <IconButton
              type="secondary"
              icon={Edit}
              label="edit"
              onClick={() => setIsEditing(true)}
            />
            <IconButton
              type="secondary"
              icon={Delete}
              label="delete"
              onClick={() => handleSessionDelete(session!.id)}
            />
          </span>
        </>
      )}
    </div>
  );
}

function Sessions({ selectedSession, handleSessionSelect }: SessionsProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
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

  function _handleSessionSelect(sessionId: number) {
    setIsExpanded(false);
    handleSessionSelect(sessionId);
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

  const selectedSessionName = sessions.find((s) => s.id === selectedSession)?.title;

  return loading ? (
    <div className="session-select">sessions loading...</div>
  ) : (
    <>
      <div className="session-select">
        <span className="session-select-content" onClick={() => setIsExpanded(!isExpanded)}>
          Session:&nbsp;
          {selectedSessionName}
          <ChevronDown className={`chevron ${isExpanded ? 'expanded' : ''}`} size={16} />
        </span>
        {isExpanded ? (
          <div className="session-dropdown">
            {sessions.map((s) => (
              <SessionRow
                key={s.id}
                session={s}
                isSelected={s.id === selectedSession}
                handleSessionDelete={handleSessionDelete}
                handleSessionSave={handleSessionSave}
                handleSessionSelect={_handleSessionSelect}
              />
            ))}
            <SessionRow
              isSelected={false}
              handleSessionDelete={handleSessionDelete}
              handleSessionSave={handleSessionSave}
              handleSessionSelect={_handleSessionSelect}
            />
          </div>
        ) : null}
      </div>
    </>
  );
}

export default Sessions;
