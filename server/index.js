import "dotenv/config";
import connectDB from "./config/db.js";
import app from "./app.js";
import logger from "./utils/logger.js";

const PORT = process.env.PORT || 3000;

connectDB().then(()=>{
  app.listen(PORT, ()=>{
    logger.info(`Server running on port ${PORT}`); 
  });
});