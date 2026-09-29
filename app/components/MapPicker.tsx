"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Perbaikan ikon marker bawaan Leaflet untuk Next.js
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface MapPickerProps {
  onLocationSelect: (mapsLink: string, addressText: string) => void;
}

export default function MapPicker({ onLocationSelect }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [markerPos, setMarkerPos] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [addressText, setAddressText] = useState<string>("");
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerInstanceRef = useRef<L.Marker | null>(null);

  const defaultCenter: [number, number] = [-8.5833, 116.1167];

  // Fungsi untuk mengambil teks alamat dari koordinat (Reverse Geocoding Nominatim)
  const fetchAddressName = async (
    lat: number,
    lng: number,
    isMountedRef: { current: boolean },
  ) => {
    if (!isMountedRef.current) return;
    setIsLoadingAddress(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            "User-Agent": "MaqlupastinaPreOrderApp/1.0",
          },
        },
      );
      const data = await response.json();
      if (!isMountedRef.current) return;
      if (data && data.display_name) {
        setAddressText(data.display_name);
        onLocationSelect(
          `https://www.google.com/maps?q=${lat},${lng}`,
          data.display_name,
        );
      } else {
        const fallback = `Koordinat: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        setAddressText(fallback);
        onLocationSelect(
          `https://www.google.com/maps?q=${lat},${lng}`,
          fallback,
        );
      }
    } catch (error) {
      if (!isMountedRef.current) return;
      console.error("Gagal mengambil teks alamat:", error);
      const fallback = `Koordinat: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setAddressText(fallback);
      onLocationSelect(`https://www.google.com/maps?q=${lat},${lng}`, fallback);
    } finally {
      if (isMountedRef.current) {
        setIsLoadingAddress(false);
      }
    }
  };

  const updateMarker = (
    map: L.Map,
    lat: number,
    lng: number,
    isMountedRef: { current: boolean },
  ) => {
    if (!mapInstanceRef.current || !isMountedRef.current) return;
    if (markerInstanceRef.current) {
      markerInstanceRef.current.setLatLng([lat, lng]);
    } else {
      const marker = L.marker([lat, lng], { draggable: true }).addTo(map);

      marker.on("dragend", () => {
        if (!isMountedRef.current) return;
        const pos = marker.getLatLng();
        setMarkerPos({ lat: pos.lat, lng: pos.lng });
        fetchAddressName(pos.lat, pos.lng, isMountedRef);
      });

      markerInstanceRef.current = marker;
    }
  };

  useEffect(() => {
    const isMountedRef = { current: true };
    const container = mapRef.current;
    if (!container) return;

    // Bersihkan sisa ID Leaflet pada DOM container untuk mencegah konflik
    if ((container as any)._leaflet_id) {
      (container as any)._leaflet_id = null;
    }

    const map = L.map(container).setView(defaultCenter, 14);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    mapInstanceRef.current = map;

    map.on("click", (e) => {
      if (!isMountedRef.current) return;
      const { lat, lng } = e.latlng;
      setMarkerPos({ lat, lng });
      updateMarker(map, lat, lng, isMountedRef);
      fetchAddressName(lat, lng, isMountedRef);
    });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!isMountedRef.current || !mapInstanceRef.current) return;
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setMarkerPos({ lat, lng });
          mapInstanceRef.current.setView([lat, lng], 16);
          updateMarker(mapInstanceRef.current, lat, lng, isMountedRef);
          fetchAddressName(lat, lng, isMountedRef);
        },
        (error) => {
          if (!isMountedRef.current || !mapInstanceRef.current) return;
          setMarkerPos({ lat: defaultCenter[0], lng: defaultCenter[1] });
          updateMarker(
            mapInstanceRef.current,
            defaultCenter[0],
            defaultCenter[1],
            isMountedRef,
          );
          fetchAddressName(defaultCenter[0], defaultCenter[1], isMountedRef);
        },
        { enableHighAccuracy: true, timeout: 8000 },
      );
    }

    return () => {
      isMountedRef.current = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerInstanceRef.current = null;
      }
    };
  }, []);

  const handleManualRecenter = () => {
    if (!navigator.geolocation) {
      alert("Browser Anda tidak mendukung layanan lokasi.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setMarkerPos({ lat, lng });
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 16);
          updateMarker(mapInstanceRef.current, lat, lng, { current: true });
        }
        fetchAddressName(lat, lng, { current: true });
        // Alert telah dihapus di sini
      },
      () => {
        alert("Gagal mendeteksi lokasi GPS. Pastikan izin akses aktif.");
      },
      { enableHighAccuracy: true },
    );
  };

  return (
    <div className="flex flex-col gap-3 font-sans">
      <div className="flex items-center justify-between font-sans">
        <span className="text-xs font-bold text-text-main/70 font-sans">
          Geser pin atau klik pada peta untuk menyesuaikan lokasi:
        </span>
        <button
          type="button"
          onClick={handleManualRecenter}
          className="text-xs bg-primary/10 text-primary font-bold px-3 py-1.5 rounded-lg hover:bg-primary/20 transition font-sans shadow-sm"
        >
          📍 Pusatkan GPS
        </button>
      </div>

      <div
        ref={mapRef}
        className="w-full h-72 rounded-2xl border border-gray-200 shadow-inner z-10 font-sans"
      />

      <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 font-sans">
        <span className="text-[11px] font-bold uppercase tracking-wider text-text-main/60 block mb-1 font-sans">
          Alamat Terdeteksi dari Peta:
        </span>
        <p className="text-xs font-semibold text-text-main font-sans">
          {isLoadingAddress
            ? "Mencari nama jalan..."
            : addressText || "Memuat lokasi..."}
        </p>
      </div>
    </div>
  );
}
