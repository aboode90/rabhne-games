/**
 * Rabhne Dynamic Stats System
 * Uses deterministic time-based algorithms to ensure all users see the same growing numbers.
 * Updates in real-time.
 */

const STATS_CONFIG = {
    // Epoch: Dec 1, 2024 (Fresh Start)
    START_TIME: 1733011200000,

    PLAYERS: {
        BASE: 0,              // Starting from 0
        GROWTH_PER_HOUR: 0.8, // Slightly faster growth to compensate
        JITTER: 2
    },

    PAID: {
        BASE: 0,              // Starting from $0
        GROWTH_PER_HOUR: 2.5, // Faster money growth
        MAX_INCREMENT: 5
    }
};

function initStats() {
    updateStats();
    // Update every 5 seconds to feel "alive" but not frantic
    setInterval(updateStats, 5000);
}

function updateStats() {
    const now = Date.now();
    const hoursElapsed = (now - STATS_CONFIG.START_TIME) / (1000 * 60 * 60);

    // --- Active Players Calculation ---
    // Linear growth + Sine wave for day/night cycle simulation
    const playersGrowth = Math.floor(hoursElapsed * STATS_CONFIG.PLAYERS.GROWTH_PER_HOUR);
    // Add a cycle so it varies by time of day (more active at night?)
    const timeCycle = Math.sin(now / (1000 * 60 * 60 * 12)) * 5;

    let currentPlayers = STATS_CONFIG.PLAYERS.BASE + playersGrowth + Math.floor(timeCycle);

    // --- Total Paid Calculation ---
    // Linear growth
    const paidGrowth = hoursElapsed * STATS_CONFIG.PAID.GROWTH_PER_HOUR;
    let currentPaid = STATS_CONFIG.PAID.BASE + paidGrowth;

    // Display
    animateValue('statPlayers', currentPlayers, 'Active Players');
    animateValue('statPaid', currentPaid, 'Total Paid', true);
}

function animateValue(elementId, value, label, isCurrency = false) {
    const element = document.getElementById(elementId);
    if (!element) return;

    // Format: 1.5K or $1,250
    let formatted;

    if (isCurrency) {
        if (value >= 1000) {
            formatted = '$' + (value / 1000).toFixed(1) + 'K';
        } else {
            formatted = '$' + Math.floor(value);
        }
    } else {
        if (value >= 1000) {
            formatted = '+' + (value / 1000).toFixed(1) + 'K';
        } else {
            formatted = '+' + Math.floor(value);
        }
    }

    // Simple DOM update (could add count-up anim here if desired)
    element.textContent = formatted;
}

// Start
document.addEventListener('DOMContentLoaded', initStats);
