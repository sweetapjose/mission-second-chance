// MISSION: SECOND CHANCE
// Educational prototype with fictional hardware values.
// Orbit timing, weather, and contact windows are scripted game presets.

// ---------- COMPONENTS ----------

const instruments = {
    optical: {
        name: "Optical camera",
        mass: 8, cost: 12, power: 20, data: 2,
        description: "Light and economical. Clouds reduce useful observations.",
        insight: "Optical imaging saves power and money, but clouds can hide flooding."
    },
    radar: {
        name: "Imaging radar",
        mass: 22, cost: 32, power: 95, data: 5,
        description: "Observes through clouds, but consumes more power.",
        insight: "Radar handles cloud cover, but needs more energy and data capacity."
    },
    both: {
        name: "Camera + radar",
        mass: 30, cost: 44, power: 115, data: 7,
        description: "Both instruments operate together during observation.",
        insight: "More instruments generate more data, but storage and downlink can become bottlenecks."
    }
};

const solarArrays = {
    compact: {
        mass: 8, cost: 10, generation: 80,
        description: "Generates 80 W in the model's full sunlight."
    },
    large: {
        mass: 18, cost: 20, generation: 160,
        description: "Generates 160 W in full sunlight, with more mass and cost."
    }
};

const batteries = {
    standard: {
        mass: 6, cost: 8, energy: 60,
        description: "Stores 60 Wh for operation when solar power is insufficient."
    },
    extended: {
        mass: 14, cost: 16, energy: 150,
        description: "Stores 150 Wh, with additional mass and cost."
    }
};

const orbits = {
    regional: {
        name: "Regional low Earth orbit",
        contacts: [2, 5, 8, 11],
        targets: [0, 1, 3, 4, 6, 7, 9, 10],
        eclipses: [3, 4, 9, 10],
        quality: 1,
        description: "Regional observation preset. Contact windows occur every third turn."
    },
    polar: {
        name: "Polar low Earth orbit",
        contacts: [3, 7, 11],
        targets: [0, 2, 4, 6, 8, 10],
        eclipses: [4, 5, 10, 11],
        quality: 1,
        description: "Broad-coverage preset, with fewer passes over this mission's target."
    },
    high: {
        name: "Higher Earth orbit",
        contacts: [1, 3, 5, 7, 9, 11],
        targets: [0, 2, 4, 6, 8, 10],
        eclipses: [8, 9],
        quality: 0.65,
        description: "More contact windows in this preset, but reduced detail for the same instrument."
    }
};

const launchers = {
    swift: {
        name: "Swift", cost: 15,
        capacity: { regional: 85, polar: 65, high: 0 }
    },
    atlas: {
        name: "Atlas", cost: 30,
        capacity: { regional: 140, polar: 115, high: 90 }
    }
};

const base = { mass: 25, cost: 20, power: 20 };

const rules = {
    budget: 100,
    turns: 12,
    minutes: 5,
    storage: 4000,
    downlink: 1800,
    target: 1200
};

// ---------- HTML CONNECTIONS ----------

const $ = id => document.getElementById(id);

const selections = {
    instrument: $("instrument"),
    solar: $("solar"),
    battery: $("battery"),
    orbit: $("orbit"),
    launcher: $("launcher")
};

const controls = Object.values(selections);

function setText(id, value) {
    $(id).textContent = value;
}

function selectedKeys() {
    const result = {};

    for (const [name, control] of Object.entries(selections)) {
        result[name] = control.value;
    }

    return result;
}

function calculateDesign() {
    const keys = selectedKeys();

    const instrument = instruments[keys.instrument];
    const solar = solarArrays[keys.solar];
    const battery = batteries[keys.battery];
    const orbit = orbits[keys.orbit];
    const launcher = launchers[keys.launcher];

    const mass = base.mass + instrument.mass + solar.mass + battery.mass;

    const cost =
        base.cost + instrument.cost + solar.cost +
        battery.cost + launcher.cost;

    const capacity = launcher.capacity[keys.orbit];
    const observationPower = base.power + instrument.power;

    return {
        keys, instrument, solar, battery, orbit, launcher,
        mass, cost, capacity, observationPower,
        powerMargin: solar.generation - observationPower,
        launchAllowed:
            capacity > 0 &&
            mass <= capacity &&
            cost <= rules.budget
    };
}

