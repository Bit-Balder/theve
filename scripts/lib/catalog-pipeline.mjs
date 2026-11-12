import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import {
  compileWeeklySchedule,
  findScheduleOverlaps,
} from "./schedule-compiler.mjs";

export class CatalogDataError extends Error {
  constructor(messages) {
    super(`Datavalideringen misslyckades:\n- ${messages.join("\n- ")}`);
    this.name = "CatalogDataError";
  }
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function loadProjectData(projectRoot) {
  const sourceRoot = join(projectRoot, "data", "source");
  const schemaRoot = join(projectRoot, "data", "schema");

  return {
    channels: readJson(join(sourceRoot, "channels.json")),
    catalog: readJson(join(sourceRoot, "catalog.json")),
    rights: readJson(join(sourceRoot, "rights.json")),
    schedule: readJson(join(sourceRoot, "schedule.json")),
    schemas: {
      channels: readJson(join(schemaRoot, "channels.schema.json")),
      catalog: readJson(join(schemaRoot, "catalog.schema.json")),
      rights: readJson(join(schemaRoot, "rights.schema.json")),
      schedule: readJson(join(schemaRoot, "schedule.schema.json")),
    },
  };
}

function formatSchemaErrors(documentName, errors = []) {
  return errors.map((error) => {
    const path = error.instancePath || "/";
    return `${documentName}${path}: ${error.message}`;
  });
}

function collectDuplicates(values) {
  const seen = new Set();
  const duplicates = new Set();
  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    }
    seen.add(value);
  }
  return [...duplicates];
}

function validateSchemas(data) {
  const ajv = new Ajv2020({
    allErrors: true,
    strict: true,
    strictRequired: false,
  });
  addFormats(ajv);
  const messages = [];

  for (const name of ["channels", "catalog", "rights", "schedule"]) {
    const validate = ajv.compile(data.schemas[name]);
    if (!validate(data[name])) {
      messages.push(...formatSchemaErrors(name, validate.errors));
    }
  }

  return messages;
}

function validateProgramSlot(
  slot,
  template,
  catalogById,
  rightsByItemId,
  messages,
) {
  const slotName = `${template.id}/${slot.id}`;
  const channelId = template.channelId;
  const item = catalogById.get(slot.catalogItemId);
  const rights = rightsByItemId.get(slot.catalogItemId);

  if (!item) {
    messages.push(
      `slot "${slotName}" hänvisar till okänt katalogobjekt "${slot.catalogItemId}"`,
    );
    return;
  }
  if (item.channelId !== channelId) {
    messages.push(
      `slot "${slotName}" ligger på kanal "${channelId}" men katalogobjektet tillhör "${item.channelId}"`,
    );
  }
  if (slot.durationSeconds > item.durationSeconds) {
    messages.push(
      `slot "${slotName}" är längre än katalogobjektet "${slot.catalogItemId}"`,
    );
  }
  if (!rights) {
    return;
  }
  if (rights.status !== "approved") {
    messages.push(
      `slot "${slotName}" får inte publiceras: rättighetsstatus är "${rights.status}"`,
    );
  }
  if (!rights.publicationAllowed) {
    messages.push(
      `slot "${slotName}" får inte publiceras: publicering är inte godkänd`,
    );
  }
  if (item.familyStatus !== "approved") {
    messages.push(
      `slot "${slotName}" får inte publiceras: familjestatus är "${item.familyStatus}"`,
    );
  }
  if (!["available", "test_only"].includes(item.availabilityStatus)) {
    messages.push(
      `slot "${slotName}" får inte publiceras: tillgänglighet är "${item.availabilityStatus}"`,
    );
  }
}

