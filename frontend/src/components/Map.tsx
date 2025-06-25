/// <reference types="vite/client" />
import React, { useRef, useEffect } from 'react';
import mapboxgl, { NavigationControl } from 'mapbox-gl';

// Type definitions for GeoJSON FeatureCollection (minimal)
interface FeatureGeometry {
  type: 'Point';
  coordinates: [number, number];
}
interface FeatureProperties {
  id: string;
  title: string;
  description?: string | null;
}
interface Feature {
  type: 'Feature';
  geometry: FeatureGeometry;
  properties: FeatureProperties;
}
interface FeatureCollection {
  type: 'FeatureCollection';
  features: Feature[];
}

interface MapClickCoords {
  lng: number;
  lat: number;
}
interface MapProps {
  features: FeatureCollection;
  onMapClick?: (coords: MapClickCoords) => void;
}

const Map: React.FC<MapProps> = ({ features, onMapClick }) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (mapRef.current) return;
    
    const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN as string;
    if (!mapboxToken) {
      console.error('Missing VITE_MAPBOX_TOKEN environment variable');
      return;
    }
    
    mapboxgl.accessToken = mapboxToken;
    const map = new mapboxgl.Map({
      container: mapContainer.current!, // <-- non-null assertion
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-123.1, 49.2],
      zoom: 9,
    });
    mapRef.current = map;

    map.on('load', () => {
      map.addControl(new NavigationControl(), 'top-right');
    });

    // Add error handling as recommended by Mapbox documentation
    map.on('error', (e) => {
      console.error('Mapbox error:', e);
    });

    map.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      if (typeof onMapClick === 'function') {
        onMapClick({ lng, lat });
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [onMapClick]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !features) return;

    const addPins = () => {
      if (map.getSource('pins')) {
        (map.getSource('pins') as mapboxgl.GeoJSONSource).setData(features);
      } else {
        map.addSource('pins', {
          type: 'geojson',
          data: features,
        });
        map.addLayer({
          id: 'pin-layer',
          type: 'circle',
          source: 'pins',
          paint: {
            'circle-radius': 6,
            'circle-color': '#007cbf',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fff',
          },
        });
      }
    };

    if (map.isStyleLoaded()) {
      addPins();
    } else {
      map.once('style.load', addPins);
    }
  }, [features]);

  return (
    <div
      ref={mapContainer}
      style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0
      }}
    />
  );
};

export default Map;