function updateBar(id, used, limit) {
    const bar = $(id);

    bar.value = limit > 0
        ? Math.min(100, used / limit * 100)
        : 100;

    bar.classList.toggle("over", limit <= 0 || used > limit);
}

// ---------- CREATE MISSION PANEL ----------
// This adds the new interface without requiring an HTML edit.

const missionStyles = document.createElement("style");

missionStyles.textContent = `
    #mission-panel {
        margin-top: 24px;
        scroll-margin-top: 20px;
    }

    .mission-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin: 20px 0;
    }

    .mission-actions button {
        flex: 1 1 170px;
        margin: 0;
    }

    button.primary {
        background: #36d6e7;
        color: #08111f;
        border-color: #36d6e7;
        font-weight: 800;
    }

    button:disabled {
        opacity: 0.45;
        cursor: not-allowed;
    }

    .mission-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 12px;
        margin: 20px 0;
    }

    .mission-stat {
        padding: 16px;
        background: #0b1525;
        border: 1px solid #293950;
        border-radius: 10px;
    }

    .mission-stat span {
        display: block;
        color: #a6b5cc;
        font-size: 12px;
    }

    .mission-stat strong {
        display: block;
        margin-top: 6px;
        font-size: 20px;
    }

    #mission-log {
        max-height: 230px;
        overflow-y: auto;
        padding-left: 24px;
        color: #c9d8ed;
        font-size: 13px;
    }

    #mission-log li {
        margin-bottom: 10px;
    }

    #mission-report {
        margin-top: 20px;
        padding: 20px;
        border: 1px solid #36d6e7;
        border-radius: 12px;
        background: #10252f;
    }

    [hidden] {
        display: none !important;
    }
`;

document.head.appendChild(missionStyles);

const missionPanel = document.createElement("section");

missionPanel.id = "mission-panel";
missionPanel.className = "panel";

missionPanel.innerHTML = `
    <p class="eyebrow">04 / MISSION CONTROL</p>
    <h2>Bring the science home.</h2>

    <p>
        Deliver at least <strong>1,200 useful-data units</strong>
        within 60 simulated minutes, without exhausting the battery.
        Only transmitted observations count toward the objective.
    </p>

    <p class="help">
        One action takes five minutes.
        Storage holds 4,000 MB.
        A contact window can transmit up to 1,800 MB.
        Useful-data units are a game score derived from observation quality,
        not a physical scientific measurement.
    </p>

    <div class="mission-actions">
        <button id="launch" class="primary" type="button">
            Launch Mission
        </button>

        <button id="return-design" type="button" hidden>
            Return to designer
        </button>
    </div>

    <div id="flight" hidden>
        <p id="conditions" class="feedback" aria-live="polite"></p>

        <div class="mission-grid">
            <div class="mission-stat">
                <span>Mission time</span>
                <strong id="flight-time"></strong>
            </div>

            <div class="mission-stat">
                <span>Battery remaining</span>
                <strong id="flight-energy"></strong>
            </div>

            <div class="mission-stat">
                <span>Stored data</span>
                <strong id="flight-storage"></strong>
            </div>

            <div class="mission-stat">
                <span>Useful data delivered</span>
                <strong id="flight-delivered"></strong>
            </div>
        </div>

        <div class="mission-actions">
            <button id="observe" type="button">Observe target</button>
            <button id="transmit" type="button">Transmit to Earth</button>
            <button id="coast" type="button">Conserve / recharge</button>
        </div>

        <p id="action-help" class="help"></p>

        <div id="mission-report" role="status" hidden></div>

        <h3>Mission log</h3>
        <ol id="mission-log"></ol>
    </div>
`;

document.querySelector("main").insertBefore(
    missionPanel,
    document.querySelector("main footer")
);

// ---------- DESIGNER ----------

let mission = null;
let previousResult = null;

