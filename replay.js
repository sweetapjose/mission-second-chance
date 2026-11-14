// SECOND CHANCE
// This file runs after game.js and uses its existing simulation.

let replayBaseline = null;
let replayRunning = false;

// ---------- REPLAY PANEL ----------

const replayPanel = document.createElement("section");

replayPanel.className = "panel";
replayPanel.id = "replay-panel";
replayPanel.style.marginTop = "24px";

replayPanel.innerHTML = `
    <p class="eyebrow">05 / SECOND CHANCE</p>

    <h2>What would one different decision change?</h2>

    <p>
        Complete a mission, restore its design, and change exactly
        one instrument, solar array, or battery. We will repeat
        your recorded actions under the same mission conditions.
    </p>

    <p class="help">
        Orbit and launcher remain fixed for this experiment.
        If a recorded action becomes unavailable, that turn uses
        Conserve / recharge instead and the substitution is reported.
    </p>

    <div class="mission-actions">
        <button id="restore-baseline" type="button" disabled>
            Restore last mission design
        </button>

        <button id="run-replay" type="button" disabled>
            Run Second Chance
        </button>
    </div>

    <p id="replay-status" class="feedback" aria-live="polite">
        Finish a mission to unlock Second Chance.
    </p>

    <div id="replay-comparison" hidden></div>
`;

document.querySelector("main").insertBefore(
    replayPanel,
    document.querySelector("main footer")
);

// ---------- RECORD ACTIONS ----------

// Keep the original game functions.
const originalPerformAction = performAction;
const originalFinishMission = finishMission;

// Button listeners in game.js call performAction by name.
// This replacement records actions before using the original logic.

performAction = function (action) {
    if (!mission || mission.finished) {
        return;
    }

    if (!mission.actionHistory) {
        mission.actionHistory = [];
    }

    const startingTurn = mission.turn;

    mission.actionHistory.push(action);

    originalPerformAction(action);

    // A rejected action did not consume a turn.
    // Remove it from the recording.
    if (mission.turn === startingTurn) {
        mission.actionHistory.pop();
    }
};

// ---------- CAPTURE A COMPLETED MISSION ----------

function captureResult(powerFailure) {
    return {
        keys: { ...mission.design.keys },
        actions: [...(mission.actionHistory || [])],
        delivered: mission.delivered,
        energy: mission.energy,
        stored: mission.stored,
        lostData: mission.lostData,
        cost: mission.design.cost,
        turns: mission.turn,
        powerFailure,

        success:
            !powerFailure &&
            mission.delivered >= rules.target
    };
}

finishMission = function (powerFailure) {
    originalFinishMission(powerFailure);

    if (!replayRunning) {
        replayBaseline = captureResult(powerFailure);

        $("restore-baseline").disabled = false;
        $("run-replay").disabled = false;

        setText(
            "replay-status",
            `Recorded ${replayBaseline.actions.length} actions. ` +
            `Baseline delivered ${Math.round(replayBaseline.delivered)} ` +
            "useful-data units. Restore the design, then change one component."
        );

        $("replay-comparison").hidden = true;
    }
};

// ---------- RESTORE BASELINE ----------

$("restore-baseline").addEventListener("click", function () {
    if (!replayBaseline) {
        return;
    }

    if (mission && !mission.finished) {
        setText(
            "replay-status",
            "Finish or abort the current mission before restoring a design."
        );
        return;
    }

    if (mission) {
        $("return-design").click();
    }

    for (const [name, value] of Object.entries(replayBaseline.keys)) {
        selections[name].value = value;
    }

    updateDesign();

    setText(
        "replay-status",
        "Baseline restored. Change exactly one instrument, solar array, " +
        "or battery, then click Run Second Chance."
    );

    selections.instrument.focus();
});

// ---------- RESULT DISPLAY ----------

