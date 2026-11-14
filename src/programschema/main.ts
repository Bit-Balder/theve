import "../styles/fonts.css";
import "../styles/tokens.css";
import "./style.css";

type Decision = "selected" | "approved" | "rejected";
interface Candidate {
  identifier: string;
  title: string;
  year: number | null;
  periodMatch: string;
  language: string;
  suggestedChannel: string;
  licenseUrl: string;
  sourceUrl: string;
  media: {
    preferredFile: string;
    durationSeconds: number | null;
    fileCount: number;
    format: string;
  };
}
interface ReviewRecord {
  identifier: string;
  decision: Decision;
}
interface ReviewRequest {
  version: 1;
  identifiers: string[];
  decision: Decision;
  channelId: string | null;
  groupLabel: string;
  notes: string;
  basis: string;
  evidenceUrl: string | null;
  confirmedScope: true;
  confirmedRightsForAll: boolean;
}
const REPO = "Bit-Balder/theve";
const CANDIDATES_URL =
  "https://raw.githubusercontent.com/" +
  REPO +
  "/automation/archive-discovery-results/data/discovery/internet-archive/candidates.json";
const REVIEWS_URL =
  "https://raw.githubusercontent.com/" + REPO + "/main/data/editorial/reviews.json";
const MAX_BATCH = 40;

function element<T extends HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (!found) throw new Error("Saknat sidelement: " + id);
  return found as T;
}
const search = element<HTMLInputElement>("search");
const filterChannel = element<HTMLSelectElement>("filter-channel");
const filterReview = element<HTMLSelectElement>("filter-review");
const loadStatus = element<HTMLParagraphElement>("load-status");
const list = element<HTMLDivElement>("candidate-list");
const listSummary = element<HTMLParagraphElement>("list-summary");
const selectedCount = element<HTMLParagraphElement>("selected-count");
const decision = element<HTMLSelectElement>("decision");
const reviewChannel = element<HTMLSelectElement>("review-channel");
const groupLabel = element<HTMLInputElement>("group-label");
const notes = element<HTMLTextAreaElement>("notes");
const basis = element<HTMLTextAreaElement>("basis");
const evidenceUrl = element<HTMLInputElement>("evidence-url");
const rightsFields = element<HTMLDivElement>("rights-fields");
const confirmRights = element<HTMLInputElement>("confirm-rights");
const confirmScope = element<HTMLInputElement>("confirm-scope");
const error = element<HTMLParagraphElement>("review-error");
const importJson = element<HTMLInputElement>("import-json");

let candidates: Candidate[] = [];
let existingReviews = new Map<string, ReviewRecord>();
const selected = new Set<string>();