function updateDesign() {
    const d = calculateDesign();

    setText("instrument-help", d.instrument.description);
    setText("solar-help", d.solar.description);
    setText("battery-help", d.battery.description);
    setText("orbit-help", d.orbit.description);
    setText("insight", d.instrument.insight);

    setText(
        "launcher-help",
        d.capacity > 0
            ? `${d.launcher.cost} credits. Capacity: ${d.capacity} kg for this orbit.`
            : "This launcher cannot reach the selected orbit."
    );

    setText("cost-value", `${d.cost} / 100 credits`);

    setText(
        "mass-value",
        d.capacity > 0
            ? `${d.mass} / ${d.capacity} kg`
            : `${d.mass} kg / unsupported`
    );

    setText("generation-value", `${d.solar.generation} W`);
    setText("load-value", `${d.observationPower} W`);
    setText("energy-value", `${d.battery.energy} Wh`);
    setText("data-value", `${d.instrument.data} MB/s`);

    updateBar("cost-bar", d.cost, 100);
    updateBar("mass-bar", d.mass, d.capacity);

    $("satellite").classList.toggle(
        "large-array",
        d.keys.solar === "large"
    );

    $("radar-dish").hidden = d.keys.instrument === "optical";

    $("satellite").querySelector(".camera").hidden =
        d.keys.instrument === "radar";

    $("satellite").setAttribute(
        "aria-label",
        `Satellite with ${d.instrument.name}`
    );

    const messages = [];

    if (d.cost > 100) {
        messages.push(`Budget exceeded by ${d.cost - 100} credits.`);
    }

    if (d.capacity === 0) {
        messages.push("Launcher cannot reach this orbit.");
    } else if (d.mass > d.capacity) {
        messages.push(`Spacecraft exceeds launch capacity by ${d.mass - d.capacity} kg.`);
    }

    messages.push(
        d.powerMargin < 0
            ? `Observation draws ${-d.powerMargin} W from the battery even in sunlight.`
            : `Sunlit observation power margin: ${d.powerMargin} W.`
    );

    const feedback = $("feedback");
    feedback.replaceChildren();

    const heading = document.createElement("strong");

    heading.textContent = d.launchAllowed
        ? "✓ Launch constraints pass"
        : "⚠ Fix before launch";

    feedback.appendChild(heading);

    for (const message of messages) {
        const paragraph = document.createElement("p");
        paragraph.textContent = message;
        feedback.appendChild(paragraph);
    }

    feedback.classList.toggle(
        "warning",
        !d.launchAllowed || d.powerMargin < 0
    );

    const note = feedback.nextElementSibling;

    if (note) {
        note.textContent =
            "Launch checks cover cost, mass, and orbit compatibility. " +
            "Mission Control tests energy, storage, and data delivery.";
    }

    $("launch").disabled =
        !d.launchAllowed || Boolean(mission && !mission.finished);
}

function lockDesigner(locked) {
    for (const control of controls) {
        control.disabled = locked;
    }

    $("reset").disabled = locked;
}

for (const control of controls) {
    control.addEventListener("change", updateDesign);
}

$("reset").addEventListener("click", function () {
    selections.instrument.value = "optical";
    selections.solar.value = "compact";
    selections.battery.value = "standard";
    selections.orbit.value = "regional";
    selections.launcher.value = "swift";

    updateDesign();
});

// ---------- MISSION CONDITIONS ----------

function getConditions() {
    const turn = mission.turn;
    const orbit = mission.design.orbit;

    return {
        sun: !orbit.eclipses.includes(turn),
        contact: orbit.contacts.includes(turn),
        target: orbit.targets.includes(turn),

        // Scripted conditions are identical on repeat attempts.
        cloudy: [1, 4, 6, 9].includes(turn),

        // Solar-generation event affects turns 7 and 8.
        reducedSolar: [6, 7].includes(turn)
    };
}

function addLog(message) {
    const item = document.createElement("li");

    item.textContent = message;
    $("mission-log").prepend(item);
}

