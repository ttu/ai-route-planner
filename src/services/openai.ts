import { OpenAI } from "openai";
import { City, Route, DistanceUnit, RouteUpdate } from "../types";
import { cities } from "../data/cities";
import { calculateRouteOptions } from "./routeCalculator";

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

const MODEL = "gpt-4o-mini";

interface ParseResult {
  selectedCities?: City[];
  unit?: DistanceUnit;
  route?: Route;
  update?: RouteUpdate;
  error?: string;
  operationResponse?: string;
  routeSelection?: "1" | "2";
  selectedRoute?: Route;
  routeOptions?: Route[];
}

export const parseUserInput = async (
  input: string,
  currentUnit: DistanceUnit,
  currentCities: City[] = [],
  currentRouteOptions?: Route[]
): Promise<ParseResult> => {
  console.log("🔄 Parsing user input:", {
    input,
    currentUnit,
    currentCities: currentCities.map((c) => c.name),
    hasRouteOptions: !!currentRouteOptions,
  });

  try {
    // Single comprehensive prompt to determine user's intention
    const actionResponse = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `You are a route planning assistant. Determine what action the user wants to perform.
          
          Return a JSON object with:
          - action: one of ["new_route", "select_route", "change_unit", "add_cities", "avoid_cities"]
          - cities: array of city names if starting a new route or adding cities, or null
          - avoidCities: array of city names to avoid in the route, or null
          - routeSelection: "1" or "2" if selecting a route, or null
          - unit: "km" or "mi" if changing units, or null
          - operationResponse: friendly response explaining what you understood and describing the routes if applicable
          
          Example inputs and responses:
          Input: "I want to travel from New York to Los Angeles"
          {
            "action": "new_route",
            "cities": ["New York City", "Los Angeles"],
            "avoidCities": null,
            "routeSelection": null,
            "unit": null,
            "operationResponse": "I understand you want to travel from New York City to Los Angeles. I'll help you plan this cross-country journey.\\n\\nI've found two possible routes for you:\\n\\nOption 1 takes you through Chicago and Denver, covering the northern states. This route offers a mix of major cities and scenic landscapes, including the Great Plains and Rocky Mountains.\\n\\nOption 2 goes via Atlanta and Dallas, taking a southern path. This route provides warmer weather and different cultural experiences through the South.\\n\\nYou can select either route by saying 'choose route 1' or 'choose route 2'."
          }

          Input: "Show distances in kilometers"
          {
            "action": "change_unit",
            "cities": null,
            "avoidCities": null,
            "routeSelection": null,
            "unit": "km",
            "operationResponse": "I'll switch to showing all distances in kilometers."
          }

          Input: "I prefer the first route"
          {
            "action": "select_route",
            "cities": null,
            "avoidCities": null,
            "routeSelection": "1",
            "unit": null,
            "operationResponse": "Great choice! I'll set up the first route for your journey."
          }

          Input: "Add Chicago to the route"
          {
            "action": "add_cities",
            "cities": ["Chicago"],
            "avoidCities": null,
            "routeSelection": null,
            "unit": null,
            "operationResponse": "I'll add Chicago to your route and recalculate the options.\\n\\nHere are your new route possibilities:\\n\\nOption 1 adds Chicago as a midpoint, taking you through [cities], which optimizes for shorter travel time.\\n\\nOption 2 incorporates Chicago while also including [cities], offering more varied stops.\\n\\nYou can select your preferred option by saying 'choose route 1' or 'choose route 2'."
          }

          Input: "Avoid Houston and Denver"
          {
            "action": "avoid_cities",
            "cities": null,
            "avoidCities": ["Houston", "Denver"],
            "routeSelection": null,
            "unit": null,
            "operationResponse": "I'll recalculate the routes to avoid Houston and Denver.\\n\\nHere are your new options:\\n\\nOption 1 takes an alternative path through [cities], bypassing both Houston and Denver.\\n\\nOption 2 routes you through [cities], also avoiding the specified cities while providing different scenery.\\n\\nYou can select your preferred route by saying 'choose route 1' or 'choose route 2'."
          }`,
        },
        {
          role: "user",
          content: `Current state:
          Unit: ${currentUnit}
          Current cities: ${currentCities.map((c) => c.name).join(", ")}
          Has route options: ${!!currentRouteOptions}
          ${
            currentRouteOptions && currentRouteOptions.length >= 2
              ? `
          Route options:
          Option 1: ${currentRouteOptions[0].cities
            .map((c) => c.name)
            .join(" → ")}
          Distance: ${currentRouteOptions[0].totalDistance} ${
                  currentRouteOptions[0].unit
                }
          Time: ${Math.floor(currentRouteOptions[0].estimatedTime / 60)}h ${
                  currentRouteOptions[0].estimatedTime % 60
                }m

          Option 2: ${currentRouteOptions[1].cities
            .map((c) => c.name)
            .join(" → ")}
          Distance: ${currentRouteOptions[1].totalDistance} ${
                  currentRouteOptions[1].unit
                }
          Time: ${Math.floor(currentRouteOptions[1].estimatedTime / 60)}h ${
                  currentRouteOptions[1].estimatedTime % 60
                }m
          `
              : "No route options available yet."
          }

          Available cities: ${cities.map((c) => c.name).join(", ")}
          
          User input: ${input}`,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(
      actionResponse.choices[0].message.content || "{}"
    );
    console.log("📦 Action Result:", result);

    // Handle new route or add cities
    if (
      (result.action === "new_route" || result.action === "add_cities") &&
      result.cities?.length
    ) {
      const matchedCities = result.cities
        .map((name: string) => cities.find((c) => c.name === name))
        .filter(Boolean);

      if (matchedCities.length > 0) {
        const allCities =
          result.action === "new_route"
            ? matchedCities
            : [...currentCities, ...matchedCities];

        if (allCities.length >= 2) {
          // Calculate routes using our business logic
          const routes = calculateRouteOptions(allCities, currentUnit);

          // Generate description for the calculated routes
          const routeDescriptionResponse = await openai.chat.completions.create(
            {
              model: MODEL,
              messages: [
                {
                  role: "system",
                  content: `You are a travel assistant. Create an engaging description of the route options.
                Return a JSON object with:
                - operationResponse: a friendly description that compares the routes and highlights their unique features.
                
                Focus on the differences between routes, such as:
                - Different cities and regions they pass through
                - Unique attractions and landmarks
                - Geographical features and landscapes
                - Travel experiences they offer
                
                End with a prompt for the user to select their preferred route.`,
                },
                {
                  role: "user",
                  content: `Route options:
                Option 1: ${routes[0].cities.map((c) => c.name).join(" → ")}
                Distance: ${routes[0].totalDistance} ${routes[0].unit}
                Time: ${Math.floor(routes[0].estimatedTime / 60)}h ${
                    routes[0].estimatedTime % 60
                  }m

                Option 2: ${routes[1].cities.map((c) => c.name).join(" → ")}
                Distance: ${routes[1].totalDistance} ${routes[1].unit}
                Time: ${Math.floor(routes[1].estimatedTime / 60)}h ${
                    routes[1].estimatedTime % 60
                  }m`,
                },
              ],
              temperature: 0.7,
              response_format: { type: "json_object" },
            }
          );

          const routeDescription = JSON.parse(
            routeDescriptionResponse.choices[0].message.content || "{}"
          );

          return {
            selectedCities: allCities,
            routeOptions: routes,
            operationResponse:
              routeDescription.operationResponse || result.operationResponse,
          };
        }
        return {
          selectedCities: allCities,
          operationResponse: result.operationResponse,
        };
      }
      return {
        error: `Could not find some cities: ${result.cities.join(
          ", "
        )}. Please use city names from our list.`,
      };
    }

    // Handle avoid cities
    if (result.action === "avoid_cities" && result.avoidCities?.length) {
      const citiesToAvoid = result.avoidCities
        .map((name: string) => cities.find((c) => c.name === name))
        .filter(Boolean);

      if (citiesToAvoid.length > 0) {
        if (currentCities.length >= 2) {
          // Filter out cities to avoid from current route
          const filteredCities = currentCities.filter(
            (city) =>
              !citiesToAvoid.some((avoidCity: City) => avoidCity.id === city.id)
          );

          if (filteredCities.length < 2) {
            return {
              error:
                "Cannot avoid these cities as it would leave less than 2 cities in the route. Please modify your request.",
            };
          }

          // Calculate new routes using our business logic
          const routes = calculateRouteOptions(
            filteredCities,
            currentUnit,
            citiesToAvoid
          );

          // Generate description for the recalculated routes
          const routeDescriptionResponse = await openai.chat.completions.create(
            {
              model: MODEL,
              messages: [
                {
                  role: "system",
                  content: `You are a travel assistant. Create an engaging description of the alternative routes that avoid the specified cities.
                Return a JSON object with:
                - operationResponse: a friendly description that explains how the routes have been adjusted and compares the new options.
                
                Focus on:
                - How the routes successfully avoid the specified cities
                - The alternative paths and cities chosen
                - Unique features of each new route
                
                End with a prompt for the user to select their preferred route.`,
                },
                {
                  role: "user",
                  content: `Avoiding cities: ${citiesToAvoid
                    .map((c: City) => c.name)
                    .join(", ")}

                New route options:
                Option 1: ${routes[0].cities.map((c) => c.name).join(" → ")}
                Distance: ${routes[0].totalDistance} ${routes[0].unit}
                Time: ${Math.floor(routes[0].estimatedTime / 60)}h ${
                    routes[0].estimatedTime % 60
                  }m

                Option 2: ${routes[1].cities.map((c) => c.name).join(" → ")}
                Distance: ${routes[1].totalDistance} ${routes[1].unit}
                Time: ${Math.floor(routes[1].estimatedTime / 60)}h ${
                    routes[1].estimatedTime % 60
                  }m`,
                },
              ],
              temperature: 0.7,
              response_format: { type: "json_object" },
            }
          );

          const routeDescription = JSON.parse(
            routeDescriptionResponse.choices[0].message.content || "{}"
          );

          return {
            selectedCities: filteredCities,
            routeOptions: routes,
            operationResponse:
              routeDescription.operationResponse || result.operationResponse,
          };
        }
        return {
          error:
            "Please set up a route first before specifying cities to avoid.",
        };
      }
      return {
        error: `Could not find some cities to avoid: ${result.avoidCities.join(
          ", "
        )}. Please use city names from our list.`,
      };
    }

    // Handle unit change
    if (result.action === "change_unit" && result.unit) {
      if (currentRouteOptions?.length) {
        const recalculatedRoutes = currentRouteOptions.map((route) => {
          return calculateRouteOptions(
            route.cities,
            result.unit as DistanceUnit
          )[0];
        });
        return {
          unit: result.unit as DistanceUnit,
          routeOptions: recalculatedRoutes,
          operationResponse: result.operationResponse,
        };
      }
      return {
        unit: result.unit as DistanceUnit,
        operationResponse: result.operationResponse,
      };
    }

    // Handle route selection
    if (
      result.action === "select_route" &&
      result.routeSelection &&
      currentRouteOptions?.length
    ) {
      const selectedRoute =
        currentRouteOptions[parseInt(result.routeSelection) - 1];
      if (selectedRoute) {
        // Generate detailed description for the selected route
        const detailedDescriptionResponse =
          await openai.chat.completions.create({
            model: MODEL,
            messages: [
              {
                role: "system",
                content: `You are a knowledgeable travel assistant. Create a detailed and engaging description of the selected route.
                IMPORTANT: You MUST follow this EXACT structure in your response:

                Return a JSON object with operationResponse containing ALL of these sections:
                1. Introduction
                2. Overview of total distance and time
                3. Detailed segment breakdown with distances and times
                4. Major landmarks and attractions for each segment
                5. Cultural highlights and local experiences
                6. Travel tips and recommendations
                7. Weather and best time to visit
                8. Food and accommodation suggestions

                Example response:
                {
                  "operationResponse": "Congratulations on selecting this exciting route! Let me tell you all about your upcoming journey.\\n\\n
                  Your journey from [Start City] to [End City] will take approximately [Total Time]. This route offers a perfect blend of urban exploration and natural wonders, taking you through diverse landscapes and vibrant cities.\\n\\n
                  
                  Detailed Segment Breakdown:\\n
                  1. [First City] to [Second City] ([Distance]): This [Duration] segment features [specific landmarks, road conditions, terrain].\\n
                  2. [Second City] to [Third City] ([Distance]): During this [Duration] stretch, you'll experience [specific details about the route].\\n
                  3. Final approach to [End City] ([Distance]): The last [Duration] of your journey showcases [unique features].\\n\\n
                  
                  Major Landmarks & Attractions:\\n
                  • [First City] Area: [2-3 specific attractions]\\n
                  • [Second City] Region: [2-3 specific attractions]\\n
                  • [End City] Arrival: [2-3 specific attractions]\\n\\n
                  
                  Cultural Highlights:\\n
                  • Regional cuisines to try\\n
                  • Local festivals or events\\n
                  • Historical significance\\n\\n
                  
                  Travel Tips:\\n
                  • Best time to travel: [specific seasons/months]\\n
                  • Recommended stops\\n
                  • Road conditions and considerations\\n
                  • Safety tips\\n\\n
                  
                  Weather Considerations:\\n
                  • Summer: [conditions]\\n
                  • Winter: [conditions]\\n
                  • Best months: [specific recommendations]\\n\\n
                  
                  Food & Accommodation:\\n
                  • Must-try local dishes\\n
                  • Recommended rest stops\\n
                  • Accommodation options\\n\\n
                  
                  Safe travels on your adventure through these amazing destinations!"
                }
                
                IMPORTANT: Replace all placeholder values in square brackets with actual data from the route.
                Make it informative and exciting, but ensure you include ALL sections from the example.
                Use proper paragraphs and formatting for readability.
                Your response must be more detailed than the example, not less.`,
              },
              {
                role: "user",
                content: `Current state:
                Selected route: Option ${result.routeSelection}
                Cities: ${selectedRoute.cities.map((c) => c.name).join(" → ")}
                Total Distance: ${selectedRoute.totalDistance} ${
                  selectedRoute.unit
                }
                Total Time: ${Math.floor(selectedRoute.estimatedTime / 60)}h ${
                  selectedRoute.estimatedTime % 60
                }m
                
                Leg distances: ${selectedRoute.distances
                  .map(
                    (distance, index) =>
                      `${selectedRoute.cities[index].name} to ${
                        selectedRoute.cities[index + 1].name
                      }: ${distance}${selectedRoute.unit}`
                  )
                  .join(", ")}
                  
                Additional details:
                - Starting city: ${selectedRoute.cities[0].name}
                - Ending city: ${
                  selectedRoute.cities[selectedRoute.cities.length - 1].name
                }
                - Number of stops: ${selectedRoute.cities.length - 2}
                - Average distance between cities: ${Math.round(
                  selectedRoute.totalDistance /
                    (selectedRoute.cities.length - 1)
                )} ${selectedRoute.unit}
                - Average time between cities: ${Math.round(
                  selectedRoute.estimatedTime /
                    (selectedRoute.cities.length - 1)
                )} minutes`,
              },
            ],
            temperature: 0.7,
            response_format: { type: "json_object" },
          });

        const detailedDescription = JSON.parse(
          detailedDescriptionResponse.choices[0].message.content || "{}"
        );

        return {
          selectedRoute,
          routeSelection: result.routeSelection,
          operationResponse:
            detailedDescription.operationResponse || result.operationResponse,
        };
      }
    }

    // If no valid action was determined
    return {
      error: "I couldn't understand your request. Please try rephrasing it.",
    };
  } catch (error: any) {
    console.error("❌ Error processing request:", {
      error,
      message: error.message,
      stack: error.stack,
    });
    return {
      error: "There was an error processing your request. Please try again.",
    };
  }
};

