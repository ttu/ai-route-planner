import React, { useState } from "react";
import {
  Box,
  TextField,
  Typography,
  Button,
  Autocomplete,
} from "@mui/material";
import { City, Route, DistanceUnit } from "../types";
import { parseUserInput } from "../services/openai";
import { calculateRouteOptions } from "../services/routeCalculator";

const EXAMPLE_PROMPTS = [
  "I want to travel from New York City to Los Angeles",
  "Show distances in kilometers",
  "Add Chicago to the route",
  "Route should avoid Houston",
  "Start from Seattle and go to Miami",
  "Add Denver to my journey",
  "Calculate route from Boston to San Francisco",
];

interface RouteInputProps {
  onRouteOptionsCalculated: (routes: Route[]) => void;
  onError: (error: string) => void;
  onOperationResponse: (response: string) => void;
}

const RouteInput: React.FC<RouteInputProps> = ({
  onRouteOptionsCalculated,
  onError,
  onOperationResponse,
}) => {
  const [input, setInput] = useState("");
  const [currentUnit, setCurrentUnit] = useState<DistanceUnit>("mi");
  const [currentCities, setCurrentCities] = useState<City[]>([]);
  const [currentRouteOptions, setCurrentRouteOptions] = useState<Route[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    try {
      const result = await parseUserInput(
        input,
        currentUnit,
        currentCities,
        currentRouteOptions
      );

      if (result.error) {
        onError(result.error);
        return;
      }

      if (result.selectedRoute) {
        // Handle route selection
        onRouteOptionsCalculated([result.selectedRoute]);
        onOperationResponse(result.operationResponse || "Route selected.");
        setCurrentRouteOptions([result.selectedRoute]);
        return;
      }

      if (result.selectedCities) {
        setCurrentCities(result.selectedCities);
        if (result.selectedCities.length >= 2) {
          const routes = calculateRouteOptions(
            result.selectedCities,
            currentUnit
          );
          setCurrentRouteOptions(routes);
          onRouteOptionsCalculated(routes);
        }
      }

      if (result.unit) {
        setCurrentUnit(result.unit);
        if (currentCities.length >= 2) {
          const routes = calculateRouteOptions(currentCities, result.unit);
          setCurrentRouteOptions(routes);
          onRouteOptionsCalculated(routes);
        }
      }

      if (result.operationResponse) {
        onOperationResponse(result.operationResponse);
      }
    } catch (error) {
      console.error("Error processing input:", error);
      onError("There was an error processing your request. Please try again.");
    }

    setInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleExampleSelect = (
    event: React.SyntheticEvent,
    value: string | null
  ) => {
    if (value) {
      setInput(value);
      // Submit the form immediately with the selected example
      handleSubmit(event);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ width: "100%", maxWidth: 600, margin: "0 auto" }}
    >
      <Typography variant="h6" gutterBottom>
        Enter your travel plans or commands
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Available cities: New York City, Los Angeles, Chicago, Houston, Phoenix,
        San Francisco, Seattle, Miami, Atlanta, Boston, Minneapolis, Denver,
        Dallas, Washington, Las Vegas, Detroit, Kansas City, New Orleans
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Examples: - "I want to travel from New York City to Los Angeles" - "Show
        distances in kilometers" - "Add Chicago to the route" - "Route should
        avoid Houston"
      </Typography>

      <Autocomplete
        freeSolo
        options={EXAMPLE_PROMPTS}
        value={input}
        onChange={handleExampleSelect}
        onInputChange={(event, newValue) => setInput(newValue)}
        renderInput={(params) => (
          <TextField
            {...params}
            fullWidth
            multiline
            rows={2}
            placeholder="Enter your request or select an example..."
            variant="outlined"
            onKeyPress={handleKeyPress}
          />
        )}
        sx={{ mb: 2 }}
      />

      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={!input.trim()}
        fullWidth
      >
        Submit
      </Button>
    </Box>
  );
};

export default RouteInput;
