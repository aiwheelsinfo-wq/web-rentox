/**
 * Route parsing and formatting helper for Rentox.
 * Supports:
 * - Multi-stop pipe format: "Stop 1: Dadar, Mumbai | Stop 2: Andheri, Mumbai | Drop: Bandra, Mumbai"
 * - Multi-stop arrow format: "Stop 1: Dadar, Mumbai ➔ Stop 2: Andheri, Mumbai ➔ Drop: Bandra, Mumbai"
 * - Question mark legacy format: "Stop 1: Dadar, Mumbai ? Stop 2: Andheri, Mumbai ? Drop: Bandra, Mumbai"
 * - Single destination: "Bandra, Mumbai"
 */

export function parseRoute(rawAddress, defaultDrop = "Local Trip / Drop") {
  if (!rawAddress || !rawAddress.trim()) {
    return {
      raw: "",
      isMultiStop: false,
      intermediateStops: [],
      finalDrop: null,
      displayFinalDrop: defaultDrop,
      totalStopsCount: 0,
      stopsSummary: ""
    };
  }

  const raw = rawAddress.trim();
  const hasPipe = raw.includes('|');
  const hasArrow = raw.includes('➔') || raw.includes('->') || raw.includes('→');
  const hasStopPrefix = /stop\s*\d+/i.test(raw);
  const hasQuestionSeparator = raw.includes(' ? ') && hasStopPrefix;

  if (hasPipe || hasArrow || hasStopPrefix || hasQuestionSeparator) {
    let delimiter = '|';
    if (hasPipe) {
      delimiter = '|';
    } else if (raw.includes('➔')) {
      delimiter = '➔';
    } else if (raw.includes('->')) {
      delimiter = '->';
    } else if (raw.includes('→')) {
      delimiter = '→';
    } else if (hasQuestionSeparator) {
      delimiter = '?';
    }

    const rawSegments = raw
      .split(delimiter)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const intermediateStops = [];
    let finalDrop = null;

    rawSegments.forEach((segment) => {
      const isDrop = /^drop\s*:\s*/i.test(segment);
      const isStop = /^stop\s*\d+\s*:\s*/i.test(segment);

      if (isDrop) {
        const cleanAddress = segment.replace(/^drop\s*:\s*/i, '').trim();
        finalDrop = {
          label: 'Drop',
          address: cleanAddress,
          shortAddress: cleanAddress.split(',')[0].trim(),
          isFinalDrop: true
        };
      } else if (isStop) {
        const stopMatch = segment.match(/^stop\s*(\d+)\s*:\s*(.*)$/i);
        const stopNum = stopMatch ? stopMatch[1] : (intermediateStops.length + 1);
        const cleanAddress = (stopMatch ? stopMatch[2] : segment).trim();
        intermediateStops.push({
          label: `Stop ${stopNum}`,
          address: cleanAddress,
          shortAddress: cleanAddress.split(',')[0].trim(),
          isFinalDrop: false
        });
      } else {
        // Fallback segment without prefix
        if (intermediateStops.length > 0 && !finalDrop) {
          finalDrop = {
            label: 'Drop',
            address: segment,
            shortAddress: segment.split(',')[0].trim(),
            isFinalDrop: true
          };
        } else {
          intermediateStops.push({
            label: `Stop ${intermediateStops.length + 1}`,
            address: segment,
            shortAddress: segment.split(',')[0].trim(),
            isFinalDrop: false
          });
        }
      }
    });

    const isMultiStop = intermediateStops.length > 0;
    const displayFinalDrop = finalDrop ? finalDrop.address : (intermediateStops.length > 0 ? intermediateStops[intermediateStops.length - 1].address : defaultDrop);
    const stopsSummary = intermediateStops.map(s => s.shortAddress).join(' • ');

    return {
      raw,
      isMultiStop,
      intermediateStops,
      finalDrop,
      displayFinalDrop,
      totalStopsCount: intermediateStops.length + (finalDrop ? 1 : 0),
      stopsSummary
    };
  }

  // Single destination string
  const clean = raw.replace(/^drop\s*:\s*/i, '').trim();
  return {
    raw,
    isMultiStop: false,
    intermediateStops: [],
    finalDrop: {
      label: 'Drop',
      address: clean,
      shortAddress: clean.split(',')[0].trim(),
      isFinalDrop: true
    },
    displayFinalDrop: clean,
    totalStopsCount: 1,
    stopsSummary: ""
  };
}

/**
 * Builds formatted pipe string from intermediate stops array and drop address
 */
export function buildRouteString(intermediateStops = [], dropAddress = '') {
  const segments = [];
  intermediateStops.forEach((st, idx) => {
    const text = typeof st === 'string' ? st.trim() : (st?.address || '').trim();
    if (text) {
      segments.push(`Stop ${idx + 1}: ${text}`);
    }
  });

  const dropText = (dropAddress || '').trim();
  if (dropText) {
    if (segments.length > 0) {
      segments.push(`Drop: ${dropText}`);
    } else {
      segments.push(dropText);
    }
  }

  return segments.join(' | ');
}

export default {
  parseRoute,
  buildRouteString
};
