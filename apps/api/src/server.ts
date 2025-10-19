import 'reflect-metadata';
import { buildApplication } from ".";

const PORT = Number(process.env.PORT) || 3000;
const app = buildApplication()

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
})