# AI Route Planner

This project was created entirely using Cursor AI Composer, demonstrating the capabilities of AI-assisted development. No manual coding was required - all features were implemented through natural language conversations with the AI.

## About

AI Route Planner is an interactive web application that helps users plan routes between US cities. It uses OpenAI's GPT model to understand natural language inputs and provides intelligent route suggestions with detailed descriptions.

## Features

- Natural language input for route planning
- Multiple route options with different paths and stops
- Interactive map showing all available cities and route visualization
- Detailed route descriptions with key segments and estimated times
- Support for both miles and kilometers
- Ability to add intermediate stops to routes
- Route comparison with pros and cons
- Human-like responses and explanations
- Flexible command handling (no strict order required)

## Technologies

- React with TypeScript
- Material-UI for styling
- OpenStreetMap with Leaflet for mapping
- OpenAI GPT-4 for natural language processing

## Example Commands

- "I want to travel from New York City to Los Angeles"
- "Add Chicago to the route"
- "Show distances in kilometers"
- "Route should avoid Houston"
- "Choose the first route option"

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file with your OpenAI API key:
   ```
   REACT_APP_OPENAI_API_KEY=your_api_key_here
   ```
4. Start the development server: `npm start`

## Example Prompt to Create This Project

Here's a prompt you can use with Cursor AI Composer to create a similar project:

```
Create a React TypeScript application for route planning between US cities with these features:

Core Features:
- Natural language input processing using OpenAI GPT-4
- Support for multiple route options with calculated distances and times
- Detailed route descriptions with rich information about each segment
- Unit conversion between miles and kilometers
- Support for adding intermediate stops and avoiding cities
- Human-like responses with comprehensive route information

Route Planning Requirements:
1. Calculate routes using business logic (not OpenAI) for:
   - Distance calculations
   - Time estimates
   - Multiple route options
   - Alternative paths when avoiding cities

2. Use OpenAI GPT-4 for:
   - Natural language understanding
   - Generating detailed route descriptions including:
     * Segment-by-segment breakdown
     * Major landmarks and attractions
     * Cultural highlights and local experiences
     * Travel tips and recommendations
     * Weather considerations
     * Food and accommodation suggestions

3. User Interactions:
   - Allow natural language input for all commands
   - Support commands for:
     * Starting new routes
     * Selecting between route options
     * Adding cities to existing routes
     * Avoiding specific cities
     * Changing distance units
   - Provide clear feedback and confirmation messages

4. Route Information Display:
   - Show multiple route options with:
     * Total distance and time
     * City-by-city breakdown
     * Segment distances
     * Average distance/time between cities
   - Format all numbers and units appropriately
   - Include rich descriptions for selected routes

Technical Requirements:
1. Use TypeScript for type safety
2. Implement proper error handling for:
   - Invalid city names
   - Insufficient cities for route
   - API failures
   - Invalid route selections
3. Add comprehensive logging for:
   - OpenAI requests and responses
   - Route calculations
   - User interactions
4. Structure the code with:
   - Clear separation of business logic and API calls
   - Type definitions for all data structures
   - Service layer for OpenAI interactions
   - Utility functions for calculations
5. Include proper testing:
   - Mock OpenAI responses
   - Test route calculations
   - Validate user input handling

The application should provide a seamless experience where users can naturally express their route planning needs and receive detailed, informative responses with accurate route calculations and rich descriptions.
```

## Development Process

This project showcases how modern AI tools can assist in software development. Using Cursor AI Composer:

1. Initial project structure was created
2. Components were implemented one by one
3. Features were added through natural language requests
4. Bugs were fixed and improvements were made through conversation
5. Code was kept clean and well-typed throughout

## Note

This project serves as an example of AI-assisted development. While the AI handled the implementation details, the overall architecture and feature decisions were guided through natural language conversation.