function renderMission() {
    setText("flight-time", `${mission.turn * rules.minutes} / 60 min`);

    setText(
        "flight-energy",
        `${mission.energy.toFixed(1)} / ${mission.design.battery.energy} Wh`
    );

    setText(
        "flight-storage",
        `${Math.round(mission.stored)} / ${rules.storage} MB`
    );

    setText(
        "flight-delivered",
        `${Math.round(mission.delivered)} / ${rules.target}`
    );

    if (mission.finished) {
        $("observe").disabled = true;
        $("transmit").disabled = true;
        $("coast").disabled = true;

        setText("conditions", "Mission complete. Review your results below.");
        setText("action-help", "Return to the designer to prepare another attempt.");
        return;
    }

    const c = getConditions();

    const conditions = [
        `Next action: minutes ${mission.turn * 5}–${mission.turn * 5 + 5}`,
        c.sun ? "SUNLIGHT" : "ECLIPSE",
        c.target ? "TARGET VISIBLE" : "NO TARGET PASS",
        c.contact ? "EARTH CONTACT" : "NO EARTH CONTACT",
        c.cloudy ? "CLOUDY" : "CLEAR"
    ];

    if (c.reducedSolar && c.sun) {
        conditions.push("SOLAR OUTPUT REDUCED 50%");
    }

    setText("conditions", conditions.join(" · "));

    $("observe").disabled =
        !c.target || mission.stored >= rules.storage;

    $("transmit").disabled =
        !c.contact || mission.stored <= 0;

    $("coast").disabled = false;

    setText(
        "action-help",
        "Observing requires a target pass and free storage. " +
        "Transmission requires Earth contact and stored data. " +
        "Conserving uses only spacecraft base power; in eclipse, " +
        "it still consumes battery energy."
    );
}

// ---------- LAUNCH ----------

$("launch").addEventListener("click", function () {
    const design = calculateDesign();

    if (!design.launchAllowed) {
        return;
    }

    mission = {
        design,
        turn: 0,
        energy: design.battery.energy,
        stored: 0,
        storedUseful: 0,
        delivered: 0,
        lostData: 0,
        finished: false
    };

    lockDesigner(true);

    $("flight").hidden = false;
    $("return-design").hidden = false;
    $("return-design").textContent = "Abort and return to designer";
    $("mission-report").hidden = true;
    $("mission-log").replaceChildren();
    $("launch").disabled = true;

    addLog(
        `Launch successful: ${design.launcher.name}, ${design.orbit.name}. ` +
        "Battery starts fully charged."
    );

    renderMission();

    missionPanel.scrollIntoView({
        behavior: "auto",
        block: "start"
    });
});

// ---------- OPERATIONS ----------

function performAction(action) {
    if (!mission || mission.finished) {
        return;
    }

    const d = mission.design;
    const c = getConditions();

    if (action === "observe" &&
        (!c.target || mission.stored >= rules.storage)) {
        return;
    }

    if (action === "transmit" &&
        (!c.contact || mission.stored <= 0)) {
        return;
    }

    let load = base.power;

    if (action === "observe") {
        load += d.instrument.power;
    } else if (action === "transmit") {
        load += 45;
    }

    const generation = c.sun
        ? d.solar.generation * (c.reducedSolar ? 0.5 : 1)
        : 0;

    // Energy in Wh = power in W × time in hours.
    const nextEnergy =
        mission.energy + (generation - load) * rules.minutes / 60;

    // Conservative rule: an action that exhausts the battery
    // receives no observation or transmission credit.
    if (nextEnergy <= 0) {
        mission.energy = 0;
        mission.turn++;

        addLog(
            `Battery exhausted during ${action}. ` +
            "The spacecraft could not complete the action."
        );

        finishMission(true);
        return;
    }

    mission.energy = Math.min(d.battery.energy, nextEnergy);

    let message = "";

    if (action === "observe") {
        const generated = d.instrument.data * rules.minutes * 60;

        const accepted = Math.min(
            generated,
            rules.storage - mission.stored
        );

        const opticalQuality = c.cloudy ? 0.2 : 1;

        let quality;

        if (d.keys.instrument === "optical") {
            quality = opticalQuality;
        } else if (d.keys.instrument === "radar") {
            quality = 0.85;
        } else {
            quality = (2 * opticalQuality + 5 * 0.85) / 7;
        }

        quality *= d.orbit.quality;

        mission.stored += accepted;
        mission.storedUseful += accepted * quality;
        mission.lostData += generated - accepted;

        message =
            `Observed: stored ${Math.round(accepted)} MB, worth ` +
            `${Math.round(accepted * quality)} useful-data units.`;

        if (generated > accepted) {
            message +=
                ` Storage full: ${Math.round(generated - accepted)} MB lost.`;
        }
    } else if (action === "transmit") {
        const amount = Math.min(mission.stored, rules.downlink);

        // Treat stored observations as a mixed pool.
        const useful =
            mission.storedUseful * amount / mission.stored;

        mission.stored -= amount;
        mission.storedUseful = Math.max(
            0,
            mission.storedUseful - useful
        );

        mission.delivered += useful;

        message =
            `Transmitted ${Math.round(amount)} MB. ` +
            `${Math.round(useful)} useful-data units reached Earth.`;
    } else {
        message = generation > load
            ? "Conserved power and charged the battery."
            : "Conserved power. The battery still supplied the base load.";
    }

    mission.turn++;

    addLog(
        `${mission.turn * 5} min — ${message} ` +
        `Battery: ${mission.energy.toFixed(1)} Wh.`
    );

    if (mission.turn >= rules.turns) {
        finishMission(false);
    } else {
        renderMission();
    }
}