function showComparison(before, after, changed, substitutions) {
    const container = $("replay-comparison");

    container.replaceChildren();
    container.hidden = false;

    const heading = document.createElement("h3");
    heading.textContent = "Your engineering experiment";
    container.appendChild(heading);

    const change = document.createElement("p");

    change.textContent =
        `Changed ${changed}: ${before.keys[changed]} → ${after.keys[changed]}.`;

    container.appendChild(change);

    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";

    const caption = document.createElement("caption");
    caption.textContent = "Original mission and Second Chance results";
    caption.style.textAlign = "left";
    caption.style.marginBottom = "12px";
    table.appendChild(caption);

    const head = document.createElement("thead");
    const headerRow = document.createElement("tr");

    for (const label of ["Measure", "Original", "Second Chance"]) {
        const cell = document.createElement("th");

        cell.textContent = label;
        cell.scope = "col";
        cell.style.textAlign = "left";
        cell.style.padding = "10px";
        cell.style.borderBottom = "1px solid #42536e";

        headerRow.appendChild(cell);
    }

    head.appendChild(headerRow);
    table.appendChild(head);

    const body = document.createElement("tbody");

    const rows = [
        [
            "Outcome",
            before.success ? "Success" : "Incomplete",
            after.success ? "Success" : "Incomplete"
        ],
        [
            "Useful data delivered",
            Math.round(before.delivered),
            Math.round(after.delivered)
        ],
        [
            "Battery remaining",
            before.energy.toFixed(1) + " Wh",
            after.energy.toFixed(1) + " Wh"
        ],
        [
            "Budget used",
            before.cost + " credits",
            after.cost + " credits"
        ],
        [
            "Data lost to overflow",
            Math.round(before.lostData) + " MB",
            Math.round(after.lostData) + " MB"
        ],
        [
            "Elapsed mission time",
            before.turns * rules.minutes + " min",
            after.turns * rules.minutes + " min"
        ]
    ];

    for (const row of rows) {
        const tr = document.createElement("tr");

        row.forEach(function (value, index) {
            const cell = document.createElement(index === 0 ? "th" : "td");

            if (index === 0) {
                cell.scope = "row";
            }

            cell.textContent = value;
            cell.style.textAlign = "left";
            cell.style.padding = "10px";
            cell.style.borderBottom = "1px solid #293950";

            tr.appendChild(cell);
        });

        body.appendChild(tr);
    }

    table.appendChild(body);
    container.appendChild(table);

    const difference = after.delivered - before.delivered;
    const explanation = document.createElement("p");

    if (Math.abs(difference) < 0.01) {
        explanation.textContent =
            "Delivered science did not change. Compare cost and battery " +
            "reserves: a larger component can add margin without increasing " +
            "the science returned by this action schedule.";
    } else {
        explanation.textContent =
            `This change produced ${Math.round(Math.abs(difference))} ` +
            `${difference > 0 ? "more" : "fewer"} useful-data units. ` +
            "Use the mission log to inspect energy, storage, and transmission effects.";
    }

    container.appendChild(explanation);

    const fairness = document.createElement("p");
    fairness.className = "help";

    fairness.textContent =
        `Same orbit, launcher, weather, and scheduled conditions. ` +
        `${substitutions} unavailable actions were replaced with conservation. ` +
        "If the original mission ended early, remaining turns used conservation. " +
        "The replay stops early if its battery is exhausted.";

    container.appendChild(fairness);

    container.style.overflowX = "auto";
}

// ---------- RUN THE EXPERIMENT ----------

$("run-replay").addEventListener("click", function () {
    if (!replayBaseline) {
        return;
    }

    if (mission && !mission.finished) {
        setText(
            "replay-status",
            "Finish or abort the active mission before running Second Chance."
        );
        return;
    }

    const currentKeys = selectedKeys();

    const changes = Object.keys(currentKeys).filter(function (key) {
        return currentKeys[key] !== replayBaseline.keys[key];
    });

    const allowedChanges = ["instrument", "solar", "battery"];

    if (
        changes.length !== 1 ||
        !allowedChanges.includes(changes[0])
    ) {
        setText(
            "replay-status",
            "Restore the baseline, then change exactly one instrument, " +
            "solar array, or battery. Keep orbit and launcher unchanged."
        );
        return;
    }

    if (!calculateDesign().launchAllowed) {
        setText(
            "replay-status",
            "This design cannot launch. Check its budget and launch mass."
        );
        return;
    }

    const baseline = replayBaseline;
    let substitutions = 0;

    replayRunning = true;

    try {
        // Leave the old completed mission before launching.
        // This preserves the newly selected component.
        if (mission) {
            $("return-design").click();
        }

        $("launch").click();

        if (!mission || mission.finished) {
            throw new Error("The replay mission could not start.");
        }

        while (!mission.finished) {
            const turnBefore = mission.turn;

            const action =
                baseline.actions[mission.turn] || "coast";

            performAction(action);

            // When a changed design cannot execute an old action,
            // conserve power to advance the same five-minute turn.
            if (!mission.finished && mission.turn === turnBefore) {
                substitutions++;
                performAction("coast");
            }

            if (!mission.finished && mission.turn === turnBefore) {
                throw new Error("The replay did not advance.");
            }
        }

        const result = captureResult(mission.energy <= 0);

        showComparison(
            baseline,
            result,
            changes[0],
            substitutions
        );

        setText(
            "replay-status",
            "Second Chance complete. Your original baseline is preserved " +
            "so you can test another single-component change."
        );

        replayPanel.scrollIntoView({
            behavior: "auto",
            block: "start"
        });
    } catch (error) {
        setText(
            "replay-status",
            "Replay could not finish: " + error.message
        );
    } finally {
        replayRunning = false;
    }
});