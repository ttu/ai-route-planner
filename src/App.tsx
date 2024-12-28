import React, { useState } from "react";
import { Container, Box, Alert, Paper, Typography } from "@mui/material";
import { Route, RouteUpdate } from "./types";
import RouteInput from "./components/RouteInput";
import RouteDetails from "./components/RouteDetails";
import MapComponent from "./components/MapComponent";

const App: React.FC = () => {
  const [routeOptions, setRouteOptions] = useState<Route[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [operationResponse, setOperationResponse] = useState<string | null>(
    null
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [updates, setUpdates] = useState<RouteUpdate[]>([]);

  const handleRouteOptionsCalculated = (routes: Route[]) => {
    setRouteOptions(routes);
    setSelectedRouteIndex(null);
    setError(null);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleRouteSelected = (index: number) => {
    setSelectedRouteIndex(index);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setOperationResponse(null);
  };

  const handleOperationResponse = (response: string) => {
    setOperationResponse(response);
    setError(null);
  };

  const selectedRoute =
    selectedRouteIndex !== null ? routeOptions[selectedRouteIndex] : null;

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4, display: "flex", flexDirection: "column", gap: 3 }}>
        <RouteInput
          onRouteOptionsCalculated={handleRouteOptionsCalculated}
          onError={handleError}
          onOperationResponse={handleOperationResponse}
        />

        {operationResponse && (
          <Alert
            severity="success"
            sx={{
              mt: 2,
              whiteSpace: "pre-wrap",
              "& .MuiAlert-message": {
                width: "100%",
              },
            }}
          >
            {operationResponse}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        <MapComponent
          route={selectedRoute}
          allRoutes={routeOptions}
          selectedIndex={selectedRouteIndex}
        />

        {/* Show route options if available */}
        {routeOptions.length > 0 && (
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {selectedRouteIndex !== null
                ? "Selected Route Option"
                : "Available Route Options"}
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {routeOptions.map((route, index) => (
                <Paper
                  key={index}
                  elevation={1}
                  sx={{
                    p: 2,
                    border: 1,
                    borderColor: "divider",
                    bgcolor:
                      selectedRouteIndex === index
                        ? "action.selected"
                        : "background.paper",
                  }}
                >
                  <Typography variant="subtitle1" gutterBottom>
                    Option{" "}
                    {selectedRouteIndex !== null
                      ? selectedRouteIndex + 1
                      : index + 1}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Cities: {route.cities.map((city) => city.name).join(" → ")}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Total Distance: {route.totalDistance} {route.unit}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Estimated Time: {Math.floor(route.estimatedTime / 60)}h{" "}
                    {route.estimatedTime % 60}m
                  </Typography>
                </Paper>
              ))}
            </Box>
          </Paper>
        )}

        {selectedRoute && (
          <RouteDetails route={selectedRoute} updates={updates} />
        )}
      </Box>
    </Container>
  );
};

export default App;
