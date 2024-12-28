import { City, Route, DistanceUnit } from "../types";
import { cities as allAvailableCities } from "../data/cities";

const KM_TO_MI = 0.621371;

// Haversine formula to calculate distance between two points
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  unit: DistanceUnit
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  // Add 30% to account for road distances vs. direct distance
  const distanceKm = R * c * 1.3;
  return unit === "km" ? distanceKm : distanceKm * KM_TO_MI;
};

// Calculate total distance of a route
const calculateTotalDistance = (
  cities: City[],
  unit: DistanceUnit
): number[] => {
  const distances: number[] = [];
  for (let i = 0; i < cities.length - 1; i++) {
    const distance = calculateDistance(
      cities[i].coordinates.lat,
      cities[i].coordinates.lng,
      cities[i + 1].coordinates.lat,
      cities[i + 1].coordinates.lng,
      unit
    );
    distances.push(Math.round(distance));
  }
  return distances;
};

// Estimate travel time in minutes (assuming average speed of 80 km/h or 50 mph)
const calculateEstimatedTime = (
  totalDistance: number,
  unit: DistanceUnit
): number => {
  const averageSpeed = unit === "km" ? 80 : 50; // km/h or mph
  return Math.round((totalDistance / averageSpeed) * 60);
};

// Calculate a route using nearest neighbor algorithm with custom weighting
const calculateRouteWithStrategy = (
  cities: City[],
  startCity: City,
  unit: DistanceUnit,
  distanceWeight: number = 1,
  randomWeight: number = 0
): Route => {
  const route: City[] = [startCity];
  const unvisited = new Set(cities.filter((city) => city.id !== startCity.id));

  while (unvisited.size > 0) {
    const current = route[route.length - 1];
    let best: City | null = null;
    let bestScore = Infinity;

    unvisited.forEach((city) => {
      const distance = calculateDistance(
        current.coordinates.lat,
        current.coordinates.lng,
        city.coordinates.lat,
        city.coordinates.lng,
        unit
      );
      // Score combines distance and random factor for variety
      const score = distance * distanceWeight + Math.random() * randomWeight;
      if (score < bestScore) {
        bestScore = score;
        best = city;
      }
    });

    if (best) {
      route.push(best);
      unvisited.delete(best);
    }
  }

  const distances = calculateTotalDistance(route, unit);
  const totalDistance = distances.reduce((a, b) => a + b, 0);
  const estimatedTime = calculateEstimatedTime(totalDistance, unit);

  return {
    cities: route,
    distances,
    totalDistance,
    estimatedTime,
    unit,
  };
};

