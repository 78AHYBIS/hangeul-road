import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Page } from '../../components/Page';
import { btnPrimary, inputClass, muted } from '../../components/ui';
import {
  COSTS,
  COST_LABEL,
  RESOURCE_TYPES,
  SKILLS,
  SKILL_LABEL,
  TYPE_LABEL,
  type Cost,
  type ResourceType,
  type Skill,
} from '../../content/resources';
import { cleanUrl } from '../../lib/libraryProgress';
import { useAppStore } from '../../lib/storage/store';

export function AddResourcePage() {
  const addCustomResource = useAppStore((s) => s.addCustomResource);
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState<ResourceType>('course');
  const [cost, setCost] = useState<Cost>('free');
  const [skills, setSkills] = useState<Skill[]>([]);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return setError('Give it a name.');
    // Accept "example.com" too: add https:// when the scheme is missing.
    const link = url.trim() && !/^https?:\/\//i.test(url.trim()) ? `https://${url.trim()}` : url;
    if (url.trim() && !cleanUrl(link)) return setError('That link does not look right.');
    const id = await addCustomResource({
      name,
      url: cleanUrl(link),
      type,
      cost,
      skills,
      description,
    });
    navigate(`/library/${encodeURIComponent(id)}`, { replace: true });
  }

  return (
    <Page
      title="Add a resource"
      subtitle="A course, channel or book you found yourself."
      back={{ to: '/library', label: 'Library' }}
    >
      <Card>
        <form onSubmit={(e) => void submit(e)} className="space-y-3">
          <label className="block text-sm font-medium">
            Name
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="block text-sm font-medium">
            Link (optional)
            <input
              className={inputClass}
              inputMode="url"
              autoCapitalize="none"
              placeholder="https://"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium">
              Type
              <select
                className={`${inputClass} min-h-10 dark:bg-stone-900`}
                value={type}
                onChange={(e) => setType(e.target.value as ResourceType)}
              >
                {RESOURCE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABEL[t]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium">
              Cost
              <select
                className={`${inputClass} min-h-10 dark:bg-stone-900`}
                value={cost}
                onChange={(e) => setCost(e.target.value as Cost)}
              >
                {COSTS.map((c) => (
                  <option key={c} value={c}>
                    {COST_LABEL[c]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <fieldset>
            <legend className="text-sm font-medium">Skills</legend>
            <div className="mt-1 flex flex-wrap gap-x-4">
              {SKILLS.map((s) => (
                <label key={s} className="flex min-h-10 items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="size-5 accent-teal-700"
                    checked={skills.includes(s)}
                    onChange={() =>
                      setSkills(skills.includes(s) ? skills.filter((x) => x !== s) : [...skills, s])
                    }
                  />
                  {SKILL_LABEL[s]}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="block text-sm font-medium">
            Short description (optional)
            <textarea
              className={`${inputClass} min-h-20`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-amber-700 dark:text-amber-400">
              {error}
            </p>
          )}
          <button type="submit" className={`${btnPrimary} w-full`}>
            Add to library
          </button>
          <p className={muted}>
            You can make it an active course and add its lessons on the next screen.
          </p>
        </form>
      </Card>
    </Page>
  );
}