// ---------- REPORT ----------

function finishMission(powerFailure) {
    mission.finished = true;

    const success =
        !powerFailure && mission.delivered >= rules.target;

    const completion = Math.min(
        1,
        mission.delivered / rules.target
    );

    // Failed missions stay below successful missions.
    const score = success
        ? Math.round(
            70 +
            20 * Math.min(
                1,
                Math.max(0, mission.delivered / rules.target - 1)
            ) +
            10 * (1 - mission.design.cost / rules.budget)
        )
        : Math.min(59, Math.round(59 * completion));

    const report = $("mission-report");
    report.replaceChildren();
    report.hidden = false;

    const title = document.createElement("h3");

    title.textContent = success
        ? `Mission successful — ${score}/100`
        : `Mission incomplete — ${score}/100`;

    report.appendChild(title);

    const notes = [
        `Delivered: ${Math.round(mission.delivered)} useful-data units. ` +
        `Objective: ${rules.target}.`,

        `Untransmitted data: ${Math.round(mission.stored)} MB. ` +
        `Data lost to storage overflow: ${Math.round(mission.lostData)} MB.`,

        powerFailure
            ? "Cause: battery exhaustion. Try a larger battery, lower-power instrument, or fewer observations during eclipse."
            : success
                ? "You met the delivery goal and kept the spacecraft powered through the mission."
                : "You survived but missed the delivery goal. Observe during useful target passes and transmit before the final contact window.",

        "Scoring: successful missions earn 70 points, up to 20 for extra delivered science, and up to 10 for budget efficiency. Failed missions are capped at 59."
    ];

    if (previousResult) {
        const difference = mission.delivered - previousResult.delivered;
        const sign = difference >= 0 ? "+" : "";

        notes.push(
            `Compared with your previous completed attempt: ` +
            `${sign}${Math.round(difference)} useful-data units. ` +
            "This is an attempt comparison, not an isolated test of one change."
        );
    }

    for (const note of notes) {
        const paragraph = document.createElement("p");
        paragraph.textContent = note;
        report.appendChild(paragraph);
    }

    previousResult = {
        delivered: mission.delivered,
        score
    };

    $("return-design").textContent = "Return to designer";
    renderMission();
}

$("observe").addEventListener("click", () => performAction("observe"));
$("transmit").addEventListener("click", () => performAction("transmit"));
$("coast").addEventListener("click", () => performAction("coast"));

$("return-design").addEventListener("click", function () {
    if (mission && !mission.finished) {
        const confirmed = window.confirm(
            "Abort this mission and return to the designer?"
        );

        if (!confirmed) {
            return;
        }
    }

    mission = null;
    lockDesigner(false);

    $("flight").hidden = true;
    $("return-design").hidden = true;

    updateDesign();

    selections.instrument.focus();
});

updateDesign();