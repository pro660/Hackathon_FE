"use client";

import { useEffect, useRef, useState } from "react";
import {
  LngLat,
  LngLatBounds,
  Map as MapLibreMap,
  Marker,
  Popup,
  type FillExtrusionLayerSpecification,
} from "maplibre-gl";

import type { PlaceRecommendation } from "@/types/place";

type PlaceMapProps = {
  places: PlaceRecommendation[];
  areaLabel?: string;
  heightClassName?: string;
  selectedPlaceId?: string;
  onMarkerSelect?: (place: PlaceRecommendation) => void;
};

type MarkerEntry = {
  marker: Marker;
  element: HTMLButtonElement;
  handleClick: () => void;
};

const OPEN_FREE_MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const MIN_ZOOM_OUT_AMOUNT = 0.45;
const MAX_ZOOM_OUT_AMOUNT = 1.4;
const MAX_ZOOM_OUT_DISTANCE_METERS = 2_500;

function getZoomOutAmount(distanceMeters: number) {
  const distanceRatio = Math.min(
    Math.max(distanceMeters / MAX_ZOOM_OUT_DISTANCE_METERS, 0),
    1,
  );

  return (
    MIN_ZOOM_OUT_AMOUNT +
    (MAX_ZOOM_OUT_AMOUNT - MIN_ZOOM_OUT_AMOUNT) * distanceRatio
  );
}

const buildingLayer: FillExtrusionLayerSpecification = {
  id: "place-match-3d-buildings",
  type: "fill-extrusion",
  source: "openmaptiles",
  "source-layer": "building",
  minzoom: 13.5,
  paint: {
    "fill-extrusion-color": [
      "interpolate",
      ["linear"],
      ["coalesce", ["get", "render_height"], ["get", "height"], 8],
      0,
      "#ded8cf",
      30,
      "#cfc5b8",
      100,
      "#b8aa9a",
    ],
    "fill-extrusion-height": [
      "interpolate",
      ["linear"],
      ["zoom"],
      13.5,
      0,
      15,
      ["coalesce", ["get", "render_height"], ["get", "height"], 8],
    ],
    "fill-extrusion-base": [
      "coalesce",
      ["get", "render_min_height"],
      ["get", "min_height"],
      0,
    ],
    "fill-extrusion-opacity": 0.82,
    "fill-extrusion-vertical-gradient": true,
  },
};

function addBuildingLayer(map: MapLibreMap) {
  if (!map.getSource("openmaptiles") || map.getLayer(buildingLayer.id)) {
    return;
  }

  const labelLayerId = map
    .getStyle()
    .layers.find(
      (layer) =>
        layer.type === "symbol" && Boolean(layer.layout?.["text-field"]),
    )?.id;

  map.addLayer(buildingLayer, labelLayerId);
}

function createMarkerElement(place: PlaceRecommendation, index: number) {
  const element = document.createElement("button");
  element.type = "button";
  element.className = "place-map-marker";
  element.dataset.selected = "false";
  element.setAttribute("aria-label", `${place.name} 마커`);
  element.textContent = String(index + 1);

  return element;
}

