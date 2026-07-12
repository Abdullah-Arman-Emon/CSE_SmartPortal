// Admin editor for alumni testimonials and industry partners (home page).
import {
    Banner,
    RowsEditor,
    SaveButton,
    parseJson,
    useContentKeys,
} from "./shared";

const KEYS = ["testimonials", "partners"];

export default function CommunityTab({ userId }) {
    const { content, set, save, saving, error, success } = useContentKeys(KEYS, userId);
    if (!content) return <Banner error={error} success={null} />;

    const testimonials = parseJson(content.testimonials, []);
    const partners = parseJson(content.partners, []);

    return (
        <div className="space-y-6">
            <Banner error={error} success={success} />

            <section className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="font-semibold text-slate-800">Alumni testimonials</h3>
                <p className="mt-0.5 text-xs text-slate-400">
                    Shown as a rotating carousel on the home page.
                </p>
                <div className="mt-4">
                    <RowsEditor
                        label="Testimonials"
                        rows={testimonials}
                        onChange={(rows) => set("testimonials", JSON.stringify(rows))}
                        fields={[
                            { name: "name", placeholder: "Name" },
                            { name: "batch", placeholder: "Batch (e.g. Batch 18)" },
                            { name: "role_now", placeholder: "Current role" },
                            { name: "company", placeholder: "Company / University" },
                            { name: "quote", placeholder: "Quote", type: "textarea" },
                            { name: "photo", placeholder: "", type: "image" },
                        ]}
                        addLabel="Add testimonial"
                    />
                </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="font-semibold text-slate-800">Industry & placement partners</h3>
                <p className="mt-0.5 text-xs text-slate-400">
                    Logo/name marquee on the home page. Without a logo the name is shown as text.
                </p>
                <div className="mt-4">
                    <RowsEditor
                        label="Partners"
                        rows={partners}
                        onChange={(rows) => set("partners", JSON.stringify(rows))}
                        fields={[
                            { name: "name", placeholder: "Name (e.g. Google)" },
                            { name: "href", placeholder: "Website (optional)" },
                            { name: "logo_url", placeholder: "", type: "image" },
                        ]}
                        addLabel="Add partner"
                    />
                </div>
            </section>

            <SaveButton onClick={save} saving={saving} />
        </div>
    );
}
