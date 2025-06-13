"use client";
import { useState, useRef, useCallback } from "react";
import { useRouter } from 'next/navigation';
import dynamic from "next/dynamic";
import "mapbox-gl/dist/mapbox-gl.css";

const Map = dynamic(() => import("react-map-gl"), {
  ssr: false,
  loading: () => <div>Loading map...</div>
});
const Marker = dynamic(() => import("react-map-gl").then(mod => mod.Marker), { ssr: false });

const MAPBOX_TOKEN = "pk.eyJ1IjoiaGltNG5zaHUiLCJhIjoiY21iYmQ4cjk0MHYwYzJscHY1Ymg0d3o5MSJ9.te_0FascQG8XXYPOVwJC5A";

export default function NewStory() {
  const [marker, setMarker] = useState(null);
  const [form, setForm] = useState({ title: "", content: "" });
  const [message, setMessage] = useState("");
  const mapRef = useRef();

  const handleMapClick = useCallback((event) => {
    const { lng, lat } = event.lngLat;
    setMarker({ lng, lat });
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    if (!marker) {
      setMessage("Please pick a location on the map.");
      return;
    }
    // TODO: Add authentication and send token if needed
    const res = await fetch("http://localhost:5000/api/stories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, lat: marker.lat, lng: marker.lng }),
    });
    const data = await res.json();
    setMessage(res.ok ? "Story submitted!" : data.message || "Error");
    if (res.ok) setForm({ title: "", content: "" });
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Add a New Story</h2>
      <div className="mb-6" style={{ height: 400 }}>
        <Map
          ref={mapRef}
          initialViewState={{ longitude: 77.209, latitude: 28.6139, zoom: 4 }}
          style={{ width: "100%", height: 400, borderRadius: 8 }}
          mapStyle="mapbox://styles/mapbox/streets-v11"
          mapboxAccessToken={MAPBOX_TOKEN}
          onClick={handleMapClick}
        >
          {marker && (
            <Marker longitude={marker.lng} latitude={marker.lat} color="red" />
          )}
        </Map>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input
            name="title"
            type="text"
            placeholder="Story title"
            value={form.title}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Content</label>
          <textarea
            name="content"
            placeholder="Share your story..."
            value={form.content}
            onChange={handleChange}
            required
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Location</label>
          <input
            type="text"
            value={marker ? `${marker.lat.toFixed(5)}, ${marker.lng.toFixed(5)}` : "Click on the map to select"}
            readOnly
            className="mt-1 block w-full rounded-md border-gray-200 bg-gray-100"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Submit Story
        </button>
      </form>
      {message && <p className="mt-4 text-center text-blue-600">{message}</p>}
    </div>
  );
} 