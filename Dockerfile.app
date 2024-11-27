FROM oven/bun:1.1.37-alpine
WORKDIR /src
COPY package* package.json package-lock.json bun.lockb tsconfig.json  ./
RUN bun install
COPY . .

EXPOSE 3000
CMD ["bun", "dev"]