function make<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function seasonOf(candidate: Candidate): { key: string; label: string } | null {
  const match = /(?:\bs(\d{1,2})[\s._-]*e\d{1,3}\b|\b(?:säsong|sasong|season)\s*[#:._-]?\s*(\d{1,2})\b)/i.exec(
    candidate.title + " " + candidate.identifier,
  );
  if (!match) return null;
  const season = Number(match[1] || match[2]);
  const stem = candidate.title.slice(0, Math.min(match.index, candidate.title.length))
    .replace(/[-_:.,\s]+$/g, "").trim();
  if (stem.length < 3) return null;
  const title = stem.replace(/\s+/g, " ");
  return {
    key: title.toLocaleLowerCase("sv") + "/" + season,
    label: title + " - säsong " + season,
  };
}

function shownCandidates(): Candidate[] {
  const query = search.value.toLocaleLowerCase("sv").trim();
  return candidates.filter((candidate) => {
    const matchesText = !query ||
      (candidate.title + " " + candidate.identifier)
        .toLocaleLowerCase("sv").includes(query);
    const matchesChannel =
      filterChannel.value === "all" ||
      candidate.suggestedChannel === filterChannel.value;
    const review = existingReviews.get(candidate.identifier);
    const matchesReview =
      filterReview.value === "all" ||
      (filterReview.value === "unreviewed" ? !review : review?.decision === filterReview.value);
    return matchesText && matchesChannel && matchesReview;
  });
}

function channelLabel(channel: string): string {
  const labels: Record<string, string> = {
    "01": "TV1", "02": "TV2", "03": "TV3", "04": "TV4", "05": "TV5",
    "06": "TV6", "07": "TV7", "08": "Barn", "09": "Natur",
  };
  return labels[channel] ?? "Okänd";
}

function render() {
  const visible = shownCandidates();
  const scrollTop = list.scrollTop;
  const groups = new Map<string, Candidate[]>();
  for (const candidate of candidates) {
    const season = seasonOf(candidate);
    if (season) {
      const entries = groups.get(season.key) ?? [];
      entries.push(candidate);
      groups.set(season.key, entries);
    }
  }
  const children: HTMLElement[] = [];
  let previousSeason = "";
  for (const candidate of visible) {
    const season = seasonOf(candidate);
    if (season && season.key !== previousSeason && (groups.get(season.key)?.length ?? 0) > 1) {
      const header = make("div", "season-heading");
      const name = make("strong", "", season.label.toUpperCase());
      const button = make("button", "button button--quiet", "MARKERA SÄSONG");
      button.type = "button";
      button.addEventListener("click", () => {
        for (const entry of groups.get(season.key) ?? []) selected.add(entry.identifier);
        groupLabel.value = season.label;
        render();
      });
      header.append(name, button);
      children.push(header);
    }
    previousSeason = season?.key ?? "";
    const row = make("article", "candidate-row");
    const checkbox = make("input", "candidate-checkbox");
    checkbox.type = "checkbox";
    checkbox.checked = selected.has(candidate.identifier);
    checkbox.setAttribute("aria-label", "Markera " + candidate.title);
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) selected.add(candidate.identifier);
      else selected.delete(candidate.identifier);
      updateSelection();
    });

    const details = make("div", "candidate-details");
    const title = make("h3", "", candidate.title);
    const metadata = make(
      "p",
      "metadata",
      [
        channelLabel(candidate.suggestedChannel),
        candidate.year ?? "Årtal okänt",
        candidate.media?.durationSeconds
          ? Math.round(candidate.media.durationSeconds / 60) + " min"
          : "Speltid okänd",
        candidate.media?.fileCount > 1
          ? candidate.media.fileCount + " filer i arkivposten"
          : "1 arkivfil",
      ].join(" - "),
    );
    const second = make("p", "metadata", candidate.identifier);
    details.append(title, metadata, second);
    const right = make("div", "candidate-actions");
    const license = make(
      "span",
      candidate.licenseUrl ? "status-tag status-tag--license" : "status-tag",
      candidate.licenseUrl ? "LICENSLÄNK FINNS" : "LICENS SAKNAS",
    );
    const review = existingReviews.get(candidate.identifier);
    const status = make(
      "span",
      "status-tag",
      review ? "GRANSKAD: " + review.decision.toUpperCase() : "OGRANSKAD",
    );
    const archiveLink = make("a", "archive-link", "VISA ARKIVPOST");
    archiveLink.href =
      "https://archive.org/details/" + encodeURIComponent(candidate.identifier);
    archiveLink.target = "_blank";
    archiveLink.rel = "noopener noreferrer";
    right.append(license, status, archiveLink);
    row.append(checkbox, details, right);
    children.push(row);
  }
  list.replaceChildren(...children);
  list.scrollTop = scrollTop;
  listSummary.textContent =
    visible.length + " AV " + candidates.length + " TRÄFFAR";
  updateSelection();
}

function updateSelection() {
  selectedCount.textContent = selected.size + " VALDA ARKIVPOSTER";
  rightsFields.hidden = decision.value !== "approved";
  error.textContent = "";
}

async function loadCandidates() {
  loadStatus.textContent = "Hämtar arkivkandidater från GitHub...";
  try {
    const result = await fetch(CANDIDATES_URL + "?time=" + Date.now(), {
      cache: "no-store",
    });
    if (!result.ok) throw new Error("GitHub svarade HTTP " + result.status);
    const data: unknown = await result.json();
    if (!Array.isArray(data) || data.some(
      (item) => !item || typeof item !== "object" ||
        typeof item.identifier !== "string" || typeof item.title !== "string",
    )) {
      throw new Error("Kandidatlistan har oväntat format.");
    }
    candidates = data as Candidate[];
    selected.clear();
    try {
      const reviewResponse = await fetch(REVIEWS_URL + "?time=" + Date.now(), {
        cache: "no-store",
      });
      if (reviewResponse.ok) {
        const journal = (await reviewResponse.json()) as { entries?: ReviewRecord[] };
        existingReviews = new Map((journal.entries || []).map(
          (entry) => [entry.identifier, entry],
        ));
      }
    } catch {
      existingReviews = new Map();
    }
    loadStatus.textContent =
      "Inläst: " + candidates.length +
      " kandidater. Rättigheter och uppspelning är inte verifierade.";
    render();
  } catch (caught) {
    loadStatus.textContent =
      "Kunde inte läsa kandidatgrenen. Importera candidates.json nedan. " +
      (caught instanceof Error ? caught.message : "");
  }
}

