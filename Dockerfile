FROM node:20-bookworm-slim

WORKDIR /app

RUN corepack enable

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN pnpm config set store-dir /pnpm/store

COPY package.json pnpm-lock.yaml ./
RUN pnpm install

EXPOSE 3000

CMD ["pnpm", "dev", "--hostname", "0.0.0.0", "--port", "3000"]
