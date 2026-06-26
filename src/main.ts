import { App } from './App';

async function main() {
  const app = new App();
  await app.init();
}

main().catch(console.error);
