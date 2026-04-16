import type { MapLocation } from '@/hooks/useMapLocations';

export type GeoExportFormat = 'kml' | 'gpx';

/** Escape for XML text content. */
function xmlEscape(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function locationDescription(loc: MapLocation): string {
  const parts: string[] = [];
  if (loc.diary_title) parts.push(`Diary: ${loc.diary_title}`);
  const geo = [loc.city, loc.country].filter(Boolean).join(', ');
  if (geo) parts.push(geo);
  return parts.join('\n');
}

export function buildKml(locations: MapLocation[], documentName: string): string {
  const placemarks = locations
    .map((loc) => {
      const name = xmlEscape(loc.name || loc.diary_title || 'Location');
      const desc = xmlEscape(locationDescription(loc));
      return [
        '    <Placemark>',
        `      <name>${name}</name>`,
        desc ? `      <description>${desc}</description>` : '',
        '      <Point>',
        `        <coordinates>${loc.lng},${loc.lat},0</coordinates>`,
        '      </Point>',
        '    </Placemark>',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<kml xmlns="http://www.opengis.net/kml/2.2">',
    '  <Document>',
    `    <name>${xmlEscape(documentName)}</name>`,
    placemarks,
    '  </Document>',
    '</kml>',
  ].join('\n');
}

export function buildGpx(locations: MapLocation[], creator: string): string {
  const waypoints = locations
    .map((loc) => {
      const name = xmlEscape(loc.name || loc.diary_title || 'Location');
      const desc = xmlEscape(locationDescription(loc));
      return [
        `  <wpt lat="${loc.lat}" lon="${loc.lng}">`,
        `    <name>${name}</name>`,
        desc ? `    <desc>${desc}</desc>` : '',
        '  </wpt>',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<gpx version="1.1" creator="${xmlEscape(creator)}" xmlns="http://www.topografix.com/GPX/1/1">`,
    waypoints,
    '</gpx>',
  ].join('\n');
}

export function formatMapExport(
  locations: MapLocation[],
  format: GeoExportFormat,
  title: string
): string {
  if (format === 'kml') return buildKml(locations, title);
  return buildGpx(locations, title);
}
