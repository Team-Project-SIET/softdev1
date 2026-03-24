import 'dotenv/config';
import { createApp } from './app';

const PORT = process.env.PORT || 3000;

const app = createApp();

app.listen(PORT, () => {
  console.log(`🚀 NongJames Laundry API running at http://localhost:${PORT}`);
  console.log(`📚 API Docs: http://localhost:${PORT}/docs`);
  console.log(`💡 Health check: GET /health`);
});
