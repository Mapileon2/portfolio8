# System Patterns

**System Architecture:**

The system follows a client-server architecture:

*   **Client (Frontend):** The browser-based portfolio website, responsible for rendering the user interface and interacting with the backend API.
*   **Server (Backend):** A Node.js and Express API, responsible for serving data to the client.

**Key Technical Decisions:**

*   Using Node.js and Express for the backend: This allows for rapid development and easy deployment.
*   Using JSON files for data storage: This provides a simple and lightweight solution for storing the website's content.
*   Using JavaScript for frontend data fetching: This enables dynamic updates to the HTML without requiring page reloads.

**Design Patterns in Use:**

*   **RESTful API:** The backend API follows RESTful principles, using standard HTTP methods (GET, POST, PUT, DELETE) to interact with resources.
*   **MVC (Model-View-Controller):** While not strictly enforced, the backend code is organized in a way that separates data models, API controllers, and view templates (although the views are primarily handled by the frontend).

**Component Relationships:**

*   The frontend sends HTTP requests to the backend API to retrieve data.
*   The backend API processes the requests and returns JSON data.
*   The frontend receives the JSON data and updates the HTML accordingly.

**Critical Implementation Paths:**

*   Fetching project data from the `/projects` endpoint.
*   Rendering the project data in the projects section of the website.
*   Handling errors during API requests.
