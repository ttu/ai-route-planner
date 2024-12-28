export interface City {
  id: string;
  name: string;
  state: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export type DistanceUnit = "km" | "mi";

export interface Route {
  cities: City[];
  distances: number[]; // distances between consecutive cities
  totalDistance: number;
  estimatedTime: number; // in minutes
  unit: DistanceUnit;
}

export interface RouteOptions {
  routes: Route[];
  selectedIndex: number | null;
}

export interface RouteUpdate {
  type: "traffic" | "weather" | "location";
  cityFrom?: string;
  cityTo?: string;
  description: string;
  impact: {
    additionalTime?: number; // in minutes
    severity: "low" | "medium" | "high";
  };
}

export interface UserLocation {
  coordinates: {
    lat: number;
    lng: number;
  };
  timestamp: number;
}
