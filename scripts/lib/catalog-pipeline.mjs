import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

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
  const ajv = new Ajv2020({ allErrors: true, strict: true });
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
  const slotIds = data.schedule.slots.map((slot) => slot.id);
  const slotPositions = data.schedule.slots.map(
    (slot) => `${slot.channelId}:${slot.order}`,
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
  for (const duplicate of collectDuplicates(slotIds)) {
    messages.push(`slot-id "${duplicate}" är inte unikt`);
  }
  for (const duplicate of collectDuplicates(slotPositions)) {
    messages.push(`slotposition "${duplicate}" är inte unik`);
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

  for (const slot of data.schedule.slots) {
    const channel = channelsById.get(slot.channelId);
    const item = catalogById.get(slot.catalogItemId);
    const rights = rightsByItemId.get(slot.catalogItemId);

    if (!channel) {
      messages.push(
        `slot "${slot.id}" hänvisar till okänd kanal "${slot.channelId}"`,
      );
    }
    if (!item) {
      messages.push(
        `slot "${slot.id}" hänvisar till okänt katalogobjekt "${slot.catalogItemId}"`,
      );
      continue;
    }
    if (item.channelId !== slot.channelId) {
      messages.push(
        `slot "${slot.id}" ligger på kanal "${slot.channelId}" men katalogobjektet tillhör "${item.channelId}"`,
      );
    }
    if (!rights) {
      continue;
    }
    if (rights.status !== "approved") {
      messages.push(
        `slot "${slot.id}" får inte publiceras: rättighetsstatus är "${rights.status}"`,
      );
    }
    if (!rights.publicationAllowed) {
      messages.push(
        `slot "${slot.id}" får inte publiceras: publicering är inte godkänd`,
      );
    }
    if (item.familyStatus !== "approved") {
      messages.push(
        `slot "${slot.id}" får inte publiceras: familjestatus är "${item.familyStatus}"`,
      );
    }
    if (!["available", "test_only"].includes(item.availabilityStatus)) {
      messages.push(
        `slot "${slot.id}" får inte publiceras: tillgänglighet är "${item.availabilityStatus}"`,
      );
    }
  }

  if (messages.length > 0) {
    throw new CatalogDataError(messages);
  }
}

function createRevision(value) {
  return createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex")
    .slice(0, 16);
}

export function buildPublicData(data) {
  validateProjectData(data);

  const channelNumberById = new Map(
    data.channels.channels.map((channel) => [channel.id, channel.number]),
  );
  const catalogById = new Map(
    data.catalog.items.map((item) => [item.id, item]),
  );
  const rightsByItemId = new Map(
    data.rights.entries.map((entry) => [entry.catalogItemId, entry]),
  );
  const scheduledItemIds = new Set(
    data.schedule.slots.map((slot) => slot.catalogItemId),
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
  const slots = [...data.schedule.slots].sort((left, right) => {
    const channelDifference =
      channelNumberById.get(left.channelId) -
      channelNumberById.get(right.channelId);
    return (
      channelDifference ||
      left.order - right.order ||
      left.id.localeCompare(right.id, "sv")
    );
  });

  const revisionSource = {
    schemaVersion: "1.0.0",
    channels,
    items,
    slots: slots.map((slot) => ({
      ...slot,
      catalogTitle: catalogById.get(slot.catalogItemId).title,
    })),
  };
  const revision = createRevision(revisionSource);

  return {
    "manifest.json": {
      schemaVersion: "1.0.0",
      revision,
      counts: {
        channels: channels.length,
        catalogItems: items.length,
        scheduleSlots: slots.length,
      },
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
      schemaVersion: "1.0.0",
      revision,
      slots: revisionSource.slots,
    },
  };
}

export function formatGeneratedJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}
