"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { compareTemplateVersions } from "@/app/actions/document-workflow";

type TemplateItem = {
  id: string;
  type: string;
  name: string;
  version: number;
  configJson?: Record<string, unknown> | null;
  createdAt: string;
};

function stableStringify(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value !== "object") return String(value);
  try {
    return JSON.stringify(value, Object.keys(value as Record<string, unknown>).sort(), 2);
  } catch {
    return String(value);
  }
}

export default function TemplateVersionsPanel({ templates }: { templates: TemplateItem[] }) {
  const types = useMemo(() => Array.from(new Set(templates.map((t) => t.type))), [templates]);
  const [selectedType, setSelectedType] = useState(types[0] || "");
  const current = useMemo(
    () => templates.filter((t) => t.type === selectedType).sort((a, b) => b.version - a.version),
    [templates, selectedType]
  );
  const [leftId, setLeftId] = useState("");
  const [rightId, setRightId] = useState("");
  const [previewCompareLoading, setPreviewCompareLoading] = useState(false);
  const [previewCompareError, setPreviewCompareError] = useState("");
  const [previewCompare, setPreviewCompare] = useState<{
    left: { id: string; name: string; version: number; preview: Record<string, string | number> };
    right: { id: string; name: string; version: number; preview: Record<string, string | number> };
    diffRows: Array<{ key: string; leftValue: string; rightValue: string }>;
  } | null>(null);

  const left = current.find((t) => t.id === leftId) || current[0] || null;
  const right = current.find((t) => t.id === rightId) || current[1] || null;

  const diffRows = useMemo(() => {
    if (!left || !right) return [];
    const leftCfg = (left.configJson || {}) as Record<string, unknown>;
    const rightCfg = (right.configJson || {}) as Record<string, unknown>;
    const keys = Array.from(new Set([...Object.keys(leftCfg), ...Object.keys(rightCfg)])).sort();
    return keys
      .map((key) => {
        const leftValue = stableStringify(leftCfg[key]);
        const rightValue = stableStringify(rightCfg[key]);
        if (leftValue === rightValue) return null;
        return { key, leftValue, rightValue };
      })
      .filter((row): row is { key: string; leftValue: string; rightValue: string } => Boolean(row));
  }, [left, right]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!left || !right) {
        setPreviewCompare(null);
        return;
      }
      setPreviewCompareLoading(true);
      setPreviewCompareError("");
      const res = await compareTemplateVersions({
        leftTemplateId: left.id,
        rightTemplateId: right.id,
      });
      if (!active) return;
      if (!res.success || !res.left || !res.right || !res.diffRows) {
        setPreviewCompare(null);
        setPreviewCompareError(res.error || "Не вдалося побудувати порівняння");
      } else {
        setPreviewCompare({
          left: res.left,
          right: res.right,
          diffRows: res.diffRows,
        });
      }
      setPreviewCompareLoading(false);
    };
    run();
    return () => {
      active = false;
    };
  }, [left?.id, right?.id]);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm p-6 md:p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Версії шаблонів</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Порівняння версій перед експортом.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Тип документа</label>
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setLeftId("");
              setRightId("");
            }}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
          >
            {types.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Версія A</label>
          <select
            value={left?.id || ""}
            onChange={(e) => setLeftId(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
          >
            {current.map((template) => (
              <option key={template.id} value={template.id}>
                v{template.version} • {template.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Версія B</label>
          <select
            value={right?.id || ""}
            onChange={(e) => setRightId(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
          >
            {current.map((template) => (
              <option key={template.id} value={template.id}>
                v{template.version} • {template.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!left || !right ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Для порівняння потрібно мінімум 2 версії шаблону.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">Версія A</p>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{left.name} (v{left.version})</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(left.createdAt).toLocaleString("uk-UA")}</p>
            </div>
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">Версія B</p>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{right.name} (v{right.version})</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(right.createdAt).toLocaleString("uk-UA")}</p>
            </div>
          </div>

          {diffRows.length === 0 ? (
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
              Конфігурація шаблонів однакова.
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="grid grid-cols-3 bg-gray-50 dark:bg-gray-800 px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300">
                <div>Поле</div>
                <div>Версія A</div>
                <div>Версія B</div>
              </div>
              {diffRows.map((row) => (
                <div key={row.key} className="grid grid-cols-3 px-4 py-2 border-t border-gray-100 dark:border-gray-700 text-xs">
                  <div className="font-semibold text-gray-800 dark:text-gray-200">{row.key}</div>
                  <div className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{row.leftValue || "—"}</div>
                  <div className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{row.rightValue || "—"}</div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Візуальне превʼю шаблонів</h3>
            {previewCompareLoading && (
              <p className="text-sm text-gray-500 dark:text-gray-400">Завантаження порівняння...</p>
            )}
            {previewCompareError && (
              <div className="rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                {previewCompareError}
              </div>
            )}
            {previewCompare && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{previewCompare.left.name} (v{previewCompare.left.version})</p>
                    <div className="space-y-1">
                      {Object.entries(previewCompare.left.preview).map(([key, value]) => (
                        <div key={key} className="text-xs text-gray-700 dark:text-gray-300">
                          <span className="font-semibold">{key}:</span> {String(value)}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{previewCompare.right.name} (v{previewCompare.right.version})</p>
                    <div className="space-y-1">
                      {Object.entries(previewCompare.right.preview).map(([key, value]) => (
                        <div key={key} className="text-xs text-gray-700 dark:text-gray-300">
                          <span className="font-semibold">{key}:</span> {String(value)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {previewCompare.diffRows.length > 0 && (
                  <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-xs text-amber-700 dark:text-amber-300">
                    Відмінностей у превʼю: {previewCompare.diffRows.length}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      <Button variant="secondary" onClick={() => window.history.back()}>
        Назад
      </Button>
    </div>
  );
}
