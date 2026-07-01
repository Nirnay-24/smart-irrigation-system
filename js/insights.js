// ================================================================
//  insights.js — Water savings calculation logic
// ================================================================

export const GARDEN_CONFIG = {
    Garden1: { label: 'Garden 1', type: 'Open Channel',    flowRate: 0.4,   traditionalTime: 4  },
    Garden2: { label: 'Garden 2', type: 'Drip Irrigation', flowRate: 0.066, traditionalTime: 10 },
    Garden3: { label: 'Garden 3', type: 'Drip Irrigation', flowRate: 0.066, traditionalTime: 10 },
    Garden4: { label: 'Garden 4', type: 'Drip Irrigation', flowRate: 0.066, traditionalTime: 10 },
};

/**
 * Pairs ON/OFF history entries to calculate total smart irrigation time,
 * then computes water used, water saved, and saving percentage.
 */
export const calculateGardenInsights = (gardenName, history) => {
    const config = GARDEN_CONFIG[gardenName];
    if (!config) return null;

    if (!history || history.length === 0) {
        return {
            gardenName, config,
            cycles: 0, totalSmartMinutes: 0,
            smartWaterL: 0, traditionalWaterL: 0,
            waterSavedL: 0, savingPct: 0, timeSavedMin: 0,
            noData: true
        };
    }

    // Sort ascending by timestamp
    const toDate = (ts) => ts?.toDate ? ts.toDate() : new Date(ts);
    const sorted = [...history].sort((a, b) => toDate(a.timestamp) - toDate(b.timestamp));

    // Pair ON → OFF events
    let totalSmartMinutes = 0;
    let cycles             = 0;
    let lastOnTime         = null;

    sorted.forEach(entry => {
        const type = (entry.type || '').toLowerCase();
        const ts   = toDate(entry.timestamp);

        if (type.includes('on')) {
            lastOnTime = ts;
        } else if (type.includes('off') && lastOnTime) {
            const durationMin = (ts - lastOnTime) / 60000;
            // sanity: ignore durations < 0 or > 120 min (data anomalies)
            if (durationMin > 0 && durationMin < 120) {
                totalSmartMinutes += durationMin;
                cycles++;
            }
            lastOnTime = null;
        }
    });

    const smartWaterL       = totalSmartMinutes * config.flowRate;
    const traditionalWaterL = cycles * config.traditionalTime * config.flowRate;
    const waterSavedL       = Math.max(0, traditionalWaterL - smartWaterL);
    const savingPct         = traditionalWaterL > 0
        ? (waterSavedL / traditionalWaterL) * 100
        : 0;
    const timeSavedMin      = Math.max(0, (cycles * config.traditionalTime) - totalSmartMinutes);

    return {
        gardenName, config, cycles,
        totalSmartMinutes: +totalSmartMinutes.toFixed(2),
        smartWaterL:       +smartWaterL.toFixed(3),
        traditionalWaterL: +traditionalWaterL.toFixed(3),
        waterSavedL:       +waterSavedL.toFixed(3),
        savingPct:         +savingPct.toFixed(1),
        timeSavedMin:      +timeSavedMin.toFixed(2),
        noData:            cycles === 0
    };
};

/** Aggregate all 4 garden insights into totals */
export const calculateTotalInsights = (allInsights) => {
    const valid = allInsights.filter(i => i && !i.noData);
    if (valid.length === 0) return null;

    const totalSmart        = valid.reduce((s, i) => s + i.smartWaterL,       0);
    const totalTraditional  = valid.reduce((s, i) => s + i.traditionalWaterL, 0);
    const totalSaved        = valid.reduce((s, i) => s + i.waterSavedL,       0);
    const totalTimeSaved    = valid.reduce((s, i) => s + i.timeSavedMin,      0);
    const totalCycles       = valid.reduce((s, i) => s + i.cycles,            0);
    const avgSavingPct      = totalTraditional > 0
        ? (totalSaved / totalTraditional) * 100
        : 0;

    // Projected annual: extrapolate from average daily usage
    // Estimate days of data from oldest to newest cycle (rough)
    const annualMultiplier  = 365;
    const projectedSmartAnnual       = +(totalSmart      * annualMultiplier).toFixed(1);
    const projectedTraditionalAnnual = +(totalTraditional * annualMultiplier).toFixed(1);
    const projectedSavedAnnual       = +(totalSaved      * annualMultiplier).toFixed(1);

    return {
        totalSmartWaterL:        +totalSmart.toFixed(3),
        totalTraditionalWaterL:  +totalTraditional.toFixed(3),
        totalWaterSavedL:        +totalSaved.toFixed(3),
        avgSavingPct:            +avgSavingPct.toFixed(1),
        totalTimeSavedMin:       +totalTimeSaved.toFixed(2),
        totalCycles,
        projectedSmartAnnual,
        projectedTraditionalAnnual,
        projectedSavedAnnual,
    };
};
