import { useLiveQuery } from 'dexie-react-hooks';
import { BookOpen, Check, Plus, Settings2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { EmptyState } from '@/components/ui/Card';
import { FieldLabel, TextArea, TextField } from '@/components/ui/Field';
import { Pressable } from '@/components/ui/Pressable';
import { Sheet } from '@/components/ui/Sheet';
import { DataService } from '@/db/DataService';
import { cn } from '@/lib/cn';
import { humanDate } from '@/lib/date';
import { haptic } from '@/lib/haptics';
import { useApp } from '@/store/AppContext';
import type { JournalPair, JournalTemplate } from '@/types';

export function Journal() {
  const { date } = useApp();
  const templates = useLiveQuery(() => DataService.journal.templates(), []);
  const entries = useLiveQuery(() => DataService.journal.entriesForDate(date), [date]);

  const [templateOpen, setTemplateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<JournalTemplate | null>(null);

  const openNewTemplate = () => {
    setEditingTemplate(null);
    setTemplateOpen(true);
  };

  return (
    <div className="px-4 pb-4">
      <div className="mb-3 flex items-center justify-between px-1">
        <p className="text-[15px] text-black/50 dark:text-white/45">{humanDate(date)}</p>
        <Pressable
          onClick={openNewTemplate}
          className="flex items-center gap-1 text-[15px] font-semibold text-ios-blue"
        >
          <Plus size={16} strokeWidth={2.8} />
          Template
        </Pressable>
      </div>

      {templates && templates.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={40} strokeWidth={1.5} />}
          title="No templates yet"
          body="Set the questions once. Every day after that, you only fill in the answers."
          action={
            <Pressable
              onClick={openNewTemplate}
              className="rounded-full bg-ios-blue px-5 py-2.5 text-[16px] font-semibold text-white"
            >
              Create a template
            </Pressable>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {(templates ?? []).map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              date={date}
              pairs={entries?.find((e) => e.templateId === template.id)?.pairs}
              onEditTemplate={() => {
                setEditingTemplate(template);
                setTemplateOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <TemplateEditor
        open={templateOpen}
        onOpenChange={setTemplateOpen}
        template={editingTemplate}
      />
    </div>
  );
}

/**
 * One template for one day. Values save as you leave a field — there is no Save
 * button to forget, which is the whole point of a frictionless log.
 */
function TemplateCard({
  template,
  date,
  pairs,
  onEditTemplate,
}: {
  template: JournalTemplate;
  date: string;
  pairs?: JournalPair[];
  onEditTemplate: () => void;
}) {
  const [draft, setDraft] = useState<JournalPair[]>(() => buildPairs(template.keys, pairs));
  const [saved, setSaved] = useState(false);
  const [addingKey, setAddingKey] = useState(false);
  const [newKey, setNewKey] = useState('');
  const dayRef = useRef(`${date}:${template.id}`);

  /**
   * Re-seed when the day changes underneath us (Time Machine), and fold in
   * saved values as they load. Within the same day the merge keeps prompts the
   * user just added, which have no saved counterpart yet.
   */
  useEffect(() => {
    const key = `${date}:${template.id}`;
    const switchedDay = dayRef.current !== key;
    dayRef.current = key;
    setDraft((current) => {
      const next = buildPairs(template.keys, pairs);
      if (switchedDay) return next;
      const unsaved = current.filter((p) => !next.some((n) => n.key === p.key));
      return [...next, ...unsaved];
    });
  }, [date, template.id, template.keys, pairs]);

  const filled = draft.filter((p) => p.value.trim()).length;

  const persist = async (next: JournalPair[]) => {
    await DataService.journal.save(template.id!, date, next);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1400);
  };

  const setValue = (index: number, value: string) => {
    setDraft((current) => current.map((p, i) => (i === index ? { ...p, value } : p)));
  };

  const addKey = async () => {
    const key = newKey.trim();
    if (!key) return;
    const next = [...draft, { key, value: '' }];
    setDraft(next);
    setNewKey('');
    setAddingKey(false);
    haptic('light');
  };

  return (
    <section className="overflow-hidden rounded-card bg-white shadow-card dark:bg-[#1C1C1E] dark:shadow-none">
      <div className="flex items-center justify-between gap-2 px-4 pb-1 pt-4">
        <div className="min-w-0">
          <h2 className="truncate text-[17px] font-semibold tracking-tight">{template.name}</h2>
          <p className="text-[12px] text-black/40 dark:text-white/40">
            {filled} of {draft.length} answered
            {saved && <span className="ml-2 text-[#30D158]">Saved</span>}
          </p>
        </div>
        <Pressable
          onClick={onEditTemplate}
          aria-label={`Edit ${template.name}`}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-black/30 dark:text-white/30"
        >
          <Settings2 size={18} />
        </Pressable>
      </div>

      <div className="flex flex-col gap-3 p-4">
        {draft.map((pair, index) => (
          <label key={`${pair.key}-${index}`} className="block">
            <span className="mb-1.5 block px-1 text-[13px] font-medium text-black/55 dark:text-white/50">
              {pair.key}
            </span>
            <TextArea
              rows={2}
              value={pair.value}
              placeholder="…"
              onChange={(e) => setValue(index, e.target.value)}
              onBlur={() => persist(draft)}
              className="bg-black/[0.04] text-[16px] dark:bg-white/[0.06]"
            />
          </label>
        ))}

        {addingKey ? (
          <div className="flex items-center gap-2">
            <TextField
              autoFocus
              value={newKey}
              placeholder="New prompt"
              onChange={(e) => setNewKey(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void addKey();
                if (e.key === 'Escape') setAddingKey(false);
              }}
              className="bg-black/[0.04] py-2.5 text-[16px] dark:bg-white/[0.06]"
            />
            <Pressable
              onClick={addKey}
              aria-label="Add prompt"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ios-blue text-white"
            >
              <Check size={18} strokeWidth={3} />
            </Pressable>
            <Pressable
              onClick={() => setAddingKey(false)}
              aria-label="Cancel"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-black/[0.06] dark:bg-white/[0.10]"
            >
              <X size={18} />
            </Pressable>
          </div>
        ) : (
          <Pressable
            onClick={() => setAddingKey(true)}
            className="flex items-center gap-1.5 self-start px-1 text-[15px] font-medium text-ios-blue"
          >
            <Plus size={15} strokeWidth={2.8} />
            Add a prompt for today
          </Pressable>
        )}
      </div>
    </section>
  );
}

function buildPairs(keys: string[], saved?: JournalPair[]): JournalPair[] {
  const byKey = new Map((saved ?? []).map((p) => [p.key, p.value]));
  const base = keys.map((key) => ({ key, value: byKey.get(key) ?? '' }));
  // One-off prompts added on a given day live only in that day's entry.
  const extras = (saved ?? []).filter((p) => !keys.includes(p.key));
  return [...base, ...extras];
}

function TemplateEditor({
  open,
  onOpenChange,
  template,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: JournalTemplate | null;
}) {
  const [name, setName] = useState('');
  const [keys, setKeys] = useState<string[]>(['']);

  useEffect(() => {
    if (!open) return;
    setName(template?.name ?? '');
    setKeys(template?.keys.length ? [...template.keys] : ['']);
  }, [open, template]);

  const save = async () => {
    const cleanKeys = keys.map((k) => k.trim()).filter(Boolean);
    if (!name.trim() || cleanKeys.length === 0) return;
    if (template?.id) {
      await DataService.journal.updateTemplate(template.id, { name: name.trim(), keys: cleanKeys });
    } else {
      await DataService.journal.createTemplate(name.trim(), cleanKeys);
    }
    onOpenChange(false);
  };

  const valid = name.trim().length > 0 && keys.some((k) => k.trim());

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={template ? 'Edit template' : 'New template'}
      action={{ label: 'Save', onClick: save, disabled: !valid }}
      fullHeight
    >
      <div className="flex flex-col gap-5 pb-6">
        <div>
          <FieldLabel>Template name</FieldLabel>
          <TextField
            value={name}
            autoFocus={!template}
            placeholder="Daily review"
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <FieldLabel>Prompts</FieldLabel>
          <div className="flex flex-col gap-2">
            {keys.map((key, index) => (
              <div key={index} className="flex items-center gap-2">
                <TextField
                  value={key}
                  placeholder={index === 0 ? 'Win of the day' : 'Another prompt'}
                  onChange={(e) =>
                    setKeys((current) => current.map((k, i) => (i === index ? e.target.value : k)))
                  }
                />
                <Pressable
                  onClick={() => setKeys((current) => current.filter((_, i) => i !== index))}
                  aria-label="Remove prompt"
                  className={cn(
                    'grid h-10 w-10 shrink-0 place-items-center rounded-full',
                    'bg-black/[0.05] text-black/40 dark:bg-white/[0.08] dark:text-white/40',
                    keys.length === 1 && 'pointer-events-none opacity-30'
                  )}
                >
                  <X size={18} />
                </Pressable>
              </div>
            ))}
          </div>
          <Pressable
            onClick={() => setKeys((current) => [...current, ''])}
            className="mt-2 flex items-center gap-1.5 px-1 text-[15px] font-medium text-ios-blue"
          >
            <Plus size={15} strokeWidth={2.8} />
            Add prompt
          </Pressable>
        </div>

        {template?.id && (
          <Pressable
            onClick={async () => {
              await DataService.journal.removeTemplate(template.id!);
              onOpenChange(false);
            }}
            feedback="warning"
            className="rounded-2xl bg-[#FF453A]/10 py-3 text-[17px] font-semibold text-[#FF453A]"
          >
            Delete template and its entries
          </Pressable>
        )}
      </div>
    </Sheet>
  );
}