export function validateProjectData(data) {
  const messages = validateSchemas(data);
  if (messages.length > 0) {
    throw new CatalogDataError(messages);
  }

  const channelIds = data.channels.channels.map((channel) => channel.id);
  const channelNumbers = data.channels.channels.map(
    (channel) => channel.number,
  );
  const catalogIds = data.catalog.items.map((item) => item.id);
  const rightsIds = data.rights.entries.map((entry) => entry.catalogItemId);
  const templateIds = data.schedule.templates.map((template) => template.id);
  const templateSlotIds = data.schedule.templates.flatMap((template) =>
    template.slots.map((slot) => `${template.id}/${slot.id}`),
  );

  for (const duplicate of collectDuplicates(channelIds)) {
    messages.push(`kanal-id "${duplicate}" är inte unikt`);
  }
  for (const duplicate of collectDuplicates(channelNumbers)) {
    messages.push(`kanalnummer "${duplicate}" är inte unikt`);
  }
  for (const duplicate of collectDuplicates(catalogIds)) {
    messages.push(`katalog-id "${duplicate}" är inte unikt`);
  }
  for (const duplicate of collectDuplicates(rightsIds)) {
    messages.push(`rättighetsrad för "${duplicate}" förekommer flera gånger`);
  }
  for (const duplicate of collectDuplicates(templateIds)) {
    messages.push(`veckomall-id "${duplicate}" är inte unikt`);
  }
  for (const duplicate of collectDuplicates(templateSlotIds)) {
    messages.push(`slot-id "${duplicate}" är inte unikt`);
  }
  if (
    new Date(`${data.schedule.horizon.startDate}T00:00:00Z`).getUTCDay() !== 1
  ) {
    messages.push("tablåhorisontens startdatum måste vara en måndag");
  }

  const channelsById = new Map(
    data.channels.channels.map((channel) => [channel.id, channel]),
  );
  const catalogById = new Map(
    data.catalog.items.map((item) => [item.id, item]),
  );
  const rightsByItemId = new Map(
    data.rights.entries.map((entry) => [entry.catalogItemId, entry]),
  );

  for (const item of data.catalog.items) {
    if (!channelsById.has(item.channelId)) {
      messages.push(
        `katalogobjekt "${item.id}" hänvisar till okänd kanal "${item.channelId}"`,
      );
    }
    if (!rightsByItemId.has(item.id)) {
      messages.push(`katalogobjekt "${item.id}" saknar rättighetsrad`);
    }
  }

  for (const entry of data.rights.entries) {
    if (!catalogById.has(entry.catalogItemId)) {
      messages.push(
        `rättighetsrad hänvisar till okänt katalogobjekt "${entry.catalogItemId}"`,
      );
    }
  }

  for (const template of data.schedule.templates) {
    if (!channelsById.has(template.channelId)) {
      messages.push(
        `veckomall hänvisar till okänd kanal "${template.channelId}"`,
      );
    }
    for (const slot of template.slots) {
      if (slot.type === "program") {
        validateProgramSlot(
          slot,
          template,
          catalogById,
          rightsByItemId,
          messages,
        );
      }
    }
  }

  if (messages.length > 0) {
    throw new CatalogDataError(messages);
  }

  const compiledSchedule = compileWeeklySchedule(data.schedule);
  for (const overlap of findScheduleOverlaps(compiledSchedule)) {
    messages.push(`överlappande tablå: ${overlap}`);
  }

  if (messages.length > 0) {
    throw new CatalogDataError(messages);
  }

  return compiledSchedule;
}

function createRevision(value) {
  return createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex")
    .slice(0, 16);
}

export function buildPublicData(data) {
  const compiledSchedule = validateProjectData(data);
  const catalogById = new Map(
    data.catalog.items.map((item) => [item.id, item]),
  );
  const rightsByItemId = new Map(
    data.rights.entries.map((entry) => [entry.catalogItemId, entry]),
  );
  const scheduledItemIds = new Set(
    data.schedule.templates.flatMap((template) =>
      template.slots
        .filter((slot) => slot.type === "program")
        .map((slot) => slot.catalogItemId),
    ),
  );

  const channels = [...data.channels.channels].sort(
    (left, right) => left.number - right.number,
  );
  const items = data.catalog.items
    .filter((item) => scheduledItemIds.has(item.id))
    .map((item) => ({
      ...item,
      rightsStatus: rightsByItemId.get(item.id).status,
    }))
    .sort((left, right) => left.id.localeCompare(right.id, "sv"));
  const schedule = {
    ...compiledSchedule,
    slots: compiledSchedule.slots.map((slot) => ({
      ...slot,
      catalogTitle: slot.catalogItemId
        ? catalogById.get(slot.catalogItemId).title
        : null,
    })),
  };

  const revisionSource = {
    schemaVersion: "2.0.0",
    channels,
    items,
    schedule,
  };
  const revision = createRevision(revisionSource);

  return {
    "manifest.json": {
      schemaVersion: "2.0.0",
      revision,
      counts: {
        channels: channels.length,
        catalogItems: items.length,
        scheduleSlots: schedule.slots.length,
      },
      scheduleHorizon: schedule.horizon,
    },
    "channels.json": {
      schemaVersion: "1.0.0",
      revision,
      channels,
    },
    "catalog.json": {
      schemaVersion: "1.0.0",
      revision,
      items,
    },
    "schedule.json": {
      ...schedule,
      revision,
    },
  };
}

export function formatGeneratedJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}