export function PlaceMap({
  places,
  areaLabel = "추천 지역",
  heightClassName = "h-[220px]",
  selectedPlaceId,
  onMarkerSelect,
}: PlaceMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef(new Map<string, MarkerEntry>());
  const popupRef = useRef<Popup | null>(null);
  const onMarkerSelectRef = useRef(onMarkerSelect);
  const [mapStatus, setMapStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  useEffect(() => {
    onMarkerSelectRef.current = onMarkerSelect;
  }, [onMarkerSelect]);

  useEffect(() => {
    const container = mapContainerRef.current;
    const firstPlace = places[0];

    if (!container || !firstPlace || mapRef.current) {
      return;
    }

    const map = new MapLibreMap({
      container,
      style: OPEN_FREE_MAP_STYLE,
      center: [
        firstPlace.coordinates.longitude,
        firstPlace.coordinates.latitude,
      ],
      zoom: 15.2,
      pitch: 58,
      bearing: -18,
      canvasContextAttributes: { antialias: true },
      attributionControl: false,
      maxPitch: 70,
    });

    let hasInitializedStyle = false;
    const handleStyleReady = () => {
      if (hasInitializedStyle || !map.getSource("openmaptiles")) {
        return;
      }

      hasInitializedStyle = true;
      addBuildingLayer(map);
      setMapStatus("ready");
    };
    const handleError = () => {
      if (!map.loaded()) {
        setMapStatus("error");
      }
    };

    map.on("styledata", handleStyleReady);
    map.on("load", handleStyleReady);
    map.on("error", handleError);
    mapRef.current = map;

    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      map.off("styledata", handleStyleReady);
      map.off("load", handleStyleReady);
      map.off("error", handleError);
      map.remove();
      mapRef.current = null;
    };
  }, [places]);

  useEffect(() => {
    const map = mapRef.current;
    const markers = markersRef.current;

    if (!map || mapStatus !== "ready") {
      return;
    }

    markers.forEach(({ marker, element, handleClick }) => {
      element.removeEventListener("click", handleClick);
      marker.remove();
    });
    markers.clear();

    const bounds = new LngLatBounds();

    places.forEach((place, index) => {
      const coordinates: [number, number] = [
        place.coordinates.longitude,
        place.coordinates.latitude,
      ];
      const element = createMarkerElement(place, index);
      const handleClick = () => onMarkerSelectRef.current?.(place);
      const marker = new Marker({ element, anchor: "bottom" })
        .setLngLat(coordinates)
        .addTo(map);

      element.addEventListener("click", handleClick);
      markers.set(place.id, { marker, element, handleClick });
      bounds.extend(coordinates);
    });

    if (places.length > 1) {
      map.fitBounds(bounds, {
        padding: { top: 54, right: 38, bottom: 52, left: 38 },
        maxZoom: 15.4,
        pitch: 52,
        bearing: -18,
        duration: 0,
      });
    }

    return () => {
      markers.forEach(({ marker, element, handleClick }) => {
        element.removeEventListener("click", handleClick);
        marker.remove();
      });
      markers.clear();
    };
  }, [mapStatus, places]);

  useEffect(() => {
    const map = mapRef.current;
    const selectedPlace = places.find((place) => place.id === selectedPlaceId);

    markersRef.current.forEach(({ element }, id) => {
      const isSelected = id === selectedPlaceId;
      element.dataset.selected = String(isSelected);
      element.setAttribute("aria-pressed", String(isSelected));
    });

    if (!map || mapStatus !== "ready" || !selectedPlace) {
      popupRef.current?.remove();
      return;
    }

    const coordinates: [number, number] = [
      selectedPlace.coordinates.longitude,
      selectedPlace.coordinates.latitude,
    ];

    popupRef.current?.remove();
    popupRef.current = new Popup({
      anchor: "bottom",
      className: "place-map-popup",
      closeButton: false,
      closeOnClick: false,
      offset: 42,
    })
      .setLngLat(coordinates)
      .setText(selectedPlace.name)
      .addTo(map);

    map.stop();
    const destination = new LngLat(coordinates[0], coordinates[1]);
    const distanceToDestination = map.getCenter().distanceTo(destination);
    const zoomOutAmount = getZoomOutAmount(distanceToDestination);
    const targetZoom = Math.max(map.getZoom(), 15.3);
    map.flyTo({
      center: coordinates,
      zoom: targetZoom,
      minZoom: Math.max(targetZoom - zoomOutAmount, map.getMinZoom()),
      pitch: 56,
      bearing: -18,
      duration: 2_000,
      essential: true,
    });

    return () => {
      map.stop();
    };
  }, [mapStatus, places, selectedPlaceId]);

  return (
    <figure>
      <section
        id="place-map"
        aria-label="추천 장소 3D 지도"
        className={`relative overflow-hidden rounded-[20px] border border-[#ebe7e1] bg-[#efebe5] ${heightClassName}`}
      >
        <div className="absolute inset-0">
          <div ref={mapContainerRef} className="h-full w-full" />
        </div>

        {mapStatus === "error" && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#efebe5] px-8 text-center">
            <p className="text-xs leading-5 text-[#6f665b]">
              3D 지도를 불러오지 못했습니다. 네트워크 연결을 확인해 주세요.
            </p>
          </div>
        )}

        <p className="pointer-events-none absolute right-4 bottom-3 z-10 rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-medium tracking-[0.08em] text-[#7f7569] shadow-sm">
          {areaLabel} · SEOUL
        </p>
      </section>

      <figcaption className="mt-2 text-right text-[9px] leading-4 text-[#8b8277]">
        <a href="https://openfreemap.org/" target="_blank" rel="noreferrer">
          OpenFreeMap
        </a>{" "}
        <a
          href="https://www.openmaptiles.org/"
          target="_blank"
          rel="noreferrer"
        >
          © OpenMapTiles
        </a>{" "}
        Data from{" "}
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
        >
          OpenStreetMap
        </a>
      </figcaption>
    </figure>
  );
}
