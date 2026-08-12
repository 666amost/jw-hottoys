export default defineEventHandler((event) => createAuth(event).handler(toWebRequest(event)));
