import { Router } from "express";
import userRoutes from "./user.routes";
import messageRoutes from "./message.routes";

const apiRoutes = Router();

apiRoutes.use("/users", userRoutes)
apiRoutes.use("/messages", messageRoutes)

export default apiRoutes;