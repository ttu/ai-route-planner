import React, { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import { Icon, LatLngBounds, LatLng } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Route } from "../types";
import { cities } from "../data/cities";

// Fix for default marker icons in react-leaflet
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import iconRetina from "leaflet/dist/images/marker-icon-2x.png";

const DefaultIcon = new Icon({
  iconUrl: icon,
  iconRetinaUrl: iconRetina,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const SmallIcon = new Icon({
  iconUrl: icon,
  iconRetinaUrl: iconRetina,
  shadowUrl: iconShadow,
  iconSize: [15, 24],
  iconAnchor: [7, 24],
});

// Component to handle map bounds
const MapBounds: React.FC<{
  routes: Route[];
  showAllCities: boolean;
}> = ({ routes, showAllCities }) => {
  const map = useMap();

  useEffect(() => {
    if (showAllCities) {
      // Get all available cities
      const points = cities.map(
        (city) => new LatLng(city.coordinates.lat, city.coordinates.lng)
      );
      const bounds = new LatLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (routes.length > 0) {
      // Get all cities from all routes
      const allCities = routes.flatMap((route) => route.cities);
      const points = allCities.map(
        (city) => new LatLng(city.coordinates.lat, city.coordinates.lng)
      );
      const bounds = new LatLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, routes, showAllCities]);

  return null;
};

interface MapComponentProps {
  route: Route | null;
  allRoutes?: Route[];
  selectedIndex?: number | null;
}

const MapComponent: React.FC<MapComponentProps> = ({
  route,
  allRoutes = [],
  selectedIndex = null,
}) => {
  const routeColors = ["#1976d2", "#dc004e", "#388e3c", "#f57c00", "#7b1fa2"];

  // Get all cities that are part of any route
  const routeCities = new Set(
    allRoutes.flatMap((r) => r.cities.map((city) => city.id))
  );

  return (
    <MapContainer
      style={{ width: "100%", height: "500px", borderRadius: "8px" }}
      center={[39.8283, -98.5795]} // Center of USA
      zoom={4}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Show all available cities as small markers */}
      {cities.map((city) => {
        const isRouteCity = routeCities.has(city.id);
        if (!isRouteCity) {
          return (
            <Marker
              key={`all-${city.id}`}
              position={[city.coordinates.lat, city.coordinates.lng]}
              icon={SmallIcon}
              opacity={0.6}
            >
              <Popup>
                {city.name}, {city.state}
              </Popup>
            </Marker>
          );
        }
        return null;
      })}

      {/* Show all route options */}
      {allRoutes.map((routeOption, routeIndex) => (
        <React.Fragment key={routeIndex}>
          {routeOption.cities.map((city, cityIndex) => (
            <Marker
              key={`route-${routeIndex}-${city.id}`}
              position={[city.coordinates.lat, city.coordinates.lng]}
              icon={DefaultIcon}
              opacity={
                selectedIndex === null || selectedIndex === routeIndex ? 1 : 0.4
              }
            >
              <Popup>
                <strong>
                  Option {routeIndex + 1}, Stop {cityIndex + 1}
                  <br />
                  {city.name}, {city.state}
                </strong>
                {cityIndex < routeOption.distances.length && (
                  <div>
                    Next leg: {routeOption.distances[cityIndex]}{" "}
                    {routeOption.unit}
                  </div>
                )}
              </Popup>
            </Marker>
          ))}
          <Polyline
            positions={routeOption.cities.map((city) => [
              city.coordinates.lat,
              city.coordinates.lng,
            ])}
            color={routeColors[routeIndex % routeColors.length]}
            weight={
              selectedIndex === null || selectedIndex === routeIndex ? 3 : 2
            }
            opacity={
              selectedIndex === null || selectedIndex === routeIndex ? 1 : 0.4
            }
          />
        </React.Fragment>
      ))}

      {/* Add bounds control */}
      <MapBounds routes={allRoutes} showAllCities={allRoutes.length === 0} />
    </MapContainer>
  );
};

export default MapComponent;
