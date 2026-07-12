// Admin editor for every home-page section (hero, ticker, highlights,
// research, achievements, FAQ, CTA, featured faculty). All values live in
// site_content keys served by /guest/site/content and rendered by HomePage.
import { useEffect, useState } from "react";
import axios from "axios";
import {
    Banner,
    Field,
    RowsEditor,
    SaveButton,
    inputCls,
    parseJson,
    useContentKeys,
} from "./shared";
import { ICON_NAMES, getIcon } from "../../components/public/iconMap";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const HOME_KEYS = [
    "home_hero",
    "announcement_ticker",
    "home_highlights",
    "research_showcase",
    "achievements_showcase",
    "faqs",
    "home_cta",
    "home_featured_people",
];

function Section({ title, sub, children }) {
    return (
        <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-semibold text-slate-800">{title}</h3>
            {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
            <div className="mt-4 space-y-4">{children}</div>
        </section>
    );
}

function IconHint() {
    return (
        <span title={ICON_NAMES.join(", ")}>
            icon names: {ICON_NAMES.slice(0, 6).join(", ")}… (hover for all)
        </span>
    );
}

export default function HomeTab({ userId }) {
    const { content, set, save, saving, error, success } = useContentKeys(HOME_KEYS, userId);
    const [people, setPeople] = useState([]);

    useEffect(() => {
        axios
            .get(`${BACKEND_URL}/guest/site/people`)
            .then((res) => setPeople((res.data || []).filter((p) => p.is_active !== false)))
            .catch(() => {});
    }, []);

    if (!content) return <Banner error={error} success={null} />;

    const hero = parseJson(content.home_hero, {});
    const ticker = parseJson(content.announcement_ticker, { enabled: true, items: [] });
    const highlights = parseJson(content.home_highlights, []);
    const research = parseJson(content.research_showcase, []);
    const achievements = parseJson(content.achievements_showcase, []);
    const faqs = parseJson(content.faqs, []);
    const cta = parseJson(content.home_cta, {});
    const featured = (parseJson(content.home_featured_people, []) || []).map(Number);

    const setHero = (patch) => set("home_hero", JSON.stringify({ ...hero, ...patch }));
    const setCta = (patch) => set("home_cta", JSON.stringify({ ...cta, ...patch }));
    const setTicker = (patch) =>
        set("announcement_ticker", JSON.stringify({ ...ticker, ...patch }));

    const toggleFeatured = (id) => {
        const next = featured.includes(id)
            ? featured.filter((f) => f !== id)
            : [...featured, id];
        set("home_featured_people", JSON.stringify(next));
    };

    return (
        <div className="space-y-6">
            <Banner error={error} success={success} />

            <Section title="Hero" sub="The full-screen opening section with the 3D animation.">
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Title (before the highlighted word)">
                        <input className={inputCls} value={hero.title || ""}
                            onChange={(e) => setHero({ title: e.target.value })} />
                    </Field>
                    <Field label="Highlighted word (gradient)">
                        <input className={inputCls} value={hero.highlight_word || ""}
                            onChange={(e) => setHero({ highlight_word: e.target.value })} />
                    </Field>
                </div>
                <Field label="Subtitle">
                    <textarea className={inputCls} rows={2} value={hero.subtitle || ""}
                        onChange={(e) => setHero({ subtitle: e.target.value })} />
                </Field>
                <Field label="Badges (one per line)" hint="small chips above the title">
                    <textarea className={inputCls} rows={2}
                        value={(hero.badges || []).join("\n")}
                        onChange={(e) =>
                            setHero({ badges: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })
                        } />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Primary button label / link">
                        <div className="flex gap-2">
                            <input className={inputCls} value={hero.primary_cta?.label || ""}
                                placeholder="Apply for Admission"
                                onChange={(e) => setHero({ primary_cta: { ...hero.primary_cta, label: e.target.value } })} />
                            <input className={inputCls} value={hero.primary_cta?.href || ""}
                                placeholder="/apply"
                                onChange={(e) => setHero({ primary_cta: { ...hero.primary_cta, href: e.target.value } })} />
                        </div>
                    </Field>
                    <Field label="Secondary button label / link">
                        <div className="flex gap-2">
                            <input className={inputCls} value={hero.secondary_cta?.label || ""}
                                placeholder="Explore Programs"
                                onChange={(e) => setHero({ secondary_cta: { ...hero.secondary_cta, label: e.target.value } })} />
                            <input className={inputCls} value={hero.secondary_cta?.href || ""}
                                placeholder="/admission-hub"
                                onChange={(e) => setHero({ secondary_cta: { ...hero.secondary_cta, href: e.target.value } })} />
                        </div>
                    </Field>
                </div>
            </Section>

            <Section title="Announcement ticker" sub="Thin scrolling strip under the hero.">
                <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                    <input type="checkbox" checked={!!ticker.enabled}
                        onChange={(e) => setTicker({ enabled: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-300" />
                    Show the ticker
                </label>
                <RowsEditor
                    label="Items"
                    rows={ticker.items || []}
                    onChange={(items) => setTicker({ items })}
                    fields={[
                        { name: "text", placeholder: "Announcement text", wide: true },
                        { name: "href", placeholder: "Link (optional, e.g. /apply)", wide: true },
                    ]}
                    addLabel="Add announcement"
                />
            </Section>

            <Section title='"Why CSEDU" highlights' sub="Three feature bullets next to the about text.">
                <RowsEditor
                    label="Highlights"
                    hint={<IconHint />}
                    rows={highlights}
                    onChange={(rows) => set("home_highlights", JSON.stringify(rows))}
                    fields={[
                        { name: "icon", placeholder: "icon (e.g. trophy)" },
                        { name: "title", placeholder: "Title" },
                        { name: "description", placeholder: "Description", type: "textarea" },
                    ]}
                    addLabel="Add highlight"
                />
            </Section>

            <Section title="Research areas & labs" sub="Dark grid section on the home page.">
                <RowsEditor
                    label="Research cards"
                    hint={<IconHint />}
                    rows={research}
                    onChange={(rows) => set("research_showcase", JSON.stringify(rows))}
                    fields={[
                        { name: "icon", placeholder: "icon (e.g. brain)" },
                        { name: "title", placeholder: "Area title" },
                        { name: "description", placeholder: "Short description", type: "textarea" },
                        { name: "link", placeholder: "Link (optional)", wide: true },
                    ]}
                    addLabel="Add research area"
                />
            </Section>

            <Section title="Achievements strip" sub="Award/recognition cards.">
                <RowsEditor
                    label="Achievements"
                    hint={<IconHint />}
                    rows={achievements}
                    onChange={(rows) => set("achievements_showcase", JSON.stringify(rows))}
                    fields={[
                        { name: "icon", placeholder: "icon (e.g. trophy)" },
                        { name: "year", placeholder: "Year (optional)" },
                        { name: "title", placeholder: "Title", wide: true },
                        { name: "detail", placeholder: "Detail", type: "textarea" },
                    ]}
                    addLabel="Add achievement"
                />
            </Section>

            <Section title="Featured faculty" sub="Pick who appears in the home-page spotlight (max 4 shown). Leave empty to show the first 4 faculty automatically.">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {people.map((p) => (
                        <label key={p.id}
                            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                                featured.includes(Number(p.id))
                                    ? "border-indigo-400 bg-indigo-50 text-indigo-800"
                                    : "border-slate-200 text-slate-600"
                            }`}>
                            <input type="checkbox" checked={featured.includes(Number(p.id))}
                                onChange={() => toggleFeatured(Number(p.id))}
                                className="h-4 w-4 rounded border-slate-300" />
                            <span className="truncate">{p.name}</span>
                            <span className="ml-auto shrink-0 text-xs text-slate-400">{p.category}</span>
                        </label>
                    ))}
                </div>
            </Section>

            <Section title="FAQ" sub="Accordion near the bottom of the home page.">
                <RowsEditor
                    label="Questions"
                    rows={faqs}
                    onChange={(rows) => set("faqs", JSON.stringify(rows))}
                    fields={[
                        { name: "q", placeholder: "Question", wide: true },
                        { name: "a", placeholder: "Answer", type: "textarea" },
                    ]}
                    addLabel="Add question"
                />
            </Section>

            <Section title="Closing CTA band" sub="The final call-to-action before the footer.">
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Title">
                        <input className={inputCls} value={cta.title || ""}
                            onChange={(e) => setCta({ title: e.target.value })} />
                    </Field>
                    <Field label="Button label / link">
                        <div className="flex gap-2">
                            <input className={inputCls} value={cta.button?.label || ""}
                                placeholder="Start Your Application"
                                onChange={(e) => setCta({ button: { ...cta.button, label: e.target.value } })} />
                            <input className={inputCls} value={cta.button?.href || ""}
                                placeholder="/apply"
                                onChange={(e) => setCta({ button: { ...cta.button, href: e.target.value } })} />
                        </div>
                    </Field>
                </div>
                <Field label="Subtitle">
                    <textarea className={inputCls} rows={2} value={cta.subtitle || ""}
                        onChange={(e) => setCta({ subtitle: e.target.value })} />
                </Field>
            </Section>

            <SaveButton onClick={save} saving={saving} />
        </div>
    );
}

// Small preview so admins can sanity-check icon names as they type
export function IconPreview({ name }) {
    const Icon = getIcon(name);
    return <Icon size={16} className="text-slate-500" />;
}
