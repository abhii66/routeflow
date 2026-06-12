import exp from "express";
import { config } from "dotenv";
import { connect } from "mongoose";
import cookieParser from "cookie-parser";
import cors from "cors";
import cron from "node-cron";
import riderApp from "./APIs/RiderAPI.js";
import userApp from "./APIs/UserAPI.js";
import orderApp from "./APIs/OrderAPI.js";
import storeApp from "./APIs/StoreAPI.js";
import { app, io, httpServer } from "./socket/io.js";
import { registerLocationHandlers } from "./socket/locationHandler.js";

config();
// const app = exp();
//body parser
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = ["http://localhost:5173"];

      // allow all vercel preview URLs
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app")
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);
app.use(exp.json());
//cookie parser
app.use(cookieParser())
app.use("/auth-api", userApp);
app.use("/orders-api", orderApp);
app.use("/riders-api", riderApp);
app.use('/store-api', storeApp)
const port = process.env.PORT;
//connect to db
// console.log("ENV:", process.env.MONGO_URI);
async function connectDB() {
  try {
    await connect(process.env.DB_URL);
    console.log("DB connection success.");

    //start server
    httpServer.listen(port, () => console.log(`server on port ${port}...`));
  } catch (err) {
    console.log("Error in DB connection :", err);
  }
}
connectDB();

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  registerLocationHandlers(io, socket);
  socket.on("disconnect", () =>
    console.log(`Socket disconnected: ${socket.id}`),
  );
});

//to handle invalid path
app.use((req, res, next) => {
  console.log(req.url);
  res.status(404).json({ message: `path ${req.url} is invalid` });
});

//scheduling
cron.schedule("0 0 * * *", async () => {
  console.log("Daily cron: maintenance tasks run");
});
