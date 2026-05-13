# Backend File and Directory Descriptions

---

# Controllers

The `Controllers/` directory contains API controllers responsible for handling incoming HTTP requests and managing backend application functionality.

| File | Purpose |
|---|---|
| `AuthController.cs` | Handles user authentication and registration functionality |
| `FriendRequestsController.cs` | Manages sending and responding to friend requests |
| `FriendsController.cs` | Handles friend-related operations and relationships |
| `StreakRequestsController.cs` | Manages creation and handling of streak requests |
| `StreaksController.cs` | Handles streak tracking and streak management functionality |
| `UsersController.cs` | Provides user-related API operations |

---

# DTOs (Data Transfer Objects)

The `DTOs/` folder contains objects used to transfer structured data between the frontend and backend APIs.

| File | Purpose |
|---|---|
| `CompleteStreakDto.cs` | Stores data related to completing a streak |
| `CreateFriendRequestDto.cs` | Used when creating friend requests |
| `CreateStreakRequestDto.cs` | Used when creating streak requests |
| `LoginDto.cs` | Stores login request information |
| `RegisterDto.cs` | Stores user registration information |

---

# Data

| File | Purpose |
|---|---|
| `ApplicationDbContext.cs` | Main Entity Framework database context that connects application models to the database |

---

# Models

The `Models/` folder contains the database entity classes used throughout the application.

| File | Purpose |
|---|---|
| `ApplicationUser.cs` | Represents registered application users |
| `Friend.cs` | Represents friend relationships between users |
| `FriendRequest.cs` | Represents pending friend requests |
| `Streak.cs` | Represents streak tracking information |
| `StreakRequest.cs` | Represents streak request relationships |

---

# Migrations

The `Migrations/` folder contains Entity Framework migration files used to create and update the database schema.

| File | Purpose |
|---|---|
| `20260407221955_InitialCreate.cs` | Initial database schema migration |
| `20260421225526_AddStreakRequestAndStreakTables.cs` | Added streak request and streak-related database tables |
| `ApplicationDbContextModelSnapshot.cs` | Snapshot of the current database schema |

---

# Backend Configuration Files

| File | Purpose |
|---|---|
| `Program.cs` | Configures and launches the backend API application |
| `appsettings.json` | Stores backend application configuration settings |
| `appsettings.Development.json` | Development environment configuration settings |
| `launchSettings.json` | Defines local launch and debugging settings |
| `KBK - Picability.csproj` | Backend project configuration and dependencies |

---

# Backend Responsibilities

The backend is responsible for:

- User authentication and authorization
- Managing friend relationships
- Creating and tracking streaks
- Handling API requests and responses
- Database communication using Entity Framework Core
- Persisting application data
- Managing application business logic

---

# Technologies Used in Backend

- ASP.NET Core Web API
- Entity Framework Core
- C#
- SQL Database
- REST API Architecture