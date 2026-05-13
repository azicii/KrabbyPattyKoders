
# Krabby Patty Koders – Picability

## Project Description

Picability is a web application that enables users to monitor and build streak-based habits as well as social connections. The application allows users to create accounts, send friend requests, create streak requests, monitor habit progress, and manage daily streak activity through an interactive dashboard interface.
---

## Team Members

- Abdelaziz Hamza
- Jesse Beck
- Reece Clem
- Danielle Jackson

---

## Project Organization

The project is divided into two major sections:

### 1. KBK-Picability-Frontend
- Contains all frontend UI components, pages, styling, and client-side functionality.
- Built using:
  - React
  - TypeScript
  - Tailwind CSS
  - Vite

### 2. KBK-Picability-Backend
- Contains backend API controllers, database models, DTOs, migrations, and server configuration.
- Developed using:
  - ASP.NET Core Web API
  - Entity Framework Core

The solution file `KBK - Picability.sln` organizes and connects the backend project within Visual Studio.

---

# Folder Structure

```plaintext
KrabbyPattyKoders-main/
│
├── KBK - Picability.sln                    # Visual Studio solution file
│
├── KBK-Picability-Backend/                 # ASP.NET Core backend
│   ├── Controllers/                        # API endpoint controllers
│   ├── DTOs/                               # Data transfer objects
│   ├── Data/                               # Database context configuration
│   ├── Migrations/                         # Entity Framework migrations
│   ├── Models/                             # Database entity models
│   ├── Properties/                         # Launch settings
│   ├── Program.cs                          # Main backend application entry point
│   ├── appsettings.json                    # Backend configuration settings
│   └── KBK - Picability.csproj             # Backend project configuration
│
├── KBK-Picability-Frontend/                # React frontend application
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/                 # Main application components
│   │   │   └── App.tsx                     # Main frontend application component
│   │   ├── styles/                         # CSS and styling files
│   │   └── main.tsx                        # Frontend application entry point
│   │
│   ├── index.html                          # Frontend HTML template
│   ├── package.json                        # Frontend dependencies
│   └── vite.config.ts                      # Vite configuration
│
├── .gitignore                              # Git ignored files configuration
└── README.md                               # Project documentation
```

# Picability Setup Guide

## Prerequisites

Before starting, ensure you have the following installed on your machine:

1. Node.js (LTS Version)
2. .NET 8.0 SDK
3. Git (If using clone to download, otherwise just use the zip folder)

#### Quick Install (Windows)

If you are on Windows, you can install the necessary tools directly from your terminal using `winget`.

1. Node.js (LTS)

```powershell
winget install OpenJS.NodeJS.LTS

```
> *Note: This may require manually setting your PATH variable. See the Troubleshooting section below if 'npm' is not recognized after installation.*

2. .NET 8.0 SDK

```powershell
winget install Microsoft.DotNet.SDK.8

```
---
## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/azicii/KrabbyPattyKoders.git
cd KrabbyPattyKoders

```

### 2. Backend Setup

1. Navigate to the backend folder:
`cd KBK-Picability-Backend`
2. Restore dependencies:
`dotnet restore`
3. Run the server:
`dotnet run`

### 3. Frontend Setup

1. Open a new terminal and navigate to the frontend folder:
`cd KBK-Picability-Frontend`
2. Install dependencies:
`npm install`
3. Start the development server:
`npm run dev`
4. Open your browser to the URL provided in the terminal (usually http://localhost:5173).
---

## Troubleshooting Common Issues (Windows)

### If 'npm' or 'dotnet' is not recognized

If you installed Node.js or .NET and still see this error, the PATH environment variable was not updated automatically.

1. Press the Windows Key and search for "Edit the system environment variables".
2. Click Environment Variables.
3. Find Path in System Variables and click Edit.
4. Ensure `C:\Program Files\nodejs\` and `C:\Program Files\dotnet\` are listed. If not, click New and add them manually.
5. Restart your terminal and VS Code for changes to take effect.

### PowerShell Script Execution Error

If npm install or other scripts fail with a "Running scripts is disabled" error:

1. Open PowerShell as Administrator.
2. Run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
3. Type Y and press Enter.