const dotenv = require('dotenv');  // Load environment variables from a .env file
dotenv.config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');

// Connect to MongoDB using the connection URI from environment variables
mongoose.connect(process.env.MONGODB_URI);

// mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

mongoose.connection.on('connected', () => {
  console.log(`Connected to MongoDB ${mongoose.connection.name}.`);
});

app.use(express.json());  // Middleware to parse JSON requests
app.use(cors());  // Enable Cross-Origin Resource Sharing

// Import routers for different route groups
const testJWTRouter = require('./controllers/test-jwt');
const usersRouter = require('./controllers/users');
const profilesRouter = require('./controllers/profiles');
const teamsRouter = require('./controllers/teams');

// Define routes for each module
app.use('/test-jwt', testJWTRouter);
app.use('/users', usersRouter);       // User management routes
app.use('/profiles', profilesRouter); // Profiles management routes
app.use('/teams', teamsRouter);       // Teams management routes

// Start the server on a dynamic port or default to 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
