// const express = require("express");
// const path = require("path");
// const cors = require("cors");
// const morgan = require("morgan");
// const helmet = require("helmet");

// const routes = require("./routes");
// const { connectDB } = require("./config/db");

// require("dotenv").config();

// // Intialize app
// const app = express();


// // CORS Options
// var corsOptions = {
//   origin: "*",
//   methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
//   preflightContinue: false,
//   optionsSuccessStatus: 204,
// };

// app.use(
//   "/public",
//   express.static(path.join(__dirname, "public"))
// );

// app.use(express.json());
// app.use(cors(corsOptions));
// app.use(morgan("dev"));
// app.use(helmet());
// app.use(express.urlencoded({ extended: true }));
// // Set the view engine to EJS
// app.set('view engine', 'ejs');
// // Set the views directory
// app.set('views', path.join(__dirname, 'views'));

// // Define routes
// app.get('/admin/home', (req, res) => {
//   res.render('admin/testing', { title: 'Home Page' });
// });

// // // Define routes
// // app.get('/admin/login', (req, res) => {
// //   res.render('admin/login', { title: 'Home Page' });
// // });


// const adminRenderRoute = require("./renderRoute/adminRenderRoute");
// const officeRenderRoute = require("./renderRoute/officeRenderRoute");

// app.use("/admin", adminRenderRoute)
// app.use("/office", officeRenderRoute)

// const PORT = process.env.PORT || 5000;

// // DB CONNECTION
// (async () => await connectDB())();

// app.get("/api", (req, res) => {
//     // console.log("Authorization", req.headers.authorization)
//   res.setHeader("Content-Type", "application/json");
//   res.json(["Server is live"]);
// });

// routes.map((route) => {
//   app.use(route.path, route.handler);
// });


// app.listen(PORT, () => {
//     console.log(`⚙ Server running on port ${PORT}`);
//   });

const express = require("express");
const path = require("path");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");

const routes = require("./routes");
const { connectDB } = require("./config/db");

require("dotenv").config();

// Intialize app
const app = express();

//CORS Options
var corsOptions = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

app.use(
  "/public",
  express.static(path.join(__dirname, "public"))
);

app.use(express.json());
app.use(cors(corsOptions));
app.use(morgan("dev"));
app.use(helmet());
app.use(express.urlencoded({ extended: true }));
// Set the view engine to EJS
app.set('view engine', 'ejs');
// Set the views directory
app.set('views', path.join(__dirname, 'views'));

// Define routes
app.get('/admin/home', (req, res) => {
  res.render('admin/testing', { title: 'Home Page' });
});

// // Define routes
// app.get('/admin/login', (req, res) => {
//   res.render('admin/login', { title: 'Home Page' });
// });


const adminRenderRoute = require("./renderRoute/adminRenderRoute");
const officeRenderRoute = require("./renderRoute/officeRenderRoute");

app.use("/admin", adminRenderRoute)
app.use("/office", officeRenderRoute)

const PORT = process.env.PORT || 5000;

// DB CONNECTION
(async () => await connectDB())();

app.get("/api", (req, res) => {
    // console.log("Authorization", req.headers.authorization)
  res.setHeader("Content-Type", "application/json");
  res.json(["Server is live"]);
});

routes.map((route) => {
  app.use(route.path, route.handler);
});


app.listen(PORT,'0.0.0.0' ,() => {
    console.log(`⚙ Server running on port ${PORT}`);
  });