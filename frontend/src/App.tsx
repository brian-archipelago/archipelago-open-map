// frontend/src/App.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import React, { useState, useEffect, FormEvent } from 'react';
import { supabase } from './supabaseClient';
import Map from './components/Map';

interface FeatureProperties {
  id: string;
  title: string;
  description?: string | null;
}

interface FeatureGeometry {
  type: 'Point';
  coordinates: [number, number];
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

export default function App() {
  const [features, setFeatures] = useState<FeatureCollection | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newCoords, setNewCoords] = useState<MapClickCoords>({ lng: 0, lat: 0 });
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Load existing pins
  useEffect(() => {
    async function fetchPins() {
      const { data, error } = await supabase
        .from('projects')
        .select('id,title,description,geom')
        .eq('is_public', true);

      if (error) {
        console.error('Error fetching pins:', error);
        return;
      }

      const geojson: FeatureCollection = {
        type: 'FeatureCollection',
        features: (data || []).map((item: any) => ({
          type: 'Feature',
          geometry: {
            type: item.geom.type,
            coordinates: item.geom.coordinates as [number, number],
          },
          properties: {
            id: item.id,
            title: item.title,
            description: item.description,
          },
        })),
      };
      setFeatures(geojson);
    }
    fetchPins();
  }, []);

  // Handle clicks from Map.tsx
  const handleMapClick = ({ lng, lat }: MapClickCoords) => {
    setNewCoords({ lng, lat });
    setModalOpen(true);
  };

  // Submit new pin
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Insert into Supabase
    const { data, error } = await supabase
      .from('projects')
      .insert([{
        title,
        description,
        is_public: isPublic,
        geom: { type: 'Point', coordinates: [newCoords.lng, newCoords.lat] }
      }])
      .select();

    const inserted = data && data[0];

    if (error || !inserted) {
      console.error('Insert error:', error);
      setSubmitting(false);
      return;
    }

    // Optimistically update map
    setFeatures(prev => {
      if (!prev) return prev;
      const newFeature: Feature = {
        type: 'Feature',
        geometry: {
          type: inserted.geom.type,
          coordinates: inserted.geom.coordinates as [number, number],
        },
        properties: {
          id: inserted.id,
          title: inserted.title,
          description: inserted.description,
        },
      };
      return {
        ...prev,
        features: [...prev.features, newFeature]
      };
    });

    // Reset & close
    setTitle('');
    setDescription('');
    setIsPublic(true);
    setModalOpen(false);
    setSubmitting(false);
  };

  return (
  <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
    {features
      ? <Map features={features} onMapClick={handleMapClick} />
      : <p>Loading map…</p>
    }

    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Pin</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          <Input
            type="text"
            placeholder="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
          <Textarea
            placeholder="Description"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
          <Select
            value={isPublic ? "public" : "private"}
            onValueChange={val => setIsPublic(val === "public")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="private">Private</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Adding…" : "Add Pin"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
);
}
