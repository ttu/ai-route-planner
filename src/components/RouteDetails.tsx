import React, { useEffect, useState } from "react";
import { Box, Typography, Paper, Divider } from "@mui/material";
import { Route, RouteUpdate } from "../types";
import { generateRouteDescription } from "../services/openai";

interface RouteDetailsProps {
  route: Route | null;
  updates: RouteUpdate[];
}

const RouteDetails: React.FC<RouteDetailsProps> = ({ route, updates }) => {
  const [description, setDescription] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDescription = async () => {
      if (!route) return;
      setLoading(true);
      try {
        const desc = await generateRouteDescription(route, updates);
        setDescription(desc);
      } catch (error) {
        console.error("Error fetching route description:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDescription();
  }, [route, updates]);

  if (!route) return null;

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Route Details
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Typography
          variant="body1"
          component="div"
          gutterBottom
          sx={{
            whiteSpace: "pre-wrap",
            "& p": { marginBottom: 2 },
            "& ul": { marginTop: 1, marginBottom: 2, paddingLeft: 2 },
            "& li": { marginBottom: 1 },
          }}
        >
          {loading ? "Generating route description..." : description}
        </Typography>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle1" gutterBottom>
        Cities ({route.cities.length})
      </Typography>
      <Box sx={{ mb: 2 }}>
        {route.cities.map((city, index) => (
          <Typography key={city.id} variant="body2">
            {index + 1}. {city.name}, {city.state}
            {index < route.cities.length - 1 && (
              <Typography component="span" color="text.secondary">
                {" "}
                ({route.distances[index]} {route.unit})
              </Typography>
            )}
          </Typography>
        ))}
      </Box>

      <Typography variant="subtitle1" gutterBottom>
        Total Distance: {route.totalDistance} {route.unit}
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        Estimated Time: {Math.floor(route.estimatedTime / 60)}h{" "}
        {route.estimatedTime % 60}m
      </Typography>

      {updates.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" gutterBottom>
            Route Updates
          </Typography>
          {updates.map((update, index) => (
            <Typography
              key={index}
              variant="body2"
              color="text.secondary"
              gutterBottom
            >
              • {update.description}
              {update.impact.additionalTime &&
                ` (+${update.impact.additionalTime} minutes)`}
            </Typography>
          ))}
        </>
      )}
    </Paper>
  );
};

export default RouteDetails;