function requestFromInputs(): ReviewRequest {
  const ids = [...selected].sort((a, b) => a.localeCompare(b, "sv"));
  if (ids.length < 1) throw new Error("Markera minst en arkivpost.");
  if (ids.length > MAX_BATCH) {
    throw new Error("Dela upp massgranskningen i grupper om högst 40 arkivposter.");
  }
  const chosen = candidates.filter((candidate) => selected.has(candidate.identifier));
  const mode = decision.value as Decision;
  if (!["selected", "approved", "rejected"].includes(mode)) {
    throw new Error("Välj ett giltigt beslut.");
  }
  if (notes.value.trim().length < 8) {
    throw new Error("Skriv en motivering på minst åtta tecken.");
  }
  if (!confirmScope.checked) {
    throw new Error("Bekräfta att du har granskat vilka poster som ingår.");
  }
  if (mode !== "rejected" && chosen.some((candidate) =>
    !Number.isFinite(candidate.media?.durationSeconds) ||
    !/\.mp4$/i.test(candidate.media?.preferredFile || "")
  )) {
    throw new Error("Någon vald arkivpost saknar MP4 eller speltid.");
  }
  if (mode === "approved") {
    if (chosen.some((candidate) => !candidate.licenseUrl?.startsWith("https://"))) {
      throw new Error(
        "Alla valda poster måste ha en verifierbar licenslänk i Internet Archive. Välj annars 'fortsatt granskning'.",
      );
    }
    if (basis.value.trim().length < 20) {
      throw new Error("Beskriv rättighetsgrunden med minst 20 tecken.");
    }
    try {
      if (new URL(evidenceUrl.value).protocol !== "https:") {
        throw new Error("wrong protocol");
      }
    } catch {
      throw new Error("Ange en publik HTTPS-länk till rättighetsunderlaget.");
    }
    if (!confirmRights.checked) {
      throw new Error("Bekräfta att underlaget gäller alla markerade poster.");
    }
  }
  return {
    version: 1,
    identifiers: ids,
    decision: mode,
    channelId: reviewChannel.value || null,
    groupLabel: groupLabel.value.trim(),
    notes: notes.value.trim(),
    basis: mode === "approved" ? basis.value.trim() : "",
    evidenceUrl: mode === "approved" ? evidenceUrl.value.trim() : null,
    confirmedScope: true,
    confirmedRightsForAll: mode === "approved" && confirmRights.checked,
  };
}

function prepareIssue() {
  const request = requestFromInputs();
  const body = "THEVE_REVIEW_V1\n" + JSON.stringify(request);
  const query = new URLSearchParams({
    title: "Theve: " + request.decision + " - " + request.identifiers.length + " poster",
    body,
  });
  const url = "https://github.com/" + REPO + "/issues/new?" + query.toString();
  if (url.length > 7_500) {
    throw new Error("Ärendet blir för stort. Välj färre poster eller kortare motivering.");
  }
  return { request, url };
}

element<HTMLButtonElement>("submit-review").addEventListener("click", () => {
  try {
    const { url } = prepareIssue();
    window.open(url, "_blank", "noopener,noreferrer");
    error.textContent = "GitHub öppnades. Skicka ärendet där för att starta granskningen.";
  } catch (caught) {
    error.textContent = caught instanceof Error ? caught.message : "Okänt fel.";
  }
});

element<HTMLButtonElement>("download-review").addEventListener("click", () => {
  try {
    const request = requestFromInputs();
    const file = new Blob([JSON.stringify(request, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(file);
    link.download = "theve-review-" + request.decision + ".json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 2_000);
  } catch (caught) {
    error.textContent = caught instanceof Error ? caught.message : "Okänt fel.";
  }
});

for (const control of [search, filterChannel, filterReview]) {
  control.addEventListener("input", render);
}
decision.addEventListener("change", updateSelection);
element<HTMLButtonElement>("select-visible").addEventListener("click", () => {
  for (const candidate of shownCandidates()) selected.add(candidate.identifier);
  render();
});
element<HTMLButtonElement>("clear-selected").addEventListener("click", () => {
  selected.clear();
  render();
});
element<HTMLButtonElement>("reload").addEventListener("click", () => {
  void loadCandidates();
});
importJson.addEventListener("change", async () => {
  const file = importJson.files?.[0];
  if (!file) return;
  try {
    const data: unknown = JSON.parse(await file.text());
    if (!Array.isArray(data) ||
      data.some((candidate) => !candidate || typeof candidate.identifier !== "string")) {
      throw new Error("Filen innehåller ingen giltig kandidatlista.");
    }
    candidates = data as Candidate[];
    selected.clear();
    loadStatus.textContent = "Lokal kandidatlista inläst: " + candidates.length + " poster.";
    render();
  } catch (caught) {
    loadStatus.textContent = caught instanceof Error ? caught.message : "Felaktig JSON-fil.";
  }
});
void loadCandidates();
