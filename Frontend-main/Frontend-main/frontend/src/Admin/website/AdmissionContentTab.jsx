// Admin editor for the admission-hub page copy: cycle banner, "how to apply"
// steps, and admission FAQs. Rendered inside the Programs tab.
import {
    Banner,
    Field,
    RowsEditor,
    SaveButton,
    inputCls,
    parseJson,
    useContentKeys,
} from "./shared";

const KEYS = ["admission_cycle", "admission_steps", "admission_faqs"];

export default function AdmissionContentTab({ userId }) {
    const { content, set, save, saving, error, success } = useContentKeys(KEYS, userId);
    if (!content) return <Banner error={error} success={null} />;

    const cycle = parseJson(content.admission_cycle, { open: false, label: "", deadline_iso: "" });
    const steps = parseJson(content.admission_steps, []);
    const faqs = parseJson(content.admission_faqs, []);

    const setCycle = (patch) => set("admission_cycle", JSON.stringify({ ...cycle, ...patch }));

    return (
        <div className="mb-8 space-y-6 rounded-xl border border-indigo-100 bg-indigo-50/40 p-5">
            <div>
                <h3 className="font-semibold text-slate-800">Admission Hub page content</h3>
                <p className="mt-0.5 text-xs text-slate-400">
                    Banner, "how to apply" steps and FAQs shown on /admission-hub.
                </p>
            </div>
            <Banner error={error} success={success} />

            <div className="grid gap-4 sm:grid-cols-3">
                <label className="flex items-center gap-2 self-end pb-2 text-sm text-slate-600">
                    <input type="checkbox" checked={!!cycle.open}
                        onChange={(e) => setCycle({ open: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-300" />
                    Admissions open (show banner)
                </label>
                <Field label="Banner label">
                    <input className={inputCls} value={cycle.label || ""}
                        placeholder="Applications open for the 2026-27 session"
                        onChange={(e) => setCycle({ label: e.target.value })} />
                </Field>
                <Field label="Deadline (for the countdown)">
                    <input type="datetime-local" className={inputCls}
                        value={(cycle.deadline_iso || "").slice(0, 16)}
                        onChange={(e) => setCycle({ deadline_iso: e.target.value })} />
                </Field>
            </div>

            <RowsEditor
                label='"How to apply" steps'
                rows={steps}
                onChange={(rows) => set("admission_steps", JSON.stringify(rows))}
                fields={[
                    { name: "title", placeholder: "Step title", wide: true },
                    { name: "description", placeholder: "Step description", type: "textarea" },
                ]}
                addLabel="Add step"
            />

            <RowsEditor
                label="Admission FAQs"
                rows={faqs}
                onChange={(rows) => set("admission_faqs", JSON.stringify(rows))}
                fields={[
                    { name: "q", placeholder: "Question", wide: true },
                    { name: "a", placeholder: "Answer", type: "textarea" },
                ]}
                addLabel="Add question"
            />

            <SaveButton onClick={save} saving={saving} />
        </div>
    );
}