// Get random cities that aren't already in the route
const getRandomCities = (
  existingCities: City[],
  count: number,
  nearTo?: City,
  maxDistance?: number,
  citiesToAvoid: City[] = []
): City[] => {
  const existingIds = new Set(existingCities.map((city) => city.id));
  const avoidIds = new Set(citiesToAvoid.map((city) => city.id));

  let availableCities = allAvailableCities.filter(
    (city) => !existingIds.has(city.id) && !avoidIds.has(city.id)
  );

  // If nearTo is specified, filter cities within maxDistance
  if (nearTo && maxDistance) {
    availableCities = availableCities.filter((city) => {
      const distance = calculateDistance(
        nearTo.coordinates.lat,
        nearTo.coordinates.lng,
        city.coordinates.lat,
        city.coordinates.lng,
        "km"
      );
      return distance <= maxDistance;
    });
  }

  // Shuffle array and take first n elements
  const shuffled = availableCities.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

// Insert cities into route at optimal positions
const insertCitiesIntoRoute = (
  baseRoute: City[],
  citiesToAdd: City[],
  unit: DistanceUnit
): City[] => {
  const route = [...baseRoute];

  for (const city of citiesToAdd) {
    let bestPosition = 0;
    let bestIncrease = Infinity;

    // Try each possible position
    for (let i = 1; i < route.length; i++) {
      const prev = route[i - 1];
      const next = route[i];

      // Calculate current distance between cities
      const currentDistance = calculateDistance(
        prev.coordinates.lat,
        prev.coordinates.lng,
        next.coordinates.lat,
        next.coordinates.lng,
        unit
      );

      // Calculate new total distance if we insert the city here
      const distanceWithNew =
        calculateDistance(
          prev.coordinates.lat,
          prev.coordinates.lng,
          city.coordinates.lat,
          city.coordinates.lng,
          unit
        ) +
        calculateDistance(
          city.coordinates.lat,
          city.coordinates.lng,
          next.coordinates.lat,
          next.coordinates.lng,
          unit
        );

      const increase = distanceWithNew - currentDistance;

      if (increase < bestIncrease) {
        bestIncrease = increase;
        bestPosition = i;
      }
    }

    // Insert the city at the best position
    route.splice(bestPosition, 0, city);
  }

  return route;
};

// Calculate two different route options from the same starting point
export const calculateRouteOptions = (
  cities: City[],
  unit: DistanceUnit = "km",
  citiesToAvoid: City[] = []
): Route[] => {
  if (cities.length <= 1) {
    const emptyRoute = {
      cities,
      distances: [],
      totalDistance: 0,
      estimatedTime: 0,
      unit,
    };
    return [emptyRoute, emptyRoute];
  }

  console.log("🔄 Calculating route options with random cities...");

  // Use the first city as the starting point for both routes
  const startCity = cities[0];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const endCity = cities[cities.length - 1];

  // Calculate base routes
  const baseOption1 = calculateRouteWithStrategy(cities, startCity, unit, 1, 0);
  const baseOption2 = calculateRouteWithStrategy(
    cities,
    startCity,
    unit,
    1,
    0.5
  );

  // Add different random cities to each route
  console.log("🎲 Adding random cities to routes...");

  // For option 1: Add 1-2 random cities near the middle of the route
  const midCity1 =
    baseOption1.cities[Math.floor(baseOption1.cities.length / 2)];
  const randomCities1 = getRandomCities(
    baseOption1.cities,
    1 + Math.floor(Math.random() * 2),
    midCity1,
    500,
    citiesToAvoid
  );
  console.log(
    "🏙️ Random cities for route 1:",
    randomCities1.map((c) => c.name)
  );

  // For option 2: Add 2-3 different random cities along the route
  const randomCities2 = getRandomCities(
    baseOption2.cities,
    2 + Math.floor(Math.random() * 2),
    undefined,
    undefined,
    citiesToAvoid
  );
  console.log(
    "🏙️ Random cities for route 2:",
    randomCities2.map((c) => c.name)
  );

  // Insert random cities into routes
  const routeWithRandom1 = insertCitiesIntoRoute(
    baseOption1.cities,
    randomCities1,
    unit
  );
  const routeWithRandom2 = insertCitiesIntoRoute(
    baseOption2.cities,
    randomCities2,
    unit
  );

  // Calculate final routes with added cities
  const distances1 = calculateTotalDistance(routeWithRandom1, unit);
  const distances2 = calculateTotalDistance(routeWithRandom2, unit);

  const option1: Route = {
    cities: routeWithRandom1,
    distances: distances1,
    totalDistance: distances1.reduce((a, b) => a + b, 0),
    estimatedTime: calculateEstimatedTime(
      distances1.reduce((a, b) => a + b, 0),
      unit
    ),
    unit,
  };

  const option2: Route = {
    cities: routeWithRandom2,
    distances: distances2,
    totalDistance: distances2.reduce((a, b) => a + b, 0),
    estimatedTime: calculateEstimatedTime(
      distances2.reduce((a, b) => a + b, 0),
      unit
    ),
    unit,
  };

  console.log("✅ Route options calculated:");
  console.log("Route 1:", option1.cities.map((c) => c.name).join(" → "));
  console.log("Route 2:", option2.cities.map((c) => c.name).join(" → "));

  // Return the shorter route first
  return option1.totalDistance <= option2.totalDistance
    ? [option1, option2]
    : [option2, option1];
};

// For backward compatibility
export const calculateOptimalRoute = (
  cities: City[],
  unit: DistanceUnit = "km"
): Route => {
  return calculateRouteOptions(cities, unit)[0];
};

// Calculate estimated time to reach a specific city in the route
export const calculateTimeToCity = (
  route: Route,
  targetCity: string,
  currentLocation?: { lat: number; lng: number }
): number | null => {
  const cityIndex = route.cities.findIndex((city) => city.id === targetCity);
  if (cityIndex === -1) return null;

  let totalDistance = 0;

  // If we have current location, calculate distance to first city
  if (currentLocation) {
    const firstCity = route.cities[0];
    totalDistance += calculateDistance(
      currentLocation.lat,
      currentLocation.lng,
      firstCity.coordinates.lat,
      firstCity.coordinates.lng,
      route.unit
    );
  }

  // Add distances up to target city
  for (let i = 0; i < cityIndex; i++) {
    totalDistance += route.distances[i];
  }

  return calculateEstimatedTime(totalDistance, route.unit);
};