export const generateRouteDescription = async (
  route: Route,
  updates: RouteUpdate[] = []
): Promise<string> => {
  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `You are a friendly route planning assistant. Create a well-structured description of the travel route. 
IMPORTANT: Use "\\n\\n" for paragraph breaks and "\\n" for line breaks.

Structure your response exactly like this:

[Brief introduction]\\n\\n
Total Journey: [distance] and [time]\\n\\n
Key segments:\\n
• [City1] to [City2] ([distance]): [description]\\n
• [City2] to [City3] ([distance]): [description]\\n\\n
[Concluding remarks about the route]

Example:
Your journey from New York to Los Angeles takes you across the continent.\\n\\n
Total Journey: 2,789 miles and approximately 56 hours.\\n\\n
Key segments:\\n
• New York to Chicago (787 mi): Head west through Pennsylvania and Ohio\\n
• Chicago to Denver (1,003 mi): Cross the Great Plains through Iowa and Nebraska\\n
• Denver to Los Angeles (999 mi): Travel through the Rocky Mountains and Mojave Desert\\n\\n
This route offers a mix of urban landscapes and natural scenery, with major stops in populous cities.`,
        },
        {
          role: "user",
          content: `Route details:
Cities in order: ${route.cities
            .map((city) => `${city.name}, ${city.state}`)
            .join(" → ")}
Total distance: ${route.totalDistance} ${route.unit}
Estimated time: ${Math.floor(route.estimatedTime / 60)} hours ${
            route.estimatedTime % 60
          } minutes
Leg distances: ${route.distances
            .map(
              (d, i) =>
                `${route.cities[i].name} to ${route.cities[i + 1].name}: ${d}${
                  route.unit
                }`
            )
            .join(", ")}
${
  updates.length > 0
    ? `\nRoute updates: ${updates
        .map(
          (update) =>
            `${update.type} update - ${update.description} (Severity: ${
              update.impact.severity
            }${
              update.impact.additionalTime
                ? `, +${update.impact.additionalTime} minutes`
                : ""
            })`
        )
        .join("; ")}`
    : ""
}`,
        },
      ],
      temperature: 0.7,
      response_format: { type: "text" },
    });

    return (
      response.choices[0].message.content || "Route description not available."
    );
  } catch (error) {
    console.error("Error generating route description:", error);
    return "Route description not available.";
  }
};
