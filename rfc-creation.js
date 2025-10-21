// — Setup inicial y helper de salida —
let tabla = base.getTable("Clientes");
const config = input.config();
let recordId = Array.isArray(config.recordId) ? config.recordId[0] : config.recordId;

function writeOutput(msg) {
    if (typeof output !== "undefined" && typeof output.text === "function") {
        output.text(msg);
    } else {
        console.log(msg);
    }
}

// — Funciones auxiliares —
function normalizarTexto(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/ñ/gi, "n")
        .trim();
}

function limpiarApellido(apellido) {
    let texto = normalizarTexto(apellido).toLowerCase();
    let particulas = ["de","del","la","las","los","y","mc","mac","von","van"];
    return texto
        .split(" ")
        .filter(p => p && !particulas.includes(p))
        .join("");
}

function obtenerPrimeraVocalInterna(texto) {
    for (let i = 1; i < texto.length; i++) {
        if ("AEIOUaeiou".includes(texto[i])) return texto[i];
    }
    return "X";
}

// ✅ ✅ CORRECTED FUNCTION: Avoids timezone issues
function formatearFechaSinDesfase(fechaRaw) {
    if (!fechaRaw) return "000000";
    let iso = new Date(fechaRaw).toISOString().split("T")[0]; // YYYY-MM-DD
    let [year, month, day] = iso.split("-");
    return `${year.slice(-2)}${month}${day}`;
}

// — Función que procesa un solo registro y devuelve true si actualizó —
async function handleRecord(recId) {
    let record = await tabla.selectRecordAsync(recId);
    if (!record) return false;

    let rfcActual     = record.getCellValueAsString("RFC") || "";
    let validacionRFC = record.getCellValueAsString("ValidaciónRFC") || "";

    // Si ya es válido _y_ no tiene 000000, salimos
    if (validacionRFC.includes("✅") && !rfcActual.includes("000000")) {
        return false;
    }

    // Leemos los campos necesarios
    let Nombre          = record.getCellValueAsString("Nombre");
    let ApellidoPaterno = record.getCellValueAsString("ApellidoPaterno");
    let ApellidoMaterno = record.getCellValueAsString("ApellidoMaterno");
    let Homoclave       = record.getCellValueAsString("Homoclave") || "";
    let fechaRaw        = record.getCellValue("FechaNacimiento");

    // Validaciones mínimas
    if (!Nombre || !ApellidoPaterno || !ApellidoMaterno || !fechaRaw) {
        writeOutput(`❌ Registro ${recId}: faltan datos para generar el RFC.`);
        return false;
    }

    // Fecha formateada sin desfase
    let fechaFmt = formatearFechaSinDesfase(fechaRaw);

    // Procesamos nombre
    let partesNombre = normalizarTexto(Nombre).split(" ").filter(Boolean);
    let nombreUsado = (["JOSE","MARIA"].includes(partesNombre[0].toUpperCase()) && partesNombre.length > 1)
        ? partesNombre[1]
        : partesNombre[0] || "X";

    // Limpiamos apellidos
    let apP = limpiarApellido(ApellidoPaterno) || "X";
    let apM = limpiarApellido(ApellidoMaterno) || "X";

    // Homoclave por defecto
    let homo = Homoclave || "XXX";

    // Prefijo RFC (4 letras)
    let p1 = apP.charAt(0);
    let p2 = obtenerPrimeraVocalInterna(apP);
    let m1 = apM.charAt(0);
    let n1 = nombreUsado.charAt(0);
    let prefijoRFC = `${p1}${p2}${m1}${n1}`.toUpperCase();

    // Filtrar palabras prohibidas (SAT)
    const palabrasProhibidas = [
      "BUEI","BUEY","CACA","CACO","CAGA","CAGO","CAKA","CAKO",
      "COGE","COGI","COJA","COJE","COJI","COJO","CULO","FETO",
      "GUEY","JOTO","KACA","KACO","KAGA","KAGO","KOGE","KOJO",
      "KAKA","KULO","MAME","MAMO","MEAR","MEAS","MEON","MION",
      "MOCO","MULA","PEDA","PEDO","PENE","PUTA","PUTO","QULO",
      "RATA","RUIN"
    ];
    if (palabrasProhibidas.includes(prefijoRFC)) {
        prefijoRFC = "XXXX";
    }

    // Montamos RFC final
    let nuevoRFC = `${prefijoRFC}${fechaFmt}${homo}`.toUpperCase();

    // Actualizamos Airtable
    await tabla.updateRecordAsync(recId, {
        "RFC": nuevoRFC
    });

    return true;
}

// — Lógica principal —
(async () => {
    if (recordId) {
        let updated = await handleRecord(recordId);
        if (updated) {
            writeOutput(`✅ RFC actualizado para registro ${recordId}.`);
        } else {
            writeOutput(`🔍 RFC no modificado para registro ${recordId}.`);
        }
    }
})();