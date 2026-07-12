// Shared primitives for the Website Content admin tabs.
// Mirrors the patterns used inside AdminWebsite.jsx (Field/ImagePicker/save loop)
// so new tabs behave identically to the existing ones.
import { useEffect, useState } from "react";
import axios from "axios";
import { Plus, Save, Trash2, Upload } from "lucide-react";
import { toast } from "../../components/ui/toast";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const inputCls =
    "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

export async function uploadFile(file) {
    const data = new FormData();
    data.append("file", file);
    const res = await axios.post(`${BACKEND_URL}/utility/upload`, data, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.url; // "/resources/<name>"
}

export const parseJson = (raw, fallback) => {
    try {
        const v = JSON.parse(raw);
        return v ?? fallback;
    } catch {
        return fallback;
    }
};

export function Field({ label, hint, children }) {
    return (
        <label className="block">
            <span className="text-sm font-medium text-slate-600">{label}</span>
            {hint && <span className="ml-2 text-xs text-slate-400">{hint}</span>}
            <div className="mt-1">{children}</div>
        </label>
    );
}

export function Banner({ error, success }) {
    if (!error && !success) return null;
    return (
        <div
            className={`mb-4 px-4 py-2 rounded-lg text-sm ${
                error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
            }`}
        >
            {error || success}
        </div>
    );
}

export function ImagePicker({ value, onChange, accept = "image/*", label = "Upload" }) {
    const [busy, setBusy] = useState(false);
    return (
        <div className="flex items-center gap-3">
            {value && accept.startsWith("image") && (
                <img src={value} alt="" className="w-14 h-14 rounded object-cover border" />
            )}
            <input
                className={inputCls}
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                placeholder="URL or upload →"
            />
            <label className="inline-flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm cursor-pointer whitespace-nowrap">
                <Upload size={14} /> {busy ? "…" : label}
                <input
                    type="file"
                    accept={accept}
                    className="hidden"
                    onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        setBusy(true);
                        try {
                            onChange(await uploadFile(f));
                        } catch {
                            toast.error("Upload failed");
                        } finally {
                            setBusy(false);
                            e.target.value = "";
                        }
                    }}
                />
            </label>
        </div>
    );
}

/**
 * Load a set of site_content keys and save them back through the generic
 * upsert endpoint — the same flow the existing tabs use.
 */
export function useContentKeys(keys, userId) {
    const [content, setContent] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        axios
            .get(`${BACKEND_URL}/guest/site/content?keys=${keys.join(",")}`)
            .then((res) => setContent(res.data || {}))
            .catch(() => setError("Could not load content"));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const set = (key, value) => setContent((c) => ({ ...c, [key]: value }));

    const save = async () => {
        setSaving(true);
        setError(null);
        try {
            for (const key of keys) {
                await axios.put(`${BACKEND_URL}/admin/site/content/${key}?user_id=${userId}`, {
                    value: content[key] || "",
                });
            }
            setSuccess("Saved — the public pages update immediately");
        } catch (e) {
            setError(e.response?.data?.detail || "Save failed");
        } finally {
            setSaving(false);
        }
    };

    return { content, set, save, saving, error, success };
}

export function SaveButton({ onClick, saving }) {
    return (
        <div className="flex justify-end">
            <button
                onClick={onClick}
                disabled={saving}
                className="inline-flex items-center gap-1 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm disabled:opacity-50"
            >
                <Save size={16} /> {saving ? "Saving…" : "Save all"}
            </button>
        </div>
    );
}

/**
 * Generic repeatable-row editor for a JSON-array content key.
 * `fields` = [{ name, placeholder, wide?, type? ("text"|"textarea"|"image") }]
 */
export function RowsEditor({ label, hint, rows, onChange, fields, addLabel = "Add row" }) {
    const update = (i, name, value) => {
        const next = rows.map((r, j) => (j === i ? { ...r, [name]: value } : r));
        onChange(next);
    };
    const empty = Object.fromEntries(fields.map((f) => [f.name, ""]));

    return (
        <Field label={label} hint={hint}>
            <div className="space-y-3">
                {rows.map((row, i) => (
                    <div key={i} className="rounded-lg border border-slate-200 p-3">
                        <div className="grid gap-2 sm:grid-cols-2">
                            {fields.map((f) =>
                                f.type === "textarea" ? (
                                    <textarea
                                        key={f.name}
                                        className={`${inputCls} sm:col-span-2`}
                                        rows={2}
                                        placeholder={f.placeholder}
                                        value={row[f.name] || ""}
                                        onChange={(e) => update(i, f.name, e.target.value)}
                                    />
                                ) : f.type === "image" ? (
                                    <div key={f.name} className="sm:col-span-2">
                                        <ImagePicker
                                            value={row[f.name]}
                                            onChange={(url) => update(i, f.name, url)}
                                        />
                                    </div>
                                ) : (
                                    <input
                                        key={f.name}
                                        className={`${inputCls} ${f.wide ? "sm:col-span-2" : ""}`}
                                        placeholder={f.placeholder}
                                        value={row[f.name] || ""}
                                        onChange={(e) => update(i, f.name, e.target.value)}
                                    />
                                )
                            )}
                        </div>
                        <button
                            onClick={() => onChange(rows.filter((_, j) => j !== i))}
                            className="mt-2 inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
                        >
                            <Trash2 size={14} /> Remove
                        </button>
                    </div>
                ))}
                <button
                    onClick={() => onChange([...rows, { ...empty }])}
                    className="text-sm text-indigo-600 inline-flex items-center gap-1"
                >
                    <Plus size={14} /> {addLabel}
                </button>
            </div>
        </Field>
    );
}
