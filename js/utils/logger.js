/**
 * Custom logger utility that can be enabled/disabled globally
 */
export const Logger = {
  // Enable/disable logging globally
  enabled: true,
  
  // Different log levels
  levels: {
    debug: true,
    info: true,
    warn: true,
    error: true
  },
  
  /**
   * Log a debug message
   * @param {string} message - The message to log
   * @param {any} data - Optional data to log
   */
  debug(message, data) {
    if (this.enabled && this.levels.debug) {
      if (data !== undefined) {
        console.debug(`[DEBUG] ${message}`, data);
      } else {
        console.debug(`[DEBUG] ${message}`);
      }
    }
  },
  
  /**
   * Log an info message
   * @param {string} message - The message to log
   * @param {any} data - Optional data to log
   */
  info(message, data) {
    if (this.enabled && this.levels.info) {
      if (data !== undefined) {
        console.info(`[INFO] ${message}`, data);
      } else {
        console.info(`[INFO] ${message}`);
      }
    }
  },
  
  /**
   * Log a warning message
   * @param {string} message - The message to log
   * @param {any} data - Optional data to log
   */
  warn(message, data) {
    if (this.enabled && this.levels.warn) {
      if (data !== undefined) {
        console.warn(`[WARN] ${message}`, data);
      } else {
        console.warn(`[WARN] ${message}`);
      }
    }
  },
  
  /**
   * Log an error message
   * @param {string} message - The message to log
   * @param {any} data - Optional data to log
   */
  error(message, data) {
    if (this.enabled && this.levels.error) {
      if (data !== undefined) {
        console.error(`[ERROR] ${message}`, data);
      } else {
        console.error(`[ERROR] ${message}`);
      }
    }
  },
  
  /**
   * General log function
   * @param {string} message - The message to log
   * @param {any} data - Optional data to log
   */
  log(message, data) {
    if (this.enabled) {
      if (data !== undefined) {
        console.log(`[LOG] ${message}`, data);
      } else {
        console.log(`[LOG] ${message}`);
      }
    }
  },
  
  /**
   * Enable or disable all logging
   * @param {boolean} isEnabled - Whether logging should be enabled
   */
  setEnabled(isEnabled) {
    this.enabled = isEnabled;
  },
  
  /**
   * Enable or disable a specific log level
   * @param {string} level - The log level to configure ('debug', 'info', 'warn', 'error')
   * @param {boolean} isEnabled - Whether this level should be enabled
   */
  setLevelEnabled(level, isEnabled) {
    if (this.levels.hasOwnProperty(level)) {
      this.levels[level] = isEnabled;
    }
  }
};

// Create a shorter alias for convenience
export const log = Logger.log.bind(Logger); 