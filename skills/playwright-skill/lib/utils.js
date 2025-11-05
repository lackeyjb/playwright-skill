// utils.js
// General utility functions for the Playwright skill

const fs = require('fs');
const path = require('path');

/**
 * Clean up old files matching a pattern
 * @param {Object} options - Cleanup options
 * @param {string} options.directory - Directory to clean (defaults to current directory)
 * @param {Function} options.filter - Filter function to match files
 * @param {number} options.ageThresholdHours - Only delete files older than this (optional)
 * @param {boolean} options.silent - Suppress console output (default: true)
 * @returns {Object} Cleanup statistics
 */
function cleanupOldFiles(options = {}) {
  const {
    directory = '.',
    filter,
    ageThresholdHours = null,
    silent = true
  } = options;

  const stats = {
    filesDeleted: 0,
    spaceFreed: 0
  };

  try {
    const files = fs.readdirSync(directory);
    const matchingFiles = filter ? files.filter(filter) : files;

    if (matchingFiles.length > 0) {
      const now = Date.now();
      const ageThreshold = ageThresholdHours ? now - (ageThresholdHours * 60 * 60 * 1000) : null;

      matchingFiles.forEach(file => {
        const filePath = path.join(directory, file);
        try {
          const fileStats = fs.statSync(filePath);

          // Check age threshold if specified
          if (ageThreshold && fileStats.mtime.getTime() >= ageThreshold) {
            return; // Skip files that are too new
          }

          stats.spaceFreed += fileStats.size;
          fs.unlinkSync(filePath);
          stats.filesDeleted++;
        } catch (e) {
          // Ignore errors - file might be in use or already deleted
        }
      });

      // Log results if not silent
      if (!silent && stats.filesDeleted > 0) {
        const freedMB = (stats.spaceFreed / 1024 / 1024).toFixed(2);
        const ageInfo = ageThresholdHours ? ` (${ageThresholdHours}+ hours old)` : '';
        console.log(`🗑️  Cleaned up ${stats.filesDeleted} files${ageInfo}, freed ${freedMB}MB`);
      }
    }
  } catch (e) {
    // Ignore directory read errors
  }

  return stats;
}

module.exports = {
  cleanupOldFiles
};
