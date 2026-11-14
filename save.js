// SAVE SYSTEM
// Saves the selected design and completed replay baseline.
// Does not save or resume an unfinished flight.

(function () {
    "use strict";

    const STORAGE_KEY = "second-chance-save-v1";

    const catalogs = {
        instrument: instruments,
        solar: solarArrays,
        battery: batteries,
        orbit: orbits,
        launcher: launchers
    };

    // ---------- INTERFACE ----------

    const panel = document.createElement("section");

    panel.className = "panel";
    panel.style.marginTop = "24px";

    panel.innerHTML = `
        <p class="eyebrow">06 / SAVE YOUR WORK</p>

        <h2>Keep your mission designs.</h2>

        <p>
            Save your current design and your last completed original
            mission. Export a backup to move them to another browser
            or keep a separate copy.
        </p>

        <div class="mission-actions">
            <button id="save-now" type="button">
                Save now
            </button>

            <button id="export-save" type="button">
                Download backup
            </button>

            <button id="import-save" type="button">
                Import backup
            </button>
        </div>

        <input
            id="backup-file"
            type="file"
            accept=".json,application/json"
            hidden
        >

        <p id="save-status" class="feedback" aria-live="polite"></p>

        <p class="help">
            Automatic saving uses this browser's local storage.
            Private browsing, clearing browser data, moving the files,
            or switching to the published website may make local saves
            unavailable. Download a backup before moving your game.
            Unfinished flights are not resumed.
        </p>
    `;

    document.querySelector("main").insertBefore(
        panel,
        document.querySelector("main footer")
    );

    function status(message) {
        $("save-status").textContent = message;
    }

    // ---------- CREATE SAVE DATA ----------

    function makeSave() {
        return {
            format: "mission-second-chance",
            version: 1,
            savedAt: new Date().toISOString(),
            design: selectedKeys(),
            baseline: replayBaseline
        };
    }

    function saveToBrowser() {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(makeSave())
            );

            status(
                "Saved in this browser: spacecraft design and any " +
                "completed original mission recording. " +
                "An unfinished flight is not included."
            );

            return true;
        } catch (error) {
            status(
                "Browser saving is unavailable. " +
                "Use Download backup to keep your design and recording."
            );

            return false;
        }
    }

    // ---------- VALIDATE IMPORTED DATA ----------

    function validDesign(keys) {
        if (!keys || typeof keys !== "object") {
            return false;
        }

        return Object.keys(catalogs).every(function (name) {
            return Object.prototype.hasOwnProperty.call(
                catalogs[name],
                keys[name]
            );
        });
    }

    function validNumber(value, maximum) {
        return (
            typeof value === "number" &&
            Number.isFinite(value) &&
            value >= 0 &&
            value <= maximum
        );
    }

    function validateSave(data) {
        if (
            !data ||
            data.format !== "mission-second-chance" ||
            data.version !== 1 ||
            !validDesign(data.design)
        ) {
            throw new Error("This is not a compatible game backup.");
        }

        const baseline = data.baseline;

        if (baseline !== null) {
            if (
                !baseline ||
                !validDesign(baseline.keys) ||
                !Array.isArray(baseline.actions) ||
                !Number.isInteger(baseline.turns) ||
                baseline.turns < 1 ||
                baseline.turns > rules.turns ||
                baseline.actions.length !== baseline.turns
            ) {
                throw new Error("The mission recording is invalid.");
            }

            const validActions = baseline.actions.every(function (action) {
                return ["observe", "transmit", "coast"].includes(action);
            });

            if (!validActions) {
                throw new Error("The backup contains an unknown action.");
            }

            const numericFields = [
                ["delivered", 100000],
                ["energy", 1000],
                ["stored", rules.storage],
                ["lostData", 100000],
                ["cost", 1000]
            ];

            for (const [name, maximum] of numericFields) {
                if (!validNumber(baseline[name], maximum)) {
                    throw new Error("The backup contains invalid results.");
                }
            }

            if (
                typeof baseline.success !== "boolean" ||
                typeof baseline.powerFailure !== "boolean"
            ) {
                throw new Error("The mission outcome is invalid.");
            }
        }

        return data;
    }

    // ---------- RESTORE DESIGN AND RECORDING ----------

    function applySave(data) {
        for (const name of Object.keys(catalogs)) {
            selections[name].value = data.design[name];
        }

        replayBaseline = data.baseline;

        updateDesign();

        $("restore-baseline").disabled = !replayBaseline;
        $("run-replay").disabled = !replayBaseline;
        $("replay-comparison").hidden = true;

        if (replayBaseline) {
            setText(
                "replay-status",
                `Restored a recording of ${replayBaseline.turns} turns, ` +
                `with ${Math.round(replayBaseline.delivered)} useful-data ` +
                "units delivered. Click Restore last mission design, " +
                "change one component, and run Second Chance."
            );
        } else {
            setText(
                "replay-status",
                "Design restored. Complete a mission to unlock Second Chance."
            );
        }
    }

    // ---------- BUTTONS ----------

    $("save-now").addEventListener("click", saveToBrowser);

    $("export-save").addEventListener("click", function () {
        const data = JSON.stringify(makeSave(), null, 2);

        const blob = new Blob(
            [data],
            { type: "application/json" }
        );

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "second-chance-backup.json";

        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(function () {
            URL.revokeObjectURL(url);
        }, 1000);

        status(
            "Backup download requested. Check your browser's Downloads. " +
            "It contains your design and completed original mission recording."
        );
    });

    $("import-save").addEventListener("click", function () {
        if (mission && !mission.finished) {
            status(
                "Finish or abort the active mission before importing a backup."
            );
            return;
        }

        $("backup-file").click();
    });

    $("backup-file").addEventListener("change", async function (event) {
        const file = event.target.files[0];

        if (!file) {
            return;
        }

        try {
            if (mission && !mission.finished) {
                throw new Error("Finish or abort the active mission first.");
            }

            if (file.size > 100000) {
                throw new Error("This file is too large to be a game backup.");
            }

            const data = validateSave(
                JSON.parse(await file.text())
            );

            if (!window.confirm(
                "Replace your current design and original mission recording " +
                "with this backup?"
            )) {
                return;
            }

            if (mission) {
                $("return-design").click();
            }

            applySave(data);

            if (saveToBrowser()) {
                status(
                    "Backup imported and saved in this browser. " +
                    "Your design and original recording are ready."
                );
            } else {
                status(
                    "Backup imported, but browser saving is unavailable. " +
                    "Keep the downloaded backup."
                );
            }
        } catch (error) {
            status("Import failed: " + error.message);
        } finally {
            event.target.value = "";
        }
    });

    // ---------- AUTOMATIC SAVING ----------

    // These run after the designer's existing change handlers.
    for (const control of controls) {
        control.addEventListener("change", saveToBrowser);
    }

    $("reset").addEventListener("click", saveToBrowser);

    $("restore-baseline").addEventListener("click", function () {
        if (!mission || mission.finished) {
            saveToBrowser();
        }
    });

    // Keep the replay system's existing mission-completion handler.
    const finishWithReplay = finishMission;

    finishMission = function (powerFailure) {
        finishWithReplay(powerFailure);
        saveToBrowser();
    };

    // ---------- LOAD WHEN THE PAGE OPENS ----------

    try {
        const stored = localStorage.getItem(STORAGE_KEY);

        if (stored) {
            const data = validateSave(JSON.parse(stored));

            applySave(data);

            status(
                "Saved design restored" +
                (replayBaseline ? ", including your original mission recording." : ".") +
                " No unfinished flight was resumed."
            );
        } else {
            status(
                "Automatic saving is ready. Changes to your design and " +
                "newly completed mission recordings will be saved here."
            );
        }
    } catch (error) {
        status(
            "No usable browser save could be loaded. " +
            "You can still play or import a downloaded backup."
        );
    }
})();