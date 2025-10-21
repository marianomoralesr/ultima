// AIRTABLE AUTOMATION SCRIPT for Beta Poll v0.1
// PURPOSE: To be used in an Airtable Automation with a "When webhook received" trigger.
// ACTION: This script will take the JSON payload from the webhook (containing poll responses),
//         create a table if it doesn't exist, and add the poll data as a new record.

// --- CONFIGURATION ---
// 1. Set the name of the table where you want to store responses.
const TABLE_NAME = "Encuesta Beta v0.1";

// 2. Define the schema for your table.
// Field names MUST match the keys from the translated JSON payload sent by the app.
const TABLE_SCHEMA = [
    { name: "User ID", type: "singleLineText" },
    // Step 1 - Perfil del Usuario
    { name: "Dispositivo", type: "singleLineText" },

    // Step 2 - Experiencia General
    { name: "Facilidad Inventario (1-10)", type: "number", options: { precision: 0 } },
    { name: "Punto Fuerte", type: "multilineText" },
    { name: "Punto Débil", type: "multilineText" },

    // Step 3 - Inventario
    { name: "Claridad Info Autos", type: "singleLineText" },
    { name: "Info Extra Sugerida", type: "multilineText" },
    
    // Step 4 - Financiamiento
    { name: "Facilidad Login (1-10)", type: "number", options: { precision: 0 } },
    { name: "Problemas Financiamiento", type: "multilineText" },
    { name: "Claridad Dashboard", type: "singleLineText" },

    // Step 5 - Confianza
    { name: "Nivel de Confianza", type: "singleLineText" },
    { name: "Sugerencia Confianza", type: "multilineText" },
    { name: "Probabilidad de Reuso (1-10)", type: "number", options: { precision: 0 } },

    // Step 6 - Puntos Ciegos
    { name: "Momentos de Frustración", type: "multilineText" },
    { name: "Sorpresas Positivas", type: "multilineText" },
    { name: "Mejora Prioritaria", type: "multilineText" },
    { name: "Funciones no Usadas", type: "multilineText" },

    // Step 7 - Cierre
    { name: "Motivo de Abandono", type: "multilineText" },
    { name: "Comentario Final", type: "multilineText" },
    { name: "Funcionalidad Futura", type: "multilineText" },
    { name: "Mejor Experiencia App", type: "multilineText" },
];


// --- SCRIPT LOGIC ---
async function main() {
    console.log("Webhook received. Starting automation script.");

    const inputConfig = input.config();
    const payload = inputConfig.body;

    if (!payload || Object.keys(payload).length === 0) {
        console.error("Webhook payload is empty or invalid. Exiting.");
        return;
    }

    console.log(`Payload received. Data: ${JSON.stringify(payload, null, 2)}`);

    let table = base.tables.find(t => t.name === TABLE_NAME);

    if (table) {
        console.log(`Table "${TABLE_NAME}" already exists.`);
    } else {
        console.log(`Table "${TABLE_NAME}" not found. Creating it now...`);
        try {
            await base.createTableAsync(TABLE_NAME, TABLE_SCHEMA);
            table = base.getTable(TABLE_NAME);
            console.log(`Table "${TABLE_NAME}" created successfully with ${TABLE_SCHEMA.length} fields.`);
        } catch (e) {
            console.error(`Failed to create table "${TABLE_NAME}". Error: ${e.message}`);
            return;
        }
    }

    const recordData = {};
    for (const field of TABLE_SCHEMA) {
        if (payload.hasOwnProperty(field.name)) {
            let value = payload[field.name];

            if (field.type === 'number' && typeof value === 'string') {
                const parsedValue = parseFloat(value);
                recordData[field.name] = isNaN(parsedValue) ? null : parsedValue;
            } else if (value === '' || value === undefined) {
                 recordData[field.name] = null;
            }
            else {
                recordData[field.name] = value;
            }
        }
    }

    try {
        console.log("Attempting to create a new record with data:", JSON.stringify(recordData, null, 2));
        const recordId = await table.createRecordAsync(recordData);
        console.log(`Successfully created record with ID: ${recordId}`);
        output.set("recordId", recordId);
    } catch (e) {
        console.error(`Failed to create record. Error: ${e.message}`);
        console.error("Data that failed:", JSON.stringify(recordData, null, 2));
    }
}

await main();