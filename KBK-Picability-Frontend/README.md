# Frontend File and Directory Descriptions

---

# Main Frontend Files

| File | Purpose |
|---|---|
| `App.tsx` | Main React application component |
| `main.tsx` | Frontend application entry point |
| `index.html` | Base HTML template for the frontend |
| `vite.config.ts` | Vite development server and build configuration |
| `package.json` | Frontend dependencies and project scripts |

---

# Main Frontend Components

The `src/app/components/` directory contains reusable React components that make up the main user interface of the application.

| File | Purpose |
|---|---|
| `AuthScreen.tsx` | Handles login and authentication UI |
| `FriendList.tsx` | Displays and manages user friends |
| `HabitConfig.tsx` | Allows users to configure habit settings |
| `HabitSelector.tsx` | Allows users to select habits or streak activities |
| `RequestConfirmation.tsx` | Displays request confirmation messages |
| `StreakRequest.tsx` | Handles streak request functionality |
| `StreakTracker.tsx` | Displays and tracks streak progress |
| `UserSearch.tsx` | Allows users to search for other users |

---

# UI Component Library

The `src/app/components/ui/` folder contains reusable UI elements used throughout the frontend application. These components help maintain consistent styling and functionality across the interface.

## Included UI Components

- Buttons
- Cards
- Dialog boxes
- Navigation menus
- Tabs
- Tables
- Tooltips
- Forms
- Sidebars
- Alerts
- Sliders
- Calendars
- Dropdown menus

These reusable components improve:
- User experience consistency
- Frontend maintainability
- Component reusability
- Responsive design support

---

# Styles Directory

The `src/styles/` directory contains global styling files and theme configurations for the frontend application.

| File | Purpose |
|---|---|
| `fonts.css` | Font styling configuration |
| `index.css` | Global CSS styling |
| `tailwind.css` | Tailwind CSS configuration imports |
| `theme.css` | Application theme styling |

---

# Frontend Responsibilities

The frontend application is responsible for:

- Rendering the user interface
- Managing client-side interactions
- Handling user authentication screens
- Displaying streak and habit information
- Managing friend and streak request interfaces
- Communicating with backend APIs
- Providing responsive and interactive dashboard functionality

---

# Technologies Used in Frontend

- React
- TypeScript
- Tailwind CSS
- Vite
- Component-based UI architecture