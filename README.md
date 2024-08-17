# EcoPo Shop Backend

This is the backend server for the EcoPo Shop, an e-commerce platform. The server is built using Node.js and Express and connects to a MongoDB database to manage users, products, orders, and payments.

## Features

- **User Authentication**: JWT-based authentication with login and logout functionalities.
- **Product Management**: CRUD operations for products, with options to search and sort products.
- **Order and Payment Handling**: Basic endpoints to handle orders and payments.
- **Protected Routes**: Certain routes are protected and require a valid JWT token.

## Tech Stack

- **Node.js**: JavaScript runtime for server-side programming.
- **Express.js**: Web framework for Node.js.
- **MongoDB**: NoSQL database for storing user, product, order, and payment data.
- **JWT**: JSON Web Token for secure authentication.
- **CORS**: Middleware to enable Cross-Origin Resource Sharing.
- **dotenv**: For managing environment variables.

## Installation

   ```bash
   https://github.com/Sajjad-Hosan/EvoPo-Server.git
   ```
   ```bash
   cd EvoPo-Server
  ```
  ```bash
  npm install
  ```
  ```bash
  npm start
  ```

## Security
- JWT: Used for securing routes and user data.
- Cookie Security: Cookies are configured to be secure and use the httpOnly and sameSite attributes.