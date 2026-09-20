import { useLiveQuery } from 'dexie-react-hooks';
import {
  Download,
  FileJson,
  FileText,
  Lock,
  Moon,
  Smartphone,
  Sun,
  Trash2,
  Upload,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { Row, RowGroup } from '@/components/ui/Field';
import { Pressable } from '@/components/ui/Pressable';
import { Sheet } from '@/components/ui/Sheet';
import { DataService } from '@/db/DataService';
import { cn } from '@/lib/cn';
import { downloadFile, readTextFile, stamp } from '@/lib/download';
import { useApp } from '@/store/AppContext';
import type { BackupFile, ThemeMode } from '@/types';

const THEMES: Array<{ value: ThemeMode; label: string; Icon: typeof Sun }> = [
  { value: 'system', label: 'Automatic', Icon: Smartphone },
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
];

export function Settings() {
  const { settings, setTheme } = useApp();
  const [message, setMessage] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const counts = useLiveQuery(() => DataService.analytics.totals(), []);

  const flash = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(null), 2600);
  };

  const exportJSON = async () => {
    const data = await DataService.backup.exportJSON();
    downloadFile(`life-os-backup-${stamp()}.json`, JSON.stringify(data, null, 2), 'application/json');
    flash('Backup saved to your downloads.');
  };

  const exportMarkdown = async () => {
    const md = await DataService.backup.exportMarkdown();
    downloadFile(`life-os-archive-${stamp()}.md`, md, 'text/markdown');
    flash('Archive saved to your downloads.');
  };

  const importJSON = async (file: File) => {
    try {
      const text = await readTextFile(file);
      const parsed = JSON.parse(text) as BackupFile;
      await DataService.backup.importJSON(parsed);
      flash('Backup restored.');
    } catch (error) {
      flash(error instanceof Error ? error.message : 'That file could not be restored.');
    }
  };

  return (
    <div className="flex flex-col gap-6 px-4 pb-4">
      <section>
        <h2 className="mb-2 px-1 text-[13px] font-semibold text-black/45 dark:text-white/45">
          Appearance
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map(({ value, label, Icon }) => {
            const active = (settings?.theme ?? 'system') === value;
            return (
              <Pressable
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-card py-4 text-[14px] font-medium',
                  active
                    ? 'bg-ios-blue text-white'
                    : 'bg-white text-black/60 shadow-card dark:bg-[#1C1C1E] dark:text-white/60 dark:shadow-none'
                )}
              >
                <Icon size={20} />
                {label}
              </Pressable>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-2 px-1 text-[13px] font-semibold text-black/45 dark:text-white/45">
          Punctuality
        </h2>
        <RowGroup>
          <Row>
            <div className="flex-1">
              <p className="text-[17px]">Grace period</p>
              <p className="text-[13px] text-black/45 dark:text-white/45">
                Finish within this window and it still counts as on time.
              </p>
            </div>
            <select
              value={settings?.graceMinutes ?? 5}
              onChange={(e) => DataService.settings.save({ graceMinutes: Number(e.target.value) })}
              className="rounded-lg bg-black/[0.05] px-2.5 py-1.5 text-[15px] text-ios-blue dark:bg-white/[0.10]"
            >
              {[0, 5, 10, 15, 30].map((m) => (
                <option key={m} value={m}>
                  {m} min
                </option>
              ))}
            </select>
          </Row>
        </RowGroup>
      </section>

      <section>
        <h2 className="mb-2 px-1 text-[13px] font-semibold text-black/45 dark:text-white/45">
          Your data
        </h2>
        <RowGroup>
          <Row onClick={exportJSON}>
            <FileJson size={20} className="text-ios-blue" />
            <div className="flex-1">
              <p className="text-[17px]">System backup</p>
              <p className="text-[13px] text-black/45 dark:text-white/45">
                A .json file that restores everything exactly.
              </p>
            </div>
            <Download size={18} className="text-black/25 dark:text-white/25" />
          </Row>

          <Row onClick={exportMarkdown}>
            <FileText size={20} className="text-ios-blue" />
            <div className="flex-1">
              <p className="text-[17px]">Readable archive</p>
              <p className="text-[13px] text-black/45 dark:text-white/45">
                A .md file of every day, for reading anywhere.
              </p>
            </div>
            <Download size={18} className="text-black/25 dark:text-white/25" />
          </Row>

          <Row onClick={() => fileInput.current?.click()}>
            <Upload size={20} className="text-ios-blue" />
            <div className="flex-1">
              <p className="text-[17px]">Restore from backup</p>
              <p className="text-[13px] text-black/45 dark:text-white/45">
                Replaces what is on this device.
              </p>
            </div>
          </Row>
        </RowGroup>

        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void importJSON(file);
            e.target.value = '';
          }}
        />
      </section>

      <section>
        <RowGroup>
          <Row>
            <Lock size={20} className="text-[#30D158]" />
            <div className="flex-1">
              <p className="text-[17px]">Stored on this device only</p>
              <p className="text-[13px] leading-snug text-black/45 dark:text-white/45">
                Life OS has no account, no server and no analytics. Everything lives in this
                browser&rsquo;s database, which also means clearing site data erases it — keep a
                backup.
              </p>
            </div>
          </Row>
        </RowGroup>
      </section>

      <section>
        <RowGroup>
          <Row onClick={() => setConfirmReset(true)}>
            <Trash2 size={20} className="text-[#FF453A]" />
            <span className="flex-1 text-[17px] text-[#FF453A]">Erase everything</span>
          </Row>
        </RowGroup>
        {counts && (
          <p className="mt-2 px-1 text-[13px] text-black/40 dark:text-white/40">
            {counts.habits} habits, {counts.tasks} tasks and {counts.journals} journal entries across{' '}
            {counts.days} days
          </p>
        )}
      </section>

      {message && (
        <p className="rounded-2xl bg-black/[0.05] px-4 py-3 text-center text-[15px] dark:bg-white/[0.08]">
          {message}
        </p>
      )}

      <Sheet open={confirmReset} onOpenChange={setConfirmReset} title="Erase everything">
        <div className="flex flex-col gap-3 pb-4">
          <p className="text-[15px] leading-snug text-black/60 dark:text-white/55">
            This deletes every habit, task and journal entry on this device. There is no undo and no
            copy anywhere else. Export a backup first if you might want any of it back.
          </p>
          <Pressable
            onClick={async () => {
              await DataService.backup.clearAll();
              setConfirmReset(false);
              flash('Everything erased.');
            }}
            feedback="warning"
            className="rounded-2xl bg-[#FF453A] py-3.5 text-[17px] font-semibold text-white"
          >
            Erase everything
          </Pressable>
          <Pressable
            onClick={() => setConfirmReset(false)}
            className="rounded-2xl bg-black/[0.06] py-3.5 text-[17px] font-semibold dark:bg-white/[0.10]"
          >
            Keep my data
          </Pressable>
        </div>
      </Sheet>
    </div>
  );
}
